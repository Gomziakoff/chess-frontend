<template>
  <div class="game-panel">
    <!-- Список ходов -->
    <div class="moves-section">
      <MovesList />
    </div>

    <!-- Контроллер -->
    <div class="controller-section">
      <BoardController />
    </div>
  </div>
</template>

<script setup lang="ts">
import MovesList from './MovesList.vue'
import BoardController from './BoardController.vue'
</script>

<style scoped>
.game-panel {
  width: 100%;
  max-width: 600px;
  background: #2a2a2a;       /* общий фон */
  border-radius: 8px;        /* скругление всего блока */
  border: 1px solid #404040; /* общая рамка */
  overflow: hidden;
  display: flex;
  flex-direction: column;
  gap: 8px; /* расстояние между секциями */
  color: #fff;
  margin: 10px auto;
  font-family: 'Chess', 'Segoe UI', sans-serif;
}

/* Секция с ходами */
.moves-section {
  padding: 8px;
  max-height: 300px;
  overflow-y: auto;
}

/* Секция с контроллером */
.controller-section {
  padding: 8px;
  border-top: 1px solid #404040; /* разделитель между ходами и контроллером */
  display: flex;
  justify-content: center;
  gap: 6px;
}

/* Для мобильного варианта */
@media (max-width: 640px) {
  .moves-section {
    max-height: 150px;
  }
}
</style>