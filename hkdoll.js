const cheerio = createCheerio();
const CryptoJS = createCryptoJS();

const UA = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36';
const SITE = 'https://hongkongdollvideo.com';

// 必需：获取网站信息
async function getWebsiteInfo() {
  return {
    name: "hkdoll",
    description: "HongKongDoll 玩偶姐姐",
    icon: SITE + "/favicon.ico",
    homepage: SITE
  };
}

// 必需：获取视频列表
async function getVideoList(page) {
  if (!page) page = 1;
  let url = SITE + '/'; // 默认取首页内容，或者如果分类页可以自己在这调整

  if (page > 1) {
    // 根据原脚本的逻辑，翻页时在 url 后面拼加 page + '.html'
    // 假设默认使用 /recent/ 等通用分类路由，这里做容错处理，你可以根据实际分类替换为具体频道路径
    url = url + (url.endsWith('/') ? '' : '/') + page + '.html';
  }

  const { data } = await $fetch.get(url, {
    headers: {
      'User-Agent': UA
    },
  });

  const $ = cheerio.load(data);
  const videos = $('.video-item');
  let list = [];

  videos.each((_, element) => {
    const href = $(element).find('.thumb a').attr('href');
    const title = $(element).find('.thumb a').attr('title');
    const cover = $(element).find('.thumb img').attr('data-src');
    const subTitle = $(element).find('.duratio').text().trim();

    // 格式化 url 为绝对路径
    let fullHref = href;
    if (href && !href.startsWith('http')) {
        fullHref = href.startsWith('/') ? SITE + href : SITE + '/' + href;
    }

    list.push({
      id: fullHref,
      title: title || '未知标题',
      cover: cover,
      url: fullHref,
      description: `时长: ${subTitle}`,
      createTime: Date.now()
    });
  });

  return list;
}

// 必需：获取视频详情
async function getVideoDetail(videoId) {
  const url = videoId;
  const { data } = await $fetch.get(url, {
    headers: {
      'User-Agent': UA,
      'Referer': SITE + '/'
    },
  });

  const $ = cheerio.load(data);
  
  // 基础信息获取 (容错处理)
  let title = $('title').text().trim() || '视频详情';
  let cover = ''; // 原版播放页没有暴露封面，这里可为空或使用 videoId 传进来的
  let description = title;
  
  let resolutions = [];
 
  try {
    const param = $('script:contains(__PAGE__PARAMS__)')
        .text()
        .split('var __PAGE__PARAMS__="')[1]
        .split('"')[0];

    let pageLoader = decode(param);
    let embedUrl = pageLoader.player.embedUrl;
    let playUrl = getPlayUrl(embedUrl);

    resolutions.push({
      id: 'auto',
      name: '自动(Auto)',
      url: playUrl,
      size: ""
    });
  } catch (error) {
    // 解析失败
    console.log(error);
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
  let text = encodeURIComponent(keyword);
  // 若需分页，可在这里加上 page 参数传入，此处默认搜索第一页
  let page = 1; 
  let url = `${SITE}/search/${text}/${page}.html`;

  const { data } = await $fetch.get(url, {
    headers: {
      'User-Agent': UA
    },
  });

  const $ = cheerio.load(data);
  const videos = $('.video-item');
  let list = [];

  videos.each((_, element) => {
    const href = $(element).find('.thumb a').attr('href');
    const title = $(element).find('.thumb a').attr('title');
    const cover = $(element).find('.thumb img').attr('data-src');
    const subTitle = $(element).find('.duratio').text().trim();

    let fullHref = href;
    if (href && !href.startsWith('http')) {
        fullHref = href.startsWith('/') ? SITE + href : SITE + '/' + href;
    }

    list.push({
      id: fullHref,
      title: title || '未知标题',
      cover: cover,
      url: fullHref,
      description: `时长: ${subTitle}`,
      createTime: Date.now()
    });
  });

  return list;
}

// --- 视频解析辅助函数 ---

function decode(_0x558b38) {
  let key = _0x558b38.slice(-32);
  let encrypedConf = _0x558b38.substring(0, _0x558b38.length - 32);
  let pageConfig = JSON.parse(xorDec(encrypedConf, key));

  return pageConfig;
}

function xorDec(_0x3b697f, _0x37f8e7) {
  let _0x2bec78 = '';
  const _0x1f8156 = _0x37f8e7.length;
  for (let _0x4b08c8 = 0; _0x4b08c8 < _0x3b697f.length; _0x4b08c8 += 2) {
      const _0x312f0e = _0x3b697f.substr(_0x4b08c8, 2),
            _0x33eb88 = String.fromCharCode(parseInt(_0x312f0e, 16)),
            _0x323ef5 = _0x37f8e7[(_0x4b08c8 / 2) % _0x1f8156];
      _0x2bec78 += String.fromCharCode(_0x33eb88.charCodeAt(0) ^ _0x323ef5.charCodeAt(0));
  }
  return _0x2bec78;
}

function getPlayUrl(embedUrl) {
  let _0x1e8df = embedUrl.split('?token=')[1];
  let _0x1df1c5 = _0x1e8df.slice(-10);
  let _0x2c272d = md5(_0x1df1c5).slice(8, 24).split('').reverse().join('');
  let _0x32366e = _0x1e8df.slice(0, -10);

  var _0x4951c4 = {};
  let _0x4049bd = _0x535536(_0x32366e, _0x2c272d);
  _0x4951c4 = JSON.parse(_0x4049bd);
  return _0x4951c4.stream;
}

function md5(_0x1e8df) {
  return CryptoJS.MD5(_0x1e8df).toString();
}

function _0x535536(_0x12d383, _0x391fc7) {
  let _0x8ccc83 = '';
  let _0x451061 = _0x391fc7.length;
  for (let _0x373381 = 0; _0x373381 < _0x12d383.length; _0x373381 += 2) {
      let _0x2de3e5 = (_0x373381 / 2) % _0x451061;
      let _0x386dd5 = parseInt(_0x12d383[_0x373381] + _0x12d383[_0x373381 + 1], 16);
      _0x8ccc83 += String.fromCharCode(_0x386dd5 ^ _0x391fc7.charCodeAt(_0x2de3e5));
  }
  return _0x8ccc83;
}