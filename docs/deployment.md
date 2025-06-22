# CDN系统部署指南

## 系统要求

### 硬件要求
- **CPU**: 2核心以上
- **内存**: 4GB以上
- **存储**: 50GB以上可用空间
- **网络**: 100Mbps以上带宽

### 软件要求
- **操作系统**: Debian 11+ / Ubuntu 20.04+
- **Node.js**: 18.x+
- **MySQL**: 8.0+
- **Redis**: 6.0+
- **Nginx**: 1.18+
- **Docker**: 20.10+ (可选)

## 部署方式

### 方式一：一键部署（推荐）

#### 1. 下载项目
```bash
git clone https://github.com/your-repo/cdn-system.git
cd cdn-system
```

#### 2. 执行一键部署脚本
```bash
cd deploy
sudo bash install.sh
```

#### 3. 按提示输入配置信息
- 管理员账号和密码
- 数据库密码
- Redis密码
- 其他配置选项

#### 4. 等待部署完成
脚本会自动完成以下操作：
- 安装系统依赖
- 配置MySQL和Redis
- 安装项目依赖
- 构建项目
- 启动所有服务
- 配置Nginx反向代理

### 方式二：Docker部署

#### 1. 安装Docker和Docker Compose
```bash
# 安装Docker
curl -fsSL https://get.docker.com | sh
sudo usermod -aG docker $USER

# 安装Docker Compose
sudo curl -L "https://github.com/docker/compose/releases/latest/download/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
sudo chmod +x /usr/local/bin/docker-compose
```

#### 2. 执行Docker部署脚本
```bash
cd deploy
sudo bash docker-deploy.sh
```

#### 3. 按提示输入配置信息
- 管理员密码
- 数据库密码
- Redis密码
- Cloudflare配置（可选）

### 方式三：手动部署

#### 1. 安装系统依赖
```bash
# 更新系统
sudo apt update && sudo apt upgrade -y

# 安装基础软件包
sudo apt install -y curl wget git unzip software-properties-common

# 安装Node.js 18.x
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt install -y nodejs

# 安装MySQL 8.0
sudo apt install -y mysql-server

# 安装Redis
sudo apt install -y redis-server

# 安装Nginx
sudo apt install -y nginx

# 安装PM2
sudo npm install -g pm2 typescript tsx
```

#### 2. 配置MySQL
```bash
# 启动MySQL服务
sudo systemctl start mysql
sudo systemctl enable mysql

# 安全配置MySQL
sudo mysql_secure_installation

# 创建数据库和用户
sudo mysql -uroot -p
```

```sql
CREATE DATABASE cdn_master DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
CREATE DATABASE cdn_admin DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
CREATE DATABASE cdn_user DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
CREATE DATABASE cdn_node DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

CREATE USER 'cdn_user'@'localhost' IDENTIFIED BY 'your_password';
GRANT ALL PRIVILEGES ON cdn_master.* TO 'cdn_user'@'localhost';
GRANT ALL PRIVILEGES ON cdn_admin.* TO 'cdn_user'@'localhost';
GRANT ALL PRIVILEGES ON cdn_user.* TO 'cdn_user'@'localhost';
GRANT ALL PRIVILEGES ON cdn_node.* TO 'cdn_user'@'localhost';
FLUSH PRIVILEGES;
EXIT;
```

#### 3. 配置Redis
```bash
# 配置Redis密码（可选）
sudo nano /etc/redis/redis.conf
# 找到 # requirepass foobared 行，取消注释并设置密码

# 启动Redis服务
sudo systemctl start redis-server
sudo systemctl enable redis-server
```

#### 4. 安装项目依赖
```bash
cd /path/to/cdn-system

# 安装shared模块依赖
cd shared && npm install && cd ..

# 安装各端依赖
for dir in master node admin user; do
    cd $dir && npm install && cd ..
done
```

#### 5. 构建项目
```bash
# 构建各端
for dir in master node admin user; do
    cd $dir
    if [[ -f "package.json" ]] && grep -q '"build"' package.json; then
        npm run build
    fi
    cd ..
done
```

#### 6. 配置环境变量
```bash
sudo nano /etc/cdn-system.env
```

```bash
# CDN系统环境变量
NODE_ENV=production

# 数据库配置
DB_HOST=localhost
DB_USER=cdn_user
DB_PASS=your_password
DB_NAME=cdn_master

# Redis配置
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

# 主域名配置
CDN_DOMAIN=your-domain.com
```

#### 7. 启动服务
```bash
# 启动主控端
cd master
pm2 start dist/index.js --name cdn-master --env production
cd ..

# 启动节点端
cd node
pm2 start dist/index.js --name cdn-node --env production
cd ..

# 启动管理端
cd admin
pm2 start server/index.js --name cdn-admin --env production
cd ..

# 启动用户端
cd user
pm2 start server/index.js --name cdn-user --env production
cd ..

# 保存PM2配置
pm2 save
pm2 startup
```

#### 8. 配置Nginx
```bash
# 备份原配置
sudo cp /etc/nginx/nginx.conf /etc/nginx/nginx.conf.backup

# 创建CDN系统配置
sudo nano /etc/nginx/sites-available/cdn-system
```

```nginx
server {
    listen 80;
    server_name _;
    
    # 管理端
    location /admin/ {
        proxy_pass http://localhost:3000/;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
    
    # 用户端
    location /user/ {
        proxy_pass http://localhost:3001/;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
    
    # 主控端API
    location /api/master/ {
        proxy_pass http://localhost:8001/;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
    
    # 节点API
    location /api/node/ {
        proxy_pass http://localhost:8002/;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
    
    # 默认重定向到管理端
    location / {
        return 301 /admin/;
    }
}
```

```bash
# 启用站点
sudo ln -sf /etc/nginx/sites-available/cdn-system /etc/nginx/sites-enabled/
sudo rm -f /etc/nginx/sites-enabled/default

# 测试配置
sudo nginx -t

# 重启Nginx
sudo systemctl restart nginx
sudo systemctl enable nginx
```

## 验证部署

### 1. 检查服务状态
```bash
# 检查PM2服务状态
pm2 status

# 检查系统服务状态
sudo systemctl status mysql redis-server nginx
```

### 2. 访问系统
- **管理端**: http://your-server-ip/admin/
- **用户端**: http://your-server-ip/user/
- **API文档**: http://your-server-ip/api/master/docs

### 3. 默认登录信息
- **管理员账号**: admin
- **管理员密码**: 部署时设置的密码

## 配置说明

### 端口配置
- **管理端**: 3000
- **用户端**: 3001
- **主控端API**: 8001
- **节点端API**: 8002
- **MySQL**: 3306
- **Redis**: 6379
- **Nginx**: 80/443

### 数据库配置
系统使用4个独立的数据库：
- `cdn_master`: 主控端数据
- `cdn_admin`: 管理端数据
- `cdn_user`: 用户端数据
- `cdn_node`: 节点端数据

### 环境变量
主要环境变量说明：
- `NODE_ENV`: 运行环境（production/development）
- `DB_HOST`: 数据库主机地址
- `DB_USER`: 数据库用户名
- `DB_PASS`: 数据库密码
- `REDIS_HOST`: Redis主机地址
- `REDIS_PASS`: Redis密码
- `CLOUDFLARE_API_TOKEN`: Cloudflare API Token
- `CLOUDFLARE_ZONE_ID`: Cloudflare Zone ID

## 常用命令

### 服务管理
```bash
# 查看所有服务状态
pm2 status

# 重启所有服务
pm2 restart all

# 停止所有服务
pm2 stop all

# 查看服务日志
pm2 logs

# 查看特定服务日志
pm2 logs cdn-master
pm2 logs cdn-admin
pm2 logs cdn-user
pm2 logs cdn-node
```

### Docker管理（Docker部署方式）
```bash
# 查看服务状态
docker-compose ps

# 启动服务
docker-compose up -d

# 停止服务
docker-compose down

# 重启服务
docker-compose restart

# 查看日志
docker-compose logs -f

# 查看特定服务日志
docker-compose logs -f admin
docker-compose logs -f user
```

### 系统管理
```bash
# 查看Nginx日志
sudo tail -f /var/log/nginx/access.log
sudo tail -f /var/log/nginx/error.log

# 查看MySQL日志
sudo tail -f /var/log/mysql/error.log

# 查看Redis日志
sudo tail -f /var/log/redis/redis-server.log

# 检查端口占用
sudo netstat -tlnp | grep :80
sudo netstat -tlnp | grep :3000
sudo netstat -tlnp | grep :8001
```

## 故障排除

### 常见问题

#### 1. 端口被占用
```bash
# 查看端口占用
sudo lsof -i :3000
sudo lsof -i :8001

# 杀死占用进程
sudo kill -9 <PID>
```

#### 2. 数据库连接失败
```bash
# 检查MySQL服务状态
sudo systemctl status mysql

# 检查MySQL连接
mysql -ucdn_user -p -h localhost

# 检查防火墙
sudo ufw status
```

#### 3. Redis连接失败
```bash
# 检查Redis服务状态
sudo systemctl status redis-server

# 测试Redis连接
redis-cli ping

# 检查Redis配置
sudo nano /etc/redis/redis.conf
```

#### 4. 前端无法访问API
```bash
# 检查Nginx配置
sudo nginx -t

# 检查Nginx服务状态
sudo systemctl status nginx

# 检查CORS配置
# 在Nginx配置中添加CORS头
```

#### 5. 服务启动失败
```bash
# 查看PM2日志
pm2 logs

# 查看系统日志
sudo journalctl -u nginx
sudo journalctl -u mysql
sudo journalctl -u redis-server

# 检查磁盘空间
df -h

# 检查内存使用
free -h
```

### 性能优化

#### 1. Nginx优化
```nginx
# 在nginx.conf中添加
worker_processes auto;
worker_connections 1024;
keepalive_timeout 65;
gzip on;
gzip_types text/plain text/css application/json application/javascript;
```

#### 2. MySQL优化
```sql
-- 在MySQL配置文件中添加
innodb_buffer_pool_size = 1G
innodb_log_file_size = 256M
max_connections = 200
```

#### 3. Redis优化
```bash
# 在redis.conf中添加
maxmemory 512mb
maxmemory-policy allkeys-lru
```

## 安全建议

### 1. 防火墙配置
```bash
# 安装ufw
sudo apt install ufw

# 配置防火墙规则
sudo ufw default deny incoming
sudo ufw default allow outgoing
sudo ufw allow ssh
sudo ufw allow 80/tcp
sudo ufw allow 443/tcp
sudo ufw enable
```

### 2. SSL证书配置
```bash
# 安装Certbot
sudo apt install certbot python3-certbot-nginx

# 获取SSL证书
sudo certbot --nginx -d your-domain.com

# 自动续期
sudo crontab -e
# 添加：0 12 * * * /usr/bin/certbot renew --quiet
```

### 3. 定期备份
```bash
# 创建备份脚本
sudo nano /usr/local/bin/backup-cdn.sh
```

```bash
#!/bin/bash
BACKUP_DIR="/backup/cdn"
DATE=$(date +%Y%m%d_%H%M%S)

# 备份数据库
mysqldump -ucdn_user -p --all-databases > $BACKUP_DIR/db_$DATE.sql

# 备份配置文件
tar -czf $BACKUP_DIR/config_$DATE.tar.gz /etc/cdn-system.env /etc/nginx/sites-available/cdn-system

# 删除7天前的备份
find $BACKUP_DIR -name "*.sql" -mtime +7 -delete
find $BACKUP_DIR -name "*.tar.gz" -mtime +7 -delete
```

```bash
# 设置执行权限
sudo chmod +x /usr/local/bin/backup-cdn.sh

# 添加到定时任务
sudo crontab -e
# 添加：0 2 * * * /usr/local/bin/backup-cdn.sh
```

## 更新升级

### 1. 备份数据
```bash
# 备份数据库
mysqldump -ucdn_user -p --all-databases > backup_$(date +%Y%m%d).sql

# 备份配置文件
tar -czf config_backup_$(date +%Y%m%d).tar.gz /etc/cdn-system.env
```

### 2. 更新代码
```bash
# 拉取最新代码
git pull origin main

# 重新安装依赖
for dir in master node admin user; do
    cd $dir && npm install && cd ..
done

# 重新构建
for dir in master node admin user; do
    cd $dir
    if [[ -f "package.json" ]] && grep -q '"build"' package.json; then
        npm run build
    fi
    cd ..
done
```

### 3. 重启服务
```bash
# 重启所有服务
pm2 restart all

# 检查服务状态
pm2 status
```

## 技术支持

如遇到问题，请：

1. 查看日志文件
2. 检查服务状态
3. 查看常见问题解决方案
4. 提交Issue到GitHub仓库
5. 联系技术支持团队

### 联系方式
- **GitHub**: https://github.com/your-repo/cdn-system
- **邮箱**: support@cdn-system.com
- **文档**: https://docs.cdn-system.com 