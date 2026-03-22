<template>
  <div class="description-box">
    <div class="description-content">
      <template v-for="(seg, i) in segments" :key="i">
        <span v-if="seg.type === 'text'">{{ seg.content }}</span>
        <button 
          v-else 
          class="move-btn"
          @click="$emit('makeMove', seg.uci)"
        >
          {{ seg.content }}
        </button>
      </template>
    </div>
  </div>
</template>

<script setup lang="ts">
import type { DescriptionSegment } from '../../lib/engine/describer';

defineProps<{
  segments: DescriptionSegment[]
}>();

defineEmits(['makeMove']);
</script>

<style scoped>
.description-box {
  background: #2a2825;
  border-left: 3px solid #95bb4a;
  padding: 12px;
  font-size: 14px;
  line-height: 1.5;
  color: #ddd;
}
.move-btn {
  background: #383633;
  border: none;
  color: #95bb4a;
  font-weight: bold;
  padding: 2px 6px;
  border-radius: 4px;
  cursor: pointer;
  margin: 0 2px;
}
.move-btn:hover {
  background: #45433f;
}
</style>