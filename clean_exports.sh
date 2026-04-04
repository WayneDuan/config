#!/bin/bash

for file in converted/*.js; do
    # Count module.exports
    count=$(grep -c "module.exports" "$file")
    if [ "$count" -gt 1 ]; then
        echo "Cleaning $file ($count exports)"
        # Keep only the last module.exports block
        # Find all lines with module.exports
        lines=$(grep -n "module.exports" "$file" | cut -d: -f1)
        # Convert to array
        IFS=$'\n' read -r -d '' -a line_array <<< "$lines"
        # Remove all but the last
        for ((i=0; i<${#line_array[@]}-1; i++)); do
            line=${line_array[i]}
            # Find the end of the block (next function or end of file)
            next_line=$((line + 6))  # Approximate block size
            sed -i "${line},${next_line}d" "$file"
        done
    fi
done
