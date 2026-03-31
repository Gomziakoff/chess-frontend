<template>
  <!-- Используем grid вместо flex для жесткого контроля колонок -->
  <div class="puzzle-grid-layout" :key="puzzleStore.puzzleId">
    
    <!-- ЛЕВАЯ КОЛОНКА (Инфо) -->
    <div class="left-sidebar">
      <div class="info-card rating-box">
        <div class="label">Рейтинг</div>
        <div class="value">{{ puzzleStore.gameInfo?.puzzle?.rating || '...' }}</div>
      </div>
      
      <div class="themes-box" v-if="puzzleStore.gameInfo?.puzzle?.themes">
        <div v-for="theme in puzzleStore.gameInfo.puzzle.themes.slice(0, 6)" :key="theme" class="mini-tag">
          {{ theme }}
        </div>
      </div>
    </div>

    <!-- ЦЕНТР: Шахматная доска -->
    <div class="board-area">
      <div class="board-container">
        <ChessBoard
          v-if="puzzleStore.fen"
          :fen="puzzleStore.fen"
          :orientation="puzzleStore.orientation"
          :allow-moves="puzzleStore.status === 'playing' || puzzleStore.status === 'failed'"
          @move="onMove"
        />
      </div>
    </div>

    <!-- ПРАВАЯ КОЛОНКА (Ходы и кнопки) -->
    <div class="right-sidebar">
      <!-- Статус -->
      <div class="status-banner" :class="puzzleStore.status">
        <template v-if="puzzleStore.status === 'playing'">Ваш ход</template>
        <template v-else-if="puzzleStore.status === 'solved'">✔ Задача решена!</template>
        <template v-else-if="puzzleStore.status === 'failed'">❌ Неверный ход</template>
      </div>

      <!-- Список ходов -->
      <div class="moves-scroll-wrapper">
        <MovesList
          :moves="[...puzzleStore.historyMoves, ...puzzleStore.puzzleMoves]"
          :current-index="puzzleStore.historyMoves.length + puzzleStore.puzzleMoves.length - 1"
        />
      </div>

      <!-- Управление -->
      <div class="controls-panel">
        <BoardController
          :has-previous="false"
          :has-next="false"
          @flip="puzzleStore.orientation = puzzleStore.orientation === 'white' ? 'black' : 'white'"
          @resign="puzzleStore.resetPuzzle"
        />
        
        <button 
          v-if="puzzleStore.status === 'solved'" 
          class="next-btn-large" 
          @click="nextPuzzle"
        >
          Следующая задача →
        </button>
      </div>
    </div>

    <!-- ИСТОРИЯ (снизу) -->
    <div class="attempts-strip" v-if="puzzleStore.attempts.length">
      <div 
        v-for="att in puzzleStore.attempts" 
        :key="att.id"
        class="dot"
        :class="[att.status, { active: att.id === puzzleStore.puzzleId }]"
        @click="goToId(att.id)"
      >
        {{ att.status === 'solved' ? '✔' : '✘' }}
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { onMounted, watch } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { usePuzzleStore } from '../stores/puzzle';
import ChessBoard from '../components/Board/ChessBoard.vue';
import MovesList from '../components/Board/MovesList.vue';
import BoardController from '../components/Board/BoardController.vue';

const puzzleStore = usePuzzleStore();
const route = useRoute();
const router = useRouter();

const init = async () => {
  const idFromUrl = route.params.id as string;
  const loadedId = await puzzleStore.loadPuzzle(idFromUrl || null);
  if (loadedId && route.params.id !== loadedId) {
    router.replace(`/puzzles/${loadedId}`);
  }
};

onMounted(init);
watch(() => route.params.id, (newId) => {
  if (newId && newId !== puzzleStore.puzzleId) init();
});

const onMove = (uci: string) => puzzleStore.handleMove(uci);
const nextPuzzle = () => router.push('/puzzles/next');
const goToId = (id: string) => router.push(`/puzzles/${id}`);
</script>

<style scoped>
.puzzle-grid-layout {
  display: grid;
  /* Добавляем minmax(0, 1fr) для строк, чтобы они могли сжиматься */
  grid-template-columns: 150px minmax(0, 1fr) 320px;
  grid-template-rows: minmax(0, 1fr) auto; 
  gap: 20px;
  padding: 20px;
  max-width: 1400px;
  margin: 0 auto;
  /* Высота строго ограничена вьюпортом */
  height: 100vh; 
  max-height: 100vh;
  box-sizing: border-box;
  overflow: hidden; /* Запрещаем общий скролл страницы */
}

/* ЛЕВАЯ ПАНЕЛЬ */
.left-sidebar {
  display: flex;
  flex-direction: column;
  gap: 15px;
}

.info-card {
  background: #262421;
  padding: 10px;
  border-radius: 4px;
  text-align: center;
  border: 1px solid #312e2b;
}
.info-card .label { font-size: 11px; color: #999; text-transform: uppercase; }
.info-card .value { font-size: 20px; font-weight: bold; color: #95bb4a; }

.themes-box { display: flex; flex-wrap: wrap; gap: 5px; }
.mini-tag { 
  background: #21201d; font-size: 10px; padding: 3px 6px; 
  border-radius: 3px; color: #aaa; border: 1px solid #312e2b;
}

/* ЦЕНТР (ДОСКА) */
.board-area {
  display: flex;
  justify-content: center;
  align-items: center;
  min-height: 0; /* Позволяет flex-элементу сжиматься */
  width: 100%;
}

.board-container {
  /* Это критический блок: 
     Доска будет занимать либо 100% ширины, либо 100% высоты (что меньше), 
     но не более 600px */
  width: 100%;
  height: 100%;
  max-width: min(600px, 100%);
  max-height: min(600px, 100%);
  
  /* Используем object-fit логику для контейнера */
  aspect-ratio: 1 / 1;
  display: flex;
}

/* Чтобы сама доска внутри не вылезала */
:deep(.vue3-chessboard) {
  width: 100% !important;
  height: 100% !important;
  max-width: 100%;
  max-height: 100%;
}

/* ПРАВАЯ ПАНЕЛЬ */
.right-sidebar {
  display: flex;
  flex-direction: column;
  gap: 12px;
  min-height: 0; /* Обязательно для скролла внутри */
}

.status-banner {
  padding: 12px;
  background: #262421;
  border-radius: 4px;
  text-align: center;
  font-weight: bold;
  border: 1px solid #312e2b;
}
.status-banner.solved { color: #95bb4a; border-color: #95bb4a; }
.status-banner.failed { color: #ca3431; border-color: #ca3431; }

.moves-scroll-wrapper {
  flex: 1; /* Занимает всё свободное место в колонке */
  min-height: 0; 
  background: #262421;
  border-radius: 4px;
  border: 1px solid #312e2b;
  overflow: hidden;
}

/* Перебиваем фиксированную высоту из MovesList.vue */
:deep(.moves-wrapper) {
  height: 100% !important;
  max-height: none !important;
}

.controls-panel {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.next-btn-large {
  width: 100%;
  padding: 14px;
  background: #95bb4a;
  color: #fff;
  border: none;
  border-radius: 4px;
  font-weight: bold;
  cursor: pointer;
  font-size: 16px;
}

/* ПОПЫТКИ */
.attempts-strip {
  grid-column: 1 / -1; /* На всю ширину снизу */
  display: flex;
  justify-content: center;
  gap: 8px;
  padding: 10px;
}

.dot {
  width: 30px; height: 30px;
  display: flex; align-items: center; justify-content: center;
  border-radius: 4px; background: #262421; cursor: pointer; font-size: 12px;
}
.dot.solved { background: #95bb4a; color: white; }
.dot.failed { background: #ca3431; color: white; }
.dot.active { outline: 2px solid #fff; }

/* Мобильные устройства */
@media (max-width: 1024px) {
  .puzzle-grid-layout {
    grid-template-columns: 1fr 300px;
    height: auto;
  }
  .left-sidebar { display: none; }
}

@media (max-width: 700px) {
  .puzzle-grid-layout {
    grid-template-columns: 1fr;
  }
  .right-sidebar { height: 400px; }
}
</style>