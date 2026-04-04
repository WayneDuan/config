const fs = require('fs');
const path = require('path');

const convertedDir = '/Users/wayne0816/tfs/config/converted';

const files = fs.readdirSync(convertedDir).filter(f => f.endsWith('.js') && f !== 'czzy.js');

files.forEach(file => {
    const filePath = path.join(convertedDir, file);
    let content = fs.readFileSync(filePath, 'utf8');

    // Skip if already has SITE
    if (content.includes('const SITE = appConfig.site;')) {
        console.log(`Skipping ${file}, already modified`);
        return;
    }

    // Find appConfig definition
    const appConfigMatch = content.match(/const appConfig = \{[\s\S]*?\n\};/);
    if (!appConfigMatch) {
        console.log(`No appConfig found in ${file}`);
        return;
    }

    // Add SITE constant after appConfig
    content = content.replace(appConfigMatch[0], appConfigMatch[0] + '\nconst SITE = appConfig.site;');

    // Find the first function definition to add export functions before it
    const firstFunctionMatch = content.match(/async function \w+\(/);
    if (!firstFunctionMatch) {
        console.log(`No functions found in ${file}`);
        return;
    }

    const exportFunctions = `
function getWebsiteInfo() {
    return jsonify({
        title: appConfig.title,
        site: SITE,
        tabs: appConfig.tabs
    });
}

function getCategories() {
    return getCards ? getCards({}) : getConfig();
}

function getVideosByCategory(args) {
    return getCards ? getCards(args) : getConfig();
}

function getVideoList(args) {
    return getCards ? getCards(args) : getConfig();
}

function getVideoDetail(args) {
    return getTracks ? getTracks(args) : jsonify({list: []});
}

`;

    content = content.replace(firstFunctionMatch[0], exportFunctions + firstFunctionMatch[0]);

    // Add module.exports at the end
    if (!content.includes('module.exports')) {
        content += `

module.exports = {
    getWebsiteInfo,
    getCategories,
    getVideosByCategory,
    getVideoList,
    getVideoDetail,
    search
}`;
    }

    fs.writeFileSync(filePath, content);
    console.log(`Modified ${file}`);
});