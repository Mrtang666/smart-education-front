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
                            {{ truncateText(suggest, 8) }}
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
    '在实现链表删除节点时，已经将current->next指向了下一个节点，为什么还需要手动释放被删除节点的内存',
    '线程比进程更‘轻量级’，切换开销小。具体解释一下‘开销’主要指的是什么？是保存的数据量更少，还是涉及到了CPU内核态的切换？',
    '在做课程项目时，TCP可靠而UDP不可靠。为什么在视频流传输这种场景里，首选UDP呢？丢包了难道不影响观看吗？',
    '能看懂斐波那契数列的动态规划解法表格，但遇到一个新问题时，还是不知道第一步该怎么定义dp[i]数组的含义。有没有一个通用的思考步骤来解决这类问题？',
    '指针和引用除了语法之外，在底层实现上有什么区别？为什么函数参数传递时有时候用指针，有时候又推荐用引用？'
])

// 模拟数据配置
const mockDataConfig = {
    '在实现链表删除节点时，已经将current->next指向了下一个节点，为什么还需要手动释放被删除节点的内存': [
        '非常好的问题！这触及了C/C++内存管理的核心概念。',
        '',
        '## 核心概念理解',
        '',
        '你说的"将current->next指向下一个节点"是完全正确的，这是**逻辑上**从链表链中移除节点的操作。但是，这仅仅是切断了链表中的"指针链"，而**被删除节点本身占用的内存并没有被归还给操作系统**。',
        '',
        '## 形象比喻',
        '',
        '这就好比：',
        '1. 你有一串珍珠项链（链表）',
        '2. 你用钳子把其中一颗珍珠（要删除的节点）两端的线剪断，然后把前后的珍珠重新连起来（current->next = current->next->next）',
        '3. 现在，项链是完整的了，逻辑上那颗珍珠已经不在了',
        '4. **但是，被剪掉的那颗珍珠依然物理地存在于你的桌子上（内存中），并没有消失**',
        '',
        'free()或delete操作的作用，就是走过去把桌子上那颗没人要的珍珠捡起来，扔回原料桶里，这样以后做新项链时就可以再利用这颗珍珠了。',
        '',
        '## 为什么必须手动释放？',
        '',
        '### 1. 防止内存泄漏 (Memory Leak)',
        '',
        '这是最主要的原因。程序运行时，会向操作系统申请内存。操作系统分配给程序的内存是有限的。如果你只断开链表指针而不释放节点内存，那么这个节点占用的内存就会永远被你的程序占用（直到程序结束），但又无法再被访问到（因为没有任何指针指向它）。',
        '',
        '这种现象就叫"内存泄漏"。如果删除操作很频繁，内存泄漏会不断累积，最终耗尽所有可用内存，导致程序速度变慢、崩溃，或者影响系统其他部分。',
        '',
        '**举个例子：**',
        '',
        '```c',
        '// 只有逻辑删除，会导致内存泄漏',
        'void removeNodeWithoutFree(Node* prev, Node* toDelete) {',
        '    prev->next = toDelete->next; // 逻辑上断开',
        '    // 糟糕！toDelete 占用的内存没有释放！',
        '    // 它现在是一个"孤儿"，无法被访问，也无法被回收。',
        '}',
        '',
        '// 正确的做法：逻辑删除 + 物理释放',
        'void removeNodeWithFree(Node* prev, Node* toDelete) {',
        '    prev->next = toDelete->next; // 1. 逻辑上断开',
        '    free(toDelete);              // 2. 物理上释放内存',
        '}',
        '```',
        '',
        '### 2. 谁申请，谁释放 (Ownership)',
        '',
        '在C/C++中，内存管理的基本原则是"谁用malloc、calloc或new申请了内存，谁就负责在适当的时候用free或delete释放它"。',
        '',
        '链表节点通常是通过malloc/new动态分配来的，这意味着它们存在于**堆(Heap)** 上，而不是**栈(Stack)** 上。栈上的内存会在函数结束时自动回收，但堆上的内存不会，必须手动管理。',
        '',
        '### 3. 保持程序的良好习惯和健壮性',
        '',
        '养成良好的内存管理习惯是写出高质量、健壮C/C++程序的关键。明知有内存泄漏而不处理是一种非常糟糕的编程实践。',
        '',
        '## 另一个形象的比喻',
        '',
        '* **链表指针 (next)**: 像是你通讯录里的"下一个联系人"的电话号码',
        '* **节点内存**: 像是那个联系人实际使用的手机',
        '',
        '你的操作（current->next = current->next->next）就像是：',
        '你把"小李"的电话从"老王"的"下一个联系人"字段里删掉，换成了"小张"的电话。现在，老王再也联系不上小李了。',
        '',
        '* **但是，小李的手机话费还在扣吗？手机还存在吗？**',
        '    * 当然存在！只是没人能通过老王的通讯录找到他了而已',
        '',
        '* free()操作就像是：你不仅从通讯录里删除了小李，还打电话给运营商，把这个号码注销了。这样小李的手机彻底停机，号码资源被回收，可以重新发给别人用了。',
        '',
        '## 其他语言的情况',
        '',
        '你可能会问，为什么在Java、Python、Go这样的语言里好像不需要做这件事？',
        '',
        '这是因为它们采用了**垃圾回收 (Garbage Collection, GC)** 机制。',
        '',
        '在这些语言中，当你将对象之间的引用关系切断（比如将指针设为null）后，垃圾回收器会定期扫描内存。如果它发现一块内存已经没有任何引用指向它（就像被删除的链表节点），就会自动将其释放。',
        '',
        '**但是，C和C++为了追求极致的性能和底层控制，没有内置的垃圾回收机制。** 因此，开发者需要手动承担管理内存的责任。这带来了更大的自由和控制权，同时也带来了更易出错的风险。',
        '',
        '## 总结',
        '',
        '| 操作 | 作用 | 必要性 |',
        '| :--- | :--- | :--- |',
        '| current->next = current->next->next | **逻辑删除**：修改指针，将节点从链表结构中移除 | **必须**，否则链表关系就错了 |',
        '| free(nodeToDelete) | **物理释放**：将节点占用的内存归还给系统，防止内存泄漏 | **必须**，否则会导致内存泄漏，浪费资源 |',
        '',
        '所以，这两个步骤是**相辅相成、缺一不可**的：',
        '',
        '1. **第一步**：确保你的链表数据逻辑正确',
        '2. **第二步**：确保你的程序内存使用健康、高效',
        '',
        '记住：在C/C++中，内存管理是程序员的责任，这也是为什么C/C++能够提供如此高性能的原因之一。'
    ],
    '线程比进程更‘轻量级’，切换开销小。具体解释一下‘开销’主要指的是什么？是保存的数据量更少，还是涉及到了CPU内核态的切换？': [
        '说得好！这是一个非常核心的操作系统概念。"线程比进程更轻量级，切换开销小"这个说法完全正确。这里的"开销"是一个综合性的概念，但我们可以把它拆解为几个具体的、可量化的部分。',
        '',
        '简单来说，**"开销"主要指的是在切换执行单元时，操作系统需要完成的工作量以及由此带来的时间和性能损失。** 这既包括了**保存和恢复的数据量**，也深刻涉及到了 **CPU模式切换（用户态/内核态）** 以及由这些操作引发的**间接开销**（如缓存失效）。',
        '',
        '下面我们来详细分解这些开销：',
        '',
        '---',
        '',
        '## 1. 内存资源上下文的不同（这是数据量的关键）',
        '',
        '这是最根本、最直观的差异。',
        '',
        '* **进程切换：**',
        '    * **需要切换整个"内存空间"**。每个进程都有自己独立的虚拟地址空间（代码段、数据段、堆、栈等）。切换进程时，CPU中负责内存映射的**页表寄存器（Page Table Register）** 必须更新为新进程的页表。',
        '    * **后果**：切换页表后，**TLB（快表，Translation Lookaside Buffer）——CPU中用于加速虚拟地址到物理地址转换的缓存——会几乎完全失效**，需要被清空或大量更新。后续的内存访问不得不直接查页表，速度会非常慢，直到新的TLB被逐渐填满。这是进程切换中最巨大的性能开销之一。',
        '',
        '* **线程切换（同一进程内）：**',
        '    * **不需要切换内存空间**。同一进程下的所有线程共享相同的地址空间（它们看到的是同一份代码、全局变量、堆等）。',
        '    * **后果**：切换时**页表不变，TLB保持有效**。CPU缓存（L1, L2, L3）中已经存在的数据和指令有很大概率仍然对新线程有用，缓存命中率更高。这避免了巨大的内存访问性能损失。',
        '',
        '## 2. 需要保存和恢复的硬件上下文（数据量）',
        '',
        '"上下文"可以理解为当前执行状态的"快照"，切换时必须保存旧状态的快照，然后恢复新状态的快照，才能让执行单元从上次中断的地方继续正确运行。',
        '',
        '* **进程切换：需要保存和恢复海量状态**',
        '    * **CPU寄存器**：通用寄存器（RAX, RBX, ...）、程序计数器（PC）、栈指针（SP）等。',
        '    * **内存管理资源**：页表寄存器（CR3 on x86）的值。（如上所述，这是关键）',
        '    * **其他系统资源**：打开的文件描述符表、信号处理程序、进程优先级、统计信息等。',
        '',
        '* **线程切换：只需保存和恢复少量状态**',
        '    * **CPU寄存器**：通用寄存器、程序计数器（PC）、栈指针（SP）。',
        '    * **为什么这么少？** 因为线程共享了进程的绝大多数资源（地址空间、文件描述符、信号等）。每个线程唯一"私有"的其实就是**执行流（一套寄存器）和栈空间**（栈指针SP用于界定各自的栈）。所以，切换线程本质上就是换一套寄存器和栈指针。',
        '',
        '**结论：从数据量上看，线程需要保存和恢复的数据（主要是寄存器集）远少于进程（寄存器集 + 整个内存映射上下文）。**',
        '',
        '## 3. 内核的介入与模式切换',
        '',
        '* **无论是进程还是线程切换，只要是由操作系统调度器发起的（抢占式调度），就必然需要陷入（Trap）内核态**。因为调度器是操作系统内核的一部分，操作系统的代码执行在更高的特权级（内核态）。',
        '    * 所以，**一次用户态到内核态，再从中断返回用户态的"模式切换"开销，在进程和线程切换中是都存在的**。这部分开销（包括缓存污染、流水线清空等）是相同的。',
        '',
        '* **关键区别在于，进入内核后，需要做的工作量不同**。如前两点所述，内核在完成线程切换时需要操作的元数据（需要保存/恢复的状态、需要更新的数据结构）远少于进程切换。**内核态下的工作开销，线程远小于进程。**',
        '',
        '---',
        '',
        '## 总结与比喻',
        '',
        '**开销主要来自：**',
        '1. **直接数据量**：线程只需切换寄存器，进程还需切换整个内存空间（导致TLB失效）。',
        '2. **内核工作量**：在内核态下，完成线程切换所需的操作远比进程切换简单。',
        '3. **间接性能损失**：进程切换导致TLB和CPU缓存大量失效，后续指令执行速度慢；线程切换则能更好地利用缓存。',
        '',
        '**一个生动的比喻：**',
        '',
        '* **进程切换**就像**换一个公司办公**：',
        '    * 你要收拾你所有的个人物品（保存寄存器）。',
        '    * 你不能再使用原公司的门禁、打印机和文件柜（切换地址空间，TLB失效）。',
        '    * 你去到新公司，要熟悉新的环境、新的同事、新的工作流程（缓存失效，性能下降）。',
        '    * 开销巨大。',
        '',
        '* **线程切换**就像**在同一个公司里，从一个工位换到另一个工位**：',
        '    * 你只需要带走你正在处理的文件和个人水杯（保存寄存器）。',
        '    * 公司大楼、公共设施、文件库全都是原来的，你非常熟悉（地址空间和缓存不变）。',
        '    * 你坐下就能立刻开始工作（性能几乎无影响）。',
        '    * 开销极小。',
        '',
        '因此，"轻量级"和"开销小"是一个综合结论，其核心在于**资源共享**：线程共享了地址空间和系统资源，使得操作系统在切换时需要做的"簿记"工作大大减少，并且对硬件性能（尤其是内存访问性能）的影响也降到了最低。'
    ],
    '在做课程项目时，TCP可靠而UDP不可靠。为什么在视频流传输这种场景里，首选UDP呢？丢包了难道不影响观看吗？': [
        '这是一个非常经典且很好的问题！它触及了网络协议设计中"可靠性"与"实时性"的核心权衡。',
        '',
        '你的直觉是对的：TCP可靠，UDP不可靠，那为什么看视频不怕丢包呢？答案在于：**对于视频流来说，"准时"比"完整"更重要。**',
        '',
        '让我们来分解一下原因：',
        '',
        '---',
        '',
        '## 1. 核心矛盾：TCP的"可靠性"会损害"实时性"',
        '',
        'TCP被设计用于像文件传输、网页加载这样的场景，这些场景要求**数据100%正确且按顺序到达**。为了做到这一点，TCP有一套复杂的机制：',
        '',
        '* **确认与重传 (ACK & Retransmission)**：接收方每收到一个数据包，都必须发回一个"确认"(ACK)。如果发送方没收到ACK，它就认为包丢了，会**重新发送**那个丢失的包。',
        '* **按序交付 (In-order Delivery)**：如果后发的包先到了（网络常见现象），TCP会将它们保存在缓冲区里，一直等到丢失的包被重传并到达后，才把所有数据按顺序交给应用程序。',
        '* **拥塞控制 (Congestion Control)**：当网络繁忙时，TCP会主动降低自己的发送速度，以避免把网络压垮。',
        '',
        '**现在，把这些机制放到视频流场景中看会发生什么：**',
        '',
        '* **重传的致命延迟**：假设视频的第100帧数据包丢了。TCP会发现丢包并请求重传。在等待这个重传包到达的期间，**第101、102、103帧即使已经收到了，也无法被交付给播放器！** 因为TCP必须保证顺序。播放器会因为拿不到新数据而**卡顿、缓冲**。等了几百毫秒后，重传的包终于到了，TCP才把100-103帧一起交给播放器。对用户来说，体验就是视频突然卡住，然后可能快速跳几下赶上进度。**这种卡顿的体验，比偶尔丢一帧导致的花屏/马赛克要糟糕得多。**',
        '',
        '* **拥塞控制的"不合作"**：视频流通常希望以恒定速率（如2Mbps）发送数据，以匹配视频的编码速率。但TCP的拥塞控制机制会不断探测网络带宽，导致发送速率像锯齿一样波动（慢启动、拥塞避免）。这在网络拥堵时是优点，但对于需要稳定码率的实时流媒体来说，它反而会导致视频质量不稳定（一会儿清晰一会儿模糊）或频繁缓冲。',
        '',
        '## 2. UDP的"不可靠"反而提供了所需的"灵活性"',
        '',
        'UDP就像一个"笨"的邮差，它只负责把包裹（数据包）尽力扔出去，不管对方收没收到，也不管顺序。这听起来是缺点，但对视频开发人员来说，这给了他们**完全的掌控权**。',
        '',
        '基于UDP，应用程序可以自己实现一套更适合实时媒体的传输策略：',
        '',
        '* **放弃重传，容忍丢失**：对于实时视频，一个代表几十毫秒画面的数据包如果没能准时到达，那它就已经**失效**了。重传一个已经过期的视频帧毫无意义。更好的策略是：**直接告诉解码器"这一帧丢了"**，然后利用前后的帧来掩盖这个错误（可能会出现瞬间的花屏或马赛克），然后立刻继续播放下一帧。这样能保证视频的**流畅性**。',
        '',
        '* **优先级传输**：视频数据的重要性不是平等的。',
        '    * **I帧**：是关键帧，包含完整的画面信息，是后续帧的基础。如果I帧丢了，后面一大堆帧都无法解码。',
        '    * **P/B帧**：是预测帧，只存储与前一帧的差异信息，数据量小，但依赖前面的帧。',
        '    应用层可以基于UDP实现自己的优先级逻辑，比如为I帧包增加重传机制，而果断丢弃不重要的B帧包。这种**精细化的控制**是TCP无法提供的。',
        '',
        '* **更低的延迟和开销**：UDP没有建立连接的三次握手过程，包头更小（8字节 vs TCP的20字节），也没有确认、重传、拥塞控制算法带来的延迟和CPU开销。这使得它**更快、更轻量**。',
        '',
        '## 所以，丢包了不影响观看吗？',
        '',
        '**影响，但处理方式不同。**',
        '',
        '* **TCP**：试图彻底解决丢包问题（通过重传），但代价是可能引入**卡顿和延迟**。',
        '* **UDP**：承认丢包是网络中不可避免的现象，选择**快速绕过它**，代价是可能引入**瞬间的视频质量下降**（花屏、马赛克）。',
        '',
        '两害相权取其轻。在实时视频领域，**流畅度（低延迟）的优先级高于绝对完美的画质**。短暂的画质问题用户可能都注意不到，但持续的卡顿和缓冲会立刻让用户感到烦躁。',
        '',
        '---',
        '',
        '## 现代实践：UDP之上构建的可靠协议 (QUIC)',
        '',
        '值得注意的是，纯粹的、无控制的UDP流也会在网络拥堵时造成问题。因此，现在的行业最佳实践（如Google的YouTube、VoIP、视频会议等）通常是在UDP的基础上，自己实现一套**针对媒体流优化的、具备部分可靠性**的协议。',
        '',
        '最著名的例子就是 **QUIC** (Quick UDP Internet Connections)，它现在已经是HTTP/3的标准传输协议。QUIC在UDP之上实现了：',
        '* 类似TCP的可靠传输和拥塞控制，但更加高效。',
        '* 更快的连接建立。',
        '* 为每个数据流单独控制可靠性（比如，聊天文字必须可靠重传，视频帧则不用）。',
        '',
        '**总结一下：**',
        '',
        '| 特性 | TCP | UDP (用于视频流) |',
        '| :--- | :--- | :--- |',
        '| **核心目标** | 可靠性、顺序性 | 实时性、低延迟 |',
        '| **丢包处理** | 重传，导致等待和卡顿 | 丢弃或有限重传，接受瑕疵保流畅 |',
        '| **速率控制** | 拥塞控制，速率波动大 | 可定制为恒定码率，更稳定 |',
        '| **控制权** | 操作系统内核控制 | 应用程序开发者控制 |',
        '',
        '所以，视频流选择UDP，并不是因为它"不可靠"，而是因为它"**不固执**"。它把控制权交给了应用程序，让开发者能够根据**视频数据的特性**和**用户体验的优先级**，来实现一种**不同于TCP通用模型的、更智能的"可靠性"**。'
    ],
    '能看懂斐波那契数列的动态规划解法表格，但遇到一个新问题时，还是不知道第一步该怎么定义dp[i]数组的含义。有没有一个通用的思考步骤来解决这类问题？': [
        '非常好！这是一个非常经典的困境，也是从"看懂"到"自己解决"动态规划（DP）问题的关键一步。能看懂表格但无从下手，说明你已经理解了DP的"机制"（填表、状态转移），但还没掌握其"灵魂"（如何定义状态）。',
        '',
        '**定义 `dp[i]`（或 `dp[i][j]` 等）没有唯一的标准答案，但它确实有一套非常有效的通用思考框架。** 遵循以下步骤，你将不再害怕新的DP问题。',
        '',
        '---',
        '',
        '## 动态规划通用思考步骤（"四步曲"）',
        '',
        '这套方法适用于绝大多数DP问题。我们用一个经典问题 **"最大子数组和"** 来贯穿整个步骤作为例子。',
        '**问题描述：** 给定一个整数数组 `nums`，找到一个具有最大和的连续子数组，返回其最大和。',
        '**示例：** `[-2,1,-3,4,-1,2,1,-5,4]`，最大和连续子数组是 `[4,-1,2,1]`，和为 `6`。',
        '',
        '### 第一步：思考"状态"是什么？—— 定义 `dp[i]` 的含义',
        '',
        '这是最关键的一步，也是最难的一步。`dp[i]` 的含义决定了整个解题思路。',
        '',
        '* **核心问题：** 在这个问题中，什么样的"一个情况"可以描述整个解题过程的一个"阶段"？',
        '* **常用套路：**',
        '    1. **题目问什么，`dp[i]` 就定义为什么？** 这是最直接的想法。如果题目求"最大和"，那 `dp[i]` 是否可以定义为 "以第 `i` 个元素结尾的某个子问题的解"？',
        '    2. **寻找子问题：** 想象问题规模在逐渐变大。假设你已经解决了前 `i-1` 个元素的问题，现在加入第 `i` 个元素，如何利用之前的结果推导出包含第 `i` 个元素的新结果？',
        '',
        '* **【最大子数组和】的应用：**',
        '    * 直接定义 `dp[i]` 为 "以 `nums[i]` 为结尾的最大子数组和"。',
        '    * **为什么这么定义？** 因为子数组必须是连续的，"以 `i` 结尾"这个条件强制保证了连续性。我们最终答案就是所有 `dp[i]` 中的最大值。',
        '',
        '> **技巧：** 很多时候，`dp[i]` 的含义不是题目最终要求的东西，而是**为了解决最终问题而必须定义的中间状态**。`"以 i 结尾..."` 是一个极其常见的定义方式。',
        '',
        '### 第二步：确定"状态转移方程"—— 找出 `dp[i]` 和之前状态的关系',
        '',
        '这是DP的核心逻辑，一旦定义好状态，就要像破案一样找出状态之间的关系。',
        '',
        '* **核心问题：** 如何用 `dp[0], dp[1], ..., dp[i-1]` 来推导出 `dp[i]`？',
        '* **思考方式：** 分类讨论。对于 `dp[i]`，通常有几种选择？不同的选择会如何影响结果？',
        '',
        '* **【最大子数组和】的应用：**',
        '    * 对于 `dp[i]`（以 `nums[i]` 结尾的最大和），只有两种选择：',
        '        1. **独自开场：** 前面的子数组和是负的，拖累我，不如我自己从头开始。即：`nums[i]` 自己。',
        '        2. **接上前面的：** 前面的子数组和是正的，对我有增益，我就接上它。即：`dp[i-1] + nums[i]`',
        '    * 我们当然选择利益最大化的那种。所以状态转移方程为：',
        '        **`dp[i] = max(nums[i], dp[i-1] + nums[i])`**',
        '',
        '> **技巧：** 多画图，多模拟一个小例子（比如数组 `[1, -2, 3]`），手动算出每个位置的 `dp[i]`，感受其中的规律。',
        '',
        '### 第三步：确定初始条件—— 基础 case 是什么？',
        '',
        '方程有了，但从哪里开始算起？`dp[0]` 的值是什么？`dp[1]` 依赖 `dp[0]`，所以必须手动给出最基础、不可再分解的状态的值。',
        '',
        '* **【最大子数组和】的应用：**',
        '    * 当 `i = 0` 时，只有一个元素，以它结尾的最大子数组就是它自己。',
        '    * **初始条件：** `dp[0] = nums[0]`',
        '',
        '### 第四步：确定计算顺序和答案形式',
        '',
        '* **计算顺序：** 我们的 `dp[i]` 依赖 `dp[i-1]`，所以自然是从 `i=0` 开始，从小到大遍历。',
        '* **答案形式：** `dp[i]` 的定义是"以 `i` 结尾的最大和"，而题目要求的"全局最大和"可能在任何位置结尾。所以答案不是 `dp[n-1]`，而是所有 `dp[i]` 中的最大值。',
        '',
        '* **【最大子数组和】的应用：**',
        '    * 初始化 `max_sum = dp[0]`。',
        '    * 从 `i=1` 遍历到数组末尾，计算每个 `dp[i]`，并随时更新 `max_sum = max(max_sum, dp[i])`。',
        '    * 最后返回 `max_sum`。',
        '',
        '---',
        '',
        '## 如何应对更复杂的问题（比如二维DP）',
        '',
        '对于像"不同路径"、"背包问题"这类题目，状态通常是二维的 `dp[i][j]`。',
        '',
        '* **定义状态 (`dp[i][j]`)：** 思考两个维度代表什么。通常是"涉及的两个变量"或"问题的两个条件"。',
        '    * **不同路径：** `dp[i][j]` 表示"从起点走到 `(i, j)` 格子的不同路径数目"。',
        '    * **0-1背包问题：** `dp[i][j]` 表示"考虑前 `i` 件物品，在背包容量为 `j` 的情况下所能获得的最大价值"。',
        '',
        '* **状态转移方程：** 思考如何从"左边"、"上边"、"左上角"等相邻状态推导出当前状态。同样是分类讨论（比如，当前物品放还是不放？）。',
        '',
        '## 总结：给你一个万能解题 checklist',
        '',
        '下次遇到新DP问题，就拿着这个清单逐条问自己：',
        '',
        '1. **这道题目的"状态"可能是什么？** (尝试用 `"以 i 结尾..."` 或 `"在 i 条件下..."` 来定义)',
        '2. **`dp` 数组应该是什么维度？含义是什么？** (一维？二维？`dp[i]` 代表什么？)',
        '3. **为了求出 `dp[i]`，有哪些选择？** (通常是几种情况的分支)',
        '4. **这些选择分别会怎样依赖之前的状态？** (写出状态转移方程 `dp[i] = f(dp[i-1], dp[i-2]...)`)',
        '5. **最基础的情况是什么？** (`dp[0]`, `dp[1]`, `dp[0][0]` 应该等于多少？)',
        '6. **我应该按什么顺序填充 `dp` 数组？** (从前到后？从后到前？)',
        '7. **最终答案存储在 `dp` 数组的哪个位置？** (`dp[n]`? `dp[m][n]`? 还是 `max(dp)`?)',
        '',
        '**最后，也是最重要的一点：练习，练习，再练习！**',
        '从简单的经典问题开始（爬楼梯、打家劫舍、股票买卖、编辑距离等），反复运用这个框架去思考和解决。慢慢地，你就会培养出定义状态的"直觉"。你不是不会，只是需要一套方法论和足够的练习来熟悉它。加油！'
    ],
    '指针和引用除了语法之外，在底层实现上有什么区别？为什么函数参数传递时有时候用指针，有时候又推荐用引用？': [
        '这是一个非常核心的C++问题，触及了语言设计的精髓。很多人以为引用只是"语法糖"或"包装后的指针"，但其实它们的区别远不止于语法。',
        '',
        '## 一、底层实现的区别',
        '',
        '虽然C++标准没有规定编译器必须如何实现引用，但在几乎所有的主流编译器（如GCC, Clang, MSVC）中，**引用在底层通常是通过指针来实现的**。',
        '',
        '也就是说，当你使用引用时，编译器在背后悄悄创建了一个指针，并通过这个指针来操作目标对象。然而，这绝不意味着它们就是同一个东西。它们的核心区别在于**编译器对它们施加的"语义规则"和"使用约束"**完全不同。',
        '',
        '我们可以通过一个简单的例子来看反汇编代码。对于以下函数：',
        '',
        '```cpp',
        'void by_pointer(int* p) { *p = 10; }',
        'void by_reference(int& r) { r = 20; }',
        '```',
        '',
        '编译器生成的汇编代码很可能是**几乎完全相同**的。它们都会：',
        '1. 接收一个内存地址（放在寄存器或栈上）。',
        '2. 向这个地址写入一个值。',
        '',
        '所以，在底层性能和机器码层面，它们没有区别。',
        '',
        '## 二、为什么说它们不同？—— 语义与约束',
        '',
        '这才是关键。指针和引用在"如何使用"上有着天壤之别，这些规则决定了它们的适用场景。',
        '',
        '| 特性 | 指针 (Pointer) | 引用 (Reference) |',
        '| :--- | :--- | :--- |',
        '| **初始化** | 可以不初始化（但极度危险）。`int* p;` （野指针） | **必须初始化**。`int& r;` 是编译错误。 |',
        '| **可空性 (Nullability)** | 可以指向 `nullptr`，表示"不指向任何对象"。 | 不能为空。必须总代表一个合法的对象。（注：存在`std::reference_wrapper`等特殊情况，但原生引用不行） |',
        '| **重绑定 (Rebinding)** | 可以改变其指向的对象。`p = &a; p = &b;` | **一旦绑定，终身不变**。不能在其生命周期内改为代表另一个对象。 |',
        '| **操作符** | 使用 `*` 来解引用，`->` 来访问成员。 | 像普通变量一样使用，无需特殊操作符。 |',
        '| **内存地址** | 指针变量本身在内存中有地址（`&p`）。 | 引用本身**不一定占用存储空间**。编译器可能会直接将其优化、替换为原始对象的操作，它只是对象的一个"别名"。 |',
        '| **安全性** | 更灵活，但也更危险（野指针、空指针解引用）。 | 更安全（不能为空、必须初始化），限制了某些危险操作。 |',
        '',
        '---',
        '',
        '## 三、函数参数传递：如何选择？',
        '',
        '基于以上区别，我们可以得出选择指针还是引用的指导原则：',
        '',
        '### **优先使用 `const T&`（常量引用）**',
        '',
        '* **场景**：当函数只需要**读取**参数的值，而不需要修改它，且参数可能是大型结构体或类对象时。',
        '* **为什么**：',
        '    1. **避免拷贝**：传递引用避免了整个对象的复制开销，效率极高。',
        '    2. **保证原对象不被修改**：`const` 关键字保证了函数内部无法修改传入的对象。',
        '    3. **可以绑定到临时对象**：可以接受字面量或表达式结果（右值）。',
        '',
        '    ```cpp',
        '    void printString(const std::string& str) { // 好！避免了std::string的拷贝',
        '        std::cout << str << std::endl;',
        '    }',
        '    printString("Hello World"); // 可以，字面量会构造临时std::string对象',
        '    ```',
        '',
        '### **使用 `T&`（非常量引用）**',
        '',
        '* **场景**：当函数需要**修改**传入的参数时。',
        '* **为什么**：',
        '    1. **语法清晰**：在函数内部，使用引用就像使用普通变量一样，比指针的 `*` 操作符更直观。',
        '    2. **明确意图**：调用者看到函数签名 `func(T&)` 就知道这个参数是会被修改的**输出参数**。',
        '    3. **安全**：调用者必须传入一个已存在的对象，不可能传 `nullptr`。',
        '',
        '    ```cpp',
        '    void increment(int& value) { // 明确表示value会被修改',
        '        value++;',
        '    }',
        '    int a = 5;',
        '    increment(a); // a 变成了 6',
        '    // increment(5); // 错误！不能绑定到字面量',
        '    ```',
        '',
        '### **使用 `T*`（指针）**',
        '',
        '* **场景1**：参数是**可选**的（即可以为空）。函数需要处理"没有提供对象"的情况。',
        '* **为什么**：`nullptr` 提供了一个明确的"无"的语义。',
        '',
        '    ```cpp',
        '    void findPerson(const std::string& name, Person* result) {',
        '        // ... 查找逻辑',
        '        if (found) {',
        '            *result = foundPerson; // 通过指针修改外部对象',
        '        } else {',
        '            result = nullptr; // 或者保持原样，表示没找到',
        '        }',
        '    }',
        '    Person p;',
        '    findPerson("Alice", &p); // 调用者显式取址，表明p可能被修改',
        '    findPerson("Bob", nullptr); // 调用者表明不关心结果',
        '    ```',
        '',
        '* **场景2**：需要操作**指针数组**或在某些需要"重指向"的算法中。',
        '* **场景3**：与C语言接口交互时。C语言没有引用，只有指针。',
        '',
        '* **一个重要的现代C++惯例**：如果你需要一个**可选**的**输出参数**，并且不使用 `nullptr` 表示"无"，请优先考虑使用 `std::optional<T&>`（C++17），它的意图比指针更清晰。',
        '',
        '### **使用 `const T*`（指向常量的指针）**',
        '',
        '* **场景**：类似 `const T&`，但参数是可选的。函数不会修改对象，但可以接受空指针。',
        '',
        '## 总结：一个简单的决策树',
        '',
        '1. **函数需要修改参数吗？**',
        '    * **是** -> 进入2',
        '    * **否** -> 进入3',
        '',
        '2. **参数是必须提供的吗？（不能为空）**',
        '    * **是** -> **使用 `T&`** （更安全，更清晰）',
        '    * **否** -> **使用 `T*`** （表示可选）',
        '',
        '3. **参数是只读的，且可能很大或是类对象？**',
        '    * **是** -> **使用 `const T&`** （避免拷贝，标准做法）',
        '    * **否** -> 如果参数很小（如`int`, `double`），直接**按值传递 `T`** 可能效率更高。',
        '',
        '**核心思想**：**引用代表了"对象本身"**，语法上更干净，约束上更安全。**指针代表了一个"地址"**，它是一个独立的实体，可以为空，可以改变，更灵活但也更易出错。在C++中，你应该根据你想要表达的**语义**来选择，而不是仅仅因为它们底层实现类似就混用。'
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

// 文本截断函数
function truncateText(text, maxLength) {
    if (!text || text.length <= maxLength) {
        return text
    }
    return text.substring(0, maxLength) + '...'
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
    
    // 将数组转换为完整的Markdown文档
    const fullMarkdown = mockData.join('\n\n')
    
    let charIndex = 0
    
    const streamInterval = setInterval(() => {
        if (charIndex < fullMarkdown.length) {
            // 逐字符显示
            streamingContent.value += fullMarkdown[charIndex]
                charIndex++
                scrollToBottom()
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
    }, 30) // 每30ms显示一个字符，模拟真实的打字效果
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
    
    // 配置marked选项以更好地处理Markdown
    marked.setOptions({
        breaks: true, // 允许换行符转换为<br>
        gfm: true,    // 启用GitHub风格的Markdown
        sanitize: false // 允许HTML标签
    })
    
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
    border-left: 4px solid #409eff;
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

.message-text :deep(h1),
.message-text :deep(h2),
.message-text :deep(h3),
.message-text :deep(h4),
.message-text :deep(h5),
.message-text :deep(h6) {
    margin: 16px 0 8px 0;
    font-weight: 600;
    line-height: 1.4;
}

.message-text :deep(h1) { font-size: 1.5em; }
.message-text :deep(h2) { font-size: 1.3em; }
.message-text :deep(h3) { font-size: 1.1em; }

.message-text :deep(p) {
    margin: 8px 0;
    line-height: 1.6;
}

.message-text :deep(ul),
.message-text :deep(ol) {
    margin: 8px 0;
    padding-left: 20px;
}

.message-text :deep(li) {
    margin: 4px 0;
    line-height: 1.5;
}

.message-text :deep(blockquote) {
    border-left: 4px solid #ddd;
    margin: 8px 0;
    padding-left: 12px;
    color: #666;
    font-style: italic;
}

.message-text :deep(table) {
    border-collapse: collapse;
    width: 100%;
    margin: 8px 0;
}

.message-text :deep(th),
.message-text :deep(td) {
    border: 1px solid #ddd;
    padding: 8px 12px;
    text-align: left;
}

.message-text :deep(th) {
    background-color: #f5f5f5;
    font-weight: 600;
}

.message-text :deep(hr) {
    border: none;
    border-top: 1px solid #ddd;
    margin: 16px 0;
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
