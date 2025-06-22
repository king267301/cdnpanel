<template>
  <el-config-provider :theme="theme">
    <div :class="['app-container', theme]">
      <el-container>
        <el-aside width="250px" class="sidebar">
          <div class="logo">
            <h2>CDN用户端</h2>
          </div>
          <el-menu
            :default-active="$route.path"
            router
            class="sidebar-menu"
            background-color="#304156"
            text-color="#bfcbd9"
            active-text-color="#409EFF"
          >
            <el-menu-item index="/dashboard">
              <el-icon><DataBoard /></el-icon>
              <span>仪表板</span>
            </el-menu-item>
            <el-menu-item index="/packages">
              <el-icon><ShoppingCart /></el-icon>
              <span>套餐购买</span>
            </el-menu-item>
            <el-menu-item index="/domains">
              <el-icon><Globe /></el-icon>
              <span>域名管理</span>
            </el-menu-item>
          </el-menu>
        </el-aside>
        
        <el-container>
          <el-header>
            <div class="header-content">
              <div class="breadcrumb">
                {{ getPageTitle() }}
              </div>
              <div class="header-actions">
                <el-switch 
                  v-model="isDark" 
                  active-text="夜间" 
                  inactive-text="白天" 
                  @change="toggleTheme" 
                />
                <el-dropdown>
                  <span class="user-info">
                    <el-avatar size="small" src="https://cube.elemecdn.com/0/88/03b0d39583f48206768a7534e55bcpng.png" />
                    <span>用户</span>
                    <el-icon><ArrowDown /></el-icon>
                  </span>
                  <template #dropdown>
                    <el-dropdown-menu>
                      <el-dropdown-item>个人设置</el-dropdown-item>
                      <el-dropdown-item>退出登录</el-dropdown-item>
                    </el-dropdown-menu>
                  </template>
                </el-dropdown>
              </div>
            </div>
          </el-header>
          
          <el-main>
            <router-view />
          </el-main>
        </el-container>
      </el-container>
    </div>
  </el-config-provider>
</template>

<script setup lang="ts">
import { ref, computed, watch } from 'vue';
import { useRoute } from 'vue-router';
import { 
  DataBoard, 
  Globe, 
  ShoppingCart,
  ArrowDown 
} from '@element-plus/icons-vue';

const route = useRoute();
const isDark = ref(false);
const theme = computed(() => (isDark.value ? 'dark' : 'light'));

function toggleTheme() {
  document.body.className = isDark.value ? 'dark' : 'light';
}

function getPageTitle() {
  const titles: Record<string, string> = {
    '/dashboard': '仪表板',
    '/packages': '套餐购买',
    '/domains': '域名管理'
  };
  return titles[route.path] || '首页';
}

watch(isDark, toggleTheme, { immediate: true });
</script>

<style>
.app-container {
  min-height: 100vh;
  background: var(--el-bg-color);
  color: var(--el-text-color-primary);
  transition: background 0.3s, color 0.3s;
}

.sidebar {
  height: 100vh;
  background: var(--el-bg-color-overlay);
  border-right: 1px solid var(--el-border-color);
}

.logo {
  padding: 20px;
  text-align: center;
  border-bottom: 1px solid var(--el-border-color);
}

.logo h2 {
  margin: 0;
  color: var(--el-text-color-primary);
}

.sidebar-menu {
  border-right: none;
}

.el-header {
  background: var(--el-bg-color-overlay);
  border-bottom: 1px solid var(--el-border-color);
  padding: 0 20px;
}

.header-content {
  display: flex;
  justify-content: space-between;
  align-items: center;
  height: 100%;
}

.breadcrumb {
  font-size: 18px;
  font-weight: bold;
  color: var(--el-text-color-primary);
}

.header-actions {
  display: flex;
  align-items: center;
  gap: 20px;
}

.user-info {
  display: flex;
  align-items: center;
  gap: 8px;
  cursor: pointer;
  color: var(--el-text-color-primary);
}

.el-main {
  background: var(--el-bg-color-page);
  padding: 20px;
}
</style> 