<template>
  <div class="question-bank-manage">
    <!-- 页面标题区域 -->
    <div class="page-header">
      <div class="header-content">
        <h2 class="page-title">题库管理</h2>
      </div>
      <el-button type="primary" @click="showAddDialog" size="large">
        <el-icon><Plus /></el-icon>
        添加题目
      </el-button>
    </div>

    <!-- 搜索和筛选区域 -->
    <div class="search-section">
      <div class="search-content">
        <div class="search-group">
          <el-input
            v-model="searchKeyword"
            placeholder="搜索题目内容或标题"
            style="width: 300px;"
            clearable
            @input="handleSearch"
            size="large"
          >
            <template #prefix>
              <el-icon><Search /></el-icon>
            </template>
          </el-input>
          
          <el-select 
            v-model="selectedType" 
            placeholder="题目类型" 
            style="width: 150px;" 
            clearable 
            @change="handleFilterChange"
            size="large"
          >
            <el-option label="单选题" value="SINGLE_CHOICE" />
            <el-option label="多选题" value="MULTIPLE_CHOICE" />
            <el-option label="判断题" value="JUDGE" />
            <el-option label="填空题" value="FILL" />
            <el-option label="简答题" value="ESSAY" />
          </el-select>
        </div>
        
        <div class="search-actions">
          <el-button type="info" @click="resetSearch" size="large">
            <el-icon><Refresh /></el-icon>
            重置
          </el-button>
        </div>
      </div>
    </div>

    <!-- 数据表格区域 -->
    <div class="table-section">
      <el-card class="table-card" shadow="never">
        <template #header>
          <div class="table-header">
            <div class="table-title">
              <el-icon><Document /></el-icon>
              <span>题目列表</span>
            </div>
            <div class="table-info">
              <el-tag type="info" size="large">
                共 {{ total }} 条记录
              </el-tag>
            </div>
          </div>
        </template>
        
        <el-table 
          :data="questionList" 
          style="width: 100%" 
          v-loading="loading"
          border
          stripe
          :header-cell-style="{ background: '#f5f7fa', color: '#606266' }"
          :cell-style="{ padding: '12px 0' }"
        >
          <el-table-column label="序号" width="80" align="center">
            <template #default="scope">
              {{ (currentPage - 1) * pageSize + scope.$index + 1 }}
            </template>
          </el-table-column>
          <el-table-column prop="id" label="ID" width="80" align="center" />
          <el-table-column prop="title" label="题目标题" min-width="200" show-overflow-tooltip />
          <el-table-column prop="type" label="类型" width="100" align="center">
            <template #default="scope">
              <el-tag :type="getTypeTag(scope.row.type)" size="large">
                {{ getTypeText(scope.row.type) }}
              </el-tag>
            </template>
          </el-table-column>
          <el-table-column prop="score" label="分值" width="80" align="center">
            <template #default="scope">
              <el-tag type="warning" size="large">
                {{ scope.row.score }}分
              </el-tag>
            </template>
          </el-table-column>
          <el-table-column prop="origin" label="来源" width="100" align="center">
            <template #default="scope">
              <el-tag :type="scope.row.origin === 'PRESET' ? 'success' : 'info'" size="large">
                {{ scope.row.origin === 'PRESET' ? '预设' : '自定义' }}
              </el-tag>
            </template>
          </el-table-column>
          <el-table-column prop="createdAt" label="创建时间" width="180" align="center">
            <template #default="scope">
              {{ formatDateTime(scope.row.createdAt) }}
            </template>
          </el-table-column>
          <el-table-column label="操作" width="320" fixed="right" align="center">
            <template #default="scope">
              <div class="action-buttons">
                <div class="action-row">
                  <el-button size="small" @click="viewQuestion(scope.row)" type="info">
                    <el-icon><View /></el-icon>
                    查看
                  </el-button>
                  <el-button size="small" @click="editQuestion(scope.row)" type="primary">
                    <el-icon><Edit /></el-icon>
                    编辑
                  </el-button>
                  <el-button size="small" type="warning" @click="showViewKnowledgeRelationDialog(scope.row)">
                    <el-icon><Link /></el-icon>
                    查看关系
                  </el-button>
                </div>
                <div class="action-row">
                  <el-button size="small" type="warning" @click="deleteKnowledgeRelations(scope.row)">
                    <el-icon><Delete /></el-icon>
                    删除关系
                  </el-button>
                  <el-button size="small" type="danger" @click="deleteQuestion(scope.row)">
                    <el-icon><Delete /></el-icon>
                    删除
                  </el-button>
                </div>
              </div>
            </template>
          </el-table-column>
        </el-table>
      </el-card>
    </div>

    <!-- 分页组件 -->
    <div class="pagination-container">
      <el-pagination
        v-model:current-page="currentPage"
        v-model:page-size="pageSize"
        :page-sizes="[10, 20, 50, 100]"
        :total="total"
        layout="total, sizes, prev, pager, next, jumper"
        @size-change="handleSizeChange"
        @current-change="handleCurrentChange"
        background
        :pager-count="7"
      />
    </div>

    <!-- 添加/编辑题目对话框 -->
    <el-dialog 
      v-model="dialogVisible" 
      :title="isEdit ? '编辑题目' : '添加题目'"
      width="800px"
      :close-on-click-modal="false"
      class="question-dialog"
    >
      <el-form :model="questionForm" :rules="formRules" ref="questionFormRef" label-width="100px">
        <el-form-item label="题目标题" prop="title">
          <el-input v-model="questionForm.title" placeholder="请输入题目标题" size="large" />
        </el-form-item>
        
        <el-form-item label="题目类型" prop="type">
          <el-select v-model="questionForm.type" placeholder="请选择题目类型" style="width: 100%;" size="large">
            <el-option label="单选题" value="SINGLE_CHOICE" />
            <el-option label="多选题" value="MULTIPLE_CHOICE" />
            <el-option label="判断题" value="JUDGE" />
            <el-option label="填空题" value="FILL" />
            <el-option label="简答题" value="ESSAY" />
          </el-select>
        </el-form-item>
        
        <el-form-item label="题目内容" prop="content">
          <el-input 
            v-model="questionForm.content" 
            type="textarea" 
            :rows="4"
            placeholder="请输入题目内容"
            size="large"
          />
        </el-form-item>
        
        <el-form-item label="分值" prop="score">
          <el-input-number v-model="questionForm.score" :min="1" :max="100" style="width: 100%;" size="large" />
        </el-form-item>
        
        <!-- 答案 -->
        <el-form-item label="正确答案" prop="expectedAnswer">
          <el-input 
            v-model="questionForm.expectedAnswer" 
            type="textarea" 
            :rows="3"
            placeholder="请输入正确答案"
            size="large"
          />
        </el-form-item>
      </el-form>
      
      <template #footer>
        <span class="dialog-footer">
          <el-button @click="dialogVisible = false" size="large">取消</el-button>
          <el-button type="primary" @click="saveQuestion" :loading="saving" size="large">
            {{ isEdit ? '更新' : '添加' }}
          </el-button>
        </span>
      </template>
    </el-dialog>

    <!-- 查看题目详情对话框 -->
    <el-dialog 
      v-model="viewDialogVisible" 
      title="题目详情"
      width="800px"
      :close-on-click-modal="false"
      class="view-question-dialog"
    >
      <div v-if="viewingQuestion" class="question-detail">
        <div class="detail-item">
          <div class="detail-label">
            <el-icon><Document /></el-icon>
            <span>题目标题：</span>
          </div>
          <div class="detail-value">{{ viewingQuestion.title }}</div>
        </div>
        <div class="detail-item">
          <div class="detail-label">
            <el-icon><Collection /></el-icon>
            <span>题目类型：</span>
          </div>
          <div class="detail-value">
            <el-tag :type="getTypeTag(viewingQuestion.type)" size="large">
              {{ getTypeText(viewingQuestion.type) }}
            </el-tag>
          </div>
        </div>
        <div class="detail-item">
          <div class="detail-label">
            <el-icon><Edit /></el-icon>
            <span>题目内容：</span>
          </div>
          <div class="detail-value">
            <div class="content-text">{{ viewingQuestion.content }}</div>
          </div>
        </div>
        <div class="detail-item">
          <div class="detail-label">
            <el-icon><InfoFilled /></el-icon>
            <span>来源：</span>
          </div>
          <div class="detail-value">
            <el-tag :type="viewingQuestion.origin === 'PRESET' ? 'success' : 'info'" size="large">
              {{ viewingQuestion.origin === 'PRESET' ? '预设' : '自定义' }}
            </el-tag>
          </div>
        </div>
        <div class="detail-item">
          <div class="detail-label">
            <el-icon><Star /></el-icon>
            <span>分值：</span>
          </div>
          <div class="detail-value">
            <el-tag type="warning" size="large">{{ viewingQuestion.score }}分</el-tag>
          </div>
        </div>
        <div class="detail-item">
          <div class="detail-label">
            <el-icon><Check /></el-icon>
            <span>正确答案：</span>
          </div>
          <div class="detail-value">{{ viewingQuestion.expectedAnswer }}</div>
        </div>
        
        <div class="detail-item">
          <div class="detail-label">
            <el-icon><Clock /></el-icon>
            <span>创建时间：</span>
          </div>
          <div class="detail-value">{{ formatDateTime(viewingQuestion.createdAt) }}</div>
        </div>
      </div>
    </el-dialog>

    <!-- 查看知识单元关系对话框 -->
    <el-dialog 
      v-model="knowledgeRelationDialogVisible" 
      title="查看知识单元关系"
      width="600px"
      :close-on-click-modal="false"
      class="knowledge-relation-dialog"
    >
      <div v-if="currentQuestion" class="knowledge-relation-detail">
        <div class="detail-item">
          <div class="detail-label">
            <el-icon><Document /></el-icon>
            <span>题目标题：</span>
          </div>
          <div class="detail-value">{{ currentQuestion.title }}</div>
        </div>
        <div class="detail-item">
          <div class="detail-label">
            <el-icon><Collection /></el-icon>
            <span>题目类型：</span>
          </div>
          <div class="detail-value">
            <el-tag :type="getTypeTag(currentQuestion.type)" size="large">
              {{ getTypeText(currentQuestion.type) }}
            </el-tag>
          </div>
        </div>
        <div class="detail-item">
          <div class="detail-label">
            <el-icon><Link /></el-icon>
            <span>关联知识单元数量：</span>
          </div>
          <div class="detail-value">
            <el-tag type="primary" size="large">{{ relatedKnowledgeUnitIds.length }}</el-tag>
          </div>
        </div>
        
        <div class="detail-item">
          <div class="detail-label">
            <el-icon><List /></el-icon>
            <span>关联知识单元ID列表：</span>
          </div>
          <div class="detail-value">
            <div v-if="relatedKnowledgeUnitIds.length > 0" class="knowledge-unit-ids-list">
              <el-tag 
                v-for="knowledgeUnitId in relatedKnowledgeUnitIds" 
                :key="knowledgeUnitId"
                type="success"
                size="large"
                class="knowledge-unit-tag"
              >
                {{ knowledgeUnitId }}
              </el-tag>
            </div>
            <div v-else class="no-data">
              <el-empty description="暂无关联知识单元" />
            </div>
          </div>
        </div>
      </div>
      
      <template #footer>
        <span class="dialog-footer">
          <el-button @click="knowledgeRelationDialogVisible = false" size="large">关闭</el-button>
        </span>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { 
  Plus, Search, Refresh, Edit, Link, Delete, 
  Document, Collection, InfoFilled, Star, Check, 
  Clock, View, List 
} from '@element-plus/icons-vue'
import { problemBank, problemKnowledgeUnit } from '@/api/apiLearning'

// 响应式数据
const loading = ref(false)
const saving = ref(false)
const dialogVisible = ref(false)
const viewDialogVisible = ref(false)
const isEdit = ref(false)
const searchKeyword = ref('')
const selectedType = ref('')
const questionFormRef = ref()
const viewingQuestion = ref(null)

// 知识单元关系相关数据
const knowledgeRelationDialogVisible = ref(false)
const currentQuestion = ref(null)
const relatedKnowledgeUnitIds = ref([])

// 分页相关数据
const currentPage = ref(1)
const pageSize = ref(10)
const total = ref(0)

// 题目数据
const questionList = ref([])

const questionForm = reactive({
  id: null,
  title: '',
  content: '',
  type: 'SINGLE_CHOICE',
  score: 5,
  expectedAnswer: ''
})

const formRules = {
  title: [
    { required: true, message: '请输入题目标题', trigger: 'blur' }
  ],
  content: [
    { required: true, message: '请输入题目内容', trigger: 'blur' }
  ],
  type: [
    { required: true, message: '请选择题目类型', trigger: 'change' }
  ],
  score: [
    { required: true, message: '请输入分值', trigger: 'blur' }
  ],
  expectedAnswer: [
    { required: true, message: '请输入正确答案', trigger: 'blur' }
  ]
}

// 方法
const getTypeTag = (type) => {
  switch (type) {
    case 'SINGLE_CHOICE': return 'primary'
    case 'MULTIPLE_CHOICE': return 'success'
    case 'JUDGE': return 'warning'
    case 'FILL': return 'info'
    case 'ESSAY': return 'danger'
    case 'single': return 'primary'
    case 'multiple': return 'success'
    case 'judge': return 'warning'
    case 'fill': return 'info'
    case 'essay': return 'danger'
    default: return 'info'
  }
}

const getTypeText = (type) => {
  switch (type) {
    case 'SINGLE_CHOICE': return '单选题'
    case 'MULTIPLE_CHOICE': return '多选题'
    case 'JUDGE': return '判断题'
    case 'FILL': return '填空题'
    case 'ESSAY': return '简答题'
    case 'single': return '单选题'
    case 'multiple': return '多选题'
    case 'judge': return '判断题'
    case 'fill': return '填空题'
    case 'essay': return '简答题'
    default: return '未知'
  }
}

const formatDateTime = (dateString) => {
  if (!dateString) return ''
  const date = new Date(dateString)
  return date.toLocaleString('zh-CN')
}

// 分页处理函数
const handleSizeChange = (newSize) => {
  pageSize.value = newSize
  currentPage.value = 1 // 重置到第一页
  loadQuestions()
}

const handleCurrentChange = (newPage) => {
  currentPage.value = newPage
  loadQuestions()
}

// 加载题目数据
const loadQuestions = async () => {
  try {
    loading.value = true
    console.log('开始加载题目数据...')
    console.log('当前搜索关键词:', searchKeyword.value)
    console.log('当前页码:', currentPage.value)
    console.log('当前页大小:', pageSize.value)
    
    let data
    // 统一使用搜索API获取数据
    if (searchKeyword.value.trim()) {
      // 如果有搜索关键词，使用搜索API
      console.log('使用搜索API搜索关键词:', searchKeyword.value.trim())
      data = await problemBank.search(searchKeyword.value.trim())
    } else {
      // 如果没有搜索关键词，使用搜索API获取所有数据
      console.log('使用搜索API获取所有数据...')
      data = await problemBank.search('')
    }
    
    console.log('API返回的原始数据:', data)
    
    // 处理返回的数据结构
    if (Array.isArray(data)) {
      // 如果返回的是数组，进行前端分页
      console.log('检测到数组数据结构，进行前端分页')
      const startIndex = (currentPage.value - 1) * pageSize.value
      const endIndex = startIndex + pageSize.value
      questionList.value = data.slice(startIndex, endIndex)
      total.value = data.length
      console.log(`分页结果: 第${currentPage.value}页，每页${pageSize.value}条，共${data.length}条数据`)
    } else if (data && data.records) {
      // 如果返回的是分页数据结构（备用方案）
      console.log('检测到分页数据结构')
      questionList.value = data.records || []
      total.value = data.total || 0
    } else {
      console.log('未检测到有效数据结构，使用空数据')
      questionList.value = []
      total.value = 0
    }
    
    console.log('最终处理后的数据:', questionList.value)
    console.log('总数:', total.value)
    
    // 如果数据为空，显示提示
    if (questionList.value.length === 0) {
      console.log('没有找到题目数据')
    }
  } catch (error) {
    console.error('加载题目数据失败:', error)
    ElMessage.error('加载数据失败，请刷新页面重试')
    // 设置空数据
    questionList.value = []
    total.value = 0
  } finally {
    loading.value = false
  }
}

const handleSearch = async () => {
  currentPage.value = 1 // 搜索时重置到第一页
  await loadQuestions()
}

// 处理其他筛选条件变化
const handleFilterChange = async () => {
  currentPage.value = 1 // 筛选时重置到第一页
  await loadQuestions()
}

const resetSearch = async () => {
  searchKeyword.value = ''
  selectedType.value = ''
  currentPage.value = 1 // 重置时回到第一页
  await loadQuestions()
}

const showAddDialog = () => {
  isEdit.value = false
  resetForm()
  dialogVisible.value = true
}

const editQuestion = (row) => {
  isEdit.value = true
  Object.assign(questionForm, row)
  dialogVisible.value = true
}

const viewQuestion = (row) => {
  viewingQuestion.value = row
  viewDialogVisible.value = true
}

const showViewKnowledgeRelationDialog = async (row) => {
  currentQuestion.value = row
  knowledgeRelationDialogVisible.value = true
  
  try {
    // 调用API获取关联的知识单元ID
    const data = await problemKnowledgeUnit.getKnowledgeUnitIdByProblemId(row.id)
    console.log('获取到的关联知识单元ID:', data)
    
    // 处理返回的数据
    if (Array.isArray(data)) {
      relatedKnowledgeUnitIds.value = data
    } else if (data && Array.isArray(data.knowledgeUnitIds)) {
      relatedKnowledgeUnitIds.value = data.knowledgeUnitIds
    } else {
      relatedKnowledgeUnitIds.value = []
    }
  } catch (error) {
    console.error('获取关联知识单元ID失败:', error)
    ElMessage.error('获取关联知识单元信息失败')
    relatedKnowledgeUnitIds.value = []
  }
}

const deleteKnowledgeRelations = async (row) => {
  try {
    await ElMessageBox.confirm(
      `确定要删除题目"${row.title}"的所有知识单元关系吗？\n\n此操作将删除该题目与所有知识单元的关联关系，但不会删除题目本身。`,
      '删除知识单元关系确认',
      {
        confirmButtonText: '确定删除',
        cancelButtonText: '取消',
        type: 'warning',
        dangerouslyUseHTMLString: true
      }
    )
    
    // 调用删除关系API
    await problemKnowledgeUnit.deleteByProblemId(row.id)
    ElMessage.success('知识单元关系删除成功')
    
  } catch (error) {
    if (error.message !== 'cancel') {
      console.error('删除知识单元关系失败:', error)
      ElMessage.error('删除知识单元关系失败，请重试')
    }
  }
}

const deleteQuestion = async (row) => {
  try {
    await ElMessageBox.confirm(
      `确定要删除题目"${row.title}"吗？`,
      '删除确认',
      {
        confirmButtonText: '确定',
        cancelButtonText: '取消',
        type: 'warning'
      }
    )
    
    // 调用删除API
    await problemBank.delete(row.id)
    ElMessage.success('删除成功')
    
    // 重新加载当前页数据
    await loadQuestions()
  } catch (error) {
    if (error.message !== 'cancel') {
      console.error('删除失败:', error)
      ElMessage.error('删除失败，请重试')
    }
  }
}

const resetForm = () => {
  Object.assign(questionForm, {
    id: null,
    title: '',
    content: '',
    type: 'SINGLE_CHOICE',
    score: 5,
    expectedAnswer: ''
  })
  if (questionFormRef.value) {
    questionFormRef.value.clearValidate()
  }
}



const saveQuestion = async () => {
  if (!questionFormRef.value) return
  
  try {
    await questionFormRef.value.validate()
    saving.value = true
    

    
    if (isEdit.value) {
      // 更新题目
      try {
        await problemBank.update(questionForm.id, questionForm)
        ElMessage.success('更新成功')
      } catch (error) {
        console.error('更新失败:', error)
        ElMessage.error('更新失败，请重试')
        return
      }
    } else {
      // 添加题目 - 创建不包含id的数据对象
      const addData = { ...questionForm }
      delete addData.id
      
      try {
        await problemBank.save(addData)
        ElMessage.success('添加成功')
      } catch (error) {
        console.error('添加失败:', error)
        ElMessage.error('添加失败，请重试')
        return
      }
    }
    
    // 重新加载当前页数据
    await loadQuestions()
    dialogVisible.value = false
    resetForm()
  } catch (error) {
    console.error('保存失败:', error)
    ElMessage.error('操作失败，请重试')
  } finally {
    saving.value = false
  }
}

onMounted(async () => {
  console.log('组件挂载，开始加载数据...')
  try {
    await loadQuestions()
  } catch (error) {
    console.error('初始化数据加载失败:', error)
  }
})
</script>

<style scoped>
.question-bank-manage {
  padding: 20px;
}

.page-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
  padding-bottom: 15px;
  border-bottom: 1px solid #e4e7ed;
}

.header-content {
  display: flex;
  flex-direction: column;
  align-items: flex-start;
}

.page-title {
  margin: 0;
  color: #303133;
  font-size: 24px;
  font-weight: 600;
}

.page-subtitle {
  color: #909399;
  font-size: 14px;
  margin-top: 5px;
}

.search-section {
  margin-bottom: 20px;
  display: flex;
  align-items: center;
  gap: 10px;
  flex-wrap: wrap;
}

.search-content {
  display: flex;
  align-items: center;
  gap: 10px;
  flex-wrap: wrap;
}

.search-group {
  display: flex;
  align-items: center;
  gap: 10px;
  flex-wrap: wrap;
}

.search-actions {
  display: flex;
  align-items: center;
  gap: 10px;
  flex-wrap: wrap;
}

.dialog-footer {
  display: flex;
  justify-content: flex-end;
  gap: 10px;
}

.pagination-container {
  display: flex;
  justify-content: center;
  margin-top: 20px;
  padding: 20px 0;
}

.option-item {
  display: flex;
  align-items: center;
  margin-bottom: 10px;
  gap: 10px;
}

.table-section {
  margin-top: 20px;
}

.table-card {
  border-radius: 8px;
  box-shadow: 0 2px 12px 0 rgba(0, 0, 0, 0.1);
}

.table-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 10px 20px;
  border-bottom: 1px solid #ebeef5;
}

.table-title {
  display: flex;
  align-items: center;
  gap: 8px;
  color: #303133;
  font-size: 18px;
  font-weight: 600;
}

.table-info {
  color: #909399;
  font-size: 14px;
}

.question-detail {
  padding: 20px;
}

.detail-item {
  margin-bottom: 15px;
  display: flex;
  align-items: center;
}

.detail-label {
  display: flex;
  align-items: center;
  gap: 8px;
  color: #606266;
  font-size: 14px;
  font-weight: 500;
}

.detail-value {
  flex: 1;
  color: #303133;
  font-size: 14px;
  line-height: 1.6;
}

.content-text {
  margin-top: 5px;
  padding: 10px;
  background-color: #f5f7fa;
  border-radius: 4px;
  border: 1px solid #e4e7ed;
  color: #606266;
  line-height: 1.6;
}

.options-list {
  margin-top: 10px;
}

.options-list .option-item {
  padding: 8px 12px;
  margin-bottom: 8px;
  background-color: #f5f7fa;
  border-radius: 4px;
  border: 1px solid #e4e7ed;
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.options-list .option-item.correct {
  background-color: #f0f9ff;
  border-color: #409eff;
}

.options-list .option-item.correct .el-tag {
  margin-left: 10px;
}

.knowledge-relation-detail {
  padding: 20px;
}

.knowledge-relation-detail .detail-item {
  margin-bottom: 15px;
  display: flex;
  align-items: center;
}

.knowledge-relation-detail .detail-label {
  display: flex;
  align-items: center;
  gap: 8px;
  color: #606266;
  font-size: 14px;
  font-weight: 500;
}

.knowledge-relation-detail .detail-value {
  flex: 1;
  color: #303133;
  font-size: 14px;
  line-height: 1.6;
}

.knowledge-unit-ids-list {
  margin-top: 10px;
  max-height: 200px;
  overflow-y: auto;
  border: 1px solid #e4e7ed;
  border-radius: 4px;
  padding: 10px;
  background-color: #f5f7fa;
}

.knowledge-unit-tag {
  margin: 2px;
}

.no-data {
  margin-top: 10px;
  text-align: center;
}

.action-buttons {
  display: flex;
  flex-direction: column;
  gap: 8px;
  align-items: center;
}

.action-row {
  display: flex;
  gap: 8px;
  justify-content: center;
}

.action-row:last-child {
  justify-content: flex-end;
}

.action-row .el-button {
  min-width: 70px;
}

.question-dialog .el-dialog__header {
  background-color: #f5f7fa;
  border-bottom: 1px solid #ebeef5;
  padding: 15px 20px;
}

.question-dialog .el-dialog__title {
  color: #303133;
  font-size: 18px;
  font-weight: 600;
}

.view-question-dialog .el-dialog__header {
  background-color: #f5f7fa;
  border-bottom: 1px solid #ebeef5;
  padding: 15px 20px;
}

.view-question-dialog .el-dialog__title {
  color: #303133;
  font-size: 18px;
  font-weight: 600;
}

.knowledge-relation-dialog .el-dialog__header {
  background-color: #f5f7fa;
  border-bottom: 1px solid #ebeef5;
  padding: 15px 20px;
}

.knowledge-relation-dialog .el-dialog__title {
  color: #303133;
  font-size: 18px;
  font-weight: 600;
}
</style>
