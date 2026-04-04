#!/bin/bash
urls=(
"https://raw.githubusercontent.com/Yswag/xptv-extensions/refs/heads/main/js/fmovies.js"
"https://raw.githubusercontent.com/fangkuia/XPTV/refs/heads/main/js/bdys.js"
"https://raw.githubusercontent.com/fangkuia/XPTV/refs/heads/main/js/ole.js"
"https://raw.githubusercontent.com/fangkuia/XPTV/refs/heads/main/js/zxzj.js"
"https://raw.githubusercontent.com/fangkuia/XPTV/refs/heads/main/js/libvio.js"
"https://raw.githubusercontent.com/fangkuia/XPTV/refs/heads/main/js/ai.js"
"https://raw.githubusercontent.com/fangkuia/XPTV/refs/heads/main/js/duboku.js"
"https://gist.githubusercontent.com/occupy-pluto/e3a7bb98d5027d0f6dfa85fc2ac11a78/raw/6deb0475d295ac867ccb9c7cf3b1fb212a77abd7/agedm.js"
"https://raw.githubusercontent.com/Yswag/xptv-extensions/main/js/4kav.js"
"https://raw.githubusercontent.com/Yswag/xptv-extensions/main/js/hjkk.js"
"https://raw.githubusercontent.com/Yswag/xptv-extensions/main/js/jpyy.js"
"https://raw.githubusercontent.com/Yswag/xptv-extensions/main/js/saohuo.js"
"https://raw.githubusercontent.com/Yswag/xptv-extensions/main/js/novipnoad.js"
"https://raw.githubusercontent.com/Yswag/xptv-extensions/main/js/xingya.js"
"https://raw.githubusercontent.com/Yswag/xptv-extensions/main/js/gzys.js"
"https://raw.githubusercontent.com/Yswag/xptv-extensions/main/js/iyftv.js"
"https://raw.githubusercontent.com/fangkuia/XPTV/refs/heads/main/js/ystt.js"
"https://raw.githubusercontent.com/Yswag/xptv-extensions/main/js/apple.js"
"https://raw.githubusercontent.com/Yswag/xptv-extensions/main/js/aowu.js"
"https://raw.githubusercontent.com/Yswag/xptv-extensions/main/js/xiaohys.js"
"https://raw.githubusercontent.com/Yswag/xptv-extensions/refs/heads/main/js/jianpian.js"
"https://raw.githubusercontent.com/Yswag/xptv-extensions/refs/heads/main/js/rrmj.js"
"https://raw.githubusercontent.com/Yswag/xptv-extensions/refs/heads/main/js/anime1.js"
"https://raw.githubusercontent.com/Yswag/xptv-extensions/refs/heads/main/js/wwgz.js"
"https://raw.githubusercontent.com/Yswag/xptv-extensions/refs/heads/main/js/7sefun.js"
"https://raw.githubusercontent.com/Yswag/xptv-extensions/refs/heads/main/js/symx.js"
)

for url in "${urls[@]}"; do
    filename=$(basename "$url")
    echo "Downloading $filename from $url"
    curl -s "$url" -o "converted/$filename"
    if [ $? -eq 0 ]; then
        echo "Downloaded $filename"
    else
        echo "Failed to download $filename"
    fi
done
