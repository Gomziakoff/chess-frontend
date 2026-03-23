<template>
  <div class="error-container">
    <div class="glass-panel error-card">
      <div class="visual-area">
        <!-- Анимированные фигуры -->
        <div class="floating-piece p-1">♟</div>
        <div class="floating-piece p-2">♞</div>
        <div class="floating-piece p-3">g2g4</div>
        
        <h1 class="error-code">{{ code }}</h1>
      </div>

      <div class="text-area">
        <h2 class="error-title">{{ title }}</h2>
        <p class="error-message">{{ message }}</p>
        
        <router-link to="/" class="glass-button home-btn">
          Вернуться на главную
        </router-link>
      </div>
    </div>

    <!-- Декоративная доска на фоне -->
    <div class="bg-board"></div>
  </div>
</template>

<script setup lang="ts">
interface Props {
  code?: string | number
  title?: string
  message?: string
}

withDefaults(defineProps<Props>(), {
  code: '404',
  title: 'Невозможный ход',
  message: 'Похоже, эта клетка пуста или ход нарушает правила. Страница не найдена.'
})
</script>

<style scoped>
.error-container {
  min-height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 20px;
  position: relative;
  overflow: hidden;
}

.error-card {
  width: 100%;
  max-width: 500px;
  padding: 40px;
  text-align: center;
  z-index: 2;
  border-radius: 30px;
  animation: slideUp 0.6s ease-out;
}

.visual-area {
  position: relative;
  margin-bottom: 20px;
}

.error-code {
  font-size: 8rem;
  font-weight: 900;
  margin: 0;
  background: linear-gradient(to bottom, #fff, rgba(255,255,255,0.2));
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  line-height: 1;
}

.error-title {
  font-size: 1.8rem;
  margin-bottom: 15px;
  color: #fff;
}

.error-message {
  color: rgba(255, 255, 255, 0.6);
  margin-bottom: 30px;
  line-height: 1.6;
}

/* Стили стеклянной панели */
.glass-panel {
  background: rgba(255, 255, 255, 0.05);
  backdrop-filter: blur(15px);
  border: 1px solid rgba(255, 255, 255, 0.1);
  box-shadow: 0 25px 50px rgba(0,0,0,0.3);
}

/* Кнопка в стиле вашего проекта */
.glass-button {
  display: inline-block;
  padding: 12px 30px;
  background: rgba(255, 255, 255, 0.1);
  border: 1px solid rgba(255, 255, 255, 0.2);
  border-radius: 12px;
  color: white;
  text-decoration: none;
  font-weight: bold;
  transition: all 0.3s ease;
}

.glass-button:hover {
  background: rgba(255, 255, 255, 0.2);
  transform: translateY(-2px);
}

/* Анимация летающих фигур */
.floating-piece {
  position: absolute;
  font-size: 3rem;
  opacity: 0.2;
  filter: blur(1px);
}

.p-1 { top: -20px; left: 20%; animation: float 6s infinite ease-in-out; }
.p-2 { bottom: 0; right: 10%; animation: float 8s infinite ease-in-out reverse; }
.p-3 { top: 40%; left: -30px; animation: float 7s infinite ease-in-out 1s; font-size: 2rem; }

@keyframes float {
  0%, 100% { transform: translateY(0) rotate(0deg); }
  50% { transform: translateY(-20px) rotate(10deg); }
}

@keyframes slideUp {
  from { opacity: 0; transform: translateY(30px); }
  to { opacity: 1; transform: translateY(0); }
}

/* Фоновая декоративная доска */
.bg-board {
  position: absolute;
  top: 50%;
  left: 50%;
  width: 120vh;
  height: 120vh;
  background-image: 
    linear-gradient(45deg, rgba(255,255,255,0.02) 25%, transparent 25%),
    linear-gradient(-45deg, rgba(255,255,255,0.02) 25%, transparent 25%),
    linear-gradient(45deg, transparent 75%, rgba(255,255,255,0.02) 75%),
    linear-gradient(-45deg, transparent 75%, rgba(255,255,255,0.02) 75%);
  background-size: 100px 100px;
  transform: translate(-50%, -50%) rotate(15deg);
  z-index: 1;
  pointer-events: none;
}
</style>