// 公共函数

// ============================================================
// API 配置
// ============================================================
// 本应用的 API 服务运行在本地，所有 API 请求统一发到 localhost:8000
const API_BASE = 'http://localhost:8000';

// 检测是否从 GitHub Pages 等非本地地址访问
function isRemoteHost() {
    const host = window.location.hostname;
    return host !== 'localhost' && host !== '127.0.0.1' && !host.startsWith('192.168.');
}

// 如果从远程地址访问，页面加载时显示醒目提示
if (isRemoteHost()) {
    document.addEventListener('DOMContentLoaded', function() {
        const banner = document.createElement('div');
        banner.style.cssText = `
            position: fixed; top: 0; left: 0; right: 0; z-index: 99999;
            background: #dc2626; color: white; padding: 14px 20px;
            text-align: center; font-size: 15px; font-weight: 600;
            box-shadow: 0 2px 8px rgba(0,0,0,0.3);
        `;
        banner.innerHTML = '⚠️ 请通过 <code style="background:rgba(255,255,255,0.2);padding:2px 8px;border-radius:4px;">http://localhost:8000/web/</code> 访问本应用，GitHub Pages 无法连接本地 API 服务';
        document.body.insertBefore(banner, document.body.firstChild);
        // 给 body 加 padding-top 避免被 banner 遮挡
        document.body.style.paddingTop = '50px';
    });
}

// 获取所有可用的日期
async function getAvailableDates() {
    try {
        // 使用 API 获取实际存在的日期
        const response = await fetch(API_BASE + '/api/dates');
        if (response.ok) {
            const contentType = response.headers.get('content-type');
            if (contentType && contentType.includes('application/json')) {
                const data = await response.json();
                return data.dates || [];
            }
        }
        return [];
    } catch (error) {
        console.error('获取日期列表失败:', error);
        return [];
    }
}

// 格式化日期显示
function formatDate(dateStr) {
    const date = new Date(dateStr);
    const month = date.getMonth() + 1;
    const day = date.getDate();
    const weekdays = ['日', '一', '二', '三', '四', '五', '六'];
    const weekday = weekdays[date.getDay()];
    return `${month}月${day}日 (${weekday})`;
}

// 加载JSON数据
async function loadJSON(path) {
    try {
        const response = await fetch(path);
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
        console.error('加载数据失败:', path, error);
        return null;
    }
}

// 渲染日期导航
function renderDateNav(dates, currentDate, onDateClick) {
    const dateList = document.querySelector('.date-list');
    if (!dateList) return;

    dateList.innerHTML = dates.map(date => `
        <li class="date-item ${date === currentDate ? 'active' : ''}"
            onclick="window.location.href='?date=${date}'">
            ${formatDate(date)}
            ${date === currentDate ? ' ✓' : ''}
        </li>
    `).join('');
}

// 获取URL参数
function getQueryParam(param) {
    const params = new URLSearchParams(window.location.search);
    return params.get(param);
}

// 获取今天的日期字符串
function getTodayString() {
    return new Date().toISOString().split('T')[0];
}

// 显示Toast提示消息
function showToast(message, type = 'info') {
    // 检查是否已存在toast容器
    let toastContainer = document.querySelector('.toast-container');
    
    if (!toastContainer) {
        // 创建toast容器
        toastContainer = document.createElement('div');
        toastContainer.className = 'toast-container';
        toastContainer.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            z-index: 9999;
            max-width: 300px;
        `;
        document.body.appendChild(toastContainer);
    }

    // 创建toast元素
    const toast = document.createElement('div');
    toast.className = `toast toast-${type}`;
    toast.textContent = message;
    toast.style.cssText = `
        background: ${type === 'success' ? '#10b981' : type === 'error' ? '#ef4444' : '#3b82f6'};
        color: white;
        padding: 12px 20px;
        border-radius: 8px;
        margin-bottom: 10px;
        box-shadow: 0 4px 6px rgba(0,0,0,0.1);
        animation: slideIn 0.3s ease;
    `;

    toastContainer.appendChild(toast);

    // 3秒后移除
    setTimeout(() => {
        toast.style.animation = 'slideOut 0.3s ease';
        setTimeout(() => {
            toast.remove();
        }, 300);
    }, 3000);
}
