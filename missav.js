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
        headers: {
            'User-Agent': UA,
        },
    })

    // 1. 尝试匹配所有包含 m3u8 的 URL (处理了混淆和转义斜杠)
    // 现在的源码中通常隐藏在 window.playerConfig 或类似变量里
    const m3u8Regex = /https?[:\/\w\.-]+\.m3u8/g
    const matches = data.replace(/\\/g, '').match(m3u8Regex)

    if (matches && matches.length > 0) {
        // 取第一个匹配到的作为 Master Playlist (主索引)
        const masterUrl = matches[0]
        
        // 获取 UUID 或 基础路径 (用于拼接子链接)
        // 例如从 https://surrit.com/uuid/playlist.m3u8 提取前缀
        const baseUrl = masterUrl.substring(0, masterUrl.lastIndexOf('/'))

        try {
            // 2. 请求主索引文件以获取具体清晰度
            const { data: m3u8Content } = await $fetch.get(masterUrl, {
                headers: { 'User-Agent': UA }
            })

            const lines = m3u8Content.split('\n')
            lines.forEach((line, index) => {
                line = line.trim()
                // 查找包含具体分辨率的行 (如 720p/video.m3u8)
                if (line.endsWith('.m3u8') && !line.includes('playlist.m3u8')) {
                    let label = '未知'
                    const prevLine = lines[index - 1] || ''
                    
                    // 从前一行提取分辨率信息
                    if (prevLine.includes('RESOLUTION=')) {
                        const res = prevLine.match(/RESOLUTION=\d+x(\d+)/)
                        label = res ? res[1] + 'P' : '高清'
                    } else {
                        label = line.split('/')[0] || '视频'
                    }

                    tracks.push({
                        name: label,
                        ext: {
                            url: line.startsWith('http') ? line : `${baseUrl}/${line}`
                        }
                    })
                }
            })
        } catch (e) {
            // 如果请求子索引失败，至少保留一个自动选项
        }

        // 3. 始终添加一个自动选项 (即使子索引解析失败)
        tracks.push({
            name: '自动 (Auto)',
            ext: { url: masterUrl }
        })
    }

    // 如果还是没找到，说明可能遇到了五秒盾或页面结构大改
    if (tracks.length === 0) {
        if (data.includes('Just a moment...') || data.includes('cloudflare')) {
            $utils.openSafari(url, UA)
            $utils.toastError('请在弹出浏览器中完成人机验证')
        }
    }

    return jsonify({
        list: [
            {
                title: '切换清晰度',
                tracks: tracks,
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
