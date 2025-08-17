<template>
  <div class="student-plan-container">
    <div class="page-header">
      <div class="tabs-container">
        <el-tabs v-model="activeTab">
      <el-tab-pane label="当前学习计划" name="current">
        <div v-if="loadingStates.currentPlan" class="loading-container">
          <el-skeleton :rows="5" animated />
        </div>
        
        <div v-else-if="currentPlan" class="plan-details">
          <!-- 调试信息 -->
          <div v-if="showDebugInfo" class="debug-info" style="background: #f0f9ff; padding: 10px; margin-bottom: 15px; border-radius: 4px; font-size: 12px; color: #666;">
            <strong>调试信息：</strong> 计划ID: {{ currentPlan.planId }}, 学生ID: {{ currentPlan.studentId }}
          </div>
          
          <!-- 计划选择器 -->
          <div v-if="allPlans && allPlans.length > 1" class="plan-selector" style="margin-bottom: 20px;">
            <h4>选择学习计划：</h4>
            <el-radio-group v-model="selectedPlanIndex" @change="switchPlan">
              <el-radio 
                v-for="(plan, index) in allPlans" 
                :key="plan.planId" 
                :label="index"
                style="margin-right: 15px;"
              >
                {{ plan.planName }} ({{ hasJsonContent(plan) ? '包含详细内容' : '基础内容' }})
              </el-radio>
            </el-radio-group>
          </div>
          <h2 class="section-title">学习计划: {{ currentPlan.planName || ('#' + currentPlan.planId) }}</h2>
          <div class="plan-info">
                      <div class="plan-header">
            <div class="plan-status">
              <el-tag :type="currentPlan.completed ? 'success' : 'warning'" size="large">
                {{ currentPlan.completed ? '已完成' : '进行中' }}
              </el-tag>
              <span class="plan-id">计划ID: {{ currentPlan.planId }}</span>
            </div>
            <div class="plan-actions">
              <!-- 编辑按钮 -->
              <el-button 
                type="primary" 
                size="small" 
                @click="editCurrentPlan"
                :loading="loadingStates.editPlan"
                :disabled="loadingStates.editPlan"
              >
                <el-icon><Edit /></el-icon>
                编辑计划
              </el-button>
              
              <!-- 手动完成按钮，只有当允许手动完成且未完成时显示 -->
              <el-button 
                v-if="currentPlan.completedSet && !currentPlan.completed"
                type="success" 
                size="small" 
                @click="markPlanAsCompleted"
                :loading="loadingStates.markCompleted"
                :disabled="loadingStates.markCompleted"
              >
                <el-icon><Check /></el-icon>
                标记完成
              </el-button>
              
              <el-button 
                type="danger" 
                size="small" 
                @click="deleteCurrentPlan"
                :loading="loadingStates.deletePlan"
                :disabled="loadingStates.deletePlan"
              >
                <el-icon><Delete /></el-icon>
                删除计划
              </el-button>
            </div>
          </div>
            
            <div class="plan-content">
              <p><strong>计划名称：</strong>{{ currentPlan.planName }}</p>
              <p><strong>学生ID：</strong>{{ currentPlan.studentId }}</p>
              <p><strong>时间范围：</strong>{{ calcTimeFrameDays(currentPlan.beginAt, currentPlan.endAt) }}天</p>
              <p><strong>开始时间：</strong>{{ formatDateTime(currentPlan.beginAt) }}</p>
              <p><strong>结束时间：</strong>{{ formatDateTime(currentPlan.endAt) }}</p>
              <p><strong>创建日期：</strong>{{ formatDateTime(currentPlan.createdAt) }}</p>
              <p><strong>更新时间：</strong>{{ formatDateTime(currentPlan.updatedAt) }}</p>
              <p><strong>允许手动完成：</strong>
                <el-tag :type="currentPlan.completedSet ? 'success' : 'info'" size="small">
                  {{ currentPlan.completedSet ? '允许' : '不允许' }}
                </el-tag>
                <span style="font-size: 12px; color: #909399; margin-left: 8px;">
                  {{ currentPlan.completedSet ? '学生可以手动标记计划完成' : '学生不能手动标记计划完成' }}
                </span>
              </p>
              
              <!-- 显示原始内容或解析后的内容 -->
              <div v-if="currentPlan.parsedContent && currentPlan.parsedContent.rawContent">
                <p><strong>计划内容：</strong>{{ currentPlan.parsedContent.rawContent }}</p>
              </div>
              <div v-else-if="currentPlan.content && !currentPlan.parsedContent">
                <p><strong>计划内容：</strong>{{ currentPlan.content }}</p>
              </div>
            </div>
            
            <!-- <div class="progress-section">
              <p><strong>完成进度：</strong>{{ currentPlan.progress || 0 }}%</p>
              <el-progress 
                :percentage="currentPlan.progress || 0" 
                :status="getProgressStatus(currentPlan.progress || 0)"
                :stroke-width="12"
                :show-text="true"
              ></el-progress> -->
              
              <!-- 当不允许手动完成时显示提示 -->
              <!-- <div v-if="!currentPlan.completedSet && !currentPlan.completed" class="completion-notice">
                <el-alert
                  title="手动完成限制"
                  type="info"
                  :closable="false"
                  show-icon
                >
                  <template #default>
                    <p>此学习计划不允许手动标记完成，需要按照计划内容完成所有学习活动。</p>
                  </template>
                </el-alert>
              </div>
            </div> -->
          </div>
          
          <!-- 每日学习活动 -->
          <div v-if="currentPlan.parsedContent && currentPlan.parsedContent.dailyActivities" class="daily-activities-section">
            <h3 class="section-title">每日学习活动</h3>
            <div class="daily-activities-list">
              <el-card v-for="day in currentPlan.parsedContent.dailyActivities" :key="day.day" class="day-card">
                <div class="day-header">
                  <h4>第{{ day.day }}天</h4>
                </div>
                
                <div class="day-content">
                  <div class="knowledge-points">
                    <h5>知识点：</h5>
                    <el-tag 
                      v-for="point in day.knowledgePoints" 
                      :key="point" 
                      type="info" 
                      size="small" 
                      style="margin: 2px 4px 2px 0;"
                    >
                      {{ point }}
                    </el-tag>
                  </div>
                  
                  <div class="resources">
                    <h5>学习资源：</h5>
                    <ul class="resource-list">
                      <li v-for="resource in day.resources" :key="resource" class="resource-item">
                        {{ resource }}
                      </li>
                    </ul>
                  </div>
                </div>
              </el-card>
            </div>
          </div>
          
          <!-- 推荐学习资源 -->
          <!-- <h3 class="section-title">推荐学习资源</h3> -->
          
          <!-- 显示从解析内容中获取的推荐资源 -->
          <!-- <div v-if="currentPlan.parsedContent && currentPlan.parsedContent.recommendedResources" class="parsed-resources-section">
            <div v-if="currentPlan.parsedContent.recommendedResources.video && currentPlan.parsedContent.recommendedResources.video.length > 0" class="resource-category">
              <h4>视频资源：</h4>
              <div class="resources-list">
                <el-card v-for="(video, index) in currentPlan.parsedContent.recommendedResources.video" :key="`video-${index}`" class="resource-card">
                  <h5>{{ video }}</h5>
                  <p><strong>类型：</strong>视频</p>
                  <el-button type="primary" size="small" @click="searchResource(video)">搜索资源</el-button>
                </el-card>
              </div>
            </div>
            
            <div v-if="currentPlan.parsedContent.recommendedResources.article && currentPlan.parsedContent.recommendedResources.article.length > 0" class="resource-category">
              <h4>文章资源：</h4>
              <div class="resources-list">
                <el-card v-for="(article, index) in currentPlan.parsedContent.recommendedResources.article" :key="`article-${index}`" class="resource-card">
                  <h5>{{ article }}</h5>
                  <p><strong>类型：</strong>文章</p>
                  <el-button type="primary" size="small" @click="searchResource(article)">搜索资源</el-button>
                </el-card>
              </div>
            </div>
          </div> -->
          
          <!-- 显示从API获取的推荐资源 -->
          <div v-else-if="recommendedResources && recommendedResources.length > 0" class="api-resources-section">
            <div class="resources-list">
              <el-card v-for="resource in recommendedResources" :key="resource.resourceId" class="resource-card">
                <h4>{{ resource.title }}</h4>
                <p>{{ resource.description }}</p>
                <p><strong>类型：</strong>{{ resource.resourceType }}</p>
                <el-button type="primary" size="small" @click="openResource(resource.url)">查看资源</el-button>
              </el-card>
            </div>
          </div>
          
          <el-empty v-else description="暂无推荐资源"></el-empty>
        </div>
        
        <el-empty v-else description="暂无当前学习计划">
          <template #description>
            <div>
              <p>暂无当前学习计划</p>
              <p v-if="showDebugInfo" style="font-size: 12px; color: #999; margin-top: 10px;">
                调试：请检查API响应和网络连接
              </p>
            </div>
          </template>
          <el-button type="primary" @click="activeTab = 'create'">创建学习计划</el-button>
          <el-button @click="fetchCurrentPlan" style="margin-left: 10px;">刷新</el-button>
          <el-button v-if="showDebugInfo" @click="loadTestData" style="margin-left: 10px;" type="warning">加载测试数据</el-button>
          <el-button v-if="showDebugInfo" @click="testCompletedSet" style="margin-left: 10px;" type="info">测试completedSet</el-button>
          <el-button v-if="showDebugInfo" @click="showFormStatus" style="margin-left: 10px;" type="success">显示表单状态</el-button>
          <el-button v-if="showDebugInfo" @click="forceSetCompletedSetTrue" style="margin-left: 10px;" type="warning">强制设置completedSet为true</el-button>
          <el-button v-if="showDebugInfo" @click="testDataSubmission" style="margin-left: 10px;" type="danger">测试数据提交</el-button>
          <el-button v-if="showDebugInfo" @click="testApiDocumentExample" style="margin-left: 10px;" type="primary">API文档示例测试</el-button>
        </el-empty>
      </el-tab-pane>
      
      <el-tab-pane label="创建学习计划" name="create">
        <el-form ref="planForm" :model="newPlan" :rules="planFormRules" label-width="120px" class="plan-form">
          <el-form-item label="学生ID" prop="studentId">
            <el-input v-model="newPlan.studentId" disabled />
          </el-form-item>
          <el-form-item label="计划名称" prop="planName">
            <el-input
              v-model="newPlan.planName"
              placeholder="请输入计划名称（必填）"
              maxlength="100"
              show-word-limit
            ></el-input>
          </el-form-item>

          <el-form-item label="计划内容" prop="content">
            <el-input
              v-model="newPlan.content"
              type="textarea"
              placeholder="请输入计划内容/描述（可与学习目标一致）"
              :rows="3"
              maxlength="500"
              show-word-limit
            ></el-input>
          </el-form-item>

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

          <!-- AI生成选项 -->
          <el-form-item label="生成方式">
            <el-radio-group v-model="newPlan.generationType" @change="handleGenerationTypeChange">
              <el-radio value="manual">手动创建</el-radio>
              <el-radio value="ai">AI智能生成</el-radio>
            </el-radio-group>
          </el-form-item>

          <!-- AI生成相关字段 -->
          <div v-if="newPlan.generationType === 'ai'" class="ai-generation-section">
            <el-alert
              title="AI生成说明"
              type="info"
              :closable="false"
              style="margin-bottom: 20px;"
            >
              <template #default>
                <p>AI将根据您的学习目标、时间范围和选择的课程，自动生成详细的学习计划，包括：</p>
                <ul style="margin: 5px 0; padding-left: 20px;">
                  <li>每日学习活动安排</li>
                  <li>知识点分解</li>
                  <li>推荐学习资源</li>
                  <li>学习进度跟踪</li>
                </ul>
              </template>
            </el-alert>

            <el-form-item label="选择课程" prop="selectedCourseId">
              <el-select
                v-model="newPlan.selectedCourseId"
                filterable
                placeholder="请选择课程（AI生成需要）"
                style="width: 100%;"
                @change="handleAICourseChange"
              >
                <el-option
                  v-for="course in courses"
                  :key="course.id"
                  :label="course.name"
                  :value="course.id"
                ></el-option>
              </el-select>
              <div class="form-tip">AI生成学习计划需要选择具体的课程</div>
            </el-form-item>

            <el-form-item label="学习目标" prop="aiTargetGoal">
              <el-input
                v-model="newPlan.aiTargetGoal"
                type="textarea"
                placeholder="请详细描述您的学习目标，例如：掌握Vue.js框架的核心概念，能够独立开发前端项目"
                :rows="4"
                maxlength="500"
                show-word-limit
              ></el-input>
              <div class="form-tip">详细的学习目标有助于AI生成更精准的学习计划</div>
            </el-form-item>

            <el-form-item label="时间范围" prop="aiTimeFrame">
              <el-input-number
                v-model="newPlan.aiTimeFrame"
                :min="1"
                :max="90"
                placeholder="请输入学习天数"
                style="width: 100%;"
              ></el-input-number>
              <div class="form-tip">建议根据学习内容的复杂度设置合理的时间范围</div>
            </el-form-item>

            <el-form-item label="计划名称" prop="aiPlanName">
              <el-input
                v-model="newPlan.aiPlanName"
                placeholder="为AI生成的学习计划起个名字"
                maxlength="100"
                show-word-limit
              ></el-input>
              <div class="form-tip">如果不填写，AI将根据学习目标自动生成计划名称</div>
            </el-form-item>
          </div>

          <el-form-item label="开始时间" prop="beginAt">
            <el-date-picker
              v-model="newPlan.beginAt"
              type="datetime"
              placeholder="选择开始时间"
            />
          </el-form-item>

          <el-form-item label="结束时间" prop="endAt">
            <el-date-picker
              v-model="newPlan.endAt"
              type="datetime"
              placeholder="选择结束时间"
            />
          </el-form-item>

          <el-form-item label="标记完成">
            <el-switch v-model="newPlan.completed" />
            <div class="form-tip">创建时是否直接标记为已完成状态</div>
            <div v-if="showDebugInfo" class="debug-info" style="font-size: 12px; color: #909399; margin-top: 5px;">
              当前值: {{ newPlan.completed }} (类型: {{ typeof newPlan.completed }})
            </div>
          </el-form-item>

          <el-form-item label="允许手动完成">
            <el-switch 
              v-model="newPlan.completedSet" 
              @change="handleCompletedSetChange"
            />
            <div class="form-tip">是否允许学生手动标记学习计划为已完成</div>
            <div v-if="showDebugInfo" class="debug-info" style="font-size: 12px; color: #909399; margin-top: 5px;">
              当前值: {{ newPlan.completedSet }} (类型: {{ typeof newPlan.completedSet }})
            </div>
            <!-- 强制设置按钮 -->
            <div v-if="showDebugInfo" style="margin-top: 10px;">
              <el-button size="small" type="warning" @click="forceSetCompletedSetTrue">强制设置为true</el-button>
              <el-button size="small" type="info" @click="forceSetCompletedSetFalse">强制设置为false</el-button>
            </div>
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
            <el-button 
              v-if="newPlan.generationType === 'manual'"
              type="primary" 
              @click="generatePlan" 
              :loading="loading"
            >
              生成学习计划
            </el-button>
            <el-button 
              v-else
              type="success" 
              @click="generateAIPlan" 
              :loading="loading"
              :disabled="!newPlan.selectedCourseId"
            >
              <el-icon><Magic /></el-icon>
              AI智能生成
            </el-button>
            <el-button @click="resetForm">重置</el-button>
          </el-form-item>
        </el-form>
      </el-tab-pane>
      
      <!-- <el-tab-pane label="历史学习计划" name="history">
        <div v-if="loadingStates.history" class="loading-container">
          <el-skeleton :rows="3" animated />
        </div>
        
        <el-empty v-else-if="!planHistory || planHistory.length === 0" description="暂无历史学习计划">
          <template #description>
            <div>
              <p>暂无历史学习计划</p>
              <p v-if="showDebugInfo" style="font-size: 12px; color: #999; margin-top: 10px;">
                调试：请检查API响应和网络连接
              </p>
            </div>
          </template>
          <el-button type="primary" @click="fetchPlanHistory">刷新</el-button>
        </el-empty>
        
        <div v-else class="history-list">
          <div class="history-header">
            <h3>历史学习计划 ({{ planHistory.length }})</h3>
            <el-button type="primary" size="small" @click="fetchPlanHistory" :loading="loadingStates.history">
              刷新
            </el-button>
          </div>
          
          <el-card v-for="plan in planHistory" :key="plan.planId" class="history-card">
            <div class="history-card-header">
              <div class="history-card-info">
                <h3>{{ plan.planName || ('#' + plan.planId) }}</h3>
                <el-tag :type="plan.completed ? 'success' : 'warning'" size="small">
                  {{ plan.completed ? '已完成' : '进行中' }}
                </el-tag>
              </div>
              <div class="history-card-actions">
                <el-button type="primary" size="small" @click="viewPlanDetails(plan)">查看详情</el-button>
                <el-button 
                  type="danger" 
                  size="small" 
                  @click="deleteHistoryPlan(plan)"
                  :loading="loadingStates.deletePlan"
                  :disabled="loadingStates.deletePlan"
                >
                  <el-icon><Delete /></el-icon>
                  删除
                </el-button>
              </div>
            </div>
            
            <div class="history-card-content">
              <div class="history-card-row">
                <p><strong>计划ID：</strong>{{ plan.planId }}</p>
                <p><strong>学生ID：</strong>{{ plan.studentId }}</p>
              </div>
              
              <div class="history-card-row">
                <p><strong>学习目标：</strong>{{ plan.targetGoal || '未设置' }}</p>
              </div>
              
              <div class="history-card-row">
                <p><strong>时间范围：</strong>{{ plan.timeFrame }}天</p>
                <p><strong>开始日期：</strong>{{ formatDateTime(plan.startDate) }}</p>
                <p><strong>结束日期：</strong>{{ formatDateTime(plan.endDate) }}</p>
              </div>
              
              <div class="history-card-row">
                <p><strong>创建时间：</strong>{{ formatDateTime(plan.createdAt) }}</p>
                <p><strong>更新时间：</strong>{{ formatDateTime(plan.updatedAt) }}</p>
              </div>
              
              <div class="history-card-row">
                <p><strong>允许手动完成：</strong>
                  <el-tag :type="plan.completedSet ? 'success' : 'info'" size="small">
                    {{ plan.completedSet ? '允许' : '不允许' }}
                  </el-tag>
                </p>
              </div>
              
              <div class="history-card-row">
                <p><strong>完成进度：</strong>{{ plan.completionRate || 0 }}%</p>
                <el-progress 
                  :percentage="plan.completionRate || 0" 
                  :status="getProgressStatus(plan.completionRate || 0)"
                  :stroke-width="8"
                ></el-progress>
              </div>
              
              <div class="history-card-row" v-if="plan.content">
                <p><strong>计划内容：</strong></p>
                <div class="content-preview">{{ plan.content }}</div>
              </div>
            </div>
          </el-card>
        </div>
      </el-tab-pane>
       -->
      <!-- <el-tab-pane label="搜索资源" name="search">
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
      </el-tab-pane> -->
        </el-tabs>
      </div>
      
      <!-- <div class="action-buttons">
        <el-button 
          type="success" 
          size="large" 
          @click="goToPlanDetail"
          :icon="ArrowRight"
        >
          学习计划资料
        </el-button>
      </div> -->
    </div>
    
    <!-- 编辑学习计划对话框 -->
    <el-dialog v-model="editPlanVisible" title="编辑学习计划" width="70%">
      <div v-if="editingPlan" class="edit-plan-dialog">
        <el-form ref="editPlanForm" :model="editingPlan" :rules="editPlanRules" label-width="120px">
          <el-form-item label="计划名称" prop="planName">
            <el-input
              v-model="editingPlan.planName"
              placeholder="请输入计划名称"
              maxlength="100"
              show-word-limit
            ></el-input>
          </el-form-item>

          <el-form-item label="计划内容" prop="content">
            <el-input
              v-model="editingPlan.content"
              type="textarea"
              placeholder="请输入计划内容/描述"
              :rows="4"
              maxlength="500"
              show-word-limit
            ></el-input>
          </el-form-item>

          <el-form-item label="开始时间" prop="beginAt">
            <el-date-picker
              v-model="editingPlan.beginAt"
              type="datetime"
              placeholder="选择开始时间"
              style="width: 100%;"
            />
          </el-form-item>

          <el-form-item label="结束时间" prop="endAt">
            <el-date-picker
              v-model="editingPlan.endAt"
              type="datetime"
              placeholder="选择结束时间"
              style="width: 100%;"
            />
          </el-form-item>

          <el-form-item label="完成状态">
            <el-switch v-model="editingPlan.completed" />
            <div class="form-tip">是否标记为已完成状态</div>
          </el-form-item>

          <el-form-item label="允许手动完成">
            <el-switch v-model="editingPlan.completedSet" />
            <div class="form-tip">是否允许学生手动标记学习计划为已完成</div>
          </el-form-item>
        </el-form>
      </div>
      
      <template #footer>
        <div class="dialog-footer">
          <el-button @click="editPlanVisible = false">取消</el-button>
          <el-button type="primary" @click="savePlanChanges" :loading="loadingStates.editPlan">
            保存修改
          </el-button>
        </div>
      </template>
    </el-dialog>

    <el-dialog v-model="planDetailsVisible" title="计划详情" width="80%">
      <div v-if="selectedPlan" class="plan-details-dialog">
        <div class="plan-details-header">
          <h2 class="section-title">{{ selectedPlan.planName }}</h2>
          <el-tag :type="selectedPlan.completed ? 'success' : 'warning'" size="large">
            {{ selectedPlan.completed ? '已完成' : '进行中' }}
          </el-tag>
        </div>
        
        <div class="plan-details-content">
          <div class="plan-details-section">
            <h3>基本信息</h3>
            <div class="details-grid">
              <div class="detail-item">
                <strong>计划ID：</strong>{{ selectedPlan.planId }}
              </div>
              <div class="detail-item">
                <strong>学生ID：</strong>{{ selectedPlan.studentId }}
              </div>
              <div class="detail-item">
                <strong>学习目标：</strong>{{ selectedPlan.targetGoal }}
              </div>
              <div class="detail-item">
                <strong>时间范围：</strong>{{ selectedPlan.timeFrame }}天
              </div>
              <div class="detail-item">
                <strong>开始日期：</strong>{{ formatDateTime(selectedPlan.startDate) }}
              </div>
              <div class="detail-item">
                <strong>结束日期：</strong>{{ formatDateTime(selectedPlan.endDate) }}
              </div>
              <div class="detail-item">
                <strong>创建时间：</strong>{{ formatDateTime(selectedPlan.createdAt) }}
              </div>
              <div class="detail-item">
                <strong>更新时间：</strong>{{ formatDateTime(selectedPlan.updatedAt) }}
              </div>
              <div class="detail-item">
                <strong>允许手动完成：</strong>
                <el-tag :type="selectedPlan.completedSet ? 'success' : 'info'" size="small">
                  {{ selectedPlan.completedSet ? '允许' : '不允许' }}
                </el-tag>
                <span style="font-size: 12px; color: #909399; margin-left: 8px;">
                  {{ selectedPlan.completedSet ? '学生可以手动标记计划完成' : '学生不能手动标记计划完成' }}
                </span>
              </div>
            </div>
          </div>
          
          <div class="plan-details-section">
            <h3>完成进度</h3>
            <div class="progress-section">
              <p><strong>完成进度：</strong>{{ selectedPlan.completionRate || 0 }}%</p>
              <el-progress 
                :percentage="selectedPlan.completionRate || 0" 
                :status="getProgressStatus(selectedPlan.completionRate || 0)"
                :stroke-width="12"
                :show-text="true"
              ></el-progress>
            </div>
          </div>
          
          <div class="plan-details-section" v-if="selectedPlan.content">
            <h3>计划内容</h3>
            <div class="content-section">
              <div class="content-text">{{ selectedPlan.content }}</div>
            </div>
          </div>
          
          <!-- 显示解析后的每日活动 -->
          <div class="plan-details-section" v-if="selectedPlan.parsedContent && selectedPlan.parsedContent.dailyActivities">
            <h3>每日学习活动</h3>
            <div class="daily-activities-list">
              <el-card v-for="day in selectedPlan.parsedContent.dailyActivities" :key="day.day" class="day-card">
                <div class="day-header">
                  <h4>第{{ day.day }}天</h4>
                </div>
                
                <div class="day-content">
                  <div class="knowledge-points">
                    <h5>知识点：</h5>
                    <el-tag 
                      v-for="point in day.knowledgePoints" 
                      :key="point" 
                      type="info" 
                      size="small" 
                      style="margin: 2px 4px 2px 0;"
                    >
                      {{ point }}
                    </el-tag>
                  </div>
                  
                  <div class="resources">
                    <h5>学习资源：</h5>
                    <ul class="resource-list">
                      <li v-for="resource in day.resources" :key="resource" class="resource-item">
                        {{ resource }}
                      </li>
                    </ul>
                  </div>
                </div>
              </el-card>
            </div>
          </div>
          
          <!-- 显示解析后的推荐资源 -->
          <div class="plan-details-section" v-if="selectedPlan.parsedContent && selectedPlan.parsedContent.recommendedResources">
            <h3>推荐学习资源</h3>
            <div class="parsed-resources-section">
              <div v-if="selectedPlan.parsedContent.recommendedResources.video && selectedPlan.parsedContent.recommendedResources.video.length > 0" class="resource-category">
                <h4>视频资源：</h4>
                <div class="resources-list">
                  <el-card v-for="(video, index) in selectedPlan.parsedContent.recommendedResources.video" :key="`video-${index}`" class="resource-card">
                    <h5>{{ video }}</h5>
                    <p><strong>类型：</strong>视频</p>
                  </el-card>
                </div>
              </div>
              
              <div v-if="selectedPlan.parsedContent.recommendedResources.article && selectedPlan.parsedContent.recommendedResources.article.length > 0" class="resource-category">
                <h4>文章资源：</h4>
                <div class="resources-list">
                  <el-card v-for="(article, index) in selectedPlan.parsedContent.recommendedResources.article" :key="`article-${index}`" class="resource-card">
                    <h5>{{ article }}</h5>
                    <p><strong>类型：</strong>文章</p>
                  </el-card>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </el-dialog>
  </div>
</template>

<script>
import { ref, reactive, onMounted, computed, onBeforeUnmount } from 'vue';
import { useRouter } from 'vue-router';
import { learningPlanAPI, courseAPI, knowledgeAPI } from '@/api/api';
import { ElMessage, ElMessageBox } from 'element-plus';
import { Magic, Delete, Check, Edit, ArrowRight } from '@element-plus/icons-vue';
import { getUserInfo } from '@/utils/auth';
import { learningPlanController } from '@/api/apiLearning';

export default {
  name: 'StudentPlan',
  setup() {
    const router = useRouter();
    const activeTab = ref('current');
    const planForm = ref(null);
    const currentPlan = ref(null);
    const allPlans = ref([]); // 存储所有学习计划
    const selectedPlanIndex = ref(0); // 当前选中的计划索引
    const recommendedResources = ref([]);
    const planHistory = ref([]);
    const courses = ref([]);
    const knowledgePoints = ref([]);
    const loading = ref(false);
    const knowledgeLoading = ref(false);
    const showDebugInfo = ref(true); // 启用调试信息显示

    // 细粒度加载状态
    const loadingStates = reactive({
      currentPlan: false,
      resources: false,
      search: false,
      courses: false,
      dailyActivities: false,
      deletePlan: false,
      markCompleted: false,
      editPlan: false
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
    const editPlanVisible = ref(false);
    const editingPlan = ref(null);
    const editPlanForm = ref(null);
    
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
    // 按日期任务功能后端未提供接口，返回空
    const todayActivities = computed(() => []);

    // 检查是否为开发环境
    const isDevelopment = computed(() => {
      // 使用多种方式检查开发环境
      if (typeof process !== 'undefined' && process.env && process.env.NODE_ENV === 'development') {
        return true;
      }
      // 检查Vue全局属性
      if (typeof window !== 'undefined' && window.__VUE_DEVTOOLS_GLOBAL_HOOK__) {
        return true;
      }
      // 检查URL参数
      if (typeof window !== 'undefined' && window.location.search.includes('debug=true')) {
        return true;
      }
      return false;
    });
    
    const newPlan = reactive({
      studentId: '',
      planName: '',
      content: '',
      targetGoal: '',
      timeFrame: 14,
      beginAt: null,
      endAt: null,
      completed: false,
      completedSet: false,
      courseNames: [],
      knowledgeNames: [],
      selectedCourseIds: [],
      generationType: 'manual', // 生成方式：manual 或 ai
      selectedCourseId: null, // AI生成时选择的课程ID
      // AI生成专用字段
      aiTargetGoal: '', // AI生成的学习目标
      aiTimeFrame: 14, // AI生成的时间范围
      aiPlanName: '' // AI生成的计划名称
    });

    // 表单验证规则
    const planFormRules = reactive({
      planName: [
        { required: true, message: '请输入计划名称', trigger: 'blur' },
        { min: 1, max: 100, message: '计划名称长度应在1-100字符之间', trigger: 'blur' }
      ],
      content: [
        { required: true, message: '请输入计划内容', trigger: 'blur' },
        { min: 5, max: 500, message: '计划内容长度应在5-500字符之间', trigger: 'blur' }
      ],
      targetGoal: [
        { required: true, message: '请输入学习目标', trigger: 'blur' },
        { min: 10, max: 200, message: '学习目标长度应在10-200字符之间', trigger: 'blur' }
      ],
      timeFrame: [
        { required: true, message: '请选择时间范围', trigger: 'change' },
        { type: 'number', min: 1, max: 90, message: '时间范围应在1-90天之间', trigger: 'change' }
      ],
      beginAt: [
        { required: true, message: '请选择开始时间', trigger: 'change' }
      ],
      endAt: [
        { required: true, message: '请选择结束时间', trigger: 'change' }
      ],
      selectedCourseId: [
        { 
          required: true, 
          message: 'AI生成需要选择课程', 
          trigger: 'change',
          validator: (rule, value, callback) => {
            if (newPlan.generationType === 'ai' && !value) {
              callback(new Error('AI生成需要选择课程'));
            } else {
              callback();
            }
          }
        }
      ],
      aiTargetGoal: [
        { 
          required: true, 
          message: '请填写学习目标', 
          trigger: 'blur',
          validator: (rule, value, callback) => {
            if (newPlan.generationType === 'ai' && !value) {
              callback(new Error('请填写学习目标'));
            } else {
              callback();
            }
          }
        },
        { min: 10, max: 500, message: '学习目标长度应在10-500字符之间', trigger: 'blur' }
      ],
      aiTimeFrame: [
        { 
          required: true, 
          message: '请选择时间范围', 
          trigger: 'change',
          validator: (rule, value, callback) => {
            if (newPlan.generationType === 'ai' && !value) {
              callback(new Error('请选择时间范围'));
            } else {
              callback();
            }
          }
        },
        { type: 'number', min: 1, max: 90, message: '时间范围应在1-90天之间', trigger: 'change' }
      ]
    });

    // 编辑计划表单验证规则
    const editPlanRules = reactive({
      planName: [
        { required: true, message: '请输入计划名称', trigger: 'blur' },
        { min: 1, max: 100, message: '计划名称长度应在1-100字符之间', trigger: 'blur' }
      ],
      content: [
        { required: true, message: '请输入计划内容', trigger: 'blur' },
        { min: 5, max: 500, message: '计划内容长度应在5-500字符之间', trigger: 'blur' }
      ],
      beginAt: [
        { required: true, message: '请选择开始时间', trigger: 'change' }
      ],
      endAt: [
        { required: true, message: '请选择结束时间', trigger: 'change' }
      ]
    });
    
    // 解析学习计划内容
    const parsePlanContent = (content) => {
      if (!content) return null;
      
      try {
        // 尝试解析JSON格式的内容
        const parsed = JSON.parse(content);
        return parsed;
      } catch (error) {
        // 如果不是JSON格式，返回原始内容
        console.debug('[parsePlanContent] 内容不是JSON格式，使用原始内容');
        return { rawContent: content };
      }
    };

    // 获取当前学习计划
    const fetchCurrentPlan = async () => {
      loadingStates.currentPlan = true;
      try {
        // 优先使用自动读取本地 studentId 的接口
        let response;
        try {
          if (typeof learningPlanController?.getCurrentPlanAuto === 'function') {
            response = await learningPlanController.getCurrentPlanAuto();
            console.debug('[currentPlan:auto]', response);
          } else if (typeof learningPlanController?.getCurrentPlan === 'function') {
            response = await learningPlanController.getCurrentPlan(studentId.value);
            console.debug('[currentPlan:manual]', response);
          } else {
            response = await retryFetch(
              () => learningPlanAPI.getCurrentLearningPlan(studentId.value)
            );
            console.debug('[currentPlan:legacy]', response);
          }
                   } catch (apiError) {
             console.error('[currentPlan] API调用失败:', apiError);
             // 如果API调用失败，使用测试数据
             if (isDevelopment.value) {
               console.debug('[currentPlan] 使用测试数据作为备选');
               const testData = [
                 {
                   "planId": "1755264425697",
                   "studentId": "313596855403548675",
                   "planName": "学习计划111",
                   "content": "学习计划1122222222",
                   "beginAt": "2025-08-15T05:26:52",
                   "endAt": "2025-08-16T08:00:00",
                   "completed": false,
                   "createdAt": "2025-08-15T13:27:04.899621",
                   "updatedAt": "2025-08-15T18:02:58.049001",
                   "completedSet": false
                 },
                 {
                   "planId": "347091572589990761",
                   "studentId": "313596855403548675",
                   "planName": "学习计划888888",
                   "content": "{\"planName\":\"学习计划888888\",\"dailyActivities\":[{\"day\":1,\"knowledgePoints\":[\"学习计划制定\",\"时间管理\",\"目标设定\",\"任务分解\"],\"resources\":[\"如何制定高效学习计划\",\"时间管理技巧指南\",\"SMART目标设定法\",\"任务分解与执行\"]},{\"day\":2,\"knowledgePoints\":[\"优先级排序\",\"执行监控\",\"反馈调整\",\"资源整合\"],\"resources\":[\"优先级排序方法\",\"执行监控工具\",\"反馈调整策略\",\"资源整合技巧\"]}],\"recommendedResources\":{\"video\":[\"高效学习计划制定\",\"时间管理实战\"],\"article\":[\"目标设定的五大原则\",\"任务分解的艺术\"]}}",
                   "beginAt": "2025-08-15T18:57:59.551435",
                   "endAt": "2025-08-17T18:57:59.551444",
                   "completed": false,
                   "createdAt": "2025-08-15T18:57:59.551455",
                   "updatedAt": "2025-08-15T18:57:59.551457",
                   "completedSet": false
                 },
                 {
                   "planId": "347092734068265844",
                   "studentId": "313596855403548675",
                   "planName": "学习计划888888",
                   "content": "{\"planName\":\"学习计划888888\",\"dailyActivities\":[{\"day\":1,\"knowledgePoints\":[\"学习目标分析\",\"知识单元拆解\"],\"resources\":[\"如何高效分析学习目标\",\"知识单元拆解技巧\"]},{\"day\":2,\"knowledgePoints\":[\"原子级知识点\",\"预置知识点匹配\",\"独立概念验证\"],\"resources\":[\"原子级知识点的重要性\",\"预置知识点匹配方法\",\"独立概念验证步骤\"]},{\"day\":3,\"knowledgePoints\":[\"学习计划优化\",\"教学策略设计\",\"知识点关联性\",\"学习效果评估\"],\"resources\":[\"如何优化学习计划\",\"教学策略设计指南\",\"知识点关联性分析\",\"学习效果评估方法\"]}],\"recommendedResources\":{\"video\":[\"高效学习计划制定\",\"知识点关联性解析\"],\"article\":[\"认知负荷控制策略\",\"学习效果评估技巧\"]}}",
                   "beginAt": "2025-08-15T19:02:36.470004",
                   "endAt": "2025-08-18T19:02:36.470013",
                   "completed": false,
                   "createdAt": "2025-08-15T19:02:36.47002",
                   "updatedAt": "2025-08-15T19:02:36.470022",
                   "completedSet": false
                 }
               ];
               response = testData;
          } else {
            throw apiError; // 在生产环境下重新抛出错误
          }
        }

        // 处理API返回的数据格式
        console.debug('[currentPlan] 原始API响应:', response);
        
        // 如果返回的是数组，优先选择包含JSON格式内容的计划
        if (Array.isArray(response) && response.length > 0) {
          // 保存所有计划
          allPlans.value = response;
          
          // 优先选择包含JSON格式内容的计划
          const planWithJsonContent = response.find(plan => {
            if (!plan.content) return false;
            try {
              JSON.parse(plan.content);
              return true;
            } catch {
              return false;
            }
          });
          
          // 如果找到包含JSON内容的计划，使用它；否则使用第一个计划
          currentPlan.value = planWithJsonContent || response[0];
          selectedPlanIndex.value = response.findIndex(plan => plan.planId === currentPlan.value.planId);
          
          console.debug('[currentPlan] 从数组中获取计划:', currentPlan.value);
          console.debug('[currentPlan] 是否包含JSON内容:', !!planWithJsonContent);
          console.debug('[currentPlan] 总计划数量:', response.length);
        } else if (response && typeof response === 'object') {
          // 如果返回的是单个对象
          currentPlan.value = response;
          allPlans.value = [response];
          selectedPlanIndex.value = 0;
          console.debug('[currentPlan] 获取到单个计划对象:', currentPlan.value);
        } else {
          currentPlan.value = null;
          allPlans.value = [];
          selectedPlanIndex.value = 0;
          console.debug('[currentPlan] 没有找到当前学习计划');
        }
        
        // 解析学习计划内容
        if (currentPlan.value && currentPlan.value.content) {
          currentPlan.value.parsedContent = parsePlanContent(currentPlan.value.content);
          console.debug('[currentPlan] 解析后的内容:', currentPlan.value.parsedContent);
        }
        
        // 调试当前计划的数据结构
        if (currentPlan.value) {
          console.debug('[currentPlan] 当前计划数据结构:', {
            planId: currentPlan.value.planId,
            planName: currentPlan.value.planName,
            content: currentPlan.value.content,
            parsedContent: currentPlan.value.parsedContent,
            beginAt: currentPlan.value.beginAt,
            endAt: currentPlan.value.endAt,
            completed: currentPlan.value.completed,
            completedSet: currentPlan.value.completedSet,
            createdAt: currentPlan.value.createdAt,
            updatedAt: currentPlan.value.updatedAt
          });
          
          // 特别调试 completedSet 字段
          console.debug('[currentPlan] completedSet 字段详情:', {
            value: currentPlan.value.completedSet,
            type: typeof currentPlan.value.completedSet,
            isTrue: currentPlan.value.completedSet === true,
            isFalse: currentPlan.value.completedSet === false,
            isNull: currentPlan.value.completedSet === null,
            isUndefined: currentPlan.value.completedSet === undefined
          });
        }

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

    // 后端无对应接口，禁用获取今日学习活动
    const fetchTodayActivities = async () => {};
    
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
        // console.error('获取推荐学习资源失败:', error);
        // ElMessage.error('获取推荐学习资源失败');
        recommendedResources.value = [];
      }
    };
    
    // 获取历史学习计划
    const fetchPlanHistory = async () => {
      loadingStates.history = true;
      try {
        console.debug('[fetchPlanHistory] 开始获取历史学习计划:', {
          studentId: studentId.value
        });

        // 使用learningPlanController中的getHistoryPlans方法
        const response = await learningPlanController.getHistoryPlans(studentId.value);
        
        console.debug('[fetchPlanHistory] API响应:', response);
        
        if (response && Array.isArray(response)) {
          // 处理返回的数据，确保字段映射正确
          planHistory.value = response.map(plan => ({
            planId: plan.planId,
            studentId: plan.studentId,
            planName: plan.planName,
            content: plan.content,
            targetGoal: plan.targetGoal || plan.content, // 如果没有targetGoal字段，使用content
            timeFrame: plan.timeFrame || calcTimeFrameDays(plan.beginAt, plan.endAt),
            startDate: plan.beginAt,
            endDate: plan.endAt,
            completed: plan.completed,
            completedSet: plan.completedSet,
            createdAt: plan.createdAt,
            updatedAt: plan.updatedAt,
            completionRate: plan.completionRate || (plan.completed ? 100 : 0)
          }));
          
          console.debug('[fetchPlanHistory] 处理后的历史计划:', planHistory.value);
        } else {
          planHistory.value = [];
          console.warn('[fetchPlanHistory] 服务器返回的数据不是数组或为空');
        }
      } catch (error) {
        console.error('获取历史学习计划失败:', error);
        ElMessage.error('获取历史学习计划失败: ' + (error.message || '未知错误'));
        planHistory.value = [];
      } finally {
        loadingStates.history = false;
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
    
    // 处理生成方式变化
    const handleGenerationTypeChange = (type) => {
      if (type === 'ai') {
        // 切换到AI生成模式时，清空一些手动填写的字段
        newPlan.content = '';
        newPlan.courseNames = [];
        newPlan.knowledgeNames = [];
        newPlan.selectedCourseIds = [];
        // 清空AI生成字段
        newPlan.aiTargetGoal = '';
        newPlan.aiTimeFrame = 14;
        newPlan.aiPlanName = '';
        newPlan.selectedCourseId = null;
      } else {
        // 切换到手动模式时，清空AI生成字段
        newPlan.aiTargetGoal = '';
        newPlan.aiTimeFrame = 14;
        newPlan.aiPlanName = '';
        newPlan.selectedCourseId = null;
      }
    };

    // 处理AI课程选择变化
    const handleAICourseChange = (courseId) => {
      if (courseId) {
        const selectedCourse = courses.value.find(course => course.id === courseId);
        if (selectedCourse && !newPlan.aiPlanName) {
          // 如果没有填写计划名称，根据课程名称自动生成
          newPlan.aiPlanName = `${selectedCourse.name}学习计划`;
        }
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
    
    // AI生成学习计划
    const generateAIPlan = async () => {
      // 表单验证
      if (planForm.value) {
        try {
          await planForm.value.validate();
        } catch (error) {
          ElMessage.warning('请检查表单填写是否正确');
          return;
        }
      }

      // AI生成专用验证
      if (!newPlan.aiTargetGoal) {
        ElMessage.warning('请填写学习目标');
        return;
      }
      if (!newPlan.aiTimeFrame) {
        ElMessage.warning('请选择时间范围');
        return;
      }
      if (!newPlan.selectedCourseId) {
        ElMessage.warning('请选择课程');
        return;
      }

      if (!studentId.value) {
        ElMessage.error('无法获取学生ID，请重新登录');
        return;
      }
      
      loading.value = true;
      try {
        console.debug('[generateAIPlan] 开始AI生成:', {
          studentId: studentId.value,
          targetGoal: newPlan.aiTargetGoal,
          timeFrame: newPlan.aiTimeFrame,
          courseId: newPlan.selectedCourseId,
          planName: newPlan.aiPlanName
        });

        // 调用AI生成接口
        const response = await learningPlanController.generatePlan(
          studentId.value,
          newPlan.aiTargetGoal,
          newPlan.aiTimeFrame,
          newPlan.selectedCourseId
        );
        
        if (response) {
          ElMessage.success('AI学习计划生成成功！');
          resetForm();
          activeTab.value = 'current';
          await fetchCurrentPlan();
        } else {
          ElMessage.warning('AI生成成功，但服务器返回空数据');
          resetForm();
          activeTab.value = 'current';
          await fetchCurrentPlan();
        }
      } catch (error) {
        console.error('AI生成学习计划失败:', error);
        ElMessage.error('AI生成学习计划失败: ' + (error.message || '未知错误'));
      } finally {
        loading.value = false;
      }
    };

    // 生成/添加学习计划
    const generatePlan = async () => {
      // 表单验证
      if (planForm.value) {
        try {
          await planForm.value.validate();
        } catch (error) {
          ElMessage.warning('请检查表单填写是否正确');
          return;
        }
      }

      // 基础验证
      if (!newPlan.planName) {
        ElMessage.warning('请填写计划名称');
        return;
      }
      if (!newPlan.content) {
        ElMessage.warning('请填写计划内容');
        return;
      }
      if (!newPlan.beginAt || !newPlan.endAt) {
        ElMessage.warning('请完善开始与结束时间');
        return;
      }
      const beginDate = newPlan.beginAt instanceof Date ? newPlan.beginAt : new Date(newPlan.beginAt);
      const endDate = newPlan.endAt instanceof Date ? newPlan.endAt : new Date(newPlan.endAt);
      if (endDate.getTime() < beginDate.getTime()) {
        ElMessage.warning('结束时间不能早于开始时间');
        return;
      }

      if (!studentId.value) {
        ElMessage.error('无法获取学生ID，请重新登录');
        return;
      }
      
      loading.value = true;
      try {
        // 强制确保 completedSet 的值 - 根据API文档要求
        let finalCompletedSet = false;
        
        // 检查开关状态
        if (newPlan.completedSet === true || newPlan.completedSet === 'true' || newPlan.completedSet === 1) {
          finalCompletedSet = true;
        }
        
        // 调试信息
        console.debug('[generatePlan] completedSet 处理详情:', {
          originalValue: newPlan.completedSet,
          originalType: typeof newPlan.completedSet,
          finalValue: finalCompletedSet,
          finalType: typeof finalCompletedSet,
          isTrue: finalCompletedSet === true,
          isFalse: finalCompletedSet === false
        });
        
        // 组装添加学习计划请求体（对齐后端需求）
        const planData = {
          // 兼容后端当前插入语句需要 plan_id 的情况，使用时间戳生成唯一ID
          planId: Date.now(),
          // 同时在请求体中传 studentId，使用字符串避免 JS 精度丢失导致的 0/错误
          studentId: String(studentId.value),
          // 后端列为 name，这里同时传 name 与 planName 以最大兼容
          name: newPlan.planName,
          planName: newPlan.planName,
          content: newPlan.content,
          beginAt: beginDate.toISOString(),
          endAt: endDate.toISOString(),
          completed: Boolean(newPlan.completed),
          completedSet: finalCompletedSet
        };

        // 便于排查 studentId 为 0 的问题
        console.debug('[addPlan] studentId(path)=', studentId.value, ' studentId(body)=', planData.studentId, ' planId=', planData.planId);
        
        // 详细的 completedSet 调试信息
        console.debug('[addPlan] completedSet 详细调试信息:', {
          newPlanCompletedSet: newPlan.completedSet,
          newPlanCompletedSetType: typeof newPlan.completedSet,
          planDataCompletedSet: planData.completedSet,
          planDataCompletedSetType: typeof planData.completedSet,
          isNewPlanTrue: newPlan.completedSet === true,
          isNewPlanFalse: newPlan.completedSet === false,
          isPlanDataTrue: planData.completedSet === true,
          isPlanDataFalse: planData.completedSet === false
        });

        console.debug('[addPlan] 发送到后端的数据:', JSON.stringify(planData, null, 2));
        
        const response = await learningPlanController.addPlan(studentId.value, planData);
        
        console.debug('[addPlan] 后端返回的响应:', response);
        
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
      newPlan.planName = '';
      newPlan.content = '';
      newPlan.targetGoal = '';
      newPlan.timeFrame = 14;
      newPlan.beginAt = null;
      newPlan.endAt = null;
      newPlan.completed = false;
      newPlan.completedSet = false;
      newPlan.courseNames = [];
      newPlan.knowledgeNames = [];
      newPlan.selectedCourseIds = [];
      newPlan.generationType = 'manual';
      newPlan.selectedCourseId = null;
      // 重置AI生成字段
      newPlan.aiTargetGoal = '';
      newPlan.aiTimeFrame = 14;
      newPlan.aiPlanName = '';
      knowledgePoints.value = [];

      // 清除表单验证状态
      if (planForm.value && planForm.value.clearValidate) {
        planForm.value.clearValidate();
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

    // 后端无接口，禁用按日期获取学习活动
    // const fetchActivitiesByDate = async () => {};

    // 回到今天
    // const goToToday = () => {};
    
    // 查看计划详情
    const viewPlanDetails = (plan) => {
      // 处理计划数据，确保字段映射正确
      selectedPlan.value = {
        ...plan,
        // 确保所有必要字段都存在
        planName: plan.planName || ('#' + plan.planId),
        targetGoal: plan.targetGoal || plan.content || '未设置',
        timeFrame: plan.timeFrame || calcTimeFrameDays(plan.startDate || plan.beginAt, plan.endDate || plan.endAt),
        startDate: plan.startDate || plan.beginAt,
        endDate: plan.endDate || plan.endAt,
        completionRate: plan.completionRate || (plan.completed ? 100 : 0),
        // 解析内容
        parsedContent: plan.content ? parsePlanContent(plan.content) : null
      };
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

    // 格式化日期时间
    const formatDateTime = (dateString) => {
      if (!dateString) return '未设置';
      
      const date = new Date(dateString);
      return date.toLocaleString('zh-CN', {
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit'
      });
    };

    // 计算时间范围天数（由 beginAt/endAt 推导）
    const calcTimeFrameDays = (beginAt, endAt) => {
      if (!beginAt || !endAt) return newPlan.timeFrame || 0;
      const start = new Date(beginAt);
      const end = new Date(endAt);
      const ms = end.getTime() - start.getTime();
      return ms > 0 ? Math.ceil(ms / (1000 * 60 * 60 * 24)) : 0;
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

    // 删除当前学习计划
    const deleteCurrentPlan = async () => {
      if (!currentPlan.value || !currentPlan.value.planId) {
        ElMessage.warning('没有可删除的学习计划');
        return;
      }

      try {
        await ElMessageBox.confirm(
          `确定要删除学习计划"${currentPlan.value.planName || '#' + currentPlan.value.planId}"吗？`,
          '删除确认',
          {
            confirmButtonText: '确定删除',
            cancelButtonText: '取消',
            type: 'warning',
            confirmButtonClass: 'el-button--danger'
          }
        );

        loadingStates.deletePlan = true;
        
        console.debug('[deleteCurrentPlan] 开始删除计划:', {
          planId: currentPlan.value.planId,
          planName: currentPlan.value.planName
        });

        // 调用删除接口
        const response = await learningPlanController.deletePlan(currentPlan.value.planId);
        
        if (response) {
          ElMessage.success('学习计划删除成功！');
          
          // 从所有计划列表中移除被删除的计划
          if (allPlans.value && allPlans.value.length > 0) {
            const index = allPlans.value.findIndex(plan => plan.planId === currentPlan.value.planId);
            if (index > -1) {
              allPlans.value.splice(index, 1);
            }
          }
          
          // 重新获取当前计划
          await fetchCurrentPlan();
        } else {
          ElMessage.warning('删除成功，但服务器返回空数据');
          await fetchCurrentPlan();
        }
      } catch (error) {
        if (error !== 'cancel') {
          console.error('删除学习计划失败:', error);
          ElMessage.error('删除学习计划失败: ' + (error.message || '未知错误'));
        }
      } finally {
        loadingStates.deletePlan = false;
      }
    };

    // 编辑当前学习计划
    const editCurrentPlan = () => {
      if (!currentPlan.value || !currentPlan.value.planId) {
        ElMessage.warning('没有可编辑的学习计划');
        return;
      }

      // 创建编辑数据的副本，避免直接修改原数据
      editingPlan.value = {
        planId: currentPlan.value.planId,
        studentId: currentPlan.value.studentId,
        planName: currentPlan.value.planName,
        content: currentPlan.value.content,
        beginAt: currentPlan.value.beginAt ? new Date(currentPlan.value.beginAt) : null,
        endAt: currentPlan.value.endAt ? new Date(currentPlan.value.endAt) : null,
        completed: currentPlan.value.completed,
        completedSet: currentPlan.value.completedSet,
        createdAt: currentPlan.value.createdAt,
        updatedAt: currentPlan.value.updatedAt
      };

      editPlanVisible.value = true;
    };

    // 保存计划修改
    const savePlanChanges = async () => {
      if (!editingPlan.value) {
        ElMessage.warning('没有可保存的修改');
        return;
      }

      // 表单验证
      if (editPlanForm.value) {
        try {
          await editPlanForm.value.validate();
        } catch (error) {
          ElMessage.warning('请检查表单填写是否正确');
          return;
        }
      }

      // 验证时间
      if (editingPlan.value.beginAt && editingPlan.value.endAt) {
        const beginDate = editingPlan.value.beginAt instanceof Date ? editingPlan.value.beginAt : new Date(editingPlan.value.beginAt);
        const endDate = editingPlan.value.endAt instanceof Date ? editingPlan.value.endAt : new Date(editingPlan.value.endAt);
        
        if (endDate.getTime() < beginDate.getTime()) {
          ElMessage.warning('结束时间不能早于开始时间');
          return;
        }
      }

      loadingStates.editPlan = true;
      
      try {
        console.debug('[savePlanChanges] 开始保存计划修改:', {
          planId: editingPlan.value.planId,
          planName: editingPlan.value.planName
        });

        // 准备更新数据，按照API文档要求
        const updateData = {
          planId: editingPlan.value.planId,
          studentId: editingPlan.value.studentId,
          planName: editingPlan.value.planName,
          content: editingPlan.value.content,
          beginAt: editingPlan.value.beginAt instanceof Date ? editingPlan.value.beginAt.toISOString() : editingPlan.value.beginAt,
          endAt: editingPlan.value.endAt instanceof Date ? editingPlan.value.endAt.toISOString() : editingPlan.value.endAt,
          completed: Boolean(editingPlan.value.completed),
          completedSet: Boolean(editingPlan.value.completedSet),
          createdAt: editingPlan.value.createdAt,
          updatedAt: new Date().toISOString()
        };

        console.debug('[savePlanChanges] 发送到后端的数据:', JSON.stringify(updateData, null, 2));

        // 调用更新接口
        const response = await learningPlanController.updatePlan(updateData);
        
        if (response) {
          ElMessage.success('学习计划修改成功！');
          
          // 更新当前计划数据
          Object.assign(currentPlan.value, updateData);
          
          // 关闭编辑对话框
          editPlanVisible.value = false;
          editingPlan.value = null;
          
          // 重新获取当前计划以获取最新数据
          await fetchCurrentPlan();
        } else {
          ElMessage.warning('修改成功，但服务器返回空数据');
          await fetchCurrentPlan();
        }
      } catch (error) {
        console.error('保存学习计划修改失败:', error);
        ElMessage.error('保存学习计划修改失败: ' + (error.message || '未知错误'));
      } finally {
        loadingStates.editPlan = false;
      }
    };

    // 手动标记计划完成
    const markPlanAsCompleted = async () => {
      if (!currentPlan.value || !currentPlan.value.planId) {
        ElMessage.warning('没有可标记的学习计划');
        return;
      }

      if (!currentPlan.value.completedSet) {
        ElMessage.warning('此学习计划不允许手动标记完成');
        return;
      }

      try {
        await ElMessageBox.confirm(
          `确定要标记学习计划"${currentPlan.value.planName || '#' + currentPlan.value.planId}"为已完成吗？`,
          '标记完成确认',
          {
            confirmButtonText: '确定标记',
            cancelButtonText: '取消',
            type: 'warning'
          }
        );

        loadingStates.markCompleted = true;
        
        console.debug('[markPlanAsCompleted] 开始标记计划完成:', {
          planId: currentPlan.value.planId,
          planName: currentPlan.value.planName
        });

        // 调用更新接口，将计划标记为已完成
        const updateData = {
          ...currentPlan.value,
          completed: true,
          updatedAt: new Date().toISOString()
        };

        const response = await learningPlanController.updatePlan(updateData);
        
        if (response) {
          ElMessage.success('学习计划已标记为完成！');
          
          // 更新当前计划状态
          currentPlan.value.completed = true;
          currentPlan.value.updatedAt = new Date().toISOString();
          
          // 重新获取当前计划以获取最新数据
          await fetchCurrentPlan();
        } else {
          ElMessage.warning('标记成功，但服务器返回空数据');
          await fetchCurrentPlan();
        }
      } catch (error) {
        if (error !== 'cancel') {
          console.error('标记学习计划完成失败:', error);
          ElMessage.error('标记学习计划完成失败: ' + (error.message || '未知错误'));
        }
      } finally {
        loadingStates.markCompleted = false;
      }
    };



    // 搜索资源
    const searchResource = (resourceName) => {
      if (resourceName) {
        // 切换到搜索标签页并设置搜索关键词
        activeTab.value = 'search';
        searchKeyword.value = resourceName;
        searchType.value = 'keyword';
        // 自动执行搜索
        searchResources();
        ElMessage.info(`正在搜索资源：${resourceName}`);
      }
    };

    // 检查计划是否包含JSON内容
    const hasJsonContent = (plan) => {
      if (!plan.content) return false;
      try {
        JSON.parse(plan.content);
        return true;
      } catch {
        return false;
      }
    };

    // 切换学习计划
    const switchPlan = (index) => {
      if (allPlans.value && allPlans.value[index]) {
        currentPlan.value = allPlans.value[index];
        selectedPlanIndex.value = index;
        
        // 解析新计划的内容
        if (currentPlan.value.content) {
          currentPlan.value.parsedContent = parsePlanContent(currentPlan.value.content);
        }
        
        ElMessage.success(`已切换到：${currentPlan.value.planName}`);
      }
    };

    // 处理 completedSet 开关变化
    const handleCompletedSetChange = (value) => {
      console.debug('[handleCompletedSetChange] 开关状态变化:', {
        newValue: value,
        type: typeof value,
        newPlanCompletedSet: newPlan.completedSet,
        newPlanCompletedSetType: typeof newPlan.completedSet
      });
      
      // 确保值是布尔类型
      if (typeof value !== 'boolean') {
        console.warn('[handleCompletedSetChange] 值不是布尔类型，进行转换:', value);
        newPlan.completedSet = Boolean(value);
      } else {
        // 直接设置值
        newPlan.completedSet = value;
      }
      
      // 再次验证设置是否成功
      console.debug('[handleCompletedSetChange] 设置后的状态:', {
        newPlanCompletedSet: newPlan.completedSet,
        newPlanCompletedSetType: typeof newPlan.completedSet,
        isTrue: newPlan.completedSet === true,
        isFalse: newPlan.completedSet === false
      });
      
      ElMessage.info(`允许手动完成已${value ? '开启' : '关闭'}`);
    };

    // 测试 completedSet 字段设置
    const testCompletedSet = () => {
      console.debug('[testCompletedSet] 测试 completedSet 字段设置');
      console.debug('[testCompletedSet] 当前 newPlan.completedSet:', {
        value: newPlan.completedSet,
        type: typeof newPlan.completedSet,
        isTrue: newPlan.completedSet === true,
        isFalse: newPlan.completedSet === false
      });
      
      // 切换 completedSet 的值
      newPlan.completedSet = !newPlan.completedSet;
      
      console.debug('[testCompletedSet] 切换后 newPlan.completedSet:', {
        value: newPlan.completedSet,
        type: typeof newPlan.completedSet,
        isTrue: newPlan.completedSet === true,
        isFalse: newPlan.completedSet === false
      });
      
      ElMessage.info(`completedSet 已切换为: ${newPlan.completedSet}`);
    };

    // 显示表单状态
    const showFormStatus = () => {
      console.debug('[showFormStatus] 当前表单状态:', {
        completed: newPlan.completed,
        completedType: typeof newPlan.completed,
        completedSet: newPlan.completedSet,
        completedSetType: typeof newPlan.completedSet,
        planName: newPlan.planName,
        content: newPlan.content
      });
      
      ElMessage.info(`表单状态 - completed: ${newPlan.completed}, completedSet: ${newPlan.completedSet}`);
    };

    // 强制设置 completedSet 为 true
    const forceSetCompletedSetTrue = () => {
      console.debug('[forceSetCompletedSetTrue] 强制设置前:', {
        completedSet: newPlan.completedSet,
        type: typeof newPlan.completedSet
      });
      
      // 强制设置为 true
      newPlan.completedSet = true;
      
      console.debug('[forceSetCompletedSetTrue] 强制设置后:', {
        completedSet: newPlan.completedSet,
        type: typeof newPlan.completedSet,
        isTrue: newPlan.completedSet === true,
        isFalse: newPlan.completedSet === false
      });
      
      ElMessage.success('已强制设置 completedSet 为 true');
    };

    // 强制设置 completedSet 为 false
    const forceSetCompletedSetFalse = () => {
      console.debug('[forceSetCompletedSetFalse] 强制设置前:', {
        completedSet: newPlan.completedSet,
        type: typeof newPlan.completedSet
      });
      
      // 强制设置为 false
      newPlan.completedSet = false;
      
      console.debug('[forceSetCompletedSetFalse] 强制设置后:', {
        completedSet: newPlan.completedSet,
        type: typeof newPlan.completedSet,
        isTrue: newPlan.completedSet === true,
        isFalse: newPlan.completedSet === false
      });
      
      ElMessage.success('已强制设置 completedSet 为 false');
    };

    // 测试数据提交
    const testDataSubmission = async () => {
      console.debug('[testDataSubmission] 开始测试数据提交');
      
      // 强制设置 completedSet 为 true
      newPlan.completedSet = true;
      
      // 模拟创建计划的数据
      const testPlanData = {
        planId: Date.now(),
        studentId: String(studentId.value),
        name: '测试计划',
        planName: '测试计划',
        content: '测试内容',
        beginAt: new Date().toISOString(),
        endAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
        completed: false,
        completedSet: true
      };
      
      console.debug('[testDataSubmission] 测试数据:', {
        newPlanCompletedSet: newPlan.completedSet,
        newPlanCompletedSetType: typeof newPlan.completedSet,
        testPlanDataCompletedSet: testPlanData.completedSet,
        testPlanDataCompletedSetType: typeof testPlanData.completedSet,
        fullTestData: JSON.stringify(testPlanData, null, 2)
      });
      
      try {
        // 尝试提交测试数据
        const response = await learningPlanController.addPlan(studentId.value, testPlanData);
        console.debug('[testDataSubmission] 测试提交成功:', response);
        ElMessage.success('测试数据提交成功！');
      } catch (error) {
        console.error('[testDataSubmission] 测试提交失败:', error);
        ElMessage.error('测试数据提交失败: ' + (error.message || '未知错误'));
      }
    };

    // API文档示例数据测试
    const testApiDocumentExample = async () => {
      console.debug('[testApiDocumentExample] 开始API文档示例测试');
      
      // 使用API文档中的示例数据
      const apiExampleData = {
        planId: 0,
        studentId: parseInt(studentId.value),
        planName: "API文档测试计划",
        content: "这是根据API文档示例创建的测试计划",
        beginAt: "2025-08-16T08:44:58.967Z",
        endAt: "2025-08-23T08:44:58.967Z",
        completed: true,
        createdAt: "2025-08-16T08:44:58.967Z",
        updatedAt: "2025-08-16T08:44:58.967Z",
        completedSet: true  // 明确设置为 true
      };
      
      console.debug('[testApiDocumentExample] API文档示例数据:', {
        fullData: JSON.stringify(apiExampleData, null, 2),
        completedSet: apiExampleData.completedSet,
        completedSetType: typeof apiExampleData.completedSet
      });
      
      try {
        // 尝试提交API文档示例数据
        const response = await learningPlanController.addPlan(studentId.value, apiExampleData);
        console.debug('[testApiDocumentExample] API文档示例测试成功:', response);
        ElMessage.success('API文档示例测试成功！');
        
        // 重新获取当前计划以查看结果
        await fetchCurrentPlan();
      } catch (error) {
        console.error('[testApiDocumentExample] API文档示例测试失败:', error);
        ElMessage.error('API文档示例测试失败: ' + (error.message || '未知错误'));
      }
    };

    // 跳转到详情页面
    const goToPlanDetail = () => {
      router.push('/student/plan-detail');
      ElMessage.success('正在跳转到学习计划资源页面');
    };

    // 加载测试数据
    const loadTestData = () => {
      // 使用包含3天学习活动的第三个计划
      const testData = {
        "planId": "347092734068265844",
        "studentId": "313596855403548675",
        "planName": "学习计划888888",
        "content": "{\"planName\":\"学习计划888888\",\"dailyActivities\":[{\"day\":1,\"knowledgePoints\":[\"学习目标分析\",\"知识单元拆解\"],\"resources\":[\"如何高效分析学习目标\",\"知识单元拆解技巧\"]},{\"day\":2,\"knowledgePoints\":[\"原子级知识点\",\"预置知识点匹配\",\"独立概念验证\"],\"resources\":[\"原子级知识点的重要性\",\"预置知识点匹配方法\",\"独立概念验证步骤\"]},{\"day\":3,\"knowledgePoints\":[\"学习计划优化\",\"教学策略设计\",\"知识点关联性\",\"学习效果评估\"],\"resources\":[\"如何优化学习计划\",\"教学策略设计指南\",\"知识点关联性分析\",\"学习效果评估方法\"]}],\"recommendedResources\":{\"video\":[\"高效学习计划制定\",\"知识点关联性解析\"],\"article\":[\"认知负荷控制策略\",\"学习效果评估技巧\"]}}",
        "beginAt": "2025-08-15T19:02:36.470004",
        "endAt": "2025-08-18T19:02:36.470013",
        "completed": false,
        "createdAt": "2025-08-15T19:02:36.47002",
        "updatedAt": "2025-08-15T19:02:36.470022",
        "completedSet": false
      };
      
      currentPlan.value = testData;
      allPlans.value = [testData];
      selectedPlanIndex.value = 0;
      
      if (currentPlan.value.content) {
        currentPlan.value.parsedContent = parsePlanContent(currentPlan.value.content);
      }
      
      ElMessage.success('测试数据加载成功（包含3天学习活动）');
    };

    onMounted(() => {
      // 初始化选择的日期为今天
      selectedDate.value = new Date().toISOString().split('T')[0];

      // 将后端登录态里的 studentId 注入表单，供只读展示和后端校验
      if (studentId.value) {
        newPlan.studentId = String(studentId.value);
      }

      // 在开发环境下，如果API调用失败会使用测试数据

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
      allPlans,
      selectedPlanIndex,
      todayActivities,
      isDevelopment,
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
      showDebugInfo,
      editPlanVisible,
      editingPlan,
      editPlanForm,
      editPlanRules,
      generatePlan,
      generateAIPlan,
      resetForm,
      handleCourseChange,
      handleGenerationTypeChange,
      handleAICourseChange,
      updateActivityStatus,
      searchResources,
      searchResource,
      loadTestData,
      testCompletedSet,
      handleCompletedSetChange,
      showFormStatus,
      forceSetCompletedSetTrue,
      forceSetCompletedSetFalse,
      testDataSubmission,
      testApiDocumentExample,
      hasJsonContent,
      switchPlan,
      deleteCurrentPlan,
      editCurrentPlan,
      savePlanChanges,
      markPlanAsCompleted,
      // fetchActivitiesByDate, // 已禁用
      // goToToday, // 已禁用
      viewPlanDetails,
      openResource,
      formatDate,
      formatDateTime,
      calcTimeFrameDays,
      getStatusType,
      getStatusTagType,
      getStatusText,
      getProgressStatus,
      getActivityTypeTag,
      getActivityTypeText,
      getResourceTypeTag,
      downloadResource,
      planForm,
      Magic,
      Delete,
      Check,
      Edit,
      ArrowRight,
      goToPlanDetail
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

.page-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: 20px;
  padding-bottom: 20px;
  border-bottom: 1px solid #e4e7ed;
}

.tabs-container {
  flex: 1;
}

.action-buttons {
  display: flex;
  gap: 15px;
  margin-left: 20px;
  align-items: flex-start;
  padding-top: 5px;
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
  padding: 20px;
  border-radius: 8px;
  margin-bottom: 20px;
  border: 1px solid #e4e7ed;
}

.plan-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
  padding-bottom: 15px;
  border-bottom: 1px solid #e4e7ed;
}

.plan-status {
  display: flex;
  align-items: center;
  gap: 10px;
}

.plan-actions {
  display: flex;
  gap: 10px;
}

.plan-id {
  color: #909399;
  font-size: 14px;
  font-family: monospace;
}

.plan-content {
  margin-bottom: 20px;
}

.plan-content p {
  margin: 8px 0;
  line-height: 1.6;
}

.progress-section {
  padding-top: 15px;
  border-top: 1px solid #e4e7ed;
}

.progress-section p {
  margin-bottom: 10px;
  font-weight: 500;
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

.daily-activities-section {
  margin: 20px 0;
}

.daily-activities-list {
  display: flex;
  flex-direction: column;
  gap: 15px;
}

.day-card {
  width: 100%;
  text-align: left;
}

.day-header {
  margin-bottom: 15px;
  padding-bottom: 10px;
  border-bottom: 1px solid #e4e7ed;
}

.day-header h4 {
  margin: 0;
  color: #409EFF;
  font-size: 18px;
  font-weight: 600;
}

.day-content {
  display: flex;
  flex-direction: column;
  gap: 15px;
}

.knowledge-points h5,
.resources h5 {
  margin: 0 0 8px 0;
  color: #606266;
  font-size: 14px;
  font-weight: 500;
}

.resource-list {
  margin: 0;
  padding-left: 20px;
}

.resource-item {
  margin: 4px 0;
  color: #606266;
  line-height: 1.5;
}

.parsed-resources-section {
  margin: 20px 0;
}

.resource-category {
  margin-bottom: 25px;
}

.resource-category h4 {
  margin: 0 0 15px 0;
  color: #303133;
  font-size: 16px;
  font-weight: 600;
  border-left: 3px solid #409EFF;
  padding-left: 10px;
}

.ai-generation-section {
  background-color: #f8f9fa;
  padding: 20px;
  border-radius: 8px;
  margin: 20px 0;
  border: 1px solid #e9ecef;
}

.ai-generation-section .el-form-item {
  margin-bottom: 15px;
}

.plan-selector {
  background-color: #f5f7fa;
  padding: 15px;
  border-radius: 6px;
  margin-bottom: 20px;
  border: 1px solid #e4e7ed;
}

.plan-selector h4 {
  margin: 0 0 10px 0;
  color: #303133;
  font-size: 16px;
  font-weight: 600;
}

.form-tip {
  font-size: 12px;
  color: #909399;
  margin-top: 5px;
  line-height: 1.4;
}

.ai-generation-section .el-form-item {
  margin-bottom: 20px;
}

.ai-generation-section .el-input-number {
  width: 100%;
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

.history-card-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: 15px;
}

.history-card-header h3 {
  margin: 0;
  flex: 1;
  margin-right: 15px;
}

.history-card-actions {
  display: flex;
  gap: 8px;
  flex-shrink: 0;
}

.history-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
  padding-bottom: 15px;
  border-bottom: 1px solid #e4e7ed;
}

.history-header h3 {
  margin: 0;
  color: #303133;
  font-size: 18px;
  font-weight: 600;
}

.history-card-info {
  display: flex;
  align-items: center;
  gap: 10px;
  flex: 1;
}

.history-card-info h3 {
  margin: 0;
  color: #303133;
  font-size: 16px;
  font-weight: 600;
}

.history-card-content {
  margin-top: 15px;
}

.history-card-row {
  display: flex;
  flex-wrap: wrap;
  gap: 20px;
  margin-bottom: 12px;
  align-items: center;
}

.history-card-row p {
  margin: 0;
  color: #606266;
  font-size: 14px;
  line-height: 1.5;
  min-width: 200px;
}

.history-card-row .el-progress {
  flex: 1;
  min-width: 200px;
}

.content-preview {
  background-color: #f5f7fa;
  padding: 10px;
  border-radius: 4px;
  margin-top: 5px;
  color: #606266;
  font-size: 14px;
  line-height: 1.5;
  max-height: 100px;
  overflow-y: auto;
  border: 1px solid #e4e7ed;
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

.plan-details-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
  padding-bottom: 15px;
  border-bottom: 1px solid #e4e7ed;
}

.plan-details-content {
  max-height: 70vh;
  overflow-y: auto;
}

.plan-details-section {
  margin-bottom: 25px;
}

.plan-details-section h3 {
  margin: 0 0 15px 0;
  color: #303133;
  font-size: 16px;
  font-weight: 600;
  border-left: 3px solid #409EFF;
  padding-left: 10px;
}

.details-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
  gap: 15px;
}

.detail-item {
  padding: 10px;
  background-color: #f5f7fa;
  border-radius: 4px;
  border: 1px solid #e4e7ed;
  color: #606266;
  font-size: 14px;
  line-height: 1.5;
}

.content-section {
  background-color: #f5f7fa;
  padding: 15px;
  border-radius: 4px;
  border: 1px solid #e4e7ed;
}

.content-text {
  color: #606266;
  font-size: 14px;
  line-height: 1.6;
  white-space: pre-wrap;
  word-break: break-word;
}

.completion-notice {
  margin-top: 15px;
}

.completion-notice .el-alert {
  margin-bottom: 0;
}

.edit-plan-dialog {
  text-align: left;
}

.edit-plan-dialog .el-form-item {
  margin-bottom: 20px;
}

.dialog-footer {
  text-align: right;
  padding-top: 20px;
  border-top: 1px solid #e4e7ed;
}
</style>