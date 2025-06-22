<template>
  <div class="security-page">
    <div class="page-header">
      <h2>安全配置</h2>
    </div>

    <el-row :gutter="20">
      <el-col :span="12">
        <el-card>
          <template #header>
            <span>5秒盾配置</span>
          </template>
          <el-form :model="securityConfig" label-width="120px">
            <el-form-item label="启用5秒盾">
              <el-switch v-model="securityConfig.enabled" />
            </el-form-item>
            <el-form-item label="验证超时时间">
              <el-input-number 
                v-model="securityConfig.challengeTimeout" 
                :min="60" 
                :max="1800"
                :step="30"
              />
              <span style="margin-left: 10px;">秒</span>
            </el-form-item>
            <el-form-item label="每分钟最大请求">
              <el-input-number 
                v-model="securityConfig.maxRequestsPerMinute" 
                :min="10" 
                :max="1000"
                :step="10"
              />
            </el-form-item>
            <el-form-item label="允许的国家">
              <el-select 
                v-model="securityConfig.countries" 
                multiple 
                placeholder="选择允许的国家"
                style="width: 100%"
              >
                <el-option label="中国" value="CN" />
                <el-option label="美国" value="US" />
                <el-option label="日本" value="JP" />
                <el-option label="韩国" value="KR" />
                <el-option label="新加坡" value="SG" />
                <el-option label="香港" value="HK" />
                <el-option label="台湾" value="TW" />
                <el-option label="英国" value="GB" />
                <el-option label="德国" value="DE" />
                <el-option label="法国" value="FR" />
              </el-select>
            </el-form-item>
          </el-form>
        </el-card>
      </el-col>

      <el-col :span="12">
        <el-card>
          <template #header>
            <span>IP管理</span>
          </template>
          <el-tabs v-model="activeTab">
            <el-tab-pane label="IP白名单" name="whitelist">
              <div class="ip-list">
                <div class="ip-input">
                  <el-input 
                    v-model="newIp" 
                    placeholder="输入IP地址" 
                    style="width: 200px"
                  />
                  <el-button type="primary" @click="addToWhitelist">添加</el-button>
                </div>
                <el-table :data="securityConfig.whitelistIps" style="width: 100%">
                  <el-table-column prop="ip" label="IP地址" />
                  <el-table-column label="操作" width="100">
                    <template #default="scope">
                      <el-button 
                        size="small" 
                        type="danger" 
                        @click="removeFromWhitelist(scope.$index)"
                      >
                        删除
                      </el-button>
                    </template>
                  </el-table-column>
                </el-table>
              </div>
            </el-tab-pane>

            <el-tab-pane label="IP黑名单" name="blacklist">
              <div class="ip-list">
                <div class="ip-input">
                  <el-input 
                    v-model="newIp" 
                    placeholder="输入IP地址" 
                    style="width: 200px"
                  />
                  <el-button type="danger" @click="addToBlacklist">添加</el-button>
                </div>
                <el-table :data="securityConfig.blacklistIps" style="width: 100%">
                  <el-table-column prop="ip" label="IP地址" />
                  <el-table-column label="操作" width="100">
                    <template #default="scope">
                      <el-button 
                        size="small" 
                        type="danger" 
                        @click="removeFromBlacklist(scope.$index)"
                      >
                        删除
                      </el-button>
                    </template>
                  </el-table-column>
                </el-table>
              </div>
            </el-tab-pane>
          </el-tabs>
        </el-card>
      </el-col>
    </el-row>

    <el-row style="margin-top: 20px;">
      <el-col :span="24">
        <el-card>
          <template #header>
            <span>DDoS防护</span>
          </template>
          <el-form label-width="120px">
            <el-form-item label="启用DDoS防护">
              <el-switch v-model="ddosConfig.enabled" />
            </el-form-item>
            <el-form-item label="连接数限制">
              <el-input-number 
                v-model="ddosConfig.maxConnections" 
                :min="100" 
                :max="10000"
                :step="100"
              />
            </el-form-item>
            <el-form-item label="带宽限制">
              <el-input-number 
                v-model="ddosConfig.maxBandwidth" 
                :min="1" 
                :max="1000"
                :step="1"
              />
              <span style="margin-left: 10px;">MB/s</span>
            </el-form-item>
            <el-form-item label="自动封禁">
              <el-switch v-model="ddosConfig.autoBan" />
            </el-form-item>
            <el-form-item label="封禁时间">
              <el-input-number 
                v-model="ddosConfig.banTime" 
                :min="300" 
                :max="86400"
                :step="300"
              />
              <span style="margin-left: 10px;">秒</span>
            </el-form-item>
          </el-form>
        </el-card>
      </el-col>
    </el-row>

    <el-row style="margin-top: 20px;">
      <el-col :span="24">
        <el-card>
          <template #header>
            <span>安全统计</span>
          </template>
          <el-row :gutter="20">
            <el-col :span="6">
              <div class="stat-item">
                <div class="stat-number">{{ securityStats.blockedRequests }}</div>
                <div class="stat-label">今日拦截请求</div>
              </div>
            </el-col>
            <el-col :span="6">
              <div class="stat-item">
                <div class="stat-number">{{ securityStats.blockedIps }}</div>
                <div class="stat-label">已封禁IP</div>
              </div>
            </el-col>
            <el-col :span="6">
              <div class="stat-item">
                <div class="stat-number">{{ securityStats.challenges }}</div>
                <div class="stat-label">验证挑战</div>
              </div>
            </el-col>
            <el-col :span="6">
              <div class="stat-item">
                <div class="stat-number">{{ securityStats.attacks }}</div>
                <div class="stat-label">攻击检测</div>
              </div>
            </el-col>
          </el-row>
        </el-card>
      </el-col>
    </el-row>

    <div class="action-buttons">
      <el-button type="primary" @click="saveConfig">保存配置</el-button>
      <el-button @click="resetConfig">重置</el-button>
      <el-button type="success" @click="testSecurity">测试安全防护</el-button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue';
import { ElMessage } from 'element-plus';

const activeTab = ref('whitelist');
const newIp = ref('');

const securityConfig = ref({
  enabled: true,
  challengeTimeout: 300,
  maxRequestsPerMinute: 60,
  whitelistIps: ['127.0.0.1', '::1'],
  blacklistIps: [],
  userAgents: [],
  countries: ['CN', 'US', 'JP', 'KR', 'SG', 'HK']
});

const ddosConfig = ref({
  enabled: true,
  maxConnections: 1000,
  maxBandwidth: 100,
  autoBan: true,
  banTime: 3600
});

const securityStats = ref({
  blockedRequests: 1234,
  blockedIps: 56,
  challenges: 789,
  attacks: 12
});

function addToWhitelist() {
  if (newIp.value && !securityConfig.value.whitelistIps.includes(newIp.value)) {
    securityConfig.value.whitelistIps.push(newIp.value);
    newIp.value = '';
    ElMessage.success('已添加到白名单');
  }
}

function removeFromWhitelist(index: number) {
  securityConfig.value.whitelistIps.splice(index, 1);
  ElMessage.success('已从白名单移除');
}

function addToBlacklist() {
  if (newIp.value && !securityConfig.value.blacklistIps.includes(newIp.value)) {
    securityConfig.value.blacklistIps.push(newIp.value);
    newIp.value = '';
    ElMessage.success('已添加到黑名单');
  }
}

function removeFromBlacklist(index: number) {
  securityConfig.value.blacklistIps.splice(index, 1);
  ElMessage.success('已从黑名单移除');
}

function saveConfig() {
  // 保存配置到后端
  ElMessage.success('安全配置保存成功');
}

function resetConfig() {
  // 重置配置
  ElMessage.info('配置已重置');
}

function testSecurity() {
  // 测试安全防护
  ElMessage.info('正在测试安全防护...');
}

onMounted(() => {
  console.log('Security config page mounted');
});
</script>

<style scoped>
.security-page {
  padding: 20px;
}

.page-header {
  margin-bottom: 20px;
}

.page-header h2 {
  margin: 0;
  color: var(--el-text-color-primary);
}

.ip-list {
  margin-top: 10px;
}

.ip-input {
  display: flex;
  gap: 10px;
  margin-bottom: 15px;
  align-items: center;
}

.stat-item {
  text-align: center;
  padding: 20px;
}

.stat-number {
  font-size: 32px;
  font-weight: bold;
  color: var(--el-color-primary);
  margin-bottom: 10px;
}

.stat-label {
  font-size: 14px;
  color: var(--el-text-color-regular);
}

.action-buttons {
  margin-top: 20px;
  text-align: center;
}

.action-buttons .el-button {
  margin: 0 10px;
}
</style> 