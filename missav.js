const UA = 'Mozilla/5.0 (iPhone; CPU iPhone OS 18_2 like Mac OS X) AppleWebKit/604.1.14 (KHTML, like Gecko) Version/18.0 Mobile/15E148 Safari/604.1'
const cheerio = createCheerio()
/*
{	
    "enload": true
}
*/
let $config = argsify($config_str)

const appConfig = {
    ver: 1,
    title: 'missav',
    site: 'https://missav.ai',
    tabs: [
        {
            name: 'FC2发布时间',
            ui: 1,
            ext: {
                id: 'dm150/cn/fc2?sort=published_at',
            },
        },    
        {
            name: '推荐',
            ui: 1,
            ext: {
                id: 'dm194/cn',
            },
        },  
        {
            name: '无码最近更新',
            ui: 1,
            ext: {
                id: 'dm628/cn/uncensored-leak?sort=published_at',
            },
        },   
        {
            name: '无码周榜',
            ui: 1,
            ext: {
                id: 'dm628/cn/uncensored-leak?sort=weekly_views',
            },
        },
        {
            name: '麻豆传媒',
            ui: 1,
            ext: {
                id: 'dm35/cn/madou?sort=published_at',
            },
        },
       
    ],
}

async function getactress() {

    const url = appConfig.site + '/saved/actresses'
    const { data } = await $fetch.get(url, {
        headers: {
            'User-Agent': UA,
        },
    })
    if (data.includes('Just a moment...')) {
        $utils.openSafari(url, UA)
    }
    const $ = cheerio.load(data)
    const actresss = $('.max-w-full.p-8.text-nord4.bg-nord1.rounded-lg')
    if (actresss.length == 0) {
        $utils.openSafari(url, UA)
    }
    let list = []
    try {
        actresss.find('.space-y-4').each((_, e) => {
            const href = $(e).find('a:first').attr('href').replace(`${appConfig.site}/`, '')
            const name = $(e).find('h4').text()
            list.push({
                name: name,
                ui: 1,
                ext: {
                    id: href,
                },
            })
        })
    } catch (e) {
        $utils.toastError(`没有找到收藏的女优`)
    }
    return list
}

async function getConfig() {
    let config = { ...appConfig };
    if ($config.enload) {
        list = await getactress()
        config.tabs = config.tabs.concat(list)
    }
    return jsonify(config)
}

async function getCards(ext) {
    ext = argsify(ext)
    let cards = []
    let { page = 1, id } = ext
    if (id == 'saved' && $config.length == 0) {
        return jsonify({
            list: [],
        })
    }

    const url = appConfig.site + `/${id}&page=${page}`

    const { data } = await $fetch.get(url, {
        headers: {
            'User-Agent': UA,
        },
    })
    if (data.includes('Just a moment...')) {
        $utils.openSafari(url, UA)
    }

    const $ = cheerio.load(data)

    const videos = $('.thumbnail')

    videos.each((_, e) => {
        const href = $(e).find('.text-secondary').attr('href')
        const title = $(e).find('.text-secondary').text().trim().replace(/\s+/g, ' ')
        const cover = $(e).find('.w-full').attr('data-src')
        const remarks = $(e).find('.left-1').text().trim()
        const duration = $(e).find('.right-1').text().trim()
        let obj = {
            vod_id: href,
            vod_name: title,
            vod_pic: cover,
            vod_remarks: remarks,
            vod_duration: duration,

            ext: {
                url: href,
            },
        }

        cards.push(obj)
    })

    return jsonify({
        list: cards,
    })
}

async function getTracks(ext) {
    ext = argsify(ext)
    let url = ext.url
    let m3u8Prefix = 'https://surrit.com/'
    let m3u8Suffix = '/playlist.m3u8'
    let tracks = []

    const { data } = await $fetch.get(url, {
        headers: {
            'User-Agent': UA,
        },
    })
    const match = data.match(/nineyu\.com\\\/(.+)\\\/seek\\\/_0\.jpg/)
    if (match && match[1]) {
        let uuid = match[1]
        const { data: data1 } = await $fetch.get(m3u8Prefix + uuid + m3u8Suffix, {
            headers: {
                'User-Agent': UA,
            }
        })
        const lines = data1.split('\n');
        const matches = lines.filter(line => line.includes('/video.m3u8'));
        matches.forEach(match => {
            const name = match.replace('/video.m3u8', '')
            tracks.unshift({
                name: name,
                pan: '',
                ext: {
                    url: `${m3u8Prefix}${uuid}/${match}`,
                }
            })
        })
        tracks.push({
            name: '自动',
            pan: '',
            ext: {
                url: m3u8Prefix + uuid + m3u8Suffix,
            }
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
    const url = ext.url

    return jsonify({ urls: [url] })
}

async function search(ext) {
    ext = argsify(ext)
    let cards = []

    let text = encodeURIComponent(ext.text)
    let page = ext.page || 1
    let url = `${appConfig.site}/cn/search/${text}?page=${page}`

    const { data } = await $fetch.get(url, {
        headers: {
            'User-Agent': UA,
        },
    })

    const $ = cheerio.load(data)

    const videos = $('.thumbnail')
    videos.each((_, e) => {
        const href = $(e).find('.text-secondary').attr('href')
        const title = $(e).find('.text-secondary').text().trim().replace(/\s+/g, ' ')
        const cover = $(e).find('.w-full').attr('data-src')
        const remarks = $(e).find('.left-1').text().trim()
        const duration = $(e).find('.right-1').text().trim()

        cards.push({
            vod_id: href,
            vod_name: title,
            vod_pic: cover,
            vod_remarks: remarks,
            vod_duration: duration,

            ext: {
                url: href,
            },
        })
    })
    return jsonify({
        list: cards,
    })
}
