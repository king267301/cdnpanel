# CDN系统部署文件

本目录包含CDN系统的所有部署相关文件。

## 文件说明

### 脚本文件
- `install.sh` - 一键部署脚本（传统部署方式）
- `docker-deploy.sh` - Docker部署脚本
- `README.md` - 本文件

### 配置文件
- `docker-compose.yml` - Docker Compose配置文件
- `nginx.conf` - Nginx反向代理配置
- `.env` - 环境变量文件（部署时自动生成）

### 数据文件
- `init.sql` - 数据库初始化脚本（部署时自动生成）
- `mysql_data/` - MySQL数据目录（Docker部署）
- `redis_data/` - Redis数据目录（Docker部署）
- `ssl/` - SSL证书目录（可选）

## 安装模式

CDN系统支持三种安装模式：

### 1. 完整安装 (管理端 + 用户端 + 节点端)
- 适用于：完整的CDN系统部署
- 包含：主控端、管理端、用户端、节点端
- 需要：MySQL、Redis、Nginx
- 端口：3000, 3001, 8001, 8002

### 2. 仅安装管理端和用户端
- 适用于：CDN服务提供商
- 包含：主控端、管理端、用户端
- 需要：MySQL、Redis、Nginx
- 端口：3000, 3001, 8001

### 3. 仅安装节点端 (对接主控端)
- 适用于：CDN节点部署
- 包含：节点端
- 需要：Node.js、PM2
- 端口：8002
- 功能：自动连接到主控端

## 快速开始

### 传统部署
```bash
sudo bash install.sh
```

### Docker部署
```bash
sudo bash docker-deploy.sh
```

## 部署前准备

### 系统要求
- Debian 11+ / Ubuntu 20.04+
- 4GB+ 内存
- 50GB+ 可用磁盘空间
- 100Mbps+ 网络带宽

### 端口要求
- 80 (HTTP) - 仅管理端和用户端安装
- 443 (HTTPS) - 仅管理端和用户端安装
- 3000 (管理端) - 仅管理端和用户端安装
- 3001 (用户端) - 仅管理端和用户端安装
- 8001 (主控端API) - 仅管理端和用户端安装
- 8002 (节点端API) - 仅节点端安装
- 3306 (MySQL) - 仅管理端和用户端安装
- 6379 (Redis) - 仅管理端和用户端安装

## 部署方式对比

| 特性 | 传统部署 | Docker部署 |
|------|----------|------------|
| 安装复杂度 | 中等 | 简单 |
| 资源占用 | 较低 | 较高 |
| 隔离性 | 无 | 完全隔离 |
| 可移植性 | 差 | 优秀 |
| 维护难度 | 中等 | 简单 |
| 推荐场景 | 生产环境 | 开发/测试 |

## 配置说明

### 环境变量
部署脚本会创建以下环境变量：

```bash
# 基础配置
NODE_ENV=production
INSTALL_MODE=full|admin_user|node_only
CDN_DOMAIN=your-domain.com

# 数据库配置（仅管理端和用户端）
DB_HOST=localhost
DB_USER=cdn_user
DB_PASS=your_password
DB_NAME=cdn_master

# Redis配置（仅管理端和用户端）
REDIS_HOST=localhost
REDIS_PORT=6379
REDIS_PASS=your_redis_password

# 服务端口
MASTER_PORT=8001
NODE_PORT=8002
ADMIN_PORT=3000
USER_PORT=3001

# Cloudflare配置（可选）
CLOUDFLARE_API_TOKEN=your_token
CLOUDFLARE_ZONE_ID=your_zone_id

# 节点端配置（仅节点端）
MASTER_API_URL=http://master.example.com
NODE_ID=your_node_id
NODE_SECRET=your_node_secret
```

### 数据库结构
系统使用4个独立的数据库：
- `cdn_master` - 主控端数据
- `cdn_admin` - 管理端数据  
- `cdn_user` - 用户端数据
- `cdn_node` - 节点端数据

## 服务管理

### 传统部署
```bash
# 查看服务状态
pm2 status

# 重启服务
pm2 restart all

# 查看日志
pm2 logs

# 停止服务
pm2 stop all
```

### Docker部署
```bash
# 查看服务状态
docker-compose ps

# 启动服务
docker-compose up -d

# 停止服务
docker-compose down

# 查看日志
docker-compose logs -f

# 重启服务
docker-compose restart
```

## 节点端对接

### 节点端部署流程
1. 选择"仅安装节点端"模式
2. 配置主控端API地址
3. 设置节点ID和密钥
4. 部署完成后获取节点信息
5. 将节点信息提供给主控端管理员
6. 主控端管理员在管理端添加节点

### 节点信息格式
```
节点IP: 1.2.3.4
节点端口: 8002
节点ID: node_asia_01
节点密钥: your_secure_secret_key_here
```

## 故障排除

### 常见问题

1. **端口被占用**
   ```bash
   sudo lsof -i :3000
   sudo kill -9 <PID>
   ```

2. **数据库连接失败**
   ```bash
   sudo systemctl status mysql
   mysql -ucdn_user -p -h localhost
   ```

3. **Redis连接失败**
   ```bash
   sudo systemctl status redis-server
   redis-cli ping
   ```

4. **服务启动失败**
   ```bash
   pm2 logs
   sudo journalctl -u nginx
   ```

5. **节点端连接失败**
   ```bash
   # 检查网络连接
   ping master.example.com
   
   # 检查端口连通性
   telnet master.example.com 8001
   
   # 检查节点配置
   cat /etc/cdn-system.env | grep MASTER_API_URL
   ```

### 日志位置

#### 传统部署
- PM2日志: `~/.pm2/logs/`
- Nginx日志: `/var/log/nginx/` (仅管理端和用户端)
- MySQL日志: `/var/log/mysql/` (仅管理端和用户端)
- Redis日志: `/var/log/redis/` (仅管理端和用户端)

#### Docker部署
- 所有日志: `docker-compose logs -f`
- 特定服务: `docker-compose logs -f <service_name>`

## 安全建议

1. **修改默认密码**
   - 部署完成后立即修改管理员密码
   - 定期更换数据库密码

2. **配置防火墙**
   ```bash
   sudo ufw default deny incoming
   sudo ufw allow ssh
   sudo ufw allow 80/tcp
   sudo ufw allow 443/tcp
   sudo ufw allow 8002/tcp  # 仅节点端
   sudo ufw enable
   ```

3. **SSL证书**
   ```bash
   sudo apt install certbot python3-certbot-nginx
   sudo certbot --nginx -d your-domain.com
   ```

4. **定期备份**
   ```bash
   # 创建备份脚本
   sudo nano /usr/local/bin/backup-cdn.sh
   # 添加到定时任务
   sudo crontab -e
   ```

## 更新升级

### 传统部署
```bash
# 备份数据
mysqldump -ucdn_user -p --all-databases > backup.sql

# 更新代码
git pull origin main

# 重新安装依赖
for dir in master node admin user; do
    cd $dir && npm install && npm run build && cd ..
done

# 重启服务
pm2 restart all
```

### Docker部署
```bash
# 备份数据
docker-compose exec mysql mysqldump -uroot -p --all-databases > backup.sql

# 更新代码
git pull origin main

# 重新构建并启动
docker-compose down
docker-compose up -d --build
```

## 性能优化

### Nginx优化
```nginx
worker_processes auto;
worker_connections 1024;
keepalive_timeout 65;
gzip on;
gzip_types text/plain text/css application/json application/javascript;
```

### MySQL优化
```sql
innodb_buffer_pool_size = 1G
innodb_log_file_size = 256M
max_connections = 200
```

### Redis优化
```bash
maxmemory 512mb
maxmemory-policy allkeys-lru
```

### 节点端优化
```bash
# 增加文件描述符限制
echo "* soft nofile 65536" >> /etc/security/limits.conf
echo "* hard nofile 65536" >> /etc/security/limits.conf

# 优化内核参数
echo "net.core.somaxconn = 65535" >> /etc/sysctl.conf
echo "net.ipv4.tcp_max_syn_backlog = 65535" >> /etc/sysctl.conf
sysctl -p
```

## 监控告警

### 系统监控
```bash
# 安装监控工具
sudo apt install htop iotop nethogs

# 查看系统资源
htop
iotop
nethogs
```

### 日志监控
```bash
# 实时监控日志
tail -f /var/log/nginx/access.log
tail -f /var/log/nginx/error.log
pm2 logs --lines 100
```

### 节点端监控
```bash
# 健康检查
curl http://localhost:8002/health

# 状态信息
curl http://localhost:8002/status

# 统计信息
curl http://localhost:8002/stats
```

## 相关文档

- [完整部署指南](../docs/deployment.md)
- [节点端部署指南](../docs/node-deployment-guide.md)
- [用户指南](../docs/user-guide.md)
- [管理端指南](../docs/admin-guide.md)
- [API文档](../docs/api.md)

## 技术支持

如遇到问题，请：

1. 查看相关日志文件
2. 检查服务状态
3. 参考故障排除部分
4. 提交Issue到GitHub仓库
5. 联系技术支持团队

### 联系方式
- **GitHub**: https://github.com/your-repo/cdn-system
- **邮箱**: support@cdn-system.com
- **文档**: https://docs.cdn-system.com

## 许可证

本项目采用 MIT 许可证，详见 LICENSE 文件。 