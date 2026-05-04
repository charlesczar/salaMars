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
        <MedicineScanner :initialFile="selectedFile" />
      </div>

      <!-- Search Results -->
      <div v-if="!showScanner && searchResults.length > 0" class="search-results">
        <div class="results-title">{{ resultsLabel }}</div>
        <div class="results-list">
          <div v-for="med in searchResults" :key="med.id" class="result-item">
            <div class="result-name">{{ med.name }} <small>({{ med.genericName }})</small></div>
            <div class="result-meta">{{ med.category }} • {{ med.brandNames.join(', ') }}</div>
          </div>
        </div>
      </div>
      <div v-if="!showScanner && searchQuery && searchResults.length === 0 && !isSearching" class="no-results">
        {{ noResultsLabel }}
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
const searchResults = ref<Medicine[]>([])
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

const resultsLabel = computed(() =>
  languageStore.language === 'tl'
    ? 'Natagpuang Gamot'
    : 'Found Medicines'
)

const noResultsLabel = computed(() =>
  languageStore.language === 'tl'
    ? 'Walang natagpuang gamot'
    : 'No medicines found'
)

const searchingLabel = computed(() =>
  languageStore.language === 'tl'
    ? 'Naghahanap...'
    : 'Searching...'
)

const performSearch = async () => {
  const term = searchQuery.value.trim()
  if (!term) return
  showScanner.value = false
  isSearching.value = true
  try {
    searchResults.value = await searchMedicines(term)
  } catch (err) {
    console.error('Search error:', err)
    searchResults.value = []
  } finally {
    isSearching.value = false
  }
}

const handleImageUpload = (e: Event) => {
  const input = e.target as HTMLInputElement
  if (input.files && input.files.length > 0) {
    selectedFile.value = input.files[0]
    showScanner.value = true
  }
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
.search-results {
  max-width: 600px;
  margin: 1rem auto 0;
  background: rgba(255, 255, 255, 0.95);
  border-radius: 12px;
  padding: 1rem;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
  max-height: 400px;
  overflow-y: auto;
}

.results-title {
  font-weight: 700;
  margin-bottom: 0.75rem;
  color: #333;
  font-size: 0.95rem;
}

.results-list {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.result-item {
  padding: 10px;
  background: #f8f8f8;
  border-radius: 8px;
  border-left: 4px solid #10b981;
}

.result-name {
  font-weight: 600;
  color: #333;
  font-size: 0.95rem;
}

.result-name small {
  font-weight: 400;
  color: #666;
}

.result-meta {
  font-size: 0.85rem;
  color: #888;
  margin-top: 4px;
}

.no-results {
  max-width: 600px;
  margin: 1rem auto 0;
  text-align: center;
  color: #b00;
  font-size: 0.95rem;
}

.searching-status {
  max-width: 600px;
  margin: 1rem auto 0;
  text-align: center;
  color: #666;
  font-size: 0.95rem;
  font-style: italic;
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
