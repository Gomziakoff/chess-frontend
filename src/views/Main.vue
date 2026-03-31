<template>
  <div class="container">
    <!-- Верхняя часть: название и подзаголовок -->
    <div class="title-section">
      <h1 class="title">BlackPawnChess</h1>
      <span class="subtitle">Шахматная платформа для игры и обучения</span>
    </div>

    <!-- Нижняя часть: кнопки 2x3 -->
    <div class="buttons-section">
      <button @click="openGameModal" class="glass-button">
        <span class="icon">♟️</span>
        <span class="label">ИГРА</span>
      </button>
      <router-link to="/analysis" class="glass-button">
        <span class="icon">🔍</span>
        <span class="label">АНАЛИЗ</span>
      </router-link>
      <router-link to="/tournaments" class="glass-button ribbon-container">
        <!-- Лента -->
        <div class="ribbon">В РАЗРАБОТКЕ</div>

        <span class="icon">👥</span>
        <span class="label">ТУРНИРЫ</span>
      </router-link>
      <router-link to="/openings" class="glass-button ribbon-container">
        <div class="ribbon">В РАЗРАБОТКЕ</div>
        <span class="icon">📘</span>
        <span class="label">ДЕБЮТЫ</span>
      </router-link>
      <router-link to="/puzzles" class="glass-button">
        <span class="icon">🧩</span>
        <span class="label">ЗАДАЧИ</span>
      </router-link>
      <router-link to="/bot" class="glass-button">
        <span class="icon">🤖</span>
        <span class="label">БОТ/НЕ БОТ</span>
      </router-link>
    </div>
    <StartGameModal v-if="showModal" @close="showModal = false" />
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import StartGameModal from '../components/StartGameModal.vue';

const showModal = ref(false)

function openGameModal() {
  showModal.value = true
}
</script>

<style scoped>
.container {
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  min-height: 100vh;
  width: 100%;
  padding: 2rem;
  box-sizing: border-box;
  font-family: system-ui, Avenir, Helvetica, Arial, sans-serif;
  color: rgba(255, 255, 255, 0.87);
  /* Фон убираем, так как он задан глобально */
}

.title-section {
  display: flex;
  flex-direction: column;
  align-items: center;
  color: white;
  margin-bottom: 4rem;
  text-align: center;
}

.title {
  font-size: 8rem;
  font-weight: 800;
  margin: 0;
  letter-spacing: -0.5px;
  text-shadow: 0 2px 10px rgba(0, 0, 0, 0.3);
  line-height: 1.2;
}

.subtitle {
  font-size: 1.2rem;
  opacity: 0.9;
  margin-top: 0.75rem;
  font-weight: 300;
  text-shadow: 0 2px 8px rgba(0, 0, 0, 0.25);
}

.buttons-section {
  display: grid;
  grid-template-columns: repeat(3, 140px);
  gap: 1.5rem;
  justify-content: center;
}

/* Убираем подчеркивание и стандартные стили ссылок */
.glass-button {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  width: 140px;
  height: 140px;
  padding: 0;
  background: rgba(255, 255, 255, 0.1);
  /* Чуть прозрачнее для лучшего сочетания с темным фоном */
  backdrop-filter: blur(10px);
  -webkit-backdrop-filter: blur(10px);
  border: 1px solid rgba(255, 255, 255, 0.15);
  border-radius: 20px;
  color: white;
  cursor: pointer;
  transition: all 0.3s ease;
  box-shadow: 0 8px 32px 0 rgba(0, 0, 0, 0.4);
  flex-shrink: 0;
  flex-grow: 0;

  /* Убираем стандартные стили ссылок */
  text-decoration: none;
  outline: none;
}

/* Убираем стандартные стили для посещенных ссылок */
.glass-button:visited {
  color: white;
  text-decoration: none;
}

/* Убираем стандартные стили для активных ссылок */
.glass-button:active {
  color: white;
  text-decoration: none;
}

.glass-button:hover {
  background: rgba(255, 255, 255, 0.2);
  border: 1px solid rgba(255, 255, 255, 0.3);
  transform: translateY(-5px);
  box-shadow: 0 15px 40px 0 rgba(0, 0, 0, 0.5);
  text-decoration: none;
}

/* Убираем подчеркивание для всех состояний */
.glass-button:link,
.glass-button:visited,
.glass-button:hover,
.glass-button:active,
.glass-button:focus {
  text-decoration: none;
}

.icon {
  font-size: 2.5rem;
  margin-bottom: 0.5rem;
  filter: drop-shadow(0 4px 6px rgba(0, 0, 0, 0.3));
  display: inline-block;
  line-height: 1;
}

.label {
  font-size: 0.9rem;
  font-weight: 600;
  letter-spacing: 0.5px;
  text-align: center;
  text-shadow: 0 2px 4px rgba(0, 0, 0, 0.3);
  white-space: nowrap;
  max-width: 100%;
  overflow: hidden;
  text-overflow: ellipsis;
}

/* Адаптивность для планшетов */
@media (max-width: 768px) {
  .title {
    font-size: 3rem;
  }

  .subtitle {
    font-size: 1rem;
  }

  .buttons-section {
    grid-template-columns: repeat(3, 120px);
    gap: 1rem;
  }

  .glass-button {
    width: 120px;
    height: 120px;
  }

  .icon {
    font-size: 2rem;
  }

  .label {
    font-size: 0.8rem;
  }
}

/* Адаптивность для мобильных устройств */
@media (max-width: 480px) {
  .title {
    font-size: 2.2rem;
  }

  .subtitle {
    font-size: 0.9rem;
    max-width: 280px;
  }

  .buttons-section {
    grid-template-columns: repeat(3, 90px);
    gap: 0.75rem;
  }

  .glass-button {
    width: 90px;
    height: 90px;
    border-radius: 15px;
  }

  .icon {
    font-size: 1.5rem;
    margin-bottom: 0.25rem;
  }

  .label {
    font-size: 0.65rem;
    white-space: normal;
    line-height: 1.2;
    max-width: 80px;
  }
}

/* Для очень маленьких экранов */
@media (max-width: 360px) {
  .buttons-section {
    grid-template-columns: repeat(3, 80px);
    gap: 0.5rem;
  }

  .glass-button {
    width: 80px;
    height: 80px;
  }

  .label {
    font-size: 0.55rem;
  }
}

/* Дополнительный класс для фокуса с клавиатуры (для доступности) */
.glass-button:focus-visible {
  outline: 2px solid white;
  outline-offset: 2px;
}

.ribbon-container {
  position: relative;
  overflow: hidden;
  /* Обрезает вылетающую ленту */
}

/* Сама лента */
.ribbon {
  position: absolute;
  top: 18px;
  right: -32px;
  width: 130px;
  background: rgba(255, 174, 0, 0.8);
  /* Золотисто-оранжевый в стиле glass */
  color: #000;
  font-size: 0.65rem;
  font-weight: 800;
  text-align: center;
  padding: 4px 0;
  transform: rotate(45deg);
  /* Поворот ленты */
  box-shadow: 0 2px 10px rgba(0, 0, 0, 0.3);
  letter-spacing: 0.5px;
  z-index: 1;
  pointer-events: none;
  /* Чтобы лента не мешала клику */
  backdrop-filter: blur(5px);
  border: 1px solid rgba(255, 255, 255, 0.2);
}

/* Адаптация ленты под маленькие мобильные экраны */
@media (max-width: 480px) {
  .ribbon {
    top: 10px;
    right: -35px;
    font-size: 0.5rem;
    width: 110px;
  }
}

/* Делаем кнопку турниров визуально "выключенной" (опционально) */
.ribbon-container {
  opacity: 0.9;
  cursor: default;
}

.ribbon-container:hover {
  /* Если хотите, чтобы она не двигалась при наведении, пока в разработке: */
  /* transform: none; */
}
</style>