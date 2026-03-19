<template>
  <div class="eval-bar-container">
    <div class="eval-bar-fill" :style="barStyle">
      <span class="eval-text" :class="{ 'text-black': isWhiteAdvantage }">
        {{ displayScore }}
      </span>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue';

const props = defineProps<{
  score: number;
  mate: number | null;
  orientation: 'white' | 'black';
}>();

const isWhiteAdvantage = computed(() => props.score >= 0);

const displayScore = computed(() => {
  if (props.mate !== null) return `M${Math.abs(props.mate)}`;
  return Math.abs(props.score).toFixed(1);
});

const barStyle = computed(() => {
  // Конвертируем оценку в проценты (от -5 до +5 пешек для наглядности)
  let percentage;
  if (props.mate !== null) {
    percentage = props.mate > 0 ? 100 : 0;
  } else {
    percentage = ((props.score + 5) / 10) * 100;
    percentage = Math.max(5, Math.min(95, percentage));
  }

  // Инвертируем если ориентация черных
  if (props.orientation === 'black') percentage = 100 - percentage;

  return {
    height: `${percentage}%`,
    backgroundColor: 'white'
  };
});
</script>

<style scoped>
.eval-bar-container {
  width: 30px;
  height: 100%;
  background-color: #403d39;
  position: relative;
  display: flex;
  flex-direction: column-reverse;
  border-radius: 4px;
  overflow: hidden;
}
.eval-bar-fill {
  transition: height 0.3s ease-out;
  width: 100%;
  display: flex;
  justify-content: center;
  align-items: flex-start;
  padding-top: 5px;
}
.eval-text {
  font-size: 11px;
  font-weight: bold;
  color: #fff;
}
.eval-text.text-black { color: #000; }
</style>