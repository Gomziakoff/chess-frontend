import { defineStore } from 'pinia'
import { http } from '../api/http'

export interface User {
  Id: number
  Username: string
  Email: string
  IsGuest: boolean
  EloClassical: number
  EloRapid: number
  EloBlitz: number
  EloBullet: number
  GamesClassical: number
  GamesRapid: number
  GamesBlitz: number
  GamesBullet: number
  AvatarURL: string
  Title: string
  Country: string
  Role: string
  CreatedAt: string
}

export const useAuthStore = defineStore('auth', {
  state: () => ({
    user: null as User | null,
    loading: false,
  }),

  getters: {
    isAuthenticated: (state) => !!state.user,
    isGuest: (state) => !!state.user?.IsGuest
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

    async loginAsGuest() {
        try {
            const response = await http.post('/auth/guest');
            this.user = response.data;
            return true;
        } catch (e) {
            return false;
        }
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
