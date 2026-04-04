#!/bin/bash

for file in converted/*.js; do
    if ! grep -q "function getWebsiteInfo" "$file"; then
        echo "Adding functions to $file"
        
        # Find the SITE constant
        site_line=$(grep -n "const SITE" "$file" | head -1 | cut -d: -f1)
        if [ ! -z "$site_line" ]; then
            # Add functions after SITE
            sed -i "${site_line}a \\
\\
function getWebsiteInfo() {\\
    return jsonify({\\
        title: appConfig.title,\\
        site: SITE,\\
        tabs: appConfig.tabs\\
    });\\
}\\
\\
function getCategories() {\\
    return getCards({});\\
}\\
\\
function getVideosByCategory(args) {\\
    return getCards(args);\\
}\\
\\
function getVideoList(args) {\\
    return getCards(args);\\
}\\
\\
function getVideoDetail(args) {\\
    return getTracks(args);\\
}" "$file"
        fi
        
        # Ensure module.exports is at the end
        if ! tail -1 "$file" | grep -q "module.exports"; then
            echo "\\
module.exports = {\\
    getWebsiteInfo,\\
    getCategories,\\
    getVideosByCategory,\\
    getVideoList,\\
    getVideoDetail,\\
    search\\
}" >> "$file"
        fi
    fi
done
