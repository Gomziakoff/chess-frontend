import { defineStore } from 'pinia'
import { http } from '../api/http'

interface User {
  Id: number
  Username: string
}

export const useAuthStore = defineStore('auth', {
  state: () => ({
    user: null as User | null,
    loading: false,
  }),

  getters: {
    isAuthenticated: (state) => !!state.user,
  },

  actions: {
    async login(email: string, password: string) {
      this.loading = true

      await http.post('auth/login', {
        email,
        password,
      })

      await this.fetchMe()
      this.loading = false
    },

    async register(username: string, email: string, password: string){
      this.loading = true

      await http.post('auth/register', {
        username,
        email,
        password,
      })

      await this.fetchMe()
      this.loading = false
    },

    async fetchMe() {
      try {
        const res = await http.get('auth/me')
        this.user = res.data
      } catch {
        this.user = null
      }
    },

    async logout() {
      await http.post('auth/logout')
      this.user = null
    },
  },
})
