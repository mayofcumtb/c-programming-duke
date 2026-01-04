#!/bin/bash
# 启动完整系统脚本

set -e

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
PROJECT_DIR="$(dirname "$SCRIPT_DIR")"

cd "$PROJECT_DIR"

echo "====================================="
echo "  C Programming Judge - 完整启动"
echo "====================================="
echo ""

# 检测系统架构
ARCH=$(uname -m)
echo "系统架构: $ARCH"

if [[ "$ARCH" == "arm64" || "$ARCH" == "aarch64" ]]; then
    echo "⚠️  检测到 Apple Silicon / ARM64"
    echo "   判题服务将通过 Rosetta 2 模拟运行 x86_64 环境"
    echo "   （这是为了兼容预编译的 .o 文件）"
    echo ""
fi

# 检查 Docker 是否运行
if ! docker info > /dev/null 2>&1; then
    echo "❌ Docker 未运行，请先启动 Docker Desktop"
    exit 1
fi
echo "✓ Docker 已运行"

# 检查 Docker 是否支持多架构
if [[ "$ARCH" == "arm64" || "$ARCH" == "aarch64" ]]; then
    if docker run --rm --platform linux/amd64 alpine:latest echo "test" > /dev/null 2>&1; then
        echo "✓ Docker 支持 amd64 模拟"
    else
        echo "❌ Docker 无法运行 amd64 镜像"
        echo "   请确保 Docker Desktop 已启用 Rosetta"
        echo "   设置路径: Docker Desktop -> Settings -> General -> Use Rosetta"
        exit 1
    fi
fi

# 停止旧服务（如果存在）
echo ""
echo "正在停止旧服务..."
docker-compose down 2>/dev/null || true

# 构建并启动服务
echo ""
echo "正在构建服务镜像（首次可能需要几分钟）..."
docker-compose build

echo ""
echo "正在启动 PostgreSQL 和判题服务..."
docker-compose up -d

echo ""
echo "等待服务启动..."

# 等待 PostgreSQL
echo -n "等待 PostgreSQL..."
for i in {1..30}; do
    if docker-compose exec -T postgres pg_isready -U cjudge > /dev/null 2>&1; then
        echo " ✓"
        break
    fi
    echo -n "."
    sleep 1
done

# 等待判题服务
echo -n "等待判题服务..."
for i in {1..30}; do
    if curl -s http://localhost:9090/health > /dev/null 2>&1; then
        echo " ✓"
        break
    fi
    echo -n "."
    sleep 1
done

# 检查服务状态
echo ""
echo "检查服务状态..."
docker-compose ps

# 生成 Prisma Client
echo ""
echo "生成 Prisma Client..."
npx prisma generate 2>/dev/null || echo "⚠️  Prisma generate 失败，可能需要手动运行"

echo ""
echo "====================================="
echo "  ✅ 服务启动完成"
echo "====================================="
echo ""
echo "  PostgreSQL: localhost:5432"
echo "  判题服务:   http://localhost:9090"
echo ""
if [[ "$ARCH" == "arm64" || "$ARCH" == "aarch64" ]]; then
    echo "  💡 提示: ARM64 模拟运行中，性能可能略慢"
    echo ""
fi
echo "  查看日志:    docker-compose logs -f"
echo "  停止服务:    docker-compose down"
echo ""
echo "  启动 Web:    npm run dev"
echo ""
