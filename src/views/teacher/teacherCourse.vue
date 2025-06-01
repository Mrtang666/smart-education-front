<template>
  <div class="teacher-course">
    <div class="course-header">
      <h2 class="section-title">课程管理</h2>
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
          <div v-for="item in directionFilters" :key="item.value" class="filter-tab"
            :class="{ 'filter-tab-active': currentDirection === item.value }" @click="selectDirection(item.value)">
            {{ item.label }}
          </div>
        </div>
      </div>

      <!-- 子类筛选 -->
      <div class="filter-section category-filter">
        <span class="filter-label">子 类</span>
        <div class="filter-tabs">
          <div v-for="item in categoryFilters" :key="item.value" class="filter-tab"
            :class="{ 'filter-tab-active': currentCategory === item.value }" @click="selectCategory(item.value)">
            {{ item.label }}
          </div>
        </div>
      </div>
    </div>

    <!-- 排序选项 -->
    <div class="sort-options">
      <div class="sort-options-left">
        <div class="sort-option" :class="{ 'sort-option-active': sortOption === 'latest' }"
          @click="setSortOption('latest')">
          最新
        </div>
        <div class="sort-option" :class="{ 'sort-option-active': sortOption === 'popular' }"
          @click="setSortOption('popular')">
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

    <!-- 课程为空时的提示 -->
    <div v-if="displayCourseList.length === 0" class="empty-course">
      <div class="empty-placeholder">
        <el-icon class="empty-icon">
          <Reading />
        </el-icon>
        <p>暂无课程</p>
      </div>
    </div>

    <!-- 课程列表 -->
    <div v-else class="course-list">
      <div v-for="course in displayCourseList" :key="course.id" class="course-item" @click="enterCourse(course)">
        <div class="course-cover" :style="{ backgroundColor: course.color }">
          <el-icon>
            <Reading />
          </el-icon>
          <div class="course-category">{{ course.category || '未分类' }}</div>
        </div>
        <div class="course-info">
          <h3 class="course-title">{{ course.name }}</h3>
          <p class="course-desc">
            <span class="course-credit">{{ course.credit || 0 }}学分</span> ·
            <span>{{ course.studentCount || 0 }}名学生</span> ·
            <span>{{ course.updateTime }}</span>
          </p>
        </div>
      </div>
    </div>

    <!-- 创建课程对话框 -->
    <el-dialog v-model="createCourseDialogVisible" title="创建新课程" width="500px" :close-on-click-modal="false">
      <el-form :model="newCourse" label-width="80px" :rules="courseRules" ref="courseFormRef">
        <el-form-item label="课程名称" prop="name">
          <el-input v-model="newCourse.name" placeholder="请输入课程名称" @change="handleNameChange" />
        </el-form-item>
        <el-form-item label="课程描述">
          <el-input v-model="newCourse.description" type="textarea" placeholder="请输入课程描述" :rows="3" />
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
      </el-form>
      <template #footer>
        <div class="dialog-footer">
          <el-button @click="createCourseDialogVisible = false">取消</el-button>
          <el-button type="primary" @click="createCourse">创建</el-button>
        </div>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { ElMessage, ElLoading } from 'element-plus'
import { Plus, Reading, /*Document,*/ Search, } from '@element-plus/icons-vue'
import { useRouter } from 'vue-router'
import { courseAPI } from '@/api/api'

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
const directionFilters = [
  { label: '全部', value: '全部' },
  { label: 'AI通识课专栏', value: 'AI通识' },
  { label: '程序设计语言', value: '程序设计语言' },
  { label: '计算机基础', value: '计算机基础' },
  { label: '算法设计', value: '算法设计' },
  { label: '网络与安全', value: '网络与安全' },
  { label: '教学与统计', value: '教学与统计' },
  { label: '数学', value: '数学' }
]

// 子类筛选选项 - 根据当前选择的方向动态生成
const categoryFilters = computed(() => {
  // 基础的"全部"选项始终存在
  const baseFilters = [{ label: '全部', value: '全部' }]

  // 根据当前选择的方向，返回相应的子类选项
  if (currentDirection.value === '全部') {
    // 如果选择了"全部"方向，则显示所有可用的课程类别
    const allCategories = new Set()
    courseList.value.forEach(course => {
      if (course.category) {
        allCategories.add(course.category)
      }
    })

    // 将所有类别转换为选项格式
    return [
      ...baseFilters,
      ...Array.from(allCategories).map(category => ({
        label: category,
        value: category
      }))
    ]
  } else if (currentDirection.value === 'AI通识') {
    // AI通识课专栏的子类
    return [
      ...baseFilters,
      { label: 'AI通识基础课', value: 'AI通识基础课' },
      { label: 'AI通识核心课', value: 'AI通识核心课' },
      { label: 'AI通识案例课', value: 'AI通识案例课' }
    ]
  } else if (currentDirection.value === '程序设计语言') {
    // 程序设计语言的子类
    return [
      ...baseFilters,
      { label: 'Python程序设计', value: 'Python程序设计' },
      { label: 'C/C++程序设计', value: 'C/C++程序设计' },
      { label: 'Java程序设计', value: 'Java程序设计' },
      { label: 'C#程序设计', value: 'C#程序设计' }
    ]
  } else if (currentDirection.value === '数学') {
    return [
      ...baseFilters,
      { label: '高等数学', value: '高等数学' },
      { label: '线性代数', value: '线性代数' },
      { label: '概率论与数理统计', value: '概率论与数理统计' }
    ]
  } else if (currentDirection.value === '物理') {
    return [
      ...baseFilters,
      { label: '大学物理', value: '大学物理' },
      { label: '量子物理', value: '量子物理' },
    ]
  } else {
    // 其他方向暂时只返回基础选项
    return baseFilters
  }
})

// 选择方向
async function selectDirection(direction) {
  currentDirection.value = direction
  // 重置子类选择为"全部"
  currentCategory.value = '全部'

  // 如果选择了特定方向，则通过getCoursesByCategory API获取该方向的课程
  if (direction !== '全部') {
    await fetchCoursesByCategory(direction)
  } else {
    // 如果选择了"全部"，则获取所有课程
    await fetchCourses()
  }
}

// 选择子类
async function selectCategory(category) {
  currentCategory.value = category

  // 如果选择了特定子类，则作为关键词使用searchCourses API
  if (category !== '全部') {
    // 如果同时选择了方向，则将方向作为category参数传入
    const categoryParam = currentDirection.value !== '全部' ? currentDirection.value : null
    await searchCoursesByKeyword(category, categoryParam)
  } else if (currentDirection.value !== '全部') {
    // 如果选择了"全部"子类，但有特定方向，则获取该方向的课程
    await fetchCoursesByCategory(currentDirection.value)
  } else {
    // 如果方向和子类都是"全部"，则获取所有课程
    await fetchCourses()
  }
}


// 根据类别获取课程 - 使用getCoursesByCategory API
async function fetchCoursesByCategory(category) {
  loading.value = true
  try {
    const loadingInstance = ElLoading.service({
      target: '.teacher-course',
      text: '加载课程中...',
      background: 'rgba(255, 255, 255, 0.7)'
    })

    // 使用API获取指定类别的课程
    const response = await courseAPI.getCoursesByCategory(category)

    // 处理API返回的课程数据
    processCoursesData(response)

    loadingInstance.close()
  } catch (error) {
    console.error('获取课程列表失败:', error)
    ElMessage.error('获取课程列表失败，请稍后重试')
  } finally {
    loading.value = false
  }
}

// 根据关键词搜索课程，可选择指定分类 - 使用searchCourses API
async function searchCoursesByKeyword(keyword, category = null) {
  loading.value = true
  try {
    const loadingInstance = ElLoading.service({
      target: '.teacher-course',
      text: '搜索课程中...',
      background: 'rgba(255, 255, 255, 0.7)'
    })

    // 使用API搜索课程，同时传入关键词和类别
    const response = await courseAPI.searchCourses(keyword, category)

    // 处理API返回的课程数据
    processCoursesData(response)

    loadingInstance.close()
  } catch (error) {
    console.error('搜索课程失败:', error)
    ElMessage.error('搜索课程失败，请稍后重试')
  } finally {
    loading.value = false
  }
}

// 处理搜索
async function handleSearch() {
  if (searchKeyword.value.trim() === '') {
    // 如果搜索关键词为空，恢复到当前分类的所有课程
    if (currentCategory.value !== '全部') {
      // 如果选中了子类，则将子类作为关键词，方向作为分类
      const categoryParam = currentDirection.value !== '全部' ? currentDirection.value : null
      await searchCoursesByKeyword(currentCategory.value, categoryParam)
    } else if (currentDirection.value !== '全部') {
      // 如果只选中了方向，则获取该方向的课程
      await fetchCoursesByCategory(currentDirection.value)
    } else {
      // 如果没有选中任何分类，则获取所有课程
      await fetchCourses()
    }
    return
  }

  // 使用API进行搜索，如果有方向选择，则将方向作为category参数传入
  const categoryParam = currentDirection.value !== '全部' ? currentDirection.value : null
  await searchCoursesByKeyword(searchKeyword.value, categoryParam)
}

// 处理API返回的课程数据
function processCoursesData(response) {
  courseList.value = Array.isArray(response) ? response.map(course => {
    // 根据category获取颜色，如果category为null或不存在，则使用ID生成随机颜色
    let courseColor
    if (course.category) {
      const categoryObj = categoryOptions.find(cat => cat.value === course.category)
      courseColor = categoryObj ? categoryObj.color : getRandomColor(course.id || 0)
    } else {
      courseColor = getRandomColor(course.id || 0)
    }

    // 确保每个字段都有合适的默认值
    return {
      id: course.id || Date.now(),
      name: course.name || '未命名课程',
      description: course.description || '暂无描述',
      category: course.category || '其他',
      credit: typeof course.credit === 'number' ? course.credit : 0,
      studentCount: 0, // API中没有返回studentCount字段，默认为0
      updateTime: formatDate(course.updateTime || course.createTime || new Date()),
      color: courseColor
    }
  }) : []

  // 应用排序
  sortCourses()
}

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

// 获取课程列表
async function fetchCourses() {
  console.log('获取课程列表数据')
  loading.value = true
  try {
    const loadingInstance = ElLoading.service({
      target: '.teacher-course',
      text: '加载课程中...',
      background: 'rgba(255, 255, 255, 0.7)'
    })

    const response = await courseAPI.getAllCourses()
    console.log('API返回的课程数据:', response)

    // 处理API返回的课程数据
    processCoursesData(response)

    loadingInstance.close()
  } catch (error) {
    console.error('获取课程列表失败:', error)
    ElMessage.error('获取课程列表失败，请稍后重试')
  } finally {
    loading.value = false
  }
}

// 生成随机颜色，但对同一ID总是返回相同颜色
function getRandomColor(id) {
  const colors = [
    '#409EFF', '#67C23A', '#E6A23C', '#F56C6C',
    '#909399', '#9B59B6', '#3498DB', '#1ABC9C'
  ]

  // 使用ID作为索引，确保同一ID总是得到相同颜色
  return colors[id % colors.length]
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

// 页面加载时获取课程列表
onMounted(() => {
  fetchCourses()
})

// 设置排序选项
function setSortOption(option) {
  sortOption.value = option
  sortCourses()
}

// 最终显示的课程列表
const displayCourseList = computed(() => {
  // 先应用搜索过滤
  let result = courseList.value

  if (searchKeyword.value) {
    result = result.filter(course =>
      course.name.toLowerCase().includes(searchKeyword.value.toLowerCase())
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
  color: '#409EFF'
})

// 课程分类选项与关键词映射
const categoryOptions = [
  { label: '计算机科学', value: '计算机科学', color: '#409EFF', keywords: ['计算机', '编程', '软件', '网络', '数据库', '算法', 'Java', 'Python', 'C++', '人工智能', 'AI', '机器学习'] },
  { label: '数学', value: '数学', color: '#67C23A', keywords: ['数学', '微积分', '代数', '几何', '统计', '概率', '线性代数', '离散数学'] },
  { label: '物理', value: '物理', color: '#E6A23C', keywords: ['物理', '力学', '电磁', '热学', '光学', '量子', '相对论', '核物理'] },
  { label: '化学', value: '化学', color: '#F56C6C', keywords: ['化学', '有机', '无机', '分析', '物理化学', '生物化学', '化工'] },
  { label: '生物', value: '生物', color: '#909399', keywords: ['生物', '遗传', '生态', '细胞', '分子', '微生物', '动物', '植物'] },
  { label: '文学', value: '文学', color: '#9B59B6', keywords: ['文学', '古代', '现代', '诗歌', '小说', '散文', '文言文', '写作'] },
  { label: '历史', value: '历史', color: '#3498DB', keywords: ['历史', '中国史', '世界史', '古代', '近代', '现代', '考古'] },
  { label: '艺术', value: '艺术', color: '#1ABC9C', keywords: ['艺术', '音乐', '美术', '设计', '绘画', '雕塑', '建筑', '摄影'] },
  { label: '其他', value: '其他', color: '#DCDFE6', keywords: [] }
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
  credit: [
    { required: true, message: '请选择学分', trigger: 'change' }
  ]
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

    for (const keyword of category.keywords) {
      if (lowerName.includes(keyword.toLowerCase())) {
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

function showCreateCourseDialog() {
  createCourseDialogVisible.value = true
  // 重置表单
  newCourse.value = {
    name: '',
    description: '',
    category: '其他',
    credit: 3,
    color: '#DCDFE6' // 浅灰色
  }
}

async function createCourse() {
  // 在提交前确保分类已自动匹配
  if (!newCourse.value.category) {
    autoMatchCategory(newCourse.value.name)
  }

  courseFormRef.value.validate(async (valid) => {
    if (valid) {
      try {
        const courseData = {
          name: newCourse.value.name,
          code: `COURSE-${Date.now()}`, // 生成临时课程编码
          description: newCourse.value.description || '',
          category: newCourse.value.category,
          credit: newCourse.value.credit,
          status: 1 // 使用整数类型的状态
        }

        // 调用API创建课程
        const response = await courseAPI.saveOrUpdateCourse(courseData)

        // 创建成功后，添加到课程列表
        const newCourseItem = {
          id: response.id,
          name: response.name,
          description: response.description || '暂无描述',
          category: response.category || newCourse.value.category,
          credit: response.credit || newCourse.value.credit,
          studentCount: 0, // API中没有返回studentCount字段，默认为0
          updateTime: formatDate(response.updateTime || response.createTime),
          color: newCourse.value.color
        }

        courseList.value.push(newCourseItem)

        // 关闭对话框并重置表单
        createCourseDialogVisible.value = false
        newCourse.value = {
          name: '',
          description: '',
          category: '其他',
          credit: 3,
          color: '#DCDFE6' // 浅灰色
        }

        ElMessage.success('课程创建成功')
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
  // 跳转到课程详情页
  router.push(`/teacher/course/${course.id}`)
}
</script>

<style scoped>
.teacher-course {
  padding: 0px;
  height: 100%;
}

.course-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 30px;
}

.section-title {
  font-size: 22px;
  font-weight: 500;
  margin: 0;
  color: #303133;
  position: relative;
  padding-left: 12px;
  border-left: 4px solid #409EFF;
}

.course-actions {
  display: flex;
  gap: 12px;
  align-items: center;
}

.create-course-btn {
  background-color: #409EFF;
  border-color: #409EFF;
  color: white;
  border-radius: 4px;
}

.create-file-btn {
  border-radius: 4px;
}

.search-container {
  width: 200px;
}

.sort-options-left {
  display: flex;
  gap: 12px;
  align-items: center;
}

.sort-actions-right {
  display: flex;
  gap: 12px;
  align-items: center;
}

/* 空课程提示 */
.empty-course {
  display: flex;
  justify-content: center;
  align-items: center;
  height: 400px;
}

.empty-placeholder {
  text-align: center;
  color: #909399;
}

.empty-icon {
  font-size: 60px;
  margin-bottom: 16px;
  color: #DCDFE6;
}

/* 课程列表 */
.course-list {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(240px, 1fr));
  gap: 24px;
  margin-top: 24px;
}

.course-item {
  background: #fff;
  border-radius: 8px;
  overflow: hidden;
  transition: all 0.3s;
  box-shadow: 0 2px 12px 0 rgba(0, 0, 0, 0.05);
  cursor: pointer;
}

.course-item:hover {
  transform: translateY(-5px);
  box-shadow: 0 8px 16px rgba(0, 0, 0, 0.1);
}

.course-cover {
  height: 140px;
  display: flex;
  align-items: center;
  justify-content: center;
  color: white;
  font-size: 40px;
  position: relative;
}

.course-category {
  position: absolute;
  bottom: 0;
  left: 0;
  right: 0;
  background: rgba(0, 0, 0, 0.3);
  color: white;
  padding: 4px 8px;
  font-size: 12px;
  text-align: center;
}

.course-info {
  padding: 16px;
}

.course-title {
  margin: 0 0 8px 0;
  font-size: 16px;
  font-weight: 500;
  color: #303133;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.course-desc {
  margin: 0;
  font-size: 13px;
  color: #909399;
}

.course-credit {
  font-weight: 500;
}

/* 创建课程对话框 */
.category-selection {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.auto-category {
  display: flex;
  align-items: center;
  gap: 10px;
  height: 32px;
  padding: 0 8px;
  background-color: #f5f7fa;
  border-radius: 4px;
}

.auto-match-text {
  color: #606266;
  font-size: 14px;
}

.category-color {
  width: 16px;
  height: 16px;
  border-radius: 50%;
}

.manual-select {
  width: 100%;
}

.category-option {
  display: flex;
  align-items: center;
  gap: 8px;
}

.category-color-dot {
  width: 12px;
  height: 12px;
  border-radius: 50%;
}

.dialog-footer {
  padding-top: 20px;
  text-align: right;
}

/* 分类筛选样式 */
.category-filter-container {
  margin-bottom: 16px;
  background: #fff;
  border-radius: 8px;
  padding: 16px 20px;
  box-shadow: 0 2px 12px 0 rgba(0, 0, 0, 0.05);
}

.filter-section {
  display: flex;
  margin-bottom: 16px;
}

.filter-section:last-child {
  margin-bottom: 0;
}

.filter-label {
  width: 50px;
  color: #606266;
  font-size: 14px;
  line-height: 32px;
}

.filter-tabs {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  flex: 1;
}

.filter-tab {
  padding: 6px 12px;
  font-size: 14px;
  color: #606266;
  cursor: pointer;
  border-radius: 4px;
  transition: all 0.3s;
}

.filter-tab:hover {
  color: #409EFF;
  background-color: rgba(64, 158, 255, 0.08);
}

.filter-tab-active {
  color: #409EFF;
  background-color: rgba(64, 158, 255, 0.1);
  font-weight: 500;
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
</style>
