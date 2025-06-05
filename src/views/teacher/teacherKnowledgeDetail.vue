<!-- 这边我还没做好，等我明天做，你先别动 -->
<template>
  <div class="knowledge-detail-container">
    <div class="knowledge-header">
      <div class="header-content">
        <div class="back-button" @click="goBack">
          <el-icon><ArrowLeft /></el-icon>
          <span>返回</span>
        </div>
        <h1 class="knowledge-title">{{ knowledgeName }} 知识点详情</h1>
      </div>
      <div class="knowledge-actions">
        <el-button type="primary" plain @click="editKnowledge">
          <el-icon><Edit /></el-icon>
          编辑知识点
        </el-button>
      </div>
    </div>

    <div class="knowledge-content">
      <!-- 习题区域 -->
      <div class="detail-card questions-card">
        <div class="card-header">
          <h3>相关习题 ({{ questions.length }})</h3>
          <div class="header-actions">
            <el-button type="success" size="small" @click="practiceQuestions" :disabled="questions.length === 0">
              <el-icon><CaretRight /></el-icon>开始练习
            </el-button>
            <el-button type="primary" size="small" @click="addQuestion">
              <el-icon><Plus /></el-icon>添加习题
            </el-button>
          </div>
        </div>
        
        <!-- 搜索和过滤区域 -->
        <div class="search-filter-container">
          <div class="search-box">
            <el-input
              v-model="searchKeyword"
              placeholder="搜索题目内容"
              clearable
              @keyup.enter="searchQuestions"
              @clear="resetSearch"
            >
              <template #suffix>
                <el-icon class="search-icon" @click="searchQuestions"><Search /></el-icon>
              </template>
            </el-input>
          </div>
          
          <div class="filter-box">
            <el-select v-model="filterConditions.questionType" placeholder="题目类型" clearable @change="applyFilters">
              <el-option label="选择题" value="选择题"></el-option>
              <el-option label="填空题" value="填空题"></el-option>
              <el-option label="判断题" value="判断题"></el-option>
              <el-option label="简答题" value="简答题"></el-option>
            </el-select>
            
            <el-select v-model="filterConditions.difficulty" placeholder="难度等级" clearable @change="applyFilters">
              <el-option label="简单" value="简单"></el-option>
              <el-option label="中等" value="中等"></el-option>
              <el-option label="困难" value="困难"></el-option>
            </el-select>
            
            <el-date-picker
              v-model="dateRange"
              type="daterange"
              range-separator="至"
              start-placeholder="开始日期"
              end-placeholder="结束日期"
              format="YYYY-MM-DD"
              value-format="YYYY-MM-DD"
              @change="applyFilters"
            ></el-date-picker>
            
            <el-button type="primary" plain @click="resetFilters">重置筛选</el-button>
          </div>
        </div>
        
        <div class="card-body">
          <div v-if="loading" class="loading-container">
            <el-skeleton :rows="5" animated />
          </div>
          <div v-else-if="questions.length === 0" class="empty-tip">
            <el-empty description="暂无相关习题" :image-size="100">
              <template #image>
                <el-icon style="font-size: 50px; color: #909399;"><DocumentRemove /></el-icon>
              </template>
              <el-button type="primary" @click="addQuestion">添加习题</el-button>
            </el-empty>
          </div>
          <div v-else class="questions-list">
            <div v-for="(question, index) in displayQuestions" :key="question.questionId" class="question-item">
              <div class="question-header">
                <div class="question-index">{{ (currentPage - 1) * pageSize + index + 1 }}</div>
                <div class="question-type">
                  <el-tag size="small">{{ question.questionType }}</el-tag>
                </div>
                <div class="question-difficulty">
                  <el-tag size="small" :type="getQuestionDifficultyType(question.difficulty)">{{ question.difficulty }}</el-tag>
                </div>
              </div>
              <div class="question-content">
                <div class="question-title">{{ question.content }}</div>
                <div class="question-options" v-if="question.options && question.options.length > 0">
                  <div v-for="option in question.options" :key="option.key" class="option-item">
                    <span class="option-key">{{ option.key }}.</span>
                    <span class="option-text">{{ option.text }}</span>
                  </div>
                </div>
                <div class="question-answer" v-if="question.referenceAnswer">
                  <div class="answer-label">参考答案:</div>
                  <div class="answer-content">{{ question.referenceAnswer }}</div>
                </div>
              </div>
              <div class="question-footer">
                <el-tag size="small" type="info" class="score-tag">{{ question.scorePoints || 0 }}分</el-tag>
                <div class="question-actions">
                  <el-button link type="primary" @click="viewQuestion(question)">查看详情</el-button>
                  <el-button link type="primary" @click="editQuestion(question)">编辑</el-button>
                  <el-button link type="danger" @click="deleteQuestion(question)">删除</el-button>
                </div>
              </div>
            </div>
          </div>
          
          <!-- 分页控件 -->
          <div class="pagination-container" v-if="questions.length > 0">
            <el-pagination
              v-model:current-page="currentPage"
              v-model:page-size="pageSize"
              :page-sizes="[5, 10, 20, 50]"
              layout="total, sizes, prev, pager, next, jumper"
              :total="questions.length"
              @size-change="handleSizeChange"
              @current-change="handleCurrentChange"
              background
            />
          </div>
        </div>
      </div>
    </div>

    <!-- 编辑知识点对话框 -->
    <el-dialog v-model="editDialogVisible" title="编辑知识点" width="500px">
      <el-form :model="editForm" label-width="100px" :rules="rules" ref="formRef">
        <el-form-item label="知识点名称" prop="name">
          <el-input v-model="editForm.name" placeholder="请输入知识点名称" />
        </el-form-item>
        <el-form-item label="所属课程">
          <el-input v-model="courseName" disabled />
        </el-form-item>
        <el-form-item label="难度等级" prop="difficultyLevel">
          <el-select v-model="editForm.difficultyLevel" placeholder="请选择难度等级">
            <el-option label="简单" value="简单"></el-option>
            <el-option label="中等" value="中等"></el-option>
            <el-option label="困难" value="困难"></el-option>
          </el-select>
        </el-form-item>
        <el-form-item label="描述">
          <el-input v-model="editForm.description" type="textarea" :rows="3" placeholder="请输入知识点描述" />
        </el-form-item>
        <el-form-item label="教学计划">
          <el-input v-model="editForm.teachPlan" type="textarea" :rows="3" placeholder="请输入教学计划" />
        </el-form-item>
      </el-form>
      <template #footer>
        <div class="dialog-footer">
          <el-button @click="editDialogVisible = false">取消</el-button>
          <el-button type="primary" @click="saveKnowledge">保存</el-button>
        </div>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, onMounted, computed } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { ElMessage, ElMessageBox } from 'element-plus'
import { ArrowLeft, Edit, Plus, CaretRight, DocumentRemove, Search } from '@element-plus/icons-vue'
import { knowledgeAPI } from '@/api/api'
import BigNumber from 'bignumber.js'

const route = useRoute()
const router = useRouter()
const knowledgeId = route.params.knowledgeId // 从路由参数中获取知识点ID
const courseName = ref(route.query.courseName || '未知课程')
const knowledgeName = ref(route.query.knowledgeName || '知识点')
// 获取课程ID，用于返回课程时可能需要
const courseIdFromQuery = route.query.courseId

// 知识点数据
const knowledgeData = ref(null)
const loading = ref(true)

// 编辑对话框
const editDialogVisible = ref(false)
const formRef = ref(null)
const editForm = ref({
  name: '',
  difficultyLevel: '中等',
  description: '',
  teachPlan: ''
})

// 表单验证规则
const rules = {
  name: [
    { required: true, message: '请输入知识点名称', trigger: 'blur' },
    { min: 2, max: 50, message: '长度在 2 到 50 个字符', trigger: 'blur' }
  ],
  difficultyLevel: [
    { required: true, message: '请选择难度等级', trigger: 'change' }
  ]
}

// 相关习题
const questions = ref([])
// 分页相关
const currentPage = ref(1)
const pageSize = ref(10)

// 搜索和过滤
const searchKeyword = ref('')
const dateRange = ref([])
const filterConditions = ref({
  questionType: '',
  difficulty: '',
  startTime: '',
  endTime: ''
})

// 计算属性：当前页显示的题目
const displayQuestions = computed(() => {
  const start = (currentPage.value - 1) * pageSize.value
  const end = start + pageSize.value
  return questions.value.slice(start, end)
})

// 获取知识点详情
async function fetchKnowledgeDetail() {
  loading.value = true
  try {
    // 确保知识点ID是字符串形式
    const knowledgeIdStr = knowledgeId ? new BigNumber(knowledgeId).toString() : knowledgeId
    console.log('获取知识点详情，知识点ID:', knowledgeIdStr)
    
    const response = await knowledgeAPI.getKnowledgeById(knowledgeIdStr)
    console.log('获取到的知识点详情:', response)
    
    if (response) {
      knowledgeData.value = response
      knowledgeName.value = response.name || '未命名知识点'
      
      // 初始化编辑表单
      editForm.value = {
        name: response.name || '',
        difficultyLevel: response.difficultyLevel || '中等',
        description: response.description || '',
        teachPlan: response.teachPlan || ''
      }
      
      // 获取相关习题
      await fetchQuestions()
    } else {
      ElMessage.error('获取知识点详情失败')
      knowledgeData.value = null
    }
  } catch (error) {
    console.error('获取知识点详情失败:', error)
    ElMessage.error('获取知识点详情失败，请稍后重试')
    knowledgeData.value = null
  } finally {
    loading.value = false
  }
}

// 获取相关习题
async function fetchQuestions() {
  loading.value = true
  try {
    // 确保知识点ID是字符串形式
    const knowledgeIdStr = knowledgeId ? new BigNumber(knowledgeId).toString() : knowledgeId
    
    const response = await knowledgeAPI.getQuestionsByKnowledgeId(knowledgeIdStr)
    console.log('获取到的相关习题:', response)
    
    if (Array.isArray(response)) {
      questions.value = response
    } else {
      questions.value = []
    }
  } catch (error) {
    console.error('获取相关习题失败:', error)
    questions.value = []
    ElMessage.error('获取习题失败，请稍后重试')
  } finally {
    loading.value = false
  }
}

// 搜索题目
async function searchQuestions() {
  if (!searchKeyword.value.trim()) {
    await fetchQuestions() // 如果关键词为空，则获取所有题目
    return
  }
  
  loading.value = true
  try {
    const knowledgeIdStr = knowledgeId ? new BigNumber(knowledgeId).toString() : knowledgeId
    const response = await knowledgeAPI.searchQuestionsInKnowledge(knowledgeIdStr, searchKeyword.value.trim())
    
    if (Array.isArray(response)) {
      questions.value = response
      currentPage.value = 1 // 重置到第一页
      ElMessage.success(`找到 ${response.length} 个匹配的习题`)
    } else {
      questions.value = []
      ElMessage.info('未找到匹配的习题')
    }
  } catch (error) {
    console.error('搜索习题失败:', error)
    ElMessage.error('搜索习题失败，请稍后重试')
  } finally {
    loading.value = false
  }
}

// 重置搜索
function resetSearch() {
  searchKeyword.value = ''
  fetchQuestions()
}

// 应用过滤条件
async function applyFilters() {
  // 更新日期范围
  if (dateRange.value && dateRange.value.length === 2) {
    filterConditions.value.startTime = dateRange.value[0]
    filterConditions.value.endTime = dateRange.value[1]
  } else {
    filterConditions.value.startTime = ''
    filterConditions.value.endTime = ''
  }
  
  // 检查是否有过滤条件
  const hasFilters = filterConditions.value.questionType || 
                    filterConditions.value.difficulty || 
                    filterConditions.value.startTime || 
                    filterConditions.value.endTime
  
  if (!hasFilters) {
    await fetchQuestions() // 如果没有过滤条件，则获取所有题目
    return
  }
  
  loading.value = true
  try {
    const knowledgeIdStr = knowledgeId ? new BigNumber(knowledgeId).toString() : knowledgeId
    const response = await knowledgeAPI.searchQuestionsInKnowledgeConditionally(knowledgeIdStr, filterConditions.value)
    
    if (Array.isArray(response)) {
      questions.value = response
      currentPage.value = 1 // 重置到第一页
      ElMessage.success(`找到 ${response.length} 个匹配的习题`)
    } else {
      questions.value = []
      ElMessage.info('未找到匹配的习题')
    }
  } catch (error) {
    console.error('过滤习题失败:', error)
    ElMessage.error('过滤习题失败，请稍后重试')
  } finally {
    loading.value = false
  }
}

// 重置过滤条件
function resetFilters() {
  filterConditions.value = {
    questionType: '',
    difficulty: '',
    startTime: '',
    endTime: ''
  }
  dateRange.value = []
  fetchQuestions()
}

// 返回上一页
function goBack() {
  // 如果有课程ID，则返回到课程详情页
  if (courseIdFromQuery) {
    router.push(`/teacher/course/${courseIdFromQuery}`)
  } else {
    // 否则返回上一页
    router.back()
  }
}

// 编辑知识点
function editKnowledge() {
  editDialogVisible.value = true
}

// 保存知识点
async function saveKnowledge() {
  formRef.value.validate(async (valid) => {
    if (valid) {
      try {
        // 从localstorage中获取教师ID
        const userInfoStr = localStorage.getItem('user_info')
        if (!userInfoStr) {
          throw new Error('未找到用户信息，请重新登录')
        }
        
        const userInfo = JSON.parse(userInfoStr)
        if (!userInfo || !userInfo.teacherId) {
          throw new Error('用户信息不完整或不是教师账号')
        }
        
        // 确保教师ID是字符串形式
        const teacherId = userInfo.teacherId ? new BigNumber(userInfo.teacherId).toString() : userInfo.teacherId
        
        // 更新知识点
        const knowledgeIdStr = knowledgeId ? new BigNumber(knowledgeId).toString() : knowledgeId
        const updateData = {
          knowledgeId: knowledgeIdStr,
          name: editForm.value.name,
          description: editForm.value.description || '',
          difficultyLevel: editForm.value.difficultyLevel,
          teacherId: teacherId,
          teachPlan: editForm.value.teachPlan || ''
        }
        
        await knowledgeAPI.updateKnowledge(updateData)
        
        // 重新获取知识点详情
        await fetchKnowledgeDetail()
        
        ElMessage.success('知识点更新成功')
        editDialogVisible.value = false
      } catch (error) {
        console.error('更新知识点失败:', error)
        ElMessage.error('更新知识点失败: ' + (error.message || '请稍后重试'))
      }
    }
  })
}

// 添加习题
function addQuestion() {
  ElMessage.info('添加习题功能待实现')
}

// 查看习题
function viewQuestion(question) {
  ElMessage.info(`查看习题: ${question.content}`)
}

// 删除习题
function deleteQuestion(question) {
  ElMessageBox.confirm(
    `确定要删除习题"${question.content}"吗？`,
    '删除确认',
    {
      confirmButtonText: '确定',
      cancelButtonText: '取消',
      type: 'warning'
    }
  ).then(async () => {
    ElMessage.info(`删除习题: ${question.content}`)
  }).catch(() => {
    // 用户取消删除
  })
}

// 编辑习题
function editQuestion(question) {
  ElMessage.info(`编辑习题: ${question.content}`)
}

// 开始练习
function practiceQuestions() {
  ElMessage.success('开始练习模式')
  // 这里可以跳转到练习页面或者展开练习模式
}

// 处理每页显示数量变化
function handleSizeChange(size) {
  pageSize.value = size
  // 重置到第一页
  currentPage.value = 1
}

// 处理页码变化
function handleCurrentChange(page) {
  currentPage.value = page
}

// 根据题目难度获取标签类型
function getQuestionDifficultyType(level) {
  switch(level) {
    case '简单':
      return 'success'
    case '中等':
      return 'warning'
    case '困难':
      return 'danger'
    default:
      return 'info'
  }
}

// 在组件挂载时获取知识点详情
onMounted(async () => {
  if (!knowledgeId) {
    ElMessage.error('知识点ID不存在')
    goBack()
    return
  }
  
  await fetchKnowledgeDetail()
})
</script>

<style scoped>
.knowledge-detail-container {
  height: 100%;
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

.knowledge-header {
  padding: 0 10px;
  color: #303133;
  position: relative;
  display: flex;
  justify-content: space-between;
  align-items: center;
  border-radius: 0;
  box-shadow: none;
  border: none;
  background-color: transparent;
  text-align: left;
  min-height: 32px;
  height: 32px;
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

.knowledge-title {
  font-size: 16px;
  font-weight: 500;
  margin: 0;
  text-shadow: none;
  color: #303133;
  line-height: 32px;
  height: 32px;
  font-size: 22px;
}

.knowledge-content {
  flex: 1;
  padding: 32px 40px;
  background-color: #f5f7fa;
  overflow-y: auto;
}

.loading-container, .empty-container {
  display: flex;
  justify-content: center;
  align-items: center;
  min-height: 300px;
}

.knowledge-details {
  display: flex;
  flex-direction: column;
  gap: 24px;
}

.detail-card {
  background-color: #fff;
  border-radius: 12px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.08);
  overflow: hidden;
}

.card-header {
  padding: 16px 20px;
  border-bottom: 1px solid #ebeef5;
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.card-header h3 {
  margin: 0;
  font-size: 18px;
  font-weight: 600;
  color: #303133;
}

.search-filter-container {
  padding: 16px 20px;
  background-color: #f8f9fa;
  border-bottom: 1px solid #ebeef5;
}

.search-box {
  margin-bottom: 16px;
}

.search-icon {
  cursor: pointer;
  color: #909399;
}

.search-icon:hover {
  color: #409EFF;
}

.filter-box {
  display: flex;
  flex-wrap: wrap;
  gap: 12px;
  align-items: center;
}

.card-body {
  padding: 20px;
}

.detail-item {
  margin-bottom: 16px;
  display: flex;
}

.detail-item:last-child {
  margin-bottom: 0;
}

.detail-item .label {
  font-weight: 500;
  width: 100px;
  color: #606266;
}

.detail-item .value {
  flex: 1;
  color: #303133;
}

.description-text, .teach-plan-text {
  margin: 0;
  line-height: 1.6;
  color: #303133;
  white-space: pre-wrap;
}

.empty-tip {
  color: #909399;
  text-align: center;
  padding: 20px 0;
}

.questions-list {
  margin-top: 16px;
}

.dialog-footer {
  display: flex;
  justify-content: flex-end;
}

.info-card {
  border-left: 4px solid #409EFF;
}

.info-row {
  display: flex;
  flex-wrap: wrap;
  margin-bottom: 16px;
}

.info-item {
  margin-right: 24px;
  margin-bottom: 8px;
  display: flex;
  align-items: center;
}

.info-item .label {
  font-weight: 500;
  color: #606266;
  margin-right: 8px;
  width: auto;
}

.description-box {
  background-color: #f8f9fa;
  padding: 12px 16px;
  border-radius: 8px;
}

.desc-title {
  font-weight: 500;
  color: #303133;
  margin-bottom: 8px;
}

.questions-card {
  border-left: 4px solid #67C23A;
}

.header-actions {
  display: flex;
  gap: 10px;
}

.question-item {
  border: 1px solid #ebeef5;
  border-radius: 8px;
  margin-bottom: 16px;
  box-shadow: 0 2px 6px rgba(0, 0, 0, 0.04);
  overflow: hidden;
}

.question-header {
  display: flex;
  align-items: center;
  padding: 12px 16px;
  background-color: #f8f9fa;
  border-bottom: 1px solid #ebeef5;
}

.question-index {
  width: 24px;
  height: 24px;
  background-color: #409EFF;
  color: white;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: bold;
  margin-right: 12px;
}

.question-type {
  margin-right: 12px;
}

.question-difficulty {
  /* 添加样式 */
}

.question-content {
  padding: 16px;
}

.question-title {
  font-size: 16px;
  font-weight: 500;
  color: #303133;
  margin-bottom: 16px;
  line-height: 1.6;
}

.question-options {
  display: flex;
  flex-direction: column;
  gap: 12px;
  margin-bottom: 16px;
}

.option-item {
  display: flex;
  align-items: flex-start;
}

.option-key {
  font-weight: 500;
  margin-right: 8px;
  color: #409EFF;
}

.option-text {
  flex: 1;
}

.question-answer {
  background-color: #f8f9fa;
  padding: 12px;
  border-radius: 8px;
  margin-top: 16px;
}

.answer-label {
  font-weight: 500;
  color: #67C23A;
  margin-bottom: 8px;
}

.answer-content {
  color: #303133;
  white-space: pre-wrap;
}

.question-footer {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 8px 16px;
  border-top: 1px solid #ebeef5;
  background-color: #fafafa;
}

.score-tag {
  font-weight: 500;
}

.question-actions {
  display: flex;
  gap: 8px;
}

.pagination-container {
  margin-top: 24px;
  display: flex;
  justify-content: center;
}

.teach-plan-card {
  border-left: 4px solid #E6A23C;
}
</style> 