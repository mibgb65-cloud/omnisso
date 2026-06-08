<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'

const email = ref('admin@test.com')
const password = ref('admin')
const loading = ref(false)
const errorMessage = ref('')
const redirectUri = ref('')
const state = ref('')
const clientId = ref('')
const nonce = ref('')

const canSubmit = computed(() => {
  return email.value.trim() !== '' && password.value !== '' && !loading.value
})

onMounted(() => {
  const params = new URLSearchParams(window.location.search)
  redirectUri.value = params.get('redirect_uri') || ''
  state.value = params.get('state') || ''
  clientId.value = params.get('client_id') || ''
  nonce.value = params.get('nonce') || ''

  if (!redirectUri.value) {
    errorMessage.value = '缺少 redirect_uri'
  }
})

async function login() {
  if (!canSubmit.value || !redirectUri.value) {
    return
  }

  loading.value = true
  errorMessage.value = ''

  try {
    const response = await fetch('/api/login', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        email: email.value.trim(),
        password: password.value,
        client_id: clientId.value,
        nonce: nonce.value
      })
    })

    const data = await response.json()
    if (!response.ok) {
      throw new Error(data.error_description || '登录失败')
    }

    const query = new URLSearchParams()
    query.set('code', data.code)
    if (state.value) {
      query.set('state', state.value)
    }

    const separator = redirectUri.value.includes('?') ? '&' : '?'
    window.location.href = `${redirectUri.value}${separator}${query.toString()}`
  } catch (error) {
    errorMessage.value = error instanceof Error ? error.message : '登录失败'
  } finally {
    loading.value = false
  }
}
</script>

<template>
  <main class="page">
    <form class="login-panel" @submit.prevent="login">
      <div class="brand-mark" aria-hidden="true">O</div>
      <h1>登录 OmniSSO</h1>

      <label>
        <span>邮箱</span>
        <input
          v-model="email"
          type="email"
          name="email"
          autocomplete="email"
          placeholder="admin@test.com"
          required
        />
      </label>

      <label>
        <span>密码</span>
        <input
          v-model="password"
          type="password"
          name="password"
          autocomplete="current-password"
          placeholder="邮箱前缀，如 admin"
          required
        />
      </label>

      <p v-if="errorMessage" class="error" role="alert">{{ errorMessage }}</p>

      <button type="submit" :disabled="!canSubmit || !redirectUri">
        {{ loading ? '登录中...' : '登录' }}
      </button>
    </form>
  </main>
</template>

<style scoped>
:global(*) {
  box-sizing: border-box;
}

:global(:root) {
  color-scheme: light;
  --text: #071733;
  --body-bg:
    linear-gradient(180deg, rgba(214, 230, 253, 0.96) 0%, rgba(242, 247, 255, 0.88) 42%, rgba(255, 255, 255, 0.62) 100%),
    radial-gradient(circle at 14% 94%, rgba(213, 243, 204, 0.92) 0, rgba(213, 243, 204, 0) 36%),
    radial-gradient(circle at 50% 82%, rgba(255, 242, 190, 0.78) 0, rgba(255, 242, 190, 0) 31%),
    radial-gradient(circle at 78% 94%, rgba(250, 203, 218, 0.78) 0, rgba(250, 203, 218, 0) 38%),
    #d7e8ff;
  --page-bg:
    radial-gradient(circle at 50% 52%, rgba(255, 255, 255, 0.52) 0, rgba(255, 255, 255, 0) 26%),
    linear-gradient(135deg, rgba(195, 218, 250, 0.5), rgba(255, 255, 255, 0.15) 48%, rgba(248, 215, 225, 0.34));
  --brand-bg: #071733;
  --field-bg: rgba(255, 255, 255, 0.7);
  --field-border: rgba(119, 137, 165, 0.45);
  --field-focus: #24416f;
  --field-focus-shadow: rgba(36, 65, 111, 0.14);
  --brand-text: #ffffff;
  --error-text: #991b1b;
  --error-bg: #fef2f2;
  --error-border: #fecaca;
  --button-bg: linear-gradient(105deg, #071733 0%, #224f9c 36%, #6f65c8 68%, #d65d91 100%);
  --button-shadow: rgba(34, 79, 156, 0.22);
  --button-hover-shadow: rgba(34, 79, 156, 0.28);
  --button-disabled-bg: #8d8e96;
}

@media (prefers-color-scheme: dark) {
  :global(:root) {
    color-scheme: dark;
    --text: #eef5ff;
    --body-bg:
      linear-gradient(180deg, rgba(7, 17, 39, 0.98) 0%, rgba(11, 23, 50, 0.96) 46%, rgba(18, 22, 40, 0.98) 100%),
      radial-gradient(circle at 14% 92%, rgba(57, 133, 96, 0.42) 0, rgba(57, 133, 96, 0) 35%),
      radial-gradient(circle at 50% 82%, rgba(180, 126, 55, 0.28) 0, rgba(180, 126, 55, 0) 32%),
      radial-gradient(circle at 82% 92%, rgba(150, 71, 119, 0.36) 0, rgba(150, 71, 119, 0) 38%),
      #071127;
    --page-bg:
      radial-gradient(circle at 50% 52%, rgba(108, 132, 180, 0.18) 0, rgba(108, 132, 180, 0) 28%),
      linear-gradient(135deg, rgba(42, 72, 126, 0.34), rgba(9, 19, 43, 0.18) 50%, rgba(112, 51, 88, 0.24));
    --brand-bg: #f8fbff;
    --field-bg: rgba(9, 18, 39, 0.64);
    --field-border: rgba(158, 179, 216, 0.32);
    --field-focus: #8eb7ff;
    --field-focus-shadow: rgba(142, 183, 255, 0.18);
    --brand-text: #071127;
    --error-text: #fecaca;
    --error-bg: rgba(127, 29, 29, 0.44);
    --error-border: rgba(248, 113, 113, 0.36);
    --button-bg: linear-gradient(105deg, #76a9ff 0%, #7b7cf2 36%, #c06ee5 68%, #ff7baa 100%);
    --button-shadow: rgba(118, 169, 255, 0.22);
    --button-hover-shadow: rgba(192, 110, 229, 0.34);
    --button-disabled-bg: #50596a;
  }
}

:global(body) {
  margin: 0;
  min-width: 320px;
  color: var(--text);
  background: var(--body-bg);
  font-family:
    Inter, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI",
    sans-serif;
  letter-spacing: 0;
}

.page {
  min-height: 100vh;
  display: grid;
  place-items: center;
  padding: 32px 20px;
  background: var(--page-bg);
}

.login-panel {
  width: min(100%, 384px);
  display: grid;
  gap: 18px;
}

.brand-mark {
  width: 42px;
  height: 42px;
  display: grid;
  place-items: center;
  justify-self: center;
  color: var(--brand-text);
  background: var(--brand-bg);
  border-radius: 8px;
  font-size: 20px;
  font-weight: 700;
}

h1 {
  margin: 0 0 10px;
  text-align: center;
  font-size: 28px;
  font-weight: 600;
  line-height: 1.2;
}

label {
  display: grid;
  gap: 8px;
  font-size: 14px;
  font-weight: 500;
}

input {
  width: 100%;
  height: 48px;
  padding: 0 14px;
  border: 1px solid var(--field-border);
  border-radius: 8px;
  color: var(--text);
  background: var(--field-bg);
  font: inherit;
  outline: none;
  backdrop-filter: blur(8px);
}

input:focus {
  border-color: var(--field-focus);
  box-shadow: 0 0 0 3px var(--field-focus-shadow);
}

.error {
  margin: 0;
  padding: 10px 12px;
  border: 1px solid var(--error-border);
  border-radius: 8px;
  color: var(--error-text);
  background: var(--error-bg);
  font-size: 14px;
  line-height: 1.45;
}

button {
  height: 48px;
  border: 0;
  border-radius: 8px;
  color: #ffffff;
  background: var(--button-bg);
  font: inherit;
  font-weight: 600;
  cursor: pointer;
  box-shadow: 0 12px 28px var(--button-shadow);
  transition:
    box-shadow 160ms ease,
    filter 160ms ease,
    transform 160ms ease;
}

button:hover:not(:disabled) {
  filter: saturate(1.08) brightness(1.04);
  transform: translateY(-1px);
  box-shadow: 0 16px 34px var(--button-hover-shadow);
}

button:disabled {
  cursor: not-allowed;
  opacity: 0.55;
  background: var(--button-disabled-bg);
  box-shadow: none;
}

@media (max-width: 480px) {
  .page {
    align-items: start;
    padding-top: 64px;
  }

  h1 {
    font-size: 24px;
  }
}
</style>
