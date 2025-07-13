<template>
    <!-- 顶部导航栏 -->
    <header class="header">
        <div class="logo-area">
            <!-- logo图片支持插入 -->
            <img class="logo-img" src="@/assets/projectlogo.png" alt="logo" />
            <span class="app-name">{{ props.appName }}</span>
        </div>
        <div class="header-right">
            <el-input v-if="props.showInviteCode" placeholder="请输入邀请码" v-model="inviteCode" class="invite-input"
                size="small" style="width: 180px; margin-right: 12px;" @keyup.enter="handleJoinCourse">
                <template #prefix>
                    <el-icon><Ticket /></el-icon>
                </template>
                <template #append>
                    <el-button @click="handleJoinCourse" :disabled="!inviteCode.trim()">
                        <el-icon><Right /></el-icon>
                    </el-button>
                </template>
            </el-input>
            <el-input 
                placeholder="找资料" 
                class="search-input" 
                size="small" 
                v-model="searchValue"
                @input="handleSearchInput"
                @keyup.enter="handleSearch"
            >
                <template #prefix>
                    <el-icon><Search /></el-icon>
                </template>
            </el-input>
            <!-- 使用已有的default.jpg作为头像 -->
            <el-avatar class="avatar" />
            <el-dropdown>
                <span class="user-name">
                    <div class="user-name-text">{{ props.userName }}</div>
                    <el-icon-arrow-down style="margin-left: 4px; width: 20px;" />
                </span>
                <template #dropdown>
                    <el-dropdown-menu>
                        <el-dropdown-item @click="handleProfileClick">个人中心</el-dropdown-item>
                        <el-dropdown-item @click="handleChangePassword">修改密码</el-dropdown-item>
                        <el-dropdown-item divided @click="handleLogout">退出登录</el-dropdown-item>
                    </el-dropdown-menu>
                </template>
            </el-dropdown>
        </div>
    </header>
</template>

<script setup>
import { ref, defineProps, defineEmits } from 'vue'
import { ElMessage } from 'element-plus'
import { clearAuth } from '@/utils/auth'
import { useRouter } from 'vue-router'
import { Search, Ticket, Right } from '@element-plus/icons-vue'

const props = defineProps({
    logoUrl: {
        type: String,
        default: 'https://placehold.co/48x48?text=Logo'
    },
    appName: {
        type: String,
        default: '软件名称'
    },
    avatarUrl: {
        type: String,
        default: '/src/assets/default.jpg'
    },
    userName: {
        type: String,
        default: ''
    },
    showInviteCode: {
        type: Boolean,
        default: false
    },
    defaultSearchValue: {
        type: String,
        default: ''
    }
})

const router = useRouter()
const searchValue = ref(props.defaultSearchValue)

// 搜索
const emit = defineEmits(['userAction', 'search', 'searchInput', 'joinCourse'])

const inviteCode = ref('')

function handleProfileClick() {
    // 获取用户角色信息，确定角色
    const userRole = localStorage.getItem('user_role')
    
    // 清空左侧导航栏选中状态
    emit('userAction', 'clearMenuActive')
    
    // 根据角色跳转到不同的个人中心页面
    if (userRole && userRole.includes('ROLE_TEACHER')) {
        // 教师角色
        router.push('/teacher/center')
    } else {
        // 默认为学生角色
        router.push('/student/center')
    }
}

function handleSearchInput() {
    // 将搜索框的值发送给父组件
    emit('searchInput', searchValue.value)
}

function handleSearch() {
    // 当按下回车键时执行搜索
    emit('search', searchValue.value)
}

function handleChangePassword() {
    router.push('/passwordChange')
}

function handleLogout() {
    // 清除所有认证信息
    clearAuth()
    
    // 提示用户已退出登录
    ElMessage.success('已退出登录')
    
    // 跳转到登录页
    router.push('/login')
}

function handleJoinCourse() {
    if (!inviteCode.value.trim()) {
        ElMessage.warning('请输入邀请码')
        return
    }
    
    // 触发事件，将邀请码传给父组件处理
    emit('joinCourse', inviteCode.value)
    
    // 清空输入框
    inviteCode.value = ''
}
</script>

<style scoped>
.header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    height: 64px;
    padding: 0 32px;
    background: rgb(46, 58, 79);
    border-bottom: 1px solid rgba(0, 0, 0, 0.1);
    margin-bottom: 0;
    z-index: 10;
}

/* 覆盖Element Plus下拉菜单样式 */
:deep(.el-dropdown-menu) {
    border: none !important;
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1) !important;
}

:deep(.el-dropdown-menu__item:hover) {
    background-color: #f5f7fa !important;
    color: #409eff !important;
    border: none !important;
    outline: none !important;
}

:deep(.el-dropdown-menu__item:focus) {
    border: none !important;
    outline: none !important;
}

:deep(.el-dropdown) {
    outline: none !important;
}

:deep(.el-dropdown:focus-visible) {
    outline: none !important;
}

.logo-area {
    display: flex;
    align-items: center;
}

.logo-img {
    width: 48px;
    height: 48px;
    border-radius: 50%;
    object-fit: cover;
    margin-right: 16px;
}

.app-name {
    font-size: 20px;
    font-weight: 500;
    color: rgb(193, 197, 205);
}

.header-right {
    display: flex;
    align-items: center;
    gap: 16px;
}

.search-input {
    width: 220px;
}

:deep(.search-input .el-input__wrapper) {
    background-color: rgba(95, 105, 126, 0.7);
    box-shadow: none;
    border-radius: 20px;
    padding: 0 15px;
}

:deep(.search-input .el-input__inner) {
    color: rgb(193, 197, 205);
    height: 36px;
}

:deep(.search-input .el-input__inner::placeholder) {
    color: rgb(193, 197, 205);
}

:deep(.search-input .el-input__prefix-inner .el-icon) {
    color: rgb(193, 197, 205);
    margin-right: 4px;
}

.invite-input {
    width: 180px;
}

/* 修改邀请码按钮样式，使其与输入框右侧重合 */
:deep(.invite-input .el-input__wrapper) {
    background-color: rgba(95, 105, 126, 0.7);
    box-shadow: none;
    border-radius: 20px;
    padding: 0 15px;
    padding-right: 40px; /* 为按钮预留空间 */
}

:deep(.invite-input .el-input__inner) {
    color: rgb(193, 197, 205);
    height: 36px;
}

:deep(.invite-input .el-input__inner::placeholder) {
    color: rgb(193, 197, 205);
}

:deep(.invite-input .el-input-group__append) {
    background-color: rgba(75, 141, 230, 0.9);
    box-shadow: none;
    border: none;
    color: white;
    padding: 0 10px;
    border-top-right-radius: 20px;
    border-bottom-right-radius: 20px;
    margin-left: -1px; /* 消除间隙 */
    position: absolute; /* 使按钮绝对定位 */
    right: 0; /* 定位到右侧 */
    top: 0;
    height: 100%; /* 与输入框同高 */
    display: flex;
    align-items: center;
}

:deep(.invite-input .el-input-group__append .el-button) {
    color: white;
    border: none;
    background: transparent;
    padding: 0;
}

:deep(.invite-input .el-input-group__append .el-icon) {
    color: white;
    font-size: 14px;
}

.avatar {
    background: url('@/assets/default.jpg') no-repeat center center;
    background-size: cover;
    margin-left: 12px;
    width: 32px;
    height: 32px;
}

.user-name {
    cursor: pointer;
    margin-left: 3px;
    display: flex;
    align-items: center;
    outline: none;
    user-select: none;
    color: rgb(193, 197, 205);
    writing-mode: horizontal-tb; /* 确保文字横向排版 */
}

.user-name-text {
    width: 50px;
}
.user-name:focus,
.user-name:active {
    outline: none;
    border: none;
}
</style>