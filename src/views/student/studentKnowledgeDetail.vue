<!-- 待完善题目作答功能 和ai助教功能-->
<template>
  <div class="knowledge-detail-container">
    <!-- 左侧内容区 -->
    <div class="content-area">
      <el-card class="question-card">
        <div v-if="loading" class="loading-container">
          <el-skeleton :rows="10" animated />
        </div>
        
        <div v-else-if="questions.length === 0" class="empty-container">
          <el-empty description="暂无题目" />
        </div>
        
        <div v-else class="questions-container">
          <div class="knowledge-header">
            <h2>{{ knowledgeName }}</h2>
            <div class="knowledge-info">
              <span>题量: {{ questions.length }}</span>
              <span>满分: {{ typeof totalScore === 'number' ? totalScore.toFixed(1) : '0.0' }}</span>
            </div>
            
            <div class="action-buttons">
              <el-button 
                type="primary" 
                @click="submitAllAnswers" 
                :disabled="!hasAnyAnswer || allQuestionsAnswered"
              >
                提交全部答案
              </el-button>
              <el-button 
                type="warning" 
                @click="resetAllAnswers" 
                v-if="allQuestionsAnswered"
              >
                重新答题
              </el-button>
            </div>
          </div>
          
          <!-- 题目列表 -->
          <div 
            v-for="(question, index) in questions" 
            :key="question.questionId" 
            class="question-item"
            :id="`question-${question.questionId}`"
          >
            <div class="question-header">
              {{ index + 1 }}. <span v-if="question.questionType === 'SINGLE_CHOICE'">[单选题]</span>
              <span v-else-if="question.questionType === 'MULTIPLE_CHOICE'">[多选题]</span>
              <span v-else-if="question.questionType === 'FILL_BLANK'">[填空题]</span>
              <span v-else-if="question.questionType === 'SUBJECTIVE'">[主观题]</span>
              <span v-else-if="question.questionType === 'TRUE_FALSE'">[判断题]</span>
              <span v-else>[{{ question.questionType }}]</span>
              {{ question.content }}
            </div>
            
            <!-- 未回答时显示作答区域 -->
            <div v-if="!answeredQuestions[question.questionId]">
              <!-- 选择题选项（自定义渲染） -->
              <div v-if="question.questionType === 'SINGLE_CHOICE'" class="question-options">
                <div
                  v-for="(option, optIndex) in question.options"
                  :key="optIndex"
                  class="option-item"
                  :class="{ 
                    selected: userAnswers[question.questionId] === String.fromCharCode(65 + optIndex),
                    'option-hover': true
                  }"
                  @click="selectSingleChoice(question.questionId, String.fromCharCode(65 + optIndex))"
                >
                  <span class="option-label">{{ String.fromCharCode(65 + optIndex) }}</span>
                  <span class="option-separator">、</span>
                  <span class="option-content">{{ option }}</span>
                  <span class="option-check" v-if="userAnswers[question.questionId] === String.fromCharCode(65 + optIndex)">
                    <i class="el-icon-check"></i>
                  </span>
                </div>
              </div>
              
              <!-- 多选题选项（自定义渲染） -->
              <div v-else-if="question.questionType === 'MULTIPLE_CHOICE'" class="question-options">
                <div
                  v-for="(option, optIndex) in question.options"
                  :key="optIndex"
                  class="option-item"
                  :class="{ 
                    selected: userAnswers[question.questionId] && userAnswers[question.questionId].includes(String.fromCharCode(65 + optIndex)),
                    'option-hover': true
                  }"
                  @click="toggleMultipleChoice(question.questionId, String.fromCharCode(65 + optIndex))"
                >
                  <span class="option-label">{{ String.fromCharCode(65 + optIndex) }}</span>
                  <span class="option-separator">、</span>
                  <span class="option-content">{{ option }}</span>
                  <span class="option-check" v-if="userAnswers[question.questionId] && userAnswers[question.questionId].includes(String.fromCharCode(65 + optIndex))">
                    <i class="el-icon-check"></i>
                  </span>
                </div>
              </div>
              
              <div v-else-if="question.questionType === 'FILL_BLANK'" class="question-options">
                <el-input 
                  v-model="userAnswers[question.questionId]" 
                  type="textarea" 
                  :rows="2" 
                  placeholder="请输入您的答案"
                ></el-input>
              </div>
              
              <div v-else-if="question.questionType === 'SUBJECTIVE'" class="question-options">
                <el-input 
                  v-model="userAnswers[question.questionId]" 
                  type="textarea" 
                  :rows="4" 
                  placeholder="请输入您的答案"
                ></el-input>
              </div>
              
              <!-- 判断题选项（自定义渲染） -->
              <div v-else-if="question.questionType === 'TRUE_FALSE'" class="question-options">
                <div
                  class="option-item"
                  :class="{ 
                    selected: userAnswers[question.questionId] === 'true',
                    'option-hover': true
                  }"
                  @click="selectTrueFalse(question.questionId, 'true')"
                >
                  <span class="option-label">A</span>
                  <span class="option-separator">、</span>
                  <span class="option-content">正确</span>
                  <span class="option-check" v-if="userAnswers[question.questionId] === 'true'">
                    <i class="el-icon-check"></i>
                  </span>
                </div>
                <div
                  class="option-item"
                  :class="{ 
                    selected: userAnswers[question.questionId] === 'false',
                    'option-hover': true
                  }"
                  @click="selectTrueFalse(question.questionId, 'false')"
                >
                  <span class="option-label">B</span>
                  <span class="option-separator">、</span>
                  <span class="option-content">错误</span>
                  <span class="option-check" v-if="userAnswers[question.questionId] === 'false'">
                    <i class="el-icon-check"></i>
                  </span>
                </div>
              </div>
              
              <!-- 提交按钮 -->
              <div class="submit-btn-container">
                <el-button 
                  type="primary" 
                  size="small" 
                  @click="submitAnswer(question)"
                  :disabled="!isAnswerValid(question)"
                  class="submit-btn"
                  :class="{'submit-btn-active': isAnswerValid(question)}"
                >提交答案</el-button>
              </div>
            </div>
            
            <!-- 已回答时显示答案区域 -->
            <div v-else class="answer-section">
              <!-- 我的答案 -->
              <div class="my-answer" :class="{ 'correct-answer': isCorrect(question), 'wrong-answer': !isCorrect(question), 'answer-animation': true }">
                <span class="answer-label">我的答案: </span>
                <span class="answer-content">{{ getDisplayAnswer(question) }}</span>
                <span class="answer-status" v-if="isCorrect(question)">
                  <i class="el-icon-check"></i> 正确
                </span>
                <span class="answer-status wrong" v-else>
                  <i class="el-icon-close"></i> 错误
                </span>
              </div>
              
              <!-- 正确答案 -->
              <div class="correct-answer answer-animation" :style="{ animationDelay: '0.2s' }">
                <span class="answer-label">正确答案: </span>
                <span class="answer-content">{{ question.referenceAnswer }}</span>
              </div>
              
              <!-- 解析 -->
              <div class="answer-analysis answer-animation" v-if="question.analysis" :style="{ animationDelay: '0.4s' }">
                <span class="answer-label">解析: </span>
                <span class="answer-content">{{ question.analysis }}</span>
              </div>
            </div>
          </div>
          
          <!-- 底部提交按钮 -->
          <div class="bottom-actions" v-if="questions.length > 0">
            <el-button 
              type="primary" 
              @click="submitAllAnswers" 
              :disabled="!hasAnyAnswer || allQuestionsAnswered"
            >
              提交全部答案
            </el-button>
            <el-button 
              type="warning" 
              @click="resetAllAnswers" 
              v-if="allQuestionsAnswered"
            >
              重新答题
            </el-button>
          </div>
        </div>
      </el-card>
    </div>
    
    <!-- 右侧目录区 -->
    <div class="catalog-area">
      <el-card class="catalog-card">
        <div class="catalog-header">
          <!-- 任务点进度条区域 -->
          <div class="task-progress-bar">
            <span class="task-progress-dot"></span>
            <span class="task-progress-text">已完成任务点：{{ completedTaskCount }}/{{ totalTaskCount }}</span>
            <div class="task-progress-outer">
              <div class="task-progress-inner" :style="{ width: taskProgressPercent + '%' }"></div>
            </div>
          </div>
          <div class="catalog-search">
            <el-input v-model="searchKeyword" placeholder="搜索" prefix-icon="el-icon-search" clearable />
          </div>
        </div>
        
        <div class="catalog-content">
          <el-tree
            v-if="!catalogLoading && knowledgePoints.length > 0"
            :data="catalogTree"
            :props="defaultProps"
            :highlight-current="true"
            :expand-on-click-node="false"
            node-key="knowledgeId"
            :filter-node-method="filterNode"
            ref="knowledgeTree"
            @node-click="handleNodeClick">
            <template #default="{ node, data }">
              <div class="catalog-node">
                <span>{{ node.label }}</span>
                <el-tag v-if="data.knowledgeId === currentKnowledgeId" size="mini" type="primary">当前</el-tag>
              </div>
            </template>
          </el-tree>
          
          <el-skeleton v-else-if="catalogLoading" :rows="8" animated />
          <el-empty v-else description="暂无知识点" />
        </div>
      </el-card>
    </div>
  </div>
</template>

<script>
import { knowledgeAPI } from '@/api/api';
import { BigNumber } from 'bignumber.js';
import { getUserInfo } from '@/utils/auth';

export default {
  name: 'StudentKnowledgeDetail',
  data() {
    return {
      // 知识点信息
      knowledgeId: null,
      knowledgeName: '',
      knowledgeDescription: '',
      courseId: null,
      courseName: '',
      
      // 题目列表
      questions: [],
      loading: true,
      
      // 用户答案
      userAnswers: {},
      answeredQuestions: {},
      correctAnswers: {},
      
      // 学生信息
      studentId: null,
      
      // 目录相关
      knowledgePoints: [],
      catalogLoading: true,
      searchKeyword: '',
      currentKnowledgeId: '',
      
      // 树形控件配置
      defaultProps: {
        children: 'children',
        label: 'name'
      }
    };
  },
  computed: {
    // 计算总分
    totalScore() {
      return this.questions.reduce((sum, question) => sum + (question.scorePoints || 0), 0);
    },
    
    // 构建目录树
    catalogTree() {
      // 这里可以根据需要构建树形结构，这里简单返回知识点列表
      return this.knowledgePoints.map(point => ({
        ...point,
        label: point.name
      }));
    },
    
    // 任务点总数
    totalTaskCount() {
      return this.knowledgePoints.length;
    },
    
    // 已完成任务点数
    completedTaskCount() {
      return this.knowledgePoints.filter(kp => kp.completed).length;
    },
    
    // 进度百分比
    taskProgressPercent() {
      if (this.totalTaskCount === 0) return 0;
      return Math.round((this.completedTaskCount / this.totalTaskCount) * 100);
    },
    
    // 是否有任何答案
    hasAnyAnswer() {
      for (const questionId in this.userAnswers) {
        const answer = this.userAnswers[questionId];
        if (Array.isArray(answer) ? answer.length > 0 : answer) {
          return true;
        }
      }
      return false;
    },
    
    // 是否所有题目都已回答
    allQuestionsAnswered() {
      if (this.questions.length === 0) return false;
      
      for (const question of this.questions) {
        if (!this.answeredQuestions[question.questionId]) {
          return false;
        }
      }
      return true;
    }
  },
  watch: {
    // 监听搜索关键词变化
    searchKeyword(val) {
      this.$refs.knowledgeTree?.filter(val);
    },
    
    // 监听路由参数变化，更新当前知识点ID
    '$route.params.knowledgeId': {
      handler(newKnowledgeId) {
        if (newKnowledgeId) {
          this.knowledgeId = newKnowledgeId;
          this.currentKnowledgeId = newKnowledgeId;
          this.fetchQuestions();
        }
      },
      immediate: false
    }
  },
  created() {
    // 从路由参数获取知识点ID
    this.knowledgeId = this.$route.params.knowledgeId;
    
    // 从路由query参数获取知识点名称和其他信息
    if (this.$route.query.knowledgeName) {
      this.knowledgeName = this.$route.query.knowledgeName;
    }
    
    if (this.$route.query.knowledgeDescription) {
      this.knowledgeDescription = this.$route.query.knowledgeDescription;
    }
    
    if (this.$route.query.courseId) {
      this.courseId = this.$route.query.courseId;
    }
    
    if (this.$route.query.courseName) {
      this.courseName = this.$route.query.courseName;
    }
    
    // 设置当前知识点ID
    this.currentKnowledgeId = this.knowledgeId;
    
    // 获取学生ID
    const userInfo = getUserInfo();
    if (userInfo && userInfo.studentId) {
      this.studentId = userInfo.studentId;
    }
    
    // 加载数据
    this.fetchQuestions();
    this.fetchKnowledgePoints();
    
    // 从本地存储加载已答题状态
    this.loadAnsweredState();
  },
  methods: {
    // 获取知识点下的题目
    async fetchQuestions() {
      this.loading = true;
      
      try {
        // 确保ID是字符串类型
        const knowledgeIdStr = String(this.knowledgeId);
        
        // 调用API时将ID转换为BigNumber
        let knowledgeIdParam = knowledgeIdStr;
        
        try {
          const bn = new BigNumber(knowledgeIdStr);
          knowledgeIdParam = bn.toString();
        } catch (error) {
          console.error('无法将知识点ID转换为BigNumber:', error);
        }
        
        const response = await knowledgeAPI.getQuestionsByKnowledgeId(knowledgeIdParam);
        
        // 确保返回的所有ID字段都是字符串类型
        if (Array.isArray(response)) {
          this.questions = response.map(item => {
            // 处理选项，如果是字符串，转换为数组
            if (typeof item.options === 'string') {
              try {
                item.options = JSON.parse(item.options);
              } catch (e) {
                item.options = [];
              }
            }
            return item;
          });
          
          // 初始化用户答案
          this.initUserAnswers();
        } else {
          this.questions = [];
        }
      } catch (error) {
        console.error('获取知识点题目列表失败:', error);
        this.$message.error('获取题目失败，请稍后再试');
        this.questions = [];
      } finally {
        this.loading = false;
      }
    },
    
    // 初始化用户答案
    initUserAnswers() {
      const answers = {};
      const answered = {};
      const correct = {};
      this.questions.forEach(question => {
        if (question.questionType === 'MULTIPLE_CHOICE') {
          answers[question.questionId] = [];
        } else {
          answers[question.questionId] = '';
        }
        answered[question.questionId] = false;
        correct[question.questionId] = false;
      });
      this.userAnswers = answers;
      this.answeredQuestions = answered;
      this.correctAnswers = correct;
    },
    
    // 提交答案
    submitAnswer(question) {
      // 标记题目已回答
      this.$set(this.answeredQuestions, question.questionId, true);
      
      // 检查答案是否正确
      const isCorrect = this.checkAnswer(question);
      this.$set(this.correctAnswers, question.questionId, isCorrect);
      
      // 保存答题状态到本地存储
      this.saveAnsweredState();
      
      // 这里可以添加向后端提交答案的逻辑
      console.log('提交答案:', question.questionId, this.userAnswers[question.questionId]);
      
      // 显示提交成功提示
      this.$message({
        message: isCorrect ? '回答正确！' : '回答错误，请查看正确答案',
        type: isCorrect ? 'success' : 'warning',
        duration: 1500
      });
      
      // 滚动到答案区域
      this.$nextTick(() => {
        const answerSection = document.querySelector(`#question-${question.questionId} .answer-section`);
        if (answerSection) {
          answerSection.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }
      });
    },
    
    // 提交全部答案
    submitAllAnswers() {
      // 检查是否有未作答的题目
      const unansweredQuestions = this.questions.filter(q => 
        !this.isAnswerValid({ questionId: q.questionId, questionType: q.questionType })
      );
      
      if (unansweredQuestions.length > 0) {
        this.$confirm(`还有 ${unansweredQuestions.length} 道题目未作答，确定要提交吗？`, '提交确认', {
          confirmButtonText: '确定',
          cancelButtonText: '取消',
          type: 'warning'
        }).then(() => {
          this.processAllAnswers();
        }).catch(() => {
          // 用户取消提交
        });
      } else {
        this.processAllAnswers();
      }
    },
    
    // 处理所有答案
    processAllAnswers() {
      // 标记所有题目为已回答
      this.questions.forEach(question => {
        this.$set(this.answeredQuestions, question.questionId, true);
        
        // 检查答案是否正确
        const isCorrect = this.checkAnswer(question);
        this.$set(this.correctAnswers, question.questionId, isCorrect);
      });
      
      // 保存答题状态到本地存储
      this.saveAnsweredState();
      
      // 计算得分
      const totalQuestions = this.questions.length;
      const correctCount = Object.values(this.correctAnswers).filter(Boolean).length;
      const score = totalQuestions > 0 ? Math.round((correctCount / totalQuestions) * 100) : 0;
      
      // 显示得分结果
      this.$message({
        message: `答案已提交！得分: ${score}分，正确率: ${correctCount}/${totalQuestions}`,
        type: 'success',
        duration: 3000
      });
      
      // 添加动画效果，依次显示每个答案
      this.$nextTick(() => {
        this.questions.forEach((question, index) => {
          setTimeout(() => {
            const questionElement = document.querySelector(`#question-${question.questionId}`);
            if (questionElement) {
              questionElement.classList.add('question-answered');
              // 如果是第一个问题，滚动到它的位置
              if (index === 0) {
                questionElement.scrollIntoView({ behavior: 'smooth', block: 'start' });
              }
            }
          }, index * 300); // 每个问题间隔300毫秒
        });
      });
    },
    
    // 重置所有答案
    resetAllAnswers() {
      this.$confirm('确定要重新答题吗？这将清除您的所有答案。', '重置确认', {
        confirmButtonText: '确定',
        cancelButtonText: '取消',
        type: 'warning'
      }).then(() => {
        // 重置用户答案
        this.initUserAnswers();
        
        // 清除本地存储的答题状态
        this.clearAnsweredState();
        
        this.$message({
          message: '已重置所有答案，可以重新作答',
          type: 'success',
          duration: 1500
        });
      }).catch(() => {
        // 用户取消重置
      });
    },
    
    // 检查答案是否正确
    checkAnswer(question) {
      const userAnswer = this.userAnswers[question.questionId];
      const referenceAnswer = question.referenceAnswer;
      
      if (!userAnswer || !referenceAnswer) return false;
      
      if (question.questionType === 'MULTIPLE_CHOICE') {
        // 多选题比较
        if (!Array.isArray(userAnswer)) return false;
        
        // 将参考答案转换为数组
        const refAnswerArray = referenceAnswer.split(/[,，、\s]+/).filter(Boolean);
        
        // 检查长度是否相同
        if (userAnswer.length !== refAnswerArray.length) return false;
        
        // 检查每个选项是否都存在
        return refAnswerArray.every(option => userAnswer.includes(option));
      } else if (question.questionType === 'TRUE_FALSE') {
        // 判断题比较（忽略大小写）
        return userAnswer.toLowerCase() === referenceAnswer.toLowerCase();
      } else {
        // 其他题型（简单比较）
        return userAnswer.trim() === referenceAnswer.trim();
      }
    },
    
    // 判断答案是否正确
    isCorrect(question) {
      return this.correctAnswers[question.questionId] === true;
    },
    
    // 获取用户答案显示文本
    getDisplayAnswer(question) {
      const answer = this.userAnswers[question.questionId];
      if (!answer) return '未作答';
      
      if (question.questionType === 'MULTIPLE_CHOICE') {
        return answer.join(', ');
      }
      return answer;
    },
    
    // 获取课程知识点列表
    async fetchKnowledgePoints() {
      if (!this.courseId) return;
      
      this.catalogLoading = true;
      
      try {
        const response = await knowledgeAPI.getKnowledgeByCourseId(this.courseId);
        
        if (Array.isArray(response)) {
          this.knowledgePoints = response;
        } else {
          this.knowledgePoints = [];
        }
      } catch (error) {
        console.error('获取课程知识点失败:', error);
        this.$message.error('获取知识点列表失败，请稍后再试');
        this.knowledgePoints = [];
      } finally {
        this.catalogLoading = false;
      }
    },
    
    // 处理知识点点击事件
    handleNodeClick(data) {
      // 更新当前知识点ID
      this.currentKnowledgeId = data.knowledgeId;
      
      // 跳转到对应的知识点页面
      this.$router.push({
        path: `/student/knowledge/${data.knowledgeId}`,
        query: {
          courseName: this.courseName,
          courseId: this.courseId,
          knowledgeName: data.name,
          knowledgeDescription: data.description
        }
      });
    },
    
    // 过滤节点方法
    filterNode(value, data) {
      if (!value) return true;
      return data.name.toLowerCase().includes(value.toLowerCase());
    },
    
    // 获取用户答案（示例方法，实际应从用户数据获取）
    getUserAnswer(question) {
      // 这里应该从用户的答题记录中获取答案
      // 示例返回
      if (question.questionType === 'SINGLE_CHOICE') {
        return 'C';
      } else if (question.questionType === 'MULTIPLE_CHOICE') {
        return 'A, B, C';
      } else {
        return '用户暂未作答';
      }
    },
    
    // 检查答案是否有效
    isAnswerValid(question) {
      const answer = this.userAnswers[question.questionId];
      if (question.questionType === 'MULTIPLE_CHOICE') {
        return answer && answer.length > 0;
      } else if (question.questionType === 'SINGLE_CHOICE') {
        return answer && answer.trim() !== '';
      } else if (question.questionType === 'FILL_BLANK' || question.questionType === 'SUBJECTIVE') {
        return answer && answer.trim() !== '';
      } else if (question.questionType === 'TRUE_FALSE') {
        return answer === 'true' || answer === 'false';
      } else {
        return false;
      }
    },
    
    // 单选题选择
    selectSingleChoice(questionId, optionLabel) {
      this.$set(this.userAnswers, questionId, optionLabel);
      // 添加选择动画效果
      this.animateSelection(questionId);
    },
    
    // 判断题选择
    selectTrueFalse(questionId, value) {
      this.$set(this.userAnswers, questionId, value);
      // 添加选择动画效果
      this.animateSelection(questionId);
    },
    
    // 多选题选项切换
    toggleMultipleChoice(questionId, optionLabel) {
      const arr = this.userAnswers[questionId] || [];
      const idx = arr.indexOf(optionLabel);
      if (idx > -1) {
        arr.splice(idx, 1);
      } else {
        arr.push(optionLabel);
      }
      // 触发响应式
      this.$set(this.userAnswers, questionId, [...arr]);
      // 添加选择动画效果
      this.animateSelection(questionId);
    },
    
    // 添加选择动画效果
    animateSelection(questionId) {
      // 可以在这里添加更复杂的动画逻辑
      // 简单的实现是通过CSS transition实现
      console.log('选择了问题ID:', questionId);
    },
    
    // 保存答题状态到本地存储
    saveAnsweredState() {
      if (!this.knowledgeId || !this.studentId) return;
      
      const storageKey = `knowledge_${this.knowledgeId}_student_${this.studentId}`;
      const storageData = {
        userAnswers: this.userAnswers,
        answeredQuestions: this.answeredQuestions,
        correctAnswers: this.correctAnswers,
        timestamp: new Date().getTime()
      };
      
      try {
        localStorage.setItem(storageKey, JSON.stringify(storageData));
      } catch (e) {
        console.error('保存答题状态失败:', e);
      }
    },
    
    // 从本地存储加载答题状态
    loadAnsweredState() {
      if (!this.knowledgeId || !this.studentId) return;
      
      const storageKey = `knowledge_${this.knowledgeId}_student_${this.studentId}`;
      
      try {
        const storageData = localStorage.getItem(storageKey);
        if (storageData) {
          const data = JSON.parse(storageData);
          
          // 检查数据是否有效
          if (data && data.userAnswers && data.answeredQuestions) {
            this.userAnswers = data.userAnswers;
            this.answeredQuestions = data.answeredQuestions;
            this.correctAnswers = data.correctAnswers || {};
          }
        }
      } catch (e) {
        console.error('加载答题状态失败:', e);
      }
    },
    
    // 清除本地存储的答题状态
    clearAnsweredState() {
      if (!this.knowledgeId || !this.studentId) return;
      
      const storageKey = `knowledge_${this.knowledgeId}_student_${this.studentId}`;
      
      try {
        localStorage.removeItem(storageKey);
      } catch (e) {
        console.error('清除答题状态失败:', e);
      }
    }
  }
};
</script>

<style scoped>
.knowledge-detail-container {
  display: flex;
  height: 100vh;
  background-color: #f6f8fa;
  padding: 20px;
  gap: 20px;
}

/* 左侧内容区样式 */
.content-area {
  flex: 1;
  overflow-y: auto;
}

.question-card {
  height: calc(100vh - 40px);
  overflow-y: auto;
}

.loading-container,
.empty-container {
  display: flex;
  justify-content: center;
  align-items: center;
  min-height: 400px;
}

.knowledge-header {
  margin-bottom: 20px;
  padding-bottom: 15px;
  border-bottom: 1px solid #ebeef5;
}

.knowledge-header h2 {
  margin: 0 0 10px 0;
  color: #303133;
}

.knowledge-info {
  display: flex;
  gap: 20px;
  color: #606266;
  font-size: 14px;
}

.question-item {
  margin-bottom: 30px;
  padding-bottom: 20px;
  border-bottom: 1px dashed #ebeef5;
  text-align: left;
  transition: all 0.5s ease;
}

.question-answered {
  background-color: rgba(64, 158, 255, 0.05);
  border-radius: 8px;
  padding: 15px;
  box-shadow: 0 2px 12px 0 rgba(0, 0, 0, 0.05);
  transform: translateZ(0);
}

.question-header {
  margin-bottom: 15px;
  font-size: 16px;
  line-height: 1.6;
}

.question-options {
  margin-left: 20px;
  margin-bottom: 15px;
}

.option-item {
  display: flex;
  align-items: flex-start;
  margin-bottom: 10px;
  font-size: 16px;
  color: #bfbfbf;
  font-weight: normal;
  cursor: pointer;
  background: none;
  border-radius: 6px;
  padding: 10px 15px;
  transition: all 0.3s ease;
  position: relative;
  border: 1px solid transparent;
}

.option-hover:hover {
  background-color: rgba(64, 158, 255, 0.1);
  color: #409EFF;
}

.option-item.selected {
  color: #409EFF;
  font-weight: bold;
  background-color: rgba(64, 158, 255, 0.1);
  border: 1px solid #409EFF;
  box-shadow: 0 2px 6px rgba(64, 158, 255, 0.2);
}

.option-check {
  position: absolute;
  right: 15px;
  color: #409EFF;
  display: flex;
  align-items: center;
  justify-content: center;
  animation: fadeIn 0.3s ease;
}

@keyframes fadeIn {
  from { opacity: 0; transform: scale(0.8); }
  to { opacity: 1; transform: scale(1); }
}

.option-label {
  margin-right: 4px;
  min-width: 20px;
  font-weight: bold;
  color: inherit;
}

.option-separator {
  margin-right: 8px;
  color: inherit;
}

.option-content {
  flex: 1;
  color: inherit;
}

/* 选项组样式 */
.question-options .el-radio,
.question-options .el-checkbox {
  display: none !important;
}

/* 答案区样式 */
.answer-section {
  margin-top: 15px;
  padding: 0;
  background: none;
  border-radius: 0;
}

.my-answer,
.correct-answer,
.answer-analysis {
  margin-top: 10px;
  font-size: 16px;
  padding: 12px 20px;
  border-radius: 6px;
  background-color: #f7f8fa;
  display: flex;
  align-items: center;
  font-weight: bold;
  position: relative;
}

.my-answer {
  background-color: #f0f9eb;
}

.my-answer.wrong-answer {
  background-color: #fef0f0;
}

.my-answer::before {
  content: '';
  display: block;
  width: 4px;
  height: 80%;
  background: #409EFF;
  border-radius: 2px;
  position: absolute;
  left: 8px;
  top: 10%;
}

.my-answer.correct-answer::before {
  background: #67C23A;
}

.my-answer.wrong-answer::before {
  background: #F56C6C;
}

.correct-answer {
  color: #13c26b;
}

.correct-answer::before {
  content: '';
  display: block;
  width: 4px;
  height: 80%;
  background: #13c26b;
  border-radius: 2px;
  position: absolute;
  left: 8px;
  top: 10%;
}

.answer-analysis {
  color: #606266;
  background-color: #f4f4f5;
}

.answer-analysis::before {
  content: '';
  display: block;
  width: 4px;
  height: 80%;
  background: #909399;
  border-radius: 2px;
  position: absolute;
  left: 8px;
  top: 10%;
}

.answer-label {
  font-weight: bold;
  margin-right: 5px;
  color: #606266;
}

.my-answer .answer-content {
  color: #222;
  flex: 1;
}

.correct-answer .answer-content {
  color: #13c26b;
}

.answer-analysis .answer-content {
  color: #606266;
  font-weight: normal;
}

.answer-status {
  margin-left: 10px;
  color: #67C23A;
  font-weight: bold;
}

.answer-status.wrong {
  color: #F56C6C;
}

/* 右侧目录区样式 */
.catalog-area {
  width: 300px;
  overflow-y: auto;
}

.catalog-card {
  height: calc(100vh - 40px);
  display: flex;
  flex-direction: column;
}

.catalog-header {
  padding-bottom: 15px;
  margin-bottom: 15px;
  border-bottom: 1px solid #ebeef5;
}

.catalog-header h3 {
  margin: 0 0 15px 0;
  color: #303133;
}

.catalog-search {
  margin-bottom: 15px;
}

.catalog-content {
  flex: 1;
  overflow-y: auto;
}

.catalog-node {
  display: flex;
  align-items: center;
  justify-content: space-between;
  width: 100%;
}

/* 目录区顶部任务点进度条样式 */
.task-progress-bar {
  display: flex;
  align-items: center;
  margin-bottom: 10px;
  gap: 10px;
}
.task-progress-dot {
  width: 16px;
  height: 16px;
  background: #ffa940;
  border-radius: 50%;
  display: inline-block;
  margin-right: 6px;
}
.task-progress-text {
  font-size: 15px;
  color: #222;
  margin-right: 10px;
}
.task-progress-outer {
  flex: 1;
  height: 18px;
  background: #f2f3f5;
  border-radius: 9px;
  overflow: hidden;
  position: relative;
  min-width: 120px;
  max-width: 180px;
}
.task-progress-inner {
  height: 100%;
  background: #409eff;
  border-radius: 9px 0 0 9px;
  transition: width 0.3s;
}

.action-buttons {
  margin-top: 15px;
  display: flex;
  gap: 10px;
}

.bottom-actions {
  margin-top: 30px;
  display: flex;
  justify-content: center;
  gap: 15px;
}

.submit-btn-container {
  margin-top: 20px;
  display: flex;
  justify-content: flex-end;
}

.submit-btn {
  transition: all 0.3s ease;
}

.submit-btn-active {
  transform: scale(1.05);
  box-shadow: 0 2px 12px 0 rgba(64, 158, 255, 0.3);
}

.answer-animation {
  animation: slideIn 0.5s ease forwards;
  opacity: 0;
  transform: translateY(20px);
}

@keyframes slideIn {
  from { opacity: 0; transform: translateY(20px); }
  to { opacity: 1; transform: translateY(0); }
}
</style>
