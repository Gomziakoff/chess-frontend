<template>
  <div class="player-card">
    <div class="username">{{ player?.username ?? "Anonymous" }}</div>
    <div class="rating">{{ player?.rating ?? 0 }}</div>
    <div class="timer">{{ formatTime(time) }}</div>
  </div>
</template>

<script setup lang="ts">
interface PlayerInfo {
  id: number
  username: string
  rating: number
  color: "white" | "black"
}

interface Props {
  player: PlayerInfo | null
  time?: number
}

const props = defineProps<Props>()

function formatTime(seconds: number | undefined) {
  if (seconds == null) return "0:00"
  const m = Math.floor(seconds / 60)
  const s = seconds % 60
  return `${m}:${s.toString().padStart(2, "0")}`
}
</script>

<style scoped>
.player-card {
  display: flex;
  justify-content: space-between;
  width: 200px;
  padding: 8px 12px;
  background: #f0f0f0;
  border-radius: 6px;
  font-weight: bold;
}

.username {
  font-size: 1rem;
}

.rating {
  font-size: 0.9rem;
  color: #555;
}

.timer {
  font-size: 1rem;
  color: #222;
}
</style>