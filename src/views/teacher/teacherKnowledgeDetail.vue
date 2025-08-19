<template>
  <div class="knowledge-detail-container">
    <div class="knowledge-header">
      <div class="header-content">
        <div class="back-button" @click="goBack">
          <el-icon><ArrowLeft /></el-icon>
          <span>返回</span>
        </div>
        <h1 class="knowledge-title">{{ knowledgeName }} 知识点详情</h1>
      </div>
      <div class="knowledge-actions">
        <el-button type="primary" plain @click="editKnowledge">
          <el-icon><Edit /></el-icon>
          编辑知识点
        </el-button>
      </div>
    </div>

    <div class="knowledge-content">
      <!-- 知识点内容卡片 -->
      <div class="detail-card content-card">
        <div class="card-header">
          <h3>知识点内容</h3>
          <div class="header-actions">
            <el-button type="primary" size="small" @click="editKnowledgeContent">
              <el-icon><Edit /></el-icon>编辑内容
            </el-button>
          </div>
        </div>
        <div class="card-body">
          <div v-if="loading" class="loading-container">
            <el-skeleton :rows="3" animated />
          </div>
          <div v-else-if="!knowledgeData?.description" class="empty-content">
            <el-empty description="暂无知识点内容" :image-size="100">
              <template #image>
                <el-icon style="font-size: 50px; color: #909399;"><Document /></el-icon>
              </template>
              <el-button type="primary" @click="editKnowledgeContent">添加知识点内容</el-button>
            </el-empty>
          </div>
          <div v-else class="knowledge-description">
            <p class="description-text truncated-description">{{ knowledgeData.description }}</p>
          </div>
        </div>
      </div>

      <!-- 教师智能备课模块 -->
      <div class="detail-card teaching-assistant-card">
        <div class="card-header">
          <h3>智能备课助手</h3>
          <div class="header-actions">
            <el-button type="primary" size="small" @click="showGenerateDialog">
              <el-icon><Document /></el-icon>生成教学方案
            </el-button>
          </div>
        </div>
        <div class="card-body">
          <div v-if="!teachingPlan" class="empty-content">
            <el-empty description="暂无教学方案" :image-size="100">
              <template #image>
                <el-icon style="font-size: 50px; color: #909399;"><Document /></el-icon>
              </template>
              <el-button type="primary" @click="showGenerateDialog">生成教学方案</el-button>
            </el-empty>
          </div>
          <div v-else class="teaching-plan-content">
            <div class="plan-header">
              <h4>当前教学方案</h4>
              <div class="plan-actions">
                <el-button type="primary" size="small" @click="showImproveDialog">
                  <el-icon><Edit /></el-icon>改进方案
                </el-button>
                <el-button type="success" size="small" @click="showGenerateDialog">
                  <el-icon><Document /></el-icon>重新生成
                </el-button>
              </div>
            </div>
            <div class="plan-content">
              <div class="plan-text markdown-content" v-html="teachingPlanHtml"></div>
            </div>
          </div>
        </div>
      </div>

      <!-- 题型统计图表 - 已注释
      <div class="detail-card chart-card" v-if="questions.length > 0">
        <div class="card-header">
          <h3>习题统计</h3>
        </div>
        <div class="card-body chart-body">
          <div class="charts-container">
            <div class="chart-item">
              <div class="chart-title">题型分布</div>
              <div id="questionTypeChart" class="question-type-chart"></div>
            </div>

            <div class="chart-item">
              <div class="chart-title">难度分布</div>
              <div id="difficultyChart" class="difficulty-chart"></div>
            </div>
          </div>
        </div>
      </div>
      -->

      <!-- 习题区域 - 已注释
      <div class="detail-card questions-card">
        <div class="card-header">
          <h3>相关习题 ({{ questions.length }})</h3>
          <div class="header-actions">
            <el-button type="primary" size="small" @click="addQuestion">
              <el-icon><Plus /></el-icon>添加习题
            </el-button>
          </div>
        </div>

        <div class="card-body">
          <div v-if="loading" class="loading-container">
            <el-skeleton :rows="5" animated />
          </div>
          <div v-else-if="questions.length === 0" class="empty-tip">
            <el-empty description="暂无相关习题" :image-size="100">
              <template #image>
                <el-icon style="font-size: 50px; color: #909399;"><DocumentRemove /></el-icon>
              </template>
              <el-button type="primary" @click="addQuestion">添加习题</el-button>
            </el-empty>
          </div>
          <div v-else class="questions-list">
            <div v-for="(question, index) in displayQuestions" :key="question.questionId" class="question-item">
              <div class="question-header">
                <div class="question-index">{{ (currentPage - 1) * pageSize + index + 1 }}</div>
                <div class="question-type">
                  <el-tag size="small">{{ question.questionType }}</el-tag>
                </div>
                <div class="question-difficulty">
                  <el-tag size="small" :type="getQuestionDifficultyType(question.difficulty)">{{ question.difficulty }}</el-tag>
                </div>
              </div>
              <div class="question-content">
                <div class="question-title">{{ question.content }}</div>
                <div class="question-options">
                  <div v-for="(option, index) in question.options" :key="index" class="question-option">
                    <div class="option-key">{{ option.key }}.</div>
                    <div class="option-text">{{ option.text }}</div>
                  </div>
                </div>
                <div class="question-answer-row" v-if="question.referenceAnswer">
                  <div class="answer-label">参考答案:</div>
                  <div class="answer-content">{{ question.referenceAnswer }}</div>
                </div>
              </div>
              <div class="question-footer">
                <el-tag size="small" type="info" class="score-tag">{{ question.scorePoints || 0 }}分</el-tag>
                <div class="question-actions">
                  <el-button link type="primary" @click="viewQuestion(question)">查看详情</el-button>
                  <el-button link type="primary" @click="editQuestion(question)">编辑</el-button>
                  <el-button link type="danger" @click="deleteQuestion(question)">删除</el-button>
                </div>
              </div>
            </div>
          </div>

          <div class="pagination-container" v-if="questions.length > 0">
            <el-pagination
              v-model:current-page="currentPage"
              v-model:page-size="pageSize"
              :page-sizes="[5, 10, 20, 50]"
              layout="total, sizes, prev, pager, next, jumper"
              :total="questions.length"
              @size-change="handleSizeChange"
              @current-change="handleCurrentChange"
              background
            />
          </div>
        </div>
      </div>
      -->

      <!-- 文件管理模块 -->
      <div class="detail-card files-card">
        <div class="card-header">
          <h3>相关文件</h3>
          <div class="header-actions">
            <el-button type="primary" size="small" @click="showUploadDialog">
              <el-icon><Upload /></el-icon>上传文件
            </el-button>
            <el-input
              v-model="fileSearchPrefix"
              placeholder="搜索文件名前缀"
              style="width: 200px; margin-right: 12px;"
              clearable
              @keyup.enter="searchFiles"
            >
              <template #prefix>
                <el-icon><Search /></el-icon>
              </template>
            </el-input>
            <el-button type="primary" size="small" @click="searchFiles">
              <el-icon><Search /></el-icon>搜索文件
            </el-button>
            <el-button type="success" size="small" @click="refreshFiles">
              <el-icon><Refresh /></el-icon>刷新
            </el-button>
          </div>
        </div>
        
        <!-- 文件分类筛选 -->
        <div class="file-categories">
          <el-radio-group v-model="selectedCategory" @change="filterByCategory" size="small">
            <el-radio-button label="">全部</el-radio-button>
          </el-radio-group>
        </div>
        
        <div class="card-body">
          <div v-if="filesLoading" class="loading-container">
            <el-skeleton :rows="3" animated />
          </div>
          <div v-else-if="files.length === 0" class="empty-content">
            <el-empty description="暂无相关文件" :image-size="100">
              <template #image>
                <el-icon style="font-size: 50px; color: #909399;"><Folder /></el-icon>
              </template>
              <el-button type="primary" @click="refreshFiles">刷新文件列表</el-button>
            </el-empty>
          </div>
          <div v-else class="files-list">
            <div class="files-header">
              <el-checkbox 
                v-model="selectAllFiles" 
                @change="handleSelectAllFiles"
                :indeterminate="isIndeterminateFiles"
              >
                全选
              </el-checkbox>
              <div class="files-actions">
                <el-button 
                  v-if="selectedFiles.length > 0"
                  type="info" 
                  size="small" 
                  @click="clearFileSelection"
                >
                  清空选择
                </el-button>
                <el-button 
                  type="danger" 
                  size="small" 
                  :disabled="selectedFiles.length === 0"
                  :loading="batchDeleteLoading"
                  @click="batchDeleteFiles"
                >
                  <el-icon><Delete /></el-icon>
                  {{ batchDeleteLoading ? '删除中...' : '批量删除' }}
                </el-button>
              </div>
            </div>
            
            <div class="files-grid">
              <div 
                v-for="file in files" 
                :key="file" 
                class="file-item"
                :class="{ 'selected': selectedFiles.includes(file) }"
                @click="toggleFileSelection(file)"
              >
                <div class="file-icon">
                  <el-icon>
                    <component :is="getFileIcon(file)" />
                  </el-icon>
                </div>
                <div class="file-name" :title="file">{{ file }}</div>
                <div class="file-category">
                  <el-tag size="small" type="info">{{ getFileCategory(file) }}</el-tag>
                </div>
                <div class="file-actions">
                  <el-button 
                    link 
                    type="primary" 
                    size="small" 
                    @click.stop="previewFile(file)"
                    title="预览文件"
                  >
                    <el-icon><View /></el-icon>
                  </el-button>
                  <el-button 
                    link 
                    type="primary" 
                    size="small" 
                    @click.stop="downloadFile(file)"
                    title="下载文件"
                  >
                    <el-icon><Download /></el-icon>
                  </el-button>
                  <el-button 
                    link 
                    type="danger" 
                    size="small" 
                    :loading="deleteLoading"
                    @click.stop="deleteFile(file)"
                    title="删除文件"
                  >
                    <el-icon><Delete /></el-icon>
                  </el-button>
                </div>
              </div>
            </div>
            
            <div class="files-summary">
              <span>{{ getFileSelectionStatus() }}</span>
              <span v-if="selectedFiles.length > 0" class="selection-info">
                已选择 {{ selectedFiles.length }} 个文件
              </span>
            </div>
            
            <!-- 删除历史记录 -->
            <div v-if="deletedFilesHistory.length > 0" class="delete-history">
              <div class="history-header">
                <h4>删除历史</h4>
                <el-button 
                  type="text" 
                  size="small" 
                  @click="clearDeleteHistory"
                >
                  清空历史
                </el-button>
              </div>
              <div class="history-list">
                <div 
                  v-for="(item, index) in deletedFilesHistory" 
                  :key="index"
                  class="history-item"
                >
                  <div class="history-info">
                    <span class="history-time">{{ item.timestamp }}</span>
                    <span class="history-count">删除了 {{ item.count }} 个文件</span>
                  </div>
                  <div class="history-files">
                    {{ item.files.slice(0, 3).join('、') }}
                    <span v-if="item.files.length > 3">等 {{ item.files.length }} 个文件</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- 编辑知识点对话框 -->
    <el-dialog v-model="editDialogVisible" title="编辑知识点" width="500px">
      <el-form :model="editForm" label-width="100px" :rules="rules" ref="formRef">
        <el-form-item label="知识点名称" prop="name">
          <el-input v-model="editForm.name" placeholder="请输入知识点名称" />
        </el-form-item>
        <el-form-item label="所属课程">
          <el-input v-model="courseName" disabled />
        </el-form-item>
        <el-form-item label="难度等级" prop="difficultyLevel">
          <el-select v-model="editForm.difficultyLevel" placeholder="请选择难度等级">
            <el-option label="简单" value="简单"></el-option>
            <el-option label="中等" value="中等"></el-option>
            <el-option label="困难" value="困难"></el-option>
          </el-select>
        </el-form-item>
        <el-form-item label="描述">
          <el-input v-model="editForm.description" type="textarea" :rows="3" placeholder="请输入知识点描述" />
        </el-form-item>
        <el-form-item label="教学计划">
          <el-input v-model="editForm.teachPlan" type="textarea" :rows="3" placeholder="请输入教学计划" />
        </el-form-item>
      </el-form>
      <template #footer>
        <div class="dialog-footer">
          <el-button @click="editDialogVisible = false">取消</el-button>
          <el-button type="primary" @click="saveKnowledge">保存</el-button>
        </div>
      </template>
    </el-dialog>

    <!-- 编辑知识点内容对话框 -->
    <el-dialog v-model="contentDialogVisible" title="编辑知识点内容" width="700px">
      <el-form :model="contentForm" label-width="0">
        <el-form-item>
          <el-input v-model="contentForm.description" type="textarea" :rows="15" placeholder="请输入知识点内容..." />
        </el-form-item>
      </el-form>
      <template #footer>
        <div class="dialog-footer">
          <el-button @click="contentDialogVisible = false">取消</el-button>
          <el-button type="primary" @click="saveKnowledgeContent">保存</el-button>
        </div>
      </template>
    </el-dialog>

    <!-- 添加/编辑习题对话框 - 已注释
    <el-dialog v-model="questionDialogVisible" :title="isEditingQuestion ? '编辑习题' : '添加习题'" width="700px">
      <el-form :model="questionForm" label-width="100px" :rules="questionRules" ref="questionFormRef">
        <el-form-item label="题目类型" prop="questionType">
          <el-select v-model="questionForm.questionType" placeholder="请选择题目类型">
            <el-option label="选择题" value="选择题"></el-option>
            <el-option label="填空题" value="填空题"></el-option>
            <el-option label="判断题" value="判断题"></el-option>
            <el-option label="简答题" value="简答题"></el-option>
          </el-select>
        </el-form-item>
        <el-form-item label="题目内容" prop="content">
          <el-input v-model="questionForm.content" type="textarea" :rows="3" placeholder="请输入题目内容" />
        </el-form-item>

        <template v-if="questionForm.questionType === '选择题' || questionForm.questionType === '判断题'">
          <el-form-item label="选项">
            <div v-for="(option, index) in questionForm.options" :key="index" class="option-input-item">
              <div class="option-input-key">{{ option.key }}.</div>
              <el-input v-model="option.text" placeholder="请输入选项内容" :disabled="questionForm.questionType === '判断题'" />
              <el-button @click="removeOption(index)" type="danger" circle plain
                v-if="questionForm.options.length > 2 && questionForm.questionType === '选择题'">
                <el-icon><Delete /></el-icon>
              </el-button>
            </div>
            <div class="add-option-button" v-if="questionForm.questionType === '选择题'">
              <el-button @click="addOption" type="primary" plain v-if="questionForm.options.length < 6">
                <el-icon><Plus /></el-icon>添加选项
              </el-button>
            </div>
          </el-form-item>
        </template>

        <el-form-item label="参考答案" prop="referenceAnswer">
          <template v-if="questionForm.questionType === '选择题' || questionForm.questionType === '判断题'">
            <el-select v-model="questionForm.referenceAnswer" placeholder="请选择正确答案">
              <el-option
                v-for="option in questionForm.options"
                :key="option.key"
                :label="option.key"
                :value="option.key">
              </el-option>
            </el-select>
          </template>
          <template v-else>
            <el-input v-model="questionForm.referenceAnswer" type="textarea" :rows="2" placeholder="请输入参考答案" />
          </template>
        </el-form-item>

        <el-form-item label="难度等级" prop="difficulty">
          <el-select v-model="questionForm.difficulty" placeholder="请选择难度等级">
            <el-option label="简单" value="简单"></el-option>
            <el-option label="中等" value="中等"></el-option>
            <el-option label="困难" value="困难"></el-option>
          </el-select>
        </el-form-item>

        <el-form-item label="分值" prop="scorePoints">
          <el-input-number v-model="questionForm.scorePoints" :min="1" :max="100" />
        </el-form-item>

        <el-form-item label="解析">
          <el-input v-model="questionForm.analysis" type="textarea" :rows="2" placeholder="请输入题目解析（可选）" />
        </el-form-item>
      </el-form>
      <template #footer>
        <div class="dialog-footer">
          <el-button @click="questionDialogVisible = false">取消</el-button>
          <el-button type="primary" @click="saveQuestion">保存</el-button>
        </div>
      </template>
    </el-dialog>
    -->

    <!-- 生成教学方案对话框 -->
    <el-dialog v-model="generateDialogVisible" title="生成教学方案" width="600px">
      <el-alert
        title="提示"
        type="info"
        :closable="false"
        show-icon
        style="margin-bottom: 20px;">
        <template #default>
          AI生成教学方案需要1-2分钟时间，请耐心等待。系统会根据您的配置生成个性化的教学方案。
        </template>
      </el-alert>
      <el-form :model="generateForm" label-width="120px" :rules="generateRules" ref="generateFormRef">
        <el-form-item label="学科类型" prop="subjectType">
          <el-input v-model="generateForm.subjectType" placeholder="请输入学科类型或课程名称" />
        </el-form-item>
        <el-form-item label="知识点大纲" prop="courseOutline">
          <el-input
            v-model="generateForm.courseOutline"
            type="textarea"
            :rows="4"
            placeholder="请输入知识点名称或内容大纲"
          />
        </el-form-item>
        <el-form-item label="课程时长" prop="duration">
          <el-input-number
            v-model="generateForm.duration"
            :min="10"
            :max="180"
            :step="5"
            controls-position="right"
          />
          <span style="margin-left: 8px; color: #909399;">分钟</span>
        </el-form-item>
        <el-form-item label="难度等级" prop="difficultyLevel">
          <el-select v-model="generateForm.difficultyLevel" placeholder="请选择难度等级">
            <el-option label="简单" value="简单"></el-option>
            <el-option label="中等" value="中等"></el-option>
            <el-option label="困难" value="困难"></el-option>
          </el-select>
        </el-form-item>
        <el-form-item label="教学风格" prop="teachingStyle">
          <el-select v-model="generateForm.teachingStyle" placeholder="请选择教学风格">
            <el-option label="讲授式" value="讲授式"></el-option>
            <el-option label="互动式" value="互动式"></el-option>
            <el-option label="探究式" value="探究式"></el-option>
            <el-option label="案例式" value="案例式"></el-option>
            <el-option label="实践式" value="实践式"></el-option>
          </el-select>
        </el-form-item>
      </el-form>
      <template #footer>
        <div class="dialog-footer">
          <el-button @click="generateDialogVisible = false">取消</el-button>
          <el-button type="primary" @click="generateTeachingPlan" :loading="generating">
            {{ generating ? 'AI正在生成中，请耐心等待...' : '生成方案' }}
          </el-button>
        </div>
      </template>
    </el-dialog>

    <!-- 改进教学方案对话框 -->
    <el-dialog v-model="improveDialogVisible" title="改进教学方案" width="600px">
      <el-alert
        title="提示"
        type="info"
        :closable="false"
        show-icon
        style="margin-bottom: 20px;">
        <template #default>
          AI改进教学方案需要1-2分钟时间，请耐心等待。请详细描述您的改进建议，系统会据此优化方案。
        </template>
      </el-alert>
      <el-form :model="improveForm" label-width="120px" :rules="improveRules" ref="improveFormRef">
        <el-form-item label="当前方案">
          <el-input
            v-model="improveForm.teachingPlan"
            type="textarea"
            :rows="8"
            readonly
            placeholder="当前教学方案"
          />
        </el-form-item>
        <el-form-item label="改进建议" prop="suggestion">
          <el-input
            v-model="improveForm.suggestion"
            type="textarea"
            :rows="4"
            placeholder="请输入您的改进建议，例如：增加更多互动环节、调整教学重点、优化教学方法等"
          />
        </el-form-item>
      </el-form>
      <template #footer>
        <div class="dialog-footer">
          <el-button @click="improveDialogVisible = false">取消</el-button>
          <el-button type="primary" @click="improveTeachingPlan" :loading="improving">
            {{ improving ? 'AI正在改进中，请耐心等待...' : '改进方案' }}
          </el-button>
        </div>
      </template>
    </el-dialog>

    <!-- 上传对话框 -->
    <el-dialog v-model="uploadDialogVisible" title="上传文件" width="500px" :close-on-click-modal="false">
      <div class="upload-form">
        <div class="upload-section">
          <label class="upload-label">选择文件：</label>
          <div 
            class="upload-drop-zone"
            @drop="handleDrop"
            @dragover="handleDragOver"
            @dragleave="handleDragLeave"
            :class="{ 'drag-over': isDragOver }"
          >
            <input 
              type="file" 
              ref="fileInput" 
              @change="handleFileSelect" 
              accept="*/*"
              style="display: none;"
            />
            <div class="drop-zone-content">
              <el-icon class="drop-icon"><Upload /></el-icon>
              <p class="drop-text">点击选择文件或拖拽文件到此处</p>
              <p class="drop-hint">支持所有文件类型，最大100MB</p>
            </div>
            <el-button type="primary" @click="$refs.fileInput.click()">
              <el-icon><Upload /></el-icon>选择文件
            </el-button>
          </div>
          <div v-if="uploadFile" class="file-info">
            <div class="file-details">
              <span class="file-name">{{ uploadFile.name }}</span>
              <span class="file-size">{{ formatFileSize(uploadFile.size) }}</span>
            </div>
            <div class="file-type">{{ uploadFile.type || '未知类型' }}</div>
          </div>
        </div>
        
        <div class="upload-section">
          <label class="upload-label">文件名：</label>
          <el-input 
            v-model="uploadFileName" 
            placeholder="请输入文件名（可选，默认使用原文件名）"
            :disabled="!uploadFile"
          />
        </div>
        
        <div class="upload-actions">
          <el-button 
            type="primary" 
            :loading="uploadLoading" 
            :disabled="!uploadFile"
            @click="uploadFileToServer"
          >
            {{ uploadLoading ? '上传中...' : '开始上传' }}
          </el-button>
          <el-button @click="closeUploadDialog">取消</el-button>
        </div>
      </div>
    </el-dialog>

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
  </div>
</template>

<script setup>
import { ref, onMounted, computed } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { ElMessage } from 'element-plus'
import { ArrowLeft, Edit, Document, Search, Refresh, Delete, Download, Folder, Upload, View } from '@element-plus/icons-vue'
// 题目模块相关导入已注释：watch, nextTick, onUnmounted, ElMessageBox, Plus, DocumentRemove, Delete, echarts
import { knowledgeAPI, studentAssistantAPI, minioController } from '@/api/api'
import BigNumber from 'bignumber.js'
import { marked } from 'marked'
import DOMPurify from 'dompurify'
import { ElMessageBox } from 'element-plus'

const route = useRoute()
const router = useRouter()
const knowledgeId = route.params.knowledgeId // 从路由参数中获取知识点ID
const courseName = ref(route.query.courseName || '未知课程')
const knowledgeName = ref(route.query.knowledgeName || '知识点')
// 获取课程ID，用于返回课程时可能需要
const courseIdFromQuery = route.query.courseId

// 知识点数据
const knowledgeData = ref(null)
const loading = ref(true)

// 编辑对话框
const editDialogVisible = ref(false)
const formRef = ref(null)
const editForm = ref({
  name: '',
  difficultyLevel: '中等',
  description: '',
  teachPlan: ''
})

// 知识点内容编辑对话框
const contentDialogVisible = ref(false)
const contentForm = ref({
  description: ''
})

// 教师智能备课相关变量
const teachingPlan = ref('')
const generateDialogVisible = ref(false)
const improveDialogVisible = ref(false)
const generating = ref(false)
const improving = ref(false)

// 生成教学方案表单
const generateForm = ref({
  subjectType: '',
  courseOutline: '',
  duration: 45,
  difficultyLevel: '中等',
  teachingStyle: '讲授式'
})

// 改进教学方案表单
const improveForm = ref({
  teachingPlan: '',
  suggestion: ''
})

// 表单引用
const generateFormRef = ref(null)
const improveFormRef = ref(null)

// 计算属性：将教学方案转换为HTML
const teachingPlanHtml = computed(() => {
  if (!teachingPlan.value) return ''

  // 配置marked选项
  marked.setOptions({
    breaks: true, // 支持换行
    gfm: true, // 支持GitHub风格的Markdown
  })

  // 将Markdown转换为HTML并清理
  const rawHtml = marked(teachingPlan.value)
  return DOMPurify.sanitize(rawHtml)
})

// 表单验证规则
const rules = {
  name: [
    { required: true, message: '请输入知识点名称', trigger: 'blur' },
    { min: 2, max: 50, message: '长度在 2 到 50 个字符', trigger: 'blur' }
  ],
  difficultyLevel: [
    { required: true, message: '请选择难度等级', trigger: 'change' }
  ]
}

// 生成教学方案表单验证规则
const generateRules = {
  subjectType: [
    { required: true, message: '请输入学科类型或课程名称', trigger: 'blur' },
    { min: 2, max: 50, message: '长度在 2 到 50 个字符', trigger: 'blur' }
  ],
  courseOutline: [
    { required: true, message: '请输入知识点名称或内容大纲', trigger: 'blur' },
    { min: 5, max: 1000, message: '长度在 5 到 1000 个字符', trigger: 'blur' }
  ],
  duration: [
    { required: true, message: '请输入课程时长', trigger: 'blur' }
  ],
  difficultyLevel: [
    { required: true, message: '请选择难度等级', trigger: 'change' }
  ],
  teachingStyle: [
    { required: true, message: '请选择教学风格', trigger: 'change' }
  ]
}

// 改进教学方案表单验证规则
const improveRules = {
  suggestion: [
    { required: true, message: '请输入改进建议', trigger: 'blur' },
    { min: 5, max: 500, message: '长度在 5 到 500 个字符', trigger: 'blur' }
  ]
}

// 题目模块相关变量 - 已注释
/*
// 相关习题
const questions = ref([])
// 分页相关
const currentPage = ref(1)
const pageSize = ref(10)

// 图表相关
let typeChart = null;
let difficultyChart = null;

// 题型颜色映射
const typeColors = {
  '选择题': '#4B8DE6',
  '填空题': '#67C23A',
  '判断题': '#E6A23C',
  '简答题': '#F56C6C',
  '未知类型': '#909399'
}

// 难度颜色映射
const difficultyColors = {
  '简单': '#67C23A',
  '中等': '#E6A23C',
  '困难': '#F56C6C',
  '未知难度': '#909399'
}

// 计算属性：当前页显示的题目
const displayQuestions = computed(() => {
  const start = (currentPage.value - 1) * pageSize.value
  const end = start + pageSize.value
  return questions.value.slice(start, end)
})

// 习题对话框相关
const questionDialogVisible = ref(false)
const questionFormRef = ref(null)
const isEditingQuestion = ref(false)
const currentEditingQuestion = ref(null)

// 习题表单
const questionForm = ref({
  questionType: '选择题',
  content: '',
  options: [
    { key: 'A', text: '' },
    { key: 'B', text: '' },
    { key: 'C', text: '' },
    { key: 'D', text: '' }
  ],
  referenceAnswer: '',
  difficulty: '中等',
  scorePoints: 5,
  analysis: ''
})

// 表单验证规则
const questionRules = {
  questionType: [
    { required: true, message: '请选择题目类型', trigger: 'change' }
  ],
  content: [
    { required: true, message: '请输入题目内容', trigger: 'blur' },
    { min: 2, max: 1000, message: '长度在 2 到 1000 个字符', trigger: 'blur' }
  ],
  referenceAnswer: [
    { required: true, message: '请输入参考答案', trigger: 'blur' }
  ],
  difficulty: [
    { required: true, message: '请选择难度等级', trigger: 'change' }
  ],
  scorePoints: [
    { required: true, message: '请输入分值', trigger: 'blur' }
  ]
}
*/

// 题目模块相关监听器 - 已注释
/*
// 监听题目类型变化，重置参考答案
watch(() => questionForm.value.questionType, (newType) => {
  questionForm.value.referenceAnswer = ''

  if (newType === '判断题') {
    // 为判断题设置固定的选项
    questionForm.value.options = [
      { key: 'A', text: '正确' },
      { key: 'B', text: '错误' }
    ]
  } else if (newType === '选择题' && questionForm.value.options.length === 0) {
    // 如果切换到选择题，且没有选项，则初始化选项
    questionForm.value.options = [
      { key: 'A', text: '' },
      { key: 'B', text: '' },
      { key: 'C', text: '' },
      { key: 'D', text: '' }
    ]
  }
})

// 监听习题数据变化，更新图表
watch(() => questions.value, () => {
  if (questions.value.length > 0) {
    nextTick(() => {
      initCharts()
    })
  }
}, { deep: true })
*/

// 题目模块相关图表函数 - 已注释
/*
// 初始化图表
function initCharts() {
  nextTick(() => {
    initTypeChart();
    initDifficultyChart();
  });
}

// 初始化题型分布图表
function initTypeChart() {
  const chartDom = document.getElementById('questionTypeChart');
  if (!chartDom) {
    console.error('找不到题型图表容器元素');
    return;
  }

  // 设置图表容器高度
  chartDom.style.height = '100%';

  // 清空现有图表实例
  if (typeChart) {
    typeChart.dispose();
  }

  // 创建图表实例
  typeChart = echarts.init(chartDom);

  // 计算题型统计数据
  const typeCount = {};
  questions.value.forEach(question => {
    const type = question.questionType || '未知类型';
    typeCount[type] = (typeCount[type] || 0) + 1;
  });

  // 对数据排序，确保图表显示有序
  const sortedTypes = Object.keys(typeCount).sort();
  const data = sortedTypes.map(type => ({
    name: type,
    value: typeCount[type],
    itemStyle: {
      color: typeColors[type] || typeColors['未知类型']
    }
  }));

  const option = {
    tooltip: {
      trigger: 'item',
      formatter: '{a} <br/>{b}: {c}题 ({d}%)',
      confine: true
    },
    legend: {
      orient: 'horizontal',
      bottom: 0,
      left: 'center',
      itemWidth: 12,
      itemHeight: 8,
      textStyle: {
        fontSize: 11
      },
      data: sortedTypes
    },
    series: [
      {
        name: '题型分布',
        type: 'pie',
        radius: ['30%', '70%'],
        center: ['50%', '40%'],
        avoidLabelOverlap: true,
        itemStyle: {
          borderRadius: 4,
          borderColor: '#fff',
          borderWidth: 1
        },
        label: {
          show: true,
          position: 'outside',
          formatter: '{b}: {c}题',
          fontSize: 11
        },
        labelLine: {
          show: true,
          length: 10,
          length2: 8,
          smooth: true
        },
        emphasis: {
          focus: 'series',
          scaleSize: 5,
          itemStyle: {
            shadowBlur: 10,
            shadowOffsetX: 0,
            shadowColor: 'rgba(0, 0, 0, 0.2)'
          }
        },
        data: data
      }
    ]
  };

  typeChart.setOption(option);

  // 响应窗口大小变化
  window.addEventListener('resize', handleResize);
}
*/

/*
// 初始化难度分布图表
function initDifficultyChart() {
  const chartDom = document.getElementById('difficultyChart');
  if (!chartDom) {
    console.error('找不到难度图表容器元素');
    return;
  }

  // 设置图表容器高度
  chartDom.style.height = '100%';

  // 清空现有图表实例
  if (difficultyChart) {
    difficultyChart.dispose();
  }

  // 创建图表实例
  difficultyChart = echarts.init(chartDom);

  // 计算难度分布数据
  const difficultyCount = {};
  questions.value.forEach(question => {
    const difficulty = question.difficulty || '未知难度';
    difficultyCount[difficulty] = (difficultyCount[difficulty] || 0) + 1;
  });

  // 对难度进行排序：简单、中等、困难
  const difficultyOrder = ['简单', '中等', '困难', '未知难度'];
  const sortedDifficulties = Object.keys(difficultyCount).sort((a, b) => {
    return difficultyOrder.indexOf(a) - difficultyOrder.indexOf(b);
  });

  const data = sortedDifficulties.map(difficulty => ({
    name: difficulty,
    value: difficultyCount[difficulty],
    itemStyle: {
      color: difficultyColors[difficulty] || difficultyColors['未知难度']
    }
  }));

  const option = {
    tooltip: {
      trigger: 'item',
      formatter: '{a} <br/>{b}: {c}题 ({d}%)',
      confine: true
    },
    legend: {
      orient: 'horizontal',
      bottom: 0,
      left: 'center',
      itemWidth: 12,
      itemHeight: 8,
      textStyle: {
        fontSize: 11
      },
      data: sortedDifficulties
    },
    series: [
      {
        name: '难度分布',
        type: 'pie',
        radius: ['30%', '70%'],
        center: ['50%', '40%'],
        avoidLabelOverlap: true,
        itemStyle: {
          borderRadius: 4,
          borderColor: '#fff',
          borderWidth: 1
        },
        label: {
          show: true,
          position: 'outside',
          formatter: '{b}: {c}题',
          fontSize: 11
        },
        labelLine: {
          show: true,
          length: 10,
          length2: 8,
          smooth: true
        },
        emphasis: {
          focus: 'series',
          scaleSize: 5,
          itemStyle: {
            shadowBlur: 10,
            shadowOffsetX: 0,
            shadowColor: 'rgba(0, 0, 0, 0.2)'
          }
        },
        data: data
      }
    ]
  };

  difficultyChart.setOption(option);

  // 响应窗口大小变化
  window.addEventListener('resize', handleResize);
}
*/

// 获取知识点详情
async function fetchKnowledgeDetail() {
  loading.value = true
  try {
    // 确保知识点ID是字符串形式
    const knowledgeIdStr = knowledgeId ? new BigNumber(knowledgeId).toString() : knowledgeId
    console.log('获取知识点详情，知识点ID:', knowledgeIdStr)
    
    const response = await knowledgeAPI.getKnowledgeById(knowledgeIdStr)
    console.log('获取到的知识点详情:', response)
    
    if (response) {
      knowledgeData.value = response
      knowledgeName.value = response.name || '未命名知识点'
      
      // 初始化编辑表单
      editForm.value = {
        name: response.name || '',
        difficultyLevel: response.difficultyLevel || '中等',
        description: response.description || '',
        teachPlan: response.teachPlan || ''
      }

      // 初始化生成教学方案表单的默认值
      generateForm.value = {
        subjectType: courseName.value || '',
        courseOutline: response.name || '',
        duration: 45,
        difficultyLevel: response.difficultyLevel || '中等',
        teachingStyle: '讲授式'
      }

      // 如果已有教学计划，则显示
      if (response.teachPlan) {
        teachingPlan.value = response.teachPlan
      }

      // 获取相关习题 - 已注释
      // await fetchQuestions()
    } else {
      ElMessage.error('获取知识点详情失败')
      knowledgeData.value = null
    }
  } catch (error) {
    console.error('获取知识点详情失败:', error)
    ElMessage.error('获取知识点详情失败，请稍后重试')
    knowledgeData.value = null
  } finally {
    loading.value = false
  }
}

// 教师智能备课相关函数
// 显示生成教学方案对话框
function showGenerateDialog() {
  // 重新初始化表单数据
  generateForm.value = {
    subjectType: courseName.value || '',
    courseOutline: knowledgeData.value?.name || '',
    duration: 45,
    difficultyLevel: knowledgeData.value?.difficultyLevel || '中等',
    teachingStyle: '讲授式'
  }
  generateDialogVisible.value = true
}

// 显示改进教学方案对话框
function showImproveDialog() {
  if (!teachingPlan.value) {
    ElMessage.warning('请先生成教学方案')
    return
  }

  improveForm.value = {
    teachingPlan: teachingPlan.value,
    suggestion: ''
  }
  improveDialogVisible.value = true
}

// 生成教学方案
async function generateTeachingPlan() {
  if (!generateFormRef.value) return

  generateFormRef.value.validate(async (valid) => {
    if (valid) {
      generating.value = true
      try {
        console.log('生成教学方案，数据:', generateForm.value)

        const response = await studentAssistantAPI.generateLesson(generateForm.value)
        console.log('生成教学方案响应:', response)

        // 灵活处理响应格式，支持多种可能的字段名
        let generatedPlan = null
        if (response) {
          generatedPlan = response.teachingPlan || response.plan || response.content || response.result || response.data

          // 如果响应是字符串，直接使用
          if (typeof response === 'string') {
            generatedPlan = response
          }
        }

        if (generatedPlan) {
          teachingPlan.value = generatedPlan
          ElMessage.success('教学方案生成成功')
          generateDialogVisible.value = false

          // 可选：将生成的教学方案保存到知识点的teachPlan字段
          await saveTeachingPlanToKnowledge(generatedPlan)
        } else {
          ElMessage.error('生成教学方案失败，请稍后重试')
        }
      } catch (error) {
        console.error('生成教学方案失败:', error)

        // 特殊处理超时错误
        if (error.code === 'ECONNABORTED' || error.message.includes('timeout')) {
          ElMessage.error('AI生成教学方案超时，请稍后重试。生成过程可能需要1-2分钟，请耐心等待。')
        } else if (error.response?.status === 500) {
          ElMessage.error('服务器处理超时，请稍后重试')
        } else {
          ElMessage.error('生成教学方案失败: ' + (error.message || '请稍后重试'))
        }
      } finally {
        generating.value = false
      }
    }
  })
}

// 改进教学方案
async function improveTeachingPlan() {
  if (!improveFormRef.value) return

  improveFormRef.value.validate(async (valid) => {
    if (valid) {
      improving.value = true
      try {
        console.log('改进教学方案，数据:', improveForm.value)

        const response = await studentAssistantAPI.improveLesson(improveForm.value)
        console.log('改进教学方案响应:', response)

        // 灵活处理响应格式，支持多种可能的字段名
        let improvedPlan = null
        if (response) {
          improvedPlan = response.improvedPlan || response.teachingPlan || response.plan || response.content || response.result || response.data

          // 如果响应是字符串，直接使用
          if (typeof response === 'string') {
            improvedPlan = response
          }
        }

        if (improvedPlan) {
          teachingPlan.value = improvedPlan
          ElMessage.success('教学方案改进成功')
          improveDialogVisible.value = false

          // 可选：将改进的教学方案保存到知识点的teachPlan字段
          await saveTeachingPlanToKnowledge(improvedPlan)
        } else {
          ElMessage.error('改进教学方案失败，请稍后重试')
        }
      } catch (error) {
        console.error('改进教学方案失败:', error)

        // 特殊处理超时错误
        if (error.code === 'ECONNABORTED' || error.message.includes('timeout')) {
          ElMessage.error('AI改进教学方案超时，请稍后重试。改进过程可能需要1-2分钟，请耐心等待。')
        } else if (error.response?.status === 500) {
          ElMessage.error('服务器处理超时，请稍后重试')
        } else {
          ElMessage.error('改进教学方案失败: ' + (error.message || '请稍后重试'))
        }
      } finally {
        improving.value = false
      }
    }
  })
}

// 将教学方案保存到知识点
async function saveTeachingPlanToKnowledge(plan) {
  try {
    // 从localstorage中获取教师ID
    const userInfoStr = localStorage.getItem('user_info')
    if (!userInfoStr) {
      console.warn('未找到用户信息，无法保存教学方案到知识点')
      return
    }

    const userInfo = JSON.parse(userInfoStr)
    if (!userInfo || !userInfo.teacherId) {
      console.warn('用户信息不完整，无法保存教学方案到知识点')
      return
    }

    // 确保教师ID和知识点ID是字符串形式
    const teacherId = userInfo.teacherId ? new BigNumber(userInfo.teacherId).toString() : userInfo.teacherId
    const knowledgeIdStr = knowledgeId ? new BigNumber(knowledgeId).toString() : knowledgeId

    const updateData = {
      knowledgeId: knowledgeIdStr,
      teachPlan: plan,
      teacherId: teacherId
    }

    await knowledgeAPI.updateKnowledge(updateData)
    console.log('教学方案已保存到知识点')
  } catch (error) {
    console.error('保存教学方案到知识点失败:', error)
    // 不显示错误消息，因为这是可选操作
  }
}

// 题目模块相关函数 - 已注释
/*
// 获取相关习题
async function fetchQuestions() {
  loading.value = true
  try {
    // 确保知识点ID是字符串形式
    const knowledgeIdStr = knowledgeId ? new BigNumber(knowledgeId).toString() : knowledgeId

    const response = await knowledgeAPI.getQuestionsByKnowledgeId(knowledgeIdStr)
    console.log('获取到的相关习题:', response)

    if (Array.isArray(response)) {
      questions.value = response

      // 确保在DOM更新后初始化图表
      if (response.length > 0) {
        // 使用nextTick确保DOM已更新
        nextTick(() => {
          // 再使用setTimeout确保图表容器已渲染
          setTimeout(() => {
            console.log('尝试初始化图表...')
            initCharts()
          }, 300)
        })
      }
    } else {
      questions.value = []
    }
  } catch (error) {
    console.error('获取相关习题失败:', error)
    questions.value = []
    ElMessage.error('获取习题失败，请稍后重试')
  } finally {
    loading.value = false
  }
}
*/

// 返回上一页
function goBack() {
  // 如果有课程ID，则返回到课程详情页
  if (courseIdFromQuery) {
    router.push(`/teacher/course/${courseIdFromQuery}`)
  } else {
    // 否则返回上一页
    router.back()
  }
}

// 编辑知识点
function editKnowledge() {
  editDialogVisible.value = true
}

// 编辑知识点内容
function editKnowledgeContent() {
  contentForm.value = {
    description: knowledgeData.value.description || ''
  }
  contentDialogVisible.value = true
}

// 保存知识点
async function saveKnowledge() {
  formRef.value.validate(async (valid) => {
    if (valid) {
      try {
        // 从localstorage中获取教师ID
        const userInfoStr = localStorage.getItem('user_info')
        if (!userInfoStr) {
          throw new Error('未找到用户信息，请重新登录')
        }
        
        const userInfo = JSON.parse(userInfoStr)
        if (!userInfo || !userInfo.teacherId) {
          throw new Error('用户信息不完整或不是教师账号')
        }
        
        // 确保教师ID是字符串形式
        const teacherId = userInfo.teacherId ? new BigNumber(userInfo.teacherId).toString() : userInfo.teacherId
        
        // 更新知识点
        const knowledgeIdStr = knowledgeId ? new BigNumber(knowledgeId).toString() : knowledgeId
        const updateData = {
          knowledgeId: knowledgeIdStr,
          name: editForm.value.name,
          description: editForm.value.description || '',
          difficultyLevel: editForm.value.difficultyLevel,
          teacherId: teacherId,
          teachPlan: editForm.value.teachPlan || ''
        }
        
        await knowledgeAPI.updateKnowledge(updateData)
        
        // 重新获取知识点详情
        await fetchKnowledgeDetail()
        
        ElMessage.success('知识点更新成功')
        editDialogVisible.value = false
      } catch (error) {
        console.error('更新知识点失败:', error)
        ElMessage.error('更新知识点失败: ' + (error.message || '请稍后重试'))
      }
    }
  })
}

// 保存知识点内容
async function saveKnowledgeContent() {
  // 从localstorage中获取教师ID
  const userInfoStr = localStorage.getItem('user_info')
  if (!userInfoStr) {
    ElMessage.error('未找到用户信息，请重新登录')
    return
  }
  
  const userInfo = JSON.parse(userInfoStr)
  if (!userInfo || !userInfo.teacherId) {
    ElMessage.error('用户信息不完整或不是教师账号')
    return
  }
  
  // 确保教师ID是字符串形式
  const teacherId = userInfo.teacherId ? new BigNumber(userInfo.teacherId).toString() : userInfo.teacherId
  
  // 确保知识点ID是字符串形式
  const knowledgeIdStr = knowledgeId ? new BigNumber(knowledgeId).toString() : knowledgeId
  
  const updateData = {
    knowledgeId: knowledgeIdStr,
    description: contentForm.value.description || '',
    teacherId: teacherId
  }
  
  try {
    await knowledgeAPI.updateKnowledge(updateData)
    ElMessage.success('知识点内容更新成功')
    contentDialogVisible.value = false
    await fetchKnowledgeDetail() // 重新获取知识点详情以更新描述
  } catch (error) {
    console.error('更新知识点内容失败:', error)
    ElMessage.error('更新知识点内容失败: ' + (error.message || '请稍后重试'))
  }
}

/*
// 添加习题
function addQuestion() {
  isEditingQuestion.value = false
  currentEditingQuestion.value = null

  // 重置表单
  questionForm.value = {
    questionType: '选择题',
    content: '',
    options: [
      { key: 'A', text: '' },
      { key: 'B', text: '' },
      { key: 'C', text: '' },
      { key: 'D', text: '' }
    ],
    referenceAnswer: '',
    difficulty: '中等',
    scorePoints: 5,
    analysis: ''
  }

  questionDialogVisible.value = true
}

// 查看习题
function viewQuestion(question) {
  ElMessage.info(`查看习题: ${question.content}`)
}

// 删除习题
function deleteQuestion(question) {
  ElMessageBox.confirm(
    `确定要删除习题"${question.content}"吗？`,
    '删除确认',
    {
      confirmButtonText: '确定',
      cancelButtonText: '取消',
      type: 'warning'
    }
  ).then(async () => {
    try {
      await knowledgeAPI.deleteQuestion(question.questionId)
      ElMessage.success('习题删除成功')
      // 重新获取习题列表
      await fetchQuestions()
    } catch (error) {
      console.error('删除习题失败:', error)
      ElMessage.error('删除习题失败: ' + (error.message || '请稍后重试'))
    }
  }).catch(() => {
    // 用户取消删除
  })
}
*/

/*
// 编辑习题
function editQuestion(question) {
  isEditingQuestion.value = true
  currentEditingQuestion.value = question

  // 从题目内容中提取选项（如果是选择题）
  let content = question.content;
  let options = [];

  if (question.questionType === '选择题') {
    // 尝试从内容中提取选项
    const contentLines = content.split('\n');
    let mainContent = [];
    let optionsStarted = false;

    for (const line of contentLines) {
      const trimmedLine = line.trim();
      // 查找选项格式的行 (A. xxx, B. xxx 等)
      if (/^[A-Z]\.\s/.test(trimmedLine)) {
        optionsStarted = true;
        const key = trimmedLine[0]; // 获取选项字母
        const text = trimmedLine.substring(2).trim(); // 获取选项内容
        options.push({ key, text });
      } else if (!optionsStarted && trimmedLine) {
        // 如果还没开始处理选项且行不为空，添加到主内容
        mainContent.push(trimmedLine);
      }
    }

    // 更新题目内容（仅保留主要内容）
    content = mainContent.join('\n');
  }

  // 复制问题数据到表单
  questionForm.value = {
    questionType: question.questionType || '选择题',
    content: content || '',
    options: options.length > 0 ? options :
      question.questionType === '判断题' ?
        [{ key: 'A', text: '正确' }, { key: 'B', text: '错误' }] :
        [{ key: 'A', text: '' }, { key: 'B', text: '' }, { key: 'C', text: '' }, { key: 'D', text: '' }],
    referenceAnswer: question.referenceAnswer || '',
    difficulty: question.difficulty || '中等',
    scorePoints: question.scorePoints || 5,
    analysis: question.analysis || ''
  }

  questionDialogVisible.value = true
}

// 处理每页显示数量变化
function handleSizeChange(size) {
  pageSize.value = size
  // 重置到第一页
  currentPage.value = 1
}

// 处理页码变化
function handleCurrentChange(page) {
  currentPage.value = page
}

// 根据题目难度获取标签类型
function getQuestionDifficultyType(level) {
  switch(level) {
    case '简单':
      return 'success'
    case '中等':
      return 'warning'
    case '困难':
      return 'danger'
    default:
      return 'info'
  }
}

// 添加选项
function addOption() {
  const keys = ['A', 'B', 'C', 'D', 'E', 'F']
  if (questionForm.value.options.length < keys.length) {
    const nextKey = keys[questionForm.value.options.length]
    questionForm.value.options.push({ key: nextKey, text: '' })
  }
}

// 移除选项
function removeOption(index) {
  if (questionForm.value.options.length > 2) {
    // 如果删除的是当前选中的答案，则清空答案
    if (questionForm.value.referenceAnswer === questionForm.value.options[index].key) {
      questionForm.value.referenceAnswer = ''
    }

    questionForm.value.options.splice(index, 1)

    // 重新排序选项的key
    const keys = ['A', 'B', 'C', 'D', 'E', 'F']
    questionForm.value.options.forEach((option, idx) => {
      option.key = keys[idx]
    })
  }
}
*/

/*
// 保存习题
async function saveQuestion() {
  questionFormRef.value.validate(async (valid) => {
    if (valid) {
      try {
        // 从localstorage中获取教师ID
        const userInfoStr = localStorage.getItem('user_info')
        if (!userInfoStr) {
          throw new Error('未找到用户信息，请重新登录')
        }

        const userInfo = JSON.parse(userInfoStr)
        if (!userInfo || !userInfo.teacherId) {
          throw new Error('用户信息不完整或不是教师账号')
        }

        // 确保教师ID和知识点ID是字符串形式
        const teacherId = userInfo.teacherId ? new BigNumber(userInfo.teacherId).toString() : userInfo.teacherId
        const knowledgeIdStr = knowledgeId ? new BigNumber(knowledgeId).toString() : knowledgeId

        // 准备提交的数据
        let content = questionForm.value.content;

        // 如果是选择题或判断题，将选项内容添加到题目内容中
        if ((questionForm.value.questionType === '选择题' || questionForm.value.questionType === '判断题') &&
            questionForm.value.options.length > 0) {
          // 添加换行
          content += '\n\n';
          // 添加每个选项
          questionForm.value.options.forEach(option => {
            content += `${option.key}. ${option.text}\n`;
          });
        }

        const questionData = {
          questionType: questionForm.value.questionType,
          content: content,
          referenceAnswer: questionForm.value.referenceAnswer,
          difficulty: questionForm.value.difficulty,
          scorePoints: questionForm.value.scorePoints,
          analysis: questionForm.value.analysis || '',
          teacherId: teacherId,
          knowledgeId: knowledgeIdStr
        }

        if (isEditingQuestion.value && currentEditingQuestion.value) {
          // 更新现有习题
          questionData.questionId = currentEditingQuestion.value.questionId
          await knowledgeAPI.updateQuestion(questionData)
          ElMessage.success('习题更新成功')
        } else {
          // 添加新习题
          await knowledgeAPI.addQuestion(questionData)
          ElMessage.success('习题添加成功')
        }

        // 重新获取习题列表
        await fetchQuestions()

        // 关闭对话框
        questionDialogVisible.value = false
      } catch (error) {
        console.error('保存习题失败:', error)
        ElMessage.error('保存习题失败: ' + (error.message || '请稍后重试'))
      }
    }
  })
}
*/

// 文件管理相关变量
const files = ref([])
const filesLoading = ref(false)
const fileSearchPrefix = ref('')
const selectedFiles = ref([])
const deleteLoading = ref(false) // 删除操作加载状态
const batchDeleteLoading = ref(false) // 批量删除操作加载状态
const deletedFilesHistory = ref([]) // 删除历史记录
const uploadLoading = ref(false) // 上传操作加载状态
const uploadDialogVisible = ref(false) // 上传对话框显示状态
const uploadFile = ref(null) // 要上传的文件
const uploadFileName = ref('') // 上传文件名
const isDragOver = ref(false) // 拖拽状态
const selectedCategory = ref('') // 选中的文件分类
const showFilePreview = ref(false) // 文件预览对话框
const currentPreviewFile = ref(null) // 预览的文件
const previewLoading = ref(false) // 预览加载状态

// 文件管理相关函数
// 获取文件列表
async function fetchFiles() {
  filesLoading.value = true
  try {
    const response = await minioController.listFiles(fileSearchPrefix.value)
    console.log('获取到的文件列表:', response)
    
    if (Array.isArray(response)) {
      // 根据分类过滤文件
      if (selectedCategory.value) {
        files.value = response.filter(file => getFileCategory(file) === selectedCategory.value)
      } else {
        files.value = response
      }
      selectedFiles.value = [] // 重置选择
    } else {
      files.value = []
      ElMessage.warning('获取文件列表格式异常')
    }
  } catch (error) {
    console.error('获取文件列表失败:', error)
    ElMessage.error('获取文件列表失败: ' + (error.message || '请稍后重试'))
    files.value = []
  } finally {
    filesLoading.value = false
  }
}

// 获取文件分类
function getFileCategory(fileName) {
  const extension = fileName.split('.').pop()?.toLowerCase()
  
  if (['doc', 'docx', 'pdf', 'txt', 'rtf', 'odt'].includes(extension)) {
    return '文档'
  } else if (['jpg', 'jpeg', 'png', 'gif', 'bmp', 'svg', 'webp'].includes(extension)) {
    return '图片'
  } else if (['mp4', 'avi', 'mov', 'wmv', 'flv', 'webm'].includes(extension)) {
    return '视频'
  } else if (['mp3', 'wav', 'flac', 'aac', 'ogg'].includes(extension)) {
    return '音频'
  } else {
    return '其他'
  }
}

// 获取文件图标
function getFileIcon(fileName) {
  const category = getFileCategory(fileName)
  const iconMap = {
    '文档': 'Document',
    '图片': 'View',
    '视频': 'View',
    '音频': 'View',
    '其他': 'Document'
  }
  return iconMap[category] || 'Document'
}

// 搜索文件
function searchFiles() {
  fetchFiles()
}

// 刷新文件列表
function refreshFiles() {
  fileSearchPrefix.value = ''
  selectedCategory.value = ''
  fetchFiles()
}

// 根据分类筛选文件
function filterByCategory(category) {
  selectedCategory.value = category
  fetchFiles()
}

// 切换文件选择状态
function toggleFileSelection(file) {
  const index = selectedFiles.value.indexOf(file)
  if (index > -1) {
    selectedFiles.value.splice(index, 1)
  } else {
    selectedFiles.value.push(file)
  }
}

// 全选/取消全选文件
function handleSelectAllFiles(checked) {
  if (checked) {
    selectedFiles.value = [...files.value]
  } else {
    selectedFiles.value = []
  }
}

// 计算属性：是否全选
const selectAllFiles = computed({
  get() {
    return files.value.length > 0 && selectedFiles.value.length === files.value.length
  },
  set(value) {
    handleSelectAllFiles(value)
  }
})

// 计算属性：是否部分选择
const isIndeterminateFiles = computed(() => {
  return selectedFiles.value.length > 0 && selectedFiles.value.length < files.value.length
})

// 下载文件
async function downloadFile(fileName) {
  try {
    // 1. 调用后端接口获取预签名下载URL
    const downloadUrl = await minioController.generateDownloadUrl(fileName)
    console.log('获取到下载URL:', downloadUrl)
    
    // 2. 使用预签名URL下载文件
    const response = await fetch(downloadUrl, {
      method: 'GET'
    })
    
    if (response.ok) {
      // 获取文件blob
      const blob = await response.blob()
      
      // 创建下载链接
      const url = window.URL.createObjectURL(blob)
      const link = document.createElement('a')
      link.href = url
      link.download = fileName
      link.style.display = 'none'
      
      // 触发下载
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
      
      // 清理URL对象
      window.URL.revokeObjectURL(url)
      
      ElMessage.success('文件下载成功')
    } else {
      throw new Error(`下载失败: ${response.status} ${response.statusText}`)
    }
  } catch (error) {
    console.error('下载文件失败:', error)
    let errorMessage = '下载文件失败'
    
    // 根据错误类型提供更友好的错误信息
    if (error.response) {
      const status = error.response.status
      if (status === 404) {
        errorMessage = '文件不存在或已被删除'
      } else if (status === 403) {
        errorMessage = '没有权限下载此文件'
      } else if (status === 500) {
        errorMessage = '服务器内部错误，请稍后重试'
      } else {
        errorMessage = `下载失败 (${status}): ${error.response.data?.message || '未知错误'}`
      }
    } else if (error.message) {
      errorMessage += ': ' + error.message
    }
    
    ElMessage.error(errorMessage)
  }
}

// 预览文件
async function previewFile(fileName) {
  try {
    previewLoading.value = true
    currentPreviewFile.value = fileName
    showFilePreview.value = true
    
    // 根据文件类型决定预览方式
    const category = getFileCategory(fileName)
    if (category === '图片') {
      // 图片直接预览
      const downloadUrl = await minioController.generateDownloadUrl(fileName)
      currentPreviewFile.value = { name: fileName, url: downloadUrl, type: 'image' }
    } else if (category === '文档') {
      // 文档类型尝试在线预览
      const downloadUrl = await minioController.generateDownloadUrl(fileName)
      currentPreviewFile.value = { name: fileName, url: downloadUrl, type: 'document' }
    } else {
      // 其他类型显示下载链接
      currentPreviewFile.value = { name: fileName, type: 'other' }
    }
  } catch (error) {
    console.error('预览文件失败:', error)
    ElMessage.error('预览文件失败: ' + (error.message || '请稍后重试'))
  } finally {
    previewLoading.value = false
  }
}

// 删除单个文件
async function deleteFile(fileName) {
  // 安全检查：防止删除重要文件
  if (fileName.includes('README') || fileName.includes('重要') || fileName.includes('重要')) {
    try {
      await ElMessageBox.confirm(
        `文件"${fileName}"可能包含重要信息，确定要删除吗？`,
        '重要文件删除确认',
        {
          confirmButtonText: '确定删除',
          cancelButtonText: '取消',
          type: 'warning',
          confirmButtonClass: 'el-button--danger'
        }
      )
    } catch (error) {
      if (error === 'cancel') return
    }
  }
  
  try {
    await ElMessageBox.confirm(
      `确定要删除文件"${fileName}"吗？`,
      '删除确认',
      {
        confirmButtonText: '确定',
        cancelButtonText: '取消',
        type: 'warning',
        confirmButtonClass: 'el-button--danger'
      }
    )
    
    deleteLoading.value = true
    await minioController.deleteFile(fileName)
    ElMessage.success('文件删除成功')
    
    // 添加到删除历史
    addToDeleteHistory(fileName)
    
    // 从选中列表中移除已删除的文件
    const index = selectedFiles.value.indexOf(fileName)
    if (index > -1) {
      selectedFiles.value.splice(index, 1)
    }
    
    // 重新获取文件列表
    await fetchFiles()
  } catch (error) {
    if (error !== 'cancel') {
      console.error('删除文件失败:', error)
      let errorMessage = '删除文件失败'
      
      // 根据错误类型提供更友好的错误信息
      if (error.response) {
        const status = error.response.status
        if (status === 404) {
          errorMessage = '文件不存在或已被删除'
        } else if (status === 403) {
          errorMessage = '没有权限删除此文件'
        } else if (status === 500) {
          errorMessage = '服务器内部错误，请稍后重试'
        } else {
          errorMessage = `删除失败 (${status}): ${error.response.data?.message || '未知错误'}`
        }
      } else if (error.message) {
        errorMessage += ': ' + error.message
      }
      
      ElMessage.error(errorMessage)
    }
  } finally {
    deleteLoading.value = false
  }
}

// 批量删除文件
async function batchDeleteFiles() {
  if (selectedFiles.value.length === 0) {
    ElMessage.warning('请先选择要删除的文件')
    return
  }
  
  try {
    const fileCount = selectedFiles.value.length
    const fileList = selectedFiles.value.slice(0, 3).join('、')
    const moreFiles = fileCount > 3 ? `等 ${fileCount} 个文件` : ''
    
    await ElMessageBox.confirm(
      `确定要删除以下文件吗？此操作不可恢复！\n\n${fileList}${moreFiles}`,
      '批量删除确认',
      {
        confirmButtonText: '确定删除',
        cancelButtonText: '取消',
        type: 'warning',
        confirmButtonClass: 'el-button--danger',
        dangerouslyUseHTMLString: true
      }
    )
    
    batchDeleteLoading.value = true
    const deletedFiles = [...selectedFiles.value] // 保存要删除的文件列表
    
    await minioController.batchDeleteFiles(selectedFiles.value)
    ElMessage.success(`成功删除 ${deletedFiles.length} 个文件`)
    
    // 添加到删除历史
    addToDeleteHistory(deletedFiles)
    
    // 清空选择列表
    selectedFiles.value = []
    
    // 重新获取文件列表
    await fetchFiles()
  } catch (error) {
    if (error !== 'cancel') {
      console.error('批量删除文件失败:', error)
      let errorMessage = '批量删除文件失败'
      
      // 根据错误类型提供更友好的错误信息
      if (error.response) {
        const status = error.response.status
        if (status === 400) {
          errorMessage = '请求参数错误，请检查文件列表'
        } else if (status === 403) {
          errorMessage = '没有权限删除这些文件'
        } else if (status === 500) {
          errorMessage = '服务器内部错误，请稍后重试'
        } else {
          errorMessage = `批量删除失败 (${status}): ${error.response.data?.message || '未知错误'}`
        }
      } else if (error.message) {
        errorMessage += ': ' + error.message
      }
      
      ElMessage.error(errorMessage)
    }
  } finally {
    batchDeleteLoading.value = false
  }
}

// 清空文件选择
function clearFileSelection() {
  selectedFiles.value = []
}

// 获取文件选择状态
function getFileSelectionStatus() {
  const total = files.value.length
  const selected = selectedFiles.value.length
  
  if (selected === 0) {
    return '未选择任何文件'
  } else if (selected === total) {
    return `已选择全部 ${total} 个文件`
  } else {
    return `已选择 ${selected} / ${total} 个文件`
  }
}

// 添加删除历史记录
function addToDeleteHistory(fileNames) {
  const timestamp = new Date().toLocaleString('zh-CN')
  const historyItem = {
    files: Array.isArray(fileNames) ? fileNames : [fileNames],
    timestamp,
    count: Array.isArray(fileNames) ? fileNames.length : 1
  }
  
  deletedFilesHistory.value.unshift(historyItem)
  
  // 只保留最近10条记录
  if (deletedFilesHistory.value.length > 10) {
    deletedFilesHistory.value = deletedFilesHistory.value.slice(0, 10)
  }
}

// 清空删除历史
function clearDeleteHistory() {
  deletedFilesHistory.value = []
  ElMessage.success('删除历史已清空')
}

// 显示上传对话框
function showUploadDialog() {
  uploadDialogVisible.value = true
  uploadFile.value = null
  uploadFileName.value = ''
}

// 关闭上传对话框
function closeUploadDialog() {
  uploadDialogVisible.value = false
  uploadFile.value = null
  uploadFileName.value = ''
}

// 选择文件
function handleFileSelect(event) {
  const file = event.target.files[0]
  if (file) {
    // 检查文件大小（限制为100MB）
    const maxSize = 100 * 1024 * 1024 // 100MB
    if (file.size > maxSize) {
      ElMessage.error('文件大小不能超过100MB')
      return
    }
    
    // 检查文件类型（可选，这里允许所有类型）
    uploadFile.value = file
    uploadFileName.value = file.name
    
    // 显示文件信息
    ElMessage.success(`已选择文件: ${file.name} (${formatFileSize(file.size)})`)
  }
}

// 拖拽相关函数
function handleDragOver(event) {
  event.preventDefault()
  isDragOver.value = true
}

function handleDragLeave(event) {
  event.preventDefault()
  isDragOver.value = false
}

function handleDrop(event) {
  event.preventDefault()
  isDragOver.value = false
  
  const files = event.dataTransfer.files
  if (files.length > 0) {
    const file = files[0]
    
    // 检查文件大小
    const maxSize = 100 * 1024 * 1024 // 100MB
    if (file.size > maxSize) {
      ElMessage.error('文件大小不能超过100MB')
      return
    }
    
    uploadFile.value = file
    uploadFileName.value = file.name
    
    ElMessage.success(`已拖拽文件: ${file.name} (${formatFileSize(file.size)})`)
  }
}

// 格式化文件大小
function formatFileSize(bytes) {
  if (bytes === 0) return '0 Bytes'
  const k = 1024
  const sizes = ['Bytes', 'KB', 'MB', 'GB']
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
}

// 上传文件
async function uploadFileToServer() {
  if (!uploadFile.value) {
    ElMessage.warning('请先选择要上传的文件')
    return
  }
  
  // 如果没有输入文件名，使用原文件名
  if (!uploadFileName.value.trim()) {
    uploadFileName.value = uploadFile.value.name
  }
  
  try {
    uploadLoading.value = true
    
    // 1. 调用后端接口获取预签名上传URL
    const uploadUrl = await minioController.generateUploadUrl(uploadFileName.value)
    console.log('获取到上传URL:', uploadUrl)
    
    // 2. 使用预签名URL上传文件
    const response = await fetch(uploadUrl, {
      method: 'PUT',
      body: uploadFile.value,
      headers: {
        'Content-Type': uploadFile.value.type || 'application/octet-stream'
      }
    })
    
    if (response.ok) {
      ElMessage.success('文件上传成功')
      closeUploadDialog()
      
      // 重新获取文件列表
      await fetchFiles()
    } else {
      const errorText = await response.text()
      throw new Error(`上传失败: ${response.status} ${response.statusText} - ${errorText}`)
    }
  } catch (error) {
    console.error('文件上传失败:', error)
    let errorMessage = '文件上传失败'
    
    if (error.response) {
      const status = error.response.status
      if (status === 400) {
        errorMessage = '请求参数错误，请检查文件名'
      } else if (status === 403) {
        errorMessage = '没有权限上传文件'
      } else if (status === 413) {
        errorMessage = '文件太大，超出限制'
      } else if (status === 500) {
        errorMessage = '服务器内部错误，请稍后重试'
      } else {
        errorMessage = `上传失败 (${status}): ${error.response.data?.message || '未知错误'}`
      }
    } else if (error.message) {
      errorMessage += ': ' + error.message
    }
    
    ElMessage.error(errorMessage)
  } finally {
    uploadLoading.value = false
  }
}

// 在组件挂载时获取知识点详情和文件列表
onMounted(async () => {
  if (!knowledgeId) {
    ElMessage.error('知识点ID不存在')
    goBack()
    return
  }
  
  try {
    await fetchKnowledgeDetail()
    await fetchFiles() // 获取文件列表

    // 题目模块相关初始化 - 已注释
    /*
    // 额外的图表初始化尝试
    if (questions.value.length > 0) {
      // 延迟一段时间再初始化图表，确保DOM已完全渲染
      setTimeout(() => {
        console.log('组件挂载后尝试初始化图表...')
        initCharts()
      }, 500)
    }
    */
  } catch (error) {
    console.error('初始化知识点详情失败:', error)
    ElMessage.error('加载知识点详情失败，请稍后重试')
  }
})
</script>

<style scoped>
.knowledge-detail-container {
  min-height: 100vh;
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

.knowledge-header {
  padding: 0 10px;
  color: #303133;
  position: sticky;
  top: 0;
  display: flex;
  justify-content: space-between;
  align-items: center;
  border-radius: 0;
  box-shadow: none;
  border: none;
  background-color: #f5f7fa;
  text-align: left;
  min-height: 32px;
  height: 32px;
  flex-shrink: 0;
  line-height: 32px;
  z-index: 10;
}

.header-content {
  display: flex;
  align-items: center;
  height: 32px;
}

.back-button {
  display: flex;
  align-items: center;
  cursor: pointer;
  color: #409EFF;
  margin-right: 16px;
  position: static;
  transition: transform 0.3s;
  line-height: 32px;
  height: 32px;
}

.back-button:hover {
  opacity: 0.8;
  transform: translateX(-5px);
}

.knowledge-title {
  font-size: 16px;
  font-weight: 500;
  margin: 0;
  text-shadow: none;
  color: #303133;
  line-height: 32px;
  height: 32px;
  font-size: 22px;
}

.knowledge-content {
  flex: 1;
  padding: 12px 20px;
  background-color: #f5f7fa;
  overflow-y: auto;
  display: flex;
  flex-direction: column;
  gap: 16px;
  padding-bottom: 30px;
}

.loading-container, .empty-container {
  display: flex;
  justify-content: center;
  align-items: center;
  min-height: 300px;
}

.knowledge-details {
  display: flex;
  flex-direction: column;
  gap: 24px;
}

.detail-card {
  border-radius: 12px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.06);
  margin-bottom: 16px;
  background-color: #fff;
  overflow: hidden;
  border: none;
  transition: all 0.3s ease;
  position: relative;
  width: 100%;
}

.chart-card {
  height: auto;
  margin-bottom: 16px;
  width: 100%;
}

.chart-body {
  height: 380px;
  padding: 10px;
  position: relative;
}

.detail-card.chart-card {
  padding-bottom: 10px;
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 14px 20px;
  border-bottom: 1px solid rgba(0, 0, 0, 0.05);
  background: linear-gradient(to right, #f8f9fa, #fff);
  position: relative;
  overflow: hidden;
}

.card-header::after {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  height: 3px;
  background: linear-gradient(90deg, #67C23A, #4B8DE6);
}

.card-header h3 {
  font-size: 16px;
  font-weight: 600;
  margin: 0;
  color: #303133;
  display: flex;
  align-items: center;
  position: relative;
  padding-left: 12px;
}

.card-header h3::before {
  content: '';
  position: absolute;
  left: 0;
  top: 50%;
  transform: translateY(-50%);
  width: 4px;
  height: 16px;
  background: linear-gradient(to bottom, #67C23A, #4B8DE6);
  border-radius: 2px;
}

.card-body {
  padding: 16px 20px;
}

.questions-card .card-body {
  flex: 1;
  overflow-y: auto;
}

.header-actions {
  display: flex;
  gap: 12px;
}

.header-actions .el-button {
  border-radius: 10px;
  font-weight: 500;
  padding: 10px 20px;
  transition: all 0.3s ease;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.08);
  font-size: 14px;
}

.header-actions .el-button:hover {
  transform: translateY(-3px);
  box-shadow: 0 6px 16px rgba(0, 0, 0, 0.12);
}

.header-actions .el-button .el-icon {
  margin-right: 6px;
  font-size: 16px;
}

.search-filter-container {
  padding: 16px 20px;
  background-color: #f8f9fa;
  border-bottom: 1px solid #ebeef5;
}

.search-box {
  margin-bottom: 16px;
}

.search-icon {
  cursor: pointer;
  color: #909399;
}

.search-icon:hover {
  color: #409EFF;
}

.filter-box {
  display: flex;
  flex-wrap: wrap;
  gap: 12px;
  align-items: center;
}

.detail-item {
  margin-bottom: 16px;
  display: flex;
}

.detail-item:last-child {
  margin-bottom: 0;
}

.detail-item .label {
  font-weight: 500;
  width: 100px;
  color: #606266;
}

.detail-item .value {
  flex: 1;
  color: #303133;
}

.description-text, .teach-plan-text {
  margin: 0;
  line-height: 1.6;
  color: #303133;
  white-space: pre-wrap;
}

.truncated-description {
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  max-width: 100%;
}

.empty-tip {
  color: #909399;
  text-align: center;
  padding: 40px 0;
  background-color: white;
  border-radius: 16px;
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.06);
}

.empty-tip .el-empty {
  margin-bottom: 20px;
}

.empty-tip .el-button {
  padding: 12px 24px;
  font-weight: 500;
  border-radius: 10px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.08);
  transition: all 0.3s ease;
}

.empty-tip .el-button:hover {
  transform: translateY(-3px);
  box-shadow: 0 6px 16px rgba(0, 0, 0, 0.12);
}

.questions-list {
  margin-top: 16px;
}

.dialog-footer {
  display: flex;
  justify-content: flex-end;
}

.info-card {
  border-left: 4px solid #409EFF;
}

.info-row {
  display: flex;
  flex-wrap: wrap;
  margin-bottom: 16px;
}

.info-item {
  margin-right: 24px;
  margin-bottom: 8px;
  display: flex;
  align-items: center;
}

.info-item .label {
  font-weight: 500;
  color: #606266;
  margin-right: 8px;
  width: auto;
}

.description-box {
  background-color: #f8f9fa;
  padding: 12px 16px;
  border-radius: 8px;
}

.desc-title {
  font-weight: 500;
  color: #303133;
  margin-bottom: 8px;
}

.questions-card {
  flex: 1;
  min-height: 300px;
  height: auto;
  display: flex;
  flex-direction: column;
}

.questions-card::before {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background-image: url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%2367c23a' fill-opacity='0.05'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E");
  opacity: 0.5;
  z-index: 0;
  pointer-events: none;
}

.question-item {
  border: none;
  border-radius: 10px;
  margin-bottom: 16px;
  box-shadow: 0 3px 10px rgba(0, 0, 0, 0.05);
  overflow: visible;
  background-color: #fff;
  transition: all 0.3s ease;
  position: relative;
  z-index: 1;
  width: 100%;
  box-sizing: border-box;
  display: flex;
  flex-direction: column;
}

.question-item:hover {
  transform: translateY(-4px);
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.1);
}

.question-item:last-child {
  margin-bottom: 0;
}

.question-header {
  display: flex;
  align-items: center;
  padding: 12px 16px;
  background: linear-gradient(135deg, #f8f9fa, #fff);
  border-bottom: 1px solid #ebeef5;
  position: relative;
  width: 100%;
  box-sizing: border-box;
  flex-wrap: wrap;
}

.question-header::after {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  height: 100%;
  width: 4px;
  background: linear-gradient(to bottom, #409EFF, #4B8DE6);
}

.question-index {
  width: 36px;
  height: 36px;
  background: linear-gradient(135deg, #409EFF, #4B8DE6);
  color: white;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: bold;
  margin-right: 16px;
  font-size: 16px;
  box-shadow: 0 4px 10px rgba(64, 158, 255, 0.3);
}

.question-type {
  margin-right: 16px;
  margin-bottom: 5px;
}

.question-difficulty {
  margin-bottom: 5px;
}

.question-type .el-tag, .question-difficulty .el-tag {
  font-weight: 500;
  padding: 2px 12px;
  height: 28px;
  line-height: 24px;
  border-radius: 14px;
  font-size: 13px;
  box-shadow: 0 2px 6px rgba(0, 0, 0, 0.05);
  white-space: nowrap;
}

.question-content {
  padding: 16px;
  background-color: #fff;
  position: relative;
  z-index: 2;
  width: 100%;
  box-sizing: border-box;
  overflow-wrap: break-word;
  word-break: break-word;
  height: auto;
}

.question-title {
  font-size: 15px;
  font-weight: 500;
  color: #303133;
  margin-bottom: 14px;
  line-height: 1.5;
  white-space: pre-wrap;
  text-align: left;
  padding-bottom: 8px;
  border-bottom: 1px dashed #ebeef5;
  word-break: break-word;
  overflow-wrap: break-word;
  max-width: 100%;
}

.question-options {
  margin: 12px 0;
  display: flex;
  flex-direction: column;
  gap: 8px;
  width: 100%;
}

.question-option {
  display: flex;
  align-items: flex-start;
  padding: 8px 14px;
  background-color: #f8f9fa;
  border-radius: 8px;
  transition: all 0.2s ease;
  border-left: 2px solid transparent;
  word-break: break-word;
  overflow-wrap: break-word;
  width: 100%;
  box-sizing: border-box;
}

.question-option:hover {
  background-color: #f0f7ff;
  border-left-color: #409EFF;
  transform: translateX(4px);
}

.option-key {
  font-weight: 600;
  color: #409EFF;
  margin-right: 12px;
  min-width: 24px;
  font-size: 15px;
  flex-shrink: 0;
}

.option-text {
  color: #606266;
  flex: 1;
  font-size: 15px;
  word-break: break-word;
  overflow-wrap: break-word;
  max-width: calc(100% - 36px);
}

.question-answer-row {
  display: flex;
  align-items: flex-start;
  margin-top: 12px;
  background-color: #f0f9eb;
  padding: 10px 14px;
  border-radius: 8px;
  border-left: none;
  box-shadow: 0 2px 6px rgba(103, 194, 58, 0.1);
  width: 100%;
  box-sizing: border-box;
}

.answer-label {
  font-weight: 600;
  color: #67C23A;
  margin-right: 12px;
  font-size: 15px;
  white-space: nowrap;
  flex-shrink: 0;
}

.answer-content {
  color: #303133;
  line-height: 1.6;
  font-size: 15px;
  text-align: left;
  flex: 1;
  font-weight: 500;
  word-break: break-word;
  overflow-wrap: break-word;
  max-width: calc(100% - 100px);
}

.question-footer {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 12px 16px;
  border-top: 1px solid #ebeef5;
  background-color: #fafafa;
  width: 100%;
  box-sizing: border-box;
  flex-wrap: wrap;
  gap: 10px;
}

.score-tag {
  font-weight: 500;
  font-size: 14px;
  padding: 4px 12px;
  border-radius: 14px;
  background-color: #f0f9eb;
  color: #67C23A;
  border-color: transparent;
  box-shadow: 0 2px 6px rgba(103, 194, 58, 0.1);
  white-space: nowrap;
}

.question-actions {
  display: flex;
  gap: 10px;
  flex-wrap: wrap;
}

.question-actions .el-button {
  font-size: 14px;
  padding: 8px 12px;
  border-radius: 8px;
  transition: all 0.3s ease;
  font-weight: 500;
  white-space: nowrap;
}

.question-actions .el-button:hover {
  background-color: #ecf5ff;
  color: #409EFF;
  transform: translateY(-2px);
}

.question-actions .el-button--danger:hover {
  background-color: #fef0f0;
  color: #f56c6c;
  transform: translateY(-2px);
}

.pagination-container {
  margin-top: 32px;
  margin-bottom: 16px;
  display: flex;
  justify-content: center;
}

.pagination-container .el-pagination {
  padding: 0;
  font-weight: normal;
  color: #606266;
  background-color: white;
  padding: 12px 24px;
  border-radius: 12px;
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.06);
  display: flex;
  flex-wrap: wrap;
  justify-content: center;
}

.pagination-container .el-pagination .el-pagination__total,
.pagination-container .el-pagination .el-pagination__jump {
  font-weight: 500;
}

.teach-plan-card {
  border-left: 4px solid #E6A23C;
}

/* 添加习题表单相关样式 */
.option-input-item {
  display: flex;
  align-items: center;
  margin-bottom: 12px;
}

.option-input-key {
  font-weight: 500;
  margin-right: 8px;
  width: 20px;
  color: #409EFF;
}

.add-option-button {
  margin-top: 12px;
}

/* 响应式调整 */
@media (max-width: 768px) {
  .knowledge-content {
    padding: 12px;
  }
  
  .chart-card {
    height: auto;
  }
  
  .chart-body {
    height: 300px;
  }
  
  .card-header {
    padding: 16px;
    flex-wrap: wrap;
  }
  
  .card-body {
    padding: 16px;
  }
  
  .header-actions {
    margin-top: 8px;
    width: 100%;
  }
  
  .pagination-container .el-pagination {
    padding: 8px;
  }
}

.chart-container {
  width: 100%;
  height: 360px;
  margin: 0 auto;
  background-color: #fff;
  border-radius: 16px;
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.06);
  padding: 15px;
  box-sizing: border-box;
  margin-bottom: 20px;
}

.chart-title {
  font-size: 16px;
  font-weight: 600;
  color: #303133;
  margin-bottom: 10px;
  text-align: center;
}

#questionTypeChart {
  width: 100%;
  height: 300px;
  margin: 0 auto;
}

.question-type-chart {
  height: 100%;
  width: 100%;
  position: absolute;
  top: 0;
  left: 0;
}

.detail-card:hover {
  box-shadow: 0 6px 16px rgba(0, 0, 0, 0.08);
}

.content-card {
  margin-bottom: 16px;
}

.knowledge-description {
  padding: 10px 0;
}

/* 教师智能备课模块样式 */
.teaching-assistant-card {
  margin-bottom: 16px;
}

.teaching-plan-content {
  padding: 0;
}

.plan-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 16px;
  padding-bottom: 12px;
  border-bottom: 1px solid #ebeef5;
}

.plan-header h4 {
  margin: 0;
  font-size: 16px;
  font-weight: 600;
  color: #303133;
}

.plan-actions {
  display: flex;
  gap: 8px;
}

.plan-content {
  background-color: #f8f9fa;
  border-radius: 8px;
  padding: 16px;
  border: 1px solid #ebeef5;
}

.plan-text {
  margin: 0;
  font-family: inherit;
  font-size: 14px;
  line-height: 1.6;
  color: #303133;
  word-break: break-word;
  max-height: 400px;
  overflow-y: auto;
  text-align: left;
}

/* Markdown内容样式 */
.markdown-content {
  text-align: left;
}

.markdown-content h1,
.markdown-content h2,
.markdown-content h3,
.markdown-content h4,
.markdown-content h5,
.markdown-content h6 {
  margin: 16px 0 8px 0;
  font-weight: 600;
  line-height: 1.25;
  color: #303133;
  text-align: left;
}

.markdown-content h1 {
  font-size: 20px;
  border-bottom: 1px solid #ebeef5;
  padding-bottom: 8px;
}

.markdown-content h2 {
  font-size: 18px;
  border-bottom: 1px solid #f0f0f0;
  padding-bottom: 6px;
}

.markdown-content h3 {
  font-size: 16px;
}

.markdown-content h4 {
  font-size: 15px;
}

.markdown-content h5,
.markdown-content h6 {
  font-size: 14px;
}

.markdown-content p {
  margin: 8px 0;
  text-align: left;
  line-height: 1.6;
}

.markdown-content ul,
.markdown-content ol {
  margin: 8px 0;
  padding-left: 20px;
  text-align: left;
}

.markdown-content li {
  margin: 4px 0;
  text-align: left;
}

.markdown-content blockquote {
  margin: 8px 0;
  padding: 8px 16px;
  background-color: #f8f9fa;
  border-left: 4px solid #409EFF;
  color: #606266;
  text-align: left;
}

.markdown-content code {
  background-color: #f1f2f3;
  padding: 2px 4px;
  border-radius: 3px;
  font-family: 'Courier New', Courier, monospace;
  font-size: 13px;
  color: #e83e8c;
}

.markdown-content pre {
  background-color: #f8f9fa;
  padding: 12px;
  border-radius: 6px;
  overflow-x: auto;
  margin: 8px 0;
  text-align: left;
}

.markdown-content pre code {
  background-color: transparent;
  padding: 0;
  color: #303133;
}

.markdown-content table {
  border-collapse: collapse;
  width: 100%;
  margin: 8px 0;
  text-align: left;
}

.markdown-content th,
.markdown-content td {
  border: 1px solid #ddd;
  padding: 8px 12px;
  text-align: left;
}

.markdown-content th {
  background-color: #f8f9fa;
  font-weight: 600;
}

.markdown-content strong {
  font-weight: 600;
  color: #303133;
}

.markdown-content em {
  font-style: italic;
  color: #606266;
}

.markdown-content hr {
  border: none;
  border-top: 1px solid #ebeef5;
  margin: 16px 0;
}

/* 对话框样式优化 */
.dialog-footer {
  display: flex;
  justify-content: flex-end;
  gap: 12px;
}

.dialog-footer .el-button {
  min-width: 80px;
}

.description-text {
  font-size: 15px;
  line-height: 1.8;
  color: #303133;
  white-space: pre-wrap;
  text-align: justify;
  margin: 0;
}

.empty-content {
  padding: 30px 0;
  text-align: center;
}

.charts-container {
  display: flex;
  width: 100%;
  height: 360px;
  gap: 20px;
}

.chart-item {
  flex: 1;
  height: 100%;
  background-color: #fff;
  border-radius: 10px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.06);
  padding: 10px;
  box-sizing: border-box;
  position: relative;
  display: flex;
  flex-direction: column;
}

.chart-title {
  font-size: 15px;
  font-weight: 600;
  color: #303133;
  margin-bottom: 5px;
  text-align: center;
  flex-shrink: 0;
}

.question-type-chart, .difficulty-chart {
  width: 100%;
  flex: 1;
  position: relative;
}

.chart-body {
  height: 360px;
  padding: 10px;
  position: relative;
}

/* 响应式布局 */
@media (max-width: 768px) {
  .charts-container {
    flex-direction: column;
    height: 600px;
  }
  
  .chart-item {
    height: 300px;
  }
}

.files-list {
  margin-top: 16px;
}

.files-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 16px;
}

.files-actions {
  display: flex;
  gap: 12px;
}

.files-grid {
  display: flex;
  flex-wrap: wrap;
  gap: 16px;
}

.file-item {
  border: 1px solid #ebeef5;
  border-radius: 8px;
  padding: 12px;
  background-color: #fff;
  transition: all 0.3s ease;
  width: calc((100% - 16px) / 3);
  box-sizing: border-box;
  display: flex;
  flex-direction: column;
  align-items: center;
  cursor: pointer;
  position: relative;
}

.file-item:hover {
  box-shadow: 0 6px 16px rgba(0, 0, 0, 0.08);
  transform: translateY(-2px);
}

.file-item.selected {
  border-color: #409EFF;
  background-color: #f0f7ff;
  box-shadow: 0 4px 12px rgba(64, 158, 255, 0.2);
}

.file-item.selected::before {
  content: '';
  position: absolute;
  top: -2px;
  left: -2px;
  right: -2px;
  bottom: -2px;
  border: 2px solid #409EFF;
  border-radius: 10px;
  pointer-events: none;
}

.file-icon {
  font-size: 32px;
  color: #409EFF;
  margin-bottom: 12px;
}

.file-name {
  font-size: 14px;
  color: #303133;
  text-align: center;
  line-height: 1.4;
  margin-bottom: 8px;
  word-break: break-word;
  overflow-wrap: break-word;
  max-width: 100%;
}

.file-actions {
  display: flex;
  gap: 8px;
  margin-top: auto;
}

.file-actions .el-button {
  padding: 6px 8px;
  font-size: 12px;
}

.files-summary {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-top: 16px;
  padding: 12px 16px;
  background-color: #f8f9fa;
  border-radius: 8px;
  color: #606266;
  font-size: 14px;
}

.selection-info {
  color: #409EFF;
  font-weight: 500;
}

.files-actions .el-button {
  margin-left: 8px;
}

.files-actions .el-button:first-child {
  margin-left: 0;
}

/* 响应式布局 */
@media (max-width: 768px) {
  .files-grid {
    gap: 12px;
  }
  
  .file-item {
    width: calc((100% - 12px) / 2);
  }
  
  .file-name {
    font-size: 13px;
  }
  
  .file-actions {
    gap: 6px;
  }
  
  .file-actions .el-button {
    padding: 4px 6px;
    font-size: 11px;
  }
}

@media (max-width: 480px) {
  .file-item {
    width: 100%;
  }
  
  .files-header {
    flex-direction: column;
    align-items: flex-start;
    gap: 12px;
  }
  
  .files-actions {
    width: 100%;
    justify-content: flex-end;
  }
}

/* 文件管理模块样式 */
.files-card {
  margin-bottom: 16px;
}

/* 文件分类筛选样式 */
.file-categories {
  padding: 16px 20px;
  background-color: #f8f9fa;
  border-bottom: 1px solid #ebeef5;
}

.file-categories .el-radio-group {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}

.file-categories .el-radio-button__inner {
  border-radius: 16px;
  padding: 6px 16px;
  font-size: 13px;
  border: 1px solid #dcdfe6;
  background-color: #fff;
  color: #606266;
  transition: all 0.3s ease;
}

.file-categories .el-radio-button__inner:hover {
  border-color: #409eff;
  color: #409eff;
}

.file-categories .el-radio-button__original-radio:checked + .el-radio-button__inner {
  background-color: #409eff;
  border-color: #409eff;
  color: #fff;
  box-shadow: 0 2px 8px rgba(64, 158, 255, 0.3);
}

.files-list {
  margin-top: 16px;
}

.files-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 16px;
}

.files-actions {
  display: flex;
  gap: 12px;
}

.files-grid {
  display: flex;
  flex-wrap: wrap;
  gap: 16px;
}

.file-item {
  border: 1px solid #ebeef5;
  border-radius: 8px;
  padding: 16px;
  background-color: #fff;
  transition: all 0.3s ease;
  width: calc((100% - 32px) / 4);
  box-sizing: border-box;
  display: flex;
  flex-direction: column;
  align-items: center;
  cursor: pointer;
  position: relative;
  min-height: 140px;
}

.file-item:hover {
  box-shadow: 0 6px 16px rgba(0, 0, 0, 0.08);
  transform: translateY(-2px);
}

.file-item.selected {
  border-color: #409eff;
  background-color: #f0f7ff;
  box-shadow: 0 4px 12px rgba(64, 158, 255, 0.2);
}

.file-item.selected::before {
  content: '';
  position: absolute;
  top: -2px;
  left: -2px;
  right: -2px;
  bottom: -2px;
  border: 2px solid #409eff;
  border-radius: 10px;
  pointer-events: none;
}

.file-icon {
  font-size: 36px;
  color: #409eff;
  margin-bottom: 12px;
}

.file-name {
  font-size: 13px;
  color: #303133;
  text-align: center;
  line-height: 1.4;
  margin-bottom: 8px;
  word-break: break-word;
  overflow-wrap: break-word;
  max-width: 100%;
  font-weight: 500;
}

.file-category {
  margin-bottom: 12px;
}

.file-category .el-tag {
  font-size: 11px;
  padding: 2px 8px;
  border-radius: 10px;
}

.file-actions {
  display: flex;
  gap: 8px;
  margin-top: auto;
}

.file-actions .el-button {
  padding: 6px 8px;
  font-size: 12px;
}

.files-summary {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-top: 16px;
  padding: 12px 16px;
  background-color: #f8f9fa;
  border-radius: 8px;
  color: #606266;
  font-size: 14px;
}

.selection-info {
  color: #409eff;
  font-weight: 500;
}

.files-actions .el-button {
  margin-left: 8px;
}

.files-actions .el-button:first-child {
  margin-left: 0;
}

/* 文件管理模块响应式布局 */
@media (max-width: 1200px) {
  .file-item {
    width: calc((100% - 24px) / 3);
  }
}

@media (max-width: 768px) {
  .files-grid {
    gap: 12px;
  }
  
  .file-item {
    width: calc((100% - 12px) / 2);
    min-height: 120px;
    padding: 12px;
  }
  
  .file-name {
    font-size: 12px;
  }
  
  .file-actions {
    gap: 6px;
  }
  
  .file-actions .el-button {
    padding: 4px 6px;
    font-size: 11px;
  }
  
  .file-categories .el-radio-group {
    justify-content: center;
  }
}

@media (max-width: 480px) {
  .file-item {
    width: 100%;
  }
  
  .files-header {
    flex-direction: column;
    align-items: flex-start;
    gap: 12px;
  }
  
  .files-actions {
    width: 100%;
    justify-content: flex-end;
  }
}

/* 删除历史记录样式 */
.delete-history {
  margin-top: 20px;
  padding: 16px;
  background-color: #f8f9fa;
  border-radius: 8px;
  border: 1px solid #ebeef5;
}

.history-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 12px;
  padding-bottom: 8px;
  border-bottom: 1px solid #ebeef5;
}

.history-header h4 {
  margin: 0;
  font-size: 14px;
  font-weight: 600;
  color: #303133;
}

.history-list {
  max-height: 200px;
  overflow-y: auto;
}

.history-item {
  padding: 8px 0;
  border-bottom: 1px solid #f0f0f0;
}

.history-item:last-child {
  border-bottom: none;
}

.history-info {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 4px;
}

.history-time {
  font-size: 12px;
  color: #909399;
}

.history-count {
  font-size: 12px;
  color: #606266;
  font-weight: 500;
}

.history-files {
  font-size: 12px;
  color: #909399;
  line-height: 1.4;
}

/* 上传对话框样式 */
.upload-form {
  padding: 20px 0;
}

.upload-section {
  margin-bottom: 20px;
  display: flex;
  align-items: center;
  gap: 12px;
}

.upload-label {
  font-weight: 500;
  color: #303133;
  min-width: 80px;
}

.selected-file {
  margin-left: 12px;
  color: #409eff;
  font-size: 14px;
}

.upload-actions {
  display: flex;
  justify-content: flex-end;
  gap: 12px;
  margin-top: 24px;
  padding-top: 16px;
  border-top: 1px solid #ebeef5;
}

.upload-drop-zone {
  border: 2px dashed #409eff;
  border-radius: 8px;
  padding: 20px;
  text-align: center;
  cursor: pointer;
  transition: all 0.3s ease;
  flex: 1;
}

.upload-drop-zone:hover {
  background-color: #f0f7ff;
  border-color: #409eff;
}

.upload-drop-zone.drag-over {
  background-color: #f0f7ff;
  border-color: #409eff;
  transform: scale(1.02);
}

.drop-zone-content {
  display: flex;
  flex-direction: column;
  align-items: center;
}

.drop-icon {
  font-size: 48px;
  color: #409eff;
  margin-bottom: 16px;
}

.drop-text {
  font-size: 16px;
  font-weight: 500;
  color: #303133;
  margin-bottom: 8px;
}

.drop-hint {
  font-size: 14px;
  color: #606266;
  margin-bottom: 16px;
}

.file-info {
  margin-top: 20px;
  text-align: center;
}

.file-details {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 8px;
}

.file-name {
  font-size: 14px;
  font-weight: 500;
  color: #303133;
}

.file-size {
  font-size: 12px;
  color: #606266;
}

.file-type {
  font-size: 12px;
  color: #909399;
}

/* 文件预览对话框样式 */
.preview-loading {
  padding: 40px;
  text-align: center;
}

.preview-content {
  padding: 0;
}

.preview-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
  padding-bottom: 16px;
  border-bottom: 1px solid #ebeef5;
}

.preview-header h4 {
  margin: 0;
  font-size: 18px;
  font-weight: 600;
  color: #303133;
}

.preview-actions {
  display: flex;
  gap: 8px;
}

.preview-body {
  min-height: 400px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.image-preview {
  width: 100%;
  text-align: center;
}

.preview-image {
  max-width: 100%;
  max-height: 500px;
  border-radius: 8px;
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.1);
}

.document-preview, .other-preview {
  text-align: center;
  padding: 40px;
}

.document-info, .file-info {
  max-width: 400px;
}

.document-info p, .file-info p {
  font-size: 16px;
  color: #606266;
  margin-bottom: 20px;
  line-height: 1.6;
}

.document-info .el-button, .file-info .el-button {
  padding: 12px 24px;
  font-size: 14px;
  font-weight: 500;
}

/* 响应式调整 */
@media (max-width: 768px) {
  .upload-section {
    flex-direction: column;
    align-items: flex-start;
  }
  
  .upload-label {
    min-width: auto;
  }
  
  .upload-drop-zone {
    width: 100%;
  }
  
  .preview-header {
    flex-direction: column;
    align-items: flex-start;
    gap: 12px;
  }
  
  .preview-body {
    min-height: 300px;
  }
  
  .preview-image {
    max-height: 300px;
  }
}
</style> 