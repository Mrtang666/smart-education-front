<template>
  <div class="file-download-test">
    <div class="header">
      <h2>文件下载功能测试</h2>
      <p>测试改进后的文件下载功能，包含重试机制和错误处理</p>
    </div>

    <!-- 网络状态监控 -->
    <NetworkStatus />

    <div class="test-section">
      <h3>单文件下载测试</h3>
      <div class="test-controls">
        <el-input
          v-model="testFilename"
          placeholder="输入测试文件名，如: test.pdf"
          style="width: 300px; margin-right: 10px;"
        />
        <el-button 
          type="primary" 
          @click="testSingleDownload"
          :loading="downloading"
        >
          测试下载
        </el-button>
      </div>
    </div>

    <div class="test-section">
      <h3>批量下载测试</h3>
      <div class="test-controls">
        <el-button 
          type="success" 
          @click="testBatchDownload"
          :loading="batchDownloading"
        >
          测试批量下载
        </el-button>
      </div>
      <div v-if="batchProgress.length > 0" class="batch-progress">
        <h4>下载进度:</h4>
        <div v-for="item in batchProgress" :key="item.filename" class="progress-item">
          <span>{{ item.filename }}: </span>
          <el-tag :type="item.status === 'success' ? 'success' : item.status === 'error' ? 'danger' : 'info'">
            {{ item.status === 'success' ? '成功' : item.status === 'error' ? '失败' : '下载中' }}
          </el-tag>
        </div>
      </div>
    </div>

    <div class="test-section">
      <h3>网络状态信息</h3>
      <div class="network-info">
        <p><strong>在线状态:</strong> {{ networkInfo.online ? '在线' : '离线' }}</p>
        <p><strong>连接类型:</strong> {{ networkInfo.effectiveType }}</p>
        <p><strong>下载速度:</strong> {{ networkInfo.downlink }} Mbps</p>
        <p><strong>延迟:</strong> {{ networkInfo.rtt }} ms</p>
        <p><strong>省流量模式:</strong> {{ networkInfo.saveData ? '开启' : '关闭' }}</p>
      </div>
    </div>

    <div class="test-section">
      <h3>服务器连接测试</h3>
      <div class="server-test">
        <el-button @click="testServerConnection" :loading="testingServer">
          测试服务器连接
        </el-button>
        <div v-if="serverTestResults.length > 0" class="server-results">
          <h4>服务器测试结果:</h4>
          <div v-for="result in serverTestResults" :key="result.server" class="server-result">
            <span>{{ result.server }}: </span>
            <el-tag :type="result.status === 'success' ? 'success' : 'danger'">
              {{ result.status === 'success' ? '可用' : '不可用' }}
            </el-tag>
            <span v-if="result.responseTime"> ({{ result.responseTime }}ms)</span>
          </div>
        </div>
      </div>
    </div>

    <div class="test-section">
      <h3>使用说明</h3>
      <div class="instructions">
        <h4>功能特性:</h4>
        <ul>
          <li>✅ 自动重试机制（最多3次）</li>
          <li>✅ 多服务器地址支持</li>
          <li>✅ 网络状态监控</li>
          <li>✅ 详细错误处理</li>
          <li>✅ 下载进度显示</li>
          <li>✅ 批量下载支持</li>
        </ul>
        
        <h4>测试建议:</h4>
        <ul>
          <li>尝试下载不存在的文件测试错误处理</li>
          <li>在网络不稳定时测试重试机制</li>
          <li>测试批量下载的并发控制</li>
        </ul>
      </div>
    </div>
  </div>
</template>

<script>
import { ref, onMounted, onUnmounted } from 'vue'
import { ElMessage } from 'element-plus'
import NetworkStatus from '@/components/NetworkStatus.vue'
import { getNetworkInfo, watchNetworkStatus, checkServerConnection } from '@/utils/networkUtils'
import { FILE_SERVER_CONFIG } from '@/config/fileServer'
import fileDownloadService from '@/services/fileDownloadService'

export default {
  name: 'FileDownloadTest',
  components: {
    NetworkStatus
  },
  setup() {
    const testFilename = ref('test.pdf')
    const downloading = ref(false)
    const batchDownloading = ref(false)
    const testingServer = ref(false)
    const networkInfo = ref(getNetworkInfo())
    const batchProgress = ref([])
    const serverTestResults = ref([])
    let unwatchNetwork = null

    // 更新网络信息
    const updateNetworkInfo = () => {
      networkInfo.value = getNetworkInfo()
    }

    // 测试单文件下载
    const testSingleDownload = async () => {
      if (!testFilename.value.trim()) {
        ElMessage.warning('请输入文件名')
        return
      }

      downloading.value = true
      try {
        await fileDownloadService.downloadFile(testFilename.value, {
          onProgress: (progress, loaded, total) => {
            console.log(`下载进度: ${progress}% (${loaded}/${total} bytes)`)
          },
          onRetry: (attempt, maxRetries) => {
            console.log(`正在重试下载 (${attempt}/${maxRetries})...`)
          }
        })
      } catch (error) {
        console.error('下载测试失败:', error)
      } finally {
        downloading.value = false
      }
    }

    // 测试批量下载
    const testBatchDownload = async () => {
      const testFiles = ['test1.pdf', 'test2.docx', 'test3.txt', 'nonexistent.file']
      
      batchDownloading.value = true
      batchProgress.value = testFiles.map(filename => ({
        filename,
        status: 'downloading'
      }))

      try {
        await fileDownloadService.downloadMultipleFiles(testFiles, {
          concurrent: 2,
          onFileComplete: (filename, success) => {
            const item = batchProgress.value.find(p => p.filename === filename)
            if (item) {
              item.status = success ? 'success' : 'error'
            }
          },
          onFileError: (filename, error) => {
            console.error(`文件 ${filename} 下载失败:`, error)
          }
        })
      } catch (error) {
        console.error('批量下载测试失败:', error)
      } finally {
        batchDownloading.value = false
      }
    }

    // 测试服务器连接
    const testServerConnection = async () => {
      testingServer.value = true
      serverTestResults.value = []

      const servers = FILE_SERVER_CONFIG.servers
      
      for (const server of servers) {
        const startTime = Date.now()
        try {
          const isConnected = await checkServerConnection(server, 5000)
          const responseTime = Date.now() - startTime
          
          serverTestResults.value.push({
            server,
            status: isConnected ? 'success' : 'error',
            responseTime: isConnected ? responseTime : null
          })
        } catch (error) {
          serverTestResults.value.push({
            server,
            status: 'error',
            responseTime: null
          })
        }
      }
      
      testingServer.value = false
    }

    onMounted(() => {
      // 监听网络状态变化
      unwatchNetwork = watchNetworkStatus(
        () => {
          updateNetworkInfo()
          ElMessage.success('网络已连接')
        },
        () => {
          updateNetworkInfo()
          ElMessage.warning('网络已断开')
        }
      )

      // 定期更新网络信息
      const networkUpdateInterval = setInterval(updateNetworkInfo, 5000)

      // 清理函数
      onUnmounted(() => {
        if (unwatchNetwork) {
          unwatchNetwork()
        }
        clearInterval(networkUpdateInterval)
      })
    })

    return {
      testFilename,
      downloading,
      batchDownloading,
      testingServer,
      networkInfo,
      batchProgress,
      serverTestResults,
      testSingleDownload,
      testBatchDownload,
      testServerConnection
    }
  }
}
</script>

<style scoped>
.file-download-test {
  padding: 20px;
  max-width: 1200px;
  margin: 0 auto;
}

.header {
  text-align: center;
  margin-bottom: 30px;
  padding: 20px;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
  border-radius: 10px;
}

.test-section {
  margin-bottom: 30px;
  padding: 20px;
  border: 1px solid #e0e0e0;
  border-radius: 8px;
  background: #fafafa;
}

.test-section h3 {
  margin-top: 0;
  color: #333;
  border-bottom: 2px solid #409eff;
  padding-bottom: 10px;
}

.test-controls {
  margin-bottom: 15px;
}

.batch-progress {
  margin-top: 15px;
}

.progress-item {
  margin: 5px 0;
  display: flex;
  align-items: center;
  gap: 10px;
}

.network-info p {
  margin: 8px 0;
  padding: 5px 10px;
  background: white;
  border-radius: 4px;
  border-left: 3px solid #409eff;
}

.server-results {
  margin-top: 15px;
}

.server-result {
  margin: 5px 0;
  display: flex;
  align-items: center;
  gap: 10px;
}

.instructions {
  background: white;
  padding: 15px;
  border-radius: 6px;
}

.instructions h4 {
  color: #409eff;
  margin-top: 15px;
  margin-bottom: 10px;
}

.instructions ul {
  margin: 10px 0;
  padding-left: 20px;
}

.instructions li {
  margin: 5px 0;
  line-height: 1.6;
}

/* 移动端适配 */
@media (max-width: 768px) {
  .file-download-test {
    padding: 10px;
  }
  
  .test-controls {
    display: flex;
    flex-direction: column;
    gap: 10px;
  }
  
  .test-controls .el-input {
    width: 100% !important;
  }
}
</style>
