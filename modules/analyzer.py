"""
模块3：AI智能分析

功能：使用Claude API对新上榜产品进行深度分析
"""

import os
import sys
import json
import argparse
from datetime import datetime
from typing import Dict, List, Optional

# 添加项目根目录到sys.path
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

# 加载 .env 环境变量（API Key 等），须在 import anthropic 之前
from utils.env_loader import load_env
load_env()

from utils.logger import setup_logger
from utils.data_storage import save_to_json, load_from_json
import anthropic


# 配置
DATA_DIR = os.path.join(os.path.dirname(os.path.dirname(__file__)), "data")
LOG_DIR = os.path.join(os.path.dirname(os.path.dirname(__file__)), "logs")
LOG_FILE = os.path.join(LOG_DIR, "analyzer.log")

# 分析使用的模型（可通过 .env 的 ANALYZER_MODEL 覆盖）
MODEL = os.environ.get("ANALYZER_MODEL", "deepseek-v4-pro")

# 确保日志目录存在
os.makedirs(LOG_DIR, exist_ok=True)
os.makedirs(DATA_DIR, exist_ok=True)

# 初始化日志
logger = setup_logger('analyzer', LOG_FILE)

# 启动时立即记录
logger.info("=" * 60)
logger.info("analyzer.py 启动")
logger.info(f"工作目录: {os.getcwd()}")
logger.info(f"脚本位置: {__file__}")
logger.info(f"数据目录: {DATA_DIR}")
logger.info(f"日志文件: {LOG_FILE}")
logger.info("=" * 60)


def get_analysis_prompt(app: Dict) -> str:
    """
    生成AI分析的Prompt

    Args:
        app: 应用信息

    Returns:
        str: Prompt文本
    """
    prompt = f"""请对以下新上榜应用进行深度分析：

**应用信息**：
- 应用名称：{app.get('name')}
- 平台：{app.get('platform')}
- 分类：{app.get('category')}
- 开发者：{app.get('developer')}
- 排名：{app.get('rank')}
- 商店链接：{app.get('store_url')}

请按照以下5个维度进行分析，并以Markdown格式输出：

## 1. 基本信息分析
- **产品介绍**：用一句话介绍这是一款什么产品（核心功能和价值）
- 产品发布时间和上线时长
- 主要市场和地区
- 开发商背景和其他产品
- 产品数据（评分、评论数等可推测的信息）

## 2. 投放素材分析
- 主要推广渠道分析
- 推广素材方向（视频、图片、文案风格）
- 目标用户画像

## 3. 产品功能分析
- 核心功能列表
- 创新点和差异化优势
- 用户体验亮点

## 4. 用户评价分析
- 正面评价的关键点（用户喜爱的功能）
- 负面评价的常见问题
- 改进建议

## 5. 思考与总结
- 整体评估（优劣势总结）
- 成功因素分析（为什么能快速上榜）
- 可借鉴之处（对竞品或自己产品的启发）
- 市场机会洞察

**注意**：
1. 产品介绍必须简洁明了，一句话概括产品的核心价值和定位
2. 请基于应用名称、分类和开发者信息进行合理推测
3. 保持分析简洁，每个维度控制在200字以内
4. 使用Markdown格式，清晰分段
5. 突出关键信息，使用列表和加粗
"""
    return prompt


def analyze_app(app: Dict) -> Optional[Dict]:
    """
    使用Claude API分析单个应用

    Args:
        app: 应用信息

    Returns:
        Dict: 分析结果，包含markdown和结构化数据
    """
    try:
        logger.info(f"=" * 60)
        logger.info(f"开始分析应用: {app.get('name')}")
        logger.info(f"  App ID: {app.get('app_id')}")
        logger.info(f"  Platform: {app.get('platform')}")
        logger.info(f"  Category: {app.get('category')}")
        logger.info(f"=" * 60)

        # 初始化Anthropic客户端
        logger.info("初始化Anthropic客户端...")
        try:
            client = anthropic.Anthropic()
            logger.info("✓ 客户端初始化成功")
        except Exception as e:
            logger.error(f"✗ 客户端初始化失败: {e}")
            raise

        # 生成prompt
        logger.info("生成分析Prompt...")
        prompt = get_analysis_prompt(app)
        logger.info(f"✓ Prompt长度: {len(prompt)} 字符")

        # 调用Claude API
        logger.info("调用Claude API...")
        logger.info(f"  模型: {MODEL}")
        logger.info(f"  最大Token: 4000")

        try:
            message = client.messages.create(
                model=MODEL,
                max_tokens=4000,
                messages=[
                    {"role": "user", "content": prompt}
                ]
            )
            logger.info("✓ API调用成功")
        except anthropic.PermissionDeniedError as e:
            logger.error(f"✗ API权限错误: {e}")
            logger.error(f"  错误类型: PermissionDeniedError (403)")
            logger.error(f"  可能原因:")
            logger.error(f"    1. API Key 没有访问 {MODEL} 模型的权限")
            logger.error(f"    2. API Key 已过期或被禁用")
            logger.error(f"    3. 账户余额不足")
            logger.error(f"  建议: 请检查 Anthropic 控制台的 API Key 权限设置")
            raise
        except Exception as e:
            logger.error(f"✗ API调用失败: {e}")
            raise

        # 提取分析结果（新版模型可能返回 ThinkingBlock，需拼接所有文本块）
        text_parts = [
            block.text for block in message.content
            if getattr(block, 'type', None) == 'text'
        ]
        analysis_markdown = '\n'.join(text_parts)
        logger.info(f"✓ 获得分析结果，长度: {len(analysis_markdown)} 字符")

        # Token使用统计
        logger.info(f"Token使用:")
        logger.info(f"  输入: {message.usage.input_tokens}")
        logger.info(f"  输出: {message.usage.output_tokens}")
        logger.info(f"  总计: {message.usage.input_tokens + message.usage.output_tokens}")

        # 构建结果
        result = {
            "app_id": app.get('app_id'),
            "name": app.get('name'),
            "platform": app.get('platform'),
            "category": app.get('category'),
            "developer": app.get('developer'),
            "rank": app.get('rank'),
            "store_url": app.get('store_url'),
            "icon_url": app.get('icon_url'),
            "analysis_date": datetime.now().strftime("%Y-%m-%d %H:%M:%S"),
            "analysis_markdown": analysis_markdown,
            "tokens_used": {
                "input": message.usage.input_tokens,
                "output": message.usage.output_tokens
            }
        }

        logger.info(f"✓ 分析完成: {app.get('name')}")
        return result

    except Exception as e:
        logger.error(f"=" * 60)
        logger.error(f"✗ 分析应用失败: {app.get('name')}")
        logger.error(f"错误类型: {type(e).__name__}")
        logger.error(f"错误信息: {str(e)}")
        logger.error(f"=" * 60)
        import traceback
        logger.error(traceback.format_exc())
        return None


def save_analysis_result(app_id: str, result: Dict, date_str: str):
    """
    保存分析结果

    Args:
        app_id: 应用ID
        result: 分析结果
        date_str: 日期字符串
    """
    # 保存JSON格式
    analysis_dir = os.path.join(DATA_DIR, "analysis", date_str)
    os.makedirs(analysis_dir, exist_ok=True)

    # 保存JSON
    json_path = os.path.join(analysis_dir, f"{app_id}.json")
    save_to_json(result, json_path)
    logger.info(f"已保存JSON: {json_path}")

    # 保存Markdown格式
    md_path = os.path.join(analysis_dir, f"{app_id}.md")
    with open(md_path, 'w', encoding='utf-8') as f:
        f.write(f"# {result['name']}\n\n")
        f.write(f"**平台**: {result['platform']} | ")
        f.write(f"**分类**: {result['category']} | ")
        f.write(f"**排名**: #{result['rank']}\n\n")
        f.write(f"**开发者**: {result['developer']}\n\n")
        f.write(f"**商店链接**: {result['store_url']}\n\n")
        f.write(f"**分析时间**: {result['analysis_date']}\n\n")
        f.write("---\n\n")
        f.write(result['analysis_markdown'])

    logger.info(f"已保存Markdown: {md_path}")




def find_app_in_new_apps(app_id: str, platform: str) -> Optional[Dict]:
    """
    在new_apps目录中查找指定应用的完整信息

    Args:
        app_id: 应用ID
        platform: 平台

    Returns:
        Dict: 应用完整信息，如果未找到则返回None
    """
    new_apps_dir = os.path.join(DATA_DIR, "new_apps")

    if not os.path.exists(new_apps_dir):
        return None

    # 遍历new_apps目录下的JSON文件
    for filename in sorted(os.listdir(new_apps_dir), reverse=True):
        if not filename.endswith('.json'):
            continue

        file_path = os.path.join(new_apps_dir, filename)

        try:
            with open(file_path, 'r', encoding='utf-8') as f:
                data = json.load(f)

            new_apps = data.get('new_apps', [])

            for app in new_apps:
                if app.get('app_id') == app_id and app.get('platform') == platform:
                    logger.info(f"找到应用信息: {filename}")
                    return app

        except Exception as e:
            logger.error(f"读取文件失败 {filename}: {e}")

    return None






def main():
    """主函数 - 只支持单个应用分析"""
    parser = argparse.ArgumentParser(description='AI智能分析模块 - 单应用分析')
    parser.add_argument('--app-id', type=str, required=True, help='应用ID（必需）')
    parser.add_argument('--platform', type=str, required=True, help='平台名称（必需）')
    parser.add_argument('--date', type=str, help='指定日期（可选，默认今天）')

    args = parser.parse_args()

    logger.info("=" * 60)
    logger.info("🤖 AI智能分析 - 单应用模式")
    logger.info("=" * 60)
    logger.info(f"App ID: {args.app_id}")
    logger.info(f"Platform: {args.platform}")
    logger.info("=" * 60)

    date_str = args.date or datetime.now().strftime("%Y-%m-%d")

    # 从new_apps目录查找应用的完整信息
    app = find_app_in_new_apps(args.app_id, args.platform)

    if not app:
        # 如果找不到，创建临时应用对象（用于测试）
        logger.warning(f"⚠️  未在new_apps目录找到应用信息，使用基本信息")
        app = {
            'app_id': args.app_id,
            'name': args.app_id.split('.')[-1].title(),
            'platform': args.platform,
            'category': 'Unknown',
            'developer': 'Unknown',
            'rank': 0,
            'store_url': '',
            'icon_url': ''
        }
    else:
        logger.info(f"✓ 找到应用完整信息")
        logger.info(f"  名称: {app.get('name')}")
        logger.info(f"  开发者: {app.get('developer')}")
        logger.info(f"  分类: {app.get('category')}")

    # 执行分析
    result = analyze_app(app)

    if result:
        save_analysis_result(args.app_id, result, date_str)
        logger.info("=" * 60)
        logger.info(f"✓ 分析成功: {app.get('name')}")
        logger.info(f"  保存位置: data/analysis/{date_str}/{args.app_id}.json")
        logger.info("=" * 60)
        sys.exit(0)
    else:
        logger.error("=" * 60)
        logger.error(f"✗ 分析失败: {app.get('name')}")
        logger.error("=" * 60)
        sys.exit(1)


if __name__ == "__main__":
    main()
