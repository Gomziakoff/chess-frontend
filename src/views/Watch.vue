<script setup lang="ts">
import { useRoute } from 'vue-router'

const route = useRoute()
const gameId = route.params.id
</script>

<template>
  <div>
    <h1>Watching Game {{ gameId }}</h1>
  </div>
</template>
