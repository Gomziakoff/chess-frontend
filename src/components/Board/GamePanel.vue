<template>
  <div class="game-panel">
    <!-- Список ходов -->
    <div class="moves-section">
      <MovesList :moves="gameStore.steps" :current-index="gameStore.currentStepIndex" :status="gameStore.status"
        :winner="gameStore?.winner" @select="gameStore.goToStep"
        @prev="gameStore.goToStep(gameStore.currentStepIndex - 1)"
        @next="gameStore.goToStep(gameStore.currentStepIndex + 1)" />
    </div>

    <!-- Контроллер -->
    <div class="controller-section">
      <BoardController :has-previous="gameStore.hasPrevious" :has-next="gameStore.hasNext" @first="gameStore.goToFirst"
        @prev="gameStore.goToPrevious" @next="gameStore.goToNext" @last="gameStore.goToLast"
        @flip="gameStore.flipBoard" @resign="gameStore.sendResign" />
    </div>
  </div>
</template>

<script setup lang="ts">
import MovesList from './MovesList.vue'
import BoardController from './BoardController.vue'
import { useGameStore } from '../../stores/game';

const gameStore = useGameStore()
</script>

<style scoped>
.game-panel {
  width: 100%;
  max-width: 600px;
  height: 100%;
  max-height: 420px;

  background: #1f1f1f;
  border-radius: 12px;
  border: 1px solid #353535;

  display: flex;
  flex-direction: column;

  color: #fff;
  margin: 10px auto;

  box-shadow: 0 10px 30px rgba(0, 0, 0, 0.4);
  overflow: hidden; /* важно */
}

/* Блок с ходами */
.moves-section {
  flex: 1;              /* занимает всё доступное место */
  min-height: 0;        /* важно для корректного скролла во flex */
  padding: 12px;
  display: flex;
  flex-direction: column;
}

/* Убираем скролл отсюда полностью */
.moves-section :deep(.moves-container) {
  flex: 1;
  min-height: 0;
  overflow-y: auto;      /* скролл только тут */
}

/* Контроллер */
.controller-section {
  padding: 12px;
  border-top: 1px solid #353535;

  display: flex;
  justify-content: center;
  gap: 8px;

  background: #232323;
}

/* Скроллбар — аккуратный */
.moves-section :deep(.moves-container::-webkit-scrollbar) {
  width: 6px;
}

.moves-section :deep(.moves-container::-webkit-scrollbar-track) {
  background: transparent;
}

.moves-section :deep(.moves-container::-webkit-scrollbar-thumb) {
  background: #444;
  border-radius: 3px;
}

.moves-section :deep(.moves-container::-webkit-scrollbar-thumb:hover) {
  background: #555;
}

/* Мобильная версия */
@media (max-width: 640px) {
  .game-panel {
    max-width: 100%;
    border-radius: 0;
    max-height: 300px;
  }
}
</style>