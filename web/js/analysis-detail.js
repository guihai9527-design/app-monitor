// 分析详情页面JavaScript

// 获取URL参数
function getUrlParams() {
    const params = new URLSearchParams(window.location.search);
    return {
        app_id: params.get('app_id'),
        platform: params.get('platform'),
        date: params.get('date') || getTodayString()
    };
}

// 全局变量
let refreshInterval = null;
let currentParams = null;

// 初始化页面
async function init() {
    const params = getUrlParams();
    currentParams = params;

    if (!params.app_id || !params.platform) {
        showError('缺少必要参数');
        return;
    }

    // 加载分析结果
    await loadAnalysisResult(params.app_id, params.platform, params.date);
}

// 加载分析结果
async function loadAnalysisResult(appId, platform, date) {
    try {
        // 通过API或直接文件加载（两种方式都支持）
        let response = await fetch(API_BASE + `/api/analysis/${appId}?platform=${encodeURIComponent(platform)}&date=${date}`);

        // 如果API失败，尝试直接读取文件
        if (!response.ok) {
            response = await fetch(`../data/analysis/${date}/${appId}.json`);
        }

        if (!response.ok) {
            if (response.status === 404) {
                // 分析结果不存在，可能正在分析中
                showAnalyzingState(appId, platform);
            } else {
                showError('加载失败，请稍后重试');
            }
            return;
        }

        const data = await response.json();

        // 清除刷新定时器（如果存在）
        if (refreshInterval) {
            clearInterval(refreshInterval);
            refreshInterval = null;
        }

        // 显示内容
        displayAnalysisResult(data);

    } catch (error) {
        console.error('加载分析结果失败:', error);
        // 可能正在分析中
        showAnalyzingState(appId, platform);
    }
}

// 显示分析中状态
function showAnalyzingState(appId, platform) {
    // 隐藏加载状态
    document.getElementById('loadingState').style.display = 'none';

    // 显示内容区
    document.getElementById('contentArea').style.display = 'block';

    // 从localStorage获取应用信息
    const queue = JSON.parse(localStorage.getItem('analysisQueue') || '[]');
    const app = queue.find(item => item.app_id === appId && item.platform === platform);

    if (app) {
        // 填充应用信息
        document.getElementById('appIcon').src = app.icon_url || '';
        document.getElementById('appIcon').alt = app.name;
        document.getElementById('appName').textContent = app.name;
        document.getElementById('appPlatform').textContent = app.platform;
        document.getElementById('appCategory').textContent = app.category;
        document.getElementById('appRank').textContent = `排名 #${app.rank}`;
        document.getElementById('appDeveloper').textContent = app.developer;
        document.getElementById('storeLink').href = app.store_url;

        // 分析时间显示为"正在分析中..."
        document.getElementById('analysisDate').textContent = '正在分析中...';
        document.getElementById('tokensUsed').textContent = '-';
    }

    // 显示分析中提示
    const markdownContent = document.getElementById('markdownContent');
    markdownContent.innerHTML = `
        <div style="text-align: center; padding: 60px 20px;">
            <div style="font-size: 4em; margin-bottom: 20px;">🤖</div>
            <h2 style="color: #3b82f6; margin-bottom: 15px;" id="analyzingTitle">AI正在分析中...</h2>
            <p style="color: #6b7280; font-size: 1.1em; margin-bottom: 30px;">
                正在使用AI进行深度分析<br>
                预计需要1-2分钟，请稍候
            </p>
            <button id="startAnalyzeBtn" class="btn btn-primary" onclick="startAnalysis()" style="display: none; margin: 0 auto 30px;">
                🚀 开始分析
            </button>
            <div style="margin: 30px auto; width: 50px; height: 50px; border: 4px solid #e5e7eb; border-top-color: #3b82f6; border-radius: 50%; animation: spin 1s linear infinite;"></div>
            <p style="color: #9ca3af; font-size: 0.95em; margin-top: 30px;">
                页面会每5秒自动刷新，分析完成后立即显示结果
            </p>
        </div>
        <style>
            @keyframes spin {
                to { transform: rotate(360deg); }
            }
        </style>
    `;

    // 如果应用不在分析队列中（尚未触发分析），显示"开始分析"按钮
    const appInQueue = queue.some(item => item.app_id === appId && item.platform === platform);
    if (!appInQueue) {
        document.getElementById('analyzingTitle').textContent = '该应用尚未分析';
        document.getElementById('startAnalyzeBtn').style.display = 'inline-block';
    }

    // 启动自动刷新（每5秒检查一次）
    if (!refreshInterval) {
        refreshInterval = setInterval(() => {
            console.log('检查分析是否完成...');
            loadAnalysisResult(currentParams.app_id, currentParams.platform, currentParams.date);
        }, 5000);
    }
}

// 从详情页直接触发分析
async function startAnalysis() {
    const params = currentParams;
    if (!params.app_id || !params.platform) return;

    const btn = document.getElementById('startAnalyzeBtn');
    btn.disabled = true;
    btn.textContent = '⏳ 正在启动...';

    try {
        const response = await fetch(API_BASE + '/api/analyze', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                app_id: params.app_id,
                platform: params.platform
            })
        });

        const data = await response.json();
        if (response.ok) {
            showToast('✓ 分析任务已启动', 'success');
            // 切换为"分析中"状态并继续轮询
            btn.style.display = 'none';
            document.getElementById('analyzingTitle').textContent = 'AI正在分析中...';
        } else {
            showToast(`✗ 启动分析失败: ${data.error || '未知错误'}`, 'error');
            btn.disabled = false;
            btn.textContent = '🚀 开始分析';
        }
    } catch (error) {
        console.error('启动分析失败:', error);
        showToast(`✗ 启动分析失败: ${error.message}`, 'error');
        btn.disabled = false;
        btn.textContent = '🚀 开始分析';
    }
}

// 显示分析结果
function displayAnalysisResult(data) {
    // 隐藏加载状态
    document.getElementById('loadingState').style.display = 'none';

    // 显示内容区
    document.getElementById('contentArea').style.display = 'block';

    // 填充应用信息
    document.getElementById('appIcon').src = data.icon_url || '';
    document.getElementById('appIcon').alt = data.name;
    document.getElementById('appName').textContent = data.name;
    document.getElementById('appPlatform').textContent = data.platform;
    document.getElementById('appCategory').textContent = data.category;
    document.getElementById('appRank').textContent = `排名 #${data.rank}`;
    document.getElementById('appDeveloper').textContent = data.developer;
    document.getElementById('storeLink').href = data.store_url;

    // 分析时间
    document.getElementById('analysisDate').textContent = data.analysis_date;

    // Token使用
    if (data.tokens_used) {
        const totalTokens = data.tokens_used.input + data.tokens_used.output;
        document.getElementById('tokensUsed').textContent = `${totalTokens} (输入: ${data.tokens_used.input}, 输出: ${data.tokens_used.output})`;
    }

    // 渲染Markdown内容
    if (data.analysis_markdown) {
        // 配置marked选项
        marked.setOptions({
            breaks: true,
            gfm: true,
            headerIds: true,
            mangle: false
        });

        // 渲染Markdown
        const html = marked.parse(data.analysis_markdown);
        document.getElementById('markdownContent').innerHTML = html;

        // 如果有highlight.js，高亮代码块
        if (typeof hljs !== 'undefined') {
            document.querySelectorAll('pre code').forEach((block) => {
                hljs.highlightBlock(block);
            });
        }

        // 如果是从"分析中"状态刚完成的，显示提示
        if (refreshInterval) {
            showToast('✓ 分析完成！', 'success');
            clearInterval(refreshInterval);
            refreshInterval = null;
        }
    }
}

// 显示错误
function showError(message) {
    document.getElementById('loadingState').style.display = 'none';
    document.getElementById('errorState').style.display = 'block';
    document.getElementById('errorMessage').textContent = message;
}

// 复制分析内容
function copyAnalysis() {
    const markdownContent = document.getElementById('markdownContent');
    const text = markdownContent.innerText;

    // 使用Clipboard API
    if (navigator.clipboard) {
        navigator.clipboard.writeText(text).then(() => {
            showToast('✓ 已复制到剪贴板', 'success');
        }).catch(err => {
            console.error('复制失败:', err);
            showToast('✗ 复制失败', 'error');
        });
    } else {
        // 降级方案
        const textarea = document.createElement('textarea');
        textarea.value = text;
        textarea.style.position = 'fixed';
        textarea.style.opacity = '0';
        document.body.appendChild(textarea);
        textarea.select();
        try {
            document.execCommand('copy');
            showToast('✓ 已复制到剪贴板', 'success');
        } catch (err) {
            console.error('复制失败:', err);
            showToast('✗ 复制失败', 'error');
        }
        document.body.removeChild(textarea);
    }
}

// 显示Toast提示
function showToast(message, type = 'info') {
    const toast = document.createElement('div');
    toast.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        background: ${type === 'success' ? 'linear-gradient(135deg, #10b981 0%, #059669 100%)' :
                     type === 'error' ? 'linear-gradient(135deg, #ef4444 0%, #dc2626 100%)' :
                     'linear-gradient(135deg, #3b82f6 0%, #2563eb 100%)'};
        color: white;
        padding: 16px 24px;
        border-radius: 12px;
        box-shadow: 0 10px 30px rgba(0, 0, 0, 0.3);
        z-index: 10000;
        font-weight: 600;
        animation: slideInRight 0.3s ease;
    `;
    toast.textContent = message;

    const style = document.createElement('style');
    style.textContent = `
        @keyframes slideInRight {
            from { transform: translateX(400px); opacity: 0; }
            to { transform: translateX(0); opacity: 1; }
        }
        @keyframes slideOutRight {
            from { transform: translateX(0); opacity: 1; }
            to { transform: translateX(400px); opacity: 0; }
        }
    `;
    document.head.appendChild(style);

    document.body.appendChild(toast);

    setTimeout(() => {
        toast.style.animation = 'slideOutRight 0.3s ease';
        setTimeout(() => {
            document.body.removeChild(toast);
        }, 300);
    }, 3000);
}

// 页面加载完成后执行
document.addEventListener('DOMContentLoaded', init);

// 页面卸载时清除定时器
window.addEventListener('beforeunload', () => {
    if (refreshInterval) {
        clearInterval(refreshInterval);
    }
});
