import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import basicSsl from '@vitejs/plugin-basic-ssl'

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    vue(),
    
  ],
  optimizeDeps: {
    exclude: ["onnxruntime-web"]
  },
  server: {
    host: true,
    allowedHosts: [
      'offices-jenny-reid-continuously.trycloudflare.com', // конкретный адрес
      '.trycloudflare.com' // или все поддомены этого сервиса
    ],
    headers: {
      'Cross-Origin-Opener-Policy': 'same-origin',
      'Cross-Origin-Embedder-Policy': 'require-corp',
    },
    proxy: {
      // Обычные HTTP запросы
      '/api/v1': {
        target: 'http://127.0.0.1:8080',
        changeOrigin: true,
        configure: (proxy, _options) => {
           // Это необязательно, но полезно для отладки
        }
      },
      // Настройка для WebSocket
      '/api/v1/ws': {
        target: 'http://127.0.0.1:8080',
        ws: true, // КРИТИЧНО: включаем поддержку веб-сокетов
        changeOrigin: true,
      }
    }
  },
})
