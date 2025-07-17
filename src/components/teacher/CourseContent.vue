<template>
  <div>
    <div class="content-section">
      <div class="section-header">
        <h3>课程知识点</h3>
        <el-button type="primary" size="small" @click="$emit('show-add-knowledge')">
          <el-icon><Plus /></el-icon>
          添加知识点
        </el-button>
      </div>
      <div class="section-body">
        <div v-if="courseKnowledges.length === 0" class="empty-tip">
          暂无知识点，请点击"添加知识点"按钮添加
        </div>
        <div v-else class="knowledge-list">
          <div v-for="knowledge in courseKnowledges" :key="knowledge.knowledgeId" class="knowledge-item" @click="$emit('view-knowledge', knowledge)">
            <div class="knowledge-header">
              <h4>{{ knowledge.name }}</h4>
              <el-tag :type="getDifficultyTagType(knowledge.difficultyLevel)">{{ knowledge.difficultyLevel }}</el-tag>
            </div>
            <div class="knowledge-description">
              <p class="truncated-description">{{ knowledge.description || '暂无描述' }}</p>
            </div>
            <div class="knowledge-footer">
              <span class="teach-plan-label">教学计划:</span>
              <span class="teach-plan-content truncated-teach-plan">{{ knowledge.teachPlan || '暂无教学计划' }}</span>
            </div>
            <div class="knowledge-actions">
              <el-button link type="primary" @click.stop="$emit('edit-knowledge', knowledge)">编辑</el-button>
              <el-button link type="danger" @click.stop="$emit('remove-knowledge', knowledge)">删除</el-button>
            </div>
          </div>
        </div>
      </div>
    </div>

    <div class="content-section">
      <div class="section-header">
        <h3>课程介绍</h3>
      </div>
      <div class="section-body">
        <div class="course-description-container">
          <div class="course-tags-container">
            <div 
              v-for="(tag, index) in extractTags(courseDescription)" 
              :key="index"
              class="rendered-tag"
              :style="{ 
                backgroundColor: getCategoryColor(tag) + '30', 
                color: getCategoryColor(tag)
              }"
            >
              {{ tag }}
            </div>
          </div>
          <p class="course-desc">{{ formatDescription(courseDescription) || '暂无课程介绍' }}</p>
        </div>
      </div>
    </div>

    <!-- 课程文档部分 -->
    <div class="content-section">
      <div class="section-header">
        <h3>课程文档</h3>
        <el-button type="primary" size="small" @click="$emit('show-upload-doc')">
          <el-icon><Upload /></el-icon>
          上传文档
        </el-button>
      </div>
      <div class="section-body">
        <div v-if="!processedDocuments || processedDocuments.length === 0" class="empty-tip">
          暂无课程文档
        </div>
        <div v-else class="materials-list">
          <div v-for="(doc, index) in processedDocuments" :key="index" class="material-item">
            <el-icon><Document /></el-icon>
            <span class="material-name">{{ Array.isArray(doc) && doc.length > 0 ? doc[0] : '' }}</span>
            <div class="material-actions">
              <el-button link type="primary" @click="$emit('download-doc', Array.isArray(doc) && doc.length > 0 ? doc[0] : '')">
                <el-icon><Download /></el-icon> 下载
              </el-button>
              <el-button link type="danger" @click="$emit('remove-doc', Array.isArray(doc) && doc.length > 0 ? doc[0] : '')">
                <el-icon><Delete /></el-icon> 删除
              </el-button>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { defineProps, defineEmits, computed } from 'vue'
import { Plus, Document, Upload, Download, Delete } from '@element-plus/icons-vue'

const props = defineProps({
  courseKnowledges: {
    type: Array,
    required: true
  },
  courseDescription: {
    type: String,
    default: ''
  },
  documents: {
    type: Array,
    default: () => []
  }
})

// 处理文档列表，将可能连在一起的文档名称分开
const processedDocuments = computed(() => {
  console.log('CourseContent组件接收到的documents:', props.documents);
  
  if (!props.documents || props.documents.length === 0) {
    console.log('文档列表为空');
    return [];
  }
  
  // 处理文档数据
  const result = [];
  
  // 遍历文档列表
  props.documents.forEach(doc => {
    if (typeof doc === 'string') {
      // 首先尝试按逗号分割
      if (doc.includes(',')) {
        const splitDocs = doc.split(',').map(item => item.trim()).filter(item => item);
        splitDocs.forEach(item => result.push([item]));
        return;
      }
      
      // 检查是否是连续文件名
      const fileExtensions = ['.pdf', '.txt', '.docx', '.pptx', '.xlsx', '.doc', '.ppt', '.xls'];
      let currentString = doc;
      let lastIndex = 0;
      let foundFiles = [];
      
      // 遍历所有可能的文件扩展名
      fileExtensions.forEach(ext => {
        let extIndex = currentString.indexOf(ext);
        while (extIndex !== -1) {
          // 找到一个文件扩展名
          const endPos = extIndex + ext.length;
          const fileName = currentString.substring(lastIndex, endPos);
          foundFiles.push(fileName.trim());
          
          // 更新搜索位置
          lastIndex = endPos;
          
          // 继续查找下一个扩展名
          extIndex = currentString.indexOf(ext, lastIndex);
        }
      });
      
      // 如果找到了文件，添加到结果中
      if (foundFiles.length > 0) {
        foundFiles.forEach(file => result.push([file]));
      } else {
        // 没有找到文件，作为单个文件添加
        result.push([doc]);
      }
    } else if (Array.isArray(doc)) {
      // 如果已经是数组格式，直接添加
      result.push(doc);
    }
  });
  
  console.log('处理后的文档列表:', result);
  return result;
});

defineEmits([
  'show-add-knowledge', 
  'view-knowledge', 
  'edit-knowledge', 
  'remove-knowledge', 
  'show-upload-doc',
  'download-doc',
  'remove-doc'
])

// 根据难度等级获取标签类型
function getDifficultyTagType(level) {
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

// 提取描述中的标签
function extractTags(description) {
  if (!description) return [];
  
  const tags = [];
  const regex = /#([^#]+)#/g;
  let match;
  
  while ((match = regex.exec(description)) !== null) {
    tags.push(match[1].trim());
  }
  
  return tags;
}

// 处理课程描述显示，去掉所有#标签#
function formatDescription(description) {
  if (!description) return '';
  
  // 去掉所有#标签#内容
  return description.replace(/#([^#]+)#/g, '').trim() || '暂无描述';
}

// 根据分类名生成确定的随机颜色
function getCategoryColor(category) {
  if (!category) return '#DCDFE6'; // 默认浅灰色
  
  // 预定义的颜色列表
  const colors = [
    '#409EFF', '#67C23A', '#E6A23C', '#F56C6C', 
    '#909399', '#9B59B6', '#3498DB', '#1ABC9C',
    '#27AE60', '#F39C12', '#D35400', '#8E44AD',
    '#16A085', '#2980B9', '#C0392B', '#7F8C8D'
  ];
  
  // 使用分类名的字符串哈希值来确定颜色索引
  let hashCode = 0;
  for (let i = 0; i < category.length; i++) {
    hashCode = ((hashCode << 5) - hashCode) + category.charCodeAt(i);
    hashCode = hashCode & hashCode; // 转换为32位整数
  }
  
  // 确保hashCode为正数
  hashCode = Math.abs(hashCode);
  
  // 使用哈希值对颜色数组取模，得到确定的颜色索引
  const colorIndex = hashCode % colors.length;
  
  return colors[colorIndex];
}
</script>

<style scoped>
.content-section {
  margin-bottom: 40px;
  text-align: left;
}

.section-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
  border-left: 4px solid #409EFF;
  padding-left: 15px;
  text-align: left;
}

.section-header h3 {
  margin: 0;
  font-size: 18px;
  font-weight: 600;
  color: #303133;
  text-align: left;
}

.section-body {
  padding-left: 19px;
  text-align: left;
}

.empty-tip {
  color: #909399;
  text-align: left;
  padding: 20px 0;
  font-size: 14px;
}

.knowledge-list {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
  gap: 20px;
}

.knowledge-item {
  border: 1px solid #EBEEF5;
  border-radius: 8px;
  padding: 20px;
  cursor: pointer;
  transition: box-shadow 0.3s, border-color 0.3s;
}

.knowledge-item:hover {
  box-shadow: 0 2px 12px 0 rgba(0, 0, 0, 0.1);
  border-color: #C0C4CC;
}

.knowledge-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 10px;
}

.knowledge-header h4 {
  margin: 0;
  font-size: 16px;
  font-weight: 600;
  color: #303133;
}

.knowledge-description {
  color: #606266;
  margin-bottom: 10px;
  font-size: 14px;
  line-height: 1.5;
}

.knowledge-description p {
  margin: 0;
}

.truncated-description {
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  max-width: 100%;
}

.knowledge-footer {
  color: #909399;
  font-size: 13px;
  border-top: 1px solid #EBEEF5;
  padding-top: 10px;
  margin-bottom: 10px;
}

.teach-plan-label {
  font-weight: 600;
  margin-right: 5px;
}

.teach-plan-content {
  flex: 1;
}

.truncated-teach-plan {
  display: -webkit-box;
  -webkit-line-clamp: 1;
  line-clamp: 1;
  -webkit-box-orient: vertical;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  max-width: 100%;
}

.knowledge-actions {
  display: flex;
  justify-content: flex-end;
}

.course-description-container {
  background-color: #F8F9FA;
  border-radius: 8px;
  padding: 20px;
}

.course-tags-container {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  margin-bottom: 15px;
}

.rendered-tag {
  display: inline-block;
  padding: 2px 8px;
  border-radius: 4px;
  font-size: 12px;
  font-weight: 600;
}

.course-desc {
  margin: 0;
  color: #303133;
  line-height: 1.6;
  white-space: pre-line;
}

.materials-list {
  display: flex;
  flex-direction: column;
  gap: 15px;
}

.material-item {
  display: flex;
  align-items: center;
  padding: 12px 15px;
  border-radius: 8px;
  background-color: #F8F9FA;
  transition: background-color 0.3s;
}

.material-item:hover {
  background-color: #EBEEF5;
}

.material-item .el-icon {
  font-size: 24px;
  color: #409EFF;
  margin-right: 12px;
}

.material-name {
  flex: 1;
  font-weight: 500;
  color: #303133;
}

.material-actions {
  display: flex;
  gap: 10px;
}
</style> 