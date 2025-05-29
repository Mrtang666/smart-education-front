const TOKEN_KEY = 'access_token';
const REFRESH_TOKEN_KEY = 'refresh_token';
const USER_INFO_KEY = 'user_info';
const STUDENT_INFO_KEY = 'student_info';
const TOKEN_EXPIRY_KEY = 'token_expiry';  // 用于存储token过期时间

/**
 * 获取token
 * @returns {string} token值，确保格式正确
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
    console.warn('token可能已过期，但仍然返回当前token');
  }
  
  return token;
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
export function setToken(token, expiryInMinutes = 30) {
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
 * 保存用户信息
 * @param {Object} userInfo 
 */
export function setUserInfo(userInfo) {
  // 检查userInfo是否包含必要字段
  if (!userInfo || typeof userInfo !== 'object') {
    console.error('无效的userInfo对象', userInfo);
    return;
  }
  
  // 处理角色信息
  if (userInfo.roles && Array.isArray(userInfo.roles)) {
    // 保持原始角色数组
    userInfo.originalRoles = [...userInfo.roles];
    
    // 处理角色格式
    const formattedRoles = userInfo.roles.map(role => {
      const roleStr = String(role).toUpperCase();
      // 处理ROLE_前缀
      if (roleStr.startsWith('ROLE_')) {
        return roleStr.substring(5).toLowerCase();
      }
      return String(role).toLowerCase();
    });
    
    // 添加简化后的角色
    userInfo.formattedRoles = formattedRoles;
    
    console.log('处理角色信息:', {
      original: userInfo.originalRoles,
      formatted: userInfo.formattedRoles
    });
  }
  
  console.log('保存用户信息到localStorage:', userInfo);
  localStorage.setItem(USER_INFO_KEY, JSON.stringify(userInfo));
}

/**
 * 获取用户信息
 */
export function getUserInfo() {
  try {
    const userInfo = localStorage.getItem(USER_INFO_KEY);
    if (!userInfo) {
      console.warn('localStorage中没有用户信息');
      return null;
    }
    
    const parsedUserInfo = JSON.parse(userInfo);
    console.log('获取用户信息:', parsedUserInfo);
    return parsedUserInfo;
  } catch (e) {
    console.error('解析用户信息失败:', e);
    return null;
  }
}

/**
 * 移除用户信息
 */
export function removeUserInfo() {
  localStorage.removeItem(USER_INFO_KEY);
}

/**
 * 保存学生信息
 * @param {Object} studentInfo 
 */
export function setStudentInfo(studentInfo) {
  localStorage.setItem(STUDENT_INFO_KEY, JSON.stringify(studentInfo));
}

/**
 * 获取学生信息
 */
export function getStudentInfo() {
  const studentInfo = localStorage.getItem(STUDENT_INFO_KEY);
  return studentInfo ? JSON.parse(studentInfo) : null;
}

/**
 * 移除学生信息
 */
export function removeStudentInfo() {
  localStorage.removeItem(STUDENT_INFO_KEY);
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
  
  // 清除学生信息
  removeStudentInfo();
  
  // 清除其他登录状态和用户数据
  localStorage.removeItem('isLoggedIn');
  localStorage.removeItem('userData');
  
  // 确认清除完成
  const checkTokens = localStorage.getItem(TOKEN_KEY) || localStorage.getItem(REFRESH_TOKEN_KEY);
  if (checkTokens) {
    console.warn('警告: token清除失败，尝试第二次清除');
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(REFRESH_TOKEN_KEY);
  }
  
  console.log('所有认证信息已清除');
}

/**
 * 清理冗余认证信息，保留必要信息
 * 删除：userInfo, userRole, refreshToken (仅保留refresh_token)
 */
export function cleanRedundantAuth() {
  console.log('开始清理冗余认证信息...');
  
  // 删除冗余的userInfo(null值)
  localStorage.removeItem('userInfo');
  
  // 删除独立的userRole（已包含在user_info中）
  localStorage.removeItem('userRole');
  
  // 删除refreshToken（使用标准键名refresh_token）
  localStorage.removeItem('refreshToken');
  
  console.log('冗余认证信息已清理完成');
} 