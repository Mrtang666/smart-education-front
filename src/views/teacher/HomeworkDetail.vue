<template>
  <div class="homework-detail">
    <!-- 顶部导航 -->
    <div class="course-header">
      <div class="header-content">
        <div class="back-button" @click="goBack">
          <el-icon><ArrowLeft /></el-icon>
          <span>返回</span>
        </div>
        <h1 class="course-title">{{ homeworkTitle }}
          <el-tag size="small" class="status-tag" :type="getStatusTagType(homeworkData.status)">
            {{ getStatusText(homeworkData.status) }}
          </el-tag>
        </h1>
      </div>
      <div class="course-actions">
        <el-button type="success" @click="saveHomework" :loading="isSaving">
          <el-icon><Check /></el-icon>
          保存作业
        </el-button>
        <el-button type="primary" @click="publishHomework" v-if="homeworkData.status === 'DRAFT'">
          <el-icon><Upload /></el-icon>
          发布作业
        </el-button>
      </div>
    </div>

    <!-- 主内容区 -->
    <div class="course-content" v-loading="isLoading">
      <div class="course-tabs">
        <el-tabs v-model="activeTab">
          <el-tab-pane label="基本信息" name="basic">
            <HomeworkBasicInfo 
              :homework-data="homeworkData" 
              @update:homework-data="updateHomeworkData" 
            />
          </el-tab-pane>
          
          <el-tab-pane label="题目管理" name="problems">
            <ProblemManagement 
              :homework-id="homeworkId" 
              :problems="problems"
              @update:problems="updateProblems"
              @add-problem="showAddProblemDialog"
              @edit-problem="editProblem"
              @delete-problem="deleteProblem"
            />
          </el-tab-pane>
          
          <el-tab-pane label="学生提交情况" name="submissions" v-if="homeworkData.status !== 'DRAFT'">
            <div class="empty-content" v-if="!submissions || submissions.length === 0">
              <el-empty description="暂无提交数据" :image-size="200">
                <template #description>
                  <p>暂无学生提交数据</p>
                  <p class="empty-sub-text">学生提交作业后，您可以在此查看提交情况</p>
                </template>
              </el-empty>
            </div>
            <!-- <SubmissionsList v-else :homework-id="homeworkId" :submissions="submissions" /> -->
          </el-tab-pane>
        </el-tabs>
      </div>
      
      <!-- 统计信息卡片 -->
      <div class="stats-section" v-if="homeworkData.status !== 'DRAFT'">
        <el-row :gutter="20">
          <el-col :xs="24" :sm="8">
            <el-card class="stats-card">
              <template #header>
                <div class="card-header">
                  <span>提交情况</span>
                  <el-tooltip content="学生已提交作业的比例">
                    <el-icon><QuestionFilled /></el-icon>
                  </el-tooltip>
                </div>
              </template>
              <div class="stats-content">
                <div class="stats-number">{{ getSubmissionCount() }} / {{ getTotalStudentsCount() }}</div>
                <el-progress :percentage="getSubmissionPercentage()" :status="getSubmissionStatus()" />
              </div>
            </el-card>
          </el-col>
          
          <el-col :xs="24" :sm="8">
            <el-card class="stats-card">
              <template #header>
                <div class="card-header">
                  <span>平均分数</span>
                  <el-tooltip content="已批改作业的平均得分">
                    <el-icon><QuestionFilled /></el-icon>
                  </el-tooltip>
                </div>
              </template>
              <div class="stats-content">
                <div class="stats-number">{{ getAverageScore() }}<span class="stats-unit"> 分</span></div>
                <div class="stats-progress-bar">
                  <div class="progress-bar" :style="{width: getScorePercentage() + '%'}"></div>
                </div>
              </div>
            </el-card>
          </el-col>
          
          <el-col :xs="24" :sm="8">
            <el-card class="stats-card">
              <template #header>
                <div class="card-header">
                  <span>剩余时间</span>
                  <el-tooltip content="距离作业截止时间">
                    <el-icon><QuestionFilled /></el-icon>
                  </el-tooltip>
                </div>
              </template>
              <div class="stats-content">
                <div v-if="isHomeworkEnded()" class="stats-number ended">已结束</div>
                <div v-else class="stats-number">{{ getRemainingTimeText() }}</div>
                <div class="stats-subtitle">截止日期：{{ formatDate(homeworkData.endTime) }}</div>
              </div>
            </el-card>
          </el-col>
        </el-row>
      </div>
    </div>
    
    <!-- 添加题目对话框 -->
    <el-dialog
      v-model="addProblemDialogVisible"
      :title="problemDialogTitle"
      width="800px"
      destroy-on-close
      top="5vh"
    >
      <ProblemForm
        :problem-data="currentProblem"
        :homework-id="homeworkId"
        @save="saveProblem"
        @cancel="addProblemDialogVisible = false"
      />
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { ElMessage, ElMessageBox } from 'element-plus'
import { QuestionFilled, ArrowLeft, /* Edit, */ Check, Upload } from '@element-plus/icons-vue'
import { assignmentAPI, problemAPI } from '@/api/api'

// 组件引用
import HomeworkBasicInfo from '@/components/teacher/HomeworkBasicInfo.vue'
import ProblemManagement from '@/components/teacher/ProblemManagement.vue'
import ProblemForm from '@/components/teacher/ProblemForm.vue'
// 提交列表组件将在后续开发
// import SubmissionsList from '@/components/teacher/SubmissionsList.vue'

const route = useRoute()
const router = useRouter()

// 获取路由参数
const homeworkId = ref(route.params.id)
const courseId = ref(route.query.courseId)
// const courseName = ref(route.query.courseName || '课程')

// 页面状态
const activeTab = ref('basic')
const isSaving = ref(false)
const isLoading = ref(true)

// 从 localStorage 获取当前用户角色
const userRole = JSON.parse(localStorage.getItem('user_role'))[0]; // 解析为数组并获取第一个元素

// 作业数据
const homeworkData = ref({
  assignmentId: '',
  title: '',
  description: '',
  startTime: '',
  endTime: '',
  type: 'TEACHER_ASSIGNED',
  courseId: '',
  creatorId: '',
  isAnswerPublic: false,
  isScoreVisible: true,
  isRedoAllowed: false,
  maxAttempts: 1,
  status: 'DRAFT',
  originType: userRole === 'ROLE_TEACHER' ? 'TEACHER_ASSIGNED' : 'STUDENT_UPLOAD' // 根据用户角色设置 originType
})

// 计算属性
const homeworkTitle = computed(() => homeworkData.value.title || '作业详情')

// 题目相关
const problems = ref([])
const addProblemDialogVisible = ref(false)
const problemDialogTitle = ref('添加题目')
const currentProblem = ref(null)

// 提交情况
const submissions = ref([])

// 返回上一页
function goBack() {
  router.push(`/teacher/course/${courseId.value}?tab=homework`)
}

// 获取作业状态文本
function getStatusText(status) {
  const statusMap = {
    'DRAFT': '草稿',
    'PUBLISHED': '已发布',
    'ENDED': '已结束'
  }
  return statusMap[status] || '未知'
}

// 获取状态标签类型
function getStatusTagType(status) {
  const typeMap = {
    'DRAFT': 'info',
    'PUBLISHED': 'success', 
    'ENDED': 'warning'
  }
  return typeMap[status] || 'info'
}

// 格式化日期
function formatDate(dateString) {
  if (!dateString) return '未设置'
  
  try {
    const date = new Date(dateString)
    return date.toLocaleDateString('zh-CN', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit'
    })
  } catch (e) {
    return '日期格式错误'
  }
}

// 获取剩余时间文本
function getRemainingTimeText() {
  if (!homeworkData.value.endTime) return '未设置截止日期'
  
  const endTime = new Date(homeworkData.value.endTime)
  const now = new Date()
  const diff = endTime - now
  
  if (diff <= 0) return '已截止'
  
  const days = Math.floor(diff / (1000 * 60 * 60 * 24))
  const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60))
  const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60))
  
  if (days > 0) return `${days}天${hours}小时`
  if (hours > 0) return `${hours}小时${minutes}分钟`
  return `${minutes}分钟`
}

// 判断作业是否已结束
function isHomeworkEnded() {
  if (!homeworkData.value.endTime) return false
  return new Date() > new Date(homeworkData.value.endTime)
}

// 获取提交数量（示例数据）
function getSubmissionCount() {
  return submissions.value.length || 0
}

// 获取总学生数（示例数据）
function getTotalStudentsCount() {
  return 30 // 示例数据
}

// 获取提交百分比
function getSubmissionPercentage() {
  const count = getSubmissionCount()
  const total = getTotalStudentsCount()
  if (total === 0) return 0
  return Math.round((count / total) * 100)
}

// 获取提交状态
function getSubmissionStatus() {
  const percentage = getSubmissionPercentage()
  if (percentage >= 80) return 'success'
  if (percentage >= 40) return 'warning'
  return 'exception'
}

// 获取平均分数（示例数据）
function getAverageScore() {
  return submissions.value.length ? 85 : '暂无' // 示例数据
}

// 获取分数百分比
function getScorePercentage() {
  const score = getAverageScore()
  if (score === '暂无') return 0
  return Math.min(Math.round((score / 100) * 100), 100)
}

// 获取作业详情
async function fetchHomeworkDetail() {
  try {
    isLoading.value = true
    const assignmentIdStr = homeworkId.value ? String(homeworkId.value) : ''
    
    if (!assignmentIdStr) {
      ElMessage.error('作业ID无效')
      router.back()
      return
    }
    
    const response = await assignmentAPI.getAssignmentById(assignmentIdStr)
    if (response) {
      homeworkData.value = {
        assignmentId: response.assignmentId,
        title: response.title || '',
        description: response.description || '',
        startTime: response.startTime || new Date().toISOString(),
        endTime: response.endTime || '',
        type: response.type || 'TEACHER_ASSIGNED',
        courseId: response.courseId || courseId.value,
        creatorId: response.creatorId || '',
        isAnswerPublic: response.isAnswerPublic || false,
        isScoreVisible: response.isScoreVisible || true,
        isRedoAllowed: response.isRedoAllowed || false,
        maxAttempts: response.maxAttempts || 1,
        status: response.status || 'DRAFT',
        originType: userRole === 'ROLE_TEACHER' ? 'TEACHER_ASSIGNED' : 'STUDENT_UPLOAD' // 根据用户角色设置 originType
      }
      
      // 获取题目列表
      await fetchProblems()
      
      // 如果作业已发布，获取提交情况
      if (homeworkData.value.status !== 'DRAFT') {
        await fetchSubmissions()
      }
    } else {
      ElMessage.error('未找到作业详情')
      router.back()
    }
  } catch (error) {
    console.error('获取作业详情失败:', error)
    ElMessage.error(`获取作业详情失败: ${error.message || '请稍后重试'}`)
  } finally {
    isLoading.value = false
  }
}

// 获取题目列表
async function fetchProblems() {
  try {
    const assignmentIdStr = homeworkId.value ? String(homeworkId.value) : ''
    if (!assignmentIdStr) return
    
    const response = await problemAPI.getProblemsByAssignment(assignmentIdStr)
    problems.value = Array.isArray(response) ? response : []
  } catch (error) {
    console.error('获取题目列表失败:', error)
    ElMessage.error(`获取题目列表失败: ${error.message || '请稍后重试'}`)
  }
}

// 获取提交情况
async function fetchSubmissions() {
  // 此处需要实现获取学生提交情况的逻辑
  // 暂时使用空数组
  submissions.value = []
}

// 更新作业数据
function updateHomeworkData(newData) {
  // 只复制修改的字段，而不是整个对象引用
  if (newData) {
    homeworkData.value = {
      ...homeworkData.value,
      title: newData.title,
      description: newData.description,
      startTime: newData.startTime,
      endTime: newData.endTime,
      isAnswerPublic: newData.isAnswerPublic,
      isScoreVisible: newData.isScoreVisible,
      isRedoAllowed: newData.isRedoAllowed,
      maxAttempts: newData.maxAttempts,
      originType: newData.originType // 更新 originType
    }
  }
}

// 更新题目列表
function updateProblems(newProblems) {
  problems.value = [...newProblems]
}

// 保存作业
async function saveHomework() {
  try {
    isSaving.value = true
    
    // 验证必填字段
    if (!homeworkData.value.title) {
      ElMessage.warning('请填写作业标题')
      activeTab.value = 'basic'
      return
    }
    
    if (!homeworkData.value.endTime) {
      ElMessage.warning('请设置截止日期')
      activeTab.value = 'basic'
      return
    }
    
    // 准备请求数据
    const assignmentData = {
      assignmentId: homeworkData.value.assignmentId,
      title: homeworkData.value.title,
      description: homeworkData.value.description || '',
      startTime: homeworkData.value.startTime || new Date().toISOString(),
      endTime: homeworkData.value.endTime,
      type: homeworkData.value.type || 'TEACHER_ASSIGNED',
      courseId: homeworkData.value.courseId || courseId.value,
      creatorId: homeworkData.value.creatorId,
      isAnswerPublic: homeworkData.value.isAnswerPublic || false,
      isScoreVisible: homeworkData.value.isScoreVisible || true,
      isRedoAllowed: homeworkData.value.isRedoAllowed || false,
      maxAttempts: homeworkData.value.maxAttempts || 1,
      status: homeworkData.value.status || 'DRAFT',
      originType: homeworkData.value.originType || 'TEACHER_ASSIGNED' // 保存 originType
    }
    
    // 调用API更新作业
    const response = await assignmentAPI.updateAssignment(assignmentData)
    
    if (response) {
      // 更新本地数据
      homeworkData.value = {
        ...homeworkData.value,
        ...response
      }
      
      ElMessage.success('作业保存成功')
    } else {
      ElMessage.error('作业保存失败')
    }
  } catch (error) {
    console.error('保存作业失败:', error)
    ElMessage.error(`保存作业失败: ${error.message || '请稍后重试'}`)
  } finally {
    isSaving.value = false
  }
}

// 发布作业
async function publishHomework() {
  try {
    if (problems.value.length === 0) {
      ElMessage.warning('作业至少需要包含一道题目才能发布')
      activeTab.value = 'problems'
      return
    }
    
    // 确认发布
    await ElMessageBox.confirm(
      '发布后学生将能够看到此作业。确定要发布吗？',
      '发布作业',
      {
        confirmButtonText: '确定',
        cancelButtonText: '取消',
        type: 'info'
      }
    )
    
    // 更新状态为已发布
    homeworkData.value.status = 'PUBLISHED'
    
    // 保存作业
    await saveHomework()
    
    ElMessage.success('作业已成功发布')
  } catch (error) {
    if (error !== 'cancel') {
      console.error('发布作业失败:', error)
      ElMessage.error(`发布作业失败: ${error.message || '请稍后重试'}`)
    }
  }
}

// 显示添加题目对话框
function showAddProblemDialog() {
  problemDialogTitle.value = '添加题目'
  currentProblem.value = {
    title: '',
    content: '',
    type: 'SINGLE_CHOICE',
    options: [],
    expectedAnswer: '',
    score: 10,
    assignmentId: homeworkId.value
  }
  addProblemDialogVisible.value = true
}

// 编辑题目
function editProblem(problem) {
  problemDialogTitle.value = '编辑题目'
  currentProblem.value = { ...problem }
  addProblemDialogVisible.value = true
}

// 删除题目
async function deleteProblem(problem) {
  try {
    await ElMessageBox.confirm(
      `确定要删除题目"${problem.title || '未命名题目'}"吗？`,
      '删除题目',
      {
        confirmButtonText: '确定',
        cancelButtonText: '取消',
        type: 'warning'
      }
    )
    
    // 调用API删除题目
    await problemAPI.deleteProblem(problem.problemId)
    
    // 更新本地列表
    problems.value = problems.value.filter(p => p.problemId !== problem.problemId)
    
    ElMessage.success('题目删除成功')
  } catch (error) {
    if (error !== 'cancel') {
      console.error('删除题目失败:', error)
      ElMessage.error(`删除题目失败: ${error.message || '请稍后重试'}`)
    }
  }
}

// 保存题目
async function saveProblem(problemData) {
  try {
    // 确保在保存题目时包含所有必需字段
    const problemToSave = {
      problemId: problemData.problemId || null, // 如果有问题ID则传入
      assignmentId: homeworkId.value, // 作业ID
      originType: homeworkData.value.originType, // originType
      title: problemData.title, // 题目标题
      content: problemData.content, // 题目内容
      type: problemData.type, // 题目类型
      autoGrading: problemData.autoGrading || false, // 是否自动评分
      expectedAnswer: problemData.expectedAnswer || '', // 标准答案
      score: problemData.score || 10, // 题目分值
      sequence: problems.value.length + 1, // 设置题目序号
      createdAt: new Date().toISOString(), // 创建时间
      updatedAt: new Date().toISOString() // 更新时间
    }
    
    const response = await problemAPI.saveProblem(problemToSave)
    if (response) {
      ElMessage.success('题目保存成功')
      await fetchProblems() // 刷新题目列表
      addProblemDialogVisible.value = false // 关闭对话框
    } else {
      ElMessage.error('题目保存失败')
    }
  } catch (error) {
    console.error('保存题目失败:', error)
    ElMessage.error(`保存题目失败: ${error.message || '请稍后重试'}`)
  }
}

// 页面加载时获取数据
onMounted(() => {
  fetchHomeworkDetail()
})
</script>

<style scoped>
.homework-detail {
  padding: 20px;
  height: calc(100vh - 84px);
  overflow-y: auto;
}

/* 顶部导航样式 */
.course-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
  padding: 16px 20px;
  background-color: #fff;
  border-radius: 8px;
  box-shadow: 0 2px 12px 0 rgba(0, 0, 0, 0.1);
}

.header-content {
  display: flex;
  align-items: center;
}

.back-button {
  display: flex;
  align-items: center;
  cursor: pointer;
  margin-right: 15px;
  color: #409EFF;
  font-size: 14px;
}

.back-button .el-icon {
  margin-right: 5px;
}

.course-title {
  margin: 0;
  font-size: 24px;
  font-weight: 600;
  color: #303133;
}

.status-tag {
  margin-left: 10px;
  position: relative;
  top: -3px;
}

.course-actions {
  display: flex;
  gap: 10px;
}

/* 内容区域样式 */
.course-content {
  background-color: #fff;
  border-radius: 8px;
  box-shadow: 0 2px 12px 0 rgba(0, 0, 0, 0.1);
  overflow: hidden;
}

.course-tabs {
  padding: 20px;
}

.empty-content {
  display: flex;
  justify-content: center;
  align-items: center;
  height: 300px;
}

.empty-sub-text {
  color: #909399;
  font-size: 14px;
  margin-top: 8px;
}

/* 统计卡片样式 */
.stats-section {
  margin-top: 20px;
  padding: 0 20px 20px;
}

.stats-card {
  height: 100%;
  border-radius: 6px;
  overflow: hidden;
  transition: all 0.3s;
}

.stats-card:hover {
  transform: translateY(-5px);
  box-shadow: 0 5px 15px rgba(0, 0, 0, 0.1);
}

.card-header {
  display: flex;
  align-items: center;
  font-size: 16px;
  font-weight: 600;
  color: #606266;
}

.card-header i {
  margin-left: 8px;
  font-size: 16px;
  color: #909399;
}

.stats-content {
  padding: 10px;
  text-align: center;
}

.stats-number {
  font-size: 32px;
  font-weight: 600;
  color: #303133;
  margin-bottom: 10px;
}

.stats-unit {
  font-size: 16px;
  color: #909399;
}

.stats-subtitle {
  margin-top: 10px;
  color: #909399;
  font-size: 14px;
}

.stats-number.ended {
  color: #f56c6c;
}

.stats-progress-bar {
  height: 6px;
  background-color: #f5f7fa;
  border-radius: 3px;
  overflow: hidden;
  margin: 10px 0;
}

.progress-bar {
  height: 100%;
  background-color: #67c23a;
  border-radius: 3px;
}
</style>









