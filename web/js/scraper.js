// 榜单数据页面JavaScript - 本地版本

let scraperCurrentDate = getQueryParam('date') || getTodayString();
let scraperCurrentPlatform = 'app_store';
let scraperCurrentCategory = 'health_fitness';
let scraperCurrentSort = { column: null, order: 'asc' };
let currentApps = [];

const scraperCategories = {
    'app_store': {
        'health_fitness': '健康与健身',
        'social': '社交网络',
        'lifestyle': '生活方式',
        'games': '游戏',
        'productivity': '生产力',
        'utilities': '生活实用',
        'entertainment': '娱乐',
        'photo_video': '照片&视频',
        'travel': '旅行'
    },
    'google_play': {
        'health_fitness': '健康与健身',
        'social': '社交',
        'lifestyle': '生活方式',
        'games': '游戏',
        'dating': '约会',
        'tools': '工具',
        'travel_local': '旅行与当地',
        'productivity': '生产力',
        'entertainment': '娱乐'
    }
};

// 初始化页面
async function scraperInit() {
    // 加载日期列表
    const dates = await getAvailableDates();
    console.log('可用日期:', dates);
    
    // 检查当前日期是否有数据
    const hasData = dates.includes(scraperCurrentDate);
    
    if (!hasData) {
        // 切换到最新的可用日期
        scraperCurrentDate = dates[0] || getTodayString();
    }
    
    renderScraperDateList(dates);

    // 初始化平台Tab和分类Tab
    updatePlatformTabs();
    updateCategoryTabs();

    // 平台Tab切换
    document.querySelectorAll('.tabs:not(.category-tabs) .tab').forEach(tab => {
        tab.addEventListener('click', () => {
            switchPlatform(tab.dataset.platform);
        });
    });

    // 分类Tab切换
    document.querySelectorAll('.category-tabs .tab').forEach(tab => {
        tab.addEventListener('click', () => {
            switchCategory(tab.dataset.category);
        });
    });

    // 加载数据
    await scraperLoadData();
}

// 加载数据
async function scraperLoadData() {
    try {
        const url = `../data/raw/${scraperCurrentDate}/${scraperCurrentPlatform}/${scraperCurrentCategory}.json`;
        console.log('加载数据:', url);
        const data = await loadJSON(url);

        if (data && data.apps) {
            currentApps = data.apps;
            renderApps();
        } else {
            currentApps = [];
            renderApps();
            showToast('该分类暂无数据，请先运行爬虫', 'info');
        }
    } catch (error) {
        console.error('加载数据失败:', error);
        showToast('加载数据失败: ' + error.message, 'error');
    }
}

// 切换平台
function switchPlatform(platform) {
    scraperCurrentPlatform = platform;
    scraperCurrentCategory = Object.keys(scraperCategories[scraperCurrentPlatform])[0];
    updatePlatformTabs();
    updateCategoryTabs();
    scraperLoadData();
}

// 切换分类
function switchCategory(category) {
    scraperCurrentCategory = category;
    updateCategoryTabs();
    scraperLoadData();
}

// 渲染日期列表
function renderScraperDateList(dates) {
    console.log('渲染日期列表:', dates);
    const container = document.getElementById('dateList');
    if (!container) {
        console.error('找不到 dateList 元素');
        return;
    }
    container.innerHTML = dates.map(date => `
        <li class="date-item ${date === scraperCurrentDate ? 'active' : ''}" 
             onclick="selectDate('${date}')">
            ${formatDate(date)}
        </li>
    `).join('');
}

// 选择日期
async function selectDate(date) {
    scraperCurrentDate = date;
    const dates = await getAvailableDates();
    renderScraperDateList(dates);
    scraperLoadData();
}

// 格式化数字显示
function formatNumber(num) {
    if (num >= 1000000) {
        return (num / 1000000).toFixed(1) + 'M';
    } else if (num >= 1000) {
        return (num / 1000).toFixed(1) + 'K';
    }
    return num.toString();
}

// 当前选中的应用（榜单数据）
let selectedScraperApp = null;

// 添加到分析队列
function scraperAddToAnalysisQueue(app, status = 'pending') {
    // 从 localStorage 读取现有队列
    let queue = JSON.parse(localStorage.getItem('analysisQueue') || '[]');

    // 检查是否已存在（根据 app_id 和 platform 判断）
    const existingIndex = queue.findIndex(item =>
        item.app_id === app.app_id && item.platform === app.platform
    );

    if (existingIndex === -1) {
        // 不存在，添加新记录
        app.added_time = new Date().toISOString();
        app.status = status; // pending, analyzing, completed
        queue.push(app);

        // 保存到 localStorage
        localStorage.setItem('analysisQueue', JSON.stringify(queue));

        console.log('已添加到分析队列:', app.name);
    } else {
        // 已存在，更新状态
        queue[existingIndex].status = status;
        localStorage.setItem('analysisQueue', JSON.stringify(queue));
        console.log('已更新应用状态:', app.name, status);
    }
}

// 显示榜单应用弹窗
function showScraperAppModal(index) {
    if (!currentApps || !currentApps[index]) {
        return;
    }
    
    const app = currentApps[index];
    selectedScraperApp = app;

    // 填充应用信息到弹窗
    document.getElementById('modalAppIcon').src = app.icon_url;
    document.getElementById('modalAppIcon').alt = app.name;
    document.getElementById('modalAppName').textContent = app.name;
    document.getElementById('modalAppPlatform').textContent = scraperCurrentPlatform === 'app_store' ? 'App Store' : 'Google Play';
    document.getElementById('modalAppCategory').textContent = app.category || scraperCategories[scraperCurrentPlatform][scraperCurrentCategory];
    document.getElementById('modalAppDeveloper').textContent = app.developer || '-';

    // 显示弹窗
    const modal = document.getElementById('analysisModal');
    modal.classList.add('show');

    // 点击遮罩层关闭弹窗
    modal.onclick = function(e) {
        if (e.target === modal) {
            closeScraperAppModal();
        }
    };
}

// 关闭榜单应用弹窗
function closeScraperAppModal() {
    const modal = document.getElementById('analysisModal');
    modal.classList.remove('show');
    selectedScraperApp = null;
}

// 加入待分析队列
async function scraperAddToQueue() {
    if (!selectedScraperApp) {
        return;
    }

    // 先添加到本地队列
    scraperAddToAnalysisQueue(selectedScraperApp, 'analyzing');

    const appName = selectedScraperApp.name;
    const appId = selectedScraperApp.app_id;
    const platform = document.getElementById('modalAppPlatform').textContent;

    closeScraperAppModal();
    showToast(`⚡ 正在启动分析 "${appName}"...`, 'info');

    try {
        const response = await fetch('/api/analyze', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                app_id: appId,
                platform: platform
            })
        });

        const result = await response.json();

        if (result.success) {
            showToast(`✅ "${appName}" 已加入队列并开始分析！`, 'success');
            setTimeout(() => {
                window.location.href = 'analyzer.html';
            }, 1000);
        } else {
            showToast(`❌ 启动分析失败: ${result.error || '未知错误'}`, 'error');
        }
    } catch (error) {
        console.error('启动分析失败:', error);
        showToast(`❌ 启动分析失败: ${error.message}`, 'error');
    }
}

// 立即分析
async function scraperAnalyzeNow() {
    if (!selectedScraperApp) {
        return;
    }

    // 先添加到本地队列
    scraperAddToAnalysisQueue(selectedScraperApp, 'analyzing');

    const appName = selectedScraperApp.name;
    const appId = selectedScraperApp.app_id;
    const platform = document.getElementById('modalAppPlatform').textContent;

    closeScraperAppModal();
    showToast(`⚡ 正在启动分析 "${appName}"...`, 'info');

    try {
        const response = await fetch('/api/analyze', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                app_id: appId,
                platform: platform
            })
        });

        const result = await response.json();

        if (result.success) {
            showToast(`✅ "${appName}" 分析已启动！`, 'success');
            setTimeout(() => {
                window.location.href = 'analyzer.html';
            }, 1000);
        } else {
            showToast(`❌ 启动分析失败: ${result.error || '未知错误'}`, 'error');
        }
    } catch (error) {
        console.error('启动分析失败:', error);
        showToast(`❌ 启动分析失败: ${error.message}`, 'error');
    }
}

// 表格排序
function sortAppsTable(column) {
    // 切换排序方向
    if (scraperCurrentSort.column === column) {
        scraperCurrentSort.order = scraperCurrentSort.order === 'asc' ? 'desc' : 'asc';
    } else {
        scraperCurrentSort.column = column;
        scraperCurrentSort.order = 'desc'; // 默认倒序（新到旧）
    }

    // 排序数据
    currentApps.sort((a, b) => {
        let valueA = a[column] || '';
        let valueB = b[column] || '';

        // 日期比较
        if (column === 'release_date') {
            // 将 YYYY/MM/DD 转换为时间戳进行比较
            const dateA = valueA ? new Date(valueA.replace(/\//g, '-')).getTime() : 0;
            const dateB = valueB ? new Date(valueB.replace(/\//g, '-')).getTime() : 0;
            return scraperCurrentSort.order === 'asc' ? dateA - dateB : dateB - dateA;
        }

        // 数字比较（用于排名）
        if (column === 'rank') {
            const numA = Number(valueA) || 0;
            const numB = Number(valueB) || 0;
            return scraperCurrentSort.order === 'asc' ? numA - numB : numB - numA;
        }

        // 默认字符串比较
        if (scraperCurrentSort.order === 'asc') {
            return valueA > valueB ? 1 : -1;
        } else {
            return valueA < valueB ? 1 : -1;
        }
    });

    // 重新渲染表格
    renderApps();
}

// 渲染应用列表
function renderApps() {
    const container = document.getElementById('dataContent');
    if (!container) {
        console.error('找不到 dataContent 元素');
        return;
    }
    
    if (currentApps.length === 0) {
        container.innerHTML = '<div class="no-data">暂无数据</div>';
        return;
    }
    
    const sortIndicator = (col) => {
        if (scraperCurrentSort.column === col) {
            return scraperCurrentSort.order === 'asc' ? ' ↑' : ' ↓';
        }
        return '';
    };

    const platformName = scraperCurrentPlatform === 'app_store' ? 'App Store' : 'Google Play';
    const categoryName = scraperCategories[scraperCurrentPlatform][scraperCurrentCategory];

    // 使用表格格式显示应用信息
    container.innerHTML = `
        <div class="data-table">
            <h4>${platformName} - ${categoryName} (${currentApps.length}个应用)</h4>
            <table>
                <thead>
                    <tr>
                        <th class="sortable" onclick="sortAppsTable('rank')">排名${sortIndicator('rank')}</th>
                        <th>图标</th>
                        <th>应用名称</th>
                        <th>开发者</th>
                        <th class="sortable" onclick="sortAppsTable('release_date')">上架时间${sortIndicator('release_date')}</th>
                        <th>评分</th>
                        <th>评价数</th>
                        <th>链接</th>
                    </tr>
                </thead>
                <tbody>
                    ${currentApps.map((app, index) => `
                        <tr>
                            <td><strong>#${app.rank}</strong></td>
                            <td><img src="${app.icon_url}" alt="${app.name}" class="app-icon" onerror="this.src='data:image/svg+xml,<svg xmlns=%22http://www.w3.org/2000/svg%22 width=%2240%22 height=%2240%22><rect width=%2240%22 height=%2240%22 fill=%22%23ddd%22/></svg>'"></td>
                            <td>
                                <div class="app-name clickable" onclick="showScraperAppModal(${index})">${app.name}</div>
                            </td>
                            <td><div class="app-developer">${app.developer || '-'}</div></td>
                            <td>${app.release_date || '-'}</td>
                            <td>${app.rating ? app.rating.toFixed(1) + ' ⭐' : '-'}</td>
                            <td>${app.rating_count ? app.rating_count.toLocaleString() : '-'}</td>
                            <td><a href="${app.store_url}" target="_blank">查看</a></td>
                        </tr>
                    `).join('')}
                </tbody>
            </table>
            <p style="text-align: center; padding: 15px; color: #6b7280;">共 ${currentApps.length} 个应用</p>
        </div>
    `;
}

// 更新平台Tab
function updatePlatformTabs() {
    document.querySelectorAll('.tabs:not(.category-tabs) .tab').forEach(tab => {
        tab.classList.toggle('active', tab.dataset.platform === scraperCurrentPlatform);
    });
}

// 更新分类Tab
function updateCategoryTabs() {
    const container = document.getElementById('categoryTabs');
    if (!container) {
        console.error('找不到 categoryTabs 元素');
        return;
    }
    container.innerHTML = Object.entries(scraperCategories[scraperCurrentPlatform]).map(([key, name]) => `
        <div class="tab ${key === scraperCurrentCategory ? 'active' : ''}" 
             data-category="${key}">
            ${name}
        </div>
    `).join('');
    
    // 重新绑定事件
    container.querySelectorAll('.tab').forEach(tab => {
        tab.addEventListener('click', () => {
            switchCategory(tab.dataset.category);
        });
    });
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
    // 只在scraper.html页面中执行初始化
    if (window.location.pathname.endsWith('scraper.html') || window.location.pathname.includes('scraper')) {
        scraperInit();
    }
});