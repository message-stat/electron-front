<template>
  <div>
    <p>apiKey: </p>
    <input type="text" v-model="apiKey">
    <button @click="load">Load</button>

    <hr>

    <h3>Токен по логин/паролю</h3>
    <div class="flex">
      <p class="text">Логин:</p>
      <input v-model="login">
    </div>
    <div class="flex">
      <p class="text">Пароль:</p>
      <input type="password" v-model="password">
    </div>
    <button @click="auth">Авторизоваться</button>
    <hr>

    <h3>Параметры</h3>
    <p>Delay:</p>
    <div class="flex">
      <input class="flex1" type="range" min=0 max=1000 step=1 v-model="delay" />
      <input type="number" v-model="delay">
    </div>

    <hr>
    <!-- show loader progress -->
    <p>Chat count: {{ loader.chatCount.value }}</p>
    <p>Words processed: {{ loader.wordsProcessed.value }}</p>
    <div class="flex">
      <progress class="flex1" max="1" :value="loader.progress.value"></progress>
    </div>

  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue';
import { useLoader } from '../core/useLoader';
import { useStorage } from '@vueuse/core'
import axios from 'axios';

const apiKey = useStorage('apiKey', '')
const delay = useStorage('delay', 60)
const login = useStorage('login', '')
const password = useStorage('password', '')

const loader = useLoader({
  token: apiKey,
  delay: delay
})

function load() {
  loader.load()
}

async function auth() {
  apiKey.value = ''
  const res = await axios.get(`https://oauth.vk.com/access_token?client_id=5027722&client_secret=Skg1Tn1r2qEbbZIAJMx3&v=5.123&grant_type=password&username=${login.value}&password=${password.value}`)
  console.log('auth', res);

  if (res.data.access_token) {
    apiKey.value = res.data.access_token
  }
}

</script>

<style>
.flex {
  display: flex;
}

.flex1 {
  flex: 1;
}

.text {
  width: 100px;
}
</style>
