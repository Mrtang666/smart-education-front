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

        <!-- 数据统计图表区域 -->
        <div class="charts-container">
            <div class="chart-wrapper">
                <div class="chart-title">知识点难度分布</div>
                <div id="difficultyChart" class="chart"></div>
            </div>
            <div class="chart-wrapper">
                <div class="chart-title">课程知识点数量</div>
                <div id="courseKnowledgeChart" class="chart"></div>
            </div>
        </div>

        <!-- 知识点列表 -->
        <div v-if="loading" class="loading-container">
            <el-skeleton :rows="5" animated />
        </div>
        <div v-else-if="knowledgeList.length === 0" class="empty-container">
            <el-empty description="暂无知识点" />
        </div>
        <div v-else class="knowledge-table-container">
            <el-table 
                :data="knowledgeList" 
                style="width: 100%" 
                border 
                stripe
                :header-cell-style="{background:'#f5f7fa'}"
            >
                <el-table-column prop="name" label="知识点名称" min-width="180">
                    <template #default="scope">
                        <div class="knowledge-name">
                            <span>{{ scope.row.name }}</span>
                            <el-tag size="small" :type="getDifficultyType(scope.row.difficultyLevel)">{{ scope.row.difficultyLevel }}</el-tag>
                            <el-tag v-if="scope.row.courseId === null" size="small" type="info">未分配课程</el-tag>
                        </div>
                    </template>
                </el-table-column>
                <el-table-column prop="description" label="描述" min-width="200">
                    <template #default="scope">
                        {{ scope.row.description || '暂无描述' }}
                    </template>
                </el-table-column>
                <el-table-column prop="teachPlan" label="教学计划" min-width="220">
                    <template #default="scope">
                        {{ scope.row.teachPlan || '暂无教学计划' }}
                    </template>
                </el-table-column>
                <el-table-column label="操作" width="120" fixed="right">
                    <template #default="scope">
                        <el-button type="primary" link @click="editKnowledge(scope.row)">
                            <el-icon><Edit /></el-icon>
                        </el-button>
                        <el-button type="danger" link @click="confirmDeleteKnowledge(scope.row)">
                            <el-icon><Delete /></el-icon>
                        </el-button>
                    </template>
                </el-table-column>
            </el-table>

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
                        <el-option label="无所属课程" value="" />
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
import { ref, onMounted, nextTick, computed } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { knowledgeAPI } from '@/api/api'
import { courseAPI } from '@/api/api'
import { Plus, Edit, Delete, Search } from '@element-plus/icons-vue'
import * as echarts from 'echarts'

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

// 图表实例
let difficultyChart = null
let courseKnowledgeChart = null

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
            return userInfo.teacherId || null
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
        
        // 如果有搜索关键词，则过滤结果
        if (searchKeyword.value) {
            filterKnowledgeList()
        }
        
        total.value = knowledgeList.value.length

        // 更新图表数据
        nextTick(() => {
            updateCharts()
        })
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

    // 更新图表
    nextTick(() => {
        updateCharts()
    })
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
        courseId: '',
        teachPlan: ''
    }
    dialogVisible.value = true
}

// 编辑知识点
const editKnowledge = (knowledge) => {
    isEdit.value = true
    knowledgeForm.value = {
        knowledgeId: String(knowledge.knowledgeId),
        name: knowledge.name,
        description: knowledge.description || '',
        difficultyLevel: knowledge.difficultyLevel,
        teacherId: knowledge.teacherId ? String(knowledge.teacherId) : null,
        courseId: knowledge.courseId ? String(knowledge.courseId) : '',
        teachPlan: knowledge.teachPlan || ''
    }
    dialogVisible.value = true
}

// 提交知识点表单
const submitKnowledge = () => {
    knowledgeFormRef.value.validate(async (valid) => {
        if (valid) {
            try {
                // 确保设置了teacherId
                if (!knowledgeForm.value.teacherId) {
                    knowledgeForm.value.teacherId = String(getTeacherId());
                }
                
                // 准备提交的数据，不包含courseId
                const knowledgeData = {
                    name: knowledgeForm.value.name,
                    description: knowledgeForm.value.description || '',
                    difficultyLevel: knowledgeForm.value.difficultyLevel,
                    teacherId: knowledgeForm.value.teacherId,
                    teachPlan: knowledgeForm.value.teachPlan || ''
                };
                
                // 如果是编辑模式，添加知识点ID
                if (isEdit.value && knowledgeForm.value.knowledgeId) {
                    knowledgeData.knowledgeId = knowledgeForm.value.knowledgeId;
                }
                
                console.log('提交知识点数据:', knowledgeData);
                
                if (isEdit.value) {
                    // 更新知识点
                    await knowledgeAPI.updateKnowledge(knowledgeData)
                    ElMessage.success('知识点更新成功')
                } else {
                    // 创建知识点
                    const result = await knowledgeAPI.saveKnowledge(knowledgeData)
                    console.log('创建知识点结果:', result)
                    ElMessage.success('知识点创建成功')
                    
                    // 如果有选择课程，则将新创建的知识点添加到该课程
                    if (knowledgeForm.value.courseId) {
                        try {
                            await knowledgeAPI.appendKnowledgeToCourse(result.knowledgeId, knowledgeForm.value.courseId)
                            ElMessage.success('知识点已关联到所选课程')
                        } catch (error) {
                            console.error('关联知识点到课程失败:', error)
                            ElMessage.warning('知识点创建成功，但未能关联到所选课程')
                        }
                    }
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
    // 由于知识点对象不再包含courseId字段，我们需要从当前选择的课程获取courseId
    if (!selectedCourse.value) {
        ElMessageBox.alert(
            '请先选择一个课程，才能删除其中的知识点。',
            '操作提示',
            {
                confirmButtonText: '确定',
                type: 'warning'
            }
        );
    } else {
        showDeleteConfirmation(knowledge);
    }
}

// 显示删除确认对话框
const showDeleteConfirmation = (knowledge) => {
    ElMessageBox.confirm(
        `确定要从当前课程中删除知识点"${knowledge.name}"吗？`,
        '删除确认',
        {
            confirmButtonText: '确定',
            cancelButtonText: '取消',
            type: 'warning'
        }
    ).then(async () => {
        try {
            console.log('删除知识点参数:', {
                courseId: selectedCourse.value,
                knowledgeId: String(knowledge.knowledgeId),
                knowledge: knowledge
            });
            
            // 使用当前选择的课程ID
            await knowledgeAPI.deleteKnowledgeFromCourseById(selectedCourse.value, String(knowledge.knowledgeId))
            ElMessage.success('知识点删除成功')
            fetchKnowledgeList()
        } catch (error) {
            console.error('删除知识点失败:', error)
            ElMessage.error('删除知识点失败: ' + (error.message || '未知错误'))
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

// 计算难度分布数据
const difficultyDistribution = computed(() => {
    const distribution = {
        '简单': 0,
        '中等': 0,
        '困难': 0
    }
    
    knowledgeList.value.forEach(item => {
        if (item.difficultyLevel in distribution) {
            distribution[item.difficultyLevel]++
        }
    })
    
    return distribution
})

// 计算课程知识点分布
const courseKnowledgeDistribution = computed(() => {
    const distribution = {}
    
    // 为每个课程创建一个条目
    courseList.value.forEach(course => {
        distribution[course.name] = 0
    })
    
    // 统计每个课程的知识点数量
    knowledgeList.value.forEach(item => {
        if (item.courseId) {
            const course = courseList.value.find(c => c.id === item.courseId)
            if (course && course.name) {
                distribution[course.name] = (distribution[course.name] || 0) + 1
            }
        }
    })
    
    return distribution
})

// 初始化图表
const initCharts = () => {
    // 初始化难度分布图表
    difficultyChart = echarts.init(document.getElementById('difficultyChart'))
    
    // 初始化课程知识点分布图表
    courseKnowledgeChart = echarts.init(document.getElementById('courseKnowledgeChart'))
    
    // 更新图表数据
    updateCharts()
    
    // 监听窗口大小变化，调整图表大小
    window.addEventListener('resize', () => {
        difficultyChart && difficultyChart.resize()
        courseKnowledgeChart && courseKnowledgeChart.resize()
    })
}

// 更新图表数据
const updateCharts = () => {
    // 更新难度分布图表
    const difficultyData = difficultyDistribution.value
    difficultyChart && difficultyChart.setOption({
        title: {
            text: '知识点难度分布',
            left: 'center',
            show: false
        },
        tooltip: {
            trigger: 'item',
            formatter: '{a} <br/>{b}: {c} ({d}%)'
        },
        legend: {
            orient: 'horizontal',
            bottom: 'bottom',
            data: Object.keys(difficultyData)
        },
        color: ['#67C23A', '#E6A23C', '#F56C6C'],
        series: [
            {
                name: '难度分布',
                type: 'pie',
                radius: ['40%', '70%'],
                avoidLabelOverlap: false,
                itemStyle: {
                    borderRadius: 10,
                    borderColor: '#fff',
                    borderWidth: 2
                },
                label: {
                    show: false,
                    position: 'center'
                },
                emphasis: {
                    label: {
                        show: true,
                        fontSize: '18',
                        fontWeight: 'bold'
                    }
                },
                labelLine: {
                    show: false
                },
                data: [
                    { value: difficultyData['简单'], name: '简单' },
                    { value: difficultyData['中等'], name: '中等' },
                    { value: difficultyData['困难'], name: '困难' }
                ]
            }
        ]
    })
    
    // 更新课程知识点分布图表
    const courseData = courseKnowledgeDistribution.value
    const courseNames = Object.keys(courseData)
    const courseValues = courseNames.map(name => courseData[name])
    
    courseKnowledgeChart && courseKnowledgeChart.setOption({
        title: {
            text: '课程知识点数量',
            left: 'center',
            show: false
        },
        tooltip: {
            trigger: 'axis',
            axisPointer: {
                type: 'shadow'
            }
        },
        grid: {
            left: '3%',
            right: '4%',
            bottom: '10%',
            top: '3%',
            containLabel: true
        },
        xAxis: {
            type: 'category',
            data: courseNames,
            axisLabel: {
                interval: 0,
                rotate: 30,
                textStyle: {
                    fontSize: 12
                }
            }
        },
        yAxis: {
            type: 'value'
        },
        series: [
            {
                name: '知识点数量',
                type: 'bar',
                barWidth: '60%',
                data: courseValues,
                itemStyle: {
                    color: new echarts.graphic.LinearGradient(0, 0, 0, 1, [
                        { offset: 0, color: '#83bff6' },
                        { offset: 0.5, color: '#188df0' },
                        { offset: 1, color: '#188df0' }
                    ])
                },
                emphasis: {
                    itemStyle: {
                        color: new echarts.graphic.LinearGradient(0, 0, 0, 1, [
                            { offset: 0, color: '#2378f7' },
                            { offset: 0.7, color: '#2378f7' },
                            { offset: 1, color: '#83bff6' }
                        ])
                    }
                }
            }
        ]
    })
}

// 页面加载时获取数据
onMounted(() => {
    fetchCourses()
    fetchKnowledgeList()
    nextTick(() => {
        initCharts()
    })
})
</script>

<style scoped>
.knowledge-container {
    padding: 0;
    height: 100%;
    overflow-y: auto;
    position: relative;
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
    box-shadow: 0 1px 4px rgba(0, 0, 0, 0.05);
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

/* 图表容器样式 */
.charts-container {
    display: grid;
    grid-template-columns: repeat(2, 1fr);
    gap: 24px;
    margin-bottom: 24px;
}

.chart-wrapper {
    background-color: #fff;
    border-radius: 8px;
    padding: 16px;
    box-shadow: 0 1px 4px rgba(0, 0, 0, 0.05);
}

.chart-title {
    font-size: 16px;
    font-weight: 500;
    color: #303133;
    margin-bottom: 12px;
    text-align: center;
}

.chart {
    height: 300px;
    width: 100%;
}

/* 表格容器样式 */
.knowledge-table-container {
    background: #fff;
    border-radius: 8px;
    padding: 16px;
    box-shadow: 0 1px 4px rgba(0, 0, 0, 0.05);
    margin-bottom: 24px;
}

.knowledge-name {
    display: flex;
    align-items: center;
    gap: 8px;
}

.pagination-container {
    margin-top: 24px;
    display: flex;
    justify-content: center;
    margin-bottom: 24px;
}

.loading-container, .empty-container {
    padding: 40px 0;
    background: #fff;
    border-radius: 8px;
    box-shadow: 0 1px 4px rgba(0, 0, 0, 0.05);
}

/* 响应式布局 */
@media (max-width: 992px) {
    .charts-container {
        grid-template-columns: 1fr;
    }
    
    .action-bar {
        flex-direction: column;
        gap: 16px;
    }
    
    .search-area {
        width: 100%;
    }
}
</style>
