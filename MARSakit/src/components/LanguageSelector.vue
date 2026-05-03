<script setup lang="ts">
import { storeToRefs } from 'pinia'
import { useLanguageStore, type LanguageCode } from '@/stores/language'

const languageStore = useLanguageStore()
const { language } = storeToRefs(languageStore)

const onChange = (value: LanguageCode) => {
  languageStore.setLanguage(value)
}
</script>

<template>
  <div class="lang-switch">
    <label class="lang-label" for="lang">Language</label>
    <select
      id="lang"
      class="lang-select"
      :value="language"
      @change="onChange(($event.target as HTMLSelectElement).value as LanguageCode)"
      aria-label="Language preference"
    >
      <option value="en">English</option>
      <option value="tl">Tagalog</option>
    </select>
  </div>
</template>

<style scoped>
.lang-switch {
  position: fixed;
  top: 14px;
  right: 14px;
  z-index: 2000;
  display: flex;
  align-items: center;
  gap: 10px;

  padding: 10px 12px;
  border-radius: 14px;

  background: rgba(15, 14, 23, 0.75);
  border: 1px solid rgba(255, 255, 255, 0.12);
  backdrop-filter: blur(10px);
  -webkit-backdrop-filter: blur(10px);
}

.lang-label {
  color: rgba(255, 255, 255, 0.82);
  font-size: 12px;
  font-weight: 600;
}

.lang-select {
  border: 1px solid rgba(255, 255, 255, 0.18);
  background: rgba(255, 255, 255, 0.06);
  color: white;

  padding: 6px 10px;
  border-radius: 12px;
  outline: none;

  font-weight: 700;
  cursor: pointer;
}

.lang-select:focus {
  border-color: rgba(96, 165, 250, 0.7);
  box-shadow: 0 0 0 3px rgba(37, 99, 235, 0.25);
}
</style>
