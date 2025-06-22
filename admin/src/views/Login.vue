<template>
  <div class="login-container">
    <el-card>
      <h2>管理员登录</h2>
      <el-form @submit.prevent="onLogin">
        <el-form-item label="账号">
          <el-input v-model="username" />
        </el-form-item>
        <el-form-item label="密码">
          <el-input v-model="password" type="password" />
        </el-form-item>
        <el-form-item>
          <el-button type="primary" @click="onLogin">登录</el-button>
        </el-form-item>
      </el-form>
    </el-card>
  </div>
</template>
<script setup lang="ts">
import { ref } from 'vue';
const username = ref('');
const password = ref('');
function onLogin() {
  // TODO: 登录逻辑
  alert('登录功能待实现');
}
</script>
<style>
.login-container {
  display: flex;
  justify-content: center;
  align-items: center;
  height: 80vh;
}
</style> 