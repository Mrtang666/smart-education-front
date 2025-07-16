<template>
  <div class="homework-basic-info">
    <div class="basic-form">
      <div class="form-item">
        <label><span class="required">*</span> 作业标题</label>
        <el-input v-model="formData.title" placeholder="请输入作业标题" />
      </div>

      <div class="form-item">
        <label>作业描述</label>
        <el-input 
          v-model="formData.description" 
          type="textarea" 
          :rows="3" 
          placeholder="请输入作业描述" 
        />
      </div>
      
      <div class="form-item">
        <label><span class="required">*</span> 开始时间</label>
        <el-date-picker
          v-model="formData.startTime"
          type="datetime"
          placeholder="选择开始时间"
          format="YYYY-MM-DD HH:mm"
          value-format="YYYY-MM-DDTHH:mm:ss"
        />
      </div>
      
      <div class="form-item">
        <label><span class="required">*</span> 截止日期</label>
        <el-date-picker
          v-model="formData.endTime"
          type="datetime"
          placeholder="选择截止日期"
          format="YYYY-MM-DD HH:mm"
          value-format="YYYY-MM-DDTHH:mm:ss"
        />
      </div>
      
      <div class="form-item">
        <label>最大尝试次数</label>
        <div class="number-input-container">
          <el-button @click="decrementAttempts">-</el-button>
          <el-input v-model.number="formData.maxAttempts" type="number" :min="1" :max="10" />
          <el-button @click="incrementAttempts">+</el-button>
        </div>
      </div>
      
      <div class="divider">选项设置</div>
      
      <div class="form-item option-item">
        <label>答案设置</label>
        <div class="option-container">
          <el-checkbox v-model="formData.isAnswerPublic">公开答案</el-checkbox>
          <div class="option-hint">启用后，学生在提交作业后可以查看正确答案</div>
        </div>
      </div>
      
      <div class="form-item option-item">
        <label>分数设置</label>
        <div class="option-container">
          <el-checkbox v-model="formData.isScoreVisible">分数可见</el-checkbox>
          <div class="option-hint">启用后，学生可以查看自己的得分情况</div>
        </div>
      </div>
      
      <div class="form-item option-item">
        <label>重做设置</label>
        <div class="option-container">
          <el-checkbox v-model="formData.isRedoAllowed">允许重做</el-checkbox>
          <div class="option-hint">启用后，学生可以在最大尝试次数内重新提交作业</div>
        </div>
      </div>
      
      <div class="form-item button-container">
        <el-button type="primary" @click="saveChanges">保存设置</el-button>
      </div>
    </div>
  </div>
</template>

<script setup>
/* eslint-disable no-undef */
import { ref, onMounted } from 'vue'

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
  max-width: 800px;
  margin: 0 auto;
}

.basic-form {
  padding: 20px;
  background-color: #fff;
  border-radius: 8px;
  box-shadow: 0 2px 12px 0 rgba(0, 0, 0, 0.1);
}

.form-item {
  margin-bottom: 20px;
}

.form-item label {
  display: block;
  margin-bottom: 8px;
  font-size: 14px;
  color: #303133;
  font-weight: bold;
}

.form-item .required {
  color: #f56c6c;
  margin-right: 4px;
}

.form-item .el-input,
.form-item .el-date-picker,
.form-item .el-input-number {
  width: 100%;
}

.form-item .el-input-number {
  width: 150px; /* Adjust as needed */
}

.number-input-container {
  display: flex;
  align-items: center;
  width: 150px; /* Adjust as needed */
}

.number-input-container .el-button {
  width: 30px;
  height: 30px;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 0;
  margin: 0 5px;
  border-radius: 4px;
  border: 1px solid #dcdfe6;
  background-color: #f5f7fa;
  color: #606266;
  font-size: 16px;
  font-weight: bold;
  cursor: pointer;
  transition: background-color 0.3s, border-color 0.3s;
}

.number-input-container .el-button:hover {
  background-color: #ebeef5;
  border-color: #c0c4cc;
}

.number-input-container .el-button:active {
  background-color: #ebeef5;
  border-color: #c0c4cc;
}

.divider {
  height: 1px;
  background-color: #ebeef5;
  margin: 20px 0;
}

.option-item {
  margin-bottom: 15px;
}

.option-container {
  display: flex;
  align-items: center;
  margin-top: 8px;
}

.option-container .el-checkbox {
  margin-right: 10px;
}

.option-hint {
  font-size: 12px;
  color: #909399;
  line-height: 1.4;
  margin-left: 10px;
}

.button-container {
  text-align: right;
}
</style> 