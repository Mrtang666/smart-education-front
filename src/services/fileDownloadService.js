/**
 * 文件下载服务
 * 提供统一的文件下载功能，包含重试机制和错误处理
 */

import { getFileUrls, validateFilename, sanitizeFilename } from '@/config/fileServer'
import { retryRequest, checkNetworkConnection } from '@/utils/networkUtils'
import { ElMessage } from 'element-plus'

/**
 * 文件下载服务类
 */
class FileDownloadService {
  constructor() {
    this.downloadQueue = new Map() // 下载队列，防止重复下载
  }

  /**
   * 下载文件
   * @param {string} filename 文件名
   * @param {Object} options 选项
   * @param {Function} options.onProgress 进度回调
   * @param {Function} options.onRetry 重试回调
   * @param {number} options.timeout 超时时间
   * @returns {Promise<void>}
   */
  async downloadFile(filename, options = {}) {
    const {
      onProgress = () => {},
      onRetry = () => {},
      timeout = 30000
    } = options

    // 验证文件名
    if (!validateFilename(filename)) {
      throw new Error('文件名无效')
    }

    // 检查是否已在下载队列中
    if (this.downloadQueue.has(filename)) {
      ElMessage.warning('文件正在下载中，请稍候...')
      return this.downloadQueue.get(filename)
    }

    // 创建下载Promise
    const downloadPromise = this._performDownload(filename, {
      onProgress,
      onRetry,
      timeout
    })

    // 添加到下载队列
    this.downloadQueue.set(filename, downloadPromise)

    try {
      await downloadPromise
      ElMessage.success('文件下载成功')
    } catch (error) {
      this._handleDownloadError(error, filename)
      throw error
    } finally {
      // 从下载队列中移除
      this.downloadQueue.delete(filename)
    }
  }

  /**
   * 执行文件下载
   * @private
   */
  async _performDownload(filename, options) {
    const { onProgress, onRetry, timeout } = options
    const urls = getFileUrls(filename)

    console.log(`开始下载文件: ${filename}`)
    console.log(`可用的下载地址:`, urls)
    ElMessage.info('开始下载文件...')

    return retryRequest(async () => {
      // 检查网络连接
      const isOnline = await checkNetworkConnection()
      if (!isOnline) {
        console.error('网络连接检查失败')
        throw new Error('网络连接不可用，请检查网络设置')
      }

      let lastError = null

      // 尝试所有可能的URL
      for (let i = 0; i < urls.length; i++) {
        const url = urls[i]

        try {
          console.log(`尝试下载URL (${i + 1}/${urls.length}): ${url}`)

          const blob = await this._fetchFile(url, timeout, onProgress)
          await this._saveFile(blob, filename)

          console.log(`文件下载成功: ${filename}`)
          return // 成功下载，退出函数

        } catch (error) {
          console.error(`URL ${url} 下载失败:`, {
            message: error.message,
            name: error.name,
            stack: error.stack
          })
          lastError = error

          // 如果不是最后一个URL，继续尝试下一个
          if (i < urls.length - 1) {
            console.log(`尝试下一个URL...`)
            continue
          }
        }
      }

      // 所有URL都失败了
      console.error(`所有下载地址都失败了，最后一个错误:`, lastError)
      throw lastError || new Error('所有下载地址都无法访问')
    }, {
      maxRetries: 3,
      baseDelay: 2000,
      onRetry: (attempt, maxRetries) => {
        console.log(`准备重试下载 (${attempt}/${maxRetries})...`)
        ElMessage.info(`下载失败，正在重试 (${attempt}/${maxRetries})...`)
        onRetry(attempt, maxRetries)
      }
    })
  }

  /**
   * 获取文件
   * @private
   */
  async _fetchFile(url, timeout, onProgress) {
    const controller = new AbortController()
    const timeoutId = setTimeout(() => controller.abort(), timeout)

    try {
      const response = await fetch(url, {
        signal: controller.signal,
        mode: 'cors',
        cache: 'no-cache',
        headers: {
          'Accept': '*/*'
        }
      })

      clearTimeout(timeoutId)

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`)
      }

      // 获取文件大小
      const contentLength = response.headers.get('content-length')
      const total = contentLength ? parseInt(contentLength, 10) : 0

      if (!response.body) {
        throw new Error('响应体为空')
      }

      // 如果支持流式读取，显示进度
      if (total > 0 && response.body.getReader) {
        return this._readStreamWithProgress(response, total, onProgress)
      } else {
        // 直接读取为blob
        return await response.blob()
      }

    } finally {
      clearTimeout(timeoutId)
    }
  }

  /**
   * 流式读取文件并显示进度
   * @private
   */
  async _readStreamWithProgress(response, total, onProgress) {
    const reader = response.body.getReader()
    const chunks = []
    let loaded = 0

    try {
      let reading = true
      while (reading) {
        const { done, value } = await reader.read()

        if (done) {
          reading = false
          break
        }

        chunks.push(value)
        loaded += value.length

        // 调用进度回调
        const progress = Math.round((loaded / total) * 100)
        onProgress(progress, loaded, total)
      }

      // 合并所有chunks
      const allChunks = new Uint8Array(loaded)
      let position = 0
      for (const chunk of chunks) {
        allChunks.set(chunk, position)
        position += chunk.length
      }

      return new Blob([allChunks])
    } finally {
      reader.releaseLock()
    }
  }

  /**
   * 保存文件到本地
   * @private
   */
  async _saveFile(blob, filename) {
    const safeFilename = sanitizeFilename(filename)
    const url = URL.createObjectURL(blob)
    
    try {
      const link = document.createElement('a')
      link.href = url
      link.download = safeFilename
      link.style.display = 'none'
      
      document.body.appendChild(link)
      link.click()
      
      // 清理DOM
      setTimeout(() => {
        document.body.removeChild(link)
      }, 100)
      
    } finally {
      // 清理URL对象
      setTimeout(() => {
        URL.revokeObjectURL(url)
      }, 1000)
    }
  }

  /**
   * 处理下载错误
   * @private
   */
  _handleDownloadError(error, filename) {
    console.error(`文件下载失败 [${filename}]:`, error)

    if (error.name === 'AbortError') {
      ElMessage.error('下载超时，请检查网络连接')
    } else if (error.message.includes('404')) {
      ElMessage.error('文件不存在或已被删除')
    } else if (error.message.includes('403')) {
      ElMessage.error('没有权限访问该文件')
    } else if (error.message.includes('CORS')) {
      ElMessage.error('跨域访问被阻止，请联系管理员')
    } else if (error.message.includes('网络连接不可用')) {
      ElMessage.error('网络连接不可用，请检查网络设置')
    } else if (error.message.includes('ERR_CONNECTION_TIMED_OUT') || 
               error.message.includes('ERR_NETWORK') ||
               error.message.includes('Failed to fetch')) {
      ElMessage.error('网络连接失败，请检查网络或稍后重试')
    } else {
      ElMessage.error(`下载失败: ${error.message}`)
    }
  }

  /**
   * 批量下载文件
   * @param {string[]} filenames 文件名列表
   * @param {Object} options 选项
   * @returns {Promise<void>}
   */
  async downloadMultipleFiles(filenames, options = {}) {
    const {
      concurrent = 3, // 并发下载数量
      onProgress = () => {},
      onFileComplete = () => {},
      onFileError = () => {}
    } = options

    if (!Array.isArray(filenames) || filenames.length === 0) {
      throw new Error('文件列表不能为空')
    }

    ElMessage.info(`开始批量下载 ${filenames.length} 个文件...`)

    const results = []
    let completed = 0
    let failed = 0

    // 分批处理，控制并发数量
    for (let i = 0; i < filenames.length; i += concurrent) {
      const batch = filenames.slice(i, i + concurrent)
      
      const batchPromises = batch.map(async (filename) => {
        try {
          await this.downloadFile(filename, {
            onProgress: (progress, loaded, total) => {
              onProgress(filename, progress, loaded, total)
            }
          })
          completed++
          onFileComplete(filename, true)
          return { filename, success: true }
        } catch (error) {
          failed++
          onFileError(filename, error)
          return { filename, success: false, error }
        }
      })

      const batchResults = await Promise.allSettled(batchPromises)
      results.push(...batchResults.map(r => r.value))
    }

    ElMessage.success(`批量下载完成: 成功 ${completed} 个，失败 ${failed} 个`)
    return results
  }
}

// 创建单例实例
const fileDownloadService = new FileDownloadService()

export default fileDownloadService
export { FileDownloadService }
