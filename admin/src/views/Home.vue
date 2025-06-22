<template>
  <div>
    <h2>欢迎使用CDN管理端</h2>
    <el-button @click="checkHealth">健康检查</el-button>
    <div v-if="health">服务状态：{{ health.status }}，时间戳：{{ health.time }}</div>
  </div>
</template>
<script setup lang="ts">
import { ref } from 'vue';
import axios from 'axios';
const health = ref<any>(null);
async function checkHealth() {
  const res = await axios.get('/health');
  health.value = res.data;
}
</script> 