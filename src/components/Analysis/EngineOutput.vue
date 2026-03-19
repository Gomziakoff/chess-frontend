<template>
  <div class="engine-output">
    <div class="engine-header">
      <span>Stockfish 16.1</span>
      <span v-if="analysisStore.isThinking">Глубина {{ analysisStore.depth }}</span>
    </div>
    
    <div class="lines">
      <div v-for="line in sortedLines" :key="line.multipv" class="line-row">
        <span class="line-score">{{ line.score }}</span>
        <span class="line-pv">{{ truncatePv(line.pv) }}</span>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { useAnalysisStore } from '../../stores/analysis';
import { computed } from 'vue';

const analysisStore = useAnalysisStore();

const sortedLines = computed(() => {
  return [...analysisStore.engineLines].sort((a, b) => a.multipv - b.multipv);
});

function truncatePv(pv: string) {
  return pv.split(' ').slice(0, 5).join(' ') + '...';
}
</script>

<style scoped>
.engine-output {
  background: #262421;
  color: #bababa;
  font-family: monospace;
  padding: 10px;
  font-size: 13px;
}
.line-row {
  display: flex;
  gap: 10px;
  margin-bottom: 4px;
  border-bottom: 1px solid #333;
}
.line-score {
  background: #403d39;
  padding: 2px 4px;
  border-radius: 3px;
  min-width: 40px;
  text-align: center;
}
</style>