# C Programming Judge 宝塔面板部署指南

本文档详细说明如何在宝塔面板环境下部署 C 语言在线评测平台。

---

## 📋 目录

1. [环境要求](#环境要求)
2. [宝塔面板准备](#宝塔面板准备)
3. [安装 Docker](#安装-docker)
4. [上传项目代码](#上传项目代码)
5. [启动后端服务](#启动后端服务)
6. [部署 Next.js 应用](#部署-nextjs-应用)
7. [配置 Nginx 反向代理](#配置-nginx-反向代理)
8. [安全加固](#安全加固)
9. [常见问题排查](#常见问题排查)

---

## 环境要求

### 服务器配置

| 项目 | 最低要求 | 推荐配置 |
|------|---------|---------|
| CPU | 2 核 | 4 核+ |
| 内存 | 4 GB | 8 GB+ |
| 存储 | 40 GB | 100 GB+ |
| 系统 | CentOS 7+ / Ubuntu 18.04+ | Ubuntu 22.04 |
| 架构 | x86_64 (AMD64) | x86_64 |

### 端口需求

| 端口 | 用途 | 访问范围 |
|------|------|---------|
| 80/443 | Web 访问 | 公网 |
| 3000 | Next.js 应用 | 内网 |
| 5432 | PostgreSQL | 内网 |
| 9090 | 判题服务 | 内网 |

---

## 宝塔面板准备

### 1. 安装必要软件

在宝塔面板「软件商店」中安装：

- ✅ **Nginx** (推荐 1.22+)
- ✅ **PM2 管理器** (用于管理 Node.js 进程)
- ✅ **Node.js 版本管理器** (选择 Node.js 20.x 或 18.x LTS)

> ⚠️ **注意**: 不要在宝塔中安装 PostgreSQL，我们将使用 Docker 来运行数据库，以保证判题环境的一致性。

### 2. 安装 Node.js

1. 打开宝塔面板 → 软件商店 → 搜索 "Node.js版本管理器"
2. 安装后，点击「设置」
3. 安装 Node.js 版本：**v20.x LTS** (推荐) 或 v18.x LTS
4. 设置为默认版本

验证安装：
```bash
node -v   # 应显示 v20.x.x
npm -v    # 应显示 10.x.x
```

---

## 安装 Docker

### 方法一：通过宝塔面板安装（推荐）

1. 打开宝塔面板 → 软件商店
2. 搜索 "Docker管理器"
3. 点击安装

### 方法二：命令行安装

通过 SSH 连接服务器执行：

```bash
# CentOS 7/8
curl -fsSL https://get.docker.com | sh
systemctl start docker
systemctl enable docker

# 安装 Docker Compose
curl -L "https://github.com/docker/compose/releases/latest/download/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
chmod +x /usr/local/bin/docker-compose
```

验证安装：
```bash
docker --version          # Docker version 24.x.x
docker-compose --version  # Docker Compose version v2.x.x
```

---

## 上传项目代码

### 1. 创建项目目录

```bash
mkdir -p /www/wwwroot/c-judge
```

### 2. 上传代码

**方式一：通过宝塔文件管理器上传**

1. 打开宝塔面板 → 文件
2. 进入 `/www/wwwroot/c-judge`
3. 上传整个项目压缩包并解压

**方式二：通过 Git 克隆**

```bash
cd /www/wwwroot
git clone <你的仓库地址> c-judge
```

**方式三：通过 SCP 上传**

在本地电脑执行：
```bash
scp -r /path/to/c-programming-duke root@your-server-ip:/www/wwwroot/c-judge
```

### 3. 项目目录结构确认

上传完成后，目录结构应该如下：
```
/www/wwwroot/c-judge/
├── web-platform/          # Next.js 应用
│   ├── docker-compose.yml
│   ├── judge/
│   ├── package.json
│   ├── prisma/
│   ├── src/
│   └── ...
├── 01_intro_c/            # 题目资源
├── 02_code1/
├── student_resources/     # 学生资源（需要生成）
└── ...
```

---

## 启动后端服务

### 1. 修改数据库密码（重要！）

编辑 `/www/wwwroot/c-judge/web-platform/docker-compose.yml`：

```yaml
services:
  postgres:
    environment:
      POSTGRES_USER: cjudge
      POSTGRES_PASSWORD: 你的安全密码_至少16位   # ← 修改这里
      POSTGRES_DB: cjudge
```

同时修改 judge 服务的数据库连接：
```yaml
  judge:
    environment:
      - DATABASE_URL=postgresql://cjudge:你的安全密码_至少16位@postgres:5432/cjudge
```

### 2. 启动 Docker 服务

```bash
cd /www/wwwroot/c-judge/web-platform

# 构建并启动服务
docker-compose up -d --build

# 查看运行状态
docker-compose ps
```

预期输出：
```
NAME              STATUS    PORTS
c-judge-db        running   0.0.0.0:5432->5432/tcp
c-judge-service   running   0.0.0.0:9090->9090/tcp
```

### 3. 验证服务

```bash
# 检查数据库
docker-compose exec postgres pg_isready -U cjudge

# 检查判题服务
curl http://localhost:9090/health
```

应该返回 `{"status": "ok"}` 或类似的成功响应。

---

## 部署 Next.js 应用

### 1. 配置环境变量

创建环境变量文件 `/www/wwwroot/c-judge/web-platform/.env`：

```bash
# 数据库连接（密码与 docker-compose.yml 中一致）
DATABASE_URL=postgresql://cjudge:你的安全密码_至少16位@localhost:5432/cjudge

# 判题服务地址
JUDGE_SERVICE_URL=http://localhost:9090

# 启用 Docker 判题和数据库
USE_DOCKER_SERVICE=true
USE_DATABASE=true

# 生产环境配置
NODE_ENV=production
PORT=3000
```

### 2. 安装依赖

```bash
cd /www/wwwroot/c-judge/web-platform

# 安装项目依赖
npm install

# 生成 Prisma 客户端
npx prisma generate

# 同步数据库（如果表不存在会自动创建）
npx prisma db push
```

### 3. 构建生产版本

```bash
npm run build
```

构建成功后会生成 `.next` 目录。

### 4. 使用 PM2 启动应用

**方式一：通过宝塔 PM2 管理器**

1. 打开宝塔面板 → 软件商店 → PM2 管理器 → 设置
2. 点击「添加项目」
3. 填写配置：
   - 项目名称：`c-judge`
   - 启动文件：`npm`
   - 参数：`start`
   - 项目目录：`/www/wwwroot/c-judge/web-platform`
4. 点击确定

**方式二：命令行启动**

```bash
cd /www/wwwroot/c-judge/web-platform

# 使用 PM2 启动
pm2 start npm --name "c-judge" -- start

# 保存进程列表
pm2 save

# 设置开机自启
pm2 startup
```

### 5. 验证应用

```bash
# 查看 PM2 进程
pm2 list

# 查看日志
pm2 logs c-judge

# 测试访问
curl http://localhost:3000
```

---

## 配置 Nginx 反向代理

### 1. 通过宝塔添加站点

1. 打开宝塔面板 → 网站 → 添加站点
2. 填写配置：
   - 域名：`your-domain.com`（或服务器 IP）
   - PHP版本：选择「纯静态」
   - 不创建数据库
3. 点击提交

### 2. 配置反向代理

1. 点击刚创建的站点 → 设置
2. 选择「反向代理」→ 添加反向代理
3. 填写配置：
   - 代理名称：`c-judge`
   - 目标URL：`http://127.0.0.1:3000`
   - 发送域名：`$host`
4. 点击提交

### 3. 修改配置文件（可选优化）

点击「配置文件」，在 `location / { ... }` 中添加以下配置：

```nginx
location / {
    proxy_pass http://127.0.0.1:3000;
    proxy_http_version 1.1;
    proxy_set_header Upgrade $http_upgrade;
    proxy_set_header Connection 'upgrade';
    proxy_set_header Host $host;
    proxy_set_header X-Real-IP $remote_addr;
    proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
    proxy_set_header X-Forwarded-Proto $scheme;
    proxy_cache_bypass $http_upgrade;
    
    # 超时设置（判题可能需要较长时间）
    proxy_connect_timeout 60s;
    proxy_send_timeout 60s;
    proxy_read_timeout 120s;
}
```

### 4. 配置 SSL（推荐）

1. 点击站点设置 → SSL
2. 选择「Let's Encrypt」
3. 勾选域名，点击申请
4. 开启「强制 HTTPS」

---

## 安全加固

### 1. 防火墙配置

在宝塔「安全」中，确保：

- ✅ 放行 80 端口 (HTTP)
- ✅ 放行 443 端口 (HTTPS)
- ✅ 放行 22 端口 (SSH)
- ❌ **不要** 放行 3000、5432、9090 端口

### 2. Docker 端口限制

修改 `docker-compose.yml`，将外部端口绑定到 localhost：

```yaml
services:
  postgres:
    ports:
      - "127.0.0.1:5432:5432"  # 只允许本地访问

  judge:
    ports:
      - "127.0.0.1:9090:9090"  # 只允许本地访问
```

修改后重启服务：
```bash
docker-compose down
docker-compose up -d
```

### 3. 定期备份

在宝塔「计划任务」中添加：

```bash
# 备份数据库
docker-compose -f /www/wwwroot/c-judge/web-platform/docker-compose.yml exec -T postgres pg_dump -U cjudge cjudge > /www/backup/c-judge-db-$(date +%Y%m%d).sql

# 保留最近 7 天的备份
find /www/backup -name "c-judge-db-*.sql" -mtime +7 -delete
```

---

## 常见问题排查

### 问题 1：Docker 服务无法启动

```bash
# 查看详细日志
docker-compose logs -f

# 检查磁盘空间
df -h

# 清理 Docker 缓存
docker system prune -a
```

### 问题 2：数据库连接失败

```bash
# 检查 PostgreSQL 是否运行
docker-compose ps

# 手动测试连接
docker-compose exec postgres psql -U cjudge -d cjudge -c "SELECT 1"

# 查看数据库日志
docker-compose logs postgres
```

### 问题 3：判题服务无响应

```bash
# 检查判题服务状态
curl -v http://localhost:9090/health

# 查看判题服务日志
docker-compose logs judge

# 重启判题服务
docker-compose restart judge
```

### 问题 4：Next.js 构建失败

```bash
# 清除缓存重新构建
rm -rf .next node_modules
npm install
npm run build
```

### 问题 5：PM2 进程崩溃

```bash
# 查看错误日志
pm2 logs c-judge --err --lines 100

# 重启进程
pm2 restart c-judge

# 查看资源使用
pm2 monit
```

### 问题 6：网站访问 502 错误

1. 检查 PM2 进程是否在运行：`pm2 list`
2. 检查端口是否监听：`netstat -tlnp | grep 3000`
3. 检查 Nginx 配置：`nginx -t`
4. 查看 Nginx 错误日志：`tail -f /www/wwwlogs/your-domain.com.error.log`

---

## 服务管理命令速查

```bash
# === Docker 服务 ===
cd /www/wwwroot/c-judge/web-platform

docker-compose up -d        # 启动服务
docker-compose down         # 停止服务
docker-compose restart      # 重启服务
docker-compose logs -f      # 查看日志
docker-compose ps           # 查看状态

# === PM2 管理 ===
pm2 list                    # 查看进程列表
pm2 start c-judge           # 启动
pm2 stop c-judge            # 停止
pm2 restart c-judge         # 重启
pm2 logs c-judge            # 查看日志
pm2 monit                   # 监控面板

# === Nginx ===
nginx -t                    # 测试配置
nginx -s reload             # 重载配置
```

---

## 更新部署

当需要更新代码时：

```bash
cd /www/wwwroot/c-judge

# 1. 拉取最新代码
git pull origin main

# 2. 更新依赖
cd web-platform
npm install

# 3. 重新构建
npm run build

# 4. 重启服务
pm2 restart c-judge

# 5. 如果 Docker 配置有变化
docker-compose down
docker-compose up -d --build
```

---

## 联系与支持

如遇到问题，请检查：
1. 服务器资源是否充足（CPU、内存、磁盘）
2. Docker 服务是否正常运行
3. 所有端口是否正确配置
4. 环境变量是否正确设置

祝部署顺利！🎉

