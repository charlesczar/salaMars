<template>
  <div class="landing-container">
    <!-- Header -->
    <header class="top-nav">
      <div class="logo">
        <span class="logo-dark">MARS</span><span class="logo-light">akit</span>
      </div>
      <div class="nav-links">
        <LanguageSelector />
        <button class="nav-btn" @click="goToPharmacyMap">
          <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/><circle cx="12" cy="10" r="3"/></svg>
          {{ labels.headerPharmacyButton }}
        </button>
      </div>
    </header>

    <main class="landing-content">
      <div class="hero-section">
        <div class="pill-badge">
          <span class="dot"></span> MEDICINE · AI ANALYSIS · PHARMACY LOCATOR
        </div>
        
        <h1 class="main-title">
          <span class="title-dark">MARS</span><span class="title-light">akit</span>
        </h1>
        
        <p class="subtitle">{{ labels.subtitle }}</p>

        <!-- Search Bar -->
        <div class="search-bar-wrapper">
          <input
            v-model="searchQuery"
            @keyup.enter="performSearch"
            :placeholder="searchPlaceholder"
            class="search-bar"
            type="text"
          />
          <button @click="performSearch" class="search-btn">🔍</button>
        </div>

        <div class="action-buttons">
          <label class="btn-secondary" :title="uploadTitle">
            <span class="icon">📷</span> {{ labels.uploadImage }}
            <input
              ref="fileInput"
              type="file"
              accept="image/*"
              @change="handleImageUpload"
              style="display: none"
            />
          </label>
          <button @click="goToPharmacyMap" class="btn-primary">
            {{ labels.pharmacyNearMe }} <span class="arrow">→</span>
          </button>
        </div>
      </div>

      <!-- Scanner Container -->
      <div v-if="showScanner && selectedFile" class="scanner-container fade-in">
        <MedicineScanner :initialFile="selectedFile" @scan-complete="handleScanComplete" />
      </div>

      <!-- Search Results / AI Analysis -->
      <div v-if="!showScanner && searchResponse" class="search-results-wrapper fade-in">
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

      <div v-if="!showScanner && isSearching" class="searching-status fade-in">
        {{ searchingLabel }}
      </div>

      <!-- Infinite Marquee -->
      <div class="marquee-container" v-if="medicines.length">
        <div class="marquee-track">
          <div class="marquee-card" v-for="(med, idx) in duplicatedMedicines" :key="idx">
            <span class="med-name">{{ med.name }}</span>
            <span class="med-cat">{{ med.category || (med.otc ? 'OTC' : 'Prescription') }}</span>
          </div>
        </div>
      </div>

    </main>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useLanguageStore } from '@/stores/language'
import { searchMedicines, getAllMedicines, type Medicine } from '@/utils/api'
import MedicineScanner from '@/components/MedicineScanner.vue'
import LanguageSelector from '@/components/LanguageSelector.vue'

const router = useRouter()
const fileInput = ref<HTMLInputElement>()
const showScanner = ref(false)
const selectedFile = ref<File | null>(null)
const searchQuery = ref('')
const searchResponse = ref<any>(null)
const isSearching = ref(false)
const languageStore = useLanguageStore()

const medicines = ref<Medicine[]>([])
const duplicatedMedicines = computed(() => {
  if (!medicines.value.length) return []
  return [...medicines.value, ...medicines.value, ...medicines.value, ...medicines.value, ...medicines.value]
})

const labels = computed(() => {
  if (languageStore.language === 'tl') {
    return {
      headerPharmacyButton: 'Maghanap ng Botika',
      subtitle: 'Maghanap ng mga pharMARScies na malapit. Bawat gamot matatagpuan.',
      uploadImage: 'Mag-upload ng Larawan',
      pharmacyNearMe: 'Botika sa Malapit',
    }
  }

  if (languageStore.language === 'bisaya') {
    return {
      headerPharmacyButton: 'Pangita og Botika',
      subtitle: 'Pangitaa ang mga pharMARScies duol nimo. Matag tambal nga makita.',
      uploadImage: 'I-upload ang Hulagway',
      pharmacyNearMe: 'Botika Duol Nimo',
    }
  }

  return {
    headerPharmacyButton: 'Find a Pharmacy',
    subtitle: 'Find pharMARScies near you. Every medicine found.',
    uploadImage: 'Upload Image',
    pharmacyNearMe: 'Pharmacy Near Me',
  }
})

onMounted(async () => {
  try {
    const data = await getAllMedicines()
    if (data && data.length) {
      medicines.value = data
      return
    }
  } catch (err) {
    console.error('Failed to load medicines from backend, using fallback.', err)
  }
  
  // Fallback examples since the backend returns 400 Bad Request for the list endpoint
  medicines.value = [
    { id: '1', name: 'Paracetamol', category: 'Fever & Pain Relief', genericName: '', brandNames: [], activeIngredients: [], searchKeys: [], uses: [], sideEffects: [], warnings: [], allergyTriggers: [], contraindications: [], otc: true },
    { id: '2', name: 'Amoxicillin', category: 'Antibiotics', genericName: '', brandNames: [], activeIngredients: [], searchKeys: [], uses: [], sideEffects: [], warnings: [], allergyTriggers: [], contraindications: [], otc: false },
    { id: '3', name: 'Loratadine', category: 'Allergies', genericName: '', brandNames: [], activeIngredients: [], searchKeys: [], uses: [], sideEffects: [], warnings: [], allergyTriggers: [], contraindications: [], otc: true },
    { id: '4', name: 'Ibuprofen', category: 'Fever & Pain Relief', genericName: '', brandNames: [], activeIngredients: [], searchKeys: [], uses: [], sideEffects: [], warnings: [], allergyTriggers: [], contraindications: [], otc: true },
    { id: '5', name: 'Omeprazole', category: 'Gastric & Acidity', genericName: '', brandNames: [], activeIngredients: [], searchKeys: [], uses: [], sideEffects: [], warnings: [], allergyTriggers: [], contraindications: [], otc: true },
    { id: '6', name: 'Cetirizine', category: 'Allergies', genericName: '', brandNames: [], activeIngredients: [], searchKeys: [], uses: [], sideEffects: [], warnings: [], allergyTriggers: [], contraindications: [], otc: true }
  ]
})

const searchPlaceholder = computed(() => {
  if (languageStore.language === 'tl') return 'Maghanap ng gamot...'
  if (languageStore.language === 'bisaya') return 'Pangita og tambal...'
  return 'Search for medicine...'
})

const uploadTitle = computed(() => {
  if (languageStore.language === 'tl') return 'I-upload ang larawan'
  if (languageStore.language === 'bisaya') return 'I-upload ang hulagway'
  return 'Upload image'
})

const searchingLabel = computed(() => {
  if (languageStore.language === 'tl') return 'Naghahanap at nag-aanalisa...'
  if (languageStore.language === 'bisaya') return 'Nangita ug naga-analisar...'
  return 'Searching and analyzing...'
})

const performSearch = async () => {
  const term = searchQuery.value.trim()
  if (!term) return
  showScanner.value = false
  isSearching.value = true
  searchResponse.value = null
  try {
    const langMap: Record<string, string> = {
      'en': 'english',
      'tl': 'filipino',
      'bisaya': 'bisaya' // You might need 'cebuano' here if your backend uses that
    }
    const lang = langMap[languageStore.language] || 'english'
    console.log(`Searching for "${term}" in language: ${lang} (Store value: ${languageStore.language})`)
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
@import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&family=Outfit:wght@700;800&display=swap');

.landing-container {
  display: flex;
  flex-direction: column;
  height: 100vh;
  /* Soft, vibrant gradient similar to the inspiration but with our blue/light blue theme */
  background: radial-gradient(circle at 50% 30%, #ffffff 0%, #e0f2fe 40%, #bae6fd 80%, #7dd3fc 100%);
  font-family: 'Inter', sans-serif;
  overflow-y: auto;
  overflow-x: hidden;
}

/* Header Styles */
.top-nav {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 1rem 3rem;
  width: 100%;
  position: sticky;
  top: 0;
  z-index: 1000;
  background: rgba(255, 255, 255, 0.6);
  backdrop-filter: blur(12px);
  -webkit-backdrop-filter: blur(12px);
  border-bottom: 1px solid rgba(0, 0, 0, 0.05);
}

.logo {
  font-family: 'Outfit', sans-serif;
  font-size: 1.5rem;
  font-weight: 800;
  letter-spacing: -0.5px;
}

.logo-dark {
  color: #1e3a8a; /* Dark Blue */
}

.logo-light {
  color: #3b82f6; /* Bright Blue */
}

.nav-links {
  display: flex;
  align-items: center;
  gap: 0.75rem;
}

.nav-btn {
  background: white;
  border: 1px solid rgba(0, 0, 0, 0.05);
  color: #3b82f6;
  font-weight: 700;
  font-size: 0.85rem;
  padding: 8px 16px;
  border-radius: 50px;
  cursor: pointer;
  transition: all 0.3s ease;
  box-shadow: 0 2px 8px rgba(59, 130, 246, 0.05);
  display: flex;
  align-items: center;
  gap: 6px;
}

.nav-btn:hover {
  background: #f0f9ff;
  color: #1d4ed8;
  border-color: rgba(59, 130, 246, 0.2);
  transform: translateY(-1px);
  box-shadow: 0 4px 12px rgba(59, 130, 246, 0.1);
}

.nav-btn:active {
  transform: translateY(0);
}

/* Main Content */
.landing-content {
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 2rem 1rem 4rem;
  text-align: center;
}

.hero-section {
  display: flex;
  flex-direction: column;
  align-items: center;
  margin-top: 4rem;
  margin-bottom: 2rem;
}

/* Pill Badge */
.pill-badge {
  display: inline-flex;
  align-items: center;
  background-color: rgba(219, 234, 254, 0.7); /* Light blue bg */
  color: #2563eb;
  font-size: 0.75rem;
  font-weight: 700;
  letter-spacing: 1px;
  padding: 0.4rem 1rem;
  border-radius: 50px;
  margin-bottom: 1.5rem;
  border: 1px solid rgba(191, 219, 254, 0.5);
  box-shadow: 0 2px 10px rgba(59, 130, 246, 0.1);
}

.dot {
  width: 6px;
  height: 6px;
  background-color: #3b82f6;
  border-radius: 50%;
  margin-right: 8px;
  box-shadow: 0 0 5px #3b82f6;
}

/* Main Title */
.main-title {
  font-family: 'Outfit', sans-serif;
  font-size: 6rem;
  line-height: 1;
  margin: 0;
  letter-spacing: -2px;
}

.title-dark {
  color: #0f172a; /* Very dark slate/blue */
}

.title-light {
  color: #3b82f6; /* Bright blue */
}

/* Subtitle */
.subtitle {
  font-size: 1.25rem;
  color: #64748b;
  margin-top: 1rem;
  margin-bottom: 2rem;
  font-weight: 500;
}

/* Search Bar Wrapper */
.search-bar-wrapper {
  display: flex;
  align-items: center;
  background: white;
  padding: 0.5rem;
  border-radius: 50px;
  box-shadow: 0 10px 25px rgba(0, 0, 0, 0.05);
  margin-bottom: 2rem;
  width: 100%;
  min-width: 500px;
  border: 1px solid #e2e8f0;
  transition: box-shadow 0.3s ease;
}

.search-bar-wrapper:focus-within {
  box-shadow: 0 10px 30px rgba(59, 130, 246, 0.15);
  border-color: #bfdbfe;
}

.search-bar {
  flex: 1;
  border: none;
  outline: none;
  padding: 0.75rem 1.25rem;
  font-size: 1.05rem;
  color: #334155;
  background: transparent;
}

.search-bar::placeholder {
  color: #94a3b8;
}

.search-btn {
  background: #3b82f6;
  border: none;
  color: white;
  width: 45px;
  height: 45px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  font-size: 1.2rem;
  transition: all 0.2s ease;
}

.search-btn:hover {
  background: #2563eb;
  transform: scale(1.05);
}

/* Action Buttons */
.action-buttons {
  display: flex;
  gap: 1rem;
  margin-bottom: 2rem;
}

.btn-secondary {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  background-color: white;
  color: #334155;
  padding: 0.8rem 1.5rem;
  border-radius: 50px;
  font-weight: 600;
  font-size: 1rem;
  cursor: pointer;
  box-shadow: 0 4px 15px rgba(0, 0, 0, 0.05);
  border: 1px solid #f1f5f9;
  transition: all 0.2s ease;
}

.btn-secondary:hover {
  background-color: #f8fafc;
  transform: translateY(-2px);
  box-shadow: 0 6px 20px rgba(0, 0, 0, 0.08);
}

.btn-primary {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  background-color: #3b82f6;
  color: white;
  padding: 0.8rem 1.5rem;
  border-radius: 50px;
  font-weight: 600;
  font-size: 1rem;
  border: none;
  cursor: pointer;
  box-shadow: 0 4px 15px rgba(59, 130, 246, 0.3);
  transition: all 0.2s ease;
}

.btn-primary:hover {
  background-color: #2563eb;
  transform: translateY(-2px);
  box-shadow: 0 6px 20px rgba(59, 130, 246, 0.4);
}

.arrow {
  transition: transform 0.2s ease;
}

  .btn-primary:hover .arrow {
    transform: translateX(4px);
  }
  
  /* Marquee Styles */
  .marquee-container {
    width: 100%;
    max-width: 900px;
    overflow: hidden;
    margin-top: 1rem;
    padding: 1rem 0;
    /* Create a fade out effect on the edges */
    -webkit-mask-image: linear-gradient(to right, transparent, black 10%, black 90%, transparent);
    mask-image: linear-gradient(to right, transparent, black 10%, black 90%, transparent);
  }
  
  .marquee-track {
    display: flex;
    gap: 1.5rem;
    width: max-content;
    animation: scroll-left 40s linear infinite;
  }
  
  .marquee-track:hover {
    animation-play-state: paused;
  }
  
  @keyframes scroll-left {
    0% {
      transform: translateX(0);
    }
    100% {
      transform: translateX(calc(-20% - 0.3rem)); /* Using 20% because we duplicated 5 times */
    }
  }
  
  .marquee-card {
    background: white;
    border-radius: 12px;
    padding: 1rem 1.5rem;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    min-width: 160px;
    box-shadow: 0 4px 15px rgba(0, 0, 0, 0.05);
    border: 1px solid #f1f5f9;
    transition: transform 0.2s ease;
  }
  
  .marquee-card:hover {
    transform: translateY(-5px);
    box-shadow: 0 8px 25px rgba(0, 0, 0, 0.1);
  }
  
  .med-name {
    font-family: 'Inter', sans-serif;
    font-weight: 700;
    color: #1e293b;
    font-size: 0.95rem;
    margin-bottom: 0.4rem;
    text-align: center;
    white-space: nowrap;
  }
  
  .med-cat {
    font-size: 0.75rem;
    color: #10b981; /* Green color to resemble discount badges */
    font-weight: 700;
    background: #d1fae5;
    padding: 3px 10px;
    border-radius: 50px;
    text-transform: uppercase;
    letter-spacing: 0.5px;
  }
  
  /* General Result Styles */
.fade-in {
  animation: fadeIn 0.4s ease forwards;
}

@keyframes fadeIn {
  from { opacity: 0; transform: translateY(10px); }
  to { opacity: 1; transform: translateY(0); }
}

.search-results-wrapper {
  max-width: 700px;
  width: 100%;
}

.gemini-card {
  background: rgba(255, 255, 255, 0.85);
  border-radius: 20px;
  padding: 2rem;
  box-shadow: 0 10px 40px rgba(0, 0, 0, 0.08);
  text-align: left;
  color: #1e293b;
  backdrop-filter: blur(20px);
  border: 1px solid rgba(255, 255, 255, 0.6);
  max-height: 60vh;
  overflow-y: auto;
}

.gemini-header h3 {
  margin: 0 0 1rem 0;
  font-size: 1.5rem;
  color: #2563eb;
  display: flex;
  align-items: center;
  gap: 8px;
  font-family: 'Outfit', sans-serif;
}

.gemini-content .summary {
  font-size: 1.1rem;
  line-height: 1.6;
  font-weight: 500;
  color: #334155;
  margin-bottom: 1.5rem;
  padding-bottom: 1.5rem;
  border-bottom: 1px solid #e2e8f0;
}

.details-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
  gap: 1.5rem;
}

.detail-item h4 {
  margin: 0 0 0.5rem 0;
  font-size: 0.85rem;
  text-transform: uppercase;
  letter-spacing: 0.5px;
  color: #64748b;
  font-weight: 700;
}

.detail-item p {
  margin: 0;
  font-size: 0.95rem;
  line-height: 1.6;
  color: #475569;
}

.correction {
  margin-top: 1.5rem;
  padding: 1rem;
  background: #fef3c7;
  color: #b45309;
  border-radius: 12px;
  font-size: 0.95rem;
  font-weight: 500;
}

.no-results {
  text-align: center;
  color: #ef4444;
  font-weight: 500;
}

.searching-status {
  margin-top: 1.5rem;
  text-align: center;
  color: #3b82f6;
  font-size: 1.1rem;
  font-weight: 600;
  animation: pulse 1.5s infinite;
}

@keyframes pulse {
  0% { opacity: 0.6; }
  50% { opacity: 1; }
  100% { opacity: 0.6; }
}

.scanner-container {
  width: 100%;
  max-width: 600px;
  background: rgba(255, 255, 255, 0.9);
  border-radius: 16px;
  padding: 1rem;
  box-shadow: 0 10px 30px rgba(0, 0, 0, 0.1);
  backdrop-filter: blur(10px);
}

/* Responsive Styles */
@media (max-width: 768px) {
  .main-title {
    font-size: 4rem;
  }
  .top-nav {
    padding: 1.5rem;
  }
  .search-bar-wrapper {
    min-width: unset;
    width: 100%;
  }
  .action-buttons {
    flex-direction: column;
    width: 100%;
    max-width: 300px;
  }
  .btn-secondary, .btn-primary {
    width: 100%;
    justify-content: center;
  }
}
</style>
