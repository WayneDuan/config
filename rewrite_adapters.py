import os
import re

# New adapter template - matches hkdoll.js signatures exactly
# Used for files that have getCards + getTracks + search(ext) internally
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
                id: `${track.vod_name}${i > 0 ? '_' + i : ''}`,
                name: track.vod_name,
                url: url,
            });
        });
    });
    return {
        id: videoId,
        title: tracks[0] ? tracks[0].vod_name : '',
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

# For files without search(ext) internally
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
                id: `${track.vod_name}${i > 0 ? '_' + i : ''}`,
                name: track.vod_name,
                url: url,
            });
        });
    });
    return {
        id: videoId,
        title: tracks[0] ? tracks[0].vod_name : '',
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

def find_block_end(content, start_pos):
    """Find the end of a JS block starting at start_pos (after opening {)."""
    depth = 0
    i = start_pos
    in_string = None
    in_template = 0
    while i < len(content):
        c = content[i]
        if in_string:
            if c == '\\':
                i += 2
                continue
            if c == in_string:
                in_string = None
        elif c in ('"', "'"):
            in_string = c
        elif c == '`':
            in_string = '`'
        elif c == '{':
            depth += 1
        elif c == '}':
            if depth == 0:
                return i
            depth -= 1
        i += 1
    return len(content)

def remove_old_adapters(content):
    """Remove old wrapper functions and module.exports."""
    # Find the old wrapper functions block
    # Pattern: starts with `function getWebsiteInfo(` or `async function getWebsiteInfo(`
    # and ends with `}` of module.exports
    
    # Find module.exports = { ... }
    exports_pattern = re.search(r'\nmodule\.exports\s*=\s*\{', content)
    if not exports_pattern:
        return content
    
    # Find end of module.exports block
    exports_start = exports_pattern.start()
    brace_start = content.index('{', exports_pattern.start())
    brace_end = find_block_end(content, brace_start + 1)
    exports_end = brace_end + 1
    
    # Find where the old getWebsiteInfo function starts
    wrapper_pattern = re.search(r'\n(?:async )?function getWebsiteInfo\(', content[:exports_start])
    if not wrapper_pattern:
        # No old wrapper - just remove module.exports
        return content[:exports_start].rstrip()
    
    wrapper_start = wrapper_pattern.start()
    return content[:wrapper_start].rstrip()

directory = 'converted'
skipped = []

for filename in sorted(os.listdir(directory)):
    if not filename.endswith('.js'):
        continue
    
    filepath = os.path.join(directory, filename)
    with open(filepath, 'r', encoding='utf-8') as f:
        content = f.read()
    
    print(f"Processing {filename}...")
    
    # Check if file has search(ext) internally
    has_xptv_search = bool(re.search(r'\nasync function search\(ext\)', content))
    
    # Rename search(ext) to _xptvSearch(ext) to avoid conflict  
    if has_xptv_search:
        content = content.replace('\nasync function search(ext)', '\nasync function _xptvSearch(ext)', 1)
    
    # Remove old adapter functions
    new_content = remove_old_adapters(content)
    
    # Append new adapter
    if has_xptv_search:
        new_content = new_content + '\n' + ADAPTER_WITH_SEARCH
    else:
        new_content = new_content + '\n' + ADAPTER_NO_SEARCH
    
    with open(filepath, 'w', encoding='utf-8') as f:
        f.write(new_content)
    
    print(f"  Done (search: {has_xptv_search})")

print("\nAll done!")
