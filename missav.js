async function getLocalInfo() {
  const appConfig = {
    ver: 1,
    name: "玩偶哥哥(本地)",
    api: "csp_wogg_local",
  }
  return jsonify(appConfig)
}
const UA = 'Mozilla/5.0 (iPhone; CPU iPhone OS 18_2 like Mac OS X) AppleWebKit/604.1.14 (KHTML, like Gecko)'
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
            name: '中文字幕',
            ui: 1,
            ext: {
                id: 'dm265/cn/chinese-subtitle',
            },
        },
        {
            name: '最近更新',
            ui: 1,
            ext: {
                id: 'dm513/cn/new',
            },
        },
        {
            name: '无码流出',
            ui: 1,
            ext: {
                id: 'dm561/cn/uncensored-leak',
            },
        },
        {
            name: '本月热门',
            ui: 1,
            ext: {
                id: 'dm207/cn/monthly-hot',
            },
        },
       
       
        {
            name: 'FC2',
            ui: 1,
            ext: {
                id: 'dm95/cn/fc2',
            },
        },
        {
            name: '东京热',
            ui: 1,
            ext: {
                id: 'dm29/cn/tokyohot',
            },
        },
        {
            name: '一本道',
            ui: 1,
            ext: {
                id: 'dm58345/cn/1pondo',
            },
        },
        {
            name: '麻豆传媒',
            ui: 1,
            ext: {
                id: 'dm34/cn/madou',
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
    let { page = 1, id, filters = {} } = ext

    if (id == 'saved' && $config.length == 0) {
        return jsonify({ list: [] })
    }

    let url = appConfig.site + `/${id}?page=${page}`
    
    if (filters.filters && filters.filters !== '') {
        url += `&filters=${encodeURIComponent(filters.filters)}`
    }
    
    if (filters.sort && filters.sort !== '') {
        url += `&sort=${encodeURIComponent(filters.sort)}`
    } else {
        url += `&sort=released_at`  
    }
    
    if (filters.keyword) {
        url += `&keyword=${encodeURIComponent(filters.keyword)}`
    }
    
    if (filters.actress) {
        url += `&actress=${encodeURIComponent(filters.actress)}`
    }
    
    if (filters.tag) {
        url += `&tag=${encodeURIComponent(filters.tag)}`
    }

    console.log('Requesting:', url)

    const { data } = await $fetch.get(url, {
        headers: {
            'User-Agent': UA,
            'Referer': 'https://missav.ai/'
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
        filter: [
            {
                key: 'filters',  
                name: '过滤',
                init: '',      
                value: [
                    { n: '所有', v: '' },
                    { n: '单人作品', v: 'individual' },
                    { n: '多人作品', v: 'multiple' },
                    { n: '中文字幕', v: 'chinese-subtitle' },
                ],
            },
            {
                key: 'sort',    
                name: '排序',
                init: 'released_at',  
                value: [
                    { n: '发行日期', v: 'released_at' },
                    { n: '最近更新', v: 'published_at' },
                    { n: '收藏数', v: 'saved' },
                    { n: '今日浏览数', v: 'today_views' },
                    { n: '本週浏览数', v: 'weekly_views' },
                    { n: '本月浏览数', v: 'monthly_views' },
                    { n: '总浏览数', v: 'views' },
                ],
            },
        ],
    })
}
async function getTracks(ext) {
    ext = argsify(ext)
    let url = ext.url
    let m3u8Prefix = 'https://surrit.com/'
    let tracks = []

    const { data } = await $fetch.get(url, {
        headers: {
            'User-Agent': UA,
            'Referer': 'https://missav.ai/'
        },
    })

    // 1. 提取 UUID (兼容旧的 nineyu 和新的正则)
    let uuid = ''
    const match = data.match(/nineyu\.com\\\/(.+)\\\/seek\\\/_0\.jpg/)
    if (match && match[1]) {
        uuid = match[1]
    } else {
        // 如果上面那个失效了，尝试匹配标准的 UUID 格式
        const uuidMatch = data.match(/[a-f0-9]{8}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{12}/)
        if (uuidMatch) uuid = uuidMatch[0]
    }

    if (uuid) {
        const masterM3u8 = `${m3u8Prefix}${uuid}/playlist.m3u8`
        // 关键：请求主列表时必须带上 Referer
        const { data: masterData } = await $fetch.get(masterM3u8, {
            headers: {
                'User-Agent': UA,
                'Referer': 'https://missav.ai/'
            }
        })

        if (masterData && masterData.includes('#EXTM3U')) {
            const lines = masterData.split('\n')
            lines.forEach((line, index) => {
                line = line.trim()
                // 查找包含 video.m3u8 的行
                if (line.includes('video.m3u8')) {
                    let label = '未知'
                    // 向上找一行获取分辨率信息
                    const prevLine = lines[index - 1] || ''
                    const resMatch = prevLine.match(/RESOLUTION=\d+x(\d+)/)
                    if (resMatch) {
                        label = resMatch[1] + 'P'
                    } else {
                        label = line.split('/')[0].toUpperCase() // 回退方案：取目录名 720P
                    }

                    tracks.push({
                        name: label,
                        ext: {
                            // 拼接完整地址
                            url: `${m3u8Prefix}${uuid}/${line}`
                        }
                    })
                }
            })
        }
         // --- 核心优化：排序逻辑 ---
          tracks.sort((a, b) => {
                // 提取名字中的数字进行对比，例如 "1080P" -> 1080
                let valA = parseInt(a.name) || 0
                let valB = parseInt(b.name) || 0
                return valB - valA // 降序排列：大的在前
            })
        // 始终添加一个“自动”选项放在最后
        tracks.unshift({
            name: '自动 (Auto)',
            ext: {
                url: masterM3u8
            }
        })
    }

    return jsonify({
        list: [
            {
                title: '清晰度选择',
                tracks: tracks,
            },
        ],
    })
}

async function getPlayinfo(ext) {
    ext = argsify(ext)
    const url = ext.url
  const headers = {
        'User-Agent': UA,
            'Referer': 'https://missav.ai/',
            'Origin': 'https://missav.ai'
    }
    return jsonify({ urls: [url] ,headers: [headers]})
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
            'Referer': 'https://missav.ai/'
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
