const TOKEN_KEY = 'access_token';
const REFRESH_TOKEN_KEY = 'refresh_token';
const TOKEN_EXPIRY_KEY = 'token_expiry';  // 用于存储token过期时间
const USER_INFO_KEY = 'user_info';

import { ElMessage } from 'element-plus';

// 避免循环依赖，将API调用移到函数内部
/**
 * 获取访问token
 * @returns {string|null} 访问token或null
 */
export function getToken() {
  // 先尝试获取当前token
  const token = localStorage.getItem(TOKEN_KEY);
  if (!token) {
    console.warn('localStorage中没有token');
    return null;
  }
  
  // 检查token是否可能过期
  if (isTokenExpired()) {
    console.warn('token可能已过期，建议刷新');
    // 注意：这里不返回null，因为token还是可能有效的
    // 刷新token的逻辑由API拦截器处理
  }
  
  // 记录token获取，便于调试
  console.log(`从存储获取token: ${token.substring(0, 15)}...`);
  return token;
}

/**
 * 获取有效token，优先使用新鲜的token
 * 此方法可供API请求使用，确保使用最有效的token
 * @returns {string} 有效的token
 */
export function getValidToken() {
  const token = localStorage.getItem(TOKEN_KEY);
  
  if (!token) {
    console.warn('localStorage中没有token');
    return null;
  }
  
  // 检查token是否可能过期但不立即拒绝
  if (isTokenExpired()) {
    // 获取刷新token
    const refreshToken = getRefreshToken();
    if (!refreshToken) {
      console.warn('没有刷新token可用');
      return token; // 返回可能过期的token
    }
    
    // 刷新token操作移到API层处理，避免循环依赖
    console.log('token即将过期，请求时将尝试刷新');
  }
  
  // 确保token不包含Bearer前缀
  return cleanupToken(token);
}

/**
 * 检查token是否过期
 * @returns {boolean} 是否过期
 */
export function isTokenExpired() {
  const expiryTime = localStorage.getItem(TOKEN_EXPIRY_KEY);
  if (!expiryTime) return false;  // 没有过期时间，默认不过期
  
  return parseInt(expiryTime) < Date.now();
}

/**
 * 设置token及其过期时间
 * @param {string} token - 要设置的token值
 * @param {number} [expiryInMinutes=30] - token过期时间（分钟）
 */
export function setToken(token, expiryInMinutes = 4) {
  if (!token) {
    console.warn('尝试设置空token');
    return;
  }
  
  // 确保token不带无关前缀再存储
  const cleanToken = cleanupToken(token);
  console.log(`设置token到存储: ${cleanToken.substring(0, 15)}...`);
  localStorage.setItem(TOKEN_KEY, cleanToken);
  
  // 设置token过期时间
  const expiryTime = Date.now() + expiryInMinutes * 60 * 1000;
  localStorage.setItem(TOKEN_EXPIRY_KEY, expiryTime.toString());
  console.log(`设置token过期时间: ${new Date(expiryTime).toLocaleString()}`);
}

/**
 * 清理token值，去除多余空格和不必要的Bearer前缀
 * @param {string} token - 原始token
 * @returns {string} 清理后的token
 */
function cleanupToken(token) {
  if (!token) return '';
  
  // 去除首尾空格
  let cleanToken = token.trim();
  
  // 如果存储时已包含Bearer前缀，去除它(在请求拦截器中会统一添加)
  const bearerPrefix = 'Bearer ';
  if (cleanToken.startsWith(bearerPrefix)) {
    cleanToken = cleanToken.substring(bearerPrefix.length).trim();
  }
  
  return cleanToken;
}

/**
 * 移除token
 */
export function removeToken() {
  localStorage.removeItem(TOKEN_KEY);
}

/**
 * 获取刷新token
 */
export function getRefreshToken() {
  return localStorage.getItem(REFRESH_TOKEN_KEY);
}

/**
 * 设置刷新token
 * @param {string} refreshToken 
 */
export function setRefreshToken(refreshToken) {
  return localStorage.setItem(REFRESH_TOKEN_KEY, refreshToken);
}

/**
 * 移除刷新token
 */
export function removeRefreshToken() {
  localStorage.removeItem(REFRESH_TOKEN_KEY);
}

/**
 * 初始化存储用户信息
 */
export function initUserInfo() {
  // 导入API，避免循环依赖
    import('@/api/api').then(({ studentAPI, teacherAPI }) => {
    // 获取用户信息
    // 根据角色不同调用不同接口
    const userRole = localStorage.getItem('user_role');
    console.log('当前用户角色信息:', userRole);
    
    if (!userRole) {
      console.error('未找到用户角色信息');
      ElMessage.error('未找到用户角色信息');
      return;
    }
    
    try {
      const roleObj = JSON.parse(userRole);
      console.log('解析后的角色对象:', roleObj);
      
      const processUserInfo = (res) => {
        // 确保返回的用户信息包含必要字段
        const userInfo = {
          username: res.username || '',
          fullName: res.fullName || res.username || '',
          roles: roleObj,  // 使用本地存储的角色信息
          ...(res || {})   // 保留API返回的其他字段
        };
        console.log('处理后的用户信息:', userInfo);
        localStorage.setItem(USER_INFO_KEY, JSON.stringify(userInfo));
      };

      if (roleObj.includes('ROLE_ADMIN')) {
        console.log('获取管理员信息（使用教师接口）');
        teacherAPI.getSelfTeacherInfo().then(res => {
          console.log('管理员信息API响应:', res);
          processUserInfo({
            ...res,
            isAdmin: true,  // 添加管理员标识
            roles: roleObj  // 保持原有角色信息
          });
        }).catch(err => {
          console.error('获取管理员信息失败:', err);
          ElMessage.error('获取管理员信息失败');
        });
      } else if (roleObj.length === 1) {
        if (roleObj[0] === 'ROLE_STUDENT') {
          console.log('获取学生信息');
          studentAPI.getSelfStudentInfo().then(res => {
            console.log('学生信息API响应:', res);
            processUserInfo(res);
          }).catch(err => {
            console.error('获取学生信息失败:', err);
            ElMessage.error('获取学生信息失败');
          });
        } else if (roleObj[0] === 'ROLE_TEACHER') {
          console.log('获取教师信息');
          teacherAPI.getSelfTeacherInfo().then(res => {
            console.log('教师信息API响应:', res);
            processUserInfo(res);
          }).catch(err => {
            console.error('获取教师信息失败:', err);
            ElMessage.error('获取教师信息失败');
          });
        } else {
          console.error('未知的用户角色:', roleObj[0]);
          ElMessage.error('未知的用户角色');
        }
      } else {
        console.error('用户角色配置错误:', roleObj);
        ElMessage.error('用户角色配置错误');
      }
    } catch (err) {
      console.error('解析用户角色失败:', err);
      ElMessage.error('用户角色格式错误');
    }
  }).catch(err => {
    console.error('导入API模块失败:', err);
  });
}

/**
 * 获取用户信息
 * @returns {Object|null} 用户信息对象或null
 */
export function getUserInfo() {
  try {
    const userInfoStr = localStorage.getItem(USER_INFO_KEY);
    if (!userInfoStr) {
      console.warn('localStorage中未找到用户信息');
      // 返回默认用户信息，防止页面报错
      return {
        studentId: 'default-student-id',
        username: 'default-user',
        fullName: '默认用户',
        roles: ['student']
      };
    }
    return JSON.parse(userInfoStr);
  } catch (error) {
    console.error('解析用户信息失败:', error);
    // 解析失败时也返回默认用户信息
    return {
      studentId: 'default-student-id',
      username: 'default-user',
      fullName: '默认用户',
      roles: ['student']
    };
  }
}

/**
 * 移除用户信息
 */
export function removeUserInfo() {
  localStorage.removeItem(USER_INFO_KEY);
}

/**
 * 手动刷新用户信息
 * @returns {Promise<Object|null>} 用户信息对象或null
 */
export async function refreshUserInfo() {
  try {
    // 动态导入API，避免循环依赖
    const { studentAPI, teacherAPI } = await import('@/api/api');

    // 获取用户角色
    const userRole = localStorage.getItem('user_role');
    if (!userRole) {
      console.error('未找到用户角色信息');
      return null;
    }

    const roleObj = JSON.parse(userRole);
    let userInfo = null;

    if (roleObj.includes('ROLE_STUDENT')) {
      userInfo = await studentAPI.getSelfStudentInfo();
    } else if (roleObj.includes('ROLE_TEACHER')) {
      userInfo = await teacherAPI.getSelfTeacherInfo();
    } else {
      console.error('未知的用户角色:', roleObj);
      return null;
    }

    if (userInfo) {
      // 存储用户信息
      localStorage.setItem(USER_INFO_KEY, JSON.stringify(userInfo));
      localStorage.setItem('is_logged_in', 'true');
      console.log('用户信息刷新成功:', userInfo);
      return userInfo;
    }

    return null;
  } catch (error) {
    console.error('刷新用户信息失败:', error);
    return null;
  }
}

/**
 * 获取教师ID的统一方法
 * @returns {string|null} 教师ID或null
 */
export function getTeacherId() {
  try {
    const userInfoStr = localStorage.getItem(USER_INFO_KEY);
    if (!userInfoStr) {
      console.warn('localStorage中未找到用户信息');
      return null;
    }

    const userInfo = JSON.parse(userInfoStr);
    return userInfo.teacherId || null;
  } catch (error) {
    console.error('解析用户信息失败:', error);
    return null;
  }
}

/**
 * 获取学生ID的统一方法
 * @returns {string|null} 学生ID或null
 */
export function getStudentId() {
  try {
    const userInfoStr = localStorage.getItem(USER_INFO_KEY);
    if (!userInfoStr) {
      console.warn('localStorage中未找到用户信息');
      return null;
    }

    const userInfo = JSON.parse(userInfoStr);
    return userInfo.studentId || null;
  } catch (error) {
    console.error('解析用户信息失败:', error);
    return null;
  }
}

/**
 * 清除所有认证信息
 */
export function clearAuth() {
  console.log('正在清除所有认证信息...');
  
  // 清除token
  removeToken();
  
  // 清除refreshToken
  removeRefreshToken();
  
  // 清除用户信息
  removeUserInfo();
  
  // 清除其他登录状态为false
  localStorage.setItem('is_logged_in', 'false');
  
  // 确认清除完成
  const checkTokens = localStorage.getItem(TOKEN_KEY) || localStorage.getItem(REFRESH_TOKEN_KEY);
  if (checkTokens) {
    console.warn('警告: token清除失败，尝试第二次清除');
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(REFRESH_TOKEN_KEY);
  }
  
  console.log('所有认证信息已清除');
}
