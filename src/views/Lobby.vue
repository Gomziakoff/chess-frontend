<script setup lang="ts">
import { onMounted, onUnmounted, ref } from 'vue'
import { useRouter } from 'vue-router'
import { useSocketStore } from '../stores/socket'
import { useAuthStore } from '../stores/auth'

const router = useRouter()
const auth = useAuthStore()
const socketStore = useSocketStore()

// 🔹 Состояние поиска
const isSearching = ref(false)

// 🔹 Обработчик редиректа (матч найден)
const onRedirect = (payload: any) => {
  const gameId = Number(payload?.gameId)
  if (!gameId) {
    console.error('Invalid gameId:', payload)
    return
  }

  isSearching.value = false // сбрасываем состояние
  socketStore.disconnect()
  router.push(`/game/${gameId}`)
}

// 🔹 Обработчик подтверждения остановки поиска (опционально, если бэк шлёт)
const onSeekStopped = () => {
  console.log('Seek stopped by server')
  isSearching.value = false
}

// 🔹 Переключение: начать / остановить поиск
const toggleSeek = () => {
  if (isSearching.value) {
    // ❌ Остановить поиск
    socketStore.send({ t: 'stop-seek' })
    // Если бэк не шлёт подтверждение — сбрасываем сразу:
    isSearching.value = false
  } else {
    // ✅ Начать поиск
    socketStore.send({
      t: 'seek',
      d: {
        initialTime: 600,
        increment: 30
        // можно добавить: rating, color, rated и т.д.
      }
    })
    isSearching.value = true
  }
}

onMounted(() => {
  if (auth.isAuthenticated) {
    socketStore.connect('lobby')
    socketStore.setLobbyCallback('redirect', onRedirect)
    
    // 🔹 Опционально: если бэк шлёт подтверждение остановки
    socketStore.setLobbyCallback('seek_stopped', onSeekStopped)
    
    // 🔹 Опционально: если бэк шлёт ошибку поиска
    socketStore.setLobbyCallback('error', (payload: any) => {
      console.error('Lobby error:', payload)
      isSearching.value = false
    })
  }
})

onUnmounted(() => {
  socketStore.removeLobbyCallback('redirect', onRedirect)
  socketStore.removeLobbyCallback('seek_stopped', onSeekStopped)
  socketStore.removeLobbyCallback('error', onSeekStopped)
  socketStore.disconnect()
})
</script>

<template>
  <div>
    <h1>Lobby</h1>
    
    <button 
      @click="toggleSeek" 
      :disabled="!socketStore.connected"
      :class="{ searching: isSearching }"
    >
      <span v-if="!socketStore.connected">🔌 Подключение...</span>
      <span v-else-if="isSearching">⏹️ Отменить поиск</span>
      <span v-else>🔍 Найти матч</span>
    </button>
    
    <!-- Опционально: индикатор очереди -->
    <p v-if="isSearching" class="hint">
      Поиск матча 10+30...
    </p>
  </div>
</template>

<style scoped>
button.searching {
  background-color: #f59e0b; /* оранжевый для "отмены" */
  color: white;
}
.hint {
  font-size: 0.9rem;
  color: #666;
  margin-top: 0.5rem;
}
</style>