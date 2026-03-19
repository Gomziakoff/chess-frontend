<template>
  <!-- Добавляем ref, если понадобится, но работаем через api -->
  <TheChessboard
    v-if="fen"
    :board-config="boardConfig"
    :player-color="props.playerColor"
    @board-created="onBoardCreated"
    @move="handleMove"
  />
</template>

<script setup lang="ts">
import { computed, watch } from 'vue'
import {
  TheChessboard,
  type BoardApi,
  type BoardConfig,
  type DrawShape
} from 'vue3-chessboard'
import 'vue3-chessboard/style.css'

interface Props {
  fen: string
  orientation?: 'white' | 'black'
  playerColor?: 'white' | 'black'
  coordinates?: boolean
  allowMoves?: boolean
  engineMove?: string | null 
  nextHistoryMove?: string | null 
}

const props = withDefaults(defineProps<Props>(), {
  orientation: 'white',
  coordinates: true,
  allowMoves: true,
  engineMove: null,
  nextHistoryMove: null
})

const emit = defineEmits<{
  (e: 'move', move: string): void
  (e: 'board-created', api: BoardApi): void
}>()

let boardApi: BoardApi | null = null

// Вспомогательная функция для UCI -> Shape
function uciToShape(uci: string, brush: string): DrawShape {
  return {
    orig: uci.substring(0, 2) as any,
    dest: uci.substring(2, 4) as any,
    brush: brush,
  }
}

// Функция для обновления стрелок на доске
function updateArrows() {
  if (!boardApi) return

  const shapes: DrawShape[] = []

  // 1. Синяя стрелка (ход из истории)
  if (props.nextHistoryMove && props.nextHistoryMove.length >= 4) {
    shapes.push(uciToShape(props.nextHistoryMove, 'blue'))
  }

  // 2. Зеленая стрелка (движок)
  if (props.engineMove && props.engineMove.length >= 4) {
    shapes.push(uciToShape(props.engineMove, 'green'))
  }

  // Использование API для принудительной отрисовки
  boardApi.setShapes(shapes)
}

const boardConfig = computed<BoardConfig>(() => ({
  coordinates: props.coordinates,
  orientation: props.orientation,
  fen: props.fen,
  highlight: { lastMove: true },
  drawable: {
    enabled: true,
    visible: true,
    eraseOnClick: false, // Чтобы стрелки не пропадали при клике
  }
}))

function onBoardCreated(api: BoardApi) {
  boardApi = api
  emit('board-created', api)
  
  // Рисуем стрелки сразу после создания доски
  setTimeout(() => {
    updateArrows()
  }, 50)
}

// Следим за изменениями ходов
watch([() => props.engineMove, () => props.nextHistoryMove], () => {
  updateArrows()
})

// Следим за изменениями FEN (при смене позиции стрелки движка должны обновляться)
watch(() => props.fen, (newFen) => {
  if (boardApi) {
    boardApi.setPosition(newFen)
    // После смены позиции Chessground может очистить drawable, перерисовываем
    setTimeout(() => updateArrows(), 10)
  }
})

watch(() => props.orientation, () => {
  if (boardApi) boardApi.toggleOrientation()
})

function handleMove(move: any) {
  if (!props.allowMoves) return
  emit('move', move.lan)
}
</script>