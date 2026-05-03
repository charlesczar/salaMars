<template>
  <div class="medicine-search">
    <label :for="idInput" class="label">{{ labels.searchLabel }}</label>
    <input
      :id="idInput"
      v-model="q"
      @input="onInput"
      :placeholder="labels.placeholder"
      class="search-input"
    />

    <div v-if="results.length === 0 && q" class="no-results">{{ labels.noResults }}</div>

    <ul v-if="results.length > 0" class="results">
      <li v-for="med in results" :key="med.id" class="result-item">
        <div class="result-title">{{ med.name }} <small>({{ med.genericName }})</small></div>
        <div class="result-meta">{{ med.category }} • {{ med.brandNames.join(', ') }}</div>
      </li>
    </ul>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import { MEDICINES, type Medicine } from '@/data/medicines'
import { useLanguageStore } from '@/stores/language'

const idInput = 'medicine-search-input'
const q = ref('')

const languageStore = useLanguageStore()

const labels = computed(() => {
  return languageStore.language === 'tl'
    ? { searchLabel: 'Maghanap ng Gamot', placeholder: 'Mag-type ng pangalan o brand', noResults: 'Walang natagpuang gamot' }
    : { searchLabel: 'Search Medicine', placeholder: 'Type name or brand', noResults: 'No medicines found' }
})

const normalize = (s: string) => s.trim().toLowerCase()

const results = computed(() => {
  const term = normalize(q.value)
  if (!term) return [] as Medicine[]
  return MEDICINES.filter((m) => {
    if (m.name.toLowerCase().includes(term)) return true
    if (m.genericName.toLowerCase().includes(term)) return true
    if (m.brandNames.join(' ').toLowerCase().includes(term)) return true
    return m.searchKeys.some((k) => k.toLowerCase().includes(term))
  })
})

const onInput = () => {}
</script>

<style scoped>
.medicine-search { max-width: 720px; margin: 1rem auto; }
.label { display:block; font-weight:700; margin-bottom:6px }
.search-input { width:100%; padding:10px 12px; border-radius:8px; border:1px solid #ccc }
.results { list-style:none; padding:0; margin-top:10px }
.result-item { padding:10px; border:1px solid #eee; border-radius:8px; margin-bottom:8px }
.result-title { font-weight:700 }
.result-meta { color:#666; font-size:0.9rem }
.no-results { color:#b00; margin-top:8px }
</style>
