/**
 * AI生成练习的辅助工具函数
 */

/**
 * 带重试机制的AI生成请求
 * @param {Function} apiCall - API调用函数
 * @param {Object} loadingInstance - 加载实例
 * @param {number} maxRetries - 最大重试次数
 * @returns {Promise} API响应
 */
export async function callAIGenerateWithRetry(apiCall, loadingInstance = null, maxRetries = 2) {
  let retryCount = 0
  
  while (retryCount <= maxRetries) {
    try {
      const response = await apiCall()
      return response
      
    } catch (error) {
      retryCount++
      
      if (retryCount > maxRetries) {
        // 重试次数用完，抛出错误
        throw error
      }
      
      // 如果是超时错误且还有重试次数，等待后重试
      if (error.code === 'ECONNABORTED' || error.message.includes('timeout')) {
        console.log(`AI生成超时，正在进行第 ${retryCount} 次重试...`)
        
        if (loadingInstance && loadingInstance.setText) {
          loadingInstance.setText(`AI生成超时，正在进行第 ${retryCount} 次重试...`)
        }
        
        // 等待2秒后重试
        await new Promise(resolve => setTimeout(resolve, 2000))
      } else {
        // 非超时错误，直接抛出
        throw error
      }
    }
  }
}

/**
 * 获取友好的错误提示信息
 * @param {Error} error - 错误对象
 * @returns {string} 友好的错误提示
 */
export function getAIErrorMessage(error) {
  if (error.code === 'ECONNABORTED' || error.message.includes('timeout')) {
    return 'AI生成超时，请尝试减少题目数量或稍后重试'
  } else if (error.response?.status === 405) {
    return 'AI练习生成功能暂时不可用，请联系管理员'
  } else if (error.response?.status === 500) {
    return '服务器繁忙，请稍后重试'
  } else if (error.response?.status === 401) {
    return '登录已过期，请重新登录'
  } else if (error.response?.status === 429) {
    return 'AI生成请求过于频繁，请稍后重试'
  } else if (error.message.includes('Network Error')) {
    return '网络连接失败，请检查网络后重试'
  } else if (error.message.includes('AI练习生成功能暂时不可用')) {
    return error.message
  } else {
    return '生成练习失败，请稍后重试'
  }
}

/**
 * 解析AI生成的题目内容
 * @param {string} aiContent - AI返回的原始内容
 * @returns {Array} 解析后的题目数组
 */
export function parseAIGeneratedQuestions(aiContent) {
  try {
    console.log('解析AI生成的内容:', aiContent)

    if (!aiContent || typeof aiContent !== 'string') {
      console.error('AI内容格式错误:', aiContent)
      return []
    }

    const questions = []

    // 使用正则表达式匹配题目格式：题目[题目序号]: [题目内容] \n答案: [正确答案]\n解析: [题目解析]\n\n
    const questionPattern = /题目\[(\d+)\]:\s*(.*?)\s*\n答案:\s*(.*?)\s*\n解析:\s*(.*?)(?=\n\n|$)/gs

    let match
    while ((match = questionPattern.exec(aiContent)) !== null) {
      const [, questionNumber, content, answer, analysis] = match

      // 判断题目类型
      const questionType = determineQuestionType(content, answer)

      questions.push({
        sequence: parseInt(questionNumber),
        title: `题目${questionNumber}`,
        content: content.trim(),
        type: questionType,
        expectedAnswer: answer.trim(),
        analysis: analysis.trim(),
        score: 10, // 默认10分
        autoGrading: ['SINGLE_CHOICE', 'MULTI_CHOICE', 'FILL_BLANK', 'TRUE_FALSE'].includes(questionType)
      })
    }

    console.log('解析出的题目:', questions)
    return questions

  } catch (error) {
    console.error('解析AI生成题目失败:', error)
    return []
  }
}

/**
 * 判断题目类型
 * @param {string} content - 题目内容
 * @param {string} answer - 答案
 * @returns {string} 题目类型
 */
export function determineQuestionType(content, answer) {
  // 判断是否为选择题
  if (content.includes('A.') || content.includes('A、') ||
      content.includes('B.') || content.includes('B、')) {
    // 检查答案是否包含多个选项
    if (answer.includes(',') || answer.includes('、') || answer.length > 1) {
      return 'MULTI_CHOICE' // 多选题
    } else {
      return 'SINGLE_CHOICE' // 单选题
    }
  }

  // 判断是否为判断题
  if (content.includes('对错') || content.includes('正确') || content.includes('错误') ||
      answer === '对' || answer === '错' || answer === '正确' || answer === '错误' ||
      answer.toLowerCase() === 'true' || answer.toLowerCase() === 'false') {
    return 'TRUE_FALSE'
  }

  // 判断是否为填空题
  if (content.includes('_____') || content.includes('（）') || content.includes('()')) {
    return 'FILL_BLANK'
  }

  // 默认为简答题
  return 'SHORT_ANSWER'
}

/**
 * 获取AI生成建议
 * @param {number} questionCount - 题目数量
 * @param {string} difficultyLevel - 难度等级
 * @returns {string} 建议文本
 */
export function getAIGenerationTips(questionCount, difficultyLevel) {
  const tips = []
  
  if (questionCount > 10) {
    tips.push('题目数量较多，生成时间可能较长')
  }
  
  if (difficultyLevel === '困难') {
    tips.push('困难题目生成时间可能更长')
  }
  
  if (questionCount > 15) {
    tips.push('建议分批生成，避免超时')
  }
  
  return tips.length > 0 ? tips.join('；') : '预计生成时间：30-60秒'
}
