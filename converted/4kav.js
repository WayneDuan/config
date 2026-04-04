// XPTV polyfills for app compatibility
const jsonify = (data) => JSON.stringify(data);
const argsify = (str) => {
    if (typeof str === 'string') { try { return JSON.parse(str); } catch(e) { return str; } }
    return str;
};

// tv

const UA = 'Mozilla/5.0 (iPhone; CPU iPhone OS 17_1 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.1 Mobile/15E148 Safari/604.1'

let appConfig = {


    ver: 1,
    title: '4k-av',
    site: 'https://4kmp.com',
    tabs: [
        {
            name: '首頁',
            ext: {
                id: 0,
                url: 'https://4kmp.com',
            },
        },
        {
            name: '電影',
            ext: {
                id: 1,
                url: 'https://4kmp.com/movie',
            },
        },
        {
            name: '電視劇',
            ext: {
                id: 2,
                url: 'https://4kmp.com/tv',
            },
        },
    ],
}

async function getConfig() {
    return jsonify(appConfig)
}

async function getCards(ext) {
    ext = argsify(ext)
    // 頁數寫入cache
    var lastPage = {
        0: 1,
        1: 1,
        2: 1,
    }
    let val = $cache.get('av')
    if (val) {
        lastPage = JSON.parse(val)
    }

    let cards = []
    let { id, page = 1, url } = ext

    if (page > 1) {
        url += `/page-${lastPage[id] - page + 1}.html`
    }

    $print(`url: ${url}`)

    const { data } = await $fetch.get(url, {
        headers: {
            'User-Agent': UA,
        },
    })

    const elems = $html.elements(data, '#MainContent_newestlist .virow .NTMitem')
    elems.forEach((element) => {
        const href = $html.attr(element, '.title a', 'href')
        const title = $html.text(element, '.title h2')
        const cover = $html.attr(element, '.poster img', 'src')
        const subTitle = $html.text(element, 'label[title=分辨率]').split('/')[0]
        cards.push({
            vod_id: href,
            vod_name: title,
            vod_pic: cover,
            vod_remarks: subTitle,
            ext: {
                url: `${appConfig.site}${href}`,
            },
        })
    })

    // get lastpage
    if (page == 1) {
        const pageNumber = $html.text(data, '#MainContent_header_nav .page-number')
        const num = pageNumber.split('/')[1]
        lastPage[id] = num
        const jsonData = JSON.stringify(lastPage, null, 2)
        $cache.set('av', jsonData)
    }

    return jsonify({
        list: cards,
    })
}

async function getTracks(ext) {
    ext = argsify(ext)
    let tracks = []
    let url = ext.url

    const { data } = await $fetch.get(url, {
        headers: {
            'User-Agent': UA,
        },
    })

    // 檢查是不是多集
    let playlist = $html.elements(data, '#rtlist li')
    if (playlist.length > 0) {
        playlist.forEach((element) => {
            let name = $html.text(element, 'span')
            let url = $html.attr(element, 'img', 'src').replace('screenshot.jpg', '')
            tracks.push({
                name: name,
                pan: '',
                ext: {
                    url,
                },
            })
        })
    } else {
        tracks.push({
            name: '播放',
            pan: '',
            ext: {
                url,
            },
        })
    }

    return jsonify({
        list: [
            {
                title: '默认分组',
                tracks,
            },
        ],
    })
}

async function getPlayinfo(ext) {
    ext = argsify(ext)
    let url = ext.url.replace('www.', '')

    const { data } = await $fetch.get(url, {
        headers: {
            'User-Agent': UA,
        },
    })

    let playUrl = $html.attr(data, '#MainContent_videowindow video source', 'src')

    return jsonify({ urls: [playUrl] })
}

async function _xptvSearch(ext) {
    ext = argsify(ext)
    let cards = []

    let text = encodeURIComponent(ext.text)
    let url = appConfig.site + `/s?q=${text}`

    const { data } = await $fetch.get(url, {
        headers: {
            'User-Agent': UA,
        },
    })

    const elems = $html.elements(data, '#MainContent_newestlist .virow .NTMitem')
    elems.forEach((element) => {
        const href = $html.attr(element, '.title a', 'href')
        const title = $html.text(element, '.title h2')
        const cover = $html.attr(element, '.poster img', 'src')
        const subTitle = $html.text(element, 'label[title=分辨率]').split('/')[0]
        cards.push({
            vod_id: href,
            vod_name: title,
            vod_pic: cover,
            vod_remarks: subTitle,
            ext: {
                url: `${appConfig.site}${href}`,
            },
        })
    })

    return jsonify({
        list: cards,
    })
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
    // getTracks returns: { list: [ { title: "线路名", tracks: [{name, pan, ext:{...}}] } ] }
    const tracklist = result.list || [];
    const resolutions = [];
    for (const source of tracklist) {
        for (const track of (source.tracks || [])) {
            let playUrl = '';
            try {
                const piRaw = await getPlayinfo(JSON.stringify(track.ext || {}));
                const piResult = JSON.parse(piRaw);
                playUrl = (piResult.urls || [])[0] || '';
            } catch (e) {}
            resolutions.push({
                id: source.title + '_' + track.name,
                name: source.title + ' - ' + track.name,
                url: playUrl,
            });
        }
    }
    return {
        id: videoId,
        title: tracklist[0] ? (tracklist[0].title || '') : '',
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
