// 主页JavaScript - 本地版本

// 检查今天的数据并跳转到榜单页面
async function checkAndGoToScraper() {
    const today = getTodayString();
    const testUrl = `../data/raw/${today}/app_store/health_fitness.json`;
    
    try {
        const response = await fetch(testUrl);
        if (response.ok) {
            window.location.href = 'scraper.html';
        } else {
            showToast('今天的数据还未爬取，请稍后再试', 'info');
        }
    } catch (error) {
        showToast('检查数据失败: ' + error.message, 'error');
    }
}

// 检查并运行检测模块
async function checkAndRunDetector() {
    const today = getTodayString();
    const testUrl = `../data/new_apps/${today}.json`;
    
    try {
        const response = await fetch(testUrl);
        if (response.ok) {
            window.location.href = 'detector.html';
        } else {
            showToast('今天还没有检测数据，请稍后再试', 'info');
        }
    } catch (error) {
        showToast('检查数据失败: ' + error.message, 'error');
    }
}

// 加载统计数据
async function loadStats() {
    try {
        // 获取数据天数
        const dates = await getAvailableDates();
        console.log('可用日期列表:', dates);
        document.getElementById('total-dates').textContent = dates.length;

        // 加载模块1日期（最新爬取日期）
        if (dates.length > 0) {
            const latestScrapeDate = dates[0];
            document.getElementById('module1-date').textContent = formatDate(latestScrapeDate);
        } else {
            document.getElementById('module1-date').textContent = '暂无数据';
        }

        // 加载模块2日期（最新新上榜产品分析日期）
        const newAppsDates = [];
        const today = getTodayString();
        try {
            const response = await fetch(`../data/new_apps/${today}.json`);
            if (response.ok) {
                newAppsDates.push(today);
            }
        } catch (e) {}
        
        if (newAppsDates.length > 0) {
            document.getElementById('module2-date').textContent = formatDate(newAppsDates[0]);
        } else {
            document.getElementById('module2-date').textContent = '暂无';
        }

        // 加载模块3日期（最新AI分析日期）
        const analyzedData = await loadJSON(`../data/analyzed_apps.json`);
        if (analyzedData && analyzedData.last_updated) {
            // last_updated 格式: "2026-02-19 09:34:13"，提取日期部分
            const datePart = analyzedData.last_updated.split(' ')[0];
            document.getElementById('module3-date').textContent = formatDate(datePart);
        } else {
            document.getElementById('module3-date').textContent = '暂无';
        }

        // 获取最新一天的应用总数
        if (dates.length > 0) {
            const latestDate = dates[0];
            console.log('最新日期:', latestDate);
            let totalApps = 0;

            // App Store
            const appStoreCategories = ['health_fitness', 'social', 'lifestyle', 'games', 'productivity', 'utilities', 'entertainment', 'photo_video', 'travel'];
            for (const category of appStoreCategories) {
                const data = await loadJSON(`../data/raw/${latestDate}/app_store/${category}.json`);
                if (data && data.apps) {
                    console.log(`App Store ${category}:`, data.apps.length, '个应用');
                    totalApps += data.apps.length;
                }
            }

            // Google Play
            const googlePlayCategories = ['health_fitness', 'social', 'lifestyle', 'games', 'dating', 'tools', 'travel_local', 'productivity', 'entertainment'];
            for (const category of googlePlayCategories) {
                const data = await loadJSON(`../data/raw/${latestDate}/google_play/${category}.json`);
                if (data && data.apps) {
                    console.log(`Google Play ${category}:`, data.apps.length, '个应用');
                    totalApps += data.apps.length;
                }
            }

            console.log('总应用数:', totalApps);
            document.getElementById('total-apps').textContent = totalApps;
        }

        // 获取新上榜产品数
        const newAppsData = await loadJSON(`../data/new_apps/${today}.json`);
        console.log('新上榜产品数据:', newAppsData);
        if (newAppsData) {
            document.getElementById('new-apps').textContent = newAppsData.total_count || 0;
        }

        // 获取已分析产品数（统计实际的分析结果文件数量）
        try {
            const response = await fetch('../data/analysis');
            const text = await response.text();
            const dateMatches = text.match(/href="([0-9]{4}-[0-9]{2}-[0-9]{2})\/"/g) || [];
            let totalAnalyzed = 0;
            
            for (const dateMatch of dateMatches) {
                const date = dateMatch.match(/([0-9]{4}-[0-9]{2}-[0-9]{2})/)[1];
                const dateResponse = await fetch(`../data/analysis/${date}`);
                const dateText = await dateResponse.text();
                const jsonMatches = dateText.match(/href="([^"]+\.json)"/g) || [];
                totalAnalyzed += jsonMatches.length;
            }
            
            document.getElementById('analyzed-apps').textContent = totalAnalyzed;
            console.log('已分析产品数（实际文件）:', totalAnalyzed);
        } catch (e) {
            console.error('统计已分析产品数失败:', e);
            document.getElementById('analyzed-apps').textContent = '0';
        }

    } catch (error) {
        console.error('加载统计数据失败:', error);
    }
}

// 获取可用的日期列表
async function getAvailableDates() {
    try {
        // 优先尝试从dates.json读取（适用于GitHub Pages）
        const datesResponse = await fetch('../data/raw/dates.json');
        if (datesResponse.ok) {
            const contentType = datesResponse.headers.get('content-type');
            if (contentType && contentType.includes('application/json')) {
                const datesData = await datesResponse.json();
                console.log('从dates.json读取日期:', datesData.dates);
                return datesData.dates;
            }
        }
        
        // 如果dates.json不存在，尝试获取目录列表（适用于本地开发服务器）
        const response = await fetch('../data/raw');
        const text = await response.text();
        console.log('目录列表HTML:', text);
        
        // 解析目录列表
        const dates = [];
        // 修复正则表达式，匹配 Python HTTP 服务器的目录格式
        const regex = /href="([0-9]{4}-[0-9]{2}-[0-9]{2})\/"/g;
        let match;
        while ((match = regex.exec(text)) !== null) {
            dates.push(match[1]);
        }
        
        console.log('解析出的日期:', dates);
        return dates.sort().reverse();
    } catch (error) {
        console.error('获取日期列表失败:', error);
        return [];
    }
}

// 加载 JSON 数据
async function loadJSON(url) {
    try {
        const response = await fetch(url);
        if (!response.ok) {
            return null;
        }
        // 检查 Content-Type 避免将 HTML 页面当作 JSON 解析
        const contentType = response.headers.get('content-type');
        if (!contentType || !contentType.includes('application/json')) {
            return null;
        }
        return await response.json();
    } catch (error) {
        console.error('加载 JSON 失败:', url, error);
        return null;
    }
}

// 页面加载完成后执行
document.addEventListener('DOMContentLoaded', () => {
    loadStats().catch(e => console.error('loadStats 失败:', e));

    // GitHub Pages 模式：隐藏操作按钮，显示自动更新提示
    if (typeof IS_GITHUB_PAGES !== 'undefined' && IS_GITHUB_PAGES) {
        const btnScrape = document.getElementById('btn-scrape');
        const btnDetect = document.getElementById('btn-detect');
        const notice = document.getElementById('github-pages-notice');
        if (btnScrape) btnScrape.style.display = 'none';
        if (btnDetect) btnDetect.style.display = 'none';
        if (notice) notice.style.display = 'block';
    }
});

// 任务日志轮询
let taskPollTimer = null;
let taskPollKey = null;

function showTaskLogPanel(title) {
    const panel = document.getElementById('taskLogPanel');
    document.getElementById('taskLogTitle').textContent = `📋 ${title}`;
    document.getElementById('taskLogContent').textContent = '⏳ 等待任务启动...';
    document.getElementById('taskLogStatus').textContent = '';
    panel.style.display = 'block';
}

function hideTaskLogPanel() {
    if (taskPollTimer) {
        clearInterval(taskPollTimer);
        taskPollTimer = null;
    }
    document.getElementById('taskLogPanel').style.display = 'none';
}

async function pollTaskStatus() {
    try {
        const resp = await fetch(API_BASE + '/api/task-status');
        const data = await resp.json();
        const tasks = data.tasks || {};

        // 找到我们关心的任务
        let found = false;
        for (const [key, task] of Object.entries(tasks)) {
            if (key === taskPollKey || (taskPollKey && key.startsWith(taskPollKey))) {
                found = true;
                const logEl = document.getElementById('taskLogContent');
                const statusEl = document.getElementById('taskLogStatus');

                // 更新日志内容
                logEl.textContent = task.output || '(暂无输出)';
                logEl.scrollTop = logEl.scrollHeight;

                // 更新状态
                if (task.running) {
                    const elapsed = Math.round((Date.now() / 1000) - task.start_time);
                    statusEl.innerHTML = `<span style="color:#3b82f6;">⏳ 运行中 (${elapsed}秒)</span>`;
                } else if (task.return_code === 0) {
                    statusEl.innerHTML = '<span style="color:#10b981;">✅ 已完成</span>';
                    doneTask(task);
                } else {
                    statusEl.innerHTML = `<span style="color:#ef4444;">❌ 失败 (返回码: ${task.return_code})</span>`;
                    doneTask(task);
                }
                break;
            }
        }
        if (!found && taskPollTimer) {
            // 任务还没出现在追踪器中，继续等待
            document.getElementById('taskLogContent').textContent = '⏳ 正在启动任务进程...';
        }
    } catch (e) {
        console.error('轮询任务状态失败:', e);
    }
}

function doneTask(task) {
    // 停止轮询
    if (taskPollTimer) {
        clearInterval(taskPollTimer);
        taskPollTimer = null;
    }
    // 恢复按钮
    const btnScrape = document.getElementById('btn-scrape');
    const btnDetect = document.getElementById('btn-detect');
    btnScrape.disabled = false;
    btnScrape.textContent = '📦 爬取榜单数据';
    btnDetect.disabled = false;
    btnDetect.textContent = '🔍 检测新上榜产品';
    // 刷新统计
    if (task.task_type === 'detect' || task.task_type === 'scrape') {
        loadStats();
    }
}

// 触发爬取榜单数据
async function triggerScrape() {
    const btn = document.getElementById('btn-scrape');
    const btnDetect = document.getElementById('btn-detect');
    btn.disabled = true;
    btnDetect.disabled = true;
    btn.textContent = '⏳ 正在爬取...';

    try {
        const resp = await fetch(API_BASE + '/api/scrape', { method: 'POST' });
        const result = await resp.json();
        if (result.success) {
            showTaskLogPanel('爬取榜单数据');
            taskPollKey = 'scrape:';
            taskPollTimer = setInterval(pollTaskStatus, 2000);
            pollTaskStatus();
        } else {
            document.getElementById('action-status').textContent = '❌ ' + (result.error || '未知错误');
            document.getElementById('action-status').style.color = '#ef4444';
            btn.disabled = false;
            btnDetect.disabled = false;
            btn.textContent = '📦 爬取榜单数据';
        }
    } catch (e) {
        document.getElementById('action-status').textContent = '❌ 请求失败，请确认服务器已启动。';
        document.getElementById('action-status').style.color = '#ef4444';
        btn.disabled = false;
        btnDetect.disabled = false;
        btn.textContent = '📦 爬取榜单数据';
    }
}

// 触发检测新上榜产品
async function triggerDetect() {
    const btn = document.getElementById('btn-detect');
    const btnScrape = document.getElementById('btn-scrape');
    btn.disabled = true;
    btnScrape.disabled = true;
    btn.textContent = '⏳ 正在检测...';

    try {
        const resp = await fetch(API_BASE + '/api/detect', { method: 'POST' });
        const result = await resp.json();
        if (result.success) {
            showTaskLogPanel('检测新上榜产品');
            taskPollKey = 'detect:';
            taskPollTimer = setInterval(pollTaskStatus, 2000);
            pollTaskStatus();
        } else {
            document.getElementById('action-status').textContent = '❌ ' + (result.error || '未知错误');
            document.getElementById('action-status').style.color = '#ef4444';
            btn.disabled = false;
            btnScrape.disabled = false;
            btn.textContent = '🔍 检测新上榜产品';
        }
    } catch (e) {
        document.getElementById('action-status').textContent = '❌ 请求失败，请确认服务器已启动。';
        document.getElementById('action-status').style.color = '#ef4444';
        btn.disabled = false;
        btnScrape.disabled = false;
        btn.textContent = '🔍 检测新上榜产品';
    }
}