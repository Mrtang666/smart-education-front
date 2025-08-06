// 该文件用于处理代码题相关的工具函数
import { codeQuestionAPI } from "@/api/api";
import { ElMessage } from 'element-plus';

/**
 * 验证编程题数据的完整性
 * @param {Object} questionData 编程题数据
 * @returns {Object} 验证结果 {isValid: boolean, message: string}
 */
export const validateCodeQuestion = (questionData) => {
    const { title, description, sampleInputs, sampleOutputs, caseInputs, caseOutputs, referenceAnswer } = questionData;

    // 检查必填字段
    if (!title?.trim()) {
        ElMessage.warning('请填写编程题标题');
        return { isValid: false, message: '标题不能为空' };
    }
    if (!description?.trim()) {
        ElMessage.warning('请填写编程题描述');
        return { isValid: false, message: '描述不能为空' };
    }
    if (!referenceAnswer?.trim()) {
        ElMessage.warning('请填写参考答案');
        return { isValid: false, message: '参考答案不能为空' };
    }

    // 检查示例输入输出对应关系
    if (!Array.isArray(sampleInputs) || !Array.isArray(sampleOutputs)) {
        ElMessage.error('示例输入输出格式错误');
        return { isValid: false, message: '示例输入输出必须是数组' };
    }
    if (sampleInputs.length !== sampleOutputs.length) {
        ElMessage.error('示例输入输出数量不匹配');
        return { isValid: false, message: '示例输入输出数量必须一致' };
    }
    if (sampleInputs.some(input => !input.trim()) || sampleOutputs.some(output => !output.trim())) {
        ElMessage.warning('示例输入输出不能有空值');
        return { isValid: false, message: '示例输入输出不能有空值' };
    }

    // 检查测试用例输入输出对应关系
    if (!Array.isArray(caseInputs) || !Array.isArray(caseOutputs)) {
        ElMessage.error('测试用例格式错误');
        return { isValid: false, message: '测试用例输入输出必须是数组' };
    }
    if (caseInputs.length !== caseOutputs.length) {
        ElMessage.error('测试用例输入输出数量不匹配');
        return { isValid: false, message: '测试用例输入输出数量必须一致' };
    }
    if (caseInputs.some(input => !input.trim()) || caseOutputs.some(output => !output.trim())) {
        ElMessage.warning('测试用例输入输出不能有空值');
        return { isValid: false, message: '测试用例输入输出不能有空值' };
    }

    ElMessage.success('验证通过');
    return { isValid: true, message: '验证通过' };
};

/**
 * 创建或更新编程题
 * @param {Object} questionData 编程题数据
 * @param {number} [questionData.id] 编程题ID（更新时需要）
 * @returns {Promise<Object>} 创建或更新后的编程题数据
 */
export const saveOrUpdateCodeQuestion = async (questionData) => {
    const validation = validateCodeQuestion(questionData);
    if (!validation.isValid) {
        ElMessage.error(validation.message);
        return false;
    }

    try {
        let result;
        if (questionData.id) {
            result = await codeQuestionAPI.updateCodeQuestion(questionData);
            ElMessage.success('更新编程题成功');
        } else {
            result = await codeQuestionAPI.saveCodeQuestion(questionData);
            ElMessage.success('创建编程题成功');
        }
        return result;
    } catch (error) {
        console.error('保存编程题失败:', error);
        ElMessage.error(error.response?.data?.message || '保存编程题失败，请稍后重试');
        return false;
    }
};

/**
 * 格式化编程题数据用于展示
 * @param {Object} question 编程题数据
 * @returns {Object} 格式化后的编程题数据
 */
export const formatCodeQuestion = (question) => {
    return {
        ...question,
        createdAt: new Date(question.createdAt).toLocaleString(),
        updatedAt: new Date(question.updatedAt).toLocaleString(),
        sampleInputs: Array.isArray(question.sampleInputs) ? question.sampleInputs : [],
        sampleOutputs: Array.isArray(question.sampleOutputs) ? question.sampleOutputs : [],
        caseInputs: Array.isArray(question.caseInputs) ? question.caseInputs : [],
        caseOutputs: Array.isArray(question.caseOutputs) ? question.caseOutputs : []
    };
};

/**
 * 创建新的编程题默认数据
 * @param {number} examId 考试ID
 * @returns {Object} 默认的编程题数据
 */
export const createEmptyCodeQuestion = (examId) => {
    return {
        examId,
        title: '',
        description: '',
        sampleInputs: [''],
        sampleOutputs: [''],
        caseInputs: [''],
        caseOutputs: [''],
        referenceAnswer: ''
    };
};

/**
 * 添加示例输入输出对
 * @param {Object} question 编程题数据
 * @returns {Object} 更新后的编程题数据
 */
export const addSamplePair = (question) => {
    return {
        ...question,
        sampleInputs: [...question.sampleInputs, ''],
        sampleOutputs: [...question.sampleOutputs, '']
    };
};

/**
 * 删除示例输入输出对
 * @param {Object} question 编程题数据
 * @param {number} index 要删除的索引
 * @returns {Object} 更新后的编程题数据
 */
export const removeSamplePair = (question, index) => {
    if (question.sampleInputs.length <= 1) {
        ElMessage.warning('至少需要保留一组示例输入输出');
        return question;
    }
    const newInputs = [...question.sampleInputs];
    const newOutputs = [...question.sampleOutputs];
    newInputs.splice(index, 1);
    newOutputs.splice(index, 1);
    return {
        ...question,
        sampleInputs: newInputs,
        sampleOutputs: newOutputs
    };
};

/**
 * 添加测试用例输入输出对
 * @param {Object} question 编程题数据
 * @returns {Object} 更新后的编程题数据
 */
export const addCasePair = (question) => {
    return {
        ...question,
        caseInputs: [...question.caseInputs, ''],
        caseOutputs: [...question.caseOutputs, '']
    };
};

/**
 * 删除测试用例输入输出对
 * @param {Object} question 编程题数据
 * @param {number} index 要删除的索引
 * @returns {Object} 更新后的编程题数据
 */
export const removeCasePair = (question, index) => {
    if (question.caseInputs.length <= 1) {
        ElMessage.warning('至少需要保留一组测试用例');
        return question;
    }
    const newInputs = [...question.caseInputs];
    const newOutputs = [...question.caseOutputs];
    newInputs.splice(index, 1);
    newOutputs.splice(index, 1);
    return {
        ...question,
        caseInputs: newInputs,
        caseOutputs: newOutputs
    };
};

/**
 * 检查编程题数据是否被修改
 * @param {Object} original 原始数据
 * @param {Object} current 当前数据
 * @returns {boolean} 是否被修改
 */
export const isCodeQuestionModified = (original, current) => {
    const fields = ['title', 'description', 'referenceAnswer'];
    const arrayFields = ['sampleInputs', 'sampleOutputs', 'caseInputs', 'caseOutputs'];

    // 检查普通字段
    for (const field of fields) {
        if (original[field] !== current[field]) {
            return true;
        }
    }

    // 检查数组字段
    for (const field of arrayFields) {
        if (original[field].length !== current[field].length) {
            return true;
        }
        for (let i = 0; i < original[field].length; i++) {
            if (original[field][i] !== current[field][i]) {
                return true;
            }
        }
    }

    return false;
};

