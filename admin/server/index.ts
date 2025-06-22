import express from 'express';
import cors from 'cors';

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());

// 获取域名统计
app.get('/api/domains/stats', (req, res) => {
  const stats = {
    total: 150,
    active: 120,
    pending: 20,
    disabled: 10,
    todayTraffic: 107374182400, // 100GB
    todayRequests: 1500000
  };
  res.json(stats);
});

// 获取域名列表
app.get('/api/domains', (req, res) => {
  const { page = 1, size = 20, domain, user, status } = req.query;
  
  // 模拟域名数据
  const domains = [
    {
      id: 1,
      domain: 'example.com',
      user: 'user1',
      origin: 'http://origin.example.com',
      status: 'active',
      ssl: true,
      traffic: 1073741824,
      bandwidth: 1048576,
      hits: 1500,
      requests: 3000,
      cacheHitRate: '85%',
      createdAt: '2024-01-01 10:00:00',
      updatedAt: '2024-01-01 15:30:00'
    },
    {
      id: 2,
      domain: 'test.com',
      user: 'user2',
      origin: 'http://origin.test.com',
      status: 'pending',
      ssl: false,
      traffic: 0,
      bandwidth: 0,
      hits: 0,
      requests: 0,
      cacheHitRate: '0%',
      createdAt: '2024-01-02 11:00:00',
      updatedAt: '2024-01-02 11:00:00'
    },
    {
      id: 3,
      domain: 'demo.com',
      user: 'user3',
      origin: 'http://origin.demo.com',
      status: 'disabled',
      ssl: true,
      traffic: 536870912,
      bandwidth: 524288,
      hits: 800,
      requests: 1600,
      cacheHitRate: '75%',
      createdAt: '2024-01-03 09:00:00',
      updatedAt: '2024-01-03 14:00:00'
    }
  ];

  // 模拟筛选
  let filteredDomains = domains;
  if (domain) {
    filteredDomains = filteredDomains.filter(d => d.domain.includes(domain as string));
  }
  if (user) {
    filteredDomains = filteredDomains.filter(d => d.user.includes(user as string));
  }
  if (status) {
    filteredDomains = filteredDomains.filter(d => d.status === status);
  }

  // 模拟分页
  const start = (Number(page) - 1) * Number(size);
  const end = start + Number(size);
  const paginatedDomains = filteredDomains.slice(start, end);

  res.json({
    domains: paginatedDomains,
    pagination: {
      current: Number(page),
      size: Number(size),
      total: filteredDomains.length
    }
  });
});

// 添加域名
app.post('/api/domains', (req, res) => {
  const { userId, domain, origin, autoSSL, status, remark } = req.body;

  if (!userId || !domain || !origin) {
    return res.status(400).json({ error: '请填写完整信息' });
  }

  const newDomain = {
    id: Date.now(),
    domain,
    user: `user${userId}`,
    origin,
    status: status || 'pending',
    ssl: autoSSL,
    traffic: 0,
    bandwidth: 0,
    hits: 0,
    requests: 0,
    cacheHitRate: '0%',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    remark
  };

  res.json({
    success: true,
    message: '域名添加成功',
    domain: newDomain
  });
});

// 审核域名
app.post('/api/domains/:id/approve', (req, res) => {
  const { id } = req.params;
  
  res.json({
    success: true,
    message: '域名审核通过',
    status: 'active'
  });
});

// 禁用域名
app.post('/api/domains/:id/disable', (req, res) => {
  const { id } = req.params;
  
  res.json({
    success: true,
    message: '域名已禁用',
    status: 'disabled'
  });
});

// 启用域名
app.post('/api/domains/:id/enable', (req, res) => {
  const { id } = req.params;
  
  res.json({
    success: true,
    message: '域名已启用',
    status: 'active'
  });
});

// 删除域名
app.delete('/api/domains/:id', (req, res) => {
  const { id } = req.params;
  
  res.json({
    success: true,
    message: '域名删除成功'
  });
});

// 获取域名详情
app.get('/api/domains/:id', (req, res) => {
  const { id } = req.params;
  
  const domain = {
    id: Number(id),
    domain: 'example.com',
    user: 'user1',
    origin: 'http://origin.example.com',
    status: 'active',
    ssl: true,
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
  };
  
  res.json(domain);
});

// 刷新缓存
app.post('/api/domains/:id/cache/refresh', (req, res) => {
  const { id } = req.params;
  
  res.json({
    success: true,
    message: '缓存刷新任务已提交'
  });
});

// 获取用户列表
app.get('/api/users', (req, res) => {
  const users = [
    { id: 1, username: 'user1', email: 'user1@example.com', status: 'active' },
    { id: 2, username: 'user2', email: 'user2@example.com', status: 'active' },
    { id: 3, username: 'user3', email: 'user3@example.com', status: 'active' }
  ];
  
  res.json({ users });
});

// 健康检查
app.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

app.listen(PORT, () => {
  console.log(`管理端服务器运行在端口 ${PORT}`);
}); 