# App Store & Google Play 榜单监控 Agent - 需求文档

## 📋 项目概述

这是一个自动化的应用商店榜单监控与分析系统，主要用于：
1. 定时爬取 App Store 和 Google Play 的榜单数据
2. 自动识别新上榜的产品
3. 使用 AI 对新上榜产品进行深度分析
4. 通过网页界面展示所有数据和分析结果

---

## 🏗️ 系统架构

### 设计原则
- **模块解耦**：3 个核心模块相互独立，可单独运行和维护
- **成本优化**：仅在分析模块使用大模型，爬取和对比使用脚本
- **数据本地化**：所有数据存储在本地，不依赖第三方服务（如飞书）
- **易用性**：通过网页界面查看所有数据和分析结果

### 技术栈
- **后端**：Python 3.x
- **数据存储**：JSON 文件 / SQLite（待定）
- **大模型**：Claude API（或其他）
- **前端**：HTML + CSS + JavaScript（原生或轻量级框架）
- **定时任务**：cron / APScheduler

---

## 📦 功能模块

### 模块 1：榜单数据爬取（Scraper Module）

#### 功能描述
- 每天定时爬取 App Store 和 Google Play 的榜单数据
- 按分类保存数据到本地文件

#### 榜单分类

**App Store（9 个分类）**：
- 健康与健身 (Health & Fitness)
- 社交网络 (Social Networking)
- 生活方式 (Lifestyle)
- 游戏 (Games)
- 生产力 (Productivity)
- 生活实用 (Utilities)
- 娱乐 (Entertainment)
- 照片&视频 (Photo & Video)
- 旅行 (Travel)

**Google Play（6 个分类）**：
- 健康与健身 (Health & Fitness)
- 社交 (Social)
- 生活方式 (Lifestyle)
- 游戏 (Games)
- 约会 (Dating)
- 工具 (Tools)

#### 数据字段

| 字段名 | 说明 | 示例 |
|--------|------|------|
| platform | 平台 | "App Store" / "Google Play" |
| category | 分类 | "健康与健身" |
| app_id | 应用唯一标识 | "com.example.app" |
| rank | 排名 | 1 |
| name | 应用名称 | "MyFitness" |
| developer | 开发者 | "Example Inc." |
| store_url | 商店链接 | "https://..." |
| icon_url | 图标链接 | "https://..." |
| timestamp | 抓取时间 | "2026-02-12 09:00:00" |

#### 数据存储结构
```
data/
├── raw/                          # 原始爬取数据
│   ├── 2026-02-12/              # 按日期组织
│   │   ├── app_store/
│   │   │   ├── health_fitness.json
│   │   │   ├── social.json
│   │   │   ├── lifestyle.json
│   │   │   └── games.json
│   │   └── google_play/
│   │       ├── health_fitness.json
│   │       ├── social.json
│   │       ├── lifestyle.json
│   │       ├── games.json
│   │       ├── dating.json
│   │       └── tools.json
│   ├── 2026-02-11/
│   └── ...
```

#### 运行方式
- **脚本名称**：`scraper.py`
- **手动执行**：
  - `python scraper.py` - 抓取今天的数据
  - `python scraper.py --date 2026-02-12` - 抓取指定日期
  - `python scraper.py --date 2026-02-12 --category health_fitness` - 只抓取指定分类
- **定时执行**：每天早上 9:00 自动执行（可选，需配置 crontab）
- **输出**：将数据保存到 `data/raw/{date}/` 目录

---

### 模块 2：新上榜产品识别（Detector Module）

#### 功能描述
- 对比今天和昨天的榜单数据
- 找出新上榜的产品（昨天不在榜单中，今天在榜单中）
- 如果缺少昨天数据，自动向前爬取（最多 3 天）

#### 对比逻辑
1. 读取今天的榜单数据
2. 尝试读取昨天的榜单数据
3. 如果昨天数据不存在：
   - 向前查找，最多检查 3 天（昨天、前天、大前天）
   - 如果都不存在，调用爬虫模块爬取
4. 对比今天和昨天的 `app_id` 列表
5. 识别新上榜的产品（在今天榜单中但不在昨天榜单中）

#### 数据存储结构
```
data/
├── new_apps/                     # 新上榜产品数据
│   ├── 2026-02-12.json          # 按日期组织
│   ├── 2026-02-11.json
│   └── ...
```

#### 新上榜产品数据格式
```json
{
  "date": "2026-02-12",
  "compare_date": "2026-02-11",
  "new_apps": [
    {
      "platform": "App Store",
      "category": "健康与健身",
      "app_id": "com.example.newapp",
      "rank": 15,
      "name": "New Fitness App",
      "developer": "New Developer",
      "store_url": "https://...",
      "icon_url": "https://...",
      "first_seen": "2026-02-12"
    }
  ],
  "total_count": 5
}
```

#### 运行方式
- **脚本名称**：`detector.py`
- **手动执行**：
  - `python detector.py` - 对比今天和昨天
  - `python detector.py --date 2026-02-12` - 对比指定日期
  - `python detector.py --date 2026-02-12 --compare-date 2026-02-10` - 指定对比日期
- **依赖**：需要模块 1 的数据
- **定时执行**：每天早上 9:30 执行（在爬取之后，可选）
- **输出**：将结果保存到 `data/new_apps/{date}.json`

---

### 模块 3：AI 智能分析（Analyzer Module）

#### 功能描述
- 读取新上榜产品列表
- 使用大模型（Claude API）对每个产品进行深度分析
- 生成结构化的分析报告

#### 分析维度

##### 3.1 基本信息分析
- **产品发布时间**：首次上线日期、距今时长
- **地区信息**：主要市场、支持的国家/地区
- **产品公司情况**：开发商背景、其他产品、公司规模
- **产品数据**：下载量、评分、评论数、更新频率

##### 3.2 投放素材分析
- **主要推广渠道**：社交媒体、广告平台、KOL 合作
- **素材内容方向**：
  - 视频广告风格
  - 图片素材特点
  - 文案主题
  - 目标用户画像

##### 3.3 产品功能分析
- **核心功能**：主要功能列表和说明
- **亮点分析**：
  - 创新点
  - 差异化优势
  - 用户体验亮点
  - 技术特色

##### 3.4 用户评价分析
- **正面评价**：
  - 高频好评关键词
  - 用户喜爱的功能
  - 推荐理由
- **负面评价**：
  - 常见问题
  - 用户痛点
  - 改进建议

##### 3.5 思考与总结
- **整体评估**：产品优劣势总结
- **成功因素**：为什么能快速上榜
- **可借鉴之处**：对竞品/自己产品的启发
- **市场机会**：潜在的市场空白或趋势

#### 数据存储结构
```
data/
├── analysis/                     # AI 分析结果
│   ├── 2026-02-12/
│   │   ├── com.example.app1.json
│   │   ├── com.example.app2.json
│   │   └── ...
│   ├── 2026-02-11/
│   └── ...
```

#### 分析结果数据格式
```json
{
  "app_id": "com.example.newapp",
  "name": "New Fitness App",
  "platform": "App Store",
  "category": "健康与健身",
  "analysis_date": "2026-02-12",
  "basic_info": {
    "release_date": "2025-12-01",
    "regions": ["US", "CN", "JP"],
    "company": {
      "name": "Example Inc.",
      "background": "...",
      "other_products": ["App A", "App B"]
    },
    "metrics": {
      "downloads": "100K+",
      "rating": 4.5,
      "reviews": 1200
    }
  },
  "marketing": {
    "channels": ["Facebook Ads", "TikTok", "Instagram"],
    "creative_direction": "..."
  },
  "features": {
    "core_features": ["Feature 1", "Feature 2"],
    "highlights": ["Highlight 1", "Highlight 2"]
  },
  "user_reviews": {
    "positive": ["Good point 1", "Good point 2"],
    "negative": ["Issue 1", "Issue 2"]
  },
  "summary": {
    "evaluation": "...",
    "success_factors": ["Factor 1", "Factor 2"],
    "takeaways": ["Takeaway 1", "Takeaway 2"]
  }
}
```

#### 运行方式
- **脚本名称**：`analyzer.py`
- **手动执行**：
  - `python analyzer.py` - 分析今天的新上榜产品
  - `python analyzer.py --date 2026-02-12` - 分析指定日期
  - `python analyzer.py --date 2026-02-12 --app-id com.example.app` - 只分析指定产品
  - `python analyzer.py --max-apps 5` - 限制分析产品数量
- **依赖**：
  - 模块 2 的新上榜产品数据
  - Claude Code API（自动使用当前环境）
- **定时执行**：每天早上 10:00 执行（在识别之后，可选）
- **输出**：将分析结果保存到 `data/analysis/{date}/`

#### API 配置
```python
# config.py
# 使用 Claude Code 的 API（无需额外配置 API Key）
CLAUDE_MODEL = "claude-sonnet-4-5-20250929"  # 使用当前模型
```

---

## 🌐 网页展示模块

### 页面结构

```
web/
├── index.html              # 主入口页面
├── scraper.html            # 模块 1：榜单数据页面
├── detector.html           # 模块 2：新上榜产品页面
├── analyzer.html           # 模块 3：AI 分析页面
├── css/
│   └── style.css
├── js/
│   ├── common.js           # 公共功能（日期导航等）
│   ├── scraper.js
│   ├── detector.js
│   └── analyzer.js
└── data/                   # 软链接到 ../data/
```

### 页面设计

#### 1. 主入口页面（index.html）

**布局**：
- 顶部：标题 "App Store & Google Play 榜单监控 Agent"
- 中间：3 个功能模块卡片
  - 卡片 1：榜单数据（Scraper Module）
  - 卡片 2：新上榜产品（Detector Module）
  - 卡片 3：AI 分析（Analyzer Module）
- 底部：最近更新时间、统计数据概览

**功能**：
- 点击卡片进入对应模块页面
- 显示各模块的最新数据概览

#### 2. 榜单数据页面（scraper.html）

**布局**：
- **左侧**：日期导航（20% 宽度）
  - 按日期列表显示（最新在上）
  - 点击日期切换数据
  - 高亮当前选中日期
- **右侧**：数据展示区（80% 宽度）
  - 顶部：选中日期、刷新按钮
  - 内容：
    - Tab 切换：App Store / Google Play
    - 每个分类一个表格
    - 表格字段：排名、图标、应用名称、开发者、商店链接

**功能**：
- 按日期浏览历史榜单数据
- 按分类筛选
- 点击应用名称/图标查看详情（跳转到商店）
- 导出数据（CSV/JSON）

#### 3. 新上榜产品页面（detector.html）

**布局**：
- **左侧**：日期导航（20% 宽度）
- **右侧**：数据展示区（80% 宽度）
  - 顶部：选中日期、对比日期、新上榜产品总数
  - 内容：
    - Tab 切换：App Store / Google Play
    - 卡片式展示每个新上榜产品：
      - 图标 + 应用名称
      - 分类、排名
      - 开发者
      - 商店链接
      - "查看分析" 按钮（跳转到分析页面）

**功能**：
- 按日期浏览新上榜产品
- 按平台/分类筛选
- 点击"查看分析"跳转到 AI 分析结果

#### 4. AI 分析页面（analyzer.html）

**布局**：
- **左侧**：日期导航（20% 宽度）
- **右侧**：分析结果展示区（80% 宽度）
  - 顶部：选中日期、产品选择下拉框
  - 内容：
    - 产品基本信息卡片（图标、名称、开发者、排名）
    - 5 个分析维度的折叠面板：
      - 3.1 基本信息
      - 3.2 投放素材
      - 3.3 产品功能
      - 3.4 用户评价
      - 3.5 思考与总结
    - 每个面板可展开/收起

**功能**：
- 按日期浏览分析报告
- 切换不同产品的分析结果
- 复制分析内容
- 导出分析报告（Markdown/PDF）

### 通用功能

#### 左侧日期导航
- 显示最近 30 天的日期
- 高亮有数据的日期
- 灰色显示无数据的日期
- 点击日期切换数据
- 支持日期搜索/跳转

#### 响应式设计
- 移动端：左侧导航改为顶部下拉菜单
- 平板/桌面：保持左右布局

---

## 📁 项目目录结构

```
appmonitor/
├── README.md                     # 项目说明
├── REQUIREMENTS.md               # 需求文档（本文档）
├── config.py                     # 配置文件
├── config.example.py             # 配置示例
├── requirements.txt              # Python 依赖
│
├── modules/                      # 核心模块
│   ├── __init__.py
│   ├── scraper.py               # 模块 1：爬虫
│   ├── detector.py              # 模块 2：新产品识别
│   └── analyzer.py              # 模块 3：AI 分析
│
├── scrapers/                     # 爬虫实现（被 scraper.py 调用）
│   ├── __init__.py
│   ├── app_store_scraper.py
│   └── google_play_scraper.py
│
├── utils/                        # 工具函数
│   ├── __init__.py
│   ├── data_storage.py          # 数据存储
│   ├── date_utils.py            # 日期处理
│   └── logger.py                # 日志
│
├── data/                         # 数据目录
│   ├── raw/                     # 原始榜单数据
│   ├── new_apps/                # 新上榜产品
│   └── analysis/                # AI 分析结果
│
├── web/                          # 网页界面
│   ├── index.html
│   ├── scraper.html
│   ├── detector.html
│   ├── analyzer.html
│   ├── css/
│   │   └── style.css
│   └── js/
│       ├── common.js
│       ├── scraper.js
│       ├── detector.js
│       └── analyzer.js
│
├── scripts/                      # 运行脚本
│   ├── run_scraper.sh           # 执行爬虫
│   ├── run_detector.sh          # 执行识别
│   ├── run_analyzer.sh          # 执行分析
│   └── run_all.sh               # 执行所有任务
│
├── logs/                         # 日志文件
│   ├── scraper.log
│   ├── detector.log
│   └── analyzer.log
│
└── tests/                        # 测试
    ├── test_scraper.py
    ├── test_detector.py
    └── test_analyzer.py
```

---

## ⚙️ 配置文件

```python
# config.py

# ===== 通用配置 =====
PROJECT_ROOT = "/path/to/appmonitor"
DATA_DIR = f"{PROJECT_ROOT}/data"
LOG_DIR = f"{PROJECT_ROOT}/logs"

# ===== 模块 1：爬虫配置 =====
SCRAPER_CONFIG = {
    "app_store": {
        "categories": {
            "health_fitness": {
                "name_cn": "健康与健身",
                "name_en": "Health & Fitness",
                "genre_id": "6013",
                "url": "https://itunes.apple.com/us/rss/topfreeapplications/limit=100/genre=6013/json"
            },
            # ... 其他分类
        }
    },
    "google_play": {
        "categories": {
            "health_fitness": {
                "name_cn": "健康与健身",
                "name_en": "HEALTH_AND_FITNESS",
            },
            # ... 其他分类
        },
        "country": "us",
        "collection": "TOP_FREE"
    },
    "delay": 2  # 请求延迟（秒）
}

# ===== 模块 2：识别配置 =====
DETECTOR_CONFIG = {
    "max_lookback_days": 3  # 最多向前查找 3 天
}

# ===== 模块 3：分析配置 =====
ANALYZER_CONFIG = {
    "api_provider": "claude",  # claude / openai / custom
    "api_key": "sk-ant-xxx",
    "model": "claude-3-5-sonnet-20241022",
    "max_concurrent": 3,  # 最大并发分析数
    "timeout": 60  # API 超时时间（秒）
}

# ===== 定时任务配置 =====
SCHEDULE_CONFIG = {
    "scraper_time": "09:00",
    "detector_time": "09:30",
    "analyzer_time": "10:00",
    "timezone": "Asia/Shanghai"
}
```

---

## 🚀 实施步骤

### Phase 1：基础设施搭建
1. 创建项目目录结构
2. 设置配置文件
3. 实现日志和工具函数

### Phase 2：模块 1 - 爬虫模块
1. 实现 App Store 爬虫
2. 实现 Google Play 爬虫
3. 实现数据存储逻辑
4. 测试爬虫功能

### Phase 3：模块 2 - 识别模块
1. 实现数据对比逻辑
2. 实现历史数据回溯
3. 实现新产品识别
4. 测试识别功能

### Phase 4：模块 3 - 分析模块
1. 实现 Claude API 调用
2. 设计 Prompt 模板
3. 实现分析结果存储
4. 测试分析功能

### Phase 5：网页界面
1. 实现主入口页面
2. 实现 3 个功能页面
3. 实现日期导航
4. 实现数据可视化

### Phase 6：集成与测试
1. 编写定时任务脚本
2. 集成测试
3. 性能优化
4. 文档完善

---

## ❓ 待确认问题

### 1. 数据存储方式 ✅
- **已确认**：JSON 文件
- **原因**：简单、易读、便于调试和维护

### 2. 大模型选择 ✅
- **已确认**：使用当前 Claude Code 的 API
- **模型**：claude-sonnet-4-5-20250929
- **优化方向**：精简 Prompt，减少 token 消耗

### 3. 前端框架 ✅
- **已确认**：原生 HTML/CSS/JS
- **原因**：无依赖、轻量、简单够用

### 4. 网页部署方式 ✅
- **已确认**：本地文件，双击 HTML 打开
- **注意**：需要处理浏览器 CORS 限制（见下方"关键技术问题"）

### 5. AI 分析深度 ✅
- **已确认**：精简分析，减少 token 使用
- **策略**：
  - 每个产品分析控制在 2000-3000 tokens 内
  - 使用结构化输出格式
  - 避免冗长描述，提炼关键信息

---

## 💰 成本估算

### 爬虫成本
- 免费（使用官方 RSS 或免费库）

### 大模型成本（Claude API）
- **假设**：每天 10 个新上榜产品，每个分析消耗 10K tokens
- **每天成本**：10 产品 × 10K tokens × $0.003/1K ≈ $0.3/天
- **每月成本**：约 $9/月

### 总成本
- **每月约 $10**（仅大模型成本）

---

## ✅ 需求确认清单

已确认内容：

- [x] **数据存储**：JSON 文件
- [x] **网页部署**：本地文件，双击浏览
- [x] **AI 分析**：精简分析，减少 token 使用
- [x] **大模型**：使用当前 Claude Code API
- [x] **前端**：原生 HTML/CSS/JS
- [x] **定时任务**：9:00、9:30、10:00（可选，支持手动执行）

待确认内容：

- [ ] 榜单分类是否正确？是否需要添加/删除分类？
- [ ] 数据字段是否完整？是否需要额外字段？
- [ ] 新产品识别逻辑是否合理（向前查找最多 3 天）？
- [ ] AI 分析的 5 个维度是否符合需求？
- [ ] 网页界面设计是否满足使用场景？
- [ ] 其他需要调整的地方？

---

## ⚠️ 关键技术问题与解决方案

### 1. 本地 HTML 的 CORS 问题

**问题**：浏览器直接打开本地 HTML 文件时，无法通过 `fetch()` 加载本地 JSON 文件（跨域限制）

**解决方案**：
- **方案 A**（推荐）：使用简单的本地 HTTP 服务器
  ```bash
  # Python 3
  cd web && python -m http.server 8000
  # 然后访问 http://localhost:8000
  ```
- **方案 B**：将 JSON 数据嵌入到 JavaScript 文件中
  ```javascript
  // 生成 data.js 文件
  window.appData = { /* JSON 数据 */ };
  ```
- **方案 C**：使用浏览器启动参数禁用安全策略（不推荐）
  ```bash
  # Chrome
  open -a "Google Chrome" --args --disable-web-security --user-data-dir="/tmp/chrome_dev"
  ```

**建议**：使用方案 A（简单且安全），提供一个启动脚本 `start_web.sh`

### 2. AI 分析的数据来源问题

**问题**：爬虫只获取基础信息（名称、排名、开发者），但 5 个维度的深度分析需要更多数据：
- 产品发布时间
- 产品截图和描述
- 用户评论内容
- 推广素材信息

**解决方案**：
- **方案 A**（推荐）：分析时额外爬取产品详情页
  - App Store：使用 iTunes API 获取详细信息
  - Google Play：使用 google-play-scraper 获取详情
  - 优点：数据完整
  - 缺点：增加网络请求，可能触发限流

- **方案 B**：仅基于基础信息 + 商店链接进行简化分析
  - AI 分析时只给出基础信息和商店链接
  - 让 AI 基于有限信息做推测性分析
  - 优点：速度快，token 少
  - 缺点：分析质量有限

- **方案 C**：混合方案
  - 爬虫时一次性获取详细信息（包括描述、评论、截图）
  - 存储到 JSON 文件中
  - AI 分析时直接使用
  - 优点：数据完整，AI 分析质量高
  - 缺点：爬虫时间变长

**建议**：使用方案 C（混合方案），在爬虫模块一次性获取详细信息

### 3. Google Play 数据准确性问题

**问题**：使用的 `google-play-scraper` 是非官方库，可能存在：
- 数据不准确
- 榜单排名与实际不符
- 被 Google 限流或封禁

**解决方案**：
- 增加请求延迟（2-5 秒）
- 添加重试机制
- 记录爬取失败的日志
- 在网页上标注"Google Play 数据为非官方来源"

### 4. 产品重复分析问题

**问题**：同一个产品可能在多天内都是"新上榜"状态（如果对比基准变化）

**解决方案**：
- 在 `detector.py` 中记录已分析过的产品
- 创建 `data/analyzed_apps.json` 记录所有已分析的 app_id
- 分析前检查是否已分析过，跳过重复产品
- 提供 `--force` 参数强制重新分析

### 5. 爬虫失败和重试机制

**问题**：网络问题、API 限流、服务器错误导致爬虫失败

**解决方案**：
- 实现自动重试机制（最多 3 次）
- 保存失败日志到 `logs/scraper_errors.log`
- 支持断点续爬（记录已成功的分类）
- 提供 `--retry` 参数重新爬取失败的分类

### 6. Token 优化策略

为了减少 AI 分析的 token 消耗：

**输入优化**：
- 只传递关键信息（去除冗余字段）
- 限制用户评论数量（取前 10 条正面 + 10 条负面）
- 限制产品描述长度（最多 500 字）

**输出优化**：
- 要求 AI 输出结构化 JSON（避免自然语言废话）
- 每个维度限制字数：
  - 基本信息：200 字以内
  - 投放素材：150 字以内
  - 产品功能：200 字以内
  - 用户评价：150 字以内
  - 思考总结：200 字以内

**预估消耗**：
- 每个产品：输入 ~1500 tokens + 输出 ~800 tokens = 2300 tokens
- 每天 10 个产品：~23K tokens
- 每月成本：~$0.07/天 × 30 = ~$2/月（大幅降低）

---

## 📝 后续步骤

确认需求后，我将：

1. **生成详细的实施计划**（包括代码结构、API 设计）
2. **逐步实现各个模块**（优先级：模块 1 → 2 → 3 → 网页）
3. **提供测试和运行指南**

---

**请仔细审阅此需求文档，提出修改意见或确认后，我将开始代码实施。**
