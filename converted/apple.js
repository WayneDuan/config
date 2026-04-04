// XPTV polyfills for app compatibility
const jsonify = (data) => JSON.stringify(data);
const argsify = (str) => {
    if (typeof str === 'string') { try { return JSON.parse(str); } catch(e) { return str; } }
    return str;
};

const CryptoJS = createCryptoJS()

const UA = 'okhttp/3.12.11'

let appConfig = {


    ver: 20250511,
    title: '小蘋果',
    // site: 'http://item.xpgcom.com',
    site: 'http://c.xpgtv.net',
    tabs: [
        {
            name: '电影',
            ext: {
                id: 1,
            },
        },
        {
            name: '电视',
            ext: {
                id: 2,
            },
        },
        {
            name: '综艺',
            ext: {
                id: 3,
            },
        },
        {
            name: '动漫',
            ext: {
                id: 4,
            },
        },
    ],
}

async function getConfig() {
    return jsonify(appConfig)
}

async function getCards(ext) {
    ext = argsify(ext)
    let cards = []
    let { id, page = 1 } = ext

    const url = appConfig.site + `/api.php/v2.vod/androidfilter10086?page=${page}&type=${id}`

    const { data } = await $fetch.get(url, {
        headers: {
            'User-Agent': UA,
        },
    })

    argsify(data).data.forEach((e) => {
        cards.push({
            vod_id: e.id.toString(),
            vod_name: e.name,
            vod_pic: e.pic,
            vod_remarks: e.state,
            ext: {
                url: `${appConfig.site}/api.php/v3.vod/androiddetail2?vod_id=${e.id}`,
            },
        })
    })

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

    let playlist = argsify(data).data.urls
    playlist.forEach((e) => {
        const name = e.key
        const url = e.url
        if (name.includes('及时雨')) return
        tracks.push({
            name: name,
            pan: '',
            ext: {
                key: url,
            },
        })
    })

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
    let key = ext.key
    const url = `http://c.xpgtv.net/m3u8/${key}.m3u8`
    const headers = {
        token2: 'SnAXiSW8vScXE0Z9aDOnK5xffbO75w1+uPom3WjnYfVEA1oWtUdi2Ihy1N8=',
        token: 'ElEDlwCVgXcFHFhddiq2JKteHofExRBUrfNlmHrWetU3VVkxnzJAodl52N9EUFS+Dig2A/fBa/V9RuoOZRBjYvI+GW8kx3+xMlRecaZuECdb/3AdGkYpkjW3wCnpMQxf8vVeCz5zQLDr8l8bUChJiLLJLGsI+yiNskiJTZz9HiGBZhZuWh1mV1QgYah5CLTbSz8=',
        version: 'XPGBOX com.phoenix.tv1.5.7',
        user_id: 'XPGBOX',
        'User-Agent':
            'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/117.0.0.0 Safari/537.36',
        screenx: '1280',
        screeny: '720',
        // timestamp: `${Math.floor(Date.now() / 1000)}`,
    }
    // const str = `||||DC6FFCB55FA||861824127032820||12702720||Asus/Asus/ASUS_I003DD:7.1.2/20171130.376229:user/release-keysXPGBOX com.phoenix.tv1.3.3${headers.timestamp}`
    // headers.hash = CryptoJS.MD5(str).toString().toLowerCase().substring(8, 12)
    headers.hash = 'd78a'
    headers.timestamp = '1743060300'

    return jsonify({ urls: [url], headers: [headers] })
}

async function _xptvSearch(ext) {
    ext = argsify(ext)
    let cards = []

    const text = encodeURIComponent(ext.text)
    const page = ext.page || 1
    const url = `${appConfig.site}/api.php/v2.vod/androidsearch10086?page=${page}&wd=${text}`

    const { data } = await $fetch.get(url, {
        headers: {
            'User-Agent': UA,
        },
    })

    argsify(data).data.forEach((e) => {
        cards.push({
            vod_id: e.id.toString(),
            vod_name: e.name,
            vod_pic: e.pic,
            vod_remarks: e.state,
            ext: {
                url: `${appConfig.site}/api.php/v3.vod/androiddetail2?vod_id=${e.id}`,
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
