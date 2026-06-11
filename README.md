# OmniSSO

OmniSSO 是一个极简 OIDC Identity Provider，目标是部署到 Cloudflare Workers，作为 OpenAI Workspace Custom OIDC SSO 登录中心。

它沿用 quick-sso 的登录体验和 OIDC 流程，但针对 Cloudflare 做了这些调整：

- 后端从 Go/Gin 改为 Cloudflare Worker，因为 Workers 不能直接运行 Gin 单体二进制。
- 授权码使用 Durable Objects 存储，避免普通内存或 KV 在边缘节点之间的一致性问题。
- RSA 私钥通过 `OIDC_PRIVATE_JWK` secret 注入，JWKS 接口只暴露公钥参数。
- Vue 3 前端由 Vite 构建到 `dist/ui`，再通过 Workers Static Assets 发布。

## 目录

```text
.
├── README.md
├── package.json
├── wrangler.jsonc
├── vite.config.ts
├── tsconfig.worker.json
├── index.html
├── scripts
│   └── generate-private-jwk.mjs
└── src
    ├── frontend
    │   ├── Login.vue
    │   ├── main.ts
    │   └── vite-env.d.ts
    └── worker
        └── index.ts
```

## 登录规则

密码等于邮箱 `@` 前面的前缀：

```text
admin@test.com / admin
user@example.com / user
```

## 本地开发

安装依赖：

```powershell
npm install
```

生成 RSA 私钥 JWK：

```powershell
npm run generate:key
```

把输出复制到 `.dev.vars`：

```text
OIDC_CLIENT_ID=openai-workspace
OIDC_CLIENT_SECRET=dev-secret-change-me
OIDC_REDIRECT_URI=
OIDC_PRIVATE_JWK={上一步输出的整行 JSON}
```

启动本地 Worker：

```powershell
npm run dev
```

本地测试入口：

```text
http://localhost:8787/authorize?client_id=openai-workspace&redirect_uri=https%3A%2F%2Fexample.com%2Fcallback&state=test&response_type=code
```

## 部署到 Cloudflare

这个仓库的 `wrangler.jsonc` 只保留可共享的 Worker 配置，不提交任何人的域名、OpenAI callback 或密钥。每个部署者都需要在自己的 Cloudflare 项目里配置下面这些值。

| 名称 | 类型 | 必填 | 说明 |
| --- | --- | --- | --- |
| `OIDC_CLIENT_SECRET` | Secret | 是 | OpenAI OIDC 配置里填写的 Client Secret，建议使用强随机字符串。 |
| `OIDC_PRIVATE_JWK` | Secret | 是 | `npm run generate:key` 输出的整行 RSA private JWK JSON。 |
| `OIDC_CLIENT_ID` | Variable | 否 | 默认是 `openai-workspace`，如果 OpenAI 里用了其他 Client ID 就设置它。 |
| `OIDC_REDIRECT_URI` | Variable | 建议 | OpenAI 给出的 callback/redirect URI。为空时不会限制 redirect URI，生产环境建议设置。 |
| `ISSUER` | Variable | 否 | 默认使用当前请求 origin；自定义域名和最终访问域名不一致时再设置。 |

登录 Cloudflare：

```powershell
npx wrangler login
```

设置 OpenAI client secret。这个值后续也要填到 OpenAI Workspace 的 Client Secret：

```powershell
npx wrangler secret put OIDC_CLIENT_SECRET
```

生成并设置 RSA 私钥：

```powershell
npm run generate:key
npx wrangler secret put OIDC_PRIVATE_JWK
```

部署：

```powershell
npm run deploy
```

普通变量建议通过 Cloudflare Dashboard 设置：

```text
Workers & Pages -> 你的 Worker -> Settings -> Variables and Secrets
```

如果是通过 GitHub 连接 Cloudflare Workers Builds 部署，需要在第一次构建前就在导入项目的配置页或 Worker 的 Settings 里添加上面的 Secrets 和 Variables。`OIDC_CLIENT_SECRET` 和 `OIDC_PRIVATE_JWK` 必须用 Secret，不要写进 Git。

配置中保留了 `keep_vars: true`，避免后续 `wrangler deploy` 清空 Dashboard 中维护的变量。仓库没有声明 `secrets.required`，这样新账号首次部署不会因为还没设置 Secret 而直接失败；但实际 OIDC 登录仍然必须配置 `OIDC_CLIENT_SECRET` 和 `OIDC_PRIVATE_JWK`，否则 `/token` 或 `/.well-known/jwks.json` 会返回配置错误。

## OpenAI OIDC 配置

假设部署域名是：

```text
https://sso.example.com
```

OpenAI Workspace Custom OIDC 中填写：

```text
Issuer: https://sso.example.com
Authorization URL: https://sso.example.com/authorize
Token URL: https://sso.example.com/token
JWKS URL: https://sso.example.com/.well-known/jwks.json
Client ID: openai-workspace
Client Secret: 你通过 wrangler secret put OIDC_CLIENT_SECRET 设置的值
```

## 接口

```text
GET  /.well-known/openid-configuration
GET  /.well-known/jwks.json
GET  /authorize
POST /token
POST /api/login
GET  /ui/
```

## 注意

`OIDC_PRIVATE_JWK` 需要长期保持稳定。更换它会导致 JWKS 公钥变化，旧的 ID Token 将无法通过验签。

ID Token 会包含 OpenAI 要求的基础 claims：

```text
sub
email
given_name
family_name
```

`given_name` 和 `family_name` 会在每次登录时从内置词库中随机组合生成；`sub` 和 `email` 保持稳定，用于识别真实用户。
