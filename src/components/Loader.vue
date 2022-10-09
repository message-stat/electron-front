<template>
  <div>
    <p>apiKey: </p>
    <input type="text" v-model="apiKey">
    <button @click="load">Load</button>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue';
import { useLoader } from '../core/useLoader';
import { useStorage } from '@vueuse/core'

const apiKey = useStorage('apiKey', '')

function load() {
  useLoader({
    token: apiKey.value,
  })
}

</script>
