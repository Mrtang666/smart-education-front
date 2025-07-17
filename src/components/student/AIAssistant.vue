<template>
  <div class="ai-assistant">
    <!-- 顶部标题栏 -->
    <div class="chat-header">
      <div class="header-content">
        <div class="ai-status">
          <div class="status-indicator online"></div>
          <div class="ai-info">
            <h3>AI学习助手</h3>
            <span class="status-text">在线 · 随时为您服务</span>
          </div>
        </div>
        <div class="header-actions">
          <el-button text class="action-btn" @click="clearChat">
            <el-icon><Delete /></el-icon>
          </el-button>
          <el-button text class="action-btn">
            <el-icon><More /></el-icon>
          </el-button>
        </div>
      </div>
    </div>

    <!-- 聊天容器 -->
    <div class="chat-container">
      <!-- 聊天消息区域 -->
      <div class="chat-messages" ref="chatMessages">
        <!-- 欢迎消息 -->
        <div v-if="messages.length === 0" class="welcome-section">
          <div class="welcome-hero">
            <div class="hero-avatar">
              <div class="avatar-core">
                <el-icon><ChatDotRound /></el-icon>
              </div>
            </div>
            <div class="hero-content">
              <h2>AI学习助手</h2>
              <p class="hero-subtitle">我可以帮您解答课程问题、提供学习建议</p>
            </div>
          </div>
        </div>

        <!-- 聊天消息列表 -->
        <div v-for="(message, index) in messages" :key="index" class="message-wrapper">
          <!-- 用户消息 -->
          <div v-if="message.type === 'user'" class="message user-message">
            <div class="message-content">
              <div class="message-bubble user-bubble">
                <div class="message-text">{{ message.content }}</div>
              </div>
              <div class="message-meta">
                <span class="message-time">{{ formatTime(message.timestamp) }}</span>
              </div>
            </div>
          </div>

          <!-- AI回复 -->
          <div v-else class="message ai-message">
            <div class="ai-avatar">
              <div class="ai-avatar-bg">
                <el-icon><ChatDotRound /></el-icon>
              </div>
            </div>
            <div class="message-content">
              <div class="message-bubble ai-bubble">
                <div class="message-text" v-html="formatAIResponse(message.content)"></div>
              </div>
              <div class="message-meta">
                <span class="message-time">{{ formatTime(message.timestamp) }}</span>
                <div class="message-actions">
                  <el-button text size="small" class="action-btn" @click="copyMessage(message.content)">
                    <el-icon><CopyDocument /></el-icon>
                  </el-button>
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- 加载状态 -->
        <div v-if="isLoading" class="message-wrapper">
          <div class="message ai-message loading-message">
            <div class="ai-avatar">
              <div class="ai-avatar-bg loading">
                <el-icon class="loading-icon"><Loading /></el-icon>
              </div>
            </div>
            <div class="message-content">
              <div class="message-bubble ai-bubble loading-bubble">
                <div class="typing-container">
                  <div class="typing-indicator">
                    <span></span>
                    <span></span>
                    <span></span>
                  </div>
                  <div class="loading-text">AI正在思考中...</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- 输入区域 -->
      <div class="chat-input-area">
        <div class="input-container">
          <div class="input-wrapper">
            <el-input
              v-model="currentQuestion"
              type="textarea"
              :rows="1"
              placeholder="有什么问题尽管问我..."
              :disabled="isLoading"
              @keydown.ctrl.enter="sendMessage"
              class="question-input"
              resize="none"
              :autosize="{ minRows: 1, maxRows: 3 }"
            />
            <el-button
              :disabled="!currentQuestion.trim() || isLoading"
              @click="sendMessage"
              class="send-button"
              type="primary"
            >
              <el-icon><Promotion /></el-icon>
            </el-button>
          </div>
        </div>
      </div>
    </div>

    <!-- 快捷问题 -->
    <div class="quick-questions-section" v-if="messages.length === 0">
      <div class="questions-list">
        <div
          v-for="(question, index) in quickQuestions"
          :key="index"
          @click="selectQuickQuestion(question.text)"
          class="question-item"
        >
          <span>{{ question.text }}</span>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, nextTick, inject } from 'vue'
import { ElMessage } from 'element-plus'
import {
  ChatDotRound, Loading, Promotion, Delete, More, CopyDocument
} from '@element-plus/icons-vue'
import { studentAssistantAPI } from '@/api/api'
import { getUserInfo } from '@/utils/auth'

// 注入课程信息
const courseId = inject('courseId', null)

// 响应式数据
const messages = ref([])
const currentQuestion = ref('')
const isLoading = ref(false)
const chatMessages = ref(null)

// 快捷问题
const quickQuestions = ref([
  {
    text: '这门课程的主要内容是什么？'
  },
  {
    text: '如何提高学习效率？'
  },
  {
    text: '作业提交的注意事项有哪些？'
  },
  {
    text: '考试重点是什么？'
  }
])

// 发送消息
async function sendMessage() {
  if (!currentQuestion.value.trim() || isLoading.value) {
    return
  }

  const question = currentQuestion.value.trim()
  currentQuestion.value = ''

  // 添加用户消息
  addMessage('user', question)

  // 显示加载状态
  isLoading.value = true

  try {
    // 获取用户信息
    const userInfo = getUserInfo()
    if (!userInfo || !userInfo.studentId) {
      throw new Error('无法获取学生信息，请重新登录')
    }

    // 准备请求数据
    const askData = {
      question: question
    }

    // 如果有课程ID，添加到请求中
    if (courseId) {
      askData.courseId = courseId
    }

    // 调用AI问答接口
    const response = await studentAssistantAPI.askQuestion(userInfo.studentId, askData)
    
    // 添加AI回复
    if (response && response.answer) {
      addMessage('ai', response.answer)
    } else {
      addMessage('ai', '抱歉，我暂时无法回答这个问题，请稍后再试。')
    }

  } catch (error) {
    console.error('AI问答失败:', error)

    // 根据错误类型提供不同的提示
    let errorMessage = '抱歉，服务暂时不可用，请稍后再试。'
    let toastMessage = 'AI助手暂时不可用，请稍后再试'

    if (error.code === 'ECONNABORTED' || error.message.includes('timeout')) {
      errorMessage = '抱歉，AI正在深度思考中，响应时间较长。请稍后再试，或者尝试提出更简洁的问题。'
      toastMessage = 'AI响应超时，请稍后再试或简化问题'
    } else if (error.response?.status === 500) {
      errorMessage = '抱歉，AI服务暂时繁忙，请稍后再试。'
      toastMessage = 'AI服务繁忙，请稍后再试'
    }

    addMessage('ai', errorMessage)
    ElMessage.error(toastMessage)
  } finally {
    isLoading.value = false
  }
}

// 添加消息
function addMessage(type, content) {
  messages.value.push({
    type,
    content,
    timestamp: new Date()
  })
  
  // 滚动到底部
  nextTick(() => {
    scrollToBottom()
  })
}

// 选择快捷问题
function selectQuickQuestion(question) {
  currentQuestion.value = question
  sendMessage()
}

// 清空聊天记录
function clearChat() {
  messages.value = []
  ElMessage.success('聊天记录已清空')
}



// 复制消息内容
async function copyMessage(content) {
  try {
    await navigator.clipboard.writeText(content)
    ElMessage.success('已复制到剪贴板')
  } catch (error) {
    console.error('复制失败:', error)
    ElMessage.error('复制失败')
  }
}

// 格式化时间
function formatTime(timestamp) {
  return new Date(timestamp).toLocaleTimeString('zh-CN', {
    hour: '2-digit',
    minute: '2-digit'
  })
}

// 格式化AI回复（支持简单的markdown）
function formatAIResponse(content) {
  return content
    .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
    .replace(/\*(.*?)\*/g, '<em>$1</em>')
    .replace(/\n/g, '<br>')
}

// 滚动到底部
function scrollToBottom() {
  if (chatMessages.value) {
    chatMessages.value.scrollTop = chatMessages.value.scrollHeight
  }
}

// 组件挂载
onMounted(() => {
  // 可以在这里添加初始化逻辑
})
</script>

<style scoped>
.ai-assistant {
  height: 100%;
  display: flex;
  flex-direction: column;
  background: #fafbfc;
  position: relative;
}

/* 顶部标题栏 */
.chat-header {
  background: white;
  border-bottom: 1px solid #e8eaed;
  padding: 20px 24px;
}

.header-content {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.ai-status {
  display: flex;
  align-items: center;
  gap: 12px;
}

.status-indicator {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  background: #34a853;
}

.ai-info h3 {
  margin: 0;
  font-size: 16px;
  font-weight: 500;
  color: #202124;
}

.status-text {
  font-size: 13px;
  color: #5f6368;
}

.header-actions {
  display: flex;
  gap: 8px;
}

.action-btn {
  width: 32px;
  height: 32px;
  border-radius: 50%;
  color: #5f6368;
  transition: all 0.2s ease;
}

.action-btn:hover {
  background: #f1f3f4;
  color: #202124;
}

.chat-container {
  flex: 1;
  display: flex;
  flex-direction: column;
  background: white;
  margin: 0 16px 16px 16px;
  border-radius: 12px;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
  overflow: hidden;
}

.chat-messages {
  flex: 1;
  padding: 24px;
  overflow-y: auto;
  scroll-behavior: smooth;
}

/* 欢迎界面样式 */
.welcome-section {
  text-align: center;
  padding: 60px 20px 40px 20px;
}

.welcome-hero {
  margin-bottom: 32px;
}

.hero-avatar {
  display: inline-block;
  margin-bottom: 20px;
}

.avatar-core {
  width: 64px;
  height: 64px;
  background: #4285f4;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  box-shadow: 0 2px 8px rgba(66, 133, 244, 0.3);
}

.avatar-core .el-icon {
  font-size: 28px;
  color: white;
}

.hero-content h2 {
  margin: 0 0 8px 0;
  font-size: 24px;
  font-weight: 400;
  color: #202124;
}

.hero-subtitle {
  margin: 0;
  font-size: 14px;
  color: #5f6368;
  line-height: 1.4;
}

/* 消息样式 */

/* 消息样式 */
.message-wrapper {
  margin-bottom: 20px;
}

.message {
  display: flex;
  gap: 12px;
  max-width: 80%;
}

.user-message {
  margin-left: auto;
}

.ai-message {
  margin-right: auto;
}

/* AI头像样式 */
.ai-avatar {
  flex-shrink: 0;
}

.ai-avatar-bg {
  width: 32px;
  height: 32px;
  background: #4285f4;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
}

.ai-avatar-bg.loading {
  animation: avatarPulse 2s ease-in-out infinite;
}

@keyframes avatarPulse {
  0%, 100% { transform: scale(1); }
  50% { transform: scale(1.05); }
}

.ai-avatar-bg .el-icon {
  font-size: 16px;
  color: white;
}

/* 消息内容 */
.message-content {
  flex: 1;
  min-width: 0;
}

/* 消息气泡 */
.message-bubble {
  padding: 12px 16px;
  border-radius: 18px;
  line-height: 1.5;
  word-wrap: break-word;
  max-width: 100%;
}

.user-bubble {
  background: #4285f4;
  color: white;
  border-bottom-right-radius: 4px;
}

.ai-bubble {
  background: #f1f3f4;
  color: #202124;
  border-bottom-left-radius: 4px;
}

.loading-bubble {
  background: #f8f9fa;
  border: 1px solid #e8eaed;
}

.message-text {
  margin: 0;
  font-size: 14px;
}

/* 消息元信息 */
.message-meta {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-top: 4px;
  padding: 0 4px;
}

.message-time {
  font-size: 11px;
  color: #5f6368;
}

.message-actions {
  display: flex;
  gap: 4px;
  opacity: 0;
  transition: opacity 0.2s ease;
}

.message-wrapper:hover .message-actions {
  opacity: 1;
}

.message-actions .action-btn {
  width: 24px;
  height: 24px;
  padding: 0;
  color: #5f6368;
  border-radius: 50%;
}

.message-actions .action-btn:hover {
  color: #4285f4;
  background: #f1f3f4;
}

/* 加载状态 */
.loading-icon {
  animation: spin 1s linear infinite;
}

@keyframes spin {
  from { transform: rotate(0deg); }
  to { transform: rotate(360deg); }
}

.typing-container {
  display: flex;
  align-items: center;
  gap: 8px;
}

.typing-indicator {
  display: flex;
  gap: 3px;
  align-items: center;
}

.typing-indicator span {
  width: 6px;
  height: 6px;
  border-radius: 50%;
  background: #9aa0a6;
  animation: typing 1.4s infinite ease-in-out;
}

.typing-indicator span:nth-child(1) { animation-delay: -0.32s; }
.typing-indicator span:nth-child(2) { animation-delay: -0.16s; }
.typing-indicator span:nth-child(3) { animation-delay: 0s; }

@keyframes typing {
  0%, 80%, 100% {
    transform: scale(0.8);
    opacity: 0.5;
  }
  40% {
    transform: scale(1);
    opacity: 1;
  }
}

.loading-text {
  font-size: 14px;
  color: #5f6368;
}

/* 输入区域 */
.chat-input-area {
  background: white;
  border-top: 1px solid #e8eaed;
  padding: 16px 24px;
}

.input-container {
  max-width: 100%;
}

.input-wrapper {
  display: flex;
  align-items: flex-end;
  gap: 12px;
  background: #f8f9fa;
  border-radius: 24px;
  padding: 8px 8px 8px 16px;
  border: 1px solid #e8eaed;
  transition: all 0.2s ease;
}

.input-wrapper:focus-within {
  border-color: #4285f4;
  box-shadow: 0 0 0 1px #4285f4;
}

.question-input {
  flex: 1;
  border: none;
  background: transparent;
}

:deep(.question-input .el-textarea__inner) {
  border: none;
  box-shadow: none;
  padding: 8px 0;
  background: transparent;
  resize: none;
  font-size: 14px;
  line-height: 1.4;
  color: #202124;
}

:deep(.question-input .el-textarea__inner::placeholder) {
  color: #5f6368;
}

:deep(.question-input .el-textarea__inner:focus) {
  box-shadow: none;
}

.send-button {
  width: 36px;
  height: 36px;
  border-radius: 50%;
  background: #4285f4;
  border: none;
  color: white;
  transition: all 0.2s ease;
  flex-shrink: 0;
}

.send-button:hover:not(:disabled) {
  background: #3367d6;
  transform: scale(1.05);
}

.send-button:disabled {
  background: #dadce0;
  color: #9aa0a6;
  transform: none;
}

/* 快捷问题区域 */
.quick-questions-section {
  margin: 0 16px 16px 16px;
  background: white;
  border-radius: 12px;
  padding: 20px;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
}

.questions-list {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.question-item {
  padding: 12px 16px;
  background: #f8f9fa;
  border-radius: 20px;
  cursor: pointer;
  transition: all 0.2s ease;
  font-size: 14px;
  color: #5f6368;
  border: 1px solid transparent;
}

.question-item:hover {
  background: #e8f0fe;
  color: #4285f4;
  border-color: #4285f4;
}

/* 响应式设计 */
@media (max-width: 768px) {
  .chat-messages {
    padding: 16px;
  }

  .chat-input-area {
    padding: 12px 16px;
  }

  .message {
    max-width: 90%;
  }

  .hero-content h2 {
    font-size: 20px;
  }

  .welcome-section {
    padding: 40px 16px 24px 16px;
  }
}
</style>
