# 完整CDN系统

一套功能完整的CDN（内容分发网络）系统，包含主控端、被控端、管理端和用户端，支持多种支付方式。

## 系统架构

```
cdn/
├── master/          # 主控端 - 全局管理和调度
├── node/            # 被控端 - 节点缓存和分发
├── admin/           # 管理端 - 管理员后台
├── user/            # 用户端 - 用户控制面板
├── shared/          # 共享组件和工具
├── deploy/          # 部署脚本和配置
└── docs/            # 文档和教程
```

## 主要功能

### 核心CDN功能
- 智能DNS解析和负载均衡
- 多节点缓存策略
- 实时流量监控和统计
- 带宽控制和限速
- 缓存预热和刷新
- 防盗链和访问控制
- SSL证书管理
- 回源配置和健康检查

### 管理功能
- 多租户管理
- 用户权限控制
- 计费和套餐管理
- 节点管理和监控
- 日志分析和报表
- 系统配置和备份

### 支付系统
- 易支付集成
- PayPal集成
- Stripe集成
- 多种支付方式选择
- 自动续费功能
- 发票和账单管理

### 用户功能
- 域名管理
- 流量统计
- 缓存配置
- 安全设置
- 账单管理
- API接口

## 技术栈

### 后端
- **主控端**: Node.js + Express + Redis + MySQL
- **被控端**: Node.js + Nginx + Redis
- **管理端**: Node.js + Express + MySQL
- **用户端**: Node.js + Express + MySQL

### 前端
- **管理端**: Vue.js 3 + Element Plus + TypeScript
- **用户端**: Vue.js 3 + Element Plus + TypeScript
- **响应式设计**: 支持PC和移动端
- **主题切换**: 白天/黑夜模式

### 数据库
- **MySQL**: 主数据库
- **Redis**: 缓存和会话存储
- **MongoDB**: 日志和统计数据

### 部署
- **Docker**: 容器化部署
- **Nginx**: 反向代理和负载均衡
- **PM2**: 进程管理
- **一键部署脚本**: 自动化安装配置

## 快速开始

### 系统要求
- Node.js 18+
- MySQL 8.0+
- Redis 6.0+
- Nginx 1.20+
- Docker (可选)

### 一键部署
```bash
# 克隆项目
git clone <repository-url>
cd cdn

# 运行部署脚本
./deploy/install.sh
```

### 手动部署
详细部署教程请参考 `docs/deployment.md`

## 文档

- [部署指南](docs/deployment.md)
- [对接教程](docs/integration.md)
- [API文档](docs/api.md)
- [用户手册](docs/user-guide.md)
- [管理员手册](docs/admin-guide.md)

## 许可证

MIT License

## 支持

如有问题，请提交 Issue 或联系技术支持。 "# cdnpanel" 
