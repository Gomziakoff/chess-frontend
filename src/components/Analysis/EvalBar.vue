<template>
  <div class="eval-bar-container" :class="orientation">
    <!-- Белая заливка (преимущество белых) -->
    <div class="white-fill" :style="whiteStyle">
      <span v-if="isWhiteLeading" class="score-text text-black">
        {{ displayScore }}
      </span>
    </div>

    <!-- Текст для черных (когда белая плашка слишком мала) -->
    <div v-if="!isWhiteLeading" class="black-area-text">
      <span class="score-text text-white">
        {{ displayScore }}
      </span>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue';

const props = defineProps<{
  score: number;        // Плюс = белые, Минус = черные
  mate: number | null;  // Плюс = белые, Минус = черные
  orientation: 'white' | 'black';
}>();

const isWhiteLeading = computed(() => (props.mate !== null ? props.mate > 0 : props.score > 0));

const displayScore = computed(() => {
  if (props.mate !== null) return `M${Math.abs(props.mate)}`;
  return Math.abs(props.score).toFixed(1);
});

const whiteStyle = computed(() => {
  let whitePercentage: number;

  if (props.mate !== null) {
    whitePercentage = props.mate > 0 ? 100 : 0;
  } else {
    // 0.0 -> 50%, +4 -> 100%, -4 -> 0%
    whitePercentage = 50 + (props.score / 8) * 50;
    whitePercentage = Math.max(0, Math.min(100, whitePercentage));
  }

  // Если смотрим за черных, инвертируем высоту (белые сверху)
  return {
    height: `${whitePercentage}%`
  };
});
</script>

<style scoped>
.eval-bar-container {
  width: 100%;
  height: 100%;
  background: #262421; /* Зона черных */
  display: flex;
  position: relative;
  overflow: hidden;
  border-radius: 4px;
  /* Белые по умолчанию растут СНИЗУ (для ориентации white) */
  flex-direction: column-reverse;
}

/* Если ориентация BLACK, доска перевернута -> Белые растут СВЕРХУ */
.eval-bar-container.black {
  flex-direction: column;
}

.white-fill {
  background: #f1f1f1;
  width: 100%;
  transition: height 0.4s ease-out;
  display: flex;
  justify-content: center;
  padding: 4px 0;
}

.black-area-text {
  flex: 1;
  display: flex;
  justify-content: center;
  align-items: flex-end; /* Для белой ориентации текст черных внизу */
  padding: 4px 0;
}

/* Позиционирование текста черных при смене ориентации */
.black .black-area-text {
  align-items: flex-start;
}

.score-text {
  font-size: 11px;
  font-weight: bold;
  font-family: sans-serif;
}
.text-black { color: #000; }
.text-white { color: #fff; }
</style>