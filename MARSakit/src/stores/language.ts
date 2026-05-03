import { defineStore } from 'pinia'
import { ref } from 'vue'

export type LanguageCode = 'en' | 'tl'

const STORAGE_KEY = 'marsakit.language'

export const useLanguageStore = defineStore('language', () => {
  const language = ref<LanguageCode>('en')

  const load = () => {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (raw === 'en' || raw === 'tl') language.value = raw
  }

  const setLanguage = (next: LanguageCode) => {
    language.value = next
    localStorage.setItem(STORAGE_KEY, next)
  }

  // load immediately (runs once per store usage)
  load()

  return { language, setLanguage }
})
