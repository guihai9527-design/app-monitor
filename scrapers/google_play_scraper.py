"""
Google Play 爬虫模块
使用 google-play-scraper 库获取榜单数据
"""

import os
import time
import urllib.request
from typing import List, Dict, Optional
from datetime import datetime
import logging

try:
    from google_play_scraper import search, app
    GOOGLE_PLAY_AVAILABLE = True
except ImportError:
    GOOGLE_PLAY_AVAILABLE = False
    print("警告: google-play-scraper 未安装，请运行: pip install google-play-scraper")


class GooglePlayScraper:
    """Google Play 爬虫类"""

    def __init__(self, country="us", collection="TOP_FREE", limit=100, delay=3,
                 timeout=30, proxy=None, logger=None):
        """
        初始化爬虫

        Args:
            country: 国家代码（默认 us）
            collection: 榜单类型（TOP_FREE / TOP_PAID / TRENDING）
            limit: 每个分类爬取数量（默认 100）
            delay: 请求延迟（秒）
            timeout: 请求超时时间（秒）
            proxy: 代理地址（如 http://127.0.0.1:7890），Google Play 需要代理
            logger: 日志记录器（可选）
        """
        if not GOOGLE_PLAY_AVAILABLE:
            raise ImportError("google-play-scraper 未安装")

        self.country = country
        self.collection = collection
        self.limit = limit
        self.delay = delay
        self.timeout = timeout
        self.logger = logger or logging.getLogger(__name__)

        # google-play-scraper 使用 urllib，需要单独配置代理
        self._proxy = proxy
        if self._proxy:
            self._setup_proxy()

    def _setup_proxy(self):
        """配置 urllib 代理（仅影响 Google Play 爬虫的 urllib 请求）"""
        proxy_handler = urllib.request.ProxyHandler({
            'https': self._proxy,
            'http': self._proxy
        })
        opener = urllib.request.build_opener(proxy_handler)
        urllib.request.install_opener(opener)
        self.logger.info(f"Google Play 代理已配置: {self._proxy}")

    def scrape_category(self, category_key: str, category_name: str) -> List[Dict]:
        """
        爬取指定分类的榜单

        Args:
            category_key: 分类键（如 HEALTH_AND_FITNESS）
            category_name: 分类名称（中文）

        Returns:
            List[Dict]: 应用列表
        """
        try:
            self.logger.info(f"正在爬取 Google Play - {category_name}...")

            # 每个分类使用多组关键词，合并结果以确保获取足够多的应用
            category_keywords = {
                "HEALTH_AND_FITNESS": ["fitness", "workout", "health", "running", "yoga", "meditation", "weight loss", "sleep", "nutrition", "exercise"],
                "SOCIAL": ["social", "chat", "messaging", "dating", "friends", "community", "video call", "live stream", "social media", "group chat"],
                "LIFESTYLE": ["lifestyle", "shopping", "food", "travel", "home", "fashion", "beauty", "design", "decor", "DIY"],
                "GAME": ["game", "puzzle", "racing", "adventure", "action", "RPG", "strategy", "casual", "simulation", "sports game"],
                "DATING": ["dating", "meet", "match", "romance", "singles", "love", "chat date", "relationship", "social date", "find friends"],
                "TOOLS": ["tools", "utility", "file manager", "cleaner", "browser", "keyboard", "launcher", "wallpaper", "security", "backup"],
                "TRAVEL_AND_LOCAL": ["travel", "local", "navigation", "maps", "hotel", "flight", "booking", "tourism", "restaurant", "transport"],
                "PRODUCTIVITY": ["productivity", "notes", "tasks", "calendar", "document", "scanner", "collaboration", "office", "email", "cloud"],
                "ENTERTAINMENT": ["entertainment", "streaming", "movies", "music", "podcast", "comics", "books", "TV shows", "videos", "anime"]
            }

            keywords_list = category_keywords.get(category_key, [category_name])
            all_apps = {}
            rank = 0

            for keyword in keywords_list[:10]:  # 最多10组关键词
                try:
                    apps_data = search(
                        keyword,
                        lang="en",
                        country=self.country,
                        n_hits=50
                    )
                    for app_data in (apps_data or []):
                        app_id = app_data.get("appId", "")
                        if app_id and app_id not in all_apps:
                            rank += 1
                            all_apps[app_id] = (rank, app_data)
                            if len(all_apps) >= self.limit:
                                break
                except Exception:
                    pass
                if len(all_apps) >= self.limit:
                    break

            if not all_apps:
                self.logger.warning(f"{category_name} 未获取到数据")
                return []

            apps = []
            timestamp = datetime.now().strftime("%Y-%m-%d %H:%M:%S")

            for rank, app_data in all_apps.values():
                app_info = self._parse_app_data(app_data, rank, category_name, timestamp)
                if app_info:
                    apps.append(app_info)

            # 获取详细信息（评分、评价数、上架时间）
            if apps:
                self.logger.info(f"正在获取 {category_name} 详细信息...")
                self._enrich_apps(apps)

            self.logger.info(f"{category_name} 爬取成功，共 {len(apps)} 个应用")
            time.sleep(self.delay)  # 延迟避免请求过快
            return apps

        except Exception as e:
            self.logger.error(f"{category_name} 爬取失败: {e}")
            return []

    def _parse_app_data(self, app_data: Dict, rank: int, category: str, timestamp: str) -> Optional[Dict]:
        """
        解析单个应用数据

        Args:
            app_data: 应用原始数据
            rank: 排名
            category: 分类名称
            timestamp: 时间戳

        Returns:
            Optional[Dict]: 应用数据字典
        """
        try:
            app_id = app_data.get("appId", "")
            name = app_data.get("title", "")
            developer = app_data.get("developer", "")
            icon_url = app_data.get("icon", "")
            store_url = f"https://play.google.com/store/apps/details?id={app_id}"
            score = app_data.get("score", 0)

            return {
                "platform": "Google Play",
                "category": category,
                "app_id": app_id,
                "rank": rank,
                "name": name,
                "developer": developer,
                "store_url": store_url,
                "icon_url": icon_url,
                "rating": score if score else 0,
                "rating_count": 0,
                "release_date": "",
                "timestamp": timestamp
            }

        except Exception as e:
            print(f"    解析应用数据失败: {e}")
            return None

    def _enrich_apps(self, apps: List[Dict]):
        """批量获取应用详细信息（评分、评价数、上架时间）"""
        fail_count = 0
        for i, app_info in enumerate(apps):
            app_id = app_info.get("app_id", "")
            if not app_id:
                continue
            for retry in range(3):
                try:
                    time.sleep(0.2)
                    detail = app(app_id, lang="en", country=self.country)
                    if detail:
                        app_info["rating"] = detail.get("score", 0) or 0
                        app_info["rating_count"] = detail.get("ratings", 0) or 0
                        if detail.get("released"):
                            try:
                                dt = datetime.strptime(detail.get("released"), "%b %d, %Y")
                                app_info["release_date"] = dt.strftime("%Y/%m/%d")
                            except ValueError:
                                app_info["release_date"] = detail.get("released")
                    break
                except Exception as e:
                    if retry == 2:
                        fail_count += 1
                        self.logger.warning(f"  获取详情失败 {app_id} (重试3次): {e}")
                    time.sleep(0.5)
        if fail_count:
            self.logger.warning(f"  共 {fail_count} 个应用获取详情失败")


if __name__ == "__main__":
    # 测试代码
    if GOOGLE_PLAY_AVAILABLE:
        scraper = GooglePlayScraper()
        apps = scraper.scrape_category("HEALTH_AND_FITNESS", "健康与健身")
        print(f"\n共获取 {len(apps)} 个应用")
        if apps:
            print(f"第一个应用: {apps[0]}")
    else:
        print("请先安装: pip install google-play-scraper")
