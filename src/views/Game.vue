<template>
  <div class="game-layout">
    <ChessClock 
    v-if="gameStore.clock && gameStore.fen" 
    :color="opponentColor" 
    />
    <ChessBoard />
    <ChessClock v-if="gameStore.clock && gameStore.fen" 
    :color="gameStore.myColor || 'white'" />
    <div v-if="gameStore.status === 'finished'" class="game-result">
      {{ gameStore.status }}
    </div>

    <MovesList />

  </div>
</template>

<script setup lang="ts">
import { onMounted, computed} from 'vue'
import { useRoute } from 'vue-router'
import { useGameStore } from '../stores/game'
import { useSocketStore } from '../stores/socket'

import ChessBoard from '../components/ChessBoard.vue'
import ChessClock from '../components/ChessClock.vue'
import MovesList from '../components/MovesList.vue'


const route = useRoute()
const gameStore = useGameStore()
const socketStore = useSocketStore()

const gameId = route.params.id


onMounted(async () => {
  await gameStore.loadGame(Number(gameId))
  socketStore.connect('game',Number(gameId))
})

const opponentColor = computed(() => {
  if (!gameStore.myColor) return 'white'
  return gameStore.myColor === 'white' ? 'black' : 'white'
})
</script>

<style scoped>
.game-layout {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 16px;
}

.game-result {
  font-size: 20px;
  font-weight: bold;
}
</style>