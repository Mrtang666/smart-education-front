<!-- 修改接口，对接后端要正确的接口，比如获得考试题目之类的 -->

<template>
  <div class="exam-detail-container">
    <div v-if="loading" class="loading-container">
      <el-skeleton :rows="10" animated />
    </div>
    
    <div v-else>
      <!-- 考试信息头部 -->
      <el-card class="exam-info-card">
        <div class="exam-header">
          <h2>{{ examInfo.title }}</h2>
          <div class="exam-meta">
            <span><i class="el-icon-date"></i> 开始时间: {{ formatDateTime(examInfo.startTime) }}</span>
            <span><i class="el-icon-time"></i> 结束时间: {{ formatDateTime(examInfo.endTime) }}</span>
            <span><i class="el-icon-timer"></i> 时长: {{ examInfo.durationMinutes }} 分钟</span>
            <span><i class="el-icon-notebook-2"></i> 总分: {{ examInfo.totalScore }} 分</span>
          </div>
          <div class="exam-description">
            {{ examInfo.description }}
          </div>
        </div>
      </el-card>
      
      <!-- 考试计时器 -->
      <el-card class="timer-card" v-if="examStatus === 'ONGOING'">
        <div class="timer-container">
          <div class="timer-label">剩余时间</div>
          <div class="timer-value">{{ formatTimeRemaining }}</div>
        </div>
      </el-card>
      
      <!-- 题目列表 -->
      <el-card class="questions-card">
        <div v-if="questions.length === 0" class="empty-container">
          <el-empty description="暂无题目" />
        </div>
        
        <div v-else class="questions-container">
          <!-- 题目导航 -->
          <div class="questions-nav">
            <el-button-group>
              <el-button 
                v-for="(q, index) in questions" 
                :key="q.questionId"
                size="mini"
                :type="currentQuestionIndex === index ? 'primary' : 
                       answeredQuestions[q.questionId] ? 'success' : 'default'"
                @click="currentQuestionIndex = index"
              >{{ index + 1 }}</el-button>
            </el-button-group>
          </div>
          
          <!-- 当前题目 -->
          <div class="current-question" v-if="currentQuestion">
            <div class="question-header">
              <span class="question-number">{{ currentQuestionIndex + 1 }}.</span>
              <span class="question-type">
                {{ getQuestionTypeText(currentQuestion.questionType) }}
              </span>
              <span class="question-score">({{ currentQuestion.scorePoints || 0 }}分)</span>
            </div>
            
            <div class="question-content">
              {{ currentQuestion.content }}
            </div>
            
            <!-- 答题区域 -->
            <div class="answer-area" v-if="examStatus === 'ONGOING'">
              <!-- 单选题 -->
              <div v-if="currentQuestion.questionType === 'SINGLE_CHOICE'" class="question-options">
                <el-radio-group v-model="userAnswers[currentQuestion.questionId]">
                  <div v-for="(option, optIndex) in getQuestionOptions(currentQuestion)" :key="optIndex" class="option-item">
                    <el-radio :label="String.fromCharCode(65 + optIndex)">
                      <span class="option-label">{{ String.fromCharCode(65 + optIndex) }}.</span>
                      <span class="option-content">{{ option }}</span>
                    </el-radio>
                  </div>
                </el-radio-group>
              </div>
              
              <!-- 多选题 -->
              <div v-else-if="currentQuestion.questionType === 'MULTIPLE_CHOICE'" class="question-options">
                <el-checkbox-group v-model="userAnswers[currentQuestion.questionId]">
                  <div v-for="(option, optIndex) in getQuestionOptions(currentQuestion)" :key="optIndex" class="option-item">
                    <el-checkbox :label="String.fromCharCode(65 + optIndex)">
                      <span class="option-label">{{ String.fromCharCode(65 + optIndex) }}.</span>
                      <span class="option-content">{{ option }}</span>
                    </el-checkbox>
                  </div>
                </el-checkbox-group>
              </div>
              
              <!-- 填空题 -->
              <div v-else-if="currentQuestion.questionType === 'FILL_BLANK'" class="question-options">
                <el-input 
                  v-model="userAnswers[currentQuestion.questionId]" 
                  type="textarea" 
                  :rows="2" 
                  placeholder="请输入您的答案"
                ></el-input>
              </div>
              
              <!-- 主观题 -->
              <div v-else-if="currentQuestion.questionType === 'SUBJECTIVE'" class="question-options">
                <el-input 
                  v-model="userAnswers[currentQuestion.questionId]" 
                  type="textarea" 
                  :rows="4" 
                  placeholder="请输入您的答案"
                ></el-input>
              </div>
              
              <!-- 提交按钮 -->
              <div class="answer-actions">
                <el-button 
                  type="primary" 
                  size="small" 
                  @click="submitAnswer(currentQuestion)"
                  :disabled="!isAnswerValid(currentQuestion)"
                >提交答案</el-button>
                
                <el-button 
                  v-if="currentQuestionIndex < questions.length - 1" 
                  type="default" 
                  size="small" 
                  @click="nextQuestion"
                >下一题</el-button>
                
                <el-button 
                  v-if="currentQuestionIndex > 0" 
                  type="default" 
                  size="small" 
                  @click="prevQuestion"
                >上一题</el-button>
              </div>
            </div>
            
            <!-- 已结束或已提交的考试显示答案区域 -->
            <div v-else-if="examStatus === 'ENDED' || examStatus === 'SUBMITTED'" class="result-area">
              <div class="my-answer">
                <div class="answer-label">我的答案:</div>
                <div class="answer-content">{{ getDisplayAnswer(currentQuestion) }}</div>
              </div>
              
              <div v-if="showReferenceAnswer" class="correct-answer">
                <div class="answer-label">参考答案:</div>
                <div class="answer-content">{{ currentQuestion.referenceAnswer }}</div>
              </div>
              
              <div v-if="answeredQuestions[currentQuestion.questionId] && answeredQuestions[currentQuestion.questionId].score !== undefined" class="score-info">
                <div class="answer-label">得分:</div>
                <div class="answer-content">{{ answeredQuestions[currentQuestion.questionId].score }} / {{ currentQuestion.scorePoints }}</div>
              </div>
            </div>
          </div>
        </div>
      </el-card>
      
      <!-- 提交考卷按钮 -->
      <div class="submit-exam-container" v-if="examStatus === 'ONGOING'">
        <el-button type="primary" @click="submitExam" :loading="submitting">提交考卷</el-button>
      </div>
      
      <!-- 考试结果 -->
      <el-card v-if="examStatus === 'ENDED' || examStatus === 'SUBMITTED'" class="result-card">
        <div class="result-header">
          <h3>考试结果</h3>
          <div class="result-score">
            总得分: <span class="score-value">{{ totalScore }}</span> / {{ examInfo.totalScore }}
          </div>
        </div>
        
        <div class="result-stats">
          <el-progress :percentage="scorePercentage" :format="percentFormat" :status="scoreStatus"></el-progress>
          
          <div class="stats-items">
            <div class="stats-item">
              <div class="stats-label">已答题数:</div>
              <div class="stats-value">{{ answeredCount }} / {{ questions.length }}</div>
            </div>
            
            <div class="stats-item">
              <div class="stats-label">正确题数:</div>
              <div class="stats-value">{{ correctCount }}</div>
            </div>
            
            <div class="stats-item">
              <div class="stats-label">错误题数:</div>
              <div class="stats-value">{{ questions.length - correctCount - unansweredCount }}</div>
            </div>
          </div>
        </div>
      </el-card>
    </div>
  </div>
</template>

<script>
import { studentExamAPI } from '@/api/api';

export default {
  name: 'StudentExamDetail',
  data() {
    return {
      // 考试信息
      examId: null,
      examInfo: {},
      questions: [],
      loading: true,
      submitting: false,
      
      // 答题相关
      currentQuestionIndex: 0,
      userAnswers: {},
      answeredQuestions: {},
      
      // 计时器
      remainingTime: 0,
      timerInterval: null,
      
      // 考试状态: 'NOT_STARTED', 'ONGOING', 'ENDED', 'SUBMITTED'
      examStatus: 'ONGOING',
      
      // 结果相关
      totalScore: 0,
      correctCount: 0,
      showReferenceAnswer: false
    };
  },
  computed: {
    // 当前题目
    currentQuestion() {
      if (this.questions.length === 0) return null;
      return this.questions[this.currentQuestionIndex];
    },
    
    // 格式化剩余时间
    formatTimeRemaining() {
      if (this.remainingTime <= 0) return '00:00:00';
      
      const hours = Math.floor(this.remainingTime / 3600);
      const minutes = Math.floor((this.remainingTime % 3600) / 60);
      const seconds = this.remainingTime % 60;
      
      return [
        hours.toString().padStart(2, '0'),
        minutes.toString().padStart(2, '0'),
        seconds.toString().padStart(2, '0')
      ].join(':');
    },
    
    // 已答题数量
    answeredCount() {
      return Object.keys(this.answeredQuestions).length;
    },
    
    // 未答题数量
    unansweredCount() {
      return this.questions.length - this.answeredCount;
    },
    
    // 得分百分比
    scorePercentage() {
      if (!this.examInfo.totalScore) return 0;
      return Math.round((this.totalScore / this.examInfo.totalScore) * 100);
    },
    
    // 得分状态
    scoreStatus() {
      if (this.scorePercentage >= 80) return 'success';
      if (this.scorePercentage >= 60) return '';
      return 'exception';
    }
  },
  watch: {
    // 监听路由参数变化
    '$route.params.examId': {
      handler(newExamId) {
        if (newExamId) {
          this.examId = newExamId;
          this.fetchExamDetail();
        }
      },
      immediate: true
    }
  },
  created() {
    // 从路由参数获取考试ID
    this.examId = this.$route.params.examId;
    
    // 加载考试详情
    if (this.examId) {
      this.fetchExamDetail();
    }
  },
  beforeUnmount() {
    // 清除计时器
    if (this.timerInterval) {
      clearInterval(this.timerInterval);
    }
  },
  methods: {
    // 获取考试详情
    async fetchExamDetail() {
      this.loading = true;
      
      try {
        // 确保ID是字符串类型
        const examIdStr = String(this.examId);
        
        // 获取考试信息
        const examInfo = await studentExamAPI.getExamDetailByTitle(this.$store.state.user.userId, examIdStr);
        this.examInfo = examInfo;
        
        // 获取考试题目
        const answers = await studentExamAPI.getStudentExamAnswers(this.$store.state.user.userId, examIdStr);
        
        // 处理题目和答案
        if (Array.isArray(answers)) {
          // 提取题目信息
          const questions = answers.map(answer => ({
            questionId: answer.questionId,
            content: answer.questionContent,
            questionType: answer.questionType,
            options: this.parseOptions(answer.options),
            scorePoints: answer.scorePoints,
            referenceAnswer: answer.referenceAnswer
          }));
          
          this.questions = questions;
          
          // 初始化用户答案和已答题状态
          this.initUserAnswers(answers);
          
          // 设置考试状态
          this.determineExamStatus();
          
          // 如果考试正在进行中，启动计时器
          if (this.examStatus === 'ONGOING') {
            this.startTimer();
          }
          
          // 如果考试已结束，计算总分和正确题数
          if (this.examStatus === 'ENDED' || this.examStatus === 'SUBMITTED') {
            this.calculateResults(answers);
            this.showReferenceAnswer = true;
          }
        }
      } catch (error) {
        console.error('获取考试详情失败:', error);
        this.$message.error('获取考试详情失败，请稍后再试');
      } finally {
        this.loading = false;
      }
    },
    
    // 解析选项
    parseOptions(options) {
      if (typeof options === 'string') {
        try {
          return JSON.parse(options);
        } catch (e) {
          return [];
        }
      }
      return Array.isArray(options) ? options : [];
    },
    
    // 初始化用户答案
    initUserAnswers(answers) {
      const userAnswers = {};
      const answeredQuestions = {};
      
      answers.forEach(answer => {
        const questionId = answer.questionId;
        const questionType = answer.questionType;
        
        // 如果已有答案
        if (answer.studentAnswer) {
          if (questionType === 'MULTIPLE_CHOICE') {
            try {
              userAnswers[questionId] = answer.studentAnswer.split(',').map(item => item.trim());
            } catch (e) {
              userAnswers[questionId] = [];
            }
          } else {
            userAnswers[questionId] = answer.studentAnswer;
          }
          
          // 标记为已答题
          answeredQuestions[questionId] = {
            answered: true,
            score: answer.score,
            graded: answer.graded
          };
        } else {
          // 初始化空答案
          if (questionType === 'MULTIPLE_CHOICE') {
            userAnswers[questionId] = [];
          } else {
            userAnswers[questionId] = '';
          }
        }
      });
      
      this.userAnswers = userAnswers;
      this.answeredQuestions = answeredQuestions;
    },
    
    // 确定考试状态
    determineExamStatus() {
      const now = new Date();
      const startTime = new Date(this.examInfo.startTime);
      const endTime = new Date(this.examInfo.endTime);
      
      if (now < startTime) {
        this.examStatus = 'NOT_STARTED';
      } else if (now > endTime) {
        this.examStatus = 'ENDED';
      } else {
        // 检查是否所有题目都已提交
        const allAnswered = this.questions.every(q => this.answeredQuestions[q.questionId]);
        if (allAnswered) {
          this.examStatus = 'SUBMITTED';
        } else {
          this.examStatus = 'ONGOING';
        }
      }
    },
    
    // 启动计时器
    startTimer() {
      const endTime = new Date(this.examInfo.endTime).getTime();
      const updateTimer = () => {
        const now = new Date().getTime();
        const diff = Math.max(0, Math.floor((endTime - now) / 1000));
        
        this.remainingTime = diff;
        
        // 如果时间到了，自动提交考卷
        if (diff <= 0) {
          clearInterval(this.timerInterval);
          this.examStatus = 'ENDED';
          this.$message.warning('考试时间已结束，系统将自动提交您的答卷');
          this.submitExam();
        }
      };
      
      // 立即更新一次
      updateTimer();
      
      // 设置定时器，每秒更新一次
      this.timerInterval = setInterval(updateTimer, 1000);
    },
    
    // 提交单题答案
    async submitAnswer(question) {
      const questionId = question.questionId;
      const answer = this.userAnswers[questionId];
      
      if (!this.isAnswerValid(question)) {
        this.$message.warning('请完成答题后再提交');
        return;
      }
      
      try {
        // 准备提交数据
        const answerData = {
          examId: this.examId,
          questionId: questionId,
          studentId: this.$store.state.user.userId,
          studentAnswer: question.questionType === 'MULTIPLE_CHOICE' ? answer.join(',') : answer,
          examTitle: this.examInfo.title,
          questionContent: question.content,
          questionType: question.questionType
        };
        
        // 提交答案
        await studentExamAPI.submitAnswer(answerData);
        
        // 标记为已答题
        this.$set(this.answeredQuestions, questionId, { answered: true });
        
        // 显示提交成功提示
        this.$message.success('答案已提交');

        // 自动前进到下一题
        this.nextQuestion();
      } catch (error) {
        console.error('提交答案失败:', error);
        this.$message.error('提交答案失败，请稍后再试');
      }
    },
    
    // 提交整份考卷
    async submitExam() {
      if (this.submitting) return;
      
      // 确认提交
      try {
        await this.$confirm('确认提交整份考卷吗？提交后将无法修改答案', '提交确认', {
          confirmButtonText: '确认提交',
          cancelButtonText: '继续答题',
          type: 'warning'
        });
      } catch (e) {
        return; // 用户取消提交
      }
      
      this.submitting = true;
      
      try {
        // 准备批量提交的答案
        const answerList = this.questions.map(question => {
          const questionId = question.questionId;
          const answer = this.userAnswers[questionId];
          
          return {
            examId: this.examId,
            questionId: questionId,
            studentId: this.$store.state.user.userId,
            studentAnswer: question.questionType === 'MULTIPLE_CHOICE' && Array.isArray(answer) ? answer.join(',') : (answer || ''),
            examTitle: this.examInfo.title,
            questionContent: question.content,
            questionType: question.questionType
          };
        });
        
        // 批量提交答案
        await studentExamAPI.batchSubmitAnswers(answerList);
        
        // 更新考试状态
        this.examStatus = 'SUBMITTED';
        
        // 重新获取考试结果
        await this.fetchExamDetail();
        
        // 显示提交成功提示
        this.$message.success('考卷已成功提交');
      } catch (error) {
        console.error('提交考卷失败:', error);
        this.$message.error('提交考卷失败，请稍后再试');
      } finally {
        this.submitting = false;
      }
    },
    
    // 计算考试结果
    calculateResults(answers) {
      let totalScore = 0;
      let correctCount = 0;
      
      answers.forEach(answer => {
        if (answer.score !== undefined && answer.score !== null) {
          totalScore += parseFloat(answer.score);
          
          // 如果得分等于题目满分，则认为是正确的
          if (answer.score === answer.scorePoints) {
            correctCount++;
          }
        }
      });
      
      this.totalScore = totalScore;
      this.correctCount = correctCount;
    },
    
    // 下一题
    nextQuestion() {
      if (this.currentQuestionIndex < this.questions.length - 1) {
        this.currentQuestionIndex++;
      }
    },
    
    // 上一题
    prevQuestion() {
      if (this.currentQuestionIndex > 0) {
        this.currentQuestionIndex--;
      }
    },
    
    // 获取题目类型文本
    getQuestionTypeText(type) {
      const typeMap = {
        'SINGLE_CHOICE': '单选题',
        'MULTIPLE_CHOICE': '多选题',
        'FILL_BLANK': '填空题',
        'SUBJECTIVE': '主观题'
      };
      return typeMap[type] || type;
    },
    
    // 获取题目选项
    getQuestionOptions(question) {
      return Array.isArray(question.options) ? question.options : [];
    },
    
    // 检查答案是否有效
    isAnswerValid(question) {
      const answer = this.userAnswers[question.questionId];
      
      if (question.questionType === 'MULTIPLE_CHOICE') {
        return Array.isArray(answer) && answer.length > 0;
      } else if (question.questionType === 'SINGLE_CHOICE') {
        return answer && answer.trim() !== '';
      } else if (question.questionType === 'FILL_BLANK' || question.questionType === 'SUBJECTIVE') {
        return answer && answer.trim() !== '';
      }
      
      return false;
    },
    
    // 获取用户答案显示文本
    getDisplayAnswer(question) {
      const answer = this.userAnswers[question.questionId];
      if (!answer) return '未作答';
      
      if (question.questionType === 'MULTIPLE_CHOICE' && Array.isArray(answer)) {
        return answer.join(', ');
      }
      return answer;
    },
    
    // 格式化日期时间
    formatDateTime(dateString) {
      if (!dateString) return '';
      
      const date = new Date(dateString);
      return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')} ${String(date.getHours()).padStart(2, '0')}:${String(date.getMinutes()).padStart(2, '0')}`;
    },
    
    // 格式化百分比
    percentFormat(percentage) {
      return `${percentage}%`;
    }
  }
};
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
.questions-card,
.result-card {
  margin-bottom: 20px;
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
  line-height: 1.6;
}

.question-options {
  margin-left: 20px;
  margin-bottom: 20px;
}

.option-item {
  margin-bottom: 10px;
}

.option-label {
  margin-right: 8px;
  min-width: 20px;
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