const fs = require('fs');
const https = require('https');
const path = require('path');

const JSON_URL = 'https://raw.githubusercontent.com/fangkuia/XPTV/refs/heads/main/VOD/AV.json';
const OUTPUT_DIR = path.join(__dirname, 'generated_sites');

function fetchJson(url) {
    return new Promise((resolve, reject) => {
        https.get(url, (res) => {
            let data = '';
            res.on('data', chunk => data += chunk);
            res.on('end', () => {
                try {
                    resolve(JSON.parse(data));
                } catch (e) {
                    reject(e);
                }
            });
        }).on('error', reject);
    });
}

function generateTemplate(site) {
    const safeName = site.name.replace(/[^a-zA-Z0-9_\u4e00-\u9fa5]/g, '');
    
    return `const UA = 'Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Mobile/15E148 Safari/604.1';
const SITE = ''; // TODO: 填入 ${site.name} 的根网址
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

function withQuery(url, key, value) {
  if (!value) return url;
  const sep = url.includes('?') ? '&' : '?';
  return \`\${url}\${sep}\${encodeURIComponent(key)}=\${encodeURIComponent(value)}\`;
}

async function getWebsiteInfo() {
  return {
    name: "${site.name}",
    description: "${site.name} - 原API: ${site.api}",
    icon: SITE + "/favicon.ico", // FIXME: 修正图标地址
    homepage: SITE
  };
}

async function getCategories() {
  if (tabsCache) return tabsCache;

  // TODO: 解析或固定填入该站点的分类
  const tabs = [
    { name: '最新', ext: { url: SITE + '/new' } }
  ];

  tabsCache = tabs.map((tab, index) => ({
    id: String(index + 1),
    name: tab.name,
    ext: tab.ext,
  }));

  return tabsCache;
}

async function getSortOptions() {
  return {
    key: 'sort',
    name: '排序',
    init: 'latest',
    value: [
      { n: '最近更新', v: 'latest' },
      { n: '最受欢迎', v: 'popular' }
    ],
  };
}

async function getVideosByCategory(categoryId, page, sort) {
  const categories = await getCategories();
  const category = categories.find((item) => item.id === String(categoryId));
  const categoryUrl = category && category.ext ? category.ext.url : SITE + '/new';
  return getVideoList(page, categoryUrl, sort);
}

async function getVideoList(page, categoryUrl, sort) {
  await ensureSession();

  const currentPage = page || 1;
  const sortValue = sort || 'latest';

  let baseUrl = categoryUrl || \`\${SITE}/new\`;
  baseUrl = withQuery(baseUrl, 'sort', sortValue);

  const url = baseUrl.includes('?') ? \`\${baseUrl}&page=\${currentPage}\` : \`\${baseUrl}?page=\${currentPage}\`;

  const { data } = await $fetch.get(url, {
    headers: baseHeaders,
    userAgent: UA
  });
  
  // TODO: 使用 cheerio.load(data) 解析列表网页内容并返回统一的数组格式
  return [];
}
`;
}

async function main() {
    console.log('Fetching AV.json...');
    const data = await fetchJson(JSON_URL);
    
    if (!fs.existsSync(OUTPUT_DIR)) {
        fs.mkdirSync(OUTPUT_DIR);
    }

    const sites = data.sites || [];
    console.log(`Found ${sites.length} sites. Generating templates...`);

    for (const site of sites) {
        if (!site.name) continue;
        
        let filename = site.api.replace('csp_', '').toLowerCase() + '.js';
        const filepath = path.join(OUTPUT_DIR, filename);
        
        const template = generateTemplate(site);
        fs.writeFileSync(filepath, template, 'utf8');
        console.log(`- Generated ${filename} for ${site.name}`);
    }
    console.log('Done! Check the "generated_sites" folder.');
}

main().catch(console.error);
