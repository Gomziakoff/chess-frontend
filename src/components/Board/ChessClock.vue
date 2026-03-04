<template>
  <div
    class="clock-container"
    :class="{ active: isActive, danger: clockValue <= dangerThreshold }"
  >
    <div class="player-name">
      {{ playerSymbol }} {{ playerName }}
    </div>
    <div class="time-display">
      {{ minutes }}:{{ secondsPadded }}<span v-if="showTenths">.{{ tenths }}</span>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch, onMounted, onUnmounted } from 'vue'
import { useGameStore } from '../../stores/game'

interface Props {
  color: 'white' | 'black'
}
const props = defineProps<Props>()
const gameStore = useGameStore()

// Текущее серверное время в мс
const baseTime = ref(0)
// Момент последнего обновления для отсчета тика
const referenceTime = ref(Date.now())
let interval: number | null = null
const tickInterval = 50 // обновление каждые 50 мс

// Активные часы (ход этого цвета)
const isActive = computed(() => {
  if (!gameStore.clock || !gameStore.liveFen) return false
  return (
    gameStore.liveFen.split(' ')[1] === (props.color === 'white' ? 'w' : 'b') &&
    gameStore.clock.running
  )
})

// Текущее отображаемое время
const clockValue = computed(() => Math.max(baseTime.value, 0))

// Таймер в минуты, секунды и десятые
const minutes = computed(() => Math.floor(clockValue.value / 60000))
const seconds = computed(() => Math.floor(clockValue.value / 1000) % 60)
const secondsPadded = computed(() => ('00' + seconds.value).slice(-2))
const tenths = computed(() => Math.floor((clockValue.value % 1000) / 100))
const showTenths = computed(() => minutes.value < 1 && seconds.value <= 20)

const playerSymbol = computed(() => (props.color === 'white' ? '○' : '●'))
const playerName = computed(() => {
  if (!gameStore.whitePlayer || !gameStore.blackPlayer) return ''
  return props.color === 'white'
    ? gameStore.whitePlayer.username
    : gameStore.blackPlayer.username
})

// Красный фон при опасном времени
const dangerThreshold = 10000 // 10 секунд

// Функция запуска интервала для плавного тика
const startInterval = () => {
  if (interval !== null) clearInterval(interval)
  interval = window.setInterval(() => {
    if (isActive.value) {
      const now = Date.now()
      const elapsed = now - referenceTime.value
      referenceTime.value = now
      baseTime.value = Math.max(baseTime.value - elapsed, 0)
    }
  }, tickInterval)
}

// Следим за активностью — перезапуск интервала
watch(isActive, (active) => {
  if (active) {
    referenceTime.value = Date.now()
    startInterval()
  } else if (interval !== null) {
    clearInterval(interval)
    interval = null
  }
})

// Синхронизация с сервером
watch(
  () => gameStore.clock && { white: gameStore.clock.white, black: gameStore.clock.black },
  (newClock) => {
    if (!newClock) return
    const serverTime = props.color === 'white' ? newClock.white * 1000 : newClock.black * 1000
    if (serverTime !== baseTime.value) {
      baseTime.value = serverTime
      referenceTime.value = Date.now()
    }
  },
  { deep: true, immediate: true }
)

onMounted(() => {
  if (isActive.value) startInterval()
})

onUnmounted(() => {
  if (interval !== null) clearInterval(interval)
})
</script>

<style scoped>
.clock-container {
  display: flex;
  flex-direction: row;
  align-items: center;
  justify-content: space-between;
  padding: 4px 8px;
  border-radius: 6px;
  background: rgba(44, 44, 44, 0.8);
  color: white;
  font-weight: bold;
  opacity: 0.5;
  transition: opacity 0.2s, background 0.2s;
}

.clock-container.active {
  opacity: 1;
}

.clock-container.danger {
  background: #d53a3a;
}

.player-name {
  margin-right: 12px;
}

.time-display {
  font-size: 1.5rem;
}

@media (min-width: 768px) {
  .clock-container {
    flex-direction: column;
    align-items: flex-start;
  }
  .time-display {
    font-size: 2rem;
  }
}
</style>