const fs = require('fs');
const https = require('https');
const path = require('path');

const JSON_URL = 'https://raw.githubusercontent.com/fangkuia/XPTV/refs/heads/main/VOD/AV.json';
const OUTPUT_FILE = path.join(__dirname, 'my_app_subscription.json');
// 你可以将这个前缀修改为你实际托管JS文件的GitHub或服务器URL
const JS_BASE_URL = 'https://raw.githubusercontent.com/WayneDuan/config/refs/heads/main/';

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

async function main() {
    console.log('Fetching AV.json...');
    const data = await fetchJson(JSON_URL);
    const sites = data.sites || [];
    
    const subscription = {
        id: "wayne_app_sub_001",
        name: "Wayne的福利订阅",
        description: "从XPTV AV订阅源转换而来的应用订阅集合",
        updateTime: new Date().toISOString(),
        websites: []
    };

    sites.forEach((site, index) => {
        if (!site.name) return;
        
        // 提取原API名称作为文件名，保持与你之前生成的js文件名一致
        const filename = site.api.replace('csp_', '').toLowerCase() + '.js';

        subscription.websites.push({
            id: `site_${index + 1}_${site.name.replace(/[^a-zA-Z0-9]/g, '').toLowerCase()}`,
            name: site.name,
            icon: "https://example.com/favicon.ico", // 需要自己后续补充各站点的真实icon
            jsUrl: `${JS_BASE_URL}${filename}`,
            description: `从源 ${site.api} 获取的影视站点: ${site.name}`
        });
    });

    fs.writeFileSync(OUTPUT_FILE, JSON.stringify(subscription, null, 2), 'utf8');
    console.log(`Done! Generated ${sites.length} sites in ${OUTPUT_FILE}`);
}

main().catch(console.error);
