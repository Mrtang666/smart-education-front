<!-- 待数据测试 -->
<template>
  <div class="exam-scores-page">
    <div class="page-header">
      <div class="header-content">
        <div class="back-button" @click="goBack">
          <el-icon><ArrowLeft /></el-icon>
          <span>返回</span>
        </div>
        <h1 class="page-title">{{ examTitle }} - 考试成绩</h1>
      </div>
      <div class="course-info">
        <span>所属课程: {{ courseName }}</span>
      </div>
    </div>

    <div class="page-content">
      <div class="scores-container">
        <div class="scores-header">
          <div class="header-left">
            <h2>学生成绩列表</h2>
          </div>
          <div class="header-right">
            <el-input
              v-model="searchKeyword"
              placeholder="搜索学生姓名或学号"
              prefix-icon="Search"
              clearable
              @clear="handleSearchClear"
              @input="handleSearchInput"
              style="width: 250px;"
            />
          </div>
        </div>

        <div class="scores-body">
          <el-table
            :data="filteredStudents"
            style="width: 100%"
            v-loading="isLoading"
            :empty-text="isLoading ? '加载中...' : '暂无考试成绩数据'"
          >
            <el-table-column prop="studentId" label="学号" width="120" sortable />
            <el-table-column prop="fullName" label="姓名" width="120" sortable />
            <el-table-column prop="score" label="分数" width="100" sortable>
              <template #default="scope">
                <span :class="getScoreClass(scope.row.score)">{{ scope.row.score || '未参加' }}</span>
              </template>
            </el-table-column>
            <el-table-column prop="submitTime" label="提交时间" width="180" sortable>
              <template #default="scope">
                {{ formatDateTime(scope.row.submitTime) || '未提交' }}
              </template>
            </el-table-column>
            <el-table-column prop="status" label="状态" width="100">
              <template #default="scope">
                <el-tag :type="getStatusType(scope.row.status)">{{ scope.row.status || '未知' }}</el-tag>
              </template>
            </el-table-column>
            <el-table-column label="操作" width="200" fixed="right">
              <template #default="scope">
                <el-button link type="primary" @click="viewStudentDetail(scope.row)" :disabled="!scope.row.score">查看详情</el-button>
              </template>
            </el-table-column>
          </el-table>
          
          <div class="pagination-container" v-if="examStudents.length > pageSize">
            <el-pagination
              v-model:current-page="currentPage"
              v-model:page-size="pageSize"
              :page-sizes="[10, 20, 50, 100]"
              layout="total, sizes, prev, pager, next, jumper"
              :total="filteredStudents.length"
            />
          </div>
        </div>
      </div>

      <div class="scores-analysis" v-if="examStudents.length > 0">
        <div class="analysis-header">
          <h2>成绩分析</h2>
        </div>
        <div class="analysis-body">
          <div class="statistics-cards">
            <div class="stat-card">
              <div class="stat-title">参考人数</div>
              <div class="stat-value">{{ examStudents.filter(s => s.status === '已完成').length }}</div>
            </div>
            <div class="stat-card">
              <div class="stat-title">平均分</div>
              <div class="stat-value">{{ averageScore }}</div>
            </div>
            <div class="stat-card">
              <div class="stat-title">最高分</div>
              <div class="stat-value">{{ maxScore }}</div>
            </div>
            <div class="stat-card">
              <div class="stat-title">最低分</div>
              <div class="stat-value">{{ minScore }}</div>
            </div>
            <div class="stat-card">
              <div class="stat-title">及格率</div>
              <div class="stat-value">{{ passRate }}%</div>
            </div>
          </div>

          <div class="chart-container" ref="chartContainer">
            <div id="scoreDistributionChart" style="width: 100%; height: 300px;"></div>
          </div>
        </div>
      </div>
    </div>

    <!-- 学生详情对话框 -->
    <el-dialog v-model="studentDetailVisible" :title="`${currentStudent?.fullName || '学生'} 的考试详情`" width="600px">
      <div v-if="currentStudent" class="student-detail">
        <div class="detail-header">
          <div class="detail-info">
            <div class="info-item">
              <span class="label">学号:</span>
              <span class="value">{{ currentStudent.studentId }}</span>
            </div>
            <div class="info-item">
              <span class="label">姓名:</span>
              <span class="value">{{ currentStudent.fullName }}</span>
            </div>
            <div class="info-item">
              <span class="label">分数:</span>
              <span class="value" :class="getScoreClass(currentStudent.score)">{{ currentStudent.score || '未参加' }}</span>
            </div>
            <div class="info-item">
              <span class="label">提交时间:</span>
              <span class="value">{{ formatDateTime(currentStudent.submitTime) || '未提交' }}</span>
            </div>
          </div>
        </div>
        <div class="detail-content">
          <h3>答题详情</h3>
          <div class="loading-container" v-if="isLoadingDetail">
            <el-icon class="is-loading"><Loading /></el-icon>
            <span>加载中...</span>
          </div>
          <div v-else-if="studentAnswers.length > 0" class="answers-list">
            <div v-for="(answer, index) in studentAnswers" :key="answer.answerId" class="answer-item">
              <div class="question-content">
                <div class="question-number">问题 {{ index + 1 }}</div>
                <div class="question-text">{{ answer.questionContent }}</div>
              </div>
              <div class="answer-content">
                <div class="answer-label">学生答案:</div>
                <div class="answer-text">{{ answer.answerContent || '未作答' }}</div>
              </div>
              <div class="score-info">
                <div class="score-label">得分:</div>
                <div class="score-value" :class="getDetailScoreClass(answer.score, answer.totalScore)">
                  {{ answer.score || 0 }} / {{ answer.totalScore || 0 }}
                </div>
              </div>
            </div>
          </div>
          <div v-else class="no-data">暂无答题详情数据</div>
        </div>
      </div>
      <template #footer>
        <div class="dialog-footer">
          <el-button @click="studentDetailVisible = false">关闭</el-button>
        </div>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, onMounted, computed, nextTick } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { ElMessage } from 'element-plus'
import { ArrowLeft, Loading } from '@element-plus/icons-vue'
import { examAPI } from '@/api/api'
import BigNumber from 'bignumber.js'
import * as echarts from 'echarts/core'
import { BarChart, LineChart } from 'echarts/charts'
import { GridComponent, TooltipComponent, LegendComponent, TitleComponent } from 'echarts/components'
import { CanvasRenderer } from 'echarts/renderers'

// 注册 ECharts 组件
echarts.use([
  BarChart,
  LineChart,
  GridComponent,
  TooltipComponent,
  LegendComponent,
  TitleComponent,
  CanvasRenderer
])

const route = useRoute()
const router = useRouter()
const examId = route.params.examId
const examTitle = ref(route.query.title || '考试成绩')
const courseName = ref(route.query.courseName || '未知课程')

// 学生成绩列表
const examStudents = ref([])
const isLoading = ref(true)
const searchKeyword = ref('')
const currentPage = ref(1)
const pageSize = ref(10)

// 学生详情
const studentDetailVisible = ref(false)
const currentStudent = ref(null)
const studentAnswers = ref([])
const isLoadingDetail = ref(false)

// 图表相关
const chartContainer = ref(null)
let scoreChart = null

// 过滤学生列表
const filteredStudents = computed(() => {
  if (!searchKeyword.value) {
    return examStudents.value
  }
  const keyword = searchKeyword.value.toLowerCase()
  return examStudents.value.filter(student => 
    (student.studentId && student.studentId.toString().includes(keyword)) ||
    (student.fullName && student.fullName.toLowerCase().includes(keyword))
  )
})

// 计算统计数据
const averageScore = computed(() => {
  const completedStudents = examStudents.value.filter(s => s.status === '已完成' && s.score !== undefined && s.score !== null)
  if (completedStudents.length === 0) return 0
  const sum = completedStudents.reduce((acc, student) => acc + (student.score || 0), 0)
  return (sum / completedStudents.length).toFixed(1)
})

const maxScore = computed(() => {
  const scores = examStudents.value
    .filter(s => s.status === '已完成' && s.score !== undefined && s.score !== null)
    .map(s => s.score || 0)
  return scores.length > 0 ? Math.max(...scores) : 0
})

const minScore = computed(() => {
  const scores = examStudents.value
    .filter(s => s.status === '已完成' && s.score !== undefined && s.score !== null)
    .map(s => s.score || 0)
  return scores.length > 0 ? Math.min(...scores) : 0
})

const passRate = computed(() => {
  const completedStudents = examStudents.value.filter(s => s.status === '已完成' && s.score !== undefined && s.score !== null)
  if (completedStudents.length === 0) return 0
  const passedStudents = completedStudents.filter(s => (s.score || 0) >= 60)
  return ((passedStudents.length / completedStudents.length) * 100).toFixed(1)
})

// 获取考试学生列表
async function fetchExamStudents() {
  try {
    isLoading.value = true
    
    // 确保examId是字符串形式
    const examIdStr = examId ? new BigNumber(examId).toString() : examId.toString()
    
    const response = await examAPI.getExamStudents(examIdStr)
    console.log('获取到的考试学生数据:', response)
    
    if (Array.isArray(response)) {
      // 确保所有ID都是字符串形式
      examStudents.value = response.map(student => ({
        ...student,
        studentId: student.studentId ? new BigNumber(student.studentId).toString() : student.studentId
      }))
    } else {
      examStudents.value = []
    }
    
    // 初始化图表
    nextTick(() => {
      initScoreChart()
    })
  } catch (error) {
    console.error('获取考试学生列表失败:', error)
    ElMessage.error('获取考试学生列表失败，请稍后重试')
    examStudents.value = []
  } finally {
    isLoading.value = false
  }
}

// 查看学生详情
async function viewStudentDetail(student) {
  currentStudent.value = student
  studentDetailVisible.value = true
  studentAnswers.value = []
  
  try {
    isLoadingDetail.value = true
    
    // 模拟数据
    setTimeout(() => {
      studentAnswers.value = [
        {
          answerId: '1',
          questionId: '101',
          questionContent: '简述Java语言的特点',
          answerContent: 'Java是一种面向对象的编程语言，具有跨平台性、安全性、多线程等特点',
          score: 8,
          totalScore: 10
        },
        {
          answerId: '2',
          questionId: '102',
          questionContent: '什么是多态？请举例说明',
          answerContent: '多态是指同一个方法调用由于对象不同可能会有不同的行为。例如，动物类中的"叫"方法，猫和狗的实现是不同的',
          score: 9,
          totalScore: 10
        },
        {
          answerId: '3',
          questionId: '103',
          questionContent: '解释什么是线程安全',
          answerContent: '线程安全是指在多线程环境下，代码能够正确地处理多个线程同时访问共享资源的情况，不会出现数据不一致或者其他并发问题',
          score: 7,
          totalScore: 10
        }
      ]
      isLoadingDetail.value = false
    }, 1000)
    
    // 实际API调用应该类似于：
    // const studentIdStr = student.studentId ? new BigNumber(student.studentId).toString() : student.studentId
    // const examIdStr = examId ? new BigNumber(examId).toString() : examId.toString()
    // const response = await examAPI.getStudentExamDetail(studentIdStr, examIdStr)
    // studentAnswers.value = response
    
  } catch (error) {
    console.error('获取学生答题详情失败:', error)
    ElMessage.error('获取学生答题详情失败，请稍后重试')
    isLoadingDetail.value = false
  }
}

// 初始化成绩分布图表
function initScoreChart() {
  if (!chartContainer.value) return
  
  const chartDom = document.getElementById('scoreDistributionChart')
  if (!chartDom) return
  
  // 如果已经初始化过，先销毁
  if (scoreChart) {
    scoreChart.dispose()
  }
  
  scoreChart = echarts.init(chartDom)
  
  // 计算成绩分布
  const scoreRanges = [
    { min: 0, max: 59, label: '0-59分' },
    { min: 60, max: 69, label: '60-69分' },
    { min: 70, max: 79, label: '70-79分' },
    { min: 80, max: 89, label: '80-89分' },
    { min: 90, max: 100, label: '90-100分' }
  ]
  
  const distribution = scoreRanges.map(range => {
    return {
      range: range.label,
      count: examStudents.value.filter(s => 
        s.score !== undefined && 
        s.score !== null && 
        s.score >= range.min && 
        s.score <= range.max
      ).length
    }
  })
  
  const option = {
    title: {
      text: '成绩分布',
      left: 'center'
    },
    tooltip: {
      trigger: 'axis',
      axisPointer: {
        type: 'shadow'
      }
    },
    grid: {
      left: '3%',
      right: '4%',
      bottom: '3%',
      containLabel: true
    },
    xAxis: {
      type: 'category',
      data: distribution.map(item => item.range)
    },
    yAxis: {
      type: 'value',
      name: '学生数量'
    },
    series: [
      {
        name: '学生数量',
        type: 'bar',
        data: distribution.map(item => item.count),
        itemStyle: {
          color: function(params) {
            const colors = ['#F56C6C', '#E6A23C', '#67C23A', '#409EFF', '#9B59B6']
            return colors[params.dataIndex]
          }
        },
        label: {
          show: true,
          position: 'top'
        }
      }
    ]
  }
  
  scoreChart.setOption(option)
  
  // 响应窗口大小变化
  window.addEventListener('resize', () => {
    if (scoreChart) {
      scoreChart.resize()
    }
  })
}

// 处理搜索输入
function handleSearchInput() {
  currentPage.value = 1
}

// 处理清除搜索
function handleSearchClear() {
  searchKeyword.value = ''
  currentPage.value = 1
}

// 获取分数样式
function getScoreClass(score) {
  if (score === undefined || score === null) return ''
  if (score < 60) return 'score-fail'
  if (score < 70) return 'score-pass'
  if (score < 80) return 'score-good'
  if (score < 90) return 'score-great'
  return 'score-excellent'
}

// 获取详情分数样式
function getDetailScoreClass(score, totalScore) {
  if (score === undefined || score === null) return ''
  const percentage = (score / totalScore) * 100
  if (percentage < 60) return 'score-fail'
  if (percentage < 70) return 'score-pass'
  if (percentage < 80) return 'score-good'
  if (percentage < 90) return 'score-great'
  return 'score-excellent'
}

// 获取状态类型
function getStatusType(status) {
  switch(status) {
    case '已完成':
      return 'success'
    case '进行中':
      return 'warning'
    case '未开始':
      return 'info'
    default:
      return 'info'
  }
}

// 格式化日期时间
function formatDateTime(dateString) {
  if (!dateString) return ''
  const date = new Date(dateString)
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')} ${String(date.getHours()).padStart(2, '0')}:${String(date.getMinutes()).padStart(2, '0')}`
}

// 返回上一页
function goBack() {
  router.go(-1)
}

// 组件挂载时获取数据
onMounted(async () => {
  if (!examId) {
    ElMessage.error('考试ID不存在')
    goBack()
    return
  }
  
  await fetchExamStudents()
})
</script>

<style scoped>
.exam-scores-page {
  height: 100%;
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

.page-header {
  padding: 0 10px;
  color: #303133;
  position: relative;
  display: flex;
  flex-direction: column;
  justify-content: center;
  border-radius: 0;
  box-shadow: none;
  border: none;
  background-color: transparent;
  text-align: left;
  min-height: 32px;
  flex-shrink: 0;
  line-height: 32px;
}

.header-content {
  display: flex;
  align-items: center;
  height: 32px;
}

.back-button {
  display: flex;
  align-items: center;
  cursor: pointer;
  color: #409EFF;
  margin-right: 16px;
  position: static;
  transition: transform 0.3s;
  line-height: 32px;
  height: 32px;
}

.back-button:hover {
  opacity: 0.8;
  transform: translateX(-5px);
}

.page-title {
  font-size: 16px;
  font-weight: 500;
  margin: 0;
  text-shadow: none;
  color: #303133;
  line-height: 32px;
  height: 32px;
  font-size: 22px;
}

.course-info {
  margin-top: 8px;
  color: #606266;
  font-size: 14px;
}

.page-content {
  flex: 1;
  padding: 32px 40px;
  background-color: #f5f7fa;
  overflow-y: auto;
}

.scores-container {
  background-color: #fff;
  border-radius: 12px;
  padding: 32px;
  box-shadow: 0 6px 16px rgba(0, 0, 0, 0.08);
  margin-bottom: 30px;
}

.scores-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
}

.header-left h2 {
  margin: 0;
  font-size: 18px;
  font-weight: 600;
  color: #303133;
}

.scores-body {
  width: 100%;
}

.pagination-container {
  margin-top: 20px;
  display: flex;
  justify-content: flex-end;
}

.scores-analysis {
  background-color: #fff;
  border-radius: 12px;
  padding: 32px;
  box-shadow: 0 6px 16px rgba(0, 0, 0, 0.08);
}

.analysis-header {
  margin-bottom: 20px;
}

.analysis-header h2 {
  margin: 0;
  font-size: 18px;
  font-weight: 600;
  color: #303133;
}

.statistics-cards {
  display: flex;
  gap: 20px;
  margin-bottom: 30px;
  flex-wrap: wrap;
}

.stat-card {
  background-color: #f5f7fa;
  border-radius: 8px;
  padding: 20px;
  flex: 1;
  min-width: 120px;
  text-align: center;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.05);
  transition: transform 0.3s;
}

.stat-card:hover {
  transform: translateY(-3px);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
}

.stat-title {
  font-size: 14px;
  color: #606266;
  margin-bottom: 10px;
}

.stat-value {
  font-size: 24px;
  font-weight: 600;
  color: #303133;
}

.chart-container {
  margin-top: 20px;
  height: 350px;
  width: 100%;
}

.student-detail {
  padding: 0 10px;
}

.detail-header {
  margin-bottom: 20px;
}

.detail-info {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 15px;
}

.info-item {
  display: flex;
}

.info-item .label {
  font-weight: bold;
  width: 80px;
  color: #606266;
}

.info-item .value {
  flex: 1;
  color: #303133;
}

.detail-content h3 {
  margin-top: 0;
  margin-bottom: 15px;
  font-size: 16px;
  color: #303133;
  border-left: 3px solid #409EFF;
  padding-left: 10px;
}

.loading-container {
  display: flex;
  justify-content: center;
  align-items: center;
  height: 200px;
  color: #909399;
  gap: 10px;
}

.answers-list {
  max-height: 400px;
  overflow-y: auto;
}

.answer-item {
  border: 1px solid #EBEEF5;
  border-radius: 8px;
  padding: 15px;
  margin-bottom: 15px;
}

.question-content {
  margin-bottom: 10px;
}

.question-number {
  font-weight: bold;
  margin-bottom: 5px;
  color: #409EFF;
}

.question-text {
  color: #303133;
  margin-bottom: 10px;
}

.answer-content {
  margin-bottom: 10px;
  padding: 10px;
  background-color: #F5F7FA;
  border-radius: 4px;
}

.answer-label {
  font-weight: 500;
  margin-bottom: 5px;
  color: #606266;
}

.answer-text {
  color: #303133;
  white-space: pre-wrap;
}

.score-info {
  display: flex;
  align-items: center;
  margin-top: 10px;
}

.score-label {
  font-weight: 500;
  color: #606266;
  margin-right: 10px;
}

.no-data {
  text-align: center;
  padding: 30px 0;
  color: #909399;
}

/* 分数样式 */
.score-fail {
  color: #F56C6C;
  font-weight: bold;
}

.score-pass {
  color: #E6A23C;
  font-weight: bold;
}

.score-good {
  color: #67C23A;
  font-weight: bold;
}

.score-great {
  color: #409EFF;
  font-weight: bold;
}

.score-excellent {
  color: #9B59B6;
  font-weight: bold;
}
</style> 