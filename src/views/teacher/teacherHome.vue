<template>
  <div class="teacher-home-container">
    <div class="student-home">
      <!-- 欢迎区域 -->
      <div class="welcome-section">
        <div class="welcome-content">
          <h1 class="welcome-title">你好，{{ userInfo?.fullName + '老师' }}</h1>
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
        <!-- 课程管理方块 -->
        <div class="feature-card" @click="navigateTo('/teacher/course')">
          <div class="card-icon blue">
            <el-icon :size="32">
              <Reading />
            </el-icon>
          </div>
          <div class="card-content">
            <h3 class="card-title">课程管理</h3>
            <div class="card-value">{{ courseCount }}</div>
            <p class="card-desc">管理您的所有课程</p>
          </div>
        </div>

        <!-- 知识点管理方块 -->
        <div class="feature-card" @click="navigateTo('/teacher/knowledge')">
          <div class="card-icon orange">
            <el-icon :size="32">
              <User />
            </el-icon>
          </div>
          <div class="card-content">
            <h3 class="card-title">知识点管理</h3>
            <div class="card-value">{{ knowledgeCount }}</div>
            <p class="card-desc">管理您的所有知识点</p>
          </div>
        </div>

        <!-- 考试管理方块 -->
        <div class="feature-card" @click="navigateTo('/teacher/exam')">
          <div class="card-icon purple">
            <el-icon :size="32">
              <Document />
            </el-icon>
          </div>
          <div class="card-content">
            <h3 class="card-title">考试管理</h3>
            <div class="card-value">{{ examCount }}</div>
            <p class="card-desc">管理您的所有考试</p>
          </div>
        </div>

        <!-- 作业管理方块 -->
        <div class="feature-card" @click="navigateTo('/teacher/homework')">
          <div class="card-icon green">
            <el-icon :size="32">
              <EditPen />
            </el-icon>
          </div>
          <div class="card-content">
            <h3 class="card-title">作业管理</h3>
            <div class="card-value">{{ homeworkCount }}</div>
            <p class="card-desc">管理您的所有作业</p>
          </div>
        </div>
      </div>

      <!-- 最近的课程和考试 -->
      <div class="recent-section">
        <!-- 最近的课程 -->
        <el-card shadow="hover" class="recent-card">
          <template #header>
            <div class="card-header">
              <h3>我的课程</h3>
              <el-button text @click="navigateTo('/teacher/course')">查看全部</el-button>
            </div>
          </template>
          <div class="recent-list">
            <div v-if="loading" class="loading-container">
              <el-skeleton :rows="3" animated />
            </div>
            <div v-else-if="courses.length === 0" class="empty-tip">
              <el-empty description="暂无课程" :image-size="60"></el-empty>
              <el-button type="primary" size="small" class="add-course-btn" @click="navigateTo('/teacher/course/create')">
                创建课程
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
                  <div class="item-subtitle">
                    <span>课程编码: {{ course.code || '无' }}</span>
                    <span class="item-category" v-if="course.category">{{ course.category }}</span>
                  </div>
                  <div class="item-credit" v-if="course.credit">
                    学分: {{ course.credit }}
                  </div>
                </div>
                <div class="item-status">
                  <el-tag size="small" :type="getCourseStatusType(course.status)">
                    {{ getCourseStatusText(course.status) }}
                  </el-tag>
                </div>
              </div>
            </div>
          </div>
        </el-card>

        <!-- 最近的考试 -->
        <el-card shadow="hover" class="recent-card">
          <template #header>
            <div class="card-header">
              <h3>近期考试</h3>
              <el-button text @click="navigateTo('/teacher/exam')">查看全部</el-button>
            </div>
          </template>
          <div class="recent-list">
            <div v-if="loading" class="loading-container">
              <el-skeleton :rows="3" animated />
            </div>
            <div v-else-if="exams.filter(item => item.type === 'exam').length === 0" class="empty-tip">
              <el-empty description="暂无考试" :image-size="60"></el-empty>
            </div>
            <div v-else>
              <div v-for="(exam, index) in recentExams" :key="index" class="recent-item" @click="manageExam(exam)">
                <div class="item-icon purple">
                  <el-icon>
                    <Document />
                  </el-icon>
                </div>
                <div class="item-content">
                  <div class="item-title">{{ exam.title }}</div>
                  <div class="item-subtitle">
                    <span class="deadline-info">
                      <el-icon><Timer /></el-icon>
                      {{ exam.courseName || '未知课程' }} · 时长: {{ exam.durationMinutes || '--' }}分钟
                    </span>
                  </div>
                  <div class="item-details">
                    <span class="item-time">开始: {{ formatDate(exam.startTime) }}</span>
                    <span class="item-score">总分: {{ exam.totalScore || '--' }}</span>
                  </div>
                </div>
                <div class="item-status">
                  <el-tag :type="getExamStatusType(exam)" size="small">
                    {{ getExamStatusText(exam) }}
                  </el-tag>
                </div>
              </div>
            </div>
          </div>
        </el-card>
      </div>

      <!-- 最近的作业 -->
      <div class="recent-section-full">
        <el-card shadow="hover" class="recent-card">
          <template #header>
            <div class="card-header">
              <h3>近期作业</h3>
            </div>
          </template>
          <div class="recent-list">
            <div v-if="loading" class="loading-container">
              <el-skeleton :rows="3" animated />
            </div>
            <div v-else-if="recentHomeworks.length === 0" class="empty-tip">
              <el-empty description="暂无作业" :image-size="60"></el-empty>
            </div>
            <div v-else>
              <div v-for="(homework, index) in recentHomeworks" :key="index" class="recent-item" @click="manageHomework(homework)">
                <div class="item-icon green">
                  <el-icon>
                    <EditPen />
                  </el-icon>
                </div>
                <div class="item-content">
                  <div class="item-title">{{ homework.title }}</div>
                  <div class="item-subtitle">
                    <span class="deadline-info">
                      <el-icon><Timer /></el-icon>
                      {{ homework.courseName || '未知课程' }}
                    </span>
                  </div>
                  <div class="item-details">
                    <span class="item-score">总分: {{ homework.totalScore || '--' }}</span>
                    <span v-if="homework.description" class="item-description">{{ homework.description }}</span>
                  </div>
                </div>
                <div class="item-status">
                  <el-tag :type="getHomeworkStatusType(homework)" size="small">
                    {{ homework.status || '未设置状态' }}
                  </el-tag>
                </div>
              </div>
            </div>
          </div>
        </el-card>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, onUnmounted, computed, inject } from 'vue'
import { useRouter } from 'vue-router'
import { ElMessage } from 'element-plus'
import { Reading, EditPen, Document, User, Timer } from '@element-plus/icons-vue'
import { courseAPI, examAPI, knowledgeAPI, assignmentAPI, problemAPI } from '@/api/api'
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

// 注入setActiveMenu方法
const setActiveMenu = inject('setActiveMenu', null)

// 状态变量
const loading = ref(true)
const courses = ref([])
const exams = ref([])
const knowledgePoints = ref([])
// const homeworks = ref([])
const currentDate = ref('')
const currentTime = ref('')
const recentHomeworks = ref([])

// 记录API错误状态，避免重复提示
const apiErrorShown = {
  courses: false,
  exams: false,
  knowledge: false,
  homeworks: false
}

// 计算属性
const courseCount = computed(() => courses.value.length)
const examCount = computed(() => exams.value.filter(item => item.type === 'exam').length)
const knowledgeCount = computed(() => knowledgePoints.value.length)
const homeworkCount = computed(() => exams.value.filter(item => item.type === 'homework').length)

// 按更新时间排序的最近课程（最多3个）
const recentCourses = computed(() => {
  // 复制数组以避免修改原始数据
  const sortedCourses = [...courses.value]
  
  // 根据updateTime字段排序，最新的排在前面
  sortedCourses.sort((a, b) => {
    const timeA = a.updateTime ? new Date(a.updateTime).getTime() : 0
    const timeB = b.updateTime ? new Date(b.updateTime).getTime() : 0
    return timeB - timeA // 降序排列
  })
  
  // 只返回前3个
  return sortedCourses.slice(0, 3)
})

// 按更新时间排序的最近考试（最多3个）
const recentExams = computed(() => {
  // 复制数组以避免修改原始数据，并只筛选类型为exam的数据
  const sortedExams = [...exams.value].filter(item => item.type === 'exam')
  
  // 根据updateTime字段排序，最新的排在前面
  sortedExams.sort((a, b) => {
    const timeA = a.updateTime ? new Date(a.updateTime).getTime() : 0
    const timeB = b.updateTime ? new Date(b.updateTime).getTime() : 0
    return timeB - timeA // 降序排列
  })
  
  // 只返回前3个
  return sortedExams.slice(0, 3)
})

// 删除 computed 版本，保留 ref 版本 recentHomeworks

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

// 获取考试状态类型
function getExamStatusType(exam) {
  const now = new Date()
  const startTime = new Date(exam.startTime)
  const endTime = new Date(exam.endTime)
  
  if (now > endTime) return 'info'
  if (now >= startTime && now <= endTime) return 'success'
  
  // 计算天数差
  const daysToStart = Math.floor((startTime - now) / (1000 * 60 * 60 * 24))
  
  if (daysToStart <= 1) return 'warning'
  if (daysToStart <= 3) return 'primary'
  return 'info'
}

// 获取考试状态文本
function getExamStatusText(exam) {
  const now = new Date()
  const startTime = new Date(exam.startTime)
  const endTime = new Date(exam.endTime)
  
  if (now > endTime) return '已结束'
  if (now >= startTime && now <= endTime) return '进行中'
  
  // 计算天数差
  const daysToStart = Math.floor((startTime - now) / (1000 * 60 * 60 * 24))
  
  if (daysToStart === 0) return '今日开始'
  if (daysToStart === 1) return '明日开始'
  return `${daysToStart}天后开始`
}

// 获取课程状态类型
function getCourseStatusType(status) {
  switch (Number(status)) {
    case 1:
      return 'success' // 已激活
    case 2:
      return 'warning' // 已暂停
    default:
      return 'info' // 未设置或其他状态
  }
}

// 获取课程状态文本
function getCourseStatusText(status) {
  switch (Number(status)) {
    case 1:
      return '已激活'
    case 2:
      return '已暂停'
    default:
      return '未设置'
  }
}

// 导航到指定页面
function navigateTo(path) {
  if (setActiveMenu) {
    // 根据路径设置导航栏选中状态
    if (path.includes('course')) {
      setActiveMenu('课程')
    } else if (path.includes('exam')) {
      setActiveMenu('考试')
    } else if (path.includes('knowledge')) {
      setActiveMenu('知识点')
    } else if (path.includes('homework')) {
      setActiveMenu('作业')
    }
  }
  
  // 导航到目标路径
  router.push(path)
}

// 进入课程
function enterCourse(course) {
  // 确保课程ID是有效的数字
  if (!course || !course.id || isNaN(Number(course.id))) {
    showMessage('error', '无效的课程ID，无法访问课程详情')
    return
  }
  
  // 更新左侧导航栏选中状态
  if (setActiveMenu) {
    setActiveMenu('课程')
  }
  
  // 使用教师专用路由
  router.push(`/teacher/course/${course.id}`)
  showMessage('success', `正在管理课程: ${course.name}`)
}

// 管理考试
function manageExam(exam) {
  // 确保考试ID是有效的数字
  if (!exam || !exam.examId || isNaN(Number(exam.examId))) {
    showMessage('error', '无效的考试ID，无法访问考试详情')
    return
  }
  
  // 更新左侧导航栏选中状态
  if (setActiveMenu) {
    setActiveMenu('考试')
  }
  
  // 使用教师专用路由
  router.push(`/teacher/exam/${exam.examId}`)
  showMessage('success', `正在管理考试: ${exam.title}`)
}

// 管理作业
function manageHomework(homework) {
  // 确保作业ID是有效的数字
  if (!homework || !homework.assignmentId || isNaN(Number(homework.assignmentId))) {
    showMessage('error', '无效的作业ID，无法访问作业详情')
    return
  }
  
  // 更新左侧导航栏选中状态
  if (setActiveMenu) {
    setActiveMenu('作业')
  }
  
  // 使用教师专用路由
  router.push(`/teacher/homework/${homework.assignmentId}`)
  showMessage('success', `正在管理作业: ${homework.title}`)
}

// 获取教师课程数据
async function fetchTeacherCourses(isRetry = false) {
  if (!userInfo.value || !userInfo.value.teacherId) {
    console.warn('未找到教师ID，无法获取课程数据')
    loading.value = false
    courses.value = []
    return
  }

  try {
    // 使用教师ID获取该教师的课程
    const teacherId = userInfo.value.teacherId
    console.log('正在获取教师课程，教师ID:', teacherId)
    
    // 使用教师专用API获取课程数据
    const response = await Promise.race([
      courseAPI.getAllCourses(), // 获取所有课程，这里假设后端会根据教师token限制返回结果
      new Promise((_, reject) => setTimeout(() => reject(new Error('请求超时')), 5000))
    ])
    
    // 处理服务器返回空数据的情况
    if (!response || !Array.isArray(response) || response.length === 0) {
      console.warn('服务器返回的课程数据为空或格式不正确:', response)
      courses.value = []
      return
    }
    
    // 存储已经处理过的课程ID，避免重复
    const processedCourseIds = new Set()
    const courseList = []
    
    // 处理返回的课程数据
    response.forEach(item => {
      // 获取课程ID
      const courseId = item.id || item.courseId
      
      // 确保课程ID有效且未处理过
      if (courseId && !isNaN(Number(courseId)) && !processedCourseIds.has(courseId)) {
        processedCourseIds.add(courseId)
        
        // 构建课程对象
        courseList.push({
          id: courseId,
          name: item.name || '未命名课程',
          code: item.code || '',
          description: item.description || '',
          credit: item.credit || 0,
          category: item.category || '',
          createTime: item.createTime || '',
          updateTime: item.updateTime || new Date().toISOString(), // 确保有updateTime字段
          status: item.status || 0
        })
      }
    })
    
    courses.value = courseList
    console.log('处理后的教师课程数据:', courses.value)
    
    // 重置错误状态
    apiErrorShown.courses = false
  } catch (error) {
    console.error('获取教师课程失败:', error)
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

// 获取考试数据
async function fetchExams(isRetry = false) {
  if (!userInfo.value || !userInfo.value.teacherId) {
    console.warn('未找到教师ID，无法获取考试数据')
    exams.value = []
    return
  }

  try {
    const teacherId = userInfo.value.teacherId
    console.log('正在获取教师考试数据，教师ID:', teacherId)
    
    const response = await Promise.race([
      examAPI.getExamsByTeacher(teacherId), // 教师专用API获取考试
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
    
    // 处理API返回的数据，并确保ID是有效的数字
    exams.value = examData.map(exam => {
      // 确保考试ID是有效数字
      const examId = exam.examId || exam.id
      if (!examId || isNaN(Number(examId))) {
        console.warn('发现无效的考试ID:', examId, exam)
        return null // 返回null以便后续过滤
      }
      
      return {
        examId: examId,
        title: exam.title || '未命名考试',
        courseName: exam.courseName || '未知课程',
        startTime: exam.startTime,
        endTime: exam.endTime,
        status: exam.status,
        updateTime: exam.updateTime || exam.createdAt || new Date().toISOString(), // 确保有updateTime字段
        type: exam.type || 'exam', // 保存type字段，默认为exam
        durationMinutes: exam.durationMinutes || (exam.startTime && exam.endTime ? 
          Math.floor((new Date(exam.endTime) - new Date(exam.startTime)) / 60000) : '--'),
        totalScore: exam.totalScore || '--',
        description: exam.description || ''
      }
    }).filter(Boolean) // 过滤掉null值
    
    console.log('处理后的教师考试数据:', exams.value)
    
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

// 获取教师知识点数据
async function fetchKnowledgePoints() {
  if (!userInfo.value || !userInfo.value.teacherId) {
    console.warn('未找到教师ID，无法获取知识点数据')
    knowledgePoints.value = []
    return
  }

  try {
    const teacherId = userInfo.value.teacherId
    console.log('正在获取教师知识点数据，教师ID:', teacherId)
    
    // 使用教师专用API获取知识点数据
    const response = await Promise.race([
      knowledgeAPI.getKnowledgeByTeacherId(teacherId),
      new Promise((_, reject) => setTimeout(() => reject(new Error('请求超时')), 5000))
    ])
    
    if (!response || !Array.isArray(response) || response.length === 0) {
      console.warn('服务器返回的知识点数据为空或格式不正确:', response)
      knowledgePoints.value = []
      return
    }
    
    knowledgePoints.value = response.map(item => ({
      id: item.knowledgeId,
      name: item.name || '未命名知识点',
      description: item.description || '',
      difficultyLevel: item.difficultyLevel || '中等',
      teacherId: item.teacherId,
      updateTime: item.updatedAt || item.createdAt || new Date().toISOString()
    }))
    
    console.log('处理后的教师知识点数据:', knowledgePoints.value)
    
    // 重置错误状态
    apiErrorShown.knowledge = false
  } catch (error) {
    console.error('获取教师知识点数据失败:', error)
    knowledgePoints.value = []
    
    if (!apiErrorShown.knowledge) {
      apiErrorShown.knowledge = true
      
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
  }
}

// 获取作业状态类型
function getHomeworkStatusType(homework) {
  if (!homework || !homework.status) return 'info'
  
  const status = homework.status
  
  if (status.includes('未设置')) return 'info'
  if (status.includes('已截止')) return 'success'
  if (status.includes('即将截止')) return 'warning'
  if (status.includes('进行中')) return 'primary'
  
  return 'info'
}

// 获取近期作业（按更新时间排序取前三）
async function fetchRecentHomeworks() {
  if (!userInfo.value || !userInfo.value.teacherId) {
    recentHomeworks.value = []
    return
  }
  try {
    const res = await assignmentAPI.getAssignmentsByCreatorId(userInfo.value.teacherId)
    if (Array.isArray(res)) {
      // 取最近3个作业
      const sorted = res
        .sort((a, b) => new Date(b.updatedAt) - new Date(a.updatedAt))
        .slice(0, 3)
      // 并发获取每个作业的题目分数总和
      const homeworksWithScore = await Promise.all(sorted.map(async hw => {
        let totalScore = '--'
        try {
          const problems = await problemAPI.getProblemsByAssignment(hw.assignmentId)
          if (Array.isArray(problems)) {
            totalScore = problems.reduce((sum, p) => sum + (Number(p.score) || 0), 0)
          }
        } catch (e) {
          console.error('获取作业题目失败', e)
        }
        return {
          assignmentId: hw.assignmentId,
          title: hw.title || '未命名作业',
          courseName: hw.courseName || hw.courseId || '未知课程',
          description: hw.description || '',
          status: hw.status || '',
          totalScore,
          updatedAt: hw.updatedAt,
        }
      }))
      recentHomeworks.value = homeworksWithScore
    } else {
      recentHomeworks.value = []
    }
  } catch (e) {
    console.error('获取近期作业失败', e)
    recentHomeworks.value = []
  }
}

// 获取数据函数
function fetchData() {
  // 重置加载状态
  loading.value = true
  
  // 清空现有数据，避免旧数据闪烁
  courses.value = []
  exams.value = []
  
  // 获取用户信息
  userInfo.value = getUserInfo()
  if (!userInfo.value) {
    console.error('无法获取用户信息，请检查登录状态')
    showMessage('error', '无法获取用户信息，请重新登录')
    setTimeout(() => {
      router.push('/login')
    }, 1000)
    loading.value = false
    return
  }
  
  // 确保是教师账号
  if (!userInfo.value.teacherId) {
    console.error('当前账号不是教师账号')
    showMessage('error', '您不是教师，无法访问教师功能')
    setTimeout(() => {
      router.push('/login')
    }, 1000)
    loading.value = false
    return
  }
  
  console.log('获取到教师用户信息:', userInfo.value)
  
  // 重置错误状态
  errorState.hasShownError = false
  
  // 获取数据 - 使用Promise.all并添加错误处理
  Promise.all([
    fetchTeacherCourses().catch(err => {
      console.error('课程数据加载错误:', err)
      courses.value = [] // 使用空数组
    }),
    fetchExams().catch(err => {
      console.error('考试数据加载错误:', err)
      exams.value = [] // 使用空数组
    }),
    fetchKnowledgePoints().catch(err => {
      console.error('知识点数据加载错误:', err)
      knowledgePoints.value = [] // 使用空数组
    }),
    fetchRecentHomeworks().catch(err => {
      console.error('作业数据加载错误:', err)
      recentHomeworks.value = []
    })
  ]).catch(error => {
    console.error('数据加载过程中发生错误:', error)
    // 确保所有数据都有默认值
    courses.value = courses.value.length ? courses.value : []
    exams.value = exams.value.length ? exams.value : []
    knowledgePoints.value = knowledgePoints.value.length ? knowledgePoints.value : []
    recentHomeworks.value = []
  }).finally(() => {
    loading.value = false // 无论如何都结束加载状态
  })
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
  
  // 设置时间定时器
  timeInterval = setInterval(() => {
    updateCurrentTime()
  }, 1000)
  
  // 获取数据
  fetchData()

  // 添加刷新课程列表的事件监听器
  window.addEventListener('refresh-courses', fetchTeacherCourses)
})

// 组件卸载时清理
onUnmounted(() => {
  // 清除时间更新定时器
  if (timeInterval) {
    clearInterval(timeInterval)
  }
  // 移除事件监听器
  window.removeEventListener('refresh-courses', fetchTeacherCourses)
})
</script>

<style scoped>
.teacher-home-container {
  padding: 20px;
}

.student-home {
  padding: 0;
  display: flex;
  flex-direction: column;
  padding-bottom: 24px; /* 增加底部内边距 */
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
  margin-bottom: 24px;
}

/* 全宽区域样式 */
.recent-section-full {
  width: 100%;
  margin-bottom: 24px;
}

.recent-card {
  border-radius: 12px;
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.06);
  height: auto;
  max-height: none;
  overflow: visible;
  transition: all 0.3s ease;
  border: none;
}

.recent-card:hover {
  box-shadow: 0 6px 20px rgba(0, 0, 0, 0.08);
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 16px 20px;
  border-bottom: 1px solid rgba(0, 0, 0, 0.05);
}

.card-header h3 {
  font-size: 18px;
  font-weight: 600;
  margin: 0;
  color: #303133;
  position: relative;
  padding-left: 12px;
}

.card-header h3::before {
  content: '';
  position: absolute;
  left: 0;
  top: 50%;
  transform: translateY(-50%);
  width: 4px;
  height: 18px;
  background: linear-gradient(to bottom, #4B8DE6, #6A5ACD);
  border-radius: 2px;
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
  padding: 16px;
  border-radius: 8px;
  margin-bottom: 10px;
  cursor: pointer;
  transition: all 0.3s ease;
  background-color: #fff;
  border: 1px solid #ebeef5;
  box-shadow: 0 2px 6px rgba(0, 0, 0, 0.03);
}

.recent-item:last-child {
  margin-bottom: 0;
}

.recent-item:hover {
  transform: translateY(-2px);
  box-shadow: 0 6px 12px rgba(0, 0, 0, 0.08);
  background-color: #f9fafc;
}

.item-icon {
  width: 48px;
  height: 48px;
  border-radius: 10px;
  display: flex;
  align-items: center;
  justify-content: center;
  margin-right: 16px;
  color: white;
  box-shadow: 0 4px 8px rgba(0, 0, 0, 0.1);
}

.item-content {
  flex: 1;
  padding: 0 10px;
}

.item-title {
  font-size: 16px;
  font-weight: 600;
  color: #303133;
  margin-bottom: 6px;
  text-align: left;
}

.item-subtitle {
  font-size: 13px;
  color: #606266;
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.item-category {
  display: inline-block;
  padding: 2px 8px;
  font-size: 12px;
  background: #f0f9eb;
  color: #67c23a;
  border-radius: 12px;
  margin-left: 6px;
  font-weight: 500;
}

.item-credit {
  font-size: 12px;
  color: #606266;
  margin-top: 4px;
  background-color: #f5f7fa;
  padding: 2px 8px;
  border-radius: 10px;
  display: inline-block;
}

.item-status {
  margin-left: 16px;
  display: flex;
  align-items: center;
}

.item-status .el-tag {
  padding: 0 10px;
  height: 24px;
  line-height: 22px;
  border-radius: 12px;
  font-weight: 500;
}

.item-details {
  font-size: 12px;
  color: #606266;
  margin-top: 6px;
  display: flex;
  gap: 12px;
  flex-wrap: wrap;
}

.item-time, .item-score {
  display: flex;
  align-items: center;
  gap: 6px;
  background-color: #f5f7fa;
  padding: 3px 10px;
  border-radius: 12px;
}

.item-time {
  color: #e6a23c;
}

.item-score {
  color: #409eff;
}

.deadline-info {
  display: flex;
  align-items: center;
  gap: 6px;
  color: #606266;
  background-color: #f5f7fa;
  padding: 3px 10px;
  border-radius: 12px;
  margin-top: 2px;
}

.deadline-info .el-icon {
  font-size: 14px;
  color: #E6A23C;
}

.item-description {
  font-size: 12px;
  color: #606266;
  margin-top: 6px;
  padding: 3px 10px;
  background-color: #f5f7fa;
  border-radius: 10px;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  max-width: 200px;
  display: inline-block;
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

/* 添加作业相关的样式 */
.homework-icon {
  background-color: #67C23A;
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
