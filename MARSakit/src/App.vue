<template>
  <RouterView />
  <LanguageSelector />
</template>

<script setup lang="ts">
import { RouterView } from 'vue-router'
import LanguageSelector from './components/LanguageSelector.vue'
</script>
