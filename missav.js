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
    ext = argsify(ext);
    let url = ext.url;
    let tracks = [];

    const { data } = await $fetch.get(url, {
        headers: {
            'User-Agent': UA,
            'Referer': appConfig.site,
        },
    });

    // 1. 提取 UUID (MissAV 现在的核心 ID 格式)
    // 尝试从不同的位置抓取 UUID
    let uuid = "";
    const uuidMatch = data.match(/[a-f0-9]{8}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{12}/);
    if (uuidMatch) {
        uuid = uuidMatch[0];
    } else {
        // 备选方案：从 poster 路径里截取
        const posterMatch = data.match(/https?%3A%2F%2Fsurrit\.com%2F([a-z0-9\-]+)%2F/);
        if (posterMatch) uuid = posterMatch[1];
    }

    if (uuid) {
        const m3u8Prefix = `https://surrit.com/${uuid}`;
        const masterUrl = `${m3u8Prefix}/playlist.m3u8`;

        // 关键点：给 URL 加上 Referer 标记，很多播放器插件识别这个格式
        const headerSuffix = `#Referer=${appConfig.site}&Origin=${appConfig.site}`;

        try {
            // 2. 获取主索引内容
            const { data: m3u8Content } = await $fetch.get(masterUrl, {
                headers: { 
                    'User-Agent': UA,
                    'Referer': appConfig.site
                }
            });

            const lines = m3u8Content.split('\n');
            lines.forEach((line, index) => {
                line = line.trim();
                if (line.endsWith('.m3u8') && !line.includes('playlist.m3u8')) {
                    let label = '未知清晰度';
                    const prevLine = lines[index - 1] || '';
                    const resMatch = prevLine.match(/RESOLUTION=\d+x(\d+)/);
                    
                    if (resMatch) {
                        label = resMatch[1] + 'P';
                    } else {
                        label = line.split('/')[0].toUpperCase();
                    }

                    tracks.push({
                        name: label,
                        ext: {
                            // 将 Header 注入 URL
                            url: (line.startsWith('http') ? line : `${m3u8Prefix}/${line}`) + headerSuffix
                        }
                    });
                }
            });
        } catch (e) {
            // 如果主索引请求失败，可能是节点问题
        }

        // 3. 始终添加一个自动选项
        tracks.push({
            name: '自动 (Auto)',
            ext: { 
                url: masterUrl + headerSuffix 
            }
        });
    }

    // 4. 彻底的降级方案：全文本搜索任何 m3u8
    if (tracks.length === 0) {
        const cleanData = data.replace(/\\/g, '');
        const allM3u8 = cleanData.match(/https?:\/\/[\w\.\/\-]+\.m3u8/g);
        if (allM3u8) {
            allM3u8.forEach((link, i) => {
                if (!link.includes('playlist.m3u8')) {
                    tracks.push({
                        name: `备用线路 ${i+1}`,
                        ext: { url: link + `#Referer=${appConfig.site}` }
                    });
                }
            });
        }
    }

    return jsonify({
        list: [{
            title: '请选择清晰度 (若无法播放请重试)',
            tracks: tracks,
        }],
    });
}

async function getPlayinfo(ext) {
    ext = argsify(ext)
    const url = ext.url

    return jsonify({ urls: [url],headers: {
            'User-Agent': UA,
            'Referer': 'https://missav.ai/'
        }})
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
