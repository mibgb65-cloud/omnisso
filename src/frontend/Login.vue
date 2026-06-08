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

:global(body) {
  margin: 0;
  min-width: 320px;
  color: #071733;
  background:
    linear-gradient(180deg, rgba(214, 230, 253, 0.96) 0%, rgba(242, 247, 255, 0.88) 42%, rgba(255, 255, 255, 0.62) 100%),
    radial-gradient(circle at 14% 94%, rgba(213, 243, 204, 0.92) 0, rgba(213, 243, 204, 0) 36%),
    radial-gradient(circle at 50% 82%, rgba(255, 242, 190, 0.78) 0, rgba(255, 242, 190, 0) 31%),
    radial-gradient(circle at 78% 94%, rgba(250, 203, 218, 0.78) 0, rgba(250, 203, 218, 0) 38%),
    #d7e8ff;
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
  background:
    radial-gradient(circle at 50% 52%, rgba(255, 255, 255, 0.52) 0, rgba(255, 255, 255, 0) 26%),
    linear-gradient(135deg, rgba(195, 218, 250, 0.5), rgba(255, 255, 255, 0.15) 48%, rgba(248, 215, 225, 0.34));
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
  color: #ffffff;
  background: #071733;
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
  border: 1px solid rgba(119, 137, 165, 0.45);
  border-radius: 8px;
  color: #071733;
  background: rgba(255, 255, 255, 0.7);
  font: inherit;
  outline: none;
  backdrop-filter: blur(8px);
}

input:focus {
  border-color: #24416f;
  box-shadow: 0 0 0 3px rgba(36, 65, 111, 0.14);
}

.error {
  margin: 0;
  padding: 10px 12px;
  border: 1px solid #fecaca;
  border-radius: 8px;
  color: #991b1b;
  background: #fef2f2;
  font-size: 14px;
  line-height: 1.45;
}

button {
  height: 48px;
  border: 0;
  border-radius: 8px;
  color: #ffffff;
  background:
    linear-gradient(105deg, #071733 0%, #224f9c 36%, #6f65c8 68%, #d65d91 100%);
  font: inherit;
  font-weight: 600;
  cursor: pointer;
  box-shadow: 0 12px 28px rgba(34, 79, 156, 0.22);
  transition:
    box-shadow 160ms ease,
    filter 160ms ease,
    transform 160ms ease;
}

button:hover:not(:disabled) {
  filter: saturate(1.08) brightness(1.04);
  transform: translateY(-1px);
  box-shadow: 0 16px 34px rgba(34, 79, 156, 0.28);
}

button:disabled {
  cursor: not-allowed;
  opacity: 0.55;
  background: #8d8e96;
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
