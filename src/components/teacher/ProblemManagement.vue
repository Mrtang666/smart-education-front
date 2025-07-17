<template>
  <div class="problem-management">
    <div class="toolbar">
      <div class="summary">
        共 {{ problems.length }} 道题目，总分 {{ totalScore }} 分
      </div>
    </div>
    
    <div v-if="problems.length === 0" class="empty-tip">
      当前作业没有题目，请使用上方工具栏添加题目
    </div>
    
    <div v-else class="problem-list">
      <el-collapse accordion>
        <el-collapse-item v-for="(problem, index) in problems" :key="problem.problemId" :name="problem.problemId">
          <template #title>
            <div class="problem-item-header">
              <div class="header-main">
                <span class="problem-index">{{ index + 1 }}</span>
                <span class="problem-type">{{ getProblemTypeText(problem.type) }}</span>
                <span class="problem-title">{{ getProblemStem(problem) }}</span>
                <span class="problem-score">{{ problem.score || 0 }} 分</span>
              </div>
              <!-- 选择题选项预览 -->
              <div v-if="['SINGLE_CHOICE', 'MULTI_CHOICE'].includes(problem.type)" class="options-preview">
                <div v-if="getFormattedOptions(problem).length > 0">
                  <span v-for="(option, optIndex) in getFormattedOptions(problem).slice(0, 4)" :key="optIndex" class="option-preview">
                    {{ option.value }}. {{ option.content.substring(0, 20) }}{{ option.content.length > 20 ? '...' : '' }}
                  </span>
                  <span v-if="getFormattedOptions(problem).length > 4" class="more-options">+{{ getFormattedOptions(problem).length - 4 }}个选项</span>
                </div>
                <div v-else class="no-options">
                  <span class="no-options-text">暂无选项</span>
                </div>
              </div>
              <!-- 其他题型答案预览 -->
              <div v-else-if="problem.expectedAnswer" class="answer-preview">
                <span class="preview-label">答案：</span>
                <span class="preview-content">{{ problem.expectedAnswer.substring(0, 30) }}{{ problem.expectedAnswer.length > 30 ? '...' : '' }}</span>
              </div>
            </div>
          </template>
          
          <div class="problem-content">
            <div class="problem-title-full">{{ getProblemStem(problem) }}</div>
            <div class="problem-type-tag">
              <el-tag size="small" :type="getProblemTypeTagType(problem.type)">
                {{ getProblemTypeText(problem.type) }}
              </el-tag>
            </div>

            <!-- 对于非选择题，显示content作为题目描述 -->
            <div v-if="!['SINGLE_CHOICE', 'MULTI_CHOICE'].includes(problem.type)" class="problem-description">
              {{ problem.content || '无题目内容' }}
            </div>
            
            <!-- 选择题选项 -->
            <div v-if="['SINGLE_CHOICE', 'MULTI_CHOICE'].includes(problem.type)" class="problem-options">
              <div v-if="getFormattedOptions(problem).length > 0">
                <div
                  v-for="(option, optIndex) in getFormattedOptions(problem)"
                  :key="optIndex"
                  class="option-item"
                  :class="{ 'correct': isOptionCorrect(problem, option) }"
                >
                  <div class="option-label">{{ option.value }}</div>
                  <div class="option-content">{{ option.content }}</div>
                  <div v-if="isOptionCorrect(problem, option)" class="option-correct">
                    <el-icon><Check /></el-icon>
                  </div>
                </div>
              </div>
              <div v-else class="no-options-message">
                <el-empty description="暂无选项数据，请在题目内容中添加选项" :image-size="60">
                  <div class="format-tips">
                    <p><strong>支持的格式：</strong></p>
                    <p>A. 选项内容</p>
                    <p>B. 选项内容</p>
                    <p>或者每行一个选项</p>
                  </div>
                  <el-button type="primary" size="small" @click="$emit('edit-problem', problem)">
                    编辑题目内容
                  </el-button>
                </el-empty>
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
              <el-button size="small" type="info" @click="debugProblemData(problem)">调试数据</el-button>
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
import { Check } from '@element-plus/icons-vue'

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

defineEmits(['edit-problem', 'delete-problem', 'update:problems', 'copy-problem', 'selection-change', 'sequence-change'])
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

  // 获取选项的值和内容
  const optionValue = option.value || option.key || option
  const optionContent = option.content || option

  if (problem.type === 'SINGLE_CHOICE') {
    // 单选题：检查选项值（A、B、C、D）或选项内容
    return problem.expectedAnswer === optionValue ||
           problem.expectedAnswer === optionContent ||
           problem.expectedAnswer.toUpperCase() === optionValue ||
           (option.isCorrect === true)
  } else if (problem.type === 'MULTI_CHOICE') {
    // 多选题：支持多种答案格式
    if (option.isCorrect === true) return true

    try {
      // 尝试解析JSON数组格式
      const answers = JSON.parse(problem.expectedAnswer)
      return Array.isArray(answers) &&
             (answers.includes(optionValue) ||
              answers.includes(optionContent) ||
              answers.map(a => a.toUpperCase()).includes(optionValue))
    } catch (e) {
      // 如果不是JSON格式，尝试按逗号、分号或空格分割
      const separators = /[,;，；\s]+/
      const answers = problem.expectedAnswer.split(separators)
        .map(a => a.trim().toUpperCase())
        .filter(a => a.length > 0)

      return answers.includes(optionValue) ||
             answers.includes(optionContent) ||
             answers.includes(optionValue.toUpperCase())
    }
  }

  return false
}

// 解析选择题选项（从content字段自动格式化）
function parseOptionsFromContent(content) {
  if (!content) return []

  // 支持多种格式的选项解析
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

// 获取格式化后的选项列表
function getFormattedOptions(problem) {
  // 如果是选择题，从content字段解析选项
  if (['SINGLE_CHOICE', 'MULTI_CHOICE'].includes(problem.type)) {
    return parseOptionsFromContent(problem.content)
  }
  return []
}

// 获取题干内容（使用title字段）
function getProblemStem(problem) {
  return problem.title || '未设置题干'
}



// 调试函数：打印题目数据结构
function debugProblemData(problem) {
  const formattedOptions = getFormattedOptions(problem)
  console.log('题目数据结构:', {
    原始title: problem.title,
    原始content: problem.content,
    题干: getProblemStem(problem),
    题目类型: problem.type,
    解析后的选项: formattedOptions,
    选项数量: formattedOptions.length,
    expectedAnswer: problem.expectedAnswer
  })
}
</script>

<style scoped>
.problem-management {
  margin-bottom: 20px;
}

.toolbar {
  display: flex;
  align-items: center;
  justify-content: center;
  margin-bottom: 20px;
  padding: 10px;
  background: #f8f9fa;
  border-radius: 6px;
}

.summary {
  font-size: 14px;
  color: #606266;
  font-weight: 500;
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
  padding: 20px 30px;
  background: white;
  text-align: left;
}

.problem-title-full {
  font-size: 16px;
  font-weight: 600;
  margin-bottom: 15px;
  color: #303133;
  line-height: 1.5;
  text-align: left;
}

.problem-type-tag {
  margin-bottom: 15px;
  text-align: left;
}

.problem-description {
  margin-bottom: 20px;
  white-space: pre-wrap;
  font-size: 14px;
  line-height: 1.6;
  color: #606266;
  text-align: left;
  padding: 16px 20px;
  background: #fafbfc;
  border-radius: 8px;
  border: 1px solid #f0f0f0;
  position: relative;
}

.problem-description::before {
  content: '';
  position: absolute;
  left: 0;
  top: 0;
  bottom: 0;
  width: 3px;
  background: linear-gradient(to bottom, #409EFF, #66b3ff);
  border-radius: 3px 0 0 3px;
}

.problem-options {
  margin-bottom: 20px;
  text-align: left;
}

.option-item {
  display: flex;
  align-items: flex-start;
  margin-bottom: 10px;
  padding: 12px 18px;
  background-color: #fafbfc;
  border-radius: 8px;
  border: 1px solid #f0f0f0;
  position: relative;
  transition: all 0.2s ease;
}

.option-item::before {
  content: '';
  position: absolute;
  left: 0;
  top: 0;
  bottom: 0;
  width: 3px;
  background: #e5e7eb;
  border-radius: 3px 0 0 3px;
  transition: background 0.2s ease;
}

.option-item.correct {
  background-color: #f0f9eb;
  border-color: #e8f5e8;
}

.option-item.correct::before {
  background: linear-gradient(to bottom, #67C23A, #85ce61);
}

.option-label {
  font-weight: bold;
  margin-right: 10px;
  min-width: 20px;
  color: #409EFF;
  flex-shrink: 0;
  text-align: left;
}

.option-item.correct .option-label {
  color: #67C23A;
}

.option-content {
  flex-grow: 1;
  font-size: 14px;
  line-height: 1.5;
  color: #606266;
  text-align: left;
}

.option-correct {
  color: #67C23A;
  margin-left: 10px;
  font-size: 14px;
  flex-shrink: 0;
}

.problem-answer {
  margin-bottom: 20px;
  padding: 16px 20px;
  background: #f0f9eb;
  border-radius: 8px;
  border: 1px solid #e8f5e8;
  text-align: left;
  position: relative;
}

.problem-answer::before {
  content: '';
  position: absolute;
  left: 0;
  top: 0;
  bottom: 0;
  width: 3px;
  background: linear-gradient(to bottom, #67C23A, #85ce61);
  border-radius: 3px 0 0 3px;
}

.answer-label {
  font-weight: 600;
  margin-bottom: 8px;
  color: #67C23A;
  font-size: 14px;
  display: block;
  text-align: left;
}

.answer-content {
  font-size: 14px;
  line-height: 1.6;
  color: #606266;
  white-space: pre-wrap;
  text-align: left;
}

.problem-actions {
  display: flex;
  justify-content: flex-end;
  gap: 10px;
  margin-top: 20px;
  padding-top: 15px;
  border-top: 1px solid #e4e7ed;
}

.problem-actions .el-button {
  border-radius: 6px;
  border-width: 1px;
  font-weight: 500;
}

/* 折叠面板样式优化 */
.el-collapse {
  border: none;
}

.el-collapse-item {
  margin-bottom: 12px;
  border: 1px solid #e4e7ed;
  border-radius: 8px;
  overflow: hidden;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
  transition: all 0.2s ease;
}

.el-collapse-item:hover {
  border-color: #c6e2ff;
  box-shadow: 0 2px 6px rgba(0, 0, 0, 0.15);
}

.el-collapse-item.is-active {
  border-color: #409EFF;
  box-shadow: 0 2px 8px rgba(64, 158, 255, 0.2);
}

/* 题目头部样式 */
.problem-item-header {
  width: 100%;
  padding: 8px 0;
}

.header-main {
  display: flex;
  align-items: center;
  gap: 12px;
  margin-bottom: 8px;
}

.problem-index {
  font-size: 14px;
  font-weight: 600;
  color: #409EFF;
  min-width: 24px;
  text-align: center;
  background: #f0f9ff;
  border-radius: 4px;
  padding: 2px 6px;
}

.problem-type {
  font-size: 12px;
  padding: 2px 8px;
  background: #f0f2f5;
  border-radius: 12px;
  color: #606266;
  font-weight: 500;
}

.problem-title {
  font-size: 14px;
  font-weight: 500;
  color: #303133;
  flex: 1;
  text-align: left;
}

.problem-score {
  font-size: 13px;
  font-weight: 600;
  color: #67C23A;
  background: #f0f9eb;
  padding: 2px 8px;
  border-radius: 4px;
}

/* 选项预览样式 */
.options-preview {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  margin-top: 4px;
  padding-left: 36px;
}

.option-preview {
  font-size: 12px;
  color: #909399;
  background: #f8f9fa;
  padding: 2px 6px;
  border-radius: 4px;
  max-width: 120px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.more-options {
  font-size: 12px;
  color: #909399;
  font-style: italic;
  background: #f0f0f0;
  padding: 2px 6px;
  border-radius: 4px;
}

.no-options {
  margin-top: 4px;
  padding-left: 36px;
}

.no-options-text {
  font-size: 12px;
  color: #c0c4cc;
  font-style: italic;
  background: #f5f5f5;
  padding: 2px 6px;
  border-radius: 4px;
}

.no-options-message {
  text-align: center;
  padding: 20px;
  background: #fafbfc;
  border-radius: 8px;
  border: 1px dashed #e4e7ed;
}

.format-tips {
  margin: 15px 0;
  padding: 12px;
  background: #f0f9ff;
  border-radius: 6px;
  border: 1px solid #e0f2fe;
  text-align: left;
  font-size: 12px;
  color: #0369a1;
}

.format-tips p {
  margin: 4px 0;
  line-height: 1.4;
}

.format-tips strong {
  color: #1e40af;
}

/* 答案预览样式 */
.answer-preview {
  margin-top: 4px;
  padding-left: 36px;
  display: flex;
  align-items: center;
  gap: 6px;
}

.preview-label {
  font-size: 12px;
  color: #67C23A;
  font-weight: 500;
}

.preview-content {
  font-size: 12px;
  color: #909399;
  background: #f0f9eb;
  padding: 2px 6px;
  border-radius: 4px;
  max-width: 200px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

/* 响应式设计 */
@media (max-width: 768px) {
  .problem-content {
    padding: 15px 20px;
  }

  .problem-actions {
    flex-direction: column;
    gap: 8px;
  }

  .problem-actions .el-button {
    width: 100%;
  }

  .header-main {
    flex-direction: column;
    align-items: flex-start;
    gap: 6px;
  }

  .options-preview,
  .answer-preview {
    padding-left: 0;
    margin-top: 8px;
  }

  .option-preview {
    max-width: 100px;
  }

  .preview-content {
    max-width: 150px;
  }
}
</style>