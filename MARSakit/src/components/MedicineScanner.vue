<template>
  <div class="medicine-scanner">
    <div class="status" v-if="status">{{ status }}</div>
    <div class="ocr-text" v-if="ocrText">{{ ocrText }}</div>

    <div v-if="results.length > 0" class="scan-results">
      <h4>{{ labels.foundLabel }}</h4>
      <ul>
        <li v-for="m in results" :key="m.id">{{ m.name }} — {{ m.brandNames.join(', ') }}</li>
      </ul>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch } from 'vue'
import { loadExternalScript } from '@/utils/loadExternalScript'
import { type Medicine } from '@/data/medicines'
import { useLanguageStore } from '@/stores/language'
import { searchMedicines } from '@/utils/api'

const props = defineProps<{
  initialFile?: File | null
}>()

const languageStore = useLanguageStore()

const labels = computed(() =>
  languageStore.language === 'tl'
    ? { foundLabel: 'Natagpuang Gamot' }
    : { foundLabel: 'Found Medicines' },
)

const status = ref('')
const ocrText = ref('')
const results = ref<Medicine[]>([])

async function initTesseract() {
  try {
    await loadExternalScript('/libs/tesseract.min.js')
    await loadExternalScript('/libs/worker.min.js')
    return true
  } catch (e) {
    console.error('Failed to load OCR libs', e)
    return false
  }
}

let worker: any = null

async function getWorker() {
  if (worker) return worker
  if (!(window as any).Tesseract) {
    const ok = await initTesseract()
    if (!ok) throw new Error('OCR libs not available')
  }
  worker = await (window as any).Tesseract.createWorker({ logger: (m: any) => (status.value = `${m.status} ${(m.progress || 0) * 100 | 0}%`) })
  await worker.loadLanguage('eng')
  await worker.initialize('eng')
  return worker
}

function normalize(s: string) {
  return s.trim().toLowerCase()
}

async function searchText(txt: string) {
  const t = normalize(txt)
  if (!t) return []
  return await searchMedicines(t)
}

async function processFile(file: File) {
  status.value = 'Preparing image...'
  ocrText.value = ''
  results.value = []

  try {
    const w = await getWorker()
    status.value = 'Running OCR...'
    const { data } = await w.recognize(file)
    ocrText.value = data?.text || ''
    status.value = 'OCR complete'
    results.value = await searchText(ocrText.value)
  } catch (err) {
    console.error(err)
    status.value = 'OCR failed'
  }
}

// Auto-process initialFile when prop is set
watch(
  () => props.initialFile,
  async (file) => {
    if (file) {
      await processFile(file)
    }
  }
)

// cleanup
window.addEventListener('beforeunload', async () => {
  if (worker) await worker.terminate()
})
</script>

<style scoped>
.medicine-scanner { max-width: 720px; margin: 1rem auto }
.status { margin-top: 8px; color: #333 }
.ocr-text { margin-top: 8px; white-space: pre-wrap; background: #f8f8f8; padding: 8px; border-radius: 6px }
.scan-results { margin-top: 10px }
</style>
