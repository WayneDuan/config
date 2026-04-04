const cheerio = createCheerio()
const UA = "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/130.0.0.0 Safari/537.36"
const headers = {
  'Referer': 'https://m.agedm.io/',
  'Origin': 'https://m.agedm.io',
  'User-Agent': UA,
}

const appConfig = {
  ver: 1,
  title: "AGE",
  site: "https://m.agedm.io/#/",
  tabs: [{
    name: '最近更新',
    ext: {
      id: 0,
    }
,
  }]
}

async function getConfig() {
    return jsonify(appConfig)
}

async function getCards(ext) {
  ext = argsify(ext)
  let cards = []
  let id = ext.id
  let page = ext.page || 1

  const url = `https://api.agedm.io/v2/catalog?genre=all&label=all&letter=all&order=time&region=all&resource=all&season=all&status=all&year=all&size=20&page=${page}`

  const { data } = await $fetch.get(url, {
    headers
  })
  
  argsify(data).videos?.forEach( each => {
    cards.push({
      vod_id: `${each.id}`,
      vod_name: each.name,
      vod_pic: each.cover,
      vod_remarks: each.uptodate,
      ext: {
        url: `https://api.agedm.io/v2/detail/${each.id}`,
      },
    });
  })

  return jsonify({
      list: cards,
  });
}

async function getTracks(ext) {
  ext = argsify(ext)
  let groups = []
  let url = ext.url

  // 发送请求
  const { data } = await $fetch.get(url, {
      headers
  });
  
  const json = argsify(data)
  const player_label_arr = json.player_label_arr
  const playlists = json.video.playlists
  const vip = json.player_jx.vip
  const zj = json.player_jx.zj
  const player_vip = json.player_vip

  for (var key in playlists) {
    if (!key.includes('m3u8')){
      continue
    }
    let v = playlists[key]
    let group = {
      title: player_label_arr[key],
      tracks: [],
    }
    v.forEach( each => {
      if (each.length == 2) {
        let path = `${zj}${each[1]}`
        if (player_vip.hasOwnProperty(key)) {
          path = `${vip}${each[1]}`
        }
        group.tracks.push({
          name: each[0],
          pan: '',
          ext: {
            url: path
          }
        })
      }
    })
    if (group.tracks.length > 0) {
      groups.push(group)
    }
  }
  
  return jsonify({ list: groups })
}

async function getPlayinfo(ext) {
    ext = argsify(ext)
    let url = ext.url
    const { data } = await $fetch.get(url, {
        headers
    })
    const m3u = data.match(/Vurl = '(.+?)'/)[1]
    return jsonify({ 'urls': [m3u] })
}

async function _xptvSearch(ext) {
  ext = argsify(ext)
  let cards = [];

  let text = encodeURIComponent(ext.text)
  let page = ext.page || 1

  const url = `https://api.agedm.io/v2/search?query=${text}&page=${page}`
  const { data } = await $fetch.get(url, {
    headers
  })
  
  argsify(data).data?.videos?.forEach( each => {
    cards.push({
      vod_id: `${each.id}`,
      vod_name: each.name,
      vod_pic: each.cover,
      vod_remarks: each.uptodate,
      ext: {
        url: `https://api.agedm.io/v2/detail/${each.id}`,
      },
    });
  })

  return jsonify({
      list: cards,
  });
}

const SITE = appConfig.site;

// === hkdoll.js compatible API ===

async function getWebsiteInfo() {
    return {
        name: appConfig.title,
        description: appConfig.title,
        icon: SITE + '/favicon.ico',
        homepage: SITE,
    };
}

async function getCategories() {
    return (appConfig.tabs || []).map((tab, index) => ({
        id: String(index + 1),
        name: tab.name,
        ext: tab.ext,
    }));
}

async function getVideosByCategory(categoryId, page) {
    const categories = await getCategories();
    const category = categories.find((item) => item.id === String(categoryId));
    if (!category) return [];
    const extObj = { ...category.ext, page: page || 1 };
    const raw = await getCards(JSON.stringify(extObj));
    const result = JSON.parse(raw);
    return (result.list || []).map(item => ({
        id: item.vod_id,
        title: item.vod_name,
        cover: item.vod_pic,
        url: item.vod_id,
        description: item.vod_remarks || '',
        createTime: Date.now(),
    }));
}

async function getVideoList(page, categoryUrl) {
    const extObj = { url: categoryUrl, page: page || 1 };
    const raw = await getCards(JSON.stringify(extObj));
    const result = JSON.parse(raw);
    return (result.list || []).map(item => ({
        id: item.vod_id,
        title: item.vod_name,
        cover: item.vod_pic,
        url: item.vod_id,
        description: item.vod_remarks || '',
        createTime: Date.now(),
    }));
}

async function getVideoDetail(videoId) {
    const extObj = { url: videoId, id: videoId };
    const raw = await getTracks(JSON.stringify(extObj));
    const result = JSON.parse(raw);
    const tracks = result.list || [];
    const resolutions = [];
    tracks.forEach(track => {
        const urls = Array.isArray(track.urls) ? track.urls : [track.urls];
        urls.forEach((url, i) => {
            resolutions.push({
                id: String(track.vod_name || track.name || '') + (i > 0 ? '_' + i : ''),
                name: String(track.vod_name || track.name || ''),
                url: url,
            });
        });
    });
    return {
        id: videoId,
        title: tracks[0] ? String(tracks[0].vod_name || tracks[0].name || '') : '',
        cover: '',
        description: '',
        resolutions,
    };
}

async function search(keyword) {
    const ext = JSON.stringify({ text: keyword, page: 1 });
    const raw = await _xptvSearch(ext);
    const result = JSON.parse(raw);
    return (result.list || []).map(item => ({
        id: item.vod_id,
        title: item.vod_name,
        cover: item.vod_pic,
        url: item.vod_id,
        description: item.vod_remarks || '',
        createTime: Date.now(),
    }));
}

module.exports = {
    getWebsiteInfo,
    getCategories,
    getVideosByCategory,
    getVideoList,
    getVideoDetail,
    search,
};
