// XPTV polyfills for app compatibility
const jsonify = (data) => JSON.stringify(data);
const argsify = (str) => {
    if (typeof str === 'string') { try { return JSON.parse(str); } catch(e) { return str; } }
    return str;
};

const cheerio = createCheerio()

let UA =


    'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/130.0.0.0 Safari/537.36'

let appConfig = {
    ver: 20251206,
    title: 'anime1',
    site: 'https://anime1.me',
    tabs: [
        {
            id: '1',
            name: 'list',
            ext: {},
        },
    ],
}

async function getConfig() {
    return jsonify(appConfig)
}

async function getCards(ext) {
    ext = argsify(ext)
    let cards = []
    let { page = 1 } = ext

    if (page > 1) return
    try {
        const url = appConfig.site + `/animelist.json`
        const { data } = await $fetch.get(url, {
            headers: {
                'User-Agent': UA,
            },
        })

        argsify(data).forEach((e) => {
            cards.push({
                vod_id: `${e[0]}`,
                vod_name: e[1],
                vod_pic: '',
                vod_remarks: e[2] || '',
                vod_pubdate: e[3] || '',
                ext: {
                    id: `${e[0]}`,
                },
            })
        })

        return jsonify({
            list: cards,
        })
    } catch (error) {
        $print(error)
    }
}

async function getTracks(ext) {
    ext = argsify(ext)
    let tracks = []
    let { id, href } = ext
    let url = href ? href : appConfig.site + `/?cat=${id}`

    const { data } = await $fetch.get(url, {
        headers: {
            'User-Agent': UA,
        },
    })

    const $ = cheerio.load(data)
    $('#main > article').each((_, e) => {
        let name = $(e).find('.entry-title a').text()
        let href = $(e).find('.entry-title a').attr('href')

        tracks.push({
            name,
            pan: '',
            ext: {
                href,
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
    let { href } = ext
    let api = 'https://v.anime1.me/api'
    try {
        const { data } = await $fetch.get(href, {
            headers: { 'User-Anent': UA },
        })
        const $ = cheerio.load(data)
        let apireq = $('.vjscontainer > video').attr('data-apireq')
        const apires = await $fetch.post(api, `d=${apireq}`, {
            headers: {
                'User-Agent': UA,
                'Content-Type': 'application/x-www-form-urlencoded',
            },
        })

        let playUrl = argsify(apires.data).s[0].src
        let headers = apires.respHeaders

        let set_cookie = headers['Set-Cookie']
        let cookie = ''
        set_cookie.split(',').forEach((e) => {
            cookie += `${e.split(';')[0]}; `
        })

        playUrl = playUrl.startsWith('https:') ? playUrl : 'https:' + playUrl
        return jsonify({ urls: [playUrl], headers: [{ 'User-Agent': UA, Cookie: cookie }] })
    } catch (error) {
        $print(error)
    }
}

async function _xptvSearch(ext) {
    ext = argsify(ext)
    let cards = []

    const text = encodeURIComponent(ext.text)
    const page = ext.page || 1
    const url = `${appConfig.site}/page/${page}?s=${text}`

    const { data } = await $fetch.get(url, {
        headers: {
            'User-Agent': UA,
        },
    })

    try {
        const $ = cheerio.load(data)
        $('#main > article').each((_, e) => {
            let name = $(e).find('.entry-footer .cat-links a').text()
            let href = $(e).find('.entry-footer .cat-links a').attr('href')

            cards.push({
                vod_id: href,
                vod_name: name,
                vod_pic: '',
                ext: {
                    href,
                },
            })
        })
    } catch (error) {
        console.log(error)
    }

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
