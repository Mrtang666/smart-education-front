<template>
  <div class="homework-detail-container">
    <div class="page-header">
      <el-page-header @back="goBack" :title="courseName" :content="homeworkTitle" />
    </div>
    
    <div class="main-content">
      <div class="homework-title-container">
        <h1 class="homework-title">{{ homeworkTitle }}</h1>
        <div class="header-actions">
          <el-button type="success" @click="saveHomework" :loading="isSaving">保存作业</el-button>
          <el-button type="primary" @click="publishHomework" v-if="homeworkData.status === 'DRAFT'">发布作业</el-button>
        </div>
      </div>
      
      <el-tabs v-model="activeTab" class="main-tabs">
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
        
        <!-- 提交列表暂未开发 
        <el-tab-pane label="学生提交情况" name="submissions" v-if="homeworkData.status !== 'DRAFT'">
          <SubmissionsList 
            :homework-id="homeworkId" 
            :submissions="submissions"
          />
        </el-tab-pane>
        -->
      </el-tabs>
    </div>
    
    <!-- 添加题目对话框 -->
    <el-dialog
      v-model="addProblemDialogVisible"
      :title="problemDialogTitle"
      width="800px"
      destroy-on-close
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
import { assignmentAPI, problemAPI } from '@/api/api'
// import BigNumber from 'bignumber.js'

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
const courseName = ref(route.query.courseName || '课程')

// 页面状态
const activeTab = ref('basic')
const isSaving = ref(false)
const isLoading = ref(true)

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
  status: 'DRAFT'
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
  router.back()
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
        status: response.status || 'DRAFT'
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
      maxAttempts: newData.maxAttempts
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
      status: homeworkData.value.status || 'DRAFT'
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
    let response
    
    if (problemData.problemId) {
      // 更新题目
      response = await problemAPI.updateProblem(problemData)
    } else {
      // 创建新题目
      response = await problemAPI.saveProblem(problemData)
    }
    
    if (response) {
      // 刷新题目列表
      await fetchProblems()
      
      // 关闭对话框
      addProblemDialogVisible.value = false
      
      ElMessage.success('题目保存成功')
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
.homework-detail-container {
  padding: 20px;
}

.page-header {
  margin-bottom: 20px;
}

.main-content {
  background-color: #fff;
  border-radius: 8px;
  padding: 20px;
  box-shadow: 0 2px 12px 0 rgba(0, 0, 0, 0.1);
}

.homework-title-container {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
  padding-bottom: 15px;
  border-bottom: 1px solid #eee;
}

.homework-title {
  margin: 0;
  font-size: 28px;
  color: #333;
}

.header-actions {
  display: flex;
  gap: 10px;
}

.main-tabs {
  margin-top: 20px;
}
</style>









