<template>
  <div class="medicine-scanner">
    <div class="status" v-if="status">{{ status }}</div>
    <div class="ocr-text" v-if="ocrText">{{ ocrText }}</div>

  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch } from 'vue'
import { loadExternalScript } from '@/utils/loadExternalScript'
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

async function searchText(txt: string) {
  // Extract words of reasonable length (ignore tiny text/noise)
  const words = txt
    .replace(/[^a-zA-Z]/g, ' ')
    .split(/\s+/)
    .filter(w => w.length > 3)
    
  // Sort words by length descending (medicine names are usually prominent)
  const sortedWords = Array.from(new Set(words)).sort((a, b) => b.length - a.length)
  
  const lang = languageStore.language === 'tl' ? 'filipino' : 'english'
  
  // Test at most the top 5 words sequentially to avoid spamming the backend API
  for (let i = 0; i < Math.min(5, sortedWords.length); i++) {
    const word = sortedWords[i]
    if (!word) continue

    const response = await scanMedicines(word, lang)
    if (response && !response.error) {
      emit('scan-complete', response)
      return
    }
  }

  emit('scan-complete', { error: 'No medicine recognized in the image. Please try again with a clearer photo.' })
}

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

async function preprocessImage(file: File): Promise<Blob> {
  return new Promise((resolve) => {
    const img = new Image()
    const canvas = document.createElement('canvas')
    const ctx = canvas.getContext('2d')!
    img.onload = () => {
      canvas.width = img.width
      canvas.height = img.height
      // Draw original
      ctx.drawImage(img, 0, 0)
      // Get image data
      const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height)
      const data = imageData.data
      // Convert to grayscale and increase contrast
      for (let i = 0; i < data.length; i += 4) {
        const red = data[i] ?? 0
        const green = data[i + 1] ?? 0
        const blue = data[i + 2] ?? 0
        const avg = (red + green + blue) / 3
        // Increase contrast
        const contrasted = ((avg - 128) * 1.5) + 128
        const clamped = Math.max(0, Math.min(255, contrasted))
        data[i] = data[i + 1] = data[i + 2] = clamped
      }
      ctx.putImageData(imageData, 0, 0)
      canvas.toBlob((blob) => {
        URL.revokeObjectURL(img.src) // prevent memory leaks
        resolve(blob!)
      }, 'image/png')
    }
    img.src = URL.createObjectURL(file)
  })
}


// Main processing function
async function processFile(file: File) {
  status.value = 'Preparing OCR engine...'
  ocrText.value = ''

  try {
    const w = await getWorker()
    status.value = 'Enhancing image quality...'
    const preprocessedBlob = await preprocessImage(file)
    
    status.value = 'Reading image text...'
    const { data } = await w.recognize(preprocessedBlob)
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
