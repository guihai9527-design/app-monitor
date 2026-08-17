"""
环境变量加载工具
从项目根目录的 .env 文件加载环境变量（不覆盖已存在的变量）
"""

import os


def load_env(project_root: str = None) -> None:
    """
    从 .env 文件加载环境变量到 os.environ（不覆盖已存在的值）

    Args:
        project_root: 项目根目录，默认为本文件的上上级目录
    """
    if project_root is None:
        project_root = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))

    env_path = os.path.join(project_root, '.env')

    if not os.path.exists(env_path):
        return

    try:
        with open(env_path, 'r', encoding='utf-8') as f:
            for line in f:
                line = line.strip()
                # 跳过空行和注释
                if not line or line.startswith('#') or '=' not in line:
                    continue
                key, _, value = line.partition('=')
                key = key.strip()
                value = value.strip()
                # 去除可选的引号
                if len(value) >= 2 and value[0] == value[-1] and value[0] in ('"', "'"):
                    value = value[1:-1]
                # 不覆盖已存在且非空的环境变量（空值或仅空白则覆盖）
                existing = os.environ.get(key)
                if key and (existing is None or existing.strip() == ''):
                    os.environ[key] = value
    except Exception as e:
        print(f"⚠️  读取 .env 文件失败: {e}")
