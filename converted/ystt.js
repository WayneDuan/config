//来自‘夢’
const cheerio = createCheerio();

const UA = 'Mozilla/5.0 (iPhone; CPU iPhone OS 18_2_1 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/18.2.1 Mobile/15E148 Safari/604.1';

let appConfig = {
    ver: 1,
    title: '影视天堂',
    site: 'https://ysttv.com',
    tabs: [
        { name: '电影', ext: { id: 1 } },
        { name: '电视', ext: { id: 2 } },
        { name: '陆剧', ext: { id: 2, area: '大陆' } },
        { name: '台剧', ext: { id: 2, area: '台湾' } },
        { name: '香剧', ext: { id: 2, area: '香港' } },
        { name: '美剧', ext: { id: 2, area: '美国' } },
        { name: '韩剧', ext: { id: 2, area: '韩国' } },
        { name: '日剧', ext: { id: 2, area: '日本' } },
        { name: '综艺', ext: { id: 3 } },
        { name: '动漫', ext: { id: 4 } },
        { name: '短剧', ext: { id: 5 } }
    ]
};

async function getConfig() {
    return JSON.stringify(appConfig);
}

async function getCards(ext) {
    ext = JSON.parse(ext);
    let cards = [];
    let { id, area, page = 1 } = ext;

    let url = `${appConfig.site}/library/index/`;
    url += area 
        ? `c/${id}/t/all/y/all/a/${area}/s/1/page/${page}` 
        : `c/${id}/t/all/y/all/s/1/page/${page}`;

    const { data } = await $fetch.get(url, {
        headers: { 'User-Agent': UA }
    });

    const $ = cheerio.load(data);

    $('main ul.mb-5 > li').each((_, element) => {
        if ($(element).find('.subtitle').text().includes('伦理')) return;
        const href = $(element).find('a').attr('href');
        const pic = $(element).find('img').attr('data-src') || $(element).find('img').attr('src');
        const name = $(element).find('a').attr('title');
        const remark = parseFloat($(element).find('.tag.bg-dx-blue').text()).toFixed(1) || $(element).find('.text-white').text();
        cards.push({
            vod_id: href,
            vod_name: name,
            vod_pic: pic,
            vod_remarks: remark,
            ext: { url: `${appConfig.site}${href}` }
        });
    });

    return JSON.stringify({ list: cards });
}

async function getTracks(ext) {
    ext = JSON.parse(ext);
    let list = [];
    let url = ext.url;

    const { data } = await $fetch.get(url, {
        headers: { 'User-Agent': UA }
    });

    const $ = cheerio.load(data);
    let tracks = [];

    $('.overflow-auto > ul > li').each((_, element) => {
        const name = $(element).find('a').text().trim();
        const href = $(element).find('a').attr('href');
        tracks.push({
            name: name,
            pan: '',
            ext: { url: `${appConfig.site}${href}` }
        });
    });

    list.push({
        title: '默认分组',
        tracks: tracks
    });

    return JSON.stringify({ list: list });
}

async function getPlayinfo(ext) {
    ext = JSON.parse(ext);
    const url = ext.url;

    const { data } = await $fetch.get(url, {
        headers: { 'User-Agent': UA }
    });

    const $ = cheerio.load(data);
    const playUrl = $('#mse').attr('data-url');
    
    return JSON.stringify({ urls: [playUrl], headers: [{ 'User-Agent': UA }] });
}

async function _xptvSearch(ext) {
    ext = JSON.parse(ext);
    let cards = [];

    let text = encodeURIComponent(ext.text);
    let page = ext.page || 1;
    let url = `${appConfig.site}/search/index/type/1/keyword/${text}/page/${page}`;

    const { data } = await $fetch.get(url, {
        headers: { 'User-Agent': UA }
    });

    const $ = cheerio.load(data);

    $('main ul.grid > li').each((_, element) => {
        const href = $(element).find('a').attr('href');
        const pic = $(element).find('img').attr('data-src') || $(element).find('img').attr('src');
        const name = $(element).find('a').attr('title');
        cards.push({
            vod_id: href,
            vod_name: name,
            vod_pic: pic,
            vod_remarks: '',
            ext: { url: `${appConfig.site}${href}` }
        });
    });

    return JSON.stringify({ list: cards });
}

const SITE = appConfig.site;

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
