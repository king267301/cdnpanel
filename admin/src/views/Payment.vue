<template>
  <div class="payment-page">
    <div class="page-header">
      <h2>支付配置</h2>
    </div>

    <el-row :gutter="20">
      <el-col :span="8">
        <el-card class="payment-card">
          <template #header>
            <div class="card-header">
              <span>易支付</span>
              <el-switch v-model="paymentConfig.yipay.enabled" />
            </div>
          </template>
          <el-form :model="paymentConfig.yipay" label-width="100px">
            <el-form-item label="商户ID">
              <el-input v-model="paymentConfig.yipay.merchantId" placeholder="请输入商户ID" />
            </el-form-item>
            <el-form-item label="密钥">
              <el-input v-model="paymentConfig.yipay.secretKey" type="password" placeholder="请输入密钥" />
            </el-form-item>
            <el-form-item label="回调地址">
              <el-input v-model="paymentConfig.yipay.notifyUrl" placeholder="https://yourdomain.com/api/pay/yipay/notify" />
            </el-form-item>
            <el-form-item>
              <el-button type="primary" @click="testPayment('yipay')">测试连接</el-button>
            </el-form-item>
          </el-form>
        </el-card>
      </el-col>

      <el-col :span="8">
        <el-card class="payment-card">
          <template #header>
            <div class="card-header">
              <span>PayPal</span>
              <el-switch v-model="paymentConfig.paypal.enabled" />
            </div>
          </template>
          <el-form :model="paymentConfig.paypal" label-width="100px">
            <el-form-item label="Client ID">
              <el-input v-model="paymentConfig.paypal.clientId" placeholder="请输入Client ID" />
            </el-form-item>
            <el-form-item label="Client Secret">
              <el-input v-model="paymentConfig.paypal.clientSecret" type="password" placeholder="请输入Client Secret" />
            </el-form-item>
            <el-form-item label="环境">
              <el-select v-model="paymentConfig.paypal.mode">
                <el-option label="沙盒环境" value="sandbox" />
                <el-option label="生产环境" value="live" />
              </el-select>
            </el-form-item>
            <el-form-item>
              <el-button type="primary" @click="testPayment('paypal')">测试连接</el-button>
            </el-form-item>
          </el-form>
        </el-card>
      </el-col>

      <el-col :span="8">
        <el-card class="payment-card">
          <template #header>
            <div class="card-header">
              <span>Stripe</span>
              <el-switch v-model="paymentConfig.stripe.enabled" />
            </div>
          </template>
          <el-form :model="paymentConfig.stripe" label-width="100px">
            <el-form-item label="Publishable Key">
              <el-input v-model="paymentConfig.stripe.publishableKey" placeholder="pk_test_..." />
            </el-form-item>
            <el-form-item label="Secret Key">
              <el-input v-model="paymentConfig.stripe.secretKey" type="password" placeholder="sk_test_..." />
            </el-form-item>
            <el-form-item>
              <el-button type="primary" @click="testPayment('stripe')">测试连接</el-button>
            </el-form-item>
          </el-form>
        </el-card>
      </el-col>
    </el-row>

    <el-row style="margin-top: 20px;">
      <el-col :span="24">
        <el-card>
          <template #header>
            <span>支付设置</span>
          </template>
          <el-form label-width="120px">
            <el-form-item label="默认支付方式">
              <el-select v-model="defaultPaymentMethod">
                <el-option label="易支付" value="yipay" />
                <el-option label="PayPal" value="paypal" />
                <el-option label="Stripe" value="stripe" />
              </el-select>
            </el-form-item>
            <el-form-item label="自动续费">
              <el-switch v-model="autoRenewal" />
            </el-form-item>
            <el-form-item label="发票生成">
              <el-switch v-model="invoiceGeneration" />
            </el-form-item>
            <el-form-item>
              <el-button type="primary" @click="saveConfig">保存配置</el-button>
              <el-button @click="resetConfig">重置</el-button>
            </el-form-item>
          </el-form>
        </el-card>
      </el-col>
    </el-row>

    <!-- 测试支付对话框 -->
    <el-dialog v-model="testDialogVisible" title="测试支付" width="400px">
      <el-form :model="testForm" label-width="80px">
        <el-form-item label="金额">
          <el-input-number v-model="testForm.amount" :min="0.01" :precision="2" />
        </el-form-item>
        <el-form-item label="描述">
          <el-input v-model="testForm.description" placeholder="测试订单" />
        </el-form-item>
      </el-form>
      <template #footer>
        <span class="dialog-footer">
          <el-button @click="testDialogVisible = false">取消</el-button>
          <el-button type="primary" @click="createTestPayment">创建测试订单</el-button>
        </span>
      </template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue';
import { ElMessage } from 'element-plus';

const paymentConfig = ref({
  yipay: {
    enabled: true,
    merchantId: '',
    secretKey: '',
    notifyUrl: ''
  },
  paypal: {
    enabled: false,
    clientId: '',
    clientSecret: '',
    mode: 'sandbox'
  },
  stripe: {
    enabled: false,
    publishableKey: '',
    secretKey: ''
  }
});

const defaultPaymentMethod = ref('yipay');
const autoRenewal = ref(true);
const invoiceGeneration = ref(true);
const testDialogVisible = ref(false);
const testForm = ref({
  amount: 0.01,
  description: '测试订单'
});

function testPayment(method: string) {
  if (!paymentConfig.value[method as keyof typeof paymentConfig.value].enabled) {
    ElMessage.warning('请先启用该支付方式');
    return;
  }
  
  testDialogVisible.value = true;
}

function createTestPayment() {
  // 这里应该调用支付API创建测试订单
  ElMessage.success('测试订单创建成功，正在跳转支付页面...');
  testDialogVisible.value = false;
}

function saveConfig() {
  // 保存配置到后端
  ElMessage.success('配置保存成功');
}

function resetConfig() {
  // 重置配置
  ElMessage.info('配置已重置');
}

onMounted(() => {
  // 加载配置
  console.log('Payment config page mounted');
});
</script>

<style scoped>
.payment-page {
  padding: 20px;
}

.page-header {
  margin-bottom: 20px;
}

.page-header h2 {
  margin: 0;
  color: var(--el-text-color-primary);
}

.payment-card {
  height: 100%;
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.dialog-footer {
  display: flex;
  justify-content: flex-end;
  gap: 10px;
}
</style> 