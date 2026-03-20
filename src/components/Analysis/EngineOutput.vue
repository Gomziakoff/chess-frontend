<template>
  <div class="engine-output">
    <div class="output-header">
      <div class="header-col">Stockfish 17</div>
      <div class="header-col">Maia {{ store.maiaElo }}</div>
    </div>

    <div class="output-content">
      <!-- Колонка Stockfish -->
      <div class="engine-col">
        <div 
          v-for="(line, index) in sfLines" 
          :key="'sf-' + index" 
          class="move-row"
          @mouseenter="hoveredId = 'sf-' + index"
          @mouseleave="hoveredId = null"
          @click="store.makeMove(line.uci)"
        >
          <span class="move-name">{{ getSan(line.uci) }}</span>
          <span class="move-val" :class="getScoreClass(line.score)">{{ line.score }}</span>
          
          <MoveTooltip 
            v-if="hoveredId === 'sf-' + index" 
            :move="line.uci" 
            side="right"
          />
        </div>
      </div>

      <!-- Колонка Maia -->
      <div class="engine-col">
        <div 
          v-for="(m, index) in store.maiaResults" 
          :key="'maia-' + index" 
          class="move-row"
          @mouseenter="hoveredId = 'maia-' + index"
          @mouseleave="hoveredId = null"
          @click="store.makeMove(m.move)"
        >
          <span class="move-name">{{ getSan(m.move) }}</span>
          <span class="move-val prob">{{ (m.prob * 100).toFixed(1) }}%</span>

          <MoveTooltip 
            v-if="hoveredId === 'maia-' + index" 
            :move="m.move" 
            side="left"
          />
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, ref } from 'vue';
import { Chess } from 'chess.js'; // Импортируем прямо сюда
import { useAnalysisStore } from '../../stores/analysis';
import MoveTooltip from './MoveTooltip.vue';

const store = useAnalysisStore();
const hoveredId = ref<string | null>(null);

// Функция-переводчик UCI -> SAN
function getSan(uci: string) {
  if (!uci) return '...';
  try {
    const tempChess = new Chess(store.currentFen);
    const move = tempChess.move(uci);
    return move ? move.san : uci;
  } catch (e) {
    return uci;
  }
}

const sfLines = computed(() => {
  return store.engineLines.slice(0, 4).map(l => ({
    ...l,
    uci: l.pv.split(' ')[0] // Извлекаем первый ход из PV
  }));
});

function getScoreClass(score: string) {
  if (score?.includes('#')) return 'text-mate';
  return parseFloat(score) >= 0 ? 'text-plus' : 'text-minus';
}
</script>

<style scoped>
.engine-output {
  background: #262421;
  color: #bababa;
  padding: 8px;
  border-radius: 4px;
  /* Важно для тултипов */
  overflow: visible; 
  position: relative;
  z-index: 100;
}
.output-header {
  display: grid;
  grid-template-columns: 1fr 1fr;
  font-size: 11px;
  margin-bottom: 6px;
  color: #888;
  font-weight: bold;
}
.output-content {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 8px;
  overflow: visible;
}
.engine-col {
  display: flex;
  flex-direction: column;
  gap: 3px;
  overflow: visible;
}
.move-row {
  display: flex;
  justify-content: space-between;
  padding: 5px 8px;
  background: #2f2c29;
  border-radius: 3px;
  font-size: 13px;
  cursor: pointer;
  position: relative; /* Чтобы тултип прилипал к строке */
}
.move-row:hover {
  background: #363330;
}
.move-name { font-weight: bold; color: #fff; font-family: sans-serif; }
.move-val { font-family: monospace; font-size: 12px; }
.prob { color: #7fa650; }
.text-plus { color: #7fa650; }
.text-minus { color: #a54a4a; }
.text-mate { color: #f9d848; }
</style>