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
        v-else
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
                :label="option.value"
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
                :label="option.value"
              >
                {{ option.value }}. {{ option.content }}
              </el-checkbox>
            </el-checkbox-group>
            <div class="form-tip">多选题可以选择多个正确答案</div>
          </div>
        </el-form-item>
      </template>
      
      <!-- 填空题和简答题答案 -->
      <template v-if="['FILL_BLANK', 'ESSAY_QUESTION'].includes(form.type)">
        <el-form-item label="参考答案" required>
          <el-input 
            v-model="form.expectedAnswer" 
            type="textarea" 
            :rows="3" 
            placeholder="请输入参考答案" 
          />
        </el-form-item>
      </template>
      
      <!-- 判断题答案 -->
      <template v-if="form.type === 'TRUE_FALSE'">
        <el-form-item label="正确答案" required>
          <el-radio-group v-model="form.expectedAnswer">
            <el-radio label="true">正确</el-radio>
            <el-radio label="false">错误</el-radio>
          </el-radio-group>
        </el-form-item>
      </template>
      
      <el-form-item>
        <el-button type="primary" @click="saveProblem">保存题目</el-button>
        <el-button @click="$emit('cancel')">取消</el-button>
      </el-form-item>
    </el-form>
  </div>
</template>

<script setup>
/* eslint-disable no-undef */
import { ref, watch, onMounted, computed } from 'vue'
import { ElMessage } from 'element-plus'
import { Plus, Delete } from '@element-plus/icons-vue'

const props = defineProps({
  problemData: {
    type: Object,
    required: false,
    default: null
  },
  homeworkId: {
    type: [String, Number],
    required: true
  }
})

const emit = defineEmits(['save', 'cancel'])
/* eslint-enable no-undef */

// 表单数据
const form = ref({
  title: '',
  type: 'SINGLE_CHOICE',
  content: '',
  expectedAnswer: '',
  score: 10,
  assignmentId: props.homeworkId
})

// 多选题的选中答案数组
const selectedAnswers = ref([])

// 选项管理
const options = ref([
  { key: 'A', content: '' },
  { key: 'B', content: '' }
])

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
    form.value.expectedAnswer = newVal.join(',')
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
    expectedAnswer: data.expectedAnswer || (data.type === 'TRUE_FALSE' ? 'true' : '')
  }

  // 初始化选项数组（针对选择题）
  if (['SINGLE_CHOICE', 'MULTI_CHOICE'].includes(data.type)) {
    initOptionsFromContent(data.content)
  }

  // 初始化多选题的答案数组
  if (data.type === 'MULTI_CHOICE' && data.expectedAnswer) {
    try {
      // 尝试解析JSON格式
      const answers = JSON.parse(data.expectedAnswer)
      selectedAnswers.value = Array.isArray(answers) ? answers : []
    } catch (e) {
      // 如果不是JSON格式，按分隔符分割
      selectedAnswers.value = data.expectedAnswer.split(/[,;，；\s]+/)
        .map(a => a.trim().toUpperCase())
        .filter(a => a.length > 0)
    }
  } else {
    selectedAnswers.value = []
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

// 更新form.content字段（将选项数组转换为文本格式）
function updateFormContent() {
  if (['SINGLE_CHOICE', 'MULTI_CHOICE'].includes(form.value.type)) {
    const contentLines = options.value
      .filter(option => option.content.trim())
      .map(option => `${option.key}. ${option.content.trim()}`)
    form.value.content = contentLines.join('\n')
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
    expectedAnswer: form.value.expectedAnswer,
    score: form.value.score,
    assignmentId: props.homeworkId,
    options: form.value.options
  }
  
  // 提交保存
  emit('save', submitData)
}

// 监听题目类型变化
watch(() => form.value.type, (newType) => {
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
</script>

<style scoped>
.problem-form {
  max-width: 800px;
  margin: 0 auto;
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
</style>