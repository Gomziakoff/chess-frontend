<template>
  <div class="maia-tester">
    <h1>🧪 Тестирование Maia Chess Model</h1>

    <!-- Статус модели -->
    <section class="status-section">
      <h2>Статус модели</h2>
      <p>
        Текущий статус:
        <strong :class="statusClass">{{ status }}</strong>
      </p>
      <p v-if="errorMessage" class="error">{{ errorMessage }}</p>
      <div class="button-group">
        <button @click="fetchStorageInfo" :disabled="!maiaInstance">
          Информация о хранилище
        </button>
        <button @click="clearStorage" :disabled="!maiaInstance">
          Очистить кэш
        </button>
      </div>
      <div v-if="storageInfo" class="storage-info">
        <h3>Storage Info</h3>
        <pre>{{ JSON.stringify(storageInfo, null, 2) }}</pre>
      </div>
    </section>

    <!-- Одиночная оценка (доступна только когда модель готова) -->
    <section class="evaluate-section">
      <h2>Одиночная оценка позиции</h2>
      <form @submit.prevent="runEvaluate">
        <label>
          FEN:
          <input
            v-model="single.fen"
            placeholder="rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1"
          />
        </label>
        <label>
          ELO себя:
          <input type="number" v-model.number="single.eloSelf" />
        </label>
        <label>
          ELO оппонента:
          <input type="number" v-model.number="single.eloOppo" />
        </label>
        <button type="submit" :disabled="!maiaReady">Оценить</button>
      </form>
      <div v-if="singleResult" class="result">
        <h3>Результат</h3>
        <p><strong>Value (вероятность выигрыша):</strong> {{ singleResult.value }}</p>
        <details>
          <summary>Policy (вероятности ходов)</summary>
          <pre>{{ JSON.stringify(singleResult.policy, null, 2) }}</pre>
        </details>
      </div>
    </section>

    <!-- Пакетная оценка (доступна только когда модель готова) -->
    <section class="batch-section">
      <h2>Пакетная оценка</h2>
      <p>Введите позиции в формате JSON (массив объектов с полями fen, eloSelf, eloOppo):</p>
      <textarea
        v-model="batch.inputJson"
        rows="5"
        placeholder='[{"fen": "8/8/8/8/8/8/8/8 w - - 0 1", "eloSelf": 1500, "eloOppo": 1500}]'
      ></textarea>
      <button @click="runBatchEvaluate" :disabled="!maiaReady">Оценить пакет</button>
      <div v-if="batchResult" class="result">
        <p><strong>Время выполнения:</strong> {{ batchResult.time.toFixed(2) }} мс</p>
        <details>
          <summary>Результаты ({{ batchResult.result.length }})</summary>
          <pre>{{ JSON.stringify(batchResult.result, null, 2) }}</pre>
        </details>
      </div>
    </section>

    <!-- Модальное окно загрузки модели -->
    <div v-if="showModal" class="modal-overlay">
      <div class="modal">
        <h2>⚙️ Загрузка модели Maia</h2>
        <div v-if="status === 'downloading'">
          <p>Идёт загрузка модели... {{ progress }}%</p>
          <progress :value="progress" max="100"></progress>
        </div>
        <div v-else-if="status === 'no-cache'">
          <p>Модель не найдена в кэше. Нажмите «Загрузить», чтобы начать.</p>
          <button @click="downloadModel" :disabled="isDownloading">Загрузить модель</button>
        </div>
        <div v-else-if="status === 'error'">
          <p class="error">Ошибка: {{ errorMessage }}</p>
          <button @click="downloadModel" :disabled="isDownloading">Повторить</button>
        </div>
        <div v-else>
          <p>Проверка наличия модели...</p>
        </div>
        <p v-if="status === 'downloading'" class="hint">Пожалуйста, подождите, это может занять некоторое время.</p>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, computed, onMounted } from 'vue'
import Maia from '../lib/engine/maia'

// Состояние
const status = ref<'loading' | 'no-cache' | 'downloading' | 'ready' | 'error'>('loading')
const progress = ref(0)
const errorMessage = ref('')
const storageInfo = ref<any>(null)
const maiaInstance = ref<Maia | null>(null)

// Ввод для одиночной оценки
const single = reactive({
  fen: 'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1',
  eloSelf: 1500,
  eloOppo: 1500,
})
const singleResult = ref<any>(null)

// Ввод для пакетной оценки
const batch = reactive({
  inputJson: '[{"fen": "8/8/8/8/8/8/8/8 w - - 0 1", "eloSelf": 1500, "eloOppo": 1500}]',
})
const batchResult = ref<{ result: any[]; time: number } | null>(null)

// Вычисляемые свойства
const maiaReady = computed(() => status.value === 'ready' && maiaInstance.value !== null)
const isDownloading = computed(() => status.value === 'downloading')
const showModal = computed(() => status.value !== 'ready')
const statusClass = computed(() => ({
  'status-ready': status.value === 'ready',
  'status-error': status.value === 'error',
  'status-no-cache': status.value === 'no-cache',
  'status-other': true,
}))

// Методы
onMounted(() => {
  initializeMaia()
})

function initializeMaia() {
  try {
    maiaInstance.value = new Maia({
      model: 'https://raw.githubusercontent.com/CSSLab/maia-platform-frontend/e23a50e/public/maia2/maia_rapid.onnx',
      setStatus: (newStatus) => {
        status.value = newStatus
        if (newStatus === 'ready') progress.value = 0
      },
      setProgress: (p) => {
        progress.value = p
        if (p > 0 && p < 100) status.value = 'downloading'
      },
      setError: (err) => {
        errorMessage.value = err
        status.value = 'error'
      },
    })
  } catch (e: any) {
    errorMessage.value = e.message
    status.value = 'error'
  }
}

async function downloadModel() {
  if (!maiaInstance.value) return
  try {
    await maiaInstance.value.downloadModel()
  } catch (e: any) {
    errorMessage.value = e.message
  }
}

async function fetchStorageInfo() {
  if (!maiaInstance.value) return
  try {
    storageInfo.value = await maiaInstance.value.getStorageInfo()
  } catch (e: any) {
    errorMessage.value = e.message
  }
}

async function clearStorage() {
  if (!maiaInstance.value) return
  try {
    await maiaInstance.value.clearStorage()
    storageInfo.value = null
    status.value = 'no-cache'
  } catch (e: any) {
    errorMessage.value = e.message
  }
}

async function runEvaluate() {
  if (!maiaInstance.value) return
  try {
    const result = await maiaInstance.value.evaluate(single.fen, single.eloSelf, single.eloOppo)
    singleResult.value = result
  } catch (e: any) {
    errorMessage.value = e.message
  }
}

async function runBatchEvaluate() {
  if (!maiaInstance.value) return
  try {
    const input = JSON.parse(batch.inputJson)
    if (!Array.isArray(input)) throw new Error('Должен быть массив')
    const boards = input.map((item) => item.fen)
    const eloSelfs = input.map((item) => item.eloSelf)
    const eloOppos = input.map((item) => item.eloOppo)

    const result = await maiaInstance.value.batchEvaluate(boards, eloSelfs, eloOppos)
    batchResult.value = result
  } catch (e: any) {
    errorMessage.value = e.message
  }
}
</script>

<style scoped>
.maia-tester {
  max-width: 900px;
  margin: 0 auto;
  padding: 20px;
  font-family: system-ui, sans-serif;
}
section {
  margin-bottom: 30px;
  padding: 20px;
  border: 1px solid #ddd;
  border-radius: 8px;
}
h2 {
  margin-top: 0;
}
.button-group {
  display: flex;
  gap: 10px;
  flex-wrap: wrap;
}
button {
  padding: 8px 16px;
  color: white;
  border: none;
  border-radius: 4px;
  cursor: pointer;
}
button:disabled {
  background: #ccc;
  cursor: not-allowed;
}
.error {
  color: #d32f2f;
  font-weight: bold;
}
.storage-info {
  margin-top: 15px;
  padding: 10px;
  border-radius: 4px;
}
.result {
  margin-top: 15px;
  padding: 10px;
  border-radius: 4px;
}
.status-ready {
  color: #2e7d32;
}
.status-error {
  color: #d32f2f;
}
.status-no-cache {
  color: #ed6c02;
}
.status-other {
  color: #0288d1;
}
label {
  display: block;
  margin-bottom: 10px;
}
input,
textarea {
  width: 100%;
  padding: 6px;
  margin-top: 4px;
  box-sizing: border-box;
}
textarea {
  font-family: monospace;
}
.modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background: rgba(0, 0, 0, 0.5);
  display: flex;
  justify-content: center;
  align-items: center;
  z-index: 1000;
}
.modal {
  padding: 30px;
  border-radius: 8px;
  max-width: 400px;
  width: 90%;
  box-shadow: 0 2px 10px rgba(0, 0, 0, 0.1);
  text-align: center;
}
.modal progress {
  width: 100%;
  height: 20px;
  margin: 10px 0;
}
.modal .hint {
  font-size: 0.9em;
  color: #666;
  margin-top: 15px;
}
</style>