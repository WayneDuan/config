#!/bin/bash

CONVERTED_DIR="/Users/wayne0816/tfs/config/converted"

for file in "$CONVERTED_DIR"/*.js; do
    if [[ "$file" == *czzy.js ]]; then
        continue
    fi

    echo "Processing $file"

    # Check if already has SITE
    if grep -q "const SITE = appConfig.site;" "$file"; then
        echo "Skipping $file, already modified"
        continue
    fi

    # Add SITE constant after appConfig
    sed -i '' '/const appConfig = {/{
        :a
        N
        /};$/!ba
        a\
const SITE = appConfig.site;
    }' "$file"

    # Add export functions before first async function
    sed -i '' '/async function /{
        i\
function getWebsiteInfo() {\
    return jsonify({\
        title: appConfig.title,\
        site: SITE,\
        tabs: appConfig.tabs\
    });\
}\
\
function getCategories() {\
    return typeof getCards === "function" ? getCards({}) : getConfig();\
}\
\
function getVideosByCategory(args) {\
    return typeof getCards === "function" ? getCards(args) : getConfig();\
}\
\
function getVideoList(args) {\
    return typeof getCards === "function" ? getCards(args) : getConfig();\
}\
\
function getVideoDetail(args) {\
    return typeof getTracks === "function" ? getTracks(args) : jsonify({list: []});\
}\
\

        :b
        n
        b b
    }' "$file"

    # Add module.exports at the end if not present
    if ! grep -q "module.exports" "$file"; then
        echo "" >> "$file"
        echo "module.exports = {" >> "$file"
        echo "    getWebsiteInfo," >> "$file"
        echo "    getCategories," >> "$file"
        echo "    getVideosByCategory," >> "$file"
        echo "    getVideoList," >> "$file"
        echo "    getVideoDetail," >> "$file"
        echo "    search" >> "$file"
        echo "}" >> "$file"
    fi

    echo "Modified $file"
done