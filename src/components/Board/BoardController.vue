<template>
  <div class="controller">
    <button @click="$emit('flip')">
      flip
    </button>

    <button
      @click="$emit('first')"
      :disabled="!hasPrevious"
    >
      ⏮
    </button>

    <button
      @click="$emit('prev')"
      :disabled="!hasPrevious"
    >
      ◀
    </button>

    <button
      @click="$emit('next')"
      :disabled="!hasNext"
    >
      ▶
    </button>

    <button
      @click="$emit('last')"
      :disabled="!hasNext"
    >
      ⏭
    </button>
    <button
      @click="$emit('resign')"
    >
      resign
    </button>
  </div>
</template>

<script setup lang="ts">
interface Props {
  hasPrevious: boolean
  hasNext: boolean
}

defineProps<Props>()

defineEmits<{
  (e: 'first'): void
  (e: 'prev'): void
  (e: 'next'): void
  (e: 'last'): void
  (e: 'flip'): void
  (e: 'resign'): void
}>()
</script>

<style scoped>
.controller {
  display: flex;
  justify-content: center;
  align-items: center;
  gap: 8px;
}

/* Базовая кнопка */
.controller button {
  appearance: none;
  border: 1px solid #3a3a3a;
  background: #2b2b2b;
  color: #ddd;

  width: 38px;
  height: 38px;

  border-radius: 8px;
  cursor: pointer;

  font-size: 16px;
  display: flex;
  align-items: center;
  justify-content: center;

  transition: all 0.15s ease;
}

/* Hover */
.controller button:hover:not(:disabled) {
  background: #3a3a3a;
  border-color: #555;
  transform: translateY(-1px);
}

/* Active (нажатие) */
.controller button:active:not(:disabled) {
  transform: translateY(0);
  background: #444;
}

/* Disabled */
.controller button:disabled {
  opacity: 0.35;
  cursor: default;
  transform: none;
}

/* Flip кнопка выделенная */
.controller button:first-child {
  background: #1e3a5f;
  border-color: #2a4e7a;
  color: #fff;
}

.controller button:first-child:hover {
  background: #2a4e7a;
  border-color: #3b6ea8;
}
</style>