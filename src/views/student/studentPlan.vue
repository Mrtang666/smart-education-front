<template>
  <div class="student-plan-container">
    <el-tabs v-model="activeTab">
      <el-tab-pane label="当前学习计划" name="current">
        <div v-if="currentPlan" class="plan-details">
          <h2 class="section-title">学习计划: {{ currentPlan.planId }}</h2>
          <div class="plan-info">
            <p><strong>目标：</strong>{{ currentPlan.targetGoal }}</p>
            <p><strong>时间范围：</strong>{{ currentPlan.timeFrame }}天</p>
            <p><strong>创建日期：</strong>{{ formatDate(currentPlan.createdAt) }}</p>
            <p><strong>完成进度：</strong>{{ currentPlan.progress || 0 }}%</p>
            <el-progress :percentage="currentPlan.progress || 0" :status="getProgressStatus(currentPlan.progress || 0)"></el-progress>
          </div>
          
          <div class="daily-section">
            <div class="section-header">
              <h3 class="section-title">今日学习任务</h3>
              <div class="date-selector">
                <el-date-picker
                  v-model="selectedDate"
                  type="date"
                  placeholder="选择日期"
                  format="YYYY-MM-DD"
                  value-format="YYYY-MM-DD"
                  @change="fetchActivitiesByDate"
                  size="small"
                />
                <el-button size="small" @click="goToToday">今天</el-button>
              </div>
            </div>

            <div v-if="loadingStates.dailyActivities" class="loading-container">
              <el-skeleton :rows="2" animated />
            </div>

            <el-empty v-else-if="!todayActivities || todayActivities.length === 0" description="暂无学习任务">
              <template #description>
                <span v-if="selectedDate">{{ selectedDate }} 暂无学习任务</span>
                <span v-else>今日暂无学习任务</span>
              </template>
            </el-empty>

            <div v-else class="daily-activities">
              <el-timeline>
                <el-timeline-item
                  v-for="activity in todayActivities"
                  :key="activity.activityId"
                  :type="getStatusType(activity.status)"
                >
                  <el-card class="activity-card">
                    <div class="activity-header">
                      <h4>{{ activity.title }}</h4>
                      <el-tag :type="getActivityTypeTag(activity.type)">{{ getActivityTypeText(activity.type) }}</el-tag>
                    </div>
                    <p>{{ activity.description }}</p>
                    <div class="activity-meta">
                      <p v-if="activity.duration"><strong>预计用时：</strong>{{ activity.duration }}分钟</p>
                      <p v-if="activity.difficulty"><strong>难度：</strong>{{ activity.difficulty }}</p>
                      <p v-if="activity.priority"><strong>优先级：</strong>{{ activity.priority }}</p>
                    </div>
                    <el-tag :type="getStatusTagType(activity.status)">{{ getStatusText(activity.status) }}</el-tag>

                    <div class="activity-actions" v-if="activity.status !== 'completed'">
                      <el-button
                        type="primary"
                        size="small"
                        @click="updateActivityStatus(activity.activityId, 'completed')"
                      >
                        标记为已完成
                      </el-button>
                      <el-button
                        v-if="activity.status === 'pending'"
                        type="warning"
                        size="small"
                        @click="updateActivityStatus(activity.activityId, 'in_progress')"
                      >
                        开始学习
                      </el-button>
                    </div>
                  </el-card>
                </el-timeline-item>
              </el-timeline>
            </div>
          </div>
          
          <h3 class="section-title">推荐学习资源</h3>
          <el-empty v-if="!recommendedResources || recommendedResources.length === 0" description="暂无推荐资源"></el-empty>
          <div v-else class="resources-list">
            <el-card v-for="resource in recommendedResources" :key="resource.resourceId" class="resource-card">
              <h4>{{ resource.title }}</h4>
              <p>{{ resource.description }}</p>
              <p><strong>类型：</strong>{{ resource.resourceType }}</p>
              <el-button type="primary" size="small" @click="openResource(resource.url)">查看资源</el-button>
            </el-card>
          </div>
        </div>
        
        <el-empty v-else description="暂无当前学习计划">
          <el-button type="primary" @click="activeTab = 'create'">创建学习计划</el-button>
        </el-empty>
      </el-tab-pane>
      
      <el-tab-pane label="创建学习计划" name="create">
        <el-form ref="planForm" :model="newPlan" :rules="planFormRules" label-width="120px" class="plan-form">
          <el-form-item label="学习目标" prop="targetGoal">
            <el-input
              v-model="newPlan.targetGoal"
              type="textarea"
              placeholder="请输入您的学习目标（10-200字符）"
              :rows="3"
              maxlength="200"
              show-word-limit
            ></el-input>
          </el-form-item>

          <el-form-item label="时间范围(天)" prop="timeFrame">
            <el-input-number
              v-model="newPlan.timeFrame"
              :min="1"
              :max="90"
              placeholder="请选择学习时间范围"
            ></el-input-number>
          </el-form-item>
          
          <el-form-item label="选择课程">
            <el-select
              v-model="newPlan.courseNames"
              multiple
              filterable
              placeholder="选择课程（可多选）"
              @change="handleCourseChange"
            >
              <el-option
                v-for="course in courses"
                :key="course.id"
                :label="course.name"
                :value="course.name"
              ></el-option>
            </el-select>
          </el-form-item>
          
          <el-form-item label="选择知识点">
            <el-select
              v-model="newPlan.knowledgeNames"
              multiple
              filterable
              placeholder="选择知识点（可多选）"
              :loading="knowledgeLoading"
            >
              <el-option
                v-for="knowledge in knowledgePoints"
                :key="knowledge.knowledgeId"
                :label="knowledge.name"
                :value="knowledge.name"
              ></el-option>
            </el-select>
          </el-form-item>
          
          <el-form-item>
            <el-button type="primary" @click="generatePlan" :loading="loading">生成学习计划</el-button>
            <el-button @click="resetForm">重置</el-button>
          </el-form-item>
        </el-form>
      </el-tab-pane>
      
      <el-tab-pane label="历史学习计划" name="history">
        <el-empty v-if="!planHistory || planHistory.length === 0" description="暂无历史学习计划"></el-empty>
        <div v-else class="history-list">
          <el-card v-for="plan in planHistory" :key="plan.planId" class="history-card">
            <h3>{{ plan.planName }}</h3>
            <p><strong>目标：</strong>{{ plan.targetGoal }}</p>
            <p><strong>时间范围：</strong>{{ plan.timeFrame }}天</p>
            <p><strong>开始日期：</strong>{{ formatDate(plan.startDate) }}</p>
            <p><strong>结束日期：</strong>{{ formatDate(plan.endDate) }}</p>
            <p><strong>完成进度：</strong>{{ plan.completionRate || 0 }}%</p>
            <el-progress :percentage="plan.completionRate || 0"></el-progress>
            <el-button type="primary" size="small" @click="viewPlanDetails(plan)">查看详情</el-button>
          </el-card>
        </div>
      </el-tab-pane>
      
      <el-tab-pane label="搜索资源" name="search">
        <div class="search-container">
          <div class="search-options">
            <el-radio-group v-model="searchType" class="search-type-group">
              <el-radio value="keyword">关键词搜索</el-radio>
              <el-radio value="planName">按计划名称</el-radio>
            </el-radio-group>
          </div>

          <el-input
            v-model="searchKeyword"
            :placeholder="searchType === 'keyword' ? '输入关键词搜索学习资源' : '输入学习计划名称'"
            class="search-input"
            @keyup.enter="searchResources"
          >
            <template #append>
              <el-button @click="searchResources" :loading="loadingStates.search">
                {{ searchType === 'keyword' ? '搜索' : '查找' }}
              </el-button>
            </template>
          </el-input>

          <div v-if="loadingStates.search" class="loading-container">
            <el-skeleton :rows="3" animated />
          </div>

          <el-empty v-else-if="!searchResults || searchResults.length === 0" description="暂无搜索结果">
            <template #description>
              <span v-if="searchKeyword">没有找到与"{{ searchKeyword }}"相关的资源</span>
              <span v-else>请输入搜索内容</span>
            </template>
          </el-empty>

          <div v-else class="search-results">
            <div class="results-header">
              <span class="results-count">找到 {{ searchResults.length }} 个相关资源</span>
            </div>
            <el-card v-for="resource in searchResults" :key="resource.resourceId" class="resource-card">
              <div class="resource-header">
                <h4>{{ resource.title }}</h4>
                <el-tag :type="getResourceTypeTag(resource.resourceType)">{{ resource.resourceType }}</el-tag>
              </div>
              <p class="resource-description">{{ resource.description }}</p>
              <div class="resource-meta">
                <p v-if="resource.courseName"><strong>相关课程：</strong>{{ resource.courseName }}</p>
                <p v-if="resource.difficulty"><strong>难度：</strong>{{ resource.difficulty }}</p>
                <p v-if="resource.duration"><strong>预计时长：</strong>{{ resource.duration }}分钟</p>
              </div>
              <div class="resource-actions">
                <el-button type="primary" size="small" @click="openResource(resource.url)">查看资源</el-button>
                <el-button v-if="resource.downloadUrl" type="success" size="small" @click="downloadResource(resource.downloadUrl)">下载</el-button>
              </div>
            </el-card>
          </div>
        </div>
      </el-tab-pane>
    </el-tabs>
    
    <el-dialog v-model="planDetailsVisible" title="计划详情" width="70%">
      <div v-if="selectedPlan" class="plan-details-dialog">
        <h2 class="section-title">{{ selectedPlan.planName }}</h2>
        <p><strong>目标：</strong>{{ selectedPlan.targetGoal }}</p>
        <p><strong>时间范围：</strong>{{ selectedPlan.timeFrame }}天</p>
        <p><strong>开始日期：</strong>{{ formatDate(selectedPlan.startDate) }}</p>
        <p><strong>结束日期：</strong>{{ formatDate(selectedPlan.endDate) }}</p>
        <p><strong>完成进度：</strong>{{ selectedPlan.completionRate || 0 }}%</p>
        
        <h3 class="section-title">学习活动</h3>
        <el-table :data="selectedPlan.activities || []" style="width: 100%">
          <el-table-column prop="title" label="活动名称"></el-table-column>
          <el-table-column prop="description" label="描述"></el-table-column>
          <el-table-column prop="scheduledDate" label="计划日期"></el-table-column>
          <el-table-column prop="status" label="状态">
            <template #default="scope">
              <el-tag :type="getStatusTagType(scope.row.status)">
                {{ getStatusText(scope.row.status) }}
              </el-tag>
            </template>
          </el-table-column>
        </el-table>
      </div>
    </el-dialog>
  </div>
</template>

<script>
import { ref, reactive, onMounted, computed, onBeforeUnmount } from 'vue';
import { learningPlanAPI, courseAPI, knowledgeAPI } from '@/api/api';
import { ElMessage } from 'element-plus';
import { getUserInfo } from '@/utils/auth';

export default {
  name: 'StudentPlan',
  setup() {
    const activeTab = ref('current');
    const currentPlan = ref(null);
    const recommendedResources = ref([]);
    const planHistory = ref([]);
    const courses = ref([]);
    const knowledgePoints = ref([]);
    const loading = ref(false);
    const knowledgeLoading = ref(false);

    // 细粒度加载状态
    const loadingStates = reactive({
      currentPlan: false,
      resources: false,
      history: false,
      search: false,
      courses: false,
      dailyActivities: false
    });
    
    // 从认证信息中获取当前学生ID
    const userInfo = getUserInfo();
    const studentId = ref(userInfo.studentId);

    // 错误重试机制
    const retryFetch = async (fetchFunction, maxRetries = 3, retryDelay = 1000) => {
      for (let i = 0; i < maxRetries; i++) {
        try {
          return await fetchFunction();
        } catch (error) {
          console.warn(`第${i + 1}次尝试失败:`, error.message);

          if (i === maxRetries - 1) {
            // 最后一次尝试失败，抛出错误
            throw error;
          }

          // 等待后重试，每次等待时间递增
          await new Promise(resolve => setTimeout(resolve, retryDelay * (i + 1)));
        }
      }
    };
    
    const searchKeyword = ref('');
    const searchResults = ref([]);
    const searchType = ref('keyword'); // 'keyword' 或 'planName'
    const planDetailsVisible = ref(false);
    const selectedPlan = ref(null);
    const selectedDate = ref(''); // 选择的日期
    
    // 计算当前是计划的第几天
    const currentDay = computed(() => {
      if (!currentPlan.value || !currentPlan.value.createdAt) return 1;

      const startDate = new Date(currentPlan.value.createdAt);
      const today = new Date();

      // 重置时间到当天开始，避免时间差异
      startDate.setHours(0, 0, 0, 0);
      today.setHours(0, 0, 0, 0);

      const diffTime = today.getTime() - startDate.getTime();
      const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24)) + 1; // +1 因为第一天是第1天

      // 确保天数在合理范围内
      const maxDays = currentPlan.value.timeFrame || 30;
      return Math.max(1, Math.min(diffDays, maxDays));
    });

    // 计算今日活动
    const todayActivities = computed(() => {
      if (!currentPlan.value || !currentPlan.value.dailyActivities) return [];

      // 查找当前天的活动
      const todayPlan = currentPlan.value.dailyActivities.find(day => day.day === currentDay.value);
      return todayPlan ? todayPlan.activities : [];
    });
    
    const newPlan = reactive({
      targetGoal: '',
      timeFrame: 14,
      courseNames: [],
      knowledgeNames: [],
      selectedCourseIds: []
    });

    // 表单验证规则
    const planFormRules = reactive({
      targetGoal: [
        { required: true, message: '请输入学习目标', trigger: 'blur' },
        { min: 10, max: 200, message: '学习目标长度应在10-200字符之间', trigger: 'blur' }
      ],
      timeFrame: [
        { required: true, message: '请选择时间范围', trigger: 'change' },
        { type: 'number', min: 1, max: 90, message: '时间范围应在1-90天之间', trigger: 'change' }
      ]
    });
    
    // 获取当前学习计划
    const fetchCurrentPlan = async () => {
      loadingStates.currentPlan = true;
      try {
        const response = await retryFetch(
          () => learningPlanAPI.getCurrentLearningPlan(studentId.value)
        );

        currentPlan.value = response;

        if (currentPlan.value) {
          // 获取推荐资源
          fetchRecommendedResources();
          // 获取今日学习活动
          fetchTodayActivities();
        }
      } catch (error) {
        console.error('获取当前学习计划失败:', error);
        ElMessage.error('获取当前学习计划失败，请检查网络连接后重试');
      } finally {
        loadingStates.currentPlan = false;
      }
    };

    // 获取今日学习活动
    const fetchTodayActivities = async () => {
      try {
        const today = new Date().toISOString().split('T')[0]; // YYYY-MM-DD格式
        const response = await learningPlanAPI.getDailyPlanActivities(studentId.value, today);

        // 如果当前计划存在，更新今日活动
        if (currentPlan.value && response) {
          // 将今日活动添加到当前计划中
          if (!currentPlan.value.dailyActivities) {
            currentPlan.value.dailyActivities = [];
          }

          // 查找或创建今日活动记录
          let todayRecord = currentPlan.value.dailyActivities.find(day => day.day === currentDay.value);
          if (!todayRecord) {
            todayRecord = { day: currentDay.value, activities: [] };
            currentPlan.value.dailyActivities.push(todayRecord);
          }

          // 更新今日活动
          todayRecord.activities = response;
        }
      } catch (error) {
        console.error('获取今日学习活动失败:', error);
        // 不显示错误消息，因为这不是关键功能
      }
    };
    
    // 获取推荐学习资源
    const fetchRecommendedResources = async () => {
      try {
        if (currentPlan.value && currentPlan.value.planId) {
          const response = await learningPlanAPI.getPlanRecommendedResources(currentPlan.value.planId);
          recommendedResources.value = response || [];
        } else {
          console.warn('无法获取推荐资源：当前计划不存在或没有planId');
          recommendedResources.value = [];
        }
      } catch (error) {
        console.error('获取推荐学习资源失败:', error);
        ElMessage.error('获取推荐学习资源失败');
        recommendedResources.value = [];
      }
    };
    
    // 获取历史学习计划
    const fetchPlanHistory = async () => {
      try {
        const response = await learningPlanAPI.getLearningPlanHistory(studentId.value);
        planHistory.value = response;
      } catch (error) {
        console.error('获取历史学习计划失败:', error);
        ElMessage.error('获取历史学习计划失败');
      }
    };
    
    // 获取所有课程
    const fetchCourses = async () => {
      try {
        const response = await courseAPI.getAllCourses();
        courses.value = response;
      } catch (error) {
        console.error('获取课程列表失败:', error);
        ElMessage.error('获取课程列表失败');
      }
    };
    
    // 处理课程选择变化
    const handleCourseChange = async (selectedCourseNames) => {
      if (!selectedCourseNames || selectedCourseNames.length === 0) {
        knowledgePoints.value = [];
        newPlan.knowledgeNames = [];
        return;
      }
      
      knowledgeLoading.value = true;
      try {
        // 清空已选知识点
        newPlan.knowledgeNames = [];
        
        // 找到选中课程的ID
        const selectedCourses = courses.value.filter(course => 
          selectedCourseNames.includes(course.name)
        );
        
        newPlan.selectedCourseIds = selectedCourses.map(course => course.id);
        
        // 获取所有选中课程的知识点
        const knowledgePromises = newPlan.selectedCourseIds.map(courseId => 
          knowledgeAPI.getKnowledgeByCourseId(courseId)
        );
        
        const knowledgeResults = await Promise.all(knowledgePromises);
        
        // 合并所有课程的知识点，并去重
        const allKnowledgePoints = [];
        knowledgeResults.forEach(result => {
          if (Array.isArray(result)) {
            result.forEach(knowledge => {
              // 检查是否已存在相同ID的知识点
              const exists = allKnowledgePoints.some(
                k => k.knowledgeId === knowledge.knowledgeId
              );
              
              if (!exists) {
                allKnowledgePoints.push(knowledge);
              }
            });
          }
        });
        
        knowledgePoints.value = allKnowledgePoints;
        
        if (knowledgePoints.value.length === 0) {
          ElMessage.info('所选课程暂无知识点');
        }
      } catch (error) {
        console.error('获取课程知识点失败:', error);
        ElMessage.error('获取课程知识点失败');
      } finally {
        knowledgeLoading.value = false;
      }
    };
    
    // 生成学习计划
    const generatePlan = async () => {
      // 表单验证
      const planFormRef = document.querySelector('.plan-form');
      if (planFormRef) {
        try {
          const isValid = await planFormRef.validate();
          if (!isValid) {
            ElMessage.warning('请检查表单填写是否正确');
            return;
          }
        } catch (error) {
          ElMessage.warning('请完善表单信息');
          return;
        }
      }

      // 基础验证
      if (!newPlan.targetGoal || newPlan.targetGoal.trim().length < 10) {
        ElMessage.warning('学习目标至少需要10个字符');
        return;
      }

      if (!newPlan.timeFrame || newPlan.timeFrame < 1 || newPlan.timeFrame > 90) {
        ElMessage.warning('时间范围应在1-90天之间');
        return;
      }

      if (!studentId.value) {
        ElMessage.error('无法获取学生ID，请重新登录');
        return;
      }
      
      loading.value = true;
      try {
        let response;
        
        if (newPlan.courseNames && newPlan.courseNames.length > 0) {
          // 通过课程名称生成计划
          response = await learningPlanAPI.generateLearningPlanByCourseName(
            studentId.value,
            newPlan.targetGoal,
            newPlan.timeFrame,
            newPlan.courseNames
          );
        } else if (newPlan.knowledgeNames && newPlan.knowledgeNames.length > 0) {
          // 通过知识点名称生成计划
          response = await learningPlanAPI.generateLearningPlanByKnowledgeName(
            studentId.value,
            newPlan.targetGoal,
            newPlan.timeFrame,
            newPlan.knowledgeNames
          );
        } else {
          // 直接生成计划
          response = await learningPlanAPI.generateLearningPlan(
            studentId.value,
            newPlan.targetGoal,
            newPlan.timeFrame
          );
        }
        
        if (response) {
          ElMessage.success('学习计划生成成功');
          resetForm();
          activeTab.value = 'current';
          await fetchCurrentPlan();
        } else {
          ElMessage.warning('学习计划生成成功，但服务器返回空数据');
          resetForm();
          activeTab.value = 'current';
          await fetchCurrentPlan();
        }
      } catch (error) {
        console.error('生成学习计划失败:', error);
        ElMessage.error('生成学习计划失败: ' + (error.message || '未知错误'));
      } finally {
        loading.value = false;
      }
    };
    
    // 重新计算学习计划进度
    const recalculateProgress = () => {
      if (!currentPlan.value?.dailyActivities) return;

      let totalActivities = 0;
      let completedActivities = 0;

      currentPlan.value.dailyActivities.forEach(day => {
        if (day.activities && Array.isArray(day.activities)) {
          day.activities.forEach(activity => {
            totalActivities++;
            if (activity.status === 'completed') {
              completedActivities++;
            }
          });
        }
      });

      const newProgress = totalActivities > 0
        ? Math.round((completedActivities / totalActivities) * 100)
        : 0;

      if (currentPlan.value.progress !== newProgress) {
        currentPlan.value.progress = newProgress;
        console.log(`进度已更新: ${newProgress}% (${completedActivities}/${totalActivities})`);
      }
    };

    // 重置表单
    const resetForm = () => {
      newPlan.targetGoal = '';
      newPlan.timeFrame = 14;
      newPlan.courseNames = [];
      newPlan.knowledgeNames = [];
      newPlan.selectedCourseIds = [];
      knowledgePoints.value = [];

      // 清除表单验证状态
      const planFormRef = document.querySelector('.plan-form');
      if (planFormRef && planFormRef.clearValidate) {
        planFormRef.clearValidate();
      }
    };
    
    // 更新活动状态
    const updateActivityStatus = async (activityId, status) => {
      try {
        if (!currentPlan.value || !currentPlan.value.planId) {
          ElMessage.warning('无法更新活动状态，当前没有活动的学习计划');
          return;
        }
        
        const response = await learningPlanAPI.updatePlanProgress({
          planId: currentPlan.value.planId,
          activityId,
          status
        });
        
        // 处理后端返回的响应数据
        if (response) {
          // 更新活动状态
          if (currentPlan.value.dailyActivities) {
            currentPlan.value.dailyActivities.forEach(dayPlan => {
              const activity = dayPlan.activities.find(act => act.activityId === activityId);
              if (activity) {
                activity.status = response.status || status;
                activity.updatedAt = response.updatedAt || new Date().toISOString();
              }
            });
          }

          // 重新计算进度
          recalculateProgress();

          // 如果后端返回了新的完成率，使用后端数据
          if (response.newCompletionRate !== undefined) {
            currentPlan.value.progress = response.newCompletionRate;
          }

          // 显示成功消息，包含最新的完成率
          ElMessage.success(`活动状态更新成功，当前完成进度: ${currentPlan.value.progress || 0}%`);
        } else {
          // 如果没有响应数据，仍然尝试更新本地状态
          if (currentPlan.value.dailyActivities) {
            currentPlan.value.dailyActivities.forEach(dayPlan => {
              const activity = dayPlan.activities.find(act => act.activityId === activityId);
              if (activity) {
                activity.status = status;
                activity.updatedAt = new Date().toISOString();
              }
            });
          }

          // 重新计算进度
          recalculateProgress();

          ElMessage.success(`活动状态已更新，当前完成进度: ${currentPlan.value.progress || 0}%`);
        }
      } catch (error) {
        console.error('更新活动状态失败:', error);
        ElMessage.error('更新活动状态失败');
        
        // 尝试在本地更新活动状态，即使API调用失败
        if (currentPlan.value && currentPlan.value.dailyActivities) {
          currentPlan.value.dailyActivities.forEach(dayPlan => {
            const activity = dayPlan.activities.find(act => act.activityId === activityId);
            if (activity) {
              activity.status = status;
            }
          });
        }
      }
    };
    
    // 搜索资源
    const searchResources = async () => {
      if (!searchKeyword.value) {
        ElMessage.warning(searchType.value === 'keyword' ? '请输入搜索关键词' : '请输入学习计划名称');
        return;
      }

      loadingStates.search = true;
      try {
        let response;

        if (searchType.value === 'planName') {
          // 按计划名称搜索资源
          response = await learningPlanAPI.getPlanResourcesByName(studentId.value, searchKeyword.value);
        } else {
          // 按关键词搜索资源
          response = await learningPlanAPI.searchPlanResources(studentId.value, searchKeyword.value);
        }

        searchResults.value = response || [];

        if (!response || searchResults.value.length === 0) {
          ElMessage.info(`没有找到与"${searchKeyword.value}"相关的资源`);
        } else {
          ElMessage.success(`找到 ${searchResults.value.length} 个相关资源`);
        }
      } catch (error) {
        console.error('搜索资源失败:', error);
        ElMessage.error('搜索资源失败: ' + (error.message || '未知错误'));
        searchResults.value = [];
      } finally {
        loadingStates.search = false;
      }
    };

    // 根据计划名称获取资源的功能已集成到searchResources中

    // 按日期获取学习活动
    const fetchActivitiesByDate = async (date) => {
      if (!date) return;

      loadingStates.dailyActivities = true;
      try {
        const response = await learningPlanAPI.getDailyPlanActivities(studentId.value, date);

        // 更新今日活动显示
        if (currentPlan.value) {
          if (!currentPlan.value.dailyActivities) {
            currentPlan.value.dailyActivities = [];
          }

          // 计算选择日期对应的天数
          const startDate = new Date(currentPlan.value.createdAt);
          const selectedDateObj = new Date(date);
          startDate.setHours(0, 0, 0, 0);
          selectedDateObj.setHours(0, 0, 0, 0);

          const diffTime = selectedDateObj.getTime() - startDate.getTime();
          const dayNumber = Math.floor(diffTime / (1000 * 60 * 60 * 24)) + 1;

          // 查找或创建对应日期的活动记录
          let dayRecord = currentPlan.value.dailyActivities.find(day => day.day === dayNumber);
          if (!dayRecord) {
            dayRecord = { day: dayNumber, activities: [] };
            currentPlan.value.dailyActivities.push(dayRecord);
          }

          // 更新活动
          dayRecord.activities = response || [];
        }
      } catch (error) {
        console.error('获取指定日期学习活动失败:', error);
        ElMessage.error('获取学习活动失败');
      } finally {
        loadingStates.dailyActivities = false;
      }
    };

    // 回到今天
    const goToToday = () => {
      const today = new Date().toISOString().split('T')[0];
      selectedDate.value = today;
      fetchActivitiesByDate(today);
    };
    
    // 查看计划详情
    const viewPlanDetails = (plan) => {
      selectedPlan.value = plan;
      planDetailsVisible.value = true;
    };
    
    // 打开资源链接
    const openResource = (url) => {
      if (url) {
        window.open(url, '_blank');
      } else {
        ElMessage.warning('资源链接不可用');
      }
    };
    
    // 格式化日期
    const formatDate = (dateString) => {
      if (!dateString) return '未设置';
      
      const date = new Date(dateString);
      return date.toLocaleDateString();
    };
    
    // 获取进度状态
    const getProgressStatus = (progress) => {
      if (progress >= 100) return 'success';
      if (progress >= 80) return 'success';
      if (progress >= 50) return '';
      if (progress >= 20) return 'warning';
      return 'exception';
    };
    
    // 获取活动类型标签
    const getActivityTypeTag = (type) => {
      switch (type) {
        case 'reading': return 'info';
        case 'video': return 'success';
        case 'exercise': return 'warning';
        case 'quiz': return 'danger';
        default: return 'info';
      }
    };
    
    // 获取活动类型文本
    const getActivityTypeText = (type) => {
      switch (type) {
        case 'reading': return '阅读';
        case 'video': return '视频';
        case 'exercise': return '练习';
        case 'quiz': return '测验';
        default: return '其他';
      }
    };
    
    // 获取状态类型
    const getStatusType = (status) => {
      switch (status) {
        case 'completed': return 'success';
        case 'in_progress': return 'primary';
        case 'pending': return 'info';
        case 'overdue': return 'danger';
        default: return 'info';
      }
    };
    
    // 获取状态标签类型
    const getStatusTagType = (status) => {
      switch (status) {
        case 'completed': return 'success';
        case 'in_progress': return 'primary';
        case 'pending': return 'info';
        case 'overdue': return 'danger';
        default: return 'info';
      }
    };
    
    // 获取状态文本
    const getStatusText = (status) => {
      switch (status) {
        case 'completed': return '已完成';
        case 'in_progress': return '进行中';
        case 'pending': return '待开始';
        case 'overdue': return '已逾期';
        default: return '未知状态';
      }
    };

    // 获取资源类型标签
    const getResourceTypeTag = (type) => {
      switch (type) {
        case 'video': return 'success';
        case 'document': return 'info';
        case 'exercise': return 'warning';
        case 'quiz': return 'danger';
        case 'link': return 'primary';
        default: return 'info';
      }
    };

    // 下载资源
    const downloadResource = (url) => {
      if (url) {
        const link = document.createElement('a');
        link.href = url;
        link.download = '';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        ElMessage.success('开始下载资源');
      } else {
        ElMessage.warning('下载链接不可用');
      }
    };
    
    // 处理ResizeObserver错误
    const handleResizeObserverError = () => {
      const resizeObserverError = "ResizeObserver loop completed with undelivered notifications.";
      const originalError = window.console.error;
      
      window.console.error = (...args) => {
        if (args.length > 0 && typeof args[0] === 'string' && args[0].includes(resizeObserverError)) {
          // 忽略ResizeObserver错误
          return;
        }
        originalError.apply(window.console, args);
      };
      
      return () => {
        window.console.error = originalError;
      };
    };

    onMounted(() => {
      // 初始化选择的日期为今天
      selectedDate.value = new Date().toISOString().split('T')[0];

      fetchCurrentPlan();
      fetchPlanHistory();
      fetchCourses();

      // 添加ResizeObserver错误处理
      const cleanupErrorHandler = handleResizeObserverError();

      // 在组件卸载前恢复原始的错误处理
      onBeforeUnmount(() => {
        cleanupErrorHandler();
      });
    });
    
    return {
      activeTab,
      currentPlan,
      todayActivities,
      recommendedResources,
      planHistory,
      courses,
      knowledgePoints,
      newPlan,
      planFormRules,
      loading,
      knowledgeLoading,
      loadingStates,
      searchKeyword,
      searchResults,
      searchType,
      planDetailsVisible,
      selectedPlan,
      selectedDate,
      currentDay,
      generatePlan,
      resetForm,
      handleCourseChange,
      updateActivityStatus,
      searchResources,
      fetchActivitiesByDate,
      goToToday,
      viewPlanDetails,
      openResource,
      formatDate,
      getStatusType,
      getStatusTagType,
      getStatusText,
      getProgressStatus,
      getActivityTypeTag,
      getActivityTypeText,
      getResourceTypeTag,
      downloadResource
    };
  }
}
</script>

<style scoped>
.student-plan-container {
  padding: 20px;
  width: 100%;
  height: auto;
  box-sizing: border-box;
  margin-bottom: 100px;
  overflow-y: visible;
}

.section-title {
  margin: 0 0 20px 0;
  font-size: 24px;
  font-weight: 600;
  color: #303133;
  border-left: 4px solid #409EFF;
  padding-left: 12px;
}

.plan-details {
  text-align: left;
  margin-top: 20px;
}

.plan-info {
  background-color: #f5f7fa;
  padding: 15px;
  border-radius: 8px;
  margin-bottom: 20px;
}

.daily-section {
  margin: 20px 0;
}

.section-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
}

.date-selector {
  display: flex;
  gap: 10px;
  align-items: center;
}

.daily-activities {
  margin: 20px 0;
}

.activity-card {
  margin-bottom: 10px;
  text-align: left;
}

.activity-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 10px;
}

.activity-meta {
  margin: 10px 0;
}

.activity-meta p {
  margin: 5px 0;
  color: #909399;
  font-size: 14px;
}

.activity-actions {
  margin-top: 15px;
  display: flex;
  gap: 10px;
}

.resources-list {
  display: flex;
  flex-direction: column;
  gap: 20px;
  margin-top: 20px;
  margin-bottom: 60px;
}

.resource-card {
  width: 100%;
  text-align: left;
}

.plan-form {
  max-width: 600px;
  margin: 0 auto;
}

.history-list {
  display: flex;
  flex-direction: column;
  gap: 20px;
  margin-top: 20px;
}

.history-card {
  width: 100%;
  text-align: left;
}

.search-container {
  margin-top: 20px;
}

.search-options {
  margin-bottom: 15px;
}

.search-type-group {
  display: flex;
  gap: 20px;
}

.search-input {
  margin-bottom: 20px;
}

.loading-container {
  margin: 20px 0;
}

.results-header {
  margin-bottom: 15px;
  padding: 10px;
  background-color: #f5f7fa;
  border-radius: 4px;
}

.results-count {
  font-weight: 500;
  color: #606266;
}

.search-results {
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.resource-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: 10px;
}

.resource-header h4 {
  margin: 0;
  flex: 1;
  margin-right: 10px;
}

.resource-description {
  color: #606266;
  line-height: 1.5;
  margin-bottom: 15px;
}

.resource-meta {
  margin-bottom: 15px;
}

.resource-meta p {
  margin: 5px 0;
  color: #909399;
  font-size: 14px;
}

.resource-actions {
  display: flex;
  gap: 10px;
}

.plan-details-dialog {
  text-align: left;
}
</style>