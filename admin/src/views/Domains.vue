<template>
  <div class="domains-page">
    <div class="page-header">
      <h2>域名管理</h2>
      <div class="header-actions">
        <el-button type="success" @click="showAddDialog = true">
          <el-icon><Plus /></el-icon>
          添加域名
        </el-button>
        <el-button type="primary" @click="refreshData">
          <el-icon><Refresh /></el-icon>
          刷新
        </el-button>
      </div>
    </div>

    <!-- 统计卡片 -->
    <div class="stats-cards">
      <el-card class="stat-card">
        <div class="stat-content">
          <div class="stat-number">{{ stats.total }}</div>
          <div class="stat-label">总域名数</div>
        </div>
      </el-card>
      <el-card class="stat-card">
        <div class="stat-content">
          <div class="stat-number">{{ stats.active }}</div>
          <div class="stat-label">已生效</div>
        </div>
      </el-card>
      <el-card class="stat-card">
        <div class="stat-content">
          <div class="stat-number">{{ stats.pending }}</div>
          <div class="stat-label">待审核</div>
        </div>
      </el-card>
      <el-card class="stat-card">
        <div class="stat-content">
          <div class="stat-number">{{ stats.disabled }}</div>
          <div class="stat-label">已禁用</div>
        </div>
      </el-card>
    </div>

    <!-- 搜索和筛选 -->
    <el-card class="filter-card">
      <el-form :inline="true" :model="filterForm" class="filter-form">
        <el-form-item label="域名">
          <el-input 
            v-model="filterForm.domain" 
            placeholder="搜索域名"
            clearable
          />
        </el-form-item>
        <el-form-item label="用户">
          <el-input 
            v-model="filterForm.user" 
            placeholder="搜索用户"
            clearable
          />
        </el-form-item>
        <el-form-item label="状态">
          <el-select v-model="filterForm.status" placeholder="选择状态" clearable>
            <el-option label="全部" value="" />
            <el-option label="已生效" value="active" />
            <el-option label="待审核" value="pending" />
            <el-option label="已禁用" value="disabled" />
          </el-select>
        </el-form-item>
        <el-form-item>
          <el-button type="primary" @click="searchDomains">搜索</el-button>
          <el-button @click="resetFilter">重置</el-button>
        </el-form-item>
      </el-form>
    </el-card>

    <!-- 域名列表 -->
    <el-card>
      <el-table :data="domains" stripe style="width: 100%" v-loading="loading">
        <el-table-column prop="domain" label="域名" min-width="150" />
        <el-table-column prop="user" label="用户" width="120" />
        <el-table-column prop="origin" label="回源地址" min-width="200" />
        <el-table-column prop="status" label="状态" width="100">
          <template #default="scope">
            <el-tag :type="getStatusType(scope.row.status)">
              {{ getStatusText(scope.row.status) }}
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
        <el-table-column prop="bandwidth" label="带宽使用" width="120">
          <template #default="scope">
            {{ formatBytes(scope.row.bandwidth) }}/s
          </template>
        </el-table-column>
        <el-table-column prop="createdAt" label="添加时间" width="180" />
        <el-table-column label="操作" width="280" fixed="right">
          <template #default="scope">
            <el-button size="small" @click="viewDetails(scope.row)">详情</el-button>
            <el-button 
              size="small" 
              type="success" 
              @click="approveDomain(scope.row)"
              v-if="scope.row.status === 'pending'"
            >
              审核通过
            </el-button>
            <el-button 
              size="small" 
              type="warning" 
              @click="disableDomain(scope.row)"
              v-if="scope.row.status === 'active'"
            >
              禁用
            </el-button>
            <el-button 
              size="small" 
              type="primary" 
              @click="enableDomain(scope.row)"
              v-if="scope.row.status === 'disabled'"
            >
              启用
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

      <!-- 分页 -->
      <div class="pagination-wrapper">
        <el-pagination
          v-model:current-page="pagination.current"
          v-model:page-size="pagination.size"
          :page-sizes="[10, 20, 50, 100]"
          :total="pagination.total"
          layout="total, sizes, prev, pager, next, jumper"
          @size-change="handleSizeChange"
          @current-change="handleCurrentChange"
        />
      </div>
    </el-card>

    <!-- 添加域名对话框 -->
    <el-dialog v-model="showAddDialog" title="添加域名" width="700px">
      <el-form :model="domainForm" label-width="120px" :rules="domainRules" ref="domainFormRef">
        <el-form-item label="用户" prop="userId">
          <el-select v-model="domainForm.userId" placeholder="选择用户" style="width: 100%">
            <el-option 
              v-for="user in users" 
              :key="user.id" 
              :label="user.username" 
              :value="user.id" 
            />
          </el-select>
        </el-form-item>
        <el-form-item label="域名" prop="domain">
          <el-input 
            v-model="domainForm.domain" 
            placeholder="请输入域名，如: example.com"
          />
          <div class="form-tip">请输入域名，不需要包含 http:// 或 https://</div>
        </el-form-item>
        <el-form-item label="回源地址" prop="origin">
          <el-input 
            v-model="domainForm.origin" 
            placeholder="请输入源站地址，如: http://your-origin.com"
          />
          <div class="form-tip">请输入源站服务器地址</div>
        </el-form-item>
        <el-form-item label="自动SSL">
          <el-switch v-model="domainForm.autoSSL" />
          <div class="form-tip">启用后将自动申请SSL证书</div>
        </el-form-item>
        <el-form-item label="状态">
          <el-radio-group v-model="domainForm.status">
            <el-radio label="active">直接生效</el-radio>
            <el-radio label="pending">待审核</el-radio>
            <el-radio label="disabled">禁用</el-radio>
          </el-radio-group>
        </el-form-item>
        <el-form-item label="备注">
          <el-input 
            v-model="domainForm.remark" 
            type="textarea" 
            :rows="3"
            placeholder="可选备注信息"
          />
        </el-form-item>
      </el-form>
      <template #footer>
        <span class="dialog-footer">
          <el-button @click="showAddDialog = false">取消</el-button>
          <el-button type="primary" @click="addDomain">添加域名</el-button>
        </span>
      </template>
    </el-dialog>

    <!-- 域名详情对话框 -->
    <el-dialog v-model="showDetailsDialog" title="域名详情" width="800px">
      <div v-if="selectedDomain" class="domain-details">
        <el-descriptions :column="2" border>
          <el-descriptions-item label="域名">{{ selectedDomain.domain }}</el-descriptions-item>
          <el-descriptions-item label="用户">{{ selectedDomain.user }}</el-descriptions-item>
          <el-descriptions-item label="回源地址">{{ selectedDomain.origin }}</el-descriptions-item>
          <el-descriptions-item label="状态">
            <el-tag :type="getStatusType(selectedDomain.status)">
              {{ getStatusText(selectedDomain.status) }}
            </el-tag>
          </el-descriptions-item>
          <el-descriptions-item label="SSL状态">
            <el-tag :type="selectedDomain.ssl ? 'success' : 'info'">
              {{ selectedDomain.ssl ? '已启用' : '未启用' }}
            </el-tag>
          </el-descriptions-item>
          <el-descriptions-item label="DNS状态">
            <el-tag :type="getDNSStatusType(selectedDomain.dnsStatus)">
              {{ getDNSStatusText(selectedDomain.dnsStatus) }}
            </el-tag>
          </el-descriptions-item>
          <el-descriptions-item label="今日流量">{{ formatBytes(selectedDomain.traffic) }}</el-descriptions-item>
          <el-descriptions-item label="带宽使用">{{ formatBytes(selectedDomain.bandwidth) }}/s</el-descriptions-item>
          <el-descriptions-item label="添加时间">{{ selectedDomain.createdAt }}</el-descriptions-item>
          <el-descriptions-item label="最后更新">{{ selectedDomain.updatedAt }}</el-descriptions-item>
        </el-descriptions>

        <div class="detail-section">
          <h4>访问统计</h4>
          <el-row :gutter="20">
            <el-col :span="8">
              <div class="stat-item">
                <div class="stat-value">{{ selectedDomain.hits || 0 }}</div>
                <div class="stat-label">今日访问量</div>
              </div>
            </el-col>
            <el-col :span="8">
              <div class="stat-item">
                <div class="stat-value">{{ selectedDomain.requests || 0 }}</div>
                <div class="stat-label">今日请求数</div>
              </div>
            </el-col>
            <el-col :span="8">
              <div class="stat-item">
                <div class="stat-value">{{ selectedDomain.cacheHitRate || '0%' }}</div>
                <div class="stat-label">缓存命中率</div>
              </div>
            </el-col>
          </el-row>
        </div>

        <div class="detail-section">
          <h4>操作记录</h4>
          <el-timeline>
            <el-timeline-item 
              v-for="log in selectedDomain.logs || []" 
              :key="log.id"
              :timestamp="log.time"
              :type="log.type"
            >
              {{ log.message }}
            </el-timeline-item>
          </el-timeline>
        </div>
      </div>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, computed } from 'vue';
import { Plus, Refresh } from '@element-plus/icons-vue';
import { ElMessage, ElMessageBox } from 'element-plus';

const loading = ref(false);
const showAddDialog = ref(false);
const showDetailsDialog = ref(false);
const selectedDomain = ref<any>(null);
const domainFormRef = ref();

const filterForm = ref({
  domain: '',
  user: '',
  status: ''
});

const domainForm = ref({
  userId: '',
  domain: '',
  origin: '',
  autoSSL: true,
  status: 'pending',
  remark: ''
});

const domainRules = {
  userId: [{ required: true, message: '请选择用户', trigger: 'change' }],
  domain: [{ required: true, message: '请输入域名', trigger: 'blur' }],
  origin: [{ required: true, message: '请输入回源地址', trigger: 'blur' }]
};

const pagination = ref({
  current: 1,
  size: 20,
  total: 0
});

const domains = ref([
  {
    id: 1,
    domain: 'example.com',
    user: 'user1',
    origin: 'http://origin.example.com',
    status: 'active',
    ssl: true,
    dnsStatus: 'resolved',
    traffic: 1073741824,
    bandwidth: 1048576,
    hits: 1500,
    requests: 3000,
    cacheHitRate: '85%',
    createdAt: '2024-01-01 10:00:00',
    updatedAt: '2024-01-01 15:30:00',
    logs: [
      { id: 1, time: '2024-01-01 15:30:00', type: 'success', message: '域名审核通过' },
      { id: 2, time: '2024-01-01 10:00:00', type: 'info', message: '域名添加成功' }
    ]
  },
  {
    id: 2,
    domain: 'test.com',
    user: 'user2',
    origin: 'http://origin.test.com',
    status: 'pending',
    ssl: false,
    dnsStatus: 'pending',
    traffic: 0,
    bandwidth: 0,
    hits: 0,
    requests: 0,
    cacheHitRate: '0%',
    createdAt: '2024-01-02 11:00:00',
    updatedAt: '2024-01-02 11:00:00',
    logs: [
      { id: 3, time: '2024-01-02 11:00:00', type: 'info', message: '域名添加成功，等待审核' }
    ]
  }
]);

const users = ref([
  { id: 1, username: 'user1' },
  { id: 2, username: 'user2' },
  { id: 3, username: 'user3' }
]);

const stats = computed(() => {
  const total = domains.value.length;
  const active = domains.value.filter(d => d.status === 'active').length;
  const pending = domains.value.filter(d => d.status === 'pending').length;
  const disabled = domains.value.filter(d => d.status === 'disabled').length;
  
  return { total, active, pending, disabled };
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
    pending: '待审核',
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

function searchDomains() {
  loading.value = true;
  // 这里应该调用API搜索域名
  setTimeout(() => {
    loading.value = false;
    ElMessage.success('搜索完成');
  }, 1000);
}

function resetFilter() {
  filterForm.value = {
    domain: '',
    user: '',
    status: ''
  };
  searchDomains();
}

function handleSizeChange(size: number) {
  pagination.value.size = size;
  refreshData();
}

function handleCurrentChange(current: number) {
  pagination.value.current = current;
  refreshData();
}

function refreshData() {
  loading.value = true;
  // 这里应该调用API刷新数据
  setTimeout(() => {
    loading.value = false;
    ElMessage.success('数据已刷新');
  }, 1000);
}

function addDomain() {
  domainFormRef.value?.validate((valid: boolean) => {
    if (valid) {
      // 这里应该调用API添加域名
      const newDomain = {
        id: domains.value.length + 1,
        domain: domainForm.value.domain,
        user: users.value.find(u => u.id === domainForm.value.userId)?.username,
        origin: domainForm.value.origin,
        status: domainForm.value.status,
        ssl: domainForm.value.autoSSL,
        dnsStatus: 'pending',
        traffic: 0,
        bandwidth: 0,
        createdAt: new Date().toLocaleString(),
        updatedAt: new Date().toLocaleString()
      };
      
      domains.value.push(newDomain);
      showAddDialog.value = false;
      ElMessage.success('域名添加成功');
    }
  });
}

function viewDetails(domain: any) {
  selectedDomain.value = domain;
  showDetailsDialog.value = true;
}

function approveDomain(domain: any) {
  ElMessageBox.confirm(`确定要审核通过域名 ${domain.domain} 吗？`, '确认审核', {
    confirmButtonText: '确定',
    cancelButtonText: '取消',
    type: 'warning'
  }).then(() => {
    domain.status = 'active';
    domain.dnsStatus = 'resolved';
    ElMessage.success('域名审核通过');
  });
}

function disableDomain(domain: any) {
  ElMessageBox.confirm(`确定要禁用域名 ${domain.domain} 吗？`, '确认禁用', {
    confirmButtonText: '确定',
    cancelButtonText: '取消',
    type: 'warning'
  }).then(() => {
    domain.status = 'disabled';
    ElMessage.success('域名已禁用');
  });
}

function enableDomain(domain: any) {
  ElMessageBox.confirm(`确定要启用域名 ${domain.domain} 吗？`, '确认启用', {
    confirmButtonText: '确定',
    cancelButtonText: '取消',
    type: 'warning'
  }).then(() => {
    domain.status = 'active';
    ElMessage.success('域名已启用');
  });
}

function refreshCache(domain: any) {
  ElMessageBox.confirm(`确定要刷新域名 ${domain.domain} 的缓存吗？`, '确认刷新', {
    confirmButtonText: '确定',
    cancelButtonText: '取消',
    type: 'warning'
  }).then(() => {
    ElMessage.success('缓存刷新任务已提交');
  });
}

function deleteDomain(domain: any) {
  ElMessageBox.confirm(`确定要删除域名 ${domain.domain} 吗？此操作不可恢复！`, '确认删除', {
    confirmButtonText: '确定',
    cancelButtonText: '取消',
    type: 'error'
  }).then(() => {
    domains.value = domains.value.filter(d => d.id !== domain.id);
    ElMessage.success('域名删除成功');
  });
}

onMounted(() => {
  refreshData();
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

.header-actions {
  display: flex;
  gap: 10px;
}

.stats-cards {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 20px;
  margin-bottom: 20px;
}

.stat-card {
  text-align: center;
}

.stat-content {
  padding: 10px;
}

.stat-number {
  font-size: 2rem;
  font-weight: bold;
  color: var(--el-color-primary);
  margin-bottom: 5px;
}

.stat-label {
  color: var(--el-text-color-regular);
  font-size: 14px;
}

.filter-card {
  margin-bottom: 20px;
}

.filter-form {
  margin: 0;
}

.form-tip {
  font-size: 12px;
  color: var(--el-text-color-placeholder);
  margin-top: 5px;
}

.pagination-wrapper {
  display: flex;
  justify-content: center;
  margin-top: 20px;
}

.domain-details {
  max-height: 600px;
  overflow-y: auto;
}

.detail-section {
  margin-top: 20px;
}

.detail-section h4 {
  margin-bottom: 15px;
  color: var(--el-text-color-primary);
}

.stat-item {
  text-align: center;
  padding: 15px;
  background: #f5f7fa;
  border-radius: 4px;
}

.stat-item .stat-value {
  font-size: 1.5rem;
  font-weight: bold;
  color: var(--el-color-primary);
  margin-bottom: 5px;
}

.stat-item .stat-label {
  color: var(--el-text-color-regular);
  font-size: 12px;
}

.dialog-footer {
  display: flex;
  justify-content: flex-end;
  gap: 10px;
}
</style> 