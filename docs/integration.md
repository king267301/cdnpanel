# 对接教程

## 节点对接
- 被控端（node）启动后自动向主控端（master）注册
- 主控端可在管理端查看节点状态
- 节点需开放 8002 端口

## 支付对接
- 易支付：配置商户ID、密钥、回调地址
- PayPal：配置ClientID、Secret、Webhook
- Stripe：配置API Key、Webhook
- 可在管理端后台切换支付方式

## 域名平台对接
- 支持主流域名托管平台（阿里云、腾讯云、Cloudflare等）
- 用户在控制台添加域名后，系统自动生成CNAME/NS记录指引
- 支持API自动同步域名解析（需配置API密钥）

## API对接
- 提供RESTful API，详见 docs/api.md
- 支持Token鉴权 