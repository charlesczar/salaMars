<template>
  <div class="landing-container">
    <div class="landing-content">
      <h1>Welcome to MARSakit</h1>
      <p>Find pharMARScies near you</p>
      <button @click="goToPharmacyMap" class="btn-primary">
        Pharmacy Near Me
      </button>
    </div>
  </div>

  <!-- Floating action to open tools (search / scan) -->
  <button class="fab" @click="showTools = true" aria-label="Open search and scanner">🔍</button>

  <!-- Modal with search and scanner, keeps landing design unchanged -->
  <div v-if="showTools" class="modal-overlay" @click.self="showTools = false">
    <div class="modal">
      <header class="modal-header">
        <h3>Search & Scan</h3>
        <button class="close" @click="showTools = false">✕</button>
      </header>
      <section class="modal-body">
        <MedicineSearch />
        <MedicineScanner />
      </section>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import MedicineSearch from '@/components/MedicineSearch.vue'
import MedicineScanner from '@/components/MedicineScanner.vue'

const router = useRouter()
const showTools = ref(false)

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

/* Floating action button */
.fab {
  position: fixed;
  right: 20px;
  bottom: 20px;
  width: 56px;
  height: 56px;
  border-radius: 50%;
  border: none;
  background: #10b981;
  color: white;
  font-size: 22px;
  cursor: pointer;
  box-shadow: 0 8px 20px rgba(16,185,129,0.2);
}

/* Modal styles */
.modal-overlay {
  position: fixed;
  inset: 0;
  background: rgba(0,0,0,0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 2000;
}

.modal {
  width: min(920px, 95%);
  max-height: 90vh;
  overflow: auto;
  background: white;
  border-radius: 12px;
  box-shadow: 0 20px 50px rgba(0,0,0,0.2);
  padding: 14px;
}

.modal-header { display:flex; align-items:center; justify-content:space-between; gap:12px }
.modal-header h3 { margin:0 }
.close { background:transparent; border:none; font-size:18px; cursor:pointer }
.modal-body { display:flex; flex-direction:column; gap:12px; margin-top:10px }

</style>
