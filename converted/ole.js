// XPTV polyfills for app compatibility
const jsonify = (data) => JSON.stringify(data);
const argsify = (str) => {
    if (typeof str === 'string') { try { return JSON.parse(str); } catch(e) { return str; } }
    return str;
};

const cheerio = createCheerio()
const CryptoJS = createCryptoJS()

const UA =


	'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36 Edg/122.0.0.0'
const headers = {
	'User-Agent': UA,
}

const appConfig = {
	ver: 20260322,
	title: '歐樂影視',
	site: 'https://api.olelive.com',
}
const filterList = {
	1: [
		{
			key: 'cateId',
			name: '分类',
			value: [
				{ n: '全部', v: '0' },
				{ n: '动作片', v: '101' },
				{ n: '喜剧片', v: '102' },
				{ n: '爱情片', v: '103' },
				{ n: '科幻片', v: '104' },
				{ n: '恐怖片', v: '105' },
				{ n: '剧情片', v: '106' },
				{ n: '战争片', v: '107' },
				{ n: '动画片', v: '108' },
				{ n: '悬疑片', v: '109' },
				{ n: '惊悚片', v: '110' },
				{ n: '纪录片', v: '111' },
				{ n: '奇幻片', v: '112' },
				{ n: '犯罪片', v: '113' },
			],
		},
		{
			key: 'area',
			name: '地区',
			value: [
				{ n: '全部', v: '' },
				{ n: '大陆', v: '大陆' },
				{ n: '香港', v: '香港' },
				{ n: '台湾', v: '台湾' },
				{ n: '美国', v: '美国' },
				{ n: '韩国', v: '韩国' },
				{ n: '日本', v: '日本' },
				{ n: '印度', v: '印度' },
				{ n: '英国', v: '英国' },
				{ n: '法国', v: '法国' },
				{ n: '加拿大', v: '加拿大' },
				{ n: '西班牙', v: '西班牙' },
				{ n: '德国', v: '德国' },
				{ n: '俄罗斯', v: '俄罗斯' },
				{ n: '意大利', v: '意大利' },
				{ n: '泰国', v: '泰国' },
				{ n: '新加坡', v: '新加坡' },
				{ n: '马来西亚', v: '马来西亚' },
				{ n: '其它', v: '其它' },
			],
		},
		{
			key: 'year',
			name: '年份',
			value: [
				{ n: '全部', v: '' },
				{ n: '2026', v: '2026' },
				{ n: '2025', v: '2025' },
				{ n: '2024', v: '2024' },
				{ n: '2023', v: '2023' },
				{ n: '2022', v: '2022' },
				{ n: '2021', v: '2021' },
				{ n: '2020', v: '2020' },
				{ n: '2019', v: '2019' },
				{ n: '2018', v: '2018' },
				{ n: '2017', v: '2017' },
				{ n: '2016', v: '2016' },
				{ n: '2015', v: '2015' },
				{ n: '2014', v: '2014' },
				{ n: '2013', v: '2013' },
				{ n: '2012', v: '2012' },
				{ n: '2011', v: '2011' },
				{ n: '2010', v: '2010' },
				{ n: '2009', v: '2009' },
				{ n: '2008', v: '2008' },
				{ n: '2007', v: '2007' },
				{ n: '2006', v: '2006' },
				{ n: '2005', v: '2005' },
				{ n: '2004', v: '2004' },
				{ n: '2003', v: '2003' },
				{ n: '2002', v: '2002' },
				{ n: '2001', v: '2001' },
				{ n: '2000', v: '2000' },
			],
		},
		{
			key: 'by',
			name: '排序',
			value: [
				{ n: '按最新', v: 'update' },
				{ n: '按添加', v: 'desc' },
				{ n: '按最热', v: 'hot' },
				{ n: '按评分', v: 'score' },
			],
		},
	],
	2: [
		{
			key: 'cateId',
			name: '分类',
			value: [
				{ n: '全部', v: '' },
				{ n: '国产剧', v: '202' },
				{ n: '欧美剧', v: '201' },
				{ n: '港台剧', v: '203' },
				{ n: '日韩剧', v: '204' },
			],
		},
		{
			key: 'area',
			name: '地区',
			value: [
				{ n: '全部', v: '' },
				{ n: '大陆', v: '大陆' },
				{ n: '香港', v: '香港' },
				{ n: '台湾', v: '台湾' },
				{ n: '美国', v: '美国' },
				{ n: '韩国', v: '韩国' },
				{ n: '日本', v: '日本' },
				{ n: '印度', v: '印度' },
				{ n: '英国', v: '英国' },
				{ n: '法国', v: '法国' },
				{ n: '加拿大', v: '加拿大' },
				{ n: '西班牙', v: '西班牙' },
				{ n: '俄罗斯', v: '俄罗斯' },
				{ n: '意大利', v: '意大利' },
				{ n: '泰国', v: '泰国' },
				{ n: '新加坡', v: '新加坡' },
				{ n: '马来西亚', v: '马来西亚' },
				{ n: '其它', v: '其它' },
			],
		},
		{
			key: 'year',
			name: '年份',
			value: [
				{ n: '全部', v: '' },
				{ n: '2026', v: '2026' },
				{ n: '2025', v: '2025' },
				{ n: '2024', v: '2024' },
				{ n: '2023', v: '2023' },
				{ n: '2022', v: '2022' },
				{ n: '2021', v: '2021' },
				{ n: '2020', v: '2020' },
				{ n: '2019', v: '2019' },
				{ n: '2018', v: '2018' },
				{ n: '2017', v: '2017' },
				{ n: '2016', v: '2016' },
				{ n: '2015', v: '2015' },
				{ n: '2014', v: '2014' },
				{ n: '2013', v: '2013' },
				{ n: '2012', v: '2012' },
				{ n: '2011', v: '2011' },
				{ n: '2010', v: '2010' },
				{ n: '2009', v: '2009' },
				{ n: '2008', v: '2008' },
				{ n: '2007', v: '2007' },
				{ n: '2006', v: '2006' },
				{ n: '2005', v: '2005' },
				{ n: '2004', v: '2004' },
				{ n: '2003', v: '2003' },
				{ n: '2002', v: '2002' },
				{ n: '2001', v: '2001' },
				{ n: '2000', v: '2000' },
			],
		},
		{
			key: 'by',
			name: '排序',
			value: [
				{ n: '按最新', v: 'update' },
				{ n: '按添加', v: 'desc' },
				{ n: '按最热', v: 'hot' },
				{ n: '按评分', v: 'score' },
			],
		},
	],
	3: [
		{
			key: 'cateId',
			name: '分类',
			value: [
				{ n: '全部', v: '' },
				{ n: '真人秀', v: '305' },
				{ n: '音乐', v: '302' },
				{ n: '搞笑', v: '304' },
				{ n: '家庭', v: '301' },
				{ n: '曲艺', v: '303' },
			],
		},
		{
			key: 'area',
			name: '地区',
			value: [
				{ n: '全部', v: '' },
				{ n: '大陆', v: '大陆' },
				{ n: '香港', v: '香港' },
				{ n: '台湾', v: '台湾' },
				{ n: '美国', v: '美国' },
				{ n: '韩国', v: '韩国' },
				{ n: '日本', v: '日本' },
				{ n: '印度', v: '印度' },
				{ n: '英国', v: '英国' },
				{ n: '法国', v: '法国' },
				{ n: '加拿大', v: '加拿大' },
				{ n: '西班牙', v: '西班牙' },
				{ n: '俄罗斯', v: '俄罗斯' },
				{ n: '意大利', v: '意大利' },
				{ n: '泰国', v: '泰国' },
				{ n: '新加坡', v: '新加坡' },
				{ n: '马来西亚', v: '马来西亚' },
				{ n: '其它', v: '其它' },
			],
		},
		{
			key: 'year',
			name: '年份',
			value: [
				{ n: '全部', v: '' },
				{ n: '2026', v: '2026' },
				{ n: '2025', v: '2025' },
				{ n: '2024', v: '2024' },
				{ n: '2023', v: '2023' },
				{ n: '2022', v: '2022' },
				{ n: '2021', v: '2021' },
				{ n: '2020', v: '2020' },
				{ n: '2019', v: '2019' },
				{ n: '2018', v: '2018' },
				{ n: '2017', v: '2017' },
				{ n: '2016', v: '2016' },
				{ n: '2015', v: '2015' },
				{ n: '2014', v: '2014' },
				{ n: '2013', v: '2013' },
				{ n: '2012', v: '2012' },
				{ n: '2011', v: '2011' },
				{ n: '2010', v: '2010' },
				{ n: '2009', v: '2009' },
				{ n: '2008', v: '2008' },
				{ n: '2007', v: '2007' },
				{ n: '2006', v: '2006' },
				{ n: '2005', v: '2005' },
				{ n: '2004', v: '2004' },
				{ n: '2003', v: '2003' },
				{ n: '2002', v: '2002' },
				{ n: '2001', v: '2001' },
				{ n: '2000', v: '2000' },
			],
		},
		{
			key: 'by',
			name: '排序',
			value: [
				{ n: '按最新', v: 'update' },
				{ n: '按添加', v: 'desc' },
				{ n: '按最热', v: 'hot' },
				{ n: '按评分', v: 'score' },
			],
		},
	],
	4: [
		{
			key: 'cateId',
			name: '分类',
			value: [
				{ n: '全部', v: '' },
				{ n: '日本', v: '401' },
				{ n: '国产', v: '402' },
				{ n: '欧美', v: '403' },
			],
		},
		{
			key: 'area',
			name: '地区',
			value: [
				{ n: '全部', v: '' },
				{ n: '大陆', v: '大陆' },
				{ n: '香港', v: '香港' },
				{ n: '台湾', v: '台湾' },
				{ n: '美国', v: '美国' },
				{ n: '韩国', v: '韩国' },
				{ n: '日本', v: '日本' },
				{ n: '印度', v: '印度' },
				{ n: '英国', v: '英国' },
				{ n: '法国', v: '法国' },
				{ n: '加拿大', v: '加拿大' },
				{ n: '西班牙', v: '西班牙' },
				{ n: '俄罗斯', v: '俄罗斯' },
				{ n: '意大利', v: '意大利' },
				{ n: '泰国', v: '泰国' },
				{ n: '新加坡', v: '新加坡' },
				{ n: '马来西亚', v: '马来西亚' },
				{ n: '其它', v: '其它' },
			],
		},
		{
			key: 'year',
			name: '年份',
			value: [
				{ n: '全部', v: '' },
				{ n: '2026', v: '2026' },
				{ n: '2025', v: '2025' },
				{ n: '2024', v: '2024' },
				{ n: '2023', v: '2023' },
				{ n: '2022', v: '2022' },
				{ n: '2021', v: '2021' },
				{ n: '2020', v: '2020' },
				{ n: '2019', v: '2019' },
				{ n: '2018', v: '2018' },
				{ n: '2017', v: '2017' },
				{ n: '2016', v: '2016' },
				{ n: '2015', v: '2015' },
				{ n: '2014', v: '2014' },
				{ n: '2013', v: '2013' },
				{ n: '2012', v: '2012' },
				{ n: '2011', v: '2011' },
				{ n: '2010', v: '2010' },
				{ n: '2009', v: '2009' },
				{ n: '2008', v: '2008' },
				{ n: '2007', v: '2007' },
				{ n: '2006', v: '2006' },
				{ n: '2005', v: '2005' },
				{ n: '2004', v: '2004' },
				{ n: '2003', v: '2003' },
				{ n: '2002', v: '2002' },
				{ n: '2001', v: '2001' },
				{ n: '2000', v: '2000' },
			],
		},
		{
			key: 'by',
			name: '排序',
			value: [
				{ n: '按最新', v: 'update' },
				{ n: '按添加', v: 'desc' },
				{ n: '按最热', v: 'hot' },
				{ n: '按评分', v: 'score' },
			],
		},
	],
	14: [
		{
			key: 'cateId',
			name: '分类',
			value: [
				{ n: '全部', v: '0' },
				{ n: '言情', v: '1209' },
				{ n: '都市', v: '1210' },
				{ n: '甜宠', v: '1211' },
				{ n: '逆袭', v: '1212' },
				{ n: '玄幻', v: '1213' },
				{ n: '仙侠', v: '1214' },
				{ n: '穿越', v: '1215' },
				{ n: '重生', v: '1216' },
				{ n: '王妃', v: '1217' },
				{ n: '总裁', v: '1218' },
				{ n: '离婚', v: '1219' },
				{ n: '其他', v: '1220' },
			],
		},
		{
			key: 'area',
			name: '地区',
			value: [
				{ n: '全部', v: '' },
				{ n: '大陆', v: '大陆' },
				{ n: '香港', v: '香港' },
				{ n: '台湾', v: '台湾' },
				{ n: '美国', v: '美国' },
				{ n: '韩国', v: '韩国' },
				{ n: '日本', v: '日本' },
				{ n: '印度', v: '印度' },
				{ n: '英国', v: '英国' },
				{ n: '法国', v: '法国' },
				{ n: '加拿大', v: '加拿大' },
				{ n: '西班牙', v: '西班牙' },
				{ n: '德国', v: '德国' },
				{ n: '俄罗斯', v: '俄罗斯' },
				{ n: '意大利', v: '意大利' },
				{ n: '泰国', v: '泰国' },
				{ n: '新加坡', v: '新加坡' },
				{ n: '马来西亚', v: '马来西亚' },
				{ n: '其它', v: '其它' },
			],
		},
		{
			key: 'year',
			name: '年份',
			value: [
				{ n: '全部', v: '' },
				{ n: '2026', v: '2026' },
				{ n: '2025', v: '2025' },
				{ n: '2024', v: '2024' },
				{ n: '2023', v: '2023' },
				{ n: '2022', v: '2022' },
				{ n: '2021', v: '2021' },
				{ n: '2020', v: '2020' },
				{ n: '2019', v: '2019' },
				{ n: '2018', v: '2018' },
				{ n: '2017', v: '2017' },
				{ n: '2016', v: '2016' },
				{ n: '2015', v: '2015' },
				{ n: '2014', v: '2014' },
				{ n: '2013', v: '2013' },
				{ n: '2012', v: '2012' },
				{ n: '2011', v: '2011' },
				{ n: '2010', v: '2010' },
				{ n: '2009', v: '2009' },
				{ n: '2008', v: '2008' },
				{ n: '2007', v: '2007' },
				{ n: '2006', v: '2006' },
				{ n: '2005', v: '2005' },
				{ n: '2004', v: '2004' },
				{ n: '2003', v: '2003' },
				{ n: '2002', v: '2002' },
				{ n: '2001', v: '2001' },
				{ n: '2000', v: '2000' },
			],
		},
		{
			key: 'by',
			name: '排序',
			value: [
				{ n: '按最新', v: 'update' },
				{ n: '按添加', v: 'desc' },
				{ n: '按最热', v: 'hot' },
				{ n: '按评分', v: 'score' },
			],
		},
	],
}

// 签名算法
function signature() {
	return t(Math.floor(Date.now() / 1000))
}

function t(e) {
	let str = e.toString()
	let r = [[], [], [], []]
	for (let i = 0; i < str.length; i++) {
		let e = he(str[i])
		r[0] += e.slice(2, 3)
		r[1] += e.slice(3, 4)
		r[2] += e.slice(4, 5)
		r[3] += e.slice(5)
	}
	let a = []
	for (let i = 0; i < r.length; i++) {
		let e = parseInt(r[i], 2).toString(16)
		if (e.length == 2) e = '0' + e
		if (e.length == 1) e = '00' + e
		if (e.length == 0) e = '000'
		a[i] = e
	}
	let n = CryptoJS.MD5(str).toString()
	return (
		n.slice(0, 3) +
		a[0] +
		n.slice(6, 11) +
		a[1] +
		n.slice(14, 19) +
		a[2] +
		n.slice(22, 27) +
		a[3] +
		n.slice(30)
	)
}

function he(e) {
	let t = []
	let r = e.split('')
	for (let i = 0; i < r.length; i++) {
		if (i != 0) t.push(' ')
		let code = r[i].charCodeAt().toString(2)
		t.push(code)
	}
	return t.join('')
}

async function getConfig() {
	return jsonify({
		...appConfig,
		tabs: [
			//{ name: '首頁', ext: { id: 0, type: 'index' } },
			{ name: '电影', ext: { id: 1, type: 'movie' } },
			{ name: '电视剧', ext: { id: 2, type: 'drama' } },
			{ name: '短剧', ext: { id: 14, type: 'shortdrama' } },
			{ name: '综艺', ext: { id: 3, type: 'variety' } },
			{ name: '动漫', ext: { id: 4, type: 'anime' } },
		],
	})
}

async function getCards(ext) {
	ext = argsify(ext)
	let cards = []
	let page = ext.page || 1
	let id = ext.id

	const { cateId, area = '0', year = '0', by = 'update' } = ext?.filters || {}
	let url
	if (ext.type === 'index') {
		url = `${
			appConfig.site
		}/v1/pub/vod/newest/${page}/12?_vv=${signature()}`
	} else {
		url = `${appConfig.site}/v1/pub/vod/list/true/3/0/${
			area || '0'
		}/${id}/${cateId || '0'}/${
			year || '0'
		}/${by}/${page}/48?_vv=${signature()}`
	}

	const { data } = await $fetch.get(url, { headers })

	JSON.parse(data).data.list.forEach((e) => {
		cards.push({
			vod_id: String(e.id),
			vod_name: e.name,
			vod_pic: `https://static.olelive.com/${e.pic}`,
			vod_remarks: e.remark || '',
			ext: { id: String(e.id) },
		})
	})

	return jsonify({ list: cards, filter: filterList[id] })
}

async function getTracks(ext) {
	ext = argsify(ext)
	let groups = []

	let url = `${appConfig.site}/v1/pub/vod/detail/${
		ext.id
	}/true?_vv=${signature()}`
	const { data } = await $fetch.get(url, { headers })

	let group = {
		title: '播放列表',
		tracks: [],
	}

	JSON.parse(data).data.urls.forEach((e) => {
		group.tracks.push({
			name: e.title,
			pan: '',
			ext: { url: e.url },
		})
	})

	if (group.tracks.length > 0) {
		groups.push(group)
	}

	return jsonify({ list: groups })
}

async function getPlayinfo(ext) {
	ext = argsify(ext)
	return jsonify({ urls: [ext.url] })
}

async function _xptvSearch(ext) {
	ext = argsify(ext)
	let cards = []
	let page = ext.page || 1
	let keyword = ext.text || ''

	let url = `${appConfig.site}/v1/pub/index/search/${encodeURIComponent(
		keyword
	)}/vod/0/${page}/48?_vv=${signature()}`
	const { data } = await $fetch.get(url, { headers })

	let vodData = JSON.parse(data).data.data.find((item) => item.type === 'vod')
	if (vodData && vodData.list) {
		vodData.list
			.filter((item) => item.vip === false)
			.forEach((e) => {
				cards.push({
					vod_id: String(e.id),
					vod_name: e.name,
					vod_pic: `https://static.olelive.com/${e.pic}`,
					vod_remarks: e.remark || '',
					ext: { id: String(e.id) },
				})
			})
	}

	return jsonify({ list: cards })
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
