// ==UserScript==
// @name         NowShowTime - 示例网站脚本
// @description  为 NowShowTime 应用提供示例网站的内容
// @version      1.0.0
// @namespace    https://github.com/WayneDuan/NowShowTime
// ==/UserScript==

/**
 * NowShowTime 示例网站 JavaScript 脚本
 *
 * 此脚本演示如何为 NowShowTime 应用实现内容提供者
 *
 * 必须实现以下四个函数：
 * 1. getWebsiteInfo()      - 获取网站信息
 * 2. getVideoList(page)    - 获取视频列表
 * 3. getVideoDetail(videoId) - 获取视频详情
 * 4. search(keyword)       - 搜索视频（可选）
 * 5. getCategories()      - 获取分类（可选）
 * 6. getVideosByCategory(categoryId, page) - 分类视频列表（可选）
 */

// ============ 配置部分 ============

const API_BASE_URL = 'https://api.example.com';
const WEBSITE_NAME = '示例视频网站';
const WEBSITE_ICON = 'https://example.com/icon.png';

// ============ 工具函数 ============

/**
 * 发送 HTTP 请求
 * 在 JavaScriptCore 中使用 XMLHttpRequest 进行同步请求
 */
function fetchSync(url, options = {}) {
  try {
    let xmlhttp = new XMLHttpRequest();
    xmlhttp.open(options.method || 'GET', url, false); // 第三个参数 false 表示同步
    
    if (options.headers) {
      for (let key in options.headers) {
        xmlhttp.setRequestHeader(key, options.headers[key]);
      }
    }
    
    xmlhttp.send(options.body || null);
    
    if (xmlhttp.status === 200) {
      return JSON.parse(xmlhttp.responseText);
    }
    return null;
  } catch (error) {
    console.error('网络请求失败:', error);
    return null;
  }
}

/**
 * 生成随机视频数据（用于示例）
 */
function generateMockVideos(page) {
  const videos = [];
  const startId = (page - 1) * 10 + 1;
  
  for (let i = 0; i < 10; i++) {
    const id = startId + i;
    videos.push({
      id: 'video_' + id,
      title: '示例视频 ' + id,
      cover: 'https://picsum.photos/200/300?random=' + id,
      url: API_BASE_URL + '/video/' + id,
      description: '这是示例视频的描述 - 视频编号 ' + id,
      createTime: Date.now() - (i * 86400000) // 每个视频相隔一天
    });
  }
  
  return videos;
}

/**
 * 生成随机分辨率数据（用于示例）
 */
function generateMockResolutions(videoId) {
  return [
    {
      id: 'res_1080',
      name: '1080p',
      url: API_BASE_URL + '/videos/' + videoId + '/1080.mp4',
      size: '2.5 GB'
    },
    {
      id: 'res_720',
      name: '720p',
      url: API_BASE_URL + '/videos/' + videoId + '/720.mp4',
      size: '1.2 GB'
    },
    {
      id: 'res_480',
      name: '480p',
      url: API_BASE_URL + '/videos/' + videoId + '/480.mp4',
      size: '500 MB'
    },
    {
      id: 'res_240',
      name: '480p',
      url: API_BASE_URL + '/videos/' + videoId + '/240.mp4',
      size: '200 MB'
    }
  ];
}

// ============ 必需的核心函数 ============

/**
 * 获取网站信息
 *
 * @returns {Object} 网站信息对象
 */
function getWebsiteInfo() {
  return {
    name: WEBSITE_NAME,
    description: '这是一个演示视频网站，所有数据都是模拟的',
    icon: WEBSITE_ICON,
    homepage: 'https://example.com'
  };
}

/**
 * 获取视频列表
 *
 * @param {number} page - 页码，从 1 开始
 * @returns {Array} 视频对象数组
 */
function getVideoList(page) {
  // 示例：使用模拟数据
  // 在实际应用中，应该从 API 获取真实数据
  
  try {
    // 方式 1: 使用 API 调用（如果网站支持）
    // const data = fetchSync(API_BASE_URL + '/videos?page=' + page);
    // return data ? data.videos : [];
    
    // 方式 2: 使用模拟数据（用于演示）
    return generateMockVideos(page);
  } catch (error) {
    console.error('获取视频列表失败:', error);
    return [];
  }
}

/**
 * 获取视频详情
 *
 * @param {string} videoId - 视频 ID
 * @returns {Object} 视频详情对象，包含分辨率列表
 */
function getVideoDetail(videoId) {
  try {
    // 获取视频的基本信息
    // 在实际应用中应该从 API 获取真实数据
    
    const videoList = generateMockVideos(1);
    const video = videoList.find(v => v.id === videoId);
    
    if (!video) {
      return null;
    }
    
    // 获取该视频的所有分辨率
    const resolutions = generateMockResolutions(videoId);
    
    return {
      id: video.id,
      title: video.title,
      cover: video.cover,
      description: video.description + '\n\n这是视频的详细描述部分。支持多行文本显示。',
      resolutions: resolutions
    };
  } catch (error) {
    console.error('获取视频详情失败:', error);
    return null;
  }
}

/**
 * 搜索视频（可选功能）
 *
 * @param {string} keyword - 搜索关键词
 * @returns {Array} 搜索结果数组
 */
function search(keyword) {
  try {
    // 在实际应用中，应该调用搜索 API
    // const data = fetchSync(API_BASE_URL + '/search?q=' + encodeURIComponent(keyword));
    // return data ? data.results : [];
    
    // 示例：返回包含关键词的模拟视频
    if (!keyword || keyword.trim().length === 0) {
      return [];
    }
    
    const allVideos = generateMockVideos(1);
    return allVideos.filter(video =>
      video.title.toLowerCase().includes(keyword.toLowerCase()) ||
      video.description.toLowerCase().includes(keyword.toLowerCase())
    );
  } catch (error) {
    console.error('搜索失败:', error);
    return [];
  }
}

/**
 * 获取分类列表（可选）
 * 可用于首页分类导航
 */
function getCategories() {
  return [
    { id: '1', name: '热门' },
    { id: '2', name: '最新' },
    { id: '3', name: '推荐' },
    { id: '4', name: '高清' }
  ];
}

/**
 * 根据分类获取视频列表（可选）
 */
function getVideosByCategory(categoryId, page) {
  return generateMockVideos(page);
}

/**
 * 获取网站的公告（可选）
 */
function getAnnouncements() {
  return [
    {
      id: '1',
      title: '网站维护通知',
      content: '站点将在本周五进行定期维护，可能会影响服务',
      time: Date.now()
    }
  ];
}

// ============ 模块导出（用于验证） ============

if (typeof module !== 'undefined' && module.exports) {
   module.exports = {
     getWebsiteInfo,
     getVideoList,
     getVideoDetail,
     search,
     getCategories,
     getVideosByCategory,
     getAnnouncements
   };
 }