<template>
  <div class="human-analysis-layout">
    
    <!-- ВЕРХНЯЯ ПАНЕЛЬ С ГРАФИКАМИ -->
    <header class="top-dashboard">
      <div class="score-card white">
        <div class="card-labels">
          <span class="player-name">White Bot Probability</span>
          <span class="percentage" :class="getBotClass(whiteBotScore)">{{ whiteBotScore }}%</span>
        </div>
        <div class="progress-track">
          <div class="progress-fill" :class="getBotClass(whiteBotScore, 'bg')" :style="{width: whiteBotScore + '%'}"></div>
        </div>
      </div>

      <div class="analysis-meta">
        <div v-if="analysisStore.isFullAnalysisRunning" class="analysis-loader">
          <div class="pulse-icon"></div>
          <span>Deep Scan: {{ analysisStore.fullAnalysisProgress }}%</span>
        </div>
        <div v-else class="analysis-idle">System Ready</div>
      </div>

      <div class="score-card black">
        <div class="card-labels">
          <span class="player-name">Black Bot Probability</span>
          <span class="percentage" :class="getBotClass(blackBotScore)">{{ blackBotScore }}%</span>
        </div>
        <div class="progress-track">
          <div class="progress-fill" :class="getBotClass(blackBotScore, 'bg')" :style="{width: blackBotScore + '%'}"></div>
        </div>
      </div>
    </header>

    <main class="main-workspace">
      <!-- ЛЕВАЯ ЧАСТЬ: ДОСКА + EVAL BAR -->
      <section class="board-viewer">
        <div class="board-and-eval-wrapper">
          <div class="eval-column">
            <EvalBar 
              :score="analysisStore.evalScore" 
              :mate="analysisStore.mate"
              :orientation="analysisStore.orientation"
            />
          </div>
          <div class="board-column">
            <ChessBoard 
              :fen="analysisStore.currentFen" 
              :orientation="analysisStore.orientation"
              :engine-move="analysisStore.bestMove"
              :allow-moves="false"
            />
          </div>
        </div>
      </section>

      <!-- ПРАВАЯ ЧАСТЬ: САЙДБАР (СПИСОК ХОДОВ И КОНТРОЛЛЕР) -->
      <aside class="analysis-sidebar">
        
        <!-- Окно списка ходов -->
        <div class="moves-container">
          <div class="container-header">Humanity Records</div>
          <div class="scrollable-list">
            <HumanityList 
              :moves="analysisStore.history" 
              :currentIndex="analysisStore.currentStepIndex"
              @select="analysisStore.goToStep" 
            />
          </div>
        </div>

        <!-- Контроллер (Carriages) -->
        <div class="navigation-panel">
          <BoardController 
            :has-previous="analysisStore.currentStepIndex > -1"
            :has-next="analysisStore.currentStepIndex < analysisStore.history.length - 1"
            @first="analysisStore.goToStep(-1)"
            @prev="analysisStore.prevMove" 
            @next="analysisStore.nextMove" 
            @last="analysisStore.goToStep(analysisStore.history.length - 1)"
            @flip="analysisStore.orientation = analysisStore.orientation === 'white' ? 'black' : 'white'"
          />
        </div>

        <!-- Поле PGN -->
        <div class="pgn-footer">
          <textarea v-model="pgn" placeholder="Paste PGN here..."></textarea>
          <button 
            class="action-btn" 
            @click="loadAndAnalyze"
            :disabled="analysisStore.isFullAnalysisRunning || !analysisStore.isReady"
          >
            {{ analysisStore.isFullAnalysisRunning ? 'Analyzing...' : 'Run Depth 24 Check' }}
          </button>
        </div>
      </aside>
    </main>

    <MaiaLoaderModal 
      :status="analysisStore.maiaStatus" 
      :progress="analysisStore.maiaProgress"
      @download="analysisStore.downloadMaia" 
      @close="analysisStore.skipMaia" 
    />
  </div>
</template>

<script setup lang="ts">
import { computed, ref, onMounted } from 'vue';
import { useAnalysisStore } from '../stores/analysis';
import BoardController from '../components/Board/BoardController.vue';
import HumanityList from '../components/Humanity/HumanityList.vue';
import ChessBoard from '../components/Board/ChessBoard.vue';
import EvalBar from '../components/Analysis/EvalBar.vue'; 
import MaiaLoaderModal from '../components/Analysis/MaiaLoaderModal.vue';

const analysisStore = useAnalysisStore();
const pgn = ref('');

onMounted(() => {
    analysisStore.initEngine();
});

function calculateScore(turn: 'w' | 'b') {
    const playerMoves = analysisStore.history.filter((s, i) => {
        const t = (i === 0) ? 'w' : (analysisStore.history[i - 1].fen.split(' ')[1]);
        return t === turn;
    });
    if (playerMoves.length === 0) return 0;
    const suspicious = playerMoves.filter(m => m.isSuspicious).length;
    return Math.round((suspicious / playerMoves.length) * 100);
}

const whiteBotScore = computed(() => calculateScore('w'));
const blackBotScore = computed(() => calculateScore('b'));

function getBotClass(score: number, type: 'text' | 'bg' = 'text') {
    if (score > 35) return type === 'text' ? 'c-critical' : 'b-critical';
    if (score > 15) return type === 'text' ? 'c-warning' : 'b-warning';
    return type === 'text' ? 'c-safe' : 'b-safe';
}

async function loadAndAnalyze() {
    if (!pgn.value.trim()) return;
    const success = analysisStore.loadPgn(pgn.value);
    if (!success) return;
    await analysisStore.runFullAnalysis(24); 
    await analysisStore.runHumanityAnalysis();
}
</script>

<style scoped>
/* ОСНОВНАЯ СТРУКТУРА */
.human-analysis-layout {
  height: 100vh;
  display: flex;
  flex-direction: column;
  background: #161512;
  color: #bababa;
  padding: 15px;
  box-sizing: border-box;
  overflow: hidden;
}

/* ШАПКА */
.top-dashboard {
  display: grid;
  grid-template-columns: 1fr 240px 1fr;
  gap: 20px;
  background: #262421;
  padding: 15px 25px;
  border-radius: 8px;
  margin-bottom: 15px;
  align-items: center;
  border-bottom: 2px solid #2f2c29;
}

.score-card { display: flex; flex-direction: column; gap: 6px; }
.card-labels { display: flex; justify-content: space-between; align-items: flex-end; }
.player-name { font-size: 11px; text-transform: uppercase; color: #888; letter-spacing: 0.5px; }
.percentage { font-size: 22px; font-weight: 900; }

.progress-track { height: 4px; background: #1a1a1a; border-radius: 2px; overflow: hidden; }
.progress-fill { height: 100%; transition: width 0.6s cubic-bezier(0.4, 0, 0.2, 1); }

/* РАБОЧАЯ ОБЛАСТЬ */
.main-workspace {
  flex: 1;
  display: grid;
  grid-template-columns: minmax(0, 1fr) 400px; /* Фиксируем сайдбар, доска тянется */
  gap: 20px;
  overflow: hidden;
}

/* ДОСКА */
.board-viewer {
  display: flex;
  justify-content: center;
  align-items: center;
  background: #21201d;
  border-radius: 8px;
  padding: 20px;
  overflow: hidden;
}

.board-and-eval-wrapper {
  display: flex;
  gap: 12px;
  height: 100%;
  max-height: 600px; /* Ограничиваем, чтобы доска не была бесконечной */
  aspect-ratio: 1.05 / 1; /* Отношение ширины к высоте с учетом EvalBar */
}

.eval-column {
  width: 32px;
  height: 100%;
}

.board-column {
  flex: 1;
  aspect-ratio: 1/1;
}

/* САЙДБАР */
.analysis-sidebar {
  display: flex;
  flex-direction: column;
  gap: 12px;
  overflow: hidden;
}

.moves-container {
  flex: 1;
  background: #262421;
  border-radius: 8px;
  border: 1px solid #312e2b;
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

.container-header {
  padding: 10px;
  background: #2f2c29;
  font-size: 12px;
  font-weight: bold;
  text-align: center;
  border-bottom: 1px solid #312e2b;
}

.scrollable-list {
  flex: 1;
  overflow-y: auto;
}

/* КОНТРОЛЛЕР */
.navigation-panel {
  background: #262421;
  padding: 10px;
  border-radius: 8px;
  border: 1px solid #312e2b;
}

/* Стилизация внутренних кнопок контроллера */
:deep(.controller) {
  display: flex;
  justify-content: space-around;
  width: 100%;
}

:deep(.controller button) {
  background: transparent !important;
  border: 1px solid #3c3934 !important;
  color: #bababa !important;
  padding: 10px 15px !important;
  border-radius: 4px;
  cursor: pointer;
  transition: all 0.2s;
}

:deep(.controller button:hover:not(:disabled)) {
  background: #3c3934 !important;
  color: #fff !important;
}

/* PGN FOOTER */
.pgn-footer {
  background: #262421;
  padding: 12px;
  border-radius: 8px;
  border: 1px solid #312e2b;
}

.pgn-footer textarea {
  width: 100%;
  height: 60px;
  background: #161512;
  border: 1px solid #3c3934;
  color: #ddd;
  padding: 8px;
  font-size: 11px;
  resize: none;
  border-radius: 4px;
  margin-bottom: 10px;
  font-family: monospace;
}

.action-btn {
  width: 100%;
  padding: 12px;
  background: #4a6fa5;
  color: white;
  border: none;
  border-radius: 4px;
  font-weight: bold;
  cursor: pointer;
}

.action-btn:disabled { opacity: 0.5; cursor: not-allowed; }

/* ЦВЕТОВЫЕ КЛАССЫ */
.c-critical { color: #ff5555; }
.b-critical { background: #ff5555; }
.c-warning { color: #ffaa00; }
.b-warning { background: #ffaa00; }
.c-safe { color: #7fa650; }
.b-safe { background: #7fa650; }

.analysis-loader { display: flex; align-items: center; gap: 10px; color: #4a6fa5; font-weight: bold; }
.pulse-icon { width: 10px; height: 10px; background: #4a6fa5; border-radius: 50%; animation: pulse 1.5s infinite; }

@keyframes pulse {
  0% { transform: scale(0.9); opacity: 0.7; }
  50% { transform: scale(1.2); opacity: 1; }
  100% { transform: scale(0.9); opacity: 0.7; }
}

/* Кастомизация скроллбара */
.scrollable-list::-webkit-scrollbar { width: 6px; }
.scrollable-list::-webkit-scrollbar-track { background: transparent; }
.scrollable-list::-webkit-scrollbar-thumb { background: #3c3934; border-radius: 3px; }
</style>