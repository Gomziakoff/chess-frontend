<template>
  <div class="engine-output">
    <div class="engine-header">
      <span class="engine-name">Stockfish 16.1</span>
      <span v-if="isThinking" class="engine-depth">Глубина {{ depth }}</span>
    </div>
    
    <div class="lines">
      <div v-for="line in sortedLines" :key="line.multipv" class="line-row">
        <span class="line-score" :class="getScoreColorClass(line.score)">
          {{ line.score }}
        </span>
        <span class="line-pv">{{ truncatePv(line.pv) }}</span>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue';

// Описываем интерфейс линии прямо здесь или импортируем из типов
interface EngineLine {
  depth: number;
  multipv: number;
  score: string;
  pv: string;
}

const props = defineProps<{
  lines: EngineLine[];
  isThinking: boolean;
  depth: number;
}>();

const sortedLines = computed(() => {
  return [...props.lines]
    .filter(l => l && l.score)
    .sort((a, b) => a.multipv - b.multipv);
});

function getScoreColorClass(score: string) {
  if (score.includes('#')) return 'score-mate';
  const val = parseFloat(score);
  if (val > 0.4) return 'score-white';
  if (val < -0.4) return 'score-black';
  return '';
}

function truncatePv(pv: string) {
  return pv ? pv.split(' ').slice(0, 5).join(' ') + '...' : '...';
}
</script>

<style scoped>
.engine-output {
  background: #262421;
  color: #bababa;
  padding: 10px;
  font-size: 13px;
  border-radius: 4px;
  font-family: 'Segoe UI', system-ui, sans-serif;
}
.engine-header {
  display: flex;
  justify-content: space-between;
  margin-bottom: 8px;
  border-bottom: 1px solid #333;
  padding-bottom: 4px;
}
.engine-name { font-weight: bold; color: #999; }
.engine-depth { font-size: 11px; color: #666; }

.line-row {
  display: flex;
  gap: 10px;
  margin-bottom: 4px;
  align-items: center;
}
.line-score {
  background: #312e2b;
  padding: 2px 6px;
  border-radius: 3px;
  min-width: 50px;
  text-align: center;
  font-weight: bold;
  font-family: monospace;
}

.score-white { color: #7fa650; } /* Плюс (лучше белым) */
.score-black { color: #a54a4a; } /* Минус (лучше черным) */
.score-mate { color: #f9d848; }

.line-pv {
  color: #888;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}
</style>