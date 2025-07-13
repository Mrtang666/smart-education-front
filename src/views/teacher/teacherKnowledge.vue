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
                <el-button type="danger" @click="batchDelete">
                    <el-icon><Delete /></el-icon>批量删除
                </el-button>
                <el-button type="primary" @click="showCreateDialog">
                    <el-icon><Plus /></el-icon>新建知识点
                </el-button>
            </div>
        </div>

        <!-- 数据统计图表区域 -->
        <div class="charts-container">
            <div class="chart-wrapper">
                <div class="chart-title">
                    {{ selectedCourse ? getSelectedCourseName() + ' - 知识点难度分布' : '知识点难度分布' }}
                </div>
                <div v-if="knowledgeList.length > 0" id="difficultyChart" class="chart"></div>
                <div v-else class="empty-chart">
                    <el-empty description="该课程还没有知识点哦" :image-size="100">
                        <template #image>
                            <el-icon style="font-size: 50px; color: #909399;"><DataLine /></el-icon>
                        </template>
                    </el-empty>
                </div>
            </div>
            <div class="chart-wrapper">
                <div class="chart-title">
                    {{ selectedCourse ? getSelectedCourseName() + ' - 知识点数量' : '课程知识点数量' }}
                </div>
                <div v-if="knowledgeList.length > 0" id="courseKnowledgeChart" class="chart"></div>
                <div v-else class="empty-chart">
                    <el-empty description="该课程还没有知识点哦" :image-size="100">
                        <template #image>
                            <el-icon style="font-size: 50px; color: #909399;"><PieChart /></el-icon>
                        </template>
                    </el-empty>
                </div>
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
            <!-- 只在有选中项时才显示操作区域 -->
            <div class="table-top-actions" v-if="selectedKnowledgeIds.length > 0">
                <div class="selection-info">
                    已选择 <span class="selected-count">{{ selectedKnowledgeIds.length }}</span> 项
                </div>
                <div class="batch-actions">
                    <el-button size="small" type="default" @click="toggleSelectAll">
                        {{ isAllSelected ? '取消全选' : '全选' }}
                    </el-button>
                    <el-button size="small" type="danger" @click="batchDelete">
                        <el-icon><Delete /></el-icon>批量删除
                    </el-button>
                </div>
            </div>
            <el-table 
                :data="knowledgeList" 
                style="width: 100%" 
                border 
                stripe
                :header-cell-style="{background:'#f5f7fa'}"
                @selection-change="handleSelectionChange"
                ref="knowledgeTableRef"
            >
                <el-table-column type="selection" width="55" />
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
                        <div class="truncated-description">{{ scope.row.description || '暂无描述' }}</div>
                    </template>
                </el-table-column>
                <el-table-column prop="teachPlan" label="教学计划" min-width="220">
                    <template #default="scope">
                        <div class="truncated-description">{{ scope.row.teachPlan || '暂无教学计划' }}</div>
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

        <!-- 课程选择对话框 -->
        <el-dialog 
            v-model="courseSelectDialogVisible" 
            title="选择课程" 
            width="500px"
            :close-on-click-modal="false"
        >
            <el-select 
                v-model="selectedCourseIds" 
                multiple 
                placeholder="请选择课程" 
                @change="handleCourseSelectionChange"
            >
                <el-option 
                    v-for="course in knowledgeCoursesData" 
                    :key="course.id" 
                    :label="course.name" 
                    :value="course.id"
                />
            </el-select>
            <template #footer>
                <div class="dialog-footer">
                    <el-button @click="courseSelectDialogVisible = false">取消</el-button>
                    <el-button type="primary" @click="deleteKnowledgeFromSelectedCourses">确认</el-button>
                </div>
            </template>
        </el-dialog>
    </div>
</template>

<script setup>
import { ref, onMounted, nextTick, computed, onBeforeUnmount } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { knowledgeAPI } from '@/api/api'
import { courseAPI } from '@/api/api'
import { Plus, Edit, Delete, Search, DataLine, PieChart } from '@element-plus/icons-vue'
// 不使用本地import引入echarts，改为在onMounted中从window对象获取

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

// 批量删除相关
const selectedKnowledgeIds = ref([])
const knowledgeTableRef = ref(null)
const isAllSelected = computed(() => {
    return selectedKnowledgeIds.value.length > 0 && selectedKnowledgeIds.value.length === knowledgeList.value.length
})

// 表格选择变更处理
const handleSelectionChange = (selection) => {
    selectedKnowledgeIds.value = selection.map(item => String(item.knowledgeId))
    console.log('已选择的知识点:', selectedKnowledgeIds.value)
}

// 批量删除
const batchDelete = () => {
    // 如果没有选择知识点，则显示提示
    if (selectedKnowledgeIds.value.length === 0) {
        ElMessage.warning('请先在表格中选择要删除的知识点')
        return
    }

    // 显示选择删除方式对话框
    ElMessageBox.confirm(
        `请选择删除方式，将影响选中的 ${selectedKnowledgeIds.value.length} 个知识点`,
        '批量删除确认',
        {
            confirmButtonText: '从课程中删除',
            distinguishCancelAndClose: true,
            closeOnClickModal: false,
            type: 'warning',
            showClose: true,
            // 添加自定义按钮
            customClass: 'batch-delete-dialog',
            // 不显示取消按钮
            showCancelButton: false,
        }
    ).then(() => {
        // 从课程中批量删除
        batchDeleteFromCourse();
    }).catch(() => {
        // 用户点击关闭按钮，不做任何处理
        console.log('用户关闭批量删除对话框');
    });
    
    // 添加永久删除按钮
    setTimeout(() => {
        const dialog = document.querySelector('.batch-delete-dialog');
        if (dialog) {
            const footer = dialog.querySelector('.el-message-box__btns');
            if (footer) {
                const dangerBtn = document.createElement('button');
                dangerBtn.className = 'el-button el-button--danger';
                dangerBtn.innerHTML = '<span>永久删除</span>';
                dangerBtn.onclick = () => {
                    // 关闭当前对话框
                    document.querySelector('.batch-delete-dialog .el-message-box__close').click();
                    // 调用永久批量删除
                    batchDeletePermanently();
                };
                footer.insertBefore(dangerBtn, footer.firstChild);
            }
        }
    }, 10);
}

// 从课程中批量删除知识点
const batchDeleteFromCourse = async () => {
    if (!selectedCourse.value) {
        ElMessageBox.alert(
            '请先选择一个课程，才能批量删除其中的知识点。',
            '操作提示',
            {
                confirmButtonText: '确定',
                type: 'warning'
            }
        );
        return;
    }
    
    try {
        console.log('从课程中批量删除知识点:', {
            courseId: selectedCourse.value,
            knowledgeIds: selectedKnowledgeIds.value
        });
        
        // 调用批量删除API
        await knowledgeAPI.batchDeleteKnowledgeFromCourse(selectedCourse.value, selectedKnowledgeIds.value);
        
        ElMessage.success(`已从课程中删除 ${selectedKnowledgeIds.value.length} 个知识点`);
        selectedKnowledgeIds.value = []; // 清空选择
        fetchKnowledgeList(); // 重新加载列表
    } catch (error) {
        console.error('从课程中批量删除知识点失败:', error);
        ElMessage.error('从课程中批量删除知识点失败: ' + (error.message || '未知错误'));
    }
}

// 全选/取消全选
const toggleSelectAll = () => {
    if (isAllSelected.value) {
        // 取消全选
        knowledgeTableRef.value.clearSelection()
    } else {
        // 全选
        knowledgeList.value.forEach(row => {
            knowledgeTableRef.value.toggleRowSelection(row, true)
        })
    }
}

// 永久批量删除知识点
const batchDeletePermanently = async () => {
    // 二次确认
    try {
        await ElMessageBox.confirm(
            `确定要永久删除选中的 ${selectedKnowledgeIds.value.length} 个知识点吗？此操作将不可恢复！`,
            '永久批量删除确认',
            {
                confirmButtonText: '确定删除',
                cancelButtonText: '取消',
                type: 'error'
            }
        );
        
        console.log('永久批量删除知识点:', {
            knowledgeIds: selectedKnowledgeIds.value
        });
        
        // 调用永久批量删除API
        await knowledgeAPI.batchDeleteKnowledge(selectedKnowledgeIds.value);
        
        ElMessage.success(`成功永久删除 ${selectedKnowledgeIds.value.length} 个知识点`);
        selectedKnowledgeIds.value = []; // 清空选择
        fetchKnowledgeList(); // 重新加载列表
    } catch (error) {
        // 检查是否是用户取消操作
        if (error !== 'cancel' && error.toString() !== 'cancel') {
            console.error('永久批量删除知识点失败:', error);
            ElMessage.error('永久批量删除知识点失败: ' + (error.message || '未知错误'));
        }
    }
}

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
        console.log('开始获取课程列表')
        const response = await courseAPI.getAllCourses()
        
        if (Array.isArray(response)) {
            courseList.value = response.map(course => ({
                ...course,
                id: String(course.id) // 确保id是字符串类型
            }))
            console.log('获取到的课程列表:', courseList.value)
        } else {
            console.warn('获取课程列表返回的不是数组:', response)
            courseList.value = []
        }
        
        // 如果没有课程，添加测试数据（仅用于调试）
        if (courseList.value.length === 0 && process.env.NODE_ENV === 'development') {
            ElMessage.warning('没有找到课程数据')
        }
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
            console.log('获取特定课程知识点:', selectedCourse.value)
            if (teacherId) {
                // 如果有教师ID，则获取该教师在该课程下的知识点
                response = await knowledgeAPI.getKnowledgeByTeacherInCourse(selectedCourse.value, teacherId)
            } else {
                // 否则获取该课程下的所有知识点
                response = await knowledgeAPI.getKnowledgeByCourseId(selectedCourse.value)
            }
            
            // 标记课程信息
            const courseName = courseList.value.find(c => c.id === selectedCourse.value)?.name || '未知课程'
            if (Array.isArray(response)) {
                response = response.map(item => ({
                    ...item,
                    courseName: courseName
                }))
            }
        } else {
            // 如果没有选择课程（选择了"全部课程"），则获取教师创建的所有知识点
            console.log('获取教师所有知识点')
            
            if (teacherId) {
                // 直接获取教师创建的所有知识点
                response = await knowledgeAPI.getKnowledgeByTeacherId(teacherId)
                console.log('获取到的教师知识点:', response)
                
                // 补充知识点的课程信息
                if (Array.isArray(response) && response.length > 0) {
                    // 获取所有课程
                    const allCourses = await courseAPI.getAllCourses()
                    console.log('获取到的所有课程:', allCourses)
                    
                    // 创建知识点ID到课程的映射
                    const knowledgeCourseMap = new Map()
                    
                    // 并行查询每个知识点所在的课程
                    const coursePromises = response.map(knowledge => 
                        knowledgeAPI.getCoursesByKnowledgeId(knowledge.knowledgeId)
                            .then(courses => {
                                if (Array.isArray(courses) && courses.length > 0) {
                                    // 如果知识点在多个课程中，选择第一个
                                    knowledgeCourseMap.set(knowledge.knowledgeId, courses[0])
                                }
                            })
                            .catch(error => {
                                console.error(`获取知识点(${knowledge.knowledgeId})所在课程失败:`, error)
                            })
                    )
                    
                    // 等待所有查询完成
                    await Promise.all(coursePromises)
                    
                    // 更新知识点数据，添加课程信息
                    response = response.map(knowledge => {
                        const course = knowledgeCourseMap.get(knowledge.knowledgeId)
                        return {
                            ...knowledge,
                            courseName: course ? course.name : undefined
                        }
                    })
                }
            } else {
                console.warn('未找到教师ID，无法获取知识点')
                response = []
            }
            
            // 如果教师知识点获取失败或为空，尝试获取所有课程的知识点
            if (!Array.isArray(response) || response.length === 0) {
                console.log('尝试获取所有课程知识点')
                try {
                    const allKnowledgePoints = []
                    // 获取所有课程
                    const courses = await courseAPI.getAllCourses()
                    console.log('获取到的所有课程:', courses)
                    
                    // 如果有课程，则获取每个课程的知识点
                    if (Array.isArray(courses) && courses.length > 0) {
                        // 创建一个Promise数组，每个Promise获取一个课程的知识点
                        const promises = courses.map(course => 
                            knowledgeAPI.getKnowledgeByCourseId(course.id)
                                .then(result => {
                                    console.log(`课程[${course.name}]的知识点:`, result)
                                    // 添加课程信息
                                    if (Array.isArray(result)) {
                                        return result.map(item => ({
                                            ...item,
                                            courseName: course.name // 添加课程名称
                                        }))
                                    }
                                    return []
                                })
                                .catch(error => {
                                    console.error(`获取课程[${course.name}]知识点失败:`, error)
                                    return []
                                })
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
        
        // 确保response是数组
        knowledgeList.value = Array.isArray(response) ? response : []
        
        // 打印数据，便于调试
        console.log('获取到的知识点列表:', knowledgeList.value)
        
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
    selectedKnowledgeIds.value = [] // 清空选择
    fetchKnowledgeList()
}

// 处理搜索
const handleSearch = () => {
    selectedKnowledgeIds.value = [] // 清空选择
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
    ElMessageBox.confirm(
        `请选择删除"${knowledge.name}"知识点的方式`,
        '删除确认',
        {
            confirmButtonText: '从课程中删除',
            distinguishCancelAndClose: true,
            closeOnClickModal: false,
            type: 'warning',
            showClose: true,
            // 添加自定义按钮
            customClass: 'delete-confirm-dialog',
            // 不显示取消按钮
            showCancelButton: false,
        }
    ).then(() => {
        // 从课程中删除 - 先查询所在课程
        showKnowledgeCourses(knowledge);
    }).catch(() => {
        // 用户点击关闭按钮，不做任何处理
        console.log('用户关闭删除对话框');
    });
    
    // 添加永久删除按钮
    setTimeout(() => {
        const dialog = document.querySelector('.delete-confirm-dialog');
        if (dialog) {
            const footer = dialog.querySelector('.el-message-box__btns');
            if (footer) {
                const dangerBtn = document.createElement('button');
                dangerBtn.className = 'el-button el-button--danger';
                dangerBtn.innerHTML = '<span>永久删除</span>';
                dangerBtn.onclick = () => {
                    // 关闭当前对话框
                    document.querySelector('.delete-confirm-dialog .el-message-box__close').click();
                    // 调用永久删除
                    deleteKnowledgePermanently(knowledge);
                };
                footer.insertBefore(dangerBtn, footer.firstChild);
            }
        }
    }, 10);
}

// 当前选择的课程ID列表（用于多选删除）
const selectedCourseIds = ref([]);
// 知识点所在的课程列表
const knowledgeCoursesData = ref([]);
// 当前操作的知识点
const currentKnowledge = ref(null);
// 课程选择对话框是否可见
const courseSelectDialogVisible = ref(false);

// 查询知识点所在的课程并显示选择对话框
const showKnowledgeCourses = async (knowledge) => {
    try {
        // 设置当前操作的知识点
        currentKnowledge.value = knowledge;
        // 显示加载状态
        loading.value = true;
        
        // 调用API获取知识点所在的所有课程
        const courses = await knowledgeAPI.getCoursesByKnowledgeId(String(knowledge.knowledgeId));
        console.log('知识点所在课程:', courses);
        
        if (Array.isArray(courses) && courses.length > 0) {
            // 格式化课程数据，添加选择状态
            knowledgeCoursesData.value = courses.map(course => ({
                ...course,
                id: String(course.id), // 确保ID是字符串
                name: course.name || '未命名课程',
                selected: false
            }));
            
            // 默认选择当前课程
            if (selectedCourse.value) {
                // 在所在课程列表中找到当前选中的课程并设为选中状态
                const currentCourseIndex = knowledgeCoursesData.value.findIndex(
                    course => course.id === selectedCourse.value
                );
                if (currentCourseIndex >= 0) {
                    selectedCourseIds.value = [selectedCourse.value];
                }
            }
            
            // 显示课程选择对话框
            courseSelectDialogVisible.value = true;
        } else {
            // 没有找到课程
        ElMessageBox.alert(
                '该知识点未被分配到任何课程，无法执行从课程中删除操作。',
                '提示',
            {
                confirmButtonText: '确定',
                    type: 'info'
            }
        );
        }
    } catch (error) {
        console.error('获取知识点所在课程失败:', error);
        ElMessage.error('获取知识点所在课程失败: ' + (error.message || '未知错误'));
    } finally {
        loading.value = false;
    }
}

// 处理课程选择变更
const handleCourseSelectionChange = (courseIds) => {
    selectedCourseIds.value = courseIds;
}

// 从选择的课程中删除知识点
const deleteKnowledgeFromSelectedCourses = async () => {
    if (!currentKnowledge.value) {
        ElMessage.error('未选择要删除的知识点');
        return;
    }
    
    if (selectedCourseIds.value.length === 0) {
        ElMessage.warning('请至少选择一个课程');
        return;
    }
    
    try {
        // 显示加载状态
        loading.value = true;
        
        // 创建一个Promise数组，每个Promise负责从一个课程中删除知识点
        const deletePromises = selectedCourseIds.value.map(courseId => 
            knowledgeAPI.deleteKnowledgeFromCourseById(courseId, String(currentKnowledge.value.knowledgeId))
                .catch(error => {
                    console.error(`从课程(${courseId})中删除知识点失败:`, error);
                    return { success: false, courseId };
                })
        );
        
        // 等待所有删除操作完成
        const results = await Promise.all(deletePromises);
        
        // 统计成功和失败的数量
        const successCount = results.filter(result => result.success !== false).length;
        const failCount = results.length - successCount;
        
        // 关闭对话框
        courseSelectDialogVisible.value = false;
        
        // 提示用户删除结果
        if (successCount > 0) {
            ElMessage.success(`已从 ${successCount} 个课程中删除知识点`);
            // 重新加载知识点列表
            fetchKnowledgeList();
        }
        
        if (failCount > 0) {
            ElMessage.warning(`有 ${failCount} 个课程中的知识点删除失败`);
        }
    } catch (error) {
        console.error('批量从课程中删除知识点失败:', error);
        ElMessage.error('批量从课程中删除知识点失败: ' + (error.message || '未知错误'));
    } finally {
        loading.value = false;
        // 清空当前选择
        currentKnowledge.value = null;
        selectedCourseIds.value = [];
    }
}

// 永久删除知识点
const deleteKnowledgePermanently = async (knowledge) => {
    // 二次确认
    try {
        await ElMessageBox.confirm(
            `确定要永久删除知识点"${knowledge.name}"吗？此操作将不可恢复！`,
            '永久删除确认',
        {
                confirmButtonText: '确定删除',
            cancelButtonText: '取消',
                type: 'error'
        }
        );
        
        console.log('永久删除知识点:', {
            knowledgeId: String(knowledge.knowledgeId)
            });
            
        await knowledgeAPI.deleteKnowledgeById(String(knowledge.knowledgeId));
        ElMessage.success('永久删除知识点成功');
        fetchKnowledgeList();
        } catch (error) {
        // 检查是否是用户取消操作
        if (error !== 'cancel' && error.toString() !== 'cancel') {
            console.error('永久删除知识点失败:', error);
            ElMessage.error('永久删除知识点失败: ' + (error.message || '未知错误'));
        }
    }
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

// 获取当前选中课程名称
const getSelectedCourseName = () => {
    if (!selectedCourse.value) return '';
    const course = courseList.value.find(c => c.id === selectedCourse.value);
    return course ? course.name : '未知课程';
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
    
    // 为所有课程创建条目，确保所有课程都有初始值0
    courseList.value.forEach(course => {
        if (course && course.name) {
        distribution[course.name] = 0
        }
    })
    
    // 添加"未分配课程"条目
    distribution['未分配课程'] = 0
    
    // 统计每个课程的知识点数量
    if (selectedCourse.value) {
        // 如果选择了特定课程，则所有知识点都属于该课程
        const courseName = courseList.value.find(c => c.id === selectedCourse.value)?.name || '未知课程'
        distribution[courseName] = knowledgeList.value.length
    } else {
        // 如果是全部课程视图，则基于查询结果的courseName属性来分配
    knowledgeList.value.forEach(item => {
            // 方法1：如果知识点有courseName属性（从API返回或之前赋值）
            if (item.courseName) {
                distribution[item.courseName] = (distribution[item.courseName] || 0) + 1
            } 
            // 方法2：如果有courseId属性（可能是之前附加的）
            else if (item.courseId) {
            const course = courseList.value.find(c => c.id === item.courseId)
            if (course && course.name) {
                distribution[course.name] = (distribution[course.name] || 0) + 1
                } else {
                    // 找不到对应课程名称，计入未分配
                    distribution['未分配课程'] = distribution['未分配课程'] + 1
                }
            }
            // 方法3：没有课程信息的知识点，计入未分配
            else {
                distribution['未分配课程'] = distribution['未分配课程'] + 1
        }
    })
    }
    
    // 如果未分配课程为0，则不显示该柱子
    if (distribution['未分配课程'] === 0) {
        delete distribution['未分配课程']
    }
    
    // 移除没有知识点的课程
    const filteredDistribution = {}
    Object.entries(distribution).forEach(([key, value]) => {
        if (value > 0) {
            filteredDistribution[key] = value
        }
    })
    
    // 如果过滤后没有数据，返回原始分布
    const result = Object.keys(filteredDistribution).length > 0 ? filteredDistribution : distribution
    
    console.log('课程知识点分布数据:', result)
    return result
})

// 初始化图表
const initCharts = () => {
    try {
        // 使用CDN加载的echarts
        const echarts = window.echarts
        if (!echarts) {
            console.error('未找到echarts库')
            // 动态添加echarts CDN脚本
            loadEChartsScript()
            return
        }
        
    // 初始化难度分布图表
        const difficultyChartDom = document.getElementById('difficultyChart')
        if (difficultyChartDom) {
            difficultyChart = echarts.init(difficultyChartDom)
        }
    
    // 初始化课程知识点分布图表
        const courseKnowledgeChartDom = document.getElementById('courseKnowledgeChart')
        if (courseKnowledgeChartDom) {
            courseKnowledgeChart = echarts.init(courseKnowledgeChartDom)
        }
    
    // 更新图表数据
    updateCharts()
    } catch (error) {
        console.error('初始化图表失败:', error)
    }
}

// 动态加载echarts脚本
const loadEChartsScript = () => {
    const script = document.createElement('script')
    script.src = 'https://cdn.jsdelivr.net/npm/echarts@5.4.3/dist/echarts.min.js'
    script.id = 'echarts-script'
    script.onload = () => {
        console.log('echarts加载成功')
        initCharts()
    }
    script.onerror = () => {
        console.error('echarts加载失败')
    }
    document.head.appendChild(script)
}

// 检查是否已经加载echarts
const isEChartsLoaded = () => {
    return !!window.echarts
}

// 更新图表数据
const updateCharts = () => {
    const echarts = window.echarts
    if (!echarts) {
        console.warn('echarts未加载，无法更新图表')
        return
    }
    
    // 如果知识点列表为空，则不绘制图表
    if (knowledgeList.value.length === 0) {
        console.log('知识点列表为空，不更新图表')
        return
    }
    
    try {
    // 更新难度分布图表
        if (difficultyChart) {
    const difficultyData = difficultyDistribution.value
            difficultyChart.setOption({
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
                            { value: difficultyData['简单'] || 0, name: '简单' },
                            { value: difficultyData['中等'] || 0, name: '中等' },
                            { value: difficultyData['困难'] || 0, name: '困难' }
                ]
            }
        ]
    })
        }
    
    // 更新课程知识点分布图表
        if (courseKnowledgeChart) {
    const courseData = courseKnowledgeDistribution.value
    const courseNames = Object.keys(courseData)
    const courseValues = courseNames.map(name => courseData[name])
    
            // 更详细的日志，帮助调试
            console.log('课程知识点图表数据详情:', { 
                课程列表: courseList.value.map(c => ({ id: c.id, name: c.name })),
                知识点列表: knowledgeList.value.map(k => ({ 
                    id: k.knowledgeId, 
                    name: k.name, 
                    courseId: k.courseId,
                    courseName: k.courseName 
                })),
                课程名: courseNames, 
                知识点数量: courseValues 
            })
            
            // 添加颜色数组，确保每个柱子有不同颜色
            const colors = [
                '#5470c6', '#91cc75', '#fac858', '#ee6666', '#73c0de', 
                '#3ba272', '#fc8452', '#9a60b4', '#ea7ccc', '#48b',
                '#5470c6', '#91cc75', '#fac858', '#ee6666', '#73c0de'
            ];
            
            // 处理没有数据的情况
            if (courseNames.length === 0) {
                courseNames.push('暂无课程数据')
                courseValues.push(0)
            }
            
            courseKnowledgeChart.setOption({
        title: {
            text: '课程知识点数量',
            left: 'center',
            show: false
        },
        tooltip: {
            trigger: 'axis',
            axisPointer: {
                type: 'shadow'
                    },
                    formatter: function(params) {
                        const data = params[0];
                        return `${data.name}<br/>知识点数量: ${data.value || 0}`;
            }
        },
        grid: {
            left: '3%',
            right: '4%',
                    bottom: '15%',
                    top: '10%',
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
                    type: 'value',
                    minInterval: 1, // 设置最小间隔为1，确保显示整数
                    min: 0, // 从0开始
                    max: function(value) {
                        // 确保Y轴最大值至少为1，否则空数据时会显示0-0的坐标轴
                        return Math.max(value.max, 1);
                    },
                    splitLine: {
                        show: true,
                        lineStyle: {
                            type: 'dashed'
                        }
                    }
        },
        series: [
            {
                name: '知识点数量',
                type: 'bar',
                barWidth: '60%',
                        data: courseValues.map((value, index) => {
                            return {
                                value: value,
                itemStyle: {
                                    color: colors[index % colors.length]
                                }
                            };
                        }),
                emphasis: {
                    itemStyle: {
                                shadowBlur: 10,
                                shadowOffsetX: 0,
                                shadowColor: 'rgba(0, 0, 0, 0.5)'
                            }
                        },
                        label: {
                            show: true,
                            position: 'top',
                            formatter: '{c}',
                            fontSize: 12,
                            fontWeight: 'bold'
                }
            }
        ]
    })
        }
    } catch (error) {
        console.error('更新图表数据失败:', error)
    }
}

// 创建监听窗口大小变化的函数
const handleResize = () => {
    if (difficultyChart) {
        difficultyChart.resize()
    }
    if (courseKnowledgeChart) {
        courseKnowledgeChart.resize()
    }
}

// 页面加载时获取数据
onMounted(() => {
    // 添加echarts CDN脚本如果不存在
    if (!isEChartsLoaded()) {
        loadEChartsScript()
    }
    
    // 先获取课程列表
    fetchCourses().then(() => {
        // 然后获取知识点列表
        fetchKnowledgeList().then(() => {
            // 最后初始化图表
    nextTick(() => {
                // 延迟初始化图表，确保DOM已渲染且echarts已加载
                setTimeout(() => {
        initCharts()
                }, 300)
            })
        })
    })
    
    // 添加窗口大小变化监听
    window.addEventListener('resize', handleResize)
})

// 组件卸载前清理
onBeforeUnmount(() => {
    // 移除窗口大小变化监听
    window.removeEventListener('resize', handleResize)
    
    // 销毁图表实例
    if (difficultyChart) {
        difficultyChart.dispose()
        difficultyChart = null
    }
    if (courseKnowledgeChart) {
        courseKnowledgeChart.dispose()
        courseKnowledgeChart = null
    }
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

.action-buttons {
    display: flex;
    gap: 12px;
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

/* 表格上方操作区域 */
.table-top-actions {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 12px;
    padding: 8px 0;
}

.selection-info {
    font-size: 14px;
    color: #606266;
}

.selected-count {
    font-weight: bold;
    color: #409EFF;
    margin: 0 4px;
}

.batch-actions {
    display: flex;
    gap: 8px;
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

.empty-chart {
    height: 300px;
    width: 100%;
    display: flex;
    justify-content: center;
    align-items: center;
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

.truncated-description {
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
    max-width: 100%;
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

<style>
/* 删除对话框样式 */
.delete-confirm-dialog .el-message-box__btns,
.batch-delete-dialog .el-message-box__btns {
    display: flex;
    justify-content: flex-end;
    gap: 10px;
}

.delete-confirm-dialog .el-button--danger,
.batch-delete-dialog .el-button--danger {
    margin-right: auto;
}
</style>
