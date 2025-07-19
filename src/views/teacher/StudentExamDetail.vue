<template>
  <div class="student-exam-detail">
    <!-- 顶部导航 -->
    <div class="header">
      <div class="header-content">
        <div class="back-button" @click="goBack">
          <el-icon><ArrowLeft /></el-icon>
          <span>返回</span>
        </div>
        <h1 class="title">{{ studentName }} - {{ examTitle }}</h1>
      </div>
    </div>

    <!-- 主内容区 -->
    <div class="content" v-loading="isLoading">
      <!-- 学生信息卡片 -->
      <el-card class="student-info-card" shadow="hover">
        <template #header>
          <div class="card-header">
            <span>学生信息</span>
          </div>
        </template>
        <el-row :gutter="20">
          <el-col :span="6">
            <div class="info-item">
              <span class="label">学生姓名：</span>
              <span class="value">{{ studentName }}</span>
            </div>
          </el-col>
          <el-col :span="6">
            <div class="info-item">
              <span class="label">学生ID：</span>
              <span class="value">{{ studentId }}</span>
            </div>
          </el-col>
          <el-col :span="6">
            <div class="info-item">
              <span class="label">总分：</span>
              <span class="value score">{{ totalScore }}分</span>
            </div>
          </el-col>
          <el-col :span="6">
            <div class="info-item">
              <span class="label">提交时间：</span>
              <span class="value">{{ submittedAt }}</span>
            </div>
          </el-col>
        </el-row>
      </el-card>

      <!-- 答题详情 -->
      <el-card class="answers-card" shadow="hover">
        <template #header>
          <div class="card-header">
            <span>答题详情</span>
            <span class="answer-count">共 {{ answers.length }} 题</span>
          </div>
        </template>
        
        <div v-if="answers.length === 0" class="empty-content">
          <el-empty description="暂无答题数据" />
        </div>
        
        <div v-else class="answers-list">
          <div v-for="(answer, index) in answers" :key="answer.answerId" class="answer-item">
            <div class="answer-header">
              <span class="question-number">第{{ index + 1 }}题</span>
              <el-tag :type="getScoreTagType(answer.finalScore || answer.autoScore || answer.score, answer.problemScore)">
                {{ answer.finalScore || answer.autoScore || answer.score || 0 }}分 / {{ answer.problemScore || 0 }}分
              </el-tag>
            </div>
            
            <div class="question-content">
              <h4>题目内容：</h4>
              <p>{{ answer.problemContent || '题目内容获取中...' }}</p>
            </div>
            
            <div class="answer-content">
              <h4>学生答案：</h4>
              <p class="student-answer">{{ answer.answer || '未作答' }}</p>
            </div>
            
            <div class="expected-answer" v-if="answer.expectedAnswer">
              <h4>标准答案：</h4>
              <p class="expected-answer-text">{{ answer.expectedAnswer }}</p>
            </div>
            
            <div class="grading-info">
              <el-row :gutter="20">
                <el-col :span="8">
                  <span class="label">是否自动批改：</span>
                  <el-tag :type="answer.isAutoGraded ? 'success' : 'info'">
                    {{ answer.isAutoGraded ? '是' : '否' }}
                  </el-tag>
                </el-col>
                <el-col :span="8">
                  <span class="label">批改状态：</span>
                  <el-tag :type="getGradingStatusType(answer.gradingStatus)">
                    {{ getGradingStatusText(answer.gradingStatus) }}
                  </el-tag>
                </el-col>
                <el-col :span="8">
                  <span class="label">答题状态：</span>
                  <el-tag :type="getAnswerStatusType(answer.status)">
                    {{ getStatusText(answer.status) }}
                  </el-tag>
                </el-col>
              </el-row>
            </div>
          </div>
        </div>
      </el-card>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, /*computed*/ } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { ElMessage } from 'element-plus'
import { ArrowLeft } from '@element-plus/icons-vue'
import { studentAnswerAPI, teacherAPI, problemAPI } from '@/api/api'

// 路由相关
const route = useRoute()
const router = useRouter()

// 响应式数据
const isLoading = ref(true)
const studentId = ref('')
const examId = ref('')
const studentName = ref('')
const examTitle = ref('')
const totalScore = ref(0)
const submittedAt = ref('')
const answers = ref([])



// 方法
function goBack() {
  router.go(-1)
}

function getScoreTagType(score, maxScore) {
  const percentage = (score / maxScore) * 100
  if (percentage >= 80) return 'success'
  if (percentage >= 60) return 'warning'
  return 'danger'
}

function getGradingStatusType(status) {
  switch (status) {
    case 'GRADED': return 'success'
    case 'PENDING': return 'warning'
    case 'REVIEWED': return 'info'
    default: return 'info'
  }
}

function getGradingStatusText(status) {
  switch (status) {
    case 'GRADED': return '已批改'
    case 'PENDING': return '待批改'
    case 'REVIEWED': return '已复核'
    default: return '待批改'
  }
}

function getAnswerStatusType(status) {
  switch (status) {
    case 'SUBMITTED': return 'success'
    case 'SAVED': return 'warning'
    case 'NOT_SUBMITTED': return 'danger'
    default: return 'info'
  }
}

function getStatusText(status) {
  switch (status) {
    case 'NOT_SUBMITTED': return '未提交'
    case 'SUBMITTED': return '已提交'
    case 'SAVED': return '已保存'
    default: return '未知'
  }
}

// 获取学生考卷详情
async function fetchStudentExamDetail() {
  try {
    isLoading.value = true
    
    // 从路由参数获取学生ID和考试ID
    studentId.value = route.params.studentId || route.query.studentId
    examId.value = route.params.examId || route.query.examId
    examTitle.value = route.query.homeworkTitle || '考试详情'
    
    if (!studentId.value || !examId.value) {
      ElMessage.error('缺少必要参数')
      return
    }
    
    // 获取学生信息
    try {
      const studentInfo = await teacherAPI.getStudentById(studentId.value)
      studentName.value = studentInfo.fullName || `学生${studentId.value}`
    } catch (error) {
      console.warn('获取学生信息失败:', error)
      studentName.value = `学生${studentId.value}`
    }
    
    // 获取学生答案
    const studentAnswers = await studentAnswerAPI.getAnswersByAssignment(examId.value)
    
    // 过滤出当前学生的答案
    const currentStudentAnswers = studentAnswers.filter(answer => 
      answer.studentId == studentId.value
    )
    
    // 为每个答案获取题目详情
    const answersWithDetails = await Promise.all(
      currentStudentAnswers.map(async (answer) => {
        try {
          const problemInfo = await problemAPI.getProblemById(answer.problemId)
          return {
            ...answer,
            problemContent: problemInfo.content,
            problemScore: problemInfo.score,
            expectedAnswer: problemInfo.expectedAnswer
          }
        } catch (error) {
          console.warn(`获取题目 ${answer.problemId} 详情失败:`, error)
          return {
            ...answer,
            problemContent: '题目内容获取失败',
            problemScore: 0,
            expectedAnswer: ''
          }
        }
      })
    )
    
    answers.value = answersWithDetails
    
    // 计算总分，优先使用 finalScore
    totalScore.value = answers.value.reduce((sum, answer) => {
      const score = parseFloat(answer.finalScore) || parseFloat(answer.autoScore) || parseFloat(answer.score) || 0
      return sum + score
    }, 0)
    
    // 获取提交时间（使用最新的答案时间）
    if (answers.value.length > 0) {
      const latestAnswer = answers.value.reduce((latest, current) => {
        return new Date(current.updatedAt) > new Date(latest.updatedAt) ? current : latest
      })
      submittedAt.value = new Date(latestAnswer.updatedAt).toLocaleString()
    }
    
  } catch (error) {
    console.error('获取学生考卷详情失败:', error)
    ElMessage.error('获取学生考卷详情失败')
  } finally {
    isLoading.value = false
  }
}

// 生命周期
onMounted(() => {
  fetchStudentExamDetail()
})
</script>

<style scoped>
.student-exam-detail {
  min-height: 100vh;
  background-color: #f5f7fa;
}

.header {
  background: white;
  border-bottom: 1px solid #e4e7ed;
  padding: 16px 24px;
}

.header-content {
  display: flex;
  align-items: center;
  gap: 16px;
}

.back-button {
  display: flex;
  align-items: center;
  gap: 8px;
  cursor: pointer;
  color: #409eff;
  font-size: 14px;
  transition: color 0.3s;
}

.back-button:hover {
  color: #66b1ff;
}

.title {
  margin: 0;
  font-size: 20px;
  font-weight: 600;
  color: #303133;
}

.content {
  padding: 24px;
  max-width: 1200px;
  margin: 0 auto;
}

.student-info-card,
.answers-card {
  margin-bottom: 24px;
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  font-weight: 600;
}

.answer-count {
  color: #909399;
  font-size: 14px;
  font-weight: normal;
}

.info-item {
  margin-bottom: 12px;
}

.label {
  color: #606266;
  font-size: 14px;
}

.value {
  color: #303133;
  font-weight: 500;
}

.value.score {
  color: #409eff;
  font-size: 16px;
  font-weight: 600;
}

.answers-list {
  display: flex;
  flex-direction: column;
  gap: 24px;
}

.answer-item {
  border: 1px solid #e4e7ed;
  border-radius: 8px;
  padding: 20px;
  background: #fafafa;
}

.answer-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 16px;
}

.question-number {
  font-weight: 600;
  color: #303133;
  font-size: 16px;
}

.question-content,
.answer-content,
.expected-answer {
  margin-bottom: 16px;
}

.question-content h4,
.answer-content h4,
.expected-answer h4 {
  margin: 0 0 8px 0;
  color: #606266;
  font-size: 14px;
  font-weight: 600;
}

.question-content p,
.student-answer,
.expected-answer-text {
  margin: 0;
  padding: 12px;
  background: white;
  border-radius: 4px;
  border: 1px solid #e4e7ed;
  line-height: 1.6;
}

.student-answer {
  color: #303133;
}

.expected-answer-text {
  color: #67c23a;
}

.grading-info {
  padding-top: 16px;
  border-top: 1px solid #e4e7ed;
}

.grading-info .label {
  margin-right: 8px;
}

.empty-content {
  text-align: center;
  padding: 40px 0;
}
</style>
