<template>
  <div class="support-page">
    <div class="container">
      
      <!-- Карточка автора -->
      <div class="author-card">
        <div class="avatar-area">
          <div class="chess-icon">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
              <path d="M12 2L10 7H14L12 2Z" fill="currentColor"/>
              <path d="M7 22H17L16 11H8L7 22Z" stroke-linecap="round" stroke-linejoin="round"/>
              <path d="M9 7H15" stroke-linecap="round"/>
            </svg>
          </div>
        </div>

        <h1 class="title">Поддержать проект</h1>
        <p class="subtitle">Привет! Меня зовут Алексей, и это мой дипломный проект.</p>

        <div class="story-section">
          <p>
            Этот шахматный сайт начинался как учебная работа, но вырос в большой проект. 
            Я верю, что шахматы должны быть доступными и удобными для каждого.
          </p>
          <div class="needs-list">
            <div class="need-item">
              <span class="icon">🌐</span>
              <span>Продление домена и серверов</span>
            </div>
            <div class="need-item">
              <span class="icon">🍕</span>
              <span>«На покушать» автору во время кодинга</span>
            </div>
            <div class="need-item">
              <span class="icon">🚀</span>
              <span>Разработка новых функций и режимов</span>
            </div>
          </div>
        </div>

        <!-- Блок с реквизитами -->
        <div class="payment-box">
          <div class="card-info">
            <span class="label">Перевод на карту</span>
            <div class="number-row">
              <span class="card-number">{{ cardNumber }}</span>
              <button class="copy-btn" @click="copyCard" :class="{ copied: copied }">
                {{ copied ? 'Скопировано!' : 'Копировать' }}
              </button>
            </div>
            
          </div>
        </div>

        <!-- Футер с соцсетями -->
        <div class="author-footer">
          <p>Хотите предложить идею или сообщить о проблеме?</p>
          <div class="social-links">
            <a href="https://t.me/oleshe4" target="_blank" class="link">Telegram</a>
            <a href="https://vk.com/oleksiikoita" target="_blank" class="link">ВКонтакте</a>
          </div>
        </div>

      </div>

    </div>
  </div>
</template>

<script setup>
import { ref } from 'vue'

const cardNumber = ref('9112 3801 7297 9504') // Твой номер карты
const copied = ref(false)

const copyCard = () => {
  navigator.clipboard.writeText(cardNumber.value.replace(/\s/g, ''))
  copied.value = true
  setTimeout(() => (copied.value = false), 2000)
}
</script>

<style scoped>
/* Основные стили */
.support-page {
  --primary: #f59e0b; /* Золотой/янтарный */
  --card-bg: #1a1c23;
  --text-main: #ffffff;
  --text-dim: #9ca3af;
  
  min-height: 100vh;
  background-color: var(--bg);
  color: var(--text-main);
  font-family: 'Inter', -apple-system, sans-serif;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 20px;
}

.container {
  width: 100%;
  max-width: 600px;
}

/* Карточка */
.author-card {
  background: var(--card-bg);
  border: 1px solid rgba(255, 255, 255, 0.05);
  border-radius: 40px;
  padding: 50px 40px;
  text-align: center;
  box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.5);
}

/* Иконка */
.avatar-area {
  margin-bottom: 30px;
}
.chess-icon {
  width: 80px;
  height: 80px;
  
  border: 2px solid var(--primary);
  border-radius: 24px;
  display: flex;
  align-items: center;
  justify-content: center;
  margin: 0 auto;
  color: var(--primary);
}

/* Текст */
.title {
  font-size: 2.5rem;
  font-weight: 800;
  margin-bottom: 10px;
  letter-spacing: -1px;
}
.subtitle {
  color: var(--primary);
  font-weight: 600;
  margin-bottom: 30px;
}
.story-section {
  color: var(--text-dim);
  line-height: 1.6;
  font-size: 1.05rem;
  margin-bottom: 40px;
}

/* Список нужд */
.needs-list {
  display: inline-block;
  text-align: left;
  margin-top: 25px;
  background: rgba(255, 255, 255, 0.03);
  padding: 20px;
  border-radius: 20px;
}
.need-item {
  display: flex;
  align-items: center;
  gap: 12px;
  margin-bottom: 10px;
  font-size: 0.95rem;
  color: #ddd;
}
.need-item:last-child { margin-bottom: 0; }

/* Блок оплаты */
.payment-box {
  background: #000;
  border-radius: 28px;
  padding: 30px;
  margin-bottom: 35px;
  border: 1px dashed rgba(245, 158, 11, 0.3);
}
.label {
  display: block;
  font-size: 0.75rem;
  text-transform: uppercase;
  letter-spacing: 2px;
  color: var(--text-dim);
  margin-bottom: 15px;
}
.number-row {
  display: flex;
  flex-direction: column;
  gap: 15px;
  align-items: center;
}
.card-number {
  font-family: 'Monaco', 'Consolas', monospace;
  font-size: 1.6rem;
  letter-spacing: 2px;
  color: var(--primary);
}
.copy-btn {
  background: var(--primary);
  color: #000;
  border: none;
  padding: 12px 24px;
  border-radius: 14px;
  font-weight: 700;
  cursor: pointer;
  transition: all 0.2s;
  width: 100%;
}
.copy-btn:hover { transform: scale(1.02); background: #fbbf24; }
.copy-btn.copied { background: #10b981; color: white; }

.bank-name {
  margin-top: 15px;
  font-size: 0.85rem;
  color: var(--text-dim);
}

/* Футер */
.author-footer p {
  font-size: 0.9rem;
  color: var(--text-dim);
  margin-bottom: 15px;
}
.social-links {
  display: flex;
  justify-content: center;
  gap: 20px;
}
.link {
  color: var(--text-main);
  text-decoration: none;
  font-weight: 600;
  font-size: 0.9rem;
  border-bottom: 1px solid var(--primary);
  padding-bottom: 2px;
}
.link:hover { color: var(--primary); }

/* Адаптивность */
@media (max-width: 480px) {
  .author-card { padding: 30px 20px; }
  .title { font-size: 1.8rem; }
  .card-number { font-size: 1.2rem; }
}
</style>