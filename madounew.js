const UA = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36';
const SITE = 'https://madou.club';
const cheerio = createCheerio();

let tabsCache = null;
let sessionReady = false;

const baseHeaders = {
  'User-Agent': UA,
};

async function ensureSession() {
  if (sessionReady) return;
  await $fetch.get(SITE + '/', { headers: baseHeaders, userAgent: UA });
  sessionReady = true;
}

// 缓存分类
async function getCategories() {
  if (tabsCache) return tabsCache;
  
  await ensureSession();

  const ignore = ['首页', '其他', '热门标签', '筛选'];
  const { data } = await $fetch.get(SITE, { headers: baseHeaders, userAgent: UA });
  const $ = cheerio.load(data || '');

  let list = [];
  let id = 1;

  $('.sitenav a').each((_, e) => {
    const name = $(e).text().trim();
    const href = $(e).attr('href');
    if (ignore.some(el => name.includes(el))) return;
    if (!href) return;

    list.push({
      id: String(id++),
      name,
      ext: { url: href }
    });
  });

  tabsCache = list;
  return tabsCache;
}

async function getWebsiteInfo() {
  return {
    name: "麻豆社",
    description: "麻豆社",
    icon: SITE + "/favicon.ico",
    homepage: SITE
  };
}

async function getVideosByCategory(categoryId, page) {
  const categories = await getCategories();
  const category = categories.find((item) => item.id === String(categoryId));
  // 找不到分类时默认首页
  const categoryUrl = category && category.ext ? category.ext.url : SITE;
  return getVideoList(page, categoryUrl);
}

async function getVideoList(page, categoryUrl) {
  await ensureSession();

  const currentPage = page || 1;
  let url = categoryUrl;

  if (currentPage > 1) {
    if (url.endsWith('/')) {
        url = url + 'page/' + currentPage;
    } else {
        url = url + '/page/' + currentPage;
    }
  }

  const { data } = await $fetch.get(url, {
    headers: baseHeaders,
    userAgent: UA
  });

  const $ = cheerio.load(data || '');
  let list = [];

  $('.excerpts-wrapper article').each((_, element) => {
    const aTag = $(element).find('a');
    const href = aTag.attr('href');
    const title = $(element).find('h2').text().trim();
    const imgTag = $(element).find('img');
    const cover = imgTag.attr('data-src') || imgTag.attr('src');
    const subTitle = $(element).find('.post-view').text().trim();

    if (!href) return;

    list.push({
      id: href,
      title: title || '未知标题',
      cover: cover || '',
      url: href,
      description: subTitle,
      createTime: Date.now()
    });
  });

  return list;
}

async function getVideoDetail(videoId) {
  await ensureSession();

  const url = videoId; // id直接就是完整链接
  const { data } = await $fetch.get(url, {
    headers: baseHeaders,
    userAgent: UA
  });

  const $ = cheerio.load(data || '');
  const title = $('h1.article-title').text().trim() || $('title').text().trim() || '视频标题';
  const description = $('.article-content p').first().text().trim() || '';
  
  let resolutions = [];
  let iframeSrc = $('.article-content iframe').attr('src');

  if (iframeSrc) {
    try {
      const dash = iframeSrc.match(/^(https?:\/\/[^\/]+)/)[1];
      const dashResp = await $fetch.get(iframeSrc, { headers: baseHeaders, userAgent: UA });
      const $2 = cheerio.load(dashResp.data || '');
      
      let htmlScript = '';
      $2('body script').each((_, el) => {
        const text = $2(el).html();
        if (text && text.includes('var m3u8')) {
          htmlScript = text;
        }
      });
      if (!htmlScript) {
        // Fallback
        htmlScript = $2('body script').eq(5).html() || '';
      }

      if (htmlScript) {
        const tokenMatch = htmlScript.match(/var\s+token\s*=\s*"([^"]+)";/);
        const m3u8Match = htmlScript.match(/var\s+m3u8\s*=\s*'([^']+)'/);
        
        if (tokenMatch && m3u8Match) {
          const playUrl = dash + m3u8Match[1] + '?token=' + tokenMatch[1];
          resolutions.push({
            id: 'auto',
            name: '默认分组',
            url: playUrl,
            size: "未知"
          });
        }
      }
    } catch (e) {
      console.log('Error parsing iframe stream:', e);
    }
  }

  return {
    id: videoId,
    title: title,
    cover: '', // 封面从列表页获取，详情页有时没有通用标签
    description: description,
    resolutions: resolutions
  };
}

async function search(keyword, page) {
  await ensureSession();

  const text = encodeURIComponent(keyword);
  const currentPage = page || 1;
  const url = SITE + `/page/${currentPage}?s=${text}`;

  const { data } = await $fetch.get(url, {
    headers: baseHeaders,
    userAgent: UA
  });

  const $ = cheerio.load(data || '');
  let list = [];

  $('.excerpts-wrapper article').each((_, element) => {
    const aTag = $(element).find('a');
    const href = aTag.attr('href');
    const title = $(element).find('h2').text().trim();
    const imgTag = $(element).find('img');
    const cover = imgTag.attr('data-src') || imgTag.attr('src');
    const subTitle = $(element).find('.post-view').text().trim();

    if (!href) return;

    list.push({
      id: href,
      title: title || '未知标题',
      cover: cover || '',
      url: href,
      description: subTitle,
      createTime: Date.now()
    });
  });

  return list;
}

module.exports = {
  getWebsiteInfo,
  getCategories,
  getVideosByCategory,
  getVideoList,
  getVideoDetail,
  search
};
