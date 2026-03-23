<script setup lang="ts">
// ОБЯЗАТЕЛЬНО: принимаем данные из родителя
defineProps<{
  moves: any[];
  currentIndex: number;
}>();

defineEmits(['select']);
</script>

<template>
  <div class="humanity-list">
    <div class="list-header">
      <div class="col">Ход</div>
      <div class="col">SF Ранг</div>
      <div class="col">Human %</div>
      <div class="col">Вердикт</div>
    </div>
    <div class="list-body">
      <!-- Теперь moves будет доступен -->
      <div 
        v-for="(step, idx) in moves" 
        :key="idx" 
        class="step-row"
        :class="{ active: idx === currentIndex, 'is-suspicious': step.isSuspicious }"
        @click="$emit('select', idx)"
      >
        <div class="col move-name">{{ step.ply }}. {{ step.san }}</div>
        
        <div class="col sf-rank">
          <span v-if="step.sfRank" :class="'rank-' + (step.sfRank <= 4 ? step.sfRank : 'other')">
            Top {{ step.sfRank }}
          </span>
          <span v-else class="not-in-top">—</span>
        </div>

        <div class="col humanity-val">
          <div class="mini-prob-bar">
            <div class="fill" :style="{ width: (step.maiaProb || 0) + '%' }"></div>
          </div>
          {{ step.maiaProb || 0 }}%
        </div>

        <div class="col verdict">
          <span v-if="step.isSuspicious" class="badge suspicious">🤖 Engine</span>
          <span v-else-if="step.maiaProb && step.maiaProb > 30" class="badge human">👤 Human</span>
          <span v-else class="badge neutral">Neutral</span>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
/* Добавьте стиль для рангов выше 4-го */
.rank-other { background: #555; color: #ccc; }
.humanity-list { background: #262421; border-radius: 8px; font-size: 13px; }
.list-header { display: grid; grid-template-columns: 80px 80px 100px 1fr; padding: 10px; border-bottom: 1px solid #333; color: #888; font-weight: bold; }
.step-row { display: grid; grid-template-columns: 80px 80px 100px 1fr; padding: 10px; cursor: pointer; border-bottom: 1px solid #2a2825; align-items: center; }
.step-row:hover { background: #2f2c29; }
.step-row.active { background: #3c3934; }
.step-row.is-suspicious { background: rgba(179, 52, 52, 0.1); }

.move-name { font-weight: bold; color: #fff; }
.sf-rank span { padding: 2px 6px; border-radius: 4px; font-size: 11px; }
.rank-1 { background: #7fa650; color: #fff; }
.rank-2, .rank-3, .rank-4 { background: #4a6fa5; color: #fff; }

.mini-prob-bar { width: 40px; height: 4px; background: #333; border-radius: 2px; overflow: hidden; display: inline-block; margin-right: 5px; }
.mini-prob-bar .fill { height: 100%; background: #7fa650; }

.badge { padding: 3px 8px; border-radius: 10px; font-size: 10px; font-weight: bold; text-transform: uppercase; }
.suspicious { background: #b33434; color: #fff; }
.human { background: #1e3a5f; color: #fff; }
.neutral { color: #666; }
</style>