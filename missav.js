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
    let tracks = []

    const { data } = await $fetch.get(url, {
        headers: { 'User-Agent': UA }
    })

    // 1. 尝试直接匹配 36 位 UUID (8-4-4-4-12 格式)
    // 这种格式在源码中通常出现在 poster 或播放器配置中
    const uuidRegex = /[a-f0-9]{8}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{12}/
    const uuidMatch = data.match(uuidRegex)
    
    if (uuidMatch) {
        const uuid = uuidMatch[0]
        const m3u8Prefix = `https://surrit.com/${uuid}`
        const masterUrl = `${m3u8Prefix}/playlist.m3u8`

        try {
            // 2. 抓取主索引文件
            const { data: m3u8Content } = await $fetch.get(masterUrl, {
                headers: { 'User-Agent': UA }
            })

            // 3. 解析具体清晰度 (720p, 1080p 等)
            const lines = m3u8Content.split('\n')
            lines.forEach((line, index) => {
                line = line.trim()
                if (line.includes('.m3u8') && !line.includes('playlist.m3u8')) {
                    // 提取分辨率数值作为名字
                    let label = '未知'
                    const prevLine = lines[index - 1] || ''
                    const resMatch = prevLine.match(/RESOLUTION=\d+x(\d+)/)
                    
                    if (resMatch) {
                        label = resMatch[1] + 'P'
                    } else if (line.includes('/')) {
                        // 如果没有标签，取路径前缀作为名字 (例如 720p/video.m3u8 -> 720p)
                        label = line.split('/')[0].toUpperCase()
                    }

                    tracks.push({
                        name: label,
                        ext: {
                            url: line.startsWith('http') ? line : `${m3u8Prefix}/${line}`
                        }
                    })
                }
            })
        } catch (e) {
            // 解析子清晰度失败不报错，后面会补一个自动
        }

        // 4. 补全“自动”选项
        tracks.push({
            name: '自动 (Auto)',
            ext: { url: masterUrl }
        })
    }

    // 5. 如果上面还是没抓到，尝试最后的“降级方案”：直接搜源码里所有的 m3u8
    if (tracks.length === 0) {
        const anyM3u8 = data.match(/https?[^\s"']+?\.m3u8/g)
        if (anyM3u8) {
            const rawUrl = anyM3u8[0].replace(/\\/g, '')
            tracks.push({ name: '基础线路', ext: { url: rawUrl } })
        }
    }

    return jsonify({
        list: [{ title: '清晰度选择', tracks }]
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
