<!-- 待完善题目作答功能 和ai助教功能-->
<template>
  <div class="knowledge-detail-container">
    <!-- 左侧内容区 -->
    <div class="content-area">
      <el-card class="knowledge-content-card">
        <div v-if="loading" class="loading-container">
          <el-skeleton :rows="10" animated />
        </div>
        
        <div v-else class="knowledge-content">
          <div class="knowledge-header">
            <h2>{{ knowledgeName }}</h2>
            <div class="knowledge-meta">
              <span class="course-name">{{ courseName }}</span>
            </div>
          </div>
          
          <!-- 知识点内容 -->
          <div class="knowledge-description-container">
            <div v-if="knowledgeDescription" class="knowledge-description">
              <p class="truncated-description" v-html="formattedDescription"></p>
            </div>
            <div v-else class="empty-description">
              <el-empty description="暂无知识点内容" />
            </div>
          </div>
          
          <!-- 学习完成按钮 -->
          <div class="learning-actions">
            <el-button type="primary" @click="markAsCompleted" :disabled="isCompleted">
              {{ isCompleted ? '已完成学习' : '标记为已学习' }}
            </el-button>
            <el-button v-if="isCompleted" type="warning" @click="resetLearningStatus">
              重置学习状态
            </el-button>
          </div>
          
          <!-- 文件管理模块 -->
          <div class="detail-card files-card">
            <div class="card-header">
              <div class="header-left">
                <h3><el-icon><Folder /></el-icon> 相关文件</h3>
                <span class="file-count" v-if="!filesLoading && files.length > 0">{{ files.length }} 个文件</span>
              </div>
              <div class="header-actions">
                <el-input
                  v-model="fileSearchPrefix"
                  placeholder="搜索文件..."
                  style="width: 180px;"
                  clearable
                  @keyup.enter="searchFiles"
                >
                  <template #prefix>
                    <el-icon><Search /></el-icon>
                  </template>
                </el-input>
                <el-button type="primary" size="small" @click="searchFiles">
                  搜索
                </el-button>
                <el-button type="default" size="small" @click="refreshFiles">
                  <el-icon><Refresh /></el-icon>
                </el-button>
              </div>
            </div>
            
            <!-- 文件分类筛选 -->
            <div class="file-categories" v-if="files.length > 0">
              <el-radio-group v-model="selectedCategory" @change="filterByCategory" size="small">
                <el-radio-button label="">全部</el-radio-button>
                <el-radio-button 
                  v-for="category in fileCategories" 
                  :key="category" 
                  :label="category"
                >
                  {{ category }}
                </el-radio-button>
              </el-radio-group>
            </div>
            
            <div class="card-body">
              <div v-if="filesLoading" class="loading-container">
                <el-skeleton :rows="3" animated />
              </div>
              <div v-else-if="files.length === 0" class="empty-content">
                <el-empty description="暂无相关文件" :image-size="80">
                  <template #image>
                    <el-icon style="font-size: 40px; color: #c0c4cc;"><Folder /></el-icon>
                  </template>
                  <el-button type="primary" size="small" @click="refreshFiles">刷新文件列表</el-button>
                </el-empty>
              </div>
              <div v-else class="files-list">
                <div class="files-grid">
                  <div 
                    v-for="file in files" 
                    :key="file.name" 
                    class="file-item"
                    @click="previewFile(file.name)"
                  >
                    <div class="file-icon">
                      <el-icon>
                        <component :is="getFileIcon(file.name)" />
                      </el-icon>
                    </div>
                    <div class="file-info">
                      <div class="file-name" :title="file.name">{{ file.name }}</div>
                      <div class="file-category">
                        <el-tag size="small" type="info" effect="plain">{{ getFileCategory(file.name) }}</el-tag>
                      </div>
                    </div>
                    <div class="file-actions">
                      <el-button 
                        link 
                        type="primary" 
                        size="small" 
                        @click.stop="previewFile(file.name)"
                        title="预览文件"
                      >
                        <el-icon><View /></el-icon>
                      </el-button>
                      <el-button 
                        link 
                        type="success" 
                        size="small" 
                        @click.stop="downloadFile(file.name)"
                        title="下载文件"
                      >
                        <el-icon><Download /></el-icon>
                      </el-button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
          
          <!-- 题目部分暂时注释掉 -->
          <!--
          <div v-if="questions.length === 0" class="empty-container">
            <el-empty description="暂无题目" />
          </div>
          
          <div v-else class="questions-container">
            <div class="question-section-header">
              <h3>相关习题 ({{ questions.length }})</h3>
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
              
              <div v-if="!answeredQuestions[question.questionId]">
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
                
                <div v-else-if="question.questionType === 'ESSAY_QUESTION'" class="question-options">
                  <el-input
                    v-model="userAnswers[question.questionId]"
                    type="textarea"
                    :rows="4"
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
              
              <div v-else class="answer-section">
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
                
                <div class="correct-answer answer-animation" :style="{ animationDelay: '0.2s' }">
                  <span class="answer-label">正确答案: </span>
                  <span class="answer-content">{{ question.referenceAnswer }}</span>
                </div>
                
                <div class="answer-analysis answer-animation" v-if="question.analysis" :style="{ animationDelay: '0.4s' }">
                  <span class="answer-label">解析: </span>
                  <span class="answer-content">{{ question.analysis }}</span>
                </div>
              </div>
            </div>
            
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
          -->
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
          <!-- 清除所有学习状态按钮 -->
          <div class="catalog-actions" v-if="completedTaskCount > 0">
            <el-button type="danger" size="small" @click="clearAllLearningStatus">
              清除所有学习状态
            </el-button>
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
                <el-tag v-if="data.knowledgeId === currentKnowledgeId" size="small" type="primary">当前</el-tag>
                <el-tag v-else-if="data.completed" size="small" type="success">已学</el-tag>
              </div>
            </template>
          </el-tree>
          
          <el-skeleton v-else-if="catalogLoading" :rows="8" animated />
          <el-empty v-else description="暂无知识点" />
        </div>
      </el-card>
    </div>
  </div>
  
  <!-- 文件预览对话框 -->
  <el-dialog v-model="showFilePreview" title="文件预览" width="800px" :close-on-click-modal="false">
    <div v-if="previewLoading" class="preview-loading">
      <el-skeleton :rows="3" animated />
    </div>
    <div v-else-if="currentPreviewFile" class="preview-content">
      <div class="preview-header">
        <h4>{{ currentPreviewFile.name }}</h4>
        <div class="preview-actions">
          <el-button type="primary" size="small" @click="downloadFile(currentPreviewFile.name)">
            <el-icon><Download /></el-icon>下载
          </el-button>
        </div>
      </div>
      
      <div class="preview-body">
        <!-- 图片预览 -->
        <div v-if="currentPreviewFile.type === 'image'" class="image-preview">
          <img :src="currentPreviewFile.url" :alt="currentPreviewFile.name" class="preview-image" />
        </div>
        
        <!-- 文档预览 -->
        <div v-else-if="currentPreviewFile.type === 'document'" class="document-preview">
          <div class="document-info">
            <p>文档类型文件，请下载后查看</p>
            <el-button type="primary" @click="downloadFile(currentPreviewFile.name)">
              <el-icon><Download /></el-icon>下载文档
            </el-button>
          </div>
        </div>
        
        <!-- 其他类型文件 -->
        <div v-else class="other-preview">
          <div class="file-info">
            <p>此文件类型不支持在线预览</p>
            <el-button type="primary" @click="downloadFile(currentPreviewFile.name)">
              <el-icon><Download /></el-icon>下载文件
            </el-button>
          </div>
        </div>
      </div>
    </div>
  </el-dialog>
</template>

<script>
import { knowledgeAPI, learningProgressAPI } from '@/api/api';
import { BigNumber } from 'bignumber.js';
import { getUserInfo } from '@/utils/auth';
import { minioController } from '@/api/api';
import { Search, Refresh, Download, Folder, View, Document } from '@element-plus/icons-vue';

export default {
  name: 'StudentKnowledgeDetail',
  components: {
    Search,
    Refresh,
    Download,
    Folder,
    View,
    Document
  },
  data() {
    return {
      // 知识点信息
      knowledgeId: null,
      knowledgeName: '',
      knowledgeDescription: '',
      courseId: null,
      courseName: '',
      
      // 题目列表（暂时保留但不使用）
      questions: [],
      loading: true,
      
      // 学习状态
      isCompleted: false,
      
      // 学生信息
      studentId: null,
      
      // 目录相关
      knowledgePoints: [],
      catalogLoading: true,
      searchKeyword: '',
      currentKnowledgeId: '',
      
      // 文件管理
      files: [],
      filesLoading: true,
      fileSearchPrefix: '',
      selectedCategory: '',
      fileCategories: ['文档', '图片', '视频', '音频', '压缩包', '其他'],
      showFilePreview: false,
      previewLoading: true,
      currentPreviewFile: null,
      
      // 树形控件配置
      defaultProps: {
        children: 'children',
        label: 'name'
      }
    };
  },
  computed: {
    // 格式化知识点描述，将换行符转换为HTML换行标签
    formattedDescription() {
      if (!this.knowledgeDescription) return '';
      
      // 将换行符转换为<br>标签
      return this.knowledgeDescription
        .replace(/\n/g, '<br>')
        .replace(/\r/g, '')
        .replace(/\s{2,}/g, ' &nbsp;'); // 保留连续空格
    },
    
    // 计算总分（暂时保留但不使用）
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
          this.fetchKnowledgeDetail();
          
          // 重新加载学习状态
          this.updateCurrentKnowledgeStatus();
          
          // 更新所有知识点的完成状态
          this.refreshAllKnowledgePointsStatus();
        }
      },
      immediate: true
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
    this.fetchKnowledgeDetail();
    this.fetchKnowledgePoints();
    
    // 加载学习状态
    this.loadLearningStatus();
    
    // 获取文件列表
    this.fetchFiles();
  },
  methods: {
    // 获取知识点详情
    async fetchKnowledgeDetail() {
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
        
        // 获取知识点详情
        const response = await knowledgeAPI.getKnowledgeById(knowledgeIdParam);
        
        if (response) {
          this.knowledgeName = response.name || '未命名知识点';
          this.knowledgeDescription = response.description || '';
        } else {
          this.$message.error('获取知识点详情失败');
        }
      } catch (error) {
        console.error('获取知识点详情失败:', error);
        this.$message.error('获取知识点详情失败，请稍后再试');
      } finally {
        this.loading = false;
      }
    },
    
    // 获取课程知识点列表
    async fetchKnowledgePoints() {
      if (!this.courseId) return;
      
      this.catalogLoading = true;
      
      try {
        const response = await knowledgeAPI.getKnowledgeByCourseId(this.courseId);
        
        if (Array.isArray(response)) {
          // 添加completed属性
          this.knowledgePoints = response.map(point => ({
            ...point,
            completed: this.checkKnowledgeCompleted(point.knowledgeId)
          }));
          
          // 更新当前知识点的完成状态
          this.updateCurrentKnowledgeStatus();
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
    
    // 标记知识点为已学习
    async markAsCompleted() {
      if (!this.knowledgeId || !this.studentId) {
        this.$message.warning('无法标记学习状态，请确认您已登录');
        return;
      }

      try {
        // 尝试调用API更新掌握程度为100%
        await learningProgressAPI.updateMasteryLevel(
          this.studentId,
          this.knowledgeId,
          100
        );

        console.log('学习进度已成功保存到数据库');
        this.$message.success('已标记为学习完成！学习进度已保存');

      } catch (error) {
        console.warn('API保存学习进度失败，使用本地存储:', error);

        // 如果是404错误，说明API接口不存在，使用本地存储
        if (error.response && error.response.status === 404) {
          console.log('学习进度API接口暂不可用，使用本地存储模式');
          this.$message.success('已标记为学习完成！（本地保存）');
        } else {
          // 其他错误也使用本地存储作为备用方案
          console.log('使用本地存储作为备用方案');
          this.$message.success('已标记为学习完成！（本地保存）');
        }
      }

      // 无论API调用是否成功，都更新本地状态
      this.isCompleted = true;

      // 保存学习状态到本地存储（作为备份或主要存储）
      this.saveLearningStatus();

      // 刷新所有知识点的状态
      this.refreshAllKnowledgePointsStatus();

      // 更新进度条
      this.$nextTick(() => {
        this.updateProgressBar();
      });
    },
    
    // 重置学习状态
    resetLearningStatus() {
      if (!this.studentId || !this.knowledgeId) {
        this.$message.warning('无法重置学习状态，请确认您已登录');
        return;
      }

      this.$confirm('确定要重置此知识点的学习状态吗？这将清除您已完成的标记。', '提示', {
        confirmButtonText: '确定',
        cancelButtonText: '取消',
        type: 'warning'
      }).then(async () => {
        try {
          // 尝试调用API重置掌握程度为0%
          await learningProgressAPI.updateMasteryLevel(
            this.studentId,
            this.knowledgeId,
            0
          );

          console.log('学习进度已成功从数据库重置');
          this.$message.success('学习状态已重置！');

        } catch (error) {
          console.warn('API重置学习进度失败，使用本地存储:', error);

          // 如果是404错误或其他错误，使用本地存储
          if (error.response && error.response.status === 404) {
            console.log('学习进度API接口暂不可用，使用本地存储模式');
          } else {
            console.log('使用本地存储作为备用方案');
          }
          this.$message.success('学习状态已重置！（本地重置）');
        }

        // 无论API调用是否成功，都更新本地状态
        this.isCompleted = false;
        this.removeFromCompletedList(); // 从已完成列表中移除

        // 刷新所有知识点的状态
        this.refreshAllKnowledgePointsStatus();

        this.$nextTick(() => {
          this.updateProgressBar();
        });
      }).catch(() => {
        // 取消操作
      });
    },
    
    // 从已完成列表中移除知识点
    removeFromCompletedList() {
      if (!this.studentId || !this.knowledgeId) return;
      
      const storageKey = `knowledge_completed_${this.studentId}`;
      try {
        const completedData = localStorage.getItem(storageKey);
        if (completedData) {
          let completedList = JSON.parse(completedData);
          const knowledgeIdStr = String(this.knowledgeId);
          
          // 过滤掉当前知识点
          completedList = completedList.filter(id => String(id) !== knowledgeIdStr);
          
          // 更新本地存储
          localStorage.setItem(storageKey, JSON.stringify(completedList));
        }
      } catch (e) {
        console.error('移除学习状态失败:', e);
      }
    },
    
    // 更新知识点列表中的状态
    updateKnowledgePointStatus(knowledgeId, completed) {
      // 确保使用字符串进行比较
      const knowledgeIdStr = String(knowledgeId);
      
      // 查找对应的知识点
      const index = this.knowledgePoints.findIndex(kp => String(kp.knowledgeId) === knowledgeIdStr);
      
      if (index !== -1) {
        // 使用数组替换方式更新，而不是使用this.$set
        const updatedPoint = { ...this.knowledgePoints[index], completed };
        this.knowledgePoints.splice(index, 1, updatedPoint);
      }
    },
    
    // 更新当前知识点的完成状态
    updateCurrentKnowledgeStatus() {
      this.isCompleted = this.checkKnowledgeCompleted(this.knowledgeId);
    },
    
    // 检查知识点是否已完成
    checkKnowledgeCompleted(knowledgeId) {
      if (!this.studentId || !knowledgeId) return false;
      
      const storageKey = `knowledge_completed_${this.studentId}`;
      try {
        const completedData = localStorage.getItem(storageKey);
        if (completedData) {
          const completedList = JSON.parse(completedData);
          // 确保比较时使用字符串格式
          const knowledgeIdStr = String(knowledgeId);
          return completedList.some(id => String(id) === knowledgeIdStr);
        }
      } catch (e) {
        console.error('读取学习状态失败:', e);
      }
      return false;
    },
    
    // 保存学习状态到本地存储
    saveLearningStatus() {
      if (!this.studentId || !this.knowledgeId) return;
      
      const storageKey = `knowledge_completed_${this.studentId}`;
      try {
        let completedList = [];
        const completedData = localStorage.getItem(storageKey);
        
        if (completedData) {
          completedList = JSON.parse(completedData);
        }
        
        // 转换为字符串进行比较
        const knowledgeIdStr = String(this.knowledgeId);
        
        // 如果不存在则添加
        if (!completedList.some(id => String(id) === knowledgeIdStr)) {
          completedList.push(knowledgeIdStr); // 存储为字符串格式
          localStorage.setItem(storageKey, JSON.stringify(completedList));
        }
      } catch (e) {
        console.error('保存学习状态失败:', e);
      }
    },
    
    // 加载学习状态
    async loadLearningStatus() {
      try {
        // 首先尝试从数据库获取学习进度
        await this.loadLearningProgressFromDatabase();
      } catch (error) {
        console.error('从数据库加载学习进度失败:', error);
        // 如果数据库加载失败，回退到本地存储
        this.updateCurrentKnowledgeStatus();
      }
    },

    // 从数据库加载学习进度
    async loadLearningProgressFromDatabase() {
      if (!this.studentId || !this.knowledgeId) {
        return;
      }

      try {
        // 尝试获取当前知识点的学习进度
        const progress = await learningProgressAPI.getStudentKnowledgeProgress(
          this.studentId,
          this.knowledgeId
        );

        console.log('成功从数据库加载学习进度:', progress);

        // 根据掌握程度判断是否完成（80%以上认为完成）
        if (progress && progress.masteryLevel >= 80) {
          this.isCompleted = true;
        } else {
          this.isCompleted = false;
        }

        // 同步到本地存储作为备份
        if (this.isCompleted) {
          this.saveLearningStatus();
        } else {
          this.removeFromCompletedList();
        }

      } catch (error) {
        // 如果API调用失败，使用本地存储的数据
        console.warn('获取数据库学习进度失败，使用本地存储:', error);

        if (error.response && error.response.status === 404) {
          console.log('学习进度API接口暂不可用，使用本地存储模式');
        } else {
          console.log('API调用失败，回退到本地存储');
        }

        // 使用本地存储的学习状态
        this.updateCurrentKnowledgeStatus();
      }
    },
    
    // 刷新所有知识点的完成状态
    refreshAllKnowledgePointsStatus() {
      if (!this.knowledgePoints || this.knowledgePoints.length === 0) return;
      
      // 更新每个知识点的完成状态
      this.knowledgePoints = this.knowledgePoints.map(point => ({
        ...point,
        completed: this.checkKnowledgeCompleted(point.knowledgeId)
      }));
    },
    
    // 更新进度条
    updateProgressBar() {
      // 重新计算已完成任务点数
      // 这里可以添加更新后端进度的逻辑
    },

    // 清除所有学习状态
    clearAllLearningStatus() {
      if (!this.studentId) {
        this.$message.warning('无法清除学习状态，请确认您已登录');
        return;
      }

      this.$confirm('确定要清除所有学习状态吗？这将删除您已完成的所有知识点标记。', '提示', {
        confirmButtonText: '确定',
        cancelButtonText: '取消',
        type: 'warning'
      }).then(() => {
        // 清除本地存储
        localStorage.removeItem(`knowledge_completed_${this.studentId}`);
        
        // 更新当前知识点状态
        this.isCompleted = false;
        
        // 刷新所有知识点的状态
        this.refreshAllKnowledgePointsStatus();
        
        this.$message.success('所有学习状态已清除！');
        this.$nextTick(() => {
          this.updateProgressBar();
        });
      }).catch(() => {
        // 取消操作
      });
    },
    
    // 文件管理相关方法
    async fetchFiles() {
      this.filesLoading = true;
      try {
        // 调用API获取文件列表
        const fileNames = await minioController.listFiles(this.fileSearchPrefix);
        
        // 将文件名转换为文件对象格式
        const fileObjects = fileNames.map(fileName => ({
          name: fileName,
          url: '#', // 实际项目中应该使用真实的文件URL
          type: this.getFileExtension(fileName)
        }));
        
        // 根据分类筛选文件
        if (this.selectedCategory) {
          this.files = fileObjects.filter(file => this.getFileCategory(file.name) === this.selectedCategory);
        } else {
          this.files = fileObjects;
        }
      } catch (error) {
        console.error('获取文件列表失败:', error);
        this.$message.error('获取文件列表失败，请稍后再试');
        this.files = [];
      } finally {
        this.filesLoading = false;
      }
    },

    searchFiles() {
      this.fetchFiles();
    },

    refreshFiles() {
      this.fileSearchPrefix = '';
      this.selectedCategory = '';
      this.fetchFiles();
    },

    filterByCategory() {
      this.fetchFiles();
    },

    getFileIcon(fileName) {
      // 添加类型检查
      if (!fileName || typeof fileName !== 'string') {
        return 'Document';
      }
      
      const category = this.getFileCategory(fileName);
      const iconMap = {
        '文档': 'Document',
        '图片': 'View',
        '视频': 'View',
        '音频': 'View',
        '压缩包': 'Folder',
        '其他': 'Document'
      };
      return iconMap[category] || 'Document';
    },

    getFileCategory(fileName) {
      // 添加类型检查和默认值处理
      if (!fileName || typeof fileName !== 'string') {
        return '其他';
      }
      
      const extension = fileName.split('.').pop()?.toLowerCase();
      
      if (['doc', 'docx', 'pdf', 'txt', 'rtf', 'odt', 'xls', 'xlsx', 'ppt', 'pptx'].includes(extension)) {
        return '文档';
      } else if (['jpg', 'jpeg', 'png', 'gif', 'bmp', 'svg', 'webp'].includes(extension)) {
        return '图片';
      } else if (['mp4', 'avi', 'mov', 'wmv', 'flv', 'webm'].includes(extension)) {
        return '视频';
      } else if (['mp3', 'wav', 'flac', 'aac', 'ogg'].includes(extension)) {
        return '音频';
      } else if (['zip', 'rar', '7z', 'tar', 'gz'].includes(extension)) {
        return '压缩包';
      } else {
        return '其他';
      }
    },

    getFileExtension(fileName) {
      if (!fileName || typeof fileName !== 'string') {
        return '';
      }
      return fileName.split('.').pop()?.toLowerCase() || '';
    },

    previewFile(fileName) {
      try {
        // 添加类型检查
        if (!fileName || typeof fileName !== 'string') {
          this.$message.error('文件名无效');
          return;
        }
        
        this.previewLoading = true;
        this.currentPreviewFile = { name: fileName };
        this.showFilePreview = true;
        
        // 根据文件类型决定预览方式
        const category = this.getFileCategory(fileName);
        if (category === '图片') {
          // 图片直接预览
          this.currentPreviewFile = { 
            name: fileName, 
            url: '#', // 实际项目中应该是真实的图片URL
            type: 'image' 
          };
        } else if (category === '文档') {
          // 文档类型尝试在线预览
          this.currentPreviewFile = { 
            name: fileName, 
            url: '#', // 实际项目中应该是真实的文档URL
            type: 'document' 
          };
        } else {
          // 其他类型显示下载链接
          this.currentPreviewFile = { 
            name: fileName, 
            type: 'other' 
          };
        }
      } catch (error) {
        console.error('预览文件失败:', error);
        this.$message.error('预览文件失败: ' + (error.message || '请稍后重试'));
      } finally {
        this.previewLoading = false;
      }
    },

    async downloadFile(fileName) {
      try {
        // 添加类型检查
        if (!fileName || typeof fileName !== 'string') {
          this.$message.error('文件名无效');
          return;
        }
        
        // 显示下载中提示
        this.$message.info(`正在获取下载链接: ${fileName}`);
        
        // 调用API获取预签名下载URL
        const response = await minioController.generateDownloadUrl(fileName);
        
        console.log('下载API响应:', response); // 调试信息
        
        let downloadUrl = null;
        
        // 处理不同的响应格式
        if (typeof response === 'string') {
          // 如果直接返回URL字符串
          downloadUrl = response;
        } else if (response && typeof response === 'object') {
          // 如果返回对象，尝试不同的属性名
          downloadUrl = response.url || response.downloadUrl || response.download_url || response.fileUrl || response.file_url;
        }
        
        if (downloadUrl && typeof downloadUrl === 'string' && downloadUrl.startsWith('http')) {
          // 验证URL格式
          try {
            new URL(downloadUrl); // 验证URL是否有效
            
            // 直接访问预签名URL进行下载
            const link = document.createElement('a');
            link.href = downloadUrl;
            link.download = fileName;
            link.target = '_blank'; // 在新标签页打开，避免页面跳转
            
            // 添加到DOM并触发点击
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            
            this.$message.success(`开始下载文件: ${fileName}`);
            
            // 记录下载日志
            console.log(`文件下载成功: ${fileName}, URL: ${downloadUrl}`);
          } catch (urlError) {
            console.error('URL格式无效:', urlError);
            this.$message.error('下载链接格式无效，请稍后重试');
          }
        } else {
          // 响应格式错误
          this.$message.error('无法获取有效的下载链接，请稍后重试');
          console.error('下载URL响应格式错误:', response);
          console.error('期望的响应格式应该是包含URL的对象或直接的URL字符串');
        }
      } catch (error) {
        console.error('下载文件失败:', error);
        
        // 根据错误类型显示不同的错误信息
        if (error.response) {
          if (error.response.status === 404) {
            this.$message.error('文件不存在或已被删除');
          } else if (error.response.status === 403) {
            this.$message.error('没有权限下载此文件');
          } else {
            this.$message.error(`下载失败: ${error.response.data?.message || '服务器错误'}`);
          }
        } else if (error.request) {
          this.$message.error('网络连接失败，请检查网络设置');
        } else {
          this.$message.error('下载文件失败: ' + (error.message || '请稍后重试'));
        }
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

.knowledge-content-card {
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
  font-size: 24px;
}

.knowledge-meta {
  display: flex;
  gap: 20px;
  color: #606266;
  font-size: 14px;
}

.course-name {
  color: #409EFF;
  font-weight: 500;
}

/* 知识点内容样式 */
.knowledge-description-container {
  margin-bottom: 30px;
  padding: 20px;
  background-color: #fff;
  border-radius: 8px;
  box-shadow: 0 2px 12px 0 rgba(0, 0, 0, 0.05);
}

.knowledge-description {
  font-size: 16px;
  line-height: 1.8;
  color: #333;
  text-align: justify;
}

.truncated-description {
  margin-bottom: 16px;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  max-width: 100%;
}

.empty-description {
  padding: 40px 0;
  text-align: center;
}

.learning-actions {
  margin-top: 30px;
  display: flex;
  justify-content: center;
  gap: 15px; /* 按钮之间的间距 */
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

.catalog-actions {
  margin-top: 15px;
  display: flex;
  justify-content: center;
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

/* 文件管理模块样式 */
.detail-card {
  margin-top: 20px;
  padding: 24px;
  background-color: #fff;
  border-radius: 12px;
  box-shadow: 0 2px 20px 0 rgba(0, 0, 0, 0.08);
  border: 1px solid #f0f0f0;
}

.files-card .card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
  padding-bottom: 16px;
  border-bottom: 1px solid #f0f0f0;
}

.files-card .header-left {
  display: flex;
  align-items: center;
  gap: 12px;
}

.files-card .header-left h3 {
  margin: 0;
  color: #1a1a1a;
  font-size: 18px;
  font-weight: 600;
  display: flex;
  align-items: center;
  gap: 8px;
}

.files-card .header-left h3 .el-icon {
  color: #409EFF;
  font-size: 20px;
}

.file-count {
  font-size: 14px;
  color: #8c8c8c;
  background-color: #f5f5f5;
  padding: 4px 12px;
  border-radius: 16px;
  font-weight: 500;
}

.files-card .header-actions {
  display: flex;
  align-items: center;
  gap: 12px;
}

.file-categories {
  margin-bottom: 20px;
  padding-bottom: 16px;
  border-bottom: 1px solid #f0f0f0;
}

.file-categories .el-radio-group {
  display: flex;
  gap: 8px;
}

.file-categories .el-radio-button {
  border-radius: 20px;
  padding: 0 16px;
  height: 32px;
  line-height: 30px;
  border: 1px solid #d9d9d9;
  transition: all 0.3s ease;
}

.file-categories .el-radio-button:hover {
  border-color: #409EFF;
  color: #409EFF;
}

.file-categories .el-radio-button.is-active {
  background-color: #409EFF;
  color: #fff;
  border-color: #409EFF;
  box-shadow: 0 2px 8px 0 rgba(64, 158, 255, 0.3);
}

.files-list {
  display: flex;
  flex-direction: column;
}

.files-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
  gap: 16px;
}

.file-item {
  display: flex;
  align-items: center;
  padding: 16px;
  background-color: #fafafa;
  border-radius: 10px;
  border: 1px solid #f0f0f0;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  cursor: pointer;
  position: relative;
  overflow: hidden;
}

.file-item::before {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  height: 3px;
  background: linear-gradient(90deg, #409EFF, #67C23A);
  transform: scaleX(0);
  transition: transform 0.3s ease;
}

.file-item:hover {
  background-color: #fff;
  border-color: #409EFF;
  box-shadow: 0 4px 20px 0 rgba(64, 158, 255, 0.15);
  transform: translateY(-2px);
}

.file-item:hover::before {
  transform: scaleX(1);
}

.file-icon {
  font-size: 32px;
  color: #409EFF;
  margin-right: 16px;
  flex-shrink: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  width: 48px;
  height: 48px;
  background-color: rgba(64, 158, 255, 0.1);
  border-radius: 12px;
}

.file-info {
  flex: 1;
  display: flex;
  flex-direction: column;
  justify-content: center;
  min-width: 0;
}

.file-name {
  font-size: 14px;
  color: #1a1a1a;
  text-align: left;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  width: 100%;
  font-weight: 500;
  margin-bottom: 6px;
}

.file-category {
  display: flex;
  align-items: center;
}

.file-category .el-tag {
  border-radius: 12px;
  font-size: 11px;
  padding: 2px 8px;
  height: 20px;
  line-height: 16px;
}

.file-actions {
  margin-left: 12px;
  display: flex;
  gap: 4px;
  opacity: 0.7;
  transition: opacity 0.3s ease;
}

.file-item:hover .file-actions {
  opacity: 1;
}

.file-actions .el-button {
  padding: 6px;
  font-size: 14px;
  border-radius: 8px;
  transition: all 0.3s ease;
}

.file-actions .el-button:hover {
  background-color: rgba(64, 158, 255, 0.1);
  transform: scale(1.1);
}

/* 文件预览对话框样式 */
.preview-loading {
  display: flex;
  justify-content: center;
  align-items: center;
  min-height: 300px;
}

.preview-content {
  display: flex;
  flex-direction: column;
  height: 100%;
}

.preview-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 15px;
  padding-bottom: 10px;
  border-bottom: 1px solid #ebeef5;
}

.preview-header h4 {
  margin: 0;
  color: #303133;
}

.preview-actions {
  display: flex;
  gap: 10px;
}

.preview-body {
  flex: 1;
  display: flex;
  justify-content: center;
  align-items: center;
  background-color: #f7f8fa;
  border-radius: 6px;
  overflow: hidden;
}

.image-preview {
  display: flex;
  justify-content: center;
  align-items: center;
  width: 100%;
  height: 100%;
}

.image-preview .preview-image {
  max-width: 100%;
  max-height: 100%;
  object-fit: contain;
}

.document-preview {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 20px;
  text-align: center;
}

.document-info p {
  margin-bottom: 15px;
  color: #606266;
}

.other-preview {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 20px;
  text-align: center;
}

.file-info p {
  margin-bottom: 15px;
  color: #606266;
}

/* 空状态优化 */
.empty-content {
  padding: 40px 20px;
  text-align: center;
}

.empty-content .el-empty__description {
  color: #8c8c8c;
  font-size: 14px;
}

/* 加载状态优化 */
.loading-container {
  padding: 20px;
}

/* 响应式设计 */
@media (max-width: 768px) {
  .files-grid {
    grid-template-columns: 1fr;
  }
  
  .files-card .card-header {
    flex-direction: column;
    align-items: flex-start;
    gap: 16px;
  }
  
  .files-card .header-actions {
    width: 100%;
    justify-content: space-between;
  }
  
  .file-item {
    padding: 12px;
  }
  
  .file-icon {
    width: 40px;
    height: 40px;
    font-size: 24px;
    margin-right: 12px;
  }
}
</style>
