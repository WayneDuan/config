// XPTV polyfills for app compatibility
const jsonify = (data) => JSON.stringify(data);
const argsify = (str) => {
    if (typeof str === 'string') { try { return JSON.parse(str); } catch(e) { return str; } }
    return str;
};

const cheerio = createCheerio()
const CryptoJS = createCryptoJS()

const UA = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/123.0.0.0 Safari/537.3'

let appConfig = {


    ver: 1,
    title: '愛壹帆',
    site: 'https://m10.iyf.tv',
    tabs: [
        {
            name: '电影',
            ext: {
                id: '3',
            },
        },
        {
            name: '电视',
            ext: {
                id: '4',
            },
        },
        {
            name: '综艺',
            ext: {
                id: '5',
            },
        },
        {
            name: '动漫',
            ext: {
                id: '6',
            },
        },
        {
            name: '短剧',
            ext: {
                id: '4,155',
            },
        },
        {
            name: '体育',
            ext: {
                id: '95',
            },
        },
        {
            name: '纪录片',
            ext: {
                id: '7',
            },
        },
    ],
}

async function getConfig() {
    await updateKeys()
    return jsonify(appConfig)
}

async function getCards(ext) {
    ext = argsify(ext)
    let keys = $cache.get('iyf-keys')
    const publicKey = JSON.parse(keys).publicKey
    let cards = []
    let { id, page = 1 } = ext

    let url = `${appConfig.site}/api/list/Search?cinema=1&page=${page}&size=36&orderby=0&desc=1&cid=0,1,${id}&isserial=-1&isIndex=-1&isfree=-1`
    let params = url.split('?')[1]
    url += `&vv=${getSignature(params)}&pub=${publicKey}`

    const { data } = await $fetch.get(url, {
        headers: {
            'User-Agent': UA,
        },
    })
    let list = argsify(data).data.info[0].result

    list.forEach((e) => {
        cards.push({
            vod_id: e.key,
            vod_name: e.title,
            vod_pic: e.image,
            vod_remarks: e.cid,
            ext: {
                key: e.key,
            },
        })
    })

    return jsonify({
        list: cards,
    })
}

async function getTracks(ext) {
    ext = argsify(ext)
    const publicKey = JSON.parse($cache.get('iyf-keys')).publicKey
    let tracks = []
    let key = ext.key

    let url = `${appConfig.site}/v3/video/languagesplaylist?cinema=1&vid=${key}&lsk=1&taxis=0&cid=0,1,4,133`
    let params = url.split('?')[1]
    url += `&vv=${getSignature(params)}&pub=${publicKey}`

    const { data } = await $fetch.get(url, {
        headers: {
            'User-Agent': UA,
        },
    })

    let playlist = argsify(data).data.info[0].playList
    playlist.forEach((e) => {
        const name = e.name
        const key = e.key
        tracks.push({
            name: name,
            pan: '',
            ext: {
                key: key,
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
    const publicKey = JSON.parse($cache.get('iyf-keys')).publicKey
    let key = ext.key
    let url = `${appConfig.site}/v3/video/play?cinema=1&id=${key}&a=0&lang=none&usersign=1&region=GL.&device=1&isMasterSupport=1`
    let params = url.split('?')[1]
    url += `&vv=${getSignature(params)}&pub=${publicKey}`

    const { data } = await $fetch.get(url, {
        headers: {
            'User-Agent': UA,
        },
    })

    let paths = argsify(data).data.info[0].flvPathList
    let playUrl = ''
    paths.forEach(async (e) => {
        if (e.isHls) {
            let link = e.result
            link += `?vv=${getSignature('')}&pub=${publicKey}`
            playUrl = link
        }
    })

    return jsonify({ urls: [playUrl] })
}

async function _xptvSearch(ext) {
    ext = argsify(ext)
    let cards = []

    const text = encodeURIComponent(ext.text)
    const page = ext.page || 1
    const url = `https://rankv21.iyf.tv/v3/list/briefsearch?tags=${text}&orderby=4&page=${page}&size=10&desc=0&isserial=-1&istitle=true`

    const { data } = await $fetch.get(url, {
        headers: {
            'User-Agent': UA,
        },
    })

    let list = argsify(data).data.info[0].result
    list.forEach((e) => {
        cards.push({
            vod_id: e.contxt,
            vod_name: e.title,
            vod_pic: e.imgPath,
            vod_remarks: e.cid,
            ext: {
                key: e.contxt,
            },
        })
    })

    return jsonify({
        list: cards,
    })
}

async function updateKeys() {
    let baseUrl = 'https://www.iyf.tv'
    let { data } = await $fetch.get(baseUrl, {
        headers: {
            'User-Agent': UA,
        },
    })
    const $ = cheerio.load(data)
    let script = $('script:contains(injectJson)').text()
    script.split('\n').forEach((e) => {
        if (e.includes('injectJson')) {
            let json = JSON.parse(e.replace('var injectJson =', '').replace(';', ''))
            let publicKey = json['config'][0]['pConfig']['publicKey']
            let privateKey = json['config'][0]['pConfig']['privateKey']
            let keys = {
                publicKey: publicKey,
                privateKey: privateKey,
            }
            const jsonData = JSON.stringify(keys, null, 2)

            $cache.set('iyf-keys', jsonData)
        }
    })
}

function getSignature(query) {
    const publicKey = JSON.parse($cache.get('iyf-keys')).publicKey
    const privateKey = getPrivateKey()
    const input = publicKey + '&' + query.toLowerCase() + '&' + privateKey

    return CryptoJS.MD5(CryptoJS.enc.Utf8.parse(input)).toString()
}

function getPrivateKey() {
    const privateKey = JSON.parse($cache.get('iyf-keys')).privateKey
    const timePublicKeyIndex = Date.now()

    return privateKey[timePublicKeyIndex % privateKey.length]
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
