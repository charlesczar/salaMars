<template>
  <div class="landing-container">
    <div class="landing-content">
      <h1>Welcome to MARSakit</h1>
      <p>Find pharMARScies near you</p>
      
      <!-- Search Bar with Upload -->
      <div class="search-bar-wrapper">
        <input
          v-model="searchQuery"
          @keyup.enter="performSearch"
          :placeholder="searchPlaceholder"
          class="search-bar"
          type="text"
        />
        <label class="upload-btn" :title="uploadTitle">
          📷
          <input
            ref="fileInput"
            type="file"
            accept="image/*"
            @change="handleImageUpload"
            style="display: none"
          />
        </label>
        <button @click="performSearch" class="search-btn">🔍</button>
      </div>

      <!-- Scanner (inline, only after file selected) -->
      <div v-if="showScanner && selectedFile" class="scanner-container">
        <MedicineScanner :initialFile="selectedFile" @scan-complete="handleScanComplete" />
      </div>

      <!-- Search Results / AI Analysis -->
      <div v-if="!showScanner && searchResponse" class="search-results-wrapper">
        <div v-if="searchResponse.geminiResponse" class="gemini-card">
          <div class="gemini-header">
            <h3>✨ AI Analysis</h3>
          </div>
          <div class="gemini-content">
            <p class="summary">{{ searchResponse.geminiResponse.summary }}</p>
            
            <div class="details-grid">
              <div class="detail-item" v-if="searchResponse.geminiResponse.uses && searchResponse.geminiResponse.uses !== 'Not available in the database.'">
                <h4>Uses</h4>
                <p>{{ searchResponse.geminiResponse.uses }}</p>
              </div>
              <div class="detail-item" v-if="searchResponse.geminiResponse.sideEffects && searchResponse.geminiResponse.sideEffects !== 'Not available in the database.'">
                <h4>Side Effects</h4>
                <p>{{ searchResponse.geminiResponse.sideEffects }}</p>
              </div>
              <div class="detail-item" v-if="searchResponse.geminiResponse.warnings && searchResponse.geminiResponse.warnings !== 'Not available in the database.'">
                <h4>Warnings</h4>
                <p>{{ searchResponse.geminiResponse.warnings }}</p>
              </div>
              <div class="detail-item" v-if="searchResponse.geminiResponse.whenToUse && searchResponse.geminiResponse.whenToUse !== 'Not available in the database.'">
                <h4>When to Use</h4>
                <p>{{ searchResponse.geminiResponse.whenToUse }}</p>
              </div>
              <div class="detail-item" v-if="searchResponse.geminiResponse.whenToAvoid && searchResponse.geminiResponse.whenToAvoid !== 'Not available in the database.'">
                <h4>When to Avoid</h4>
                <p>{{ searchResponse.geminiResponse.whenToAvoid }}</p>
              </div>
            </div>
            
            <div v-if="searchResponse.searchCorrection" class="correction">
              💡 {{ searchResponse.searchCorrection }}
            </div>
          </div>
        </div>
        
        <div v-else-if="searchResponse.message || searchResponse.error" class="no-results gemini-card">
          {{ searchResponse.message || searchResponse.error }}
        </div>
      </div>

      <div v-if="!showScanner && isSearching" class="searching-status">
        {{ searchingLabel }}
      </div>

      <button @click="goToPharmacyMap" class="btn-primary">
        Pharmacy Near Me
      </button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import { useRouter } from 'vue-router'
import { useLanguageStore } from '@/stores/language'
import { searchMedicines, type Medicine } from '@/utils/api'
import MedicineScanner from '@/components/MedicineScanner.vue'

const router = useRouter()
const fileInput = ref<HTMLInputElement>()
const showScanner = ref(false)
const selectedFile = ref<File | null>(null)
const searchQuery = ref('')
const searchResponse = ref<any>(null)
const isSearching = ref(false)
const languageStore = useLanguageStore()

const searchPlaceholder = computed(() =>
  languageStore.language === 'tl'
    ? 'Maghanap ng gamot...'
    : 'Search for medicine...'
)

const uploadTitle = computed(() =>
  languageStore.language === 'tl'
    ? 'I-upload ang larawan'
    : 'Upload image'
)

const searchingLabel = computed(() =>
  languageStore.language === 'tl'
    ? 'Naghahanap at nag-aanalisa...'
    : 'Searching and analyzing...'
)

const performSearch = async () => {
  const term = searchQuery.value.trim()
  if (!term) return
  showScanner.value = false
  isSearching.value = true
  searchResponse.value = null
  try {
    const lang = languageStore.language === 'tl' ? 'filipino' : 'english'
    searchResponse.value = await searchMedicines(term, lang)
  } catch (err) {
    console.error('Search error:', err)
    searchResponse.value = { error: 'Failed to search for medicines.' }
  } finally {
    isSearching.value = false
  }
}

const handleImageUpload = (e: Event) => {
  const input = e.target as HTMLInputElement
  if (input.files && input.files.length > 0) {
    selectedFile.value = input.files[0] || null
    searchResponse.value = null // clear previous results
    showScanner.value = true
    input.value = '' // clear so the same file can be selected again
  }
}

const handleScanComplete = (response: any) => {
  searchResponse.value = response
  showScanner.value = false // hide scanner, show result card
}

const goToPharmacyMap = () => {
  router.push({ name: 'pharmacy-map' })
}
</script>

<style scoped>
.landing-container {
  display: flex;
  justify-content: center;
  align-items: center;
  height: 100vh;
  background: linear-gradient(135deg, #87CEEB 0%, #ADD8E6 100%);
}

.landing-content {
  text-align: center;
  color: white;
}

.landing-content h1 {
  font-size: 3rem;
  margin-bottom: 0.5rem;
  font-weight: bold;
}

.landing-content p {
  font-size: 1.25rem;
  margin-bottom: 2rem;
  opacity: 0.9;
}

.btn-primary {
  padding: 1rem 2.5rem;
  font-size: 1.1rem;
  background-color: white;
  color: #667eea;
  border: none;
  border-radius: 50px;
  cursor: pointer;
  font-weight: bold;
  transition: all 0.3s ease;
}

.btn-primary:hover {
  transform: scale(1.05);
  box-shadow: 0 10px 25px rgba(0, 0, 0, 0.2);
}

.btn-primary:active {
  transform: scale(0.98);
}

/* Search Bar Styles */
.search-bar-wrapper {
  display: flex;
  gap: 8px;
  margin: 2rem auto;
  width: fit-content;
  background: rgba(255, 255, 255, 0.95);
  padding: 8px 12px;
  border-radius: 50px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
  backdrop-filter: blur(10px);
}

.search-bar {
  border: none;
  background: transparent;
  outline: none;
  font-size: 1rem;
  padding: 0.5rem 1rem;
  min-width: 300px;
  color: #333;
}

.search-bar::placeholder {
  color: #999;
}

.search-btn {
  background: #10b981;
  border: none;
  color: white;
  padding: 0.5rem 1rem;
  border-radius: 50px;
  cursor: pointer;
  font-size: 1rem;
  transition: background 0.3s ease;
}

.search-btn:hover {
  background: #059669;
}

.upload-btn {
  background: #f59e0b;
  border: none;
  color: white;
  padding: 0.5rem 1rem;
  border-radius: 50px;
  cursor: pointer;
  font-size: 1rem;
  transition: background 0.3s ease;
  display: flex;
  align-items: center;
  justify-content: center;
}

.upload-btn:hover {
  background: #d97706;
}

/* Search Results Display */
.search-results-wrapper {
  max-width: 650px;
  margin: 1.5rem auto 0;
  width: 100%;
}

.gemini-card {
  background: rgba(255, 255, 255, 0.95);
  border-radius: 16px;
  padding: 1.5rem;
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.1);
  text-align: left;
  color: #1e293b;
  backdrop-filter: blur(10px);
  border: 1px solid rgba(255, 255, 255, 0.4);
  max-height: 50vh;
  overflow-y: auto;
}

.gemini-header h3 {
  margin: 0 0 1rem 0;
  font-size: 1.25rem;
  color: #2563eb;
  display: flex;
  align-items: center;
  gap: 8px;
}

.gemini-content .summary {
  font-size: 1.1rem;
  line-height: 1.6;
  font-weight: 500;
  color: #334155;
  margin-bottom: 1.25rem;
  padding-bottom: 1.25rem;
  border-bottom: 1px solid #e2e8f0;
}

.details-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 1.25rem;
}

.detail-item h4 {
  margin: 0 0 0.5rem 0;
  font-size: 0.85rem;
  text-transform: uppercase;
  letter-spacing: 0.5px;
  color: #64748b;
}

.detail-item p {
  margin: 0;
  font-size: 0.95rem;
  line-height: 1.5;
  color: #475569;
}

.correction {
  margin-top: 1.5rem;
  padding: 0.75rem 1rem;
  background: #fef3c7;
  color: #b45309;
  border-radius: 8px;
  font-size: 0.95rem;
  font-weight: 500;
}

.no-results {
  text-align: center;
  color: #ef4444;
  font-weight: 500;
}

.searching-status {
  max-width: 600px;
  margin: 1.5rem auto 0;
  text-align: center;
  color: white;
  font-size: 1.1rem;
  font-weight: 500;
  text-shadow: 0 2px 4px rgba(0,0,0,0.1);
  animation: pulse 1.5s infinite;
}

@keyframes pulse {
  0% { opacity: 0.7; }
  50% { opacity: 1; }
  100% { opacity: 0.7; }
}

/* Scanner Container */
.scanner-container {
  max-width: 600px;
  margin: 1rem auto 0;
  background: rgba(255, 255, 255, 0.95);
  border-radius: 12px;
  padding: 1rem;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
}

/* Modal removed - scanner now inline */

</style>
