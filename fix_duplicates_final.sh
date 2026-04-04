#!/bin/bash

for file in converted/*.js; do
    echo "Processing $file"
    
    # Remove duplicate SITE lines, keep the first one
    awk '!/const SITE =/ || !seen[$0]++' "$file" > temp.js && mv temp.js "$file"
    
    # Remove duplicate function definitions, keep the first one
    for func in "getWebsiteInfo" "getCategories" "getVideosByCategory" "getVideoList" "getVideoDetail"; do
        # Find the first occurrence
        first_line=$(grep -n "function $func" "$file" | head -1 | cut -d: -f1)
        if [ ! -z "$first_line" ]; then
            # Remove all other occurrences
            sed -i "${first_line}!{/function $func/,/}/d" "$file"
        fi
    done
    
    # Ensure module.exports is at the end
    if ! tail -1 "$file" | grep -q "module.exports"; then
        # Find the last function and add exports after it
        last_func_end=$(grep -n "^}" "$file" | tail -1 | cut -d: -f1)
        if [ ! -z "$last_func_end" ]; then
            sed -i "${last_func_end}a \\
\\
module.exports = {\\
    getWebsiteInfo,\\
    getCategories,\\
    getVideosByCategory,\\
    getVideoList,\\
    getVideoDetail,\\
    search\\
}" "$file"
        fi
    fi
done
