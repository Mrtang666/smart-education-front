<!-- 学生考试详情页面 -->
<template>
  <div class="exam-detail-container">
    <div v-if="loading" class="loading-container">
      <el-skeleton :rows="10" animated />
    </div>

    <div v-else>
      <!-- 考试信息头部 -->
      <el-card class="exam-info-card">
        <div class="exam-header">
          <h2>{{ examInfo.title || '考试详情' }}</h2>
          <div class="exam-meta">
            <span><el-icon>
                <Calendar />
              </el-icon> 开始时间: {{ formatDateTime(examInfo.startTime) }}</span>
            <span><el-icon>
                <Timer />
              </el-icon> 结束时间: {{ formatDateTime(examInfo.endTime) }}</span>
            <span><el-icon>
                <Timer />
              </el-icon> 时长: {{ examInfo.durationMinutes || 0 }} 分钟</span>
            <span><el-icon>
                <Document />
              </el-icon> 总分: {{ examInfo.totalScore || 0 }} 分</span>

            <div class="exam-description" v-if="examInfo.description">
              考试描述：{{ examInfo.description }}
            </div>
          </div>
        </div>
      </el-card>

      <!-- 考试成绩卡片已隐藏 -->

      <!-- 考试计时器 -->
      <el-card class="timer-card" v-if="examStatus === 'ONGOING'">
        <div class="timer-container">
          <div class="timer-label">剩余时间</div>
          <div class="timer-value">{{ formatTimeRemaining }}</div>
        </div>
      </el-card>

      <!-- 题目列表 -->
      <el-card class="questions-card">
        <!-- 考试已提交的友好提示 -->
        <div v-if="examStatus === 'SUBMITTED'" class="submitted-message">
          <el-result
            icon="success"
            title="您已提交答卷"
            sub-title="感谢您完成本次考试，答卷已成功提交。您可以查看分析结果。"
          >
            <template #extra>
              <el-button type="primary" @click="router.push('/student')">返回首页</el-button>
            </template>
          </el-result>
        </div>

        <!-- 考试进行中或其他状态 -->
        <div v-else-if="questions.length === 0" class="empty-container">
          <el-empty description="暂无题目" />
        </div>

        <div v-else class="questions-container">
          <div
            v-for="(question, qIndex) in questions"
            :key="question.questionId"
            class="question-box"
            style="margin-bottom: 24px; border: 1px solid #e4e7ed; border-radius: 8px; background: #fff; padding: 20px;"
          >
            <div class="question-header">
              <span class="question-number">{{ qIndex + 1 }}.</span>
              <span class="question-type">{{ getQuestionTypeText(question.questionType) }}</span>
              <span class="question-score">({{ question.scorePoints || 0 }}分)</span>
            </div>
            <div class="question-content">
              <h4>题目内容：</h4>
              <div class="question-text">{{ getQuestionMainContent(question) }}</div>
            </div>
            <!-- 这里可以根据考试状态和题型，渲染答题区或结果区，参考你原有的 currentQuestion 逻辑，传 question 进去即可 -->
            <div class="answer-area" v-if="examStatus === 'ONGOING'">
              <!-- 单选题 -->
              <div v-if="question.questionType === 'SINGLE_CHOICE'" class="question-options">
                <el-radio-group v-model="userAnswers[question.questionId]" class="option-group">
                  <div v-for="(option, optIndex) in getQuestionOptions(question)" :key="optIndex"
                    class="option-item">
                    <el-radio :value="String.fromCharCode(65 + optIndex)" class="option-radio">
                      <div class="option-wrapper">
                        <span class="option-label">{{ String.fromCharCode(65 + optIndex) }}.</span>
                        <span class="option-content">{{ option }}</span>
                      </div>
                    </el-radio>
                  </div>
                </el-radio-group>
              </div>

              <!-- 多选题 -->
              <div v-else-if="question.questionType === 'MULTIPLE_CHOICE' || question.questionType === 'MULTI_CHOICE'" class="question-options">
                <el-checkbox-group v-model="userAnswers[question.questionId]" class="option-group">
                  <div v-for="(option, optIndex) in getQuestionOptions(question)" :key="optIndex"
                    class="option-item">
                    <el-checkbox :value="String.fromCharCode(65 + optIndex)" class="option-checkbox">
                      <div class="option-wrapper">
                        <span class="option-label">{{ String.fromCharCode(65 + optIndex) }}.</span>
                        <span class="option-content">{{ option }}</span>
                      </div>
                    </el-checkbox>
                  </div>
                </el-checkbox-group>
              </div>

              <!-- 判断题 -->
              <div v-else-if="question.questionType === 'TRUE_FALSE'" class="question-options">
                <el-radio-group v-model="userAnswers[question.questionId]" class="option-group">
                  <div v-for="(option, optIndex) in getQuestionOptions(question)" :key="optIndex" class="option-item">
                    <el-radio :value="String.fromCharCode(65 + optIndex)" class="option-radio">
                      <div class="option-wrapper">
                        <span class="option-label">{{ String.fromCharCode(65 + optIndex) }}.</span>
                        <span class="option-content">{{ option }}</span>
                      </div>
                    </el-radio>
                  </div>
                </el-radio-group>
              </div>

              <!-- 填空题 -->
              <div v-else-if="question.questionType === 'FILL_BLANK'" class="question-options">
                <el-input v-model="userAnswers[question.questionId]" type="textarea" :rows="2"
                  placeholder="请输入您的答案"></el-input>
              </div>

              <!-- 简答题 -->
              <div v-else-if="question.questionType === 'ESSAY_QUESTION'" class="question-options">
                <el-input v-model="userAnswers[question.questionId]" type="textarea" :rows="4"
                  placeholder="请输入您的答案"></el-input>
              </div>

              <!-- 主观题（兼容旧版本） -->
              <div v-else-if="question.questionType === 'SUBJECTIVE'" class="question-options">
                <el-input v-model="userAnswers[question.questionId]" type="textarea" :rows="4"
                  placeholder="请输入您的答案"></el-input>
              </div>

              <!-- 未知题型的调试信息 -->
              <div v-else class="question-options">
                <div class="debug-info">
                  ⚠️ 未识别的题型: {{ question.questionType }}
                </div>
                <el-input v-model="userAnswers[question.questionId]" type="textarea" :rows="4"
                  placeholder="请输入您的答案（默认文本输入）"></el-input>
              </div>

              <!-- 提交按钮 -->
              <div class="answer-actions">
                <el-button type="primary" size="small" @click="submitAnswer(question)"
                  :disabled="!isAnswerValid(question)">提交答案</el-button>

                <el-button v-if="qIndex < questions.length - 1" type="default" size="small"
                  @click="nextQuestion(question)">下一题</el-button>

                <el-button v-if="qIndex > 0" type="default" size="small"
                  @click="prevQuestion(question)">上一题</el-button>
              </div>
            </div>

            <!-- 已结束或已提交的考试显示答案区域 - 只在考试完成后显示 -->
            <div v-else-if="(examStatus === 'ENDED' || examStatus === 'SUBMITTED') && isExamCompleted"
              class="result-area">
              <div class="answer-section">
                <div class="my-answer">
                  <h4>我的答案：</h4>
                  <div class="answer-content" :class="getAnswerClass(question)">
                    {{ getDisplayAnswer(question) }}
                  </div>
                  <div class="answer-status">
                    <el-tag :type="getAnswerTagType(question)" size="small">
                      {{ getAnswerStatusText(question) }}
                    </el-tag>
                  </div>
                </div>

                <div v-if="showReferenceAnswer" class="correct-answer">
                  <h4>参考答案：</h4>
                  <div class="answer-content">{{ question.referenceAnswer }}</div>
                </div>

                <!-- 显示反馈信息（隐藏得分） -->
                <div class="feedback-info" v-if="getCurrentQuestionAnswer(question)">
                  <div class="feedback-item" v-if="getCurrentQuestionAnswer(question).feedback">
                    <span class="label">教师反馈：</span>
                    <div class="feedback-content">{{ getCurrentQuestionAnswer(question).feedback }}</div>
                  </div>
                  <div class="grading-info" v-if="getCurrentQuestionAnswer(question).gradedBy">
                    <span class="label">批改信息：</span>
                    <span class="grading-details">
                      由 {{ getCurrentQuestionAnswer(question).teacherName || '教师' }}
                      于 {{ formatDateTime(getCurrentQuestionAnswer(question).gradedAt) }} 批改
                    </span>
                  </div>
                </div>
              </div>
            </div>

            <!-- 考试进行中或未完成时的提示 -->
            <div v-else-if="examStatus !== '进行中' " class="exam-pending">
              <el-empty description="考试已结束，等待批改完成后查看结果" />
            </div>
          </div>
        </div>
      </el-card>

      <!-- 智能分析和学习建议已隐藏 -->

      <!-- 提交考卷按钮 -->
      <div class="submit-exam-container" v-if="examStatus === 'ONGOING'">
        <el-button type="primary" @click="submitExam" :loading="submitting">提交考卷</el-button>
      </div>

      <!-- 考试结果已隐藏 -->
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, onUnmounted, watch, nextTick } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { ElMessage, ElMessageBox } from 'element-plus'
import { Calendar, Timer, Document } from '@element-plus/icons-vue'
import { studentExamAPI, questionAPI, examAPI } from '@/api/api'
import { getUserInfo } from '@/utils/auth'

const route = useRoute()
const router = useRouter()

// 响应式数据
const loading = ref(true)
const submitting = ref(false)
const examId = ref(null)
const examInfo = ref({})
const questions = ref([])

const userAnswers = ref({})
const answeredQuestions = ref({})
const remainingTime = ref(0)
const timerInterval = ref(null)
const examStatus = ref('ONGOING')
const totalScore = ref(0)
const correctCount = ref(0)
const showReferenceAnswer = ref(false)

// 新增的响应式数据
const examScore = ref(null) // 考试成绩详情
const studentAnswers = ref([]) // 学生答案详情

// 获取用户信息
const userInfo = getUserInfo()
const studentId = userInfo?.studentId



// 判断考试是否已完成（已提交且已批改）
const isExamCompleted = computed(() => {
  // 如果考试状态是已提交，且有学生答案记录，且至少有一个答案已被批改
  if (examStatus.value === 'SUBMITTED' && studentAnswers.value.length > 0) {
    return studentAnswers.value.some(answer => answer.graded === true || answer.score !== null)
  }
  // 如果考试状态是已结束，且有成绩记录
  if (examStatus.value === 'ENDED' && examScore.value) {
    return true
  }
  return false
})

const formatTimeRemaining = computed(() => {
  if (remainingTime.value <= 0) return '00:00:00'

  const totalSeconds = Math.floor(remainingTime.value)
  const hours = Math.floor(totalSeconds / 3600)
  const minutes = Math.floor((totalSeconds % 3600) / 60)
  const seconds = totalSeconds % 60

  return [
    hours.toString().padStart(2, '0'),
    minutes.toString().padStart(2, '0'),
    seconds.toString().padStart(2, '0')
  ].join(':')
})

// 答题统计计算属性已移除

// 成绩相关计算属性已移除

// // 方法定义 - 必须在watch之前定义
// const parseOptions = (options) => {
//   if (typeof options === 'string') {
//     try {
//       return JSON.parse(options)
//     } catch (e) {
//       return []
//     }
//   }
//   return Array.isArray(options) ? options : []
// }

const initUserAnswers = (answers) => {
  const userAnswersData = {}
  const answeredQuestionsData = {}

  answers.forEach(answer => {
    const questionId = answer.questionId
    const questionType = answer.questionType

    // 如果已有答案
    if (answer.studentAnswer) {
      if (questionType === 'MULTIPLE_CHOICE' || questionType === 'MULTI_CHOICE') {
        try {
          userAnswersData[questionId] = answer.studentAnswer.split(',').map(item => item.trim())
        } catch (e) {
          userAnswersData[questionId] = []
        }
      } else {
        userAnswersData[questionId] = answer.studentAnswer
      }

      // 标记为已答题
      answeredQuestionsData[questionId] = {
        answered: true,
        score: answer.score,
        graded: answer.graded
      }
    } else {
      // 初始化空答案
      if (questionType === 'MULTIPLE_CHOICE') {
        userAnswersData[questionId] = []
      } else {
        userAnswersData[questionId] = ''
      }
    }
  })

  userAnswers.value = userAnswersData
  answeredQuestions.value = answeredQuestionsData
}

// 初始化空的用户答案（当没有答案记录时）
const initEmptyUserAnswers = () => {
  const userAnswersData = {}
  const answeredQuestionsData = {}

  questions.value.forEach(question => {
    const questionId = question.questionId
    const questionType = question.questionType

    // 根据题目类型初始化空答案
    if (questionType === 'MULTIPLE_CHOICE' || questionType === 'MULTI_CHOICE') {
      userAnswersData[questionId] = []
    } else {
      userAnswersData[questionId] = ''
    }

    // 标记为未答题
    answeredQuestionsData[questionId] = {
      answered: false,
      score: null,
      graded: false
    }
  })

  userAnswers.value = userAnswersData
  answeredQuestions.value = answeredQuestionsData

  console.log('初始化空用户答案:', userAnswersData)
}

const determineExamStatus = () => {
  // 首先检查本地存储的提交状态
  const submittedKey = `exam_${examId.value}_submitted`
  const isSubmitted = localStorage.getItem(submittedKey) === 'true'

  if (isSubmitted) {
    console.log('检测到本地提交标记，考试已提交')
    examStatus.value = 'SUBMITTED'
    return
  }

  // 优先使用后端返回的状态
  if (examInfo.value.status) {
    console.log('使用后端返回的考试状态:', examInfo.value.status)

    // 将后端状态映射到前端状态
    const statusMap = {
      '未开始': 'NOT_STARTED',
      '进行中': 'ONGOING',
      '已结束': 'ENDED',
      '已提交': 'SUBMITTED'
    }

    const mappedStatus = statusMap[examInfo.value.status] || 'ONGOING'
    examStatus.value = mappedStatus
    console.log('映射后的考试状态:', examStatus.value)
    return
  }

  // 如果后端没有返回状态，则使用时间判断
  // 检查考试信息是否完整
  if (!examInfo.value.startTime || !examInfo.value.endTime) {
    console.warn('考试时间信息不完整:', examInfo.value)
    examStatus.value = 'ONGOING' // 默认为进行中
    return
  }

  const now = new Date()

  // 处理时间字符串，确保正确解析
  let startTime, endTime
  try {
    // 如果时间字符串包含 'T'，说明是 ISO 格式
    if (examInfo.value.startTime.includes('T')) {
      startTime = new Date(examInfo.value.startTime)
      endTime = new Date(examInfo.value.endTime)
    } else {
      // 如果是其他格式，尝试直接解析
      startTime = new Date(examInfo.value.startTime.replace(' ', 'T'))
      endTime = new Date(examInfo.value.endTime.replace(' ', 'T'))
    }
  } catch (error) {
    console.error('时间解析失败:', error)
    examStatus.value = 'ONGOING'
    return
  }

  console.log('=== 考试时间调试信息 ===')
  console.log('原始考试信息:', examInfo.value)
  console.log('当前时间:', now.toLocaleString(), '时间戳:', now.getTime())
  console.log('开始时间原始:', examInfo.value.startTime)
  console.log('开始时间解析后:', startTime.toLocaleString(), '时间戳:', startTime.getTime())
  console.log('结束时间原始:', examInfo.value.endTime)
  console.log('结束时间解析后:', endTime.toLocaleString(), '时间戳:', endTime.getTime())
  console.log('时间比较结果:')
  console.log('  now < startTime:', now < startTime, '(考试未开始)')
  console.log('  now > endTime:', now > endTime, '(考试已结束)')
  console.log('  在考试时间内:', now >= startTime && now <= endTime)
  console.log('学生答案数量:', studentAnswers.value.length)

  if (isNaN(startTime.getTime()) || isNaN(endTime.getTime())) {
    console.error('时间解析结果无效')
    examStatus.value = 'ONGOING'
    return
  }

  if (now < startTime) {
    examStatus.value = 'NOT_STARTED'
  } else if (now > endTime) {
    // 检查是否有提交记录
    if (studentAnswers.value.length > 0) {
      examStatus.value = 'SUBMITTED'
    } else {
      examStatus.value = 'ENDED'
    }
  } else {
    // 检查是否所有题目都已提交
    const allAnswered = questions.value.every(q => answeredQuestions.value[q.questionId])
    if (allAnswered) {
      examStatus.value = 'SUBMITTED'
    } else {
      examStatus.value = 'ONGOING'
    }
  }

  console.log('最终考试状态:', examStatus.value)
}

const startTimer = () => {
  // 使用考试时长而不是结束时间
  if (!examInfo.value.durationMinutes) {
    console.warn('考试时长不存在，无法启动计时器')
    return
  }

  // 检查是否有保存的剩余时间
  const savedTimeKey = `exam_${examId.value}_remaining_time`
  const savedStartTimeKey = `exam_${examId.value}_start_time`

  let savedRemainingTime = localStorage.getItem(savedTimeKey)
  let savedStartTime = localStorage.getItem(savedStartTimeKey)

  if (savedRemainingTime && savedStartTime) {
    // 计算从保存时间到现在过去了多少秒
    const now = Date.now()
    const timePassed = Math.floor((now - parseInt(savedStartTime)) / 1000)
    const calculatedRemainingTime = parseInt(savedRemainingTime) - timePassed

    if (calculatedRemainingTime > 0) {
      remainingTime.value = calculatedRemainingTime
      console.log('恢复考试计时器，剩余时间:', calculatedRemainingTime, '秒')
    } else {
      // 时间已到，直接设置为0
      remainingTime.value = 0
    }
  } else {
    // 首次开始考试，使用完整时长
    const totalSeconds = examInfo.value.durationMinutes * 60
    remainingTime.value = totalSeconds

    // 保存开始时间
    localStorage.setItem(savedStartTimeKey, Date.now().toString())

    console.log('首次启动计时器，总时长:', examInfo.value.durationMinutes, '分钟 =', totalSeconds, '秒')
  }

  const updateTimer = () => {
    remainingTime.value = Math.max(0, remainingTime.value - 1)

    // 每10秒保存一次剩余时间
    if (remainingTime.value % 10 === 0) {
      localStorage.setItem(savedTimeKey, remainingTime.value.toString())
      localStorage.setItem(savedStartTimeKey, Date.now().toString())
    }

    // 如果时间到了，自动提交考卷
    if (remainingTime.value <= 0) {
      clearInterval(timerInterval.value)
      // 清除保存的时间
      localStorage.removeItem(savedTimeKey)
      localStorage.removeItem(savedStartTimeKey)

      examStatus.value = 'ENDED'
      ElMessage.warning('考试时间已结束，系统将自动提交您的答卷')

      // 自动提交考卷
      submitExam().then(() => {
        // 自动提交成功后也跳转回首页
        setTimeout(() => {
          router.push('/student')
        }, 3000) // 给用户更多时间看到提示
      }).catch(error => {
        console.error('自动提交失败:', error)
      })
    }
  }

  // 立即更新一次
  updateTimer()

  // 设置定时器，每秒更新一次
  timerInterval.value = setInterval(updateTimer, 1000)
}

const calculateResults = (answers) => {
  let total = 0
  let correct = 0

  answers.forEach(answer => {
    if (answer.score !== undefined && answer.score !== null) {
      total += parseFloat(answer.score)

      // 如果得分等于题目满分，则认为是正确的
      if (answer.score === answer.scorePoints) {
        correct++
      }
    }
  })

  totalScore.value = total
  correctCount.value = correct
}

// // 新增的方法
// const getExamStatusText = (status) => {
//   const statusMap = {
//     'NOT_STARTED': '未开始',
//     'ONGOING': '进行中',
//     'ENDED': '已结束',
//     'SUBMITTED': '已提交'
//   }
//   return statusMap[status] || '未知状态'
// }

// 成绩相关函数已移除

const getCurrentQuestionAnswer = (question) => {
  if (!question) return null
  return studentAnswers.value.find(answer =>
    answer.questionId === question.questionId
  )
}

const getAnswerClass = (question) => {
  const answer = getCurrentQuestionAnswer(question)
  if (!answer) return ''

  const isCorrect = answer.score === question.scorePoints
  return isCorrect ? 'correct-answer' : 'wrong-answer'
}

const getAnswerTagType = (question) => {
  const answer = getCurrentQuestionAnswer(question)
  if (!answer) return 'info'

  const isCorrect = answer.score === question.scorePoints
  return isCorrect ? 'success' : 'danger'
}

const getAnswerStatusText = (question) => {
  const answer = getCurrentQuestionAnswer(question)
  if (!answer) return '未作答'

  const isCorrect = answer.score === question.scorePoints
  return isCorrect ? '正确' : '错误'
}

// 刷新成绩功能已移除

// 智能分析和学习建议功能已移除

const fetchExamDetail = async () => {
  loading.value = true

  try {
    console.log('开始获取考试详情，examId:', examId.value, 'studentId:', studentId)

    if (!studentId) {
      ElMessage.error('用户信息获取失败，请重新登录')
      router.push('/login')
      return
    }

    const sid = String(studentId)
    const eid = String(examId.value)

    // 获取考试信息
    console.log('获取考试信息...')
    try {
      const examInfoResponse = await examAPI.getExamById(eid)
      console.log('考试信息:', examInfoResponse)
      examInfo.value = examInfoResponse || {}
    } catch (error) {
      console.warn('通过examAPI获取考试信息失败，尝试studentExamAPI:', error)
      try {
        const examInfoResponse = await studentExamAPI.getExamDetail(sid, eid)
        console.log('学生考试信息:', examInfoResponse)
        examInfo.value = examInfoResponse || {}
      } catch (studentError) {
        console.error('获取考试信息失败:', studentError)
        ElMessage.error('获取考试信息失败')
        examInfo.value = {}
      }
    }

    // 获取考试题目
    console.log('获取考试题目...')
    let questionsData = []
    try {
      const questionsResponse = await studentExamAPI.getExamQuestions(eid)
      console.log('题目信息:', questionsResponse)

      if (Array.isArray(questionsResponse)) {
        questionsData = questionsResponse.map(question => {
          console.log('题目分数信息:', {
            questionId: question.questionId,
            scorePoints: question.scorePoints,
            scorePointsType: typeof question.scorePoints
          })
          return {
            questionId: question.questionId,
            content: question.content,
            questionType: question.questionType,
            options: question.options || [], // 保留原始options字段，但主要从content解析
            scorePoints: question.scorePoints,
            referenceAnswer: question.referenceAnswer,
            difficulty: question.difficulty,
            knowledgeId: question.knowledgeId
          }
        })
      }
    } catch (error) {
      console.warn('获取题目失败，尝试使用教师API:', error)
      // 如果学生API失败，尝试使用教师API
      try {
        const questionsResponse = await questionAPI.getQuestionsByExamId(eid)
        console.log('通过教师API获取题目信息:', questionsResponse)

        if (Array.isArray(questionsResponse)) {
          questionsData = questionsResponse.map(question => ({
            questionId: question.questionId,
            content: question.content,
            questionType: question.questionType,
            options: question.options || [], // 保留原始options字段，但主要从content解析
            scorePoints: question.scorePoints,
            referenceAnswer: question.referenceAnswer,
            difficulty: question.difficulty,
            knowledgeId: question.knowledgeId
          }))
        }
      } catch (teacherError) {
        console.warn('教师API也失败，尝试从答案中提取:', teacherError)
        // 如果都失败，尝试从学生答案中提取题目信息
        try {
          const answersResponse = await studentExamAPI.getStudentExamAnswers(sid, eid)
          if (Array.isArray(answersResponse) && answersResponse.length > 0) {
            questionsData = answersResponse.map(answer => ({
              questionId: answer.questionId,
              content: answer.questionContent,
              questionType: answer.questionType,
              options: answer.options || [], // 保留原始options字段，但主要从content解析
              scorePoints: answer.scorePoints,
              referenceAnswer: answer.referenceAnswer
            }))
          }
        } catch (answerError) {
          console.error('从答案中提取题目也失败:', answerError)
        }
      }
    }

    questions.value = questionsData
    console.log('处理后的题目:', questionsData)

    // 详细显示每道题的分数信息
    console.log('=== 题目分数详情 ===')
    questionsData.forEach((q, index) => {
      console.log(`题目${index + 1}:`, {
        questionId: q.questionId,
        questionType: q.questionType,
        scorePoints: q.scorePoints,
        scorePointsType: typeof q.scorePoints,
        content: q.content?.substring(0, 50) + '...'
      })
    })

    // 计算总分
    const totalPossibleScore = questionsData.reduce((sum, q) => sum + Number(q.scorePoints || 0), 0)
    console.log('考试总分:', totalPossibleScore)
    console.log('平均每题分数:', questionsData.length > 0 ? (totalPossibleScore / questionsData.length).toFixed(1) : 0)

    // 如果没有题目，显示提示信息
    if (questionsData.length === 0) {
      console.warn('未获取到任何题目')
      ElMessage.warning('该考试暂无题目，请联系教师')
    }

    // 获取学生答案
    console.log('获取学生答案...')
    try {
      const answersResponse = await studentExamAPI.getStudentExamAnswers(sid, eid)
      console.log('学生答案信息:', answersResponse)

      // 保存学生答案详情
      studentAnswers.value = Array.isArray(answersResponse) ? answersResponse : []

      // 初始化用户答案和已答题状态
      if (Array.isArray(answersResponse) && answersResponse.length > 0) {
        initUserAnswers(answersResponse)
      } else {
        // 如果没有答案记录，初始化空的用户答案
        initEmptyUserAnswers()
      }
    } catch (error) {
      console.warn('获取学生答案失败:', error)
      studentAnswers.value = []
      // 初始化空的用户答案
      initEmptyUserAnswers()
    }

    // 设置考试状态
    determineExamStatus()

    // 如果考试正在进行中，启动计时器
    if (examStatus.value === 'ONGOING') {
      startTimer()
    }

    // 如果考试已结束，计算总分和正确题数
    if (examStatus.value === 'ENDED' || examStatus.value === 'SUBMITTED') {
      if (studentAnswers.value.length > 0) {
        calculateResults(studentAnswers.value)
      }
      showReferenceAnswer.value = true

      // 考试成绩加载功能已移除
    }
  } catch (error) {
    console.error('获取考试详情失败:', error)
    ElMessage.error('获取考试详情失败，请稍后再试')
  } finally {
    loading.value = false
  }
}

const submitAnswer = async (question) => {
  const questionId = question.questionId
  const answer = userAnswers.value[questionId]

  if (!isAnswerValid(question)) {
    ElMessage.warning('请完成答题后再提交')
    return
  }

  try {
    // 使用 student-exam/submit 接口提交答案（请求体格式）
    const formattedAnswer = (question.questionType === 'MULTIPLE_CHOICE' || question.questionType === 'MULTI_CHOICE') ? answer.join(',') : answer

    // 获取当前时间作为提交时间
    const submitTime = new Date().toISOString()

    // 计算客观题成绩
    let score = null
    if (question.questionType === 'SINGLE_CHOICE' || question.questionType === 'MULTIPLE_CHOICE') {
      // 客观题自动评分
      const correctAnswer = question.referenceAnswer || question.correctAnswer
      if (correctAnswer && formattedAnswer) {
        // 单选题比较
        if (question.questionType === 'SINGLE_CHOICE') {
          const isCorrect = formattedAnswer.trim() === correctAnswer.trim()
          score = isCorrect ? Number(question.scorePoints || 0) : 0
          console.log('单选题评分:', {
            questionId: questionId,
            userAnswer: formattedAnswer.trim(),
            correctAnswer: correctAnswer.trim(),
            isCorrect: isCorrect,
            scorePoints: question.scorePoints,
            finalScore: score
          })
        }
        // 多选题比较（需要排序后比较）
        else if (question.questionType === 'MULTIPLE_CHOICE') {
          const userAnswerSorted = formattedAnswer.split(',').map(a => a.trim()).sort().join(',')
          const correctAnswerSorted = correctAnswer.split(',').map(a => a.trim()).sort().join(',')
          const isCorrect = userAnswerSorted === correctAnswerSorted
          score = isCorrect ? Number(question.scorePoints || 0) : 0
          console.log('多选题评分:', {
            questionId: questionId,
            userAnswer: userAnswerSorted,
            correctAnswer: correctAnswerSorted,
            isCorrect: isCorrect,
            scorePoints: question.scorePoints,
            finalScore: score
          })
        }
      }
    }

    const answerData = {
      examId: String(examId.value),
      questionId: String(questionId),
      studentId: String(studentId),
      studentAnswer: formattedAnswer,
      score: score, // 客观题自动评分，主观题为null等待教师批改
      examTitle: examInfo.value.title,
      questionContent: question.content,
      questionType: question.questionType,
      createdAt: submitTime,
      updatedAt: submitTime,
      graded: score !== null // 客观题标记为已批改，主观题为未批改
    }

    console.log('提交单个答案数据:', answerData)
    await studentExamAPI.submitAnswer(answerData)

    // 标记为已答题
    answeredQuestions.value[questionId] = { answered: true }

    // 显示提交成功提示
    ElMessage.success('答案已提交')

    // 自动前进到下一题
    nextQuestion(question)
  } catch (error) {
    console.error('提交答案失败:', error)
    ElMessage.error('提交答案失败，请稍后再试')
  }
}

const submitExam = async () => {
  if (submitting.value) return

  // 确认提交
  try {
    await ElMessageBox.confirm('确认提交整份考卷吗？提交后将无法修改答案', '提交确认', {
      confirmButtonText: '确认提交',
      cancelButtonText: '继续答题',
      type: 'warning'
    })
  } catch (e) {
    return // 用户取消提交
  }

  submitting.value = true

  try {
    // 获取当前时间作为提交时间
    const submitTime = new Date().toISOString()

    // 准备批量提交的答案
    const answerList = questions.value.map(question => {
      const questionId = question.questionId
      const answer = userAnswers.value[questionId]

      // 格式化答案
      let formattedAnswer = ''
      if (question.questionType === 'MULTIPLE_CHOICE' && Array.isArray(answer)) {
        formattedAnswer = answer.join(',')
      } else {
        formattedAnswer = answer || ''
      }

      // 计算客观题成绩
      let score = null
      if (question.questionType === 'SINGLE_CHOICE' || question.questionType === 'MULTIPLE_CHOICE') {
        // 客观题自动评分
        const correctAnswer = question.referenceAnswer || question.correctAnswer
        if (correctAnswer && formattedAnswer) {
          // 单选题比较
          if (question.questionType === 'SINGLE_CHOICE') {
            const isCorrect = formattedAnswer.trim() === correctAnswer.trim()
            score = isCorrect ? Number(question.scorePoints || 0) : 0
            console.log('批量提交-单选题评分:', {
              questionId: questionId,
              userAnswer: formattedAnswer.trim(),
              correctAnswer: correctAnswer.trim(),
              isCorrect: isCorrect,
              scorePoints: question.scorePoints,
              finalScore: score
            })
          }
          // 多选题比较（需要排序后比较）
          else if (question.questionType === 'MULTIPLE_CHOICE') {
            const userAnswerSorted = formattedAnswer.split(',').map(a => a.trim()).sort().join(',')
            const correctAnswerSorted = correctAnswer.split(',').map(a => a.trim()).sort().join(',')
            const isCorrect = userAnswerSorted === correctAnswerSorted
            score = isCorrect ? Number(question.scorePoints || 0) : 0
            console.log('批量提交-多选题评分:', {
              questionId: questionId,
              userAnswer: userAnswerSorted,
              correctAnswer: correctAnswerSorted,
              isCorrect: isCorrect,
              scorePoints: question.scorePoints,
              finalScore: score
            })
          }
        }
      }

      return {
        examId: String(examId.value),
        questionId: String(questionId),
        studentId: String(studentId),
        studentAnswer: formattedAnswer,
        score: score, // 客观题自动评分，主观题为null等待教师批改
        examTitle: examInfo.value.title,
        questionContent: question.content,
        questionType: question.questionType,
        createdAt: submitTime,
        updatedAt: submitTime,
        graded: score !== null // 客观题标记为已批改，主观题为未批改
      }
    })

    console.log('准备提交的答案数据:', answerList)

    // 使用批量提交接口
    await studentExamAPI.batchSubmitAnswers(answerList)

    // 计算总成绩
    const totalCalculatedScore = answerList.reduce((sum, answer) => {
      return sum + (answer.score || 0)
    }, 0)

    console.log('考试提交完成，总成绩:', totalCalculatedScore)
    console.log('提交时间:', submitTime)

    // 更新考试状态
    examStatus.value = 'SUBMITTED'

    // 保存提交状态标记
    const submittedKey = `exam_${examId.value}_submitted`
    localStorage.setItem(submittedKey, 'true')

    // 清除保存的计时器数据
    const savedTimeKey = `exam_${examId.value}_remaining_time`
    const savedStartTimeKey = `exam_${examId.value}_start_time`
    localStorage.removeItem(savedTimeKey)
    localStorage.removeItem(savedStartTimeKey)

    // 重新获取考试结果
    await fetchExamDetail()

    // 显示提交成功提示
    ElMessage.success('考卷已成功提交')

    // 显示跳转提示并跳转
    ElMessageBox.confirm(
      '考卷已成功提交！是否返回学生端首页？',
      '提交成功',
      {
        confirmButtonText: '返回首页',
        cancelButtonText: '留在此页',
        type: 'success',
        showClose: false
      }
    ).then(() => {
      router.push('/student')
    }).catch(() => {
      // 用户选择留在当前页面
      console.log('用户选择留在当前页面')
    })
  } catch (error) {
    console.error('提交考卷失败:', error)
    ElMessage.error('提交考卷失败，请稍后再试')
  } finally {
    submitting.value = false
  }
}

const nextQuestion = (question) => {
  if (question.questionId === questions.value[questions.value.length - 1].questionId) {
    // 如果是最后一题，则提交考卷
    submitExam()
  } else {
    // 找到当前题目的下一个题目
    const questionIndex = questions.value.findIndex(q => q.questionId === question.questionId)
    if (questionIndex < questions.value.length - 1) {
      // 滚动到下一题
      scrollToQuestion(questionIndex + 1)
    }
  }
}

const prevQuestion = (question) => {
  if (question.questionId === questions.value[0].questionId) {
    // 如果是第一题，则不跳转
    return
  }
  const questionIndex = questions.value.findIndex(q => q.questionId === question.questionId)
  if (questionIndex > 0) {
    // 滚动到上一题
    scrollToQuestion(questionIndex - 1)
  }
}

// 滚动到指定题目
const scrollToQuestion = (questionIndex) => {
  nextTick(() => {
    const questionElements = document.querySelectorAll('.question-box')
    if (questionElements[questionIndex]) {
      questionElements[questionIndex].scrollIntoView({
        behavior: 'smooth',
        block: 'start'
      })
    }
  })
}

const getQuestionTypeText = (type) => {
  const typeMap = {
    'SINGLE_CHOICE': '单选题',
    'MULTI_CHOICE': '多选题',
    'MULTIPLE_CHOICE': '多选题',
    'TRUE_FALSE': '判断题',
    'FILL_BLANK': '填空题',
    'ESSAY_QUESTION': '简答题',
    'SUBJECTIVE': '主观题'
  }
  return typeMap[type] || type
}

const getQuestionOptions = (question) => {
  // 如果有options字段，直接使用
  if (Array.isArray(question.options) && question.options.length > 0) {
    return question.options
  }

  // 从题目内容中解析选项
  if (!question.content) return []

  const content = question.content
  const options = []

  // 按换行符分割内容
  const lines = content.split('\n').map(line => line.trim()).filter(line => line)

  // 查找选项行（以 A. B. C. D. 等开头的行）
  for (const line of lines) {
    const optionMatch = line.match(/^([A-H])\.\s*(.+)$/)
    if (optionMatch && optionMatch[2].trim()) {
      options.push(optionMatch[2].trim())
    }
  }

  return options
}

// 获取题目主体内容（不包含选项）
const getQuestionMainContent = (question) => {
  if (!question.content) return ''

  const content = question.content

  // 对于选择题和判断题，需要分离题目主体和选项
  if (question.questionType === 'SINGLE_CHOICE' ||
      question.questionType === 'MULTIPLE_CHOICE' ||
      question.questionType === 'TRUE_FALSE') {

    // 按换行符分割内容
    const lines = content.split('\n').map(line => line.trim()).filter(line => line)

    // 找到第一个选项行的索引
    let firstOptionIndex = -1
    for (let i = 0; i < lines.length; i++) {
      if (/^[A-H]\.\s*/.test(lines[i])) {
        firstOptionIndex = i
        break
      }
    }

    // 如果找到了选项，返回选项之前的所有行作为题目主体
    if (firstOptionIndex > 0) {
      return lines.slice(0, firstOptionIndex).join('\n').trim()
    } else if (firstOptionIndex === 0) {
      // 如果第一行就是选项，说明没有题目主体，返回题型名称
      return question.questionType === 'SINGLE_CHOICE' ? '单选题' :
             question.questionType === 'MULTIPLE_CHOICE' ? '多选题' :
             question.questionType === 'TRUE_FALSE' ? '判断题' : '题目'
    }
  }

  // 对于其他题型，返回完整内容
  return content
}

const isAnswerValid = (question) => {
  const answer = userAnswers.value[question.questionId]

  if (question.questionType === 'MULTIPLE_CHOICE' || question.questionType === 'MULTI_CHOICE') {
    return Array.isArray(answer) && answer.length > 0
  } else if (question.questionType === 'SINGLE_CHOICE' || question.questionType === 'TRUE_FALSE') {
    return answer && answer.trim() !== ''
  } else if (question.questionType === 'FILL_BLANK' || question.questionType === 'SUBJECTIVE' || question.questionType === 'ESSAY_QUESTION') {
    return answer && answer.trim() !== ''
  }

  return false
}

const getDisplayAnswer = (question) => {
  const answer = userAnswers.value[question.questionId]
  if (!answer) return '未作答'

  if (question.questionType === 'MULTIPLE_CHOICE' && Array.isArray(answer)) {
    return answer.join(', ')
  } else if (question.questionType === 'TRUE_FALSE') {
    // 对于判断题，如果答案是A或B，显示对应的选项内容
    const options = getQuestionOptions(question)
    if (answer === 'A' && options.length > 0) {
      return `A. ${options[0]}`
    } else if (answer === 'B' && options.length > 1) {
      return `B. ${options[1]}`
    }
    // 兼容旧格式
    return answer === 'true' ? '正确' : answer === 'false' ? '错误' : answer
  }
  return answer
}

const formatDateTime = (dateString) => {
  if (!dateString) return ''

  const date = new Date(dateString)
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')} ${String(date.getHours()).padStart(2, '0')}:${String(date.getMinutes()).padStart(2, '0')}`
}

// 百分比格式化函数已移除

// 监听路由参数变化 - 必须在函数定义之后
watch(() => route.params.examId, (newExamId) => {
  if (newExamId) {
    examId.value = newExamId
    fetchExamDetail()
  }
}, { immediate: true })

// 组件挂载
onMounted(() => {
  examId.value = route.params.examId
  if (examId.value) {
    fetchExamDetail()
  }
})

// 组件卸载
onUnmounted(() => {
  if (timerInterval.value) {
    clearInterval(timerInterval.value)
  }

  // 保存当前剩余时间（如果考试还在进行中）
  if (examStatus.value === 'ONGOING' && remainingTime.value > 0) {
    const savedTimeKey = `exam_${examId.value}_remaining_time`
    const savedStartTimeKey = `exam_${examId.value}_start_time`
    localStorage.setItem(savedTimeKey, remainingTime.value.toString())
    localStorage.setItem(savedStartTimeKey, Date.now().toString())
  }
})
</script>

<style scoped>
.exam-detail-container {
  padding: 20px;
  background-color: #f6f8fa;
  min-height: 100vh;
}

.loading-container,
.empty-container {
  display: flex;
  justify-content: center;
  align-items: center;
  min-height: 300px;
}

.exam-info-card,
.timer-card,
.questions-card {
  margin-bottom: 20px;
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.analysis-content,
.advice-content {
  max-height: 300px;
  overflow-y: auto;
}

.analysis-item {
  margin-bottom: 20px;
}

.analysis-item h4 {
  margin: 0 0 10px 0;
  color: #303133;
  font-size: 16px;
}

.analysis-item ul {
  margin: 0;
  padding-left: 20px;
}

.analysis-item li {
  margin-bottom: 5px;
  color: #606266;
}

.advice-item {
  display: flex;
  align-items: flex-start;
  margin-bottom: 15px;
  padding: 10px;
  background-color: #f8f9fa;
  border-radius: 6px;
}

.advice-number {
  width: 24px;
  height: 24px;
  background-color: #409eff;
  color: white;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 12px;
  font-weight: 600;
  margin-right: 12px;
  flex-shrink: 0;
}

.advice-text {
  flex: 1;
  color: #303133;
  line-height: 1.5;
}

.loading-content,
.empty-content {
  padding: 20px;
  text-align: center;
}

.exam-header {
  padding-bottom: 15px;
}

.exam-header h2 {
  margin: 0 0 15px 0;
  color: #303133;
}

.exam-meta {
  display: flex;
  flex-wrap: wrap;
  gap: 20px;
  margin-bottom: 15px;
  color: #606266;
}

.exam-description {
  color: #606266;
  line-height: 1.6;
}

.timer-container {
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.timer-label {
  font-size: 16px;
  color: #606266;
}

.timer-value {
  font-size: 20px;
  font-weight: bold;
  color: #409EFF;
}

.questions-nav {
  margin-bottom: 20px;
  padding-bottom: 15px;
  border-bottom: 1px solid #ebeef5;
  display: flex;
  flex-wrap: wrap;
  gap: 5px;
}

.current-question {
  margin-bottom: 30px;
}

.question-header {
  margin-bottom: 15px;
  font-size: 16px;
}

.question-number {
  font-weight: bold;
  margin-right: 5px;
}

.question-type {
  color: #409EFF;
  margin-right: 5px;
}

.question-score {
  color: #F56C6C;
}

.question-content {
  margin-bottom: 20px;
}

.question-content h4 {
  margin: 0 0 8px 0;
  color: #606266;
  font-size: 14px;
  font-weight: 600;
}

.question-text {
  margin: 0;
  padding: 12px;
  background: white;
  border: 1px solid #e4e7ed;
  border-radius: 4px;
  font-size: 16px;
  line-height: 1.6;
  color: #303133;
}

.question-options {
  margin-top: 15px;
  margin-bottom: 20px;
}

/* 简答题和填空题的文本输入框样式 */
.question-options .el-textarea {
  width: 100%;
}

.question-options .el-textarea__inner {
  border: 2px solid #e4e7ed;
  border-radius: 8px;
  padding: 12px 16px;
  font-size: 14px;
  line-height: 1.5;
  transition: all 0.3s ease;
  resize: vertical;
  min-height: 100px;
}

.question-options .el-textarea__inner:focus {
  border-color: #409EFF;
  box-shadow: 0 0 0 2px rgba(64, 158, 255, 0.1);
}

.question-options .el-textarea__inner::placeholder {
  color: #c0c4cc;
  font-style: italic;
}

/* 调试信息样式 */
.question-options .debug-info {
  color: #f56c6c;
  background-color: #fef0f0;
  border: 1px solid #fbc4c4;
  border-radius: 4px;
  padding: 8px 12px;
  margin-bottom: 10px;
  font-size: 12px;
  font-weight: 500;
}

.option-group {
  width: 100%;
}

.option-item {
  margin-bottom: 12px;
  border: 2px solid #e4e7ed;
  border-radius: 8px;
  transition: all 0.3s ease;
  background-color: #fff;
  overflow: hidden;
}

.option-item:hover {
  border-color: #409EFF;
  background-color: #f0f9ff;
  transform: translateY(-1px);
  box-shadow: 0 2px 8px rgba(64, 158, 255, 0.1);
}

.option-radio,
.option-checkbox {
  width: 100%;
  margin: 0;
  padding: 0;
}

.option-radio .el-radio__input,
.option-checkbox .el-checkbox__input {
  margin-right: 12px;
}

.option-wrapper {
  display: flex;
  align-items: center;
  padding: 16px 20px;
  width: 100%;
  min-height: 50px;
}

.option-label {
  font-weight: 600;
  font-size: 16px;
  color: #409EFF;
  margin-right: 12px;
  min-width: 24px;
}

.option-content {
  color: #303133;
  font-size: 15px;
  line-height: 1.5;
  flex: 1;
}

/* 选中状态样式 */
.option-item:has(.el-radio__input.is-checked),
.option-item:has(.el-checkbox__input.is-checked) {
  border-color: #409EFF;
  background-color: #f0f9ff;
  box-shadow: 0 2px 8px rgba(64, 158, 255, 0.15);
}

.option-item:has(.el-radio__input.is-checked) .option-label,
.option-item:has(.el-checkbox__input.is-checked) .option-label {
  color: #409EFF;
  font-weight: 700;
}

.option-item:has(.el-radio__input.is-checked) .option-content,
.option-item:has(.el-checkbox__input.is-checked) .option-content {
  color: #409EFF;
  font-weight: 500;
}

.answer-actions {
  display: flex;
  gap: 10px;
  margin-top: 20px;
}

.result-area {
  margin-top: 20px;
  padding: 15px;
  background-color: #f8f8f8;
  border-radius: 4px;
}

.answer-section {
  display: flex;
  flex-direction: column;
  gap: 15px;
}

.my-answer,
.correct-answer {
  padding: 15px;
  border-radius: 6px;
  border: 1px solid #e4e7ed;
  margin-bottom: 16px;
}

.my-answer h4,
.correct-answer h4 {
  margin: 0 0 8px 0;
  color: #606266;
  font-size: 14px;
  font-weight: 600;
}

.my-answer {
  background-color: #fff;
  position: relative;
}

.my-answer.correct-answer {
  border-color: #67c23a;
  background-color: #f0f9ff;
}

.my-answer.wrong-answer {
  border-color: #f56c6c;
  background-color: #fef0f0;
}

.correct-answer {
  background-color: #f0f9ff;
  border-color: #409eff;
}

.answer-status {
  position: absolute;
  top: 10px;
  right: 10px;
}

.score-info {
  background-color: #fff;
  padding: 15px;
  border-radius: 6px;
  border: 1px solid #e4e7ed;
}

.score-info .score-item {
  display: flex;
  align-items: center;
  margin-bottom: 10px;
}

.score-info .label {
  font-weight: 500;
  color: #606266;
  margin-right: 8px;
}

.score-value.excellent {
  color: #67c23a;
  font-weight: 600;
}

.score-value.good {
  color: #409eff;
  font-weight: 600;
}

.score-value.average {
  color: #e6a23c;
  font-weight: 600;
}

.score-value.poor {
  color: #f56c6c;
  font-weight: 600;
}

.feedback-item {
  margin-top: 15px;
  padding-top: 15px;
  border-top: 1px solid #e4e7ed;
}

.feedback-content {
  margin-top: 8px;
  padding: 10px;
  background-color: #f8f9fa;
  border-radius: 4px;
  color: #303133;
  line-height: 1.5;
}

.grading-info {
  margin-top: 10px;
  font-size: 12px;
  color: #909399;
}

.grading-details {
  font-style: italic;
}

.exam-pending {
  padding: 40px;
  text-align: center;
  background-color: #f8f9fa;
  border-radius: 8px;
  margin: 20px 0;
}

.my-answer,
.correct-answer,
.score-info {
  margin-bottom: 10px;
}

.answer-label {
  font-weight: bold;
  margin-bottom: 5px;
  color: #606266;
}

.my-answer .answer-content {
  color: #409EFF;
}

.correct-answer .answer-content {
  color: #67C23A;
}

.score-info .answer-content {
  color: #F56C6C;
  font-weight: bold;
}

.submit-exam-container {
  margin: 20px 0;
  text-align: center;
}

.result-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
}

.result-header h3 {
  margin: 0;
}

.result-score {
  font-size: 16px;
}

.score-value {
  font-size: 20px;
  font-weight: bold;
  color: #F56C6C;
}

.result-stats {
  margin-top: 20px;
}

.stats-items {
  display: flex;
  justify-content: space-around;
  margin-top: 20px;
}

/* 考试已提交的友好提示样式 */
.submitted-message {
  padding: 40px 20px;
  text-align: center;
}

.submitted-message .el-result {
  padding: 20px;
}

.submitted-message .el-result__title {
  color: #67C23A;
  font-size: 24px;
  font-weight: bold;
}

.submitted-message .el-result__subtitle {
  color: #606266;
  font-size: 16px;
  line-height: 1.6;
  margin-top: 10px;
}

/* 系统提示样式已移除 */

.stats-item {
  text-align: center;
}

.stats-label {
  color: #606266;
  margin-bottom: 5px;
}

.stats-value {
  font-size: 18px;
  font-weight: bold;
  color: #409EFF;
}
</style>