<template>
  <div class="packages-page">
    <div class="page-header">
      <h2>套餐购买</h2>
      <p class="page-description">选择合适的CDN套餐，自动获得专属子域名用于CNAME接入</p>
    </div>

    <!-- 套餐列表 -->
    <div class="packages-grid">
      <el-card 
        v-for="pkg in packages" 
        :key="pkg.id" 
        class="package-card"
        :class="{ 'recommended': pkg.recommended }"
      >
        <div class="package-header">
          <h3 class="package-name">{{ pkg.name }}</h3>
          <div v-if="pkg.recommended" class="recommended-badge">推荐</div>
          <div class="package-price">
            <span class="price-amount">¥{{ pkg.price }}</span>
            <span class="price-period">/{{ pkg.period }}</span>
          </div>
        </div>

        <div class="package-features">
          <div class="feature-item">
            <el-icon><DataLine /></el-icon>
            <span>流量：{{ formatBytes(pkg.traffic) }}</span>
          </div>
          <div class="feature-item">
            <el-icon><Globe /></el-icon>
            <span>域名数：{{ pkg.domains }}个</span>
          </div>
          <div class="feature-item">
            <el-icon><Connection /></el-icon>
            <span>带宽：{{ formatBytes(pkg.bandwidth) }}/s</span>
          </div>
          <div class="feature-item">
            <el-icon><Timer /></el-icon>
            <span>缓存时间：{{ pkg.cacheTime }}</span>
          </div>
          <div class="feature-item">
            <el-icon><Shield /></el-icon>
            <span>DDoS防护：{{ pkg.ddosProtection ? '是' : '否' }}</span>
          </div>
          <div class="feature-item">
            <el-icon><Lock /></el-icon>
            <span>SSL证书：{{ pkg.sslCertificates }}个</span>
          </div>
        </div>

        <div class="package-actions">
          <el-button 
            type="primary" 
            size="large" 
            @click="purchasePackage(pkg)"
            :loading="purchasing === pkg.id"
            style="width: 100%"
          >
            立即购买
          </el-button>
        </div>
      </el-card>
    </div>

    <!-- 购买确认对话框 -->
    <el-dialog v-model="showPurchaseDialog" title="确认购买" width="500px">
      <div v-if="selectedPackage" class="purchase-confirm">
        <div class="confirm-item">
          <span class="label">套餐名称：</span>
          <span class="value">{{ selectedPackage.name }}</span>
        </div>
        <div class="confirm-item">
          <span class="label">套餐价格：</span>
          <span class="value price">¥{{ selectedPackage.price }}</span>
        </div>
        <div class="confirm-item">
          <span class="label">套餐时长：</span>
          <span class="value">{{ selectedPackage.period }}</span>
        </div>
        <div class="confirm-item">
          <span class="label">包含流量：</span>
          <span class="value">{{ formatBytes(selectedPackage.traffic) }}</span>
        </div>
        <div class="confirm-item">
          <span class="label">域名数量：</span>
          <span class="value">{{ selectedPackage.domains }}个</span>
        </div>
        
        <el-divider />
        
        <div class="subdomain-info">
          <h4>🎉 购买后将自动获得专属子域名</h4>
          <p>系统将为您自动生成一个专属的子域名，用于CNAME接入您自己的域名。</p>
          <div class="subdomain-example">
            <strong>示例：</strong> user123.cdn-system.com
          </div>
        </div>
      </div>
      
      <template #footer>
        <span class="dialog-footer">
          <el-button @click="showPurchaseDialog = false">取消</el-button>
          <el-button type="primary" @click="confirmPurchase" :loading="purchasing">
            确认购买
          </el-button>
        </span>
      </template>
    </el-dialog>

    <!-- 购买成功对话框 -->
    <el-dialog v-model="showSuccessDialog" title="购买成功" width="600px">
      <div v-if="purchaseResult" class="purchase-success">
        <div class="success-icon">
          <el-icon size="60" color="#67C23A"><CircleCheckFilled /></el-icon>
        </div>
        
        <h3>恭喜！套餐购买成功</h3>
        
        <div class="success-info">
          <div class="info-item">
            <span class="label">套餐：</span>
            <span class="value">{{ purchaseResult.packageName }}</span>
          </div>
          <div class="info-item">
            <span class="label">有效期：</span>
            <span class="value">{{ purchaseResult.expiresAt }}</span>
          </div>
          <div class="info-item">
            <span class="label">专属子域名：</span>
            <span class="value subdomain">{{ purchaseResult.subdomain }}</span>
          </div>
        </div>
        
        <el-alert
          title="CNAME配置说明"
          type="info"
          :closable="false"
          style="margin: 20px 0"
        >
          <p>请将您的域名CNAME记录指向：<strong>{{ purchaseResult.cnameValue }}</strong></p>
          <p>配置完成后，您就可以在域名管理中添加您的域名了。</p>
        </el-alert>
        
        <div class="success-actions">
          <el-button type="primary" @click="goToDomains">去管理域名</el-button>
          <el-button @click="copyCname">复制CNAME记录</el-button>
        </div>
      </div>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue';
import { useRouter } from 'vue-router';
import { 
  DataLine, 
  Globe, 
  Connection, 
  Timer, 
  Shield, 
  Lock,
  CircleCheckFilled 
} from '@element-plus/icons-vue';
import { ElMessage } from 'element-plus';

const router = useRouter();

const packages = ref([
  {
    id: 1,
    name: '入门版',
    price: 29,
    period: '月',
    traffic: 107374182400, // 100GB
    domains: 3,
    bandwidth: 10485760, // 10MB/s
    cacheTime: '24小时',
    ddosProtection: true,
    sslCertificates: 3,
    recommended: false
  },
  {
    id: 2,
    name: '标准版',
    price: 99,
    period: '月',
    traffic: 536870912000, // 500GB
    domains: 10,
    bandwidth: 52428800, // 50MB/s
    cacheTime: '48小时',
    ddosProtection: true,
    sslCertificates: 10,
    recommended: true
  },
  {
    id: 3,
    name: '专业版',
    price: 299,
    period: '月',
    traffic: 2147483648000, // 2TB
    domains: 50,
    bandwidth: 104857600, // 100MB/s
    cacheTime: '72小时',
    ddosProtection: true,
    sslCertificates: 50,
    recommended: false
  },
  {
    id: 4,
    name: '企业版',
    price: 999,
    period: '月',
    traffic: 10737418240000, // 10TB
    domains: 200,
    bandwidth: 524288000, // 500MB/s
    cacheTime: '168小时',
    ddosProtection: true,
    sslCertificates: 200,
    recommended: false
  }
]);

const showPurchaseDialog = ref(false);
const showSuccessDialog = ref(false);
const selectedPackage = ref<any>(null);
const purchasing = ref<string | null>(null);
const purchaseResult = ref<any>(null);

function formatBytes(bytes: number): string {
  const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
  if (bytes === 0) return '0 B';
  const i = Math.floor(Math.log(bytes) / Math.log(1024));
  return Math.round(bytes / Math.pow(1024, i) * 100) / 100 + ' ' + sizes[i];
}

function purchasePackage(pkg: any) {
  selectedPackage.value = pkg;
  showPurchaseDialog.value = true;
}

async function confirmPurchase() {
  if (!selectedPackage.value) return;
  
  purchasing.value = selectedPackage.value.id;
  
  try {
    // 模拟购买API调用
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    // 模拟购买结果
    purchaseResult.value = {
      packageName: selectedPackage.value.name,
      expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toLocaleDateString(),
      subdomain: `user${Date.now()}.cdn-system.com`,
      cnameValue: `cdn.user${Date.now()}.cdn-system.com.cdn-system.com`
    };
    
    showPurchaseDialog.value = false;
    showSuccessDialog.value = true;
    
    ElMessage.success('套餐购买成功！');
  } catch (error) {
    ElMessage.error('购买失败，请重试');
  } finally {
    purchasing.value = null;
  }
}

function goToDomains() {
  showSuccessDialog.value = false;
  router.push('/domains');
}

function copyCname() {
  if (purchaseResult.value) {
    navigator.clipboard.writeText(purchaseResult.value.cnameValue).then(() => {
      ElMessage.success('CNAME记录已复制到剪贴板');
    });
  }
}
</script>

<style scoped>
.packages-page {
  padding: 20px;
}

.page-header {
  text-align: center;
  margin-bottom: 40px;
}

.page-header h2 {
  margin: 0 0 10px 0;
  color: var(--el-text-color-primary);
  font-size: 2rem;
}

.page-description {
  color: var(--el-text-color-regular);
  font-size: 16px;
  margin: 0;
}

.packages-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
  gap: 30px;
  max-width: 1200px;
  margin: 0 auto;
}

.package-card {
  border: 2px solid transparent;
  transition: all 0.3s ease;
  position: relative;
  overflow: hidden;
}

.package-card:hover {
  transform: translateY(-5px);
  box-shadow: 0 10px 30px rgba(0, 0, 0, 0.1);
}

.package-card.recommended {
  border-color: var(--el-color-primary);
}

.recommended-badge {
  position: absolute;
  top: 0;
  right: 0;
  background: var(--el-color-primary);
  color: white;
  padding: 5px 15px;
  font-size: 12px;
  border-radius: 0 0 0 10px;
}

.package-header {
  text-align: center;
  margin-bottom: 20px;
}

.package-name {
  margin: 0 0 10px 0;
  color: var(--el-text-color-primary);
  font-size: 1.5rem;
}

.package-price {
  display: flex;
  align-items: baseline;
  justify-content: center;
  gap: 5px;
}

.price-amount {
  font-size: 2rem;
  font-weight: bold;
  color: var(--el-color-primary);
}

.price-period {
  color: var(--el-text-color-regular);
  font-size: 14px;
}

.package-features {
  margin-bottom: 30px;
}

.feature-item {
  display: flex;
  align-items: center;
  gap: 10px;
  margin-bottom: 12px;
  color: var(--el-text-color-regular);
}

.feature-item .el-icon {
  color: var(--el-color-primary);
}

.package-actions {
  text-align: center;
}

.purchase-confirm {
  padding: 20px 0;
}

.confirm-item {
  display: flex;
  justify-content: space-between;
  margin-bottom: 15px;
}

.confirm-item .label {
  color: var(--el-text-color-regular);
}

.confirm-item .value {
  font-weight: bold;
  color: var(--el-text-color-primary);
}

.confirm-item .value.price {
  color: var(--el-color-primary);
  font-size: 1.2rem;
}

.subdomain-info {
  background: #f5f7fa;
  padding: 20px;
  border-radius: 8px;
  margin-top: 20px;
}

.subdomain-info h4 {
  margin: 0 0 10px 0;
  color: var(--el-color-primary);
}

.subdomain-info p {
  margin: 0 0 15px 0;
  color: var(--el-text-color-regular);
}

.subdomain-example {
  background: white;
  padding: 10px;
  border-radius: 4px;
  border-left: 4px solid var(--el-color-primary);
}

.purchase-success {
  text-align: center;
  padding: 20px 0;
}

.success-icon {
  margin-bottom: 20px;
}

.purchase-success h3 {
  margin: 0 0 20px 0;
  color: var(--el-text-color-primary);
}

.success-info {
  text-align: left;
  margin-bottom: 20px;
}

.info-item {
  display: flex;
  justify-content: space-between;
  margin-bottom: 10px;
  padding: 10px 0;
  border-bottom: 1px solid #f0f0f0;
}

.info-item .label {
  color: var(--el-text-color-regular);
}

.info-item .value {
  font-weight: bold;
  color: var(--el-text-color-primary);
}

.info-item .value.subdomain {
  color: var(--el-color-primary);
  font-family: monospace;
}

.success-actions {
  display: flex;
  gap: 15px;
  justify-content: center;
  margin-top: 30px;
}

.dialog-footer {
  display: flex;
  justify-content: flex-end;
  gap: 10px;
}
</style> 