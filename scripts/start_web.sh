#!/bin/bash
# 启动Web服务器（支持静态文件 + API接口）

cd "$(dirname "$0")/.."

# 启动Web服务器（优先使用venv，否则使用系统python3）
if [ -f "./venv/bin/python" ]; then
    ./venv/bin/python simple_server.py
else
    python3 simple_server.py
fi
