const UA = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36';
const SITE = 'https://missav.ai';
const cheerio = createCheerio(); // 假设你的新环境依然支持 createCheerio 和 $fetch

// 必需：获取网站信息
async function getWebsiteInfo() {
  return {
    name: "MissAV",
    description: "MissAV - 免费高清在线视频",
    icon: "https://missav.ai/favicon.ico",
    homepage: SITE
  };
}

// 必需：获取视频列表 (这里默认获取“最近更新”分类，可根据需要调整 URL)
async function getVideoList(page) {
  if (!page) page = 1;
  const url = `${SITE}/new?page=${page}`;
    
  const { data } = await $fetch.get(url, {
    headers: {
      'User-Agent': UA
    },
  });
    
  const $ = cheerio.load(data);
  const videos = $('.thumbnail');
  let list = [];
    
  videos.each((_, e) => {
    const href = $(e).find('.text-secondary').attr('href');
    const title = $(e).find('.text-secondary').text().trim().replace(/\s+/g, ' ');
    const cover = $(e).find('.w-full').attr('data-src');
    const remarks = $(e).find('.left-1').text().trim();
    const duration = $(e).find('.right-1').text().trim();
        
    list.push({
      id: href,          // 在当前逻辑中，我们将详情页完整URL作为id
      title: title,
      cover: cover,
      url: href,
      description: `状态: ${remarks} | 时长: ${duration}`,
      createTime: Date.now() // MissAV列表未提供具体上传时间，暂用当前时间补全
    });
  });

  return list;
}

// 必需：获取视频详情
async function getVideoDetail(videoId) {
  // 这里的 videoId 实际上是 getVideoList 返回的 href，也就是详情页的 URL
  const url = videoId; 
  const m3u8Prefix = 'https://surrit.com/';
    
  const { data } = await $fetch.get(url, {
    headers: {
      'User-Agent': UA,
      'Referer': SITE + '/'
    },
  });
    
  const $ = cheerio.load(data);
  const title = $('h1.text-base').text().trim().replace(/\s+/g, ' ') || '视频标题';
  const cover = $('video').attr('poster') || '';
  const description = $('meta[name="description"]').attr('content') || '';
    
  let resolutions = [];
    
  // 提取 M3U8 及清晰度轨道逻辑（继承自旧 js）
  let uuid = '';
  // 兼容旧的 nineyu 和新的正则
  const match = data.match(/nineyu\.com\\\/([a-zA-Z0-9-]+)\\\/seek\\\/_0\.jpg/);
  if (match && match[1]) {
    uuid = match[1];
  } else {
    // 尝试匹配标准的 UUID 格式
    const uuidMatch = data.match(/[a-f0-9]{8}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{12}/);
    if (uuidMatch) uuid = uuidMatch[0];
  }

  if (uuid) {
    const masterM3u8 = `${m3u8Prefix}${uuid}/playlist.m3u8`;
    const { data: masterData } = await $fetch.get(masterM3u8, {
      headers: {
        'User-Agent': UA,
        'Referer': SITE + '/'
      }
    });

    if (masterData && masterData.includes('#EXTM3U')) {
      const lines = masterData.split('\n');
      lines.forEach((line, index) => {
        line = line.trim();
        if (line.includes('video.m3u8')) {
          let label = '未知';
          const prevLine = lines[index - 1] || '';
          const resMatch = prevLine.match(/RESOLUTION=\d+x(\d+)/);
          
          if (resMatch) {
            label = resMatch[1] + 'p';
          } else {
            label = line.split('/')[0].toLowerCase();
          }

          resolutions.push({
            id: label,
            name: label.toUpperCase(),
            url: `${m3u8Prefix}${uuid}/${line}`,
            size: "未知"
          });
        }
      });
            
      // 对分辨率进行降序排序 (1080p, 720p...)
      resolutions.sort((a, b) => {
        let valA = parseInt(a.name) || 0;
        let valB = parseInt(b.name) || 0;
        return valB - valA;
      });
    }
        
    // 最前面增加一个 Auto 源
    resolutions.unshift({
      id: 'auto',
      name: '自动(Auto)',
      url: masterM3u8,
      size: "未知"
    });
  }

  return {
    id: videoId,
    title: title,
    cover: cover,
    description: description,
    resolutions: resolutions
  };
}

// 可选：搜索功能
async function search(keyword) {
  const text = encodeURIComponent(keyword);
  // 若需分页，可在这里加上 page 参数传入，此处默认搜索第一页
  const url = `${SITE}/cn/search/${text}?page=1`;

  const { data } = await $fetch.get(url, {
    headers: {
      'User-Agent': UA
    },
  });

  const $ = cheerio.load(data);
  const videos = $('.thumbnail');
  let list = [];

  videos.each((_, e) => {
    const href = $(e).find('.text-secondary').attr('href');
    const title = $(e).find('.text-secondary').text().trim().replace(/\s+/g, ' ');
    const cover = $(e).find('.w-full').attr('data-src');
    const remarks = $(e).find('.left-1').text().trim();
    const duration = $(e).find('.right-1').text().trim();

    list.push({
      id: href,
      title: title,
      cover: cover,
      url: href,
      description: `状态: ${remarks} | 时长: ${duration}`,
      createTime: Date.now()
    });
  });

  return list;
}
