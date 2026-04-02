<template>
  <div class="player-card" :class="{ 'is-turn': isTurn }">
    <div class="player-info">
      <!-- Аватар -->
      <div class="avatar-container">
        <img v-if="player?.avatar" :src="player.avatar" class="avatar" alt="" />
        <div v-else class="avatar-placeholder">
          {{ player?.username?.[0].toUpperCase() ?? '?' }}
        </div>
      </div>

      <!-- Имя и Рейтинг -->
      <div class="user-details">
        <div class="username-row">
          <span class="username">{{ player?.username ?? "Anonymous" }}</span>
          <!-- Отображаем изменение рейтинга, если оно есть -->
          <span v-if="ratingDiff" class="rating-diff" :class="ratingDiff > 0 ? 'pos' : 'neg'">
            {{ ratingDiff > 0 ? '+' : '' }}{{ ratingDiff }}
          </span>
        </div>
        <div class="rating-box">
          <span class="rating">{{ player?.rating ?? 0 }}</span>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
interface PlayerInfo {
  id: number
  username: string
  rating: number
  avatar?: string
  color: "white" | "black"
}

interface Props {
  player: PlayerInfo | null | undefined
  isTurn?: boolean
  ratingDiff?: number | null
}

defineProps<Props>()
</script>

<style scoped>
.player-card {
  display: flex;
  align-items: center;
  width: 100%;
  padding: 8px 12px;
  background: #262421;
  border-radius: 4px;
  color: #bababa;
  border: 1px solid transparent;
  box-sizing: border-box;
}

.player-card.is-turn {
  background: #2a2825;
  border-left: 3px solid #95bb4a;
  color: #fff;
}

.player-info {
  display: flex;
  align-items: center;
  gap: 12px;
}

.avatar-container {
  width: 36px;
  height: 36px;
  flex-shrink: 0;
}

.avatar {
  width: 100%;
  height: 100%;
  border-radius: 3px;
  object-fit: cover;
}

.avatar-placeholder {
  width: 100%;
  height: 100%;
  background: #3e3b39;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 3px;
  font-weight: bold;
  color: #95bb4a;
  font-size: 14px;
}

.user-details {
  display: flex;
  flex-direction: column;
}

.username-row {
  display: flex;
  align-items: center;
  gap: 6px;
}

.username {
  font-size: 0.9rem;
  font-weight: 600;
  max-width: 100px;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.rating {
  font-size: 0.8rem;
  color: #666;
}

.rating-diff {
  font-size: 0.75rem;
  font-weight: bold;
}
.rating-diff.pos { color: #95bb4a; }
.rating-diff.neg { color: #ca3431; }
</style>