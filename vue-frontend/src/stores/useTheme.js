import { ref, computed } from 'vue'
import { defineStore } from 'pinia'


// Создаем Pinia хранилище для темы
export const useThemeStore = defineStore('theme', () => {

  const isDarkTheme = ref(false)
  
  // Инициализация темы
  const initTheme = () => {
    const savedTheme = localStorage.getItem('primevue-theme')
    if (savedTheme) {
      isDarkTheme.value = savedTheme === 'dark'
    } else {
      // Проверяем системные настройки
      isDarkTheme.value = window.matchMedia('(prefers-color-scheme: dark)').matches
    }
    applyTheme(isDarkTheme.value)
  }
  
  // Применение темы
  const applyTheme = (dark) => {
    const html = document.documentElement
    if (dark) {
      html.classList.add('my-app-dark')
    } else {
      html.classList.remove('my-app-dark')
    }
    localStorage.setItem('primevue-theme', dark ? 'dark' : 'light')
  }
  
  // Переключение темы
  const toggleTheme = () => {
    isDarkTheme.value = !isDarkTheme.value
    applyTheme(isDarkTheme.value)
  }
  
  return { isDarkTheme, initTheme, toggleTheme }
})