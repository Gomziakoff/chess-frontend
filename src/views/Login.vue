<script setup lang="ts">
import { ref, computed } from 'vue'
import { useAuthStore } from '../stores/auth'
import { useRouter } from 'vue-router'

const auth = useAuthStore()
const router = useRouter()

const mode = ref('login')

const login = ref('')
const email = ref('')
const password = ref('')
const agreeRules = ref(false)
const agreeFairPlay = ref(false)

const canRegister = computed(() =>
  login.value &&
  email.value &&
  password.value &&
  agreeRules.value &&
  agreeFairPlay.value
)

const submit = async () => {
  if (mode.value === 'login') {
    await auth.login(email.value, password.value)
    router.push('/')
  } else {
    await auth.register(login.value, email.value, password.value)
    router.push('/')
  }

}
</script>

<template>
  <div class="auth-container">
    <div class="auth-box">

      <!-- Tabs -->
      <div class="tabs">
        <div class="tab" :class="{ active: mode === 'login' }" @click="mode = 'login'">
          Вход
        </div>

        <div class="tab" :class="{ active: mode === 'register' }" @click="mode = 'register'">
          Регистрация
        </div>
      </div>

      <!-- Form -->
      <form class="form" @submit.prevent="submit">

        <!-- LOGIN -->
        <template v-if="mode === 'login'">

          <label class="label">Электронная почта</label>
          <input v-model="email" class="input" type="email" />

          <label class="label">Пароль</label>
          <input v-model="password" class="input" type="password" />

        </template>

        <!-- REGISTER -->
        <template v-else>

          <label class="label">Логин</label>
          <input v-model="login" class="input" type="text" />

          <label class="label">Электронная почта</label>
          <input v-model="email" class="input" type="email" />

          <label class="label">Пароль</label>
          <input v-model="password" class="input" type="password" />

          <!-- Checkboxes -->
          <div class="checkbox-group">

            <label class="checkbox">
              <input type="checkbox" v-model="agreeRules" />
              <span>Я принимаю правила сервиса</span>
            </label>

            <label class="checkbox">
              <input type="checkbox" v-model="agreeFairPlay" />
              <span>Я обязуюсь соблюдать честную игру</span>
            </label>

          </div>

        </template>

        <button class="button" :disabled="mode === 'register' && !canRegister">
          {{ mode === 'login' ? 'ВОЙТИ' : 'ЗАРЕГИСТРИРОВАТЬСЯ' }}
        </button>

      </form>

      <div class="divider"></div>

      <div class="forgot" v-if="mode === 'login'">
        Забыли пароль?
      </div>

    </div>
  </div>
</template>

<style scoped>
/* Контейнер теперь имеет небольшой паддинг, чтобы форма не прилипала к краям экрана */
.auth-container {
  min-height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 20px;
  box-sizing: border-box;
}

.auth-box {
  width: 100%;
  max-width: 420px; /* Ограничиваем ширину на десктопе */
  padding: 40px 32px;
  box-sizing: border-box;
}

.tabs {
  display: flex;
  gap: 40px;
  margin-bottom: 30px;
  justify-content: space-around;
}

.tab {
  font-family: 'Alumni Sans', sans-serif;
  font-weight: 600;
  font-size: 3.75rem; /* 60px */
  line-height: 100%;
  color: rgba(255, 255, 255, 0.4);
  cursor: pointer;
  position: relative;
  display: inline-block;
  white-space: nowrap;
  transition: color 0.2s, font-size 0.2s;
}

.tab.active {
  color: white;
}

.tab.active::after {
  content: "";
  position: absolute;
  bottom: -8px;
  left: 0;
  width: 100%;
  height: 2px;
  background: white;
}

.form {
  display: flex;
  flex-direction: column;
}

.label {
  font-family: 'Alumni Sans', sans-serif;
  font-weight: 400;
  font-size: 24px;
  line-height: 100%;
  color: white;
  margin-bottom: 0.3rem;
  margin-top: 1rem;
}

.input {
  height: 42px;
  border-radius: 8px;
  border: 1px solid rgba(255, 255, 255, 0.4);
  background: transparent;
  color: white;
  padding: 0 12px;
  font-size: 16px; /* Предотвращает зум на iOS при фокусе */
}

.input:focus {
  outline: none;
  border-color: white;
}

.button {
  margin-top: 24px;
  height: 48px;
  border-radius: 10px;
  border: none;
  background: #d9d9d9;
  font-size: 20px;
  font-weight: 700;
  cursor: pointer;
  transition: background 0.2s;
}

.button:hover:not(:disabled) {
  background: white;
}

.button:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.checkbox-group {
  margin-top: 16px;
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.checkbox {
  display: flex;
  align-items: flex-start; /* Чтобы текст не центрировался, если он в 2 строки */
  gap: 10px;
  font-size: 14px;
  color: rgba(255, 255, 255, 0.8);
  cursor: pointer;
  line-height: 1.2;
}

.checkbox input {
  width: 18px;
  height: 18px;
  flex-shrink: 0; /* Чтобы чекбокс не сплющивался */
  margin-top: -2px;
}

.divider {
  margin-top: 24px;
  height: 1px;
  background: rgba(255, 255, 255, 0.3);
}

.forgot {
  margin-top: 16px;
  text-align: center;
  font-size: 14px;
  color: rgba(255, 255, 255, 0.7);
  cursor: pointer;
}

.forgot:hover {
  color: white;
}

/* === АДАПТИВНОСТЬ === */

@media (max-width: 480px) {
  .auth-box {
    padding: 20px 16px; /* Уменьшаем внутренние отступы */
  }

  .tabs {
    gap: 20px;
    margin-bottom: 20px;
  }

  .tab {
    font-size: 2.5rem; /* Уменьшаем шрифт заголовков, чтобы "Регистрация" влезла */
  }

  .label {
    font-size: 20px;
  }

  .button {
    height: 54px; /* На мобилках кнопки лучше делать чуть крупнее для удобства нажатия */
    font-size: 18px;
  }

  .checkbox {
    font-size: 13px; /* Немного уменьшаем шрифт условий */
  }
}

/* Для совсем маленьких экранов (iPhone 5/SE или Fold) */
@media (max-width: 360px) {
  .tab {
    font-size: 2rem;
  }
  
  .tabs {
    gap: 10px;
  }
}
</style>