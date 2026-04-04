#!/bin/bash

for file in converted/*.js; do
    count=$(grep -c "module.exports" "$file")
    if [ "$count" -gt 1 ]; then
        echo "Cleaning $file ($count exports)"
        # Get the line number of the last module.exports
        last_line=$(grep -n "module.exports" "$file" | tail -1 | cut -d: -f1)
        # Remove all module.exports except the last one
        sed -i '/module\.exports/ { '"$last_line"'! d; }' "$file"
        # But this removes the block. Better to remove all lines containing module.exports except the last block
        # Let's use a different approach: extract everything before the last module.exports, then add the last block
        head -n $((last_line - 1)) "$file" > temp.js
        tail -n +$last_line "$file" >> temp.js
        mv temp.js "$file"
    fi
done
