<template>
  <div class="medicine-scanner">
    <div class="status" v-if="status">{{ status }}</div>
    <div class="found-label" v-if="ocrText && medicinesFound > 0">{{ labels.foundLabel }}</div>
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

const labels = computed(() => {
  if (languageStore.language === 'tl') {
    return {
      foundLabel: 'Natagpuang Gamot',
      preparing: 'Inihahanda ang OCR engine...',
      enhancing: 'Pinapaganda ang kalidad ng larawan...',
      reading: 'Binabasa ang teksto sa larawan...',
      analyzing: 'Sinusuri ang gamot...',
      failed: 'Nabigo ang OCR — pakisubukan muli',
      noMedicine: 'Walang nakilalang gamot sa larawan. Pakisubukan muli gamit ang mas malinaw na larawan.',
    }
  }

  if (languageStore.language === 'bisaya') {
    return {
      foundLabel: 'Nakitang Tambal',
      preparing: 'Giandam ang OCR engine...',
      enhancing: 'Giapas-an ang kalidad sa hulagway...',
      reading: 'Gibasa ang teksto sa hulagway...',
      analyzing: 'Ginasusi ang tambal...',
      failed: 'Napakyas ang OCR — palihog sulayi pag-usab',
      noMedicine: 'Walay nakaila nga tambal sa hulagway. Palihog sulayi pag-usab gamit ang mas klarong litrato.',
    }
  }

  return {
    foundLabel: 'Found Medicine',
    preparing: 'Preparing OCR engine...',
    enhancing: 'Enhancing image quality...',
    reading: 'Reading image text...',
    analyzing: 'Analyzing medicine...',
    failed: 'OCR failed — please try again',
    noMedicine: 'No medicine recognized in the image. Please try again with a clearer photo.',
  }
})

async function searchText(txt: string) {
  // Extract words of reasonable length (ignore tiny text/noise)
  const words = txt
    .replace(/[^a-zA-Z]/g, ' ')
    .split(/\s+/)
    .filter(w => w.length > 3)
  
  const uniqueWords = Array.from(new Set(words))
  const sortedWords = uniqueWords.sort((a, b) => b.length - a.length)
  
  const langMap: Record<string, string> = {
    'en': 'english',
    'tl': 'filipino',
    'bisaya': 'bisaya'
  }
  const lang = langMap[languageStore.language] || 'english'
  console.log(`Scanning in language: ${lang} (Store value: ${languageStore.language})`)
  console.log(`Extracted ${sortedWords.length} unique words from OCR text`)
  console.log(`Top words to scan:`, sortedWords.slice(0, 10))
  
  // Scan words sequentially until we find the FIRST valid medicine
  const maxWordsToScan = Math.min(10, sortedWords.length)
  
  for (let i = 0; i < maxWordsToScan; i++) {
    const word = sortedWords[i]
    if (!word) continue

    console.log(`Scanning word ${i + 1}/${maxWordsToScan}: "${word}"`)
    const response = await scanMedicines(word, lang)
    
    if (response && !response.error) {
      console.log(`✓ Found valid medicine: "${word}" → ${response.medicine_name || response.name}`)
      medicinesFound.value = 1
      emit('scan-complete', response)
      return // Stop immediately after finding first valid medicine
    } else {
      console.log(`✗ No match for "${word}"`)
    }
  }

  // No medicine found after scanning all words
  console.log(`Scan complete. No valid medicine found.`)
  medicinesFound.value = 0
  emit('scan-complete', { error: 'No medicine recognized in the image. Please try again with a clearer photo.' })
}

const status = ref('')
const ocrText = ref('')
const medicinesFound = ref(0)

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
  status.value = labels.value.preparing
  ocrText.value = ''
  medicinesFound.value = 0

  try {
    const w = await getWorker()
    status.value = labels.value.enhancing
    const preprocessedBlob = await preprocessImage(file)
    
    status.value = labels.value.reading
    const { data } = await w.recognize(preprocessedBlob)
    ocrText.value = data?.text || ''
    
    status.value = labels.value.analyzing
    await searchText(ocrText.value)
    status.value = ''
  } catch (err) {
    console.error(err)
    status.value = labels.value.failed
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
.found-label { margin-top: 8px; font-weight: 600; color: #2563eb }
.ocr-text { margin-top: 8px; white-space: pre-wrap; background: #f8f8f8; padding: 8px; border-radius: 6px }
.scan-results { margin-top: 10px }
</style>
