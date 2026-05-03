<template>
  <div class="landing-container">
    <div class="landing-content">
      <h1>Welcome to MARS</h1>
      <p>Find pharMARScies near you</p>
      <button @click="goToPharmacyMap" class="btn-primary">
        Pharmacy Near Me
      </button>
    </div>
  </div>
</template>

<script setup>
import { useRouter } from 'vue-router'

const router = useRouter()

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
</style>
