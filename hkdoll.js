const cheerio = createCheerio();
const CryptoJS = createCryptoJS();

const UA = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36';
const SITE = 'https://hongkongdollvideo.com';
const IGNORE_TABS = ['亚洲成人视频'];

let tabsCache = null;

function toAbsoluteUrl(url) {
  if (!url) return '';
  const u = String(url).trim();
  if (!u) return '';
  if (u.startsWith('http://') || u.startsWith('https://')) return u;
  if (u.startsWith('//')) return 'https:' + u;
  if (u.startsWith('/')) return SITE + u;
  return SITE + '/' + u.replace(/^\.?\//, '');
}

function buildPagedUrl(url, page) {
  if (!page || page <= 1) return url;
  const normalized = url.endsWith('/') ? url : `${url}/`;
  return `${normalized}${page}.html`;
}

async function getTabs() {
  const list = [];
  const seen = new Set();

  const isIgnored = (name) => {
    if (!name) return false; // 空名不直接过滤，避免误伤
    return IGNORE_TABS.some((keyword) => name.includes(keyword));
  };

  try {
    const { data } = await $fetch.get(SITE, {
      headers: { 'User-Agent': UA },
      userAgent: UA,
    });
    const $ = cheerio.load(data || '');

    $('.scrollbar a').each((_, e) => {
      const name = (($(e).text() || '').trim()).replace(/\s+/g, ' ');
      const href = $(e).attr('href');
      if (!href || isIgnored(name)) return;

      const abs = encodeURI(toAbsoluteUrl(href));
      if (!abs || seen.has(abs)) return;
      seen.add(abs);

      list.push({
        name: name || '未命名分类',
        ext: { url: abs },
      });
    });
  } catch (error) {
    console.log('getTabs error:', error);
  }

  return list;
}

async function getWebsiteInfo() {
  return {
    name: 'hkdoll',
    description: 'HongKongDoll 玩偶姐姐',
    icon: SITE + '/favicon.ico',
    homepage: SITE
  };
}

async function getCategories() {
  if (tabsCache) return tabsCache;

  const tabs = await getTabs();
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
  const categoryUrl = category && category.ext ? category.ext.url : SITE + '/';
  return getVideoList(page, categoryUrl);
}

async function getVideoList(page, categoryUrl) {
  if (!page) page = 1;
  const baseUrl = categoryUrl || SITE + '/';
  const url = buildPagedUrl(baseUrl, page);

  const { data } = await $fetch.get(url, {
    headers: { 'User-Agent': UA },
    userAgent: UA,
  });

  const $ = cheerio.load(data || '');
  const videos = $('.video-item');
  const list = [];

  videos.each((_, element) => {
    const link = $(element).find('.thumb a');
    const href = link.attr('href');
    const title = (link.attr('title') || link.text() || '').trim();

    const img = $(element).find('.thumb img');
    const cover = img.attr('data-src') || img.attr('src') || '';

    const subTitle = (
      $(element).find('.duratio').text() ||
      $(element).find('.duration').text() ||
      ''
    ).trim();

    const fullHref = toAbsoluteUrl(href);
    if (!fullHref) return;

    list.push({
      id: fullHref,
      title: title || '未知标题',
      cover: toAbsoluteUrl(cover),
      url: fullHref,
      description: `时长: ${subTitle}`,
      createTime: Date.now()
    });
  });

  return list;
}
// 不实现 getSortOptions() 也可以
// 或者显式返回空（两种方式都行）
async function getSortOptions() {
  return null;
}
async function getVideoDetail(videoId) {
  const url = videoId;
  const { data } = await $fetch.get(url, {
    headers: {
      'User-Agent': UA,
      'Referer': SITE + '/'
    },
    userAgent: UA,
  });

  const html = data || '';
  const $ = cheerio.load(html);

  let title = $('title').text().trim() || '视频详情';
  let cover = $('meta[property="og:image"]').attr('content') || '';
  let description = $('meta[name="description"]').attr('content') || title;

  const resolutions = [];

  try {
    const scriptText = $('script:contains(__PAGE__PARAMS__)').text() || '';
    const marker = 'var __PAGE__PARAMS__="';
    const start = scriptText.indexOf(marker);
    if (start >= 0) {
      const remain = scriptText.slice(start + marker.length);
      const end = remain.indexOf('"');
      if (end > 0) {
        const param = remain.slice(0, end);
        const pageLoader = decode(param);
        const embedUrl = pageLoader && pageLoader.player ? pageLoader.player.embedUrl : '';
        if (embedUrl) {
          const playUrl = getPlayUrl(embedUrl);
          if (playUrl) {
            resolutions.push({
              id: 'auto',
              name: '自动(Auto)',
              url: playUrl,
              size: ''
            });
          }
        }
      }
    }
  } catch (error) {
    console.log('getVideoDetail parse error:', error);
  }

  return {
    id: videoId,
    title,
    cover: toAbsoluteUrl(cover),
    description,
    resolutions
  };
}

async function search(keyword) {
  const text = encodeURIComponent(keyword || '');
  const page = 1;
  const url = `${SITE}/search/${text}/${page}.html`;

  const { data } = await $fetch.get(url, {
    headers: { 'User-Agent': UA },
    userAgent: UA,
  });

  const $ = cheerio.load(data || '');
  const videos = $('.video-item');
  const list = [];

  videos.each((_, element) => {
    const link = $(element).find('.thumb a');
    const href = link.attr('href');
    const title = (link.attr('title') || link.text() || '').trim();

    const img = $(element).find('.thumb img');
    const cover = img.attr('data-src') || img.attr('src') || '';

    const subTitle = (
      $(element).find('.duratio').text() ||
      $(element).find('.duration').text() ||
      ''
    ).trim();

    const fullHref = toAbsoluteUrl(href);
    if (!fullHref) return;

    list.push({
      id: fullHref,
      title: title || '未知标题',
      cover: toAbsoluteUrl(cover),
      url: fullHref,
      description: `时长: ${subTitle}`,
      createTime: Date.now()
    });
  });

  return list;
}

// --- 视频解析辅助函数 ---

function decode(_0x558b38) {
  const key = _0x558b38.slice(-32);
  const encrypedConf = _0x558b38.substring(0, _0x558b38.length - 32);
  return JSON.parse(xorDec(encrypedConf, key));
}

function xorDec(_0x3b697f, _0x37f8e7) {
  let _0x2bec78 = '';
  const _0x1f8156 = _0x37f8e7.length;
  for (let _0x4b08c8 = 0; _0x4b08c8 < _0x3b697f.length; _0x4b08c8 += 2) {
    const _0x312f0e = _0x3b697f.substr(_0x4b08c8, 2);
    const _0x33eb88 = String.fromCharCode(parseInt(_0x312f0e, 16));
    const _0x323ef5 = _0x37f8e7[(_0x4b08c8 / 2) % _0x1f8156];
    _0x2bec78 += String.fromCharCode(_0x33eb88.charCodeAt(0) ^ _0x323ef5.charCodeAt(0));
  }
  return _0x2bec78;
}

function getPlayUrl(embedUrl) {
  const token = (embedUrl.split('?token=')[1] || '');
  if (!token || token.length < 10) return '';

  const tail = token.slice(-10);
  const key = md5(tail).slice(8, 24).split('').reverse().join('');
  const body = token.slice(0, -10);

  const raw = _0x535536(body, key);
  const json = JSON.parse(raw);
  return json.stream || '';
}

function md5(v) {
  return CryptoJS.MD5(v).toString();
}

function _0x535536(_0x12d383, _0x391fc7) {
  let _0x8ccc83 = '';
  const _0x451061 = _0x391fc7.length;
  for (let _0x373381 = 0; _0x373381 < _0x12d383.length; _0x373381 += 2) {
    const _0x2de3e5 = (_0x373381 / 2) % _0x451061;
    const _0x386dd5 = parseInt(_0x12d383[_0x373381] + _0x12d383[_0x373381 + 1], 16);
    _0x8ccc83 += String.fromCharCode(_0x386dd5 ^ _0x391fc7.charCodeAt(_0x2de3e5));
  }
  return _0x8ccc83;
}

if (typeof module !== 'undefined' && module.exports) {
  module.exports = {
    getWebsiteInfo,
    getVideoList,
    getVideoDetail,
    search,
    getCategories,
    getVideosByCategory,
  };
}
