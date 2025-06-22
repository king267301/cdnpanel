# CDN节点端部署指南

## 概述

CDN节点端是CDN系统的核心组件，负责缓存和分发内容。本指南将详细介绍如何部署节点端并连接到主控端。

## 部署方式

### 方式一：一键部署（推荐）

#### 1. 下载项目
```bash
git clone https://github.com/your-repo/cdn-system.git
cd cdn-system
```

#### 2. 执行节点端部署脚本
```bash
cd deploy
sudo bash install.sh
```

#### 3. 选择安装模式
在安装过程中选择 "3. 仅安装节点端 (对接主控端)"

#### 4. 配置节点端信息
按提示输入以下信息：
- **主控端API地址**: 主控端的API地址（例如：http://master.example.com）
- **节点ID**: 由主控端管理员提供的唯一节点标识
- **节点密钥**: 由主控端管理员提供的安全密钥

### 方式二：Docker部署

#### 1. 安装Docker
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

#### 3. 选择安装模式
选择 "3. 仅安装节点端 (对接主控端)"

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

# 安装PM2
sudo npm install -g pm2 typescript tsx
```

#### 2. 安装项目依赖
```bash
cd /path/to/cdn-system

# 安装shared模块依赖
cd shared && npm install && cd ..

# 安装节点端依赖
cd node && npm install && cd ..
```

#### 3. 构建节点端
```bash
cd node
npm run build
cd ..
```

#### 4. 配置环境变量
```bash
sudo nano /etc/cdn-system.env
```

```bash
# CDN节点端环境变量
NODE_ENV=production
INSTALL_MODE=node_only

# Redis配置（如果使用外部Redis）
REDIS_HOST=localhost
REDIS_PORT=6379
REDIS_PASS=your_redis_password

# 节点端配置
NODE_PORT=8002
MASTER_API_URL=http://master.example.com
NODE_ID=your_node_id
NODE_SECRET=your_node_secret
```

#### 5. 启动节点端
```bash
cd node
pm2 start dist/index.js --name cdn-node --env production
cd ..

# 保存PM2配置
pm2 save
pm2 startup
```

## 节点端配置

### 环境变量说明

| 变量名 | 说明 | 默认值 | 必填 |
|--------|------|--------|------|
| `NODE_ENV` | 运行环境 | production | 是 |
| `NODE_PORT` | 节点端端口 | 8002 | 是 |
| `MASTER_API_URL` | 主控端API地址 | - | 是 |
| `NODE_ID` | 节点唯一标识 | - | 是 |
| `NODE_SECRET` | 节点安全密钥 | - | 是 |
| `REDIS_HOST` | Redis主机地址 | localhost | 否 |
| `REDIS_PORT` | Redis端口 | 6379 | 否 |
| `REDIS_PASS` | Redis密码 | - | 否 |

### 配置文件示例

```bash
# /etc/cdn-system.env
NODE_ENV=production
INSTALL_MODE=node_only

# 节点端配置
NODE_PORT=8002
MASTER_API_URL=http://master.example.com:8001
NODE_ID=node_asia_01
NODE_SECRET=your_secure_secret_key_here

# Redis配置（可选）
REDIS_HOST=localhost
REDIS_PORT=6379
REDIS_PASS=your_redis_password
```

## 主控端对接

### 1. 获取节点信息

部署完成后，脚本会显示以下信息：

```
节点端对接说明:
1. 请将以下信息提供给主控端管理员：
   - 节点IP: 1.2.3.4
   - 节点端口: 8002
   - 节点ID: node_asia_01
   - 节点密钥: your_secure_secret_key_here
2. 主控端管理员需要在管理端添加此节点
3. 节点会自动连接到主控端
```

### 2. 主控端添加节点

主控端管理员需要在管理端执行以下操作：

1. 登录管理端
2. 进入节点管理页面
3. 点击"添加节点"
4. 填写节点信息：
   - **节点名称**: 节点显示名称
   - **节点IP**: 节点服务器IP地址
   - **节点端口**: 8002
   - **节点ID**: 与节点端配置一致
   - **节点密钥**: 与节点端配置一致
   - **节点位置**: 节点地理位置
   - **带宽限制**: 节点带宽限制（可选）

### 3. 验证连接

添加节点后，检查连接状态：

```bash
# 查看节点端日志
pm2 logs cdn-node

# 查看节点端状态
pm2 status cdn-node

# 测试节点端API
curl http://localhost:8002/health
```

## 服务管理

### PM2管理（传统部署）

```bash
# 查看服务状态
pm2 status

# 重启节点端
pm2 restart cdn-node

# 停止节点端
pm2 stop cdn-node

# 查看日志
pm2 logs cdn-node

# 查看详细信息
pm2 show cdn-node
```

### Docker管理（Docker部署）

```bash
# 查看服务状态
docker-compose ps

# 启动节点端
docker-compose up -d node

# 停止节点端
docker-compose stop node

# 重启节点端
docker-compose restart node

# 查看日志
docker-compose logs -f node

# 进入容器
docker-compose exec node sh
```

## 监控和日志

### 日志位置

#### 传统部署
- PM2日志: `~/.pm2/logs/cdn-node-out.log`
- PM2错误日志: `~/.pm2/logs/cdn-node-error.log`

#### Docker部署
- 容器日志: `docker-compose logs -f node`

### 监控指标

节点端提供以下监控端点：

```bash
# 健康检查
curl http://localhost:8002/health

# 状态信息
curl http://localhost:8002/status

# 统计信息
curl http://localhost:8002/stats
```

### 日志分析

```bash
# 实时查看日志
pm2 logs cdn-node --lines 100

# 查看错误日志
pm2 logs cdn-node --err --lines 50

# 搜索特定内容
pm2 logs cdn-node | grep "ERROR"
```

## 故障排除

### 常见问题

#### 1. 节点无法连接到主控端

**症状**: 日志显示连接失败或超时

**解决方案**:
```bash
# 检查网络连接
ping master.example.com

# 检查端口连通性
telnet master.example.com 8001

# 检查防火墙
sudo ufw status

# 检查主控端API地址配置
cat /etc/cdn-system.env | grep MASTER_API_URL
```

#### 2. 节点ID或密钥错误

**症状**: 主控端显示认证失败

**解决方案**:
```bash
# 检查节点配置
cat /etc/cdn-system.env | grep -E "NODE_ID|NODE_SECRET"

# 重新配置节点信息
sudo nano /etc/cdn-system.env

# 重启节点端
pm2 restart cdn-node
```

#### 3. 端口被占用

**症状**: 节点端启动失败，显示端口被占用

**解决方案**:
```bash
# 查看端口占用
sudo lsof -i :8002

# 杀死占用进程
sudo kill -9 <PID>

# 或者修改端口配置
sudo nano /etc/cdn-system.env
# 修改 NODE_PORT=8003
```

#### 4. Redis连接失败

**症状**: 日志显示Redis连接错误

**解决方案**:
```bash
# 检查Redis服务状态
sudo systemctl status redis-server

# 测试Redis连接
redis-cli ping

# 检查Redis配置
sudo nano /etc/redis/redis.conf
```

### 性能优化

#### 1. 系统优化

```bash
# 增加文件描述符限制
echo "* soft nofile 65536" >> /etc/security/limits.conf
echo "* hard nofile 65536" >> /etc/security/limits.conf

# 优化内核参数
echo "net.core.somaxconn = 65535" >> /etc/sysctl.conf
echo "net.ipv4.tcp_max_syn_backlog = 65535" >> /etc/sysctl.conf
sysctl -p
```

#### 2. Node.js优化

```bash
# 增加Node.js内存限制
pm2 start dist/index.js --name cdn-node --max-memory-restart 1G

# 使用集群模式
pm2 start dist/index.js --name cdn-node -i max
```

#### 3. 缓存优化

```bash
# 配置Redis内存
sudo nano /etc/redis/redis.conf
# 添加：
# maxmemory 1gb
# maxmemory-policy allkeys-lru
```

## 安全配置

### 1. 防火墙配置

```bash
# 安装ufw
sudo apt install ufw

# 配置防火墙规则
sudo ufw default deny incoming
sudo ufw default allow outgoing
sudo ufw allow ssh
sudo ufw allow 8002/tcp
sudo ufw enable
```

### 2. 节点密钥安全

```bash
# 生成强密钥
openssl rand -hex 32

# 定期更换密钥
# 1. 生成新密钥
# 2. 更新节点端配置
# 3. 更新主控端配置
# 4. 重启节点端
```

### 3. 访问控制

```bash
# 限制API访问
# 在节点端配置中添加IP白名单
ALLOWED_IPS=192.168.1.0/24,10.0.0.0/8
```

## 备份和恢复

### 1. 配置文件备份

```bash
# 备份配置文件
sudo cp /etc/cdn-system.env /backup/cdn-system.env.$(date +%Y%m%d)

# 备份PM2配置
pm2 save
sudo cp ~/.pm2/dump.pm2 /backup/pm2-dump.$(date +%Y%m%d).pm2
```

### 2. 数据备份

```bash
# 备份缓存数据（如果有本地存储）
sudo tar -czf /backup/cache-data.$(date +%Y%m%d).tar.gz /var/cache/cdn-node

# 备份日志
sudo tar -czf /backup/logs.$(date +%Y%m%d).tar.gz ~/.pm2/logs/
```

### 3. 恢复配置

```bash
# 恢复配置文件
sudo cp /backup/cdn-system.env.20231201 /etc/cdn-system.env

# 恢复PM2配置
sudo cp /backup/pm2-dump.20231201.pm2 ~/.pm2/dump.pm2
pm2 resurrect
```

## 更新升级

### 1. 备份当前配置

```bash
# 备份配置文件
sudo cp /etc/cdn-system.env /backup/cdn-system.env.backup

# 备份PM2配置
pm2 save
sudo cp ~/.pm2/dump.pm2 /backup/pm2-dump.backup.pm2
```

### 2. 更新代码

```bash
# 拉取最新代码
git pull origin main

# 重新安装依赖
cd node && npm install && cd ..

# 重新构建
cd node && npm run build && cd ..
```

### 3. 重启服务

```bash
# 重启节点端
pm2 restart cdn-node

# 检查服务状态
pm2 status
pm2 logs cdn-node
```

## 技术支持

如遇到问题，请：

1. 查看节点端日志
2. 检查网络连接
3. 验证配置信息
4. 参考故障排除部分
5. 联系技术支持团队

### 联系方式
- **GitHub**: https://github.com/your-repo/cdn-system
- **邮箱**: support@cdn-system.com
- **文档**: https://docs.cdn-system.com 