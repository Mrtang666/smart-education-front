<template>
  <div class="homework-basic-info">
    <el-form :model="formData" label-position="top" label-width="100px">
      <el-row :gutter="20">
        <el-col :span="24">
          <el-form-item label="作业标题" required>
            <el-input v-model="formData.title" placeholder="请输入作业标题" />
          </el-form-item>
        </el-col>
      </el-row>
      
      <el-row :gutter="20">
        <el-col :span="24">
          <el-form-item label="作业描述">
            <el-input 
              v-model="formData.description" 
              type="textarea" 
              :rows="4" 
              placeholder="请输入作业描述" 
            />
          </el-form-item>
        </el-col>
      </el-row>
      
      <el-row :gutter="20">
        <el-col :span="12">
          <el-form-item label="开始时间" required>
            <el-date-picker
              v-model="formData.startTime"
              type="datetime"
              placeholder="选择开始时间"
              format="YYYY-MM-DD HH:mm"
              value-format="YYYY-MM-DDTHH:mm:ss"
              style="width: 100%"
            />
          </el-form-item>
        </el-col>
        <el-col :span="12">
          <el-form-item label="截止日期" required>
            <el-date-picker
              v-model="formData.endTime"
              type="datetime"
              placeholder="选择截止日期"
              format="YYYY-MM-DD HH:mm"
              value-format="YYYY-MM-DDTHH:mm:ss"
              style="width: 100%"
            />
          </el-form-item>
        </el-col>
      </el-row>
      
      <el-row :gutter="20">
        <el-col :span="12">
          <el-form-item label="最大尝试次数">
            <div class="attempts-input">
              <el-button :disabled="formData.maxAttempts <= 1" @click="decrementAttempts">-</el-button>
              <el-input-number v-model="formData.maxAttempts" :min="1" :max="10" controls-position="right" />
              <el-button :disabled="formData.maxAttempts >= 10" @click="incrementAttempts">+</el-button>
            </div>
          </el-form-item>
        </el-col>
      </el-row>
      
      <el-divider content-position="left">选项设置</el-divider>
      
      <el-row :gutter="20">
        <el-col :span="24">
          <div class="options-container">
            <div class="option-item">
              <el-checkbox v-model="formData.isAnswerPublic">公开答案</el-checkbox>
              <div class="option-hint">启用后，学生在提交作业后可以查看正确答案</div>
            </div>
            
            <div class="option-item">
              <el-checkbox v-model="formData.isScoreVisible">分数可见</el-checkbox>
              <div class="option-hint">启用后，学生可以查看自己的得分情况</div>
            </div>
            
            <div class="option-item">
              <el-checkbox v-model="formData.isRedoAllowed">允许重做</el-checkbox>
              <div class="option-hint">启用后，学生可以在最大尝试次数内重新提交作业</div>
            </div>
          </div>
        </el-col>
      </el-row>
      
      <el-form-item>
        <el-button type="primary" @click="saveChanges">保存设置</el-button>
      </el-form-item>
    </el-form>
  </div>
</template>

<script setup>
/* eslint-disable no-undef */
import { ref, watch, onMounted } from 'vue'

const props = defineProps({
  homeworkData: {
    type: Object,
    required: true
  }
})

const emit = defineEmits(['update:homework-data'])
/* eslint-enable no-undef */

// 创建表单数据的副本
const formData = ref({
  title: '',
  description: '',
  startTime: '',
  endTime: '',
  maxAttempts: 1,
  isAnswerPublic: false,
  isScoreVisible: true,
  isRedoAllowed: false
})

// 监听props变化，当props.homeworkData发生变化时更新本地表单
watch(() => props.homeworkData, (newValue) => {
  if (newValue) {
    formData.value = {
      title: newValue.title || '',
      description: newValue.description || '',
      startTime: newValue.startTime || '',
      endTime: newValue.endTime || '',
      maxAttempts: newValue.maxAttempts || 1,
      isAnswerPublic: newValue.isAnswerPublic || false,
      isScoreVisible: newValue.isScoreVisible !== undefined ? newValue.isScoreVisible : true,
      isRedoAllowed: newValue.isRedoAllowed || false
    }
  }
}, { immediate: true, deep: true })

// 增加尝试次数
function incrementAttempts() {
  if (formData.value.maxAttempts < 10) {
    formData.value.maxAttempts++;
  }
}

// 减少尝试次数
function decrementAttempts() {
  if (formData.value.maxAttempts > 1) {
    formData.value.maxAttempts--;
  }
}

// 保存更改 - 只在用户点击保存按钮时才更新父组件数据
function saveChanges() {
  emit('update:homework-data', {
    title: formData.value.title,
    description: formData.value.description,
    startTime: formData.value.startTime,
    endTime: formData.value.endTime,
    maxAttempts: formData.value.maxAttempts,
    isAnswerPublic: formData.value.isAnswerPublic,
    isScoreVisible: formData.value.isScoreVisible,
    isRedoAllowed: formData.value.isRedoAllowed
  })
}

// 组件挂载时初始化数据
onMounted(() => {
  if (props.homeworkData) {
    formData.value = {
      title: props.homeworkData.title || '',
      description: props.homeworkData.description || '',
      startTime: props.homeworkData.startTime || '',
      endTime: props.homeworkData.endTime || '',
      maxAttempts: props.homeworkData.maxAttempts || 1,
      isAnswerPublic: props.homeworkData.isAnswerPublic || false,
      isScoreVisible: props.homeworkData.isScoreVisible !== undefined ? props.homeworkData.isScoreVisible : true,
      isRedoAllowed: props.homeworkData.isRedoAllowed || false
    }
  }
})
</script>

<style scoped>
.homework-basic-info {
  padding: 10px;
}

.attempts-input {
  display: flex;
  align-items: center;
  gap: 10px;
}

.el-divider {
  margin: 30px 0;
}

.options-container {
  display: flex;
  flex-direction: column;
  gap: 15px;
}

.option-item {
  display: flex;
  align-items: flex-start;
  padding: 10px 15px;
  background-color: #f5f7fa;
  border-radius: 6px;
}

.el-checkbox {
  margin-right: 15px;
}

.option-hint {
  color: #909399;
  font-size: 13px;
  line-height: 1.4;
}

.el-form-item:last-child {
  margin-top: 20px;
  margin-bottom: 0;
  text-align: right;
}
</style> 