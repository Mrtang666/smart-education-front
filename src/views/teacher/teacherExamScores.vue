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
      <!-- 考试统计信息 -->
      <div class="statistics-container" v-if="examStatistics.totalStudents > 0">
        <div class="statistics-cards">
          <div class="stat-card">
            <div class="stat-value">{{ examStatistics.totalStudents }}</div>
            <div class="stat-label">总学生数</div>
          </div>
          <div class="stat-card">
            <div class="stat-value">{{ examStatistics.submittedStudents }}</div>
            <div class="stat-label">已提交</div>
          </div>
          <div class="stat-card">
            <div class="stat-value">{{ examStatistics.averageScore.toFixed(1) }}</div>
            <div class="stat-label">平均分</div>
          </div>
          <div class="stat-card">
            <div class="stat-value">{{ examStatistics.maxScore }}</div>
            <div class="stat-label">最高分</div>
          </div>
          <div class="stat-card">
            <div class="stat-value">{{ examStatistics.minScore }}</div>
            <div class="stat-label">最低分</div>
          </div>
        </div>
      </div>

      <!-- 图表分析区域 -->
      <div class="charts-section">
        <el-row :gutter="20">
          <el-col :span="12">
            <div class="chart-container">
              <div id="scoreDistributionChart" style="height: 350px;"></div>
            </div>
          </el-col>
          <el-col :span="12">
            <div class="chart-container">
              <div id="questionTypeChart" style="height: 350px;"></div>
            </div>
          </el-col>
        </el-row>

        <el-row :gutter="20" style="margin-top: 20px;">
          <el-col :span="8">
            <div class="chart-container">
              <div id="passRateChart" style="height: 300px;"></div>
            </div>
          </el-col>
          <el-col :span="8">
            <div class="chart-container">
              <div id="scoreRangeChart" style="height: 300px;"></div>
            </div>
          </el-col>
          <el-col :span="8">
            <div class="chart-container">
              <div id="completionChart" style="height: 300px;"></div>
            </div>
          </el-col>
        </el-row>


      </div>

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
            :empty-text="isLoading ? '加载中...' : '还没有学生完成作答哦'"
          >
            <el-table-column label="用户名" min-width="120" sortable align="center" header-align="center">
              <template #default="scope">
                {{ scope.row.studentId }}
              </template>
            </el-table-column>
            <el-table-column label="姓名" min-width="120" sortable align="center" header-align="center">
              <template #default="scope">
                {{ scope.row.fullName }}
              </template>
            </el-table-column>
            <el-table-column label="邮箱" min-width="200" sortable align="center" header-align="center">
              <template #default="scope">
                {{ scope.row.email }}
              </template>
            </el-table-column>
            <el-table-column prop="score" label="分数" min-width="100" sortable align="center" header-align="center">
              <template #default="scope">
                <span :class="getScoreClass(scope.row.score)">{{ scope.row.score || '未参加' }}</span>
              </template>
            </el-table-column>
            <el-table-column prop="submitTime" label="提交时间" min-width="180" sortable align="center" header-align="center">
              <template #default="scope">
                {{ formatDateTime(scope.row.submitTime) || '未提交' }}
              </template>
            </el-table-column>
            <el-table-column prop="status" label="状态" min-width="120" align="center" header-align="center">
              <template #default="scope">
                <el-tag :type="getStatusType(scope.row.status)">{{ scope.row.status || '未知' }}</el-tag>
              </template>
            </el-table-column>
            <el-table-column label="操作" min-width="150" fixed="right" align="center" header-align="center">
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
import { examAPI, courseAPI, courseSelectionAPI } from '@/api/api'
import BigNumber from 'bignumber.js'
import * as echarts from 'echarts/core'
import { BarChart, LineChart, PieChart, RadarChart, ScatterChart } from 'echarts/charts'
import {
  GridComponent,
  TooltipComponent,
  LegendComponent,
  TitleComponent,
  DataZoomComponent,
  MarkLineComponent,
  MarkPointComponent
} from 'echarts/components'
import { CanvasRenderer } from 'echarts/renderers'

// 注册 ECharts 组件
echarts.use([
  BarChart,
  LineChart,
  PieChart,
  RadarChart,
  ScatterChart,
  GridComponent,
  TooltipComponent,
  LegendComponent,
  TitleComponent,
  DataZoomComponent,
  MarkLineComponent,
  MarkPointComponent,
  CanvasRenderer
])

const route = useRoute()
const router = useRouter()
const examId = route.params.examId
const examTitle = ref(route.query.title || '考试成绩')
const courseName = ref(route.query.courseName && route.query.courseName !== '未知课程' ? route.query.courseName : '加载中...')
const courseId = ref(null) // 存储课程ID

// 学生成绩列表
const examStudents = ref([])
const isLoading = ref(true)
const searchKeyword = ref('')
const currentPage = ref(1)
const pageSize = ref(10)

// 考试统计信息
const examStatistics = ref({
  totalStudents: 0,
  submittedStudents: 0,
  averageScore: 0,
  maxScore: 0,
  minScore: 0,
  scoreDistribution: []
})

// 学生详情
const studentDetailVisible = ref(false)
const currentStudent = ref(null)
const studentAnswers = ref([])
const isLoadingDetail = ref(false)

// 图表相关
// const chartContainer = ref(null)
let scoreDistributionChart = null
let questionTypeChart = null
let passRateChart = null
let scoreRangeChart = null
let completionChart = null

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

// 获取考试学生列表和成绩
async function fetchExamStudents() {
  try {
    isLoading.value = true
    console.log('开始获取学生数据，courseId:', courseId.value)

    // 确保examId是字符串形式
    const examIdStr = examId ? new BigNumber(examId).toString() : examId.toString()

    // 新的逻辑：
    // 1. 获取课程的所有学生（从courseSelectionAPI）
    // 2. 获取已作答学生的成绩（从examAPI.getExamStudentScores）
    // 3. 合并数据，显示完整的学生列表

    let allCourseStudents = []
    let completedStudentsScores = []

    // 1. 获取课程的所有学生
    if (courseId.value) {
      try {
        console.log('正在获取课程学生列表，courseId:', courseId.value)
        allCourseStudents = await courseSelectionAPI.getCourseStudents(courseId.value)
        console.log('获取到的课程学生列表:', allCourseStudents)
      } catch (error) {
        console.warn('获取课程学生列表失败:', error)
        allCourseStudents = []
      }
    } else {
      console.warn('没有courseId，无法获取课程学生列表')
    }

    // 2. 获取已作答学生的成绩
    try {
      console.log('正在获取已作答学生成绩，examId:', examIdStr)
      completedStudentsScores = await examAPI.getExamStudentScores(examIdStr)
      console.log('获取到的已作答学生成绩:', completedStudentsScores)
    } catch (error) {
      console.warn('获取已作答学生成绩失败:', error)
      completedStudentsScores = []
    }

    // 3. 合并数据
    console.log('开始合并数据')
    await mergeStudentData(allCourseStudents, completedStudentsScores)

    // 4. 如果最终没有学生数据，使用后备方案
    if (examStudents.value.length === 0 && Array.isArray(completedStudentsScores) && completedStudentsScores.length > 0) {
      console.log('使用后备方案：只显示已作答学生')
      examStudents.value = completedStudentsScores.map(student => ({
        ...student,
        studentId: String(student.studentId),
        fullName: student.fullName || student.name || `学生${student.studentId}`,
        status: student.status || '已完成'
      }))
    }

    // 5. 最终检查，确保有数据显示
    console.log('最终学生数据数量:', examStudents.value.length)

    // 获取考试统计信息和题型分析
    await Promise.all([
      fetchExamStatistics(examIdStr),
      fetchQuestionTypeAnalysis(examIdStr)
    ])



    // 初始化图表（确保数据加载完成后再初始化）
    await nextTick()
    console.log('数据加载完成，开始初始化图表')
    initAllCharts()
  } catch (error) {
    console.error('获取考试学生列表失败:', error)
    ElMessage.error('获取考试学生列表失败，请稍后重试')
    examStudents.value = []

    // 即使数据获取失败，也要尝试获取统计信息和题型分析
    const examIdStr = examId ? new BigNumber(examId).toString() : examId.toString()
    try {
      await Promise.all([
        fetchExamStatistics(examIdStr),
        fetchQuestionTypeAnalysis(examIdStr)
      ])
    } catch (statsError) {
      console.error('获取统计信息失败:', statsError)
      // 确保统计信息有默认值
      calculateStatisticsFromStudentData()
    }

    // 即使数据获取失败，也要初始化图表显示无数据状态
    await nextTick()
    console.log('数据获取失败，但仍要初始化图表显示无数据状态')
    initAllCharts()
  } finally {
    isLoading.value = false
  }
}

// 合并学生数据：课程学生列表 + 已作答学生成绩
async function mergeStudentData(allCourseStudents, completedStudentsScores) {
  try {
    console.log('开始合并学生数据')
    console.log('课程学生数量:', Array.isArray(allCourseStudents) ? allCourseStudents.length : 0)
    console.log('已作答学生数量:', Array.isArray(completedStudentsScores) ? completedStudentsScores.length : 0)

    // 确保输入参数是数组
    const courseStudents = Array.isArray(allCourseStudents) ? allCourseStudents : []
    const scoreStudents = Array.isArray(completedStudentsScores) ? completedStudentsScores : []

    // 创建已作答学生的成绩映射（以studentId为key）
    const scoresMap = new Map()
    scoreStudents.forEach(scoreData => {
      if (scoreData && scoreData.studentId) {
        const studentId = String(scoreData.studentId)
        scoresMap.set(studentId, scoreData)
        console.log('添加成绩映射:', studentId, scoreData)
      }
    })
    console.log('成绩映射表:', scoresMap)

    // 合并数据：以课程学生为基础，添加成绩信息
    if (courseStudents.length > 0) {
      console.log('使用课程学生列表作为基础')
      examStudents.value = courseStudents.map((student, index) => {
        console.log(`学生${index}原始数据:`, student)

        // 使用数据库ID作为内部标识
        const internalId = String(student.studentId)
        const scoreData = scoresMap.get(internalId)

        const result = {
          // 使用用户名作为学号显示（因为没有真正的学号字段）
          studentId: student.username || `学生${index + 1}`,
          // 使用fullName作为姓名
          fullName: student.fullName || student.username || `学生${index + 1}`,
          // 邮箱
          email: student.email || '',
          // 年级和班级（如果为null则显示为空）
          grade: student.grade || '未设置',
          className: student.className || '未设置',
          // 电话
          phone: student.phone || '',
          // 内部ID用于成绩匹配
          _internalId: internalId,
          // 成绩相关信息
          score: scoreData ? scoreData.score : null,
          submitTime: scoreData ? scoreData.submitTime : null,
          status: scoreData ? (scoreData.status || '已完成') : '未完成'
        }

        console.log(`学生${index}处理后数据:`, result)
        return result
      })
    } else if (scoreStudents.length > 0) {
      console.log('只有已作答学生数据，使用作为基础')
      // 如果没有课程学生数据，只显示已作答的学生
      examStudents.value = scoreStudents.map(student => ({
        ...student,
        studentId: String(student.studentId),
        fullName: student.fullName || student.name || `学生${student.studentId}`,
        status: student.status || '已完成'
      }))
    } else {
      console.log('没有任何学生数据')
      // 都没有数据
      examStudents.value = []
    }

    console.log('合并后的学生数据数量:', examStudents.value.length)
    console.log('合并后的学生数据:', examStudents.value)

    // 强制触发响应式更新
    nextTick(() => {
      console.log('强制更新表格数据')
    })
  } catch (error) {
    console.error('合并学生数据失败:', error)
    examStudents.value = []
  }
}



// 获取考试统计信息
async function fetchExamStatistics(examIdStr) {
  try {
    const statistics = await examAPI.getExamStatistics(examIdStr)
    console.log('获取到的考试统计信息:', statistics)

    // 可以将统计信息存储到响应式变量中，用于显示
    examStatistics.value = statistics
  } catch (error) {
    console.warn('getExamStatistics API不存在，使用计算的统计信息:', error)
    // 基于学生成绩数据计算统计信息
    calculateStatisticsFromStudentData()
  }
}

// 基于学生数据计算统计信息
function calculateStatisticsFromStudentData() {
  const completedStudents = examStudents.value.filter(s => s.status === '已完成' && s.score !== undefined && s.score !== null)
  const scores = completedStudents.map(s => s.score)

  examStatistics.value = {
    totalStudents: examStudents.value.length,
    submittedStudents: completedStudents.length,
    averageScore: scores.length > 0 ? Math.round((scores.reduce((a, b) => a + b, 0) / scores.length) * 10) / 10 : 0,
    maxScore: scores.length > 0 ? Math.max(...scores) : 0,
    minScore: scores.length > 0 ? Math.min(...scores) : 0,
    scoreDistribution: []
  }
}

// 获取题型分析数据
const questionTypeData = ref([])
async function fetchQuestionTypeAnalysis(examIdStr) {
  try {
    const analysis = await examAPI.getExamQuestionTypeAnalysis(examIdStr)
    console.log('获取到的题型分析数据:', analysis)

    if (Array.isArray(analysis)) {
      questionTypeData.value = analysis
    } else {
      questionTypeData.value = []
    }
  } catch (error) {
    console.warn('获取题型分析失败，后端可能没有实现此接口:', error)
    questionTypeData.value = []
    // 不显示错误消息，因为这个接口可能后端没有实现
  }
}



// 查看学生详情
async function viewStudentDetail(student) {
  currentStudent.value = student
  studentDetailVisible.value = true
  studentAnswers.value = []

  try {
    isLoadingDetail.value = true

    // 确保ID是字符串形式
    const studentIdStr = student.studentId ? new BigNumber(student.studentId).toString() : String(student.studentId)
    const examIdStr = examId ? new BigNumber(examId).toString() : String(examId)

    console.log('获取学生答题详情，学生ID:', studentIdStr, '考试ID:', examIdStr)

    // 调用API获取学生答题详情
    const response = await examAPI.getStudentExamAnswers(examIdStr, studentIdStr)
    console.log('获取到的学生答题详情:', response)

    if (Array.isArray(response)) {
      studentAnswers.value = response.map(answer => ({
        ...answer,
        answerId: String(answer.answerId || answer.id),
        questionId: String(answer.questionId),
        questionContent: answer.questionContent || answer.question || '题目内容',
        answerContent: answer.answerContent || answer.answer || '未作答',
        score: answer.score || 0,
        totalScore: answer.totalScore || answer.maxScore || 0,
        questionType: answer.questionType || 'unknown'
      }))
    } else {
      studentAnswers.value = []
    }

  } catch (error) {
    console.error('获取学生答题详情失败:', error)
    ElMessage.error('获取学生答题详情失败，请稍后重试')
    studentAnswers.value = []
  } finally {
    isLoadingDetail.value = false
  }
}

// 初始化成绩分布图表
function initScoreDistributionChart() {
  console.log('初始化成绩分布图表')
  const chartDom = document.getElementById('scoreDistributionChart')
  if (!chartDom) {
    console.error('找不到scoreDistributionChart DOM元素')
    return
  }
  // 如果已经初始化过，先销毁
  if (scoreDistributionChart) {
    scoreDistributionChart.dispose()
  }
  scoreDistributionChart = echarts.init(chartDom)
  // 检查是否有学生数据
  const validStudents = examStudents.value.filter(s =>
    s.score !== undefined && s.score !== null && typeof s.score === 'number'
  )
  console.log('有效学生数据数量:', validStudents.length)
  if (validStudents.length === 0) {
    // 显示无数据状态
    console.log('显示成绩分布无数据状态')
    scoreDistributionChart.setOption(createNoDataOption('分数分布', '暂时没有学生完成'))
    return
  }
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
      count: validStudents.filter(s =>
        s.score >= range.min && s.score <= range.max
      ).length
    }
  })
  const option = {
    title: {
      text: '分数分布',
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
  scoreDistributionChart.setOption(option)
  // 响应窗口大小变化
  window.addEventListener('resize', () => {
    if (scoreDistributionChart) {
      scoreDistributionChart.resize()
    }
  })
}

// 初始化题型得分分析图表
function initQuestionTypeChart() {
  console.log('初始化题型得分分析图表')
  const chartDom = document.getElementById('questionTypeChart')
  if (!chartDom) {
    console.error('找不到questionTypeChart DOM元素')
    return
  }

  if (questionTypeChart) {
    questionTypeChart.dispose()
  }

  questionTypeChart = echarts.init(chartDom)

  // 检查是否有题型数据
  console.log('题型数据:', questionTypeData.value)
  if (!questionTypeData.value || questionTypeData.value.length === 0) {
    // 显示无数据状态
    console.log('显示题型分析无数据状态')
    questionTypeChart.setOption(createNoDataOption('题型得分分析', '暂时没有学生完成'))
    return
  }

  // 使用真实的题型数据
  const questionTypes = questionTypeData.value.map(item => ({
    type: item.questionType || '未知题型',
    totalScore: item.totalScore || 0,
    avgScore: item.averageScore || 0
  }))

  const option = {
    title: {
      text: '题型得分分析',
      left: 'center'
    },
    tooltip: {
      trigger: 'axis',
      axisPointer: {
        type: 'shadow'
      }
    },
    legend: {
      data: ['总分', '平均得分'],
      top: 30
    },
    grid: {
      left: '3%',
      right: '4%',
      bottom: '3%',
      top: '15%',
      containLabel: true
    },
    xAxis: {
      type: 'category',
      data: questionTypes.map(item => item.type)
    },
    yAxis: {
      type: 'value',
      name: '分数'
    },
    series: [
      {
        name: '总分',
        type: 'bar',
        data: questionTypes.map(item => item.totalScore),
        itemStyle: {
          color: '#E6A23C'
        }
      },
      {
        name: '平均得分',
        type: 'bar',
        data: questionTypes.map(item => item.avgScore),
        itemStyle: {
          color: '#67C23A'
        }
      }
    ]
  }

  questionTypeChart.setOption(option)
}

// 初始化及格率统计图表
function initPassRateChart() {
  console.log('初始化及格率统计图表')
  const chartDom = document.getElementById('passRateChart')
  if (!chartDom) {
    console.error('找不到passRateChart DOM元素')
    return
  }

  if (passRateChart) {
    passRateChart.dispose()
  }

  passRateChart = echarts.init(chartDom)

  // 检查是否有有效的成绩数据
  const validStudents = examStudents.value.filter(s =>
    s.score !== undefined && s.score !== null && typeof s.score === 'number'
  )

  console.log('及格率图表有效学生数据数量:', validStudents.length)

  if (validStudents.length === 0) {
    // 显示无数据状态
    console.log('显示及格率无数据状态')
    passRateChart.setOption(createNoDataOption('及格率统计', '暂时没有学生完成'))
    return
  }

  const passCount = validStudents.filter(s => s.score >= 60).length
  const failCount = validStudents.filter(s => s.score < 60).length

  const option = {
    title: {
      text: '及格率统计',
      left: 'center'
    },
    tooltip: {
      trigger: 'item',
      formatter: '{a} <br/>{b}: {c} ({d}%)'
    },
    legend: {
      orient: 'vertical',
      left: 'left',
      top: 'middle'
    },
    series: [
      {
        name: '及格情况',
        type: 'pie',
        radius: ['40%', '70%'],
        center: ['60%', '50%'],
        data: [
          { value: passCount, name: '及格', itemStyle: { color: '#67C23A' } },
          { value: failCount, name: '不及格', itemStyle: { color: '#F56C6C' } }
        ],
        emphasis: {
          itemStyle: {
            shadowBlur: 10,
            shadowOffsetX: 0,
            shadowColor: 'rgba(0, 0, 0, 0.5)'
          }
        },
        label: {
          show: true,
          formatter: '{b}: {c}人\n({d}%)'
        }
      }
    ]
  }

  passRateChart.setOption(option)
}

// 初始化分数段分布图表
function initScoreRangeChart() {
  console.log('初始化分数段分布图表')
  const chartDom = document.getElementById('scoreRangeChart')
  if (!chartDom) {
    console.error('找不到scoreRangeChart DOM元素')
    return
  }

  if (scoreRangeChart) {
    scoreRangeChart.dispose()
  }

  scoreRangeChart = echarts.init(chartDom)

  // 检查是否有有效的成绩数据
  const validStudents = examStudents.value.filter(s =>
    s.score !== undefined && s.score !== null && typeof s.score === 'number'
  )

  console.log('分数段图表有效学生数据数量:', validStudents.length)

  if (validStudents.length === 0) {
    // 显示无数据状态
    console.log('显示分数段分布无数据状态')
    scoreRangeChart.setOption(createNoDataOption('分数段分布', '暂时没有学生完成'))
    return
  }

  const ranges = [
    { name: '优秀(90-100)', min: 90, max: 100, color: '#9B59B6' },
    { name: '良好(80-89)', min: 80, max: 89, color: '#409EFF' },
    { name: '中等(70-79)', min: 70, max: 79, color: '#67C23A' },
    { name: '及格(60-69)', min: 60, max: 69, color: '#E6A23C' },
    { name: '不及格(0-59)', min: 0, max: 59, color: '#F56C6C' }
  ]

  const data = ranges.map(range => ({
    name: range.name,
    value: validStudents.filter(s =>
      s.score >= range.min && s.score <= range.max
    ).length,
    itemStyle: { color: range.color }
  }))

  const option = {
    title: {
      text: '分数段分布',
      left: 'center'
    },
    tooltip: {
      trigger: 'item',
      formatter: '{a} <br/>{b}: {c}人 ({d}%)'
    },
    series: [
      {
        name: '分数段',
        type: 'pie',
        radius: '60%',
        center: ['50%', '50%'],
        data: data,
        emphasis: {
          itemStyle: {
            shadowBlur: 10,
            shadowOffsetX: 0,
            shadowColor: 'rgba(0, 0, 0, 0.5)'
          }
        },
        label: {
          show: true,
          formatter: '{b}\n{c}人'
        }
      }
    ]
  }

  scoreRangeChart.setOption(option)
}

// 初始化答题完成度图表
function initCompletionChart() {
  console.log('初始化答题完成度图表')
  const chartDom = document.getElementById('completionChart')
  if (!chartDom) {
    console.error('找不到completionChart DOM元素')
    return
  }

  if (completionChart) {
    completionChart.dispose()
  }

  completionChart = echarts.init(chartDom)

  // 检查是否有学生数据
  console.log('答题完成度图表学生数据数量:', examStudents.value ? examStudents.value.length : 0)
  if (!examStudents.value || examStudents.value.length === 0) {
    // 显示无数据状态
    console.log('显示答题完成度无数据状态')
    completionChart.setOption(createNoDataOption('答题完成度', '暂时没有学生完成'))
    return
  }

  const completedCount = examStudents.value.filter(s => s.status === '已完成').length
  const incompleteCount = examStudents.value.length - completedCount

  const option = {
    title: {
      text: '答题完成度',
      left: 'center'
    },
    tooltip: {
      trigger: 'item',
      formatter: '{a} <br/>{b}: {c}人 ({d}%)'
    },
    series: [
      {
        name: '完成情况',
        type: 'pie',
        radius: '70%',
        center: ['50%', '50%'],
        data: [
          {
            value: completedCount,
            name: '已完成',
            itemStyle: { color: '#67C23A' }
          },
          {
            value: incompleteCount,
            name: '未完成',
            itemStyle: { color: '#F56C6C' }
          }
        ],
        emphasis: {
          itemStyle: {
            shadowBlur: 10,
            shadowOffsetX: 0,
            shadowColor: 'rgba(0, 0, 0, 0.5)'
          }
        },
        label: {
          show: true,
          formatter: '{b}\n{c}人\n{d}%'
        }
      }
    ]
  }

  completionChart.setOption(option)
}



// 创建无数据图表配置的通用函数
function createNoDataOption(title, message = '暂时没有学生完成') {
  return {
    title: {
      text: title,
      left: 'center',
      top: '20px',
      textStyle: {
        fontSize: 18,
        fontWeight: 'bold',
        color: '#bbb'
      }
    },
    graphic: [
      {
        type: 'group',
        left: 'center',
        top: 'middle',
        children: [
          {
            type: 'text',
            style: {
              text: '🧐',
              fontSize: 60,
              fill: '#e0e0e0',
              textAlign: 'center'
            },
            top: -30
          },
          {
            type: 'text',
            style: {
              text: message,
              fontSize: 20,
              fill: '#bbb',
              textAlign: 'center',
              fontWeight: 'bold'
            },
            top: 40
          }
        ]
      }
    ],
    backgroundColor: '#fafbfc'
  }
}

// 统一初始化所有图表
function initAllCharts() {
  console.log('开始初始化所有图表，学生数据数量:', examStudents.value.length)
  // 确保DOM元素存在后再初始化图表
  nextTick(() => {
    try {
      initScoreDistributionChart()
      initQuestionTypeChart()
      initPassRateChart()
      initScoreRangeChart()
      initCompletionChart()
      console.log('所有图表初始化完成')
    } catch (error) {
      console.error('图表初始化失败:', error)
    }
  })
  // 响应窗口大小变化
  window.addEventListener('resize', () => {
    if (scoreDistributionChart) scoreDistributionChart.resize()
    if (questionTypeChart) questionTypeChart.resize()
    if (passRateChart) passRateChart.resize()
    if (scoreRangeChart) scoreRangeChart.resize()
    if (completionChart) completionChart.resize()
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

// 获取考试基本信息
async function fetchExamInfo() {
  try {
    const examIdStr = examId ? new BigNumber(examId).toString() : String(examId)
    const examInfo = await examAPI.getExamById(examIdStr)
    console.log('获取到的考试信息:', examInfo)

    if (examInfo) {
      examTitle.value = examInfo.title || route.query.title || '考试成绩'

      // 保存课程ID
      if (examInfo.courseId) {
        courseId.value = examInfo.courseId
      }

      // 更新课程名称
      if (examInfo.courseName) {
        courseName.value = examInfo.courseName
      } else if (examInfo.courseTitle) {
        courseName.value = examInfo.courseTitle
      } else if (examInfo.course && examInfo.course.name) {
        courseName.value = examInfo.course.name
      } else if (examInfo.course && examInfo.course.courseName) {
        courseName.value = examInfo.course.courseName
      } else if (route.query.courseName && route.query.courseName !== '未知课程') {
        courseName.value = route.query.courseName
      } else if (examInfo.courseId) {
        // 如果有课程ID但没有课程名称，尝试获取课程信息
        try {
          const courseInfo = await courseAPI.getCourseById(examInfo.courseId)
          if (courseInfo && (courseInfo.courseName || courseInfo.name)) {
            courseName.value = courseInfo.courseName || courseInfo.name
          }
        } catch (courseError) {
          console.warn('获取课程信息失败:', courseError)
          // 保持默认的课程名称
        }
      }

      // 最终检查，如果课程名称仍然是加载中或未知课程，设置一个默认值
      if (courseName.value === '加载中...' || courseName.value === '未知课程') {
        courseName.value = '智慧教育课程'
      }
    }
  } catch (error) {
    console.warn('getExamById API调用失败，使用路由参数:', error)
    // 获取考试信息失败不影响主要功能，使用路由参数的默认值
    examTitle.value = route.query.title || '考试成绩'
    if (route.query.courseName && route.query.courseName !== '未知课程') {
      courseName.value = route.query.courseName
    } else {
      courseName.value = '智慧教育课程'
    }
  }
}

// 组件挂载时获取数据
onMounted(async () => {
  console.log('页面加载，开始获取考试数据')
  console.log('考试ID:', examId)

  if (!examId) {
    ElMessage.error('考试ID不存在')
    goBack()
    return
  }

  // 先获取考试信息（包含courseId），再获取学生成绩
  await fetchExamInfo()
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

.scores-body .el-table {
  width: 100% !important;
}

.scores-body .el-table__header-wrapper,
.scores-body .el-table__body-wrapper {
  width: 100% !important;
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

.stat-value {
  font-size: 24px;
  font-weight: bold;
  color: #409EFF;
  margin-bottom: 5px;
}

.stat-label {
  font-size: 14px;
  color: #606266;
}

.statistics-container {
  background-color: #fff;
  border-radius: 12px;
  padding: 20px;
  margin-bottom: 20px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.05);
}

/* 图表区域样式 */
.charts-section {
  margin-bottom: 20px;
}

.chart-container {
  background-color: #fff;
  border-radius: 12px;
  padding: 20px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.05);
  height: 100%;
}

.chart-header {
  margin-bottom: 15px;
  padding-bottom: 10px;
  border-bottom: 1px solid #EBEEF5;
}

.chart-header h3 {
  margin: 0;
  font-size: 16px;
  font-weight: 600;
  color: #303133;
}

/* 图表无数据状态样式 */
.chart-no-data {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  height: 100%;
  color: #999;
  font-size: 16px;
}

.chart-no-data-icon {
  font-size: 48px;
  margin-bottom: 16px;
  color: #ddd;
}

.chart-no-data-text {
  margin-bottom: 8px;
  font-weight: 500;
}

.chart-no-data-desc {
  font-size: 14px;
  color: #bbb;
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

/* 表格对齐样式 */
:deep(.el-table .el-table__header-wrapper) {
  text-align: center;
}

:deep(.el-table .el-table__body-wrapper) {
  text-align: center;
}

:deep(.el-table th) {
  text-align: center !important;
}

:deep(.el-table td) {
  text-align: center !important;
}
</style> 