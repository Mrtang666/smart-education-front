<!-- ExamProblemForm继承ProblemForm并添加编程题功能 -->
<template>
  <div class="exam-problem-form">
    <!-- 基础题目表单，引用ProblemForm组件 -->
    <ProblemForm
      ref="problemForm"
      :problem-data="form"
      :homework-id="examId"
      @save="handleBaseProblemSave"
      @cancel="$emit('cancel')"
    />
    
    <!-- 编程题专有部分，仅在选择编程题类型时显示 -->
    <template v-if="form.type === 'CODE_QUESTION'">
      <el-divider>编程题专有设置</el-divider>

      <!-- 编程题的表单部分 -->
      <template v-if="form.type === 'CODE_QUESTION'">
        <el-form-item label="题目描述" required>
          <el-input
            v-model="form.description"
            type="textarea"
            :rows="4"
            placeholder="请输入题目描述、要求、输入输出格式等"
          />
        </el-form-item>

        <el-form-item label="示例输入输出" required>
          <div v-for="(input, index) in form.sampleInputs" :key="index" class="input-output-pair">
            <el-input
              v-model="form.sampleInputs[index]"
              type="textarea"
              :rows="2"
              placeholder="示例输入"
            >
              <template #append>
                <el-button type="danger" @click="removeSamplePair(index)">删除</el-button>
              </template>
            </el-input>
            <el-input
              v-model="form.sampleOutputs[index]"
              type="textarea"
              :rows="2"
              placeholder="对应的示例输出"
              style="margin-top: 5px;"
            />
          </div>
          <el-button type="primary" @click="addSamplePair" style="margin-top: 10px;">
            添加示例输入输出对
          </el-button>
        </el-form-item>

        <el-form-item label="测试用例" required>
          <div v-for="(input, index) in form.caseInputs" :key="index" class="input-output-pair">
            <el-input
              v-model="form.caseInputs[index]"
              type="textarea"
              :rows="2"
              placeholder="测试用例输入"
            >
              <template #append>
                <el-button type="danger" @click="removeCasePair(index)">删除</el-button>
              </template>
            </el-input>
            <el-input
              v-model="form.caseOutputs[index]"
              type="textarea"
              :rows="2"
              placeholder="对应的测试用例输出"
              style="margin-top: 5px;"
            />
          </div>
          <el-button type="primary" @click="addCasePair" style="margin-top: 10px;">
            添加测试用例对
          </el-button>
        </el-form-item>

        <el-form-item label="参考答案" required>
          <el-input
            v-model="form.referenceAnswer"
            type="textarea"
            :rows="6"
            placeholder="请输入参考代码答案"
          />
        </el-form-item>
    </template>

      <!-- 其他题目类型的表单内容 -->
      <!-- ... -->
    </template>
  </div>
</template>

<script setup>
import { ref, watch, onMounted } from 'vue'
import { ElMessage } from 'element-plus'
import { validateCodeQuestion as validateCodeQuestionUtil, addSamplePair as addSamplePairUtil, 
         removeSamplePair as removeSamplePairUtil, addCasePair as addCasePairUtil, 
         removeCasePair as removeCasePairUtil } from '@/utils/code-question/codeQuestionUtils'

const props = defineProps({
  problemData: {
    type: Object,
    required: false,
    default: null
  },
  examId: {
    type: [String, Number],
    required: true
  }
})

// 编程题相关方法
const addSamplePair = () => {
  const result = addSamplePairUtil(props.form)
  Object.assign(props.form, result)
}

const removeSamplePair = (index) => {
  const result = removeSamplePairUtil(props.form, index)
  if (result !== props.form) {
    Object.assign(props.form, result)
  }
}

const addCasePair = () => {
  const result = addCasePairUtil(props.form)
  Object.assign(props.form, result)
}

const removeCasePair = (index) => {
  const result = removeCasePairUtil(props.form, index)
  if (result !== props.form) {
    Object.assign(props.form, result)
  }
}

// 题目类型变化处理
function handleTypeChange(newType) {
  // 如果切换到编程题，初始化相关字段
  if (newType === 'CODE_QUESTION') {
    props.form.description = ''
    props.form.sampleInputs = ['']
    props.form.sampleOutputs = ['']
    props.form.caseInputs = ['']
    props.form.caseOutputs = ['']
    props.form.referenceAnswer = ''
  }
}

// 编程题特殊验证
function validateCodeQuestion() {
  if (props.form.type === 'CODE_QUESTION') {
    const validation = validateCodeQuestionUtil(props.form)
    if (!validation.isValid) {
      ElMessage.warning(validation.message)
      return false
    }
  }
  return true
}

defineExpose({
  validateCodeQuestion
})
</script>

<style scoped>
.exam-problem-form {
  margin: 20px;
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
}
</style>
