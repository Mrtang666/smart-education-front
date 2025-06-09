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
      <!-- 题型统计图表 -->
      <div class="detail-card chart-card" v-if="questions.length > 0">
        <div class="card-header">
          <h3>习题统计</h3>
        </div>
        <div class="card-body chart-body">
          <div class="charts-container">
            <!-- 题型分布图表 -->
            <div class="chart-item">
              <div class="chart-title">题型分布</div>
              <div id="questionTypeChart" class="question-type-chart"></div>
            </div>
            
            <!-- 难度分布图表 -->
            <div class="chart-item">
              <div class="chart-title">难度分布</div>
              <div id="difficultyChart" class="difficulty-chart"></div>
            </div>
          </div>
        </div>
      </div>

      <!-- 习题区域 -->
      <div class="detail-card questions-card">
        <div class="card-header">
          <h3>相关习题 ({{ questions.length }})</h3>
          <div class="header-actions">
            <el-button type="primary" size="small" @click="addQuestion">
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
                <div class="question-options">
                  <div v-for="(option, index) in question.options" :key="index" class="question-option">
                    <div class="option-key">{{ option.key }}.</div>
                    <div class="option-text">{{ option.text }}</div>
                  </div>
                </div>
                <div class="question-answer-row" v-if="question.referenceAnswer">
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
import { ref, onMounted, computed, watch, nextTick, onUnmounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { ElMessage, ElMessageBox } from 'element-plus'
import { ArrowLeft, Edit, Plus, DocumentRemove, Delete } from '@element-plus/icons-vue'
import { knowledgeAPI } from '@/api/api'
import BigNumber from 'bignumber.js'
import * as echarts from 'echarts'

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

// 图表相关
let typeChart = null;
let difficultyChart = null;

// 题型颜色映射
const typeColors = {
  '选择题': '#4B8DE6',
  '填空题': '#67C23A',
  '判断题': '#E6A23C',
  '简答题': '#F56C6C',
  '未知类型': '#909399'
}

// 难度颜色映射
const difficultyColors = {
  '简单': '#67C23A',
  '中等': '#E6A23C',
  '困难': '#F56C6C',
  '未知难度': '#909399'
}

// 计算属性：当前页显示的题目
const displayQuestions = computed(() => {
  const start = (currentPage.value - 1) * pageSize.value
  const end = start + pageSize.value
  return questions.value.slice(start, end)
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

// 监听习题数据变化，更新图表
watch(() => questions.value, () => {
  if (questions.value.length > 0) {
    nextTick(() => {
      initCharts()
    })
  }
}, { deep: true })

// 初始化图表
function initCharts() {
  nextTick(() => {
    initTypeChart();
    initDifficultyChart();
  });
}

// 初始化题型分布图表
function initTypeChart() {
  const chartDom = document.getElementById('questionTypeChart');
  if (!chartDom) {
    console.error('找不到题型图表容器元素');
    return;
  }
  
  // 设置图表容器高度
  chartDom.style.height = '100%';
  
  // 清空现有图表实例
  if (typeChart) {
    typeChart.dispose();
  }
  
  // 创建图表实例
  typeChart = echarts.init(chartDom);
  
  // 计算题型统计数据
  const typeCount = {};
  questions.value.forEach(question => {
    const type = question.questionType || '未知类型';
    typeCount[type] = (typeCount[type] || 0) + 1;
  });
  
  // 对数据排序，确保图表显示有序
  const sortedTypes = Object.keys(typeCount).sort();
  const data = sortedTypes.map(type => ({
    name: type,
    value: typeCount[type],
    itemStyle: {
      color: typeColors[type] || typeColors['未知类型']
    }
  }));
  
  const option = {
    tooltip: {
      trigger: 'item',
      formatter: '{a} <br/>{b}: {c}题 ({d}%)',
      confine: true
    },
    legend: {
      orient: 'horizontal',
      bottom: 0,
      left: 'center',
      itemWidth: 12,
      itemHeight: 8,
      textStyle: {
        fontSize: 11
      },
      data: sortedTypes
    },
    series: [
      {
        name: '题型分布',
        type: 'pie',
        radius: ['30%', '70%'],
        center: ['50%', '40%'],
        avoidLabelOverlap: true,
        itemStyle: {
          borderRadius: 4,
          borderColor: '#fff',
          borderWidth: 1
        },
        label: {
          show: true,
          position: 'outside',
          formatter: '{b}: {c}题',
          fontSize: 11
        },
        labelLine: {
          show: true,
          length: 10,
          length2: 8,
          smooth: true
        },
        emphasis: {
          focus: 'series',
          scaleSize: 5,
          itemStyle: {
            shadowBlur: 10,
            shadowOffsetX: 0,
            shadowColor: 'rgba(0, 0, 0, 0.2)'
          }
        },
        data: data
      }
    ]
  };
  
  typeChart.setOption(option);
  
  // 响应窗口大小变化
  window.addEventListener('resize', handleResize);
}

// 初始化难度分布图表
function initDifficultyChart() {
  const chartDom = document.getElementById('difficultyChart');
  if (!chartDom) {
    console.error('找不到难度图表容器元素');
    return;
  }
  
  // 设置图表容器高度
  chartDom.style.height = '100%';
  
  // 清空现有图表实例
  if (difficultyChart) {
    difficultyChart.dispose();
  }
  
  // 创建图表实例
  difficultyChart = echarts.init(chartDom);
  
  // 计算难度分布数据
  const difficultyCount = {};
  questions.value.forEach(question => {
    const difficulty = question.difficulty || '未知难度';
    difficultyCount[difficulty] = (difficultyCount[difficulty] || 0) + 1;
  });
  
  // 对难度进行排序：简单、中等、困难
  const difficultyOrder = ['简单', '中等', '困难', '未知难度'];
  const sortedDifficulties = Object.keys(difficultyCount).sort((a, b) => {
    return difficultyOrder.indexOf(a) - difficultyOrder.indexOf(b);
  });
  
  const data = sortedDifficulties.map(difficulty => ({
    name: difficulty,
    value: difficultyCount[difficulty],
    itemStyle: {
      color: difficultyColors[difficulty] || difficultyColors['未知难度']
    }
  }));
  
  const option = {
    tooltip: {
      trigger: 'item',
      formatter: '{a} <br/>{b}: {c}题 ({d}%)',
      confine: true
    },
    legend: {
      orient: 'horizontal',
      bottom: 0,
      left: 'center',
      itemWidth: 12,
      itemHeight: 8,
      textStyle: {
        fontSize: 11
      },
      data: sortedDifficulties
    },
    series: [
      {
        name: '难度分布',
        type: 'pie',
        radius: ['30%', '70%'],
        center: ['50%', '40%'],
        avoidLabelOverlap: true,
        itemStyle: {
          borderRadius: 4,
          borderColor: '#fff',
          borderWidth: 1
        },
        label: {
          show: true,
          position: 'outside',
          formatter: '{b}: {c}题',
          fontSize: 11
        },
        labelLine: {
          show: true,
          length: 10,
          length2: 8,
          smooth: true
        },
        emphasis: {
          focus: 'series',
          scaleSize: 5,
          itemStyle: {
            shadowBlur: 10,
            shadowOffsetX: 0,
            shadowColor: 'rgba(0, 0, 0, 0.2)'
          }
        },
        data: data
      }
    ]
  };
  
  difficultyChart.setOption(option);
  
  // 响应窗口大小变化
  window.addEventListener('resize', handleResize);
}

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
      
      // 确保在DOM更新后初始化图表
      if (response.length > 0) {
        // 使用nextTick确保DOM已更新
        nextTick(() => {
          // 再使用setTimeout确保图表容器已渲染
          setTimeout(() => {
            console.log('尝试初始化图表...')
            initCharts()
          }, 300)
        })
      }
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
    
    // 额外的图表初始化尝试
    if (questions.value.length > 0) {
      // 延迟一段时间再初始化图表，确保DOM已完全渲染
      setTimeout(() => {
        console.log('组件挂载后尝试初始化图表...')
        initCharts()
      }, 500)
    }
  } catch (error) {
    console.error('初始化知识点详情失败:', error)
    ElMessage.error('加载知识点详情失败，请稍后重试')
  }
})

// 组件卸载时清理图表实例
onUnmounted(() => {
  if (typeChart) {
    typeChart.dispose();
    typeChart = null;
  }
  if (difficultyChart) {
    difficultyChart.dispose();
    difficultyChart = null;
  }
  // 移除窗口大小变化监听器
  window.removeEventListener('resize', handleResize);
});

// 窗口大小变化处理函数
const handleResize = () => {
  if (typeChart) {
    typeChart.resize();
  }
  if (difficultyChart) {
    difficultyChart.resize();
  }
};
</script>

<style scoped>
.knowledge-detail-container {
  min-height: 100vh;
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

.knowledge-header {
  padding: 0 10px;
  color: #303133;
  position: sticky;
  top: 0;
  display: flex;
  justify-content: space-between;
  align-items: center;
  border-radius: 0;
  box-shadow: none;
  border: none;
  background-color: #f5f7fa;
  text-align: left;
  min-height: 32px;
  height: 32px;
  flex-shrink: 0;
  line-height: 32px;
  z-index: 10;
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
  padding: 12px 20px;
  background-color: #f5f7fa;
  overflow-y: auto;
  display: flex;
  flex-direction: column;
  gap: 16px;
  padding-bottom: 30px;
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
  border-radius: 12px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.06);
  margin-bottom: 16px;
  background-color: #fff;
  overflow: hidden;
  border: none;
  transition: all 0.3s ease;
  position: relative;
  width: 100%;
}

.chart-card {
  height: auto;
  margin-bottom: 16px;
  width: 100%;
}

.chart-body {
  height: 380px;
  padding: 10px;
  position: relative;
}

.detail-card.chart-card {
  padding-bottom: 10px;
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 14px 20px;
  border-bottom: 1px solid rgba(0, 0, 0, 0.05);
  background: linear-gradient(to right, #f8f9fa, #fff);
  position: relative;
  overflow: hidden;
}

.card-header::after {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  height: 3px;
  background: linear-gradient(90deg, #67C23A, #4B8DE6);
}

.card-header h3 {
  font-size: 16px;
  font-weight: 600;
  margin: 0;
  color: #303133;
  display: flex;
  align-items: center;
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
  height: 16px;
  background: linear-gradient(to bottom, #67C23A, #4B8DE6);
  border-radius: 2px;
}

.card-body {
  padding: 16px 20px;
}

.questions-card .card-body {
  flex: 1;
  overflow-y: auto;
}

.header-actions {
  display: flex;
  gap: 12px;
}

.header-actions .el-button {
  border-radius: 10px;
  font-weight: 500;
  padding: 10px 20px;
  transition: all 0.3s ease;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.08);
  font-size: 14px;
}

.header-actions .el-button:hover {
  transform: translateY(-3px);
  box-shadow: 0 6px 16px rgba(0, 0, 0, 0.12);
}

.header-actions .el-button .el-icon {
  margin-right: 6px;
  font-size: 16px;
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
  padding: 40px 0;
  background-color: white;
  border-radius: 16px;
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.06);
}

.empty-tip .el-empty {
  margin-bottom: 20px;
}

.empty-tip .el-button {
  padding: 12px 24px;
  font-weight: 500;
  border-radius: 10px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.08);
  transition: all 0.3s ease;
}

.empty-tip .el-button:hover {
  transform: translateY(-3px);
  box-shadow: 0 6px 16px rgba(0, 0, 0, 0.12);
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
  flex: 1;
  min-height: 300px;
  height: auto;
  display: flex;
  flex-direction: column;
}

.questions-card::before {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background-image: url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%2367c23a' fill-opacity='0.05'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E");
  opacity: 0.5;
  z-index: 0;
  pointer-events: none;
}

.question-item {
  border: none;
  border-radius: 10px;
  margin-bottom: 16px;
  box-shadow: 0 3px 10px rgba(0, 0, 0, 0.05);
  overflow: visible;
  background-color: #fff;
  transition: all 0.3s ease;
  position: relative;
  z-index: 1;
  width: 100%;
  box-sizing: border-box;
  display: flex;
  flex-direction: column;
}

.question-item:hover {
  transform: translateY(-4px);
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.1);
}

.question-item:last-child {
  margin-bottom: 0;
}

.question-header {
  display: flex;
  align-items: center;
  padding: 12px 16px;
  background: linear-gradient(135deg, #f8f9fa, #fff);
  border-bottom: 1px solid #ebeef5;
  position: relative;
  width: 100%;
  box-sizing: border-box;
  flex-wrap: wrap;
}

.question-header::after {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  height: 100%;
  width: 4px;
  background: linear-gradient(to bottom, #409EFF, #4B8DE6);
}

.question-index {
  width: 36px;
  height: 36px;
  background: linear-gradient(135deg, #409EFF, #4B8DE6);
  color: white;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: bold;
  margin-right: 16px;
  font-size: 16px;
  box-shadow: 0 4px 10px rgba(64, 158, 255, 0.3);
}

.question-type {
  margin-right: 16px;
  margin-bottom: 5px;
}

.question-difficulty {
  margin-bottom: 5px;
}

.question-type .el-tag, .question-difficulty .el-tag {
  font-weight: 500;
  padding: 2px 12px;
  height: 28px;
  line-height: 24px;
  border-radius: 14px;
  font-size: 13px;
  box-shadow: 0 2px 6px rgba(0, 0, 0, 0.05);
  white-space: nowrap;
}

.question-content {
  padding: 16px;
  background-color: #fff;
  position: relative;
  z-index: 2;
  width: 100%;
  box-sizing: border-box;
  overflow-wrap: break-word;
  word-break: break-word;
  height: auto;
}

.question-title {
  font-size: 15px;
  font-weight: 500;
  color: #303133;
  margin-bottom: 14px;
  line-height: 1.5;
  white-space: pre-wrap;
  text-align: left;
  padding-bottom: 8px;
  border-bottom: 1px dashed #ebeef5;
  word-break: break-word;
  overflow-wrap: break-word;
  max-width: 100%;
}

.question-options {
  margin: 12px 0;
  display: flex;
  flex-direction: column;
  gap: 8px;
  width: 100%;
}

.question-option {
  display: flex;
  align-items: flex-start;
  padding: 8px 14px;
  background-color: #f8f9fa;
  border-radius: 8px;
  transition: all 0.2s ease;
  border-left: 2px solid transparent;
  word-break: break-word;
  overflow-wrap: break-word;
  width: 100%;
  box-sizing: border-box;
}

.question-option:hover {
  background-color: #f0f7ff;
  border-left-color: #409EFF;
  transform: translateX(4px);
}

.option-key {
  font-weight: 600;
  color: #409EFF;
  margin-right: 12px;
  min-width: 24px;
  font-size: 15px;
  flex-shrink: 0;
}

.option-text {
  color: #606266;
  flex: 1;
  font-size: 15px;
  word-break: break-word;
  overflow-wrap: break-word;
  max-width: calc(100% - 36px);
}

.question-answer-row {
  display: flex;
  align-items: flex-start;
  margin-top: 12px;
  background-color: #f0f9eb;
  padding: 10px 14px;
  border-radius: 8px;
  border-left: none;
  box-shadow: 0 2px 6px rgba(103, 194, 58, 0.1);
  width: 100%;
  box-sizing: border-box;
}

.answer-label {
  font-weight: 600;
  color: #67C23A;
  margin-right: 12px;
  font-size: 15px;
  white-space: nowrap;
  flex-shrink: 0;
}

.answer-content {
  color: #303133;
  line-height: 1.6;
  font-size: 15px;
  text-align: left;
  flex: 1;
  font-weight: 500;
  word-break: break-word;
  overflow-wrap: break-word;
  max-width: calc(100% - 100px);
}

.question-footer {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 12px 16px;
  border-top: 1px solid #ebeef5;
  background-color: #fafafa;
  width: 100%;
  box-sizing: border-box;
  flex-wrap: wrap;
  gap: 10px;
}

.score-tag {
  font-weight: 500;
  font-size: 14px;
  padding: 4px 12px;
  border-radius: 14px;
  background-color: #f0f9eb;
  color: #67C23A;
  border-color: transparent;
  box-shadow: 0 2px 6px rgba(103, 194, 58, 0.1);
  white-space: nowrap;
}

.question-actions {
  display: flex;
  gap: 10px;
  flex-wrap: wrap;
}

.question-actions .el-button {
  font-size: 14px;
  padding: 8px 12px;
  border-radius: 8px;
  transition: all 0.3s ease;
  font-weight: 500;
  white-space: nowrap;
}

.question-actions .el-button:hover {
  background-color: #ecf5ff;
  color: #409EFF;
  transform: translateY(-2px);
}

.question-actions .el-button--danger:hover {
  background-color: #fef0f0;
  color: #f56c6c;
  transform: translateY(-2px);
}

.pagination-container {
  margin-top: 32px;
  margin-bottom: 16px;
  display: flex;
  justify-content: center;
}

.pagination-container .el-pagination {
  padding: 0;
  font-weight: normal;
  color: #606266;
  background-color: white;
  padding: 12px 24px;
  border-radius: 12px;
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.06);
  display: flex;
  flex-wrap: wrap;
  justify-content: center;
}

.pagination-container .el-pagination .el-pagination__total,
.pagination-container .el-pagination .el-pagination__jump {
  font-weight: 500;
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

/* 响应式调整 */
@media (max-width: 768px) {
  .knowledge-content {
    padding: 12px;
  }
  
  .chart-card {
    height: auto;
  }
  
  .chart-body {
    height: 300px;
  }
  
  .card-header {
    padding: 16px;
    flex-wrap: wrap;
  }
  
  .card-body {
    padding: 16px;
  }
  
  .header-actions {
    margin-top: 8px;
    width: 100%;
  }
  
  .pagination-container .el-pagination {
    padding: 8px;
  }
}

.chart-container {
  width: 100%;
  height: 360px;
  margin: 0 auto;
  background-color: #fff;
  border-radius: 16px;
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.06);
  padding: 15px;
  box-sizing: border-box;
  margin-bottom: 20px;
}

.chart-title {
  font-size: 16px;
  font-weight: 600;
  color: #303133;
  margin-bottom: 10px;
  text-align: center;
}

#questionTypeChart {
  width: 100%;
  height: 300px;
  margin: 0 auto;
}

.question-type-chart {
  height: 100%;
  width: 100%;
  position: absolute;
  top: 0;
  left: 0;
}

.detail-card:hover {
  box-shadow: 0 6px 16px rgba(0, 0, 0, 0.08);
}

.charts-container {
  display: flex;
  width: 100%;
  height: 360px;
  gap: 20px;
}

.chart-item {
  flex: 1;
  height: 100%;
  background-color: #fff;
  border-radius: 10px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.06);
  padding: 10px;
  box-sizing: border-box;
  position: relative;
  display: flex;
  flex-direction: column;
}

.chart-title {
  font-size: 15px;
  font-weight: 600;
  color: #303133;
  margin-bottom: 5px;
  text-align: center;
  flex-shrink: 0;
}

.question-type-chart, .difficulty-chart {
  width: 100%;
  flex: 1;
  position: relative;
}

.chart-body {
  height: 360px;
  padding: 10px;
  position: relative;
}

/* 响应式布局 */
@media (max-width: 768px) {
  .charts-container {
    flex-direction: column;
    height: 600px;
  }
  
  .chart-item {
    height: 300px;
  }
}
</style> 