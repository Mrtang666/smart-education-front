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
          
          <h3 class="section-title">今日学习任务</h3>
          <el-empty v-if="!todayActivities || todayActivities.length === 0" description="暂无今日任务"></el-empty>
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
                  <p><strong>预计用时：</strong>{{ activity.duration }}分钟</p>
                  <el-tag :type="getStatusTagType(activity.status)">{{ getStatusText(activity.status) }}</el-tag>
                  
                  <div class="activity-actions" v-if="activity.status !== 'completed'">
                    <el-button 
                      type="primary" 
                      size="small"
                      @click="updateActivityStatus(activity.activityId, 'completed')"
                    >
                      标记为已完成
                    </el-button>
                  </div>
                </el-card>
              </el-timeline-item>
            </el-timeline>
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
        <el-form ref="planForm" :model="newPlan" label-width="120px" class="plan-form">
          <el-form-item label="学习目标" prop="targetGoal" required>
            <el-input v-model="newPlan.targetGoal" type="textarea" placeholder="请输入您的学习目标"></el-input>
          </el-form-item>
          
          <el-form-item label="时间范围(天)" prop="timeFrame" required>
            <el-input-number v-model="newPlan.timeFrame" :min="1" :max="90"></el-input-number>
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
          <el-input
            v-model="searchKeyword"
            placeholder="输入关键词搜索学习资源"
            class="search-input"
          >
            <template #append>
              <el-button @click="searchResources">搜索</el-button>
            </template>
          </el-input>
          
          <el-empty v-if="!searchResults || searchResults.length === 0" description="暂无搜索结果"></el-empty>
          <div v-else class="search-results">
            <el-card v-for="resource in searchResults" :key="resource.resourceId" class="resource-card">
              <h4>{{ resource.title }}</h4>
              <p>{{ resource.description }}</p>
              <p><strong>类型：</strong>{{ resource.resourceType }}</p>
              <p><strong>相关课程：</strong>{{ resource.courseName }}</p>
              <el-button type="primary" size="small" @click="openResource(resource.url)">查看资源</el-button>
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
    
    // 从认证信息中获取当前学生ID
    const userInfo = getUserInfo();
    const studentId = ref(userInfo.studentId);
    
    const searchKeyword = ref('');
    const searchResults = ref([]);
    const planDetailsVisible = ref(false);
    const selectedPlan = ref(null);
    
    // 当前是计划的第几天
    const currentDay = ref(1);
    
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
    
    // 获取当前学习计划
    const fetchCurrentPlan = async () => {
      try {
        const response = await learningPlanAPI.getCurrentLearningPlan(studentId.value);
        currentPlan.value = response;
        
        if (currentPlan.value) {
          // 获取推荐资源
          fetchRecommendedResources();
        }
      } catch (error) {
        console.error('获取当前学习计划失败:', error);
        ElMessage.error('获取当前学习计划失败');
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
      if (!newPlan.targetGoal || !newPlan.timeFrame) {
        ElMessage.warning('请填写学习目标和时间范围');
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
    
    // 重置表单
    const resetForm = () => {
      newPlan.targetGoal = '';
      newPlan.timeFrame = 14;
      newPlan.courseNames = [];
      newPlan.knowledgeNames = [];
      newPlan.selectedCourseIds = [];
      knowledgePoints.value = [];
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
          // 更新计划的完成进度
          if (response.newCompletionRate !== undefined) {
            currentPlan.value.progress = response.newCompletionRate;
          }
          
          // 更新活动状态
          if (currentPlan.value.dailyActivities) {
            currentPlan.value.dailyActivities.forEach(dayPlan => {
              const activity = dayPlan.activities.find(act => act.activityId === activityId);
              if (activity) {
                activity.status = response.status || status;
                activity.updatedAt = response.updatedAt;
              }
            });
          }
          
          // 显示成功消息，包含最新的完成率
          ElMessage.success(`活动状态更新成功，当前完成进度: ${response.newCompletionRate || currentPlan.value.progress || 0}%`);
        } else {
          // 如果没有响应数据，仍然尝试更新本地状态
          ElMessage.success('活动状态已更新');
          
          // 尝试在本地更新活动状态
          if (currentPlan.value.dailyActivities) {
            currentPlan.value.dailyActivities.forEach(dayPlan => {
              const activity = dayPlan.activities.find(act => act.activityId === activityId);
              if (activity) {
                activity.status = status;
              }
            });
          }
          
          // 刷新当前计划以获取最新数据
          fetchCurrentPlan();
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
        ElMessage.warning('请输入搜索关键词');
        return;
      }
      
      try {
        const response = await learningPlanAPI.searchPlanResources(studentId.value, searchKeyword.value);
        searchResults.value = response || [];
        
        if (!response || searchResults.value.length === 0) {
          ElMessage.info('没有找到相关资源');
        }
      } catch (error) {
        console.error('搜索资源失败:', error);
        ElMessage.error('搜索资源失败: ' + (error.message || '未知错误'));
        searchResults.value = [];
      }
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
      loading,
      knowledgeLoading,
      searchKeyword,
      searchResults,
      planDetailsVisible,
      selectedPlan,
      currentDay,
      generatePlan,
      resetForm,
      handleCourseChange,
      updateActivityStatus,
      searchResources,
      viewPlanDetails,
      openResource,
      formatDate,
      getStatusType,
      getStatusTagType,
      getStatusText,
      getProgressStatus,
      getActivityTypeTag,
      getActivityTypeText
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

.activity-actions {
  margin-top: 10px;
}

.resources-list {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
  gap: 20px;
  margin-top: 20px;
  margin-bottom: 60px;
}

.resource-card {
  height: 100%;
  text-align: left;
}

.plan-form {
  max-width: 600px;
  margin: 0 auto;
}

.history-list {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(350px, 1fr));
  gap: 20px;
  margin-top: 20px;
}

.history-card {
  text-align: left;
}

.search-container {
  margin-top: 20px;
}

.search-input {
  margin-bottom: 20px;
}

.search-results {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
  gap: 20px;
}

.plan-details-dialog {
  text-align: left;
}
</style>