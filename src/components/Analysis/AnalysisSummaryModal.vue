<template>
  <Teleport to="body">
    <div v-if="show" class="modal-overlay" @click.self="$emit('close')">
      <div class="summary-card">
        <button class="close-btn" @click="$emit('close')">×</button>
        
        <div class="summary-header">
          <h2>Итоги анализа</h2>
          <p>Сравнение игры со Stockfish 17 и Maia</p>
        </div>

        <div class="players-results">
          <!-- Итерируемся по массиву SIDES из скрипта -->
          <div v-for="side in SIDES" :key="side" :class="['player-res', side]">
            <div class="player-label">{{ side === 'white' ? 'Белые' : 'Черные' }}</div>
            
            <div class="accuracy-circle">
               <svg viewBox="0 0 36 36" class="circular-chart">
                <path class="circle-bg" d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" />
                <path 
                  class="circle" 
                  :stroke-dasharray="data[side].sfAccuracy + ', 100'" 
                  d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" 
                />
                <text x="18" y="20.35" class="percentage">{{ data[side].sfAccuracy }}%</text>
              </svg>
              <div class="label">Точность</div>
            </div>

            <div class="elo-info">
              <div class="elo-val">{{ data[side].elo }}</div>
              <div class="elo-label">Maia ELO</div>
            </div>

            <div class="mistakes-row">
              <span class="m-item blunder" title="Зевки">{{ data[side].blunders }}</span>
              <span class="m-item mistake" title="Ошибки">{{ data[side].mistakes }}</span>
            </div>
          </div>
        </div>

        <div class="summary-footer">
          <button class="done-btn" @click="$emit('close')">Завершить обзор</button>
        </div>
      </div>
    </div>
  </Teleport>
</template>

<script setup lang="ts">
// Выносим массив в константу скрипта
const SIDES = ['white', 'black'] as const;

defineProps<{
  show: boolean;
  data: {
    white: { elo: number, accuracy: number, sfAccuracy: number, blunders: number, mistakes: number };
    black: { elo: number, accuracy: number, sfAccuracy: number, blunders: number, mistakes: number };
  }
}>();

defineEmits(['close']);
</script>

<style scoped>
/* Ваши стили из предыдущего сообщения без изменений */
.modal-overlay {
  position: fixed;
  top: 0; left: 0; width: 100%; height: 100%;
  background: rgba(0,0,0,0.85);
  display: flex; justify-content: center; align-items: center;
  z-index: 10001;
  backdrop-filter: blur(8px);
}
.summary-card {
  background: #262421;
  border: 1px solid #444;
  border-radius: 12px;
  width: 90%; max-width: 500px;
  padding: 30px;
  position: relative;
}
.close-btn {
  position: absolute; top: 15px; right: 15px;
  background: none; border: none; color: #888;
  font-size: 24px; cursor: pointer;
}
.summary-header { text-align: center; margin-bottom: 25px; }
.summary-header h2 { color: #fff; margin: 0; }
.summary-header p { color: #888; font-size: 13px; margin: 5px 0 0; }

.players-results { display: flex; gap: 20px; margin-bottom: 30px; }
.player-res { flex: 1; text-align: center; padding: 20px; background: #2f2c29; border-radius: 8px; }
.player-label { font-size: 12px; text-transform: uppercase; color: #aaa; margin-bottom: 15px; letter-spacing: 1px; }

.accuracy-circle { width: 90px; margin: 0 auto 10px; }
.circular-chart { display: block; margin: 0 auto; }
.circle-bg { fill: none; stroke: #3a3835; stroke-width: 2.8; }
.circle { fill: none; stroke: #7fa650; stroke-width: 2.8; stroke-linecap: round; transition: stroke-dasharray 1s ease; }
.percentage { fill: #fff; font-size: 9px; font-weight: bold; text-anchor: middle; font-family: sans-serif; }
.label { font-size: 10px; color: #888; margin-top: 5px; }

.elo-info { margin-top: 15px; border-top: 1px solid #3d3a37; padding-top: 15px; }
.elo-val { font-size: 26px; font-weight: bold; color: #4a6fa5; }
.elo-label { font-size: 10px; color: #666; text-transform: uppercase; }

.mistakes-row { display: flex; justify-content: center; gap: 10px; margin-top: 15px; }
.m-item {
  width: 28px; height: 28px; display: flex; align-items: center; justify-content: center;
  border-radius: 6px; font-size: 13px; font-weight: bold; color: #fff;
}
.blunder { background: #b33434; }
.mistake { background: #e6912c; }

.done-btn {
  width: 100%; padding: 14px; background: #4a6fa5; color: #fff;
  border: none; border-radius: 8px; cursor: pointer; font-weight: bold; font-size: 15px;
  transition: background 0.2s;
}
.done-btn:hover { background: #5d82b8; }
</style>