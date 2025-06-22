import express from 'express';
import { createPool } from 'mysql2/promise';
import { createClient } from 'redis';

const app = express();
const port = 8001;

// 数据库连接池
const db = createPool({
  host: process.env.DB_HOST || 'localhost',
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASS || '',
  database: process.env.DB_NAME || 'cdn_master',
  waitForConnections: true,
  connectionLimit: 10,
});

// Redis 客户端
const redis = createClient({
  url: process.env.REDIS_URL || 'redis://localhost:6379',
  password: process.env.REDIS_PASS || undefined,
});
redis.connect();

app.get('/health', (req, res) => {
  res.json({ status: 'ok', time: Date.now() });
});

app.listen(port, () => {
  console.log(`CDN主控端已启动，端口: ${port}`);
}); 