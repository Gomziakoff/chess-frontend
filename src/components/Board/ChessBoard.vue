<template>
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
} from 'vue3-chessboard'
import 'vue3-chessboard/style.css'

interface Props {
  fen: string
  orientation?: 'white' | 'black'
  playerColor?: 'white' | 'black'
  coordinates?: boolean
  allowMoves?: boolean
}

const props = withDefaults(defineProps<Props>(), {
  orientation: 'white',
  coordinates: true,
  allowMoves: true,
})

const emit = defineEmits<{
  (e: 'move', move: string): void
  (e: 'board-created', api: BoardApi): void
}>()

let boardApi: BoardApi | null = null

const boardConfig = computed<BoardConfig>(() => ({
  coordinates: props.coordinates,
  orientation: props.orientation,
  highlight: {lastMove:false},
  fen: props.fen,
}))

function onBoardCreated(api: BoardApi) {
  boardApi = api
  emit('board-created', api)

  if (props.fen) {
    boardApi.setPosition(props.fen)
  }
}

watch(
  () => props.fen,
  (fen) => {
    if (!boardApi) return
    boardApi.setPosition(fen)
  }
)

watch(
  () => props.orientation,
  () => {
    if (!boardApi) return
    boardApi.toggleOrientation()
  }
)

function handleMove(move: any) {
  if (!props.allowMoves) return
  emit('move', move.lan)
}
</script>