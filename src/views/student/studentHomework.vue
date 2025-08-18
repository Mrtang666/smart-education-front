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
            <el-option label="草稿" value="DRAFT" />
            <el-option label="已发布" value="PUBLISHED" />
            <el-option label="已结束" value="ENDED" />
          </el-select>
          <el-input v-model="searchKeyword" placeholder="搜索作业" class="search-input" @input="handleSearch">
            <template #suffix>
              <el-icon class="search-icon">
                <Search />
              </el-icon>
            </template>
          </el-input>
        </div>

        <!-- AI生成练习按钮 -->
        <div class="ai-exercise-area">
          <el-button type="primary" @click="showAIExerciseDialog" :loading="aiGenerating">
            <el-icon><MagicStick /></el-icon>
            AI生成练习
          </el-button>
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
                <el-icon v-if="scope.row.status === 'DRAFT' || scope.row.status === '未开始'">
                  <Calendar />
                </el-icon>
                <el-icon v-else-if="scope.row.status === 'PUBLISHED' || scope.row.status === '进行中'">
                  <Loading />
                </el-icon>
                <el-icon v-else-if="scope.row.status === 'ENDED' || scope.row.status === '已结束'">
                  <Timer />
                </el-icon>
                {{ getStatusText(scope.row.status) }}
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

    <!-- AI生成练习对话框 -->
    <el-dialog v-model="aiExerciseDialogVisible" title="AI生成练习" width="900px" :close-on-click-modal="false">
      <div class="ai-exercise-container">
        <!-- 左侧：生成表单 -->
        <div class="generate-form-section">
          <el-form :model="aiExerciseForm" :rules="aiExerciseRules" ref="aiExerciseFormRef" label-width="120px">
            <el-form-item label="生成方式" prop="generateType">
              <el-radio-group v-model="aiExerciseForm.generateType">
                <el-radio value="course">根据课程生成</el-radio>
                <el-radio value="knowledge">根据知识点生成</el-radio>
              </el-radio-group>
            </el-form-item>

            <el-form-item v-if="aiExerciseForm.generateType === 'course'" label="选择课程" prop="courseName">
              <el-select v-model="aiExerciseForm.courseName" placeholder="请选择课程" style="width: 100%">
                <el-option v-for="course in courseList" :key="course.id" :label="course.name" :value="course.name" />
              </el-select>
            </el-form-item>

            <el-form-item v-if="aiExerciseForm.generateType === 'knowledge'" label="知识点名称" prop="knowledgeNamesInput">
              <el-input
                v-model="aiExerciseForm.knowledgeNamesInput"
                placeholder="请输入知识点名称，多个知识点用逗号分隔"
                type="textarea"
                :rows="3"
              />
              <div class="form-tip">例如：线性代数，微积分，概率论</div>
            </el-form-item>

            <el-form-item label="难度等级" prop="difficultyLevel">
              <el-select v-model="aiExerciseForm.difficultyLevel" placeholder="请选择难度等级">
                <el-option label="简单" value="简单" />
                <el-option label="中等" value="中等" />
                <el-option label="困难" value="困难" />
              </el-select>
            </el-form-item>

            <el-form-item label="题目数量" prop="questionCount">
              <el-input-number
                v-model="aiExerciseForm.questionCount"
                :min="1"
                :max="20"
                placeholder="请输入题目数量"
              />
              <div class="form-tip">建议：题目数量越多，生成时间越长。首次使用建议选择5题以下。</div>
            </el-form-item>

            <el-form-item label="练习标题" prop="exerciseTitle">
              <el-input v-model="aiExerciseForm.exerciseTitle" placeholder="请输入练习标题" />
            </el-form-item>

            <el-form-item>
              <el-button type="primary" @click="generateAIExercise" :loading="aiGenerating">
                生成练习
              </el-button>
            </el-form-item>
          </el-form>
        </div>

        <!-- 右侧：生成结果展示 -->
        <div class="generated-content-section" v-if="generatedQuestions.length > 0">
          <div class="section-header">
            <h3>生成的题目 ({{ generatedQuestions.length }}题)</h3>
          </div>

          <div class="questions-container">
            <div v-for="(question, index) in generatedQuestions" :key="index" class="question-item">
              <div class="question-header">
                <span class="question-number">第{{ index + 1 }}题</span>
                <el-tag :type="getQuestionTypeTag(question.type)" size="small">{{ getQuestionTypeText(question.type) }}</el-tag>
              </div>

              <div class="question-content">
                <div class="question-title" v-html="question.title"></div>
                <div class="question-body" v-html="question.content"></div>

                <!-- 选择题选项 -->
                <div v-if="question.options && question.options.length > 0" class="question-options">
                  <div v-for="(option, optIndex) in question.options" :key="optIndex" class="option-item">
                    <span class="option-label">{{ String.fromCharCode(65 + optIndex) }}.</span>
                    <span class="option-text" v-html="option"></span>
                  </div>
                </div>
              </div>

              <div class="question-meta">
                <div class="answer-section">
                  <strong>答案：</strong>
                  <span class="answer-text" v-html="question.expectedAnswer"></span>
                </div>
                <div v-if="question.analysis" class="analysis-section">
                  <strong>解析：</strong>
                  <span class="analysis-text" v-html="question.analysis"></span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <template #footer>
        <div class="dialog-footer">
          <el-button @click="closeAIDialog">取消</el-button>
          <el-button
            v-if="generatedQuestions.length > 0"
            type="success"
            @click="saveGeneratedExercise"
            :loading="savingExercise"
          >
            保存为练习
          </el-button>
        </div>
      </template>
    </el-dialog>

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
            v-if="selectedHomework.status === 'PUBLISHED' && !selectedHomework.submitted" 
            type="primary" 
            @click="submitHomework(selectedHomework)"
          >
            提交作业
          </el-button>
          <el-button 
            v-else-if="selectedHomework.status === 'PUBLISHED' && selectedHomework.submitted" 
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
import { ElMessage, ElLoading } from 'element-plus'
import { useRouter } from 'vue-router'
import { Search, Timer, Calendar, Loading, MagicStick } from '@element-plus/icons-vue'
import { examAPI, courseSelectionAPI, studentAssistantAPI, assignmentAPI, problemAPI, studentExamAPI } from '@/api/api'
import { getAIErrorMessage } from '@/utils/aiHelper'

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

// AI生成练习相关
const aiExerciseDialogVisible = ref(false)
const aiGenerating = ref(false)
const savingExercise = ref(false)
const aiExerciseFormRef = ref(null)
const generatedQuestions = ref([])
const aiExerciseForm = ref({
  generateType: 'course',
  courseName: '',
  knowledgeNamesInput: '',
  difficultyLevel: '中等',
  questionCount: 5,
  exerciseTitle: ''
})

const aiExerciseRules = {
  generateType: [
    { required: true, message: '请选择生成方式', trigger: 'change' }
  ],
  courseName: [
    { required: true, message: '请选择课程', trigger: 'change' }
  ],
  knowledgeNamesInput: [
    { required: true, message: '请输入知识点名称', trigger: 'blur' }
  ],
  difficultyLevel: [
    { required: true, message: '请选择难度等级', trigger: 'change' }
  ],
  questionCount: [
    { required: true, message: '请输入题目数量', trigger: 'blur' },
    { type: 'number', min: 1, max: 20, message: '题目数量应在1-20之间', trigger: 'blur' }
  ],
  exerciseTitle: [
    { required: true, message: '请输入练习标题', trigger: 'blur' }
  ]
}

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
      studentExamAPI.getStudentExamAnswers(userInfo.studentId, homework.examId)
        .then(submissions => {
          // getStudentExamAnswers 返回的是数组，如果有提交记录则数组不为空
          const hasSubmission = submissions && submissions.length > 0
          const submission = hasSubmission ? submissions[0] : null
          return {
            ...homework,
            submitted: hasSubmission,
            submitTime: submission?.submitTime,
            score: submission?.score
          }
        })
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
  if (!homework.endTime) return 'PUBLISHED'
  
  const deadline = new Date(homework.endTime)
    
    if (now > deadline) {
    return 'ENDED'
    } else {
    return 'PUBLISHED'
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
    case 'DRAFT':
    case '未开始':
      return 'info'
    case 'PUBLISHED':
    case '进行中':
      return 'primary'
    case 'ENDED':
    case '已结束':
      return 'danger'
    default:
      return 'info'
  }
}

// 获取状态显示文本
function getStatusText(status) {
  switch (status) {
    case 'DRAFT':
      return '草稿'
    case 'PUBLISHED':
      return '已发布'
    case 'ENDED':
      return '已结束'
    // 兼容旧的中文状态值
    case '未开始':
      return '未开始'
    case '进行中':
      return '进行中'
    case '已结束':
      return '已结束'
    default:
      return status || '未知状态'
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
  if (homework.status !== 'PUBLISHED') {
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
  if (homework.status !== 'PUBLISHED') {
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

// 显示AI生成练习对话框
function showAIExerciseDialog() {
  // 重置表单
  aiExerciseForm.value = {
    generateType: 'course',
    courseName: '',
    knowledgeNamesInput: '',
    difficultyLevel: '中等',
    questionCount: 5,
    exerciseTitle: ''
  }

  aiExerciseDialogVisible.value = true
}

// 生成AI练习
async function generateAIExercise() {
  let loadingInstance = null

  try {
    // 表单验证
    if (!aiExerciseFormRef.value) return
    const valid = await aiExerciseFormRef.value.validate()
    if (!valid) return

    // 获取用户信息
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

    aiGenerating.value = true

    // 显示详细的加载提示
    loadingInstance = ElLoading.service({
      lock: true,
      text: 'AI正在生成练习题目，请耐心等待...',
      spinner: 'el-icon-loading',
      background: 'rgba(0, 0, 0, 0.7)'
    })

    // 根据生成方式调用不同的API
    let aiResponse
    try {
      if (aiExerciseForm.value.generateType === 'course') {
        // 根据课程名称生成
        aiResponse = await studentAssistantAPI.generateExerciseByCourseName(
          userInfo.studentId,
          aiExerciseForm.value.courseName,
          aiExerciseForm.value.difficultyLevel,
          aiExerciseForm.value.questionCount
        )
      } else {
        // 根据知识点名称生成
        const knowledgeNames = aiExerciseForm.value.knowledgeNamesInput
          .split(',')
          .map(name => name.trim())
          .filter(name => name.length > 0)

        if (knowledgeNames.length === 0) {
          ElMessage.error('请输入有效的知识点名称')
          return
        }

        aiResponse = await studentAssistantAPI.generateExerciseByKnowledgeNames(
          userInfo.studentId,
          knowledgeNames,
          aiExerciseForm.value.difficultyLevel,
          aiExerciseForm.value.questionCount
        )
      }
    } catch (apiError) {
      // 如果是405错误，使用模拟数据进行演示
      if (apiError.response && apiError.response.status === 405) {
        console.log('后端接口不可用，使用模拟数据演示')
        aiResponse = generateMockAIResponse(aiExerciseForm.value)
      } else {
        throw apiError
      }
    }

    console.log('AI生成练习响应:', aiResponse)

    // 解析AI生成的题目 - 处理新的返回格式
    const questions = parseNewAIResponse(aiResponse)

    if (questions.length === 0) {
      ElMessage.error('AI生成的题目格式有误，请重试')
      return
    }

    // 将生成的题目存储到响应式数据中用于展示
    generatedQuestions.value = questions

    ElMessage.success(`成功生成 ${questions.length} 道练习题！`)

  } catch (error) {
    console.error('生成AI练习失败:', error)

    // 使用辅助函数获取友好的错误提示
    const errorMessage = getAIErrorMessage(error)
    ElMessage.error(errorMessage)
  } finally {
    aiGenerating.value = false

    // 关闭加载提示
    if (loadingInstance) {
      loadingInstance.close()
    }
  }
}



// 创建练习作业并持久化题目
async function createExerciseAssignment(questions, studentId) {
  try {
    console.log('开始创建练习作业...')

    // 创建作业
    const assignmentData = {
      type: 'STUDENT_GENERATED', // 学生自主生成类型
      creatorId: studentId,
      courseId: null, // AI生成的练习不绑定特定课程
      title: aiExerciseForm.value.exerciseTitle,
      description: `AI生成的${aiExerciseForm.value.generateType === 'course' ? '课程' : '知识点'}练习`,
      isAnswerPublic: true,
      isScoreVisible: true,
      isRedoAllowed: true,
      maxAttempts: 3,
      startTime: new Date().toISOString(),
      endTime: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(), // 7天后截止
      status: 'PUBLISHED'
    }

    console.log('创建作业数据:', assignmentData)
    const assignmentResponse = await assignmentAPI.saveAssignment(assignmentData)
    console.log('作业创建成功:', assignmentResponse)

    const assignmentId = assignmentResponse.assignmentId || assignmentResponse.id

    // 批量创建题目
    for (const question of questions) {
      const problemData = {
        assignmentId: assignmentId,
        originType: 'AI_GENERATED',
        title: question.title,
        content: question.content,
        type: question.type,
        autoGrading: question.autoGrading,
        expectedAnswer: question.expectedAnswer,
        score: question.score,
        sequence: question.sequence,
        analysis: question.analysis,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      }

      console.log('创建题目数据:', problemData)
      await problemAPI.saveProblem(problemData)
    }

    console.log('所有题目创建完成')

  } catch (error) {
    console.error('创建练习作业失败:', error)
    throw new Error('创建练习作业失败: ' + (error.message || '未知错误'))
  }
}

// 解析新的AI响应格式
function parseNewAIResponse(aiResponse) {
  try {
    console.log('解析AI响应:', aiResponse)

    // 假设AI返回的是字符串格式，包含题目信息
    const content = aiResponse.content || aiResponse.result || aiResponse
    if (!content || typeof content !== 'string') {
      console.error('AI响应格式错误:', content)
      return []
    }

    const questions = []

    // 按行分割内容
    const lines = content.split('\n').filter(line => line.trim())

    let currentQuestion = null
    let questionIndex = 0

    for (const line of lines) {
      const trimmedLine = line.trim()

      // 检测题目开始
      if (trimmedLine.startsWith('题目[') && trimmedLine.includes(']:')) {
        // 如果有之前的题目，先保存
        if (currentQuestion) {
          questions.push(currentQuestion)
        }

        // 开始新题目
        questionIndex++
        const titleMatch = trimmedLine.match(/题目\[.*?\]:\s*(.+)/)
        currentQuestion = {
          id: questionIndex,
          title: titleMatch ? titleMatch[1] : `题目${questionIndex}`,
          content: '',
          type: 'SINGLE_CHOICE', // 默认单选题
          options: [],
          expectedAnswer: '',
          analysis: '',
          score: 10,
          sequence: questionIndex,
          autoGrading: true
        }
      }
      // 检测题目内容
      else if (trimmedLine.startsWith('题目内容:') && currentQuestion) {
        currentQuestion.content = trimmedLine.replace('题目内容:', '').trim()
      }
      // 检测选择题选项
      else if (trimmedLine.match(/^[A-D]\.\s*/) && currentQuestion) {
        const optionText = trimmedLine.substring(2).trim()
        currentQuestion.options.push(optionText)
        currentQuestion.type = currentQuestion.options.length > 0 ? 'SINGLE_CHOICE' : 'SHORT_ANSWER'
      }
      // 检测答案
      else if (trimmedLine.startsWith('答案:') && currentQuestion) {
        currentQuestion.expectedAnswer = trimmedLine.replace('答案:', '').trim()
      }
      // 检测解析
      else if (trimmedLine.startsWith('解析:') && currentQuestion) {
        currentQuestion.analysis = trimmedLine.replace('解析:', '').trim()
      }
    }

    // 保存最后一个题目
    if (currentQuestion) {
      questions.push(currentQuestion)
    }

    console.log('解析得到的题目:', questions)
    return questions

  } catch (error) {
    console.error('解析AI响应失败:', error)
    return []
  }
}

// 获取题目类型标签颜色
function getQuestionTypeTag(type) {
  switch (type) {
    case 'SINGLE_CHOICE':
      return 'primary'
    case 'MULTI_CHOICE':
      return 'success'
    case 'SHORT_ANSWER':
      return 'warning'
    case 'ESSAY':
      return 'info'
    default:
      return 'default'
  }
}

// 获取题目类型文本
function getQuestionTypeText(type) {
  switch (type) {
    case 'SINGLE_CHOICE':
      return '单选题'
    case 'MULTI_CHOICE':
      return '多选题'
    case 'SHORT_ANSWER':
      return '简答题'
    case 'ESSAY':
      return '论述题'
    default:
      return '未知类型'
  }
}

// 关闭AI对话框
function closeAIDialog() {
  aiExerciseDialogVisible.value = false
  generatedQuestions.value = []
}

// 保存生成的练习
async function saveGeneratedExercise() {
  if (generatedQuestions.value.length === 0) {
    ElMessage.warning('没有可保存的题目')
    return
  }

  try {
    savingExercise.value = true

    // 获取用户信息
    const userInfoStr = localStorage.getItem('user_info')
    const userInfo = JSON.parse(userInfoStr)

    // 创建作业并持久化题目
    await createExerciseAssignment(generatedQuestions.value, userInfo.studentId)

    ElMessage.success(`成功保存 ${generatedQuestions.value.length} 道练习题！`)
    aiExerciseDialogVisible.value = false
    generatedQuestions.value = []

    // 刷新作业列表
    await fetchHomeworkList()

  } catch (error) {
    console.error('保存练习失败:', error)
    ElMessage.error('保存练习失败，请重试')
  } finally {
    savingExercise.value = false
  }
}

// 生成模拟AI响应数据（用于演示）
function generateMockAIResponse(formData) {
  const questionCount = formData.questionCount || 3

  const sampleQuestions = [
    {
      title: "线性代数基础概念",
      content: "下列关于矩阵的说法正确的是？",
      options: ["矩阵的行数必须等于列数", "矩阵的乘法满足交换律", "单位矩阵的对角线元素都是1", "所有矩阵都有逆矩阵"],
      answer: "C",
      analysis: "单位矩阵是主对角线上的元素都是1，其余元素都是0的方阵。"
    },
    {
      title: "微积分应用",
      content: "函数f(x) = x²在点x=2处的导数值是多少？",
      options: ["2", "4", "8", "16"],
      answer: "B",
      analysis: "f'(x) = 2x，所以f'(2) = 2×2 = 4"
    },
    {
      title: "概率论基础",
      content: "抛掷一枚公平硬币3次，恰好出现2次正面的概率是？",
      options: ["1/8", "3/8", "1/2", "5/8"],
      answer: "B",
      analysis: "使用二项分布公式：C(3,2) × (1/2)³ = 3 × 1/8 = 3/8"
    },
    {
      title: "数据结构",
      content: "栈的特点是什么？",
      options: ["先进先出", "后进先出", "随机访问", "双向访问"],
      answer: "B",
      analysis: "栈是一种后进先出(LIFO)的数据结构，最后压入的元素最先弹出。"
    },
    {
      title: "算法复杂度",
      content: "冒泡排序的时间复杂度是？",
      options: ["O(n)", "O(n log n)", "O(n²)", "O(2ⁿ)"],
      answer: "C",
      analysis: "冒泡排序需要进行n-1轮比较，每轮最多比较n-1次，所以时间复杂度是O(n²)。"
    }
  ]

  // 根据生成类型和知识点调整题目内容
  let selectedQuestions = sampleQuestions.slice(0, questionCount)

  if (formData.generateType === 'knowledge' && formData.knowledgeNamesInput) {
    const knowledgeNames = formData.knowledgeNamesInput.split(',').map(name => name.trim())
    // 可以根据知识点名称调整题目内容
    selectedQuestions = selectedQuestions.map((q, index) => ({
      ...q,
      title: `${knowledgeNames[index % knowledgeNames.length]}相关题目${index + 1}`
    }))
  }

  // 构造符合解析格式的响应
  let content = ""
  selectedQuestions.forEach((q, index) => {
    content += `题目[题目${index + 1}]: ${q.title}\n`
    content += `题目内容: ${q.content}\n`
    q.options.forEach((option, optIndex) => {
      content += `${String.fromCharCode(65 + optIndex)}. ${option}\n`
    })
    content += `答案: ${q.answer}\n`
    content += `解析: ${q.analysis}\n\n`
  })

  return { content }
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
  justify-content: space-between;
}

.search-area {
  display: flex;
  gap: 12px;
}

.ai-exercise-area {
  margin-left: auto;
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

.form-tip {
  font-size: 12px;
  color: #909399;
  margin-top: 4px;
}

/* AI生成练习对话框样式 */
.ai-exercise-container {
  display: flex;
  gap: 20px;
  max-height: 600px;
}

.generate-form-section {
  flex: 0 0 400px;
  border-right: 1px solid #e4e7ed;
  padding-right: 20px;
}

.generated-content-section {
  flex: 1;
  overflow-y: auto;
  padding-left: 20px;
}

.section-header {
  margin-bottom: 16px;
  padding-bottom: 8px;
  border-bottom: 1px solid #e4e7ed;
}

.section-header h3 {
  margin: 0;
  color: #303133;
  font-size: 16px;
}

.questions-container {
  max-height: 500px;
  overflow-y: auto;
}

.question-item {
  background: #f8f9fa;
  border: 1px solid #e4e7ed;
  border-radius: 8px;
  padding: 16px;
  margin-bottom: 16px;
}

.question-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 12px;
}

.question-number {
  font-weight: bold;
  color: #409eff;
  font-size: 14px;
}

.question-content {
  margin-bottom: 12px;
}

.question-title {
  font-weight: bold;
  color: #303133;
  margin-bottom: 8px;
  font-size: 15px;
}

.question-body {
  color: #606266;
  line-height: 1.6;
  margin-bottom: 12px;
}

.question-options {
  margin: 12px 0;
}

.option-item {
  display: flex;
  align-items: flex-start;
  margin-bottom: 8px;
  padding: 6px 0;
}

.option-label {
  font-weight: bold;
  color: #409eff;
  margin-right: 8px;
  min-width: 20px;
}

.option-text {
  color: #606266;
  line-height: 1.5;
}

.question-meta {
  border-top: 1px solid #e4e7ed;
  padding-top: 12px;
  margin-top: 12px;
}

.answer-section,
.analysis-section {
  margin-bottom: 8px;
}

.answer-section strong,
.analysis-section strong {
  color: #67c23a;
  margin-right: 8px;
}

.answer-text {
  color: #67c23a;
  font-weight: 500;
}

.analysis-text {
  color: #606266;
  line-height: 1.5;
}
</style>