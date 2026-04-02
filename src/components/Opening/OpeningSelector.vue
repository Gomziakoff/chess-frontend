<template>
  <Teleport to="body">
    <div class="modal-overlay" v-if="show" @click.self="$emit('close')">
      <div class="selector-card">
        <!-- Кнопка закрытия -->
        <button class="close-x" @click="$emit('close')">×</button>

        <div class="modal-content">
          <!-- Левая часть: Предпросмотр -->
          <div class="preview-side">
            <div class="board-outer">
              <div class="preview-board-wrapper">
                <ChessBoard 
                  :fen="currentPreviewFen" 
                  :orientation="form.color"
                  :allow-moves="false"
                  :coordinates="false"
                />
              </div>
            </div>
            <div class="preview-info">
              <div class="op-badge">Предпросмотр</div>
              <h4>{{ selectedOpening?.name }}</h4>
              <p v-if="selectedVariation">{{ selectedVariation.name }}</p>
              <p v-else class="main-line">Основная линия</p>
            </div>
          </div>

          <!-- Правая часть: Настройки -->
          <div class="settings-side">
            <div class="settings-container">
              <h2 class="title">Тренировка дебюта</h2>

              <div class="field">
                <label>Выберите дебют</label>
                <select v-model="form.openingId" @change="form.variationId = ''">
                  <option v-for="op in openings" :key="op.id" :value="op.id">
                    {{ op.name }}
                  </option>
                </select>
              </div>

              <div class="field" v-if="selectedOpening?.variations?.length">
                <label>Вариация</label>
                <select v-model="form.variationId">
                  <option value="">Основная линия</option>
                  <option v-for="v in selectedOpening.variations" :key="v.id" :value="v.id">
                    {{ v.name }}
                  </option>
                </select>
              </div>

              <div class="field">
                <label>Глубина: {{ form.targetMoves }} полуходов</label>
                <div class="range-wrapper">
                   <input type="range" v-model.number="form.targetMoves" min="2" max="20" />
                </div>
              </div>

              <div class="field">
                <label>Ваша сторона</label>
                <div class="color-toggle">
                  <button :class="{ active: form.color === 'white' }" @click="form.color = 'white'">Белые</button>
                  <button :class="{ active: form.color === 'black' }" @click="form.color = 'black'">Черные</button>
                </div>
              </div>

              <div class="actions">
                <button class="start-btn" @click="start">Начать игру</button>
                <button class="cancel-link" @click="$emit('close')">Отмена</button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </Teleport>
</template>

<script setup lang="ts">
import { reactive, computed } from 'vue';
import openings from '../../constants/openings.json';
import ChessBoard from '../Board/ChessBoard.vue';

defineProps<{ show: boolean }>();
const emit = defineEmits(['start', 'close']);

const form = reactive({
  openingId: openings[0].id,
  variationId: '',
  targetMoves: 8,
  color: 'white' as 'white' | 'black'
});

const selectedOpening = computed(() => openings.find(o => o.id === form.openingId));
const selectedVariation = computed(() => 
  selectedOpening.value?.variations?.find(v => v.id === form.variationId) || null
);
const currentPreviewFen = computed(() => selectedVariation.value ? selectedVariation.value.fen : (selectedOpening.value?.fen || ''));

function start() {
  emit('start', { fen: currentPreviewFen.value, target: form.targetMoves, color: form.color });
}
</script>

<style scoped>
.modal-overlay {
  position: fixed; top: 0; left: 0; width: 100%; height: 100%;
  background: rgba(0,0,0,0.85); display: flex; justify-content: center; align-items: center;
  z-index: 10000; backdrop-filter: blur(8px); padding: 20px;
}

.selector-card {
  background: #262421; border: 1px solid #444; border-radius: 12px;
  width: 100%; max-width: 850px; /* Увеличили ширину */
  min-height: 500px; /* Установили минимальную высоту */
  position: relative; overflow: hidden;
  box-shadow: 0 20px 60px rgba(0,0,0,0.6);
}

.close-x {
  position: absolute; top: 15px; right: 20px; background: none; border: none;
  color: #888; font-size: 32px; cursor: pointer; z-index: 10; line-height: 1;
}
.close-x:hover { color: #fff; }

.modal-content {
  display: flex;
  flex-direction: row;
  min-height: 500px;
}

/* ЛЕВАЯ СТОРОНА: ПРЕДПРОСМОТР */
.preview-side {
  flex: 1.1; background: #1a1917; padding: 40px;
  display: flex; flex-direction: column; align-items: center; justify-content: center;
  border-right: 1px solid #333;
}

.board-outer {
  width: 100%; max-width: 340px; /* Фиксируем размер обертки */
  aspect-ratio: 1/1;
  background: #222; padding: 5px; border-radius: 4px;
}

.preview-board-wrapper {
  width: 100%;
  height: 100%;
  max-width: min(600px, 100%);
  max-height: min(600px, 100%);
  aspect-ratio: 1 / 1;
  display: flex;
}

.preview-info { text-align: center; margin-top: 25px; }
.op-badge { display: inline-block; padding: 2px 8px; background: #333; color: #888; border-radius: 4px; font-size: 10px; font-weight: bold; text-transform: uppercase; margin-bottom: 8px;}
.preview-info h4 { margin: 0; color: #fff; font-size: 20px; }
.preview-info p { color: #95bb4a; margin: 5px 0 0; font-weight: bold; font-size: 15px;}
.preview-info .main-line { color: #666; font-style: italic; font-weight: normal; }

/* ПРАВАЯ СТОРОНА: НАСТРОЙКИ */
.settings-side {
  flex: 1; padding: 40px; background: #262421;
  display: flex; flex-direction: column; justify-content: center;
}

.settings-container {
  max-width: 320px; margin: 0 auto; width: 100%;
}

.title { color: #fff; margin: 0 0 30px; font-size: 24px; font-weight: 800; }

.field { margin-bottom: 22px; display: flex; flex-direction: column; gap: 8px; }
.field label { color: #888; font-size: 11px; font-weight: bold; text-transform: uppercase; letter-spacing: 1px; }

select {
  background: #312e2b; border: 1px solid #444; color: #fff; padding: 12px;
  border-radius: 6px; font-size: 14px; outline: none; cursor: pointer;
}

.color-toggle { display: flex; gap: 10px; }
.color-toggle button {
  flex: 1; padding: 12px; background: #312e2b; border: 1px solid #444;
  color: #888; cursor: pointer; border-radius: 6px; font-weight: bold; transition: all 0.2s;
}
.color-toggle button.active { background: #4a6fa5; color: #fff; border-color: #5d82b8; }

.actions { display: flex; flex-direction: column; gap: 12px; margin-top: 30px; }

.start-btn {
  padding: 16px; background: #95bb4a; border: none; color: #fff;
  font-weight: bold; border-radius: 6px; cursor: pointer; font-size: 16px;
  box-shadow: 0 4px 15px rgba(149, 187, 74, 0.2);
}
.start-btn:hover { background: #a8d155; transform: translateY(-1px); }

.cancel-link {
  background: none; border: none; color: #666; cursor: pointer; font-size: 13px; text-decoration: underline;
}
.cancel-link:hover { color: #888; }

/* АДАПТИВНОСТЬ */
@media (max-width: 768px) {
  .modal-content { flex-direction: column; min-height: auto; }
  .selector-card { max-width: 450px; height: 90vh; overflow-y: auto; }
  .preview-side { border-right: none; border-bottom: 1px solid #333; padding: 30px; flex: none; }
  .board-outer { max-width: 260px; }
  .settings-side { padding: 30px; flex: none; }
}
</style>