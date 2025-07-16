<template>
  <div class="problem-management">
    <div class="toolbar">
      <el-button type="primary" @click="$emit('add-problem')">
        <el-icon><Plus /></el-icon> 添加题目
      </el-button>
      <div class="spacer"></div>
      <div class="summary">
        共 {{ problems.length }} 道题目，总分 {{ totalScore }} 分
      </div>
    </div>
    
    <div v-if="problems.length === 0" class="empty-tip">
      当前作业没有题目，请点击"添加题目"按钮添加
    </div>
    
    <div v-else class="problem-list">
      <el-collapse accordion>
        <el-collapse-item v-for="(problem, index) in problems" :key="problem.problemId" :name="problem.problemId">
          <template #title>
            <div class="problem-item-header">
              <span class="problem-index">{{ index + 1 }}</span>
              <span class="problem-type">{{ getProblemTypeText(problem.type) }}</span>
              <span class="problem-title">{{ problem.title || '未命名题目' }}</span>
              <span class="problem-score">{{ problem.score || 0 }} 分</span>
            </div>
          </template>
          
          <div class="problem-content">
            <div class="problem-title-full">{{ problem.title || '未命名题目' }}</div>
            <div class="problem-type-tag">
              <el-tag size="small" :type="getProblemTypeTagType(problem.type)">
                {{ getProblemTypeText(problem.type) }}
              </el-tag>
            </div>
            
            <div class="problem-description">{{ problem.content || '无题目内容' }}</div>
            
            <!-- 选择题选项 -->
            <div v-if="['SINGLE_CHOICE', 'MULTI_CHOICE'].includes(problem.type)" class="problem-options">
              <div v-for="(option, optIndex) in problem.options" :key="optIndex" class="option-item">
                <div class="option-label">{{ ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H'][optIndex] }}</div>
                <div class="option-content">{{ option.content }}</div>
                <div v-if="isOptionCorrect(problem, option)" class="option-correct">
                  <el-icon><Check /></el-icon>
                </div>
              </div>
            </div>
            
            <!-- 填空题答案 -->
            <div v-if="problem.type === 'FILL_BLANK'" class="problem-answer">
              <div class="answer-label">参考答案：</div>
              <div class="answer-content">{{ problem.expectedAnswer || '无' }}</div>
            </div>
            
            <!-- 判断题答案 -->
            <div v-if="problem.type === 'TRUE_FALSE'" class="problem-answer">
              <div class="answer-label">参考答案：</div>
              <div class="answer-content">
                {{ problem.expectedAnswer === 'true' ? '正确' : '错误' }}
              </div>
            </div>
            
            <!-- 简答题答案 -->
            <div v-if="problem.type === 'ESSAY_QUESTION'" class="problem-answer">
              <div class="answer-label">参考答案：</div>
              <div class="answer-content">{{ problem.expectedAnswer || '无' }}</div>
            </div>
            
            <div class="problem-actions">
              <el-button type="primary" @click="$emit('edit-problem', problem)">编辑题目</el-button>
              <el-button type="danger" @click="$emit('delete-problem', problem)">删除题目</el-button>
            </div>
          </div>
        </el-collapse-item>
      </el-collapse>
    </div>
  </div>
</template>

<script setup>
/* eslint-disable no-undef */
import { computed } from 'vue'
import { Plus, Check } from '@element-plus/icons-vue'

const props = defineProps({
  homeworkId: {
    type: [String, Number],
    required: true
  },
  problems: {
    type: Array,
    required: true
  }
})

defineEmits(['add-problem', 'edit-problem', 'delete-problem', 'update:problems'])
/* eslint-enable no-undef */

// 计算总分
const totalScore = computed(() => {
  return props.problems.reduce((sum, problem) => sum + (problem.score || 0), 0)
})

// 获取题目类型文本
function getProblemTypeText(type) {
  const typeMap = {
    'SINGLE_CHOICE': '单选题',
    'MULTI_CHOICE': '多选题',
    'FILL_BLANK': '填空题',
    'ESSAY_QUESTION': '简答题',
    'TRUE_FALSE': '判断题'
  }
  return typeMap[type] || '未知类型'
}

// 获取题目类型标签类型
function getProblemTypeTagType(type) {
  const typeMap = {
    'SINGLE_CHOICE': 'success',
    'MULTI_CHOICE': 'warning',
    'FILL_BLANK': 'info',
    'ESSAY_QUESTION': 'primary',
    'TRUE_FALSE': 'danger'
  }
  return typeMap[type] || 'info'
}

// 判断选项是否为正确答案
function isOptionCorrect(problem, option) {
  if (!problem.expectedAnswer) return false
  
  if (problem.type === 'SINGLE_CHOICE') {
    return problem.expectedAnswer === option.value
  } else if (problem.type === 'MULTI_CHOICE') {
    try {
      const answers = JSON.parse(problem.expectedAnswer)
      return Array.isArray(answers) && answers.includes(option.value)
    } catch (e) {
      return false
    }
  }
  
  return false
}
</script>

<style scoped>
.problem-management {
  margin-bottom: 20px;
}

.toolbar {
  display: flex;
  align-items: center;
  margin-bottom: 20px;
}

.spacer {
  flex-grow: 1;
}

.summary {
  font-size: 14px;
  color: #606266;
}

.empty-tip {
  text-align: center;
  padding: 30px;
  color: #909399;
  background-color: #f7f7f7;
  border-radius: 4px;
}

.problem-list {
  margin-top: 20px;
}

.problem-item-header {
  display: flex;
  align-items: center;
}

.problem-index {
  font-weight: bold;
  margin-right: 10px;
  width: 24px;
  height: 24px;
  line-height: 24px;
  text-align: center;
  background-color: #409EFF;
  color: white;
  border-radius: 50%;
}

.problem-type {
  font-size: 12px;
  color: #909399;
  margin-right: 10px;
  min-width: 45px;
}

.problem-title {
  flex-grow: 1;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.problem-score {
  margin-left: 10px;
  font-weight: bold;
  color: #F56C6C;
}

.problem-content {
  padding: 10px;
}

.problem-title-full {
  font-size: 16px;
  font-weight: bold;
  margin-bottom: 10px;
}

.problem-type-tag {
  margin-bottom: 10px;
}

.problem-description {
  margin-bottom: 15px;
  white-space: pre-wrap;
}

.problem-options {
  margin-bottom: 15px;
}

.option-item {
  display: flex;
  align-items: flex-start;
  margin-bottom: 8px;
  padding: 8px;
  border-radius: 4px;
  background-color: #f7f7f7;
}

.option-label {
  font-weight: bold;
  margin-right: 10px;
  min-width: 20px;
}

.option-content {
  flex-grow: 1;
}

.option-correct {
  color: #67C23A;
  margin-left: 10px;
}

.problem-answer {
  margin-bottom: 15px;
  padding: 10px;
  background-color: #f0f9eb;
  border-radius: 4px;
  display: flex;
}

.answer-label {
  font-weight: bold;
  margin-right: 10px;
}

.answer-content {
  flex-grow: 1;
  white-space: pre-wrap;
}

.problem-actions {
  display: flex;
  justify-content: flex-end;
  gap: 10px;
  margin-top: 15px;
}
</style> 