<template>
  <!-- ─── App Shell ─────────────────────────────────────────── -->
  <div class="app-shell">
    <!-- ─── Top Header ───────────────────────────────────────── -->
    <header class="top-header">
      <button class="back-btn" @click="goHome" aria-label="Go back to home">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <path d="M19 12H5M12 19l-7-7 7-7" />
        </svg>
      </button>
      <div class="header-brand">
        <!-- pulse dot -->
        <span class="brand-dot"></span>
        <span class="brand-name">MARSakit</span>
      </div>

      <div class="header-search">
        <svg
          class="search-icon"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          stroke-width="2"
        >
          <circle cx="11" cy="11" r="8" />
          <path d="M21 21l-4.35-4.35" />
        </svg>
        <input
          class="search-input"
          type="text"
          :placeholder="labels.searchPlaceholder"
          :aria-label="labels.searchAriaLabel"
          v-model="searchQuery"
          @input="filterMarkers"
        />
      </div>
      <LanguageSelector />
    </header>

    <!-- ─── Map (fills all remaining space) ──────────────────── -->
    <main class="map-wrapper">
      <div id="map" class="map" aria-label="Map showing nearby pharmacies"></div>

      <!-- Status pill -->
      <div class="status-pill" :class="statusClass" v-show="statusMsg">
        <span class="status-dot"></span>
        {{ statusMsg }}
      </div>

      <!-- FAB -->
      <button
        class="fab"
        :class="{ loading: isLocating }"
        @click="refresh"
        :aria-label="labels.locating"
        :title="labels.locating"
      >
        <svg
          v-if="!isLocating"
          class="fab-icon"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          stroke-width="2.5"
        >
          <circle cx="12" cy="12" r="3" />
          <path d="M12 2v3M12 19v3M2 12h3M19 12h3" />
          <path d="M12 5a7 7 0 1 0 0 14A7 7 0 0 0 12 5z" />
        </svg>
        <svg
          v-else
          class="fab-icon spin"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          stroke-width="2.5"
        >
          <path d="M21 12a9 9 0 1 1-6.219-8.56" />
        </svg>
      </button>

      <!-- Count chip -->
      <div class="count-chip" v-if="pharmacyCount > 0">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
          <polyline points="9 22 9 12 15 12 15 22" />
        </svg>
        {{ labels.nearbyPharmacies(pharmacyCount) }}
      </div>

      <!-- Bottom Sheet / Desktop Sidebar -->
      <transition name="sheet">
        <div
          class="bottom-sheet"
          :class="{ expanded: sheetExpanded }"
          v-if="selectedPharmacy"
          role="dialog"
          aria-modal="false"
          aria-label="Pharmacy details"
        >
          <div class="sheet-handle" @click="sheetExpanded = !sheetExpanded"></div>
          <div class="sheet-body">
            <div class="sheet-pill-row">
              <span class="sheet-badge">{{ labels.pharmacyBadge }}</span>
              <button class="sheet-close" @click="closeSheet" aria-label="Close">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
                  <path d="M18 6L6 18M6 6l12 12" />
                </svg>
              </button>
            </div>
            <h2 class="sheet-name">{{ selectedPharmacy.name }}</h2>
            <div class="sheet-meta">
              <div class="meta-item" v-if="selectedPharmacy.address">
                <svg
                  class="meta-icon"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  stroke-width="2"
                >
                  <path
                    d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7z"
                  />
                  <circle cx="12" cy="9" r="2.5" />
                </svg>
                <span>{{ selectedPharmacy.address }}</span>
              </div>
              <div class="meta-item" v-if="selectedPharmacy.phone">
                <svg
                  class="meta-icon"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  stroke-width="2"
                >
                  <path
                    d="M22 16.92v3a2 2 0 0 1-2.18 2c-3.45-.44-6.74-1.66-9.63-3.56a20.7 20.7 0 0 1-3.73-3.73 20.63 20.63 0 0 1-3.56-9.63A2 2 0 0 1 4.91 2h3a2 2 0 0 1 2 1.72c.12.9.33 1.78.63 2.63a2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.45-1.45a2 2 0 0 1 2.11-.45c.85.3 1.73.51 2.63.63A2 2 0 0 1 22 16.92z"
                  />
                </svg>
                <span>{{ selectedPharmacy.phone }}</span>
              </div>
              <div class="meta-item" v-if="selectedPharmacy.opening_hours">
                <svg
                  class="meta-icon"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  stroke-width="2"
                >
                  <circle cx="12" cy="12" r="10" />
                  <polyline points="12 6 12 12 16 14" />
                </svg>
                <span>{{ selectedPharmacy.opening_hours }}</span>
              </div>
            </div>
            <div class="sheet-actions">
              <button class="action-btn primary" @click="getDirections">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <polygon points="3 11 22 2 13 21 11 13 3 11" />
                </svg>
                {{ labels.directions }}
              </button>
              <button class="action-btn secondary" @click="closeSheet">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <path d="M18 6L6 18M6 6l12 12" />
                </svg>
                {{ labels.dismiss }}
              </button>
            </div>
          </div>
        </div>
      </transition>
    </main>
  </div>
</template>

<script setup>
import { onMounted, onBeforeUnmount, ref, watch, nextTick, computed } from 'vue'
import LanguageSelector from './LanguageSelector.vue'
import { useRouter } from 'vue-router'
import { useLanguageStore } from '@/stores/language'
import { buildApiUrl } from '@/utils/api.ts'
import L from 'leaflet'
import 'leaflet/dist/leaflet.css'
import iconUrl from 'leaflet/dist/images/marker-icon.png'
import iconRetinaUrl from 'leaflet/dist/images/marker-icon-2x.png'
import shadowUrl from 'leaflet/dist/images/marker-shadow.png'
import pharmacyIconUrl from '../assets/Mars-Medicine.png'

// ─── Leaflet default icon fix ────────────────────────────────────────────────
L.Icon.Default.mergeOptions({ iconUrl, iconRetinaUrl, shadowUrl })

// ─── Router ───────────────────────────────────────────────────────────────────
const router = useRouter()
const languageStore = useLanguageStore()

const labels = computed(() => {
  if (languageStore.language === 'tl') {
    return {
      searchPlaceholder: 'Maghanap ng mga botika…',
      searchAriaLabel: 'Maghanap ng mga botika',
      nearbyPharmacies: (count) => `${count} Botikang malapit`,
      resultsFor: (shown, query) => `${shown} resulta para sa "${query}"`,
      pharmacyBadge: 'Botika',
      directions: 'Ruta',
      dismiss: 'Isara',
      locating: 'Hinahanap ang iyong lokasyon…',
      searching: 'Naghahanap ng mga botika…',
      failedLoad: 'Nabigong i-load ang mga botika',
      noDataReturned: 'Walang natanggap na datos',
      noPharmaciesFound: 'Walang nahanap na botika na malapit',
      networkError: 'Error sa network — subukan muli',
      geolocationUnsupported: 'Hindi suportado ang pagkuha ng lokasyon',
      locationDenied: 'Tinanggihan ang pag-access sa lokasyon',
    }
  }

  if (languageStore.language === 'bisaya') {
    return {
      searchPlaceholder: 'Pangitaa ang mga botika…',
      searchAriaLabel: 'Pangitaa ang mga botika',
      nearbyPharmacies: (count) => `${count} botika duol nimo`,
      resultsFor: (shown, query) => `${shown} resulta para sa "${query}"`,
      pharmacyBadge: 'Botika',
      directions: 'Direksyon',
      dismiss: 'Isalikway',
      locating: 'Gipangita ang imong lokasyon…',
      searching: 'Nangita og mga botika…',
      failedLoad: 'Napakyas ang pag-load sa mga botika',
      noDataReturned: 'Walay nadawat nga datos',
      noPharmaciesFound: 'Walay nakit-an nga botika duol nimo',
      networkError: 'Error sa network — sulayi pag-usab',
      geolocationUnsupported: 'Dili suportado ang pagkuha sa lokasyon',
      locationDenied: 'Gidili ang pag-access sa lokasyon',
    }
  }

  return {
    searchPlaceholder: 'Search pharmacies…',
    searchAriaLabel: 'Search pharmacies',
    nearbyPharmacies: (count) => `${count} pharmacies nearby`,
    resultsFor: (shown, query) => `${shown} result${shown !== 1 ? 's' : ''} for "${query}"`,
    pharmacyBadge: 'Pharmacy',
    directions: 'Directions',
    dismiss: 'Dismiss',
    locating: 'Locating you…',
    searching: 'Searching for pharmacies…',
    failedLoad: 'Failed to load pharmacies',
    noDataReturned: 'No data returned',
    noPharmaciesFound: 'No pharmacies found nearby',
    networkError: 'Network error — please retry',
    geolocationUnsupported: 'Geolocation not supported',
    locationDenied: 'Location access denied',
  }
})

function goHome() {
  router.push({ name: 'home' })
}

// ─── Custom pharmacy icon ─────────────────────────────────────────────────────
const pharmacyIcon = L.icon({
  iconUrl: pharmacyIconUrl,
  iconRetinaUrl: pharmacyIconUrl,
  iconSize: [40, 40],
  iconAnchor: [20, 40],
  popupAnchor: [0, -44],
  className: 'pharmacy-icon',
})

// ─── State ────────────────────────────────────────────────────────────────────
let map = null
let markersLayer = null
let userLayer = null // dedicated layer — never cleared by fetchPharmacies
const SEARCH_RADIUS_METERS = 2000

const isLocating = ref(false)
const statusMsg = ref('')
const statusClass = ref('info')
const pharmacyCount = ref(0)
const selectedPharmacy = ref(null)
const sheetExpanded = ref(false)
const searchQuery = ref('')

// store all loaded pharmacy data for client-side filtering
let allPharmacies = []

// Re-fit map when sidebar opens/closes on desktop
watch(selectedPharmacy, async () => {
  await nextTick()
  setTimeout(() => map && map.invalidateSize(), 80)
})

// ─── Helpers ──────────────────────────────────────────────────────────────────
function escapeHtml(str) {
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;')
}

function setStatus(msg, type = 'info', duration = 3000) {
  statusMsg.value = msg
  statusClass.value = type
  if (duration)
    setTimeout(() => {
      statusMsg.value = ''
    }, duration)
}

// ─── Bottom sheet ─────────────────────────────────────────────────────────────
function openSheet(pharmacy) {
  selectedPharmacy.value = pharmacy
  sheetExpanded.value = false
}

function closeSheet() {
  selectedPharmacy.value = null
  sheetExpanded.value = false
}

function getDirections() {
  if (!selectedPharmacy.value) return
  const { lat, lon } = selectedPharmacy.value
  window.open(`https://www.google.com/maps/dir/?api=1&destination=${lat},${lon}`, '_blank')
}

// ─── Search / filter ─────────────────────────────────────────────────────────
function filterMarkers() {
  const q = searchQuery.value.trim().toLowerCase()
  markersLayer.clearLayers()

  const toShow = q ? allPharmacies.filter((p) => p.name.toLowerCase().includes(q)) : allPharmacies

  let shown = 0
  toShow.forEach((p) => {
    if (!p.marker) return
    p.marker.addTo(markersLayer)
    shown++
  })

  pharmacyCount.value = shown
  if (q) setStatus(labels.value.resultsFor(shown, q), 'info', 0)
  else setStatus(labels.value.nearbyPharmacies(shown), 'success')
}

// ─── Fetch pharmacies ─────────────────────────────────────────────────────────
async function fetchPharmacies(lat, lon) {
  setStatus(labels.value.searching, 'info', 0)
  try {
    const url = new URL(buildApiUrl('/api/pharmacies'))
    url.searchParams.set('latitude', lat.toString())
    url.searchParams.set('longitude', lon.toString())
    url.searchParams.set('radius', SEARCH_RADIUS_METERS.toString())

    const resp = await fetch(url.toString())

    if (!resp.ok) {
      setStatus(labels.value.failedLoad, 'error')
      console.error('Pharmacy API error:', resp.status, await resp.text())
      return
    }

    const data = await resp.json()
    if (!data.elements || !Array.isArray(data.elements)) {
      setStatus(labels.value.noDataReturned, 'warning')
      return
    }

    allPharmacies = []
    markersLayer.clearLayers()
    let added = 0

    data.elements.forEach((el) => {
      const elLat = el.type === 'node' ? el.lat : el.center?.lat
      const elLon = el.type === 'node' ? el.lon : el.center?.lon
      if (!elLat || !elLon) return

      const tags = el.tags || {}
      const name = tags.name ? escapeHtml(tags.name) : labels.value.pharmacyBadge
      const address = tags['addr:street'] ? escapeHtml(tags['addr:street']) : ''
      const phone = tags.phone ? escapeHtml(tags.phone) : ''
      const hours = tags.opening_hours ? escapeHtml(tags.opening_hours) : ''

      const popupHtml = `
        <div class="mp-popup">
          <div class="mp-popup-header">
            <span class="mp-popup-name">${name}</span>
          </div>
          ${address ? `<p class="mp-popup-addr">${address}</p>` : ''}
        </div>`

      const marker = L.marker([elLat, elLon], { icon: pharmacyIcon, riseOnHover: true })
        .addTo(markersLayer)
        .bindPopup(popupHtml, { maxWidth: 260, className: 'ms-popup' })

      marker.on('click', () => {
        openSheet({ name, address, phone, opening_hours: hours, lat: elLat, lon: elLon })
      })

      allPharmacies.push({
        name,
        address,
        phone,
        opening_hours: hours,
        lat: elLat,
        lon: elLon,
        marker,
      })
      added++
    })

    pharmacyCount.value = added

    if (added === 0) {
      setStatus(labels.value.noPharmaciesFound, 'warning')
    } else {
      setStatus(labels.value.nearbyPharmacies(added), 'success')
    }
  } catch (err) {
    setStatus(labels.value.networkError, 'error')
    console.error('Failed to fetch pharmacies from backend', err)
  }
}

// ─── Geolocation ──────────────────────────────────────────────────────────────
async function locateAndFetch() {
  if (!('geolocation' in navigator)) {
    setStatus(labels.value.geolocationUnsupported, 'error')
    return
  }
  isLocating.value = true
  setStatus(labels.value.locating, 'info', 0)

  navigator.geolocation.getCurrentPosition(
    async (pos) => {
      const { latitude, longitude } = pos.coords
      map.setView([latitude, longitude], 15)

      L.circle([latitude, longitude], {
        radius: SEARCH_RADIUS_METERS,
        color: '#2563eb',
        weight: 1.5,
        dashArray: '6 4',
        fill: true,
        fillColor: '#2563eb',
        fillOpacity: 0.05,
      }).addTo(map)

      // User location — animated pulsing dot via DivIcon (CSS-based, works cross-browser)
      const userIcon = L.divIcon({
        className: 'user-location-marker-icon',
        html: `<div class="user-location-wrap">
          <div class="user-pulse-ring"></div>
          <div class="user-pulse-ring delay"></div>
          <div class="user-dot"></div>
        </div>`,
        iconSize: [50, 50],
        iconAnchor: [25, 25],
      })
      L.marker([latitude, longitude], {
        icon: userIcon,
        zIndexOffset: 2000,
        interactive: false,
      }).addTo(userLayer) // goes on its OWN layer so clearLayers() on markersLayer won't touch it

      setTimeout(() => map.invalidateSize && map.invalidateSize(), 200)
      await fetchPharmacies(latitude, longitude)
      isLocating.value = false
    },
    (err) => {
      isLocating.value = false
      setStatus(labels.value.locationDenied, 'error')
      console.error('Geolocation error:', err?.message || err)
    },
    { enableHighAccuracy: true, timeout: 10000 },
  )
}

function refresh() {
  closeSheet()
  pharmacyCount.value = 0
  searchQuery.value = ''
  allPharmacies = []
  try {
    markersLayer && markersLayer.clearLayers()
  } catch (e) {}
  try {
    userLayer && userLayer.clearLayers()
  } catch (e) {}
  locateAndFetch()
}

// ─── Lifecycle ────────────────────────────────────────────────────────────────
onMounted(() => {
  map = L.map('map', { zoomControl: false }).setView([14.5920, 121.0067], 13)

  L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    attribution: '© <a href="https://openstreetmap.org">OpenStreetMap</a>',
  }).addTo(map)

  L.control.zoom({ position: 'bottomright' }).addTo(map)

  markersLayer = L.layerGroup().addTo(map)
  userLayer = L.layerGroup().addTo(map) // rendered on top of pharmacy markers
  locateAndFetch()
})

onBeforeUnmount(() => {
  if (map) map.remove()
})
</script>

<style>
@import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap');

.ms-popup .leaflet-popup-content-wrapper {
  background: #0f172a;
  border-radius: 16px;
  box-shadow: 0 8px 32px rgba(37, 99, 235, 0.25);
  padding: 0;
  overflow: hidden;
}
.ms-popup .leaflet-popup-tip {
  background: #0f172a;
}
.ms-popup .leaflet-popup-close-button {
  color: #93c5fd !important;
  top: 8px !important;
  right: 10px !important;
}

.mp-popup {
  font-family: 'Inter', sans-serif;
  padding: 14px 16px 12px;
  min-width: 180px;
}
.mp-popup-header {
  margin-bottom: 6px;
}
.mp-popup-name {
  font-size: 14px;
  font-weight: 700;
  color: #f1f5f9;
  line-height: 1.3;
}
.mp-popup-addr {
  font-size: 12px;
  color: #94a3b8;
  margin: 0 0 10px;
}

.leaflet-marker-icon.pharmacy-icon {
  border-radius: 10px;
  box-shadow: 0 4px 16px rgba(37, 99, 235, 0.45);
  background: rgba(255, 255, 255, 0.95);
  border: 2px solid #2563eb;
  transform: translateY(-4px);
}

.leaflet-control-zoom a {
  font-family: 'Inter', sans-serif !important;
  border-radius: 10px !important;
  margin-bottom: 4px !important;
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.18) !important;
}

/* ─── User location pulsing dot ─────────────────────────────── */
.user-location-marker-icon {
  filter: drop-shadow(0 2px 8px rgba(37, 99, 235, 0.6)) !important;
}

.user-location-wrap {
  position: relative;
  width: 80px;
  height: 80px;
  display: flex;
  align-items: center;
  justify-content: center;
  overflow: visible;
}

.user-dot {
  width: 20px;
  height: 20px;
  border-radius: 50%;
  background: #2563eb;
  border: 3px solid #fff;
  box-shadow: 0 0 20px rgba(37, 99, 235, 1), inset 0 0 10px rgba(37, 99, 235, 0.5);
  position: absolute;
  z-index: 10;
}

.user-pulse-ring {
  position: absolute;
  border-radius: 50%;
  border: 2.5px solid #2563eb;
  left: 50%;
  top: 50%;
  width: 20px;
  height: 20px;
  transform: translate(-50%, -50%) scale(1);
  animation: user-pulse 2s ease-out infinite;
  opacity: 0.7;
}

.user-pulse-ring.delay {
  animation-delay: 1s;
}

@keyframes user-pulse {
  0% {
    transform: translate(-50%, -50%) scale(1);
    opacity: 0.8;
  }
  100% {
    transform: translate(-50%, -50%) scale(4);
    opacity: 0;
  }
}
</style>

<style scoped>
*,
*::before,
*::after {
  box-sizing: border-box;
}

.app-shell {
  font-family: 'Inter', sans-serif;
  position: fixed;
  inset: 0;
  display: flex;
  flex-direction: column;
  background: #0f0e17;
  overflow: hidden;
}

.top-header {
  position: relative;
  z-index: 1100;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 12px;
  padding: 12px 16px 10px;
  background: linear-gradient(135deg, #1565c0 0%, #1976d2 60%, #2196f3 100%);
  border-bottom: none;
  box-shadow: 0 4px 20px rgba(21, 101, 192, 0.4);
}

.back-btn {
  position: absolute;
  left: 16px;
  width: 36px;
  height: 36px;
  border-radius: 8px;
  border: 1px solid rgba(255, 255, 255, 0.2);
  background: rgba(255, 255, 255, 0.08);
  color: rgba(255, 255, 255, 0.8);
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  transition: all 0.2s ease;
  flex-shrink: 0;
}

.back-btn:hover {
  background: rgba(255, 255, 255, 0.15);
  color: #fff;
  border-color: rgba(255, 255, 255, 0.3);
}

.back-btn:active {
  transform: scale(0.95);
}

.back-btn svg {
  width: 20px;
  height: 20px;
}

.header-brand {
  display: flex;
  align-items: center;
  gap: 8px;
  flex-shrink: 0;
}

.brand-dot {
  width: 10px;
  height: 10px;
  border-radius: 50%;
  background: #fff;
  box-shadow: 0 0 0 3px rgba(255, 255, 255, 0.3);
  animation: pulse-dot 2.2s ease-in-out infinite;
}

@keyframes pulse-dot {
  0%,
  100% {
    box-shadow: 0 0 0 3px rgba(255, 255, 255, 0.3);
  }
  50% {
    box-shadow: 0 0 0 7px rgba(255, 255, 255, 0.1);
  }
}

.brand-name {
  font-size: 18px;
  font-weight: 700;
  letter-spacing: -0.4px;
  color: #fff;
  -webkit-text-fill-color: #fff;
}

.header-search {
  flex: 0 0 auto;
  width: clamp(220px, 45%, 560px);
  display: flex;
  align-items: center;
  background: rgba(255, 255, 255, 0.18);
  border: 1px solid rgba(255, 255, 255, 0.3);
  border-radius: 12px;
  padding: 7px 12px;
  gap: 8px;
  transition:
    border-color 0.2s,
    background 0.2s;
  cursor: text;
}
.header-search:hover {
  background: rgba(255, 255, 255, 0.25);
  border-color: rgba(255, 255, 255, 0.5);
}

.search-icon {
  width: 15px;
  height: 15px;
  color: rgba(255, 255, 255, 0.75);
  flex-shrink: 0;
}

.search-input {
  flex: 1;
  background: transparent;
  border: 0;
  outline: none;
  font-size: 13px;
  color: #fff;
  font-family: 'Inter', sans-serif;
  min-width: 0;
}
.search-input::placeholder {
  color: rgba(255, 255, 255, 0.55);
}

/* avatar removed */

.map-wrapper {
  flex: 1;
  position: relative;
  overflow: hidden;
}

.map {
  width: 100%;
  height: 100%;
}

.status-pill {
  position: absolute;
  top: 14px;
  left: 50%;
  transform: translateX(-50%);
  z-index: 900;
  display: flex;
  align-items: center;
  gap: 7px;
  padding: 7px 16px;
  border-radius: 999px;
  font-size: 12px;
  font-weight: 600;
  white-space: nowrap;
  backdrop-filter: blur(8px);
  -webkit-backdrop-filter: blur(8px);
  animation: slide-down 0.3s ease;
}

@keyframes slide-down {
  from {
    opacity: 0;
    transform: translateX(-50%) translateY(-8px);
  }
  to {
    opacity: 1;
    transform: translateX(-50%) translateY(0);
  }
}

.status-dot {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  flex-shrink: 0;
}

.status-pill.info {
  background: rgba(12, 26, 58, 0.88);
  color: #93c5fd;
  border: 1px solid rgba(37, 99, 235, 0.35);
}
.status-pill.info .status-dot {
  background: #2563eb;
}
.status-pill.success {
  background: rgba(6, 78, 59, 0.88);
  color: #6ee7b7;
  border: 1px solid rgba(16, 185, 129, 0.3);
}
.status-pill.success .status-dot {
  background: #10b981;
}
.status-pill.warning {
  background: rgba(78, 52, 6, 0.88);
  color: #fcd34d;
  border: 1px solid rgba(245, 158, 11, 0.3);
}
.status-pill.warning .status-dot {
  background: #f59e0b;
}
.status-pill.error {
  background: rgba(78, 6, 24, 0.88);
  color: #fca5a5;
  border: 1px solid rgba(244, 63, 94, 0.3);
}
.status-pill.error .status-dot {
  background: #f43f5e;
}

.count-chip {
  position: absolute;
  left: 14px;
  bottom: 22px;
  z-index: 800;
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 7px 14px;
  border-radius: 999px;
  background: rgba(15, 14, 23, 0.85);
  backdrop-filter: blur(8px);
  -webkit-backdrop-filter: blur(8px);
  border: 1px solid rgba(255, 255, 255, 0.08);
  color: #93c5fd;
  font-size: 12px;
  font-weight: 600;
  animation: fade-in 0.4s ease;
}
.count-chip svg {
  width: 14px;
  height: 14px;
  color: #2563eb;
}

@keyframes fade-in {
  from {
    opacity: 0;
    transform: translateY(6px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.fab {
  position: absolute;
  right: 20px;
  bottom: 110px;
  z-index: 900;
  width: 56px;
  height: 56px;
  border-radius: 50%;
  border: 0;
  background: linear-gradient(135deg, #1d4ed8 0%, #3b82f6 100%);
  color: #fff;
  box-shadow: 0 4px 20px rgba(37, 99, 235, 0.5);
  cursor: pointer;
  display: grid;
  place-items: center;
  transition:
    transform 0.25s cubic-bezier(0.34, 1.56, 0.64, 1),
    box-shadow 0.25s;
}
.fab:hover {
  transform: scale(1.1);
  box-shadow: 0 6px 28px rgba(37, 99, 235, 0.65);
}
.fab:active {
  transform: scale(0.95);
}
.fab.loading {
  background: linear-gradient(135deg, #1e40af 0%, #2563eb 100%);
}

.fab-icon {
  width: 24px;
  height: 24px;
}

@keyframes spin-anim {
  to {
    transform: rotate(360deg);
  }
}
.spin {
  animation: spin-anim 0.8s linear infinite;
}

.bottom-sheet {
  position: absolute;
  left: 0;
  right: 0;
  bottom: 0;
  z-index: 1000;
  background: rgba(22, 20, 40, 0.96);
  backdrop-filter: blur(20px);
  -webkit-backdrop-filter: blur(20px);
  border-top: 1px solid rgba(255, 255, 255, 0.08);
  border-radius: 24px 24px 0 0;
  box-shadow: 0 -8px 40px rgba(0, 0, 0, 0.45);
  transition: transform 0.35s cubic-bezier(0.32, 0.72, 0, 1);
  max-height: 85dvh;
  overflow: hidden;
}

.bottom-sheet.expanded {
  overflow-y: auto;
}

.sheet-enter-active {
  transition:
    transform 0.35s cubic-bezier(0.32, 0.72, 0, 1),
    opacity 0.2s;
}
.sheet-leave-active {
  transition:
    transform 0.25s ease,
    opacity 0.2s;
}
.sheet-enter-from {
  transform: translateY(100%);
  opacity: 0;
}
.sheet-leave-to {
  transform: translateY(100%);
  opacity: 0;
}

.sheet-handle {
  margin: 10px auto 0;
  width: 40px;
  height: 4px;
  border-radius: 99px;
  background: rgba(255, 255, 255, 0.15);
  cursor: pointer;
  transition: background 0.2s;
}
.sheet-handle:hover {
  background: rgba(255, 255, 255, 0.3);
}

.sheet-body {
  padding: 12px 20px 28px;
}

.sheet-pill-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 8px;
}
.sheet-badge {
  display: inline-flex;
  align-items: center;
  padding: 3px 10px;
  border-radius: 999px;
  background: rgba(37, 99, 235, 0.15);
  border: 1px solid rgba(37, 99, 235, 0.35);
  color: #60a5fa;
  font-size: 11px;
  font-weight: 600;
  letter-spacing: 0.5px;
  text-transform: uppercase;
}

.sheet-close {
  width: 30px;
  height: 30px;
  border-radius: 50%;
  border: 1px solid rgba(255, 255, 255, 0.1);
  background: rgba(255, 255, 255, 0.05);
  color: #9ca3af;
  display: grid;
  place-items: center;
  cursor: pointer;
  transition:
    background 0.2s,
    color 0.2s;
}
.sheet-close:hover {
  background: rgba(244, 63, 94, 0.15);
  color: #f43f5e;
}
.sheet-close svg {
  width: 14px;
  height: 14px;
}

.sheet-name {
  font-size: 20px;
  font-weight: 700;
  color: #f3f4f6;
  margin: 0 0 14px;
  line-height: 1.25;
  letter-spacing: -0.3px;
}

.sheet-meta {
  display: flex;
  flex-direction: column;
  gap: 10px;
  margin-bottom: 18px;
}

.meta-item {
  display: flex;
  align-items: flex-start;
  gap: 10px;
  color: #9ca3af;
  font-size: 13px;
  line-height: 1.5;
}
.meta-icon {
  width: 16px;
  height: 16px;
  color: #2563eb;
  flex-shrink: 0;
  margin-top: 1px;
}

.sheet-actions {
  display: flex;
  gap: 10px;
}

.action-btn {
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 7px;
  padding: 12px;
  border-radius: 14px;
  border: 0;
  font-size: 14px;
  font-weight: 600;
  font-family: 'Inter', sans-serif;
  cursor: pointer;
  transition:
    transform 0.15s,
    opacity 0.15s;
}
.action-btn:active {
  transform: scale(0.97);
}
.action-btn svg {
  width: 16px;
  height: 16px;
}

.action-btn.primary {
  background: linear-gradient(135deg, #1d4ed8 0%, #3b82f6 100%);
  color: #fff;
  box-shadow: 0 4px 16px rgba(37, 99, 235, 0.4);
}
.action-btn.primary:hover {
  opacity: 0.9;
}

.action-btn.secondary {
  background: rgba(255, 255, 255, 0.06);
  border: 1px solid rgba(255, 255, 255, 0.1);
  color: #9ca3af;
}
.action-btn.secondary:hover {
  background: rgba(255, 255, 255, 0.1);
  color: #d1d5db;
}

:deep(.leaflet-control-container) {
  z-index: 850;
}

/* ─── Desktop layout ─────────────────────────────────────────── */
@media (min-width: 768px) {
  .top-header {
    padding: 14px 28px 12px;
  }
  .brand-name {
    font-size: 20px;
  }
  .header-search {
    max-width: 480px;
  }

  :deep(.leaflet-control-zoom) {
    margin-bottom: 80px !important;
    margin-right: 14px !important;
  }
}

@media (min-width: 1024px) {
  /* sidebar now lives INSIDE .map-wrapper, so flex-row works correctly */
  .map-wrapper {
    display: flex;
    flex-direction: row;
  }

  .map {
    flex: 1;
    min-width: 0;
    height: 100%;
  }

  /* FAB stays in map area, above sidebar */
  .fab {
    right: 340px;
    bottom: 28px;
  }

  .count-chip {
    left: 20px;
    bottom: 28px;
  }

  /* Sidebar panel */
  .bottom-sheet {
    position: relative !important;
    bottom: unset !important;
    left: unset !important;
    right: unset !important;
    width: 320px;
    flex-shrink: 0;
    height: 100%;
    max-height: 100%;
    overflow-y: auto;
    border-radius: 0;
    border-top: none;
    border-left: 1px solid rgba(255, 255, 255, 0.07);
    box-shadow: -6px 0 32px rgba(0, 0, 0, 0.4);
    display: flex;
    flex-direction: column;
  }

  .sheet-handle {
    display: none;
  }
  .sheet-body {
    padding: 20px 24px 32px;
    flex: 1;
  }
  .sheet-name {
    font-size: 22px;
  }

  /* slide in from right on desktop */
  .sheet-enter-from,
  .sheet-leave-to {
    transform: translateX(100%);
    opacity: 0;
  }
  .sheet-enter-active {
    transition:
      transform 0.3s cubic-bezier(0.32, 0.72, 0, 1),
      opacity 0.2s;
  }
  .sheet-leave-active {
    transition:
      transform 0.25s ease,
      opacity 0.2s;
  }
}

@media (max-width: 767px) {
  .top-header {
    flex-wrap: wrap;
    justify-content: space-between;
    gap: 8px 10px;
    padding: 12px 12px 12px;
  }

  .back-btn {
    left: 12px;
    top: 12px;
    width: 28px;
    height: 28px;
  }

  .back-btn svg {
    width: 15px;
    height: 15px;
  }

  .header-brand {
    margin-left: 44px;
  }

  .brand-name {
    font-size: 15px;
  }

  .header-search {
    order: 3;
    width: 100%;
    flex-basis: 100%;
    margin-top: 0;
    border-radius: 14px;
    padding: 8px 12px;
  }

  .search-input {
    font-size: 14px;
  }

  .status-pill {
    top: 82px;
    max-width: calc(100% - 24px);
    white-space: normal;
    text-align: center;
  }

  .count-chip {
    left: 12px;
    bottom: 18px;
    max-width: calc(100% - 96px);
  }

  .fab {
    right: 14px;
    bottom: calc(env(safe-area-inset-bottom, 0px) + 12px);
    width: 58px;
    height: 58px;
  }

  .fab-icon {
    width: 32px;
    height: 32px;
  }

  :deep(.leaflet-control-zoom) {
    margin-bottom: calc(env(safe-area-inset-bottom, 0px) + 82px) !important;
    margin-right: 14px !important;
  }

  @media (max-height: 700px) {
    .fab {
      bottom: calc(env(safe-area-inset-bottom, 0px) + 8px);
      width: 52px;
      height: 52px;
    }

    .fab-icon {
      width: 28px;
      height: 28px;
    }

    :deep(.leaflet-control-zoom) {
      margin-bottom: calc(env(safe-area-inset-bottom, 0px) + 72px) !important;
    }
  }

  .bottom-sheet {
    left: 12px;
    right: 12px;
    width: auto;
    max-height: 78dvh;
    border-radius: 20px 20px 0 0;
  }

  .sheet-body {
    padding: 12px 16px 22px;
  }

  .sheet-name {
    font-size: 18px;
  }

  .sheet-actions {
    flex-direction: column;
  }

  .action-btn {
    width: 100%;
  }
}
</style>
