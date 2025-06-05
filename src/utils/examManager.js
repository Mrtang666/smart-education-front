/**
 * 统一管理考试相关功能
 */

import { examAPI } from '@/api/api'

/**
 * 获取考试状态类型
 * @param {string} status 考试状态
 * @param {Object} exam 考试对象
 * @param {Date} currentTime 当前时间
 * @returns {string} 状态类型
 */
export function getExamStatusType(status, exam, currentTime = new Date()) {
  // 根据考试的开始和结束时间自动判断状态
  const startTime = exam ? new Date(exam.startTime) : null;
  const endTime = exam ? new Date(exam.endTime) : null;
  
  if (startTime && endTime) {
    if (currentTime < startTime) {
      return 'info'; // 未开始
    } else if (currentTime >= startTime && currentTime <= endTime) {
      return 'warning'; // 进行中
    } else if (currentTime > endTime) {
      return 'success'; // 已结束
    }
  }
  
  // 如果无法判断，则使用数据库中存储的状态
  switch(status) {
    case '未开始':
      return 'info'
    case '进行中':
      return 'warning'
    case '已结束':
      return 'success'
    default:
      return 'info'
  }
}

/**
 * 获取考试状态文本
 * @param {Object} exam 考试对象
 * @param {Date} currentTime 当前时间
 * @returns {string} 状态文本
 */
export function getExamStatus(exam, currentTime = new Date()) {
  const startTime = exam ? new Date(exam.startTime) : null;
  const endTime = exam ? new Date(exam.endTime) : null;
  
  if (startTime && endTime) {
    if (currentTime < startTime) {
      return '未开始';
    } else if (currentTime >= startTime && currentTime <= endTime) {
      return '进行中';
    } else if (currentTime > endTime) {
      return '已结束';
    }
  }
  
  // 如果无法判断，则使用数据库中存储的状态
  return exam.status || '未知';
}

/**
 * 更新考试状态
 * @param {Array} exams 考试列表
 * @param {Date} currentTime 当前时间
 * @returns {Promise<Array>} 更新后的考试列表
 */
export async function updateExamsStatus(exams, currentTime = new Date()) {
  if (!exams || exams.length === 0) return exams;
  
  const examUpdates = [];
  
  for (const exam of exams) {
    const startTime = exam.startTime ? new Date(exam.startTime) : null;
    const endTime = exam.endTime ? new Date(exam.endTime) : null;
    let newStatus = null;
    
    if (startTime && endTime) {
      // 根据当前时间判断状态
      if (currentTime < startTime && exam.status !== '未开始') {
        newStatus = '未开始';
      } else if (currentTime >= startTime && currentTime <= endTime && exam.status !== '进行中') {
        newStatus = '进行中';
      } else if (currentTime > endTime && exam.status !== '已结束') {
        newStatus = '已结束';
      }
      
      // 如果状态需要更新
      if (newStatus && newStatus !== exam.status) {
        examUpdates.push({
          exam,
          newStatus
        });
      }
    }
  }
  
  // 批量更新考试状态
  if (examUpdates.length > 0) {
    try {
      for (const update of examUpdates) {
        const examData = {
          examId: update.exam.examId,
          title: update.exam.title,
          description: update.exam.description,
          courseId: update.exam.courseId,
          teacherId: update.exam.teacherId,
          totalScore: update.exam.totalScore,
          durationMinutes: update.exam.durationMinutes,
          startTime: update.exam.startTime,
          endTime: update.exam.endTime,
          status: update.newStatus
        };
        
        await examAPI.updateExam(examData);
        
        // 更新本地状态
        const index = exams.findIndex(e => e.examId === update.exam.examId);
        if (index !== -1) {
          exams[index].status = update.newStatus;
        }
      }
      
      console.log(`已自动更新 ${examUpdates.length} 个考试的状态`);
    } catch (error) {
      console.error('自动更新考试状态失败:', error);
    }
  }
  
  return exams;
}

/**
 * 格式化日期时间
 * @param {string} dateTimeStr 日期时间字符串
 * @returns {string} 格式化后的日期时间
 */
export function formatDateTime(dateTimeStr) {
  if (!dateTimeStr) return '';
  
  try {
    const date = new Date(dateTimeStr);
    return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')} ${String(date.getHours()).padStart(2, '0')}:${String(date.getMinutes()).padStart(2, '0')}`;
  } catch (error) {
    return dateTimeStr;
  }
}

/**
 * 自动设置考试状态
 * @param {Object} examData 考试数据
 * @returns {Object} 设置状态后的考试数据
 */
export function setExamStatus(examData) {
  const now = new Date();
  const startTime = new Date(examData.startTime);
  const endTime = new Date(examData.endTime);
  
  if (now < startTime) {
    examData.status = '未开始';
  } else if (now >= startTime && now <= endTime) {
    examData.status = '进行中';
  } else if (now > endTime) {
    examData.status = '已结束';
  }
  
  return examData;
}


