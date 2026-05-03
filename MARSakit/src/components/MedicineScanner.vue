<template>
  <div class="medicine-scanner">
    <label class="label">{{ labels.scanLabel }}</label>
    <input type="file" accept="image/*" @change="onFileChange" />

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
import { ref, computed } from 'vue'
import { loadExternalScript } from '@/utils/loadExternalScript'
import { MEDICINES, type Medicine } from '@/data/medicines'
import { useLanguageStore } from '@/stores/language'

const languageStore = useLanguageStore()

const labels = computed(() =>
  languageStore.language === 'tl'
    ? { scanLabel: 'I-scan ang Label ng Gamot', foundLabel: 'Natagpuang Gamot' }
    : { scanLabel: 'Scan Medicine Label', foundLabel: 'Found Medicines' },
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

function searchText(txt: string) {
  const t = normalize(txt)
  if (!t) return []
  const found = MEDICINES.filter((m) => {
    if (m.name.toLowerCase().includes(t)) return true
    if (m.genericName.toLowerCase().includes(t)) return true
    if (m.brandNames.join(' ').toLowerCase().includes(t)) return true
    return m.searchKeys.some((k) => k.toLowerCase().includes(t))
  })
  return found
}

async function onFileChange(e: Event) {
  const input = e.target as HTMLInputElement
  if (!input.files || input.files.length === 0) return
  const file = input.files[0]
  status.value = 'Preparing image...'
  ocrText.value = ''
  results.value = []

  try {
    const w = await getWorker()
    status.value = 'Running OCR...'
    const { data } = await w.recognize(file)
    ocrText.value = data?.text || ''
    status.value = 'OCR complete'
    results.value = searchText(ocrText.value)
  } catch (err) {
    console.error(err)
    status.value = 'OCR failed'
  }
}

// cleanup
window.addEventListener('beforeunload', async () => {
  if (worker) await worker.terminate()
})
</script>

<style scoped>
.medicine-scanner { max-width:720px; margin:1rem auto }
.label { display:block; font-weight:700; margin-bottom:6px }
.status { margin-top:8px; color:#333 }
.ocr-text { margin-top:8px; white-space:pre-wrap; background:#f8f8f8; padding:8px; border-radius:6px }
.scan-results { margin-top:10px }
</style>
