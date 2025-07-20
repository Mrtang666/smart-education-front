<template>
  <div class="download-test-container">
    <div class="test-header">
      <h2>文档下载功能测试</h2>
      <p>测试从文件服务器直接下载文档的功能</p>
    </div>

    <!-- 手动输入文件名测试 -->
    <div class="test-section">
      <h3>手动测试下载</h3>
      <div class="input-group">
        <el-input 
          v-model="testFilename" 
          placeholder="请输入文件名（如：test.pdf）"
          style="width: 300px; margin-right: 10px;"
        />
        <el-button 
          type="primary" 
          @click="testDownload" 
          :loading="downloading"
        >
          测试下载
        </el-button>
      </div>
    </div>

    <!-- 预设文件测试 -->
    <div class="test-section">
      <h3>预设文件测试</h3>
      <div class="preset-files">
        <div 
          v-for="file in presetFiles" 
          :key="file.name" 
          class="file-item"
        >
          <div class="file-info">
            <span class="file-name">{{ file.name }}</span>
            <span class="file-desc">{{ file.description }}</span>
          </div>
          <div class="file-actions">
            <el-button 
              size="small" 
              @click="checkFileExists(file.name)"
              :loading="checkingFiles[file.name]"
            >
              检查存在
            </el-button>
            <el-button 
              type="primary" 
              size="small" 
              @click="downloadFile(file.name)"
              :loading="downloadingFiles[file.name]"
            >
              下载
            </el-button>
          </div>
          <div class="file-status">
            <el-tag 
              v-if="fileStatus[file.name]" 
              :type="fileStatus[file.name].exists ? 'success' : 'danger'"
            >
              {{ fileStatus[file.name].exists ? '存在' : '不存在' }}
            </el-tag>
          </div>
        </div>
      </div>
    </div>

    <!-- 测试日志 -->
    <div class="test-section">
      <h3>测试日志</h3>
      <div class="log-container">
        <div 
          v-for="(log, index) in logs" 
          :key="index" 
          class="log-item"
          :class="log.type"
        >
          <span class="log-time">{{ log.time }}</span>
          <span class="log-message">{{ log.message }}</span>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, reactive } from 'vue'
import { ElMessage } from 'element-plus'

// 响应式数据
const testFilename = ref('')
const downloading = ref(false)
const downloadingFiles = reactive({})
const checkingFiles = reactive({})
const fileStatus = reactive({})
const logs = ref([])

// 预设测试文件
const presetFiles = [
  { name: 'test.pdf', description: 'PDF测试文件' },
  { name: 'sample.docx', description: 'Word文档测试' },
  { name: 'example.txt', description: '文本文件测试' },
  { name: 'demo.pptx', description: 'PowerPoint测试' },
  { name: 'data.xlsx', description: 'Excel测试文件' }
]

// 添加日志
function addLog(message, type = 'info') {
  const now = new Date()
  const time = now.toLocaleTimeString()
  logs.value.unshift({
    time,
    message,
    type
  })
  
  // 限制日志数量
  if (logs.value.length > 50) {
    logs.value = logs.value.slice(0, 50)
  }
}

// 下载文档的通用函数
async function downloadDocument(filename) {
  try {
    addLog(`开始下载: ${filename}`)
    
    // 构建文件服务器URL
    const fileUrl = `http://118.89.136.119/smart-edu-files/${encodeURIComponent(filename)}`
    addLog(`文件URL: ${fileUrl}`)
    
    // 使用fetch直接下载文件
    const response = await fetch(fileUrl)
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`)
    }
    
    // 读取响应内容为 Blob 对象
    const blob = await response.blob()
    addLog(`文件大小: ${(blob.size / 1024).toFixed(2)} KB`)
    
    // 创建一个指向该 Blob 对象的 URL
    const url = URL.createObjectURL(blob)
    
    // 创建隐藏的 a 标签进行下载
    const link = document.createElement('a')
    link.href = url
    link.download = filename
    document.body.appendChild(link)
    link.click()
    
    // 清理资源
    setTimeout(() => {
      URL.revokeObjectURL(url)
      document.body.removeChild(link)
    }, 100)
    
    addLog(`下载成功: ${filename}`, 'success')
    ElMessage.success('文档下载成功')
    
  } catch (error) {
    addLog(`下载失败: ${filename} - ${error.message}`, 'error')
    
    // 根据错误类型提供不同的提示
    if (error.message.includes('404')) {
      ElMessage.error('文档不存在或已被删除')
    } else if (error.message.includes('403')) {
      ElMessage.error('没有权限访问该文档')
    } else if (error.message.includes('CORS')) {
      ElMessage.error('跨域访问被阻止，请联系管理员')
    } else {
      ElMessage.error('下载文档失败，请稍后重试')
    }
    
    throw error
  }
}

// 测试下载
async function testDownload() {
  if (!testFilename.value.trim()) {
    ElMessage.warning('请输入文件名')
    return
  }
  
  downloading.value = true
  try {
    await downloadDocument(testFilename.value.trim())
  } catch (error) {
    // 错误已在downloadDocument中处理
  } finally {
    downloading.value = false
  }
}

// 下载预设文件
async function downloadFile(filename) {
  downloadingFiles[filename] = true
  try {
    await downloadDocument(filename)
  } catch (error) {
    // 错误已在downloadDocument中处理
  } finally {
    downloadingFiles[filename] = false
  }
}

// 检查文件是否存在
async function checkFileExists(filename) {
  checkingFiles[filename] = true
  try {
    addLog(`检查文件存在性: ${filename}`)
    
    const fileUrl = `http://118.89.136.119/smart-edu-files/${encodeURIComponent(filename)}`
    const response = await fetch(fileUrl, { method: 'HEAD' })
    
    const exists = response.ok
    fileStatus[filename] = { exists }
    
    addLog(`文件 ${filename} ${exists ? '存在' : '不存在'}`, exists ? 'success' : 'warning')
    
  } catch (error) {
    fileStatus[filename] = { exists: false }
    addLog(`检查文件失败: ${filename} - ${error.message}`, 'error')
  } finally {
    checkingFiles[filename] = false
  }
}
</script>

<style scoped>
.download-test-container {
  padding: 20px;
  max-width: 1000px;
  margin: 0 auto;
}

.test-header {
  text-align: center;
  margin-bottom: 30px;
}

.test-header h2 {
  color: #303133;
  margin-bottom: 10px;
}

.test-header p {
  color: #606266;
}

.test-section {
  margin-bottom: 30px;
  padding: 20px;
  border: 1px solid #EBEEF5;
  border-radius: 8px;
}

.test-section h3 {
  color: #303133;
  margin-bottom: 15px;
  border-bottom: 2px solid #409EFF;
  padding-bottom: 8px;
}

.input-group {
  display: flex;
  align-items: center;
}

.preset-files {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.file-item {
  display: flex;
  align-items: center;
  padding: 10px;
  border: 1px solid #EBEEF5;
  border-radius: 4px;
  background-color: #FAFAFA;
}

.file-info {
  flex: 1;
  display: flex;
  flex-direction: column;
}

.file-name {
  font-weight: 600;
  color: #303133;
}

.file-desc {
  font-size: 12px;
  color: #909399;
}

.file-actions {
  margin-right: 15px;
}

.file-actions .el-button {
  margin-left: 5px;
}

.file-status {
  min-width: 60px;
}

.log-container {
  max-height: 300px;
  overflow-y: auto;
  border: 1px solid #EBEEF5;
  border-radius: 4px;
  padding: 10px;
  background-color: #F8F9FA;
}

.log-item {
  display: flex;
  margin-bottom: 5px;
  font-size: 14px;
}

.log-time {
  color: #909399;
  margin-right: 10px;
  min-width: 80px;
}

.log-message {
  flex: 1;
}

.log-item.success .log-message {
  color: #67C23A;
}

.log-item.error .log-message {
  color: #F56C6C;
}

.log-item.warning .log-message {
  color: #E6A23C;
}

.log-item.info .log-message {
  color: #303133;
}
</style>
