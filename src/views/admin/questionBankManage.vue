<template>
  <div class="question-bank-manage">
    <div class="page-header">
      <h2>题库管理</h2>
      <el-button type="primary" @click="showAddDialog">
        <el-icon><Plus /></el-icon>
        添加题目
      </el-button>
    </div>

    <div class="search-section">
      <el-input
        v-model="searchKeyword"
        placeholder="搜索题目内容或标题"
        style="width: 300px; margin-right: 15px;"
        clearable
        @input="handleSearch"
      >
        <template #prefix>
          <el-icon><Search /></el-icon>
        </template>
      </el-input>
      
      <el-select v-model="selectedType" placeholder="题目类型" style="width: 150px; margin-right: 15px;" clearable @change="handleFilterChange">
        <el-option label="单选题" value="SINGLE_CHOICE" />
        <el-option label="多选题" value="MULTIPLE_CHOICE" />
        <el-option label="判断题" value="JUDGE" />
        <el-option label="填空题" value="FILL" />
        <el-option label="简答题" value="ESSAY" />
      </el-select>
      
      <el-button type="info" @click="resetSearch">重置</el-button>
    </div>

    <el-table :data="questionList" style="width: 100%" v-loading="loading">
      <el-table-column prop="id" label="ID" width="80" />
      <el-table-column prop="title" label="题目标题" min-width="200" show-overflow-tooltip />
      <el-table-column prop="type" label="类型" width="100">
        <template #default="scope">
          <el-tag :type="getTypeTag(scope.row.type)">
            {{ getTypeText(scope.row.type) }}
          </el-tag>
        </template>
      </el-table-column>
      <el-table-column prop="score" label="分值" width="80" />
      <el-table-column prop="origin" label="来源" width="100">
        <template #default="scope">
          <el-tag :type="scope.row.origin === 'PRESET' ? 'success' : 'info'">
            {{ scope.row.origin === 'PRESET' ? '预设' : '自定义' }}
          </el-tag>
        </template>
      </el-table-column>
      <el-table-column prop="createdAt" label="创建时间" width="180">
        <template #default="scope">
          {{ formatDateTime(scope.row.createdAt) }}
        </template>
      </el-table-column>
             <el-table-column label="操作" width="360" fixed="right">
         <template #default="scope">
           <el-button size="small" @click="viewQuestion(scope.row)">查看</el-button>
           <el-button size="small" @click="editQuestion(scope.row)">编辑</el-button>
           <el-button size="small" type="info" @click="showViewKnowledgeRelationDialog(scope.row)">查看知识单元关系</el-button>
           <el-button size="small" type="warning" @click="deleteKnowledgeRelations(scope.row)">删除知识单元关系</el-button>
           <el-button size="small" type="danger" @click="deleteQuestion(scope.row)">删除</el-button>
         </template>
       </el-table-column>
    </el-table>

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
      />
    </div>

    <!-- 添加/编辑题目对话框 -->
    <el-dialog 
      v-model="dialogVisible" 
      :title="isEdit ? '编辑题目' : '添加题目'"
      width="800px"
    >
      <el-form :model="questionForm" :rules="formRules" ref="questionFormRef" label-width="100px">
        <el-form-item label="题目标题" prop="title">
          <el-input v-model="questionForm.title" placeholder="请输入题目标题" />
        </el-form-item>
        
        <el-form-item label="题目类型" prop="type">
          <el-select v-model="questionForm.type" placeholder="请选择题目类型" style="width: 100%;">
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
          />
        </el-form-item>
        
        <el-form-item label="分值" prop="score">
          <el-input-number v-model="questionForm.score" :min="1" :max="100" style="width: 100%;" />
        </el-form-item>
        

        
        <!-- 答案 -->
        <el-form-item label="正确答案" prop="expectedAnswer">
          <el-input 
            v-model="questionForm.expectedAnswer" 
            type="textarea" 
            :rows="3"
            placeholder="请输入正确答案"
          />
        </el-form-item>
      </el-form>
      
      <template #footer>
        <span class="dialog-footer">
          <el-button @click="dialogVisible = false">取消</el-button>
          <el-button type="primary" @click="saveQuestion" :loading="saving">
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
    >
      <div v-if="viewingQuestion" class="question-detail">
        <div class="detail-item">
          <strong>题目标题：</strong>{{ viewingQuestion.title }}
        </div>
        <div class="detail-item">
          <strong>题目类型：</strong>
          <el-tag :type="getTypeTag(viewingQuestion.type)">
            {{ getTypeText(viewingQuestion.type) }}
          </el-tag>
        </div>
        <div class="detail-item">
          <strong>题目内容：</strong>
          <div class="content-text">{{ viewingQuestion.content }}</div>
        </div>
        <div class="detail-item">
          <strong>来源：</strong>
          <el-tag :type="viewingQuestion.origin === 'PRESET' ? 'success' : 'info'">
            {{ viewingQuestion.origin === 'PRESET' ? '预设' : '自定义' }}
          </el-tag>
        </div>
        <div class="detail-item">
          <strong>分值：</strong>{{ viewingQuestion.score }}分
        </div>
        <div class="detail-item">
          <strong>正确答案：</strong>{{ viewingQuestion.expectedAnswer }}
        </div>
        

        
        <div class="detail-item">
          <strong>创建时间：</strong>{{ formatDateTime(viewingQuestion.createdAt) }}
        </div>
      </div>
    </el-dialog>

    <!-- 查看知识单元关系对话框 -->
    <el-dialog 
      v-model="knowledgeRelationDialogVisible" 
      title="查看知识单元关系"
      width="600px"
    >
      <div v-if="currentQuestion" class="knowledge-relation-detail">
        <div class="detail-item">
          <strong>题目标题：</strong>{{ currentQuestion.title }}
        </div>
        <div class="detail-item">
          <strong>题目类型：</strong>
          <el-tag :type="getTypeTag(currentQuestion.type)">
            {{ getTypeText(currentQuestion.type) }}
          </el-tag>
        </div>
        <div class="detail-item">
          <strong>关联知识单元数量：</strong>
          <el-tag type="primary">{{ relatedKnowledgeUnitIds.length }}</el-tag>
        </div>
        
        <div class="detail-item">
          <strong>关联知识单元ID列表：</strong>
          <div v-if="relatedKnowledgeUnitIds.length > 0" class="knowledge-unit-ids-list">
            <el-tag 
              v-for="knowledgeUnitId in relatedKnowledgeUnitIds" 
              :key="knowledgeUnitId"
              type="success"
              style="margin: 2px;"
            >
              {{ knowledgeUnitId }}
            </el-tag>
          </div>
          <div v-else class="no-data">
            <el-empty description="暂无关联知识单元" />
          </div>
        </div>
      </div>
      
      <template #footer>
        <span class="dialog-footer">
          <el-button @click="knowledgeRelationDialogVisible = false">关闭</el-button>
        </span>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { Plus, Search } from '@element-plus/icons-vue'
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

.page-header h2 {
  margin: 0;
  color: #303133;
  font-size: 24px;
  font-weight: 600;
}

.search-section {
  margin-bottom: 20px;
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

.question-detail {
  padding: 20px;
}

.detail-item {
  margin-bottom: 15px;
}

.detail-item strong {
  display: inline-block;
  width: 100px;
  color: #303133;
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
}

.knowledge-relation-detail .detail-item strong {
  display: inline-block;
  width: 120px;
  color: #303133;
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

.no-data {
  margin-top: 10px;
  text-align: center;
}
</style>
