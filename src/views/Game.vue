<template>
  <div class="game-layout" :key="$route.fullPath">
    <!-- Левая колонка (карточки игроков / заглушка) -->
    <div class="left-panel">
      <div class="player-card">White Player</div>
      <div class="player-card">Black Player</div>
    </div>

    <!-- Центр: шахматная доска -->
    <div class="center-panel">
      <ChessBoard :fen="gameStore.fen" :orientation="gameStore.orientation" :allow-moves="gameStore.isMyTurn"
        :player-color="gameStore.myColor" @move="gameStore.sendMove" />
    </div>

    <!-- Правая колонка: часы и геймпанель -->
    <div class="right-panel">
      <ChessClock :time="opponentTime" :active="opponentActive"
        :color="opponentColor" :player-name="opponentName" />
      <GamePanel />
      <ChessClock :time="myTime" :active="myActive"
        :color="gameStore.myColor || 'white'" :player-name="myName" />
    </div>

    <!-- Нижняя заглушка для мобильного -->
    <div class="bottom-panel">
      <div class="player-card">Players info / placeholder </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { onMounted,onUnmounted, computed, watch } from 'vue'
import { useRoute } from 'vue-router'
import { useGameStore } from '../stores/game'
import { useSocketStore } from '../stores/socket'

import ChessBoard from '../components/Board/ChessBoard.vue'
import ChessClock from '../components/Board/ChessClock.vue'
import GamePanel from '../components/Board/GamePanel.vue'

const route = useRoute()
const gameStore = useGameStore()
const socketStore = useSocketStore()

async function loadGameById(id: number) {
  socketStore.disconnect()
  await gameStore.reset()      // если есть reset — идеально
  await gameStore.loadGame(id)
  socketStore.connect('game', id)
}

onMounted(async () => {
  loadGameById(Number(route.params.id))
})

onUnmounted(async () =>{
  gameStore.reset()
})

const myTime = computed(() => {
  if (!gameStore.clock || !gameStore.myColor) return 0
  return gameStore.myColor === 'white' 
    ? gameStore.clock.white * 1000 
    : gameStore.clock.black * 1000
})

const opponentTime = computed(() => {
  if (!gameStore.clock || !gameStore.myColor) return 0
  return gameStore.myColor === 'white'
    ? gameStore.clock.black * 1000
    : gameStore.clock.white * 1000
})
const myActive = computed(() => {
  if (!gameStore.clock?.running || !gameStore.liveFen || !gameStore.myColor) return false
  
  const currentTurn = gameStore.liveFen.includes(' w ') ? 'white' : 'black'
  return gameStore.myColor === currentTurn
})

const opponentActive = computed(() => {
  if (!gameStore.clock?.running || !gameStore.liveFen || !gameStore.myColor) return false
  
  const currentTurn = gameStore.liveFen.includes(' w ') ? 'white' : 'black'
  return gameStore.myColor !== currentTurn
})

const opponentColor = computed(() => {
  if (!gameStore.myColor) return 'white'
  return gameStore.myColor === 'white' ? 'black' : 'white'
})

const myName = computed(() => {
  if (!gameStore.myColor) return ''
  return gameStore.myColor === 'white' 
    ? gameStore.whitePlayer?.username 
    : gameStore.blackPlayer?.username
})

const opponentName = computed(() => {
  if (!gameStore.myColor) return ''
  return gameStore.myColor === 'white'
    ? gameStore.blackPlayer?.username
    : gameStore.whitePlayer?.username
})

watch(
  () => route.params.id,
  (newId) => {
    if (!newId) return
    loadGameById(Number(newId))
  }
)
</script>

<style scoped>
.game-layout {
  display: flex;
  justify-content: center;
  align-items: flex-start;
  gap: 16px;
  padding: 16px;
  box-sizing: border-box;
}

/* Левая колонка */
.left-panel {
  width: 150px;
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.player-card {
  background: #2a2a2a;
  color: white;
  border-radius: 8px;
  padding: 8px;
  text-align: center;
  font-weight: bold;
}

/* Центр: доска */
.center-panel {
  flex: 1;
  display: flex;
  justify-content: center;
  align-items: center;
}

/* Правая колонка */
.right-panel {
  width: 300px;
  display: flex;
  flex-direction: column;
  gap: 12px;
  align-items: stretch;
}

/* Нижняя заглушка для мобильного */
.bottom-panel {
  display: none;
}

/* Адаптив для экранов <= 1024px */
@media (max-width: 1024px) {
  .game-layout {
    flex-direction: row;
    /* доска слева, панель справа */
    align-items: flex-start;
    justify-content: center;
  }

  .left-panel {
    display: none;
    /* скрываем слева */
  }

  .center-panel {
    flex: 0 0 auto;
    max-width: 50%;
    /* доска уменьшена */
  }

  .right-panel {
    width: 50%;
  }

  .bottom-panel {
    display: flex;
    justify-content: center;
    margin-top: 12px;
  }
}

/* Адаптив для ещё меньших экранов <= 640px */
@media (max-width: 640px) {
  .game-layout {
    flex-direction: column;
    /* доска сверху, панель под ней */
    align-items: center;
  }

  .center-panel {
    width: 90%;
    max-width: 400px;
  }

  .right-panel {
    width: 90%;
    max-width: 400px;
  }

  .bottom-panel {
    width: 90%;
  }
}
</style>