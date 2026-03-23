<template>
  <div class="game-layout">
    <MaiaLoaderModal 
      v-if="botStore.settings?.engine === 'maia'"
      :status="botStore.maiaStatus" 
      :progress="botStore.maiaProgress"
      @download="botStore.maiaInstance?.downloadModel()"
      @close="router.push('/')"
    />

    <!-- Левая колонка -->
    <div class="left-panel">
      <div class="player-card">
        <div class="bot-avatar">🤖</div>
        <div>
          {{ botName }}
          <div class="difficulty-tag">{{ botStore.settings?.difficulty }}</div>
        </div>
      </div>
    </div>

    <!-- Центр -->
    <div class="center-panel">
      <ChessBoard 
        :fen="botStore.displayFen" 
        :orientation="botStore.orientation" 
        :allow-moves="botStore.isMyTurn"
        :player-color="botStore.playerColor" 
        :engine-move="botStore.isThinking ? null : botStore.lastBotMove"
        @move="botStore.executeMove" 
      />
  </div>

    <!-- Правая колонка -->
    <div class="right-panel">
      <!-- Часы оппонента -->
      <ChessClock 
        :time="opponentTime" 
        :active="botStore.status === 'active' && !botStore.isMyTurn" 
        :color="opponentColor" 
        :player-name="botName" 
      />

      <!-- Список ходов -->
      <div class="moves-wrapper">
        <MovesList 
          :moves="botStore.history" 
          :current-index="displayIndex"
          :status="botStore.status"
          :winner="botStore.winner"
          @select="botStore.goToStep"
          @prev="botStore.goToPrev"
          @next="botStore.goToNext"
        />
      </div>

      <!-- Контроллер навигации -->
      <BoardController 
        :has-previous="botStore.hasPrevious"
        :has-next="botStore.hasNext"
        @first="botStore.goToFirst"
        @prev="botStore.goToPrev"
        @next="botStore.goToNext"
        @last="botStore.goToLast"
        @flip="botStore.orientation = botStore.orientation === 'white' ? 'black' : 'white'"
        @resign="confirmResign"
      />

      <!-- Часы игрока -->
      <ChessClock 
        :time="myTime" 
        :active="botStore.isMyTurn" 
        :color="botStore.playerColor" 
        :player-name="'Вы'" 
      />
      
      <div v-if="botStore.status === 'finished'" class="post-game">
         <button class="analyze-btn" @click="router.push('/')">В лобби</button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted, onUnmounted } from 'vue';
import { useRouter } from 'vue-router';
import { useBotGameStore } from '../stores/botGame';

import ChessBoard from '../components/Board/ChessBoard.vue';
import ChessClock from '../components/Board/ChessClock.vue';
import MovesList from '../components/Board/MovesList.vue';
import BoardController from '../components/Board/BoardController.vue';
import MaiaLoaderModal from '../components/Analysis/MaiaLoaderModal.vue';

const botStore = useBotGameStore();
const router = useRouter();

const botName = computed(() => botStore.settings?.engine === 'maia' ? 'Maia Bot' : 'Stockfish');
const myTime = computed(() => botStore.playerColor === 'white' ? botStore.whiteTime : botStore.blackTime);
const opponentTime = computed(() => botStore.playerColor === 'white' ? botStore.blackTime : botStore.whiteTime);
const opponentColor = computed(() => botStore.playerColor === 'white' ? 'black' : 'white');

// Индекс для подсветки в MovesList (если -1, подсвечиваем последний)
const displayIndex = computed(() => 
    botStore.currentStepIndex === -1 ? botStore.history.length - 1 : botStore.currentStepIndex
);

function confirmResign() {
    if (confirm("Сдаться?")) {
        botStore.status = 'finished';
        botStore.winner = botStore.playerColor === 'white' ? 'Black' : 'White';
    }
}

onMounted(() => {
    if (!botStore.settings) router.push('/');
});

onUnmounted(() => {
    botStore.reset();
});
</script>

<style scoped>
.game-layout {
  display: grid;
  /* Сетка: левая панель, центр (доска), правая панель */
  grid-template-columns: 180px 1fr 340px;
  gap: 24px;
  padding: 24px;
  max-width: 1400px;
  margin: 0 auto;
  height: calc(100vh - 80px); /* Ограничиваем по высоте экрана */
  box-sizing: border-box;
}

.center-panel {
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  min-width: 0; /* Важно для вложенных флексов */
  height: 100%;
}

/* Ограничиваем доску, чтобы она не росла бесконечно */
.center-panel :deep(.vue3-chessboard) {
  width: 100% !important;
  max-width: 70vh !important; /* Доска не больше 70% высоты экрана */
  aspect-ratio: 1 / 1;
}

.right-panel {
  display: flex;
  flex-direction: column;
  gap: 12px;
  height: 100%;
  overflow: hidden; /* Чтобы панель не растягивала страницу */
}

/* Настраиваем обертку списка ходов, чтобы она занимала оставшееся место */
.moves-wrapper {
  flex: 1; 
  min-height: 200px;
  overflow: hidden;
}

:deep(.moves-list) {
    height: 100%; /* Заставляем компонент MovesList занять весь wrapper */
}

@media (max-width: 1100px) {
  .game-layout {
    grid-template-columns: 1fr 320px;
    height: auto;
  }
  .left-panel { display: none; }
}

@media (max-width: 800px) {
  .game-layout {
    display: flex;
    flex-direction: column;
    align-items: center;
    padding: 10px;
  }
  .center-panel { width: 100%; }
  .right-panel { width: 100%; }
}
</style>