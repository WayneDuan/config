import os
import re
import urllib.request

# URLs from TV.json
URLS = {
    'czzy.js': 'https://raw.githubusercontent.com/Yswag/xptv-extensions/refs/heads/main/js/czzy.js',
    'fmovies.js': 'https://raw.githubusercontent.com/Yswag/xptv-extensions/refs/heads/main/js/fmovies.js',
    'bdys.js': 'https://raw.githubusercontent.com/fangkuia/XPTV/refs/heads/main/js/bdys.js',
    'ole.js': 'https://raw.githubusercontent.com/fangkuia/XPTV/refs/heads/main/js/ole.js',
    'zxzj.js': 'https://raw.githubusercontent.com/fangkuia/XPTV/refs/heads/main/js/zxzj.js',
    'libvio.js': 'https://raw.githubusercontent.com/fangkuia/XPTV/refs/heads/main/js/libvio.js',
    'ai.js': 'https://raw.githubusercontent.com/fangkuia/XPTV/refs/heads/main/js/ai.js',
    'duboku.js': 'https://raw.githubusercontent.com/fangkuia/XPTV/refs/heads/main/js/duboku.js',
    'agedm.js': 'https://gist.githubusercontent.com/occupy-pluto/e3a7bb98d5027d0f6dfa85fc2ac11a78/raw/6deb0475d295ac867ccb9c7cf3b1fb212a77abd7/agedm.js',
    '4kav.js': 'https://raw.githubusercontent.com/Yswag/xptv-extensions/main/js/4kav.js',
    'hjkk.js': 'https://raw.githubusercontent.com/Yswag/xptv-extensions/main/js/hjkk.js',
    'jpyy.js': 'https://raw.githubusercontent.com/Yswag/xptv-extensions/main/js/jpyy.js',
    'saohuo.js': 'https://raw.githubusercontent.com/Yswag/xptv-extensions/main/js/saohuo.js',
    'novipnoad.js': 'https://raw.githubusercontent.com/Yswag/xptv-extensions/main/js/novipnoad.js',
    'xingya.js': 'https://raw.githubusercontent.com/Yswag/xptv-extensions/main/js/xingya.js',
    'gzys.js': 'https://raw.githubusercontent.com/Yswag/xptv-extensions/main/js/gzys.js',
    'iyftv.js': 'https://raw.githubusercontent.com/Yswag/xptv-extensions/main/js/iyftv.js',
    'ystt.js': 'https://raw.githubusercontent.com/fangkuia/XPTV/refs/heads/main/js/ystt.js',
    'apple.js': 'https://raw.githubusercontent.com/Yswag/xptv-extensions/main/js/apple.js',
    'aowu.js': 'https://raw.githubusercontent.com/Yswag/xptv-extensions/main/js/aowu.js',
    'xiaohys.js': 'https://raw.githubusercontent.com/Yswag/xptv-extensions/main/js/xiaohys.js',
    'jianpian.js': 'https://raw.githubusercontent.com/Yswag/xptv-extensions/refs/heads/main/js/jianpian.js',
    'rrmj.js': 'https://raw.githubusercontent.com/Yswag/xptv-extensions/refs/heads/main/js/rrmj.js',
    'anime1.js': 'https://raw.githubusercontent.com/Yswag/xptv-extensions/refs/heads/main/js/anime1.js',
    'wwgz.js': 'https://raw.githubusercontent.com/Yswag/xptv-extensions/refs/heads/main/js/wwgz.js',
    '7sefun.js': 'https://raw.githubusercontent.com/Yswag/xptv-extensions/refs/heads/main/js/7sefun.js',
    'symx.js': 'https://raw.githubusercontent.com/Yswag/xptv-extensions/refs/heads/main/js/symx.js',
}

ADAPTER_WITH_SEARCH = '''
// === hkdoll.js compatible API ===

async function getWebsiteInfo() {
    return {
        name: appConfig.title,
        description: appConfig.title,
        icon: SITE + '/favicon.ico',
        homepage: SITE,
    };
}

async function getCategories() {
    return (appConfig.tabs || []).map((tab, index) => ({
        id: String(index + 1),
        name: tab.name,
        ext: tab.ext,
    }));
}

async function getVideosByCategory(categoryId, page) {
    const categories = await getCategories();
    const category = categories.find((item) => item.id === String(categoryId));
    if (!category) return [];
    const extObj = { ...category.ext, page: page || 1 };
    const raw = await getCards(JSON.stringify(extObj));
    const result = JSON.parse(raw);
    return (result.list || []).map(item => ({
        id: item.vod_id,
        title: item.vod_name,
        cover: item.vod_pic,
        url: item.vod_id,
        description: item.vod_remarks || '',
        createTime: Date.now(),
    }));
}

async function getVideoList(page, categoryUrl) {
    const extObj = { url: categoryUrl, page: page || 1 };
    const raw = await getCards(JSON.stringify(extObj));
    const result = JSON.parse(raw);
    return (result.list || []).map(item => ({
        id: item.vod_id,
        title: item.vod_name,
        cover: item.vod_pic,
        url: item.vod_id,
        description: item.vod_remarks || '',
        createTime: Date.now(),
    }));
}

async function getVideoDetail(videoId) {
    const extObj = { url: videoId, id: videoId };
    const raw = await getTracks(JSON.stringify(extObj));
    const result = JSON.parse(raw);
    const tracks = result.list || [];
    const resolutions = [];
    tracks.forEach(track => {
        const urls = Array.isArray(track.urls) ? track.urls : [track.urls];
        urls.forEach((url, i) => {
            resolutions.push({
                id: String(track.vod_name || track.name || '') + (i > 0 ? '_' + i : ''),
                name: String(track.vod_name || track.name || ''),
                url: url,
            });
        });
    });
    return {
        id: videoId,
        title: tracks[0] ? String(tracks[0].vod_name || tracks[0].name || '') : '',
        cover: '',
        description: '',
        resolutions,
    };
}

async function search(keyword) {
    const ext = JSON.stringify({ text: keyword, page: 1 });
    const raw = await _xptvSearch(ext);
    const result = JSON.parse(raw);
    return (result.list || []).map(item => ({
        id: item.vod_id,
        title: item.vod_name,
        cover: item.vod_pic,
        url: item.vod_id,
        description: item.vod_remarks || '',
        createTime: Date.now(),
    }));
}

module.exports = {
    getWebsiteInfo,
    getCategories,
    getVideosByCategory,
    getVideoList,
    getVideoDetail,
    search,
};
'''

ADAPTER_NO_SEARCH = '''
// === hkdoll.js compatible API ===

async function getWebsiteInfo() {
    return {
        name: appConfig.title,
        description: appConfig.title,
        icon: SITE + '/favicon.ico',
        homepage: SITE,
    };
}

async function getCategories() {
    return (appConfig.tabs || []).map((tab, index) => ({
        id: String(index + 1),
        name: tab.name,
        ext: tab.ext,
    }));
}

async function getVideosByCategory(categoryId, page) {
    const categories = await getCategories();
    const category = categories.find((item) => item.id === String(categoryId));
    if (!category) return [];
    const extObj = { ...category.ext, page: page || 1 };
    const raw = await getCards(JSON.stringify(extObj));
    const result = JSON.parse(raw);
    return (result.list || []).map(item => ({
        id: item.vod_id,
        title: item.vod_name,
        cover: item.vod_pic,
        url: item.vod_id,
        description: item.vod_remarks || '',
        createTime: Date.now(),
    }));
}

async function getVideoList(page, categoryUrl) {
    const extObj = { url: categoryUrl, page: page || 1 };
    const raw = await getCards(JSON.stringify(extObj));
    const result = JSON.parse(raw);
    return (result.list || []).map(item => ({
        id: item.vod_id,
        title: item.vod_name,
        cover: item.vod_pic,
        url: item.vod_id,
        description: item.vod_remarks || '',
        createTime: Date.now(),
    }));
}

async function getVideoDetail(videoId) {
    const extObj = { url: videoId, id: videoId };
    const raw = await getTracks(JSON.stringify(extObj));
    const result = JSON.parse(raw);
    const tracks = result.list || [];
    const resolutions = [];
    tracks.forEach(track => {
        const urls = Array.isArray(track.urls) ? track.urls : [track.urls];
        urls.forEach((url, i) => {
            resolutions.push({
                id: String(track.vod_name || track.name || '') + (i > 0 ? '_' + i : ''),
                name: String(track.vod_name || track.name || ''),
                url: url,
            });
        });
    });
    return {
        id: videoId,
        title: tracks[0] ? String(tracks[0].vod_name || tracks[0].name || '') : '',
        cover: '',
        description: '',
        resolutions,
    };
}

async function search(keyword) {
    return [];
}

module.exports = {
    getWebsiteInfo,
    getCategories,
    getVideosByCategory,
    getVideoList,
    getVideoDetail,
    search,
};
'''

os.makedirs('converted', exist_ok=True)

for filename, url in sorted(URLS.items()):
    print(f"Downloading {filename}...")
    try:
        req = urllib.request.Request(url, headers={'User-Agent': 'Mozilla/5.0'})
        with urllib.request.urlopen(req, timeout=30) as resp:
            content = resp.read().decode('utf-8')
    except Exception as e:
        print(f"  ERROR downloading: {e}")
        continue
    
    # Check if file has SITE constant, add if missing
    has_site = bool(re.search(r'\bconst SITE\b', content))
    has_appconfig = bool(re.search(r'\bappConfig\b', content))
    
    # Check if file has getCards and getTracks
    has_getcards = bool(re.search(r'\basync function getCards\b', content))
    has_gettracks = bool(re.search(r'\basync function getTracks\b', content))
    
    # Check for original search(ext)
    has_xptv_search = bool(re.search(r'\nasync function search\(ext\)', content))
    
    print(f"  has_site={has_site}, has_appconfig={has_appconfig}, has_getcards={has_getcards}, has_gettracks={has_gettracks}, has_search={has_xptv_search}")
    
    # Add SITE constant after appConfig site definition if missing
    if not has_site and has_appconfig:
        # Find a good place to add SITE - after first appConfig block
        # Look for site: 'https://...' pattern and add SITE after appConfig
        appconfig_match = re.search(r'(const appConfig\s*=\s*\{[^}]+\})', content, re.DOTALL)
        if appconfig_match:
            insert_pos = appconfig_match.end()
            content = content[:insert_pos] + '\nconst SITE = appConfig.site;' + content[insert_pos:]
            has_site = True
    
    # Rename search(ext) to _xptvSearch(ext) to avoid conflict with our new search(keyword)
    if has_xptv_search:
        content = content.replace('\nasync function search(ext)', '\nasync function _xptvSearch(ext)', 1)
    
    # Append the adapter
    content = content.rstrip()
    if has_xptv_search:
        content += '\n' + ADAPTER_WITH_SEARCH
    else:
        content += '\n' + ADAPTER_NO_SEARCH
    
    outpath = os.path.join('converted', filename)
    with open(outpath, 'w', encoding='utf-8') as f:
        f.write(content)
    print(f"  Saved to {outpath}")

print("\nAll done!")
