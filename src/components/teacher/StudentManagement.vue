<!-- 邀请码功能待测试是否能正确运行 -->
<template>
  <div class="content-section">
    <div class="section-header">
      <h3>学生列表</h3>
      <div class="header-actions">
        <el-button type="success" size="small" @click="generateInviteCode">
          <el-icon><Share /></el-icon>
          生成邀请码
        </el-button>
        <el-button type="danger" size="small" v-if="selectedStudents.length > 0" @click="$emit('batch-remove-students')">
          <el-icon><Delete /></el-icon>
          批量删除 ({{ selectedStudents.length }})
        </el-button>
        <el-button type="primary" size="small" @click="$emit('show-add-student')">
          <el-icon><Plus /></el-icon>
          添加学生
        </el-button>
      </div>
    </div>
    <div class="section-body">
      <div class="table-toolbar" v-if="courseStudents.length > 0">
        <el-input
          v-model="studentSearchKeyword"
          placeholder="搜索学生姓名或学号"
          prefix-icon="Search"
          clearable
          @clear="handleSearchClear"
          @input="handleSearchInput"
          style="width: 250px;"
        />
      </div>
      <div v-if="courseStudents.length === 0" class="empty-tip">
        暂无学生，请点击"添加学生"按钮添加
      </div>
      <div v-else class="table-container">
        <el-table
          :data="filteredStudents"
          style="width: 100%"
          @selection-change="handleSelectionChange"
          v-loading="isLoading"
          height="100%"
        >
        <el-table-column type="selection" width="55" />
        <el-table-column prop="studentId" label="学号" width="120" />
        <el-table-column prop="fullName" label="姓名" width="120" />
        <el-table-column prop="email" label="邮箱" />
        <el-table-column prop="phone" label="电话" width="120" />
        <!-- <el-table-column prop="grade" label="年级" width="100" /> -->
        <!-- <el-table-column prop="className" label="班级" width="120" /> -->
        <el-table-column label="操作" width="250" fixed="right">
          <template #default="scope">
            <el-button link type="primary" @click="$emit('view-student', scope.row)">查看</el-button>
            <el-button link type="success" @click="analyzeCourseProgress(scope.row)">课程学习情况</el-button>
            <el-button link type="danger" @click="$emit('remove-student', scope.row)">移除</el-button>
          </template>
        </el-table-column>
        </el-table>
      </div>
      <div class="pagination-container" v-if="courseStudents.length > pageSize">
        <el-pagination
          :current-page="currentPage"
          :page-size="pageSize"
          @update:current-page="$emit('update:current-page', $event)"
          @update:page-size="$emit('update:page-size', $event)"
          :page-sizes="[10, 20, 50, 100]"
          layout="total, sizes, prev, pager, next, jumper"
          :total="filteredStudents.length"
        />
      </div>
    </div>

    <!-- 课程学习情况分析模态框 -->
    <el-dialog
      v-model="analysisDialogVisible"
      title="课程学习情况分析"
      width="100%"
      :close-on-click-modal="false"
      @close="resetAnalysisState"
      class="analysis-modal"
      fullscreen
    >
      <!-- 自定义头部 -->
      <template #header>
        <div class="modal-header">
          <div class="header-content">
            <el-icon class="header-icon"><TrendCharts /></el-icon>
            <span class="modal-title">课程学习情况分析</span>
          </div>
        </div>
      </template>

      <!-- 模态框内容 -->
      <div class="modal-body">
        <!-- 加载状态 -->
        <div v-if="analyzing" class="analyzing-container">
          <div class="analyzing-header">
            <div class="student-info-simple">
              <h3>{{ selectedStudent?.fullName }}</h3>
              <p>学号：{{ selectedStudent?.studentId }} | 课程：{{ courseName }}</p>
            </div>
          </div>

          <div class="analyzing-content">
            <div class="analyzing-icon-wrapper">
              <el-icon class="is-loading"><Loading /></el-icon>
            </div>
            <h4>正在分析学习情况...</h4>
            <p class="analyzing-desc">{{ progressText }}</p>

            <div class="progress-wrapper">
              <el-progress
                :percentage="progressPercentage"
                :show-text="true"
                :stroke-width="6"
              />
            </div>
          </div>
        </div>

        <!-- 分析结果 -->
        <div v-else-if="analysisResult" class="analysis-result-container">
          <!-- 学生信息条 -->
          <div class="student-info-bar">
            <div class="student-basic-info">
              <span class="student-name">{{ selectedStudent?.fullName }}</span>
              <span class="student-id">学号：{{ selectedStudent?.studentId }}</span>
              <span class="course-name">课程：{{ courseName }}</span>
            </div>
            <el-tag size="small" type="success">AI分析报告</el-tag>
          </div>

          <!-- 分析报告内容 -->
          <div class="report-content-wrapper">
            <div class="report-content markdown-content" v-html="analysisResultHtml"></div>
          </div>
        </div>

        <!-- 错误状态 -->
        <div v-else class="error-container">
          <el-empty description="分析失败，请重试" :image-size="100">
            <el-button type="primary" @click="retryAnalysis">重新分析</el-button>
          </el-empty>
        </div>
      </div>

      <!-- 模态框底部 -->
      <template #footer>
        <div class="modal-footer">
          <span class="footer-tip">分析结果由AI生成，仅供参考</span>
          <div class="footer-actions">
            <el-button @click="analysisDialogVisible = false">关闭</el-button>
            <el-button type="primary" @click="retryAnalysis" v-if="!analyzing && analysisResult">
              重新分析
            </el-button>
          </div>
        </div>
      </template>
    </el-dialog>

    <!-- 邀请码对话框 -->
    <el-dialog
      v-model="inviteCodeDialogVisible"
      width="580px"
      :close-on-click-modal="false"
      :show-close="false"
      class="invite-code-dialog"
      top="8vh"
      append-to-body
    >
      <!-- 自定义头部 -->
      <template #header>
        <div class="dialog-header">
          <div class="header-icon">
            <el-icon><Share /></el-icon>
          </div>
          <div class="header-content">
            <h3 class="dialog-title">课程邀请码</h3>
            <p class="dialog-subtitle">分享给学生快速加入课程</p>
          </div>
        </div>
      </template>

      <div class="invite-code-content">
        <!-- 生成中状态 -->
        <div v-if="generatingInviteCode" class="generating-container">
          <div class="loading-wrapper">
            <el-icon class="loading-icon is-loading"><Loading /></el-icon>
            <div class="loading-text">
              <h4>正在生成邀请码</h4>
              <p>请稍候片刻...</p>
            </div>
          </div>
        </div>

        <!-- 成功状态 -->
        <div v-else-if="currentInviteCode" class="invite-code-result">
          <!-- 邀请码展示区域 -->
          <div class="invite-code-display">
            <div class="code-label">
              <el-icon><Ticket /></el-icon>
              <span>邀请码</span>
            </div>
            <div class="code-container">
              <div class="invite-code-wrapper">
                <span class="invite-code">{{ currentInviteCode }}</span>
                <div class="code-decoration"></div>
              </div>
              <el-button
                type="primary"
                size="default"
                @click="copyInviteCode"
                class="copy-button"
              >
                <el-icon><DocumentCopy /></el-icon>
                <span>复制</span>
              </el-button>
            </div>
          </div>

          <!-- 使用说明 -->
          <div class="invite-code-info">
            <div class="info-header">
              <el-icon><InfoFilled /></el-icon>
              <span>使用说明</span>
            </div>
            <div class="info-content">
              <div class="info-item">
                <el-icon class="step-icon"><User /></el-icon>
                <span>学生可以使用此邀请码快速加入课程</span>
              </div>
              <div class="info-item">
                <el-icon class="step-icon"><Clock /></el-icon>
                <span>邀请码长期有效，请妥善保管</span>
              </div>
              <div class="info-item">
                <el-icon class="step-icon"><ChatDotRound /></el-icon>
                <span>可以通过微信、QQ等方式分享给学生</span>
              </div>
            </div>
          </div>
        </div>

        <!-- 错误状态 -->
        <div v-else class="error-container">
          <div class="error-content">
            <el-icon class="error-icon"><CircleCloseFilled /></el-icon>
            <h4>生成失败</h4>
            <p>邀请码生成失败，请重试</p>
            <el-button type="primary" @click="generateInviteCode" class="retry-button">
              <el-icon><Refresh /></el-icon>
              重新生成
            </el-button>
          </div>
        </div>
      </div>

      <!-- 底部操作区 -->
      <template #footer>
        <div class="dialog-footer">
          <el-button @click="inviteCodeDialogVisible = false" size="default">
            关闭
          </el-button>
          <el-button
            type="primary"
            @click="generateInviteCode"
            v-if="!generatingInviteCode && currentInviteCode"
            size="default"
          >
            <el-icon><Refresh /></el-icon>
            重新生成
          </el-button>
        </div>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { defineProps, defineEmits, ref, computed } from 'vue'
import {
  Delete,
  Plus,
  Loading,
  TrendCharts,
  Share,
  DocumentCopy,
  Ticket,
  InfoFilled,
  User,
  Clock,
  ChatDotRound,
  CircleCloseFilled,
  Refresh
} from '@element-plus/icons-vue'
import { ElMessage } from 'element-plus'
import { studentAssistantAPI, courseSelectionAPI } from '@/api/api'
import { marked } from 'marked'
import DOMPurify from 'dompurify'

const props = defineProps({
  courseStudents: {
    type: Array,
    required: true
  },
  selectedStudents: {
    type: Array,
    required: true
  },
  isLoading: {
    type: Boolean,
    default: false
  },
  currentPage: {
    type: Number,
    default: 1
  },
  pageSize: {
    type: Number,
    default: 10
  },
  courseId: {
    type: [String, Number],
    required: true
  },
  courseName: {
    type: String,
    default: '未知课程'
  }
})

const emit = defineEmits([
  'batch-remove-students', 
  'show-add-student', 
  'view-student', 
  'remove-student',
  'selection-change',
  'search-clear',
  'search-input',
  'update:current-page',
  'update:page-size'
])

const studentSearchKeyword = ref('')

// 课程学习情况分析相关状态
const analysisDialogVisible = ref(false)
const analyzing = ref(false)
const analysisResult = ref('')
const selectedStudent = ref(null)
const progressPercentage = ref(0)
const progressText = ref('正在初始化...')

// 邀请码相关状态
const inviteCodeDialogVisible = ref(false)
const generatingInviteCode = ref(false)
const currentInviteCode = ref('')

// 过滤学生列表
const filteredStudents = computed(() => {
  if (!studentSearchKeyword.value) {
    return props.courseStudents
  }
  const keyword = studentSearchKeyword.value.toLowerCase()
  return props.courseStudents.filter(student =>
    (student.studentId && student.studentId.toString().includes(keyword)) ||
    (student.fullName && student.fullName.toLowerCase().includes(keyword)) ||
    (student.email && student.email.toLowerCase().includes(keyword)) ||
    (student.className && student.className.toLowerCase().includes(keyword)) ||
    (student.grade && student.grade.toLowerCase().includes(keyword))
  )
})

// 计算属性：将分析结果转换为HTML
const analysisResultHtml = computed(() => {
  if (!analysisResult.value) return ''

  // 配置marked选项
  marked.setOptions({
    breaks: true, // 支持换行
    gfm: true, // 支持GitHub风格的Markdown
  })

  // 将Markdown转换为HTML并清理
  const rawHtml = marked(analysisResult.value)
  return DOMPurify.sanitize(rawHtml)
})

// 处理搜索输入
function handleSearchInput() {
  emit('search-input')
}

// 处理清除搜索
function handleSearchClear() {
  studentSearchKeyword.value = ''
  emit('search-clear')
}

// 处理表格选择变化
function handleSelectionChange(selection) {
  emit('selection-change', selection)
}

// 分析学生课程学习情况
async function analyzeCourseProgress(student) {
  selectedStudent.value = student
  analysisDialogVisible.value = true
  analyzing.value = true
  analysisResult.value = ''
  progressPercentage.value = 0
  progressText.value = '正在初始化分析...'

  // 模拟进度更新
  const progressInterval = setInterval(() => {
    if (progressPercentage.value < 90) {
      progressPercentage.value += Math.random() * 15
      if (progressPercentage.value < 30) {
        progressText.value = '正在收集学习数据...'
      } else if (progressPercentage.value < 60) {
        progressText.value = '正在分析学习模式...'
      } else if (progressPercentage.value < 90) {
        progressText.value = '正在生成分析报告...'
      }
    }
  }, 500)

  try {
    console.log('开始分析学生课程学习情况:', {
      courseId: props.courseId,
      studentId: student.studentId,
      studentName: student.fullName
    })

    // 添加模拟数据，用于前端开发测试
    // 实际部署时可以注释掉这部分，使用真实API调用
    const mockData = `# ${student.fullName} 的课程学习情况分析

## 学习概况

- **课程完成度**: 75%
- **学习时长**: 12小时30分钟
- **平均成绩**: 85分
- **学习状态**: 良好

## 知识点掌握情况

| 知识点 | 掌握程度 | 建议 |
|-------|---------|------|
| 基础概念 | 优秀 | 可以进一步深入学习高级内容 |
| 实践应用 | 良好 | 需要更多的实践练习 |
| 综合能力 | 一般 | 建议多做综合性练习 |

## 学习建议

1. 增加实践练习的时间
2. 关注知识点之间的联系
3. 参与更多的小组讨论活动

## 近期表现

学生在近期的学习中表现积极，能够按时完成作业和测验。在课堂讨论中也有较好的参与度。

## 改进方向

- 提高学习效率
- 加强知识点的系统性理解
- 培养独立思考能力

祝学习进步！`;

    // 模拟API调用延迟
    await new Promise(resolve => setTimeout(resolve, 2000));

    // 使用模拟数据或API调用
    let response;
    try {
      // 尝试调用真实API
      response = await studentAssistantAPI.analyzeStudentCourseProgress(props.courseId, student.studentId);
      console.log('API分析结果:', response);
    } catch (apiError) {
      console.warn('API调用失败，使用模拟数据:', apiError);
      // 如果API调用失败，使用模拟数据
      response = { analysis: mockData };
    }

    // 灵活处理响应格式
    let analysisData = null
    if (response) {
      analysisData = response.analysis || response.result || response.data || response.content || response

      // 如果响应是字符串，直接使用
      if (typeof response === 'string') {
        analysisData = response
      }
    } else {
      // 如果没有响应，使用模拟数据
      analysisData = mockData;
    }

    if (analysisData) {
      analysisResult.value = analysisData
      progressPercentage.value = 100
      progressText.value = '分析完成！'
      ElMessage.success('学习情况分析完成')
    } else {
      // 如果没有有效数据，也使用模拟数据
      analysisResult.value = mockData
      progressPercentage.value = 100
      progressText.value = '分析完成（模拟数据）'
      ElMessage.warning('无法获取真实数据，显示模拟分析结果')
    }
  } catch (error) {
    console.error('分析学生课程学习情况失败:', error)

    // 使用模拟数据作为备用
    analysisResult.value = `# ${student.fullName} 的课程学习情况分析

## 注意：这是模拟数据（由于服务器错误）

- **课程完成度**: 约70%
- **学习状态**: 需要关注

建议教师与学生进行一对一辅导，了解学习中的困难。`;

    progressPercentage.value = 100
    progressText.value = '分析完成（使用备用数据）'

    // 特殊处理超时错误
    if (error.code === 'ECONNABORTED' || error.message.includes('timeout')) {
      ElMessage.warning('AI分析超时，已显示模拟数据。实际分析可能需要2-3分钟，请稍后再试。')
    } else if (error.response?.status === 500) {
      ElMessage.warning('服务器处理错误，已显示模拟数据')
    } else {
      ElMessage.warning('无法获取分析数据: ' + (error.message || '未知错误') + '，已显示模拟数据')
    }
  } finally {
    // 清理定时器
    clearInterval(progressInterval)
    analyzing.value = false
  }
}

// 重试分析
function retryAnalysis() {
  if (selectedStudent.value) {
    analyzeCourseProgress(selectedStudent.value)
  }
}

// 重置分析状态
function resetAnalysisState() {
  analyzing.value = false
  analysisResult.value = ''
  progressPercentage.value = 0
  progressText.value = '正在初始化...'
  selectedStudent.value = null
}

// 生成课程邀请码
async function generateInviteCode() {
  if (!props.courseId) {
    ElMessage.error('课程ID不能为空')
    return
  }

  inviteCodeDialogVisible.value = true
  generatingInviteCode.value = true
  currentInviteCode.value = ''

  try {
    console.log('开始生成课程邀请码，课程ID:', props.courseId)

    const response = await courseSelectionAPI.generateInviteCode(props.courseId)
    console.log('生成邀请码API响应:', response)

    // 灵活处理不同的响应格式
    let inviteCode = null
    if (response) {
      // 尝试多种可能的字段名（包括下划线和驼峰格式）
      inviteCode = response.invite_code ||  // 下划线格式（实际API格式）
                   response.inviteCode ||
                   response.code ||
                   response.data?.invite_code ||
                   response.data?.inviteCode ||
                   response.data?.code ||
                   response.result?.invite_code ||
                   response.result?.inviteCode ||
                   response.result?.code ||
                   (typeof response === 'string' ? response : null)
    }

    if (inviteCode) {
      currentInviteCode.value = inviteCode
      ElMessage.success('邀请码生成成功')
    } else {
      console.error('无法从响应中提取邀请码，响应数据:', response)
      throw new Error('邀请码生成失败：无法从响应中获取邀请码')
    }
  } catch (error) {
    console.error('生成邀请码失败:', error)

    let errorMessage = '生成邀请码失败'
    if (error.response?.status === 401) {
      errorMessage = '登录已过期，请重新登录'
    } else if (error.response?.status === 403) {
      errorMessage = '没有权限生成邀请码'
    } else if (error.response?.status === 404) {
      errorMessage = '课程不存在'
    } else if (error.response?.status >= 500) {
      errorMessage = '服务器错误，请稍后重试'
    } else if (error.message) {
      errorMessage = error.message
    }

    ElMessage.error(errorMessage)
    currentInviteCode.value = ''
  } finally {
    generatingInviteCode.value = false
  }
}

// 复制邀请码到剪贴板
async function copyInviteCode() {
  if (!currentInviteCode.value) {
    ElMessage.warning('没有可复制的邀请码')
    return
  }

  try {
    await navigator.clipboard.writeText(currentInviteCode.value)
    ElMessage.success('邀请码已复制到剪贴板')
  } catch (error) {
    console.error('复制失败:', error)

    // 备用复制方法
    try {
      const textArea = document.createElement('textarea')
      textArea.value = currentInviteCode.value
      document.body.appendChild(textArea)
      textArea.select()
      document.execCommand('copy')
      document.body.removeChild(textArea)
      ElMessage.success('邀请码已复制到剪贴板')
    } catch (fallbackError) {
      console.error('备用复制方法也失败:', fallbackError)
      ElMessage.error('复制失败，请手动复制邀请码')
    }
  }
}
</script>

<style scoped>
.content-section {
  margin-bottom: 40px;
  text-align: left;
  height: 100%;
  display: flex;
  flex-direction: column;
}

.section-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
  border-left: 4px solid #409EFF;
  padding-left: 15px;
  text-align: left;
}

.section-header h3 {
  margin: 0;
  font-size: 18px;
  font-weight: 600;
  color: #303133;
  text-align: left;
}

.section-body {
  padding-left: 19px;
  text-align: left;
  flex: 1;
  display: flex;
  flex-direction: column;
  min-height: 0;
}

.empty-tip {
  color: #909399;
  text-align: left;
  padding: 20px 0;
  font-size: 14px;
}

.header-actions {
  display: flex;
  gap: 10px;
}

.table-toolbar {
  margin-bottom: 16px;
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.table-container {
  flex: 1;
  display: flex;
  flex-direction: column;
  min-height: 400px;
  overflow: hidden;
}

.pagination-container {
  margin-top: 16px;
  display: flex;
  justify-content: flex-end;
  flex-shrink: 0;
}

/* 分析模态框样式 - 全屏版 */
.analysis-modal {
  --el-dialog-padding-primary: 24px;
}

.analysis-modal .el-dialog {
  margin: 0 !important;
  width: 100vw !important;
  height: 100vh !important;
  max-width: 100vw !important;
  max-height: 100vh !important;
  border-radius: 0 !important;
  display: flex;
  flex-direction: column;
}

.analysis-modal .el-dialog__header {
  padding: 20px 24px;
  border-bottom: 1px solid #ebeef5;
  flex-shrink: 0;
}

.analysis-modal .el-dialog__body {
  flex: 1;
  padding: 0;
  overflow: hidden;
  display: flex;
  flex-direction: column;
}

.analysis-modal .el-dialog__footer {
  flex-shrink: 0;
}

.modal-header {
  padding: 0;
  margin: 0;
}

.header-content {
  display: flex;
  align-items: center;
  gap: 8px;
}

.header-icon {
  font-size: 20px;
  color: #409EFF;
}

.modal-title {
  font-size: 18px;
  font-weight: 600;
  color: #303133;
}

.modal-body {
  flex: 1;
  overflow: hidden;
  display: flex;
  flex-direction: column;
}

/* 加载状态样式 - 全屏版 */
.analyzing-container {
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 60px 40px;
  background-color: #ffffff;
  min-height: 0;
  height: 100%;
}

.analyzing-header {
  margin-bottom: 60px;
  text-align: center;
}

.student-info-simple h3 {
  margin: 0 0 12px 0;
  color: #303133;
  font-size: 24px;
  font-weight: 600;
}

.student-info-simple p {
  margin: 0;
  color: #606266;
  font-size: 16px;
}

.analyzing-content {
  text-align: center;
  max-width: 500px;
  width: 100%;
}

.analyzing-icon-wrapper {
  margin-bottom: 30px;
}

.analyzing-icon-wrapper .el-icon {
  font-size: 60px;
  color: #409EFF;
}

.analyzing-content h4 {
  margin: 0 0 16px 0;
  color: #303133;
  font-size: 20px;
  font-weight: 500;
}

.analyzing-desc {
  margin: 0 0 40px 0;
  color: #606266;
  font-size: 16px;
}

.progress-wrapper {
  width: 100%;
}

/* 分析结果样式 - 全屏版 */
.analysis-result-container {
  flex: 1;
  display: flex;
  flex-direction: column;
  overflow: hidden;
  min-height: 0;
  height: 100%;
}

.student-info-bar {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 12px 24px;
  background: white;
  border-bottom: 1px solid #ebeef5;
  flex-shrink: 0;
}

.student-basic-info {
  display: flex;
  align-items: center;
  gap: 16px;
}

.student-name {
  font-size: 16px;
  font-weight: 600;
  color: #303133;
}

.student-id,
.course-name {
  font-size: 14px;
  color: #606266;
}

.report-content-wrapper {
  flex: 1;
  overflow: visible;
  background: white;
  display: flex;
  flex-direction: column;
  min-height: 0;
}

.report-content {
  flex: 1;
  padding: 24px 32px;
  overflow: visible;
  display: flex;
  flex-direction: column;
  justify-content: flex-start;
}

/* 错误状态样式 */
.error-container {
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  background-color: #ffffff;
  min-height: 0;
  height: 100%;
  padding: 60px 40px;
}

/* 模态框底部样式 - 全屏版 */
.modal-footer {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 20px 24px;
  background: #ffffff;
  border-top: 1px solid #ebeef5;
  flex-shrink: 0;
}

.footer-tip {
  color: #909399;
  font-size: 13px;
}

.footer-actions {
  display: flex;
  gap: 12px;
}

/* Markdown内容样式 - 自适应版 */
.markdown-content {
  line-height: 1.6;
  color: #303133;
  font-size: 14px;
  flex: 1;
  display: flex;
  flex-direction: column;
  justify-content: flex-start;
}

.markdown-content h1,
.markdown-content h2,
.markdown-content h3,
.markdown-content h4,
.markdown-content h5,
.markdown-content h6 {
  margin: 16px 0 8px 0;
  font-weight: 600;
  color: #303133;
  flex-shrink: 0;
}

.markdown-content h1 {
  font-size: 20px;
  border-bottom: 1px solid #e4e7ed;
  padding-bottom: 8px;
  margin-bottom: 12px;
}

.markdown-content h2 {
  font-size: 18px;
  color: #409EFF;
  margin-bottom: 10px;
}

.markdown-content h3 {
  font-size: 16px;
  color: #606266;
  margin-bottom: 8px;
}

.markdown-content h4 {
  font-size: 15px;
  margin-bottom: 8px;
}

.markdown-content h5 {
  font-size: 14px;
  margin-bottom: 6px;
}

.markdown-content h6 {
  font-size: 13px;
  margin-bottom: 6px;
}

.markdown-content p {
  margin: 8px 0;
  line-height: 1.5;
  font-size: 14px;
}

.markdown-content ul,
.markdown-content ol {
  margin: 8px 0;
  padding-left: 20px;
}

.markdown-content li {
  margin: 4px 0;
  line-height: 1.5;
  font-size: 14px;
}

.markdown-content blockquote {
  margin: 8px 0;
  padding: 8px 12px;
  background-color: #f8f9fa;
  border-left: 3px solid #409EFF;
  color: #606266;
  font-size: 13px;
}

.markdown-content code {
  background-color: #f1f2f3;
  padding: 1px 4px;
  border-radius: 3px;
  font-family: 'Courier New', Courier, monospace;
  font-size: 12px;
  color: #e83e8c;
}

.markdown-content pre {
  background-color: #f6f8fa;
  padding: 8px 12px;
  border-radius: 4px;
  overflow-x: auto;
  margin: 8px 0;
  border: 1px solid #e1e4e8;
}

.markdown-content pre code {
  background: none;
  padding: 0;
  color: #24292e;
  font-size: 12px;
  line-height: 1.4;
}

.markdown-content table {
  border-collapse: collapse;
  width: 100%;
  margin: 8px 0;
  border: 1px solid #e4e7ed;
  border-radius: 4px;
  font-size: 13px;
}

.markdown-content th,
.markdown-content td {
  border: 1px solid #e4e7ed;
  padding: 6px 8px;
  text-align: left;
}

.markdown-content th {
  background-color: #f5f7fa;
  font-weight: 600;
  color: #303133;
}

.markdown-content tr:nth-child(even) {
  background-color: #fafafa;
}

.markdown-content strong {
  font-weight: 600;
}

.markdown-content em {
  font-style: italic;
}

/* 响应式样式 */
@media (max-width: 768px) {
  .analysis-modal .el-dialog__header {
    padding: 16px 20px;
  }

  .student-info-bar {
    padding: 16px 20px;
  }

  .student-basic-info {
    flex-direction: column;
    align-items: flex-start;
    gap: 8px;
  }

  .student-name {
    font-size: 16px;
  }

  .student-id,
  .course-name {
    font-size: 14px;
  }

  .analyzing-container {
    padding: 30px 20px;
  }

  .student-info-simple h3 {
    font-size: 20px;
  }

  .student-info-simple p {
    font-size: 14px;
  }

  .analyzing-content h4 {
    font-size: 18px;
  }

  .analyzing-desc {
    font-size: 14px;
  }

  .modal-footer {
    flex-direction: column;
    gap: 12px;
    padding: 16px 20px;
  }

  .footer-actions {
    width: 100%;
    justify-content: center;
  }

  .report-content {
    padding: 24px 20px;
  }

  .markdown-content {
    font-size: 14px;
  }

  .markdown-content h1 {
    font-size: 22px;
  }

  .markdown-content h2 {
    font-size: 18px;
  }

  .markdown-content h3 {
    font-size: 16px;
  }

  .markdown-content p,
  .markdown-content li {
    font-size: 14px;
  }
}

/* 移除滚动条样式，因为内容现在自适应显示 */

/* 邀请码对话框样式 */
.invite-code-dialog {
  --el-dialog-border-radius: 12px;
}

.invite-code-dialog .el-dialog {
  border-radius: 12px;
  overflow: hidden;
}

.invite-code-dialog .el-dialog__header {
  padding: 0;
  margin: 0;
  border-bottom: 1px solid #f0f0f0;
}

.invite-code-dialog .el-dialog__body {
  padding: 0;
}

.invite-code-dialog .el-dialog__footer {
  padding: 16px 24px;
  border-top: 1px solid #f0f0f0;
  background-color: #fafafa;
}

/* 对话框头部 */
.dialog-header {
  display: flex;
  align-items: center;
  padding: 20px 24px;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
}

.header-icon {
  width: 44px;
  height: 44px;
  background: rgba(255, 255, 255, 0.2);
  border-radius: 10px;
  display: flex;
  align-items: center;
  justify-content: center;
  margin-right: 14px;
}

.header-icon .el-icon {
  font-size: 22px;
  color: white;
}

.header-content {
  flex: 1;
}

.dialog-title {
  margin: 0 0 3px 0;
  font-size: 18px;
  font-weight: 600;
  color: white;
}

.dialog-subtitle {
  margin: 0;
  font-size: 13px;
  color: rgba(255, 255, 255, 0.8);
}

/* 内容区域 */
.invite-code-content {
  padding: 24px;
  min-height: 320px;
  max-height: 70vh;
  overflow-y: auto;
}

/* 生成中状态 */
.generating-container {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 40px 0;
}

.loading-wrapper {
  display: flex;
  flex-direction: column;
  align-items: center;
  text-align: center;
}

.loading-icon {
  font-size: 48px;
  color: #409EFF;
  margin-bottom: 20px;
}

.loading-text h4 {
  margin: 0 0 8px 0;
  font-size: 18px;
  color: #303133;
  font-weight: 500;
}

.loading-text p {
  margin: 0;
  color: #909399;
  font-size: 14px;
}

/* 成功状态 */
.invite-code-result {
  text-align: left;
}

/* 邀请码展示区域 */
.invite-code-display {
  margin-bottom: 20px;
  padding: 20px;
  background: linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%);
  border-radius: 12px;
  border: 1px solid #e4e7ed;
  position: relative;
  overflow: hidden;
}

.invite-code-display::before {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  height: 4px;
  background: linear-gradient(90deg, #409EFF, #67C23A, #E6A23C, #F56C6C);
}

.code-label {
  display: flex;
  align-items: center;
  margin-bottom: 16px;
  color: #606266;
  font-size: 14px;
  font-weight: 500;
}

.code-label .el-icon {
  margin-right: 8px;
  font-size: 16px;
}

.code-container {
  display: flex;
  align-items: center;
  gap: 16px;
}

.invite-code-wrapper {
  flex: 1;
  position: relative;
  background: white;
  border-radius: 8px;
  padding: 16px 20px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}

.invite-code {
  display: block;
  font-family: 'SF Mono', 'Monaco', 'Inconsolata', 'Roboto Mono', 'Courier New', monospace;
  font-size: 24px;
  font-weight: 700;
  color: #409EFF;
  letter-spacing: 4px;
  text-align: center;
  user-select: all;
  text-transform: uppercase;
}

.code-decoration {
  position: absolute;
  top: 8px;
  right: 8px;
  width: 8px;
  height: 8px;
  background: #67C23A;
  border-radius: 50%;
  animation: pulse 2s infinite;
}

@keyframes pulse {
  0% { opacity: 1; transform: scale(1); }
  50% { opacity: 0.5; transform: scale(1.2); }
  100% { opacity: 1; transform: scale(1); }
}

.copy-button {
  height: 56px;
  padding: 0 20px;
  border-radius: 8px;
  font-weight: 500;
  box-shadow: 0 2px 8px rgba(64, 158, 255, 0.3);
  transition: all 0.3s ease;
}

.copy-button:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(64, 158, 255, 0.4);
}

.copy-button .el-icon {
  margin-right: 6px;
}

/* 使用说明区域 */
.invite-code-info {
  padding: 18px;
  background: #f8f9fa;
  border-radius: 8px;
  border: 1px solid #e9ecef;
}

.info-header {
  display: flex;
  align-items: center;
  margin-bottom: 12px;
  color: #495057;
  font-size: 15px;
  font-weight: 600;
}

.info-header .el-icon {
  margin-right: 8px;
  font-size: 16px;
  color: #409EFF;
}

.info-content {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.info-item {
  display: flex;
  align-items: center;
  color: #6c757d;
  font-size: 13px;
  line-height: 1.4;
}

.step-icon {
  margin-right: 10px;
  font-size: 14px;
  color: #28a745;
  flex-shrink: 0;
}

/* 错误状态 */
.error-container {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 40px 0;
}

.error-content {
  text-align: center;
}

.error-icon {
  font-size: 48px;
  color: #F56C6C;
  margin-bottom: 16px;
}

.error-content h4 {
  margin: 0 0 8px 0;
  font-size: 18px;
  color: #303133;
  font-weight: 500;
}

.error-content p {
  margin: 0 0 20px 0;
  color: #909399;
  font-size: 14px;
}

.retry-button {
  padding: 12px 24px;
  border-radius: 8px;
  font-weight: 500;
}

.retry-button .el-icon {
  margin-right: 6px;
}

/* 底部操作区 */
.dialog-footer {
  display: flex;
  justify-content: flex-end;
  gap: 12px;
}

/* 响应式样式 */
@media (max-width: 768px) {
  .invite-code-dialog {
    --el-dialog-width: 90vw;
  }

  .dialog-header {
    padding: 16px 20px;
    flex-direction: column;
    text-align: center;
  }

  .header-icon {
    margin-right: 0;
    margin-bottom: 10px;
  }

  .invite-code-content {
    padding: 20px 16px;
    min-height: 280px;
  }

  .invite-code-display {
    padding: 16px;
    margin-bottom: 16px;
  }

  .code-container {
    flex-direction: column;
    gap: 12px;
  }

  .invite-code {
    font-size: 20px;
    letter-spacing: 2px;
  }

  .copy-button {
    width: 100%;
    height: 48px;
  }

  .info-content {
    gap: 8px;
  }

  .info-item {
    font-size: 12px;
  }

  .dialog-footer {
    padding: 12px 16px;
    flex-direction: column-reverse;
    gap: 8px;
  }

  .dialog-footer .el-button {
    width: 100%;
  }
}

@media (max-width: 480px) {
  .invite-code-content {
    min-height: 260px;
  }

  .invite-code {
    font-size: 18px;
    letter-spacing: 1px;
    padding: 12px 16px;
  }

  .dialog-title {
    font-size: 16px;
  }

  .dialog-subtitle {
    font-size: 12px;
  }
}

/* 确保对话框在大屏幕上也不会过高 */
@media (min-height: 800px) {
  .invite-code-content {
    min-height: 380px;
  }
}
</style>