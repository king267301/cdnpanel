#!/bin/bash
# CDN系统Docker部署脚本
# 版本: 2.1

set -e

# 颜色定义
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# 日志函数
log_info() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

log_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

log_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

log_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# 安装模式
INSTALL_MODE=""

# 选择安装模式
select_install_mode() {
    echo
    echo "=========================================="
    echo "        选择Docker安装模式"
    echo "=========================================="
    echo "1. 完整安装 (管理端 + 用户端 + 节点端)"
    echo "2. 仅安装管理端和用户端"
    echo "3. 仅安装节点端 (对接主控端)"
    echo "4. 退出安装"
    echo "=========================================="
    
    while true; do
        read -p "请选择安装模式 (1-4): " choice
        case $choice in
            1)
                INSTALL_MODE="full"
                log_info "选择完整安装模式"
                break
                ;;
            2)
                INSTALL_MODE="admin_user"
                log_info "选择仅安装管理端和用户端"
                break
                ;;
            3)
                INSTALL_MODE="node_only"
                log_info "选择仅安装节点端"
                break
                ;;
            4)
                log_info "退出安装"
                exit 0
                ;;
            *)
                log_error "无效选择，请输入 1-4"
                ;;
        esac
    done
}

# 检查Docker
check_docker() {
    log_info "检查Docker环境..."
    
    if ! command -v docker &> /dev/null; then
        log_error "Docker未安装，请先安装Docker"
        exit 1
    fi
    
    if ! command -v docker-compose &> /dev/null; then
        log_error "Docker Compose未安装，请先安装Docker Compose"
        exit 1
    fi
    
    # 检查Docker服务状态
    if ! docker info &> /dev/null; then
        log_error "Docker服务未启动，请启动Docker服务"
        exit 1
    fi
    
    log_success "Docker环境检查通过"
}

# 创建环境变量文件
create_env_file() {
    log_info "创建环境变量文件..."
    
    cat > .env <<EOF
# CDN系统环境变量
NODE_ENV=production
INSTALL_MODE=$INSTALL_MODE

# MySQL配置
MYSQL_ROOT_PASSWORD=${MYSQL_ROOT_PASSWORD:-cdn123456}
MYSQL_PASSWORD=${MYSQL_PASSWORD:-cdn123456}

# Redis配置
REDIS_PASSWORD=${REDIS_PASSWORD:-cdn123456}

# Cloudflare配置（可选）
CLOUDFLARE_API_TOKEN=${CLOUDFLARE_API_TOKEN:-}
CLOUDFLARE_ZONE_ID=${CLOUDFLARE_ZONE_ID:-}

# 主域名配置
CDN_DOMAIN=${CDN_DOMAIN:-cdn-system.com}

# 节点端配置
MASTER_API_URL=${MASTER_API_URL:-}
NODE_ID=${NODE_ID:-}
NODE_SECRET=${NODE_SECRET:-}
EOF
    
    log_success "环境变量文件创建完成"
}

# 创建Dockerfile
create_dockerfiles() {
    log_info "创建Dockerfile..."
    
    # 主控端Dockerfile
    cat > ../master/Dockerfile <<EOF
FROM node:18-alpine

WORKDIR /app

# 复制package文件
COPY package*.json ./

# 安装依赖
RUN npm ci --only=production

# 复制源代码
COPY . .

# 构建应用
RUN npm run build

# 暴露端口
EXPOSE 8001

# 启动应用
CMD ["node", "dist/index.js"]
EOF

    # 节点端Dockerfile
    cat > ../node/Dockerfile <<EOF
FROM node:18-alpine

WORKDIR /app

# 复制package文件
COPY package*.json ./

# 安装依赖
RUN npm ci --only=production

# 复制源代码
COPY . .

# 构建应用
RUN npm run build

# 暴露端口
EXPOSE 8002

# 启动应用
CMD ["node", "dist/index.js"]
EOF

    # 管理端Dockerfile
    cat > ../admin/Dockerfile <<EOF
FROM node:18-alpine

WORKDIR /app

# 复制package文件
COPY package*.json ./

# 安装依赖
RUN npm ci

# 复制源代码
COPY . .

# 构建前端
RUN npm run build

# 暴露端口
EXPOSE 3000

# 启动应用
CMD ["npm", "run", "serve"]
EOF

    # 用户端Dockerfile
    cat > ../user/Dockerfile <<EOF
FROM node:18-alpine

WORKDIR /app

# 复制package文件
COPY package*.json ./

# 安装依赖
RUN npm ci

# 复制源代码
COPY . .

# 构建前端
RUN npm run build

# 暴露端口
EXPOSE 3001

# 启动应用
CMD ["npm", "run", "serve"]
EOF
    
    log_success "Dockerfile创建完成"
}

# 创建数据库初始化脚本
create_init_sql() {
    log_info "创建数据库初始化脚本..."
    
    cat > init.sql <<EOF
-- CDN系统数据库初始化脚本

-- 创建主控端数据库表
USE cdn_master;

CREATE TABLE IF NOT EXISTS nodes (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    ip VARCHAR(45) NOT NULL,
    port INT DEFAULT 8002,
    status ENUM('online', 'offline', 'maintenance') DEFAULT 'offline',
    location VARCHAR(255),
    bandwidth_limit BIGINT DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS domains (
    id INT AUTO_INCREMENT PRIMARY KEY,
    domain VARCHAR(255) NOT NULL UNIQUE,
    user_id INT NOT NULL,
    status ENUM('pending', 'active', 'suspended') DEFAULT 'pending',
    ssl_enabled BOOLEAN DEFAULT FALSE,
    cache_enabled BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS packages (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    price DECIMAL(10,2) NOT NULL,
    bandwidth_limit BIGINT NOT NULL,
    domain_limit INT NOT NULL,
    duration_days INT NOT NULL,
    status ENUM('active', 'inactive') DEFAULT 'active',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 创建管理端数据库表
USE cdn_admin;

CREATE TABLE IF NOT EXISTS users (
    id INT AUTO_INCREMENT PRIMARY KEY,
    username VARCHAR(255) NOT NULL UNIQUE,
    password VARCHAR(255) NOT NULL,
    email VARCHAR(255) NOT NULL UNIQUE,
    role ENUM('admin', 'operator') DEFAULT 'operator',
    status ENUM('active', 'inactive') DEFAULT 'active',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS system_config (
    id INT AUTO_INCREMENT PRIMARY KEY,
    key_name VARCHAR(255) NOT NULL UNIQUE,
    value TEXT,
    description TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- 创建用户端数据库表
USE cdn_user;

CREATE TABLE IF NOT EXISTS users (
    id INT AUTO_INCREMENT PRIMARY KEY,
    username VARCHAR(255) NOT NULL UNIQUE,
    password VARCHAR(255) NOT NULL,
    email VARCHAR(255) NOT NULL UNIQUE,
    status ENUM('active', 'inactive', 'suspended') DEFAULT 'active',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS user_packages (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    package_id INT NOT NULL,
    start_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    end_date TIMESTAMP NOT NULL,
    status ENUM('active', 'expired', 'cancelled') DEFAULT 'active',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS user_domains (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    domain VARCHAR(255) NOT NULL,
    subdomain VARCHAR(255),
    status ENUM('pending', 'active', 'suspended') DEFAULT 'pending',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- 创建节点端数据库表
USE cdn_node;

CREATE TABLE IF NOT EXISTS cache_logs (
    id INT AUTO_INCREMENT PRIMARY KEY,
    domain VARCHAR(255) NOT NULL,
    path VARCHAR(1000) NOT NULL,
    hit_count INT DEFAULT 0,
    last_accessed TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 插入初始数据
USE cdn_admin;
INSERT INTO users (username, password, email, role) VALUES 
('admin', 'sha256:${ADMIN_PASS_HASH}', 'admin@cdn-system.com', 'admin')
ON DUPLICATE KEY UPDATE password = 'sha256:${ADMIN_PASS_HASH}';

USE cdn_master;
INSERT INTO packages (name, price, bandwidth_limit, domain_limit, duration_days) VALUES 
('基础版', 9.99, 107374182400, 5, 30),
('专业版', 29.99, 536870912000, 20, 30),
('企业版', 99.99, 2147483648000, 100, 30)
ON DUPLICATE KEY UPDATE name = VALUES(name);
EOF
    
    log_success "数据库初始化脚本创建完成"
}

# 创建Docker Compose配置
create_docker_compose() {
    log_info "创建Docker Compose配置..."
    
    cat > docker-compose.yml <<EOF
version: '3.8'

services:
EOF

    # 根据安装模式添加服务
    case $INSTALL_MODE in
        "full"|"admin_user")
            cat >> docker-compose.yml <<EOF
  # MySQL数据库
  mysql:
    image: mysql:8.0
    container_name: cdn-mysql
    environment:
      MYSQL_ROOT_PASSWORD: \${MYSQL_ROOT_PASSWORD:-cdn123456}
      MYSQL_DATABASE: cdn_master
      MYSQL_USER: cdn_user
      MYSQL_PASSWORD: \${MYSQL_PASSWORD:-cdn123456}
    ports:
      - "3306:3306"
    volumes:
      - ./mysql_data:/var/lib/mysql
      - ./init.sql:/docker-entrypoint-initdb.d/init.sql
    networks:
      - cdn-network
    restart: unless-stopped

  # Redis缓存
  redis:
    image: redis:7-alpine
    container_name: cdn-redis
    command: ["redis-server", "--requirepass", "\${REDIS_PASSWORD:-cdn123456}"]
    ports:
      - "6379:6379"
    volumes:
      - ./redis_data:/data
    networks:
      - cdn-network
    restart: unless-stopped

  # 主控端
  master:
    build:
      context: ../master
      dockerfile: Dockerfile
    container_name: cdn-master
    environment:
      NODE_ENV: production
      DB_HOST: mysql
      DB_USER: cdn_user
      DB_PASS: \${MYSQL_PASSWORD:-cdn123456}
      DB_NAME: cdn_master
      REDIS_HOST: redis
      REDIS_PORT: 6379
      REDIS_PASS: \${REDIS_PASSWORD:-cdn123456}
      MASTER_PORT: 8001
    ports:
      - "8001:8001"
    depends_on:
      - mysql
      - redis
    networks:
      - cdn-network
    restart: unless-stopped

EOF
            ;;
    esac

    case $INSTALL_MODE in
        "full"|"node_only")
            cat >> docker-compose.yml <<EOF
  # 节点端
  node:
    build:
      context: ../node
      dockerfile: Dockerfile
    container_name: cdn-node
    environment:
      NODE_ENV: production
      REDIS_HOST: \${REDIS_HOST:-redis}
      REDIS_PORT: 6379
      REDIS_PASS: \${REDIS_PASSWORD:-cdn123456}
      NODE_PORT: 8002
      MASTER_URL: \${MASTER_API_URL:-http://master:8001}
      NODE_ID: \${NODE_ID:-node_$(date +%s)}
      NODE_SECRET: \${NODE_SECRET:-$(openssl rand -hex 32)}
    ports:
      - "8002:8002"
    depends_on:
      - redis
EOF
            if [[ "$INSTALL_MODE" == "full" ]]; then
                cat >> docker-compose.yml <<EOF
      - master
EOF
            fi
            cat >> docker-compose.yml <<EOF
    networks:
      - cdn-network
    restart: unless-stopped

EOF
            ;;
    esac

    case $INSTALL_MODE in
        "full"|"admin_user")
            cat >> docker-compose.yml <<EOF
  # 管理端
  admin:
    build:
      context: ../admin
      dockerfile: Dockerfile
    container_name: cdn-admin
    environment:
      NODE_ENV: production
      DB_HOST: mysql
      DB_USER: cdn_user
      DB_PASS: \${MYSQL_PASSWORD:-cdn123456}
      DB_NAME: cdn_admin
      ADMIN_PORT: 3000
      MASTER_API_URL: http://master:8001
    ports:
      - "3000:3000"
    depends_on:
      - mysql
      - master
    networks:
      - cdn-network
    restart: unless-stopped

  # 用户端
  user:
    build:
      context: ../user
      dockerfile: Dockerfile
    container_name: cdn-user
    environment:
      NODE_ENV: production
      DB_HOST: mysql
      DB_USER: cdn_user
      DB_PASS: \${MYSQL_PASSWORD:-cdn123456}
      DB_NAME: cdn_user
      USER_PORT: 3001
      MASTER_API_URL: http://master:8001
      CLOUDFLARE_API_TOKEN: \${CLOUDFLARE_API_TOKEN:-}
      CLOUDFLARE_ZONE_ID: \${CLOUDFLARE_ZONE_ID:-}
    ports:
      - "3001:3001"
    depends_on:
      - mysql
      - master
    networks:
      - cdn-network
    restart: unless-stopped

  # Nginx反向代理
  nginx:
    image: nginx:1.25-alpine
    container_name: cdn-nginx
    ports:
      - "80:80"
      - "443:443"
    volumes:
      - ./nginx.conf:/etc/nginx/nginx.conf
      - ./ssl:/etc/nginx/ssl
    depends_on:
EOF
            case $INSTALL_MODE in
                "full")
                    cat >> docker-compose.yml <<EOF
      - admin
      - user
      - master
      - node
EOF
                    ;;
                "admin_user")
                    cat >> docker-compose.yml <<EOF
      - admin
      - user
      - master
EOF
                    ;;
            esac
            cat >> docker-compose.yml <<EOF
    networks:
      - cdn-network
    restart: unless-stopped

EOF
            ;;
    esac

    cat >> docker-compose.yml <<EOF
networks:
  cdn-network:
    driver: bridge

volumes:
  mysql_data:
  redis_data:
EOF
    
    log_success "Docker Compose配置创建完成"
}

# 节点端配置引导
setup_node_config() {
    if [[ "$INSTALL_MODE" != "node_only" ]]; then
        return
    fi
    
    log_info "配置节点端连接信息..."
    
    echo
    echo "=========================================="
    echo "        节点端配置"
    echo "=========================================="
    echo "请提供主控端连接信息："
    
    read -p "主控端API地址 (例如: http://master.example.com): " MASTER_API_URL
    MASTER_API_URL=${MASTER_API_URL:-http://localhost:8001}
    
    read -p "节点ID (由主控端管理员提供): " NODE_ID
    NODE_ID=${NODE_ID:-node_$(date +%s)}
    
    read -s -p "节点密钥 (由主控端管理员提供): " NODE_SECRET
    echo
    NODE_SECRET=${NODE_SECRET:-$(openssl rand -hex 32)}
    
    # 更新环境变量文件
    cat >> .env <<EOF

# 节点端配置
MASTER_API_URL=$MASTER_API_URL
NODE_ID=$NODE_ID
NODE_SECRET=$NODE_SECRET
EOF
    
    log_success "节点端配置完成"
}

# 部署服务
deploy_services() {
    log_info "部署CDN系统服务..."
    
    # 停止现有服务
    docker-compose down --remove-orphans
    
    # 构建并启动服务
    docker-compose up -d --build
    
    # 等待服务启动
    log_info "等待服务启动..."
    sleep 30
    
    # 检查服务状态
    docker-compose ps
    
    log_success "服务部署完成"
}

# 显示部署信息
show_deployment_info() {
    log_success "CDN系统Docker部署完成！"
    echo
    echo "=========================================="
    echo "           部署信息"
    echo "=========================================="
    
    case $INSTALL_MODE in
        "full")
            echo "安装模式: 完整安装"
            echo "管理端地址: http://$(curl -s ifconfig.me)/admin/"
            echo "用户端地址: http://$(curl -s ifconfig.me)/user/"
            echo "管理员账号: admin"
            echo "管理员密码: $ADMIN_PASS"
            ;;
        "admin_user")
            echo "安装模式: 管理端和用户端"
            echo "管理端地址: http://$(curl -s ifconfig.me)/admin/"
            echo "用户端地址: http://$(curl -s ifconfig.me)/user/"
            echo "管理员账号: admin"
            echo "管理员密码: $ADMIN_PASS"
            ;;
        "node_only")
            echo "安装模式: 仅节点端"
            echo "节点端API: http://$(curl -s ifconfig.me):8002"
            echo "主控端API: $MASTER_API_URL"
            echo "节点ID: $NODE_ID"
            echo "节点密钥: $NODE_SECRET"
            ;;
    esac
    
    echo "=========================================="
    echo
    echo "服务状态:"
    docker-compose ps
    echo
    echo "日志查看:"
    echo "  所有服务日志: docker-compose logs -f"
    
    case $INSTALL_MODE in
        "full"|"admin_user")
            echo "  管理端日志: docker-compose logs -f admin"
            echo "  用户端日志: docker-compose logs -f user"
            echo "  主控端日志: docker-compose logs -f master"
            ;;
    esac
    
    case $INSTALL_MODE in
        "full"|"node_only")
            echo "  节点端日志: docker-compose logs -f node"
            ;;
    esac
    
    echo
    echo "常用命令:"
    echo "  启动服务: docker-compose up -d"
    echo "  停止服务: docker-compose down"
    echo "  重启服务: docker-compose restart"
    echo "  查看状态: docker-compose ps"
    echo "  查看日志: docker-compose logs"
    
    if [[ "$INSTALL_MODE" == "node_only" ]]; then
        echo
        echo "节点端对接说明:"
        echo "1. 请将以下信息提供给主控端管理员："
        echo "   - 节点IP: $(curl -s ifconfig.me)"
        echo "   - 节点端口: 8002"
        echo "   - 节点ID: $NODE_ID"
        echo "   - 节点密钥: $NODE_SECRET"
        echo "2. 主控端管理员需要在管理端添加此节点"
        echo "3. 节点会自动连接到主控端"
    fi
    
    echo
    log_warning "请及时修改默认密码！"
}

# 主函数
main() {
    echo "=========================================="
    echo "      CDN系统Docker部署脚本"
    echo "=========================================="
    echo
    
    # 选择安装模式
    select_install_mode
    
    # 根据安装模式获取配置信息
    case $INSTALL_MODE in
        "full"|"admin_user")
            # 交互式输入
            echo "请输入部署配置信息："
            read -p "管理员密码: " ADMIN_PASS
            ADMIN_PASS=${ADMIN_PASS:-admin123}
            
            read -s -p "MySQL root密码 (默认: cdn123456): " MYSQL_ROOT_PASS
            echo
            MYSQL_ROOT_PASS=${MYSQL_ROOT_PASS:-cdn123456}
            
            read -s -p "MySQL用户密码 (默认: cdn123456): " MYSQL_PASS
            echo
            MYSQL_PASS=${MYSQL_PASS:-cdn123456}
            
            read -s -p "Redis密码 (默认: cdn123456): " REDIS_PASS
            echo
            REDIS_PASS=${REDIS_PASS:-cdn123456}
            
            read -p "Cloudflare API Token (可选): " CLOUDFLARE_API_TOKEN
            read -p "Cloudflare Zone ID (可选): " CLOUDFLARE_ZONE_ID
            
            # 生成密码哈希
            ADMIN_PASS_HASH=$(echo -n "$ADMIN_PASS" | openssl dgst -sha256 | cut -d' ' -f2)
            ;;
        "node_only")
            # 节点端配置
            setup_node_config
            ;;
    esac
    
    echo
    log_info "开始Docker部署CDN系统..."
    
    # 执行部署步骤
    check_docker
    create_env_file
    create_dockerfiles
    create_init_sql
    create_docker_compose
    deploy_services
    show_deployment_info
    
    log_success "Docker部署完成！"
}

# 执行主函数
main "$@" 