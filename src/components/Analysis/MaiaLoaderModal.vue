<template>
  <Teleport to="body">
    <div v-if="isVisible" class="modal-overlay">
      <div class="maia-modal">
        <div class="modal-header">
          <span class="icon">🤖</span>
          <h2>Модель Maia Chess</h2>
        </div>

        <div class="modal-body">
          <!-- Состояние: Нужно скачать -->
          <div v-if="status === 'no-cache'" class="state-content">
            <p>Для продвинутого анализа (предсказание ходов человека) необходимо загрузить веса нейросети Maia (~90 МБ).</p>
            <button class="primary-btn" @click="$emit('download')">
              Загрузить и начать
            </button>
            <button class="secondary-btn" @click="$emit('close')">
              Продолжить без Maia
            </button>
          </div>

          <!-- Состояние: Загрузка -->
          <div v-else-if="status === 'downloading'" class="state-content">
            <p>Загрузка нейросети... {{ progress }}%</p>
            <div class="progress-container">
              <div class="progress-fill" :style="{ width: progress + '%' }"></div>
            </div>
            <p class="hint">Это делается один раз, модель сохранится в браузере.</p>
          </div>

          <!-- Состояние: Ошибка -->
          <div v-else-if="status === 'error'" class="state-content">
            <p class="error-text">Ошибка при загрузке модели</p>
            <button class="primary-btn" @click="$emit('download')">
              Попробовать снова
            </button>
            <button class="secondary-btn" @click="$emit('close')">
              Закрыть
            </button>
          </div>

          <!-- Состояние: Инициализация (loading) -->
          <div v-else class="state-content">
            <div class="spinner"></div>
            <p>Проверка кэша модели...</p>
          </div>
        </div>
      </div>
    </div>
  </Teleport>
</template>

<script setup lang="ts">
import { computed } from 'vue';

const props = defineProps<{
  status: string;
  progress: number;
}>();

defineEmits(['download', 'close']);

// Показываем модалку только если статус не 'ready'
const isVisible = computed(() => props.status !== 'ready' && props.status !== 'idle');
</script>

<style scoped>
.modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  width: 100vw;
  height: 100vh;
  background: rgba(0, 0, 0, 0.8);
  display: flex;
  justify-content: center;
  align-items: center;
  z-index: 9999;
  backdrop-filter: blur(4px);
}

.maia-modal {
  background: #262421;
  border: 1px solid #333;
  border-radius: 8px;
  width: 90%;
  max-width: 400px;
  padding: 24px;
  box-shadow: 0 20px 50px rgba(0,0,0,0.5);
  color: #bababa;
}

.modal-header {
  display: flex;
  align-items: center;
  gap: 12px;
  margin-bottom: 20px;
}

.modal-header h2 {
  margin: 0;
  font-size: 1.25rem;
  color: #fff;
}

.icon { font-size: 24px; }

.state-content {
  display: flex;
  flex-direction: column;
  gap: 16px;
  text-align: center;
}

.progress-container {
  height: 8px;
  background: #333;
  border-radius: 4px;
  overflow: hidden;
}

.progress-fill {
  height: 100%;
  background: #4a6fa5;
  transition: width 0.3s ease;
}

button {
  padding: 10px 20px;
  border-radius: 4px;
  font-weight: bold;
  cursor: pointer;
  border: none;
  transition: all 0.2s;
}

.primary-btn {
  background: #4a6fa5;
  color: white;
}
.primary-btn:hover { background: #5d82b8; }

.secondary-btn {
  background: transparent;
  color: #888;
}
.secondary-btn:hover { color: #fff; }

.error-text { color: #ff5555; }
.hint { font-size: 0.85rem; color: #666; }

.spinner {
  width: 30px;
  height: 30px;
  border: 3px solid #333;
  border-top-color: #4a6fa5;
  border-radius: 50%;
  animation: spin 1s linear infinite;
  margin: 0 auto;
}

@keyframes spin { to { transform: rotate(360deg); } }
</style>