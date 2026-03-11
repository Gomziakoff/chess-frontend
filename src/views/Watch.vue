<template>
  <div class="modal-overlay">
    <div class="modal glass-panel">
      <!-- HEADER -->
      <div class="modal-header">
        <h2 class="modal-title">Начать игру</h2>
        <button class="glass-button close-btn" @click="$emit('close')">✕</button>
      </div>

      <!-- MODE SWITCH -->
      <div class="mode-switch">
        <button
          class="glass-button"
          :class="{ active: mode === 'online' }"
          @click="mode = 'online'"
        >
          Онлайн
        </button>
        <button
          class="glass-button"
          :class="{ active: mode === 'bot' }"
          @click="mode = 'bot'"
        >
          С ботом
        </button>
      </div>

      <!-- ONLINE SETTINGS -->
      <div v-if="mode === 'online'" class="section">
  <div class="preset-grid">
    <button
      v-for="preset in presets"
      :key="preset.label"
      class="glass-button preset-card"
      :class="{
        active: activePreset === preset.label,
        disabled: isSearching && activePreset !== preset.label
      }"
      :disabled="isSearching && activePreset !== preset.label"
      @click="selectPreset(preset)"
    >
      <template v-if="activePreset === preset.label">
        <span class="spinner"></span>
      </template>

      <template v-else>
        {{ preset.label }}<br />
        {{ preset.mode }}
      </template>
    </button>
  </div>
</div>

      <!-- BOT SETTINGS -->
      <div v-else class="section">
        <!-- Time -->
        <div class="control">
          <label>Время на партию: {{ time }} мин</label>
          <input
            type="range"
            min="1"
            max="60"
            v-model="time"
            class="glass-range"
          />
        </div>

        <!-- Increment -->
        <div class="control">
          <label>Добавление: {{ increment }} сек</label>
          <input
            type="range"
            min="0"
            max="30"
            v-model="increment"
            class="glass-range"
          />
        </div>

        <!-- Difficulty -->
        <div class="control">
          <label>Сложность бота</label>
          <select v-model="difficulty" class="glass-select">
            <option value="easy">Лёгкий</option>
            <option value="medium">Средний</option>
            <option value="hard">Сложный</option>
          </select>
        </div>

        <!-- Color -->
        <div class="color-select">
          <div
            class="glass-button color-piece"
            :class="{ active: color === 'white' }"
            @click="color = 'white'"
          >
            ♙
          </div>
          <div
            class="glass-button color-piece black"
            :class="{ active: color === 'black' }"
            @click="color = 'black'"
          >
            ♟
          </div>
        </div>
      </div>

      <!-- FOOTER -->
      <div class="footer">
        <button v-if="mode === 'bot'" class="glass-button start-btn" @click="startGame">
          Начать игру
        </button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { onMounted, onUnmounted, ref } from 'vue'
import { useRouter } from 'vue-router'
import { useSocketStore } from '../stores/socket'
import { useAuthStore } from '../stores/auth'

const router = useRouter()
const auth = useAuthStore()
const socketStore = useSocketStore()

type Mode = "online" | "bot"
const mode = ref<Mode>("online")

const isSearching = ref(false)
const activePreset = ref<string | null>(null)

// ONLINE
const presets = [
  { label: "1 + 0", time: 1, increment: 0, mode:"Пуля" },
  { label: "2 + 1", time: 2, increment: 1, mode:"Пуля" },
  { label: "3 + 0", time: 3, increment: 0, mode:"Блиц" },
  { label: "3 + 2", time: 3, increment: 2, mode:"Блиц" },
  { label: "5 + 0", time: 5, increment: 0, mode:"Блиц" },
  { label: "5 + 3", time: 5, increment: 3, mode:"Блиц" },
  { label: "10 + 0", time: 10, increment: 0, mode:"Рапид" },
  { label: "10 + 5", time: 10, increment: 5, mode:"Рапид" },
  { label: "15 + 10", time: 15, increment: 10, mode:"Рапид" },
  { label: "30 + 0", time: 30, increment: 0, mode:"Классика" },
  { label: "30 + 20", time: 30, increment: 20, mode:"Классика" },
  { label: "60 + 0", time: 60, increment: 0, mode:"Классика" },
]

// BOT
const time = ref(10)
const increment = ref(0)
const difficulty = ref("medium")
const color = ref<"white" | "black">("white")

function selectPreset(preset: any) {
  // Нажали на активную кнопку → отмена
  if (activePreset.value === preset.label) {
    socketStore.send({ t: 'stop-seek' })
    activePreset.value = null
    isSearching.value = false
    return
  }

  // Уже ищем другой режим — игнорируем
  if (isSearching.value) return

  // Запуск поиска
  socketStore.send({
    t: 'seek',
    d: {
      initialTime: preset.time * 60,
      increment: preset.increment
    }
  })

  activePreset.value = preset.label
  isSearching.value = true
}

const onRedirect = (payload: any) => {
  const gameId = Number(payload?.gameId)
  if (!gameId) return

  isSearching.value = false
  activePreset.value = null

  socketStore.disconnect()
  router.push(`/game/${gameId}`)
}

const onSeekStopped = () => {
  isSearching.value = false
  activePreset.value = null
}

function startGame() {
  if (mode.value === "online") {
    // ничего не делаем, поиск уже идёт через пресеты
  } else {
    console.log("Start BOT game", {
      time: time.value,
      increment: increment.value,
      difficulty: difficulty.value,
      color: color.value,
    })
    // здесь будет запуск игры с ботом
  }
}

onMounted(() => {
  if (auth.isAuthenticated) {
    socketStore.connect('lobby')
    socketStore.setLobbyCallback('redirect', onRedirect)
    socketStore.setLobbyCallback('seek_stopped', onSeekStopped)

    socketStore.setLobbyCallback('error', () => {
      isSearching.value = false
      activePreset.value = null
    })
  }
})

onUnmounted(() => {
  socketStore.removeLobbyCallback('redirect', onRedirect)
  socketStore.removeLobbyCallback('seek_stopped', onSeekStopped)
  socketStore.disconnect()
})
</script>

<style scoped>
/* Оверлей (затемнение) */
.modal-overlay {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.6);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
  font-family: system-ui, Avenir, Helvetica, Arial, sans-serif;
  color: rgba(255, 255, 255, 0.87);
}

/* Основное модальное окно в стиле glass */
.glass-panel {
  background: rgba(255, 255, 255, 0.1);
  backdrop-filter: blur(10px);
  -webkit-backdrop-filter: blur(10px);
  border: 1px solid rgba(255, 255, 255, 0.15);
  border-radius: 20px;
  box-shadow: 0 8px 32px 0 rgba(0, 0, 0, 0.4);
  color: white;
}

.modal {
  width: 500px;
  max-width: 90vw;
  padding: 24px;
}

/* Шапка */
.modal-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 1.5rem;
}

.modal-title {
  font-size: 2rem;
  font-weight: 800;
  margin: 0;
  letter-spacing: -0.5px;
  text-shadow: 0 2px 10px rgba(0, 0, 0, 0.3);
  line-height: 1.2;
}

.close-btn {
  width: 40px;
  height: 40px;
  padding: 0;
  font-size: 1.2rem;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
}

/* Кнопки в стиле glass (общий класс) */
.glass-button {
  background: rgba(255, 255, 255, 0.1);
  backdrop-filter: blur(10px);
  -webkit-backdrop-filter: blur(10px);
  border: 1px solid rgba(255, 255, 255, 0.15);
  border-radius: 20px;
  color: white;
  cursor: pointer;
  transition: all 0.3s ease;
  box-shadow: 0 8px 32px 0 rgba(0, 0, 0, 0.4);
  text-decoration: none;
  outline: none;
  font-family: inherit;
  font-size: 1rem;
  padding: 10px 20px;
}

.glass-button:hover {
  background: rgba(255, 255, 255, 0.2);
  border: 1px solid rgba(255, 255, 255, 0.3);
  transform: translateY(-2px);
  box-shadow: 0 15px 40px 0 rgba(0, 0, 0, 0.5);
}

.glass-button.active {
  background: rgba(255, 255, 255, 0.25);
  border-color: rgba(255, 255, 255, 0.5);
  transform: scale(1.02);
}

/* Переключатель режимов */
.mode-switch {
  display: flex;
  gap: 10px;
  margin: 20px 0;
}

.mode-switch .glass-button {
  flex: 1;
  padding: 12px;
}

/* Сетка пресетов */
.preset-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 12px;
  margin-top: 20px;
}

.preset-card {
  padding: 20px;
  font-weight: bold;
  text-align: center;
}

.preset-card.disabled {
  opacity: 0.4;
  pointer-events: none;
  transform: none !important;
}

.spinner {
  width: 20px;
  height: 20px;
  border: 3px solid rgba(255,255,255,0.3);
  border-top: 3px solid white;
  border-radius: 50%;
  animation: spin 0.8s linear infinite;
  display: inline-block;
}

@keyframes spin {
  to { transform: rotate(360deg); }
}

/* Элементы управления для бота */
.control {
  margin-bottom: 24px;
}

.control label {
  display: block;
  margin-bottom: 8px;
  font-weight: 300;
  opacity: 0.9;
  text-shadow: 0 2px 8px rgba(0, 0, 0, 0.25);
}

.glass-range {
  width: 100%;
  height: 6px;
  border-radius: 3px;
  background: rgba(255, 255, 255, 0.2);
  outline: none;
}

.glass-range::-webkit-slider-thumb {
  -webkit-appearance: none;
  width: 20px;
  height: 20px;
  border-radius: 50%;
  background: white;
  box-shadow: 0 2px 10px rgba(0, 0, 0, 0.3);
  cursor: pointer;
  border: 1px solid rgba(255, 255, 255, 0.5);
}

.glass-range::-moz-range-thumb {
  width: 20px;
  height: 20px;
  border-radius: 50%;
  background: white;
  box-shadow: 0 2px 10px rgba(0, 0, 0, 0.3);
  cursor: pointer;
  border: 1px solid rgba(255, 255, 255, 0.5);
}

/* Выпадающий список */
.glass-select {
  background: rgba(255, 255, 255, 0.1);
  backdrop-filter: blur(10px);
  -webkit-backdrop-filter: blur(10px);
  border: 1px solid rgba(255, 255, 255, 0.15);
  border-radius: 10px;
  color: white;
  padding: 10px 15px;
  width: 100%;
  font-family: inherit;
  font-size: 1rem;
  cursor: pointer;
  outline: none;
}

.glass-select option {
  background: #2C1B48;
  color: white;
}

/* Выбор цвета фигур */
.color-select {
  display: flex;
  justify-content: center;
  gap: 30px;
  margin-top: 30px;
}

.color-piece {
  width: 80px;
  height: 80px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 3rem;
  padding: 0;
  transition: all 0.3s ease;
}

.color-piece.black {
  color: #000;
  text-shadow: 0 2px 5px rgba(255, 255, 255, 0.3);
}

.color-piece.active {
  background: rgba(255, 255, 255, 0.25);
  border-color: rgba(255, 255, 255, 0.5);
  transform: scale(1.1);
  box-shadow: 0 0 20px rgba(255, 255, 255, 0.3);
}

/* Футер и кнопка старта */
.footer {
  margin-top: 30px;
  text-align: center;
}

.start-btn {
  padding: 14px 32px;
  font-size: 1.2rem;
  font-weight: bold;
  letter-spacing: 0.5px;
  min-width: 200px;
}

/* Адаптивность */
@media (max-width: 768px) {
  .modal {
    padding: 20px;
  }

  .modal-title {
    font-size: 1.8rem;
  }

  .preset-card {
    padding: 15px;
  }

  .color-piece {
    width: 70px;
    height: 70px;
    font-size: 2.5rem;
  }
}

@media (max-width: 480px) {
  .preset-grid {
    grid-template-columns: repeat(2, 1fr);
  }

  .mode-switch {
    flex-direction: column;
  }

  .color-piece {
    width: 60px;
    height: 60px;
    font-size: 2rem;
  }

  .start-btn {
    min-width: 160px;
    padding: 12px 24px;
  }
}
</style>