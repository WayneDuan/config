#!/bin/bash

functions="
function getWebsiteInfo() {
    return jsonify({
        title: appConfig.title,
        site: SITE,
        tabs: appConfig.tabs
    });
}

function getCategories() {
    return getCards({});
}

function getVideosByCategory(args) {
    return getCards(args);
}

function getVideoList(args) {
    return getCards(args);
}

function getVideoDetail(args) {
    return getTracks(args);
}

module.exports = {
    getWebsiteInfo,
    getCategories,
    getVideosByCategory,
    getVideoList,
    getVideoDetail,
    search
}
"

for file in converted/*.js; do
    if ! grep -q "function getWebsiteInfo" "$file"; then
        echo "Adding functions to $file"
        echo "$functions" >> "$file"
    fi
done
