<template>
  <div class="dashboard">
    <el-row :gutter="20" class="stats-row">
      <el-col :span="6">
        <el-card class="stat-card">
          <div class="stat-content">
            <div class="stat-icon users">
              <el-icon><User /></el-icon>
            </div>
            <div class="stat-info">
              <div class="stat-number">{{ stats.users }}</div>
              <div class="stat-label">总用户数</div>
            </div>
          </div>
        </el-card>
      </el-col>
      <el-col :span="6">
        <el-card class="stat-card">
          <div class="stat-content">
            <div class="stat-icon nodes">
              <el-icon><Monitor /></el-icon>
            </div>
            <div class="stat-info">
              <div class="stat-number">{{ stats.nodes }}</div>
              <div class="stat-label">在线节点</div>
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
            <div class="stat-icon revenue">
              <el-icon><Money /></el-icon>
            </div>
            <div class="stat-info">
              <div class="stat-number">¥{{ stats.revenue }}</div>
              <div class="stat-label">今日收入</div>
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
            <div class="chart-placeholder">流量图表</div>
          </div>
        </el-card>
      </el-col>
      <el-col :span="12">
        <el-card>
          <template #header>
            <span>节点状态</span>
          </template>
          <div class="chart-container">
            <div class="chart-placeholder">节点状态图表</div>
          </div>
        </el-card>
      </el-col>
    </el-row>

    <el-row :gutter="20" class="tables-row">
      <el-col :span="12">
        <el-card>
          <template #header>
            <span>最近订单</span>
          </template>
          <el-table :data="recentOrders" stripe>
            <el-table-column prop="id" label="订单号" width="80" />
            <el-table-column prop="user" label="用户" />
            <el-table-column prop="amount" label="金额" />
            <el-table-column prop="status" label="状态">
              <template #default="scope">
                <el-tag :type="getStatusType(scope.row.status)">
                  {{ scope.row.status }}
                </el-tag>
              </template>
            </el-table-column>
          </el-table>
        </el-card>
      </el-col>
      <el-col :span="12">
        <el-card>
          <template #header>
            <span>系统日志</span>
          </template>
          <el-table :data="systemLogs" stripe>
            <el-table-column prop="time" label="时间" width="120" />
            <el-table-column prop="level" label="级别" width="80">
              <template #default="scope">
                <el-tag :type="getLogLevelType(scope.row.level)" size="small">
                  {{ scope.row.level }}
                </el-tag>
              </template>
            </el-table-column>
            <el-table-column prop="message" label="消息" />
          </el-table>
        </el-card>
      </el-col>
    </el-row>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue';
import { User, Monitor, DataLine, Money } from '@element-plus/icons-vue';

const stats = ref({
  users: 1234,
  nodes: 56,
  traffic: 1073741824000,
  revenue: 12345.67
});

const recentOrders = ref([
  { id: '001', user: 'user1', amount: '¥99.99', status: 'paid' },
  { id: '002', user: 'user2', amount: '¥29.99', status: 'pending' },
  { id: '003', user: 'user3', amount: '¥199.99', status: 'failed' }
]);

const systemLogs = ref([
  { time: '2024-01-01 10:00', level: 'info', message: '系统启动成功' },
  { time: '2024-01-01 09:55', level: 'warn', message: '节点 node-01 响应超时' },
  { time: '2024-01-01 09:50', level: 'error', message: '数据库连接失败' }
]);

function formatBytes(bytes: number): string {
  const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
  if (bytes === 0) return '0 B';
  const i = Math.floor(Math.log(bytes) / Math.log(1024));
  return Math.round(bytes / Math.pow(1024, i) * 100) / 100 + ' ' + sizes[i];
}

function getStatusType(status: string): string {
  const types: Record<string, string> = {
    paid: 'success',
    pending: 'warning',
    failed: 'danger'
  };
  return types[status] || 'info';
}

function getLogLevelType(level: string): string {
  const types: Record<string, string> = {
    info: 'info',
    warn: 'warning',
    error: 'danger'
  };
  return types[level] || 'info';
}

onMounted(() => {
  // 模拟数据加载
  console.log('Dashboard mounted');
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

.stat-icon.users { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); }
.stat-icon.nodes { background: linear-gradient(135deg, #f093fb 0%, #f5576c 100%); }
.stat-icon.traffic { background: linear-gradient(135deg, #4facfe 0%, #00f2fe 100%); }
.stat-icon.revenue { background: linear-gradient(135deg, #43e97b 0%, #38f9d7 100%); }

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
</style> 