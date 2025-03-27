# Weekly Quotes Bot

一个自动获取并推送阮一峰科技爱好者周刊言论的机器人。每周一自动获取最新一期周刊中的言论部分，并通过企业微信机器人推送到指定群聊。

## 功能特性

- 自动获取阮一峰科技爱好者周刊最新一期内容
- 提取周刊中的"言论"部分
- 通过企业微信机器人自动推送到群聊
- 支持手动触发获取指定期数
- 支持查看历史记录
- 内置 DDoS 防护
- 自动扩缩容
- 定时任务支持

## API 接口

### 获取当前期数
```http
GET /current-issue
```

### 触发获取新一期
```http
POST /trigger-fetch
```

### 获取历史记录
```http
GET /history
```

### 获取指定期数并推送（不更新数据库）
```http
POST /fetch-and-push
Content-Type: application/json

{
  "issueNumber": 342
}
```

## 部署说明

### 环境要求
- Node.js 16+
- Docker（可选）

### 本地开发
1. 克隆项目
```bash
git clone https://github.com/yourusername/weekly-quotes.git
cd weekly-quotes
```

2. 安装依赖
```bash
npm install
```

3. 设置环境变量
```bash
export WEBHOOK_URL="你的企业微信机器人webhook地址"
```

4. 启动开发服务器
```bash
npm run dev
```

### 部署到 Fly.io

1. 安装 Fly CLI
```bash
# macOS
brew install flyctl

# Windows
scoop install flyctl

# Linux
curl -L https://fly.io/install.sh | sh
```

2. 登录 Fly.io
```bash
fly auth login
```

3. 设置环境变量
```bash
fly secrets set WEBHOOK_URL="你的企业微信机器人webhook地址"
```

4. 部署应用
```bash
fly deploy
```

## 配置说明

### 环境变量
- `PORT`: 应用端口号（默认：3000）
- `TZ`: 时区设置（默认：Asia/Shanghai）
- `WEBHOOK_URL`: 企业微信机器人 webhook 地址

### 定时任务
- 每周一早上 9:00（北京时间）自动获取并推送最新一期周刊

### 安全配置
- 速率限制：每个 IP 每分钟最多 30 次请求
- 并发连接限制：软限制 50，硬限制 100
- 强制 HTTPS
- 自动扩缩容

## 开发计划

- [ ] 支持更多消息推送渠道（如钉钉、飞书等）
- [ ] 添加消息模板自定义功能
- [ ] 支持多群推送
- [ ] 添加消息发送失败重试机制
- [ ] 添加更多数据统计功能

## 贡献指南

欢迎提交 Issue 和 Pull Request！

## 许可证

MIT License 