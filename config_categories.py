"""
分类配置文件
定义需要监控的应用分类
"""

# ===== App Store 分类配置 =====
# App Store RSS API 分类 ID (genreId)
# 文档: https://rss.applemarketingtools.com/

APP_STORE_CATEGORIES = {
    "健康与健身": {
        "name_cn": "健康与健身",
        "name_en": "Health & Fitness",
        "genre_id": "6013",
        "url": "https://itunes.apple.com/us/rss/topfreeapplications/limit=100/genre=6013/json"
    },
    "社交网络": {
        "name_cn": "社交网络",
        "name_en": "Social Networking",
        "genre_id": "6005",
        "url": "https://itunes.apple.com/us/rss/topfreeapplications/limit=100/genre=6005/json"
    },
    "生活方式": {
        "name_cn": "生活方式",
        "name_en": "Lifestyle",
        "genre_id": "6012",
        "url": "https://itunes.apple.com/us/rss/topfreeapplications/limit=100/genre=6012/json"
    },
    "游戏": {
        "name_cn": "游戏",
        "name_en": "Games",
        "genre_id": "6014",
        "url": "https://itunes.apple.com/us/rss/topfreeapplications/limit=100/genre=6014/json"
    },
    "生产力": {
        "name_cn": "生产力",
        "name_en": "Productivity",
        "genre_id": "6007",
        "url": "https://itunes.apple.com/us/rss/topfreeapplications/limit=100/genre=6007/json"
    },
    "生活实用": {
        "name_cn": "生活实用",
        "name_en": "Utilities",
        "genre_id": "6002",
        "url": "https://itunes.apple.com/us/rss/topfreeapplications/limit=100/genre=6002/json"
    },
    "娱乐": {
        "name_cn": "娱乐",
        "name_en": "Entertainment",
        "genre_id": "6016",
        "url": "https://itunes.apple.com/us/rss/topfreeapplications/limit=100/genre=6016/json"
    },
    "照片&视频": {
        "name_cn": "照片&视频",
        "name_en": "Photo & Video",
        "genre_id": "6008",
        "url": "https://itunes.apple.com/us/rss/topfreeapplications/limit=100/genre=6008/json"
    },
    "旅行": {
        "name_cn": "旅行",
        "name_en": "Travel",
        "genre_id": "6003",
        "url": "https://itunes.apple.com/us/rss/topfreeapplications/limit=100/genre=6003/json"
    }
}

# ===== Google Play 分类配置 =====
# Google Play 分类 ID
# 文档: https://developers.google.com/android-publisher/api-ref/rest/v3/applications

GOOGLE_PLAY_CATEGORIES = {
    "健康与健身": {
        "name_cn": "健康与健身",
        "name_en": "Health & Fitness",
        "category_id": "HEALTH_AND_FITNESS"
    },
    "社交": {
        "name_cn": "社交",
        "name_en": "Social",
        "category_id": "SOCIAL"
    },
    "生活方式": {
        "name_cn": "生活方式",
        "name_en": "Lifestyle",
        "category_id": "LIFESTYLE"
    },
    "游戏": {
        "name_cn": "游戏",
        "name_en": "Game",
        "category_id": "GAME"
    },
    "约会": {
        "name_cn": "约会",
        "name_en": "Dating",
        "category_id": "DATING"
    },
    "工具": {
        "name_cn": "工具",
        "name_en": "Tools",
        "category_id": "TOOLS"
    },
    "旅行与当地": {
        "name_cn": "旅行与当地",
        "name_en": "Travel & Local",
        "category_id": "TRAVEL_AND_LOCAL"
    },
    "生产力": {
        "name_cn": "生产力",
        "name_en": "Productivity",
        "category_id": "PRODUCTIVITY"
    },
    "娱乐": {
        "name_cn": "娱乐",
        "name_en": "Entertainment",
        "category_id": "ENTERTAINMENT"
    }
}

# Google Play 配置
GOOGLE_PLAY_COUNTRY = "us"
GOOGLE_PLAY_COLLECTION = "TOP_FREE"  # 免费榜
