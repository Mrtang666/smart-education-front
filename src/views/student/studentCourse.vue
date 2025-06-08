<template>
    <div class="student-course">
        <div class="course-header">
            <div class="header-content">
                <h2 class="section-title">我的课程</h2>
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

        <!-- 课程列表显示 -->
        <div v-if="loading" class="course-loading">
            <el-skeleton :rows="3" animated />
        </div>
        <div v-else-if="displayCourseList.length === 0" class="empty-course">
            <div class="empty-course-content">
                <el-icon class="empty-icon"><Reading /></el-icon>
                <p class="empty-text">您还没有加入任何课程</p>
                <p class="empty-tip">请联系老师获取邀请码加入课程</p>
            </div>
        </div>
        <div v-else class="course-list">
            <!-- 课程卡片 -->
            <div v-for="course in displayCourseList" :key="course.id" class="course-item" @click="enterCourse(course)">
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
    </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { ElMessage } from 'element-plus'
import { Reading, Search } from '@element-plus/icons-vue'
import { courseSelectionAPI } from '@/api/api'
import { getUserInfo } from '@/utils/auth'

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
        
        // 从localstorage中获取学生ID
        const userInfo = getUserInfo()
        if (!userInfo) {
            throw new Error('未找到用户信息，请重新登录')
        }
        
        if (!userInfo.studentId) {
            throw new Error('用户信息不完整或不是学生账号')
        }
        
        // 获取学生所有选课
        const courses = await courseSelectionAPI.getStudentCourses(userInfo.studentId)
        
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
        console.error('获取学生课程失败:', error)
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
        // 获取学生的所有课程
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

// 进入课程
function enterCourse(course) {
    console.log('进入课程:', course)
    ElMessage.success(`进入课程: ${course.name}`)
    // 跳转到课程详情页，使用课程ID作为路径参数
    router.push(`/student/course/${course.id}`)
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
.student-course {
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
    margin-bottom: 10px;
}

.empty-tip {
    font-size: 14px;
    color: #909399;
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

.course-loading {
    padding: 20px;
    background: #fff;
    border-radius: 8px;
    box-shadow: 0 2px 12px 0 rgba(0, 0, 0, 0.05);
}
</style>