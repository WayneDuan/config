// xingya

const CryptoJS = createCryptoJS()

let appConfig = {
    ver: 1,
    title: '星芽短劇',
    site: 'https://app.whjzjx.cn',
    tabs: [
        {
            name: '热播剧',
            ext: {
                id: 2,
            },
        },
        {
            name: '会员专享',
            ext: {
                id: 8,
            },
        },
        {
            name: '星选好剧',
            ext: {
                id: 7,
            },
        },
        {
            name: '新剧',
            ext: {
                id: 3,
            },
        },
        {
            name: '阳光剧场',
            ext: {
                id: 5,
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
    let url = `${appConfig.site}/cloud/v2/theater/home_page?theater_class_id=${id}&type=1&page_num=${page}&page_size=24`
    let headers = await getHeader()

    const { data } = await $fetch.get(url, {
        headers: headers,
    })

    let list = argsify(data).data.list
    list.forEach((e) => {
        let item = e.theater
        let id = item.id.toString()
        cards.push({
            vod_id: id,
            vod_name: item.title,
            vod_pic: item.cover_url,
            vod_remarks: `${item.total}集全`,
            ext: {
                id,
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
    let id = ext.id
    let url = `${appConfig.site}/v2/theater_parent/detail?theater_parent_id=${id}`
    let headers = await getHeader()

    const { data } = await $fetch.get(url, {
        headers: headers,
    })

    let playlist = argsify(data).data.theaters
    playlist.forEach((e) => {
        let name = e.num.toString()
        let url = e.son_video_url
        tracks.push({
            name,
            pan: '',
            ext: {
                url,
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
    let url = ext.url

    return jsonify({ urls: [url] })
}

async function _xptvSearch(ext) {
    ext = argsify(ext)
    let cards = []

    let text = encodeURIComponent(ext.text)
    let url = appConfig.site + '/v3/search'
    let headers = await getHeader()
    headers['Content-Type'] = 'application/json'
    let body = {
        text: encodeURIComponent(text),
    }

    // const { data } = await axios.post(url, body, {
    //     headers: headers,
    // })
    const { data } = await $fetch.post(url, body, {
        headers: headers,
    })

    const list = argsify(data).data.theater.search_data

    list.forEach((e) => {
        let item = e
        let id = item.id.toString()
        cards.push({
            vod_id: id,
            vod_name: item.title,
            vod_pic: item.cover_url,
            vod_remarks: `${item.total}集全`,
            ext: {
                id,
            },
        })
    })

    return jsonify({
        list: cards,
    })
}

async function getHeader() {
    let header = {
        'User-Agent': 'okhttp/4.10.0',
        'Accept-Encoding': 'gzip',
        'x-app-id': '7',
        platform: '1',
        manufacturer: 'asus',
        version_name: '3.3.1',
        user_agent:
            'Mozilla/5.0 (Linux; Android 14; Zenfone 5Z Build/AP2A.240705.005; wv) AppleWebKit/537.36 (KHTML, like Gecko) Version/4.0 Chrome/125.0.6422.165 Mobile Safari/537.36',
        dev_token:
            'Bsg4gWzOoQc9UEvsnDHZWNlpphiWxQ9MIDNUZIqU6k_irRIWCyYEABtuSI5OBkJ9gDNLzcr1wBQSku05JgYmeQN-lmGn94m-On-JSrqecxcFQdU8VkskVkugV4qUF_mW1sHjcYWeXbfdHM5b2VytKSUCRzlJ-Ix4QuRrll15Rmxo*',
        app_version: '3.3.1',
        device_platform: 'android',
        personalized_recommend_status: '1',
        device_type: 'Zenfone+5Z',
        device_brand: 'asus',
        os_version: '14',
        channel: 'default',
        raw_channel: 'default',
        oaid: '',
        msa_oaid: '',
        uuid: 'randomUUID_9e91d3ce-8658-4d6e-9d1b-6f351611163d',
        device_id: '2885ce2d34c9634b287ab022f2f3a6cfb',
        ab_id: '',
        support_h265: '1',
    }

    let token = $cache.get('xingya')
    // $print(`token: ${token}`)

    if (token) {
        let currentTime = Math.floor(Date.now() / 1000)
        let exp = decodeJWT(token).payload.exp
        if (currentTime > exp) {
            token = ''
        }
    }

    if (!token) {
        token = await getJWT(header)
        $cache.set('xingya', token)
    }

    header['authorization'] = token
    return header
}

async function getJWT(header) {
    const login = `https://u.shytkjgs.com/user/v1/account/login`
    let headers = header
    headers['Content-Type'] = 'application/x-www-form-urlencoded'

    const { data } = await $fetch.post(
        login,
        { device: headers.device_id },
        {
            headers: headers,
        }
    )
    const jwt = argsify(data).data.token
    // $print(`jwt: ${jwt}`)
    return jwt
}

function decodeJWT(token) {
    function base64UrlDecode(str) {
        // Replace URL-safe characters with Base64 characters
        let base64 = str.replace(/-/g, '+').replace(/_/g, '/')
        // Add padding if necessary
        while (base64.length % 4) {
            base64 += '='
        }
        // Decode Base64 string
        return base64Decode(base64)
    }

    // Split JWT into parts
    const parts = token.split('.')
    if (parts.length !== 3) {
        throw new Error('Invalid JWT token')
    }

    // Decode header and payload
    const header = JSON.parse(base64UrlDecode(parts[0]))
    const payload = JSON.parse(base64UrlDecode(parts[1]))

    return {
        header: header,
        payload: payload,
        signature: parts[2],
    }
}

function base64Decode(text) {
    return CryptoJS.enc.Utf8.stringify(CryptoJS.enc.Base64.parse(text))
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
