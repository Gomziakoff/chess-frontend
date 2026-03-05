<template>
  <div
    class="clock-container"
    :class="{ active, danger: displayTime <= dangerThreshold }"
  >
    <div class="player-name">
      {{ playerSymbol }} {{ playerName }}
    </div>

    <div class="time-display">
      {{ minutes }}:{{ secondsPadded }}
      <span v-if="showTenths">.{{ tenths }}</span>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch,  onUnmounted } from 'vue'

interface Props {
  time: number // milliseconds
  active: boolean
  color: 'white' | 'black'
  playerName?: string
  dangerThreshold?: number
}

const props = withDefaults(defineProps<Props>(), {
  playerName: '',
  dangerThreshold: 10000,
  time: 0,
})

const emit = defineEmits<{
  (e: 'time-expired'): void
}>()

/* ---------- INTERNAL STATE ---------- */

const baseTime = ref(props.time)
const referenceTime = ref(Date.now())
let interval: number | null = null
const tickInterval = 50

/* ---------- COMPUTED ---------- */

const displayTime = computed(() => Math.max(baseTime.value, 0))

const minutes = computed(() => Math.floor(displayTime.value / 60000))
const seconds = computed(() => Math.floor(displayTime.value / 1000) % 60)
const secondsPadded = computed(() => ('00' + seconds.value).slice(-2))
const tenths = computed(() => Math.floor((displayTime.value % 1000) / 100))
const showTenths = computed(() => minutes.value < 1 && seconds.value <= 20)

const playerSymbol = computed(() =>
  props.color === 'white' ? '●' : '○'
)

/* ---------- TIMER LOGIC ---------- */

function startInterval() {
  if (interval !== null) clearInterval(interval)

  interval = window.setInterval(() => {
    if (!props.active) return

    const now = Date.now()
    const elapsed = now - referenceTime.value
    referenceTime.value = now

    baseTime.value = Math.max(baseTime.value - elapsed, 0)

    if (baseTime.value <= 0) {
      emit('time-expired')
      stopInterval()
    }
  }, tickInterval)
}

function stopInterval() {
  if (interval !== null) {
    clearInterval(interval)
    interval = null
  }
}

/* ---------- WATCHERS ---------- */

// Синхронизация с родителем
watch(
  () => props.time,
  (newTime) => {
    baseTime.value = newTime
    referenceTime.value = Date.now()
  },
  { immediate: true }
)

// Старт / стоп
watch(
  () => props.active,
  (isActive) => {
    if (isActive) {
      referenceTime.value = Date.now()
      startInterval()
    } else {
      stopInterval()
    }
  },
  { immediate: true }
)

onUnmounted(stopInterval)
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