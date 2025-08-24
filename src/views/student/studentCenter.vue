<!--  -->
<template>
    <div class="student-center">
        <!-- 顶部导航栏 -->
        <AppHeader :logo-url="logoUrl" :app-name="'慧课'" :avatar-url="avatarUrl" :user-name="userName"
            :default-search-value="searchValue" @user-action="handleUserAction" @avatar-change="handleAvatarChange"
            @search="handleSearch" @search-input="handleSearchInput" @join-course="handleJoinCourse" showInviteCode/>

        <main class="main-content">
            <!-- 左侧菜单栏 -->
            <aside class="sidebar">
                <div class="menu-container">
                    <div v-for="item in menuList" :key="item.name" class="menu-btn"
                        :class="{ 'menu-btn-active': activeMenu === item.name }" @click="handleMenuClick(item)">
                        <el-icon class="menu-icon">
                            <component :is="item.icon" />
                        </el-icon>
                        <span>{{ item.name }}</span>
                    </div>
                </div>
            </aside>
            <!-- 右侧内容区 -->
            <section class="content-area">
                <router-view></router-view>
            </section>
        </main>

        <!-- 右下角AI对话框入口 -->
        <div class="ai-chat-entry" @click="showAIChat = true" v-if="!showAIChat">
            <el-icon :size="24">
                <ChatDotRound />
            </el-icon>
        </div>
        <!-- AI聊天弹窗 -->
        <transition name="slide-up">
            <div v-if="showAIChat" class="ai-chat-modal" :style="{ width: chatWidth + 'px' }">
                <!-- 左侧拖动调整大小的区域 -->
                <div class="resize-handle" @mousedown="startResize"></div>

                <div class="ai-chat-header">
                    <span>AI学习助手</span>
                    <el-icon class="close-icon" @click="showAIChat = false">
                        <Close />
                    </el-icon>
                </div>
                <div class="ai-chat-body" ref="chatBodyRef">
                    <div class="chat-message" v-for="(msg, idx) in chatMessages" :key="idx"
                        :class="{ 'chat-message-user': msg.role === 'user', 'chat-message-ai': msg.role === 'assistant' }">
                        <div class="chat-message-content">
                            <span v-if="msg.role === 'assistant'" class="chat-role">AI：</span>
                            <div class="message-text" v-html="formatMessage(msg.content)"></div>
                            <!-- AI消息操作按钮 -->
                            <div v-if="msg.role === 'assistant'" class="message-actions">
                                <el-button size="small" type="text" @click="copyMessage(msg.content)">
                                    <el-icon><DocumentCopy /></el-icon>
                                    复制
                                </el-button>
                                <el-button size="small" type="text" @click="regenerateMessage(idx)">
                                    <el-icon><Refresh /></el-icon>
                                    重新生成
                                </el-button>
                            </div>
                        </div>
                    </div>
                    <!-- 流式输出状态 -->
                    <div v-if="isStreaming" class="chat-message chat-message-ai">
                        <div class="chat-message-content">
                            <span class="chat-role">AI：</span>
                            <div class="message-text" v-html="formatMessage(streamingContent)"></div>
                            <div class="streaming-indicator">
                                <span class="typing-dots">
                                    <span></span>
                                    <span></span>
                                    <span></span>
                                </span>
                                <span class="streaming-text">正在生成中...</span>
                            </div>
                        </div>
                    </div>
                    <!-- 加载状态 -->
                    <div v-if="isChatLoading && !isStreaming" class="chat-message chat-message-ai">
                        <div class="chat-message-content">
                            <span class="chat-role">AI：</span>
                            <span class="typing-indicator">正在思考中...</span>
                        </div>
                    </div>
                </div>
                <div class="ai-chat-footer">
                    <div class="chat-suggestions-horizontal">
                        <el-button v-for="(suggest, idx) in chatSuggestions" :key="idx" size="small"
                            class="suggest-btn-horizontal" @click="suggestClick(suggest)" type="primary" plain>
                            {{ suggest }}
                        </el-button>
                    </div>
                    <div class="chat-input-row">
                        <el-input v-model="chatInput" placeholder="请输入你的问题..." size="small" @keyup.enter="sendChat"
                            class="chat-input-full">
                            <template #append>
                                <el-button type="primary" @click="sendChat">
                                    <el-icon>
                                        <Position />
                                    </el-icon>
                                </el-button>
                            </template>
                        </el-input>
                    </div>
                </div>
            </div>
        </transition>
    </div>
</template>

<script setup>
import { getValidToken } from '@/utils/auth'
import { ref, onUnmounted, provide, onMounted, nextTick, watch, h } from 'vue'
import { ElMessage, ElLoading, ElMessageBox } from 'element-plus'
import AppHeader from '@/components/common/AppHeader.vue'
import { useRouter } from 'vue-router'
import {
    ChatDotRound,
    Close,
    Position,
    Reading,
    // Document,
    DataAnalysis,
    Setting,
    HomeFilled,
    DocumentCopy,
    Refresh,
    Monitor
} from '@element-plus/icons-vue'
import { getUserInfo, clearAuth } from '@/utils/auth'
import { courseSelectionAPI, studentAssistantAPI } from '@/api/api'
import { marked } from 'marked'

const router = useRouter()
const logoUrl = ref('@/assets/projectlogo.png') // 项目logo
const avatarUrl = ref('https://placehold.co/40x40?text=头像') // 默认头像
const userName = ref('同学') // 默认用户名
const showAIChat = ref(false)
const chatInput = ref('')
const searchValue = ref('') // 搜索框的值
const chatMessages = ref([
    { role: 'assistant', content: '你好，我是你的学习助手，有什么可以帮你？' }
])
const isChatLoading = ref(false) // 聊天加载状态
const isStreaming = ref(false) // 流式输出状态
const streamingContent = ref('') // 流式输出内容

// 对话框宽度相关
const chatWidth = ref(400) // 初始宽度
const minWidth = 300 // 最小宽度
const maxWidth = 800 // 最大宽度
const isResizing = ref(false)
const startX = ref(0)
const startWidth = ref(0)

// 用户信息相关状态
const userInfo = ref(null)

// 聊天体引用
const chatBodyRef = ref(null)
const isLoading = ref(true)

// 提供用户信息给子组件
provide('userInfo', userInfo)

// 开始调整大小
function startResize(e) {
    isResizing.value = true
    startX.value = e.clientX
    startWidth.value = chatWidth.value
    document.addEventListener('mousemove', handleResize)
    document.addEventListener('mouseup', stopResize)
    // 防止文本选择
    document.body.style.userSelect = 'none'
}

// 处理调整大小
function handleResize(e) {
    if (!isResizing.value) return
    const offsetX = startX.value - e.clientX
    let newWidth = startWidth.value + offsetX

    // 限制最小和最大宽度
    if (newWidth < minWidth) newWidth = minWidth
    if (newWidth > maxWidth) newWidth = maxWidth

    chatWidth.value = newWidth
}

// 停止调整大小
function stopResize() {
    isResizing.value = false
    document.removeEventListener('mousemove', handleResize)
    document.removeEventListener('mouseup', stopResize)
    document.body.style.userSelect = ''
}

// 组件卸载时清理事件监听器
onUnmounted(() => {
    document.removeEventListener('mousemove', handleResize)
    document.removeEventListener('mouseup', stopResize)
})

// 聊天建议选项
const chatSuggestions = ref([
    '如何提高学习效率?',
    '推荐学习资源',
    '我的学习进度如何?',
    '帮我分析考试结果'
])

// 模拟数据配置
const mockDataConfig = {
    '如何提高学习效率?': [
        '提高学习效率需要科学的方法和良好的习惯。',
        '首先，制定明确的学习计划和目标，将大目标分解为小任务。',
        '其次，采用番茄工作法，专注25分钟后休息5分钟，保持注意力集中。',
        '第三，使用费曼学习法，尝试向他人解释你学到的知识，这样可以加深理解。',
        '第四，定期复习和总结，建立知识体系，避免遗忘。',
        '最后，保持良好的作息和运动习惯，大脑需要充足的休息和营养。'
    ],
    '推荐学习资源': [
        '根据你的学习需求，我推荐以下优质学习资源：',
        '在线课程平台：Coursera、edX、Udemy等，提供各领域的专业课程。',
        '编程学习：LeetCode、HackerRank、Codecademy等，适合练习编程技能。',
        '语言学习：Duolingo、Memrise、Anki等，支持多种语言学习。',
        '学术资源：Google Scholar、ResearchGate、arXiv等，获取最新研究成果。',
        '技能提升：LinkedIn Learning、Skillshare、MasterClass等，学习实用技能。',
        '建议根据个人兴趣和学习目标选择合适的平台。'
    ],
    '我的学习进度如何?': [
        '根据系统记录，你的学习进度表现良好：',
        '课程完成率：85%，超过班级平均水平。',
        '作业提交率：92%，按时完成作业的习惯很好。',
        '考试成绩：平均分87分，在班级中排名前30%。',
        '学习时长：本周累计学习12小时，日均1.7小时。',
        '知识掌握：核心知识点掌握度达到80%。',
        '建议继续保持当前的学习节奏，重点加强薄弱环节的练习。'
    ],
    '帮我分析考试结果': [
        '让我帮你分析一下最近的考试结果：',
        '总体表现：本次考试得分78分，相比上次提升了5分。',
        '优势科目：数学和英语表现突出，分别得分85分和82分。',
        '需要改进：物理和化学相对较弱，得分分别为70分和72分。',
        '错题分析：主要问题集中在力学计算和化学反应方程式上。',
        '学习建议：建议多练习物理计算题，加强化学基础概念的理解。',
        '下次目标：设定目标分数82分，重点提升理科成绩。'
    ]
}

// 左侧菜单栏
const menuList = [
    { name: '首页', icon: HomeFilled },
    { name: '课程', icon: Reading },
    // { name: '作业', icon: Notebook },
    // { name: '考试', icon: Document },
    // { name: '日程', icon: Calendar },
    { name: '计划', icon: DataAnalysis },
    { name: 'VSCode', icon: Monitor },
    { name: '设置', icon: Setting }
]

const activeMenu = ref('') // 默认不选中任何菜单

// 在onMounted钩子中获取用户信息
onMounted(() => {
    // 获取学生数据
    const studentData = fetchStudentData()
    console.log('学生数据:', studentData)

    // 存储学生数据到前端
    if (studentData) {
        userInfo.value = studentData
        // 可以根据需要更新其他状态，如用户名、头像等
        if (studentData.fullName) {
            userName.value = studentData.fullName
        } else if (studentData.username) {
            userName.value = studentData.username
        }

        isLoading.value = false
    }
})

// 监听聊天框打开状态，打开时滚动到底部
watch(showAIChat, (newValue) => {
    if (newValue) {
        scrollToBottom()
    }
})

// 设置活动菜单的方法，供子组件调用
const setActiveMenu = (menuName) => {
    // 查找匹配的菜单项
    const foundMenu = menuList.find(item => item.name === menuName)
    if (foundMenu) {
        activeMenu.value = menuName
        console.log('从子组件设置活动菜单:', menuName)
    }
}

// 将设置活动菜单的方法提供给子组件
provide('setActiveMenu', setActiveMenu)

// 菜单点击处理
function handleMenuClick(menu) {
    activeMenu.value = menu.name
    console.log('选中菜单:', menu.name)

    // 根据菜单项跳转到不同的路由
    switch (menu.name) {
        case '首页':
            router.push('/student/center')
            break
        case '课程':
            router.push('/student/course')
            break
        // case '作业':
        //     router.push('/student/homework')
        //     break
        // case '考试':
        //     router.push('/student/exam')
        // case '日程':
        //     router.push('/student/schedule')
        //     break
        case '计划':
            router.push('/student/plan')
            break
        case 'VSCode': {
            // 使用当前用户的用户名
            const folderName = userInfo.value.studentId
            const vscodeUrl = `http://118.89.136.119:8082/?folder=/home/program/${folderName}`
            
            // 检查本地存储中的"不再提醒"设置
            const noRemind = localStorage.getItem('vscode-permission-no-remind') === 'true'
            
            if (noRemind) {
                window.open(vscodeUrl, '_blank')
                ElMessage.success('成功跳转到VSCode页面')
            } else {
                // 使用 Element Plus 的弹窗
                const noRemindRef = ref(false)
                ElMessageBox({
                    title: '权限提醒',
                    dangerouslyUseHTMLString: true,
                    message: h('div', null, [
                        h('p', null, 'VSCode在线编辑器需要向老师申请使用权限，请确保已经向老师申请并获得授权后再继续访问。'),
                        h('div', { style: 'margin-top: 15px;' }, [
                            h('input', {
                                type: 'checkbox',
                                style: 'margin-right: 8px; vertical-align: middle;',
                                checked: noRemindRef.value,
                                onchange: (event) => {
                                    noRemindRef.value = event.target.checked
                                    if (event.target.checked) {
                                        localStorage.setItem('vscode-permission-no-remind', 'true')
                                    }
                                }
                            }),
                            h('span', { style: 'vertical-align: middle;' }, '不再提醒')
                        ])
                    ]),
                    showCancelButton: true,
                    confirmButtonText: '继续访问',
                    cancelButtonText: '取消',
                    type: 'warning',
                    closeOnClickModal: false,
                    closeOnPressEscape: false
                }).then(action => {
                    if (action === 'confirm') {
                        window.open(vscodeUrl, '_blank')
                        ElMessage.success('成功跳转到VSCode页面')
                    }
                }).catch(() => {})
            }
            break
        }
        case '设置':
            router.push('/student/settings')
            ElMessage.success(`切换到设置页面`)
            break
        default:
            router.push(`/student/${menu.name.toLowerCase()}`)
            ElMessage.success(`切换到${menu.name}页面`)
            break
    }
}

// 用户操作
function handleUserAction(action) {
    if (action === 'profile') {
        getValidToken();
        console.log('个人中心')
        ElMessage.success('进入个人中心')
    }

    if (action === 'changePassword') {
        console.log('修改密码')
        ElMessage.success('修改密码成功')
    }
    
    if (action === 'clearMenuActive') {
        // 清空左侧导航栏选中状态
        activeMenu.value = ''
        console.log('清空导航栏选中状态')
    }
}

function handleAvatarChange(newAvatarUrl) {
    avatarUrl.value = newAvatarUrl
    ElMessage.success('头像更新成功')
}

// 滚动到聊天底部
function scrollToBottom() {
    nextTick(() => {
        if (chatBodyRef.value) {
            chatBodyRef.value.scrollTop = chatBodyRef.value.scrollHeight
        }
    })
}

// 建议点击函数
function suggestClick(suggest) {
    // 检查是否有对应的模拟数据
    if (mockDataConfig[suggest]) {
        // 使用模拟数据，以流式方式显示
        showMockStreamingResponse(suggest)
        return
    }
    
    // 如果没有模拟数据，使用正常的聊天功能
    chatInput.value = suggest
    sendChat()
}

// 显示模拟数据的流式响应
function showMockStreamingResponse(suggest) {
    // 添加用户消息
    chatMessages.value.push({ role: 'user', content: suggest })
    
    // 开始流式显示
    isStreaming.value = true
    streamingContent.value = ''
    
    // 获取对应的模拟数据
    const mockData = mockDataConfig[suggest]
    
    let sentenceIndex = 0
    let charIndex = 0
    let currentSentence = mockData[sentenceIndex] || ''
    
    const streamInterval = setInterval(() => {
        if (sentenceIndex < mockData.length) {
            // 逐字符显示当前句子
            if (charIndex < currentSentence.length) {
                streamingContent.value += currentSentence[charIndex]
                charIndex++
                scrollToBottom()
            } else {
                // 当前句子显示完成，添加空格并准备下一句
                streamingContent.value += ' '
                sentenceIndex++
                charIndex = 0
                currentSentence = mockData[sentenceIndex] || ''
                
                // 如果还有下一句，继续显示
                if (sentenceIndex < mockData.length) {
                    // 短暂停顿，模拟思考
                    setTimeout(() => {
                        // 继续下一句
                    }, 100)
                }
            }
        } else {
            // 所有内容显示完成
            clearInterval(streamInterval)
            isStreaming.value = false
            
            // 添加到聊天记录
            chatMessages.value.push({
                role: 'assistant',
                content: streamingContent.value.trim()
            })
            
            // 清空流式内容
            streamingContent.value = ''
        }
    }, 50) // 每50ms显示一个字符，模拟真实的打字效果
}

function handleSearchInput(value) {
    searchValue.value = value
    console.log('搜索输入:', value)
}

function handleSearch(value) {
    console.log('执行搜索:', value)
    ElMessage.success(`正在搜索: ${value}`)
    // 这里可以添加实际的搜索逻辑
}

async function sendChat() {
    if (!chatInput.value.trim() || isChatLoading.value || isStreaming.value) return

    const userMessage = chatInput.value.trim()
    chatInput.value = ''

    // 添加用户消息到聊天记录
    chatMessages.value.push({ role: 'user', content: userMessage })

    // 滚动到底部
    scrollToBottom()

    // 设置加载状态
    isChatLoading.value = true

    try {
        // 获取学生信息
        const studentInfo = getUserInfo()
        if (!studentInfo || !studentInfo.studentId || studentInfo.studentId === 'default-student-id') {
            throw new Error('无法获取学生信息，请重新登录')
        }

        // 准备历史消息数据
        const historyData = {
            messages: chatMessages.value.map(msg => ({
                role: msg.role,
                content: msg.content
            })),
            valid: true
        }

        // 尝试使用流式聊天
        try {
            await handleStreamChat(historyData)
        } catch (streamError) {
            console.warn('流式聊天失败，回退到普通聊天:', streamError)
            // 回退到普通聊天接口
            await handleNormalChat(studentInfo.studentId, historyData)
        }

    } catch (error) {
        console.error('AI聊天失败:', error)
        await handleChatError(error)
    } finally {
        // 关闭加载状态
        isChatLoading.value = false
        isStreaming.value = false
        streamingContent.value = ''
    }
}

// 处理流式聊天
async function handleStreamChat(historyData) {
    isChatLoading.value = false
    isStreaming.value = true
    streamingContent.value = ''

    try {
        const stream = await studentAssistantAPI.streamChatHistory(historyData)

        // 处理流式响应
        const reader = stream.getReader()
        const decoder = new TextDecoder()

        // eslint-disable-next-line no-constant-condition
        while (true) {
            const { done, value } = await reader.read()

            if (done) break

            const chunk = decoder.decode(value, { stream: true })
            const lines = chunk.split('\n')

            for (const line of lines) {
                if (line.startsWith('data: ')) {
                    const data = line.slice(6).trim()
                    if (data === '[DONE]') {
                        // 流式输出完成
                        chatMessages.value.push({
                            role: 'assistant',
                            content: streamingContent.value
                        })
                        return
                    }

                    try {
                        const parsed = JSON.parse(data)
                        if (parsed.content) {
                            streamingContent.value += parsed.content
                            scrollToBottom()
                        }
                    } catch (parseError) {
                        console.warn('解析流数据失败:', parseError)
                    }
                }
            }
        }

        // 如果没有收到[DONE]信号，也要保存内容
        if (streamingContent.value) {
            chatMessages.value.push({
                role: 'assistant',
                content: streamingContent.value
            })
        }

    } catch (error) {
        console.error('流式聊天处理失败:', error)
        throw error
    }
}

// 处理普通聊天
async function handleNormalChat(studentId, historyData) {
    const response = await studentAssistantAPI.askWithHistory(studentId, historyData)

    if (response && response.answer) {
        chatMessages.value.push({
            role: 'assistant',
            content: response.answer
        })
        scrollToBottom()
    } else {
        throw new Error('AI回复格式错误')
    }
}

// 处理聊天错误
async function handleChatError(error) {
    let errorMessage = 'AI聊天服务暂时不可用'
    let fallbackResponse = '抱歉，我现在无法回答您的问题。请稍后再试。'

    if (error.code === 'ECONNABORTED' || error.message.includes('timeout')) {
        errorMessage = 'AI响应超时，请稍后重试'
        fallbackResponse = '您的问题我收到了，但由于网络或服务繁忙，响应时间较长。请稍后重试，或者尝试简化您的问题。'
    } else if (error.response?.status === 401) {
        errorMessage = '登录已过期，请重新登录'
        fallbackResponse = '您的登录状态已过期，请重新登录后继续使用AI助手。'
    } else if (error.response?.status >= 500) {
        errorMessage = '服务器暂时不可用'
        fallbackResponse = '服务器正在维护中，请稍后再试。如果问题持续存在，请联系管理员。'
    }

    try {
        // 添加友好的错误回复
        chatMessages.value.push({
            role: 'assistant',
            content: fallbackResponse
        })
        scrollToBottom()
    } catch (fallbackError) {
        console.error('添加错误回复失败:', fallbackError)
    }

    // 显示错误提示
    ElMessage.error(errorMessage)
}

// 添加fetchStudentData函数实现
function fetchStudentData() {
    // 从localStorage获取学生信息
    console.log('获取学生数据')
    // 从localStorage获取学生信息
    const userInfo = getUserInfo();

    // 如果没有真实的用户信息，重定向到登录页
    if (!userInfo) {
        console.warn('未找到真实用户信息，可能需要重新登录')
        // 清除localStorage，退出登录
        clearAuth();
        // 重定向到登录页
        router.push('/login')
        return null
    }

    return userInfo
}

// 格式化消息内容
function formatMessage(content) {
    if (!content) return ''
    // 使用marked库渲染Markdown为HTML
    return marked.parse(content)
}

// 复制消息内容
function copyMessage(content) {
    if (!content) return

    // 使用现代的Clipboard API
    if (navigator.clipboard && window.isSecureContext) {
        navigator.clipboard.writeText(content).then(() => {
            ElMessage.success('已复制到剪贴板')
        }).catch(err => {
            console.error('复制失败:', err)
            fallbackCopy(content)
        })
    } else {
        fallbackCopy(content)
    }
}

// 备用复制方法
function fallbackCopy(content) {
    const textArea = document.createElement('textarea')
    textArea.value = content
    textArea.style.position = 'fixed'
    textArea.style.left = '-999999px'
    textArea.style.top = '-999999px'
    document.body.appendChild(textArea)
    textArea.focus()
    textArea.select()

    try {
        document.execCommand('copy')
        ElMessage.success('已复制到剪贴板')
    } catch (err) {
        console.error('复制失败:', err)
        ElMessage.error('复制失败，请手动复制')
    }

    document.body.removeChild(textArea)
}

// 重新生成消息
async function regenerateMessage(messageIndex) {
    if (messageIndex <= 0 || messageIndex >= chatMessages.value.length) {
        ElMessage.error('无法重新生成此消息')
        return
    }

    // 找到对应的用户问题
    const userMessageIndex = messageIndex - 1
    const userMessage = chatMessages.value[userMessageIndex]

    if (!userMessage || userMessage.role !== 'user') {
        ElMessage.error('无法找到对应的问题')
        return
    }

    // 移除当前AI回答及之后的所有消息
    chatMessages.value.splice(messageIndex)

    // 重新发送问题
    chatInput.value = userMessage.content
    await sendChat()
}

// 添加处理邀请码的函数
function handleJoinCourse(code) {
    console.log('收到邀请码:', code)

    if (!userInfo.value || !userInfo.value.studentId) {
        ElMessage.error('无法获取学生信息，请重新登录')
        return
    }

    // 显示加载中提示
    const loading = ElLoading.service({
        lock: true,
        text: '正在加入课程...',
        background: 'rgba(0, 0, 0, 0.7)'
    })

    // 调用API通过邀请码加入课程
    courseSelectionAPI.joinByInviteCode(userInfo.value.studentId, code)
        .then(response => {
            loading.close()
            ElMessage.success('成功加入课程!')
            console.log(response);


            // 如果当前在首页，刷新课程列表
            if (router.currentRoute.value.path === '/student/home') {
                // 触发课程列表刷新
                window.dispatchEvent(new CustomEvent('refresh-courses'))
            }
        })
        .catch(error => {
            loading.close()
            ElMessage.error('加入课程失败: ' + (error.message || '邀请码无效'))
        })
}
</script>

<style scoped>
.student-center {
    height: 100vh;
    display: flex;
    flex-direction: column;
    background: #f5f7fa;
    overflow: hidden;
}

/* 覆盖Element Plus按钮样式 */
:deep(.el-button) {
    border-color: transparent !important;
}

:deep(.sidebar .menu-container .menu-btn) {
    padding: 12px 20px !important;
}

:deep(.el-button:hover),
:deep(.el-button:focus) {
    border-color: transparent !important;
    box-shadow: none !important;
    outline: none !important;
}

:deep(.el-button--plain:hover) {
    border-color: transparent !important;
    background-color: #f5f7fa;
}

:deep(.el-button--plain:focus) {
    border-color: transparent !important;
    background-color: transparent;
}

.main-content {
    flex: 1;
    display: flex;
    overflow: hidden;
    margin: 0;
    padding: 0;
}

.sidebar {
    width: 100px;
    background: #2e3a4f;
    color: #fff;
    padding: 0 0 24px 0;
    display: flex;
    flex-direction: column;
    align-items: center;
    box-shadow: 2px 0 8px rgba(0, 0, 0, 0.15);
    position: relative;
    z-index: 5;
    margin-top: 0;
    /* Remove any top margin */
    overflow-y: auto;
}

.sidebar-divider {
    width: 80%;
    height: 1px;
    background: rgba(255, 255, 255, 0.1);
    margin-bottom: 10px;
}

.menu-container {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 8px;
    width: 100%;
    padding-top: 10px;
}

.menu-btn {
    box-sizing: border-box;
    width: 100px;
    font-size: 14px;
    transition: all 0.3s;
    border: none;
    position: relative;
    overflow: hidden;
    text-align: center;
    justify-content: center;
    display: flex;
    align-items: center;
    padding: 12px 0;
    margin: 0;
    cursor: pointer;
    background-color: transparent;
    color: rgba(255, 255, 255, 0.7);
    font-weight: 500;
    padding-left: 24px;
}

.menu-btn:hover {
    background: rgba(255, 255, 255, 0.1);
    color: #fff;
}

.menu-btn-active {
    background: rgba(255, 255, 255, 0.15) !important;
    color: #fff !important;
    position: relative;
}

.menu-btn-active::after {
    content: '';
    position: absolute;
    left: 0;
    top: 50%;
    height: 60%;
    width: 4px;
    background: #4b8de6;
    transform: translateY(-50%);
    border-radius: 0 2px 2px 0;
}

.menu-icon {
    margin-right: 12px;
    font-size: 16px;
}

.content-area {
    flex: 1;
    padding: 20px 32px 100px 32px; /* 大幅增加底部padding */
    background: #f5f7fa;
    min-width: 0;
    overflow-y: auto;
    min-height: calc(100vh - 60px); /* 最小高度为视口高度减去导航栏高度 */
    height: auto; /* 高度自适应内容 */
    display: flex;
    flex-direction: column;
    position: relative; /* 添加相对定位 */
}

.content-placeholder {
    color: #aaa;
    font-size: 18px;
    text-align: center;
    margin-top: 100px;
}

.ai-chat-entry {
    position: fixed;
    right: 20px;
    bottom: 20px;
    width: 60px;
    height: 60px;
    background: #fff;
    border: 1px solid rgba(0, 0, 0, 0.05);
    border-radius: 50%;
    box-shadow: 0 4px 15px rgba(0, 0, 0, 0.1);
    display: flex;
    align-items: center;
    justify-content: center;
    color: #409eff;
    cursor: pointer;
    font-size: 15px;
    z-index: 100;
    transition: transform 0.3s, box-shadow 0.3s;
}

.ai-chat-entry:hover {
    transform: translateY(-3px);
    box-shadow: 0 6px 20px rgba(64, 158, 255, 0.25);
}

/* AI聊天弹窗样式 */
.slide-up-enter-active,
.slide-up-leave-active {
    transition: all 0.4s cubic-bezier(.25, .8, .25, 1);
}

.slide-up-enter-from,
.slide-up-leave-to {
    transform: translateY(100%);
    opacity: 0;
}

.ai-chat-modal {
    position: fixed;
    right: 0;
    top: 60px;
    /* 导航栏高度，根据实际情况调整 */
    bottom: 0;
    width: 400px;
    height: auto;
    background: #fff;
    border-radius: 12px 0 0 0;
    box-shadow: 0 8px 30px rgba(0, 0, 0, 0.15);
    display: flex;
    flex-direction: column;
    z-index: 200;
    border: 1px solid rgba(0, 0, 0, 0.05);
    overflow: hidden;
}

/* 拖动调整大小的区域 */
.resize-handle {
    position: absolute;
    left: 0;
    top: 0;
    width: 6px;
    height: 100%;
    cursor: ew-resize;
    background-color: transparent;
    z-index: 300;
}

.resize-handle:hover,
.resize-handle:active {
    background-color: rgba(64, 158, 255, 0.1);
}

.ai-chat-header {
    height: 48px;
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 0 18px;
    border-bottom: 1px solid rgba(0, 0, 0, 0.05);
    font-weight: 500;
    font-size: 16px;
    background: linear-gradient(135deg, #f9fcff, #f6f9fc);
    color: #303133;
}

.close-icon {
    cursor: pointer;
    font-size: 20px;
    color: #909399;
    transition: color 0.2s;
}

.close-icon:hover {
    color: #f56c6c;
}

.ai-chat-body {
    flex: 1;
    padding: 16px 18px;
    overflow-y: auto;
    background: #f9fbfd;
    scroll-behavior: smooth;
}

.chat-suggestions-horizontal {
    width: 100%;
    display: flex;
    flex-wrap: wrap;
    justify-content: center;
    margin-bottom: 10px;
    gap: 6px;
}

.suggest-btn-horizontal {
    border-radius: 10px;
    background: rgba(64, 158, 255, 0.08);
    color: #4b8de6;
    border: none;
    font-size: 12px;
    padding: 0 10px;
    height: 22px;
    line-height: 20px;
    transition: background 0.2s;
    text-align: center;
    margin: 0;
}

.suggest-btn-horizontal:hover {
    background: rgba(64, 158, 255, 0.15);
    color: #409eff;
    transform: translateY(-1px);
}

.chat-message {
    margin-bottom: 16px;
    font-size: 15px;
    display: flex;
    width: 100%;
    position: relative;
}

.chat-message-content {
    display: inline-block;
    max-width: 85%;
    text-align: left;
    padding: 10px 14px;
    border-radius: 12px;
    background: #fff;
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.04);
    border: 1px solid rgba(0, 0, 0, 0.03);
    position: relative;
    word-break: break-word;
}

.message-text {
    line-height: 1.6;
    word-wrap: break-word;
}

.message-text :deep(pre) {
    background: #f5f5f5;
    padding: 8px 12px;
    border-radius: 4px;
    margin: 8px 0;
    overflow-x: auto;
    font-family: 'Courier New', monospace;
    font-size: 13px;
}

.message-text :deep(code) {
    background: #f0f0f0;
    padding: 2px 4px;
    border-radius: 3px;
    font-family: 'Courier New', monospace;
    font-size: 13px;
}

.message-text :deep(strong) {
    font-weight: 600;
}

.message-actions {
    margin-top: 8px;
    display: flex;
    gap: 8px;
    opacity: 0;
    transition: opacity 0.2s;
}

.chat-message-content:hover .message-actions {
    opacity: 1;
}

.message-actions .el-button {
    padding: 2px 6px;
    font-size: 12px;
    height: auto;
    color: #909399;
}

.message-actions .el-button:hover {
    color: #409eff;
}

.streaming-indicator {
    margin-top: 8px;
    display: flex;
    align-items: center;
    gap: 8px;
}

.streaming-text {
    font-size: 12px;
    color: #909399;
    font-style: italic;
    animation: pulse 1.5s infinite;
}

@keyframes pulse {
    0%, 100% { opacity: 0.6; }
    50% { opacity: 1; }
}

.typing-dots {
    display: inline-flex;
    gap: 3px;
}

.typing-dots span {
    width: 4px;
    height: 4px;
    border-radius: 50%;
    background: #409eff;
    animation: typing-dots 1.4s infinite ease-in-out;
}

.typing-dots span:nth-child(1) {
    animation-delay: -0.32s;
}

.typing-dots span:nth-child(2) {
    animation-delay: -0.16s;
}

@keyframes typing-dots {
    0%, 80%, 100% {
        opacity: 0.3;
        transform: scale(0.8);
    }
    40% {
        opacity: 1;
        transform: scale(1);
    }
}

.chat-message-user {
    justify-content: flex-end;
}

.chat-message-ai {
    justify-content: flex-start;
}

.chat-message-user .chat-message-content {
    background: #ecf5ff;
    border-color: #d9ecff;
    color: #303133;
    border-bottom-right-radius: 3px;
}

.chat-message-ai .chat-message-content {
    background: #fff;
    border-color: rgba(0, 0, 0, 0.05);
    border-bottom-left-radius: 3px;
}

.chat-message-user .chat-message-content::after {
    content: '';
    position: absolute;
    right: -6px;
    bottom: 0;
    width: 12px;
    height: 12px;
    background: #ecf5ff;
    border-right: 1px solid #d9ecff;
    border-bottom: 1px solid #d9ecff;
    transform: rotate(-45deg) translate(4px, 0);
    border-radius: 0 0 4px 0;
}

.chat-message-ai .chat-message-content::after {
    content: '';
    position: absolute;
    left: -6px;
    bottom: 0;
    width: 12px;
    height: 12px;
    background: #fff;
    border-left: 1px solid rgba(0, 0, 0, 0.05);
    border-bottom: 1px solid rgba(0, 0, 0, 0.05);
    transform: rotate(45deg) translate(-4px, 0);
    border-radius: 0 0 0 4px;
}

.chat-role {
    font-weight: bold;
    margin-right: 4px;
    color: #409eff;
}

.typing-indicator {
    color: #909399;
    font-style: italic;
    animation: typing 1.5s infinite;
}

@keyframes typing {
    0%, 50% { opacity: 1; }
    51%, 100% { opacity: 0.5; }
}

.chat-input-row {
    display: flex;
    align-items: center;
    width: 100%;
    gap: 8px;
}

.chat-input-full {
    width: 100%;
    margin-bottom: 0;
    margin-top: 0;
}

.ai-chat-footer {
    position: relative;
    display: flex;
    flex-direction: column;
    padding: 10px 18px;
    border-top: 1px solid rgba(0, 0, 0, 0.05);
    background: #fff;
    box-shadow: 0 -2px 10px rgba(0, 0, 0, 0.03);
}

/* 确保所有文字都是横向显示的 */
:deep(.el-dropdown-menu__item),
:deep(.el-button),
:deep(.user-name),
:deep(.el-avatar),
:deep(.el-dropdown) {
    writing-mode: horizontal-tb !important;
}

/* VSCode权限弹窗样式 */
:deep(.vscode-permission-dialog) {
    .el-message-box__content {
        padding: 20px;
    }

    .el-message-box__container {
        position: relative;
        padding-bottom: 30px;
    }

    .el-checkbox {
        position: absolute;
        bottom: 0;
        left: 0;
        margin: 0;
        font-size: 14px;
    }
}
</style>
