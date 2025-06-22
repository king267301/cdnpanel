<template>
  <div class="dashboard">
    <el-row :gutter="20" class="stats-row">
      <el-col :span="6">
        <el-card class="stat-card">
          <div class="stat-content">
            <div class="stat-icon domains">
              <el-icon><Globe /></el-icon>
            </div>
            <div class="stat-info">
              <div class="stat-number">{{ stats.domains }}</div>
              <div class="stat-label">域名数量</div>
            </div>
          </div>
        </el-card>
      </el-col>
      <el-col :span="6">
        <el-card class="stat-card">
          <div class="stat-content">
            <div class="stat-icon traffic">
              <el-icon><DataLine /></el-icon>
            </div>
            <div class="stat-info">
              <div class="stat-number">{{ formatBytes(stats.traffic) }}</div>
              <div class="stat-label">今日流量</div>
            </div>
          </div>
        </el-card>
      </el-col>
      <el-col :span="6">
        <el-card class="stat-card">
          <div class="stat-content">
            <div class="stat-icon bandwidth">
              <el-icon><TrendCharts /></el-icon>
            </div>
            <div class="stat-info">
              <div class="stat-number">{{ formatBytes(stats.bandwidth) }}/s</div>
              <div class="stat-label">当前带宽</div>
            </div>
          </div>
        </el-card>
      </el-col>
      <el-col :span="6">
        <el-card class="stat-card">
          <div class="stat-content">
            <div class="stat-icon balance">
              <el-icon><Wallet /></el-icon>
            </div>
            <div class="stat-info">
              <div class="stat-number">¥{{ stats.balance }}</div>
              <div class="stat-label">账户余额</div>
            </div>
          </div>
        </el-card>
      </el-col>
    </el-row>

    <el-row :gutter="20" class="charts-row">
      <el-col :span="12">
        <el-card>
          <template #header>
            <span>流量趋势</span>
          </template>
          <div class="chart-container">
            <div class="chart-placeholder">7天流量趋势图</div>
          </div>
        </el-card>
      </el-col>
      <el-col :span="12">
        <el-card>
          <template #header>
            <span>节点分布</span>
          </template>
          <div class="chart-container">
            <div class="chart-placeholder">全球节点分布图</div>
          </div>
        </el-card>
      </el-col>
    </el-row>

    <el-row :gutter="20" class="tables-row">
      <el-col :span="12">
        <el-card>
          <template #header>
            <span>我的域名</span>
            <el-button type="primary" size="small" style="float: right">添加域名</el-button>
          </template>
          <el-table :data="domains" stripe>
            <el-table-column prop="domain" label="域名" />
            <el-table-column prop="status" label="状态" width="100">
              <template #default="scope">
                <el-tag :type="getDomainStatusType(scope.row.status)">
                  {{ scope.row.status }}
                </el-tag>
              </template>
            </el-table-column>
            <el-table-column prop="ssl" label="SSL" width="80">
              <template #default="scope">
                <el-tag :type="scope.row.ssl ? 'success' : 'info'" size="small">
                  {{ scope.row.ssl ? '已启用' : '未启用' }}
                </el-tag>
              </template>
            </el-table-column>
            <el-table-column label="操作" width="120">
              <template #default="scope">
                <el-button size="small" @click="manageDomain(scope.row)">管理</el-button>
              </template>
            </el-table-column>
          </el-table>
        </el-card>
      </el-col>
      <el-col :span="12">
        <el-card>
          <template #header>
            <span>套餐信息</span>
          </template>
          <div class="package-info">
            <div class="package-item">
              <span class="label">当前套餐：</span>
              <span class="value">{{ package.name }}</span>
            </div>
            <div class="package-item">
              <span class="label">流量限制：</span>
              <span class="value">{{ formatBytes(package.bandwidth) }}</span>
            </div>
            <div class="package-item">
              <span class="label">域名数量：</span>
              <span class="value">{{ package.domains }} 个</span>
            </div>
            <div class="package-item">
              <span class="label">到期时间：</span>
              <span class="value">{{ package.expireDate }}</span>
            </div>
            <div class="package-actions">
              <el-button type="primary" size="small">续费</el-button>
              <el-button size="small">升级套餐</el-button>
            </div>
          </div>
        </el-card>
      </el-col>
    </el-row>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue';
import { Globe, DataLine, TrendCharts, Wallet } from '@element-plus/icons-vue';

const stats = ref({
  domains: 5,
  traffic: 1073741824000,
  bandwidth: 10485760,
  balance: 99.99
});

const domains = ref([
  { domain: 'example.com', status: 'active', ssl: true },
  { domain: 'test.com', status: 'pending', ssl: false },
  { domain: 'demo.com', status: 'active', ssl: true }
]);

const package = ref({
  name: '专业版',
  bandwidth: 536870912000,
  domains: 5,
  expireDate: '2024-12-31'
});

function formatBytes(bytes: number): string {
  const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
  if (bytes === 0) return '0 B';
  const i = Math.floor(Math.log(bytes) / Math.log(1024));
  return Math.round(bytes / Math.pow(1024, i) * 100) / 100 + ' ' + sizes[i];
}

function getDomainStatusType(status: string): string {
  const types: Record<string, string> = {
    active: 'success',
    pending: 'warning',
    disabled: 'info'
  };
  return types[status] || 'info';
}

function manageDomain(domain: any) {
  console.log('管理域名:', domain);
}

onMounted(() => {
  console.log('User Dashboard mounted');
});
</script>

<style scoped>
.dashboard {
  padding: 20px;
}

.stats-row {
  margin-bottom: 20px;
}

.stat-card {
  height: 120px;
  transition: transform 0.3s ease;
}

.stat-card:hover {
  transform: translateY(-5px);
}

.stat-content {
  display: flex;
  align-items: center;
  height: 100%;
}

.stat-icon {
  width: 60px;
  height: 60px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  margin-right: 20px;
  font-size: 24px;
  color: white;
}

.stat-icon.domains { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); }
.stat-icon.traffic { background: linear-gradient(135deg, #4facfe 0%, #00f2fe 100%); }
.stat-icon.bandwidth { background: linear-gradient(135deg, #f093fb 0%, #f5576c 100%); }
.stat-icon.balance { background: linear-gradient(135deg, #43e97b 0%, #38f9d7 100%); }

.stat-info {
  flex: 1;
}

.stat-number {
  font-size: 28px;
  font-weight: bold;
  color: var(--el-text-color-primary);
  margin-bottom: 5px;
}

.stat-label {
  font-size: 14px;
  color: var(--el-text-color-regular);
}

.charts-row {
  margin-bottom: 20px;
}

.chart-container {
  height: 300px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.chart-placeholder {
  color: var(--el-text-color-placeholder);
  font-size: 16px;
}

.tables-row {
  margin-bottom: 20px;
}

.package-info {
  padding: 10px 0;
}

.package-item {
  display: flex;
  justify-content: space-between;
  margin-bottom: 15px;
  padding: 10px 0;
  border-bottom: 1px solid var(--el-border-color-light);
}

.package-item:last-child {
  border-bottom: none;
}

.package-item .label {
  color: var(--el-text-color-regular);
  font-weight: 500;
}

.package-item .value {
  color: var(--el-text-color-primary);
  font-weight: bold;
}

.package-actions {
  display: flex;
  gap: 10px;
  margin-top: 20px;
  justify-content: center;
}
</style> 