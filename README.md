# App Store & Google Play 榜单监控 Agent

一个自动化的应用商店榜单监控与分析系统，帮助你跟踪热门应用、发现新上榜产品、分析市场趋势。

[![Python](https://img.shields.io/badge/Python-3.11+-blue.svg)](https://www.python.org/)
[![License](https://img.shields.io/badge/License-MIT-green.svg)](LICENSE)

---

## 🎯 项目概述

本项目是一个三模块系统，用于：
1. **自动爬取**应用商店榜单数据
2. **智能识别**新上榜的产品
3. **AI分析**产品特点和市场机会
4. **网页展示**所有数据和分析结果

---

## ✨ 功能特性

### 📦 模块1：榜单数据爬取 ✅ 已完成

- ✅ **App Store**：9个分类（健康与健身、社交网络、生活方式、游戏、生产力、生活实用、娱乐、照片&视频、旅行）
- ✅ **Google Play**：9个分类（健康与健身、社交、生活方式、游戏、约会、工具、旅行与当地、生产力、娱乐）
- ✅ **数据存储**：本地JSON格式，按日期和分类组织
- ✅ **命令行支持**：可指定日期、平台、分类
- ✅ **错误处理**：自动重试、日志记录

### 🔍 模块2：新上榜产品识别 ✅ 已完成

- ✅ **榜单对比**：对比今天和昨天的所有分类榜单
- ✅ **智能回溯**：自动向前查找最多3天
- ✅ **去重机制**：维护已分析产品列表
- ✅ **命令行支持**：可指定日期、强制重新识别

### 🤖 模块3：AI智能分析 ✅ 已完成

- 基本信息分析（发布时间、公司背景、数据指标）
- 投放素材分析（推广渠道、素材方向）
- 产品功能分析（核心功能、创新亮点）
- 用户评价分析（正面/负面评价）
- 思考与总结（成功因素、可借鉴之处）

### 🌐 网页展示 ✅ 已完成

- 主入口页面：3个模块卡片
- 榜单数据页面：按日期和分类浏览
- 新上榜产品页面：快速查看新产品
- AI分析页面：深度分析报告
- 左侧日期导航，便捷切换

---

## 🚀 快速开始

### 1. 克隆项目

```bash
git clone https://github.com/您的用户名/appmonitor.git
cd appmonitor
```

### 2. 创建虚拟环境（推荐）

```bash
# 使用 Python 3.11+ (带新版OpenSSL)
python3.11 -m venv venv
source venv/bin/activate
```

### 3. 安装依赖

```bash
pip install -r requirements_module1.txt
```

### 4. 运行爬虫（模块1）

```bash
# 爬取今天所有数据
source venv/bin/activate && python modules/scraper.py

# 或使用脚本
./scripts/run_scraper.sh
```

### 5. 查看数据

数据保存在 `data/raw/{日期}/{平台}/{分类}.json`

```bash
# 示例：查看今天的App Store健康与健身分类
cat data/raw/$(date +%Y-%m-%d)/app_store/health_fitness.json
```

---

## 📁 项目结构

```
appmonitor/
├── README.md                     # 项目说明（本文档）
├── README_MODULE1.md             # 模块1详细文档
├── REQUIREMENTS.md               # 完整需求文档
├── config_simple.py              # 配置文件
├── requirements_module1.txt      # 模块1依赖
│
├── modules/                      # 核心模块
│   └── scraper.py               # 模块1：爬虫主程序
│
├── scrapers/                     # 爬虫实现
│   ├── app_store_scraper.py     # App Store 爬虫
│   └── google_play_scraper.py   # Google Play 爬虫
│
├── utils/                        # 工具函数
│   ├── data_storage.py          # 数据存储
│   ├── date_utils.py            # 日期处理
│   └── logger.py                # 日志记录
│
├── scripts/                      # 运行脚本
│   └── run_scraper.sh           # 爬虫启动脚本
│
├── data/                         # 数据目录（不提交到git）
│   ├── raw/                     # 原始榜单数据
│   ├── new_apps/                # 新上榜产品（模块2）
│   └── analysis/                # AI分析结果（模块3）
│
└── logs/                         # 日志目录（不提交到git）
```

---

## 📖 使用指南

### 模块1：爬取榜单数据

详细文档请查看：[README_MODULE1.md](README_MODULE1.md)

**⚠️ 重要：所有命令必须在虚拟环境中执行！**

```bash
# 爬取所有数据（10个分类，约5-10分钟）
source venv/bin/activate && python modules/scraper.py

# 只爬取 App Store
source venv/bin/activate && python modules/scraper.py --platform app_store

# 只爬取指定分类
source venv/bin/activate && python modules/scraper.py --category health_fitness

# 爬取指定日期（注意：只能获取当前实时数据）
source venv/bin/activate && python modules/scraper.py --date 2026-02-12

# 查看帮助
source venv/bin/activate && python modules/scraper.py --help
```

### 模块2：识别新上榜产品

详细文档请查看：[README_MODULE2.md](README_MODULE2.md)

```bash
# 识别今天的新上榜产品
source venv/bin/activate && python modules/detector.py

# 或使用脚本
./scripts/run_detector.sh

# 识别指定日期
source venv/bin/activate && python modules/detector.py --date 2026-02-12

# 强制重新识别
source venv/bin/activate && python modules/detector.py --force

# 查看帮助
source venv/bin/activate && python modules/detector.py --help
```

### 模块3：AI智能分析 ✅

```bash
# 运行AI分析
source venv/bin/activate && python modules/analyzer.py

# 查看帮助
source venv/bin/activate && python modules/analyzer.py --help
```

---

## ⏰ 定时任务（可选）

使用 crontab 设置每天自动爬取：

```bash
# 编辑 crontab
crontab -e

# 添加以下行（每天早上9点执行）
0 9 * * * cd /path/to/appmonitor && source venv/bin/activate && python modules/scraper.py
```

---

## 🔧 配置说明

主配置文件：`config_simple.py`

可以修改以下配置：
- **国家代码**：默认 `us`
- **爬取数量**：默认每个分类 100 个应用
- **请求延迟**：默认 2-3 秒
- **分类配置**：可添加或删除监控的分类

---

## 📊 数据格式

### 榜单数据格式

```json
{
  "date": "2026-02-12",
  "platform": "App Store",
  "category": "健康与健身",
  "category_key": "health_fitness",
  "total_apps": 100,
  "apps": [
    {
      "platform": "App Store",
      "category": "健康与健身",
      "app_id": "com.example.app",
      "rank": 1,
      "name": "App Name",
      "developer": "Developer Name",
      "store_url": "https://...",
      "icon_url": "https://...",
      "timestamp": "2026-02-12 09:00:00"
    }
  ]
}
```

---

## 🛠️ 技术栈

- **语言**：Python 3.11+
- **爬虫库**：
  - `requests` - App Store RSS API
  - `google-play-scraper` - Google Play 数据
- **数据存储**：JSON 文件
- **AI分析**：Claude API（模块3）
- **前端**：HTML + CSS + JavaScript（模块4）

---

## 📝 开发计划

- [x] **模块1：榜单数据爬取** - ✅ 已完成
  - [x] App Store 爬虫
  - [x] Google Play 爬虫
  - [x] 数据存储
  - [x] 命令行支持
  - [x] 错误处理

- [x] **模块2：新上榜产品识别** - ✅ 已完成
  - [x] 榜单对比逻辑
  - [x] 历史数据回溯
  - [x] 去重机制
  - [x] 命令行支持
  - [x] 数据存储

- [x] **模块3：AI智能分析** - ✅ 已完成
  - [x] Claude API 集成
  - [x] 5个维度分析
  - [x] 结果存储
  - [x] Token 优化

- [x] **模块4：网页展示** - ✅ 已完成
  - [x] 主入口页面
  - [x] 3个功能页面
  - [x] 日期导航
  - [x] 数据可视化

---

## ⚠️ 注意事项

### 环境要求

- **Python 3.11+**（需要新版 OpenSSL）
- 如果使用系统自带的 Python 3.9（LibreSSL 2.8.3）会导致网络连接失败
- 推荐使用 Homebrew 安装的 Python：`brew install python@3.11`

### ⚠️ 常见错误

**错误：Connection reset by peer**

```bash
✗ 爬取失败: ('Connection aborted.', ConnectionResetError(54, 'Connection reset by peer'))
```

**原因**：使用了系统 Python（LibreSSL 2.8.3）而不是 venv Python（OpenSSL 3.6.1）

**解决**：
```bash
# 方法1：激活 venv 后执行
source venv/bin/activate
python modules/scraper.py

# 方法2：直接使用 venv 的 Python
./venv/bin/python3 modules/scraper.py
```

**如何确认使用的是哪个 Python？**
```bash
# 激活 venv 后会看到 (venv) 前缀
source venv/bin/activate
(venv) $ python -c "import ssl; print(ssl.OPENSSL_VERSION)"
# 应该显示: OpenSSL 3.6.1 27 Jan 2026
```

### 频率限制

- ✅ **推荐频率**：每天 1 次
- ⚠️ **谨慎频率**：每 12 小时 1 次
- ❌ **避免**：每小时或更频繁

### Google Play 数据准确性

- 使用的 `google-play-scraper` 是非官方库
- 数据通过搜索方式获取，可能与实际榜单有差异
- 如需准确数据，建议使用官方 API（付费）

---

## 🤝 贡献

欢迎提交 Issue 和 Pull Request！

---

## 📄 许可证

MIT License

---

## 🔗 相关链接

- [飞书开放平台](https://open.feishu.cn/)（如需使用飞书存储）
- [Apple RSS Feed Generator](https://rss.applemarketingtools.com/)
- [google-play-scraper](https://github.com/JoMingyu/google-play-scraper)

---

## 📮 联系方式

有任何问题欢迎提 Issue！

---

**快速开始**：
```bash
# 1. 创建虚拟环境
python3.11 -m venv venv

# 2. 安装依赖
source venv/bin/activate && pip install -r requirements_module1.txt

# 3. 运行爬虫
source venv/bin/activate && python modules/scraper.py

# 4. 查看数据
cat data/raw/$(date +%Y-%m-%d)/app_store/health_fitness.json
```

**⚠️ 重要提示**：
- 必须使用 `source venv/bin/activate &&` 前缀执行所有 Python 命令
- 系统自带的 Python（LibreSSL）无法连接到 API
- 虚拟环境使用的 Python 3.11（OpenSSL）可以正常工作

祝你使用愉快！🚀
