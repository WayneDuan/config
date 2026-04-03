const UA = 'Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Mobile/15E148 Safari/604.1';
const SITE = 'https://missav.ai';
const cheerio = createCheerio();
let tabsCache = null;
let sessionReady = false;

const baseHeaders = {
  'User-Agent': UA,
  'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
  'Accept-Language': 'ja-JP,ja;q=0.9,zh-CN;q=0.8,en-US;q=0.7,en;q=0.6',
  'Referer': SITE + '/',
  'Origin': SITE,
  'Sec-Fetch-Site': 'same-origin',
  'Sec-Fetch-Mode': 'navigate',
  'Sec-Fetch-Dest': 'document',
};

async function ensureSession() {
  if (sessionReady) return;
  await $fetch.get(SITE + '/', { headers: baseHeaders, userAgent: UA });
  sessionReady = true;
}

async function getWebsiteInfo() {
  return {
    name: "MissAV",
    description: "MissAV - 免费高清在线视频",
    icon: "https://missav.ai/favicon.ico",
    homepage: SITE
  };
}

async function getCategories() {
  if (tabsCache) return tabsCache;

  const tabs = [
    { name: '中文字幕', ext: { url: SITE + '/dm265/ja/chinese-subtitle' } },
    { name: '无码流出', ext: { url: SITE + '/dm628/ja/uncensored-leak' } },
    { name: '最近更新', ext: { url: SITE + '/dm515/ja/new' } },
    { name: 'FC2', ext: { url: SITE + '/dm150/ja/fc2' } },
    { name: '麻豆传媒', ext: { url: SITE + '/dm34/cn/madou' } }
  ];

  tabsCache = tabs.map((tab, index) => ({
    id: String(index + 1),
    name: tab.name,
    ext: tab.ext,
  }));

  return tabsCache;
}

async function getVideosByCategory(categoryId, page) {
  const categories = await getCategories();
  const category = categories.find((item) => item.id === String(categoryId));
  const categoryUrl = category && category.ext ? category.ext.url : SITE + '/dm515/ja/new';
  return getVideoList(page, categoryUrl);
}

async function getVideoList(page, categoryUrl) {
  await ensureSession();

  if (!page) page = 1;
  const baseUrl = categoryUrl || `${SITE}/dm515/ja/new`;
  const url = baseUrl.includes('?') ? `${baseUrl}&page=${page}` : `${baseUrl}?page=${page}`;

  const { data } = await $fetch.get(url, {
    headers: baseHeaders,
    userAgent: UA
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

async function getVideoDetail(videoId) {
  await ensureSession();

  const url = videoId;
  const m3u8Prefix = 'https://surrit.com/';

  const { data } = await $fetch.get(url, {
    headers: baseHeaders,
    userAgent: UA
  });

  const $ = cheerio.load(data);
  const title = $('h1.text-base').text().trim().replace(/\s+/g, ' ') || '视频标题';
  const cover = $('video').attr('poster') || '';
  const description = $('meta[name="description"]').attr('content') || '';

  let resolutions = [];

  let uuid = '';
  const match = data.match(/nineyu\.com\\\/([a-zA-Z0-9-]+)\\\/seek\\\/_0\.jpg/);
  if (match && match[1]) {
    uuid = match[1];
  } else {
    const uuidMatch = data.match(/[a-f0-9]{8}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{12}/);
    if (uuidMatch) uuid = uuidMatch[0];
  }

  if (uuid) {
    const masterM3u8 = `${m3u8Prefix}${uuid}/playlist.m3u8`;
    const { data: masterData } = await $fetch.get(masterM3u8, {
      headers: baseHeaders,
      userAgent: UA
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

      resolutions.sort((a, b) => {
        let valA = parseInt(a.name) || 0;
        let valB = parseInt(b.name) || 0;
        return valB - valA;
      });
    }

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

async function search(keyword) {
  await ensureSession();

  const text = encodeURIComponent(keyword);
  const url = `${SITE}/cn/search/${text}?page=1`;

  const { data } = await $fetch.get(url, {
    headers: baseHeaders,
    userAgent: UA
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