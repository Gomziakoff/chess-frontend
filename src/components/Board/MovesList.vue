<template>
  <div class="moves-list">
    <!-- Шапка (только для десктопа) -->
    <div v-if="!isMobile" class="grid-header">
      <span class="col-num">#</span>
      <span class="col-move">Белые</span>
      <span class="col-move">Черные</span>
    </div>

    <div 
      ref="movesContainer"
      class="moves-container"
      :class="{ mobile: isMobile }"
      tabindex="0"
      @keydown.left="handleLeft"
      @keydown.right="handleRight"
    >
      <!-- DESKTOP VIEW -->
      <template v-if="!isMobile">
        <div v-if="movePairs.length > 0" class="moves-grid">
          <div 
            v-for="pair in movePairs"
            :key="pair.number"
            class="grid-row"
          >
            <div class="move-number">{{ pair.number }}.</div>

            <!-- Белые -->
            <div
              v-if="pair.white"
              class="move-cell"
              :class="[
                { active: pair.white.index === currentIndex },
                pair.white.classification
              ]"
              @click="select(pair.white.index)"
            >
              <span class="san">{{ pair.white.san }}</span>
              <div v-if="pair.white.classification" class="eval-badge" :title="pair.white.classification">
                {{ getIcon(pair.white.classification) }}
              </div>
            </div>
            <div v-else class="move-cell empty"></div>

            <!-- Черные -->
            <div
              v-if="pair.black"
              class="move-cell"
              :class="[
                { active: pair.black.index === currentIndex },
                pair.black.classification
              ]"
              @click="select(pair.black.index)"
            >
              <span class="san">{{ pair.black.san }}</span>
              <div v-if="pair.black.classification" class="eval-badge" :title="pair.black.classification">
                {{ getIcon(pair.black.classification) }}
              </div>
            </div>
            <div v-else class="move-cell empty"></div>
          </div>
        </div>
        <div v-else class="no-moves">Ходы пока не сделаны</div>
      </template>

      <!-- MOBILE VIEW -->
      <template v-else>
        <div v-if="movesWithMeta.length > 0" class="moves-mobile-row">
          <div
            v-for="move in movesWithMeta"
            :key="move.index"
            class="move-chip"
            :class="[{ active: move.index === currentIndex }, move.classification]"
            @click="select(move.index)"
          >
            <span class="m-num">{{ move.isWhite ? move.moveNumber : '' }}</span>
            <span class="san">{{ move.san }}</span>
            <span v-if="move.classification" class="m-eval">{{ getIcon(move.classification) }}</span>
          </div>
        </div>
        <div v-else class="no-moves">Нет ходов</div>
      </template>
    </div>

    <div v-if="gameResult" class="game-result">
      {{ gameResult }}
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, ref, watch, nextTick, onMounted, onUnmounted } from 'vue'
import { CLASSIFICATION_DATA, type MoveClassification } from '../../lib/engine/describer';

interface Move {
  san: string
  ply: number
  classification?: MoveClassification
}

interface Props {
  moves: Move[]
  currentIndex: number
  status?: string
  winner?: string| null
}

const props = defineProps<Props>()
const emit = defineEmits(['select', 'prev', 'next'])

const movesContainer = ref<HTMLElement | null>(null)
const isMobile = ref(false)

const getIcon = (cls: MoveClassification) => CLASSIFICATION_DATA[cls]?.label || '';

const checkMobile = () => { isMobile.value = window.innerWidth <= 640 }
onMounted(() => {
  checkMobile();
  window.addEventListener('resize', checkMobile);
  scrollToActive();
})
onUnmounted(() => window.removeEventListener('resize', checkMobile))

const movesWithMeta = computed(() => {
  return props.moves.map((step, index) => ({
    ...step,
    index,
    moveNumber: Math.floor((step.ply - 1) / 2) + 1,
    isWhite: step.ply % 2 === 1,
  }))
})

const movePairs = computed(() => {
  const pairs = [];
  const moves = movesWithMeta.value;
  const maxMove = moves.length > 0 ? Math.max(...moves.map(m => m.moveNumber)) : 0;
  for (let i = 1; i <= maxMove; i++) {
    pairs.push({
      number: i,
      white: moves.find(m => m.moveNumber === i && m.isWhite),
      black: moves.find(m => m.moveNumber === i && !m.isWhite)
    });
  }
  return pairs;
})

const gameResult = computed(() => {
  if (props.status === 'active') return null;
  if (props.winner === 'White') return '1-0';
  if (props.winner === 'Black') return '0-1';
  if (props.status === 'draw') return '½-½';
  return null;
})

function select(index: number) { emit('select', index); }
function handleLeft(e: KeyboardEvent) { e.preventDefault(); emit('prev'); }
function handleRight(e: KeyboardEvent) { e.preventDefault(); emit('next'); }

function scrollToActive() {
  nextTick(() => {
    const active = movesContainer.value?.querySelector('.active');
    if (active) {
      active.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
    }
  })
}
watch(() => props.currentIndex, scrollToActive);
watch(() => props.moves.length, scrollToActive);
</script>

<style scoped>
/* Внешний контейнер, который держит размер всей панели анализа */
.moves-wrapper {
  width: 100%;
  height: 450px; /* СТРОГО ФИКСИРОВАННАЯ ВЫСОТА */
  margin: 10px 0;
  display: flex;
}

.moves-list {
  display: flex;
  flex-direction: column; /* Шапка сверху, список в центре, результат снизу */
  width: 100%;
  height: 100%;
  background: #262421;
  border-radius: 4px;
  overflow: hidden;
  border: 1px solid #312e2b;
}

/* Шапка прилипает к верху */
.grid-header {
  display: grid;
  grid-template-columns: 45px 1fr 1fr;
  background: #21201d;
  padding: 10px 0;
  font-size: 12px;
  color: #999;
  font-weight: bold;
  text-align: center;
  border-bottom: 1px solid #312e2b;
  flex-shrink: 0; /* Чтобы не сжималась */
}

/* Центральная часть с прокруткой */
.moves-container {
  flex: 1; /* Занимает всё доступное место между шапкой и подвалом */
  overflow-y: scroll; /* Всегда показываем полосу или auto */
  overflow-x: hidden;
  outline: none;
  background: #262421;
}

/* Стили сетки */
.moves-grid {
  display: flex;
  flex-direction: column;
}

.grid-row {
  display: grid;
  grid-template-columns: 45px 1fr 1fr;
  border-bottom: 1px solid #2a2825;
  min-height: 38px;
}

.grid-row:nth-child(even) {
  background: #2a2825;
}

.move-number {
  display: flex;
  align-items: center;
  justify-content: center;
  background: #21201d;
  color: #7a7875;
  font-size: 13px;
  font-weight: bold;
}

.move-cell {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 0 12px;
  cursor: pointer;
  color: #d5d4d3;
  font-size: 14px;
  font-weight: 600;
  transition: background 0.1s;
}

.move-cell:hover:not(.empty) {
  background: #363330;
}

.move-cell.active {
  background: #4a6fa5 !important;
  color: #fff;
}

/* Классификации */
.eval-badge {
  font-size: 11px;
  width: 18px;
  height: 18px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 50%;
  flex-shrink: 0;
  margin-left: 4px;
}

.brilliant .eval-badge { background: #1baca6; }

.inaccuracy .eval-badge { background: #f0c15c; color: #333; }
.mistake .eval-badge { background: #e58f2a; }
.blunder .eval-badge { background: #ca3431; }

/* Результат прилипает к низу */
.game-result {
  padding: 12px;
  text-align: center;
  background: #21201d;
  font-weight: bold;
  color: #95bb4a;
  border-top: 1px solid #312e2b;
  flex-shrink: 0;
}

.no-moves {
  padding: 40px 20px;
  text-align: center;
  color: #666;
}

/* Скроллбар */
.moves-container::-webkit-scrollbar {
  width: 8px;
}
.moves-container::-webkit-scrollbar-track {
  background: #262421;
}
.moves-container::-webkit-scrollbar-thumb {
  background: #3e3b39;
  border-radius: 4px;
}
.moves-container::-webkit-scrollbar-thumb:hover {
  background: #4e4a47;
}

/* Адаптивность */
@media (max-width: 640px) {
  .moves-wrapper {
    height: 140px; /* На мобилках поменьше */
  }
  .moves-mobile-row {
    display: flex;
    flex-wrap: wrap;
    gap: 4px;
    padding: 8px;
  }
  .move-chip {
    padding: 4px 8px;
    background: #312e2b;
    border-radius: 3px;
    font-size: 13px;
  }
}
</style>