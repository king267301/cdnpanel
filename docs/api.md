# API文档

## 用户相关
- POST /api/user/login
- GET /api/user/info
- POST /api/user/register
- GET /api/user/domains

## 节点相关
- GET /api/node/list
- POST /api/node/register
- GET /api/node/health

## 订单/支付相关
- GET /api/order/list
- POST /api/order/create
- POST /api/pay/yipay
- POST /api/pay/paypal
- POST /api/pay/stripe

## 管理相关
- GET /api/admin/users
- GET /api/admin/nodes
- GET /api/admin/orders
- POST /api/admin/settings

## 鉴权
- 所有接口需携带Token（Authorization Header） 