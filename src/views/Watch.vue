<template>
  <div class="modal-overlay">
    <div class="modal">

      <!-- HEADER -->
      <div class="modal-header">
        <h2>Параметры игры</h2>
        <button class="close-btn" @click="$emit('close')">✕</button>
      </div>

      <!-- MODE SWITCH -->
      <div class="mode-switch">
        <button
          :class="{ active: mode === 'online' }"
          @click="mode = 'online'"
        >
          Онлайн
        </button>

        <button
          :class="{ active: mode === 'bot' }"
          @click="mode = 'bot'"
        >
          С ботом
        </button>
      </div>

      <!-- ONLINE SETTINGS -->
      <div v-if="mode === 'online'" class="section">
        <div class="preset-grid">
          <button
            v-for="preset in presets"
            :key="preset.label"
            class="preset-card"
            @click="selectPreset(preset)"
          >
            {{ preset.label }}
          </button>
        </div>
      </div>

      <!-- BOT SETTINGS -->
      <div v-else class="section">

        <!-- Time -->
        <div class="control">
          <label>Время на партию: {{ time }} мин</label>
          <input
            type="range"
            min="1"
            max="60"
            v-model="time"
          />
        </div>

        <!-- Increment -->
        <div class="control">
          <label>Добавление: {{ increment }} сек</label>
          <input
            type="range"
            min="0"
            max="30"
            v-model="increment"
          />
        </div>

        <!-- Difficulty -->
        <div class="control">
          <label>Сложность бота</label>
          <select v-model="difficulty">
            <option value="easy">Лёгкий</option>
            <option value="medium">Средний</option>
            <option value="hard">Сложный</option>
          </select>
        </div>

        <!-- Color -->
        <div class="color-select">
          <div
            :class="['color', { active: color === 'white' }]"
            @click="color = 'white'"
          >
            ♙
          </div>

          <div
            :class="['color black', { active: color === 'black' }]"
            @click="color = 'black'"
          >
            ♟
          </div>
        </div>

      </div>

      <!-- FOOTER -->
      <div class="footer">
        <button class="start-btn" @click="startGame">
          Начать игру
        </button>
      </div>

    </div>
  </div>
</template>

<script setup lang="ts">
import { ref } from "vue"

type Mode = "online" | "bot"

const mode = ref<Mode>("online")

// ONLINE
const presets = [
  { label: "1 + 0", time: 1, increment: 0 },
  { label: "3 + 0", time: 3, increment: 0 },
  { label: "3 + 2", time: 3, increment: 2 },
  { label: "5 + 0", time: 5, increment: 0 },
  { label: "10 + 0", time: 10, increment: 0 },
  { label: "30 + 0", time: 30, increment: 0 },
]

// BOT
const time = ref(10)
const increment = ref(0)
const difficulty = ref("medium")
const color = ref<"white" | "black">("white")

function selectPreset(preset: any) {
  console.log("Selected preset:", preset)
}

function startGame() {
  if (mode.value === "online") {
    console.log("Start ONLINE game")
  } else {
    console.log("Start BOT game", {
      time: time.value,
      increment: increment.value,
      difficulty: difficulty.value,
      color: color.value
    })
  }
}
</script>

<style scoped>
.modal-overlay {
  position: fixed;
  inset: 0;
  background: rgba(0,0,0,0.6);
  display: flex;
  align-items: center;
  justify-content: center;
}

.modal {
  width: 500px;
  padding: 24px;
  border-radius: 20px;
  background: linear-gradient(180deg,#1f1333,#2a1a4d);
  color: white;
}

.modal-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.close-btn {
  background: none;
  border: none;
  color: white;
  font-size: 18px;
  cursor: pointer;
}

/* MODE SWITCH */
.mode-switch {
  display: flex;
  gap: 10px;
  margin: 20px 0;
}

.mode-switch button {
  flex: 1;
  padding: 10px;
  border-radius: 10px;
  border: none;
  background: #3a2a5f;
  color: white;
  cursor: pointer;
}

.mode-switch button.active {
  background: #6b4fd8;
}

/* PRESETS */
.preset-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 12px;
}

.preset-card {
  padding: 20px;
  border-radius: 12px;
  background: #ddd;
  color: black;
  font-weight: bold;
  cursor: pointer;
}

/* BOT CONTROLS */
.control {
  margin-bottom: 20px;
}

input[type="range"] {
  width: 100%;
}

.color-select {
  display: flex;
  justify-content: center;
  gap: 40px;
  margin-top: 20px;
}

.color {
  font-size: 50px;
  cursor: pointer;
  opacity: 0.5;
}

.color.active {
  opacity: 1;
  transform: scale(1.1);
}

.color.black {
  color: black;
}

.footer {
  margin-top: 30px;
  text-align: center;
}

.start-btn {
  padding: 12px 24px;
  border-radius: 10px;
  border: none;
  background: #6b4fd8;
  color: white;
  font-weight: bold;
  cursor: pointer;
}
</style>