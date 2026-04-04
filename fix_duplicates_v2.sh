#!/bin/bash

# Script to fix duplicate function definitions in converted JS files

for file in converted/*.js; do
    echo "Processing $file..."

    # Check for duplicate function definitions (multiple getWebsiteInfo functions)
    func_count=$(grep -c "function getWebsiteInfo()" "$file")
    if [ "$func_count" -gt 1 ]; then
        echo "  Found $func_count getWebsiteInfo functions in $file"

        # Find the line where the first duplicate function starts
        first_func_line=$(grep -n "function getWebsiteInfo()" "$file" | head -1 | cut -d: -f1)

        # Find where module.exports starts
        exports_line=$(grep -n "module.exports" "$file" | head -1 | cut -d: -f1)

        if [ -n "$exports_line" ] && [ -n "$first_func_line" ]; then
            # Remove all duplicate functions before module.exports
            # Find the line before the first real function (after appConfig)
            appconfig_end=$(grep -n "tabs:" "$file" | head -1 | cut -d: -f1)
            if [ -n "$appconfig_end" ]; then
                # Find the closing bracket after tabs
                closing_bracket=$(tail -n +$appconfig_end "$file" | grep -n "^}" | head -1 | cut -d: -f1)
                if [ -n "$closing_bracket" ]; then
                    real_code_start=$((appconfig_end + closing_bracket - 1))

                    # If duplicate functions start after appConfig, remove them
                    if [ "$first_func_line" -gt "$real_code_start" ]; then
                        # Find where the real code starts (first async function or function after appConfig)
                        real_func_line=$(tail -n +$((real_code_start + 1)) "$file" | grep -n "^\(async function\|function\)" | head -1 | cut -d: -f1)
                        if [ -n "$real_func_line" ]; then
                            real_func_line=$((real_func_line + real_code_start))
                            # Remove duplicate functions
                            sed -i "${first_func_line},$((real_func_line - 1))d" "$file"
                            echo "  Removed duplicate functions in $file"
                        fi
                    fi
                fi
            fi
        fi
    fi
done

echo "Done processing all files."