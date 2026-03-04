<template>
  <div class="game-layout">
    <!-- Левая колонка (карточки игроков / заглушка) -->
    <div class="left-panel">
      <div class="player-card">White Player</div>
      <div class="player-card">Black Player</div>
    </div>

    <!-- Центр: шахматная доска -->
    <div class="center-panel">
      <ChessBoard />
    </div>

    <!-- Правая колонка: часы и геймпанель -->
    <div class="right-panel">
      <ChessClock v-if="gameStore.clock && gameStore.fen" :color="opponentColor" />
      <GamePanel />
      <ChessClock v-if="gameStore.clock && gameStore.fen" :color="gameStore.myColor || 'white'" />
    </div>
  </div>

  <!-- Нижняя заглушка для мобильного -->
  <div class="bottom-panel">
    <div class="player-card">Players info / placeholder</div>
  </div>
</template>

<script setup lang="ts">
import { onMounted, computed } from 'vue'
import { useRoute } from 'vue-router'
import { useGameStore } from '../stores/game'
import { useSocketStore } from '../stores/socket'

import ChessBoard from '../components/Board/ChessBoard.vue'
import ChessClock from '../components/Board/ChessClock.vue'
import GamePanel from '../components/Board/GamePanel.vue'

const route = useRoute()
const gameStore = useGameStore()
const socketStore = useSocketStore()

const gameId = route.params.id

onMounted(async () => {
  await gameStore.loadGame(Number(gameId))
  socketStore.connect('game', Number(gameId))
})

const opponentColor = computed(() => {
  if (!gameStore.myColor) return 'white'
  return gameStore.myColor === 'white' ? 'black' : 'white'
})
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
    flex-direction: row; /* доска слева, панель справа */
    align-items: flex-start;
    justify-content: center;
  }

  .left-panel {
    display: none; /* скрываем слева */
  }

  .center-panel {
    flex: 0 0 auto;
    max-width: 50%; /* доска уменьшена */
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
    flex-direction: column; /* доска сверху, панель под ней */
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