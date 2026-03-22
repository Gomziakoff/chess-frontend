<template>
    <div class="analysis-layout">
        <!-- ЛЕВАЯ ПАНЕЛЬ: Оценка -->
        <div class="left-panel">
            <div class="eval-wrapper">
                <EvalBar :score="analysisStore.evalScore" :mate="analysisStore.mate"
                    :orientation="analysisStore.orientation" />
            </div>
        </div>

        <!-- ЦЕНТРАЛЬНАЯ ПАНЕЛЬ: Доска -->
        <div class="center-panel">
            <div class="board-container">
                <ChessBoard :fen="analysisStore.currentFen" :orientation="analysisStore.orientation"
                    :engine-move="analysisStore.bestMove" :next-history-move="nextMoveInHistory"
                    :maia-move="analysisStore.maiaResults[0]?.move" @move="onUserMove" />
            </div>
        </div>

        <!-- ПРАВАЯ ПАНЕЛЬ: Инструменты анализа -->
        <div class="right-panel">
            <div v-if="analysisStore.isFullAnalysisRunning" class="full-analysis-progress">
                <div class="progress-label">Анализ партии: {{ analysisStore.fullAnalysisProgress }}%</div>
                <div class="progress-bar">
                    <div class="progress-fill" :style="{ width: analysisStore.fullAnalysisProgress + '%' }"></div>
                </div>
            </div>

            <!-- Блок движка (Расширен новым компонентом) -->
            <div class="engine-section">
                <EngineOutput :lines="analysisStore.engineLines" :is-thinking="analysisStore.isThinking"
                    :depth="analysisStore.depth" />

                <!-- ВСТАВКА: Пояснение позиции (аккуратно вписано в блок движка) -->
                <PositionDescription v-if="analysisStore.engineLines.length > 0" :segments="descriptionSegments"
                    @make-move="onUserMove" />

                <div class="engine-footer">
                    <button class="toggle-analysis-btn" :class="{ is_thinking: analysisStore.isThinking }"
                        @click="toggleAnalysis">
                        {{ analysisStore.isThinking ? 'Stop Engine' : 'Cloud Analysis' }}
                    </button>
                </div>
            </div>

            <!-- Список ходов (Остается на своем месте) -->
            <div class="moves-section">
                <MovesList :moves="analysisStore.history" :currentIndex="analysisStore.currentStepIndex"
                    :status="'active'" :winner="null" @select="analysisStore.goToStep" @prev="analysisStore.prevMove"
                    @next="analysisStore.nextMove" />
            </div>

            <!-- Контроллер доски (Остается внизу) -->
            <div class="controller-section">
                <BoardController :has-previous="analysisStore.currentStepIndex > -1"
                    :has-next="analysisStore.currentStepIndex < analysisStore.history.length - 1"
                    @first="analysisStore.goToStep(-1)" @prev="analysisStore.prevMove" @next="analysisStore.nextMove"
                    @last="analysisStore.goToStep(analysisStore.history.length - 1)"
                    @flip="analysisStore.orientation = analysisStore.orientation === 'white' ? 'black' : 'white'"
                    @resign="onResignClick" />
            </div>
        </div>
        <MaiaLoaderModal 
      :status="analysisStore.maiaStatus"
      :progress="analysisStore.maiaProgress"
      @download="analysisStore.downloadMaia"
      @close="analysisStore.skipMaia"
    />
    </div>
</template>

<script setup lang="ts">
import { onMounted, computed, watch } from 'vue';
import { useRoute } from 'vue-router';
import ChessBoard from '../components/Board/ChessBoard.vue';
import EvalBar from '../components/Analysis/EvalBar.vue';
import EngineOutput from '../components/Analysis/EngineOutput.vue';
import MovesList from '../components/Board/MovesList.vue';
import BoardController from '../components/Board/BoardController.vue';
import PositionDescription from '../components/Analysis/PositionDescription.vue'; // Импорт компонента
import { useAnalysisStore } from '../stores/analysis';
import { describePosition } from '../lib/engine/describer'; // Импорт логики описания
import MaiaLoaderModal from '../components/Analysis/MaiaLoaderModal.vue';

const analysisStore = useAnalysisStore();
const route = useRoute();

// Логика формирования текстовых сегментов для PositionDescription
const descriptionSegments = computed(() => {
  // Если идет полный анализ, возвращаем пустой массив (ничего не считаем)
  if (analysisStore.isFullAnalysisRunning || analysisStore.engineLines.length === 0) {
    return [];
  }

  const evals: Record<string, number> = {};
  analysisStore.engineLines.forEach(line => {
    const firstMove = line.pv.split(' ')[0];
    if (firstMove) {
      let score = parseFloat(line.score);
      if (line.score.includes('#')) {
        score = line.score.includes('-') ? -1000 : 1000;
      } else {
        score = Math.round(score * 100);
      }
      evals[firstMove] = score;
    }
  });

  return describePosition(
    analysisStore.currentFen,
    evals,
    analysisStore.analyzingTurn === 'w'
  ).segments;
});

const nextMoveInHistory = computed(() => {
    const nextStep = analysisStore.history[analysisStore.currentStepIndex + 1];
    return nextStep ? nextStep.uci : null;
});

function onUserMove(uci: string) {
    analysisStore.makeMove(uci);
}

function toggleAnalysis() {
    if (analysisStore.isThinking) {
        analysisStore.stopAnalysis();
    } else {
        analysisStore.analyzeFen(analysisStore.currentFen);
    }
}

function onResignClick() {
    if (confirm('Очистить анализ и начать заново?')) {
        analysisStore.initNewGame();
    }
}

async function initAnalysis() {
    const gameId = route.params.id;

    if (gameId) {
        // Если есть ID — загружаем из БД
        await analysisStore.loadGameById(Number(gameId));
    } else {
        // Если нет — чистая доска
        analysisStore.initNewGame();
    }
}

onMounted(() => {
    analysisStore.initEngine();
    initAnalysis();
});

watch(() => route.params.id, () => {
    initAnalysis();
});

</script>

<style scoped>
/* Стили остаются без изменений, добавляем только косметику для нового блока */

.analysis-layout {
    display: flex;
    justify-content: center;
    align-items: flex-start;
    gap: 16px;
    padding: 20px;
    max-width: 1400px;
    margin: 0 auto;
    height: calc(100vh - 100px);
    box-sizing: border-box;
}

.left-panel {
    width: 35px;
    height: 600px;
}

.eval-wrapper {
    height: 100%;
}

.center-panel {
    flex: 0 1 600px;
}

.board-container {
    width: 100%;
    aspect-ratio: 1/1;
    box-shadow: 0 8px 24px rgba(0, 0, 0, 0.4);
}

.right-panel {
    width: 380px;
    height: 600px;
    display: flex;
    flex-direction: column;
    gap: 12px;
}

.engine-section {
    background: #262421;
    border-radius: 8px;
    overflow: hidden;
    border: 1px solid #333;
    display: flex;
    flex-direction: column;
}

/* Стилизация PositionDescription внутри блока движка */
:deep(.description-box) {
    border-top: 1px solid #333;
    border-bottom: 1px solid #333;
    background: #2a2825;
    padding: 10px;
    font-size: 13px;
}

.engine-footer {
    padding: 8px;
    background: #2a2825;
}

.toggle-analysis-btn {
    width: 100%;
    padding: 6px;
    background: #3c3934;
    color: #bababa;
    border: 1px solid #45423e;
    border-radius: 4px;
    cursor: pointer;
    font-size: 13px;
    transition: all 0.2s;
}

.toggle-analysis-btn.is_thinking {
    background: #4a6fa5;
    color: white;
    border-color: #5d82b8;
}

.moves-section {
    flex: 1;
    background: #262421;
    border-radius: 8px;
    overflow: hidden;
    border: 1px solid #333;
}

.controller-section {
    background: #262421;
    padding: 12px;
    border-radius: 8px;
    border: 1px solid #333;
}

:deep(.controller button:last-child) {
    display: none;
}

.full-analysis-progress {
  padding: 10px;
  background: #262421;
  border: 1px solid #4a6fa5;
  border-radius: 4px;
  margin-bottom: 8px;
}
.progress-label {
  font-size: 12px;
  color: #bababa;
  margin-bottom: 5px;
}
.progress-bar {
  height: 4px;
  background: #333;
  border-radius: 2px;
  overflow: hidden;
}
.progress-fill {
  height: 100%;
  background: #4a6fa5;
  transition: width 0.3s ease;
}

@media (max-width: 1024px) {
    .analysis-layout {
        flex-direction: column;
        align-items: center;
        height: auto;
    }

    .left-panel {
        display: none;
    }

    .right-panel {
        width: 100%;
        max-width: 600px;
    }
}
</style>