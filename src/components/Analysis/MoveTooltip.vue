<!-- MoveTooltip.vue -->
<template>
  <!-- Телепортируем тултип в body, чтобы он был поверх всех слоев -->
  <Teleport to="body">
    <div 
      class="tooltip-box" 
      :style="floatingStyle"
    >
      <div class="tip-row">
        <span>Maia Prob:</span>
        <span class="val">{{ maiaProb }}%</span>
      </div>
      <div class="tip-row">
        <span>SF Score:</span>
        <span class="val" :class="sfScoreClass">{{ sfScore }}</span>
      </div>
      <div class="tip-row">
        <span>Winrate:</span>
        <span class="val">{{ sfWinrate }}%</span>
      </div>
      <div class="tip-row highlight">
        <span>Eval Loss:</span>
        <span class="val" :class="{ 'bad-loss': evalLoss > 0.4 }">
          {{ evalLoss.toFixed(2) }}
        </span>
      </div>
    </div>
  </Teleport>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import { useAnalysisStore } from '../../stores/analysis';

const props = defineProps<{ 
  move: string,
  // Передаем координаты родительского элемента
  parentRect: DOMRect | null,
  side: 'left' | 'right' 
}>();

const store = useAnalysisStore();

// Вычисляем позицию тултипа относительно окна (fixed)
const floatingStyle = computed(() => {
  if (!props.parentRect) return {};

  const gap = 10;
  const top = props.parentRect.top + props.parentRect.height / 2;
  
  if (props.side === 'right') {
    return {
      top: `${top}px`,
      left: `${props.parentRect.right + gap}px`,
      transform: 'translateY(-50%)'
    };
  } else {
    return {
      top: `${top}px`,
      left: `${props.parentRect.left - gap}px`,
      transform: 'translate( -100%, -50%)'
    };
  }
});

// --- Остальная ваша логика вычислений (без изменений) ---
const maiaProb = computed(() => {
  const m = store.maiaResults.find(r => r.move === props.move);
  return m ? (m.prob * 100).toFixed(1) : '0.0';
});

const sfInfo = computed(() => store.engineLines.find(l => l.pv.startsWith(props.move)));
const sfScore = computed(() => sfInfo.value?.score || '?.??');
const sfWinrate = computed(() => {
  if (!sfInfo.value || sfInfo.value.score.includes('#')) {
    return sfInfo.value?.score.includes('-') ? '0' : '100';
  }
  const cp = parseFloat(sfInfo.value.score) * 100;
  return (50 + 50 * (2 / (1 + Math.exp(-0.003682 * cp)) - 1)).toFixed(1);
});

const evalLoss = computed(() => {
  if (!sfInfo.value || store.engineLines.length === 0) return 0;
  const bestSfScore = parseFloat(store.engineLines[0].score);
  const currentSfScore = parseFloat(sfInfo.value.score);
  if (isNaN(bestSfScore) || isNaN(currentSfScore)) return 0;
  return Math.max(0, (bestSfScore - currentSfScore) * (store.analyzingTurn === 'w' ? 1 : -1));
});

const sfScoreClass = computed(() => {
  if (sfScore.value.startsWith('#')) return 'text-mate';
  return parseFloat(sfScore.value) >= 0 ? 'text-plus' : 'text-minus';
});
</script>

<style scoped>
.tooltip-box {
  position: fixed; /* Используем fixed для игнорирования скролла контейнеров */
  width: 160px;
  background: #1a1a1a;
  border: 1px solid #444;
  padding: 10px;
  border-radius: 4px;
  z-index: 10000; /* Самый высокий приоритет в body */
  box-shadow: 0 8px 24px rgba(0,0,0,0.8);
  pointer-events: none;
}
/* Стили цветов (ваши) */
.tip-row { display: flex; justify-content: space-between; font-size: 11px; margin-bottom: 5px; }
.tip-row span:first-child { color: #888; }
.val { font-weight: bold; color: #fff; font-family: monospace; }
.highlight { border-top: 1px solid #333; margin-top: 8px; padding-top: 6px; }
.bad-loss { color: #ff5555; }
.text-plus { color: #7fa650; }
.text-minus { color: #a54a4a; }
.text-mate { color: #f9d848; }
</style>