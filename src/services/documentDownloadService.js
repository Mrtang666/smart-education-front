/**
 * 文档下载服务
 * 使用新的API接口进行文档下载
 */

import { ElMessage } from 'element-plus'

class DocumentDownloadService {
  constructor() {
    this.downloadQueue = new Map() // 下载队列，防止重复下载
    this.baseUrl = 'http://118.89.136.119:8000'
  }

  /**
   * 下载单个文档
   * @param {string} filename 文件名
   * @param {Object} options 选项
   * @param {Function} options.onProgress 进度回调
   * @param {Function} options.onSuccess 成功回调
   * @param {Function} options.onError 错误回调
   * @returns {Promise<void>}
   */
  async downloadDocument(filename, options = {}) {
    const {
      onProgress = () => {},
      onSuccess = () => {},
      onError = () => {}
    } = options

    // 验证文件名
    if (!filename || typeof filename !== 'string') {
      const error = new Error('文件名无效')
      onError(error, filename)
      throw error
    }

    // 检查是否已在下载队列中
    if (this.downloadQueue.has(filename)) {
      ElMessage.warning('文件正在下载中，请稍候...')
      return this.downloadQueue.get(filename)
    }

    // 创建下载Promise
    const downloadPromise = this._performDownload(filename, {
      onProgress,
      onSuccess,
      onError
    })

    // 添加到下载队列
    this.downloadQueue.set(filename, downloadPromise)

    try {
      await downloadPromise
    } finally {
      // 从下载队列中移除
      this.downloadQueue.delete(filename)
    }
  }

  /**
   * 执行文档下载
   * @private
   */
  async _performDownload(filename, { onProgress, onSuccess, onError }) {
    try {
      console.log(`开始下载文档: ${filename}`)
      ElMessage.info('开始下载文档...')

      // 调用新的下载API - 使用POST请求和JSON请求体
      const response = await fetch(`${this.baseUrl}/docs/download`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/octet-stream'
        },
        body: JSON.stringify({
          filename: filename
        })
      })

      if (!response.ok) {
        let errorMessage = `下载失败: ${response.status} ${response.statusText}`
        
        try {
          const errorData = await response.json()
          if (errorData.detail) {
            errorMessage = errorData.detail
          }
        } catch (e) {
          // 如果无法解析JSON，使用默认错误消息
        }

        throw new Error(errorMessage)
      }

      // 获取文件大小
      const contentLength = response.headers.get('content-length')
      const total = contentLength ? parseInt(contentLength, 10) : 0

      let blob
      if (total > 0 && response.body && response.body.getReader) {
        // 支持进度监控的流式下载
        blob = await this._downloadWithProgress(response, total, onProgress)
      } else {
        // 直接下载
        blob = await response.blob()
      }

      console.log(`文档下载完成: ${filename}, 大小: ${blob.size} bytes`)

      // 触发浏览器下载
      await this._saveFile(blob, filename)

      ElMessage.success('文档下载成功')
      onSuccess(filename, blob)

    } catch (error) {
      console.error('下载文档失败:', error)
      
      // 根据错误类型提供不同的提示
      let userMessage = '下载文档失败，请稍后重试'
      
      if (error.message.includes('404')) {
        userMessage = '文档不存在或已被删除'
      } else if (error.message.includes('403')) {
        userMessage = '没有权限访问该文档'
      } else if (error.message.includes('网络')) {
        userMessage = '网络连接异常，请检查网络设置'
      } else if (error.message.includes('timeout')) {
        userMessage = '下载超时，请稍后重试'
      }

      ElMessage.error(userMessage)
      onError(error, filename)
      throw error
    }
  }

  /**
   * 带进度监控的下载
   * @private
   */
  async _downloadWithProgress(response, total, onProgress) {
    const reader = response.body.getReader()
    const chunks = []
    let loaded = 0

    try {
      // eslint-disable-next-line no-constant-condition
      while (true) {
        const { done, value } = await reader.read()

        if (done) break

        chunks.push(value)
        loaded += value.length
        
        // 计算进度
        const progress = Math.round((loaded / total) * 100)
        onProgress(progress, loaded, total)
      }
    } finally {
      reader.releaseLock()
    }

    // 合并所有chunks为Blob
    return new Blob(chunks)
  }

  /**
   * 保存文件到本地
   * @private
   */
  async _saveFile(blob, filename) {
    const safeFilename = this._sanitizeFilename(filename)
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
        if (document.body.contains(link)) {
          document.body.removeChild(link)
        }
      }, 100)
      
    } finally {
      // 清理URL对象
      setTimeout(() => {
        URL.revokeObjectURL(url)
      }, 1000)
    }
  }

  /**
   * 清理文件名
   * @private
   */
  _sanitizeFilename(filename) {
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

  /**
   * 批量下载文档
   * @param {string[]} filenames 文件名列表
   * @param {Object} options 选项
   * @returns {Promise<Array>} 下载结果列表
   */
  async downloadMultipleDocuments(filenames, options = {}) {
    const {
      onProgress = () => {},
      onItemComplete = () => {},
      concurrent = 2 // 并发下载数量
    } = options

    const results = []
    const total = filenames.length
    let completed = 0

    // 分批处理，控制并发数量
    for (let i = 0; i < filenames.length; i += concurrent) {
      const batch = filenames.slice(i, i + concurrent)
      
      const batchPromises = batch.map(async (filename) => {
        try {
          await this.downloadDocument(filename, {
            onSuccess: (filename, blob) => {
              results.push({ filename, success: true, blob })
              completed++
              onItemComplete(filename, true, null)
              onProgress(Math.round((completed / total) * 100), completed, total)
            },
            onError: (error, filename) => {
              results.push({ filename, success: false, error })
              completed++
              onItemComplete(filename, false, error)
              onProgress(Math.round((completed / total) * 100), completed, total)
            }
          })
        } catch (error) {
          // 错误已在downloadDocument中处理
        }
      })

      // 等待当前批次完成
      await Promise.allSettled(batchPromises)
      
      // 添加延迟避免过于频繁的请求
      if (i + concurrent < filenames.length) {
        await new Promise(resolve => setTimeout(resolve, 500))
      }
    }

    return results
  }

  /**
   * 检查文档是否存在
   * @param {string} filename 文件名
   * @returns {Promise<boolean>} 文件是否存在
   */
  async checkDocumentExists(filename) {
    try {
      // 使用POST请求检查文档存在性
      const response = await fetch(`${this.baseUrl}/docs/download`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/octet-stream'
        },
        body: JSON.stringify({
          filename: filename
        })
      })

      return response.ok
    } catch (error) {
      console.error('检查文档存在性失败:', error)
      return false
    }
  }
}

// 创建单例实例
const documentDownloadService = new DocumentDownloadService()

export default documentDownloadService
