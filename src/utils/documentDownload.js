/**
 * 文档下载工具函数
 * 直接从文件服务器下载文档，无需通过后端API
 */

// 文件服务器基础URL
const FILE_SERVER_BASE_URL = 'http://118.89.136.119/smart-edu-files'

/**
 * 下载文档文件
 * @param {string} filename - 文件名
 * @param {Function} onProgress - 下载进度回调函数 (可选)
 * @param {Function} onSuccess - 下载成功回调函数 (可选)
 * @param {Function} onError - 下载失败回调函数 (可选)
 * @returns {Promise<void>}
 */
export async function downloadDocument(filename, { onProgress, onSuccess, onError } = {}) {
  try {
    // 构建文件服务器URL
    const fileUrl = `${FILE_SERVER_BASE_URL}/${encodeURIComponent(filename)}`
    
    console.log(`开始下载文档: ${filename}`)
    console.log(`文件URL: ${fileUrl}`)
    
    // 使用fetch下载文件，支持进度监控
    const response = await fetch(fileUrl)
    
    if (!response.ok) {
      const errorMessage = getErrorMessage(response.status)
      throw new Error(`${errorMessage} (状态码: ${response.status})`)
    }
    
    // 获取文件大小
    const contentLength = response.headers.get('content-length')
    const total = contentLength ? parseInt(contentLength, 10) : 0
    
    // 创建 ReadableStream 来监控下载进度
    const reader = response.body.getReader()
    const chunks = []
    let loaded = 0
    
    while (true) {
      const { done, value } = await reader.read()
      
      if (done) break
      
      chunks.push(value)
      loaded += value.length
      
      // 调用进度回调
      if (onProgress && total > 0) {
        const progress = Math.round((loaded / total) * 100)
        onProgress(progress, loaded, total)
      }
    }
    
    // 合并所有数据块
    const allChunks = new Uint8Array(loaded)
    let position = 0
    for (const chunk of chunks) {
      allChunks.set(chunk, position)
      position += chunk.length
    }
    
    // 创建 Blob 对象
    const blob = new Blob([allChunks])
    
    // 创建下载链接并触发下载
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = filename
    link.style.display = 'none'
    
    document.body.appendChild(link)
    link.click()
    
    // 清理资源
    setTimeout(() => {
      URL.revokeObjectURL(url)
      document.body.removeChild(link)
    }, 100)
    
    console.log(`文档下载成功: ${filename}`)
    
    // 调用成功回调
    if (onSuccess) {
      onSuccess(filename, blob)
    }
    
  } catch (error) {
    console.error('下载文档失败:', error)
    
    // 调用错误回调
    if (onError) {
      onError(error, filename)
    } else {
      // 如果没有提供错误回调，重新抛出错误
      throw error
    }
  }
}

/**
 * 批量下载文档
 * @param {Array<string>} filenames - 文件名数组
 * @param {Function} onProgress - 整体进度回调函数 (可选)
 * @param {Function} onItemComplete - 单个文件完成回调函数 (可选)
 * @returns {Promise<Array>} 下载结果数组
 */
export async function downloadMultipleDocuments(filenames, { onProgress, onItemComplete } = {}) {
  const results = []
  const total = filenames.length
  
  for (let i = 0; i < filenames.length; i++) {
    const filename = filenames[i]
    
    try {
      await downloadDocument(filename, {
        onSuccess: (filename, blob) => {
          results.push({ filename, success: true, blob })
          if (onItemComplete) {
            onItemComplete(filename, true, null)
          }
        },
        onError: (error, filename) => {
          results.push({ filename, success: false, error })
          if (onItemComplete) {
            onItemComplete(filename, false, error)
          }
        }
      })
    } catch (error) {
      results.push({ filename, success: false, error })
      if (onItemComplete) {
        onItemComplete(filename, false, error)
      }
    }
    
    // 调用整体进度回调
    if (onProgress) {
      const progress = Math.round(((i + 1) / total) * 100)
      onProgress(progress, i + 1, total)
    }
    
    // 添加延迟避免过于频繁的请求
    if (i < filenames.length - 1) {
      await new Promise(resolve => setTimeout(resolve, 200))
    }
  }
  
  return results
}

/**
 * 检查文档是否存在
 * @param {string} filename - 文件名
 * @returns {Promise<boolean>} 文件是否存在
 */
export async function checkDocumentExists(filename) {
  try {
    const fileUrl = `${FILE_SERVER_BASE_URL}/${encodeURIComponent(filename)}`
    const response = await fetch(fileUrl, { method: 'HEAD' })
    return response.ok
  } catch (error) {
    console.error('检查文档存在性失败:', error)
    return false
  }
}

/**
 * 获取文档信息（不下载文件内容）
 * @param {string} filename - 文件名
 * @returns {Promise<Object>} 文档信息对象
 */
export async function getDocumentInfo(filename) {
  try {
    const fileUrl = `${FILE_SERVER_BASE_URL}/${encodeURIComponent(filename)}`
    const response = await fetch(fileUrl, { method: 'HEAD' })
    
    if (!response.ok) {
      throw new Error(`文档不存在或无法访问 (状态码: ${response.status})`)
    }
    
    return {
      filename,
      size: response.headers.get('content-length'),
      type: response.headers.get('content-type'),
      lastModified: response.headers.get('last-modified'),
      exists: true
    }
  } catch (error) {
    return {
      filename,
      exists: false,
      error: error.message
    }
  }
}

/**
 * 根据HTTP状态码获取错误信息
 * @param {number} status - HTTP状态码
 * @returns {string} 错误信息
 */
function getErrorMessage(status) {
  switch (status) {
    case 404:
      return '文档不存在或已被删除'
    case 403:
      return '没有权限访问该文档'
    case 500:
      return '服务器内部错误'
    case 502:
      return '网关错误'
    case 503:
      return '服务暂时不可用'
    default:
      return '下载失败'
  }
}

/**
 * 获取文件扩展名
 * @param {string} filename - 文件名
 * @returns {string} 文件扩展名
 */
export function getFileExtension(filename) {
  if (!filename) return ''
  const lastDotIndex = filename.lastIndexOf('.')
  return lastDotIndex !== -1 ? filename.substring(lastDotIndex + 1).toLowerCase() : ''
}

/**
 * 格式化文件大小
 * @param {number} bytes - 字节数
 * @returns {string} 格式化后的文件大小
 */
export function formatFileSize(bytes) {
  if (!bytes || bytes === 0) return '0 B'
  
  const k = 1024
  const sizes = ['B', 'KB', 'MB', 'GB', 'TB']
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
}
