<!-- 接上接口然后继续做 -->
<template>
  <div class="homework-container">
    <div class="header-row">
      <h2 class="section-title">我的作业</h2>

      <!-- 搜索和筛选栏 -->
      <div class="action-bar">
        <div class="search-area">
          <el-select v-model="selectedCourseId" placeholder="选择课程" @change="handleCourseSelect"
            class="course-select">
            <el-option label="全部课程" value="" />
            <el-option v-for="course in courseList" :key="course.id" :label="course.name" :value="course.id" />
          </el-select>
          <el-select v-model="selectedStatus" placeholder="作业状态" @change="handleStatusSelect"
            class="status-select">
            <el-option label="全部状态" value="" />
            <el-option label="未开始" value="未开始" />
            <el-option label="进行中" value="进行中" />
            <el-option label="已结束" value="已结束" />
          </el-select>
          <el-input v-model="searchKeyword" placeholder="搜索作业" class="search-input" @input="handleSearch">
            <template #suffix>
              <el-icon class="search-icon">
                <Search />
              </el-icon>
            </template>
          </el-input>
        </div>
      </div>
    </div>

    <!-- 作业列表 -->
    <div v-loading="loading" class="homework-list-container">
      <div v-if="loading" class="loading-container">
        <el-skeleton :rows="5" animated />
      </div>
      <div v-else-if="homeworkList.length === 0" class="empty-container">
        <el-empty description="暂无作业" />
      </div>
      <div v-else>
        <el-table :data="homeworkList" style="width: 100%" border stripe :header-cell-style="{ background: '#f5f7fa' }" @row-click="viewHomeworkDetail">
          <el-table-column prop="title" label="作业标题" min-width="180" />
          <el-table-column prop="courseName" label="所属课程" min-width="150" />
          <el-table-column prop="totalScore" label="总分" width="80" />
          <el-table-column label="截止日期" min-width="180">
            <template #default="scope">
              {{ formatDateTimeLocal(scope.row.endTime) }}
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
          <el-table-column label="提交状态" width="120">
            <template #default="scope">
              <el-tag :type="getSubmitStatusType(scope.row)" effect="plain">
                {{ getSubmitStatusText(scope.row) }}
              </el-tag>
            </template>
          </el-table-column>
          <el-table-column label="成绩" width="80">
            <template #default="scope">
              <span v-if="scope.row.score !== null">{{ scope.row.score }}</span>
              <span v-else>-</span>
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

    <!-- 作业详情抽屉 -->
    <el-drawer 
      v-model="drawerVisible" 
      title="作业详情" 
      size="50%" 
      :with-header="true"
      :destroy-on-close="true"
    >
      <div v-if="selectedHomework" class="homework-detail">
        <h3>{{ selectedHomework.title }}</h3>
        <el-descriptions :column="1" border>
          <el-descriptions-item label="所属课程">{{ selectedHomework.courseName }}</el-descriptions-item>
          <el-descriptions-item label="截止日期">
            {{ formatDateTimeLocal(selectedHomework.endTime) }}
          </el-descriptions-item>
          <el-descriptions-item label="总分">{{ selectedHomework.totalScore }}分</el-descriptions-item>
          <el-descriptions-item label="作业状态">
            <el-tag :type="getStatusType(selectedHomework.status)" effect="dark">{{ selectedHomework.status }}</el-tag>
          </el-descriptions-item>
          <el-descriptions-item label="提交状态">
            <el-tag :type="getSubmitStatusType(selectedHomework)" effect="plain">{{ getSubmitStatusText(selectedHomework) }}</el-tag>
          </el-descriptions-item>
          <el-descriptions-item v-if="selectedHomework.score !== null" label="我的成绩">
            <span class="score">{{ selectedHomework.score }}分</span>
          </el-descriptions-item>
          <el-descriptions-item label="作业说明">
            {{ selectedHomework.description || '暂无说明' }}
          </el-descriptions-item>
        </el-descriptions>

        <div class="drawer-footer">
          <el-button 
            v-if="selectedHomework.status === '进行中' && !selectedHomework.submitted" 
            type="primary" 
            @click="submitHomework(selectedHomework)"
          >
            提交作业
          </el-button>
          <el-button 
            v-else-if="selectedHomework.status === '进行中' && selectedHomework.submitted" 
            type="warning" 
            @click="resubmitHomework(selectedHomework)"
          >
            重新提交
          </el-button>
          <el-button 
            v-if="selectedHomework.submitted" 
            type="success" 
            @click="viewHomeworkResult(selectedHomework)"
          >
            查看提交内容
          </el-button>
          <el-button @click="drawerVisible = false">关闭</el-button>
        </div>
      </div>
    </el-drawer>
  </div>
</template>

<script setup>
import { ref, onMounted, onUnmounted } from 'vue'
import { ElMessage } from 'element-plus'
import { useRouter } from 'vue-router'
import { Search, Timer, Calendar, Loading } from '@element-plus/icons-vue'
import { examAPI, courseSelectionAPI } from '@/api/api'

const router = useRouter()

// 作业列表相关数据
const homeworkList = ref([])
const courseList = ref([])
const selectedCourseId = ref('')
const selectedStatus = ref('')
const searchKeyword = ref('')
const loading = ref(false)
const total = ref(0)
const pageSize = ref(10)
const currentPage = ref(1)

// 作业详情抽屉
const drawerVisible = ref(false)
const selectedHomework = ref(null)

// 定时器，用于定期更新作业状态
let statusUpdateTimer = null

// 生命周期钩子
onMounted(() => {
  fetchCourseList()
  fetchHomeworkList()
  
  // 设置定时器，每分钟更新一次作业状态
  statusUpdateTimer = setInterval(() => {
    updateHomeworkStatus()
  }, 60000)
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
    // 从localStorage获取学生ID
    const userInfoStr = localStorage.getItem('user_info')
    if (!userInfoStr) {
      ElMessage.warning('未找到用户信息，请重新登录')
      return
    }
    
    const userInfo = JSON.parse(userInfoStr)
    if (!userInfo || !userInfo.studentId) {
      ElMessage.warning('用户信息不完整或不是学生账号')
      return
    }
    
    // 获取学生选课列表
    const selections = await courseSelectionAPI.getStudentCourses(userInfo.studentId)
    
    // 从选课列表中提取课程信息
    courseList.value = selections.map(selection => ({
      id: selection.courseId,
      name: selection.courseName || `课程 ${selection.courseId}`
    }))
  } catch (error) {
    console.error('获取课程列表失败:', error)
    ElMessage.error('获取课程列表失败，请稍后重试')
    courseList.value = []
  }
}

// 获取作业列表
async function fetchHomeworkList() {
  loading.value = true
  try {
    // 从localStorage获取学生ID
    const userInfoStr = localStorage.getItem('user_info')
    if (!userInfoStr) {
      ElMessage.warning('未找到用户信息，请重新登录')
      loading.value = false
      return
    }
    
    const userInfo = JSON.parse(userInfoStr)
    if (!userInfo || !userInfo.studentId) {
      ElMessage.warning('用户信息不完整或不是学生账号')
      loading.value = false
      return
    }
    
    let homeworks = []
    
    // 如果选择了特定课程，则获取该课程的作业
    if (selectedCourseId.value) {
      const response = await examAPI.getExamsInCourseByType(selectedCourseId.value, 'homework')
      homeworks = response || []
    } else {
      // 否则获取所有课程的作业
      // 先获取学生的所有课程
      const selections = await courseSelectionAPI.getStudentCourses(userInfo.studentId)
      
      // 然后获取每个课程的作业
      const promises = selections.map(selection => 
        examAPI.getExamsInCourseByType(selection.courseId, 'homework')
          .then(exams => exams.map(exam => ({
            ...exam,
            courseName: selection.courseName || `课程 ${selection.courseId}`
          })))
          .catch(err => {
            console.error(`获取课程${selection.courseId}的作业失败:`, err)
            return []
          })
      )
      
      // 等待所有请求完成
      const results = await Promise.all(promises)
      
      // 合并所有课程的作业
      homeworks = results.flat()
    }
    
    // 获取学生的作业提交情况
    const submissionPromises = homeworks.map(homework => 
      examAPI.getStudentExamAnswer(homework.examId, userInfo.studentId)
        .then(submission => ({
          ...homework,
          submitted: !!submission,
          submitTime: submission?.submitTime,
          score: submission?.score
        }))
        .catch(() => ({
          ...homework,
          submitted: false,
          submitTime: null,
          score: null
        }))
    )
    
    // 等待所有提交情况查询完成
    let homeworksWithSubmissions = await Promise.all(submissionPromises)
    
    // 按状态过滤
    if (selectedStatus.value) {
      homeworksWithSubmissions = homeworksWithSubmissions.filter(hw => 
        getHomeworkStatus(hw, new Date()) === selectedStatus.value
      )
    }
    
    // 按关键词搜索
    if (searchKeyword.value) {
      const keyword = searchKeyword.value.toLowerCase()
      homeworksWithSubmissions = homeworksWithSubmissions.filter(hw => 
        (hw.title && hw.title.toLowerCase().includes(keyword)) || 
        (hw.description && hw.description.toLowerCase().includes(keyword)) ||
        (hw.courseName && hw.courseName.toLowerCase().includes(keyword))
      )
    }
    
    // 更新作业状态
    homeworksWithSubmissions.forEach(homework => {
      homework.status = getHomeworkStatus(homework, new Date())
    })
    
    // 更新作业列表和总数
    homeworkList.value = homeworksWithSubmissions
    total.value = homeworksWithSubmissions.length
  } catch (error) {
    console.error('获取作业列表失败:', error)
    ElMessage.error('获取作业列表失败，请稍后重试')
    homeworkList.value = []
    total.value = 0
  } finally {
    loading.value = false
  }
}

// 获取作业状态
function getHomeworkStatus(homework, now) {
  if (!homework.endTime) return '进行中'
  
  const deadline = new Date(homework.endTime)
  
  if (now > deadline) {
    return '已结束'
  } else {
    return '进行中'
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

// 获取状态标签类型
function getStatusType(status) {
  switch (status) {
    case '未开始':
      return 'info'
    case '进行中':
      return 'primary'
    case '已结束':
      return 'danger'
    default:
      return 'info'
  }
}

// 获取提交状态文本
function getSubmitStatusText(homework) {
  if (!homework.submitted) {
    return '未提交'
  }
  
  const submitTime = new Date(homework.submitTime)
  const deadline = new Date(homework.endTime)
  
  if (submitTime > deadline) {
    return '逾期提交'
  } else {
    return '已提交'
  }
}

// 获取提交状态标签类型
function getSubmitStatusType(homework) {
  if (!homework.submitted) {
    return 'danger'
  }
  
  const submitTime = new Date(homework.submitTime)
  const deadline = new Date(homework.endTime)
  
  if (submitTime > deadline) {
    return 'warning'
  } else {
    return 'success'
  }
}

// 处理课程选择
function handleCourseSelect() {
  fetchHomeworkList()
}

// 处理状态选择
function handleStatusSelect() {
  fetchHomeworkList()
}

// 处理搜索
function handleSearch() {
  fetchHomeworkList()
}

// 处理分页
function handlePageChange(page) {
  currentPage.value = page
  fetchHomeworkList()
}

// 查看作业详情
function viewHomeworkDetail(homework) {
  selectedHomework.value = homework
  drawerVisible.value = true
}

// 提交作业
function submitHomework(homework) {
  if (homework.status !== '进行中') {
    ElMessage.warning('作业已截止或未开始')
    return
  }
  
  router.push({
    name: 'studentHomeworkSubmit',
    params: { homeworkId: homework.examId }
  })
}

// 重新提交作业
function resubmitHomework(homework) {
  if (homework.status !== '进行中') {
    ElMessage.warning('作业已截止或未开始')
    return
  }
  
  router.push({
    name: 'studentHomeworkSubmit',
    params: { homeworkId: homework.examId },
    query: { mode: 'resubmit' }
  })
}

// 查看作业结果
function viewHomeworkResult(homework) {
  if (!homework.submitted) {
    ElMessage.warning('尚未提交作业')
    return
  }
  
  router.push({
    name: 'studentHomeworkDetail',
    params: { homeworkId: homework.examId },
    query: { mode: 'result' }
  })
}

// 更新作业状态
function updateHomeworkStatus() {
  const now = new Date()
  
  // 更新每个作业的状态
  homeworkList.value.forEach(homework => {
    homework.status = getHomeworkStatus(homework, now)
  })
}
</script>

<style scoped>
.homework-container {
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
  border-left: 4px solid #409EFF;
  padding-left: 12px;
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

.homework-list-container {
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

.homework-detail {
  padding: 0 20px;
}

.homework-detail h3 {
  margin-top: 0;
  margin-bottom: 20px;
  font-size: 20px;
  color: #303133;
}

.drawer-footer {
  margin-top: 30px;
  display: flex;
  justify-content: flex-end;
  gap: 12px;
}

.score {
  font-weight: bold;
  color: #67c23a;
  font-size: 16px;
}
</style>