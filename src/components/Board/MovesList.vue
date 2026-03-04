<!-- components/MovesList.vue -->
<template>
  <div class="moves-list">
    <!-- Контейнер с ходами -->
    <div 
      ref="movesContainer"
      class="moves-container"
      :class="{ 'mobile': isMobile }"
      tabindex="0"
      @keydown.left="handleKeyLeft"
      @keydown.right="handleKeyRight"
    >
      <!-- Десктоп версия (сетка) -->
      <template v-if="!isMobile">
        <div class="moves-grid" v-if="movePairs.length > 0">
          <!-- Шапка -->
          <div class="grid-header">
            <span>#</span>
            <span>Белые</span>
            <span>Черные</span>
          </div>

          <!-- Ходы -->
          <div 
            v-for="pair in movePairs" 
            :key="pair.number"
            class="grid-row"
          >
            <span class="move-number">{{ pair.number }}.</span>
            
            <!-- Белый ход -->
            <div 
              v-if="pair.white"
              class="move-cell"
              :class="{ 'active': currentMove?.fen === pair.white.fen }"
              @click="goToMove(pair.white)"
            >
              {{ pair.white.san }}
            </div>
            <div v-else class="move-cell empty"></div>

            <!-- Черный ход -->
            <div 
              v-if="pair.black"
              class="move-cell"
              :class="{ 'active': currentMove?.fen === pair.black.fen }"
              @click="goToMove(pair.black)"
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

      <!-- Мобильная версия (горизонтальная) -->
      <template v-else>
        <div class="moves-row" v-if="allMoves.length > 0">
          <div 
            v-for="move in allMoves" 
            :key="move.index"
            class="move-chip"
            :class="{ 'active': currentMove?.fen === move.fen }"
            @click="goToMove(move)"
          >
            <span class="move-number">{{ getFullMoveNumber(move) }}.</span>
            <span class="move-text">{{ move.san }}</span>
          </div>
        </div>
        <div v-else class="no-moves">
          Ходы пока не сделаны
        </div>
      </template>

      <!-- Результат партии -->
      <div v-if="gameResult" class="game-result">
        {{ gameResult }}
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted, watch, nextTick } from 'vue'
import { useGameStore } from '../../stores/game'

const gameStore = useGameStore()
const movesContainer = ref<HTMLElement | null>(null)
const isMobile = ref(false)

// Текущий выбранный ход
const currentMove = ref<any>(null)

// Проверка мобильного устройства
const checkMobile = () => {
  isMobile.value = window.innerWidth <= 640
}

// Все ходы из стора с правильным определением цвета
const allMoves = computed(() => {
  console.log('Computing allMoves, steps:', gameStore.steps.length)
  
  return gameStore.steps.map((step, index) => {
    // ply - это номер полухода (начиная с 1)
    // Нечетный ply - ход белых, четный - черных
    const moveNumber = Math.floor((step.ply - 1) / 2) + 1
    const isWhite = step.ply % 2 === 1
    
    return {
      ...step,
      index,
      moveNumber,
      isWhite,
      fullMoveNumber: isWhite ? moveNumber : `${moveNumber}...`
    }
  })
})

// Пары ходов для сетки
const movePairs = computed(() => {
  console.log('Computing movePairs')
  
  const pairs: { number: number; white: any; black: any }[] = []
  const moves = allMoves.value
  
  if (moves.length === 0) return pairs
  
  // Определяем максимальный номер хода
  const maxMove = Math.max(...moves.map(m => m.moveNumber))
  
  for (let moveNum = 1; moveNum <= maxMove; moveNum++) {
    const whiteMove = moves.find(m => m.moveNumber === moveNum && m.isWhite)
    const blackMove = moves.find(m => m.moveNumber === moveNum && !m.isWhite)
    
    pairs.push({
      number: moveNum,
      white: whiteMove || null,
      black: blackMove || null
    })
  }
  
  return pairs
})

// Полный номер хода для мобильной версии
const getFullMoveNumber = (move: any) => {
  return move.isWhite ? move.moveNumber : `${move.moveNumber}...`
}

// Результат игры
const gameResult = computed(() => {
  if (gameStore.status !== 'finished') return null
  
  if (gameStore.winner === 'white') return '1-0'
  if (gameStore.winner === 'black') return '0-1'
  return '½-½'
})

// Переход к ходу
const goToMove = (move: any) => {
  if (!move) return
  
  console.log('Going to move:', move)
  gameStore.goToStep(move.index)
  currentMove.value = move
  
  scrollToCurrentMove()
}

// Прокрутка к текущему ходу
const scrollToCurrentMove = () => {
  nextTick(() => {
    if (!movesContainer.value || !currentMove.value) return
    
    const activeElement = movesContainer.value.querySelector('.active')
    if (activeElement) {
      activeElement.scrollIntoView({
        behavior: 'smooth',
        block: 'nearest',
        inline: 'nearest'
      })
    }
  })
}

// Навигация с клавиатуры
const handleKeyLeft = (e: KeyboardEvent) => {
  e.preventDefault()
  if (!currentMove.value) {
    // Если нет текущего хода, идем к последнему
    if (allMoves.value.length > 0) {
      goToMove(allMoves.value[allMoves.value.length - 1])
    }
    return
  }
  
  const currentIndex = allMoves.value.findIndex(m => m.fen === currentMove.value?.fen)
  if (currentIndex > 0) {
    goToMove(allMoves.value[currentIndex - 1])
  }
}

const handleKeyRight = (e: KeyboardEvent) => {
  e.preventDefault()
  if (!currentMove.value) {
    // Если нет текущего хода, идем к первому
    if (allMoves.value.length > 0) {
      goToMove(allMoves.value[0])
    }
    return
  }
  
  const currentIndex = allMoves.value.findIndex(m => m.fen === currentMove.value?.fen)
  if (currentIndex < allMoves.value.length - 1) {
    goToMove(allMoves.value[currentIndex + 1])
  }
}

// Следим за новыми ходами
watch(
  () => gameStore.steps.length,
  () => {
    const lastMove = allMoves.value[allMoves.value.length - 1]
    if (lastMove) {
      currentMove.value = lastMove
      nextTick(scrollToCurrentMove)
    }
  },
  { immediate: true }
)

watch(
  () => gameStore.currentStepIndex,
  (newIndex, oldIndex) => {
    console.log('Current step index changed:', newIndex, oldIndex)
    if (newIndex !== oldIndex) {
      currentMove.value = allMoves.value[gameStore.currentStepIndex]
      scrollToCurrentMove()
    }
  }
)

// Следим за загрузкой игры
watch(() => gameStore.gameId, (newId) => {
  console.log('Game ID changed:', newId)
  
  if (newId && allMoves.value.length > 0) {
    const lastMove = allMoves.value[allMoves.value.length - 1]
    if (lastMove) {
      currentMove.value = lastMove
    }
  }
})

// Инициализация
onMounted(() => {
  console.log('MovesList mounted')
  checkMobile()
  window.addEventListener('resize', checkMobile)
  
  // Устанавливаем фокус на контейнер для клавиатурной навигации
  if (movesContainer.value) {
    movesContainer.value.focus()
  }
  
  // Если уже есть ходы, устанавливаем последний как текущий
  if (allMoves.value.length > 0) {
    const lastMove = allMoves.value[allMoves.value.length - 1]
    currentMove.value = lastMove
  }
})

onUnmounted(() => {
  console.log('MovesList unmounted')
  window.removeEventListener('resize', checkMobile)
})
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