<template>
  <div class="drill-page">
    <div class="analysis-layout">
      
      <!-- 1. Левая панель (Оценка) -->
      <div class="left-panel">
        <div class="eval-wrapper" v-if="drillStore.isAnalysisVisible">
          <EvalBar 
            :score="analysisStore.evalScore" 
            :mate="analysisStore.mate"
            :orientation="drillStore.orientation"
          />
        </div>
      </div>

      <!-- 2. Центр (Доска) -->
      <div class="center-panel">
        <div class="header-strip">
          <div v-if="drillStore.status === 'playing'" class="drill-status">
            <span class="badge">ТРЕНИРОВКА</span>
            <span class="progress">Ход: <b>{{ drillStore.playerMoveCount }}</b> / {{ drillStore.targetMoves }}</span>
          </div>
          <div v-else class="drill-status">
            <span class="badge completed">АНАЛИЗ</span>
            <span class="opening-name">{{ drillStore.currentOpening?.name || 'Дебют' }}</span>
          </div>
        </div>

        <div class="board-container">
          <ChessBoard 
            :fen="currentFenForBoard" 
            :orientation="drillStore.orientation"
            :allow-moves="drillStore.status === 'playing' && !drillStore.isThinking"
            @move="drillStore.applyMove($event, true)"
          />
        </div>
      </div>

      <!-- 3. Правая панель -->
      <div class="right-panel">
        
        <!-- Список ходов -->
        <div class="moves-section">
          <MovesList 
            :moves="drillStore.isAnalysisVisible ? analysisStore.history : drillStore.history" 
            :currentIndex="drillStore.isAnalysisVisible ? analysisStore.currentStepIndex : drillStore.history.length - 1"
            @select="(i) => drillStore.isAnalysisVisible && analysisStore.goToStep(i)"
            @prev="onNavPrev"
            @next="onNavNext"
          />
        </div>

        <!-- Навигация -->
        <div class="controller-section">
          <BoardController 
            :has-previous="canGoPrev"
            :has-next="canGoNext"
            @first="onNavFirst"
            @prev="onNavPrev"
            @next="onNavNext"
            @last="onNavLast"
            @flip="drillStore.orientation = drillStore.orientation === 'white' ? 'black' : 'white'"
            @resign="drillStore.reset()"
          />
        </div>

        <!-- Аналитика / Инфо -->
        <div class="side-content">
          <div v-if="drillStore.isAnalysisVisible" class="engine-area">
            <div v-if="analysisStore.isFullAnalysisRunning" class="analysis-loader">
              <div class="spinner-sm"></div>
              <span>Обсчет {{ analysisStore.fullAnalysisProgress }}%</span>
            </div>
            
            <EngineOutput 
              :lines="analysisStore.engineLines"
              :is-thinking="analysisStore.isThinking"
              :depth="analysisStore.depth"
            />
            
            <PositionDescription 
              v-if="analysisStore.engineLines.length > 0 && !analysisStore.isFullAnalysisRunning"
              :segments="descriptionSegments"
              @make-move="analysisStore.makeMove"
            />

            <div class="actions-grid">
              <button class="btn-secondary" @click="drillStore.reset()">В меню</button>
              <button v-if="analysisStore.showSummary" class="btn-primary" @click="showSummary = true">
                📊 Итоги
              </button>
            </div>
          </div>

          <div v-else-if="drillStore.status === 'playing'" class="info-card">
            <h4>Цель тренировки</h4>
            <p>Выполните серию из {{ drillStore.targetMoves }} точных ходов.</p>
            <div v-if="drillStore.isThinking" class="thinking-label">
              <span class="dot"></span> Бот выбирает ход...
            </div>
          </div>
        </div>
      </div>
    </div>

    <OpeningSelector 
      :show="drillStore.status === 'selecting'" 
      @start="onStart"
      @close="handleCloseSelector"
    />

    <AnalysisSummaryModal 
      :show="showSummary" 
      :data="analysisStore.summaryData" 
      @close="showSummary = false" 
    />
  </div>
</template>

<script setup lang="ts">
import { computed, ref, onMounted, onUnmounted } from 'vue';
import { useOpeningDrillStore } from '../stores/openingDrill';
import { useAnalysisStore } from '../stores/analysis';
import { describePosition } from '../lib/engine/describer';

import ChessBoard from '../components/Board/ChessBoard.vue';
import EvalBar from '../components/Analysis/EvalBar.vue';
import MovesList from '../components/Board/MovesList.vue';
import EngineOutput from '../components/Analysis/EngineOutput.vue';
import PositionDescription from '../components/Analysis/PositionDescription.vue';
import OpeningSelector from '../components/Opening/OpeningSelector.vue';
import AnalysisSummaryModal from '../components/Analysis/AnalysisSummaryModal.vue';
import BoardController from '../components/Board/BoardController.vue';
import { useRouter } from 'vue-router'; // 1. Добавь импорт

const router = useRouter(); 

const drillStore = useOpeningDrillStore();
const analysisStore = useAnalysisStore();
const showSummary = ref(false);

const currentFenForBoard = computed(() => {
  return drillStore.isAnalysisVisible ? analysisStore.currentFen : drillStore.currentFen;
});

const canGoPrev = computed(() => drillStore.isAnalysisVisible ? analysisStore.canGoBack : drillStore.history.length > 0);
const canGoNext = computed(() => drillStore.isAnalysisVisible ? analysisStore.canGoForward : false);

function onNavFirst() { if (drillStore.isAnalysisVisible) analysisStore.goToStep(-1); }
function onNavLast() { if (drillStore.isAnalysisVisible) analysisStore.goToStep(analysisStore.history.length - 1); }
function onNavPrev() { if (drillStore.isAnalysisVisible) analysisStore.prevMove(); }
function onNavNext() { if (drillStore.isAnalysisVisible) analysisStore.nextMove(); }

function onStart(config: any) {
  drillStore.initDrill(config.fen, config.target, config.color);
}

function handleCloseSelector() {
  router.push('/') // Или любой другой статус, кроме 'selecting'
}

const descriptionSegments = computed(() => {
  if (!drillStore.isAnalysisVisible) return [];
  const evals: Record<string, number> = {};
  analysisStore.engineLines.forEach(line => {
    const move = line.pv.split(' ')[0];
    if (move) {
      evals[move] = line.score.includes('#') ? 1000 : Math.round(parseFloat(line.score) * 100);
    }
  });
  return describePosition(analysisStore.currentFen, evals, analysisStore.analyzingTurn === 'w').segments;
});

onMounted(() => analysisStore.initEngine());
onUnmounted(() => drillStore.reset());
</script>

<style scoped>
.drill-page {
  display: flex;
  justify-content: center;
  align-items: center;
  height: calc(100vh - 70px);
  overflow: hidden;
}

.analysis-layout {
  display: flex;
  gap: 12px;
  align-items: stretch;
  height: 85vh; /* Ограничиваем высоту интерфейса */
}

/* 1. Левая панель */
.left-panel {
  width: 30px;
}

/* 2. Центр (Доска) */
.center-panel {
  display: flex;
  flex-direction: column;
  flex: 0 1 auto;
}

.header-strip {
  height: 40px;
  display: flex;
  align-items: center;
}

.drill-status {
  display: flex;
  align-items: center;
  gap: 10px;
  font-size: 14px;
}

.badge {
  background: #4a6fa5;
  color: white;
  padding: 2px 8px;
  border-radius: 4px;
  font-size: 11px;
  font-weight: 800;
}
.badge.completed { background: #7fa650; }

.progress b { color: #95bb4a; font-size: 16px; }

.board-container {
  width: 100%;
  height: 100%;
  max-width: min(600px, 100%);
  max-height: min(600px, 100%);
  aspect-ratio: 1 / 1;
  display: flex;
}
/* 3. Правая панель */
.right-panel {
  width: 320px; /* Уменьшили с 380 */
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.moves-section {
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

.controller-section {
  background: #262421;
  padding: 8px;
  border-radius: 6px;
  border: 1px solid #333;
}

.side-content {
  background: #262421;
  border-radius: 6px;
  border: 1px solid #333;
  padding: 10px;
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.info-card h4 { margin: 0 0 5px; color: #fff; font-size: 15px; }
.info-card p { margin: 0; color: #888; font-size: 13px; line-height: 1.4; }

.analysis-loader {
  background: #1e3a5f;
  color: white;
  padding: 8px;
  border-radius: 4px;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  font-size: 12px;
  margin-bottom: 8px;
}

.actions-grid {
  display: flex;
  gap: 8px;
  margin-top: 5px;
}

.btn-primary, .btn-secondary {
  flex: 1;
  padding: 10px;
  border-radius: 4px;
  border: none;
  font-weight: bold;
  cursor: pointer;
  font-size: 13px;
}
.btn-primary { background: #7fa650; color: white; }
.btn-secondary { background: #3c3934; color: #ccc; }

.thinking-label {
  margin-top: 10px;
  color: #f9d848;
  font-size: 12px;
  display: flex;
  align-items: center;
  gap: 6px;
}

.dot {
  width: 6px; height: 6px; background: #f9d848; border-radius: 50%;
  animation: pulse 1s infinite;
}

@keyframes pulse { 0%, 100% { opacity: 1; } 50% { opacity: 0.3; } }

.spinner-sm {
  width: 14px; height: 14px; border: 2px solid rgba(255,255,255,0.3);
  border-top-color: #fff; border-radius: 50%;
  animation: spin 0.8s linear infinite;
}
@keyframes spin { to { transform: rotate(360deg); } }

/* Стилизация контроллера внутри тренировки */
:deep(.controller button) {
  height: 32px;
  width: 32px;
  font-size: 14px;
}
</style>