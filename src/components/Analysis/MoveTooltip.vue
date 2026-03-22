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
  parentRect: DOMRect | null,
  side: 'left' | 'right' 
}>();

const store = useAnalysisStore();

// 1. Исправляем поиск инфо: добавляем проверку l && l.pv
const sfInfo = computed(() => {
  if (!store.engineLines || store.engineLines.length === 0) return null;
  return store.engineLines.find(l => l && l.pv && l.pv.startsWith(props.move)) || null;
});

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

const maiaProb = computed(() => {
  const m = store.maiaResults.find(r => r.move === props.move);
  return m ? (m.prob * 100).toFixed(1) : '0.0';
});

// 2. Делаем оценку безопасной
const sfScore = computed(() => sfInfo.value?.score || '?.??');

const sfWinrate = computed(() => {
  const info = sfInfo.value;
  if (!info || !info.score) return '50.0';

  if (info.score.includes('#')) {
    return info.score.includes('-') ? '0' : '100';
  }
  
  const cp = parseFloat(info.score) * 100;
  if (isNaN(cp)) return '50.0';
  
  return (50 + 50 * (2 / (1 + Math.exp(-0.003682 * cp)) - 1)).toFixed(1);
});

// 3. Безопасный расчет потери оценки
const evalLoss = computed(() => {
  const info = sfInfo.value;
  const bestLine = store.engineLines.find(l => l && l.score); // Берем первую валидную линию

  if (!info || !bestLine || !info.score || !bestLine.score) return 0;
  
  const bestSfScore = parseFloat(bestLine.score);
  const currentSfScore = parseFloat(info.score);
  
  if (isNaN(bestSfScore) || isNaN(currentSfScore)) return 0;

  // Разница в пешках. Если ход хуже лучшего, результат будет положительным.
  const multiplier = store.analyzingTurn === 'w' ? 1 : -1;
  const diff = (bestSfScore - currentSfScore) * multiplier;
  
  return Math.max(0, diff);
});

const sfScoreClass = computed(() => {
  const score = sfScore.value;
  if (score.startsWith('#')) return 'text-mate';
  const val = parseFloat(score);
  if (isNaN(val)) return '';
  return val >= 0 ? 'text-plus' : 'text-minus';
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