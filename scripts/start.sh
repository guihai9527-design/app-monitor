#!/bin/bash
# 一键启动：服务器 + 打开浏览器
cd "$(dirname "$0")/.."

echo "🚀 启动 App 榜单监控系统..."
echo ""

python3.12 simple_server.py &
SERVER_PID=$!
sleep 1

LOCAL_URL="http://localhost:8000/web/index.html"
LAN_URL="http://$(hostname):8000/web/index.html"

open "$LOCAL_URL"

echo "✅ 已启动！"
echo "   本机访问: $LOCAL_URL"
echo "   局域网访问: $LAN_URL"
echo "   按 Ctrl+C 停止服务器"

wait $SERVER_PID