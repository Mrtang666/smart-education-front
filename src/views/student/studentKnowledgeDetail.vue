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
          </div>
          
          <!-- 题目列表 -->
          <div v-for="(question, index) in questions" :key="question.questionId" class="question-item">
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
                  :class="{ selected: userAnswers[question.questionId] === String.fromCharCode(65 + optIndex) }"
                  @click="userAnswers[question.questionId] = String.fromCharCode(65 + optIndex)"
                >
                  <span class="option-label">{{ String.fromCharCode(65 + optIndex) }}</span>
                  <span class="option-separator">、</span>
                      <span class="option-content">{{ option }}</span>
                  </div>
              </div>
              
              <!-- 多选题选项（自定义渲染） -->
              <div v-else-if="question.questionType === 'MULTIPLE_CHOICE'" class="question-options">
                <div
                  v-for="(option, optIndex) in question.options"
                  :key="optIndex"
                  class="option-item"
                  :class="{ selected: userAnswers[question.questionId] && userAnswers[question.questionId].includes(String.fromCharCode(65 + optIndex)) }"
                  @click="toggleMultipleChoice(question.questionId, String.fromCharCode(65 + optIndex))"
                >
                  <span class="option-label">{{ String.fromCharCode(65 + optIndex) }}</span>
                  <span class="option-separator">、</span>
                      <span class="option-content">{{ option }}</span>
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
                  :class="{ selected: userAnswers[question.questionId] === 'true' }"
                  @click="userAnswers[question.questionId] = 'true'"
                >
                  <span class="option-label">A</span>
                  <span class="option-separator">、</span>
                  <span class="option-content">正确</span>
                </div>
                <div
                  class="option-item"
                  :class="{ selected: userAnswers[question.questionId] === 'false' }"
                  @click="userAnswers[question.questionId] = 'false'"
                >
                  <span class="option-label">B</span>
                  <span class="option-separator">、</span>
                  <span class="option-content">错误</span>
                </div>
              </div>
              
              <!-- 提交按钮 -->
              <div class="submit-btn-container">
                <el-button 
                  type="primary" 
                  size="small" 
                  @click="submitAnswer(question)"
                  :disabled="!isAnswerValid(question)"
                >提交答案</el-button>
              </div>
            </div>
            
            <!-- 已回答时显示答案区域 -->
            <div v-else class="answer-section">
              <!-- 我的答案 -->
              <div class="my-answer">
                <span class="answer-label">我的答案: </span>
                <span class="answer-content">{{ getDisplayAnswer(question) }}</span>
              </div>
              
              <!-- 正确答案 -->
              <div class="correct-answer">
                <span class="answer-label">正确答案: </span>
                <span class="answer-content">{{ question.referenceAnswer }}</span>
              </div>
            </div>
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
    
    // 加载数据
    this.fetchQuestions();
    this.fetchKnowledgePoints();
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
      this.questions.forEach(question => {
        if (question.questionType === 'MULTIPLE_CHOICE') {
          answers[question.questionId] = [];
        } else {
          answers[question.questionId] = '';
        }
        answered[question.questionId] = false;
      });
      this.userAnswers = answers;
      this.answeredQuestions = answered;
    },
    
    // 提交答案
    submitAnswer(question) {
      // 标记题目已回答
      this.$set(this.answeredQuestions, question.questionId, true);
      
      // 这里可以添加向后端提交答案的逻辑
      console.log('提交答案:', question.questionId, this.userAnswers[question.questionId]);
      
      // 显示提交成功提示
      this.$message({
        message: '答案已提交',
        type: 'success',
        duration: 1500
      });
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
      } else {
        return false;
      }
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
  border-radius: 0;
  padding: 0;
  transition: color 0.2s;
}

.option-item.selected {
  color: #222;
  font-weight: bold;
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
.correct-answer {
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

.answer-label {
  font-weight: bold;
  margin-right: 5px;
  color: #606266;
}

.my-answer .answer-content {
  color: #222;
}

.correct-answer .answer-content {
  color: #13c26b;
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
</style>
