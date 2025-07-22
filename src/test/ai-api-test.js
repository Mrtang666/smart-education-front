// AI接口测试文件
import { aiAssistantAPI } from '@/api/api'

// 测试基于课程生成习题接口
export const testGenerateExerciseByCourse = async () => {
    try {
        console.log('测试基于课程生成习题接口...')
        
        const result = await aiAssistantAPI.generateExerciseByCourse(
            '123', // teacherId (作为studentId参数传递)
            '数学', // courseName
            '中等', // difficultyLevel
            5 // problemCount
        )
        
        console.log('基于课程生成习题成功:', result)
        return result
    } catch (error) {
        console.error('基于课程生成习题失败:', error)
        throw error
    }
}

// 测试基于知识点生成习题接口
export const testGenerateExerciseByKnowledge = async () => {
    try {
        console.log('测试基于知识点生成习题接口...')
        
        const result = await aiAssistantAPI.generateExerciseByKnowledge(
            '123', // teacherId (作为studentId参数传递)
            ['代数', '几何'], // knowledgeNames
            '困难', // difficultyLevel
            3 // problemCount
        )
        
        console.log('基于知识点生成习题成功:', result)
        return result
    } catch (error) {
        console.error('基于知识点生成习题失败:', error)
        throw error
    }
}

// 验证API接口定义
export const validateAPIDefinition = () => {
    console.log('验证AI助手API接口定义...')
    
    // 检查aiAssistantAPI是否存在
    if (!aiAssistantAPI) {
        console.error('aiAssistantAPI 未定义')
        return false
    }
    
    // 检查方法是否存在
    if (typeof aiAssistantAPI.generateExerciseByCourse !== 'function') {
        console.error('generateExerciseByCourse 方法未定义')
        return false
    }
    
    if (typeof aiAssistantAPI.generateExerciseByKnowledge !== 'function') {
        console.error('generateExerciseByKnowledge 方法未定义')
        return false
    }
    
    console.log('AI助手API接口定义验证通过')
    return true
}

// 模拟数据用于测试UI组件
export const mockAIExercises = [
    {
        question: '求解方程 2x + 3 = 7 中 x 的值',
        options: ['x = 1', 'x = 2', 'x = 3', 'x = 4'],
        answer: 'B',
        explanation: '将方程 2x + 3 = 7 移项得到 2x = 4，因此 x = 2',
        difficulty: '简单'
    },
    {
        question: '计算三角形面积，已知底边长为6cm，高为4cm',
        options: ['12 cm²', '24 cm²', '10 cm²', '14 cm²'],
        answer: 'A',
        explanation: '三角形面积公式为 S = (1/2) × 底 × 高 = (1/2) × 6 × 4 = 12 cm²',
        difficulty: '中等'
    },
    {
        question: '已知函数 f(x) = x² - 4x + 3，求 f(x) 的最小值',
        answer: 'f(x) 的最小值为 -1，当 x = 2 时取得',
        explanation: '这是一个开口向上的抛物线，顶点坐标为 (2, -1)，所以最小值为 -1',
        difficulty: '困难'
    }
]
