#!/bin/bash

for file in converted/*.js; do
    count=$(grep -c "module.exports" "$file")
    if [ "$count" -gt 1 ]; then
        echo "Cleaning $file ($count exports)"
        # Use awk to keep only the last module.exports block
        awk '
        /module\.exports/ {
            if (in_block) {
                # Remove previous block
                for (i=block_start; i<=NR-1; i++) {
                    lines[i] = ""
                }
            }
            in_block = 1
            block_start = NR
        }
        { lines[NR] = $0 }
        END {
            for (i=1; i<=NR; i++) {
                if (lines[i] != "") print lines[i]
            }
        }
        ' "$file" > temp.js && mv temp.js "$file"
    fi
done
