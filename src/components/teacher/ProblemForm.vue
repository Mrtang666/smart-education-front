<template>
  <div class="problem-form">
    <el-form :model="form" label-width="100px">
      <el-form-item label="题目标题" required>
        <el-input v-model="form.title" placeholder="请输入题目标题" />
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
      
      <el-form-item label="题目内容" required>
        <el-input 
          v-model="form.content" 
          type="textarea" 
          :rows="4" 
          placeholder="请输入题目内容" 
        />
      </el-form-item>
      
      <!-- 单选题/多选题选项 -->
      <template v-if="['SINGLE_CHOICE', 'MULTI_CHOICE'].includes(form.type)">
        <el-divider>选项设置</el-divider>
        
        <div v-for="(option, index) in form.options" :key="index" class="option-form-item">
          <el-form-item :label="`选项 ${['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H'][index]}`">
            <div class="option-input-group">
              <el-input v-model="option.content" placeholder="请输入选项内容" />
              <el-checkbox 
                v-model="option.isCorrect" 
                :disabled="form.type === 'SINGLE_CHOICE' && isAnyOtherOptionCorrect(index)"
              >
                正确答案
              </el-checkbox>
              <el-button 
                type="danger" 
                icon="Delete" 
                circle 
                @click="removeOption(index)"
                :disabled="form.options.length <= 2"
              />
            </div>
          </el-form-item>
        </div>
        
        <el-form-item>
          <el-button 
            type="primary" 
            @click="addOption" 
            :disabled="form.options.length >= 8"
          >
            添加选项
          </el-button>
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
import { ref, watch, onMounted } from 'vue'
import { ElMessage } from 'element-plus'

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
  options: [
    { content: '', value: 'A', isCorrect: false },
    { content: '', value: 'B', isCorrect: false }
  ],
  expectedAnswer: '',
  score: 10,
  assignmentId: props.homeworkId
})

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
  
  // 初始化选项
  if (['SINGLE_CHOICE', 'MULTI_CHOICE'].includes(data.type)) {
    if (data.options && Array.isArray(data.options) && data.options.length > 0) {
      form.value.options = data.options.map(opt => ({
        ...opt,
        isCorrect: isCorrectOption(data.type, data.expectedAnswer, opt.value)
      }))
    } else {
      // 默认选项
      form.value.options = [
        { content: '', value: 'A', isCorrect: false },
        { content: '', value: 'B', isCorrect: false }
      ]
    }
  } else {
    form.value.options = []
  }
}

// 处理题目类型变化
function handleTypeChange(newType) {
  // 根据题目类型重置部分表单数据
  if (['SINGLE_CHOICE', 'MULTI_CHOICE'].includes(newType)) {
    if (!form.value.options || form.value.options.length < 2) {
      form.value.options = [
        { content: '', value: 'A', isCorrect: false },
        { content: '', value: 'B', isCorrect: false }
      ]
    }
    form.value.expectedAnswer = ''
  } else if (newType === 'TRUE_FALSE') {
    form.value.expectedAnswer = 'true'
  } else {
    form.value.options = []
    form.value.expectedAnswer = ''
  }
}

// 添加选项
function addOption() {
  if (form.value.options.length >= 8) return
  
  const optionValues = ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H']
  form.value.options.push({
    content: '',
    value: optionValues[form.value.options.length],
    isCorrect: false
  })
}

// 移除选项
function removeOption(index) {
  if (form.value.options.length <= 2) return
  form.value.options.splice(index, 1)
  
  // 重新设置选项的value值
  const optionValues = ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H']
  form.value.options.forEach((opt, idx) => {
    opt.value = optionValues[idx]
  })
}

// 判断是否有其他选项被选为正确答案（单选题使用）
function isAnyOtherOptionCorrect(currentIndex) {
  return form.value.options.some((opt, idx) => idx !== currentIndex && opt.isCorrect)
}

// 判断选项是否为正确答案
function isCorrectOption(type, expectedAnswer, optionValue) {
  if (!expectedAnswer) return false
  
  if (type === 'SINGLE_CHOICE') {
    return expectedAnswer === optionValue
  } else if (type === 'MULTI_CHOICE') {
    try {
      const answers = JSON.parse(expectedAnswer)
      return Array.isArray(answers) && answers.includes(optionValue)
    } catch (e) {
      return false
    }
  }
  
  return false
}

// 保存题目
function saveProblem() {
  // 验证表单
  if (!form.value.title) {
    ElMessage.warning('请输入题目标题')
    return
  }
  
  if (!form.value.content) {
    ElMessage.warning('请输入题目内容')
    return
  }
  
  if (['SINGLE_CHOICE', 'MULTI_CHOICE'].includes(form.value.type)) {
    // 检查选项是否完整
    if (form.value.options.some(opt => !opt.content)) {
      ElMessage.warning('请填写所有选项内容')
      return
    }
    
    // 检查是否有正确答案
    if (!form.value.options.some(opt => opt.isCorrect)) {
      ElMessage.warning('请至少选择一个正确答案')
      return
    }
    
    // 处理正确答案
    if (form.value.type === 'SINGLE_CHOICE') {
      const correctOption = form.value.options.find(opt => opt.isCorrect)
      form.value.expectedAnswer = correctOption ? correctOption.value : ''
    } else {
      // 多选题
      const correctValues = form.value.options
        .filter(opt => opt.isCorrect)
        .map(opt => opt.value)
      form.value.expectedAnswer = JSON.stringify(correctValues)
    }
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

// 组件挂载时初始化
onMounted(() => {
  if (props.problemData) {
    initFormData(props.problemData)
  }
})
</script>

<style scoped>
.problem-form {
  max-width: 800px;
  margin: 0 auto;
}

.option-form-item {
  margin-bottom: 10px;
}

.option-input-group {
  display: flex;
  align-items: center;
  gap: 10px;
}

.option-input-group .el-input {
  flex-grow: 1;
}
</style> 