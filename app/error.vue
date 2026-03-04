<script lang="ts" setup>
import { clearError, type NuxtError } from '#app'

const props = defineProps<{
  error: NuxtError
}>()

const handleError = () => clearError({ redirect: '/' })
</script>

<template>
  <NuxtLayout>

    <h1>{{ error.statusCode }}</h1>
    <p>{{ error.message }}</p>
    <button @click="handleError">Clear error</button>

  </NuxtLayout>
</template>