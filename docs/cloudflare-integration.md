# Cloudflare API集成教程

## 🌐 概述

本CDN系统支持与Cloudflare API集成，实现自动管理CNAME记录，无需手动配置DNS解析。

## 🔑 获取Cloudflare API Token

### 第一步：登录Cloudflare控制台

1. 访问 [Cloudflare控制台](https://dash.cloudflare.com/)
2. 使用您的账户登录

### 第二步：创建API Token

1. 点击右上角头像 → "My Profile"
2. 左侧菜单选择 "API Tokens"
3. 点击 "Create Token"
4. 选择 "Custom token" 模板
5. 配置权限：
   - **Zone** → **Zone** → **Read** (读取域名信息)
   - **Zone** → **Zone Settings** → **Read** (读取域名设置)
   - **Zone** → **DNS** → **Edit** (编辑DNS记录)
6. 设置Zone Resources：
   - 选择 "Include" → "Specific zone" → 选择您的域名
7. 点击 "Continue to summary" → "Create Token"
8. 复制生成的Token（注意保存，只显示一次）

## 🆔 获取Zone ID

### 方法一：从Cloudflare控制台获取

1. 登录Cloudflare控制台
2. 选择您的域名
3. 右侧边栏找到 "Zone ID"
4. 复制Zone ID

### 方法二：从域名概览页面获取

1. 选择域名后，在右侧边栏可以看到Zone ID
2. 格式类似：`a1b2c3d4e5f6g7h8i9j0`

## 🆔 获取Account ID（可选）

1. 在Cloudflare控制台首页
2. 右侧边栏可以看到Account ID
3. 格式类似：`a1b2c3d4e5f6g7h8i9j0`

## ⚙️ 在CDN系统中配置

### 第一步：进入域名管理

1. 登录CDN用户端控制台
2. 点击左侧菜单"域名管理"
3. 如果未配置Cloudflare，会看到配置提示卡片

### 第二步：配置Cloudflare

1. 点击"配置Cloudflare"按钮
2. 填写配置信息：
   - **API Token**：粘贴您获取的API Token
   - **Zone ID**：粘贴您的域名Zone ID
   - **Account ID**：粘贴Account ID（可选）
3. 点击"测试连接"验证配置
4. 点击"保存配置"

### 第三步：验证配置

1. 配置成功后，配置卡片会消失
2. 域名列表中的"自动DNS"按钮变为可用状态

## 🚀 使用自动DNS功能

### 添加域名时自动配置

1. 点击"添加域名"
2. 填写域名和回源地址
3. 启用"自动DNS"选项
4. 点击"添加域名"
5. 系统会自动在Cloudflare创建CNAME记录

### 为现有域名配置DNS

1. 在域名列表中找到目标域名
2. 点击"自动DNS"按钮
3. 系统会自动创建或更新CNAME记录

## 📋 CNAME记录格式

系统会自动生成以下格式的CNAME记录：

```
记录类型：CNAME
主机记录：您的域名
记录值：cdn.您的域名.cdn-system.com
TTL：600秒
代理状态：关闭（DNS only）
```

## 🔍 检查DNS状态

### 自动检查

1. 域名添加后，系统会自动检查DNS解析状态
2. DNS状态列会显示：
   - ✅ **已解析**：DNS记录已创建并生效
   - ⏳ **待解析**：DNS记录已创建，等待生效
   - ❌ **解析失败**：DNS记录创建失败

### 手动检查

1. 点击域名的"配置"按钮
2. 在DNS配置对话框中点击"检查DNS解析"
3. 系统会实时检查DNS解析状态

## 🛠️ 故障排除

### API Token无效

**症状**：测试连接失败，提示"API Token无效"

**解决方案**：
1. 检查API Token是否正确复制
2. 确认Token权限是否包含DNS编辑权限
3. 确认Zone Resources是否正确设置
4. 重新生成API Token

### Zone ID错误

**症状**：测试连接失败，提示"Zone ID错误"

**解决方案**：
1. 确认Zone ID是否正确复制
2. 确认域名是否在Cloudflare中正确添加
3. 检查域名状态是否正常

### DNS记录创建失败

**症状**：自动DNS配置失败

**解决方案**：
1. 检查域名是否已存在CNAME记录
2. 确认API Token有足够权限
3. 检查域名格式是否正确
4. 查看系统日志获取详细错误信息

### DNS解析不生效

**症状**：DNS记录已创建但解析不生效

**解决方案**：
1. 等待5-30分钟让DNS传播
2. 使用在线工具检查DNS解析
3. 清除本地DNS缓存
4. 联系Cloudflare支持

## 🔒 安全注意事项

### API Token安全

1. **不要分享**：API Token具有DNS编辑权限，请妥善保管
2. **定期更换**：建议定期更换API Token
3. **最小权限**：只授予必要的权限
4. **环境隔离**：生产环境和测试环境使用不同的Token

### 域名安全

1. **域名验证**：确保您拥有域名的管理权限
2. **记录备份**：备份重要的DNS记录
3. **监控异常**：定期检查DNS记录是否被意外修改

## 📞 技术支持

如果遇到问题，请联系技术支持：

- **邮箱**：support@cdn-system.com
- **在线客服**：用户端右下角客服按钮
- **文档**：查看其他相关文档

## 🎯 最佳实践

1. **测试环境**：先在测试域名上验证配置
2. **权限最小化**：只授予必要的API权限
3. **定期检查**：定期检查DNS记录状态
4. **备份配置**：保存Cloudflare配置信息
5. **监控日志**：关注系统日志中的DNS操作记录 