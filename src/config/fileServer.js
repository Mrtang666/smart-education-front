/**
 * 文件服务器配置
 */

// 文件服务器配置
export const FILE_SERVER_CONFIG = {
  // 主服务器地址列表（按优先级排序）
  servers: [
    'http://118.89.136.119',
    'http://118.89.136.119:8080',
    'http://118.89.136.119:80',
    // 可以添加备用服务器
    // 'http://backup-server.com',
  ],
  
  // 文件路径前缀
  pathPrefix: '/smart-edu-files',
  
  // 请求配置
  requestConfig: {
    timeout: 10000, // 10秒超时
    maxRetries: 3,  // 最大重试次数
    retryDelay: 2000, // 重试延迟（毫秒）
  },
  
  // 支持的文件类型
  supportedTypes: {
    document: ['.pdf', '.doc', '.docx', '.txt', '.rtf'],
    image: ['.jpg', '.jpeg', '.png', '.gif', '.bmp', '.webp'],
    video: ['.mp4', '.avi', '.mov', '.wmv', '.flv', '.mkv'],
    audio: ['.mp3', '.wav', '.flac', '.aac', '.ogg'],
    archive: ['.zip', '.rar', '.7z', '.tar', '.gz']
  }
}

/**
 * 获取文件的完整URL列表
 * @param {string} filename 文件名
 * @returns {string[]} URL列表
 */
export function getFileUrls(filename) {
  const encodedFilename = encodeURIComponent(filename)
  return FILE_SERVER_CONFIG.servers.map(server => 
    `${server}${FILE_SERVER_CONFIG.pathPrefix}/${encodedFilename}`
  )
}

/**
 * 获取文件类型
 * @param {string} filename 文件名
 * @returns {string} 文件类型
 */
export function getFileType(filename) {
  const ext = filename.toLowerCase().substring(filename.lastIndexOf('.'))
  
  for (const [type, extensions] of Object.entries(FILE_SERVER_CONFIG.supportedTypes)) {
    if (extensions.includes(ext)) {
      return type
    }
  }
  
  return 'unknown'
}

/**
 * 检查文件是否支持预览
 * @param {string} filename 文件名
 * @returns {boolean} 是否支持预览
 */
export function isPreviewSupported(filename) {
  const type = getFileType(filename)
  return ['document', 'image'].includes(type)
}

/**
 * 获取文件图标
 * @param {string} filename 文件名
 * @returns {string} 图标类名
 */
export function getFileIcon(filename) {
  const type = getFileType(filename)
  
  const iconMap = {
    document: 'el-icon-document',
    image: 'el-icon-picture',
    video: 'el-icon-video-play',
    audio: 'el-icon-headset',
    archive: 'el-icon-folder-opened',
    unknown: 'el-icon-document'
  }
  
  return iconMap[type] || iconMap.unknown
}

/**
 * 格式化文件大小
 * @param {number} bytes 字节数
 * @returns {string} 格式化后的文件大小
 */
export function formatFileSize(bytes) {
  if (bytes === 0) return '0 B'
  
  const k = 1024
  const sizes = ['B', 'KB', 'MB', 'GB', 'TB']
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
}

/**
 * 验证文件名
 * @param {string} filename 文件名
 * @returns {boolean} 文件名是否有效
 */
export function validateFilename(filename) {
  if (!filename || typeof filename !== 'string') {
    return false
  }
  
  // 检查文件名长度
  if (filename.length > 255) {
    return false
  }
  
  // 检查非法字符
  const invalidChars = /[<>:"/\\|?*]/
  if (invalidChars.test(filename)) {
    return false
  }
  
  // 检查保留名称
  const reservedNames = ['CON', 'PRN', 'AUX', 'NUL', 'COM1', 'COM2', 'COM3', 'COM4', 'COM5', 'COM6', 'COM7', 'COM8', 'COM9', 'LPT1', 'LPT2', 'LPT3', 'LPT4', 'LPT5', 'LPT6', 'LPT7', 'LPT8', 'LPT9']
  const nameWithoutExt = filename.substring(0, filename.lastIndexOf('.'))
  if (reservedNames.includes(nameWithoutExt.toUpperCase())) {
    return false
  }
  
  return true
}

/**
 * 生成安全的文件名
 * @param {string} filename 原始文件名
 * @returns {string} 安全的文件名
 */
export function sanitizeFilename(filename) {
  if (!filename) return 'unnamed_file'
  
  // 替换非法字符
  let sanitized = filename.replace(/[<>:"/\\|?*]/g, '_')
  
  // 限制长度
  if (sanitized.length > 255) {
    const ext = sanitized.substring(sanitized.lastIndexOf('.'))
    const name = sanitized.substring(0, sanitized.lastIndexOf('.'))
    sanitized = name.substring(0, 255 - ext.length) + ext
  }
  
  return sanitized
}

export default FILE_SERVER_CONFIG
