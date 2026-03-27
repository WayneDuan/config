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
            name: '口',
            ui: 1,
            ext: {
                id: 'cn/tags/口交?sort=published_at',
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
    let tracks = []

    const { data } = await $fetch.get(url, {
        headers: { 'User-Agent': UA }
    })

    // 尝试从页面源码直接提取完整的 playlist 链接
    // 现在的网站经常把链接藏在 JSON.parse 或者 window.config 里
    const masterMatch = data.match(/https?:\/\/[^\s"'`]+\/playlist\.m3u8/)
    if (masterMatch) {
        const masterUrl = masterMatch[0].replace(/\\/g, '') // 去掉转义斜杠
        const uuid = masterUrl.split('/')[3] // 提取 UUID

        const { data: m3u8Content } = await $fetch.get(masterUrl, {
            headers: { 'User-Agent': UA }
        })

        const lines = m3u8Content.split('\n')
        lines.forEach((line, index) => {
            line = line.trim()
            // 如果这一行是地址且包含 m3u8
            if (line.endsWith('.m3u8') && !line.includes('playlist.m3u8')) {
                // 尝试从上一行拿分辨率信息
                let label = '未知清晰度'
                const prevLine = lines[index - 1] || ''
                if (prevLine.includes('RESOLUTION=')) {
                    label = prevLine.split('RESOLUTION=')[1].split(',')[0].split('x')[1] + 'P'
                } else {
                    // 如果没标签，就取文件名作为名字
                    label = line.replace('/video.m3u8', '').split('/').pop()
                }

                tracks.push({
                    name: label,
                    ext: {
                        url: line.startsWith('http') ? line : `${m3u8Prefix}${uuid}/${line}`
                    }
                })
            }
        })

        // 始终添加一个自动选项
        tracks.push({
            name: '自动 (Auto)',
            ext: { url: masterUrl }
        })
    }

    return jsonify({
        list: [{ title: '播放列表', tracks }]
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

    //let text = encodeURIComponent(ext.text)
    let page = ext.page || 1
    let url = appConfig.site + `/cn/search/${ext.text}?page=${page}`
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
