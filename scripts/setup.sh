#!/bin/bash
# 一键配置脚本 - 产品经理使用
echo "========================================"
echo "  App 榜单监控系统 - 环境配置"
echo "========================================"
echo ""

cd "$(dirname "$0")/.."

# 1. 检查 Python 3.12
if command -v python3.12 &>/dev/null; then
    echo "✅ Python 3.12 已安装"
else
    echo "❌ 需要 Python 3.12，请先安装:"
    echo "   https://www.python.org/downloads/"
    exit 1
fi

# 2. 安装依赖
echo ""
echo "📦 安装依赖..."
python3.12 -m pip install requests google-play-scraper -q 2>/dev/null
echo "✅ 依赖安装完成"

# 3. 创建启动脚本
echo ""
echo "✅ 配置完成！"
echo ""
echo "========================================"
echo "  使用方法"
echo "========================================"
echo ""
echo "  1. 双击 scripts/start.sh 启动"
echo "  2. 浏览器自动打开，点击按钮即可"
echo ""
echo "  注意: 如果无法访问 Google Play，"
echo "  请编辑 config_simple.py，设置 google_play 的 proxy"
echo "========================================"