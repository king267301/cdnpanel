#!/bin/bash
# CDN系统一键部署脚本
# 支持Debian/Ubuntu系统
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

# 检查系统
check_system() {
    log_info "检查系统环境..."
    
    if [[ ! -f /etc/debian_version ]] && [[ ! -f /etc/lsb-release ]]; then
        log_error "此脚本仅支持Debian/Ubuntu系统"
        exit 1
    fi
    
    if [[ $EUID -ne 0 ]]; then
        log_error "请使用root权限运行此脚本"
        exit 1
    fi
    
    log_success "系统检查通过"
}

# 选择安装模式
select_install_mode() {
    echo
    echo "=========================================="
    echo "        选择安装模式"
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

# 安装基础依赖
install_dependencies() {
    log_info "安装系统依赖..."
    
    # 更新包列表
    apt update
    
    # 安装基础软件包
    apt install -y curl wget git unzip software-properties-common
    
    # 安装Node.js 18.x
    log_info "安装Node.js 18.x..."
    curl -fsSL https://deb.nodesource.com/setup_18.x | bash -
    apt install -y nodejs
    
    # 安装PM2
    log_info "安装PM2..."
    npm install -g pm2
    
    # 安装构建工具
    log_info "安装构建工具..."
    npm install -g typescript tsx
    
    # 根据安装模式安装其他依赖
    if [[ "$INSTALL_MODE" != "node_only" ]]; then
        # Debian 12下直接安装MariaDB（官方源自带10.11）
        if grep -q "Debian GNU/Linux 12" /etc/os-release; then
            log_info "检测到Debian 12，使用官方源安装MariaDB 10.11"
            apt remove -y mysql-server mysql-common || true
            apt-mark hold mysql-server mysql-common || true
            apt update
            apt install -y mariadb-server
        else
            # 安装MariaDB
            log_info "安装MariaDB..."
            apt install -y mariadb-server
        fi
        
        # 安装Redis
        log_info "安装Redis..."
        apt install -y redis-server
        
        # 安装Nginx
        log_info "安装Nginx..."
        apt install -y nginx
    fi
    
    log_success "基础依赖安装完成"
}

# 配置MariaDB (仅完整安装和管理端用户端安装)
setup_mariadb() {
    if [[ "$INSTALL_MODE" == "node_only" ]]; then
        log_info "节点端安装模式，跳过MariaDB配置"
        return
    fi
    log_info "配置MariaDB..."
    # 启动MariaDB服务
    systemctl start mariadb
    systemctl enable mariadb
    # 安全配置MariaDB
    mysql_secure_installation <<EOF
y
$DB_ROOT_PASS
$DB_ROOT_PASS
y
y
y
y
EOF
    # 创建数据库和用户
    mariadb -uroot -p$DB_ROOT_PASS <<EOF
CREATE DATABASE IF NOT EXISTS cdn_master DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
CREATE DATABASE IF NOT EXISTS cdn_admin DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
CREATE DATABASE IF NOT EXISTS cdn_user DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
CREATE DATABASE IF NOT EXISTS cdn_node DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
CREATE USER IF NOT EXISTS 'cdn_user'@'localhost' IDENTIFIED BY '$DB_USER_PASS';
GRANT ALL PRIVILEGES ON cdn_master.* TO 'cdn_user'@'localhost';
GRANT ALL PRIVILEGES ON cdn_admin.* TO 'cdn_user'@'localhost';
GRANT ALL PRIVILEGES ON cdn_user.* TO 'cdn_user'@'localhost';
GRANT ALL PRIVILEGES ON cdn_node.* TO 'cdn_user'@'localhost';
FLUSH PRIVILEGES;
EOF
    log_success "MariaDB配置完成"
}

# 配置Redis (仅完整安装和管理端用户端安装)
setup_redis() {
    if [[ "$INSTALL_MODE" == "node_only" ]]; then
        log_info "节点端安装模式，跳过Redis配置"
        return
    fi
    
    log_info "配置Redis..."
    
    # 配置Redis密码
    if [[ -n "$REDIS_PASS" ]]; then
        sed -i "s/# requirepass foobared/requirepass $REDIS_PASS/" /etc/redis/redis.conf
    fi
    
    # 启动Redis服务
    systemctl start redis-server
    systemctl enable redis-server
    
    log_success "Redis配置完成"
}

# 安装项目依赖
install_project_dependencies() {
    log_info "安装项目依赖..."
    
    cd $(dirname $0)/..
    
    # 安装shared模块依赖
    if [[ -f "shared/package.json" ]]; then
        cd shared
        npm install
        cd ..
    fi
    
    # 根据安装模式安装各端依赖
    case $INSTALL_MODE in
        "full")
            for dir in master node admin user; do
                if [[ -d "$dir" ]]; then
                    log_info "安装 $dir 依赖..."
                    cd $dir
                    npm install
                    cd ..
                fi
            done
            ;;
        "admin_user")
            for dir in master admin user; do
                if [[ -d "$dir" ]]; then
                    log_info "安装 $dir 依赖..."
                    cd $dir
                    npm install
                    cd ..
                fi
            done
            ;;
        "node_only")
            if [[ -d "node" ]]; then
                log_info "安装 node 依赖..."
                cd node
                npm install
                cd ..
            fi
            ;;
    esac
    
    log_success "项目依赖安装完成"
}

# 构建项目
build_project() {
    log_info "构建项目..."
    
    cd $(dirname $0)/..
    
    # 根据安装模式构建各端
    case $INSTALL_MODE in
        "full")
            for dir in master node admin user; do
                if [[ -d "$dir" ]]; then
                    log_info "构建 $dir..."
                    cd $dir
                    if [[ -f "package.json" ]] && grep -q '"build"' package.json; then
                        npm run build
                    fi
                    cd ..
                fi
            done
            ;;
        "admin_user")
            for dir in master admin user; do
                if [[ -d "$dir" ]]; then
                    log_info "构建 $dir..."
                    cd $dir
                    if [[ -f "package.json" ]] && grep -q '"build"' package.json; then
                        npm run build
                    fi
                    cd ..
                fi
            done
            ;;
        "node_only")
            if [[ -d "node" ]]; then
                log_info "构建 node..."
                cd node
                if [[ -f "package.json" ]] && grep -q '"build"' package.json; then
                    npm run build
                fi
                cd ..
            fi
            ;;
    esac
    
    log_success "项目构建完成"
}

# 配置环境变量
setup_environment() {
    log_info "配置环境变量..."
    
    # 创建环境变量文件
    cat > /etc/cdn-system.env <<EOF
# CDN系统环境变量
NODE_ENV=production
INSTALL_MODE=$INSTALL_MODE

# 数据库配置
DB_HOST=localhost
DB_USER=cdn_user
DB_PASS=$DB_USER_PASS
DB_NAME=cdn_master

# Redis配置
REDIS_HOST=localhost
REDIS_PORT=6379
REDIS_PASS=$REDIS_PASS

# 服务端口
MASTER_PORT=8001
NODE_PORT=8002
ADMIN_PORT=3000
USER_PORT=3001

# Cloudflare配置（可选）
CLOUDFLARE_API_TOKEN=
CLOUDFLARE_ZONE_ID=

# 主域名配置
CDN_DOMAIN=cdn-system.com

# 节点端配置
MASTER_API_URL=$MASTER_API_URL
NODE_ID=$NODE_ID
NODE_SECRET=$NODE_SECRET
EOF
    
    log_success "环境变量配置完成"
}

# 启动服务
start_services() {
    log_info "启动服务..."
    
    cd $(dirname $0)/..
    
    case $INSTALL_MODE in
        "full")
            # 启动主控端
            if [[ -d "master" ]]; then
                log_info "启动主控端..."
                cd master
                pm2 start dist/index.js --name cdn-master --env production
                cd ..
            fi
            
            # 启动节点端
            if [[ -d "node" ]]; then
                log_info "启动节点端..."
                cd node
                pm2 start dist/index.js --name cdn-node --env production
                cd ..
            fi
            
            # 启动管理端
            if [[ -d "admin" ]]; then
                log_info "启动管理端..."
                cd admin
                pm2 start server/index.js --name cdn-admin --env production
                cd ..
            fi
            
            # 启动用户端
            if [[ -d "user" ]]; then
                log_info "启动用户端..."
                cd user
                pm2 start server/index.js --name cdn-user --env production
                cd ..
            fi
            ;;
        "admin_user")
            # 启动主控端
            if [[ -d "master" ]]; then
                log_info "启动主控端..."
                cd master
                pm2 start dist/index.js --name cdn-master --env production
                cd ..
            fi
            
            # 启动管理端
            if [[ -d "admin" ]]; then
                log_info "启动管理端..."
                cd admin
                pm2 start server/index.js --name cdn-admin --env production
                cd ..
            fi
            
            # 启动用户端
            if [[ -d "user" ]]; then
                log_info "启动用户端..."
                cd user
                pm2 start server/index.js --name cdn-user --env production
                cd ..
            fi
            ;;
        "node_only")
            # 启动节点端
            if [[ -d "node" ]]; then
                log_info "启动节点端..."
                cd node
                pm2 start dist/index.js --name cdn-node --env production
                cd ..
            fi
            ;;
    esac
    
    # 保存PM2配置
    pm2 save
    pm2 startup
    
    log_success "服务启动完成"
}

# 配置Nginx (仅完整安装和管理端用户端安装)
setup_nginx() {
    if [[ "$INSTALL_MODE" == "node_only" ]]; then
        log_info "节点端安装模式，跳过Nginx配置"
        return
    fi
    
    log_info "配置Nginx..."
    
    # 备份原配置
    cp /etc/nginx/nginx.conf /etc/nginx/nginx.conf.backup
    
    # 创建CDN系统配置
    cat > /etc/nginx/sites-available/cdn-system <<EOF
server {
    listen 80;
    server_name _;
    
    # 管理端
    location /admin/ {
        proxy_pass http://localhost:3000/;
        proxy_set_header Host \$host;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto \$scheme;
        proxy_set_header Connection "";
        proxy_http_version 1.1;
        
        # 超时设置
        proxy_connect_timeout 60s;
        proxy_send_timeout 60s;
        proxy_read_timeout 60s;
    }
    
    # 用户端
    location /user/ {
        proxy_pass http://localhost:3001/;
        proxy_set_header Host \$host;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto \$scheme;
        proxy_set_header Connection "";
        proxy_http_version 1.1;
        
        # 超时设置
        proxy_connect_timeout 60s;
        proxy_send_timeout 60s;
        proxy_read_timeout 60s;
    }
    
    # 主控端API
    location /api/master/ {
        proxy_pass http://localhost:8001/;
        proxy_set_header Host \$host;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto \$scheme;
        proxy_set_header Connection "";
        proxy_http_version 1.1;
        
        # CORS设置
        add_header Access-Control-Allow-Origin * always;
        add_header Access-Control-Allow-Methods "GET, POST, PUT, DELETE, OPTIONS" always;
        add_header Access-Control-Allow-Headers "DNT,User-Agent,X-Requested-With,If-Modified-Since,Cache-Control,Content-Type,Range,Authorization" always;
        
        if (\$request_method = 'OPTIONS') {
            add_header Access-Control-Allow-Origin *;
            add_header Access-Control-Allow-Methods "GET, POST, PUT, DELETE, OPTIONS";
            add_header Access-Control-Allow-Headers "DNT,User-Agent,X-Requested-With,If-Modified-Since,Cache-Control,Content-Type,Range,Authorization";
            add_header Access-Control-Max-Age 1728000;
            add_header Content-Type "text/plain; charset=utf-8";
            add_header Content-Length 0;
            return 204;
        }
    }
    
    # 节点API
    location /api/node/ {
        proxy_pass http://localhost:8002/;
        proxy_set_header Host \$host;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto \$scheme;
        proxy_set_header Connection "";
        proxy_http_version 1.1;
        
        # CORS设置
        add_header Access-Control-Allow-Origin * always;
        add_header Access-Control-Allow-Methods "GET, POST, PUT, DELETE, OPTIONS" always;
        add_header Access-Control-Allow-Headers "DNT,User-Agent,X-Requested-With,If-Modified-Since,Cache-Control,Content-Type,Range,Authorization" always;
        
        if (\$request_method = 'OPTIONS') {
            add_header Access-Control-Allow-Origin *;
            add_header Access-Control-Allow-Methods "GET, POST, PUT, DELETE, OPTIONS";
            add_header Access-Control-Allow-Headers "DNT,User-Agent,X-Requested-With,If-Modified-Since,Cache-Control,Content-Type,Range,Authorization";
            add_header Access-Control-Max-Age 1728000;
            add_header Content-Type "text/plain; charset=utf-8";
            add_header Content-Length 0;
            return 204;
        }
    }
    
    # 健康检查
    location /health {
        access_log off;
        return 200 "healthy\n";
        add_header Content-Type text/plain;
    }
    
    # 默认重定向到管理端
    location / {
        return 301 /admin/;
    }
}
EOF
    
    # 启用站点
    ln -sf /etc/nginx/sites-available/cdn-system /etc/nginx/sites-enabled/
    rm -f /etc/nginx/sites-enabled/default
    
    # 测试配置
    nginx -t
    
    # 重启Nginx
    systemctl restart nginx
    systemctl enable nginx
    
    log_success "Nginx配置完成"
}

# 创建管理员账号 (仅完整安装和管理端用户端安装)
create_admin() {
    if [[ "$INSTALL_MODE" == "node_only" ]]; then
        log_info "节点端安装模式，跳过管理员账号创建"
        return
    fi
    
    log_info "创建管理员账号..."
    
    # 这里应该调用API创建管理员账号
    # 简化处理，创建初始管理员
    mariadb -uroot -p$DB_ROOT_PASS cdn_admin <<EOF
INSERT INTO users (username, password, email, role, status, created_at) 
VALUES ('$ADMIN_USER', '$ADMIN_PASS_HASH', '$ADMIN_EMAIL', 'admin', 'active', NOW())
ON DUPLICATE KEY UPDATE password = '$ADMIN_PASS_HASH';
EOF
    
    log_success "管理员账号创建完成"
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
    cat >> /etc/cdn-system.env <<EOF

# 节点端配置
MASTER_API_URL=$MASTER_API_URL
NODE_ID=$NODE_ID
NODE_SECRET=$NODE_SECRET
EOF
    
    log_success "节点端配置完成"
}

# 显示部署信息
show_deployment_info() {
    log_success "CDN系统部署完成！"
    echo
    echo "=========================================="
    echo "           部署信息"
    echo "=========================================="
    
    case $INSTALL_MODE in
        "full")
            echo "安装模式: 完整安装"
            echo "管理端地址: http://$(curl -s ifconfig.me)/admin/"
            echo "用户端地址: http://$(curl -s ifconfig.me)/user/"
            echo "管理员账号: $ADMIN_USER"
            echo "管理员密码: $ADMIN_PASS"
            echo "数据库地址: localhost:3306"
            echo "Redis地址: localhost:6379"
            ;;
        "admin_user")
            echo "安装模式: 管理端和用户端"
            echo "管理端地址: http://$(curl -s ifconfig.me)/admin/"
            echo "用户端地址: http://$(curl -s ifconfig.me)/user/"
            echo "管理员账号: $ADMIN_USER"
            echo "管理员密码: $ADMIN_PASS"
            echo "数据库地址: localhost:3306"
            echo "Redis地址: localhost:6379"
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
    echo "服务状态检查:"
    pm2 status
    echo
    echo "日志查看:"
    echo "  PM2日志: pm2 logs"
    
    case $INSTALL_MODE in
        "full"|"admin_user")
            echo "  Nginx日志: tail -f /var/log/nginx/access.log"
            echo "  MariaDB日志: tail -f /var/log/mysql/error.log"
            ;;
    esac
    
    echo
    echo "常用命令:"
    echo "  重启服务: pm2 restart all"
    echo "  停止服务: pm2 stop all"
    echo "  查看状态: pm2 status"
    echo "  查看日志: pm2 logs"
    
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
    echo "        CDN系统一键部署脚本"
    echo "=========================================="
    echo
    
    # 选择安装模式
    select_install_mode
    
    # 根据安装模式获取配置信息
    case $INSTALL_MODE in
        "full"|"admin_user")
            # 交互式输入
            echo "请输入部署配置信息："
            read -p "管理员账号 (默认: admin): " ADMIN_USER
            ADMIN_USER=${ADMIN_USER:-admin}
            
            read -s -p "管理员密码: " ADMIN_PASS
            echo
            read -s -p "确认管理员密码: " ADMIN_PASS_CONFIRM
            echo
            
            if [[ "$ADMIN_PASS" != "$ADMIN_PASS_CONFIRM" ]]; then
                log_error "密码不匹配"
                exit 1
            fi
            
            read -p "管理员邮箱: " ADMIN_EMAIL
            ADMIN_EMAIL=${ADMIN_EMAIL:-admin@cdn-system.com}
            
            read -s -p "MariaDB root密码: " DB_ROOT_PASS
            echo
            read -s -p "确认MariaDB root密码: " DB_ROOT_PASS_CONFIRM
            echo
            
            if [[ "$DB_ROOT_PASS" != "$DB_ROOT_PASS_CONFIRM" ]]; then
                log_error "MariaDB密码不匹配"
                exit 1
            fi
            
            read -s -p "数据库用户密码: " DB_USER_PASS
            echo
            DB_USER_PASS=${DB_USER_PASS:-cdn123456}
            
            read -s -p "Redis密码 (可留空): " REDIS_PASS
            echo
            REDIS_PASS=${REDIS_PASS:-}
            
            # 生成密码哈希
            ADMIN_PASS_HASH=$(echo -n "$ADMIN_PASS" | openssl dgst -sha256 | cut -d' ' -f2)
            ;;
        "node_only")
            # 节点端配置
            setup_node_config
            ;;
    esac
    
    echo
    log_info "开始部署CDN系统..."
    
    # 执行部署步骤
    check_system
    install_dependencies
    setup_mariadb
    setup_redis
    install_project_dependencies
    build_project
    setup_environment
    start_services
    setup_nginx
    create_admin
    show_deployment_info
    
    log_success "部署完成！"
}

# 执行主函数
main "$@" 