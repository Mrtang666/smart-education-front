<template>
    <div class="home-container">
        <div class="welcome-section">
            <div class="welcome-header">
                <h1 class="welcome-title">欢迎 <span class="teacher-name">{{ teacherName }}</span> 老师使用</h1>
                <div class="current-datetime">{{ currentDateTime }}</div>
            </div>
            <div class="welcome-card">
                <div class="card-content">
                    <p>智能教育平台助您提高教学效率，轻松管理课程与学生</p>
                </div>
            </div>
        </div>
        
        <div class="functions-section">
            <h2 class="section-title">常用功能</h2>
            <div class="function-grid">
                <div class="function-card" v-for="(item, index) in functionItems" :key="index" @click="navigateTo(item.route)">
                    <el-icon class="function-icon"><component :is="item.icon" /></el-icon>
                    <div class="function-title">{{ item.title }}</div>
                    <div class="function-desc">{{ item.description }}</div>
                </div>
            </div>
        </div>
    </div>
</template>

<script setup>
import { ref, onMounted, computed, onUnmounted, inject } from 'vue'
import { useRouter } from 'vue-router'
import { 
    Reading, 
    Document, 
    EditPen, 
    User, 
    Collection, 
    DataAnalysis,
    // Bell
} from '@element-plus/icons-vue'

const router = useRouter()
const teacherName = ref('') // 将从localStorage获取

// 获取父组件提供的setActiveMenu方法
const setActiveMenu = inject('setActiveMenu', null)

// 从localStorage获取用户信息
const getUserInfoFromStorage = () => {
    try {
        const userInfoStr = localStorage.getItem('user_info')
        if (userInfoStr) {
            const userInfo = JSON.parse(userInfoStr)
            if (userInfo && userInfo.fullName) {
                teacherName.value = userInfo.fullName
            } else if (userInfo && userInfo.username) {
                teacherName.value = userInfo.username
            } else {
                teacherName.value = '老师'
            }
            console.log('获取到的教师信息:', userInfo)
        } else {
            teacherName.value = '老师'
        }
    } catch (error) {
        console.error('解析用户信息出错:', error)
        teacherName.value = '老师'
    }
}

// 格式化当前日期时间
const currentDateTime = computed(() => {
    const now = new Date()
    const year = now.getFullYear()
    const month = String(now.getMonth() + 1).padStart(2, '0')
    const day = String(now.getDate()).padStart(2, '0')
    const hours = String(now.getHours()).padStart(2, '0')
    const minutes = String(now.getMinutes()).padStart(2, '0')
    
    return `${year}/${month}/${day} ${hours}:${minutes}`
})

// 更新时间
const updateTime = () => {
    // 强制重新计算计算属性
    // eslint-disable-next-line no-unused-vars
    const temp = teacherName.value // 正确的方式是重新赋值，而不是比较
}

// 每分钟更新一次时间
let timeInterval
onMounted(() => {
    getUserInfoFromStorage()
    updateTime()
    timeInterval = setInterval(updateTime, 60000)
})

// 组件卸载时清除定时器
onUnmounted(() => {
    if (timeInterval) {
        clearInterval(timeInterval)
    }
})

// 功能项
const functionItems = [
    { 
        title: '课程管理', 
        description: '创建和管理您的课程', 
        icon: Reading, 
        route: '/teacher/course' 
    },
    { 
        title: '考试管理', 
        description: '创建和管理考试试卷', 
        icon: Document, 
        route: '/teacher/exam' 
    },
    { 
        title: '作业布置', 
        description: '布置和批改学生作业', 
        icon: EditPen, 
        route: '/teacher/homework' 
    },
    { 
        title: '学生管理', 
        description: '查看和管理学生信息', 
        icon: User, 
        route: '/teacher/student' 
    },
    { 
        title: '班级管理', 
        description: '管理班级和教学计划', 
        icon: Collection, 
        route: '/teacher/class' 
    },
    { 
        title: '数据分析', 
        description: '分析学生学习情况', 
        icon: DataAnalysis, 
        route: '/teacher/analysis' 
    }
]

// 路由导航
const navigateTo = (route) => {
    // 根据路由路径设置对应的菜单选中状态
    if (setActiveMenu) {
        // 根据路由路径确定要选中的菜单
        if (route.includes('/course')) {
            setActiveMenu('课程')
        } else if (route.includes('/exam')) {
            setActiveMenu('考试')
        } else if (route.includes('/homework')) {
            setActiveMenu('作业')
        } else if (route.includes('/student')) {
            setActiveMenu('学生')
        } else if (route.includes('/class')) {
            setActiveMenu('班级')
        } else if (route.includes('/analysis')) {
            setActiveMenu('分析')
        }
    }
    
    // 跳转到目标路由
    router.push(route)
}
</script>

<style scoped>
.home-container {
    padding: 24px;
    max-width: 1200px;
    margin: 0 auto;
}

.welcome-section {
    margin-bottom: 32px;
}

.welcome-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 16px;
}

.welcome-title {
    font-size: 24px;
    font-weight: 500;
    color: #303133;
    margin: 0;
}

.teacher-name {
    color: #409EFF;
    font-weight: 600;
}

.current-datetime {
    font-size: 16px;
    color: #606266;
    font-family: monospace;
    background-color: #f0f2f5;
    padding: 6px 12px;
    border-radius: 4px;
}

.welcome-card {
    background: linear-gradient(135deg, #f0f5ff, #e6f7ff);
    border-radius: 8px;
    padding: 20px;
    box-shadow: 0 2px 12px rgba(0, 0, 0, 0.05);
}

.card-content {
    font-size: 16px;
    color: #606266;
}

.section-title {
    font-size: 20px;
    font-weight: 500;
    color: #303133;
    margin: 0 0 20px 0;
    position: relative;
    padding-left: 12px;
    border-left: 4px solid #409EFF;
    text-align: left;
}

.function-grid {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(250px, 1fr));
    gap: 20px;
}

.function-card {
    background: #fff;
    border-radius: 8px;
    padding: 20px;
    box-shadow: 0 2px 12px rgba(0, 0, 0, 0.05);
    transition: all 0.3s;
    cursor: pointer;
    border: 1px solid #ebeef5;
}

.function-card:hover {
    transform: translateY(-5px);
    box-shadow: 0 6px 16px rgba(0, 0, 0, 0.1);
    border-color: #d9ecff;
}

.function-icon {
    font-size: 32px;
    color: #409EFF;
    margin-bottom: 16px;
}

.function-title {
    font-size: 18px;
    font-weight: 500;
    color: #303133;
    margin-bottom: 8px;
}

.function-desc {
    font-size: 14px;
    color: #606266;
}
</style>
