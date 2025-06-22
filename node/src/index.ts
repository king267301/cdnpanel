import express from 'express';
import { createClient } from 'redis';
import { fiveSecondShield, handleVerification } from './middleware/security';

const app = express();
const port = 8002;

// 中间件
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Redis 客户端
const redis = createClient({
  url: process.env.REDIS_URL || 'redis://localhost:6379',
  password: process.env.REDIS_PASS || undefined,
});
redis.connect();

// 5秒盾中间件（应用到所有路由）
app.use(fiveSecondShield);

// 验证处理路由
app.post('/verify', handleVerification);

// 健康检查
app.get('/health', (req, res) => {
  res.json({ status: 'ok', time: Date.now() });
});

// CDN缓存路由
app.get('*', async (req, res) => {
  const url = req.url;
  const cacheKey = `cdn:${url}`;
  
  try {
    // 检查缓存
    const cached = await redis.get(cacheKey);
    if (cached) {
      const data = JSON.parse(cached);
      res.set(data.headers);
      res.send(data.body);
      return;
    }

    // 回源获取
    const originResponse = await fetch(`http://origin.example.com${url}`);
    const body = await originResponse.text();
    const headers = Object.fromEntries(originResponse.headers.entries());

    // 缓存响应
    await redis.setex(cacheKey, 3600, JSON.stringify({ body, headers }));

    res.set(headers);
    res.send(body);
  } catch (error) {
    console.error('CDN处理失败:', error);
    res.status(500).send('CDN Error');
  }
});

app.listen(port, () => {
  console.log(`CDN被控端已启动，端口: ${port}`);
  console.log('5秒盾已启用');
}); 