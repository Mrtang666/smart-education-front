<!-- 这边我还没做好，等我明天做，你先别动 -->
<template>
  <div class="knowledge-detail-container">
    <div class="knowledge-header">
      <div class="header-content">
        <div class="back-button" @click="goBack">
          <el-icon><ArrowLeft /></el-icon>
          <span>返回</span>
        </div>
        <h1 class="knowledge-title">{{ knowledgeName }} 知识点</h1>
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
          <h3><el-icon class="header-icon"><Document /></el-icon>相关习题 ({{ questions.length }})</h3>
          <div class="header-actions">
            <el-button type="primary" size="small" @click="addQuestion" class="add-btn">
              <el-icon><Plus /></el-icon>添加习题
            </el-button>
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
          <div v-else class="questions-grid">
            <el-card v-for="(question, index) in displayQuestions" :key="question.questionId" class="question-card" shadow="hover">
              <div class="question-header">
                <div class="question-index">{{ (currentPage - 1) * 4 + index + 1 }}</div>
                <div class="question-type">
                  <el-tag size="small" effect="dark">{{ question.questionType }}</el-tag>
                </div>
                <div class="question-difficulty">
                  <el-tag size="small" :type="getQuestionDifficultyType(question.difficulty)" effect="dark">{{ question.difficulty }}</el-tag>
                </div>
              </div>
              <div class="question-content">
                <div class="question-title">{{ question.content }}</div>
                <div class="question-bottom">
                  <div class="question-answer-row" v-if="question.referenceAnswer">
                    <div class="answer-label">参考答案:</div>
                    <div class="answer-content">{{ question.referenceAnswer }}</div>
                  </div>
                  <div class="question-analysis-row" v-if="question.analysis">
                    <div class="analysis-label">解析:</div>
                    <div class="analysis-content">{{ question.analysis }}</div>
                  </div>
                </div>
              </div>
              <div class="question-footer">
                <el-tag size="small" type="info" class="score-tag">{{ question.scorePoints || 0 }}分</el-tag>
                <div class="question-actions">
                  <el-button link type="primary" @click="editQuestion(question)">
                    <el-icon><Edit /></el-icon>编辑
                  </el-button>
                  <el-button link type="danger" @click="deleteQuestion(question)">
                    <el-icon><Delete /></el-icon>删除
                  </el-button>
                </div>
              </div>
            </el-card>
          </div>
          
          <!-- 分页控件 -->
          <div class="pagination-container" v-if="questions.length > 0">
            <el-pagination
              v-model:current-page="currentPage"
              layout="prev, pager, next, jumper"
              :page-size="4"
              :total="questions.length"
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

    <!-- 添加/编辑习题对话框 -->
    <el-dialog v-model="questionDialogVisible" :title="isEditingQuestion ? '编辑习题' : '添加习题'" width="700px">
      <el-form :model="questionForm" label-width="100px" :rules="questionRules" ref="questionFormRef">
        <el-form-item label="题目类型" prop="questionType">
          <el-select v-model="questionForm.questionType" placeholder="请选择题目类型">
            <el-option label="选择题" value="选择题"></el-option>
            <el-option label="填空题" value="填空题"></el-option>
            <el-option label="判断题" value="判断题"></el-option>
            <el-option label="简答题" value="简答题"></el-option>
          </el-select>
        </el-form-item>
        <el-form-item label="题目内容" prop="content">
          <el-input v-model="questionForm.content" type="textarea" :rows="3" placeholder="请输入题目内容" />
        </el-form-item>
        
        <!-- 选择题选项 -->
        <template v-if="questionForm.questionType === '选择题' || questionForm.questionType === '判断题'">
          <el-form-item label="选项">
            <div v-for="(option, index) in questionForm.options" :key="index" class="option-input-item">
              <div class="option-input-key">{{ option.key }}.</div>
              <el-input v-model="option.text" placeholder="请输入选项内容" :disabled="questionForm.questionType === '判断题'" />
              <el-button @click="removeOption(index)" type="danger" circle plain 
                v-if="questionForm.options.length > 2 && questionForm.questionType === '选择题'">
                <el-icon><Delete /></el-icon>
              </el-button>
            </div>
            <div class="add-option-button" v-if="questionForm.questionType === '选择题'">
              <el-button @click="addOption" type="primary" plain v-if="questionForm.options.length < 6">
                <el-icon><Plus /></el-icon>添加选项
              </el-button>
            </div>
          </el-form-item>
        </template>
        
        <el-form-item label="参考答案" prop="referenceAnswer">
          <template v-if="questionForm.questionType === '选择题' || questionForm.questionType === '判断题'">
            <el-select v-model="questionForm.referenceAnswer" placeholder="请选择正确答案">
              <el-option 
                v-for="option in questionForm.options" 
                :key="option.key" 
                :label="option.key" 
                :value="option.key">
              </el-option>
            </el-select>
          </template>
          <template v-else>
            <el-input v-model="questionForm.referenceAnswer" type="textarea" :rows="2" placeholder="请输入参考答案" />
          </template>
        </el-form-item>
        
        <el-form-item label="难度等级" prop="difficulty">
          <el-select v-model="questionForm.difficulty" placeholder="请选择难度等级">
            <el-option label="简单" value="简单"></el-option>
            <el-option label="中等" value="中等"></el-option>
            <el-option label="困难" value="困难"></el-option>
          </el-select>
        </el-form-item>
        
        <el-form-item label="分值" prop="scorePoints">
          <el-input-number v-model="questionForm.scorePoints" :min="1" :max="100" />
        </el-form-item>
        
        <el-form-item label="解析">
          <el-input v-model="questionForm.analysis" type="textarea" :rows="2" placeholder="请输入题目解析（可选）" />
        </el-form-item>
      </el-form>
      <template #footer>
        <div class="dialog-footer">
          <el-button @click="questionDialogVisible = false">取消</el-button>
          <el-button type="primary" @click="saveQuestion">保存</el-button>
        </div>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, onMounted, computed, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { ElMessage, ElMessageBox } from 'element-plus'
import { ArrowLeft, Edit, Plus, DocumentRemove, Delete, Document } from '@element-plus/icons-vue'
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

// 计算属性：当前页显示的题目
const displayQuestions = computed(() => {
  const start = (currentPage.value - 1) * 4;
  const end = start + 4;
  return questions.value.slice(start, end);
})

// 习题对话框相关
const questionDialogVisible = ref(false)
const questionFormRef = ref(null)
const isEditingQuestion = ref(false)
const currentEditingQuestion = ref(null)

// 习题表单
const questionForm = ref({
  questionType: '选择题',
  content: '',
  options: [
    { key: 'A', text: '' },
    { key: 'B', text: '' },
    { key: 'C', text: '' },
    { key: 'D', text: '' }
  ],
  referenceAnswer: '',
  difficulty: '中等',
  scorePoints: 5,
  analysis: ''
})

// 表单验证规则
const questionRules = {
  questionType: [
    { required: true, message: '请选择题目类型', trigger: 'change' }
  ],
  content: [
    { required: true, message: '请输入题目内容', trigger: 'blur' },
    { min: 2, max: 1000, message: '长度在 2 到 1000 个字符', trigger: 'blur' }
  ],
  referenceAnswer: [
    { required: true, message: '请输入参考答案', trigger: 'blur' }
  ],
  difficulty: [
    { required: true, message: '请选择难度等级', trigger: 'change' }
  ],
  scorePoints: [
    { required: true, message: '请输入分值', trigger: 'blur' }
  ]
}

// 监听题目类型变化，重置参考答案
watch(() => questionForm.value.questionType, (newType) => {
  questionForm.value.referenceAnswer = ''
  
  if (newType === '判断题') {
    // 为判断题设置固定的选项
    questionForm.value.options = [
      { key: 'A', text: '正确' },
      { key: 'B', text: '错误' }
    ]
  } else if (newType === '选择题' && questionForm.value.options.length === 0) {
    // 如果切换到选择题，且没有选项，则初始化选项
    questionForm.value.options = [
      { key: 'A', text: '' },
      { key: 'B', text: '' },
      { key: 'C', text: '' },
      { key: 'D', text: '' }
    ]
  }
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
  isEditingQuestion.value = false
  currentEditingQuestion.value = null
  
  // 重置表单
  questionForm.value = {
    questionType: '选择题',
    content: '',
    options: [
      { key: 'A', text: '' },
      { key: 'B', text: '' },
      { key: 'C', text: '' },
      { key: 'D', text: '' }
    ],
    referenceAnswer: '',
    difficulty: '中等',
    scorePoints: 5,
    analysis: ''
  }
  
  questionDialogVisible.value = true
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
    try {
      await knowledgeAPI.deleteQuestion(question.questionId)
      ElMessage.success('习题删除成功')
      // 重新获取习题列表
      await fetchQuestions()
    } catch (error) {
      console.error('删除习题失败:', error)
      ElMessage.error('删除习题失败: ' + (error.message || '请稍后重试'))
    }
  }).catch(() => {
    // 用户取消删除
  })
}

// 编辑习题
function editQuestion(question) {
  isEditingQuestion.value = true
  currentEditingQuestion.value = question
  
  // 从题目内容中提取选项（如果是选择题）
  let content = question.content;
  let options = [];
  
  if (question.questionType === '选择题') {
    // 尝试从内容中提取选项
    const contentLines = content.split('\n');
    let mainContent = [];
    let optionsStarted = false;
    
    for (const line of contentLines) {
      const trimmedLine = line.trim();
      // 查找选项格式的行 (A. xxx, B. xxx 等)
      if (/^[A-Z]\.\s/.test(trimmedLine)) {
        optionsStarted = true;
        const key = trimmedLine[0]; // 获取选项字母
        const text = trimmedLine.substring(2).trim(); // 获取选项内容
        options.push({ key, text });
      } else if (!optionsStarted && trimmedLine) {
        // 如果还没开始处理选项且行不为空，添加到主内容
        mainContent.push(trimmedLine);
      }
    }
    
    // 更新题目内容（仅保留主要内容）
    content = mainContent.join('\n');
  }
  
  // 复制问题数据到表单
  questionForm.value = {
    questionType: question.questionType || '选择题',
    content: content || '',
    options: options.length > 0 ? options : 
      question.questionType === '判断题' ? 
        [{ key: 'A', text: '正确' }, { key: 'B', text: '错误' }] : 
        [{ key: 'A', text: '' }, { key: 'B', text: '' }, { key: 'C', text: '' }, { key: 'D', text: '' }],
    referenceAnswer: question.referenceAnswer || '',
    difficulty: question.difficulty || '中等',
    scorePoints: question.scorePoints || 5,
    analysis: question.analysis || ''
  }
  
  questionDialogVisible.value = true
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

// 添加选项
function addOption() {
  const keys = ['A', 'B', 'C', 'D', 'E', 'F']
  if (questionForm.value.options.length < keys.length) {
    const nextKey = keys[questionForm.value.options.length]
    questionForm.value.options.push({ key: nextKey, text: '' })
  }
}

// 移除选项
function removeOption(index) {
  if (questionForm.value.options.length > 2) {
    // 如果删除的是当前选中的答案，则清空答案
    if (questionForm.value.referenceAnswer === questionForm.value.options[index].key) {
      questionForm.value.referenceAnswer = ''
    }
    
    questionForm.value.options.splice(index, 1)
    
    // 重新排序选项的key
    const keys = ['A', 'B', 'C', 'D', 'E', 'F']
    questionForm.value.options.forEach((option, idx) => {
      option.key = keys[idx]
    })
  }
}

// 保存习题
async function saveQuestion() {
  questionFormRef.value.validate(async (valid) => {
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
        
        // 确保教师ID和知识点ID是字符串形式
        const teacherId = userInfo.teacherId ? new BigNumber(userInfo.teacherId).toString() : userInfo.teacherId
        const knowledgeIdStr = knowledgeId ? new BigNumber(knowledgeId).toString() : knowledgeId
        
        // 准备提交的数据
        let content = questionForm.value.content;
        
        // 如果是选择题或判断题，将选项内容添加到题目内容中
        if ((questionForm.value.questionType === '选择题' || questionForm.value.questionType === '判断题') && 
            questionForm.value.options.length > 0) {
          // 添加换行
          content += '\n\n';
          // 添加每个选项
          questionForm.value.options.forEach(option => {
            content += `${option.key}. ${option.text}\n`;
          });
        }
        
        const questionData = {
          questionType: questionForm.value.questionType,
          content: content,
          referenceAnswer: questionForm.value.referenceAnswer,
          difficulty: questionForm.value.difficulty,
          scorePoints: questionForm.value.scorePoints,
          analysis: questionForm.value.analysis || '',
          teacherId: teacherId,
          knowledgeId: knowledgeIdStr
        }
        
        if (isEditingQuestion.value && currentEditingQuestion.value) {
          // 更新现有习题
          questionData.questionId = currentEditingQuestion.value.questionId
          await knowledgeAPI.updateQuestion(questionData)
          ElMessage.success('习题更新成功')
        } else {
          // 添加新习题
          await knowledgeAPI.addQuestion(questionData)
          ElMessage.success('习题添加成功')
        }
        
        // 重新获取习题列表
        await fetchQuestions()
        
        // 关闭对话框
        questionDialogVisible.value = false
      } catch (error) {
        console.error('保存习题失败:', error)
        ElMessage.error('保存习题失败: ' + (error.message || '请稍后重试'))
      }
    }
  })
}

// 在组件挂载时获取知识点详情
onMounted(async () => {
  if (!knowledgeId) {
    ElMessage.error('知识点ID不存在')
    goBack()
    return
  }
  
  try {
    await fetchKnowledgeDetail()
  } catch (error) {
    console.error('初始化知识点详情失败:', error)
    ElMessage.error('加载知识点详情失败，请稍后重试')
  }
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
  padding: 16px 20px;
  background-color: #f5f7fa;
  overflow-y: auto;
  display: flex;
  flex-direction: column;
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
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.1);
  overflow: hidden;
  transition: transform 0.3s ease, box-shadow 0.3s ease;
  border: none;
  display: flex;
  flex-direction: column;
  height: calc(100vh - 150px);
  min-height: 700px;
}

.questions-card {
  position: relative;
}

.questions-card::before {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  height: 4px;
  background: linear-gradient(to right, #67C23A, #85ce61);
  border-radius: 12px 12px 0 0;
}

.card-header {
  padding: 16px 20px;
  border-bottom: 1px solid #ebeef5;
  display: flex;
  justify-content: space-between;
  align-items: center;
  background-color: #f8fafc;
}

.card-header h3 {
  margin: 0;
  font-size: 18px;
  font-weight: 600;
  color: #303133;
  display: flex;
  align-items: center;
}

.header-icon {
  margin-right: 8px;
  color: #67C23A;
  font-size: 20px;
}

.add-btn {
  background: linear-gradient(135deg, #67C23A, #85ce61);
  border: none;
  transition: transform 0.2s;
}

.add-btn:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(103, 194, 58, 0.3);
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
  overflow-y: auto;
  display: flex;
  flex-direction: column;
  flex: 1;
  justify-content: space-between;
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
  margin-top: 8px;
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

.questions-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
  gap: 16px;
  margin-bottom: auto;
}

.question-card {
  margin-bottom: 0;
  border: none;
  height: 550px; /* 固定卡片高度 */
}

/* 深度选择器修改Element UI内部样式 */
:deep(.el-card.question-card) {
  height: 550px;
  display: flex;
  flex-direction: column;
  transition: transform 0.2s, box-shadow 0.3s;
}

:deep(.el-card.question-card .el-card__body) {
  padding: 0;
  display: flex;
  flex-direction: column;
  flex: 1;
  height: 100%;
  overflow: hidden;
}

.el-card.question-card:hover {
  transform: translateY(-3px);
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.15) !important;
}

.question-header {
  display: flex;
  align-items: center;
  padding: 10px 12px;
  background: linear-gradient(to right, #f0f9eb, #f8fafc);
  border-bottom: 1px solid #ebeef5;
}

.question-index {
  width: 28px;
  height: 28px;
  background: linear-gradient(135deg, #409EFF, #53a8ff);
  color: white;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: bold;
  margin-right: 12px;
  font-size: 14px;
  box-shadow: 0 3px 6px rgba(64, 158, 255, 0.3);
}

.question-type {
  margin-right: 12px;
}

.question-content {
  flex: 1;
  padding: 12px;
  background-color: white;
  display: flex;
  flex-direction: column;
  overflow-y: auto;
}

.question-title {
  font-size: 14px;
  font-weight: 500;
  color: #303133;
  margin-bottom: 10px;
  line-height: 1.5;
  white-space: pre-wrap;
  text-align: left;
}

.question-bottom {
  margin-top: auto; /* 推到内容区底部 */
}

.question-answer-row {
  display: flex;
  align-items: flex-start;
  margin-top: 12px;
  background-color: #f0f9eb;
  padding: 8px 12px;
  border-radius: 6px;
}

.question-analysis-row {
  display: flex;
  align-items: flex-start;
  margin-top: 8px;
  background-color: #ffefef;
  padding: 8px 12px;
  border-radius: 6px;
}

.analysis-label {
  font-weight: 600;
  color: #F56C6C;
  margin-right: 8px;
  font-size: 14px;
  white-space: nowrap;
}

.analysis-content {
  color: #303133;
  line-height: 1.4;
  font-size: 14px;
  text-align: left;
}

.answer-label {
  font-weight: 600;
  color: #67C23A;
  margin-right: 8px;
  font-size: 14px;
  white-space: nowrap;
}

.answer-content {
  color: #303133;
  line-height: 1.4;
  font-size: 14px;
  text-align: left;
  font-weight: 500;
}

.question-footer {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 8px 12px;
  border-top: 1px solid #ebeef5;
  background-color: #fafafa;
}

.score-tag {
  font-weight: 500;
  font-size: 13px;
  background-color: #f2f6fc;
  color: #606266;
  border: none;
}

.question-actions {
  display: flex;
  gap: 8px;
}

.pagination-container {
  margin-top: 20px;
  display: flex;
  justify-content: center;
  background-color: #fff;
  padding: 10px 0;
  border-top: 1px solid #ebeef5;
  margin-bottom: 0;
  width: 100%;
}

.teach-plan-card {
  border-left: 4px solid #E6A23C;
}

/* 添加习题表单相关样式 */
.option-input-item {
  display: flex;
  align-items: center;
  margin-bottom: 12px;
}

.option-input-key {
  font-weight: 500;
  margin-right: 8px;
  width: 20px;
  color: #409EFF;
}

.add-option-button {
  margin-top: 12px;
}

.header-actions {
  display: flex;
  gap: 10px;
}
</style> 