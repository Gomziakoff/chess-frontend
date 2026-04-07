import axios from 'axios'

export const http = axios.create({
  // Теперь baseURL — это просто путь на том же домене, где висит фронт
  baseURL: '/api/v1', 
  withCredentials: true,
})
