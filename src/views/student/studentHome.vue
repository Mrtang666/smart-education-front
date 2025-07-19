<!-- /**
 * 学生首页组件
 * 
 * 该组件展示学生的个人信息、课程、考试和学习计划等数据
 * 所有数据均通过后端API获取，不使用模拟数据
 *
 * API依赖:
 * - courseSelectionAPI: 获取学生已选课程
 * - studentExamAPI: 获取学生考试信息
 * - learningPlanAPI: 获取学生学习计划
 */ -->
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

      <!-- 学习计划方块 -->
      <div class="feature-card" @click="navigateTo('plan')">
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

      <!-- 新增：未完成作业方块 -->
      <div class="feature-card">
        <div class="card-icon orange">
          <el-icon :size="32">
            <EditPen />
          </el-icon>
        </div>
        <div class="card-content">
          <h3 class="card-title">未完成作业</h3>
          <div class="card-value">{{ unfinishedAssignmentCount }}</div>
          <p class="card-desc">待完成的作业数量</p>
        </div>
      </div>

      <!-- 新增：待参加考试方块 -->
      <div class="feature-card">
        <div class="card-icon purple">
          <el-icon :size="32">
            <Document />
          </el-icon>
        </div>
        <div class="card-content">
          <h3 class="card-title">待参加考试</h3>
          <div class="card-value">
            <el-skeleton :loading="ongoingExamLoading" :rows="1" style="width: 40px; display: inline-block;"
              v-if="ongoingExamLoading" />
            <span v-else>{{ ongoingExamCount }}</span>
          </div>
          <p class="card-desc">正在进行且未作答的考试数量</p>
        </div>
      </div>
    </div>

    <!-- 最近的课程 -->
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
          <div v-else-if="(courses || []).length === 0" class="empty-tip">
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
                <div class="item-title">
                  {{ course.name }}
                  <el-tag size="small" effect="plain" class="course-code-tag"
                    v-if="course.code && course.code !== 'string'">
                    {{ course.code }}
                  </el-tag>
                </div>
                <div class="item-subtitle">
                  <span class="course-info">
                    <el-icon>
                      <Collection />
                    </el-icon>
                    {{ course.category === 'string' ? '未分类' : course.category }} · {{ course.credit }}学分
                  </span>
                </div>
                <div v-if="course.description && course.description !== 'string'" class="course-description-container">
                  <div class="course-tags" v-if="(getDescriptionTags(course.description) || []).length > 0">
                    <el-tag v-for="(tag, tagIndex) in getDescriptionTags(course.description)" :key="tagIndex"
                      size="small" type="info" effect="plain" class="tag-item">
                      {{ tag }}
                    </el-tag>
                  </div>
                  <el-tooltip :content="processDescription(course.description).text" placement="top" :show-after="500">
                    <div class="course-description">
                      {{ getShortDescription(course.description) }}
                    </div>
                  </el-tooltip>
                </div>
              </div>
              <div class="item-action">
                <el-button link type="primary">进入</el-button>
              </div>
            </div>
          </div>
        </div>
      </el-card>

      <!-- 待办任务区块 -->
      <el-card shadow="hover" class="recent-card">
        <template #header>
          <div class="card-header">
            <h3>待办任务</h3>
            <span class="task-count">
              {{ (unfinishedAssignments || []).length + (ongoingExamDetails || []).length }} 项待办
            </span>
          </div>
        </template>
        
        <div class="recent-list">
          <!-- 未完成作业 -->
          <div class="task-section">
            <div class="section-title">
              <el-icon class="section-icon">
                <EditPen />
              </el-icon>
              未完成作业
              <span class="section-count" v-if="(unfinishedAssignments || []).length > 0">
                {{ unfinishedAssignments.length }}
              </span>
            </div>
            <div v-if="(unfinishedAssignments || []).length === 0" class="empty-tip">
              <span class="empty-text">暂无未完成作业</span>
            </div>
            <div v-else class="task-items">
              <div v-for="item in unfinishedAssignments" :key="item.id" class="recent-item task-item">
                <div class="item-icon" :style="{ backgroundColor: getRandomColor(item.id) }">
                  <el-icon>
                    <EditPen />
                  </el-icon>
                </div>
                <div class="item-content">
                  <div class="item-title">{{ item.title }}</div>
                  <div class="item-subtitle">
                    <span class="course-info">
                      <el-icon>
                        <Collection />
                      </el-icon>
                      {{ item.courseName || '' }}
                    </span>
                    <span class="deadline-info">
                      <el-icon>
                        <Timer />
                      </el-icon>
                      截止：{{ formatDateTimeLocal(item.endTime) }}
                    </span>
                  </div>
                  <div class="item-meta">
                    <span class="score-info">总分：{{ item.totalScore }}分</span>
                    <el-tag size="small" :type="getAssignmentTagType(item.status)">{{ item.status }}</el-tag>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <!-- 待参加考试 -->
          <div class="task-section">
            <div class="section-title">
              <el-icon class="section-icon">
                <Document />
              </el-icon>
              待参加考试
              <span class="section-count" v-if="(ongoingExamDetails || []).length > 0">
                {{ ongoingExamDetails.length }}
              </span>
            </div>
            <div v-if="(ongoingExamDetails || []).length === 0" class="empty-tip">
              <span class="empty-text">暂无待参加考试</span>
            </div>
            <div v-else class="task-items">
              <div v-for="item in ongoingExamDetails" :key="item.id" class="recent-item task-item" @click="goToExam(item)">
                <div class="item-icon" :style="{ backgroundColor: getRandomColor(item.id) }">
                  <el-icon>
                    <Document />
                  </el-icon>
                </div>
                <div class="item-content">
                  <div class="item-title">{{ item.title }}</div>
                  <div class="item-subtitle">
                    <span class="course-info">
                      <el-icon>
                        <Collection />
                      </el-icon>
                      {{ item.courseName || '' }}
                    </span>
                  </div>
                  <div class="item-meta">
                    <span class="exam-time">时间：{{ item.examTime || '--' }}</span>
                    <el-tag size="small" type="warning">进行中</el-tag>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </el-card>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, onUnmounted, computed, inject } from 'vue'
import { useRouter } from 'vue-router'
import { ElMessage } from 'element-plus'
import { Reading, /*Document,*/ Calendar, Collection, EditPen, Document, Timer } from '@element-plus/icons-vue'
import { courseSelectionAPI, studentExamAPI, learningPlanAPI, assignmentAPI, courseAPI, problemAPI, examAPI } from '@/api/api'
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

    switch (type) {
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
const courseCount = computed(() => (courses.value || []).length)
// const assignmentCount = computed(() => assignments.value.length)
// const examCount = computed(() => exams.value.length)
const planCount = computed(() => (plans.value || []).length)
const recentCourses = computed(() => (courses.value || []).slice(0, 3))
// 新增：未完成作业和待参加考试数量
const unfinishedAssignmentCount = computed(() => (assignments.value || []).length)
const ongoingExamCount = ref(0)
const ongoingExamLoading = ref(false)

// 添加缺失的计算属性
const unfinishedAssignments = computed(() => assignments.value || [])
const ongoingExamDetails = computed(() => (exams.value || []).filter(e => e.status === '进行中'))

// 统计待参加考试数量（进行中且未作答）
async function updateOngoingExamCount() {
  if (!userInfo.value || !userInfo.value.studentId) {
    ongoingExamCount.value = 0
    return
  }
  const ongoingExams = (exams.value || []).filter(e => e.status === '进行中')
  if (ongoingExams.length === 0) {
    ongoingExamCount.value = 0
    return
  }
  ongoingExamLoading.value = true
  try {
    const results = await Promise.all(
      ongoingExams.map(e =>
        studentExamAPI.checkIfExamAnswered(userInfo.value.studentId, e.id)
          .then(answered => !answered)
          .catch(() => false)
      )
    )
    ongoingExamCount.value = results.filter(Boolean).length
  } catch (e) {
    ongoingExamCount.value = 0
  } finally {
    ongoingExamLoading.value = false
  }
}

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

// 处理课程描述中的标签
function processDescription(description) {
  if (!description || description === 'string') return { text: '', tags: [] };

  // 提取所有 #标签# 格式的标签
  const tagRegex = /#([^#]+)#/g;
  const tags = [];
  let match;
  let processedDesc = description;

  // 收集所有标签
  while ((match = tagRegex.exec(description)) !== null) {
    tags.push(match[1]);
  }

  // 从描述中移除所有标签
  processedDesc = processedDesc.replace(tagRegex, '').trim();

  return {
    text: processedDesc,
    tags: tags
  };
}

// 获取短描述（不包含标签）
function getShortDescription(description) {
  const processed = processDescription(description);
  if (!processed.text) return '';
  return processed.text.length > 20 ? processed.text.substring(0, 20) + '...' : processed.text;
}

// 获取描述中的标签
function getDescriptionTags(description) {
  return processDescription(description).tags;
}

// 获取作业状态标签类型
function getAssignmentTagType(status) {
  switch (status) {
    case '待提交':
      return 'info';
    case '已提交':
      return 'success';
    case '已批改':
      return 'warning';
    case '已过期':
      return 'danger';
    default:
      return 'info';
  }
}

// 格式化日期时间
function formatDateTimeLocal(dateTimeStr) {
  if (!dateTimeStr) return '--'
  
  const date = new Date(dateTimeStr)
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  const hours = String(date.getHours()).padStart(2, '0')
  const minutes = String(date.getMinutes()).padStart(2, '0')
  
  return `${year}-${month}-${day} ${hours}:${minutes}`
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



// 导航到不同页面
function navigateTo(page) {
  // 更新左侧导航栏选中状态
  if (setActiveMenu) {
    switch (page) {
      case 'course':
        setActiveMenu('课程')
        break

      case 'exam':
        setActiveMenu('考试')
        break
      case 'plan':
        setActiveMenu('计划')
        break
      default:
        break
    }
  }

  // 路由跳转
  switch (page) {
    case 'course':
      router.push('/student/course')
      break

    case 'exam':
      router.push('/student/exam')
      break
    case 'plan':
      router.push('/student/plan')
      break
    default:
      break
  }
}

// 进入课程
function enterCourse(course) {
  // 更新左侧导航栏选中状态
  if (setActiveMenu) {
    setActiveMenu('课程')
  }

  router.push(`/student/course/${course.id}`)
  showMessage('success', `正在进入课程: ${course.name}`)
}

// 跳转到考试详情页面
function goToExam(exam) {
  if (!userInfo.value || !userInfo.value.studentId) {
    showMessage('error', '请先登录以查看考试详情')
    return
  }
  router.push(`/student/exam/${exam.id}`)
  showMessage('success', `正在进入考试: ${exam.title}`)
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

    courses.value = response.map(course => {
      return {
        id: course.id,
        name: course.name || '未命名课程',
        code: course.code,
        description: course.description || '暂无描述',
        credit: course.credit || 0,
        category: course.category || '未分类',
        createTime: course.createTime,
        updateTime: course.updateTime,
        status: course.status,
        teacherName: course.teacherName || '未知教师'
      };
    })

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



// 获取近期考试数据
async function fetchExams(isRetry = false) {
  console.log('fetchExams 函数被调用')
  
  if (!userInfo.value || !userInfo.value.studentId) {
    console.warn('未找到学生ID，无法获取考试数据')
    exams.value = []
    updateOngoingExamCount()
    return
  }

  try {
    console.log('开始获取学生课程信息...')
    
    // 1. 获取学生的全部课程
    const studentCoursesResponse = await courseSelectionAPI.getStudentCourses(userInfo.value.studentId)
    console.log('学生课程信息:', studentCoursesResponse)
    
    if (!studentCoursesResponse || !Array.isArray(studentCoursesResponse) || studentCoursesResponse.length === 0) {
      console.warn('学生没有选课或课程数据为空')
      exams.value = []
      updateOngoingExamCount()
      return
    }

    // 2. 获取每个课程对应的考试信息
    const allExams = []
    const examIds = []
    
    for (const course of studentCoursesResponse) {
      try {
        console.log(`获取课程 ${course.courseName || course.name} 的考试信息...`)
        const courseExamsResponse = await examAPI.getExamsInCourse(course.courseId || course.id)
        
        if (courseExamsResponse && Array.isArray(courseExamsResponse)) {
          courseExamsResponse.forEach(exam => {
            allExams.push({
              ...exam,
              courseName: course.courseName || course.name,
              courseId: course.courseId || course.id
            })
            if (exam.examId) {
              examIds.push(exam.examId)
            }
          })
        }
      } catch (error) {
        console.warn(`获取课程 ${course.courseName || course.name} 的考试信息失败:`, error)
      }
    }
    
    console.log('所有考试信息:', allExams)
    console.log('考试ID列表:', examIds)

    if (allExams.length === 0) {
      console.warn('没有找到任何考试')
      exams.value = []
      updateOngoingExamCount()
      return
    }

    // 3. 检查学生是否已经作答这些考试
    let answeredExams = []
    if (examIds.length > 0) {
      try {
        console.log('检查学生是否作答考试...')
        const answeredResponse = await studentExamAPI.checkIfExamsAnswered(userInfo.value.studentId, examIds)
        console.log('作答检查结果:', answeredResponse)
        
        if (Array.isArray(answeredResponse)) {
          answeredExams = answeredResponse
        }
      } catch (error) {
        console.warn('检查考试作答状态失败:', error)
        // 如果检查失败，假设所有考试都未作答
        answeredExams = new Array(examIds.length).fill(false)
      }
    }

    // 4. 筛选出未作答的考试
    const unAnsweredExams = []
    for (let i = 0; i < allExams.length; i++) {
      const exam = allExams[i]
      const isAnswered = answeredExams[i] || false
      
      if (!isAnswered) {
        unAnsweredExams.push({
          id: exam.examId,
          title: exam.examTitle || exam.title || '未命名考试',
          courseName: exam.courseName || '未知课程',
          examTime: exam.examTime || exam.startTime,
          daysLeft: calculateDaysLeft(exam.examTime || exam.startTime),
          status: exam.status || '未作答',
          courseId: exam.courseId
        })
      }
    }

    console.log('未作答的考试:', unAnsweredExams)
    exams.value = unAnsweredExams

    // 重置错误状态
    apiErrorShown.exams = false
    await updateOngoingExamCount()
  } catch (error) {
    console.error('获取考试数据失败:', error)
    console.error('错误详情:', error.response || error.message)
    exams.value = []
    updateOngoingExamCount()

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

// 获取学生未完成作业数据
async function fetchUnfinishedAssignments(isRetry = false) {
  console.log('fetchUnfinishedAssignments 函数被调用')
  console.log('userInfo.value:', userInfo.value)
  
  if (!userInfo.value || !userInfo.value.studentId) {
    console.warn('未找到学生ID，无法获取未完成作业数据')
    console.log('userInfo.value.studentId:', userInfo.value?.studentId)
    assignments.value = []
    return
  }

  console.log('开始调用 assignmentAPI.getAssignmentsByStudentId，studentId:', userInfo.value.studentId)

  try {
    const response = await Promise.race([
      assignmentAPI.getAssignmentsByStudentId(userInfo.value.studentId),
      new Promise((_, reject) => setTimeout(() => reject(new Error('请求超时')), 5000))
    ])

    console.log('API响应:', response)
    console.log('API响应类型:', typeof response)
    console.log('API响应是否为数组:', Array.isArray(response))

    // 处理服务器返回空数据的情况
    if (!response || (Array.isArray(response) && response.length === 0)) {
      console.warn('服务器返回的未完成作业数据为空')
      assignments.value = []
      return
    }

    // 确保response是数组
    const assignmentData = Array.isArray(response) ? response : [response].filter(Boolean)
    console.log('处理后的作业数据:', assignmentData)
    console.log('第一个作业数据示例:', assignmentData[0])

    // 处理API返回的数据 - 根据AssignmentBO的实际结构
    const processedAssignments = []
    
    for (const assignment of assignmentData) {
      console.log('处理单个作业:', assignment)
      
      // 获取课程名称
      let courseName = '未知课程'
      try {
        if (assignment.courseId) {
          const courseResponse = await courseAPI.getCourseById(assignment.courseId)
          if (courseResponse && courseResponse.name) {
            courseName = courseResponse.name
          }
        }
      } catch (error) {
        console.warn('获取课程名称失败:', error)
      }
      
      // 获取作业中的问题并计算总分
      let totalScore = 0
      try {
        const problemsResponse = await problemAPI.getProblemsByAssignment(assignment.assignmentId)
        if (Array.isArray(problemsResponse)) {
          totalScore = problemsResponse.reduce((sum, problem) => {
            return sum + (problem.score || 0)
          }, 0)
        }
      } catch (error) {
        console.warn('获取作业问题失败:', error)
      }
      
      processedAssignments.push({
        id: assignment.assignmentId,
        title: assignment.title || '未命名作业',
        courseName: courseName,
        endTime: assignment.endTime,
        status: assignment.status || '进行中',
        description: assignment.description || '',
        totalScore: totalScore,
        submitted: false, // 这个接口返回的都是未完成的作业
        submittedTime: null,
        submittedScore: null,
        submittedComment: null,
        submittedBy: null,
        submittedByName: null,
        submittedByAvatar: null,
        submittedByRole: null,
        submittedByStudentId: null,
        submittedByStudentName: null,
        submittedByStudentAvatar: null,
        submittedByStudentRole: null,
        // 添加AssignmentBO中的其他字段
        type: assignment.type,
        creatorId: assignment.creatorId,
        courseId: assignment.courseId,
        isAnswerPublic: assignment.isAnswerPublic,
        isScoreVisible: assignment.isScoreVisible,
        isRedoAllowed: assignment.isRedoAllowed,
        maxAttempts: assignment.maxAttempts,
        startTime: assignment.startTime,
        createdAt: assignment.createdAt,
        updatedAt: assignment.updatedAt
      })
    }

    assignments.value = processedAssignments
    console.log('最终处理后的assignments.value:', assignments.value)

    // 重置错误状态
    apiErrorShown.assignments = false
  } catch (error) {
    console.error('获取未完成作业数据失败:', error)
    console.error('错误详情:', error.response || error.message)
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
    console.log('开始获取数据...')
    Promise.all([
      fetchStudentCourses().catch(err => {
        console.error('课程数据加载错误:', err)
        courses.value = [] // 使用空数组
      }),

      fetchExams().catch(err => {
        console.error('考试数据加载错误:', err)
        exams.value = [] // 使用空数组
      }),
      fetchPlans().catch(err => {
        console.error('学习计划加载错误:', err)
        plans.value = [] // 使用空数组
      }),
      fetchUnfinishedAssignments().catch(err => {
        console.error('未完成作业加载错误:', err)
        assignments.value = [] // 使用空数组
      })
    ]).catch(error => {
      console.error('数据加载过程中发生错误:', error)
      // 确保所有数据都有默认值
      courses.value = (courses.value && courses.value.length) ? courses.value : []
      assignments.value = (assignments.value && assignments.value.length) ? assignments.value : []
      exams.value = (exams.value && exams.value.length) ? exams.value : []
      plans.value = (plans.value && plans.value.length) ? plans.value : []
    }).finally(() => {
      console.log('数据加载完成')
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
  display: flex;
  flex-direction: column;
  max-height: 100vh;
  /* 限制最大高度为视口高度 */
  overflow-y: auto;
  /* 添加滚动条 */
}

/* 欢迎区域样式 */
.welcome-section {
  display: flex;
  background: linear-gradient(135deg, #4B8DE6, #6A5ACD);
  border-radius: 12px;
  padding: 24px 32px;
  /* 减少内边距 */
  margin-bottom: 20px;
  color: white;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
  overflow: hidden;
  position: relative;
  flex-shrink: 0;
  /* 防止被压缩 */
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
  gap: 16px;
  /* 减少间距 */
  margin-bottom: 20px;
  flex-shrink: 0;
  /* 防止被压缩 */
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
  height: auto;
  /* 改为自适应高度 */
  margin-bottom: 20px;
  /* 确保底部有足够空间 */
}

.recent-card {
  border-radius: 8px;
  box-shadow: 0 2px 12px 0 rgba(0, 0, 0, 0.05);
  display: flex;
  flex-direction: column;
  height: auto;
  /* 改为自适应高度 */
  max-height: 450px;
  /* 设置最大高度 */
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  flex-shrink: 0;
  /* 防止头部被压缩 */
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
  overflow-y: auto;
  max-height: 350px;
  /* 减小最大高度 */
  padding-right: 4px;
  /* 为滚动条留出空间 */
}

.recent-item {
  display: flex;
  align-items: center;
  padding: 10px 0;
  /* 减少上下内边距 */
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
  width: 36px;
  /* 减小图标尺寸 */
  height: 36px;
  /* 减小图标尺寸 */
  border-radius: 8px;
  display: flex;
  align-items: center;
  justify-content: center;
  margin-right: 12px;
  /* 减小右边距 */
  color: white;
  flex-shrink: 0;
}

.item-content {
  flex: 1;
  overflow: hidden;
  /* 防止内容溢出 */
}

.item-title {
  font-size: 16px;
  color: #606266;
  margin: 0 0 6px 0;
  /* 减小下边距 */
  display: flex;
  align-items: center;
  gap: 8px;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.course-code-tag {
  font-size: 10px;
  padding: 0 6px;
  height: 20px;
  line-height: 18px;
  flex-shrink: 0;
}

.item-subtitle {
  font-size: 12px;
  color: #909399;
  margin-bottom: 3px;
  /* 减小下边距 */
}

.course-info,
.teacher-info,
.time-info {
  display: flex;
  align-items: center;
  gap: 4px;
  color: #909399;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.course-info .el-icon,
.teacher-info .el-icon,
.time-info .el-icon {
  font-size: 14px;
  color: #409EFF;
}

.course-description-container {
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  gap: 8px;
  margin-bottom: 6px;
}

.course-description {
  font-size: 12px;
  color: #909399;
  display: inline-block;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  max-width: 60%;
  margin: 0;
}

.course-tags {
  display: flex;
  flex-wrap: wrap;
  gap: 4px;
  margin: 0;
}

.tag-item {
  font-size: 10px;
  padding: 0 6px;
  height: 18px;
  line-height: 16px;
  border-radius: 4px;
  margin: 0;
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

  .recent-section {
    height: auto;
    /* 小屏幕上取消固定高度 */
  }

  .recent-list {
    max-height: 300px;
    /* 小屏幕上减小列表高度 */
  }
}

@media (max-width: 768px) {

  .feature-grid,
  .recent-section {
    grid-template-columns: 1fr;
    height: auto;
  }

  .recent-card {
    margin-bottom: 20px;
  }

  .recent-list {
    max-height: 250px;
    /* 手机屏幕上进一步减小列表高度 */
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

.status-tag {
  font-size: 10px;
  padding: 0 6px;
  height: 20px;
  line-height: 18px;
}

/* 自定义滚动条样式 */
.recent-list::-webkit-scrollbar {
  width: 6px;
}

.recent-list::-webkit-scrollbar-track {
  background: #f1f1f1;
  border-radius: 3px;
}

.recent-list::-webkit-scrollbar-thumb {
  background: #ccc;
  border-radius: 3px;
}

.recent-list::-webkit-scrollbar-thumb:hover {
  background: #aaa;
}

/* 确保在Firefox中也有类似的滚动条体验 */
.recent-list {
  scrollbar-width: thin;
  scrollbar-color: #ccc #f1f1f1;
}

/* 任务区块样式 */
.task-count {
  font-size: 14px;
  color: #909399;
}

.task-section {
  margin-bottom: 20px;
}

.task-section:last-child {
  margin-bottom: 0;
}

.section-title {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 16px;
  font-weight: 500;
  color: #303133;
  margin-bottom: 12px;
  padding-bottom: 8px;
  border-bottom: 1px solid #F0F0F0;
}

.section-icon {
  font-size: 16px;
  color: #409EFF;
}

.section-count {
  background: #409EFF;
  color: white;
  font-size: 12px;
  padding: 2px 6px;
  border-radius: 10px;
  margin-left: auto;
}

.empty-text {
  color: #909399;
  font-size: 14px;
}

.task-items {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.task-item {
  cursor: pointer;
}

.task-item:hover {
  background-color: #F5F7FA;
}

.deadline-info,
.exam-time {
  display: flex;
  align-items: center;
  gap: 4px;
  color: #909399;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.deadline-info .el-icon {
  font-size: 14px;
  color: #E6A23C;
}

.item-meta {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 12px;
  color: #909399;
  margin-top: 4px;
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
  0% {
    opacity: 0;
  }

  10% {
    opacity: 1;
  }

  90% {
    opacity: 1;
  }

  100% {
    opacity: 0;
  }
}
</style>