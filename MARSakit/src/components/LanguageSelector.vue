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
    <div class="lang-icon">
      <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><line x1="2" y1="12" x2="22" y2="12"/><path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"/></svg>
    </div>
    <select
      id="lang"
      class="lang-select"
      :value="language"
      @change="onChange(($event.target as HTMLSelectElement).value as LanguageCode)"
      aria-label="Language preference"
    >
      <option value="en">English</option>
      <option value="tl">Tagalog</option>
      <option value="bisaya">Bisaya</option>
    </select>
  </div>
</template>

<style scoped>
.lang-switch {
  display: flex;
  align-items: center;
  background: rgba(255, 255, 255, 0.7);
  backdrop-filter: blur(8px);
  border: 1px solid rgba(0, 0, 0, 0.05);
  border-radius: 50px;
  padding: 4px 12px;
  gap: 6px;
  transition: all 0.3s ease;
  box-shadow: 0 2px 10px rgba(0, 0, 0, 0.02);
}

.lang-switch:hover {
  background: rgba(255, 255, 255, 0.9);
  border-color: rgba(59, 130, 246, 0.2);
  box-shadow: 0 4px 15px rgba(59, 130, 246, 0.08);
}

.lang-icon {
  display: flex;
  align-items: center;
  color: #64748b;
}

.lang-select {
  border: none;
  background: transparent;
  color: #334155;
  font-size: 0.85rem;
  font-weight: 600;
  outline: none;
  cursor: pointer;
  padding-right: 4px;
  font-family: 'Inter', sans-serif;
  appearance: none;
}

/* Custom arrow for select */
.lang-switch::after {
  content: '';
  width: 8px;
  height: 8px;
  border-right: 2px solid #94a3b8;
  border-bottom: 2px solid #94a3b8;
  transform: rotate(45deg);
  margin-left: -2px;
  margin-top: -4px;
  pointer-events: none;
}

@media (max-width: 768px) {
  .lang-switch {
    padding: 3px 10px;
    gap: 4px;
  }

  .lang-icon svg {
    width: 14px;
    height: 14px;
  }

  .lang-select {
    font-size: 0.78rem;
  }
}
</style>
