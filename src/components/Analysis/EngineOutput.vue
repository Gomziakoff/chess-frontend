<!-- EngineOutput.vue -->
<template>
  <div class="engine-output">
    <div class="output-header">
      <div class="header-col">Stockfish 17</div>
      <div class="header-col">Maia {{ store.maiaElo }}</div>
    </div>

    <div class="output-content">
      <div class="engine-col">
        <div 
          v-for="(line, index) in sfLines" 
          :key="'sf-' + index" 
          class="move-row"
          @mouseenter="showTooltip($event, 'sf-' + index)"
          @mouseleave="hideTooltip"
          @click="store.makeMove(line.uci)"
        >
          <span class="move-name">{{ getSan(line.uci) }}</span>
          <span class="move-val" :class="getScoreClass(line.score)">{{ line.score }}</span>
          
          <MoveTooltip 
            v-if="hoveredId === 'sf-' + index" 
            :move="line.uci" 
            :parent-rect="activeRect"
            side="right"
          />
        </div>
      </div>

      <div class="engine-col">
        <div 
          v-for="(m, index) in store.maiaResults" 
          :key="'maia-' + index" 
          class="move-row"
          @mouseenter="showTooltip($event, 'maia-' + index)"
          @mouseleave="hideTooltip"
          @click="store.makeMove(m.move)"
        >
          <span class="move-name">{{ getSan(m.move) }}</span>
          <span class="move-val prob">{{ (m.prob * 100).toFixed(1) }}%</span>

          <MoveTooltip 
            v-if="hoveredId === 'maia-' + index" 
            :move="m.move" 
            :parent-rect="activeRect"
            side="left"
          />
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, ref } from 'vue';
import { Chess } from 'chess.js';
import { useAnalysisStore } from '../../stores/analysis';
import MoveTooltip from './MoveTooltip.vue';

const store = useAnalysisStore();
const hoveredId = ref<string | null>(null);
const activeRect = ref<DOMRect | null>(null);

function showTooltip(event: MouseEvent, id: string) {
  hoveredId.value = id;
  // Получаем координаты конкретной строки в момент наведения
  activeRect.value = (event.currentTarget as HTMLElement).getBoundingClientRect();
}

function hideTooltip() {
  hoveredId.value = null;
  activeRect.value = null;
}

function getSan(uci: string) {
  if (!uci) return '...';
  try {
    const tempChess = new Chess(store.currentFen);
    const move = tempChess.move(uci);
    return move ? move.san : uci;
  } catch (e) { return uci; }
}

const sfLines = computed(() => {
  if (!store.engineLines) return [];
  
  return store.engineLines
    .filter(item => item !== undefined && item !== null && item.pv)
    .map(l => {
      const moves = l.pv.split(' ');
      return {
        ...l,
        uci: moves.length > 0 ? moves[0] : ''
      };
    })
    .filter(l => l.uci !== '') // Игнорируем линии без ходов
    .slice(0, 4);
});

function getScoreClass(score: string) {
  if (score?.includes('#')) return 'text-mate';
  return parseFloat(score) >= 0 ? 'text-plus' : 'text-minus';
}
</script>

<style scoped>
/* Ваши старые стили engine-output ... */
.engine-output {
  background: #262421;
  color: #bababa;
  padding: 8px;
  border-radius: 4px;
}
.output-header { display: grid; grid-template-columns: 1fr 1fr; font-size: 11px; margin-bottom: 6px; color: #888; font-weight: bold; }
.output-content { display: grid; grid-template-columns: 1fr 1fr; gap: 8px; }
.engine-col { display: flex; flex-direction: column; gap: 3px; }
.move-row {
  display: flex;
  justify-content: space-between;
  padding: 5px 8px;
  background: #2f2c29;
  border-radius: 3px;
  font-size: 13px;
  cursor: pointer;
  position: relative;
}
.move-row:hover { background: #363330; }
.move-name { font-weight: bold; color: #fff; }
.move-val { font-family: monospace; font-size: 12px; }
.prob { color: #7fa650; }
.text-plus { color: #7fa650; }
.text-minus { color: #a54a4a; }
.text-mate { color: #f9d848; }
</style>