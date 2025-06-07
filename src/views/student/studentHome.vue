/**
 * 学生首页组件
 * 
 * 该组件展示学生的个人信息、课程、作业、考试和学习计划等数据
 * 所有数据均通过后端API获取，不使用模拟数据
 * 
 * API依赖:
 * - courseSelectionAPI: 获取学生已选课程
 * - studentExamAPI: 获取学生考试信息
 * - learningPlanAPI: 获取学生学习计划
 * 
 * 注意: 作业相关API尚未实现，目前显示为空
 */
<template>
  <div class="student-home">
    <!-- 欢迎区域 -->
    <div class="welcome-section">
      <div class="welcome-content">
        <h1 class="welcome-title">你好，{{ userInfo?.fullName + '同学' }}</h1>
        <p class="welcome-subtitle">欢迎使用智能教育平台</p>
        <div class="current-time">{{ currentDate }} {{ currentTime }}</div>
      </div>
      <div class="welcome-decoration">
        <el-icon :size="120" class="decoration-icon">
          <Reading />
        </el-icon>
      </div>
    </div>

    <!-- 功能方块区域 -->
    <div class="feature-grid">
      <!-- 已选课程方块 -->
      <div class="feature-card" @click="navigateTo('course')">
        <div class="card-icon blue">
          <el-icon :size="32">
            <Reading />
          </el-icon>
        </div>
        <div class="card-content">
          <h3 class="card-title">已选课程</h3>
          <div class="card-value">{{ courseCount }}</div>
          <p class="card-desc">点击查看所有课程</p>
        </div>
      </div>

      <!-- 未完成作业方块 -->
      <div class="feature-card" @click="navigateTo('assignment')">
        <div class="card-icon orange">
          <el-icon :size="32">
            <Notebook />
          </el-icon>
        </div>
        <div class="card-content">
          <h3 class="card-title">未完成作业</h3>
          <div class="card-value">{{ assignmentCount }}</div>
          <p class="card-desc">点击查看所有作业</p>
        </div>
      </div>

      <!-- 近期考试方块 -->
      <div class="feature-card" @click="navigateTo('exam')">
        <div class="card-icon purple">
          <el-icon :size="32">
            <Document />
          </el-icon>
        </div>
        <div class="card-content">
          <h3 class="card-title">近期考试</h3>
          <div class="card-value">{{ examCount }}</div>
          <p class="card-desc">点击查看所有考试</p>
        </div>
      </div>

      <!-- 学习计划方块 -->
      <div class="feature-card" @click="navigateTo('schedule')">
        <div class="card-icon green">
          <el-icon :size="32">
            <Calendar />
          </el-icon>
        </div>
        <div class="card-content">
          <h3 class="card-title">学习计划</h3>
          <div class="card-value">{{ planCount }}</div>
          <p class="card-desc">点击查看学习计划</p>
        </div>
      </div>
    </div>

    <!-- 最近的课程和作业 -->
    <div class="recent-section">
      <!-- 最近的课程 -->
      <el-card shadow="hover" class="recent-card">
        <template #header>
          <div class="card-header">
            <h3>最近课程</h3>
            <el-button text @click="navigateTo('course')">查看全部</el-button>
          </div>
        </template>
        <div class="recent-list">
          <div v-if="loading" class="loading-container">
            <el-skeleton :rows="3" animated />
          </div>
          <div v-else-if="courses.length === 0" class="empty-tip">
            <el-empty description="暂无课程" :image-size="60"></el-empty>
            <el-button type="primary" size="small" class="add-course-btn" @click="showInviteCodeInput">
              添加课程
            </el-button>
          </div>
          <div v-else>
            <div v-for="(course, index) in recentCourses" :key="index" class="recent-item" @click="enterCourse(course)">
              <div class="item-icon" :style="{ backgroundColor: getRandomColor(index) }">
                <el-icon>
                  <Reading />
                </el-icon>
              </div>
              <div class="item-content">
                <div class="item-title">{{ course.name }}</div>
                <div class="item-subtitle">{{ course.teacherName }}</div>
              </div>
              <div class="item-action">
                <el-button link type="primary">进入</el-button>
              </div>
            </div>
          </div>
        </div>
      </el-card>

      <!-- 最近的作业 -->
      <el-card shadow="hover" class="recent-card">
        <template #header>
          <div class="card-header">
            <h3>近期作业</h3>
            <el-button text @click="navigateTo('assignment')">查看全部</el-button>
          </div>
        </template>
        <div class="recent-list">
          <div v-if="loading" class="loading-container">
            <el-skeleton :rows="3" animated />
          </div>
          <div v-else-if="assignments.length === 0" class="empty-tip">
            <el-empty description="暂无作业" :image-size="60"></el-empty>
          </div>
          <div v-else>
            <div v-for="(assignment, index) in recentAssignments" :key="index" class="recent-item"
              @click="startAssignment(assignment)">
              <div class="item-icon orange">
                <el-icon>
                  <Notebook />
                </el-icon>
              </div>
              <div class="item-content">
                <div class="item-title">{{ assignment.title }}</div>
                <div class="item-subtitle">
                  <span class="deadline-info">
                    <el-icon><Timer /></el-icon>
                    {{ assignment.courseName }} · 截止: {{ formatDate(assignment.deadline) }}
                  </span>
                </div>
              </div>
              <div class="item-status">
                <el-tag :type="getAssignmentStatusType(assignment.daysLeft)" size="small">
                  {{ getAssignmentStatusText(assignment.daysLeft) }}
                </el-tag>
              </div>
            </div>
          </div>
        </div>
      </el-card>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, onUnmounted, computed } from 'vue'
import { useRouter } from 'vue-router'
import { ElMessage } from 'element-plus'
import { Reading, Notebook, Document, Calendar, Timer } from '@element-plus/icons-vue'
import { courseSelectionAPI, studentExamAPI, learningPlanAPI } from '@/api/api'
import { getUserInfo } from '@/utils/auth'

// 配置ElMessage默认选项
ElMessage.closeAll() // 关闭所有消息，避免堆积
// 消息配置
const messageConfig = {
  duration: 2000,  // 显示时间，单位ms
  showClose: true, // 显示关闭按钮
  customClass: 'custom-message', // 自定义类名
}

// 错误消息配置
const errorMessageConfig = {
  ...messageConfig,
  duration: 3000, // 错误消息显示3秒后自动消失
  showClose: true,
  customClass: 'custom-message error-message'
}

// 错误消息状态跟踪
const errorState = {
  hasShownError: false,
  lastErrorTime: 0,
  errorDebounceTime: 5000, // 错误消息防抖时间(毫秒)
}

// 增强showMessage函数，确保在任何情况下都能显示消息
const showMessage = (type, message) => {
  if (!message) return
  
  // 对于错误消息进行防抖处理
  if (type === 'error') {
    const now = Date.now()
    
    // 如果已经显示过错误且在防抖时间内，则不再显示
    if (errorState.hasShownError && (now - errorState.lastErrorTime < errorState.errorDebounceTime)) {
      console.log('错误消息已显示，忽略重复错误:', message)
      return
    }
    
    // 更新错误状态
    errorState.hasShownError = true
    errorState.lastErrorTime = now
  }
  
  try {
    // 防止多个错误消息堆积
    ElMessage.closeAll()
    
    switch(type) {
      case 'success':
        ElMessage({
          message,
          type: 'success',
          ...messageConfig,
          customClass: 'custom-message success-message'
        })
        break
      case 'warning':
        ElMessage({
          message,
          type: 'warning',
          ...messageConfig,
          customClass: 'custom-message warning-message'
        })
        break
      case 'info':
        ElMessage({
          message,
          type: 'info',
          ...messageConfig,
          customClass: 'custom-message info-message'
        })
        break
      case 'error':
        ElMessage({
          message,
          type: 'error',
          ...errorMessageConfig // 使用错误消息专用配置
        })
        break
      default:
        ElMessage({
          message,
          ...messageConfig,
          customClass: 'custom-message default-message'
        })
    }
  } catch (err) {
    // 如果Element Plus消息组件出错，降级为console输出
    console.log(`[${type}] ${message}`)
    
    // 尝试使用原生alert作为最后的降级方案(仅用于错误消息)
    if (type === 'error') {
      setTimeout(() => {
        try {
          alert(message)
        } catch (e) {
          console.error('无法显示消息:', e)
        }
      }, 0)
    }
  }
}

const router = useRouter()
const userInfo = ref(null) // 改为ref，不再使用inject

// 状态变量
const loading = ref(true)
const courses = ref([])
const assignments = ref([])
const exams = ref([])
const plans = ref([])
const currentDate = ref('')
const currentTime = ref('')

// 记录API错误状态，避免重复提示
const apiErrorShown = {
  courses: false,
  assignments: false,
  exams: false,
  plans: false
}

// 计算属性
const courseCount = computed(() => courses.value.length)
const assignmentCount = computed(() => assignments.value.length)
const examCount = computed(() => exams.value.length)
const planCount = computed(() => plans.value.length)
const recentCourses = computed(() => courses.value.slice(0, 3))
const recentAssignments = computed(() => assignments.value.slice(0, 3))

// 颜色列表，用于课程卡片
const colors = [
  '#4B8DE6', '#67C23A', '#E6A23C', '#F56C6C',
  '#909399', '#9B59B6', '#3498DB', '#2ECC71',
  '#1ABC9C', '#F39C12', '#E74C3C', '#34495E'
]

// 获取随机颜色
function getRandomColor(index) {
  return colors[index % colors.length]
}

// 格式化日期
function formatDate(dateString) {
  const date = new Date(dateString)
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`
}

// 更新当前时间
function updateCurrentTime() {
  const now = new Date()
  const year = now.getFullYear()
  const month = String(now.getMonth() + 1).padStart(2, '0')
  const day = String(now.getDate()).padStart(2, '0')
  const hours = String(now.getHours()).padStart(2, '0')
  const minutes = String(now.getMinutes()).padStart(2, '0')
  const seconds = String(now.getSeconds()).padStart(2, '0')

  currentDate.value = `${year}年${month}月${day}日`
  currentTime.value = `${hours}:${minutes}:${seconds}`
}

// 获取作业状态类型
function getAssignmentStatusType(daysLeft) {
  if (daysLeft < 0) return 'danger'
  if (daysLeft <= 1) return 'warning'
  if (daysLeft <= 3) return 'info'
  return 'success'
}

// 获取作业状态文本
function getAssignmentStatusText(daysLeft) {
  if (daysLeft < 0) return '已逾期'
  if (daysLeft === 0) return '今日截止'
  if (daysLeft === 1) return '明日截止'
  return `剩余${daysLeft}天`
}

// 导航到不同页面
function navigateTo(page) {
  switch (page) {
    case 'course':
      router.push('/student/course')
      break
    case 'assignment':
      router.push('/student/homework')
      break
    case 'exam':
      router.push('/student/exam')
      break
    case 'schedule':
      router.push('/student/schedule')
      break
    default:
      break
  }
}

// 进入课程
function enterCourse(course) {
  router.push(`/student/course/${course.id}`)
  showMessage('success', `正在进入课程: ${course.name}`)
}

// 开始作业
function startAssignment(assignment) {
  router.push(`/student/assignment/${assignment.id}`)
  showMessage('success', `开始完成作业: ${assignment.title}`)
}

// 显示邀请码输入框
function showInviteCodeInput() {
  showMessage('info', '请在顶部导航栏输入邀请码加入课程')
}

// 获取学生课程数据
async function fetchStudentCourses(isRetry = false) {
  if (!userInfo.value || !userInfo.value.studentId) {
    console.warn('未找到学生ID，无法获取课程数据')
    loading.value = false
    courses.value = []
    return
  }

  try {
    const response = await Promise.race([
      courseSelectionAPI.getStudentCourses(userInfo.value.studentId),
      new Promise((_, reject) => setTimeout(() => reject(new Error('请求超时')), 5000))
    ])
    
    // 处理服务器返回空数据的情况
    if (!response || !Array.isArray(response) || response.length === 0) {
      console.warn('服务器返回的课程数据为空或格式不正确:', response)
      courses.value = []
      return
    }
    
    courses.value = response.map(course => ({
      id: course.courseId,
      name: course.courseName || '未命名课程',
      teacherName: course.teacherName || '未知教师',
      completionRate: course.completionRate || 0
    }))
    
    // 重置错误状态
    apiErrorShown.courses = false
  } catch (error) {
    console.error('获取学生课程失败:', error)
    courses.value = []
    
    // 只在首次错误时显示提示，避免重试时重复提示
    if (!isRetry && !apiErrorShown.courses) {
      apiErrorShown.courses = true
      
      // 只有在401/403错误时才提示用户重新登录
      if (error.response && (error.response.status === 401 || error.response.status === 403)) {
        showMessage('error', '登录已过期，请重新登录')
        setTimeout(() => {
          router.push('/login')
        }, 1000)
      } else {
        // 显示通用错误消息
        showMessage('error', '服务器错误，请稍后再试')
      }
    }
  } finally {
    loading.value = false
  }
}

// 获取未完成作业数据
async function fetchAssignments(isRetry = false) {
  if (!userInfo.value || !userInfo.value.studentId) {
    console.warn('未找到学生ID，无法获取作业数据')
    assignments.value = []
    return
  }

  try {
    // 这里应该调用作业相关API，但目前API中没有直接获取作业的方法
    // 暂时设置为空数组
    assignments.value = []
    
    // 当后端提供作业API后，可以使用类似以下代码：
    // const response = await Promise.race([
    //   homeworkAPI.getUnfinishedHomework(userInfo.value.studentId),
    //   new Promise((_, reject) => setTimeout(() => reject(new Error('请求超时')), 5000))
    // ])
    // assignments.value = response.map(hw => ({
    //   id: hw.id,
    //   title: hw.title,
    //   courseName: hw.courseName,
    //   deadline: hw.deadline,
    //   daysLeft: calculateDaysLeft(hw.deadline)
    // }))
    
    // 重置错误状态
    apiErrorShown.assignments = false
  } catch (error) {
    console.error('获取作业数据失败:', error)
    assignments.value = []
    
    // 只在首次错误时显示提示
    if (!isRetry && !apiErrorShown.assignments) {
      apiErrorShown.assignments = true
      
      // 只有在401/403错误时才提示用户重新登录
      if (error.response && (error.response.status === 401 || error.response.status === 403)) {
        showMessage('error', '登录已过期，请重新登录')
        setTimeout(() => {
          router.push('/login')
        }, 1000)
      } else {
        // 显示通用错误消息，但避免重复显示
        if (!errorState.hasShownError) {
          showMessage('error', '服务器错误，请稍后再试')
        }
      }
    }
  }
}

// 获取近期考试数据
async function fetchExams(isRetry = false) {
  if (!userInfo.value || !userInfo.value.studentId) {
    console.warn('未找到学生ID，无法获取考试数据')
    exams.value = []
    return
  }

  try {
    const response = await Promise.race([
      studentExamAPI.getStudentExamScores(userInfo.value.studentId, ""),
      new Promise((_, reject) => setTimeout(() => reject(new Error('请求超时')), 5000))
    ])
    
    // 处理服务器返回空数据的情况
    if (!response || (Array.isArray(response) && response.length === 0)) {
      console.warn('服务器返回的考试数据为空')
      exams.value = []
      return
    }
    
    // 确保response是数组
    const examData = Array.isArray(response) ? response : [response].filter(Boolean)
    
    // 处理API返回的数据
    exams.value = examData.map(exam => ({
      id: exam.examId,
      title: exam.examTitle || exam.title || '未命名考试',
      courseName: exam.courseName || '未知课程',
      examTime: exam.examTime || exam.startTime,
      daysLeft: calculateDaysLeft(exam.examTime || exam.startTime)
    }))
    
    // 重置错误状态
    apiErrorShown.exams = false
  } catch (error) {
    console.error('获取考试数据失败:', error)
    exams.value = []
    
    // 只在首次错误时显示提示
    if (!isRetry && !apiErrorShown.exams) {
      apiErrorShown.exams = true
      
      // 只有在401/403错误时才提示用户重新登录
      if (error.response && (error.response.status === 401 || error.response.status === 403)) {
        showMessage('error', '登录已过期，请重新登录')
        setTimeout(() => {
          router.push('/login')
        }, 1000)
      } else {
        // 显示通用错误消息，但避免重复显示
        if (!errorState.hasShownError) {
          showMessage('error', '服务器错误，请稍后再试')
        }
      }
    }
  }
}

// 获取学习计划数据
async function fetchPlans(isRetry = false) {
  if (!userInfo.value || !userInfo.value.studentId) {
    console.warn('未找到学生ID，无法获取学习计划数据')
    plans.value = []
    return
  }

  try {
    const response = await Promise.race([
      learningPlanAPI.getCurrentLearningPlan(userInfo.value.studentId),
      new Promise((_, reject) => setTimeout(() => reject(new Error('请求超时')), 5000))
    ])
    
    // 处理服务器返回空数据的情况
    if (!response) {
      console.warn('服务器返回的学习计划数据为空')
      plans.value = []
      return
    }
    
    // 如果返回的是单个计划对象，将其转换为数组
    const plansData = Array.isArray(response) ? response : [response].filter(Boolean)
    
    // 如果返回的数组为空，设置为空数组
    if (plansData.length === 0) {
      plans.value = []
      return
    }
    
    // 处理API返回的数据
    plans.value = plansData.map(plan => ({
      id: plan.planId,
      title: plan.title || plan.planName || '未命名计划',
      courseName: plan.courseName || '未知课程',
      completionRate: plan.completionRate || plan.progress || 0
    })).filter(plan => plan.id) // 过滤掉无效的计划
    
    // 重置错误状态
    apiErrorShown.plans = false
  } catch (error) {
    console.error('获取学习计划数据失败:', error)
    plans.value = []
    
    // 只在首次错误时显示提示
    if (!isRetry && !apiErrorShown.plans) {
      apiErrorShown.plans = true
      
      // 只有在401/403错误时才提示用户重新登录
      if (error.response && (error.response.status === 401 || error.response.status === 403)) {
        showMessage('error', '登录已过期，请重新登录')
        setTimeout(() => {
          router.push('/login')
        }, 1000)
      } else {
        // 显示通用错误消息，但避免重复显示
        if (!errorState.hasShownError) {
          showMessage('error', '服务器错误，请稍后再试')
        }
      }
    }
  }
}

// 计算截止日期剩余天数
function calculateDaysLeft(dateString) {
  const targetDate = new Date(dateString)
  const today = new Date()
  
  // 重置时间部分以便准确计算天数差异
  today.setHours(0, 0, 0, 0)
  targetDate.setHours(0, 0, 0, 0)
  
  // 计算毫秒差并转换为天数
  const diffTime = targetDate - today
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))
  
  return diffDays
}

// 定时器ID
let timeInterval = null

// 组件挂载时获取数据
onMounted(() => {
  // 捕获全局错误
  window.addEventListener('error', (event) => {
    console.error('全局错误:', event.error)
    // 不显示弹窗，只记录错误
  })
  
  // 捕获未处理的Promise错误
  window.addEventListener('unhandledrejection', (event) => {
    console.error('未处理的Promise错误:', event.reason)
    // 不显示弹窗，只记录错误
  })

  // 初始化时间
  updateCurrentTime()
  // 启动时间更新定时器
  timeInterval = setInterval(updateCurrentTime, 1000)

  try {
    // 从localStorage获取用户信息
    userInfo.value = getUserInfo()
    if (!userInfo.value) {
      console.error('无法获取用户信息，请检查登录状态')
      showMessage('error', '无法获取用户信息，请重新登录')
      setTimeout(() => {
        router.push('/login')
      }, 1000)
      return
    }
    
    console.log('获取到用户信息:', userInfo.value)

    // 重置错误状态
    errorState.hasShownError = false
    
    // 获取数据 - 使用Promise.all并添加错误处理
    Promise.all([
      fetchStudentCourses().catch(err => {
        console.error('课程数据加载错误:', err)
        courses.value = [] // 使用空数组
      }),
      fetchAssignments().catch(err => {
        console.error('作业数据加载错误:', err)
        assignments.value = [] // 使用空数组
      }),
      fetchExams().catch(err => {
        console.error('考试数据加载错误:', err)
        exams.value = [] // 使用空数组
      }),
      fetchPlans().catch(err => {
        console.error('学习计划加载错误:', err)
        plans.value = [] // 使用空数组
      })
    ]).catch(error => {
      console.error('数据加载过程中发生错误:', error)
      // 确保所有数据都有默认值
      courses.value = courses.value.length ? courses.value : []
      assignments.value = assignments.value.length ? assignments.value : []
      exams.value = exams.value.length ? exams.value : []
      plans.value = plans.value.length ? plans.value : []
    }).finally(() => {
      loading.value = false // 无论如何都结束加载状态
    })
  } catch (error) {
    console.error('组件挂载过程中发生错误:', error)
    loading.value = false // 确保加载状态结束
    
    // 确保所有数据都有默认值
    courses.value = []
    assignments.value = []
    exams.value = []
    plans.value = []
  }

  // 添加刷新课程列表的事件监听器
  window.addEventListener('refresh-courses', fetchStudentCourses)
})

// 组件卸载时清理
onUnmounted(() => {
  // 清除时间更新定时器
  if (timeInterval) {
    clearInterval(timeInterval)
  }
  // 移除事件监听器
  window.removeEventListener('refresh-courses', fetchStudentCourses)
})
</script>

<style scoped>
.student-home {
  padding: 0;
}

/* 欢迎区域样式 */
.welcome-section {
  display: flex;
  background: linear-gradient(135deg, #4B8DE6, #6A5ACD);
  border-radius: 12px;
  padding: 32px 40px;
  margin-bottom: 24px;
  color: white;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
  overflow: hidden;
  position: relative;
}

.welcome-content {
  flex: 1;
  z-index: 2;
}

.welcome-title {
  font-size: 28px;
  margin: 0 0 8px 0;
  font-weight: 600;
}

.welcome-subtitle {
  font-size: 16px;
  margin: 0 0 16px 0;
  opacity: 0.9;
}

.current-time {
  font-size: 14px;
  opacity: 0.8;
  background: rgba(255, 255, 255, 0.2);
  display: inline-block;
  padding: 6px 12px;
  border-radius: 20px;
}

.welcome-decoration {
  position: absolute;
  right: 40px;
  top: 50%;
  transform: translateY(-50%);
  opacity: 0.3;
}

.decoration-icon {
  color: white;
}

/* 功能方块区域 */
.feature-grid {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 20px;
  margin-bottom: 24px;
}

.feature-card {
  background: white;
  border-radius: 12px;
  padding: 24px;
  display: flex;
  flex-direction: column;
  align-items: center;
  text-align: center;
  cursor: pointer;
  transition: all 0.3s;
  box-shadow: 0 2px 12px 0 rgba(0, 0, 0, 0.05);
}

.feature-card:hover {
  transform: translateY(-5px);
  box-shadow: 0 8px 16px rgba(0, 0, 0, 0.1);
}

.card-icon {
  width: 64px;
  height: 64px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  margin-bottom: 16px;
  color: white;
}

.blue {
  background-color: #4B8DE6;
}

.orange {
  background-color: #E6A23C;
}

.purple {
  background-color: #8E44AD;
}

.green {
  background-color: #67C23A;
}

.card-content {
  width: 100%;
}

.card-title {
  font-size: 16px;
  color: #606266;
  margin: 0 0 8px 0;
}

.card-value {
  font-size: 32px;
  font-weight: bold;
  color: #303133;
  margin-bottom: 8px;
}

.card-desc {
  font-size: 12px;
  color: #909399;
  margin: 0;
}

/* 最近区域样式 */
.recent-section {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 20px;
}

.recent-card {
  border-radius: 8px;
  box-shadow: 0 2px 12px 0 rgba(0, 0, 0, 0.05);
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.card-header h3 {
  font-size: 18px;
  font-weight: 500;
  margin: 0;
  color: #303133;
}

.loading-container {
  padding: 20px 0;
}

.empty-tip {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 30px 0;
}

.add-course-btn {
  margin-top: 16px;
}

.recent-list {
  display: flex;
  flex-direction: column;
}

.recent-item {
  display: flex;
  align-items: center;
  padding: 12px 0;
  border-bottom: 1px solid #EBEEF5;
  cursor: pointer;
  transition: background-color 0.2s;
}

.recent-item:last-child {
  border-bottom: none;
}

.recent-item:hover {
  background-color: #F5F7FA;
}

.item-icon {
  width: 40px;
  height: 40px;
  border-radius: 8px;
  display: flex;
  align-items: center;
  justify-content: center;
  margin-right: 16px;
  color: white;
}

.item-content {
  flex: 1;
}

.item-title {
  font-size: 16px;
  font-weight: 500;
  color: #303133;
  margin-bottom: 4px;
}

.item-subtitle {
  font-size: 12px;
  color: #909399;
}

.item-action,
.item-status {
  margin-left: 16px;
}

/* 响应式调整 */
@media (max-width: 1200px) {
  .feature-grid {
    grid-template-columns: repeat(2, 1fr);
  }
}

@media (max-width: 768px) {

  .feature-grid,
  .recent-section {
    grid-template-columns: 1fr;
  }

  .welcome-section {
    flex-direction: column;
    padding: 24px;
  }

  .welcome-decoration {
    display: none;
  }
}

.deadline-info {
  display: flex;
  align-items: center;
  gap: 4px;
  color: #909399;
}

.deadline-info .el-icon {
  font-size: 14px;
  color: #E6A23C;
}
</style>

<style>
/* 全局样式，确保Element Plus消息正确显示 */
.custom-message {
  z-index: 9999 !important;
  min-width: 120px !important;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15) !important;
  padding: 10px 15px !important;
}

.el-message {
  top: 60px !important;
}

.el-message__content {
  font-size: 14px !important;
  line-height: 1.4 !important;
}

/* 错误消息特殊样式 */
.error-message {
  background-color: #fef0f0 !important;
  border-color: #fde2e2 !important;
  animation: fadeInOut 3s ease-in-out forwards;
}

/* 确保消息组件在所有内容之上 */
.el-message-box {
  z-index: 10000 !important;
}

/* 消息淡入淡出动画 */
@keyframes fadeInOut {
  0% { opacity: 0; }
  10% { opacity: 1; }
  90% { opacity: 1; }
  100% { opacity: 0; }
}
</style>