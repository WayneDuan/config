#!/bin/bash

# Script to fix duplicate exports and SITE constants in converted JS files

for file in converted/*.js; do
    echo "Processing $file..."

    # Check if file has duplicate SITE constants
    site_count=$(grep -c "const SITE = appConfig.site;" "$file")
    if [ "$site_count" -gt 1 ]; then
        echo "  Found $site_count SITE constants in $file"

        # Find the line numbers of SITE constants
        site_lines=$(grep -n "const SITE = appConfig.site;" "$file" | cut -d: -f1)

        # Get total lines
        total_lines=$(wc -l < "$file")

        # Find where module.exports starts
        exports_line=$(grep -n "module.exports" "$file" | head -1 | cut -d: -f1)

        if [ -n "$exports_line" ]; then
            # Remove all SITE constants before module.exports
            for line in $site_lines; do
                if [ "$line" -lt "$exports_line" ]; then
                    # Remove the line (need to be careful with line numbers changing)
                    sed -i "${line}d" "$file"
                    echo "  Removed SITE constant at line $line in $file"
                    break  # Only remove the first one before exports
                fi
            done
        fi
    fi

    # Check for duplicate function definitions
    if grep -q "function getWebsiteInfo()" "$file" && grep -q "function getCategories()" "$file"; then
        echo "  Found duplicate function definitions in $file"

        # Find where the first function starts
        first_func_line=$(grep -n "function getWebsiteInfo()" "$file" | head -1 | cut -d: -f1)

        # Find where the real code starts (after appConfig)
        appconfig_end=$(grep -n "tabs:" "$file" | head -1 | cut -d: -f1)
        if [ -n "$appconfig_end" ]; then
            # Find the closing bracket of appConfig
            appconfig_end=$(tail -n +$appconfig_end "$file" | grep -n "}" | head -1 | cut -d: -f1)
            appconfig_end=$((appconfig_end + appconfig_end - 1))

            # Remove duplicate functions between appConfig and real code
            if [ "$first_func_line" -gt "$appconfig_end" ]; then
                # Find the next function or async function after appConfig
                next_func=$(tail -n +$((appconfig_end + 1)) "$file" | grep -n "^\(function\|async function\)" | head -1 | cut -d: -f1)
                if [ -n "$next_func" ]; then
                    next_func=$((next_func + appconfig_end))
                    # Remove lines from first duplicate function to before next real function
                    if [ "$next_func" -gt "$first_func_line" ]; then
                        sed -i "${first_func_line},$((next_func - 1))d" "$file"
                        echo "  Removed duplicate functions in $file"
                    fi
                fi
            fi
        fi
    fi
done

echo "Done processing all files."