<template>
    <div class="knowledge-container">
        <h2 class="section-title">知识点管理</h2>

        <!-- 搜索和操作栏 -->
        <div class="action-bar">
            <div class="search-area">
                <el-select v-model="selectedCourse" placeholder="选择课程" @change="handleCourseChange" class="course-select">
                    <el-option label="全部课程" value="" />
                    <el-option v-for="course in courseList" :key="course.id" :label="course.name" :value="course.id" />
                </el-select>
                <el-input v-model="searchKeyword" placeholder="搜索知识点" class="search-input" @input="handleSearch">
                    <template #suffix>
                        <el-icon class="search-icon">
                            <Search />
                        </el-icon>
                    </template>
                </el-input>
            </div>
            <div class="action-buttons">
                <el-button type="primary" @click="showCreateDialog">
                    <el-icon><Plus /></el-icon>新建知识点
                </el-button>
            </div>
        </div>

        <!-- 知识点列表 -->
        <div v-if="loading" class="loading-container">
            <el-skeleton :rows="5" animated />
        </div>
        <div v-else-if="knowledgeList.length === 0" class="empty-container">
            <el-empty description="暂无知识点" />
        </div>
        <div v-else class="knowledge-list">
            <el-card v-for="item in knowledgeList" :key="item.knowledgeId" class="knowledge-card">
                <div class="knowledge-header">
                    <div class="knowledge-title">
                        <span>{{ item.name }}</span>
                        <el-tag size="small" :type="getDifficultyType(item.difficultyLevel)">{{ item.difficultyLevel }}</el-tag>
                    </div>
                    <div class="knowledge-actions">
                        <el-button type="primary" text @click="editKnowledge(item)">
                            <el-icon><Edit /></el-icon>
                        </el-button>
                        <el-button type="danger" text @click="confirmDeleteKnowledge(item)">
                            <el-icon><Delete /></el-icon>
                        </el-button>
                    </div>
                </div>
                <div class="knowledge-content">
                    <div class="knowledge-description">
                        <div class="label">描述：</div>
                        <div class="content">{{ item.description || '暂无描述' }}</div>
                    </div>
                    <div class="knowledge-plan">
                        <div class="label">教学计划：</div>
                        <div class="content">{{ item.teachPlan || '暂无教学计划' }}</div>
                    </div>
                </div>
            </el-card>
        </div>

        <!-- 分页 -->
        <div class="pagination-container" v-if="knowledgeList.length > 0">
            <el-pagination 
                background 
                layout="prev, pager, next" 
                :total="total" 
                :page-size="pageSize"
                :current-page="currentPage"
                @current-change="handlePageChange" 
            />
        </div>

        <!-- 创建/编辑知识点对话框 -->
        <el-dialog 
            v-model="dialogVisible" 
            :title="isEdit ? '编辑知识点' : '创建知识点'" 
            width="500px"
            :close-on-click-modal="false"
        >
            <el-form :model="knowledgeForm" :rules="rules" ref="knowledgeFormRef" label-width="100px">
                <el-form-item label="知识点名称" prop="name">
                    <el-input v-model="knowledgeForm.name" placeholder="请输入知识点名称" />
                </el-form-item>
                <el-form-item label="所属课程" prop="courseId">
                    <el-select v-model="knowledgeForm.courseId" placeholder="请选择课程">
                        <el-option v-for="course in courseList" :key="course.id" :label="course.name" :value="course.id" />
                    </el-select>
                </el-form-item>
                <el-form-item label="难度等级" prop="difficultyLevel">
                    <el-select v-model="knowledgeForm.difficultyLevel" placeholder="请选择难度等级">
                        <el-option label="简单" value="简单" />
                        <el-option label="中等" value="中等" />
                        <el-option label="困难" value="困难" />
                    </el-select>
                </el-form-item>
                <el-form-item label="描述" prop="description">
                    <el-input v-model="knowledgeForm.description" type="textarea" :rows="3" placeholder="请输入知识点描述" />
                </el-form-item>
                <el-form-item label="教学计划" prop="teachPlan">
                    <el-input v-model="knowledgeForm.teachPlan" type="textarea" :rows="4" placeholder="请输入教学计划" />
                </el-form-item>
            </el-form>
            <template #footer>
                <div class="dialog-footer">
                    <el-button @click="dialogVisible = false">取消</el-button>
                    <el-button type="primary" @click="submitKnowledge">确认</el-button>
                </div>
            </template>
        </el-dialog>
    </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { knowledgeAPI } from '@/api/api'
import { courseAPI } from '@/api/api'
import { Plus, Edit, Delete, Search } from '@element-plus/icons-vue'

// 课程列表
const courseList = ref([])
const selectedCourse = ref('')
const searchKeyword = ref('')

// 知识点列表
const knowledgeList = ref([])
const loading = ref(false)
const total = ref(0)
const pageSize = ref(10)
const currentPage = ref(1)

// 对话框相关
const dialogVisible = ref(false)
const isEdit = ref(false)
const knowledgeForm = ref({
    knowledgeId: null,
    name: '',
    description: '',
    difficultyLevel: '中等',
    teacherId: null,
    courseId: '',
    teachPlan: ''
})
const knowledgeFormRef = ref(null)
const rules = {
    name: [
        { required: true, message: '请输入知识点名称', trigger: 'blur' },
        { min: 2, max: 50, message: '长度在 2 到 50 个字符', trigger: 'blur' }
    ],
    courseId: [
        { required: true, message: '请选择课程', trigger: 'change' }
    ],
    difficultyLevel: [
        { required: true, message: '请选择难度等级', trigger: 'change' }
    ]
}

// 获取当前教师ID
const getTeacherId = () => {
    const userInfoStr = localStorage.getItem('user_info')
    if (userInfoStr) {
        try {
            const userInfo = JSON.parse(userInfoStr)
            return userInfo.id || null
        } catch (e) {
            console.error('解析用户信息失败', e)
            return null
        }
    }
    return null
}

// 获取课程列表
const fetchCourses = async () => {
    try {
        const response = await courseAPI.getAllCourses()
        courseList.value = Array.isArray(response) ? response : []
    } catch (error) {
        console.error('获取课程列表失败:', error)
        ElMessage.error('获取课程列表失败')
    }
}

// 获取知识点列表
const fetchKnowledgeList = async () => {
    loading.value = true
    try {
        const teacherId = getTeacherId()
        let response = []
        
        if (selectedCourse.value) {
            // 如果选择了特定课程，则获取该课程下的知识点
            if (teacherId) {
                // 如果有教师ID，则获取该教师在该课程下的知识点
                response = await knowledgeAPI.getKnowledgeByTeacherInCourse(selectedCourse.value, teacherId)
            } else {
                // 否则获取该课程下的所有知识点
                response = await knowledgeAPI.getKnowledgeByCourseId(selectedCourse.value)
            }
        } else {
            // 如果没有选择课程（选择了"全部课程"），则获取所有知识点
            if (teacherId) {
                // 如果有教师ID，则获取该教师的所有知识点
                response = await knowledgeAPI.getKnowledgeByTeacherId(teacherId)
            } else {
                // 如果没有教师ID，则尝试获取所有课程的知识点
                // 这种情况可能需要额外的API支持，这里我们通过获取所有课程然后获取每个课程的知识点来实现
                try {
                    const allKnowledgePoints = []
                    // 获取所有课程
                    const courses = await courseAPI.getAllCourses()
                    
                    // 如果有课程，则获取每个课程的知识点
                    if (Array.isArray(courses) && courses.length > 0) {
                        // 创建一个Promise数组，每个Promise获取一个课程的知识点
                        const promises = courses.map(course => 
                            knowledgeAPI.getKnowledgeByCourseId(course.id)
                                .catch(() => []) // 如果获取失败，返回空数组
                        )
                        
                        // 等待所有Promise完成
                        const results = await Promise.all(promises)
                        
                        // 合并所有结果
                        results.forEach(result => {
                            if (Array.isArray(result)) {
                                allKnowledgePoints.push(...result)
                            }
                        })
                        
                        response = allKnowledgePoints
                    }
                } catch (error) {
                    console.error('获取所有课程知识点失败:', error)
                    ElMessage.warning('无法获取所有课程的知识点')
                    response = []
                }
            }
        }
        
        knowledgeList.value = Array.isArray(response) ? response : []
        total.value = knowledgeList.value.length
        
        // 如果有搜索关键词，则过滤结果
        if (searchKeyword.value) {
            filterKnowledgeList()
        }
    } catch (error) {
        console.error('获取知识点列表失败:', error)
        ElMessage.error('获取知识点列表失败')
    } finally {
        loading.value = false
    }
}

// 处理课程变更
const handleCourseChange = () => {
    currentPage.value = 1
    fetchKnowledgeList()
}

// 处理搜索
const handleSearch = () => {
    filterKnowledgeList()
}

// 过滤知识点列表
const filterKnowledgeList = () => {
    if (!searchKeyword.value) {
        fetchKnowledgeList()
        return
    }
    
    const keyword = searchKeyword.value.toLowerCase()
    knowledgeList.value = knowledgeList.value.filter(item => 
        item.name.toLowerCase().includes(keyword) || 
        (item.description && item.description.toLowerCase().includes(keyword))
    )
}

// 处理分页
const handlePageChange = (page) => {
    currentPage.value = page
}

// 显示创建对话框
const showCreateDialog = () => {
    isEdit.value = false
    knowledgeForm.value = {
        knowledgeId: null,
        name: '',
        description: '',
        difficultyLevel: '中等',
        teacherId: getTeacherId(),
        courseId: selectedCourse.value || '',
        teachPlan: ''
    }
    dialogVisible.value = true
}

// 编辑知识点
const editKnowledge = (knowledge) => {
    isEdit.value = true
    knowledgeForm.value = {
        knowledgeId: knowledge.knowledgeId,
        name: knowledge.name,
        description: knowledge.description || '',
        difficultyLevel: knowledge.difficultyLevel,
        teacherId: knowledge.teacherId,
        courseId: knowledge.courseId,
        teachPlan: knowledge.teachPlan || ''
    }
    dialogVisible.value = true
}

// 提交知识点表单
const submitKnowledge = () => {
    knowledgeFormRef.value.validate(async (valid) => {
        if (valid) {
            try {
                if (isEdit.value) {
                    // 更新知识点
                    await knowledgeAPI.updateKnowledge(knowledgeForm.value)
                    ElMessage.success('知识点更新成功')
                } else {
                    // 创建知识点
                    await knowledgeAPI.saveKnowledge(knowledgeForm.value)
                    ElMessage.success('知识点创建成功')
                }
                dialogVisible.value = false
                fetchKnowledgeList()
            } catch (error) {
                console.error('保存知识点失败:', error)
                ElMessage.error('保存知识点失败')
            }
        }
    })
}

// 确认删除知识点
const confirmDeleteKnowledge = (knowledge) => {
    ElMessageBox.confirm(
        `确定要删除知识点"${knowledge.name}"吗？`,
        '删除确认',
        {
            confirmButtonText: '确定',
            cancelButtonText: '取消',
            type: 'warning'
        }
    ).then(async () => {
        try {
            await knowledgeAPI.deleteKnowledgeById(knowledge.knowledgeId)
            ElMessage.success('知识点删除成功')
            fetchKnowledgeList()
        } catch (error) {
            console.error('删除知识点失败:', error)
            ElMessage.error('删除知识点失败')
        }
    }).catch(() => {
        // 取消删除，不执行任何操作
    })
}

// 根据难度获取标签类型
const getDifficultyType = (difficulty) => {
    switch (difficulty) {
        case '简单': return 'success'
        case '中等': return 'warning'
        case '困难': return 'danger'
        default: return 'info'
    }
}

// 页面加载时获取数据
onMounted(() => {
    fetchCourses()
    fetchKnowledgeList()
})
</script>

<style scoped>
.knowledge-container {
    padding: 0;
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

.action-bar {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 24px;
    background: #fff;
    padding: 16px 20px;
    border-radius: 8px;
    box-shadow: 0 2px 12px 0 rgba(0, 0, 0, 0.05);
}

.search-area {
    display: flex;
    gap: 12px;
    flex: 1;
}

.course-select {
    width: 200px;
}

.search-input {
    width: 250px;
}

.search-icon {
    color: #606266;
    cursor: pointer;
}

.search-icon:hover {
    color: #409EFF;
}

.knowledge-list {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(400px, 1fr));
    gap: 20px;
    margin-top: 20px;
}

.knowledge-card {
    border-radius: 8px;
    transition: all 0.3s;
}

.knowledge-card:hover {
    box-shadow: 0 4px 16px rgba(0, 0, 0, 0.1);
    transform: translateY(-2px);
}

.knowledge-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 12px;
    padding-bottom: 12px;
    border-bottom: 1px solid #ebeef5;
}

.knowledge-title {
    display: flex;
    align-items: center;
    gap: 8px;
    font-size: 16px;
    font-weight: 500;
}

.knowledge-content {
    font-size: 14px;
    color: #606266;
}

.knowledge-description, .knowledge-plan {
    margin-bottom: 8px;
    display: flex;
}

.label {
    font-weight: 500;
    width: 80px;
    flex-shrink: 0;
}

.content {
    flex: 1;
    overflow: hidden;
    text-overflow: ellipsis;
    display: -webkit-box;
    -webkit-line-clamp: 2;
    -webkit-box-orient: vertical;
}

.pagination-container {
    margin-top: 24px;
    display: flex;
    justify-content: center;
}

.loading-container, .empty-container {
    padding: 40px 0;
    background: #fff;
    border-radius: 8px;
    box-shadow: 0 2px 12px 0 rgba(0, 0, 0, 0.05);
}
</style>
