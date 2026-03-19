<template>
  <div class="analysis-page">
    <div class="board-area">
      <EvalBar 
        :score="analysisStore.evalScore" 
        :mate="analysisStore.mate"
        :orientation="gameStore.orientation || 'white'"
      />
      <div class="board-wrapper">
        <ChessBoard 
          :fen="gameStore.currentFen" 
          :orientation="gameStore.orientation"
          @move="onUserMove"
        />
      </div>
    </div>

    <div class="side-panel">
      <EngineOutput />
      <GamePanel /> <!-- Ваш существующий GamePanel -->
      
      <div class="controls">
        <button @click="toggleAnalysis">
          {{ analysisStore.isThinking ? 'Выключить анализ' : 'Включить анализ' }}
        </button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { onMounted, watch } from 'vue';
import ChessBoard from '../components/Board/ChessBoard.vue';
import EvalBar from '../components/Analysis/EvalBar.vue';
import EngineOutput from '../components/Analysis/EngineOutput.vue';
import GamePanel from '../components/Board/GamePanel.vue';
import { useGameStore } from '../stores/game';
import { useAnalysisStore } from '../stores/analysis';

const gameStore = useGameStore();
gameStore.loadGame(78)
const analysisStore = useAnalysisStore();

function toggleAnalysis() {
  if (analysisStore.isThinking) {
    analysisStore.stopAnalysis();
  } else {
    analysisStore.analyzeFen(gameStore.currentFen);
  }
}

// Следим за изменением позиции (ход или навигация по стрелкам)
watch(() => gameStore.currentFen, (newFen) => {
  if (analysisStore.isThinking || !analysisStore.isReady) {
    analysisStore.analyzeFen(newFen);
  }
});

function onUserMove(uci: string) {
  // Логика добавления хода в стор игры для анализа
  // В режиме анализа мы не отправляем ходы на сервер, а просто двигаем позицию локально
}

onMounted(() => {
  analysisStore.initEngine();
});
</script>

<style scoped>
.analysis-page {
  display: flex;
  height: 90vh;
  gap: 20px;
  padding: 20px;
  background: #161512;
}
.board-area {
  display: flex;
  gap: 10px;
  flex: 2;
}
.board-wrapper {
  flex: 1;
  max-width: 700px;
}
.side-panel {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 10px;
}
.controls {
  padding: 10px;
  background: #262421;
}
button {
  width: 100%;
  padding: 10px;
  background: #4a6fa5;
  color: white;
  border: none;
  border-radius: 4px;
  cursor: pointer;
}
</style>