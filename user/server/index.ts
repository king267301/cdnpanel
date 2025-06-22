import express from 'express';
import cors from 'cors';
import { createCloudflareAPI, generateCNAMEValue, validateDomain } from '../../shared/cloudflare';
import { createSubdomainManager } from '../../shared/subdomain';

const app = express();
const PORT = process.env.PORT || 3001;

app.use(cors());
app.use(express.json());

// 子域名管理器配置
const subdomainConfig = {
  domain: 'cdn-system.com',
  cloudflareConfig: {
    apiToken: process.env.CLOUDFLARE_API_TOKEN || '',
    zoneId: process.env.CLOUDFLARE_ZONE_ID || '',
    accountId: process.env.CLOUDFLARE_ACCOUNT_ID || ''
  }
};

const subdomainManager = createSubdomainManager(subdomainConfig);

// 获取套餐列表
app.get('/api/packages', (req, res) => {
  const packages = [
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
  ];

  res.json({ packages });
});

// 购买套餐
app.post('/api/packages/purchase', async (req, res) => {
  try {
    const { packageId, userId, username, paymentMethod } = req.body;

    if (!packageId || !userId || !username) {
      return res.status(400).json({ error: '请提供完整的购买信息' });
    }

    // 这里应该处理支付逻辑
    // 简化处理，直接模拟支付成功

    // 生成用户子域名
    const userSubdomain = await subdomainManager.generateUserSubdomain(
      userId,
      username,
      packageId.toString(),
      '标准版' // 这里应该根据packageId获取套餐名称
    );

    // 计算过期时间（30天后）
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 30);

    const purchaseResult = {
      success: true,
      message: '套餐购买成功',
      orderId: `order_${Date.now()}`,
      packageId,
      userId,
      subdomain: userSubdomain.subdomain,
      cnameValue: userSubdomain.cnameValue,
      expiresAt: expiresAt.toISOString(),
      status: 'active'
    };

    res.json(purchaseResult);
  } catch (error) {
    console.error('购买套餐失败:', error);
    res.status(500).json({ error: '购买套餐失败' });
  }
});

// 获取用户子域名信息
app.get('/api/user/subdomain', async (req, res) => {
  try {
    const { userId } = req.query;

    if (!userId) {
      return res.status(400).json({ error: '请提供用户ID' });
    }

    const userSubdomain = await subdomainManager.getUserSubdomain(userId as string);
    
    if (userSubdomain) {
      res.json({
        success: true,
        subdomain: userSubdomain
      });
    } else {
      res.json({
        success: false,
        message: '用户未购买套餐或子域名不存在'
      });
    }
  } catch (error) {
    console.error('获取用户子域名失败:', error);
    res.status(500).json({ error: '获取用户子域名失败' });
  }
});

// 域名管理接口
app.post('/api/domains', async (req, res) => {
  try {
    const { domain, origin, autoSSL, autoDNS, cloudflareConfig } = req.body;

    // 验证域名格式
    if (!validateDomain(domain)) {
      return res.status(400).json({ error: '域名格式不正确' });
    }

    // 如果启用了自动DNS，创建CNAME记录
    if (autoDNS && cloudflareConfig) {
      try {
        const cloudflare = createCloudflareAPI(cloudflareConfig);
        const cnameValue = generateCNAMEValue(domain);
        
        await cloudflare.upsertCNAMERecord(domain, cnameValue);
        
        res.json({
          success: true,
          message: '域名添加成功，DNS记录已自动创建',
          domain: {
            id: Date.now(),
            domain,
            origin,
            status: 'pending',
            ssl: autoSSL,
            dnsStatus: 'resolved',
            traffic: 0,
            createdAt: new Date().toISOString()
          }
        });
      } catch (error) {
        console.error('Cloudflare API错误:', error);
        res.status(500).json({ error: 'DNS记录创建失败' });
      }
    } else {
      // 手动DNS配置
      res.json({
        success: true,
        message: '域名添加成功，请手动配置DNS',
        domain: {
          id: Date.now(),
          domain,
          origin,
          status: 'pending',
          ssl: autoSSL,
          dnsStatus: 'manual',
          traffic: 0,
          createdAt: new Date().toISOString()
        }
      });
    }
  } catch (error) {
    console.error('添加域名错误:', error);
    res.status(500).json({ error: '添加域名失败' });
  }
});

// 获取域名列表
app.get('/api/domains', (req, res) => {
  // 模拟域名数据
  const domains = [
    {
      id: 1,
      domain: 'example.com',
      origin: 'http://origin.example.com',
      status: 'active',
      ssl: true,
      dnsStatus: 'resolved',
      traffic: 1073741824,
      createdAt: '2024-01-01T10:00:00.000Z'
    },
    {
      id: 2,
      domain: 'test.com',
      origin: 'http://origin.test.com',
      status: 'pending',
      ssl: false,
      dnsStatus: 'pending',
      traffic: 0,
      createdAt: '2024-01-02T11:00:00.000Z'
    }
  ];

  res.json({ domains });
});

// 删除域名
app.delete('/api/domains/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { cloudflareConfig } = req.body;

    // 如果配置了Cloudflare，删除DNS记录
    if (cloudflareConfig) {
      try {
        const cloudflare = createCloudflareAPI(cloudflareConfig);
        // 这里需要先获取域名信息，然后删除对应的DNS记录
        // 简化处理，实际应该查询数据库获取域名信息
      } catch (error) {
        console.error('删除DNS记录失败:', error);
      }
    }

    res.json({ success: true, message: '域名删除成功' });
  } catch (error) {
    console.error('删除域名错误:', error);
    res.status(500).json({ error: '删除域名失败' });
  }
});

// 自动配置DNS
app.post('/api/domains/:id/dns', async (req, res) => {
  try {
    const { id } = req.params;
    const { cloudflareConfig } = req.body;

    if (!cloudflareConfig) {
      return res.status(400).json({ error: '请先配置Cloudflare' });
    }

    const cloudflare = createCloudflareAPI(cloudflareConfig);
    
    // 这里应该从数据库获取域名信息
    const domain = 'example.com'; // 模拟域名
    const cnameValue = generateCNAMEValue(domain);
    
    await cloudflare.upsertCNAMERecord(domain, cnameValue);
    
    res.json({ 
      success: true, 
      message: 'DNS配置成功',
      dnsStatus: 'resolved'
    });
  } catch (error) {
    console.error('自动配置DNS错误:', error);
    res.status(500).json({ error: 'DNS配置失败' });
  }
});

// 检查DNS解析状态
app.get('/api/domains/:id/dns/check', async (req, res) => {
  try {
    const { id } = req.params;
    const { cloudflareConfig } = req.query;

    if (!cloudflareConfig) {
      return res.status(400).json({ error: '请先配置Cloudflare' });
    }

    const cloudflare = createCloudflareAPI(JSON.parse(cloudflareConfig as string));
    
    // 这里应该从数据库获取域名信息
    const domain = 'example.com'; // 模拟域名
    
    const record = await cloudflare.checkCNAMERecord(domain);
    
    res.json({
      success: true,
      resolved: !!record,
      record: record
    });
  } catch (error) {
    console.error('检查DNS状态错误:', error);
    res.status(500).json({ error: '检查DNS状态失败' });
  }
});

// 测试Cloudflare连接
app.post('/api/cloudflare/test', async (req, res) => {
  try {
    const { apiToken, zoneId, accountId } = req.body;

    if (!apiToken || !zoneId) {
      return res.status(400).json({ error: '请填写API Token和Zone ID' });
    }

    const cloudflare = createCloudflareAPI({ apiToken, zoneId, accountId });
    const isValid = await cloudflare.validateToken();

    if (isValid) {
      const zoneInfo = await cloudflare.getZoneInfo();
      res.json({
        success: true,
        message: 'Cloudflare连接成功',
        zoneInfo
      });
    } else {
      res.status(400).json({ error: 'API Token无效' });
    }
  } catch (error) {
    console.error('测试Cloudflare连接错误:', error);
    res.status(500).json({ error: 'Cloudflare连接失败' });
  }
});

// 刷新缓存
app.post('/api/domains/:id/cache/refresh', (req, res) => {
  try {
    const { id } = req.params;
    
    // 这里应该实现缓存刷新逻辑
    
    res.json({ success: true, message: '缓存刷新任务已提交' });
  } catch (error) {
    console.error('刷新缓存错误:', error);
    res.status(500).json({ error: '刷新缓存失败' });
  }
});

// 健康检查
app.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

app.listen(PORT, () => {
  console.log(`用户端服务器运行在端口 ${PORT}`);
}); 