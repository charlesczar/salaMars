<template>
  <div class="medicine-scanner">
    <div class="status" v-if="status">{{ status }}</div>
    <div class="ocr-text" v-if="ocrText">{{ ocrText }}</div>

  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch } from 'vue'
import { loadExternalScript } from '@/utils/loadExternalScript'
import { type Medicine } from '@/data/medicines'
import { useLanguageStore } from '@/stores/language'
import { scanMedicines } from '@/utils/api'

const props = defineProps<{
  initialFile?: File | null
}>()

const emit = defineEmits(['scan-complete'])

const languageStore = useLanguageStore()

const labels = computed(() =>
  languageStore.language === 'tl'
    ? { foundLabel: 'Natagpuang Gamot' }
    : { foundLabel: 'Found Medicines' },
)

const status = ref('')
const ocrText = ref('')

async function initTesseract() {
  try {
    await loadExternalScript('/libs/tesseract.min.js')
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
  // In Tesseract v5, createWorker takes (langs, oem, options)
  // and automatically runs loadLanguage and initialize.
  worker = await (window as any).Tesseract.createWorker('eng', 1, {
    workerPath: '/libs/worker.min.js',
    corePath: '/libs/tesseract-core.wasm.js',
  })
  return worker
}

function normalize(s: string) {
  return s.trim().toLowerCase()
}

async function searchText(txt: string) {
  const t = normalize(txt)
  if (!t) {
    emit('scan-complete', { error: 'No recognizable text found in image.' })
    return
  }
  const lang = languageStore.language === 'tl' ? 'filipino' : 'english'
  const response = await scanMedicines(t, lang)
  emit('scan-complete', response)
}

async function processFile(file: File) {
  status.value = 'Preparing OCR engine...'
  ocrText.value = ''

  try {
    const w = await getWorker()
    status.value = 'Reading image text...'
    const { data } = await w.recognize(file)
    ocrText.value = data?.text || ''
    status.value = 'Analyzing medicine...'
    await searchText(ocrText.value)
    status.value = ''
  } catch (err) {
    console.error(err)
    status.value = 'OCR failed — please try again'
  }
}

// Auto-process initialFile when prop is set
watch(
  () => props.initialFile,
  async (file) => {
    if (file) {
      await processFile(file)
    }
  },
  { immediate: true }
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
