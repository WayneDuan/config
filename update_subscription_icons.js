const fs = require('fs');
const https = require('https');
const path = require('path');

const JSON_URL = 'https://raw.githubusercontent.com/fangkuia/XPTV/refs/heads/main/VOD/AV.json';
const OUTPUT_FILE = path.join(__dirname, 'my_app_subscription.json');

function fetchUrl(url) {
    return new Promise((resolve, reject) => {
        https.get(url, (res) => {
            let data = '';
            res.setEncoding('utf8');
            if (res.statusCode >= 300 && res.statusCode < 400 && res.headers.location) {
                return fetchUrl(res.headers.location).then(resolve).catch(reject);
            }
            res.on('data', chunk => data += chunk);
            res.on('end', () => {
                if (res.statusCode >= 200 && res.statusCode < 300) {
                    resolve(data);
                } else {
                    reject(new Error(`Status Code ${res.statusCode} for ${url}`));
                }
            });
        }).on('error', reject);
    });
}

async function fetchSiteIconFromJs(extUrl, siteName) {
    if (!extUrl) return "https://example.com/favicon.ico";
    try {
        const urlStr = extUrl.replace("raw.githubusercontent.com", "raw.githubusercontent.com"); // dummy check to keep URL string format 
        // 实际上这可以直接下，如果不带模板符号
        return await new Promise((resolve) => {
            let data = '';
            https.get(urlStr, (res) => {
                res.setEncoding('utf8');
                res.on('data', chunk => data += chunk);
                res.on('end', () => {
                    const siteMatch = data.match(/(?:site|url|host)\s*[:=]\s*['"](https?:\/\/[^'"]+)['"]/i);
                    if (siteMatch && siteMatch[1]) {
                        let base = siteMatch[1].replace(/\/$/, '');
                        resolve(`${base}/favicon.ico`);
                    } else {
                        resolve("https://example.com/favicon.ico");
                    }
                });
            }).on('error', () => resolve("https://example.com/favicon.ico"));
        });
    } catch (e) {
        console.error(`Failed to fetch JS for ${siteName} at ${extUrl}: ${e.message}`);
    }
    return "https://example.com/favicon.ico";
}

async function main() {
    console.log('Fetching AV.json...');
    const dataStr = await new Promise((resolve, reject) => {
        let data = '';
        https.get('https://raw.githubusercontent.com/fangkuia/XPTV/refs/heads/main/VOD/AV.json', (res) => {
            res.setEncoding('utf8');
            res.on('data', chunk => data += chunk);
            res.on('end', () => resolve(data));
        }).on('error', reject);
    });
    const data = JSON.parse(dataStr);
    const sites = data.sites || [];
    
    // 打开已生成的订阅文件
    const OUTPUT_FILE = path.join(__dirname, 'my_app_subscription.json');
    if (!fs.existsSync(OUTPUT_FILE)) {
        console.error('Subscription file not found. Run generate_subscription.js first.');
        return;
    }
    
    const subscription = JSON.parse(fs.readFileSync(OUTPUT_FILE, 'utf8'));

    console.log(`Updating icons for ${subscription.websites.length} websites...`);

    // 遍历网站，并行带控制或者顺序获取
    // 为避免请求过快被限流，这里我们一个个去请求
    for (let webSite of subscription.websites) {
        // 在 AV.json 中找到对应的 site
        const origSite = sites.find(s => s.name === webSite.name);
        if (origSite && origSite.ext) {
            console.log(`Fetching icon config for: ${webSite.name} ...`);
            const iconUrl = await fetchSiteIconFromJs(origSite.ext, webSite.name);
            webSite.icon = iconUrl;
            console.log(`  => ${iconUrl}`);
        }
    }

    fs.writeFileSync(OUTPUT_FILE, JSON.stringify(subscription, null, 2), 'utf8');
    console.log(`Done! Updated ${OUTPUT_FILE} with actual icons.`);
}

main().catch(console.error);
