<template>
  <div class="moves-list">
    <div 
      ref="movesContainer"
      class="moves-container"
      :class="{ mobile: isMobile }"
      tabindex="0"
      @keydown.left="handleLeft"
      @keydown.right="handleRight"
    >
      <!-- DESKTOP -->
      <template v-if="!isMobile">
        <div v-if="movePairs.length > 0" class="moves-grid">
          <div class="grid-header">
            <span>#</span>
            <span>Белые</span>
            <span>Черные</span>
          </div>

          <div 
            v-for="pair in movePairs"
            :key="pair.number"
            class="grid-row"
          >
            <span class="move-number">{{ pair.number }}.</span>

            <div
              v-if="pair.white"
              class="move-cell"
              :class="{ active: pair.white.index === currentIndex }"
              @click="select(pair.white.index)"
            >
              {{ pair.white.san }}
            </div>
            <div v-else class="move-cell empty"></div>

            <div
              v-if="pair.black"
              class="move-cell"
              :class="{ active: pair.black.index === currentIndex }"
              @click="select(pair.black.index)"
            >
              {{ pair.black.san }}
            </div>
            <div v-else class="move-cell empty"></div>
          </div>
        </div>

        <div v-else class="no-moves">
          Ходы пока не сделаны
        </div>
      </template>

      <!-- MOBILE -->
      <template v-else>
        <div v-if="movesWithMeta.length > 0" class="moves-row">
          <div
            v-for="move in movesWithMeta"
            :key="move.index"
            class="move-chip"
            :class="{ active: move.index === currentIndex }"
            @click="select(move.index)"
          >
            <span class="move-number">
              {{ move.isWhite ? move.moveNumber : move.moveNumber + '...' }}
            </span>
            <span>{{ move.san }}</span>
          </div>
        </div>

        <div v-else class="no-moves">
          Ходы пока не сделаны
        </div>
      </template>

      <div v-if="gameResult" class="game-result">
        {{ gameResult }}
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, ref, watch, nextTick, onMounted, onUnmounted } from 'vue'

interface Move {
  san: string
  ply: number
}

interface Props {
  moves: Move[]
  currentIndex: number
  status?: string
  winner?: string| null
}

const props = defineProps<Props>()

const emit = defineEmits<{
  (e: 'select', index: number): void
  (e: 'prev'): void
  (e: 'next'): void
}>()

const movesContainer = ref<HTMLElement | null>(null)
const isMobile = ref(false)

const checkMobile = () => {
  isMobile.value = window.innerWidth <= 640
}

onMounted(() => {
  checkMobile()
  window.addEventListener('resize', checkMobile)
})

onUnmounted(() => {
  window.removeEventListener('resize', checkMobile)
})

/* ---------- MOVES META ---------- */

const movesWithMeta = computed(() => {
  return props.moves.map((step, index) => {
    const moveNumber = Math.floor((step.ply - 1) / 2) + 1
    const isWhite = step.ply % 2 === 1

    return {
      ...step,
      index,
      moveNumber,
      isWhite,
    }
  })
})

const movePairs = computed(() => {
  const pairs: any[] = []
  const moves = movesWithMeta.value

  const maxMove = Math.max(...moves.map(m => m.moveNumber), 0)

  for (let i = 1; i <= maxMove; i++) {
    const white = moves.find(m => m.moveNumber === i && m.isWhite)
    const black = moves.find(m => m.moveNumber === i && !m.isWhite)

    pairs.push({ number: i, white, black })
  }

  return pairs
})

/* ---------- RESULT ---------- */

const gameResult = computed(() => {
  if (props.status === 'active') return null
  if (props.winner === 'White') return '1-0'
  if (props.winner === 'Black') return '0-1'
  return '½-½'
})

/* ---------- NAVIGATION ---------- */

function select(index: number) {
  emit('select', index)
  scrollToActive()
}

function handleLeft(e: KeyboardEvent) {
  e.preventDefault()
  emit('prev')
}

function handleRight(e: KeyboardEvent) {
  e.preventDefault()
  emit('next')
}

function scrollToActive() {
  nextTick(() => {
    const active = movesContainer.value?.querySelector('.active')
    active?.scrollIntoView({ block: 'nearest', inline: 'nearest' })
  })
}

watch(() => props.currentIndex, scrollToActive)
</script>


<style scoped>
.moves-list {
  width: 100%;
  max-width: 600px;
  background: #2a2a2a;
  border-radius: 8px;
  overflow: hidden;
  color: #fff;
  font-family: 'Chess', 'Segoe UI', sans-serif;
  border: 1px solid #404040;
  margin: 10px 0;
}

.moves-container {
  outline: none;
  max-height: 300px;
  overflow-y: auto;
  overflow-x: hidden;
  padding: 8px;
}

/* Десктопная сетка */
.moves-grid {
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.grid-header {
  display: grid;
  grid-template-columns: 40px 1fr 1fr;
  padding: 8px 4px;
  color: #888;
  font-size: 12px;
  font-weight: 500;
  border-bottom: 1px solid #404040;
  position: sticky;
  top: 0;
  background: #2a2a2a;
  z-index: 10;
}

.grid-row {
  display: grid;
  grid-template-columns: 40px 1fr 1fr;
  gap: 2px;
}

.move-number {
  display: flex;
  align-items: center;
  padding: 4px 8px;
  color: #888;
  font-size: 12px;
}

.move-cell {
  padding: 6px 12px;
  background: #333;
  border-radius: 4px;
  cursor: pointer;
  font-size: 14px;
  transition: all 0.2s;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  min-height: 32px;
  display: flex;
  align-items: center;
}

.move-cell.empty {
  background: #2a2a2a;
  cursor: default;
}

.move-cell.empty:hover {
  background: #2a2a2a;
}

.move-cell:hover:not(.empty) {
  background: #404040;
}

.move-cell.active {
  background: #4a6fa5;
  font-weight: 500;
  box-shadow: 0 0 0 1px #6d8fc6;
}

/* Мобильная версия */
.moves-row {
  display: flex;
  flex-direction: row;
  gap: 4px;
  overflow-x: auto;
  padding: 4px;
  min-width: min-content;
}

.move-chip {
  display: flex;
  align-items: center;
  gap: 4px;
  padding: 6px 12px;
  background: #333;
  border-radius: 20px;
  cursor: pointer;
  font-size: 14px;
  white-space: nowrap;
  transition: all 0.2s;
}

.move-chip:hover {
  background: #404040;
}

.move-chip.active {
  background: #4a6fa5;
  box-shadow: 0 0 0 1px #6d8fc6;
}

.move-chip .move-number {
  padding: 0;
  color: #aaa;
  font-size: 11px;
}

.move-chip.active .move-number {
  color: #fff;
}

/* Результат игры */
.game-result {
  margin-top: 12px;
  padding: 8px;
  text-align: center;
  background: #333;
  border-radius: 4px;
  font-size: 16px;
  font-weight: 500;
  color: #ffd700;
  border: 1px solid #404040;
}

/* Пустое состояние */
.no-moves {
  padding: 20px;
  text-align: center;
  color: #888;
  font-style: italic;
}

/* Скроллбар */
.moves-container::-webkit-scrollbar {
  width: 6px;
  height: 6px;
}

.moves-container::-webkit-scrollbar-track {
  background: #222;
}

.moves-container::-webkit-scrollbar-thumb {
  background: #555;
  border-radius: 3px;
}

.moves-container::-webkit-scrollbar-thumb:hover {
  background: #666;
}

/* Адаптивность */
@media (max-width: 640px) {
  .moves-list {
    max-width: 100%;
    border-radius: 0;
  }
  
  .moves-container {
    max-height: 120px;
  }
  
  .move-chip {
    padding: 4px 10px;
    font-size: 13px;
  }
}
</style>