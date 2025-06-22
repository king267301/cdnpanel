<template>
  <div class="domains-page">
    <div class="page-header">
      <h2>域名管理</h2>
      <el-button type="primary" @click="showAddDialog = true">
        <el-icon><Plus /></el-icon>
        添加域名
      </el-button>
    </div>

    <!-- Cloudflare配置卡片 -->
    <el-card class="cloudflare-config" v-if="!cloudflareConfigured">
      <template #header>
        <div class="card-header">
          <span>Cloudflare配置</span>
          <el-button type="primary" size="small" @click="showCloudflareDialog = true">
            配置Cloudflare
          </el-button>
        </div>
      </template>
      <div class="config-tip">
        <el-icon><InfoFilled /></el-icon>
        <span>请先配置Cloudflare API，以便自动管理CNAME记录</span>
      </div>
    </el-card>

    <el-card>
      <el-table :data="domains" stripe style="width: 100%">
        <el-table-column prop="domain" label="域名" />
        <el-table-column prop="status" label="状态" width="100">
          <template #default="scope">
            <el-tag :type="getStatusType(scope.row.status)">
              {{ getStatusText(scope.row.status) }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="ssl" label="SSL" width="100">
          <template #default="scope">
            <el-tag :type="scope.row.ssl ? 'success' : 'info'" size="small">
              {{ scope.row.ssl ? '已启用' : '未启用' }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="dnsStatus" label="DNS状态" width="100">
          <template #default="scope">
            <el-tag :type="getDNSStatusType(scope.row.dnsStatus)" size="small">
              {{ getDNSStatusText(scope.row.dnsStatus) }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="traffic" label="今日流量" width="120">
          <template #default="scope">
            {{ formatBytes(scope.row.traffic) }}
          </template>
        </el-table-column>
        <el-table-column prop="createdAt" label="添加时间" width="180" />
        <el-table-column label="操作" width="250" fixed="right">
          <template #default="scope">
            <el-button size="small" @click="viewConfig(scope.row)">配置</el-button>
            <el-button 
              size="small" 
              type="success" 
              @click="autoSetupDNS(scope.row)"
              :disabled="!cloudflareConfigured"
            >
              自动DNS
            </el-button>
            <el-button size="small" @click="refreshCache(scope.row)">刷新缓存</el-button>
            <el-button 
              size="small" 
              type="danger" 
              @click="deleteDomain(scope.row)"
            >
              删除
            </el-button>
          </template>
        </el-table-column>
      </el-table>
    </el-card>

    <!-- 添加域名对话框 -->
    <el-dialog v-model="showAddDialog" title="添加域名" width="600px">
      <el-form :model="domainForm" label-width="100px">
        <el-form-item label="域名">
          <el-input 
            v-model="domainForm.domain" 
            placeholder="请输入域名，如: example.com"
          />
          <div class="form-tip">请输入您的域名，不需要包含 http:// 或 https://</div>
        </el-form-item>
        <el-form-item label="回源地址">
          <el-input 
            v-model="domainForm.origin" 
            placeholder="请输入源站地址，如: http://your-origin.com"
          />
          <div class="form-tip">请输入您的源站服务器地址</div>
        </el-form-item>
        <el-form-item label="自动SSL">
          <el-switch v-model="domainForm.autoSSL" />
          <div class="form-tip">启用后将自动申请SSL证书</div>
        </el-form-item>
        <el-form-item label="自动DNS" v-if="cloudflareConfigured">
          <el-switch v-model="domainForm.autoDNS" />
          <div class="form-tip">启用后将自动在Cloudflare创建CNAME记录</div>
        </el-form-item>
      </el-form>
      <template #footer>
        <span class="dialog-footer">
          <el-button @click="showAddDialog = false">取消</el-button>
          <el-button type="primary" @click="addDomain">添加域名</el-button>
        </span>
      </template>
    </el-dialog>

    <!-- Cloudflare配置对话框 -->
    <el-dialog v-model="showCloudflareDialog" title="Cloudflare配置" width="600px">
      <el-form :model="cloudflareForm" label-width="120px">
        <el-form-item label="API Token">
          <el-input 
            v-model="cloudflareForm.apiToken" 
            type="password"
            placeholder="请输入Cloudflare API Token"
            show-password
          />
          <div class="form-tip">
            <a href="https://dash.cloudflare.com/profile/api-tokens" target="_blank">
              获取API Token
            </a>
          </div>
        </el-form-item>
        <el-form-item label="Zone ID">
          <el-input 
            v-model="cloudflareForm.zoneId" 
            placeholder="请输入域名Zone ID"
          />
          <div class="form-tip">
            <a href="https://dash.cloudflare.com/" target="_blank">
              获取Zone ID
            </a>
          </div>
        </el-form-item>
        <el-form-item label="Account ID">
          <el-input 
            v-model="cloudflareForm.accountId" 
            placeholder="请输入Account ID"
          />
          <div class="form-tip">可选，某些API可能需要</div>
        </el-form-item>
      </el-form>
      <template #footer>
        <span class="dialog-footer">
          <el-button @click="showCloudflareDialog = false">取消</el-button>
          <el-button type="primary" @click="saveCloudflareConfig">保存配置</el-button>
          <el-button @click="testCloudflareConfig">测试连接</el-button>
        </span>
      </template>
    </el-dialog>

    <!-- DNS配置对话框 -->
    <el-dialog v-model="showConfigDialog" title="DNS配置指引" width="800px">
      <div v-if="selectedDomain">
        <el-alert
          title="请按照以下步骤配置DNS解析"
          type="info"
          :closable="false"
          style="margin-bottom: 20px"
        />
        
        <el-steps :active="1" direction="vertical">
          <el-step title="登录域名管理平台">
            <template #description>
              登录您的域名注册商或DNS服务商的管理平台
            </template>
          </el-step>
          <el-step title="添加CNAME记录">
            <template #description>
              <div class="dns-config">
                <div class="config-item">
                  <strong>记录类型：</strong>CNAME
                </div>
                <div class="config-item">
                  <strong>主机记录：</strong>{{ selectedDomain.domain }}
                </div>
                <div class="config-item">
                  <strong>记录值：</strong>{{ getCnameValue(selectedDomain.domain) }}
                </div>
                <div class="config-item">
                  <strong>TTL：</strong>600秒（或默认）
                </div>
              </div>
            </template>
          </el-step>
          <el-step title="等待解析生效">
            <template #description>
              DNS解析通常需要5-30分钟生效，请耐心等待
            </template>
          </el-step>
        </el-steps>

        <div class="dns-examples">
          <h4>常见域名服务商配置示例：</h4>
          <el-collapse>
            <el-collapse-item title="阿里云" name="aliyun">
              <div class="example-config">
                1. 登录阿里云控制台 → 域名 → 解析设置<br>
                2. 点击"添加记录"<br>
                3. 记录类型选择"CNAME"<br>
                4. 主机记录填写"@"（或子域名）<br>
                5. 记录值填写：{{ getCnameValue(selectedDomain.domain) }}
              </div>
            </el-collapse-item>
            <el-collapse-item title="腾讯云" name="tencent">
              <div class="example-config">
                1. 登录腾讯云控制台 → 域名与网站 → 云解析<br>
                2. 选择域名 → 解析记录<br>
                3. 点击"添加记录"<br>
                4. 记录类型选择"CNAME"<br>
                5. 主机记录填写"@"（或子域名）<br>
                6. 记录值填写：{{ getCnameValue(selectedDomain.domain) }}
              </div>
            </el-collapse-item>
            <el-collapse-item title="Cloudflare" name="cloudflare">
              <div class="example-config">
                1. 登录Cloudflare控制台<br>
                2. 选择域名 → DNS<br>
                3. 点击"Add record"<br>
                4. Type选择"CNAME"<br>
                5. Name填写"@"（或子域名）<br>
                6. Target填写：{{ getCnameValue(selectedDomain.domain) }}
              </div>
            </el-collapse-item>
            <el-collapse-item title="其他服务商" name="others">
              <div class="example-config">
                1. 登录您的域名服务商管理平台<br>
                2. 找到DNS解析或域名解析设置<br>
                3. 添加CNAME记录<br>
                4. 主机记录填写您的域名<br>
                5. 记录值填写：{{ getCnameValue(selectedDomain.domain) }}
              </div>
            </el-collapse-item>
          </el-collapse>
        </div>

        <div class="config-actions">
          <el-button type="primary" @click="checkDNS">检查DNS解析</el-button>
          <el-button @click="copyCname">复制CNAME记录</el-button>
        </div>
      </div>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, computed } from 'vue';
import { Plus, InfoFilled } from '@element-plus/icons-vue';
import { ElMessage, ElMessageBox } from 'element-plus';

const showAddDialog = ref(false);
const showConfigDialog = ref(false);
const showCloudflareDialog = ref(false);
const selectedDomain = ref<any>(null);

const domainForm = ref({
  domain: '',
  origin: '',
  autoSSL: true,
  autoDNS: true
});

const cloudflareForm = ref({
  apiToken: '',
  zoneId: '',
  accountId: ''
});

const domains = ref([
  {
    id: 1,
    domain: 'example.com',
    status: 'active',
    ssl: true,
    dnsStatus: 'resolved',
    traffic: 1073741824,
    createdAt: '2024-01-01 10:00:00'
  },
  {
    id: 2,
    domain: 'test.com',
    status: 'pending',
    ssl: false,
    dnsStatus: 'pending',
    traffic: 0,
    createdAt: '2024-01-02 11:00:00'
  }
]);

// 检查Cloudflare是否已配置
const cloudflareConfigured = computed(() => {
  return localStorage.getItem('cloudflare_config') !== null;
});

function getStatusType(status: string): string {
  const types: Record<string, string> = {
    active: 'success',
    pending: 'warning',
    disabled: 'info'
  };
  return types[status] || 'info';
}

function getStatusText(status: string): string {
  const texts: Record<string, string> = {
    active: '已生效',
    pending: '待解析',
    disabled: '已禁用'
  };
  return texts[status] || status;
}

function getDNSStatusType(status: string): string {
  const types: Record<string, string> = {
    resolved: 'success',
    pending: 'warning',
    failed: 'danger'
  };
  return types[status] || 'info';
}

function getDNSStatusText(status: string): string {
  const texts: Record<string, string> = {
    resolved: '已解析',
    pending: '待解析',
    failed: '解析失败'
  };
  return texts[status] || status;
}

function formatBytes(bytes: number): string {
  const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
  if (bytes === 0) return '0 B';
  const i = Math.floor(Math.log(bytes) / Math.log(1024));
  return Math.round(bytes / Math.pow(1024, i) * 100) / 100 + ' ' + sizes[i];
}

function getCnameValue(domain: string): string {
  return `cdn.${domain}.cdn-system.com`;
}

function addDomain() {
  if (!domainForm.value.domain) {
    ElMessage.warning('请输入域名');
    return;
  }
  
  if (!domainForm.value.origin) {
    ElMessage.warning('请输入回源地址');
    return;
  }

  // 添加域名到列表
  const newDomain = {
    id: domains.value.length + 1,
    domain: domainForm.value.domain,
    status: 'pending',
    ssl: domainForm.value.autoSSL,
    dnsStatus: domainForm.value.autoDNS ? 'pending' : 'manual',
    traffic: 0,
    createdAt: new Date().toLocaleString()
  };
  
  domains.value.push(newDomain);
  showAddDialog.value = false;
  
  // 如果启用了自动DNS，立即执行
  if (domainForm.value.autoDNS && cloudflareConfigured.value) {
    autoSetupDNS(newDomain);
  } else {
    // 显示DNS配置指引
    selectedDomain.value = newDomain;
    showConfigDialog.value = true;
  }
  
  ElMessage.success('域名添加成功');
}

function saveCloudflareConfig() {
  if (!cloudflareForm.value.apiToken || !cloudflareForm.value.zoneId) {
    ElMessage.warning('请填写API Token和Zone ID');
    return;
  }

  const config = {
    apiToken: cloudflareForm.value.apiToken,
    zoneId: cloudflareForm.value.zoneId,
    accountId: cloudflareForm.value.accountId
  };

  localStorage.setItem('cloudflare_config', JSON.stringify(config));
  showCloudflareDialog.value = false;
  ElMessage.success('Cloudflare配置已保存');
}

function testCloudflareConfig() {
  if (!cloudflareForm.value.apiToken) {
    ElMessage.warning('请先填写API Token');
    return;
  }

  ElMessage.info('正在测试Cloudflare连接...');
  // 这里应该调用后端API测试连接
  setTimeout(() => {
    ElMessage.success('Cloudflare连接测试成功');
  }, 2000);
}

function autoSetupDNS(domain: any) {
  ElMessage.info(`正在为域名 ${domain.domain} 自动配置DNS...`);
  
  // 这里应该调用后端API自动创建CNAME记录
  setTimeout(() => {
    // 模拟API调用
    const index = domains.value.findIndex(d => d.id === domain.id);
    if (index !== -1) {
      domains.value[index].dnsStatus = 'resolved';
    }
    ElMessage.success(`域名 ${domain.domain} DNS配置成功`);
  }, 3000);
}

function viewConfig(domain: any) {
  selectedDomain.value = domain;
  showConfigDialog.value = true;
}

function refreshCache(domain: any) {
  ElMessageBox.confirm(`确定要刷新域名 ${domain.domain} 的缓存吗？`, '提示', {
    confirmButtonText: '确定',
    cancelButtonText: '取消',
    type: 'warning'
  }).then(() => {
    ElMessage.success('缓存刷新任务已提交');
  });
}

function deleteDomain(domain: any) {
  ElMessageBox.confirm(`确定要删除域名 ${domain.domain} 吗？`, '警告', {
    confirmButtonText: '确定',
    cancelButtonText: '取消',
    type: 'warning'
  }).then(() => {
    domains.value = domains.value.filter(d => d.id !== domain.id);
    ElMessage.success('域名删除成功');
  });
}

function checkDNS() {
  ElMessage.info('正在检查DNS解析状态...');
  // 这里应该调用后端API检查DNS解析
}

function copyCname() {
  if (selectedDomain.value) {
    const cname = getCnameValue(selectedDomain.value.domain);
    navigator.clipboard.writeText(cname).then(() => {
      ElMessage.success('CNAME记录已复制到剪贴板');
    });
  }
}

onMounted(() => {
  console.log('Domains page mounted');
  
  // 加载Cloudflare配置
  const savedConfig = localStorage.getItem('cloudflare_config');
  if (savedConfig) {
    const config = JSON.parse(savedConfig);
    cloudflareForm.value = config;
  }
});
</script>

<style scoped>
.domains-page {
  padding: 20px;
}

.page-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
}

.page-header h2 {
  margin: 0;
  color: var(--el-text-color-primary);
}

.cloudflare-config {
  margin-bottom: 20px;
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.config-tip {
  display: flex;
  align-items: center;
  gap: 8px;
  color: var(--el-text-color-regular);
}

.form-tip {
  font-size: 12px;
  color: var(--el-text-color-placeholder);
  margin-top: 5px;
}

.form-tip a {
  color: var(--el-color-primary);
  text-decoration: none;
}

.form-tip a:hover {
  text-decoration: underline;
}

.dns-config {
  background: #f5f7fa;
  padding: 15px;
  border-radius: 4px;
  margin: 10px 0;
}

.config-item {
  margin-bottom: 8px;
}

.config-item:last-child {
  margin-bottom: 0;
}

.dns-examples {
  margin-top: 20px;
}

.example-config {
  font-size: 14px;
  line-height: 1.6;
  color: var(--el-text-color-regular);
}

.config-actions {
  margin-top: 20px;
  text-align: center;
}

.config-actions .el-button {
  margin: 0 10px;
}

.dialog-footer {
  display: flex;
  justify-content: flex-end;
  gap: 10px;
}
</style> 