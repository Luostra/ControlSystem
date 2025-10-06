import { defineStore } from 'pinia'
import axios from 'axios'
import { jwtDecode } from 'jwt-decode'

export const useAuthStore = defineStore('auth', {
  state: () => ({
    user: null,
    token: null,
    isLoading: false,
    error: null
  }),
  getters: {
    // Добавляем геттер для проверки аутентификации
    isAuthenticated(state) {
      // Проверяем наличие токена и пользователя
      if (!state.token || !state.user) return false
      
      // Дополнительно можно проверить срок действия токена
      try {
        const decoded = jwtDecode(state.token)
        if (decoded.exp && decoded.exp < Date.now() / 1000) {
          return false
        }
        return true
      } catch {
        return false
      }
    }
  },
  actions: {
    async register(credentials) {
      this.isLoading = true
      this.error = null
      try {
        const response = await axios.post('http://localhost:3000/api/auth/register', credentials)
        this.token = response.data.token
        this.decodeAndSetUser()
        localStorage.setItem('token', this.token)
      } catch (err) {
        this.error = err.response?.data?.message || 'Registration failed'
        throw err
      } finally {
        this.isLoading = false
      }
    },

    async login(credentials) {
      this.isLoading = true
      this.error = null
      try {
        const response = await axios.post('http://localhost:3000/api/auth/login', credentials)
        this.token = response.data.token
        this.decodeAndSetUser()
        localStorage.setItem('token', this.token)
      } catch (err) {
        this.error = err.response?.data?.message || 'Login failed'
        throw err
      } finally {
        this.isLoading = false
      }
    },

    decodeAndSetUser() {
      if (this.token) {
        try {
          const decoded = jwtDecode(this.token)
          this.user = {
            username: decoded.username || decoded.sub
          }
        } catch (err) {
          console.error('Failed to decode token', err)
          this.user = null
        }
      }
    },

    logout() {
      this.token = null
      this.user = null
      localStorage.removeItem('token')
    },

    async checkAuth() {
      const token = localStorage.getItem('token')
      if (token) {
        this.token = token
        this.decodeAndSetUser()
      }
    }
  },
  persist: true
})