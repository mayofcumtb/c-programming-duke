#!/bin/bash
# 启动判题服务脚本

set -e

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
PROJECT_DIR="$(dirname "$SCRIPT_DIR")"

cd "$PROJECT_DIR"

echo "====================================="
echo "  C Programming Judge Service"
echo "====================================="
echo ""

# 检查 Docker 是否运行
if ! docker info > /dev/null 2>&1; then
    echo "❌ Docker 未运行，请先启动 Docker"
    exit 1
fi

echo "✓ Docker 已运行"

# 构建并启动服务
echo ""
echo "正在构建判题服务镜像..."
docker-compose build

echo ""
echo "正在启动判题服务..."
docker-compose up -d

echo ""
echo "等待服务启动..."
sleep 3

# 健康检查
if curl -s http://localhost:9090/health > /dev/null 2>&1; then
    echo ""
    echo "====================================="
    echo "  ✅ 判题服务已启动"
    echo "====================================="
    echo ""
    echo "  服务地址: http://localhost:9090"
    echo "  健康检查: http://localhost:9090/health"
    echo ""
    echo "  查看日志: docker-compose logs -f judge"
    echo "  停止服务: docker-compose down"
    echo ""
else
    echo ""
    echo "⚠️  服务可能还在启动中，请稍后检查："
    echo "   curl http://localhost:9090/health"
    echo ""
    echo "查看日志:"
    echo "   docker-compose logs judge"
fi

