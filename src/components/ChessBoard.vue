\<template>
  <TheChessboard v-if="gameStore.fen" :board-config="boardConfig" :player-color="gameStore.myColor"
    @board-created="onBoardCreated" @move="onMove" />
</template>

<script setup lang="ts">
import { computed, watch } from 'vue'
import { TheChessboard, type BoardApi, type BoardConfig } from 'vue3-chessboard'
import 'vue3-chessboard/style.css'
import { useGameStore } from '../stores/game'

const gameStore = useGameStore()

let boardApi: BoardApi | null = null

const boardConfig = computed<BoardConfig>(() => ({
  coordinates: true,
  orientation: gameStore.myColor ?? 'white',
}))

function onBoardCreated(api: BoardApi) {
  boardApi = api

  // установить начальную позицию
  if (gameStore.fen) {
    boardApi.setPosition(gameStore.fen)
  }
}

watch(
  () => gameStore.fen,
  (fen) => {
    if (fen && boardApi) {
      boardApi.move(gameStore.lastMove)
    }
  }
)

function onMove(move: any) {
  if (gameStore.isMyTurn) {
    gameStore.sendMove(move.lan)
  }
}
</script>