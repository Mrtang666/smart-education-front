<template>
  <div class="problem-form">
    <el-form :model="form" label-width="100px">
      <el-form-item label="题干" required>
        <el-input
          v-model="form.title"
          placeholder="请输入题目的问题描述"
          type="textarea"
          :rows="2"
        />
        <div class="form-tip">题干是题目的主要问题描述</div>
      </el-form-item>

      <el-form-item label="题目类型" required>
        <el-select v-model="form.type" placeholder="请选择题目类型" @change="handleTypeChange">
          <el-option label="单选题" value="SINGLE_CHOICE" />
          <el-option label="多选题" value="MULTI_CHOICE" />
          <el-option label="填空题" value="FILL_BLANK" />
          <el-option label="简答题" value="ESSAY_QUESTION" />
          <el-option label="判断题" value="TRUE_FALSE" />
        </el-select>
      </el-form-item>

      <el-form-item label="分值" required>
        <el-input-number v-model="form.score" :min="1" :max="100" />
      </el-form-item>

      <!-- 选择题的题目内容和选项输入 -->
      <template v-if="['SINGLE_CHOICE', 'MULTI_CHOICE'].includes(form.type)">
        <el-form-item label="题目内容" required>
          <el-input
            v-model="questionStem"
            type="textarea"
            :rows="3"
            placeholder="请输入题目的主要内容（题干）"
            @input="updateFormContent"
          />
          <div class="form-tip">题目的主要内容，选项将自动添加到题目内容后面</div>
        </el-form-item>
      </template>

      <!-- 选择题的选项输入 -->
      <el-form-item
        v-if="['SINGLE_CHOICE', 'MULTI_CHOICE'].includes(form.type)"
        label="题目选项"
        required
      >
        <div class="options-container">
          <!-- 选项列表 -->
          <div class="options-list">
            <div
              v-for="(option, index) in options"
              :key="index"
              class="option-item"
            >
              <div class="option-label">{{ option.key }}.</div>
              <el-input
                v-model="option.content"
                placeholder="请输入选项内容"
                class="option-input"
                @input="updateFormContent"
              />
              <el-button
                v-if="options.length > 2"
                type="danger"
                size="small"
                circle
                @click="removeOption(index)"
              >
                <el-icon><Delete /></el-icon>
              </el-button>
            </div>
          </div>

          <!-- 添加选项按钮 -->
          <div class="add-option-section">
            <el-button
              v-if="options.length < 8"
              type="primary"
              plain
              @click="addOption"
            >
              <el-icon><Plus /></el-icon>
              添加选项
            </el-button>
            <div class="form-tip">
              最多支持8个选项（A-H），最少需要2个选项
            </div>
          </div>
        </div>
      </el-form-item>

      <!-- 非选择题的内容输入 -->
      <el-form-item
        v-else-if="form.type !== 'CODE_QUESTION'"
        label="题目内容"
        required
      >
        <el-input
          v-model="form.content"
          type="textarea"
          :rows="4"
          :placeholder="getContentPlaceholder()"
        />
        <div class="form-tip">{{ getContentTip() }}</div>
      </el-form-item>
      
      <!-- 选择题选项预览和答案设置 -->
      <template v-if="['SINGLE_CHOICE', 'MULTI_CHOICE'].includes(form.type)">
        <el-divider>选项预览</el-divider>

        <div v-if="parsedOptions.length > 0" class="options-preview-section">
          <div v-for="(option, index) in parsedOptions" :key="index" class="option-preview-item">
            <span class="option-label">{{ option.value }}</span>
            <span class="option-content">{{ option.content }}</span>
          </div>
        </div>
        <div v-else class="no-options-hint">
          <el-alert
            title="暂无选项"
            description="请在上方的题目选项中输入选项内容"
            type="warning"
            :closable="false"
          />
        </div>

        <el-form-item label="正确答案" required>
          <div v-if="form.type === 'SINGLE_CHOICE'">
            <el-radio-group v-model="form.expectedAnswer">
              <el-radio
                v-for="option in parsedOptions"
                :key="option.value"
                :value="option.value"
              >
                {{ option.value }}. {{ option.content }}
              </el-radio>
            </el-radio-group>
            <div class="form-tip">单选题请选择一个正确答案</div>
          </div>
          <div v-else-if="form.type === 'MULTI_CHOICE'">
            <el-checkbox-group v-model="selectedAnswers">
              <el-checkbox
                v-for="option in parsedOptions"
                :key="option.value"
                :value="option.value"
              >
                {{ option.value }}. {{ option.content }}
              </el-checkbox>
            </el-checkbox-group>
            <div class="form-tip">多选题可以选择多个正确答案</div>
            <div class="answer-preview" v-if="selectedAnswers.length > 0">
              <span class="preview-label">当前选择：</span>
              <el-tag
                v-for="answer in selectedAnswers"
                :key="answer"
                type="primary"
                size="small"
                style="margin-right: 5px;"
              >
                {{ answer }}
              </el-tag>
              <span class="preview-text">（将保存为：{{ selectedAnswers.join(',') }}）</span>
            </div>
          </div>
        </el-form-item>
      </template>
      
      <!-- 填空题和简答题答案 -->
      <template v-if="['FILL_BLANK', 'ESSAY_QUESTION'].includes(form.type)">
        <el-form-item label="参考答案" required>
          <el-input
            v-model="form.expectedAnswer"
            type="textarea"
            :rows="getAnswerRows()"
            :placeholder="getAnswerPlaceholder()"
            show-word-limit
          />
          <div class="form-tip">{{ getAnswerTip() }}</div>
          <div class="form-warning" v-if="form.expectedAnswer && form.expectedAnswer.length > 300">
            <el-alert
              title="注意"
              type="warning"
              :closable="false"
              show-icon
            >
              当前参考答案长度为 {{ form.expectedAnswer.length }} 字符，超过后端限制（300字符）。
              保存时可能会失败，建议精简答案内容或联系管理员调整后端限制。
            </el-alert>
          </div>
        </el-form-item>
      </template>
      
      <!-- 判断题答案 -->
      <template v-if="form.type === 'TRUE_FALSE'">
        <el-form-item label="正确答案" required>
          <el-radio-group v-model="form.expectedAnswer">
            <el-radio value="true">正确</el-radio>
            <el-radio value="false">错误</el-radio>
          </el-radio-group>
        </el-form-item>
      </template>
      
      <el-form-item>
        <el-button type="primary" @click="saveProblem">保存题目</el-button>
        <el-button @click="$emit('cancel')">取消</el-button>
      </el-form-item>
    </el-form>

    <!-- AI生成习题展示区域 -->
    <div v-if="aiGeneratedExercises && aiGeneratedExercises.length > 0" class="ai-exercises-section">
      <el-divider>
        <el-icon class="ai-icon"><MagicStick /></el-icon>
        AI生成的习题参考
      </el-divider>

      <div class="ai-exercises-container">
        <div class="ai-exercises-header">
          <span class="ai-exercises-title">以下是AI生成的习题，您可以参考并复制内容到上方表单中</span>
          <el-button size="small" type="info" @click="toggleAIExercises">
            {{ showAIExercises ? '收起' : '展开' }}
          </el-button>
        </div>

        <div v-show="showAIExercises" class="ai-exercises-list">
          <div
            v-for="(exercise, index) in aiGeneratedExercises"
            :key="index"
            class="ai-exercise-item"
          >
            <div class="exercise-header">
              <div class="exercise-title">
                <span class="exercise-number">题目 {{ index + 1 }}</span>
                <el-tag
                  v-if="exercise.difficulty"
                  :type="getDifficultyType(exercise.difficulty)"
                  size="small"
                  class="difficulty-tag"
                >
                  {{ exercise.difficulty }}
                </el-tag>
                <el-tag
                  v-if="exercise.type"
                  type="info"
                  size="small"
                  class="type-tag"
                >
                  {{ getTypeText(exercise.type) }}
                </el-tag>
              </div>
              <div class="exercise-actions">
                <el-button
                  size="small"
                  type="primary"
                  @click="copyExerciseToForm(exercise)"
                  :icon="DocumentCopy"
                >
                  复制到表单
                </el-button>
                <el-button
                  size="small"
                  @click="copyExerciseText(exercise)"
                  :icon="CopyDocument"
                >
                  复制文本
                </el-button>
              </div>
            </div>

            <div class="exercise-content">
              <!-- 题目内容 -->
              <div class="content-section">
                <div class="content-label">题目内容：</div>
                <div class="content-text">{{ exercise.question || exercise.title || exercise.content || '暂无题目内容' }}</div>
              </div>

              <!-- 选项 -->
              <div v-if="exercise.options && exercise.options.length > 0" class="content-section">
                <div class="content-label">选项：</div>
                <div class="options-text">
                  <div
                    v-for="(option, optIndex) in exercise.options"
                    :key="optIndex"
                    class="option-line"
                  >
                    {{ String.fromCharCode(65 + optIndex) }}. {{ option }}
                  </div>
                </div>
              </div>

              <!-- 答案 -->
              <div v-if="exercise.answer" class="content-section">
                <div class="content-label">答案：</div>
                <div class="answer-text">{{ exercise.answer }}</div>
              </div>

              <!-- 解析 -->
              <div v-if="exercise.explanation" class="content-section">
                <div class="content-label">解析：</div>
                <div class="explanation-text">{{ exercise.explanation }}</div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
/* eslint-disable no-undef */
import { ref, watch, onMounted, computed } from 'vue'
import { ElMessage } from 'element-plus'
import { Plus, Delete, MagicStick, DocumentCopy, CopyDocument } from '@element-plus/icons-vue'

const props = defineProps({
  problemData: {
    type: Object,
    required: false,
    default: null
  },
  homeworkId: {
    type: [String, Number],
    required: true
  },
  aiGeneratedExercises: {
    type: Array,
    required: false,
    default: () => []
  }
})

const emit = defineEmits(['save', 'cancel'])
/* eslint-enable no-undef */

// ==================== 工具函数 ====================

// 根据题目类型判定是否支持自动评分
function getAutoGrading(type) {
  // 单选题、多选题、填空题、判断题支持自动评分
  const autoGradingTypes = ['SINGLE_CHOICE', 'MULTI_CHOICE', 'FILL_BLANK', 'TRUE_FALSE']
  return autoGradingTypes.includes(type)
}

// ==================== 表单数据 ====================

// 表单数据
const form = ref({
  title: '',
  type: 'SINGLE_CHOICE',
  content: '',
  expectedAnswer: '',
  score: 10,
  assignmentId: props.homeworkId,

  autoGrading: getAutoGrading('SINGLE_CHOICE') // 默认单选题支持自动评分
})

// 多选题的选中答案数组
const selectedAnswers = ref([])

// 选择题的题干内容（独立于完整content）
const questionStem = ref('')

// 选项管理
const options = ref([
  { key: 'A', content: '' },
  { key: 'B', content: '' }
])

// AI习题展示相关
const showAIExercises = ref(true)

// 解析选择题选项（从content字段自动格式化）
function parseOptionsFromContent(content) {
  if (!content) return []

  const options = []

  // 格式1: A. 选项内容\nB. 选项内容
  const pattern1 = /([A-H])\.\s*([^\n\r]+)/g
  let match1
  while ((match1 = pattern1.exec(content)) !== null) {
    options.push({
      value: match1[1],
      content: match1[2].trim(),
      isCorrect: false
    })
  }

  if (options.length > 0) return options

  // 格式2: A) 选项内容\nB) 选项内容
  const pattern2 = /([A-H])\)\s*([^\n\r]+)/g
  let match2
  while ((match2 = pattern2.exec(content)) !== null) {
    options.push({
      value: match2[1],
      content: match2[2].trim(),
      isCorrect: false
    })
  }

  if (options.length > 0) return options

  // 格式3: A 选项内容\nB 选项内容
  const pattern3 = /([A-H])\s+([^\n\r]+)/g
  let match3
  while ((match3 = pattern3.exec(content)) !== null) {
    options.push({
      value: match3[1],
      content: match3[2].trim(),
      isCorrect: false
    })
  }

  if (options.length > 0) return options

  // 格式4: 按行分割，自动分配A、B、C、D
  const lines = content.split(/[\n\r]+/).filter(line => line.trim())
  if (lines.length > 1) {
    return lines.map((line, index) => ({
      value: String.fromCharCode(65 + index), // A, B, C, D...
      content: line.trim(),
      isCorrect: false
    }))
  }

  return []
}

// 解析后的选项列表
const parsedOptions = computed(() => {
  if (['SINGLE_CHOICE', 'MULTI_CHOICE'].includes(form.value.type)) {
    return options.value
      .filter(option => option.content.trim())
      .map(option => ({
        value: option.key,
        content: option.content
      }))
  }
  return []
})

// 获取内容输入框的占位符
function getContentPlaceholder() {
  switch (form.value.type) {
    case 'FILL_BLANK':
      return '请输入填空题的详细描述或提示信息'
    case 'ESSAY_QUESTION':
      return '请输入简答题的详细要求和评分标准'
    case 'TRUE_FALSE':
      return '请输入判断题的详细描述'
    default:
      return '请输入题目内容'
  }
}

// 获取内容输入框的提示
function getContentTip() {
  switch (form.value.type) {
    case 'FILL_BLANK':
      return '填空题的内容描述，可以包含答题提示'
    case 'ESSAY_QUESTION':
      return '简答题的详细要求，包括答题要点和评分标准'
    case 'TRUE_FALSE':
      return '判断题的详细描述，需要判断正误的内容'
    default:
      return '题目的详细内容描述'
  }
}

// 监听多选题答案变化
watch(selectedAnswers, (newVal) => {
  if (form.value.type === 'MULTI_CHOICE') {
    // 确保答案按字母顺序排序，并以逗号分隔的字符串格式存储
    const sortedAnswers = [...newVal].sort()
    form.value.expectedAnswer = sortedAnswers.join(',')
  }
}, { deep: true })

// 监听props的变化
watch(() => props.problemData, (newVal) => {
  if (newVal) {
    initFormData(newVal)
  }
}, { immediate: true })

// 初始化表单数据
function initFormData(data) {
  if (!data) return

  form.value = {
    problemId: data.problemId,
    title: data.title || '',
    type: data.type || 'SINGLE_CHOICE',
    content: data.content || '',
    score: data.score || 10,
    assignmentId: props.homeworkId,
    expectedAnswer: data.expectedAnswer || (data.type === 'TRUE_FALSE' ? 'true' : ''),
    autoGrading: data.autoGrading !== undefined ? data.autoGrading : getAutoGrading(data.type || 'SINGLE_CHOICE')
  }

  // 初始化选项数组（针对选择题）
  if (['SINGLE_CHOICE', 'MULTI_CHOICE'].includes(data.type)) {
    // 如果是选择题，需要分离题干和选项
    if (data.content) {
      const firstOptionMatch = data.content.match(/\s*A\.\s*/)
      if (firstOptionMatch) {
        questionStem.value = data.content.substring(0, firstOptionMatch.index).trim()
        // 解析选项
        const optionText = data.content.substring(firstOptionMatch.index)
        const parsedOptions = parseOptionsFromContent(optionText)
        if (parsedOptions.length > 0) {
          options.value = parsedOptions.map(option => ({
            key: option.value,
            content: option.content
          }))
        }
      } else {
        questionStem.value = data.content
        initOptionsFromContent(data.content)
      }
    } else {
      initOptionsFromContent(data.content)
    }
  }

  // 初始化多选题的答案数组
  if (data.type === 'MULTI_CHOICE' && data.expectedAnswer) {
    try {
      // 尝试解析JSON格式
      const answers = JSON.parse(data.expectedAnswer)
      selectedAnswers.value = Array.isArray(answers) ? answers : []
    } catch (e) {
      // 如果不是JSON格式，按分隔符分割
      const answerString = String(data.expectedAnswer).trim()
      if (answerString) {
        selectedAnswers.value = answerString.split(/[,;，；\s]+/)
          .map(a => a.trim().toUpperCase())
          .filter(a => a.length > 0 && /^[A-H]$/.test(a)) // 只保留有效的选项标识
      } else {
        selectedAnswers.value = []
      }
    }
  } else {
    selectedAnswers.value = []
  }
}





// 从文本内容初始化选项数组
function initOptionsFromContent(content) {
  if (!content || !['SINGLE_CHOICE', 'MULTI_CHOICE'].includes(form.value.type)) {
    options.value = [
      { key: 'A', content: '' },
      { key: 'B', content: '' }
    ]
    return
  }

  const parsedOptions = parseOptionsFromContent(content)
  if (parsedOptions.length > 0) {
    options.value = parsedOptions.map(option => ({
      key: option.value,
      content: option.content
    }))
  } else {
    // 如果解析失败，使用默认选项
    options.value = [
      { key: 'A', content: '' },
      { key: 'B', content: '' }
    ]
  }
}

// 清理无效答案
function cleanupAnswers() {
  const validKeys = options.value.map(option => option.key)

  if (form.value.type === 'SINGLE_CHOICE') {
    if (!validKeys.includes(form.value.expectedAnswer)) {
      form.value.expectedAnswer = ''
    }
  } else if (form.value.type === 'MULTI_CHOICE') {
    selectedAnswers.value = selectedAnswers.value.filter(answer => validKeys.includes(answer))
  }
}

// 处理题目类型变化
function handleTypeChange(newType) {
  // 重置答案相关数据
  form.value.expectedAnswer = ''
  selectedAnswers.value = []

  // 根据题目类型设置默认值
  if (newType === 'TRUE_FALSE') {
    form.value.expectedAnswer = 'true'
  } else if (['SINGLE_CHOICE', 'MULTI_CHOICE'].includes(newType)) {
    // 选择题：初始化选项
    if (!form.value.content) {
      options.value = [
        { key: 'A', content: '' },
        { key: 'B', content: '' },
        { key: 'C', content: '' },
        { key: 'D', content: '' }
      ]
      updateFormContent()
    } else {
      initOptionsFromContent(form.value.content)
    }
  }
}



// 保存题目
function saveProblem() {
  // 验证表单
  if (!form.value.title) {
    ElMessage.warning('请输入题干')
    return
  }

  if (!form.value.content) {
    ElMessage.warning('请输入题目内容')
    return
  }

  if (['SINGLE_CHOICE', 'MULTI_CHOICE'].includes(form.value.type)) {
    // 检查选项是否解析成功
    if (parsedOptions.value.length === 0) {
      ElMessage.warning('请输入有效的选项内容')
      return
    }

    // 检查是否有正确答案
    if (!form.value.expectedAnswer) {
      ElMessage.warning('请选择正确答案')
      return
    }

    // 多选题的答案已经通过watch自动设置
  } else if (form.value.type === 'FILL_BLANK' || form.value.type === 'ESSAY_QUESTION') {
    if (!form.value.expectedAnswer) {
      ElMessage.warning('请输入参考答案')
      return
    }
  }
  
  // 准备提交数据
  const submitData = {
    problemId: form.value.problemId,
    title: form.value.title,
    content: form.value.content,
    type: form.value.type,
    autoGrading: getAutoGrading(form.value.type), // 根据题目类型自动设置自动评分
    expectedAnswer: form.value.expectedAnswer,
    score: form.value.score,
    assignmentId: props.homeworkId,
    options: form.value.options
  }
  
  // 提交保存
  emit('save', submitData)
}

// 更新form.content字段（将题干和选项组合）
function updateFormContent() {
  if (['SINGLE_CHOICE', 'MULTI_CHOICE'].includes(form.value.type)) {
    // 获取题干内容
    const mainContent = questionStem.value.trim()

    // 生成选项文本
    const optionLines = options.value
      .filter(option => option.content.trim())
      .map(option => `${option.key}. ${option.content.trim()}`)

    // 组合题干和选项
    if (mainContent && optionLines.length > 0) {
      form.value.content = mainContent + ' ' + optionLines.join(' ')
    } else if (optionLines.length > 0) {
      form.value.content = optionLines.join(' ')
    } else {
      form.value.content = mainContent
    }
  }
}

// 添加选项
function addOption() {
  const keys = ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H']
  if (options.value.length < keys.length) {
    const nextKey = keys[options.value.length]
    options.value.push({ key: nextKey, content: '' })
    updateFormContent()
  }
}

// 删除选项
function removeOption(index) {
  if (options.value.length > 2) {
    options.value.splice(index, 1)
    // 重新分配选项标签
    options.value.forEach((option, idx) => {
      option.key = String.fromCharCode(65 + idx) // A, B, C, D...
    })
    updateFormContent()

    // 清理可能无效的答案
    cleanupAnswers()
  }
}

// 监听题目类型变化
watch(() => form.value.type, (newType) => {
  // 根据新的题目类型自动设置自动评分
  form.value.autoGrading = getAutoGrading(newType)

  if (['SINGLE_CHOICE', 'MULTI_CHOICE'].includes(newType)) {
    // 如果切换到选择题类型，确保有基本选项
    if (options.value.length < 2) {
      options.value = [
        { key: 'A', content: '' },
        { key: 'B', content: '' }
      ]
    }
  }
})





// 组件挂载时初始化
onMounted(() => {
  if (props.problemData) {
    initFormData(props.problemData)
  } else {
    // 如果没有数据，初始化默认选项
    if (['SINGLE_CHOICE', 'MULTI_CHOICE'].includes(form.value.type)) {
      options.value = [
        { key: 'A', content: '' },
        { key: 'B', content: '' }
      ]
    }
  }
})

// ==================== AI习题相关方法 ====================

// 切换AI习题显示状态
function toggleAIExercises() {
  showAIExercises.value = !showAIExercises.value
}

// 获取难度标签类型
function getDifficultyType(difficulty) {
  const typeMap = {
    '简单': 'success',
    '中等': 'warning',
    '困难': 'danger'
  }
  return typeMap[difficulty] || 'info'
}

// 获取题目类型文本
function getTypeText(type) {
  const typeMap = {
    'SINGLE_CHOICE': '单选题',
    'MULTI_CHOICE': '多选题',
    'FILL_BLANK': '填空题',
    'ESSAY_QUESTION': '简答题',
    'TRUE_FALSE': '判断题'
  }
  return typeMap[type] || type
}

// 复制习题到表单
function copyExerciseToForm(exercise) {
  try {
    // 复制题干
    if (exercise.question || exercise.title || exercise.content) {
      form.value.title = exercise.question || exercise.title || exercise.content
    }

    // 根据习题类型设置表单类型
    if (exercise.type) {
      form.value.type = exercise.type
      handleTypeChange(exercise.type)
    } else if (exercise.options && exercise.options.length > 0) {
      // 如果有选项，判断为选择题
      form.value.type = exercise.options.length > 4 ? 'MULTI_CHOICE' : 'SINGLE_CHOICE'
      handleTypeChange(form.value.type)
    }

    // 处理选择题
    if (['SINGLE_CHOICE', 'MULTI_CHOICE'].includes(form.value.type) && exercise.options) {
      // 设置题干
      questionStem.value = exercise.question || exercise.title || exercise.content || ''

      // 设置选项
      options.value = exercise.options.map((option, index) => ({
        key: String.fromCharCode(65 + index), // A, B, C, D...
        content: option
      }))

      // 更新表单内容
      updateFormContent()

      // 设置答案
      if (exercise.answer) {
        form.value.expectedAnswer = exercise.answer

        // 如果是多选题，解析答案
        if (form.value.type === 'MULTI_CHOICE') {
          const answerArray = exercise.answer.split(',').map(a => a.trim())
          selectedAnswers.value = answerArray
        }
      }
    } else {
      // 非选择题直接设置内容
      form.value.content = exercise.question || exercise.title || exercise.content || ''

      // 设置答案
      if (exercise.answer) {
        form.value.expectedAnswer = exercise.answer
      }
    }

    // 设置分值（如果有）
    if (exercise.score) {
      form.value.score = exercise.score
    }

    ElMessage.success('习题内容已复制到表单')
  } catch (error) {
    console.error('复制习题到表单失败:', error)
    ElMessage.error('复制失败，请手动复制内容')
  }
}

// 复制习题文本到剪贴板
function copyExerciseText(exercise) {
  try {
    let text = ''

    // 题目内容
    if (exercise.question || exercise.title || exercise.content) {
      text += `题目：${exercise.question || exercise.title || exercise.content}\n\n`
    }

    // 选项
    if (exercise.options && exercise.options.length > 0) {
      text += '选项：\n'
      exercise.options.forEach((option, index) => {
        text += `${String.fromCharCode(65 + index)}. ${option}\n`
      })
      text += '\n'
    }

    // 答案
    if (exercise.answer) {
      text += `答案：${exercise.answer}\n\n`
    }

    // 解析
    if (exercise.explanation) {
      text += `解析：${exercise.explanation}\n`
    }

    // 复制到剪贴板
    if (navigator.clipboard && window.isSecureContext) {
      navigator.clipboard.writeText(text)
      ElMessage.success('习题内容已复制到剪贴板')
    } else {
      // 降级方案
      const textArea = document.createElement('textarea')
      textArea.value = text
      textArea.style.position = 'fixed'
      textArea.style.left = '-999999px'
      textArea.style.top = '-999999px'
      document.body.appendChild(textArea)
      textArea.focus()
      textArea.select()
      document.execCommand('copy')
      textArea.remove()
      ElMessage.success('习题内容已复制到剪贴板')
    }
  } catch (error) {
    console.error('复制习题文本失败:', error)
    ElMessage.error('复制失败，请手动复制内容')
  }
}



</script>

<style scoped>
.problem-form {
  max-width: 800px;
  margin: 0 auto;
}

.input-output-pair {
  margin-bottom: 15px;
  padding: 15px;
  background: #f8f9fa;
  border-radius: 4px;
  border: 1px solid #e4e7ed;
}

.form-tip {
  font-size: 12px;
  color: #909399;
  margin-top: 5px;
  line-height: 1.4;
}

.options-preview-section {
  margin-bottom: 20px;
  padding: 15px;
  background: #f8f9fa;
  border-radius: 6px;
  border: 1px solid #e4e7ed;
}

.option-preview-item {
  display: flex;
  align-items: center;
  margin-bottom: 8px;
  padding: 8px 12px;
  background: white;
  border-radius: 4px;
  border: 1px solid #e4e7ed;
}

.option-preview-item:last-child {
  margin-bottom: 0;
}

.option-label {
  font-weight: 600;
  margin-right: 12px;
  min-width: 20px;
  color: #409EFF;
  background: #f0f9ff;
  padding: 2px 6px;
  border-radius: 4px;
  text-align: center;
}

.option-content {
  flex: 1;
  color: #606266;
  font-size: 14px;
}

.no-options-hint {
  margin-bottom: 20px;
}

.el-radio-group,
.el-checkbox-group {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.el-radio,
.el-checkbox {
  margin-right: 0;
  padding: 8px 12px;
  background: #f8f9fa;
  border-radius: 4px;
  border: 1px solid #e4e7ed;
  transition: all 0.2s ease;
}

.el-radio:hover,
.el-checkbox:hover {
  background: #f0f9ff;
  border-color: #c6e2ff;
}

.el-radio.is-checked,
.el-checkbox.is-checked {
  background: #f0f9ff;
  border-color: #409EFF;
}

/* 选项管理样式 */
.options-container {
  width: 100%;
}

.options-list {
  margin-bottom: 15px;
}

.option-item {
  display: flex;
  align-items: center;
  gap: 10px;
  margin-bottom: 10px;
  padding: 12px;
  background: #f8f9fa;
  border-radius: 6px;
  border: 1px solid #e4e7ed;
  transition: all 0.2s ease;
}

.option-item:hover {
  border-color: #c0c4cc;
  background: #f5f7fa;
}

.option-item:last-child {
  margin-bottom: 0;
}

.option-item .option-label {
  font-weight: 600;
  color: #409EFF;
  min-width: 30px;
  text-align: center;
  font-size: 14px;
  background: #f0f9ff;
  padding: 4px 8px;
  border-radius: 4px;
}

.option-input {
  flex: 1;
}

.add-option-section {
  padding: 15px;
  border: 2px dashed #dcdfe6;
  border-radius: 6px;
  text-align: center;
  background: #fafafa;
  transition: all 0.2s ease;
}

.add-option-section:hover {
  border-color: #409EFF;
  background: #f0f9ff;
}

.add-option-section .form-tip {
  margin-top: 10px;
  text-align: center;
}

/* 题型提示样式 */
.fill-blank-tips,
.essay-tips,
.true-false-tips {
  font-size: 13px;
  line-height: 1.5;
}

.fill-blank-tips p,
.essay-tips p,
.true-false-tips p {
  margin: 5px 0;
}

.fill-blank-tips strong,
.essay-tips strong,
.true-false-tips strong {
  color: #409eff;
}

/* 表单警告样式 */
.form-warning {
  margin-top: 10px;
}

.form-warning .el-alert {
  margin-bottom: 0;
}

/* 答案预览样式 */
.answer-preview {
  margin-top: 10px;
  padding: 10px;
  background-color: #f8f9fa;
  border-radius: 4px;
  border: 1px solid #e4e7ed;
}

.preview-label {
  font-weight: 600;
  color: #409eff;
  margin-right: 8px;
}

.preview-text {
  font-size: 12px;
  color: #909399;
  margin-left: 8px;
}

/* AI习题展示区域样式 */
.ai-exercises-section {
  margin-top: 30px;
  padding-top: 20px;
}

.ai-exercises-section .el-divider {
  margin: 20px 0;
}

.ai-exercises-section .ai-icon {
  color: #409EFF;
  margin-right: 8px;
}

.ai-exercises-container {
  border: 1px solid #e4e7ed;
  border-radius: 8px;
  background: #fafbfc;
}

.ai-exercises-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 15px 20px;
  border-bottom: 1px solid #e4e7ed;
  background: #f8f9fa;
  border-radius: 8px 8px 0 0;
}

.ai-exercises-title {
  font-size: 14px;
  color: #606266;
  font-weight: 500;
}

.ai-exercises-list {
  padding: 0;
}

.ai-exercise-item {
  border-bottom: 1px solid #e4e7ed;
  background: white;
  transition: all 0.2s ease;
}

.ai-exercise-item:last-child {
  border-bottom: none;
  border-radius: 0 0 8px 8px;
}

.ai-exercise-item:hover {
  background: #f8f9fa;
}

.exercise-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 15px 20px;
  border-bottom: 1px solid #f0f0f0;
}

.exercise-title {
  display: flex;
  align-items: center;
  gap: 10px;
}

.exercise-number {
  font-weight: 600;
  color: #409EFF;
  font-size: 14px;
}

.difficulty-tag,
.type-tag {
  font-size: 12px;
}

.exercise-actions {
  display: flex;
  gap: 8px;
}

.exercise-content {
  padding: 0 20px 20px 20px;
}

.content-section {
  margin-bottom: 15px;
}

.content-section:last-child {
  margin-bottom: 0;
}

.content-label {
  font-weight: 600;
  color: #303133;
  margin-bottom: 5px;
  font-size: 13px;
}

.content-text,
.answer-text,
.explanation-text {
  color: #606266;
  line-height: 1.6;
  font-size: 14px;
  padding: 10px;
  background: #f8f9fa;
  border-radius: 4px;
  border-left: 3px solid #409EFF;
}

.options-text {
  background: #f8f9fa;
  border-radius: 4px;
  padding: 10px;
  border-left: 3px solid #67C23A;
}

.option-line {
  color: #606266;
  line-height: 1.6;
  font-size: 14px;
  margin-bottom: 5px;
}

.option-line:last-child {
  margin-bottom: 0;
}

.answer-text {
  border-left-color: #E6A23C;
  font-weight: 500;
}

.explanation-text {
  border-left-color: #909399;
}
</style>