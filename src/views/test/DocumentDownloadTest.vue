<template>
  <div class="document-download-test">
    <div class="header">
      <h2>文档下载功能测试</h2>
      <p>测试新的文档下载API接口 (http://118.89.136.119:8000/docs/download)</p>
    </div>

    <div class="test-section">
      <h3>单文档下载测试</h3>
      <div class="test-controls">
        <el-input
          v-model="testFilename"
          placeholder="输入测试文件名，如: 7.1.txt"
          style="width: 300px; margin-right: 10px;"
        />
        <el-button 
          type="primary" 
          @click="testSingleDownload"
          :loading="downloading"
        >
          测试下载
        </el-button>
        <el-button 
          type="info" 
          @click="checkFileExists"
          :loading="checking"
        >
          检查文件存在
        </el-button>
      </div>
      
      <!-- 下载进度 -->
      <div v-if="downloadProgress.show" class="progress-section">
        <el-progress 
          :percentage="downloadProgress.percentage" 
          :status="downloadProgress.status"
        />
        <p class="progress-text">
          {{ downloadProgress.text }}
        </p>
      </div>
    </div>

    <div class="test-section">
      <h3>批量下载测试</h3>
      <div class="batch-controls">
        <el-input
          v-model="batchFilenames"
          type="textarea"
          :rows="4"
          placeholder="输入多个文件名，每行一个，如：&#10;7.1.txt&#10;test.pdf&#10;document.docx"
          style="width: 400px; margin-right: 10px;"
        />
        <div class="batch-buttons">
          <el-button 
            type="primary" 
            @click="testBatchDownload"
            :loading="batchDownloading"
          >
            批量下载
          </el-button>
          <el-button 
            type="warning" 
            @click="clearLogs"
          >
            清空日志
          </el-button>
        </div>
      </div>
      
      <!-- 批量下载进度 -->
      <div v-if="batchProgress.show" class="progress-section">
        <el-progress 
          :percentage="batchProgress.percentage" 
          :status="batchProgress.status"
        />
        <p class="progress-text">
          {{ batchProgress.text }}
        </p>
      </div>
    </div>

    <!-- 测试日志 -->
    <div class="logs-section">
      <h3>测试日志</h3>
      <div class="logs-container">
        <div 
          v-for="(log, index) in logs" 
          :key="index" 
          :class="['log-item', `log-${log.type}`]"
        >
          <span class="log-time">{{ log.time }}</span>
          <span class="log-message">{{ log.message }}</span>
        </div>
        <div v-if="logs.length === 0" class="no-logs">
          暂无日志
        </div>
      </div>
    </div>

    <!-- API信息 -->
    <div class="api-info">
      <h3>API信息</h3>
      <div class="info-card">
        <p><strong>接口地址:</strong> http://118.89.136.119:8000/docs/download</p>
        <p><strong>请求方法:</strong> POST</p>
        <p><strong>请求头:</strong> Content-Type: application/json</p>
        <p><strong>请求体:</strong> {"filename": "文件名"}</p>
        <p><strong>响应类型:</strong> application/octet-stream (文件流)</p>
        <p><strong>响应状态:</strong> 200 (成功) / 422 (验证错误)</p>
      </div>
    </div>
  </div>
</template>

<script>
import { ElMessage } from 'element-plus'
import documentDownloadService from '@/services/documentDownloadService'

export default {
  name: 'DocumentDownloadTest',
  data() {
    return {
      testFilename: '7.1.txt',
      batchFilenames: '7.1.txt\ntest.pdf\ndocument.docx',
      downloading: false,
      checking: false,
      batchDownloading: false,
      downloadProgress: {
        show: false,
        percentage: 0,
        status: '',
        text: ''
      },
      batchProgress: {
        show: false,
        percentage: 0,
        status: '',
        text: ''
      },
      logs: []
    }
  },
  methods: {
    // 添加日志
    addLog(message, type = 'info') {
      const now = new Date()
      const time = now.toLocaleTimeString()
      this.logs.unshift({
        time,
        message,
        type
      })
      
      // 限制日志数量
      if (this.logs.length > 50) {
        this.logs = this.logs.slice(0, 50)
      }
    },

    // 测试单文档下载
    async testSingleDownload() {
      if (!this.testFilename.trim()) {
        ElMessage.warning('请输入文件名')
        return
      }

      this.downloading = true
      this.downloadProgress.show = true
      this.downloadProgress.percentage = 0
      this.downloadProgress.status = ''
      this.downloadProgress.text = '准备下载...'

      try {
        this.addLog(`开始下载: ${this.testFilename}`)
        
        await documentDownloadService.downloadDocument(this.testFilename, {
          onProgress: (progress, loaded, total) => {
            this.downloadProgress.percentage = progress
            this.downloadProgress.text = `下载中... ${progress}% (${this.formatBytes(loaded)}/${this.formatBytes(total)})`
            this.addLog(`下载进度: ${progress}%`)
          },
          onSuccess: (filename, blob) => {
            this.downloadProgress.status = 'success'
            this.downloadProgress.text = `下载完成: ${filename} (${this.formatBytes(blob.size)})`
            this.addLog(`下载成功: ${filename}, 大小: ${this.formatBytes(blob.size)}`, 'success')
          },
          onError: (error, filename) => {
            this.downloadProgress.status = 'exception'
            this.downloadProgress.text = `下载失败: ${error.message}`
            this.addLog(`下载失败: ${filename} - ${error.message}`, 'error')
          }
        })

      } catch (error) {
        this.downloadProgress.status = 'exception'
        this.downloadProgress.text = `下载失败: ${error.message}`
        this.addLog(`下载异常: ${error.message}`, 'error')
      } finally {
        this.downloading = false
        setTimeout(() => {
          this.downloadProgress.show = false
        }, 3000)
      }
    },

    // 检查文件是否存在
    async checkFileExists() {
      if (!this.testFilename.trim()) {
        ElMessage.warning('请输入文件名')
        return
      }

      this.checking = true
      try {
        this.addLog(`检查文件存在性: ${this.testFilename}`)
        
        const exists = await documentDownloadService.checkDocumentExists(this.testFilename)
        
        if (exists) {
          this.addLog(`文件存在: ${this.testFilename}`, 'success')
          ElMessage.success('文件存在')
        } else {
          this.addLog(`文件不存在: ${this.testFilename}`, 'warning')
          ElMessage.warning('文件不存在')
        }
        
      } catch (error) {
        this.addLog(`检查文件失败: ${error.message}`, 'error')
        ElMessage.error('检查文件失败')
      } finally {
        this.checking = false
      }
    },

    // 测试批量下载
    async testBatchDownload() {
      const filenames = this.batchFilenames
        .split('\n')
        .map(name => name.trim())
        .filter(name => name.length > 0)

      if (filenames.length === 0) {
        ElMessage.warning('请输入文件名列表')
        return
      }

      this.batchDownloading = true
      this.batchProgress.show = true
      this.batchProgress.percentage = 0
      this.batchProgress.status = ''
      this.batchProgress.text = '准备批量下载...'

      try {
        this.addLog(`开始批量下载 ${filenames.length} 个文件`)
        
        const results = await documentDownloadService.downloadMultipleDocuments(filenames, {
          onProgress: (progress, completed, total) => {
            this.batchProgress.percentage = progress
            this.batchProgress.text = `批量下载中... ${completed}/${total} (${progress}%)`
          },
          onItemComplete: (filename, success, error) => {
            if (success) {
              this.addLog(`文件下载成功: ${filename}`, 'success')
            } else {
              this.addLog(`文件下载失败: ${filename} - ${error?.message || '未知错误'}`, 'error')
            }
          },
          concurrent: 2
        })

        const successCount = results.filter(r => r.success).length
        const failCount = results.length - successCount

        this.batchProgress.status = failCount === 0 ? 'success' : 'warning'
        this.batchProgress.text = `批量下载完成: 成功 ${successCount} 个，失败 ${failCount} 个`
        
        this.addLog(`批量下载完成: 成功 ${successCount} 个，失败 ${failCount} 个`, 
          failCount === 0 ? 'success' : 'warning')

      } catch (error) {
        this.batchProgress.status = 'exception'
        this.batchProgress.text = `批量下载失败: ${error.message}`
        this.addLog(`批量下载异常: ${error.message}`, 'error')
      } finally {
        this.batchDownloading = false
        setTimeout(() => {
          this.batchProgress.show = false
        }, 5000)
      }
    },

    // 清空日志
    clearLogs() {
      this.logs = []
      this.addLog('日志已清空')
    },

    // 格式化字节数
    formatBytes(bytes) {
      if (bytes === 0) return '0 Bytes'
      const k = 1024
      const sizes = ['Bytes', 'KB', 'MB', 'GB']
      const i = Math.floor(Math.log(bytes) / Math.log(k))
      return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
    }
  }
}
</script>

<style scoped>
.document-download-test {
  padding: 20px;
  max-width: 1200px;
  margin: 0 auto;
}

.header {
  text-align: center;
  margin-bottom: 30px;
}

.header h2 {
  color: #409EFF;
  margin-bottom: 10px;
}

.test-section {
  margin-bottom: 30px;
  padding: 20px;
  border: 1px solid #EBEEF5;
  border-radius: 8px;
  background: #FAFAFA;
}

.test-section h3 {
  margin-top: 0;
  color: #303133;
}

.test-controls, .batch-controls {
  display: flex;
  align-items: flex-start;
  gap: 10px;
  margin-bottom: 15px;
}

.batch-buttons {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.progress-section {
  margin-top: 15px;
  padding: 15px;
  background: white;
  border-radius: 6px;
}

.progress-text {
  margin-top: 10px;
  color: #606266;
  font-size: 14px;
}

.logs-section {
  margin-bottom: 30px;
}

.logs-container {
  max-height: 400px;
  overflow-y: auto;
  border: 1px solid #EBEEF5;
  border-radius: 6px;
  background: white;
}

.log-item {
  padding: 8px 12px;
  border-bottom: 1px solid #F5F7FA;
  display: flex;
  align-items: center;
}

.log-item:last-child {
  border-bottom: none;
}

.log-time {
  color: #909399;
  font-size: 12px;
  margin-right: 10px;
  min-width: 80px;
}

.log-message {
  flex: 1;
  font-size: 14px;
}

.log-info .log-message {
  color: #606266;
}

.log-success .log-message {
  color: #67C23A;
}

.log-warning .log-message {
  color: #E6A23C;
}

.log-error .log-message {
  color: #F56C6C;
}

.no-logs {
  padding: 20px;
  text-align: center;
  color: #909399;
}

.api-info {
  padding: 20px;
  border: 1px solid #EBEEF5;
  border-radius: 8px;
  background: #F9F9F9;
}

.info-card p {
  margin: 8px 0;
  color: #606266;
}

.info-card strong {
  color: #303133;
}
</style>
