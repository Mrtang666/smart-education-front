<template>
  <div class="teacher-course">
    <div class="course-header">
      <div class="header-content">
        <h2 class="section-title">课程管理</h2>
        <!-- 添加加入课程按钮 -->
        <el-button type="primary" @click="showJoinCourseDialog" class="join-course-btn">
          <el-icon><Plus /></el-icon>加入课程
        </el-button>
      </div>
      <div class="course-actions">
        <!-- 移除了顶部的新建课程按钮和搜索框 -->
      </div>
    </div>

    <!-- 课程分类筛选 -->
    <div class="category-filter-container">
      <!-- 方向筛选 -->
      <div class="filter-section direction-filter">
        <span class="filter-label">方 向</span>
        <div class="filter-tabs">
          <div v-for="filter in directionFilters" :key="filter.value"
            class="filter-tab"
            :class="{ 'filter-tab-active': currentDirection === filter.value }"
            @click="selectDirection(filter.value)">
            {{ filter.label }}
          </div>
        </div>
      </div>

      <!-- 子类筛选 -->
      <div class="filter-section category-filter">
        <span class="filter-label">子 类</span>
        <div class="filter-tabs">
          <div v-for="filter in categoryFilters" :key="filter.value"
            class="filter-tab"
            :class="{ 'filter-tab-active': currentCategory === filter.value }"
            @click="selectCategory(filter.value)">
            {{ filter.label }}
          </div>
        </div>
      </div>
    </div>

    <!-- 排序选项 -->
    <div class="sort-options">
      <div class="sort-options-left">
        <div class="sort-option" :class="{ 'sort-option-active': sortOption === 'latest' }"
          @click="selectSortOption('latest')">
          最新
        </div>
        <div class="sort-option" :class="{ 'sort-option-active': sortOption === 'popular' }"
          @click="selectSortOption('popular')">
          最热
        </div>
      </div>

      <div class="sort-actions-right">
        <!-- 新建课程按钮 -->
        <el-button type="primary" @click="showCreateCourseDialog" class="create-course-btn">
          <el-icon>
            <Plus />
          </el-icon>新建课程
        </el-button>

        <!-- 搜索框 -->
        <div class="course-search">
          <el-input v-model="searchKeyword" placeholder="请输入课程名称或编码搜索" class="search-input" @input="handleSearch">
            <template #suffix>
              <el-icon class="search-icon">
                <Search />
              </el-icon>
            </template>
          </el-input>
        </div>
      </div>

    </div>

    <!-- 修改课程列表显示 -->
    <div v-if="loading" class="course-loading">
      <el-skeleton :rows="3" animated />
    </div>
    <div v-else-if="displayCourseList.length === 0" class="empty-course">
      <div class="empty-course-content">
        <el-icon class="empty-icon"><Plus /></el-icon>
        <p class="empty-text">您还没有创建过课程</p>
        <el-button type="primary" @click="createCourse">创建课程</el-button>
      </div>
    </div>
    <div v-else class="course-list">
      <!-- 课程卡片 -->
      <div v-for="course in displayCourseList" :key="course.id" class="course-item" @click="enterCourse(course)">
        <el-button class="course-delete-btn" type="danger" size="small" plain @click.stop="handleDeleteCourse(course)">删除</el-button>
        <div class="course-cover" :style="{ backgroundColor: getCategoryColor(course.category) }">
          <el-icon>
            <Reading />
          </el-icon>
        </div>
        <div class="course-info">
          <h3 class="course-name">{{ course.name }}</h3>
          <div class="course-content-row">
            <div class="course-tags-container">
              <div 
                v-for="(tag, index) in extractTags(course.description)" 
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
            <p class="course-desc">{{ formatDescription(course.description) }}</p>
          </div>
          <div class="course-meta">
            <span class="category-tag" :style="{ backgroundColor: getCategoryColor(course.category) + '20', color: getCategoryColor(course.category) }">
              {{ course.category }}
            </span>
            <span class="update-time">更新于: {{ formatDate(course.updateTime) }}</span>
          </div>
        </div>
      </div>
    </div>

    <!-- 创建课程对话框 -->
    <el-dialog v-model="createCourseDialogVisible" title="创建新课程" width="500px" :close-on-click-modal="false">
      <el-form :model="newCourse" label-width="80px" :rules="courseRules" ref="courseFormRef">
        <el-form-item label="课程名称" prop="name">
          <el-input v-model="newCourse.name" placeholder="请输入课程名称" @change="handleNameChange" />
        </el-form-item>
        <el-form-item label="所属学科" prop="subjectId">
          <el-select v-model="newCourse.subjectId" placeholder="请选择所属学科" filterable :loading="subjectsLoading" style="width: 100%">
            <el-option v-for="s in subjectOptions" :key="s.id" :label="s.name" :value="s.id" />
          </el-select>
        </el-form-item>
        <el-form-item label="课程描述">
          <!-- 使用Element Plus的文本框，但添加标签显示区域 -->
          <el-input
            v-model="newCourse.description"
            type="textarea"
            placeholder="请输入课程描述"
            :rows="3"
            @input="processTextareaContent"
          />
          
          <!-- 显示检测到的标签 -->
          <div class="detected-tags" v-if="contentSegments.filter(seg => seg.type === 'tag').length > 0">
            <span class="tag-label">检测到的标签：</span>
            <div class="tag-list">
              <div
                v-for="(segment, index) in contentSegments.filter(seg => seg.type === 'tag')"
                :key="index"
                class="tag-item"
                :style="{ backgroundColor: getCategoryColor(segment.content) + '30' }"
              >
                <span class="tag-text">{{ segment.content }}</span>
                <span class="tag-delete" @click="removeTag(segment.content)">×</span>
              </div>
            </div>
          </div>
          
          <div class="description-tips">
            <p>tip：使用 #标签名# 添加子类标签，如：#前端开发#</p>
          </div>
        </el-form-item>
        <el-form-item label="课程分类">
          <div class="category-selection">
            <div class="auto-category">
              <div class="category-color" :style="{ backgroundColor: newCourse.color }"></div>
              <span class="auto-match-text">自动匹配: {{ newCourse.category || '输入课程名称后自动匹配' }}</span>
            </div>
            <el-select v-model="newCourse.category" placeholder="手动选择分类" @change="handleManualCategoryChange"
              class="manual-select">
              <el-option v-for="option in categoryOptions" :key="option.value" :label="option.label"
                :value="option.value">
                <div class="category-option">
                  <div class="category-color-dot" :style="{ backgroundColor: option.color }"></div>
                  <span>{{ option.label }}</span>
                </div>
              </el-option>
            </el-select>
          </div>
        </el-form-item>
        <el-form-item label="学分">
          <el-select v-model="newCourse.credit">
            <el-option v-for="option in creditOptions" :key="option.value" :label="option.label"
              :value="option.value"></el-option>
          </el-select>
        </el-form-item>
        
        <!-- 添加知识点选择 -->
        <el-form-item label="知识点">
          <div class="knowledge-selection">
            <div class="selected-knowledge-list" v-if="selectedKnowledge.length > 0">
              <el-tag
                v-for="item in selectedKnowledge"
                :key="item.knowledgeId"
                closable
                @close="removeKnowledge(item)"
                class="knowledge-tag"
                :type="getKnowledgeTagType(item.difficultyLevel)"
              >
                {{ item.name }}
              </el-tag>
            </div>
            <div class="knowledge-empty" v-else>
              <span class="knowledge-empty-text">暂未选择</span>
            </div>
            <el-button type="primary" plain size="small" @click="showKnowledgeSelectionDialog">
              <el-icon><Plus /></el-icon>选择
            </el-button>
          </div>
        </el-form-item>
      </el-form>
      <template #footer>
        <div class="dialog-footer">
          <el-button @click="createCourseDialogVisible = false">取消</el-button>
          <el-button type="primary" @click="createCourse">创建</el-button>
        </div>
      </template>
    </el-dialog>

    <!-- 知识点选择对话框 -->
    <el-dialog v-model="knowledgeSelectionVisible" title="选择知识点" width="800px" append-to-body class="knowledge-dialog">
      <div class="knowledge-dialog-content">
        <!-- 知识点搜索 -->
        <div class="knowledge-search-container">
          <el-input 
            v-model="knowledgeSearchKeyword" 
            placeholder="搜索知识点" 
            class="knowledge-search-input"
            @input="filterKnowledgeList"
            clearable
          >
            <template #prefix>
              <el-icon class="search-icon"><Search /></el-icon>
            </template>
          </el-input>
        </div>

        <!-- 知识点列表 -->
        <div class="knowledge-list-container">
          <el-table
            ref="knowledgeTableRef"
            v-loading="knowledgeLoading"
            :data="paginatedKnowledgeList"
            style="width: 100%"
            height="300px"
            @selection-change="handleKnowledgeSelectionChange"
            @row-click="handleRowClick"
            border
            highlight-current-row
            stripe
          >
            <el-table-column type="selection" width="55" />
            <el-table-column prop="name" label="知识点名称" min-width="120" show-overflow-tooltip />
            <el-table-column prop="description" label="知识点描述" min-width="180" show-overflow-tooltip>
              <template #default="scope">
                <span class="knowledge-description">{{ scope.row.description || '暂无描述' }}</span>
              </template>
            </el-table-column>
            <el-table-column prop="teachPlan" label="教学计划" min-width="180" show-overflow-tooltip>
              <template #default="scope">
                <el-popover
                  placement="top"
                  :width="300"
                  trigger="hover"
                  :content="scope.row.teachPlan || '暂无教学计划'"
                >
                  <template #reference>
                    <span class="knowledge-teach-plan truncated-teach-plan">{{ scope.row.teachPlan || '暂无教学计划' }}</span>
                  </template>
                </el-popover>
              </template>
            </el-table-column>
            <el-table-column prop="difficultyLevel" label="难度等级" width="100" align="center">
              <template #default="scope">
                <el-tag :type="getKnowledgeTagType(scope.row.difficultyLevel)">
                  {{ scope.row.difficultyLevel }}
                </el-tag>
              </template>
            </el-table-column>
          </el-table>
          
          <!-- 分页控件 -->
          <div class="pagination-container">
            <el-pagination
              v-model:current-page="currentPage"
              v-model:page-size="pageSize"
              :page-sizes="[5, 10, 20, 50]"
              layout="total, sizes, prev, pager, next, jumper"
              :total="filteredKnowledgeList.length"
              @size-change="handleSizeChange"
              @current-change="handleCurrentChange"
              background
            />
          </div>
        </div>
      </div>
      <template #footer>
        <div class="dialog-footer">
          <span class="selected-count" v-if="selectedKnowledgeIds.length > 0">
            已选择 {{ selectedKnowledgeIds.length }} 个知识点
          </span>
          <div class="dialog-buttons">
            <el-button @click="knowledgeSelectionVisible = false">取消</el-button>
            <el-button type="primary" @click="confirmKnowledgeSelection">确定</el-button>
          </div>
        </div>
      </template>
    </el-dialog>

    <!-- 加入课程对话框 -->
    <el-dialog v-model="joinCourseDialogVisible" title="加入课程" width="400px" :close-on-click-modal="false">
      <el-form :model="joinCourseForm" label-width="80px" ref="joinCourseFormRef">
        <el-form-item label="邀请码" prop="inviteCode" :rules="[
          { required: true, message: '请输入邀请码', trigger: 'blur' },
          { min: 6, max: 20, message: '邀请码长度在6到20个字符之间', trigger: 'blur' }
        ]">
          <el-input v-model="joinCourseForm.inviteCode" placeholder="请输入课程邀请码" />
        </el-form-item>
      </el-form>
      <template #footer>
        <div class="dialog-footer">
          <el-button @click="joinCourseDialogVisible = false">取消</el-button>
          <el-button type="primary" @click="handleJoinCourse">加入</el-button>
        </div>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { ElMessage, ElMessageBox } from 'element-plus'
import { Plus, Reading, Search } from '@element-plus/icons-vue'
import { courseAPI, knowledgeAPI } from '@/api/api'
import { subjectController } from '@/api/apiLearning'
import BigNumber from 'bignumber.js'

const router = useRouter()

// 课程列表数据
const courseList = ref([])
const loading = ref(false)

// 分类筛选相关
const currentDirection = ref('全部')
const currentCategory = ref('全部')
const sortOption = ref('latest') // 'latest' 或 'popular'
const searchKeyword = ref('') // 搜索关键词

// 方向筛选选项
const directionFilters = computed(() => {
  // 基础的"全部"选项始终存在
  const baseFilters = [{ label: '全部', value: '全部', color: '#DCDFE6' }]
  
  // 如果还没有课程数据，则只返回"全部"选项
  if (!originalCourseList.value || originalCourseList.value.length === 0) {
    return baseFilters
  }
  
  // 从原始课程数据中提取所有唯一的category
  const uniqueDirections = new Set()
  
  // 添加所有课程的分类作为方向
  originalCourseList.value.forEach(course => {
    if (course.category) {
      uniqueDirections.add(course.category)
    }
  })
  
  // 将所有唯一的category转换为选项格式
  return [
    ...baseFilters,
    ...Array.from(uniqueDirections).map(direction => ({
      label: direction,
      value: direction,
      color: getCategoryColor(direction)
    }))
  ]
})

// 子类筛选选项 - 根据当前选择的方向动态生成
const categoryFilters = computed(() => {
  // 基础的"全部"选项始终存在
  const baseFilters = [{ label: '全部', value: '全部', color: '#DCDFE6' }]

  // 如果没有课程数据，只返回"全部"选项
  if (!originalCourseList.value || originalCourseList.value.length === 0) {
    return baseFilters;
  }

  // 从课程描述中提取子类
  const subcategories = new Set();
  
  // 只处理当前选中方向的课程
  const coursesToProcess = currentDirection.value === '全部' 
    ? originalCourseList.value 
    : originalCourseList.value.filter(course => course.category === currentDirection.value);
  
  // 正则表达式匹配以#开头，以#或|结尾的内容
  const regex = /#([^#|]+)(#|\|)/g;
  
  coursesToProcess.forEach(course => {
    // 如果课程有描述，则从描述中提取子类
    if (course.description) {
      let match;
      // 使用正则表达式全局匹配
      while ((match = regex.exec(course.description)) !== null) {
        // match[1]是第一个捕获组，即#和结束符之间的内容
        if (match[1]) {
          subcategories.add(match[1]);
        }
      }
    }
  });
  
  // 如果没有提取到子类，则只返回"全部"选项
  if (subcategories.size === 0) {
    return baseFilters;
  }
  
  // 将提取到的子类转换为选项格式
  return [
    ...baseFilters,
    ...Array.from(subcategories).map(subcat => ({
      label: subcat,
      value: subcat,
      color: getCategoryColor(subcat)
    }))
  ];
})

// 定义一个新的变量用于存储原始课程数据
const originalCourseList = ref([])

// 选择方向
async function selectDirection(direction) {
  currentDirection.value = direction
  currentCategory.value = '全部' // 重置子类选择

  if (direction !== '全部') {
    try {
      loading.value = true
      // 筛选指定类别的课程
      courseList.value = originalCourseList.value.filter(course => course.category === direction);
    } catch (error) {
      console.error('筛选课程失败:', error)
      ElMessage.error('筛选课程失败，请稍后重试')
      courseList.value = []
    } finally {
      loading.value = false
    }
  } else {
    // 如果选择了"全部"，则恢复原始课程列表
    courseList.value = [...originalCourseList.value]
  }
}

// 选择子类
async function selectCategory(category) {
  currentCategory.value = category

  // 如果选择了特定子类，则使用筛选逻辑
  if (category !== '全部') {
    if (currentDirection.value !== '全部') {
      // 如果同时选择了方向，则筛选该方向下包含指定子类标签的课程
      const filteredCourses = originalCourseList.value.filter(course => {
        // 首先检查课程是否属于当前选中的方向
        if (course.category !== currentDirection.value) {
          return false;
        }
        
        // 然后检查课程描述中是否包含当前选中的子类标签
        if (!course.description) {
          return false;
        }
        
        // 使用正则表达式检查
        const regex = new RegExp(`#${category}(#|\\|)`, 'g');
        return regex.test(course.description);
      });
      
      courseList.value = filteredCourses;
    } else {
      // 如果方向是"全部"，则筛选所有课程中包含指定子类标签的课程
      // 确保我们有原始数据
      if (originalCourseList.value.length === 0) {
        await fetchCourses();
      }
      
      // 筛选包含指定子类标签的课程
      courseList.value = originalCourseList.value.filter(course => {
        if (!course.description) {
          return false;
        }
        
        // 使用正则表达式检查
        const regex = new RegExp(`#${category}(#|\\|)`, 'g');
        return regex.test(course.description);
      });
    }
  } else if (currentDirection.value !== '全部') {
    // 如果选择了"全部"子类，但有特定方向，则获取该方向的课程
    courseList.value = originalCourseList.value.filter(course => 
      course.category === currentDirection.value
    );
  } else {
    // 如果方向和子类都是"全部"，则获取所有课程
    courseList.value = [...originalCourseList.value];
  }
}

// 处理搜索
async function handleSearch() {
  if (searchKeyword.value.trim() === '') {
    // 如果搜索关键词为空，恢复到当前筛选状态
    await selectCategory(currentCategory.value);
    return;
  }

  // 搜索关键词不为空时，在当前筛选结果的基础上进行搜索
  const keyword = searchKeyword.value.toLowerCase();
  
  // 先根据当前的方向和子类筛选
  let filteredCourses = [];
  
  if (currentDirection.value !== '全部') {
    // 如果选择了特定方向
    filteredCourses = originalCourseList.value.filter(course => 
      course.category === currentDirection.value
    );
  } else {
    // 如果方向是"全部"
    filteredCourses = [...originalCourseList.value];
  }
  
  // 如果选择了特定子类，进一步筛选
  if (currentCategory.value !== '全部') {
    filteredCourses = filteredCourses.filter(course => {
      if (!course.description) {
        return false;
      }
      
      // 使用正则表达式检查是否包含当前子类标签
      const regex = new RegExp(`#${currentCategory.value}(#|\\|)`, 'g');
      return regex.test(course.description);
    });
  }
  
  // 最后根据关键词搜索
  courseList.value = filteredCourses.filter(course => 
    course.name.toLowerCase().includes(keyword) || 
    (course.description && course.description.toLowerCase().includes(keyword))
  );
}

// 获取课程列表
async function fetchCourses() {
  try {
    loading.value = true
    
    // 从localstorage中获取教师ID
    const userInfoStr = localStorage.getItem('user_info')
    if (!userInfoStr) {
      throw new Error('未找到用户信息，请重新登录')
    }
    
    const userInfo = JSON.parse(userInfoStr)
    if (!userInfo || !userInfo.teacherId) {
      throw new Error('用户信息不完整或不是教师账号')
    }
    
    // 获取教师所有课程
    const courses = await courseAPI.getAllCourses()
    
    if (Array.isArray(courses)) {
      courseList.value = courses
      // 更新原始课程列表
      originalCourseList.value = [...courses]
      
      // 重置筛选条件，确保方向选项更新
      if (currentDirection.value !== '全部') {
        currentDirection.value = '全部'
      }
      currentCategory.value = '全部'
    } else {
      courseList.value = []
      originalCourseList.value = []
    }
  } catch (error) {
    console.error('获取教师课程失败:', error)
    ElMessage.error('获取课程列表失败，请稍后重试')
    courseList.value = []
    originalCourseList.value = []
  } finally {
    loading.value = false
  }
}

// 格式化日期
function formatDate(dateString) {
  if (!dateString) return '未知时间'

  try {
    const date = new Date(dateString)
    return date.toLocaleDateString()
  } catch (e) {
    return '未知时间'
  }
}

// 处理课程描述显示，只显示第一个|后面的内容，并去掉所有#标签#
function formatDescription(description) {
  if (!description) return '暂无描述';
  
  // 查找第一个|符号的位置
  const pipeIndex = description.indexOf('|');
  
  // 如果找到|符号，则获取|后面的内容
  let processedDesc = description;
  if (pipeIndex !== -1 && pipeIndex < description.length - 1) {
    processedDesc = description.substring(pipeIndex + 1).trim();
  }
  
  // 去掉所有#标签#内容
  return processedDesc.replace(/#([^#]+)#/g, '').trim() || '暂无描述';
}

// 在组件挂载时获取课程列表
onMounted(async () => {
  try {
    loading.value = true
    // 获取教师自己的所有课程
    await fetchCourses()
    // 初始化原始课程数据
    originalCourseList.value = [...courseList.value]
  } catch (error) {
    console.error('获取课程列表失败:', error)
    ElMessage.error('获取课程列表失败，请稍后重试')
  } finally {
    loading.value = false
  }
})

// 根据排序选项对课程进行排序
function sortCourses() {
  if (sortOption.value === 'latest') {
    // 按更新时间排序，最新的在前面
    courseList.value.sort((a, b) => {
      const dateA = new Date(a.updateTime || a.createTime || 0)
      const dateB = new Date(b.updateTime || b.createTime || 0)
      return dateB - dateA // 降序排列
    })
  } else if (sortOption.value === 'popular') {
    // 按学生数量排序，最多的在前面
    courseList.value.sort((a, b) => {
      return (b.studentCount || 0) - (a.studentCount || 0)
    })
  }
}

// 选择排序方式
function selectSortOption(option) {
  sortOption.value = option
  // 应用排序
  sortCourses()
}

// 最终显示的课程列表
const displayCourseList = computed(() => {
  // 先应用搜索过滤
  let result = courseList.value

  // 应用搜索关键词过滤
  if (searchKeyword.value) {
    result = result.filter(course =>
      course.name.toLowerCase().includes(searchKeyword.value.toLowerCase()) ||
      (course.description && course.description.toLowerCase().includes(searchKeyword.value.toLowerCase()))
    )
  }

  return result
})

// 创建课程相关
const createCourseDialogVisible = ref(false)
const courseFormRef = ref(null)
const newCourse = ref({
  name: '',
  description: '',
  category: '',
  credit: 3,
  color: '#409EFF',
  subjectId: ''
})

// 学科选择相关
const subjectsLoading = ref(false)
const subjectOptions = ref([])

async function loadSubjects() {
  try {
    subjectsLoading.value = true
    const data = await subjectController.getAll()
    let list = []
    if (Array.isArray(data)) {
      list = data
    } else if (data && Array.isArray(data.records)) {
      list = data.records
    }
    subjectOptions.value = list.map(item => ({ id: item.id, name: item.name }))
  } catch (error) {
    console.error('获取学科列表失败:', error)
    subjectOptions.value = []
  } finally {
    subjectsLoading.value = false
  }
}

// 文本区域相关
const contentSegments = ref([])

// 处理文本框内容，解析标签和普通文本
function processTextareaContent() {
  const text = newCourse.value.description
  const segments = []
  const regex = /#([^#]+)#/g
  
  let lastIndex = 0
  let match
  
  // 查找所有标签
  while ((match = regex.exec(text)) !== null) {
    // 添加标签前的普通文本
    if (match.index > lastIndex) {
      segments.push({
        type: 'text',
        content: text.substring(lastIndex, match.index)
      })
    }
    
    // 添加标签
    segments.push({
      type: 'tag',
      content: match[1].trim()
    })
    
    lastIndex = match.index + match[0].length
  }
  
  // 添加最后一段普通文本
  if (lastIndex < text.length) {
    segments.push({
      type: 'text',
      content: text.substring(lastIndex)
    })
  }
  
  contentSegments.value = segments
}

// 删除标签
function removeTag(tag) {
  // 从描述中删除标签
  const regex = new RegExp(`#${tag}#`, 'g')
  newCourse.value.description = newCourse.value.description.replace(regex, '')
  
  // 重新处理文本内容
  processTextareaContent()
}

// 在组件挂载后初始化
onMounted(() => {
  // 初始处理文本内容
  processTextareaContent()
})

// 在创建课程对话框打开时重置
async function showCreateCourseDialog() {
  createCourseDialogVisible.value = true
  // 重置表单
  newCourse.value = {
    name: '',
    description: '',
    category: '其他',
    credit: 3,
    color: '#DCDFE6', // 浅灰色
    subjectId: ''
  }
  // 清空已选知识点
  selectedKnowledge.value = []
  // 清空内容片段
  contentSegments.value = []
  // 加载学科列表
  loadSubjects()
}

// 知识点相关
const knowledgeSelectionVisible = ref(false)
const knowledgeList = ref([])
const selectedKnowledgeIds = ref([]) // 临时选中的知识点ID
const selectedKnowledge = ref([]) // 最终选中的知识点
const knowledgeLoading = ref(false)
const knowledgeSearchKeyword = ref('')

// 过滤后的知识点列表
const filteredKnowledgeList = computed(() => {
  if (!knowledgeSearchKeyword.value) {
    return knowledgeList.value
  }
  
  const keyword = knowledgeSearchKeyword.value.toLowerCase()
  return knowledgeList.value.filter(item => 
    item.name.toLowerCase().includes(keyword) || 
    (item.description && item.description.toLowerCase().includes(keyword))
  )
})

// 分页相关
const currentPage = ref(1)
const pageSize = ref(10)

// 根据当前页码和每页数量计算分页后的知识点列表
const paginatedKnowledgeList = computed(() => {
  const startIndex = (currentPage.value - 1) * pageSize.value
  const endIndex = startIndex + pageSize.value
  return filteredKnowledgeList.value.slice(startIndex, endIndex)
})

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

// 过滤知识点列表时重置分页
function filterKnowledgeList() {
  // 重置到第一页
  currentPage.value = 1
  // 由computed属性filteredKnowledgeList自动处理过滤逻辑
}

// 根据难度等级获取标签类型
function getKnowledgeTagType(level) {
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

// 显示知识点选择对话框
async function showKnowledgeSelectionDialog() {
  knowledgeSelectionVisible.value = true
  knowledgeSearchKeyword.value = ''
  
  // 加载知识点列表
  await fetchKnowledgeList()
}

// 获取教师的知识点列表
async function fetchKnowledgeList() {
  knowledgeLoading.value = true
  try {
    // 从localstorage中获取教师ID
    const userInfoStr = localStorage.getItem('user_info')
    if (!userInfoStr) {
      throw new Error('未找到用户信息，请重新登录')
    }
    
    // 解析JSON字符串
    const userInfo = JSON.parse(userInfoStr)
    if (!userInfo || !userInfo.teacherId) {
      throw new Error('用户信息不完整或不是教师账号')
    }
    
    const teacherId = userInfo.teacherId ? new BigNumber(userInfo.teacherId).toString() : userInfo.teacherId
    console.log('教师ID:', teacherId)
    
    // 调用API获取知识点列表
    const response = await knowledgeAPI.getKnowledgeByTeacherId(teacherId)
    console.log('获取到的知识点列表:', response)
    
    // 处理知识点列表，确保ID使用字符串形式
    knowledgeList.value = Array.isArray(response) ? response.map(item => ({
      ...item,
      knowledgeId: item.knowledgeId ? new BigNumber(item.knowledgeId).toString() : item.knowledgeId
    })) : []
    
    // 预选已选择的知识点
    if (selectedKnowledge.value.length > 0) {
      selectedKnowledgeIds.value = selectedKnowledge.value.map(item => 
        item.knowledgeId ? new BigNumber(item.knowledgeId).toString() : item.knowledgeId
      )
    }
  } catch (error) {
    console.error('获取知识点列表失败:', error)
    ElMessage.error(`获取知识点列表失败: ${error.message || '请稍后重试'}`)
  } finally {
    knowledgeLoading.value = false
  }
}

// 处理知识点选择变化
function handleKnowledgeSelectionChange(selection) {
  selectedKnowledgeIds.value = selection.map(item => {
    // 确保知识点ID使用字符串形式，避免精度丢失
    return item.knowledgeId ? new BigNumber(item.knowledgeId).toString() : item.knowledgeId
  })
}

// 确认知识点选择
function confirmKnowledgeSelection() {
  // 根据选中的ID获取完整的知识点对象
  selectedKnowledge.value = knowledgeList.value.filter(item => 
    selectedKnowledgeIds.value.includes(
      item.knowledgeId ? new BigNumber(item.knowledgeId).toString() : item.knowledgeId
    )
  )
  
  // 关闭对话框
  knowledgeSelectionVisible.value = false
  
  ElMessage.success(`已选择 ${selectedKnowledge.value.length} 个知识点`)
}

// 移除已选择的知识点
function removeKnowledge(knowledge) {
  const knowledgeIdStr = knowledge.knowledgeId ? 
    new BigNumber(knowledge.knowledgeId).toString() : knowledge.knowledgeId
  
  selectedKnowledge.value = selectedKnowledge.value.filter(
    item => {
      const itemIdStr = item.knowledgeId ? 
        new BigNumber(item.knowledgeId).toString() : item.knowledgeId
      return itemIdStr !== knowledgeIdStr
    }
  )
}

// 修改创建课程函数，添加知识点关联
async function createCourse() {
  // 在提交前确保分类已自动匹配
  if (!newCourse.value.category) {
    autoMatchCategory(newCourse.value.name)
  }

  courseFormRef.value.validate(async (valid) => {
    if (valid) {
      try {
        // 保存原始描述，包含标签信息
        const originalDescription = newCourse.value.description || '';
        
        const courseData = {
          name: newCourse.value.name,
          code: `COURSE-${Date.now()}`, // 生成临时课程编码
          description: originalDescription, // 保存完整描述，包含标签
          category: newCourse.value.category,
          credit: newCourse.value.credit,
          status: 1, // 使用整数类型的状态
          knowledgeIds: selectedKnowledge.value.map(item => {
            // 确保知识点ID使用字符串形式，避免精度丢失
            return item.knowledgeId ? new BigNumber(item.knowledgeId).toString() : item.knowledgeId
          }) // 添加知识点ID列表
        }

        // 调用API创建课程
        const response = await courseAPI.saveOrUpdateCourse(courseData)

        // 创建成功后，添加到课程列表
        const newCourseItem = {
          id: response.id ? new BigNumber(response.id).toString() : Date.now().toString(),
          name: response.name,
          description: response.description || originalDescription, // 使用原始描述
          category: response.category || newCourse.value.category,
          credit: response.credit || newCourse.value.credit,
          studentCount: 0, // API中没有返回studentCount字段，默认为0
          updateTime: response.updateTime || response.createTime,
          color: newCourse.value.color
        }

        courseList.value.push(newCourseItem)
        originalCourseList.value.push(newCourseItem)

        // 如果选择了学科，绑定课程与学科关系
        try {
          if (newCourse.value.subjectId && newCourseItem.id) {
            const subjectId = new BigNumber(newCourse.value.subjectId).toString()
            const courseId = new BigNumber(newCourseItem.id).toString()
            await subjectController.addRelation(subjectId, courseId)
          }
        } catch (relErr) {
          console.error('绑定课程与学科关系失败:', relErr)
        }

        // 关闭对话框并重置表单
        createCourseDialogVisible.value = false
        newCourse.value = {
          name: '',
          description: '',
          category: '其他',
          credit: 3,
          color: '#DCDFE6', // 浅灰色
          subjectId: ''
        }
        // 清空已选知识点
        selectedKnowledge.value = []

        ElMessage.success('课程创建成功')
        
        // 创建课程成功后自动刷新页面
        setTimeout(() => {
          window.location.reload()
        }, 100) // 延迟0.1秒后刷新，让用户看到成功提示
      } catch (error) {
        console.error('创建课程失败:', error)
        ElMessage.error('创建课程失败，请稍后重试')
      }
    }
  })
}

// 进入课程
function enterCourse(course) {
  console.log('进入课程:', course)
  ElMessage.success(`进入课程: ${course.name}`)
  // 跳转到课程详情页，使用课程ID作为路径参数（确保是字符串形式）
  router.push(`/teacher/course/${course.id.toString()}`)
}

// 表格引用
const knowledgeTableRef = ref(null)

// 处理行点击事件，实现点击行即可选择
function handleRowClick(row) {
  // 直接调用表格的toggleRowSelection方法来切换行的选择状态
  knowledgeTableRef.value.toggleRowSelection(row)
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

// 删除课程
async function handleDeleteCourse(course) {
  try {
    await ElMessageBox.confirm(`确定要删除课程“${course.name}”吗？该操作不可恢复。`, '删除确认', {
      type: 'warning',
      confirmButtonText: '删除',
      cancelButtonText: '取消'
    })

    const courseIdStr = course.id ? course.id.toString() : ''
    await courseAPI.deleteCourse(courseIdStr)

    // 从显示与原始列表中移除
    courseList.value = courseList.value.filter(c => c.id.toString() !== courseIdStr)
    originalCourseList.value = originalCourseList.value.filter(c => c.id.toString() !== courseIdStr)

    ElMessage.success('课程已删除')
  } catch (error) {
    if (error && error.message === 'cancel') return
    console.error('删除课程失败:', error)
    ElMessage.error('删除课程失败，请稍后重试')
  }
}

// 根据课程名称自动匹配课程分类
function autoMatchCategory(courseName) {
  if (!courseName) {
    newCourse.value.category = '其他'
    newCourse.value.color = '#DCDFE6' // 浅灰色
    return '其他'
  }

  const lowerName = courseName.toLowerCase()

  // 遍历所有分类，检查课程名称是否包含关键词
  for (const category of categoryOptions) {
    // 跳过"其他"分类，因为它没有关键词
    if (category.value === '其他') continue

    for (const keyword of category.keywords || []) {
      if (keyword && lowerName.includes(keyword.toLowerCase())) {
        newCourse.value.category = category.value
        newCourse.value.color = category.color
        return category.value
      }
    }
  }

  // 如果没有匹配到任何分类，设置为"其他"
  const otherCategory = categoryOptions.find(c => c.value === '其他')
  if (otherCategory) {
    newCourse.value.category = '其他'
    newCourse.value.color = otherCategory.color
  }
  return '其他'
}

// 当课程名称改变时自动匹配分类
function handleNameChange(name) {
  const category = autoMatchCategory(name)
  console.log(`自动匹配课程分类: ${category}`)
}

// 当用户手动选择分类时更新颜色
function handleManualCategoryChange(category) {
  const selectedCategory = categoryOptions.find(item => item.value === category)
  if (selectedCategory) {
    newCourse.value.color = selectedCategory.color
  }
}

// 确保categoryOptions变量存在，用于预定义一些分类选项
const categoryOptions = [
  { label: '计算机科学', value: '计算机科学', color: '#409EFF' },
  { label: '数学', value: '数学', color: '#67C23A' },
  { label: '物理', value: '物理', color: '#E6A23C' },
  { label: '化学', value: '化学', color: '#F56C6C' },
  { label: '生物', value: '生物', color: '#909399' },
  { label: 'AI通识', value: 'AI通识', color: '#9B59B6' },
  { label: '程序设计语言', value: '程序设计语言', color: '#3498DB' },
  { label: '其他', value: '其他', color: '#DCDFE6' }
]

// 学分选项
const creditOptions = [
  { label: '1学分', value: 1 },
  { label: '2学分', value: 2 },
  { label: '3学分', value: 3 },
  { label: '4学分', value: 4 },
  { label: '5学分', value: 5 }
]

const courseRules = {
  name: [
    { required: true, message: '请输入课程名称', trigger: 'blur' },
    { min: 2, max: 50, message: '长度在 2 到 50 个字符', trigger: 'blur' }
  ],
  subjectId: [
    { required: true, message: '请选择所属学科', trigger: 'change' }
  ],
  credit: [
    { required: true, message: '请选择学分', trigger: 'change' }
  ]
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

// 加入课程相关
const joinCourseDialogVisible = ref(false)
const joinCourseFormRef = ref(null)
const joinCourseForm = ref({
  inviteCode: ''
})

// 显示加入课程对话框
function showJoinCourseDialog() {
  joinCourseDialogVisible.value = true
  joinCourseForm.value.inviteCode = ''
}
//待写邀请码接口
// // 处理加入课程
// async function handleJoinCourse() {
//   joinCourseFormRef.value.validate(async (valid) => {
//     if (valid) {
//       try {
//         // 从localstorage中获取教师ID
//         const userInfoStr = localStorage.getItem('user_info')
//         if (!userInfoStr) {
//           throw new Error('未找到用户信息，请重新登录')
//         }
        
//         const userInfo = JSON.parse(userInfoStr)
//         if (!userInfo || !userInfo.teacherId) {
//           throw new Error('用户信息不完整或不是教师账号')
//         }
        
//         // 调用API加入课程
//         await courseAPI.joinCourseByInviteCode({
//           inviteCode: joinCourseForm.value.inviteCode,
//           teacherId: userInfo.teacherId ? new BigNumber(userInfo.teacherId).toString() : userInfo.teacherId
//         })
        
//         // 关闭对话框
//         joinCourseDialogVisible.value = false
        
//         // 重新获取课程列表
//         await fetchCourses()
        
//         ElMessage.success('成功加入课程')
//       } catch (error) {
//         console.error('加入课程失败:', error)
//         ElMessage.error('加入课程失败: ' + (error.message || '请稍后重试'))
//       }
//     }
//   })
// }
</script>

<style scoped>
.teacher-course {
  height: 100%;
  overflow-y: auto;
  padding-bottom: 24px;
}

.course-header {
  margin-bottom: 24px;
}

.header-content {
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.section-title {
  text-align: left;
  font-size: 22px;
  font-weight: 500;
  margin: 0 0 24px 0;
  color: #303133;
  position: relative;
  padding-left: 12px;
  border-left: 4px solid #409EFF;
}

.course-actions {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 16px;
}

.course-list {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
  gap: 24px;
  margin-top: 24px;
}

.course-item {
  background: #fff;
  border-radius: 8px;
  overflow: hidden;
  transition: all 0.3s;
  cursor: pointer;
  box-shadow: 0 2px 12px 0 rgba(0, 0, 0, 0.05);
  display: flex;
  flex-direction: column;
}

.course-item:hover {
  transform: translateY(-5px);
  box-shadow: 0 8px 20px rgba(0, 0, 0, 0.1);
}

.course-cover {
  height: 140px;
  background: #409EFF;
  color: #fff;
  display: flex;
  align-items: center;
  justify-content: center;
  position: relative;
  overflow: hidden;
}

.course-delete-btn {
  position: absolute;
  right: 10px;
  top: 10px;
  z-index: 2;
}

.course-cover .el-icon {
  font-size: 50px;
  opacity: 0.8;
}

.course-info {
  padding: 16px;
  
}

.course-name {
  margin: 0 0 12px 0;
  font-size: 16px;
  font-weight: 500;
  color: #303133;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.course-content-row {
  display: flex;
  align-items: center;
  margin-bottom: 10px;
  width: 100%;
  overflow: hidden;
}

.course-tags-container {
  display: flex;
  flex-wrap: wrap;
  flex-shrink: 0;
  margin-right: 10px;
}

.course-tags-container .rendered-tag {
  display: inline-block;
  margin-right: 8px;
  margin-bottom: 8px;
  white-space: nowrap;
  padding: 4px 15px;
  border-radius: 30px;
  font-size: 14px;
  line-height: 1.4;
  font-weight: 400;
  transition: all 0.3s ease;
}

.course-desc {
  flex: 1;
  min-width: 0; /* 确保文本可以正确截断 */
  margin: 0;
  font-size: 13px;
  color: #909399;
  display: block;
  line-height: 36px;
  padding: 0;
  text-align: left;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  max-width: 100%;
}

.course-meta {
  display: flex;
  align-items: center;
  margin-top: 10px;
  font-size: 12px;
  color: #909399;
}

.category-tag {
  padding: 2px 8px;
  border-radius: 4px;
  font-size: 12px;
  margin-right: 10px;
}

.update-time {
  flex: 1;
}

.empty-course {
  display: flex;
  justify-content: center;
  align-items: center;
  min-height: 300px;
  background-color: #ffffff;
  border-radius: 8px;
  box-shadow: 0 2px 12px 0 rgba(0, 0, 0, 0.1);
}

.empty-course-content {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 40px;
}

.empty-icon {
  font-size: 48px;
  color: #909399;
  margin-bottom: 20px;
}

.empty-text {
  font-size: 16px;
  color: #606266;
  margin-bottom: 20px;
}

/* 分类筛选样式 */
.category-filter-container {
  background: #fff;
  border-radius: 8px;
  padding: 16px 20px;
  margin-bottom: 20px;
  box-shadow: 0 2px 12px 0 rgba(0, 0, 0, 0.05);
}

.filter-section {
  display: flex;
  align-items: center;
  margin-bottom: 12px;
}

.filter-section:last-child {
  margin-bottom: 0;
}

.filter-label {
  width: 40px;
  font-size: 14px;
  color: #606266;
  margin-right: 16px;
}

.filter-tabs {
  display: flex;
  flex-wrap: wrap;
  gap: 12px;
}

.filter-tab {
  padding: 6px 16px;
  border-radius: 4px;
  margin-right: 10px;
  cursor: pointer;
  transition: all 0.3s;
  background-color: #ffffff;
  color: #606266;
  font-size: 14px;
}

.filter-tab-active {
  background-color: #409EFF;
  color: #ffffff;
  font-weight: 500;
}

.color-indicator {
  display: none;
}

/* 排序选项样式 */
.sort-options {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 20px;
  background: #fff;
  border-radius: 8px;
  padding: 12px 20px;
  box-shadow: 0 2px 12px 0 rgba(0, 0, 0, 0.05);
}

.sort-options-left {
  display: flex;
  align-items: center;
}

.sort-option {
  padding: 6px 16px;
  font-size: 14px;
  color: #606266;
  cursor: pointer;
  border-radius: 4px;
  transition: all 0.3s;
}

.sort-option:hover {
  color: #409EFF;
}

.sort-option-active {
  color: #409EFF;
  font-weight: 500;
  position: relative;
}

.sort-option-active::after {
  content: '';
  position: absolute;
  bottom: 0;
  left: 50%;
  transform: translateX(-50%);
  width: 20px;
  height: 2px;
  background-color: #409EFF;
  border-radius: 1px;
}

.sort-actions-right {
  display: flex;
  align-items: center;
}

.course-filter-dropdown {
  margin-left: auto;
}

.course-filter-text {
  font-size: 14px;
  color: #606266;
  cursor: pointer;
  display: flex;
  align-items: center;
}

.course-search {
  width: 280px;
}

.search-icon {
  color: #606266;
  cursor: pointer;
}

.search-icon:hover {
  color: #409EFF;
}

.create-course-btn {
  margin: 0 16px;
  height: 36px;
  padding: 0 16px;
}

.join-course-btn {
  height: 36px;
  padding: 0 16px;
  margin-right: 0;
}

/* 知识点选择样式 */
.knowledge-selection {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.description-tips {
  margin-top: 8px;
  padding: 8px 12px;
  background-color: #f0f9ff;
  border-radius: 4px;
  font-size: 12px;
  color: #606266;
}

.description-tips p {
  margin: 4px 0;
  line-height: 1.4;
}

.description-tips p:first-child {
  color: #409EFF;
  font-weight: 500;
}

/* 检测到的标签样式 */
.detected-tags {
  margin: 10px 0;
  display: flex;
  align-items: flex-start;
}

.tag-label {
  font-size: 13px;
  color: #606266;
  margin-right: 10px;
  white-space: nowrap;
  line-height: 28px;
}

.tag-list {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}

.tag-item {
  display: flex;
  align-items: center;
  padding: 2px 8px;
  border-radius: 4px;
  font-size: 12px;
  position: relative;
  transition: all 0.2s;
}

.tag-text {
  margin-right: 6px;
  color: #303133;
}

.tag-delete {
  font-size: 14px;
  color: #909399;
  cursor: pointer;
  transition: color 0.2s;
  line-height: 1;
  padding: 2px;
}

.tag-delete:hover {
  color: #F56C6C;
}

.selected-knowledge-list {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  padding: 10px;
  border-radius: 4px;
  background-color: #f5f7fa;
  min-height: 40px;
}

.knowledge-tag {
  margin-right: 5px;
  margin-bottom: 5px;
}

.knowledge-empty {
  display: flex;
  align-items: center;
  justify-content: center;
  height: 40px;
  background-color: #f5f7fa;
  border-radius: 4px;
  color: #909399;
}

.knowledge-dialog :deep(.el-dialog__body) {
  padding: 16px 20px;
}

.knowledge-dialog :deep(.el-dialog__header) {
  padding: 16px 20px;
  margin-right: 0;
  border-bottom: 1px solid #ebeef5;
}

.knowledge-dialog :deep(.el-dialog__footer) {
  padding: 12px 20px;
  border-top: 1px solid #ebeef5;
}

.knowledge-dialog-content {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.knowledge-search-container {
  margin-bottom: 10px;
}

.knowledge-search-input {
  width: 100%;
}

.knowledge-search-input :deep(.el-input__prefix) {
  color: #909399;
}

.knowledge-list-container {
  height: 380px;
  display: flex;
  flex-direction: column;
}

.pagination-container {
  margin-top: 16px;
  display: flex;
  justify-content: center;
}

.dialog-footer {
  display: flex;
  justify-content: space-between;
  align-items: center;
  width: 100%;
}

.selected-count {
  color: #409EFF;
  font-size: 14px;
}

.dialog-buttons {
  display: flex;
  gap: 10px;
}

/* 表格样式优化 */
.el-table {
  --el-table-row-hover-bg-color: #f0f9ff;
  flex: 1;
}

.el-table .el-table__row {
  cursor: pointer;
}

.el-table :deep(th) {
  background-color: #f5f7fa;
  color: #606266;
  font-weight: 600;
}

.knowledge-description,
.knowledge-teach-plan {
  display: block;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  max-width: 100%;
  cursor: pointer;
}

/* 删除之前添加的重复样式 */
.filter-item, .filter-item-active {
  display: none;
}
</style>