<template>
  <div class="exam-container">
    <div class="header-row">
      <h2 class="section-title">我的考试</h2>

      <!-- 搜索和筛选栏 -->
      <div class="action-bar">
        <div class="search-area">
          <el-select v-model="selectedCourseId" placeholder="选择课程" @change="handleCourseSelect"
            class="course-select">
            <el-option label="全部课程" value="" />
            <el-option v-for="course in courseList" :key="course.id" :label="course.name" :value="course.id" />
          </el-select>
          <el-select v-model="selectedStatus" placeholder="考试状态" @change="handleStatusSelect"
            class="status-select">
            <el-option label="全部状态" value="" />
            <el-option label="未开始" value="未开始" />
            <el-option label="进行中" value="进行中" />
            <el-option label="已结束" value="已结束" />
          </el-select>
          <el-input v-model="searchKeyword" placeholder="搜索考试" class="search-input" @input="handleSearch">
            <template #suffix>
              <el-icon class="search-icon">
                <Search />
              </el-icon>
            </template>
          </el-input>
        </div>
      </div>
    </div>

    <!-- 考试列表 -->
    <div v-loading="loading" class="exam-list-container">
      <div v-if="loading" class="loading-container">
        <el-skeleton :rows="5" animated />
      </div>
      <div v-else-if="examList.length === 0" class="empty-container">
        <el-empty description="暂无考试" />
      </div>
      <div v-else>
        <el-table :data="examList" style="width: 100%" border stripe :header-cell-style="{ background: '#f5f7fa' }" @row-click="viewExamDetail">
          <el-table-column prop="title" label="考试标题" min-width="180" />
          <el-table-column prop="courseName" label="所属课程" min-width="150" />
          <el-table-column prop="totalScore" label="总分" width="80" />
          <el-table-column prop="durationMinutes" label="时长(分钟)" width="120" />
          <el-table-column label="考试时间" min-width="240">
            <template #default="scope">
              {{ formatDateTimeLocal(scope.row.startTime) }} 至 {{ formatDateTimeLocal(scope.row.endTime) }}
            </template>
          </el-table-column>
          <el-table-column label="状态" width="120">
            <template #default="scope">
              <el-tag :type="getStatusType(scope.row.status)" effect="dark">
                <el-icon v-if="scope.row.status === '未开始'">
                  <Calendar />
                </el-icon>
                <el-icon v-else-if="scope.row.status === '进行中'">
                  <Loading />
                </el-icon>
                <el-icon v-else-if="scope.row.status === '已结束'">
                  <Timer />
                </el-icon>
                {{ scope.row.status }}
              </el-tag>
            </template>
          </el-table-column>
          <el-table-column label="成绩" width="100">
            <template #default="scope">
              <span v-if="scope.row.score !== null && scope.row.status === '已结束'">{{ scope.row.score }}分</span>
              <span v-else-if="scope.row.status === '已结束'">未参加</span>
              <span v-else>-</span>
            </template>
          </el-table-column>
          <el-table-column label="操作" width="180" fixed="right">
            <template #default="scope">
              <el-button 
                v-if="scope.row.status === '进行中'" 
                type="primary" 
                link 
                @click="startExam(scope.row)"
              >
                <el-icon><Edit /></el-icon>参加考试
              </el-button>
              <el-button 
                v-else-if="scope.row.status === '未开始'" 
                type="info" 
                link 
                disabled
              >
                <el-icon><Timer /></el-icon>未开始
              </el-button>
              <el-button 
                v-else-if="scope.row.status === '已结束' && scope.row.score !== null" 
                type="success" 
                link 
                @click="viewExamResult(scope.row)"
              >
                <el-icon><DataAnalysis /></el-icon>查看结果
              </el-button>
              <el-button 
                v-else 
                type="danger" 
                link 
                disabled
              >
                <el-icon><WarningFilled /></el-icon>未参加
              </el-button>
            </template>
          </el-table-column>
        </el-table>

        <!-- 分页 -->
        <div class="pagination-container">
          <el-pagination 
            background 
            layout="prev, pager, next" 
            :total="total" 
            :page-size="pageSize"
            :current-page="currentPage" 
            @current-change="handlePageChange" 
          />
        </div>
      </div>
    </div>

    <!-- 考试详情抽屉 -->
    <el-drawer 
      v-model="drawerVisible" 
      title="考试详情" 
      size="50%" 
      :with-header="true"
      :destroy-on-close="true"
    >
      <div v-if="selectedExam" class="exam-detail">
        <h3>{{ selectedExam.title }}</h3>
        <el-descriptions :column="1" border>
          <el-descriptions-item label="所属课程">{{ selectedExam.courseName }}</el-descriptions-item>
          <el-descriptions-item label="考试时间">
            {{ formatDateTimeLocal(selectedExam.startTime) }} 至 {{ formatDateTimeLocal(selectedExam.endTime) }}
          </el-descriptions-item>
          <el-descriptions-item label="考试时长">{{ selectedExam.durationMinutes }}分钟</el-descriptions-item>
          <el-descriptions-item label="总分">{{ selectedExam.totalScore }}分</el-descriptions-item>
          <el-descriptions-item label="考试状态">
            <el-tag :type="getStatusType(selectedExam.status)" effect="dark">{{ selectedExam.status }}</el-tag>
          </el-descriptions-item>
          <el-descriptions-item v-if="selectedExam.score !== null" label="我的成绩">
            <span class="score">{{ selectedExam.score }}分</span>
          </el-descriptions-item>
          <el-descriptions-item label="考试说明">
            {{ selectedExam.description || '暂无说明' }}
          </el-descriptions-item>
        </el-descriptions>

        <div class="drawer-footer">
          <el-button 
            v-if="selectedExam.status === '进行中'" 
            type="primary" 
            @click="startExam(selectedExam)"
          >
            开始考试
          </el-button>
          <el-button 
            v-else-if="selectedExam.status === '已结束' && selectedExam.score !== null" 
            type="success" 
            @click="viewExamResult(selectedExam)"
          >
            查看考试结果
          </el-button>
          <el-button @click="drawerVisible = false">关闭</el-button>
        </div>
      </div>
    </el-drawer>
  </div>
</template>

<script setup>
import { ref, onMounted, inject, onUnmounted, computed } from 'vue'
import { ElMessage } from 'element-plus'
import { useRouter } from 'vue-router'
import { Search, Edit, DataAnalysis, Timer, Calendar, Loading, WarningFilled } from '@element-plus/icons-vue'

// 注入setActiveMenu方法
// const setActiveMenu = inject('setActiveMenu')
const router = useRouter()

// 注入用户信息
const userInfo = inject('userInfo')

// 使用注入的用户信息
const studentId = computed(() => userInfo.value ? userInfo.value.studentId : null)

// 考试列表相关数据
const examList = ref([])
const courseList = ref([])
const selectedCourseId = ref('')
const selectedStatus = ref('')
const searchKeyword = ref('')
const loading = ref(false)
const total = ref(0)
const pageSize = ref(10)
const currentPage = ref(1)

// 考试详情抽屉
const drawerVisible = ref(false)
const selectedExam = ref(null)

// 定时器，用于定期更新考试状态
let statusUpdateTimer = null

// 生命周期钩子
onMounted(() => {
  // 注释掉自动设置当前活动菜单的代码
  // setActiveMenu('考试')
  
  // 获取课程列表
  fetchCourseList()
  
  // 获取考试列表
  fetchExamList()
  
  // 设置定时器，每分钟更新一次考试状态
  statusUpdateTimer = setInterval(() => {
    updateExamsStatus()
  }, 60000) // 60秒
  
  // 如果有用户信息，可以根据用户信息更新页面数据
  if (userInfo && userInfo.value) {
    console.log('考试页面获取到用户信息:', userInfo.value)
    console.log('当前学生ID:', studentId.value)
  }
})

onUnmounted(() => {
  // 清除定时器
  if (statusUpdateTimer) {
    clearInterval(statusUpdateTimer)
  }
})

// 获取课程列表
async function fetchCourseList() {
  try {
    // 实际项目中应该调用API获取学生选择的课程
    // 这里使用模拟数据
    courseList.value = [
      { id: '1', name: '高等数学' },
      { id: '2', name: '数据结构与算法' },
      { id: '3', name: '计算机网络' },
      { id: '4', name: '操作系统' }
    ]
  } catch (error) {
    console.error('获取课程列表失败:', error)
    ElMessage.error('获取课程列表失败')
  }
}

// 获取考试列表
async function fetchExamList() {
  loading.value = true
  try {
    // 实际项目中应该调用API获取考试列表
    // 这里使用模拟数据
    setTimeout(() => {
      const mockExams = [
        {
          examId: '1',
          title: '高等数学期中考试',
          courseName: '高等数学',
          courseId: '1',
          totalScore: 100,
          durationMinutes: 120,
          startTime: '2023-11-15 14:00:00',
          endTime: '2023-11-15 16:00:00',
          status: '未开始',
          score: null,
          description: '本次考试包含选择题、填空题和计算题，请带好计算器和草稿纸。'
        },
        {
          examId: '2',
          title: '数据结构实验考核',
          courseName: '数据结构与算法',
          courseId: '2',
          totalScore: 100,
          durationMinutes: 90,
          startTime: '2023-11-18 10:00:00',
          endTime: '2023-11-18 11:30:00',
          status: '未开始',
          score: null,
          description: '本次考试为上机实验，请带好学生证。'
        },
        {
          examId: '3',
          title: '计算机网络在线测验',
          courseName: '计算机网络',
          courseId: '3',
          totalScore: 50,
          durationMinutes: 60,
          startTime: '2023-10-10 20:00:00',
          endTime: '2023-10-10 21:00:00',
          status: '已结束',
          score: 45,
          description: '本次测验为在线闭卷测验，请独立完成。'
        },
        {
          examId: '4',
          title: '操作系统期末考试',
          courseName: '操作系统',
          courseId: '4',
          totalScore: 100,
          durationMinutes: 120,
          startTime: '2023-12-25 09:00:00',
          endTime: '2023-12-25 11:00:00',
          status: '未开始',
          score: null,
          description: '本次考试为闭卷考试，请带好文具。'
        },
        {
          examId: '5',
          title: '高等数学期末考试',
          courseName: '高等数学',
          courseId: '1',
          totalScore: 100,
          durationMinutes: 120,
          startTime: '2023-01-15 14:00:00',
          endTime: '2023-01-15 16:00:00',
          status: '已结束',
          score: 85,
          description: '本次考试包含选择题、填空题和计算题。'
        }
      ]
      
      // 过滤考试列表
      examList.value = filterExams(mockExams)
      total.value = mockExams.length
      
      // 更新考试状态
      updateExamsStatus()
      
      loading.value = false
    }, 500)
  } catch (error) {
    console.error('获取考试列表失败:', error)
    ElMessage.error('获取考试列表失败')
    loading.value = false
  }
}

// 过滤考试列表
function filterExams(exams) {
  return exams.filter(exam => {
    // 根据课程筛选
    if (selectedCourseId.value && exam.courseId !== selectedCourseId.value) {
      return false
    }
    
    // 根据状态筛选
    if (selectedStatus.value && exam.status !== selectedStatus.value) {
      return false
    }
    
    // 根据关键词搜索
    if (searchKeyword.value) {
      const keyword = searchKeyword.value.toLowerCase()
      return exam.title.toLowerCase().includes(keyword) || 
             exam.courseName.toLowerCase().includes(keyword) ||
             (exam.description && exam.description.toLowerCase().includes(keyword))
    }
    
    return true
  })
}

// 更新考试状态
function updateExamsStatus() {
  const now = new Date()
  
  examList.value.forEach(exam => {
    const startTime = new Date(exam.startTime)
    const endTime = new Date(exam.endTime)
    
    if (now < startTime) {
      exam.status = '未开始'
    } else if (now >= startTime && now <= endTime) {
      exam.status = '进行中'
    } else {
      exam.status = '已结束'
    }
  })
}

// 获取考试状态样式
function getStatusType(status) {
  switch (status) {
    case '未开始': return 'info'
    case '进行中': return 'warning'
    case '已结束': return 'success'
    default: return 'info'
  }
}

// 格式化日期时间
function formatDateTimeLocal(dateTimeStr) {
  if (!dateTimeStr) return ''
  
  const date = new Date(dateTimeStr)
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  const hours = String(date.getHours()).padStart(2, '0')
  const minutes = String(date.getMinutes()).padStart(2, '0')
  
  return `${year}-${month}-${day} ${hours}:${minutes}`
}

// 处理课程选择
function handleCourseSelect() {
  fetchExamList()
}

// 处理状态选择
function handleStatusSelect() {
  fetchExamList()
}

// 处理搜索
function handleSearch() {
  fetchExamList()
}

// 处理分页
function handlePageChange(page) {
  currentPage.value = page
  fetchExamList()
}

// 查看考试详情
function viewExamDetail(exam) {
  selectedExam.value = exam
  drawerVisible.value = true
}

// 开始考试
function startExam(exam) {
  if (exam.status !== '进行中') {
    ElMessage.warning('考试尚未开始或已结束')
    return
  }
  
  router.push({
    name: 'studentExamDetail',
    params: { examId: exam.examId }
  })
}

// 查看考试结果
function viewExamResult(exam) {
  if (exam.status !== '已结束' || exam.score === null) {
    ElMessage.warning('考试尚未结束或未参加')
    return
  }
  
  router.push({
    name: 'studentExamDetail',
    params: { examId: exam.examId },
    query: { mode: 'result' }
  })
}
</script>

<style scoped>
.exam-container {
  padding: 0 10px;
}

.header-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 24px;
}

.section-title {
  margin: 0;
  font-size: 24px;
  font-weight: 600;
  color: #303133;
}

.action-bar {
  display: flex;
  align-items: center;
}

.search-area {
  display: flex;
  gap: 12px;
}

.course-select,
.status-select {
  width: 160px;
}

.search-input {
  width: 240px;
}

.search-icon {
  color: #909399;
}

.exam-list-container {
  background: #fff;
  border-radius: 4px;
  padding: 20px;
  box-shadow: 0 2px 12px 0 rgba(0, 0, 0, 0.05);
}

.loading-container,
.empty-container {
  padding: 40px 0;
  display: flex;
  justify-content: center;
}

.pagination-container {
  margin-top: 20px;
  display: flex;
  justify-content: center;
}

.exam-detail {
  padding: 0 20px;
}

.exam-detail h3 {
  margin-top: 0;
  margin-bottom: 20px;
  font-size: 20px;
  font-weight: 600;
  color: #303133;
}

.drawer-footer {
  margin-top: 30px;
  display: flex;
  justify-content: flex-end;
  gap: 12px;
}

.score {
  font-size: 16px;
  font-weight: bold;
  color: #67c23a;
}
</style> 