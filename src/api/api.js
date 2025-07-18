import axios from 'axios';
import { getValidToken, getRefreshToken, setToken, setRefreshToken } from '@/utils/auth';
import BigNumber from 'bignumber.js';

// 学生端 Axios 实例（√）
const studentAxios = axios.create({
    baseURL: 'http://118.89.136.119:8081', // 学生端端口
    timeout: 10000,
});

// 教师端 Axios 实例（√）
const teacherAxios = axios.create({
    baseURL: 'http://118.89.136.119:8081', // 教师端端口
    timeout: 10000,
});

// 创建带有拦截器的学生端 Axios 实例（√）
const createStudentAuthorizedAxios = () => {
    const instance = axios.create({
        baseURL: 'http://118.89.136.119:8081',
        timeout: 10000,
    });

    // 请求拦截器：添加 token
    instance.interceptors.request.use(
        (config) => {
            const token = getValidToken();
            if (token) {
                config.headers['Authorization'] = `Bearer ${token}`;
            }
            return config;
        },
        (error) => Promise.reject(error)
    );

    // 响应拦截器：处理401错误
    instance.interceptors.response.use(
        (response) => response,
        async (error) => {
            const originalRequest = error.config;
            
            // 如果是401错误且没有重试过
            if (error.response && error.response.status === 401 && !originalRequest._retry) {
                originalRequest._retry = true;
                
                try {
                    // 获取刷新token
                    const refreshToken = getRefreshToken();
                    if (!refreshToken) {
                        throw new Error('没有刷新token可用');
                    }
                    
                    // 刷新token
                    const response = await authAPI.studentRefreshToken({ refreshToken });
                    const { accessToken, refreshToken: newRefreshToken } = response;
                    
                    // 保存新token
                    setToken(accessToken);
                    setRefreshToken(newRefreshToken);
                    
                    // 更新请求头并重试
                    originalRequest.headers['Authorization'] = `Bearer ${accessToken}`;
                    return instance(originalRequest);
                } catch (refreshError) {
                    console.error('刷新token失败，需要重新登录:', refreshError);
                    // 可以在这里添加重定向到登录页的逻辑
                    window.location.href = '/login';
                    return Promise.reject(refreshError);
                }
            }
            
            return Promise.reject(error);
        }
    );

    return instance;
};

// 创建带有拦截器的教师端 Axios 实例（√）
const createTeacherAuthorizedAxios = () => {
    const instance = axios.create({
        baseURL: 'http://118.89.136.119:8081',
        timeout: 10000,
    });

    // 请求拦截器：添加 token
    instance.interceptors.request.use(
        (config) => {
            const token = getValidToken();
            if (token) {
                config.headers['Authorization'] = `Bearer ${token}`;
            }
            return config;
        },
        (error) => Promise.reject(error)
    );

    // 响应拦截器：处理401错误
    instance.interceptors.response.use(
        (response) => response,
        async (error) => {
            const originalRequest = error.config;
            
            // 如果是401错误且没有重试过
            if (error.response && error.response.status === 401 && !originalRequest._retry) {
                originalRequest._retry = true;
                
                try {
                    // 获取刷新token
                    const refreshToken = getRefreshToken();
                    if (!refreshToken) {
                        throw new Error('没有刷新token可用');
                    }
                    
                    // 刷新token
                    const response = await authAPI.teacherRefreshToken({ refreshToken });
                    const { accessToken, refreshToken: newRefreshToken } = response;
                    
                    // 保存新token
                    setToken(accessToken);
                    setRefreshToken(newRefreshToken);
                    
                    // 更新请求头并重试
                    originalRequest.headers['Authorization'] = `Bearer ${accessToken}`;
                    return instance(originalRequest);
                } catch (refreshError) {
                    console.error('刷新token失败，需要重新登录:', refreshError);
                    // 可以在这里添加重定向到登录页的逻辑
                    window.location.href = '/login';
                    return Promise.reject(refreshError);
                }
            }
            
            return Promise.reject(error);
        }
    );

    return instance;
};

// 认证相关 API(√)
export const authAPI = {
    /**
     * 学生登录接口(√)
     * @param {string} username 用户名
     * @param {string} password 密码
     * @returns {Promise<{tokens: {accessToken: string, refreshToken: string}, roles: string[]}>} 登录响应，包含token和角色
     */
    async studentLogin(username, password) {
        const response = await studentAxios.post('/api/auth/login', { username, password });
        return response.data;
    },

    /**
     * 教师登录接口(√)
     * @param {string} username 用户名
     * @param {string} password 密码
     * @returns {Promise<{tokens: {accessToken: string, refreshToken: string}, roles: string[]}>} 登录响应，包含token和角色
     */
    async teacherLogin(username, password) {
        const response = await teacherAxios.post('/api/auth/login', { username, password });
        return response.data;
    },

    /**
     * 学生注册接口(√)
     * @param {Object} studentData 注册信息
     * @param {string} studentData.username 用户名
     * @param {string} studentData.password 密码
     * @param {string} [studentData.email] 邮箱
     * @param {string} [studentData.fullName] 姓名
     * @param {string} [studentData.phone] 电话
     * @returns {Promise<{accessToken: string, refreshToken: string}>} 注册成功返回token
     */
    async studentRegister(studentData) {
        const response = await studentAxios.post('/api/student/register', studentData);
        return response.data;
    },

    /**
     * 教师注册（不需要token）（√）
     * @param {Object} teacherData 教师注册信息
     * @param {string} teacherData.username 用户名
     * @param {string} teacherData.password 密码
     * @param {string} teacherData.email 邮箱
     * @param {string} teacherData.fullName 姓名
     * @param {string} teacherData.phone 电话
     * @returns {Promise<{accessToken: string, refreshToken: string}>} 注册成功返回token
     */
    async registerTeacher(teacherData) {
        const response = await teacherAxios.post('/api/teacher/register', teacherData);
        return response.data;
    },

    /**
     * 学生修改密码（需要token）（√）
     * @param {Object} changePasswordData 修改密码信息
     * @param {string} changePasswordData.username 用户名
     * @param {string} changePasswordData.oldPassword 旧密码
     * @param {string} changePasswordData.newPassword 新密码
     * @returns {Promise<{accessToken: string, refreshToken: string}>} 修改密码后返回新token
     */
    async changeStudentPassword(changePasswordData) {
        const axios = createStudentAuthorizedAxios();
        const response = await axios.put('/api/auth/change-password', changePasswordData);
        return response.data;
    },

    /**
     * 教师修改密码（需要token）（√）
     * @param {Object} changePasswordData 修改密码信息
     * @param {string} changePasswordData.username 用户名
     * @param {string} changePasswordData.oldPassword 旧密码
     * @param {string} changePasswordData.newPassword 新密码
     * @returns {Promise<{accessToken: string, refreshToken: string}>} 修改密码后返回新token
     */
    async changeTeacherPassword(changePasswordData) {
        const axios = createTeacherAuthorizedAxios();
        const response = await axios.put('/api/auth/change-password', changePasswordData);
        return response.data;
    },

    /**
       * 检查学生端用户名是否可用（无需token）(√)
       * @param {string} username - 要检查的用户名
       * @returns {Promise<boolean>} 用户名可用返回true，不可用返回false
       */
    async checkAvailableUsername(username) {
        const response = await studentAxios.get('/api/auth/check-available-username', {
            params: { username }
        });
        return response.data;
    },

    /**
     * 检查教师端用户名是否可用（不需要token）(√)
     * @param {string} username 要检查的用户名
     * @returns {Promise<boolean>} 用户名可用返回true，不可用返回false
     * 返回值：
     *   - true: 用户名可用
     *   - false: 用户名不可用
     */
    async checkAvailableUsernameForTeacher(username) {
        const response = await teacherAxios.get('/api/auth/check-available-username', {
            params: { username }
        });
        return response.data;
    },

    /**
     * 刷新学生端token（无需token）(√)
     * @param {Object} refreshData 刷新参数
     * @param {string} refreshData.refreshToken 刷新token
     * @returns {Promise<Object>} 新token
     * 返回字段：
     *   - accessToken: string 新的访问token
     *   - refreshToken: string 新的刷新token
     */
    async studentRefreshToken(refreshData) {
        console.log('开始刷新token，参数:', refreshData);
        const response = await studentAxios.post('/api/auth/refresh', refreshData);
        console.log('刷新token响应:', response.data);
        return response.data;
    },

    /**
     * 刷新教师端token（无需token）(√)
     * @param {Object} refreshData 刷新参数
     * @param {string} refreshData.refreshToken 刷新token
     * @returns {Promise<Object>} 新token
     * 返回字段：
     *   - accessToken: string 新的访问token
     *   - refreshToken: string 新的刷新token
     */
    async teacherRefreshToken(refreshData) {
        console.log('开始刷新教师token，参数:', refreshData);
        const response = await teacherAxios.post('/api/auth/refresh', refreshData);
        console.log('刷新教师token响应:', response.data);
        return response.data;
    },
};

// 学生相关 API（1添加学生的更改信息，不允许改变年级和班级，）
export const studentAPI = {
    /**
     * 1.新增或更新学生信息（需要token）
     * @param {Object} studentData 学生信息
     * @param {string} studentData.username 用户名
     * @param {string} studentData.password 密码
     * @param {string} [studentData.email] 邮箱
     * @param {string} [studentData.fullName] 姓名
     * @param {string} [studentData.phone] 电话
     * @param {string} [studentData.grade] 年级
     * @param {string} [studentData.className] 班级
     * @returns {Promise<Object>} 新增或更新后的学生信息
     * 返回字段：
     *   - studentId: number 学生ID
     *   - username: string 用户名
     *   - password: string 密码
     *   - email: string 邮箱
     *   - fullName: string 姓名
     *   - phone: string 电话
     *   - grade: string 年级
     *   - className: string 班级
     *   - createdAt: string 创建时间（ISO格式）
     *   - updatedAt: string 更新时间（ISO格式）
     */
    async saveOrUpdateStudent(studentData) {
        const axios = createStudentAuthorizedAxios();
        const response = await axios.post('/api/student/save', studentData);
        return response.data;
    },

    /**
     * 2.根据学生ID获取学生信息（需要token）
     * @param {number} studentId 学生ID
     * @returns {Promise<Object>} 学生信息
     * 返回字段：同 saveOrUpdateStudent 返回字段
     */
    async getStudentById(studentId) {
        const axios = createStudentAuthorizedAxios();
        const response = await axios.get(`/api/student/${studentId}`);
        return response.data;
    },

    /**
     * 3.根据用户名获取学生信息（需要token）
     * @param {string} username 用户名
     * @returns {Promise<Object>} 学生信息
     * 返回字段：同 saveOrUpdateStudent 返回字段
     */
    async getStudentByUsername(username) {
        const axios = createStudentAuthorizedAxios();
        const response = await axios.get(`/api/student/username/${username}`);
        return response.data;
    },

    /**
     * 4.获取当前登录学生的自身信息（需要token）
     * @returns {Promise<Object>} 学生自身信息
     * 返回字段：同 saveOrUpdateStudent 返回字段
     */
    async getSelfStudentInfo() {
        const axios = createStudentAuthorizedAxios();
        const response = await axios.get('/api/student/self');
        return response.data;
    },

    /**
     * 5.搜索学生（需要token）
     * @param {Object} params 查询参数
     * @param {string} [params.keywords] 关键词（可选）
     * @param {string} [params.grade] 年级（可选）
     * @param {string} [params.className] 班级（可选）
     * @returns {Promise<Array<Object>>} 学生列表
     * 每项字段：同 saveOrUpdateStudent 返回字段
     */
    async searchStudents(params) {
        const axios = createStudentAuthorizedAxios();
        const response = await axios.get('/api/student/search', { params });
        return response.data;
    },

    /**
     * 6.根据姓名获取学生列表（需要token）
     * @param {string} fullName 姓名
     * @returns {Promise<Array<Object>>} 学生列表
     * 每项字段：同 saveOrUpdateStudent 返回字段
     */
    async getStudentsByFullName(fullName) {
        const axios = createStudentAuthorizedAxios();
        const response = await axios.get('/api/student/search/name', { params: { fullName } });
        return response.data;
    },

    /**
     * 7.根据年级和班级获取学生列表（需要token）
     * @param {Object} params 查询参数
     * @param {string} [params.grade] 年级（可选）
     * @param {string} [params.className] 班级（可选）
     * @returns {Promise<Array<Object>>} 学生列表
     * 每项字段：同 saveOrUpdateStudent 返回字段
     */
    async getStudentsByClass(params) {
        const axios = createStudentAuthorizedAxios();
        const response = await axios.get('/api/student/class', { params });
        return response.data;
    },

    /**
     * 8.检查邮箱是否已被注册（需要token）
     * @param {string} email 邮箱
     * @returns {Promise<Object>} 检查结果
     * 返回字段：由后端返回，通常包含邮箱是否可用等信息
     */
    async checkEmail(email) {
        const axios = createStudentAuthorizedAxios();
        const response = await axios.get('/api/student/check/email', { params: { email } });
        return response.data;
    },

    /**
     * 9.更新学生信息（需要token）
     * @param {Object} updateStudentData 学生信息对象
     * @param {string} updateStudentData.username 用户名
     * @param {string} updateStudentData.email 邮箱
     * @param {string} updateStudentData.fullName 姓名
     * @param {string} updateStudentData.phone 电话
     * @param {string} [updateStudentData.studentId] 学生ID（可选，如果已知）
     * @returns {Promise<Object>} 更新后的学生信息
     */
    async updateStudent(updateStudentData) {
        const axios = createStudentAuthorizedAxios();
        const response = await axios.put('/api/student/update', updateStudentData);
        return response.data;
    }
};

// 课程相关 API（7课程编号，11邀请码功能）
export const courseAPI = {
    /**
     * 1.新增或更新课程（需要token）
     * @param {Object} courseData 课程信息
     * @param {string} [courseData.id] 课程ID（可选，更新时填写）
     * @param {string} courseData.name 课程名称
     * @param {string} courseData.code 课程编码
     * @param {string} [courseData.description] 课程描述（可选）
     * @param {number} [courseData.credit] 学分（可选）
     * @param {string} [courseData.category] 课程类别（可选）
     * @param {string} [courseData.createTime] 创建时间（可选，ISO格式）
     * @param {string} [courseData.updateTime] 更新时间（可选，ISO格式）
     * @param {number} [courseData.status] 状态（可选）
     * @param {string} [courseData.remark] 备注（可选）
     * @returns {Promise<Object>} 新增或更新后的课程信息
     * 返回字段：
     *   - id: string 课程ID
     *   - name: string 课程名称
     *   - code: string 课程编码
     *   - description: string 课程描述
     *   - credit: number 学分
     *   - category: string 课程类别
     *   - createTime: string 创建时间（ISO格式）
     *   - updateTime: string 更新时间（ISO格式）
     *   - status: number 状态
     *   - remark: string 备注
     */
    async saveOrUpdateCourse(courseData) {
        const axios = createStudentAuthorizedAxios();
        try {
            // 创建数据副本，避免修改原始数据
            const dataToSend = { ...courseData };
            
            // 确保ID是字符串形式
            if (dataToSend.id !== undefined) {
                try {
                    const bn = new BigNumber(dataToSend.id);
                    dataToSend.id = bn.toString();
                } catch (error) {
                    console.error('无法将课程ID转换为BigNumber:', error);
                    dataToSend.id = String(dataToSend.id);
                }
            }
            
            // 如果有知识点ID列表，确保所有ID都是字符串形式
            if (Array.isArray(dataToSend.knowledgeIds)) {
                dataToSend.knowledgeIds = dataToSend.knowledgeIds.map(id => {
                    try {
                        return new BigNumber(id).toString();
                    } catch (error) {
                        console.error('无法将知识点ID转换为BigNumber:', error);
                        return String(id);
                    }
                });
            }
            
            const response = await axios.post('/api/course/save', dataToSend);
            
            // 确保返回的ID是字符串形式
            if (response.data && response.data.id !== undefined) {
                response.data.id = String(response.data.id);
            }
            
            return response.data;
        } catch (error) {
            console.error('保存或更新课程失败:', error.response ? error.response.data : error.message);
            throw error;
        }
    },

    /**
     * 2.根据课程ID获取课程信息（需要token）
     * @param {string} courseId 课程ID
     * @returns {Promise<Object>} 课程信息
     * 返回字段：同 saveOrUpdateCourse 返回字段
     */
    async getCourseById(courseId) {
        const axios = createStudentAuthorizedAxios();
        try {
            // 确保课程ID是字符串形式
            const courseIdStr = String(courseId);
            
            // 调用API时将ID转换为BigNumber
            let courseIdParam = courseIdStr;
            
            try {
                const bn = new BigNumber(courseIdStr);
                courseIdParam = bn.toString();
            } catch (error) {
                console.error('无法将课程ID转换为BigNumber:', error);
            }
            
            const response = await axios.get(`/api/course/${courseIdParam}`);
            
            // 确保返回的ID是字符串形式
            if (response.data && response.data.id !== undefined) {
                response.data.id = String(response.data.id);
            }
            
            return response.data;
        } catch (error) {
            console.error('获取课程信息失败:', error.response ? error.response.data : error.message);
            throw error;
        }
    },

    /**
     * 3.删除课程（需要token）
     * @param {string} courseId 课程ID
     * @returns {Promise<Object>} 删除结果
     * 返回字段：
     *   - success: boolean 是否删除成功
     *   - message: string 提示信息
     */
    async deleteCourse(courseId) {
        const axios = createStudentAuthorizedAxios();
        try {
            // 确保课程ID是字符串形式
            const courseIdStr = String(courseId);
            
            // 调用API时将ID转换为BigNumber
            let courseIdParam = courseIdStr;
            
            try {
                const bn = new BigNumber(courseIdStr);
                courseIdParam = bn.toString();
            } catch (error) {
                console.error('无法将课程ID转换为BigNumber:', error);
            }
            
            const response = await axios.delete(`/api/course/${courseIdParam}`);
            return response.data;
        } catch (error) {
            console.error('删除课程失败:', error.response ? error.response.data : error.message);
            throw error;
        }
    },

    /**
     * 4.搜索课程（需要token）
     * @param {string} keywords 关键词
     * @param {string} [category] 课程类别（可选）
     * @returns {Promise<Array<Object>>} 课程列表
     * 每项字段：同 saveOrUpdateCourse 返回字段
     */
    async searchCourses(keywords, category) {
        const axios = createStudentAuthorizedAxios();
        const params = { keywords };
        if (category) params.category = category;
        const response = await axios.get('/api/course/search', { params });
        return response.data;
    },

    /**
     * 5.按名称模糊搜索课程（需要token）
     * @param {string} name 课程名称
     * @returns {Promise<Array<Object>>} 课程列表
     * 每项字段：同 saveOrUpdateCourse 返回字段
     */
    async getCoursesByNameLike(name) {
        const axios = createStudentAuthorizedAxios();
        const response = await axios.get('/api/course/search/name', { params: { name } });
        return response.data;
    },

    /**
     * 6.根据课程名称获取课程信息（需要token）
     * @param {string} name 课程名称
     * @returns {Promise<Object>} 课程信息
     * 返回字段：同 saveOrUpdateCourse 返回字段
     */
    async getCourseByName(name) {
        const axios = createStudentAuthorizedAxios();
        const response = await axios.get(`/api/course/name/${name}`);
        return response.data;
    },

    /**
     * 7.根据课程编码获取课程信息（需要token）
     * @param {string} code 课程编码
     * @returns {Promise<Object>} 课程信息
     * 返回字段：同 saveOrUpdateCourse 返回字段
     */
    async getCourseByCode(code) {
        const axios = createStudentAuthorizedAxios();
        const response = await axios.get(`/api/course/code/${code}`);
        return response.data;
    },

    /**
     * 8.根据课程类别获取课程列表（需要token）
     * @param {string} category 课程类别
     * @returns {Promise<Array<Object>>} 课程列表
     * 每项字段：同 saveOrUpdateCourse 返回字段
     */
    async getCoursesByCategory(category) {
        const axios = createStudentAuthorizedAxios();
        const response = await axios.get(`/api/course/category/${category}`);
        return response.data;
    },

    /**
     * 9.获取所有课程（需要token）
     * @returns {Promise<Array<Object>>} 课程列表
     * 每项字段：同 saveOrUpdateCourse 返回字段
     */
    async getAllCourses() {
        const axios = createStudentAuthorizedAxios();
        const response = await axios.get('/api/course/all');
        return response.data;
    },

    /**
     * 10.批量删除课程（需要token）
     * @param {Array<number>} courseIdList 课程ID数组
     * @returns {Promise<Object>} 删除结果
     * 返回字段：
     *   - success: boolean 是否删除成功
     *   - message: string 提示信息
     */
    async batchDeleteCourses(courseIdList) {
        const axios = createStudentAuthorizedAxios();
        const response = await axios.delete('/api/course/batch', { data: courseIdList });
        return response.data;
    },

    /**
     * 11.通过邀请码加入课程（需要token）
     * @param {Object} joinData 加入课程的数据
     * @param {string} joinData.inviteCode 课程邀请码
     * @param {string} joinData.teacherId 教师ID
     * @returns {Promise<Object>} 加入结果
     * 返回字段：
     *   - success: boolean 是否加入成功
     *   - message: string 提示信息
     *   - course: Object 课程信息（如果成功）
     */
    async joinCourseByInviteCode(joinData) {
        const axios = createTeacherAuthorizedAxios();
        try {
            // 创建数据副本，避免修改原始数据
            const dataToSend = { ...joinData };
            
            // 确保教师ID是字符串形式
            if (dataToSend.teacherId !== undefined) {
                try {
                    const bn = new BigNumber(dataToSend.teacherId);
                    dataToSend.teacherId = bn.toString();
                } catch (error) {
                    console.error('无法将教师ID转换为BigNumber:', error);
                    dataToSend.teacherId = String(dataToSend.teacherId);
                }
            }
            
            const response = await axios.post('/api/course/join', dataToSend);
            return response.data;
        } catch (error) {
            console.error('通过邀请码加入课程失败:', error.response ? error.response.data : error.message);
            throw error;
        }
    }
};

// 教师相关 API（3更新教师信息）
export const teacherAPI = {
    /**
     * 1.根据用户名获取教师信息（需要token）
     * @param {string} username 用户名
     * @returns {Promise<{teacherId: number, username: string, email?: string, fullName?: string, phone?: string, createdAt?: string, updatedAt?: string}>} 教师信息
     */
    async getTeacherByUsername(username) {
        const axios = createTeacherAuthorizedAxios();
        const response = await axios.get(`/api/teacher/username/${username}`);
        return response.data;
    },

    /**
     * 2.获取当前登录教师的自身信息（需要token）
     * @returns {Promise<{teacherId: number, username: string, email?: string, fullName?: string, phone?: string, createdAt?: string, updatedAt?: string}>} 教师自身信息
     */
    async getSelfTeacherInfo() {
        const axios = createTeacherAuthorizedAxios();
        const response = await axios.get('/api/teacher/self');
        return response.data;
    },

    /**
     * 3.更新教师信息（需要token）
     * @param {Object} updateTeacherData 教师信息对象
     * @param {string} updateTeacherData.username 用户名
     * @param {string} updateTeacherData.email 邮箱
     * @param {string} updateTeacherData.fullName 姓名
     * @param {string} updateTeacherData.phone 电话
     * @returns {Promise<Object>} 更新后的教师信息
     */
    async updateTeacher(updateTeacherData) {
        const axios = createTeacherAuthorizedAxios();
        const response = await axios.put('/api/teacher/update', updateTeacherData);
        return response.data;
    },

    /**
     * 4.根据教师ID获取教师信息（需要token）
     * @param {number} id 教师ID
     * @returns {Promise<{teacherId: number, username: string, email?: string, fullName?: string, phone?: string, createdAt?: string, updatedAt?: string}>} 教师信息
     */
    async getTeacherById(id) {
        const axios = createTeacherAuthorizedAxios();
        const response = await axios.get(`/api/teacher/${id}`);
        return response.data;
    }
};
// 教学助手相关 API
export const teachingAssistantAPI = {
    /**
     * 在已有教学方案的基础上进行改进（需要token）
     * @param {Object} improveData 改进数据
     * @param {string} improveData.teachingPlan 教学方案
     * @param {string} improveData.suggestion 改进建议
     * @returns {Promise<Object>} 改进后的教学方案
     */
    async improveLesson(improveData) {
        const axios = createTeacherAuthorizedAxios();
        try {
            console.log('改进教学方案数据:', improveData);
            // 设置较长的超时时间，因为AI改进需要更多时间
            const response = await axios.post('/api/teaching-assistant/lesson/improve', improveData, {
                timeout: 60000 // 60秒超时
            });
            return response.data;
        } catch (error) {
            console.error('改进教学方案失败:', error.response ? error.response.data : error.message);
            throw error;
        }
    },

    /**
     * 分析学生课程学习情况（需要token）
     * @param {string|number} courseId 课程ID
     * @param {string|number} studentId 学生ID
     * @returns {Promise<Object>} 学生学习情况分析
     */
    async analyzeStudentCourseProgress(courseId, studentId) {
        const axios = createTeacherAuthorizedAxios();
        try {
            // 确保ID是字符串类型
            const courseIdStr = String(courseId);
            const studentIdStr = String(studentId);

            console.log(`分析学生课程学习情况，课程ID: ${courseIdStr}, 学生ID: ${studentIdStr}`);

            // 设置较长的超时时间，因为AI分析需要更多时间
            const response = await axios.post(`/api/teaching-assistant/analytics/course/${courseIdStr}/student/${studentIdStr}`, {}, {
                timeout: 120000 // 120秒超时
            });
            return response.data;
        } catch (error) {
            console.error('分析学生课程学习情况失败:', error.response ? error.response.data : error.message);
            throw error;
        }
    },

    /**
     * 生成教学方案（需要token）
     * @param {Object} generateData 生成数据
     * @param {string} generateData.subjectType 学科类型/课程名称
     * @param {string} generateData.courseOutline 知识点名称/知识点内容大纲
     * @param {number} generateData.duration 时长
     * @param {string} generateData.difficultyLevel 难度等级
     * @param {string} generateData.teachingStyle 教学风格
     * @returns {Promise<Object>} 生成的教学方案
     */
    async generateLesson(generateData) {
        const axios = createTeacherAuthorizedAxios();
        try {
            console.log('生成教学方案数据:', generateData);
            // 设置较长的超时时间，因为AI生成需要更多时间
            const response = await axios.post('/api/teaching-assistant/lesson/generate', generateData, {
                timeout: 60000 // 60秒超时
            });
            return response.data;
        } catch (error) {
            console.error('生成教学方案失败:', error.response ? error.response.data : error.message);
            throw error;
        }
    }
};

// 学生助手相关 API
export const studentAssistantAPI = {
    /**
     * 无历史非流式一次问答（需要token）
     * @param {string|number} studentId 学生ID
     * @param {Object} askData 问答数据
     * @param {string} askData.question 问题
     * @param {string|number} [askData.courseId] 课程ID（可选）
     * @returns {Promise<Object>} 问答响应
     */
    async askQuestion(studentId, askData) {
        const axios = createStudentAuthorizedAxios();
        try {
            // 确保ID是字符串类型
            const studentIdStr = String(studentId);

            console.log(`学生问答，学生ID: ${studentIdStr}，问题:`, askData.question);

            // 构建查询参数
            const params = {
                question: askData.question
            };

            // 如果有课程ID，添加到查询参数中
            if (askData.courseId) {
                params.courseId = String(askData.courseId);
            }

            const response = await axios.post(`/api/student-assistant/student/${studentIdStr}/ask`, null, {
                params: params,
                timeout: 60000  // 设置60秒超时，AI响应可能需要较长时间
            });
            return response.data;
        } catch (error) {
            console.error('学生问答失败:', error.response ? error.response.data : error.message);
            throw error;
        }
    },

    /**
     * 带历史非流式问答（需要token）
     * @param {string|number} studentId 学生ID
     * @param {Object} historyData 历史问答数据
     * @param {Array<Object>} historyData.messages 消息历史
     * @param {string} historyData.messages[].role 角色（user/assistant）
     * @param {string} historyData.messages[].content 消息内容
     * @param {boolean} historyData.valid 是否有效
     * @returns {Promise<Object>} 问答响应
     */
    async askWithHistory(studentId, historyData) {
        const axios = createStudentAuthorizedAxios();
        try {
            // 确保ID是字符串类型
            const studentIdStr = String(studentId);

            console.log(`学生带历史问答，学生ID: ${studentIdStr}，消息数量:`, historyData.messages?.length || 0);

            // 为AI聊天设置更长的超时时间（60秒）
            const response = await axios.post(`/api/student-assistant/student/${studentIdStr}/ask/history`, historyData, {
                timeout: 60000
            });
            return response.data;
        } catch (error) {
            console.error('学生带历史问答失败:', error.response ? error.response.data : error.message);
            throw error;
        }
    },

    /**
     * 带历史流式问答（需要token）
     * @param {Object} streamData 流式问答数据
     * @param {Array<Object>} streamData.messages 消息历史
     * @param {string} streamData.messages[].role 角色（user/assistant）
     * @param {string} streamData.messages[].content 消息内容
     * @param {boolean} streamData.valid 是否有效
     * @returns {Promise<ReadableStream>} 流式响应
     */
    async streamChatWithHistory(streamData) {
        const axios = createStudentAuthorizedAxios();
        try {
            console.log('学生流式问答，消息数量:', streamData.messages?.length || 0);

            const response = await axios.post('/api/student-assistant/stream/chat-history', streamData, {
                responseType: 'stream',
                timeout: 60000  // 为流式聊天设置更长的超时时间（60秒）
            });
            return response.data;
        } catch (error) {
            console.error('学生流式问答失败:', error.response ? error.response.data : error.message);
            throw error;
        }
    },

    /**
     * 基于知识点名称生成练习（需要token）
     * @param {string|number} studentId 学生ID
     * @param {Object} params 查询参数
     * @param {Array<string>} params.knowledgeNames 知识点名称数组
     * @param {string} [params.difficultyLevel] 难度等级（可选）
     * @param {number} params.problemCount 题目数量
     * @returns {Promise<Object>} 生成的练习
     */
    async generateExerciseByKnowledge(studentId, params) {
        const axios = createStudentAuthorizedAxios();
        try {
            // 确保ID是字符串类型
            const studentIdStr = String(studentId);

            console.log(`基于知识点生成练习，学生ID: ${studentIdStr}，知识点:`, params.knowledgeNames);

            const response = await axios.get(`/api/student-assistant/student/${studentIdStr}/generate-exercise/by-knowledge`, {
                params
            });
            return response.data;
        } catch (error) {
            console.error('基于知识点生成练习失败:', error.response ? error.response.data : error.message);
            throw error;
        }
    },

    /**
     * 基于课程名称生成练习（需要token）
     * @param {string|number} studentId 学生ID
     * @param {Object} params 查询参数
     * @param {string} params.courseName 课程名称
     * @param {string} [params.difficultyLevel] 难度等级（可选）
     * @param {number} params.problemCount 题目数量
     * @returns {Promise<Object>} 生成的练习
     */
    async generateExerciseByCourse(studentId, params) {
        const axios = createStudentAuthorizedAxios();
        try {
            // 确保ID是字符串类型
            const studentIdStr = String(studentId);

            console.log(`基于课程生成练习，学生ID: ${studentIdStr}，课程:`, params.courseName);

            const response = await axios.get(`/api/student-assistant/student/${studentIdStr}/generate-exercise/by-course`, {
                params
            });
            return response.data;
        } catch (error) {
            console.error('基于课程生成练习失败:', error.response ? error.response.data : error.message);
            throw error;
        }
    }
};
// 学习进度api模块（代讨论）
export const learningProgressAPI = {
    /**
     *1. 获取学生整体学习进度（需要token）
     * @param {number} studentId 学生ID
     * @returns {Promise<Array<Object>>} 学生学习进度列表
     */
    async getStudentProgress(studentId) {
        const axios = createStudentAuthorizedAxios();
        const response = await axios.get(`/api/learning-progress/student/${studentId}`);
        return response.data;
    },

    /**
     * 获取学生学习进度统计（需要token）
     * @param {number} studentId 学生ID
     * @returns {Promise<Object>} 统计信息
     */
    async getProgressStatistics(studentId) {
        const axios = createStudentAuthorizedAxios();
        const response = await axios.get(`/api/learning-progress/student/${studentId}/statistics`);
        return response.data;
    },

    /**
     * 获取推荐学习资源（需要token）
     * @param {number} studentId 学生ID
     * @param {number} [limit] 返回条数（可选）
     * @returns {Promise<Array<Object>>} 资源列表
     */
    async getRecommendedResources(studentId, limit) {
        const axios = createStudentAuthorizedAxios();
        const params = {};
        if (limit) params.limit = limit;
        const response = await axios.get(`/api/learning-progress/student/${studentId}/resources`, { params });
        return response.data;
    },

    /**
     * 搜索推荐学习资源（需要token）
     * @param {number} studentId 学生ID
     * @param {string} keywords 关键词
     * @param {number} [limit] 返回条数（可选）
     * @returns {Promise<Array<Object>>} 资源列表
     */
    async searchRecommendedResources(studentId, keywords, limit) {
        const axios = createStudentAuthorizedAxios();
        const params = { keywords };
        if (limit) params.limit = limit;
        const response = await axios.get(`/api/learning-progress/student/${studentId}/resources/search`, { params });
        return response.data;
    },

    /**
     * 获取学生整体进度（需要token）
     * @param {number} studentId 学生ID
     * @returns {Promise<Object>} 整体进度信息
     */
    async getOverallProgress(studentId) {
        const axios = createStudentAuthorizedAxios();
        const response = await axios.get(`/api/learning-progress/student/${studentId}/overall-progress`);
        return response.data;
    },

    /**
     * 获取学生某知识点的进度（需要token）
     * @param {number} studentId 学生ID
     * @param {number} knowledgeId 知识点ID
     * @returns {Promise<Object>} 进度信息
     */
    async getStudentKnowledgeProgress(studentId, knowledgeId) {
        const axios = createStudentAuthorizedAxios();
        const response = await axios.get(`/api/learning-progress/student/${studentId}/knowledge/${knowledgeId}`);
        return response.data;
    },

    /**
     * 按知识点名称获取学生知识点进度（需要token）
     * @param {number} studentId 学生ID
     * @param {string} name 知识点名称
     * @returns {Promise<Array<Object>>} 进度列表
     */
    async getStudentKnowledgeProgressByName(studentId, name) {
        const axios = createStudentAuthorizedAxios();
        const response = await axios.get(`/api/learning-progress/student/${studentId}/knowledge/name`, { params: { name } });
        return response.data;
    },

    /**
     * 获取学生某课程的进度（需要token）
     * @param {number} studentId 学生ID
     * @param {number} courseId 课程ID
     * @returns {Promise<Array<Object>>} 进度列表
     */
    async getStudentCourseProgress(studentId, courseId) {
        const axios = createStudentAuthorizedAxios();
        const response = await axios.get(`/api/learning-progress/student/${studentId}/course/${courseId}`);
        return response.data;
    },

    /**
     * 获取学生某课程的进度（对象形式，需token）
     * @param {number} studentId 学生ID
     * @param {number} courseId 课程ID
     * @returns {Promise<Object>} 进度信息
     */
    async getCourseProgress(studentId, courseId) {
        const axios = createStudentAuthorizedAxios();
        const response = await axios.get(`/api/learning-progress/student/${studentId}/course/${courseId}/progress`);
        return response.data;
    },

    /**
     * 获取学生某课程的学习计划（需要token）
     * @param {number} studentId 学生ID
     * @param {number} courseId 课程ID
     * @returns {Promise<Object>} 学习计划
     */
    async generateLearningPlan(studentId, courseId) {
        const axios = createStudentAuthorizedAxios();
        const response = await axios.get(`/api/learning-progress/student/${studentId}/course/${courseId}/plan`);
        return response.data;
    },

    /**
     * 获取学生某课程的进度统计（需要token）
     * @param {number} studentId 学生ID
     * @param {number} courseId 课程ID
     * @returns {Promise<Object>} 统计信息
     */
    async getProgressStatisticsByCourse(studentId, courseId) {
        const axios = createStudentAuthorizedAxios();
        const response = await axios.get(`/api/learning-progress/student/${studentId}/course/${courseId}/statistics`);
        return response.data;
    },

    /**
     * 按课程名称获取学生课程进度（需要token）
     * @param {number} studentId 学生ID
     * @param {string} name 课程名称
     * @returns {Promise<Array<Object>>} 进度列表
     */
    async getStudentCourseProgressByName(studentId, name) {
        const axios = createStudentAuthorizedAxios();
        const response = await axios.get(`/api/learning-progress/student/${studentId}/course/name`, { params: { name } });
        return response.data;
    },

    /**
     * 按课程名称获取学生课程进度（对象形式，需token）
     * @param {number} studentId 学生ID
     * @param {string} name 课程名称
     * @returns {Promise<Object>} 进度信息
     */
    async getCourseProgressByName(studentId, name) {
        const axios = createStudentAuthorizedAxios();
        const response = await axios.get(`/api/learning-progress/student/${studentId}/course/progress`, { params: { name } });
        return response.data;
    },

    /**
     * 按课程名称获取学生学习计划（需要token）
     * @param {number} studentId 学生ID
     * @param {string} name 课程名称
     * @param {number} days 天数
     * @returns {Promise<Object>} 学习计划
     */
    async generateLearningPlanByCourseName(studentId, name, days) {
        const axios = createStudentAuthorizedAxios();
        const response = await axios.get(`/api/learning-progress/student/${studentId}/course/plan`, { params: { name, days } });
        return response.data;
    },

    /**
     * 更新学习进度（需要token）
     * @param {Object} progressData 学习进度信息
     * @param {number} [progressData.progressId] 进度ID（可选，更新时填写）
     * @param {number} progressData.studentId 学生ID
     * @param {number} progressData.courseId 课程ID
     * @param {number} progressData.knowledgeId 知识点ID
     * @param {number} progressData.masteryLevel 掌握程度
     * @param {string} [progressData.learningStatus] 学习状态（可选）
     * @param {string} [progressData.lastReviewedAt] 最近复习时间（可选，ISO格式）
     * @param {number} [progressData.reviewCount] 复习次数（可选）
     * @param {string} [progressData.createdAt] 创建时间（可选，ISO格式）
     * @param {string} [progressData.updatedAt] 更新时间（可选，ISO格式）
     * @param {string} [progressData.courseName] 课程名称（可选）
     * @param {string} [progressData.knowledgeName] 知识点名称（可选）
     * @param {boolean} [progressData.mastered] 是否已掌握（可选）
     * @returns {Promise<Object>} 更新后的学习进度
     * 返回字段：
     *   - progressId: number 进度ID
     *   - studentId: number 学生ID
     *   - courseId: number 课程ID
     *   - knowledgeId: number 知识点ID
     *   - masteryLevel: number 掌握程度
     *   - learningStatus: string 学习状态
     *   - lastReviewedAt: string 最近复习时间（ISO格式）
     *   - reviewCount: number 复习次数
     *   - createdAt: string 创建时间（ISO格式）
     *   - updatedAt: string 更新时间（ISO格式）
     *   - courseName: string 课程名称
     *   - knowledgeName: string 知识点名称
     *   - mastered: boolean 是否已掌握
     */
    async updateLearningProgress(progressData) {
        const axios = createStudentAuthorizedAxios();
        const response = await axios.post('/api/learning-progress/update', progressData);
        return response.data;
    },

    /**
     * 更新某学生某知识点的掌握程度（需要token）
     * @param {number} studentId 学生ID
     * @param {number} knowledgeId 知识点ID
     * @param {number} score 掌握分数
     * @returns {Promise<Object>} 更新后的进度信息
     */
    async updateMasteryLevel(studentId, knowledgeId, score) {
        const axios = createStudentAuthorizedAxios();
        const response = await axios.post(`/api/learning-progress/student/${studentId}/knowledge/${knowledgeId}/mastery`, null, { params: { score } });
        return response.data;
    },

    /**
     * 按知识点名称更新掌握程度（需要token）
     * @param {number} studentId 学生ID
     * @param {string} name 知识点名称
     * @param {number} score 掌握分数
     * @returns {Promise<Object>} 更新后的进度信息
     */
    async updateMasteryLevelByName(studentId, name, score) {
        const axios = createStudentAuthorizedAxios();
        const response = await axios.post(`/api/learning-progress/student/${studentId}/knowledge/mastery`, null, { params: { name, score } });
        return response.data;
    },

    /**
     * 批量更新学习进度（需要token）
     * @param {Array<Object>} progressList 学习进度数组，每项结构如下：
     *   - progressId: number 进度ID（可选）
     *   - studentId: number 学生ID
     *   - courseId: number 课程ID
     *   - knowledgeId: number 知识点ID
     *   - masteryLevel: number 掌握程度
     *   - learningStatus: string 学习状态（可选）
     *   - lastReviewedAt: string 最近复习时间（可选，ISO格式）
     *   - reviewCount: number 复习次数（可选）
     *   - createdAt: string 创建时间（可选，ISO格式）
     *   - updatedAt: string 更新时间（可选，ISO格式）
     *   - courseName: string 课程名称（可选）
     *   - knowledgeName: string 知识点名称（可选）
     *   - mastered: boolean 是否已掌握（可选）
     * @returns {Promise<Object>} 批量更新结果
     */
    async batchUpdateLearningProgress(progressList) {
        const axios = createStudentAuthorizedAxios();
        const response = await axios.post('/api/learning-progress/batch-update', progressList);
        return response.data;
    },
};

// 知识点api模块（教师端）（8用的时候再添加，感觉用不到，15，21根据题目id获得题目详情，22，23，24根据题目类型获得题目列表）
export const knowledgeAPI = {
    /**
     * 1.更新知识点信息（需要token）
     * @param {Object} updateKnowledgeData 更新的知识点数据
     * @param {string} updateKnowledgeData.knowledgeId 知识点ID
     * @param {string} updateKnowledgeData.name 知识点名称
     * @param {string} updateKnowledgeData.description 知识点描述
     * @param {string} updateKnowledgeData.teacherId 教师ID
     * @param {string} updateKnowledgeData.difficultyLevel 难度等级
     * @param {string} updateKnowledgeData.teachPlan 教学计划
     * @returns {Promise<Object>} 更新后的知识点信息
     */
    async updateKnowledge(updateKnowledgeData) {
        const axios = createTeacherAuthorizedAxios();
        try {
            console.log('更新知识点数据:', updateKnowledgeData);
            
            // 创建数据副本，避免修改原始数据
            const dataToSend = { ...updateKnowledgeData };
            
            // 确保ID是字符串类型
            if (dataToSend.knowledgeId !== undefined) {
                dataToSend.knowledgeId = String(dataToSend.knowledgeId);
            }
            if (dataToSend.teacherId !== undefined) {
                dataToSend.teacherId = String(dataToSend.teacherId);
            }
            
            // 调用API时将ID转换为BigNumber
            if (dataToSend.knowledgeId) {
                try {
                    const bn = new BigNumber(dataToSend.knowledgeId);
                    dataToSend.knowledgeId = bn.toString();
                } catch (error) {
                    console.error('无法将知识点ID转换为BigNumber:', error);
                }
            }
            
            if (dataToSend.teacherId) {
                try {
                    const bn = new BigNumber(dataToSend.teacherId);
                    dataToSend.teacherId = bn.toString();
                } catch (error) {
                    console.error('无法将教师ID转换为BigNumber:', error);
                }
            }
            
            const response = await axios.put('/api/knowledge/update', dataToSend);
            
            // 确保返回的所有ID字段都是字符串类型
            if (response.data) {
                if (response.data.knowledgeId !== undefined) response.data.knowledgeId = String(response.data.knowledgeId);
                if (response.data.teacherId !== undefined) response.data.teacherId = String(response.data.teacherId);
            }
            
            return response.data;
        } catch (error) {
            console.error('更新知识点失败:', error.response ? error.response.data : error.message);
            throw error;
        }
    },

    /**
     * 2.保存新的知识点（需要token）
     * @param {Object} knowledgeData 知识点数据
     
     * @param {string} knowledgeData.name 知识点名称
     * @param {string} knowledgeData.description 知识点描述
     * @param {string} knowledgeData.difficultyLevel 难度等级
     * @param {string} knowledgeData.teacherId 教师ID
     * @param {string} knowledgeData.teachPlan 教学计划
     * @returns {Promise<Object>} 创建的知识点信息
     */
    async saveKnowledge(knowledgeData) {
        const axios = createTeacherAuthorizedAxios();
        try {
            console.log('创建知识点数据:', knowledgeData);
            
            // 创建数据副本，避免修改原始数据
            const dataToSend = { ...knowledgeData };
            
            // 确保ID是字符串类型
            if (dataToSend.teacherId !== undefined) {
                dataToSend.teacherId = String(dataToSend.teacherId);
            }
            
            // 调用API时将ID转换为BigNumber
            if (dataToSend.teacherId) {
                try {
                    const bn = new BigNumber(dataToSend.teacherId);
                    dataToSend.teacherId = bn.toString();
                } catch (error) {
                    console.error('无法将教师ID转换为BigNumber:', error);
                }
            }
            
            const response = await axios.post('/api/knowledge/save', dataToSend);
            
            // 确保返回的所有ID字段都是字符串类型
            if (response.data) {
                if (response.data.knowledgeId !== undefined) response.data.knowledgeId = String(response.data.knowledgeId);
                if (response.data.teacherId !== undefined) response.data.teacherId = String(response.data.teacherId);
            }
            
            return response.data;
        } catch (error) {
            console.error('创建知识点失败:', error.response ? error.response.data : error.message);
            throw error;
        }
    },

    /**
     * 3.根据ID获取知识点详情（需要token）（这个不太需要）
     * @param {string} id 知识点ID
     * @returns {Promise<Object>} 知识点详情
     * 返回字段同getKnowledgeByCourseId方法中的每项
     */
    async getKnowledgeById(id) {
        const axios = createTeacherAuthorizedAxios();
        
        // 确保ID是字符串类型
        const idStr = String(id);
        
        const response = await axios.get(`/api/knowledge/${idStr}`);
        
        // 确保返回的所有ID字段都是字符串类型
        if (response.data) {
            if (response.data.knowledgeId !== undefined) response.data.knowledgeId = String(response.data.knowledgeId);
            if (response.data.teacherId !== undefined) response.data.teacherId = String(response.data.teacherId);
        }
        
        return response.data;
    },

    /**
     * 4.根据课程ID和知识点ID删除知识点（需要token）
     * @param {string} courseId 课程ID
     * @param {string} id 知识点ID
     * @returns {Promise<Object>} 删除结果
     * 返回字段：
     *   - success: boolean 是否删除成功
     *   - message: string 提示信息
     */
    async deleteKnowledgeFromCourseById(courseId, id) {
        const axios = createTeacherAuthorizedAxios();
        try {
            // 如果courseId为null，直接抛出错误，不调用API
            if (courseId === null || courseId === undefined) {
                throw new Error('删除知识点需要指定课程ID，请选择一个课程');
            }
            
            // 确保ID是字符串类型
            const knowledgeIdStr = String(id);
            const courseIdStr = String(courseId);
            
            console.log(`尝试删除知识点，课程ID: ${courseIdStr}, 知识点ID: ${knowledgeIdStr}`);
            
            // 直接使用字符串形式的ID构建URL
            const url = `/api/knowledge/course/${courseIdStr}/knowledge/${knowledgeIdStr}`;
            
            console.log('删除知识点URL:', url);
            const response = await axios.delete(url);
            console.log('删除知识点响应:', response.data);
            return response.data;
        } catch (error) {
            console.error('删除知识点API调用失败:', error.response ? error.response.data : error.message);
            throw error;
        }
    },
    
    /**
     * 5.移除知识点持久化（需要token）
     * @param {string} knowledgeId 知识点ID
     * @returns {Promise<Object>} 删除结果
     * 返回字段：
     *   - success: boolean 是否删除成功
     *   - message: string 提示信息
     */
    async deleteKnowledgeById(knowledgeId) {
        const axios = createTeacherAuthorizedAxios();
        try {
            // 确保ID是字符串类型
            const knowledgeIdStr = String(knowledgeId);
            
            console.log(`尝试移除知识点持久化，知识点ID: ${knowledgeIdStr}`);
            
            const response = await axios.delete(`/api/knowledge/${knowledgeIdStr}`);
            console.log('移除知识点持久化响应:', response.data);
            return response.data;
        } catch (error) {
            console.error('移除知识点持久化失败:', error.response ? error.response.data : error.message);
            throw error;
        }
    },

    /**
     * 6.从课程中移除一批知识点（需要token）
     * @param {string} courseId 课程ID
     * @param {Array<string>} knowledgeIds 知识点ID数组
     * @returns {Promise<Object>} 删除结果
     * 返回字段：
     *   - success: boolean 是否删除成功
     *   - message: string 提示信息
     *   - count: number 成功移除的知识点数量
     */
    async batchDeleteKnowledgeFromCourse(courseId, knowledgeIds) {
        const axios = createTeacherAuthorizedAxios();
        try {
            // 确保courseId是字符串类型
            const courseIdStr = String(courseId);
            
            // 确保所有knowledgeId都是字符串类型
            const knowledgeIdsStr = knowledgeIds.map(id => String(id));
            
            console.log(`尝试从课程中批量移除知识点，课程ID: ${courseIdStr}, 知识点数量: ${knowledgeIdsStr.length}`);
            
            const response = await axios.delete(`/api/knowledge/course/${courseIdStr}/batch`, {
                data: knowledgeIdsStr
            });
            console.log('批量移除知识点响应:', response.data);
            return response.data;
        } catch (error) {
            console.error('批量移除知识点失败:', error.response ? error.response.data : error.message);
            throw error;
        }
    },

    /**
     * 7.批量移除知识点持久化（需要token）
     * @param {Array<string>} knowledgeIds 知识点ID数组
     * @returns {Promise<Object>} 删除结果
     * 返回字段：
     *   - success: boolean 是否删除成功
     *   - message: string 提示信息
     *   - count: number 成功移除的知识点数量
     */
    async batchDeleteKnowledge(knowledgeIds) {
        const axios = createTeacherAuthorizedAxios();
        try {
            // 确保所有knowledgeId都是字符串类型
            const knowledgeIdsStr = knowledgeIds.map(id => String(id));
            
            console.log(`尝试批量移除知识点持久化，知识点数量: ${knowledgeIdsStr.length}`);
            
            const response = await axios.delete('/api/knowledge/batch', {
                data: knowledgeIdsStr
            });
            console.log('批量移除知识点持久化响应:', response.data);
            return response.data;
        } catch (error) {
            console.error('批量移除知识点持久化失败:', error.response ? error.response.data : error.message);
            throw error;
        }
    },
    
    /**
     * 8.查询与目标知识点相关联的所有课程（需要token）
     * @param {string} knowledgeId 知识点ID
     * @returns {Promise<Array<Object>>} 课程列表
     * 每项字段：
     *   - id: string 课程ID
     *   - name: string 课程名称
     *   - code: string 课程编码
     *   - description: string 课程描述
     *   - credit: number 学分
     *   - category: string 课程类别
     *   - createTime: string 创建时间（ISO格式）
     *   - updateTime: string 更新时间（ISO格式）
     *   - status: number 状态
     *   - remark: string 备注
     */
    async getCoursesByKnowledgeId(knowledgeId) {
        const axios = createTeacherAuthorizedAxios();
        try {
            // 确保ID是字符串类型
            const knowledgeIdStr = String(knowledgeId);
            
            console.log(`查询与知识点相关联的课程，知识点ID: ${knowledgeIdStr}`);
            
            const response = await axios.get(`/api/course/knowledge/${knowledgeIdStr}`);
            
            // 确保返回的所有ID字段都是字符串类型
            if (Array.isArray(response.data)) {
                response.data.forEach(item => {
                    if (item.id !== undefined) item.id = String(item.id);
                });
            }
            
            return response.data;
        } catch (error) {
            console.error('查询知识点相关课程失败:', error.response ? error.response.data : error.message);
            throw error;
        }
    },
    
    /**
     * 9.根据教师ID获取知识点列表（需要token）
     * @param {string} teacherId 教师ID
     * @returns {Promise<Array<Object>>} 知识点列表
     * 每项字段：
     *   - knowledgeId: string 知识点ID (返回时转为字符串)
     *   - name: string 知识点名称
     *   - description: string 知识点描述
     *   - difficultyLevel: string 难度等级
     *   - teacherId: string 教师ID (返回时转为字符串)
     *   - courseId: string 课程ID (返回时转为字符串)
     *   - teachPlan: string 教学计划
     *   - createdAt: string 创建时间（ISO格式）
     *   - updatedAt: string 更新时间（ISO格式）
     */
    async getKnowledgeByTeacherId(teacherId) {
        const axios = createTeacherAuthorizedAxios();
        
        // 确保ID是字符串类型
        const teacherIdStr = String(teacherId);
        
        const response = await axios.get(`/api/knowledge/teacher/${teacherIdStr}`);
        
        // 确保返回的所有ID字段都是字符串类型
        if (Array.isArray(response.data)) {
            response.data.forEach(item => {
                if (item.knowledgeId !== undefined) item.knowledgeId = String(item.knowledgeId);
                if (item.teacherId !== undefined) item.teacherId = String(item.teacherId);
            });
        }
        
        return response.data;
    },

    /**
     * 10.根据课程ID获取知识点列表（需要token）
     * @param {string} courseId 课程ID
     * @returns {Promise<Array<Object>>} 知识点列表
     * 每项字段：
     *   - knowledgeId: string 知识点ID (返回时转为字符串)
     *   - name: string 知识点名称
     *   - description: string 知识点描述
     *   - difficultyLevel: string 难度等级
     *   - teacherId: string 教师ID (返回时转为字符串)
     *   - teachPlan: string 教学计划
     *   - createdAt: string 创建时间（ISO格式）
     *   - updatedAt: string 更新时间（ISO格式）
     */
    async getKnowledgeByCourseId(courseId) {
        const axios = createTeacherAuthorizedAxios();
        
        // 确保ID是字符串类型
            const courseIdStr = String(courseId);
            
            const response = await axios.get(`/api/knowledge/course/${courseIdStr}`);
            
            // 确保返回的所有ID字段都是字符串类型
            if (Array.isArray(response.data)) {
                response.data.forEach(item => {
                    if (item.knowledgeId !== undefined) item.knowledgeId = String(item.knowledgeId);
                    if (item.teacherId !== undefined) item.teacherId = String(item.teacherId);
                });
            }
            
            return response.data;
    },

    /**
     * 11.获取教师在特定课程中的知识点列表（需要token）
     * @param {string} courseId 课程ID
     * @param {string} teacherId 教师ID
     * @returns {Promise<Array<Object>>} 知识点列表
     * 每项字段同getKnowledgeByCourseId方法
     */
    async getKnowledgeByTeacherInCourse(courseId, teacherId) {
        const axios = createTeacherAuthorizedAxios();
        
        // 确保ID是字符串类型
        const courseIdStr = String(courseId);
        const teacherIdStr = String(teacherId);
        
        const response = await axios.get(`/api/knowledge/course/${courseIdStr}/teacher/${teacherIdStr}`);
        
        // 确保返回的所有ID字段都是字符串类型
        if (Array.isArray(response.data)) {
            response.data.forEach(item => {
                if (item.knowledgeId !== undefined) item.knowledgeId = String(item.knowledgeId);
                if (item.teacherId !== undefined) item.teacherId = String(item.teacherId);
            });
        }
        
        return response.data;
    },

    /**
     * 12.复制知识点到课程（需要token）
     * @param {string} knowledgeId 知识点ID
     * @param {string} courseId 课程ID
     * @returns {Promise<Object>} 复制后的知识点信息
     */
    async copyKnowledgeToCourse(knowledgeId, courseId) {
        const axios = createTeacherAuthorizedAxios();
        try {
            // 确保ID是字符串类型
            const knowledgeIdStr = String(knowledgeId);
            const courseIdStr = String(courseId);
            
            console.log(`尝试复制知识点(${knowledgeIdStr})到课程(${courseIdStr})`);
            
            // 调用API时将ID转换为BigNumber
            let knowledgeIdParam = knowledgeIdStr;
            let courseIdParam = courseIdStr;
            
            try {
                const bn = new BigNumber(knowledgeIdStr);
                knowledgeIdParam = bn.toString();
        } catch (error) {
                console.error('无法将知识点ID转换为BigNumber:', error);
            }
            
            try {
                const bn = new BigNumber(courseIdStr);
                courseIdParam = bn.toString();
            } catch (error) {
                console.error('无法将课程ID转换为BigNumber:', error);
            }
            
            const response = await axios.post(`/api/knowledge/${knowledgeIdParam}/copy/course/${courseIdParam}`);
            
            // 确保返回的所有ID字段都是字符串类型
            if (response.data) {
                if (response.data.knowledgeId !== undefined) response.data.knowledgeId = String(response.data.knowledgeId);
                if (response.data.teacherId !== undefined) response.data.teacherId = String(response.data.teacherId);
            }
            
            return response.data;
        } catch (error) {
            console.error('复制知识点失败:', error.response ? error.response.data : error.message);
            throw error;
        }
    },

    /**
     * 13.添加已有知识点到指定课程（需要token）
     * @param {string} knowledgeId 知识点ID
     * @param {string} courseId 目标课程ID
     * @returns {Promise<Object>} 操作结果
     * 返回字段：由后端定义，通常包含成功状态和消息
     */
    async appendKnowledgeToCourse(knowledgeId, courseId) {
        const axios = createTeacherAuthorizedAxios();
        try {
            // 确保ID是字符串类型
            const knowledgeIdStr = String(knowledgeId);
            const courseIdStr = String(courseId);
            
            console.log(`尝试将知识点(${knowledgeIdStr})添加到课程(${courseIdStr})`);
            const response = await axios.post(`/api/knowledge/${knowledgeIdStr}/append/course/${courseIdStr}`);
            console.log('添加知识点到课程响应:', response.data);
            return response.data;
        } catch (error) {
            console.error('添加知识点到课程失败:', error.response ? error.response.data : error.message);
            throw error;
        }
    },

    /**
     * 14.根据知识点ID获取题目列表（需要token）
     * @param {string} knowledgeId 知识点ID
     * @returns {Promise<Array<Object>>} 题目列表
     */
    async getQuestionsByKnowledgeId(knowledgeId) {
        const axios = createTeacherAuthorizedAxios();
        try {
            // 确保ID是字符串类型
            const knowledgeIdStr = String(knowledgeId);
            
            // 调用API时将ID转换为BigNumber
            let knowledgeIdParam = knowledgeIdStr;
            
            try {
                const bn = new BigNumber(knowledgeIdStr);
                knowledgeIdParam = bn.toString();
            } catch (error) {
                console.error('无法将知识点ID转换为BigNumber:', error);
            }
            
            const response = await axios.get(`/api/question/knowledge/${knowledgeIdParam}`);
            
            // 确保返回的所有ID字段都是字符串类型
            if (Array.isArray(response.data)) {
                response.data.forEach(item => {
                    if (item.questionId !== undefined) item.questionId = String(item.questionId);
                    if (item.teacherId !== undefined) item.teacherId = String(item.teacherId);
                    if (item.knowledgeId !== undefined) item.knowledgeId = String(item.knowledgeId);
                });
            }
            
            return response.data;
        } catch (error) {
            console.error('获取知识点题目列表失败:', error.response ? error.response.data : error.message);
            throw error;
        }
    },

    /**
     * 15.根据条件搜索知识点下的题目（需要token）
     * @param {string} knowledgeId 知识点ID
     * @param {Object} questionQueryDTO 查询条件
     * @param {string} [questionQueryDTO.questionType] 题目类型（可选）
     * @param {string} [questionQueryDTO.difficulty] 难度等级（可选）
     * @param {string} [questionQueryDTO.startTime] 开始时间（可选，YYYY-MM-DD）
     * @param {string} [questionQueryDTO.endTime] 结束时间（可选，YYYY-MM-DD）
     * @returns {Promise<Array<Object>>} 题目列表
     */
    async searchQuestionsInKnowledgeConditionally(knowledgeId, questionQueryDTO) {
        const axios = createTeacherAuthorizedAxios();
        try {
            // 确保ID是字符串类型
            const knowledgeIdStr = String(knowledgeId);
            
            console.log(`条件搜索知识点题目，知识点ID: ${knowledgeIdStr}, 查询条件:`, questionQueryDTO);
            
            const response = await axios.get(`/api/question/knowledge/${knowledgeIdStr}/conditions`, { params: questionQueryDTO });
            
            // 确保返回的所有ID字段都是字符串类型
            if (Array.isArray(response.data)) {
                response.data.forEach(item => {
                    if (item.questionId !== undefined) item.questionId = String(item.questionId);
                    if (item.teacherId !== undefined) item.teacherId = String(item.teacherId);
                    if (item.knowledgeId !== undefined) item.knowledgeId = String(item.knowledgeId);
                });
            }
            
            return response.data;
        } catch (error) {
            console.error('条件搜索知识点题目失败:', error.response ? error.response.data : error.message);
            throw error;
        }
    },

    /**
     * 16.根据关键词搜索知识点（需要token）
     * @param {string} keyword 搜索关键词
     * @returns {Promise<Array<Object>>} 知识点列表
     * 每项字段同getKnowledgeByCourseId方法
     */
    async searchKnowledge(keyword) {
        const axios = createTeacherAuthorizedAxios();
        try {
            console.log(`搜索知识点，关键词: ${keyword}`);
            
            const response = await axios.get('/api/knowledge/search', {
                params: { keyword }
            });
            
            // 确保返回的所有ID字段都是字符串类型
            if (Array.isArray(response.data)) {
                response.data.forEach(item => {
                    if (item.knowledgeId !== undefined) item.knowledgeId = String(item.knowledgeId);
                    if (item.teacherId !== undefined) item.teacherId = String(item.teacherId);
                });
            }
            
            return response.data;
        } catch (error) {
            console.error('搜索知识点失败:', error.response ? error.response.data : error.message);
            throw error;
        }
    },

    /**
     * 17.调整知识点在课程中的位置（需要token）
     * @param {string} courseId 课程ID
     * @param {string} knowledgeId 知识点ID
     * @param {number} position 新位置（从0开始的索引）
     * @returns {Promise<Object>} 操作结果
     */
    async resortKnowledgeInCourse(courseId, knowledgeId, position) {
        const axios = createTeacherAuthorizedAxios();
        try {
            // 确保ID是字符串类型
            const courseIdStr = String(courseId);
            const knowledgeIdStr = String(knowledgeId);
            
            console.log(`调整知识点位置，课程ID: ${courseIdStr}, 知识点ID: ${knowledgeIdStr}, 新位置: ${position}`);
            
            const response = await axios.put('/api/knowledge/resort-knowledge', {
                courseId: courseIdStr,
                knowledgeId: knowledgeIdStr,
                position: position
            });
            
            return response.data;
        } catch (error) {
            console.error('调整知识点位置失败:', error.response ? error.response.data : error.message);
            throw error;
        }
    },
    
    /**
     * 18.添加题目（需要token）
     * @param {Object} questionData 题目数据
     * @param {string} questionData.questionType 题目类型（选择题、填空题、判断题、简答题等）
     * @param {string} questionData.content 题目内容
     * @param {Array<Object>} [questionData.options] 选项（选择题必填）
     * @param {string} questionData.referenceAnswer 参考答案
     * @param {string} questionData.difficulty 难度等级（简单、中等、困难）
     * @param {number} questionData.scorePoints 分值
     * @param {string} [questionData.analysis] 解析（可选）
     * @param {string} questionData.teacherId 教师ID
     * @param {string} questionData.knowledgeId 知识点ID
     * @returns {Promise<Object>} 添加的题目数据
     */
    async addQuestion(questionData) {
        const axios = createTeacherAuthorizedAxios();
        try {
            console.log('添加题目，数据:', questionData);
            
            const response = await axios.post('/api/question/save', questionData);
            return response.data;
        } catch (error) {
            console.error('添加题目失败:', error.response ? error.response.data : error.message);
            throw error;
        }
    },
    
    /**
     * 19.更新题目（需要token）
     * @param {Object} questionData 题目数据
     * @param {string} questionData.questionId 题目ID
     * @param {string} [questionData.questionType] 题目类型（选择题、填空题、判断题、简答题等）
     * @param {string} [questionData.content] 题目内容
     * @param {Array<Object>} [questionData.options] 选项（选择题必填）
     * @param {string} [questionData.referenceAnswer] 参考答案
     * @param {string} [questionData.difficulty] 难度等级（简单、中等、困难）
     * @param {number} [questionData.scorePoints] 分值
     * @param {string} [questionData.analysis] 解析（可选）
     * @returns {Promise<Object>} 更新后的题目数据
     */
    async updateQuestion(questionData) {
        const axios = createTeacherAuthorizedAxios();
        try {
            console.log('更新题目，数据:', questionData);
            
            const response = await axios.put('/api/question/update', questionData);
            return response.data;
        } catch (error) {
            console.error('更新题目失败:', error.response ? error.response.data : error.message);
            throw error;
        }
    },
    
    /**
     * 20.删除题目（需要token）
     * @param {string} questionId 题目ID
     * @returns {Promise<Object>} 操作结果
     */
    async deleteQuestion(questionId) {
        const axios = createTeacherAuthorizedAxios();
        try {
            console.log(`删除题目，题目ID: ${questionId}`);
            
            const response = await axios.delete(`/api/question/${questionId}`);
            return response.data;
        } catch (error) {
            console.error('删除题目失败:', error.response ? error.response.data : error.message);
            throw error;
        }
    },
    
    /**
     * 21.根据ID获取题目详情（需要token）
     * @param {string} questionId 题目ID
     * @returns {Promise<Object>} 题目详情
     * 返回字段：
     *   - questionId: string 问题ID
     *   - teacherId: string 教师ID
     *   - content: string 问题内容
     *   - questionType: string 问题类型
     *   - difficulty: string 难度
     *   - knowledgeId: string 知识点ID
     *   - referenceAnswer: string 参考答案
     *   - scorePoints: number 分值
     *   - options: Array 选项（选择题）
     *   - analysis: string 解析
     *   - createdAt: string 创建时间（ISO格式）
     *   - updatedAt: string 更新时间（ISO格式）
     */
    async getQuestionById(questionId) {
        const axios = createTeacherAuthorizedAxios();
        try {
            // 确保ID是字符串类型
            const questionIdStr = String(questionId);
            
            console.log(`获取题目详情，题目ID: ${questionIdStr}`);
            
            const response = await axios.get(`/api/question/${questionIdStr}`);
            
            // 确保返回的所有ID字段都是字符串类型
            if (response.data) {
                if (response.data.questionId !== undefined) response.data.questionId = String(response.data.questionId);
                if (response.data.teacherId !== undefined) response.data.teacherId = String(response.data.teacherId);
                if (response.data.knowledgeId !== undefined) response.data.knowledgeId = String(response.data.knowledgeId);
            }
            
            return response.data;
        } catch (error) {
            console.error('获取题目详情失败:', error.response ? error.response.data : error.message);
            throw error;
        }
    },
    
    /**
     * 22.根据题目类型获取题目列表（需要token）
     * @param {string} questionType 题目类型
     * @returns {Promise<Array<Object>>} 题目列表
     * 每项字段同getQuestionById方法返回字段
     */
    async getQuestionsByType(questionType) {
        const axios = createTeacherAuthorizedAxios();
        try {
            console.log(`根据类型获取题目列表，类型: ${questionType}`);
            
            const response = await axios.get(`/api/question/type/${questionType}`);
            
            // 确保返回的所有ID字段都是字符串类型
            if (Array.isArray(response.data)) {
                response.data.forEach(item => {
                    if (item.questionId !== undefined) item.questionId = String(item.questionId);
                    if (item.teacherId !== undefined) item.teacherId = String(item.teacherId);
                    if (item.knowledgeId !== undefined) item.knowledgeId = String(item.knowledgeId);
                });
            }
            
            return response.data;
        } catch (error) {
            console.error('根据类型获取题目列表失败:', error.response ? error.response.data : error.message);
            throw error;
        }
    },
    
    /**
     * 23.根据教师ID获取题目列表（需要token）
     * @param {string} teacherId 教师ID
     * @returns {Promise<Array<Object>>} 题目列表
     * 每项字段同getQuestionById方法返回字段
     */
    async getQuestionsByTeacher(teacherId) {
        const axios = createTeacherAuthorizedAxios();
        try {
            // 确保ID是字符串类型
            const teacherIdStr = String(teacherId);
            
            console.log(`根据教师ID获取题目列表，教师ID: ${teacherIdStr}`);
            
            const response = await axios.get(`/api/question/teacher/${teacherIdStr}`);
            
            // 确保返回的所有ID字段都是字符串类型
            if (Array.isArray(response.data)) {
                response.data.forEach(item => {
                    if (item.questionId !== undefined) item.questionId = String(item.questionId);
                    if (item.teacherId !== undefined) item.teacherId = String(item.teacherId);
                    if (item.knowledgeId !== undefined) item.knowledgeId = String(item.knowledgeId);
                });
            }
            
            return response.data;
        } catch (error) {
            console.error('根据教师ID获取题目列表失败:', error.response ? error.response.data : error.message);
            throw error;
        }
    },
    
    /**
     * 24.根据难度级别获取题目列表（需要token）
     * @param {string} difficulty 难度级别
     * @returns {Promise<Array<Object>>} 题目列表
     * 每项字段同getQuestionById方法返回字段
     */
    async getQuestionsByDifficulty(difficulty) {
        const axios = createTeacherAuthorizedAxios();
        try {
            console.log(`根据难度获取题目列表，难度: ${difficulty}`);
            
            const response = await axios.get(`/api/question/difficulty/${difficulty}`);
            
            // 确保返回的所有ID字段都是字符串类型
            if (Array.isArray(response.data)) {
                response.data.forEach(item => {
                    if (item.questionId !== undefined) item.questionId = String(item.questionId);
                    if (item.teacherId !== undefined) item.teacherId = String(item.teacherId);
                    if (item.knowledgeId !== undefined) item.knowledgeId = String(item.knowledgeId);
                });
            }
            
            return response.data;
        } catch (error) {
            console.error('根据难度获取题目列表失败:', error.response ? error.response.data : error.message);
            throw error;
        }
    },
};

// 考试api模块（8）
export const examAPI = {
    /**
     * 1.更新考试（需要token）
     * @param {Object} updateExamData 考试信息
     * @param {number} updateExamData.examId 考试ID
     * @param {string} updateExamData.title 考试标题
     * @param {string} updateExamData.description 描述
     * @param {number} updateExamData.courseId 课程ID
     * @param {number} updateExamData.teacherId 教师ID
     * @param {number} [updateExamData.knowledgeId] 知识点ID（可选）
     * @param {string} updateExamData.type 类型（考试/作业等）
     * @param {number} updateExamData.totalScore 总分
     * @param {number} updateExamData.durationMinutes 时长（分钟）
     * @param {string} updateExamData.startTime 开始时间（ISO格式）
     * @param {string} updateExamData.endTime 结束时间（ISO格式）
     * @param {string} updateExamData.status 状态
     * @returns {Promise<Object>} 更新后的考试信息
     * 返回字段：
     *   - examId: string 考试ID（返回时转为字符串）
     *   - title: string 考试标题
     *   - description: string 描述
     *   - courseId: string 课程ID（返回时转为字符串）
     *   - teacherId: string 教师ID（返回时转为字符串）
     *   - knowledgeId: string 知识点ID（返回时转为字符串，可能为空）
     *   - type: string 类型（考试/作业等）
     *   - totalScore: number 总分
     *   - durationMinutes: number 时长（分钟）
     *   - startTime: string 开始时间（ISO格式）
     *   - endTime: string 结束时间（ISO格式）
     *   - status: string 状态
     *   - createdAt: string 创建时间（ISO格式）
     *   - updatedAt: string 更新时间（ISO格式）
     */
    async updateExam(updateExamData) {
        const axios = createTeacherAuthorizedAxios();
        try {
            // 创建数据副本，避免修改原始数据
            const dataToSend = { ...updateExamData };
            
            // 确保ID字段是字符串类型
            if (dataToSend.examId !== undefined) dataToSend.examId = String(dataToSend.examId);
            if (dataToSend.courseId !== undefined) dataToSend.courseId = String(dataToSend.courseId);
            if (dataToSend.teacherId !== undefined) dataToSend.teacherId = String(dataToSend.teacherId);
            if (dataToSend.knowledgeId !== undefined) dataToSend.knowledgeId = String(dataToSend.knowledgeId);
            
            const response = await axios.put('/api/exam/update', dataToSend);
            
            // 确保返回的ID字段是字符串类型
            if (response.data) {
                if (response.data.examId !== undefined) response.data.examId = String(response.data.examId);
                if (response.data.courseId !== undefined) response.data.courseId = String(response.data.courseId);
                if (response.data.teacherId !== undefined) response.data.teacherId = String(response.data.teacherId);
                if (response.data.knowledgeId !== undefined) response.data.knowledgeId = String(response.data.knowledgeId);
            }
            
            return response.data;
        } catch (error) {
            console.error('更新考试失败:', error.response ? error.response.data : error.message);
            throw error;
        }
    },

    /**
     * 新增考试（需要token）
     * @param {Object} examData 考试信息
     * @param {string} examData.title 考试标题
     * @param {string} examData.description 描述
     * @param {number} examData.courseId 课程ID
     * @param {number} examData.teacherId 教师ID
     * @param {number} [examData.knowledgeId] 知识点ID（可选）
     * @param {string} examData.type 类型（考试/作业等）
     * @param {number} examData.totalScore 总分
     * @param {number} examData.durationMinutes 时长（分钟）
     * @param {string} examData.startTime 开始时间（ISO格式）
     * @param {string} examData.endTime 结束时间（ISO格式）
     * @param {string} examData.status 状态
     * @returns {Promise<Object>} 新增后的考试信息
     * 返回字段：同 updateExam 返回字段
     */
    async saveExam(examData) {
        const axios = createTeacherAuthorizedAxios();
        try {
            // 创建数据副本，避免修改原始数据
            const dataToSend = { ...examData };
            
            // 确保ID字段是字符串类型
            if (dataToSend.courseId !== undefined) dataToSend.courseId = String(dataToSend.courseId);
            if (dataToSend.teacherId !== undefined) dataToSend.teacherId = String(dataToSend.teacherId);
            if (dataToSend.knowledgeId !== undefined) dataToSend.knowledgeId = String(dataToSend.knowledgeId);
            
            const response = await axios.post('/api/exam/save', dataToSend);
            
            // 确保返回的ID字段是字符串类型
            if (response.data) {
                if (response.data.examId !== undefined) response.data.examId = String(response.data.examId);
                if (response.data.courseId !== undefined) response.data.courseId = String(response.data.courseId);
                if (response.data.teacherId !== undefined) response.data.teacherId = String(response.data.teacherId);
                if (response.data.knowledgeId !== undefined) response.data.knowledgeId = String(response.data.knowledgeId);
            }
            
            return response.data;
        } catch (error) {
            console.error('保存考试失败:', error.response ? error.response.data : error.message);
            throw error;
        }
    },

    /**
     * 2.根据考试ID获取考试信息（需要token）
     * @param {number} examId 考试ID
     * @returns {Promise<Object>} 考试信息
     * 返回字段：同 updateExam 返回字段
     */
    async getExamById(examId) {
        const axios = createTeacherAuthorizedAxios();
        try {
            // 确保ID是字符串类型
            const examIdStr = String(examId);
            
            const response = await axios.get(`/api/exam/${examIdStr}`);
            
            // 确保返回的ID字段是字符串类型
            if (response.data) {
                if (response.data.examId !== undefined) response.data.examId = String(response.data.examId);
                if (response.data.courseId !== undefined) response.data.courseId = String(response.data.courseId);
                if (response.data.teacherId !== undefined) response.data.teacherId = String(response.data.teacherId);
                if (response.data.knowledgeId !== undefined) response.data.knowledgeId = String(response.data.knowledgeId);
            }
            
            return response.data;
        } catch (error) {
            console.error('获取考试信息失败:', error.response ? error.response.data : error.message);
            throw error;
        }
    },

    /**
     * 3.根据教师ID获取考试列表（需要token）
     * @param {number} teacherId 教师ID
     * @returns {Promise<Array<Object>>} 考试列表
     * 每项字段：同 updateExam 返回字段
     */
    async getExamsByTeacher(teacherId) {
        const axios = createTeacherAuthorizedAxios();
        try {
            // 确保ID是字符串类型
            const teacherIdStr = String(teacherId);
            
            const response = await axios.get(`/api/exam/teacher/${teacherIdStr}`);
            
            // 确保返回的所有ID字段都是字符串类型
            if (Array.isArray(response.data)) {
                response.data.forEach(item => {
                    if (item.examId !== undefined) item.examId = String(item.examId);
                    if (item.courseId !== undefined) item.courseId = String(item.courseId);
                    if (item.teacherId !== undefined) item.teacherId = String(item.teacherId);
                    if (item.knowledgeId !== undefined) item.knowledgeId = String(item.knowledgeId);
                });
            }
            
            return response.data;
        } catch (error) {
            console.error('获取教师考试列表失败:', error.response ? error.response.data : error.message);
            throw error;
        }
    },

    /**
     * 4.根据课程ID获取考试列表（需要token）
     * @param {number} courseId 课程ID
     * @returns {Promise<Array<Object>>} 考试列表
     * 每项字段：同 updateExam 返回字段
     */
    async getExamsInCourse(courseId) {
        const axios = createTeacherAuthorizedAxios();
        try {
            // 确保ID是字符串类型
            const courseIdStr = String(courseId);
            
            const response = await axios.get(`/api/exam/course/${courseIdStr}`);
            
            // 确保返回的所有ID字段都是字符串类型
            if (Array.isArray(response.data)) {
                response.data.forEach(item => {
                    if (item.examId !== undefined) item.examId = String(item.examId);
                    if (item.courseId !== undefined) item.courseId = String(item.courseId);
                    if (item.teacherId !== undefined) item.teacherId = String(item.teacherId);
                    if (item.knowledgeId !== undefined) item.knowledgeId = String(item.knowledgeId);
                });
            }
            
            return response.data;
        } catch (error) {
            console.error('获取课程考试列表失败:', error.response ? error.response.data : error.message);
            throw error;
        }
    },

    /**
     * 5.根据课程ID和考试类型获取考试列表（需要token）
     * @param {number} courseId 课程ID
     * @param {string} type 考试类型
     * @returns {Promise<Array<Object>>} 考试列表
     * 每项字段：同 updateExam 返回字段
     */
    async getExamsInCourseByType(courseId, type) {
        const axios = createTeacherAuthorizedAxios();
        try {
            // 确保ID是字符串类型
            const courseIdStr = String(courseId);
            
            console.log(`获取课程的考试列表，课程ID: ${courseIdStr}, 类型: ${type}`);
            
            const response = await axios.get(`/api/exam/course/${courseIdStr}/type/${type}`);
            
            // 确保返回的所有ID字段都是字符串类型，避免精度丢失
            if (Array.isArray(response.data)) {
                response.data.forEach(item => {
                    if (item.examId !== undefined) item.examId = String(item.examId);
                    if (item.courseId !== undefined) item.courseId = String(item.courseId);
                    if (item.teacherId !== undefined) item.teacherId = String(item.teacherId);
                    if (item.knowledgeId !== undefined) item.knowledgeId = String(item.knowledgeId);
                });
            }
            
            return response.data;
        } catch (error) {
            console.error('获取课程考试列表失败:', error.response ? error.response.data : error.message);
            throw error;
        }
    },

    /**
     * 6.根据课程ID和教师ID获取考试列表（需要token）
     * @param {number} courseId 课程ID
     * @param {number} teacherId 教师ID
     * @returns {Promise<Array<Object>>} 考试列表
     * 每项字段：同 updateExam 返回字段
     */
    async getExamsInCourseByTeacher(courseId, teacherId) {
        const axios = createTeacherAuthorizedAxios();
        try {
            // 确保ID是字符串类型
            const courseIdStr = String(courseId);
            const teacherIdStr = String(teacherId);
            
            const response = await axios.get(`/api/exam/course/${courseIdStr}/teacher/${teacherIdStr}`);
            
            // 确保返回的所有ID字段都是字符串类型
            if (Array.isArray(response.data)) {
                response.data.forEach(item => {
                    if (item.examId !== undefined) item.examId = String(item.examId);
                    if (item.courseId !== undefined) item.courseId = String(item.courseId);
                    if (item.teacherId !== undefined) item.teacherId = String(item.teacherId);
                    if (item.knowledgeId !== undefined) item.knowledgeId = String(item.knowledgeId);
                });
            }
            
            return response.data;
        } catch (error) {
            console.error('获取课程教师考试列表失败:', error.response ? error.response.data : error.message);
            throw error;
        }
    },

    /**
     * 7.删除考试（需要token）
     * @param {number} id 考试ID
     * @returns {Promise<Object>} 删除结果
     * 返回字段：
     *   - success: boolean 是否删除成功
     *   - message: string 提示信息
     */
    async deleteExamById(id) {
        const axios = createTeacherAuthorizedAxios();
        try {
            // 确保ID是字符串类型
            const idStr = String(id);
            
            const response = await axios.delete(`/api/exam/${idStr}`);
            return response.data;
        } catch (error) {
            console.error('删除考试失败:', error.response ? error.response.data : error.message);
            throw error;
        }
    },

    /**
     * 8.获取参加考试的学生列表（需要token）
     * @param {number} examId 考试ID
     * @returns {Promise<Array<number>>} 学生ID列表
     */
    async getExamStudents(examId) {
        const axios = createTeacherAuthorizedAxios();
        try {
            // 确保ID是字符串类型
            const examIdStr = String(examId);

            console.log(`获取参加考试的学生列表，考试ID: ${examIdStr}`);

            const response = await axios.get(`/api/student-exam/exam/${examIdStr}/students`);

            // 确保返回的所有ID都是字符串类型，避免精度丢失
            if (Array.isArray(response.data)) {
                return response.data.map(id => String(id));
            }

            return response.data;
        } catch (error) {
            console.error('获取参加考试的学生列表失败:', error.response ? error.response.data : error.message);
            throw error;
        }
    },

    /**
     * 9.获取考试的学生成绩列表（教师视角）
     * @param {string|number} examId 考试ID
     * @returns {Promise<Array<Object>>} 学生成绩列表
     * 返回字段：
     * - studentId: 学生ID
     * - fullName: 学生姓名
     * - score: 考试分数
     * - submitTime: 提交时间
     * - status: 考试状态（已完成/未完成等）
     */
    async getExamStudentScores(examId) {
        const axios = createTeacherAuthorizedAxios();
        try {
            const examIdStr = String(examId);
            console.log(`获取考试学生成绩列表，考试ID: ${examIdStr}`);

            const response = await axios.get(`/api/student-exam/exam/${examIdStr}/scores`);

            // 确保返回的学生ID都是字符串类型
            if (Array.isArray(response.data)) {
                return response.data.map(student => ({
                    ...student,
                    studentId: String(student.studentId)
                }));
            }

            return response.data;
        } catch (error) {
            console.error('获取考试学生成绩列表失败:', error.response ? error.response.data : error.message);
            throw error;
        }
    },

    /**
     * 10.获取学生在特定考试中的答题详情（教师视角）
     * @param {string|number} examId 考试ID
     * @param {string|number} studentId 学生ID
     * @returns {Promise<Array<Object>>} 学生答题详情列表
     * 返回字段：
     * - answerId: 答案ID
     * - questionId: 题目ID
     * - questionContent: 题目内容
     * - answerContent: 学生答案
     * - score: 得分
     * - totalScore: 总分
     * - questionType: 题目类型
     */
    async getStudentExamAnswers(examId, studentId) {
        const axios = createTeacherAuthorizedAxios();
        try {
            const examIdStr = String(examId);
            const studentIdStr = String(studentId);
            console.log(`获取学生答题详情，考试ID: ${examIdStr}, 学生ID: ${studentIdStr}`);

            const response = await axios.get(`/api/student-exam/exam/${examIdStr}/student/${studentIdStr}/answers`);

            return response.data;
        } catch (error) {
            console.error('获取学生答题详情失败:', error.response ? error.response.data : error.message);
            throw error;
        }
    },

    /**
     * 11.获取考试统计信息（教师视角）
     * @param {string|number} examId 考试ID
     * @returns {Promise<Object>} 考试统计信息
     * 返回字段：
     * - totalStudents: 总学生数
     * - submittedStudents: 已提交学生数
     * - averageScore: 平均分
     * - maxScore: 最高分
     * - minScore: 最低分
     * - scoreDistribution: 分数分布
     */
    async getExamStatistics(examId) {
        const axios = createTeacherAuthorizedAxios();
        try {
            const examIdStr = String(examId);
            console.log(`获取考试统计信息，考试ID: ${examIdStr}`);

            const response = await axios.get(`/api/student-exam/exam/${examIdStr}/statistics`);

            return response.data;
        } catch (error) {
            console.error('获取考试统计信息失败:', error.response ? error.response.data : error.message);
            throw error;
        }
    }
};

// 学习计划api模块（待讨论）
export const learningPlanAPI = {
    /**
     * 1.更新学习计划进度（需要token）
     * @param {Object} params 查询参数
     * @param {string} params.planId 学习计划ID
     * @param {string} params.activityId 活动ID
     * @param {string} params.status 状态
     * @param {string} [params.feedback] 反馈（可选）
     * @returns {Promise<Object>} 更新结果
     * 返回字段：由后端返回，通常包含进度相关信息
     */
    async updatePlanProgress(params) {
        const axios = createStudentAuthorizedAxios();
        const response = await axios.put('/api/learning-plan/update-progress', null, { 
            params: {
                planId: params.planId,
                activityId: params.activityId,
                status: params.status,
                feedback: params.feedback
            } 
        });
        return response.data;
    },

    /**
     * 获取学习计划推荐资源（需要token）
     * @param {string} planId 学习计划ID
     * @returns {Promise<Array<Object>>} 推荐资源列表
     * 每项字段：由后端返回，通常包含资源相关信息
     */
    async getPlanRecommendedResources(planId) {
        const axios = createStudentAuthorizedAxios();
        const response = await axios.get(`/api/learning-plan/${planId}/resources`);
        return response.data;
    },

    /**
     * 搜索学习计划（需要token）
     * @param {number} studentId 学生ID
     * @param {string} keywords 关键词
     * @returns {Promise<Array<Object>>} 学习计划列表
     * 每项字段：由后端返回，通常包含计划相关信息
     */
    async searchLearningPlans(studentId, keywords) {
        const axios = createStudentAuthorizedAxios();
        const response = await axios.get(`/api/learning-plan/student/${studentId}/search`, { params: { keywords } });
        return response.data;
    },

    /**
     * 搜索学习计划推荐资源（需要token）
     * @param {number} studentId 学生ID
     * @param {string} keywords 关键词
     * @returns {Promise<Array<Object>>} 推荐资源列表
     * 每项字段：由后端返回，通常包含资源相关信息
     */
    async searchPlanResources(studentId, keywords) {
        const axios = createStudentAuthorizedAxios();
        const response = await axios.get(`/api/learning-plan/student/${studentId}/resources/search`, { params: { keywords } });
        return response.data;
    },

    /**
     * 根据计划名称获取推荐资源（需要token）
     * @param {number} studentId 学生ID
     * @param {string} planName 计划名称
     * @returns {Promise<Array<Object>>} 推荐资源列表
     * 每项字段：由后端返回，通常包含资源相关信息
     */
    async getPlanResourcesByName(studentId, planName) {
        const axios = createStudentAuthorizedAxios();
        const response = await axios.get(`/api/learning-plan/student/${studentId}/resources/by-name`, { params: { planName } });
        return response.data;
    },

    /**
     * 获取学习计划历史（需要token）
     * @param {number} studentId 学生ID
     * @returns {Promise<Array<Object>>} 历史计划列表
     * 每项字段：由后端返回，通常包含计划相关信息
     */
    async getLearningPlanHistory(studentId) {
        const axios = createStudentAuthorizedAxios();
        const response = await axios.get(`/api/learning-plan/student/${studentId}/history`);
        return response.data;
    },

    /**
     * 生成学习计划（需要token）
     * @param {number} studentId 学生ID
     * @param {string} targetGoal 目标
     * @param {number} timeFrame 时间范围（天）
     * @param {Array<number>} [courseIds] 课程ID数组（可选）
     * @param {Array<number>} [knowledgeIds] 知识点ID数组（可选）
     * @returns {Promise<Object>} 生成的学习计划
     * 字段：由后端返回，通常包含计划相关信息
     */
    async generateLearningPlan(studentId, targetGoal, timeFrame, courseIds, knowledgeIds) {
        const axios = createStudentAuthorizedAxios();
        const params = { targetGoal, timeFrame };
        if (courseIds) params.courseIds = courseIds;
        if (knowledgeIds) params.knowledgeIds = knowledgeIds;
        const response = await axios.get(`/api/learning-plan/student/${studentId}/generate`, { params });
        return response.data;
    },

    /**
     * 通过知识点名称生成学习计划（需要token）
     * @param {number} studentId 学生ID
     * @param {string} targetGoal 目标
     * @param {number} timeFrame 时间范围（天）
     * @param {Array<string>} knowledgeNames 知识点名称数组
     * @returns {Promise<Object>} 生成的学习计划
     * 字段：由后端返回，通常包含计划相关信息
     */
    async generateLearningPlanByKnowledgeName(studentId, targetGoal, timeFrame, knowledgeNames) {
        const axios = createStudentAuthorizedAxios();
        const params = { targetGoal, timeFrame, knowledgeNames };
        const response = await axios.get(`/api/learning-plan/student/${studentId}/generate/knowledge-names`, { params });
        return response.data;
    },

    /**
     * 通过课程名称生成学习计划（需要token）
     * @param {number} studentId 学生ID
     * @param {string} targetGoal 目标
     * @param {number} timeFrame 时间范围（天）
     * @param {Array<string>} courseNames 课程名称数组
     * @returns {Promise<Object>} 生成的学习计划
     * 字段：由后端返回，通常包含计划相关信息
     */
    async generateLearningPlanByCourseName(studentId, targetGoal, timeFrame, courseNames) {
        const axios = createStudentAuthorizedAxios();
        const params = { targetGoal, timeFrame, courseNames };
        const response = await axios.get(`/api/learning-plan/student/${studentId}/generate/course-names`, { params });
        return response.data;
    },

    /**
     * 获取每日学习计划活动（需要token）
     * @param {number} studentId 学生ID
     * @param {string} date 日期（YYYY-MM-DD）
     * @returns {Promise<Array<Object>>} 每日活动列表
     * 每项字段：由后端返回，通常包含活动相关信息
     */
    async getDailyPlanActivities(studentId, date) {
        const axios = createStudentAuthorizedAxios();
        const response = await axios.get(`/api/learning-plan/student/${studentId}/daily`, { params: { date } });
        return response.data;
    },

    /**
     * 通过计划名称获取每日学习计划（需要token）
     * @param {number} studentId 学生ID
     * @param {string} planName 计划名称
     * @param {string} date 日期（YYYY-MM-DD）
     * @returns {Promise<Array<Object>>} 每日活动列表
     * 每项字段：由后端返回，通常包含活动相关信息
     */
    async getDailyPlanByName(studentId, planName, date) {
        const axios = createStudentAuthorizedAxios();
        const response = await axios.get(`/api/learning-plan/student/${studentId}/daily/by-name`, { params: { planName, date } });
        return response.data;
    },

    /**
     * 获取当前学习计划（需要token）
     * @param {number} studentId 学生ID
     * @returns {Promise<Object>} 当前学习计划
     * 字段：由后端返回，通常包含计划相关信息
     */
    async getCurrentLearningPlan(studentId) {
        const axios = createStudentAuthorizedAxios();
        const response = await axios.get(`/api/learning-plan/student/${studentId}/current`);
        return response.data;
    }
};

// 考勤api模块（待完善bug）
export const attendanceAPI = {
    /**
     * 1.更新考勤状态（需要token）
     * @param {number} attendanceId 考勤ID
     * @param {string} status 状态
     * @param {string} [remark] 备注（可选）
     * @returns {Promise<Object>} 更新结果
     * 返回字段：由后端返回，通常包含考勤相关信息
     */
    async updateAttendanceStatus(attendanceId, status, remark) {
        const axios = createTeacherAuthorizedAxios();
        const params = { status };
        if (remark) params.remark = remark;
        const response = await axios.put(`/api/attendance/${attendanceId}/status`, null, { params });
        return response.data;
    },

    /**
     * 2.按课程名称更新考勤（需要token）
     * @param {number} studentId 学生ID
     * @param {string} courseName 课程名称
     * @param {string} date 日期（YYYY-MM-DD）
     * @param {string} status 状态
     * @param {string} [remark] 备注（可选）
     * @returns {Promise<Object>} 更新结果
     * 返回字段：由后端返回，通常包含考勤相关信息
     */
    async updateAttendanceByCourseName(studentId, courseName, date, status, remark) {
        const axios = createStudentAuthorizedAxios();
        const params = { courseName, date, status };
        if (remark) params.remark = remark;
        const response = await axios.put(`/api/attendance/student/${studentId}/course/update`, null, { params });
        return response.data;
    },

    /**
     * 3.新增考勤（需要token）
     * @param {Object} attendanceData 考勤信息
     * @param {number} attendanceData.courseId 课程ID
     * @param {number} attendanceData.studentId 学生ID
     * @param {string} attendanceData.status 状态
     * @param {string} attendanceData.attendanceDate 考勤日期（YYYY-MM-DD）
     * @param {string} [attendanceData.remark] 备注（可选）
     * @returns {Promise<Object>} 新增后的考勤信息
     * 返回字段：
     *   - attendanceId: number 考勤ID
     *   - courseId: number 课程ID
     *   - studentId: number 学生ID
     *   - status: string 状态
     *   - attendanceDate: string 考勤日期
     *   - remark: string 备注
     *   - recordedBy: number 记录人ID
     *   - createdAt: string 创建时间（ISO格式）
     *   - updatedAt: string 更新时间（ISO格式）
     *   - courseName: string 课程名称
     *   - studentName: string 学生姓名
     *   - recorderName: string 记录人姓名
     *   - absent: boolean 是否缺勤
     *   - late: boolean 是否迟到
     *   - present: boolean 是否出勤
     */
    async saveAttendance(attendanceData) {
        const axios = createTeacherAuthorizedAxios();
        const response = await axios.post('/api/attendance/save', attendanceData);
        return response.data;
    },

    /**
     * 4.批量新增考勤（需要token）
     * @param {Array<Object>} attendanceList 考勤信息数组
     * @returns {Promise<Object>} 批量新增结果
     * 返回字段：由后端返回，通常包含批量操作结果
     */
    async batchSaveAttendance(attendanceList) {
        const axios = createTeacherAuthorizedAxios();
        const response = await axios.post('/api/attendance/batch-save', attendanceList);
        return response.data;
    },

    /**
     * 5.获取学生考勤记录（需要token）
     * @param {number} studentId 学生ID
     * @returns {Promise<Array<Object>>} 考勤记录列表
     * 每项字段：同 saveAttendance 返回字段
     */
    async getStudentAttendance(studentId) {
        const axios = createStudentAuthorizedAxios();
        const response = await axios.get(`/api/attendance/student/${studentId}`);
        return response.data;
    },

    /**
     * 6.根据状态获取学生考勤记录（需要token）
     * @param {number} studentId 学生ID
     * @param {string} status 状态
     * @returns {Promise<Array<Object>>} 考勤记录列表
     * 每项字段：同 saveAttendance 返回字段
     */
    async getStudentAttendanceByStatus(studentId, status) {
        const axios = createStudentAuthorizedAxios();
        const response = await axios.get(`/api/attendance/student/${studentId}/status/${status}`);
        return response.data;
    },

    /**
     * 7.获取学生考勤统计（需要token）
     * @param {number} studentId 学生ID
     * @returns {Promise<Object>} 统计信息
     * 字段：由后端返回，通常包含统计相关信息
     */
    async getAttendanceStatistics(studentId) {
        const axios = createStudentAuthorizedAxios();
        const response = await axios.get(`/api/attendance/student/${studentId}/statistics`);
        return response.data;
    },

    /**
     * 8.搜索考勤记录（需要token）
     * @param {number} studentId 学生ID
     * @param {Object} params 查询参数
     * @param {string} [params.keywords] 关键词（可选）
     * @param {string} [params.status] 状态（可选）
     * @param {string} [params.startDate] 起始日期（可选，YYYY-MM-DD）
     * @param {string} [params.endDate] 结束日期（可选，YYYY-MM-DD）
     * @returns {Promise<Array<Object>>} 考勤记录列表
     * 每项字段：同 saveAttendance 返回字段
     */
    async searchAttendance(studentId, params) {
        const axios = createStudentAuthorizedAxios();
        const response = await axios.get(`/api/attendance/student/${studentId}/search`, { params });
        return response.data;
    },

    /**
     * 9.按日期范围获取学生考勤记录（需要token）
     * @param {number} studentId 学生ID
     * @param {string} startDate 起始日期（YYYY-MM-DD）
     * @param {string} endDate 结束日期（YYYY-MM-DD）
     * @returns {Promise<Array<Object>>} 考勤记录列表
     * 每项字段：同 saveAttendance 返回字段
     */
    async getStudentAttendanceByDateRange(studentId, startDate, endDate) {
        const axios = createStudentAuthorizedAxios();
        const response = await axios.get(`/api/attendance/student/${studentId}/date-range`, { params: { startDate, endDate } });
        return response.data;
    },

    /**
     * 10.获取学生某课程的考勤记录（需要token）
     * @param {number} studentId 学生ID
     * @param {number} courseId 课程ID
     * @returns {Promise<Array<Object>>} 考勤记录列表
     * 每项字段：同 saveAttendance 返回字段
     */
    async getStudentCourseAttendance(studentId, courseId) {
        const axios = createStudentAuthorizedAxios();
        const response = await axios.get(`/api/attendance/student/${studentId}/course/${courseId}`);
        return response.data;
    },

    /**
     * 11.获取学生某课程的考勤统计（需要token）
     * @param {number} studentId 学生ID
     * @param {number} courseId 课程ID
     * @returns {Promise<Object>} 统计信息
     * 字段：由后端返回，通常包含统计相关信息
     */
    async getCourseAttendanceStatistics(studentId, courseId) {
        const axios = createStudentAuthorizedAxios();
        const response = await axios.get(`/api/attendance/student/${studentId}/course/${courseId}/statistics`);
        return response.data;
    },

    /**
     * 12.按课程名称获取考勤统计（需要token）
     * @param {number} studentId 学生ID
     * @param {string} courseName 课程名称
     * @returns {Promise<Object>} 统计信息
     * 字段：由后端返回，通常包含统计相关信息
     */
    async getAttendanceStatisticsByCourseName(studentId, courseName) {
        const axios = createStudentAuthorizedAxios();
        const response = await axios.get(`/api/attendance/student/${studentId}/course/statistics`, { params: { courseName } });
        return response.data;
    },

    /**
     * 13.按课程名称获取考勤记录（需要token）
     * @param {number} studentId 学生ID
     * @param {string} courseName 课程名称
     * @returns {Promise<Array<Object>>} 考勤记录列表
     * 返回字段：
     *   - attendanceId: number 考勤ID
     *   - courseId: number 课程ID
     *   - studentId: number 学生ID
     *   - status: string 状态
     *   - attendanceDate: string 考勤日期
     *   - remark: string 备注
     *   - recordedBy: number 记录人ID
     *   - createdAt: string 创建时间（ISO格式）
     *   - updatedAt: string 更新时间（ISO格式）
     *   - courseName: string 课程名称
     *   - studentName: string 学生姓名
     *   - recorderName: string 记录人姓名
     *   - absent: boolean 是否缺勤
     *   - late: boolean 是否迟到
     *   - present: boolean 是否出勤
     */
    async getStudentAttendanceByCourseName(studentId, courseName) {
        const axios = createStudentAuthorizedAxios();
        const response = await axios.get(`/api/attendance/student/${studentId}/course/name`, { params: { courseName } });
        return response.data;
    },
    
    /**
     * 14.获取课程的考勤记录（需要token）
     * @param {number} courseId 课程ID
     * @returns {Promise<Array<Object>>} 考勤记录列表
     * 返回字段：
     *   - attendanceId: number 考勤ID
     *   - courseId: number 课程ID
     *   - studentId: number 学生ID
     *   - status: string 状态
     *   - attendanceDate: string 考勤日期
     *   - remark: string 备注
     *   - recordedBy: number 记录人ID
     *   - createdAt: string 创建时间（ISO格式）
     *   - updatedAt: string 更新时间（ISO格式）
     *   - courseName: string 课程名称
     *   - studentName: string 学生姓名
     *   - recorderName: string 记录人姓名
     *   - absent: boolean 是否缺勤
     *   - late: boolean 是否迟到
     *   - present: boolean 是否出勤
     */
    async getCourseAttendance(courseId) {
        const axios = createTeacherAuthorizedAxios();
        try {
            // 确保ID是字符串类型
            const courseIdStr = String(courseId);
            
            console.log(`获取课程的考勤记录，课程ID: ${courseIdStr}`);
            
            const response = await axios.get(`/api/attendance/course/${courseIdStr}`);
            
            // 确保返回的所有ID字段都是字符串类型
            if (Array.isArray(response.data)) {
                response.data.forEach(item => {
                    if (item.attendanceId !== undefined) item.attendanceId = String(item.attendanceId);
                    if (item.courseId !== undefined) item.courseId = String(item.courseId);
                    if (item.studentId !== undefined) item.studentId = String(item.studentId);
                    if (item.recordedBy !== undefined) item.recordedBy = String(item.recordedBy);
                });
            }
            
            return response.data;
        } catch (error) {
            console.error('获取课程考勤记录失败:', error.response ? error.response.data : error.message);
            throw error;
        }
    },

    /**
     * 15.根据考勤ID删除考勤实体（需要token）
     * @param {number} attendanceId 考勤ID
     * @returns {Promise<Object>} 删除结果
     * 返回字段：
     *   - success: boolean 是否删除成功
     *   - message: string 提示信息
     */
    async deleteAttendance(attendanceId) {
        const axios = createTeacherAuthorizedAxios();
        try {
            // 确保ID是字符串类型
            const attendanceIdStr = String(attendanceId);
            
            console.log(`删除考勤记录，考勤ID: ${attendanceIdStr}`);
            
            const response = await axios.delete(`/api/attendance/${attendanceIdStr}`);
            return response.data;
        } catch (error) {
            console.error('删除考勤记录失败:', error.response ? error.response.data : error.message);
            throw error;
        }
    },

    /**
     * 16.批量删除考勤实体（需要token）
     * @param {Array<number>} attendanceIds 考勤ID数组
     * @returns {Promise<Object>} 删除结果
     * 返回字段：
     *   - success: boolean 是否删除成功
     *   - message: string 提示信息
     *   - count: number 成功删除的记录数
     */
    async batchDeleteAttendance(attendanceIds) {
        const axios = createTeacherAuthorizedAxios();
        try {
            // 确保所有ID都是字符串类型
            const attendanceIdsStr = attendanceIds.map(id => String(id));
            
            console.log(`批量删除考勤记录，考勤ID数量: ${attendanceIdsStr.length}`);
            
            const response = await axios.delete('/api/attendance/batch', {
                data: attendanceIdsStr
            });
            return response.data;
        } catch (error) {
            console.error('批量删除考勤记录失败:', error.response ? error.response.data : error.message);
            throw error;
        }
    },

    /**
     * 17.学生签到考勤（需要token）
     * @param {number} attendanceId 考勤ID
     * @param {number} studentId 学生ID
     * @returns {Promise<Object>} 签到结果
     * 返回字段：
     *   - success: boolean 是否签到成功
     *   - message: string 提示信息
     *   - attendanceRecord: Object 更新后的考勤记录
     */
    async studentAttendanceSignIn(attendanceId, studentId) {
        const axios = createStudentAuthorizedAxios();
        try {
            // 确保ID是字符串类型
            const attendanceIdStr = String(attendanceId);
            
            console.log(`学生签到考勤，考勤ID: ${attendanceIdStr}, 学生ID: ${studentId}`);
            
            // 使用更新考勤状态接口，将状态更新为"已到"
            const response = await axios.put(`/api/attendance/${attendanceIdStr}/status`, null, { 
                params: { 
                    status: '已到',
                    remark: `学生${studentId}自主签到`
                } 
            });
            
            // 格式化返回结果以保持与原接口一致
            return {
                success: true,
                message: '签到成功',
                attendanceRecord: response.data
            };
        } catch (error) {
            console.error('学生签到考勤失败:', error.response ? error.response.data : error.message);
            return {
                success: false,
                message: error.response ? error.response.data.message || '签到失败' : '签到失败',
                error: error.message
            };
        }
    },
};

// 学生考试相关 API（代后端完善后写，可以先写模板）
export const studentExamAPI = {
    /**
     * 1.提交单份考试答卷（需要token）
     * @param {Object} answerData 答卷信息
     * @param {number} answerData.answerId 答案ID（可选，提交新答卷时可不填）
     * @param {number} answerData.examId 考试ID
     * @param {number} answerData.questionId 题目ID
     * @param {number} answerData.studentId 学生ID
     * @param {string} answerData.studentAnswer 学生作答内容
     * @param {number} [answerData.score] 得分（可选，主观题可由教师批改后填写）
     * @param {string} [answerData.feedback] 反馈（可选）
     * @param {number} [answerData.gradedBy] 批改教师ID（可选）
     * @param {string} [answerData.gradedAt] 批改时间（可选，ISO格式）
     * @param {string} [answerData.createdAt] 创建时间（可选，ISO格式）
     * @param {string} [answerData.updatedAt] 更新时间（可选，ISO格式）
     * @param {string} [answerData.examTitle] 考试标题（可选）
     * @param {string} [answerData.questionContent] 题目内容（可选）
     * @param {string} [answerData.questionType] 题目类型（可选）
     * @param {string} [answerData.referenceAnswer] 参考答案（可选）
     * @param {string} [answerData.teacherName] 批改教师姓名（可选）
     * @param {boolean} [answerData.graded] 是否已批改（可选）
     * @returns {Promise<Object>} 提交结果，由后端返回
     */
    async submitAnswer(answerData) {
        const axios = createStudentAuthorizedAxios();
        const response = await axios.post('/api/student-exam/submit', answerData);
        return response.data;
    },

    /**
     * 2.批量提交考试答卷（需要token）
     * @param {Array<Object>} answerList 答卷信息数组，每项结构如下：
     *   - answerId: number 答案ID（可选）
     *   - examId: number 考试ID
     *   - questionId: number 题目ID
     *   - studentId: number 学生ID
     *   - studentAnswer: string 学生作答内容
     *   - score: number 得分（可选）
     *   - feedback: string 反馈（可选）
     *   - gradedBy: number 批改教师ID（可选）
     *   - gradedAt: string 批改时间（可选，ISO格式）
     *   - createdAt: string 创建时间（可选，ISO格式）
     *   - updatedAt: string 更新时间（可选，ISO格式）
     *   - examTitle: string 考试标题（可选）
     *   - questionContent: string 题目内容（可选）
     *   - questionType: string 题目类型（可选）
     *   - referenceAnswer: string 参考答案（可选）
     *   - teacherName: string 批改教师姓名（可选）
     *   - graded: boolean 是否已批改（可选）
     * @returns {Promise<Object>} 批量提交结果，由后端返回
     */
    async batchSubmitAnswers(answerList) {
        const axios = createStudentAuthorizedAxios();
        const response = await axios.post('/api/student-exam/batch-submit', answerList);
        return response.data;
    },

    /**
     * 3.搜索考试及试题（需要token）
     * @param {number} studentId 学生ID
     * @param {string} keywords 关键词
     * @returns {Promise<Object>} 搜索结果，由后端返回
     */
    async searchExamsAndQuestions(studentId, keywords) {
        const axios = createStudentAuthorizedAxios();
        const response = await axios.get(`/api/student-exam/student/${studentId}/search-exams`, { params: { keywords } });
        return response.data;
    },

    /**
     * 4.获取学生所有考试成绩（需要token）
     * @param {number} studentId 学生ID
     * @returns {Promise<Array<Object>>} 成绩列表
     */
    async getStudentExamScores(studentId) {
        const axios = createStudentAuthorizedAxios();
        const response = await axios.get(`/api/student-exam/student/${studentId}/scores`);
        return response.data;
    },

    /**
     * 5.按关键词搜索学生考试成绩（需要token）
     * @param {number} studentId 学生ID
     * @param {string} keywords 关键词
     * @returns {Promise<Array<Object>>} 成绩列表
     */
    async searchStudentExamScores(studentId, keywords) {
        const axios = createStudentAuthorizedAxios();
        const response = await axios.get(`/api/student-exam/student/${studentId}/scores/search`, { params: { keywords } });
        return response.data;
    },

    /**
     * 6.获取学生某场考试的所有答卷（需要token）
     * @param {number} studentId 学生ID
     * @param {number} examId 考试ID
     * @returns {Promise<Array<Object>>} 答卷列表
     */
    async getStudentExamAnswers(studentId, examId) {
        const axios = createStudentAuthorizedAxios();
        const response = await axios.get(`/api/student-exam/student/${studentId}/exam/${examId}`);
        return response.data;
    },

    /**
     * 7.按题目内容搜索学生某场考试的答卷（需要token）
     * @param {number} studentId 学生ID
     * @param {number} examId 考试ID
     * @param {string} content 题目内容关键词
     * @returns {Promise<Array<Object>>} 答卷列表
     */
    async getStudentAnswersByQuestionContent(studentId, examId, content) {
        const axios = createStudentAuthorizedAxios();
        const response = await axios.get(`/api/student-exam/student/${studentId}/exam/${examId}/search`, { params: { content } });
        return response.data;
    },

    /**
     * 8.获取学生某场考试的总成绩（需要token）
     * @param {number} studentId 学生ID
     * @param {number} examId 考试ID
     * @returns {Promise<Object>} 成绩对象
     */
    async getExamScore(studentId, examId) {
        const axios = createStudentAuthorizedAxios();
        const response = await axios.get(`/api/student-exam/student/${studentId}/exam/${examId}/score`);
        return response.data;
    },

    /**
     * 9.获取学生某场考试某题的答卷（需要token）
     * @param {number} studentId 学生ID
     * @param {number} examId 考试ID
     * @param {number} questionId 题目ID
     * @returns {Promise<Object>} 答卷信息
     */
    async getStudentQuestionAnswer(studentId, examId, questionId) {
        const axios = createStudentAuthorizedAxios();
        const response = await axios.get(`/api/student-exam/student/${studentId}/exam/${examId}/question/${questionId}`);
        return response.data;
    },

    /**
     * 10.获取学生某场考试详情（需要token）
     * @param {number} studentId 学生ID
     * @param {number} examId 考试ID
     * @returns {Promise<Object>} 考试详情
     */
    async getExamDetail(studentId, examId) {
        const axios = createStudentAuthorizedAxios();
        const response = await axios.get(`/api/student-exam/student/${studentId}/exam/${examId}/detail`);
        return response.data;
    },

    /**
     * 11.获取学生某场考试的智能分析（需要token）
     * @param {number} studentId 学生ID
     * @param {number} examId 考试ID
     * @returns {Promise<Object>} 分析结果
     */
    async analyzeExamResult(studentId, examId) {
        const axios = createStudentAuthorizedAxios();
        const response = await axios.get(`/api/student-exam/student/${studentId}/exam/${examId}/analysis`);
        return response.data;
    },

    /**
     * 12.获取学生某场考试的学习建议（需要token）
     * @param {number} studentId 学生ID
     * @param {number} examId 考试ID
     * @returns {Promise<Array<string>>} 建议列表
     */
    async generateLearningAdvice(studentId, examId) {
        const axios = createStudentAuthorizedAxios();
        const response = await axios.get(`/api/student-exam/student/${studentId}/exam/${examId}/advice`);
        return response.data;
    },

    /**
     * 13.按考试标题获取学生答卷（需要token）
     * @param {number} studentId 学生ID
     * @param {string} title 考试标题
     * @returns {Promise<Array<Object>>} 答卷列表
     */
    async getStudentExamAnswersByTitle(studentId, title) {
        const axios = createStudentAuthorizedAxios();
        const response = await axios.get(`/api/student-exam/student/${studentId}/exam/title`, { params: { title } });
        return response.data;
    },

    /**
     * 14.按考试标题获取学生成绩（需要token）
     * @param {number} studentId 学生ID
     * @param {string} title 考试标题
     * @returns {Promise<Object>} 成绩对象
     */
    async getExamScoreByTitle(studentId, title) {
        const axios = createStudentAuthorizedAxios();
        const response = await axios.get(`/api/student-exam/student/${studentId}/exam/title/score`, { params: { title } });
        return response.data;
    },

    /**
     * 15.按考试标题获取考试详情（需要token）
     * @param {number} studentId 学生ID
     * @param {string} title 考试标题
     * @returns {Promise<Object>} 考试详情
     */
    async getExamDetailByTitle(studentId, title) {
        const axios = createStudentAuthorizedAxios();
        const response = await axios.get(`/api/student-exam/student/${studentId}/exam/title/detail`, { params: { title } });
        return response.data;
    },

    /**
     * 16.按考试标题获取智能分析（需要token）
     * @param {number} studentId 学生ID
     * @param {string} title 考试标题
     * @returns {Promise<Object>} 分析结果
     */
    async analyzeExamResultByTitle(studentId, title) {
        const axios = createStudentAuthorizedAxios();
        const response = await axios.get(`/api/student-exam/student/${studentId}/exam/title/analysis`, { params: { title } });
        return response.data;
    },

    /**
     * 17.按考试标题获取学习建议（需要token）
     * @param {number} studentId 学生ID
     * @param {string} title 考试标题
     * @returns {Promise<Array<string>>} 建议列表
     */
    async generateLearningAdviceByTitle(studentId, title) {
        const axios = createStudentAuthorizedAxios();
        const response = await axios.get(`/api/student-exam/student/${studentId}/exam/title/advice`, { params: { title } });
        return response.data;
    },

    /**
     * 18.智能评测学生答卷（按内容，需token）
     * @param {number} studentId 学生ID
     * @param {string} title 考试标题
     * @param {string} content 答案内容
     * @returns {Promise<Array<Object>>} 评测结果
     */
    async intelligentEvaluateAnswerByContent(studentId, title, content) {
        const axios = createStudentAuthorizedAxios();
        const response = await axios.get(`/api/student-exam/student/${studentId}/evaluate-by-content`, { params: { title, content } });
        return response.data;
    },

    /**
     * 19.智能评测学生答卷（按答卷ID，需token）
     * @param {number} answerId 答卷ID
     * @returns {Promise<Object>} 评测结果
     */
    async intelligentEvaluateAnswer(answerId) {
        const axios = createStudentAuthorizedAxios();
        const response = await axios.get(`/api/student-exam/answer/${answerId}/evaluate`);
        return response.data;
    }
};

// 课程选择相关API（代完善具体页面）
export const courseSelectionAPI = {
    /**
     * 1.获取学生选择的课程（需要token）
     * @param {string} studentId 学生ID
     * @param {string} courseId 课程ID
     * @returns {Promise<Object>} 课程选择信息
     * 返回字段：由后端返回，包含课程选择的详细信息
     */
    async getStudentCourseSelection(studentId, courseId) {
        const axios = createStudentAuthorizedAxios();
        try {
            // 确保ID是字符串类型
            const studentIdStr = String(studentId);
            const courseIdStr = String(courseId);

            console.log(`获取学生选课信息，学生ID: ${studentIdStr}, 课程ID: ${courseIdStr}`);

            const response = await axios.get(`/api/course-selection/student/${studentIdStr}/course/${courseIdStr}`);
            return response.data;
        } catch (error) {
            console.error('获取学生选课信息失败:', error.response ? error.response.data : error.message);
            throw error;
        }
    },

    /**
     * 2.学生选课（需要token）
     * @param {string} studentId 学生ID
     * @param {string} courseId 课程ID
     * @returns {Promise<Object>} 选课结果
     * 返回字段：由后端返回，通常包含选课成功状态和消息
     */
    async selectCourse(studentId, courseId) {
        const axios = createStudentAuthorizedAxios();
        try {
            // 确保ID是字符串类型
            const studentIdStr = String(studentId);
            const courseIdStr = String(courseId);

            console.log(`学生选课，学生ID: ${studentIdStr}, 课程ID: ${courseIdStr}`);

            const response = await axios.post(`/api/course-selection/student/${studentIdStr}/course/${courseIdStr}`);
            return response.data;
        } catch (error) {
            console.error('学生选课失败:', error.response ? error.response.data : error.message);
            throw error;
        }
    },

    /**
     * 3.获取学生所有选课（需要token）
     * @param {string} studentId 学生ID
     * @returns {Promise<Array<Object>>} 学生选课列表
     * 每项字段：由后端返回，包含课程选择的详细信息
     */
    async getStudentCourses(studentId) {
        const axios = createStudentAuthorizedAxios();
        try {
            // 确保ID是字符串类型
            const studentIdStr = String(studentId);

            console.log(`获取学生所有选课，学生ID: ${studentIdStr}`);

            const response = await axios.get(`/api/course-selection/student/${studentIdStr}`);
            return response.data;
        } catch (error) {
            console.error('获取学生所有选课失败:', error.response ? error.response.data : error.message);
            throw error;
        }
    },

    /**
     * 4.获取选择了某课程的所有学生（需要token）
     * @param {string} courseId 课程ID
     * @returns {Promise<Array<Object>>} 学生列表
     * 每项字段：由后端返回，包含学生信息
     */
    async getCourseStudents(courseId) {
        const axios = createStudentAuthorizedAxios();
        try {
            // 确保ID是字符串类型
            const courseIdStr = String(courseId);

            console.log(`获取选择了课程的所有学生，课程ID: ${courseIdStr}`);

            const response = await axios.get(`/api/course-selection/course/${courseIdStr}`);
            return response.data;
        } catch (error) {
            console.error('获取选择课程的学生列表失败:', error.response ? error.response.data : error.message);
            throw error;
        }
    },

    /**
     * 5.删除单个学生选课（需要token）
     * @param {string} studentId 学生ID
     * @param {string} courseId 课程ID
     * @returns {Promise<Object>} 删除结果
     * 返回字段：由后端返回，通常包含删除成功状态和消息
     */
    async deleteCourseSelection(studentId, courseId) {
        const axios = createStudentAuthorizedAxios();
        try {
            // 确保ID是字符串类型
            const studentIdStr = String(studentId);
            const courseIdStr = String(courseId);

            console.log(`删除学生选课，学生ID: ${studentIdStr}, 课程ID: ${courseIdStr}`);

            const response = await axios.delete(`/api/course-selection/batch/student/${studentIdStr}/course/${courseIdStr}`);
            return response.data;
        } catch (error) {
            console.error('删除学生选课失败:', error.response ? error.response.data : error.message);
            throw error;
        }
    },

    /**
     * 6.删除指定课程的所有选课关系（需要token）
     * @param {string} courseId 课程ID
     * @returns {Promise<Object>} 删除结果
     * 返回字段：由后端返回，通常包含删除成功状态和消息
     */
    async batchDeleteCoursesSelections(courseId) {
        const axios = createStudentAuthorizedAxios();
        try {
            // 确保ID是字符串类型
            const courseIdStr = String(courseId);

            console.log(`删除课程的所有选课关系，课程ID: ${courseIdStr}`);

            const response = await axios.delete(`/api/course-selection/batch/course/${courseIdStr}`);
            return response.data;
        } catch (error) {
            console.error('删除课程的所有选课关系失败:', error.response ? error.response.data : error.message);
            throw error;
        }
    },

    /**
     * 7.批量删除课程中的学生（需要token）
     * @param {string} courseId 课程ID
     * @param {Array<string>} studentIds 学生ID数组
     * @returns {Promise<Object>} 删除结果
     * 返回字段：由后端返回，通常包含删除成功状态和消息
     */
    async batchDeleteCourseStudents(courseId, studentIds) {
        try {
            // 确保courseId是字符串类型
            const courseIdStr = String(courseId);
            
            // 确保所有studentId都是字符串类型
            const studentIdsStr = studentIds.map(id => String(id));
            
            console.log(`批量删除课程中的学生，课程ID: ${courseIdStr}, 学生数量: ${studentIdsStr.length}`);
            
            // 使用Promise.all并行处理多个删除请求
            const promises = studentIdsStr.map(studentId => 
                this.deleteCourseSelection(studentId, courseIdStr)
            );
            
            const results = await Promise.all(promises);
            console.log('批量删除学生响应:', results);
            
            // 返回成功信息
            return {
                success: true,
                message: `成功删除 ${results.length} 名学生`,
                count: results.length
            };
        } catch (error) {
            console.error('批量删除课程学生失败:', error.response ? error.response.data : error.message);
            throw error;
        }
    },

    /**
     * 8.通过邀请码加入课程（需要token）
     * @param {string} studentId 学生ID
     * @param {string} inviteCode 邀请码
     * @returns {Promise<Object>} 加入课程结果
     * 返回字段：由后端返回，通常包含加入成功状态和消息
     */
    async joinByInviteCode(studentId, inviteCode) {
        const axios = createStudentAuthorizedAxios();
        try {
            // 确保ID是字符串类型
            const studentIdStr = String(studentId);
            const inviteCodeStr = String(inviteCode);

            console.log(`学生通过邀请码加入课程，学生ID: ${studentIdStr}, 邀请码: ${inviteCodeStr}`);

            const response = await axios.post('/api/course-selection/join-by-invite-code', null, {
                params: {
                    studentId: studentIdStr,
                    inviteCode: inviteCodeStr
                }
            });
            return response.data;
        } catch (error) {
            console.error('通过邀请码加入课程失败:', error.response ? error.response.data : error.message);
            throw error;
        }
    },

    /**
     * 9.生成课程邀请码（需要token）
     * @param {string} courseId 课程ID
     * @returns {Promise<Object>} 邀请码生成结果
     * 返回字段：由后端返回，通常包含生成的邀请码
     */
    async generateInviteCode(courseId) {
        const axios = createStudentAuthorizedAxios();
        try {
            // 确保ID是字符串类型
            const courseIdStr = String(courseId);

            console.log(`生成课程邀请码，课程ID: ${courseIdStr}`);

            const response = await axios.post('/api/course-selection/generate-invite-code', null, {
                params: {
                    courseId: courseIdStr
                }
            });
            return response.data;
        } catch (error) {
            console.error('生成课程邀请码失败:', error.response ? error.response.data : error.message);
            throw error;
        }
    }
};

// 课程文件相关API   TODO：完善文件乱码bug
export const courseFileAPI = {
    /**
     * 上传课程文件（需要token）
     * @param {string} courseId 课程ID
     * @param {FormData} formData 包含文件的FormData对象
     * @returns {Promise<Object>} 上传结果
     * 返回字段：
     *   - success: boolean 是否上传成功
     *   - fileId: string 文件ID
     *   - fileName: string 文件名
     *   - fileSize: number 文件大小
     *   - fileType: string 文件类型
     *   - uploadTime: string 上传时间（ISO格式）
     */
    async uploadCourseFile(courseId, formData) {
        const axios = createTeacherAuthorizedAxios();
        try {
            // 确保ID是字符串类型
            const courseIdStr = String(courseId);

            console.log(`上传课程文件，课程ID: ${courseIdStr}`);

            const response = await axios.post(`/api/course-file/upload/courseId/${courseIdStr}`, formData, {
                headers: {
                    'Content-Type': 'multipart/form-data'
                }
            });
            return response.data;
        } catch (error) {
            console.error('上传课程文件失败:', error.response ? error.response.data : error.message);
            throw error;
        }
    },

    /**
     * 下载课程文件（需要token）
     * @param {string} fileId 文件ID
     * @returns {Promise<Blob>} 文件Blob对象
     */
    async downloadCourseFile(fileId) {
        const axios = createStudentAuthorizedAxios();
        console.log(fileId + "开始下载");

        try {
            const fileIdStr = String(fileId);

            console.log(`下载课程文件，文件ID: ${fileIdStr}`);

            const response = await axios.get(`/api/course-file/download/fileId/${fileIdStr}`, {
                responseType: 'blob'
            });
            return response.data;
        } catch (error) {
            console.error('下载课程文件失败:', error.response ? error.response.data : error.message);
            throw error;
        } finally {
            console.log(fileId + "下载结束");
        }
    },

    /**
     * 获取课程的所有文件（需要token）
     * @param {string} courseId 课程ID
     * @returns {Promise<Array<Object>>} 文件列表
     * 每项字段：
     *   - fileId: string 文件ID
     *   - fileName: string 文件名
     *   - fileSize: number 文件大小
     *   - fileType: string 文件类型
     *   - courseId: string 课程ID
     *   - uploaderId: string 上传者ID
     *   - uploaderName: string 上传者姓名
     *   - uploadTime: string 上传时间（ISO格式）
     *   - downloadCount: number 下载次数
     */
    async getCourseFiles(courseId) {
        const axios = createStudentAuthorizedAxios();
        try {
            // 确保ID是字符串类型
            const courseIdStr = String(courseId);

            console.log(`获取课程文件列表，课程ID: ${courseIdStr}`);

            const response = await axios.get(`/api/course-file/courseId/${courseIdStr}`);

            // 确保返回的所有ID字段都是字符串类型
            if (Array.isArray(response.data)) {
                response.data.forEach(item => {
                    if (item.fileId !== undefined) item.fileId = String(item.fileId);
                    if (item.courseId !== undefined) item.courseId = String(item.courseId);
                    if (item.uploaderId !== undefined) item.uploaderId = String(item.uploaderId);
                });
            }

            return response.data;
        } catch (error) {
            console.error('获取课程文件列表失败:', error.response ? error.response.data : error.message);
            throw error;
        }
    },

    /**
     * 删除课程文件（需要token）
     * @param {string} fileId 文件ID
     * @returns {Promise<Object>} 删除结果
     * 返回字段：
     *   - success: boolean 是否删除成功
     *   - message: string 提示信息
     */
    async deleteCourseFile(fileId) {
        const axios = createTeacherAuthorizedAxios();
        try {
            // 确保ID是字符串类型
            const fileIdStr = String(fileId);

            console.log(`删除课程文件，文件ID: ${fileIdStr}`);

            const response = await axios.delete(`/api/course-file/fileId/${fileIdStr}`);
            return response.data;
        } catch (error) {
            console.error('删除课程文件失败:', error.response ? error.response.data : error.message);
            throw error;
        }
    }
};

// 文档管理相关API
export const docAPI = {
    /**
     * 上传文档（使用表单提交方式）
     * @param {File} file 文件对象
     * @returns {Promise<Object>} 上传成功后返回的响应对象
     */
    async uploadDoc(file) {
        const axios = createTeacherAuthorizedAxios();
        try {
            // 创建FormData对象
            const formData = new FormData();
            formData.append('file', file);

            const response = await axios.post('http://118.89.136.119:8000/docs/upload', formData, {
                headers: {
                    'Content-Type': 'multipart/form-data'
                },
                timeout: 30000 // 30秒超时
            });

            return response.data;
        } catch (error) {
            console.error('上传文档失败:', error.response ? error.response.data : error.message);

            // 如果是网络错误，提供更友好的错误信息
            if (error.code === 'ECONNREFUSED' ||
                error.code === 'ENOTFOUND' ||
                error.message.includes('Network Error')) {
                throw new Error('文档服务暂时不可用，请稍后重试');
            }

            throw error;
        }
    },

    /**
     * 获取文档列表
     * @returns {Promise<Array<string>>} 文档列表
     */
    async listDocs() {
        const axios = createTeacherAuthorizedAxios();
        try {
            // 添加超时处理
            const controller = new AbortController();
            const timeoutId = setTimeout(() => controller.abort(), 5000); // 5秒超时

            try {
                const response = await axios.get('http://118.89.136.119:8000/docs/list', {
                    signal: controller.signal
                });
                clearTimeout(timeoutId);
                console.log('原始文档列表响应:', response.data);

                // 处理响应数据，确保返回格式化的文件列表
                let fileList = [];
            
            if (response.data) {
                // 如果是字符串，可能是JSON字符串或单个文件名
                if (typeof response.data === 'string') {
                    if (response.data.trim().startsWith('[') && response.data.trim().endsWith(']')) {
                        // 尝试解析JSON字符串
                        try {
                            const parsed = JSON.parse(response.data.replace(/'/g, '"'));
                            if (Array.isArray(parsed)) {
                                fileList = parsed;
                            } else {
                                fileList = [response.data];
                            }
                        } catch (e) {
                            console.error('解析文档列表JSON失败:', e);
                            // 如果解析失败，将整个字符串作为一个文件名
                            fileList = [response.data];
                        }
                    } else {
                        // 单个文件名
                        fileList = [response.data];
                    }
                } 
                // 如果已经是数组
                else if (Array.isArray(response.data)) {
                    // 处理数组中的每个元素
                    fileList = response.data.flatMap(item => {
                        // 如果元素是字符串且看起来像是数组
                        if (typeof item === 'string') {
                            if (item.includes('[') && item.includes(']')) {
                                try {
                                    const parsed = JSON.parse(item.replace(/'/g, '"'));
                                    return Array.isArray(parsed) ? parsed : [item];
                                } catch (e) {
                                    return [item];
                                }
                            }
                            // 检查是否包含多个文件名（以逗号分隔）
                            else if (item.includes(',')) {
                                // 尝试拆分逗号分隔的文件名
                                const parts = item.split(',').map(part => part.trim())
                                    .filter(part => part.length > 0);
                                if (parts.length > 1) {
                                    return parts;
                                }
                            }
                            return [item];
                        }
                        return [String(item)];
                    });
                    
                    // 清理文件名（去除引号和括号）
                    fileList = fileList.map(filename => {
                        if (typeof filename === 'string') {
                            // 使用字符串方法替代正则表达式
                            let cleaned = filename.trim();
                            // 去除开头的引号和括号
                            while (cleaned.length > 0 && (cleaned[0] === '"' || cleaned[0] === "'" || cleaned[0] === '[')) {
                                cleaned = cleaned.substring(1);
                            }
                            // 去除结尾的引号和括号
                            while (cleaned.length > 0 && (cleaned[cleaned.length - 1] === '"' || cleaned[cleaned.length - 1] === "'" || cleaned[cleaned.length - 1] === ']')) {
                                cleaned = cleaned.substring(0, cleaned.length - 1);
                            }
                            return cleaned;
                        }
                        return String(filename);
                    });
                }
                // 如果是对象，尝试提取值
                else if (typeof response.data === 'object') {
                    fileList = Object.values(response.data).map(item => String(item));
                }
                // 其他情况
                else {
                    fileList = [String(response.data)];
                }
            }
            
                console.log('处理后的文档列表:', fileList);
                return fileList;
            } catch (timeoutError) {
                clearTimeout(timeoutId);
                if (timeoutError.name === 'AbortError') {
                    console.warn('文档服务请求超时，返回空列表');
                    return [];
                }
                throw timeoutError;
            }
        } catch (error) {
            console.error('获取文档列表失败:', error.response ? error.response.data : error.message);

            // 如果是网络错误或服务器不可用，返回空列表而不是抛出错误
            if (error.code === 'ECONNREFUSED' ||
                error.code === 'ENOTFOUND' ||
                error.message.includes('Network Error') ||
                error.message.includes('timeout')) {
                console.warn('文档服务不可用，返回空列表');
                return [];
            }

            // 其他错误继续抛出
            throw error;
        }
    },

    /**
     * 删除文档
     * @param {string} filename 文件名
     * @returns {Promise<Object>} 删除结果
     */
    async deleteDoc(filename) {
        const axios = createTeacherAuthorizedAxios();
        try {
            const response = await axios.delete(`http://118.89.136.119:8000/docs/delete/${encodeURIComponent(filename)}`);
            return response.data;
        } catch (error) {
            console.error('删除文档失败:', error.response ? error.response.data : error.message);
            throw error;
        }
    },
    
    /**
     * 下载文档
     * @param {string} filename 文件名
     * @returns {Promise<Blob>} 文件Blob对象
     */
    async downloadDoc(filename) {
        const axios = createTeacherAuthorizedAxios();
        try {
            const response = await axios.get(`http://118.89.136.119:8000/docs/download/${encodeURIComponent(filename)}`, {
                responseType: 'blob'
            });
            return response.data;
        } catch (error) {
            console.error('下载文档失败:', error.response ? error.response.data : error.message);
            throw error;
        }
    }
};

// 问题相关API
export const problemAPI = {
    /**
     * 更新问题（需要token）
     * @param {Object} problemData 问题信息
     * @param {number} problemData.problemId 问题ID
     * @param {number} problemData.assignmentId 作业ID
     * @param {string} problemData.originType 来源类型
     * @param {string} problemData.title 标题
     * @param {string} problemData.content 内容
     * @param {string} problemData.type 类型
     * @param {boolean} problemData.autoGrading 是否自动评分
     * @param {string} problemData.expectedAnswer 预期答案
     * @param {number} problemData.score 分数
     * @param {number} problemData.sequence 序号
     * @returns {Promise<Object>} 更新后的问题信息
     * 返回字段：
     *   - problemId: number 问题ID
     *   - assignmentId: number 作业ID
     *   - originType: string 来源类型
     *   - title: string 标题
     *   - content: string 内容
     *   - type: string 类型
     *   - autoGrading: boolean 是否自动评分
     *   - expectedAnswer: string 预期答案
     *   - score: number 分数
     *   - sequence: number 序号
     *   - createdAt: string 创建时间（ISO格式）
     *   - updatedAt: string 更新时间（ISO格式）
     */
    async updateProblem(problemData) {
        const axios = createTeacherAuthorizedAxios();
        try {
            // 创建数据副本，避免修改原始数据
            const dataToSend = { ...problemData };
            
            // 确保ID字段是字符串类型
            if (dataToSend.problemId !== undefined) dataToSend.problemId = String(dataToSend.problemId);
            if (dataToSend.assignmentId !== undefined) dataToSend.assignmentId = String(dataToSend.assignmentId);
            
            const response = await axios.post('/api/problem/update', dataToSend);
            
            // 确保返回的ID字段是字符串类型
            if (response.data) {
                if (response.data.problemId !== undefined) response.data.problemId = String(response.data.problemId);
                if (response.data.assignmentId !== undefined) response.data.assignmentId = String(response.data.assignmentId);
            }
            
            return response.data;
        } catch (error) {
            console.error('更新问题失败:', error.response ? error.response.data : error.message);
            throw error;
        }
    },

    /**
     * 保存问题（需要token）
     * @param {Object} problemData 问题信息
     * @param {number} [problemData.problemId] 问题ID（可选，更新时填写）
     * @param {number} problemData.assignmentId 作业ID
     * @param {string} problemData.originType 来源类型
     * @param {string} problemData.title 标题
     * @param {string} problemData.content 内容
     * @param {string} problemData.type 类型
     * @param {boolean} problemData.autoGrading 是否自动评分
     * @param {string} problemData.expectedAnswer 预期答案
     * @param {number} problemData.score 分数
     * @param {number} problemData.sequence 序号
     * @returns {Promise<Object>} 保存后的问题信息
     * 返回字段：同updateProblem返回字段
     */
    async saveProblem(problemData) {
        const axios = createTeacherAuthorizedAxios();
        try {
            // 创建数据副本，避免修改原始数据
            const dataToSend = { ...problemData };
            
            // 确保ID字段是字符串类型
            if (dataToSend.problemId !== undefined) dataToSend.problemId = String(dataToSend.problemId);
            if (dataToSend.assignmentId !== undefined) dataToSend.assignmentId = String(dataToSend.assignmentId);
            
            const response = await axios.post('/api/problem/save', dataToSend);
            
            // 确保返回的ID字段是字符串类型
            if (response.data) {
                if (response.data.problemId !== undefined) response.data.problemId = String(response.data.problemId);
                if (response.data.assignmentId !== undefined) response.data.assignmentId = String(response.data.assignmentId);
            }
            
            return response.data;
        } catch (error) {
            console.error('保存问题失败:', error.response ? error.response.data : error.message);
            throw error;
        }
    },

    /**
     * 根据问题ID获取问题信息（需要token）
     * @param {number} problemId 问题ID
     * @returns {Promise<Object>} 问题信息
     * 返回字段：同updateProblem返回字段
     */
    async getProblemById(problemId) {
        const axios = createStudentAuthorizedAxios();
        try {
            // 确保ID是字符串类型
            const problemIdStr = String(problemId);
            
            const response = await axios.get(`/api/problem/${problemIdStr}`);
            
            // 确保返回的ID字段是字符串类型
            if (response.data) {
                if (response.data.problemId !== undefined) response.data.problemId = String(response.data.problemId);
                if (response.data.assignmentId !== undefined) response.data.assignmentId = String(response.data.assignmentId);
            }
            
            return response.data;
        } catch (error) {
            console.error('获取问题信息失败:', error.response ? error.response.data : error.message);
            throw error;
        }
    },

    /**
     * 根据问题类型获取问题列表（需要token）
     * @param {string} type 问题类型
     * @returns {Promise<Array<Object>>} 问题列表
     * 每项字段：同updateProblem返回字段
     */
    async getProblemsByType(type) {
        const axios = createStudentAuthorizedAxios();
        try {
            const response = await axios.get(`/api/problem/type/${type}`);
            
            // 确保返回的所有ID字段都是字符串类型
            if (Array.isArray(response.data)) {
                response.data.forEach(item => {
                    if (item.problemId !== undefined) item.problemId = String(item.problemId);
                    if (item.assignmentId !== undefined) item.assignmentId = String(item.assignmentId);
                });
            }
            
            return response.data;
        } catch (error) {
            console.error('获取问题列表失败:', error.response ? error.response.data : error.message);
            throw error;
        }
    },

    /**
     * 根据作业ID获取问题列表（需要token）
     * @param {number} assignmentId 作业ID
     * @returns {Promise<Array<Object>>} 问题列表
     * 每项字段：同updateProblem返回字段
     */
    async getProblemsByAssignment(assignmentId) {
        const axios = createStudentAuthorizedAxios();
        try {
            // 确保ID是字符串类型
            const assignmentIdStr = String(assignmentId);
            
            const response = await axios.get(`/api/problem/assignment/${assignmentIdStr}`);
            
            // 确保返回的所有ID字段都是字符串类型
            if (Array.isArray(response.data)) {
                response.data.forEach(item => {
                    if (item.problemId !== undefined) item.problemId = String(item.problemId);
                    if (item.assignmentId !== undefined) item.assignmentId = String(item.assignmentId);
                });
            }
            
            return response.data;
        } catch (error) {
            console.error('获取作业问题列表失败:', error.response ? error.response.data : error.message);
            throw error;
        }
    },

    /**
     * 根据作业ID和问题类型获取问题列表（需要token）
     * @param {number} assignmentId 作业ID
     * @param {string} type 问题类型
     * @returns {Promise<Array<Object>>} 问题列表
     * 每项字段：同updateProblem返回字段
     */
    async getProblemsByAssignmentAndType(assignmentId, type) {
        const axios = createStudentAuthorizedAxios();
        try {
            // 确保ID是字符串类型
            const assignmentIdStr = String(assignmentId);
            
            const response = await axios.get(`/api/problem/assignment/${assignmentIdStr}/type/${type}`);
            
            // 确保返回的所有ID字段都是字符串类型
            if (Array.isArray(response.data)) {
                response.data.forEach(item => {
                    if (item.problemId !== undefined) item.problemId = String(item.problemId);
                    if (item.assignmentId !== undefined) item.assignmentId = String(item.assignmentId);
                });
            }
            
            return response.data;
        } catch (error) {
            console.error('获取作业特定类型问题列表失败:', error.response ? error.response.data : error.message);
            throw error;
        }
    },

    /**
     * 删除问题（需要token）
     * @param {number} problemId 问题ID
     * @returns {Promise<Object>} 删除结果
     * 返回字段：
     *   - additionalProp1: Object 附加属性1
     *   - additionalProp2: Object 附加属性2
     *   - additionalProp3: Object 附加属性3
     */
    async deleteProblem(problemId) {
        const axios = createTeacherAuthorizedAxios();
        // 直接使用字符串类型，避免精度丢失
        const problemIdStr = String(problemId);
        if (!problemIdStr || isNaN(Number(problemIdStr))) {
            throw new Error('无效的题目ID');
        }

        const response = await axios.delete('/api/problem/delete', {
            data: problemIdStr,
            headers: { 'Content-Type': 'application/json' }
        });

        // 处理返回数据，确保返回格式一致
        const result = {
            success: true,
            message: '题目删除成功',
            deletedProblemId: problemIdStr,
            ...response.data
        };

        return result;
    }
};

// 作业相关API
export const assignmentAPI = {
    /**
     * 更新作业（需要token）
     * @param {Object} assignmentData 作业信息
     * @param {number} assignmentData.assignmentId 作业ID
     * @param {string} assignmentData.type 类型
     * @param {number} assignmentData.creatorId 创建者ID
     * @param {number} assignmentData.courseId 课程ID
     * @param {string} assignmentData.title 标题
     * @param {string} assignmentData.description 描述
     * @param {boolean} assignmentData.isAnswerPublic 答案是否公开
     * @param {boolean} assignmentData.isScoreVisible 分数是否可见
     * @param {boolean} assignmentData.isRedoAllowed 是否允许重做
     * @param {number} assignmentData.maxAttempts 最大尝试次数
     * @param {string} assignmentData.startTime 开始时间（ISO格式）
     * @param {string} assignmentData.endTime 结束时间（ISO格式）
     * @param {string} assignmentData.status 状态
     * @returns {Promise<Object>} 更新后的作业信息
     * 返回字段：
     *   - assignmentId: number 作业ID
     *   - type: string 类型
     *   - creatorId: number 创建者ID
     *   - courseId: number 课程ID
     *   - title: string 标题
     *   - description: string 描述
     *   - isAnswerPublic: boolean 答案是否公开
     *   - isScoreVisible: boolean 分数是否可见
     *   - isRedoAllowed: boolean 是否允许重做
     *   - maxAttempts: number 最大尝试次数
     *   - startTime: string 开始时间（ISO格式）
     *   - endTime: string 结束时间（ISO格式）
     *   - status: string 状态
     *   - createdAt: string 创建时间（ISO格式）
     *   - updatedAt: string 更新时间（ISO格式）
     */
    async updateAssignment(assignmentData) {
        const axios = createTeacherAuthorizedAxios();
        try {
            // 创建数据副本，避免修改原始数据
            const dataToSend = { ...assignmentData };
            
            // 确保ID字段是字符串类型
            if (dataToSend.assignmentId !== undefined) dataToSend.assignmentId = String(dataToSend.assignmentId);
            if (dataToSend.creatorId !== undefined) dataToSend.creatorId = String(dataToSend.creatorId);
            if (dataToSend.courseId !== undefined) dataToSend.courseId = String(dataToSend.courseId);
            
            const response = await axios.post('/api/assignment/update', dataToSend);
            
            // 确保返回的ID字段是字符串类型
            if (response.data) {
                if (response.data.assignmentId !== undefined) response.data.assignmentId = String(response.data.assignmentId);
                if (response.data.creatorId !== undefined) response.data.creatorId = String(response.data.creatorId);
                if (response.data.courseId !== undefined) response.data.courseId = String(response.data.courseId);
            }
            
            return response.data;
        } catch (error) {
            console.error('更新作业失败:', error.response ? error.response.data : error.message);
            throw error;
        }
    },

    /**
     * 保存作业（需要token）
     * @param {Object} assignmentData 作业信息
     * @param {number} [assignmentData.assignmentId] 作业ID（可选，更新时填写）
     * @param {string} assignmentData.type 类型
     * @param {number} assignmentData.creatorId 创建者ID
     * @param {number} assignmentData.courseId 课程ID
     * @param {string} assignmentData.title 标题
     * @param {string} assignmentData.description 描述
     * @param {boolean} assignmentData.isAnswerPublic 答案是否公开
     * @param {boolean} assignmentData.isScoreVisible 分数是否可见
     * @param {boolean} assignmentData.isRedoAllowed 是否允许重做
     * @param {number} assignmentData.maxAttempts 最大尝试次数
     * @param {string} assignmentData.startTime 开始时间（ISO格式）
     * @param {string} assignmentData.endTime 结束时间（ISO格式）
     * @param {string} assignmentData.status 状态
     * @returns {Promise<Object>} 保存后的作业信息
     * 返回字段：同updateAssignment返回字段
     */
    async saveAssignment(assignmentData) {
        const axios = createTeacherAuthorizedAxios();
        try {
            // 创建数据副本，避免修改原始数据
            const dataToSend = { ...assignmentData };
            
            // 确保ID字段是字符串类型
            if (dataToSend.assignmentId !== undefined) dataToSend.assignmentId = String(dataToSend.assignmentId);
            if (dataToSend.creatorId !== undefined) dataToSend.creatorId = String(dataToSend.creatorId);
            if (dataToSend.courseId !== undefined) dataToSend.courseId = String(dataToSend.courseId);
            
            const response = await axios.post('/api/assignment/save', dataToSend);
            
            // 确保返回的ID字段是字符串类型
            if (response.data) {
                if (response.data.assignmentId !== undefined) response.data.assignmentId = String(response.data.assignmentId);
                if (response.data.creatorId !== undefined) response.data.creatorId = String(response.data.creatorId);
                if (response.data.courseId !== undefined) response.data.courseId = String(response.data.courseId);
            }
            
            return response.data;
        } catch (error) {
            console.error('保存作业失败:', error.response ? error.response.data : error.message);
            throw error;
        }
    },

    /**
     * 根据作业ID获取作业信息（需要token）
     * @param {number} assignmentId 作业ID
     * @returns {Promise<Object>} 作业信息
     * 返回字段：同updateAssignment返回字段
     */
    async getAssignmentById(assignmentId) {
        const axios = createStudentAuthorizedAxios();
        try {
            // 确保ID是字符串类型
            const assignmentIdStr = String(assignmentId);
            
            const response = await axios.get(`/api/assignment/${assignmentIdStr}`);
            
            // 确保返回的ID字段是字符串类型
            if (response.data) {
                if (response.data.assignmentId !== undefined) response.data.assignmentId = String(response.data.assignmentId);
                if (response.data.creatorId !== undefined) response.data.creatorId = String(response.data.creatorId);
                if (response.data.courseId !== undefined) response.data.courseId = String(response.data.courseId);
            }
            
            return response.data;
        } catch (error) {
            console.error('获取作业信息失败:', error.response ? error.response.data : error.message);
            throw error;
        }
    },

    /**
     * 根据创建者ID获取作业列表（需要token）
     * @param {number} creatorId 创建者ID
     * @returns {Promise<Array<Object>>} 作业列表
     * 每项字段：同updateAssignment返回字段
     */
    async getAssignmentsByCreatorId(creatorId) {
        const axios = createTeacherAuthorizedAxios();
        try {
            // 确保ID是字符串类型
            const creatorIdStr = String(creatorId);
            
            const response = await axios.get(`/api/assignment/creatorId/${creatorIdStr}`);
            
            // 确保返回的所有ID字段都是字符串类型
            if (Array.isArray(response.data)) {
                response.data.forEach(item => {
                    if (item.assignmentId !== undefined) item.assignmentId = String(item.assignmentId);
                    if (item.creatorId !== undefined) item.creatorId = String(item.creatorId);
                    if (item.courseId !== undefined) item.courseId = String(item.courseId);
                });
            }
            
            return response.data;
        } catch (error) {
            console.error('获取创建者作业列表失败:', error.response ? error.response.data : error.message);
            throw error;
        }
    },

    /**
     * 根据创建者ID和作业类型获取作业列表（需要token）
     * @param {number} creatorId 创建者ID
     * @param {string} type 作业类型
     * @returns {Promise<Array<Object>>} 作业列表
     * 每项字段：同updateAssignment返回字段
     */
    async getAssignmentsByCreatorIdAndType(creatorId, type) {
        const axios = createTeacherAuthorizedAxios();
        try {
            // 确保ID是字符串类型
            const creatorIdStr = String(creatorId);
            
            const response = await axios.get(`/api/assignment/creatorId/${creatorIdStr}/type/${type}`);
            
            // 确保返回的所有ID字段都是字符串类型
            if (Array.isArray(response.data)) {
                response.data.forEach(item => {
                    if (item.assignmentId !== undefined) item.assignmentId = String(item.assignmentId);
                    if (item.creatorId !== undefined) item.creatorId = String(item.creatorId);
                    if (item.courseId !== undefined) item.courseId = String(item.courseId);
                });
            }
            
            return response.data;
        } catch (error) {
            console.error('获取创建者特定类型作业列表失败:', error.response ? error.response.data : error.message);
            throw error;
        }
    },

    /**
     * 根据课程ID和作业类型获取作业列表（需要token）
     * @param {number} courseId 课程ID
     * @param {string} type 作业类型
     * @returns {Promise<Array<Object>>} 作业列表
     * 每项字段：同updateAssignment返回字段
     */
    async getAssignmentsByCourseIdAndType(courseId, type) {
        const axios = createTeacherAuthorizedAxios();
        try {
            // 确保ID是字符串类型
            const courseIdStr = String(courseId);
            
            const response = await axios.get(`/api/assignment/course/${courseIdStr}/type/${type}`);
            
            // 确保返回的所有ID字段都是字符串类型
            if (Array.isArray(response.data)) {
                response.data.forEach(item => {
                    if (item.assignmentId !== undefined) item.assignmentId = String(item.assignmentId);
                    if (item.creatorId !== undefined) item.creatorId = String(item.creatorId);
                    if (item.courseId !== undefined) item.courseId = String(item.courseId);
                });
            }
            
            return response.data;
        } catch (error) {
            console.error('获取课程特定类型作业列表失败:', error.response ? error.response.data : error.message);
            throw error;
        }
    },

    /**
     * 根据课程ID和创建者ID获取作业列表（需要token）
     * @param {number} courseId 课程ID
     * @param {number} creatorId 创建者ID
     * @returns {Promise<Array<Object>>} 作业列表
     * 每项字段：同updateAssignment返回字段
     */
    async getAssignmentsByCourseIdAndCreatorId(courseId, creatorId) {
        const axios = createTeacherAuthorizedAxios();
        try {
            // 确保ID是字符串类型
            const courseIdStr = String(courseId);
            const creatorIdStr = String(creatorId);
            
            const response = await axios.get(`/api/assignment/course/${courseIdStr}/creatorId/${creatorIdStr}`);
            
            // 确保返回的所有ID字段都是字符串类型
            if (Array.isArray(response.data)) {
                response.data.forEach(item => {
                    if (item.assignmentId !== undefined) item.assignmentId = String(item.assignmentId);
                    if (item.creatorId !== undefined) item.creatorId = String(item.creatorId);
                    if (item.courseId !== undefined) item.courseId = String(item.courseId);
                });
            }
            
            return response.data;
        } catch (error) {
            console.error('获取课程特定创建者作业列表失败:', error.response ? error.response.data : error.message);
            throw error;
        }
    },

    /**
     * 删除作业（需要token）
     * @param {number} assignmentId 作业ID
     * @returns {Promise<Object>} 删除结果
     * 返回字段：
     *   - additionalProp1: Object 附加属性1
     *   - additionalProp2: Object 附加属性2
     *   - additionalProp3: Object 附加属性3
     */
    async deleteAssignment(assignmentId) {
        const axios = createTeacherAuthorizedAxios();
        // 直接使用字符串类型，避免精度丢失
        const assignmentIdStr = String(assignmentId);
        if (!assignmentIdStr || isNaN(Number(assignmentIdStr))) throw new Error('assignmentId 必须为数字字符串');
        const response = await axios.delete('/api/assignment/delete', {
            data: assignmentIdStr,
            headers: { 'Content-Type': 'application/json' }
        });
        // 返回时也用字符串
        const result = {
            success: true,
            message: '作业删除成功',
            deletedAssignmentId: assignmentIdStr,
            ...response.data
        };
        return result;
    }
};

// 学生答题相关API
export const studentAnswerAPI = {
    /**
     * 提交学生答案
     * @param {number} studentId 学生ID
     * @param {number} problemId 问题ID
     * @param {string} answer 答案内容
     * @returns {Promise<Object>} 提交结果
     */
    async submitAnswer(studentId, problemId, answer) {
        const axios = createStudentAuthorizedAxios();
        try {
            const response = await axios.post('/api/student-answer/submit', {
                studentId,
                problemId,
                answer
            });
            return response.data;
        } catch (error) {
            console.error('提交答案失败:', error.response ? error.response.data : error.message);
            throw error;
        }
    },

    /**
     * 为学生答案评分
     * @param {number} answerId 答案ID
     * @param {number} score 分数
     * @returns {Promise<Object>} 评分结果
     */
    async gradeAnswer(answerId, score) {
        const axios = createTeacherAuthorizedAxios();
        try {
            const response = await axios.post('/api/student-answer/grade', {
                answerId,
                score
            });
            return response.data;
        } catch (error) {
            console.error('答案评分失败:', error.response ? error.response.data : error.message);
            throw error;
        }
    },

    /**
     * 获取特定问题的学生答案
     * @param {number} problemId 问题ID
     * @returns {Promise<Array>} 学生答案列表
     */
    async getAnswersByProblem(problemId) {
        const axios = createStudentAuthorizedAxios();
        try {
            const response = await axios.get(`/api/student-answer/problem/${problemId}`);
            return response.data;
        } catch (error) {
            console.error('获取问题答案失败:', error.response ? error.response.data : error.message);
            throw error;
        }
    },

    /**
     * 获取作业的最终得分
     * @param {number} assignmentId 作业ID
     * @returns {Promise<Array>} 最终得分列表
     */
    async getFinalScoresByAssignment(assignmentId) {
        const axios = createStudentAuthorizedAxios();
        try {
            const response = await axios.get(`/api/student-answer/final-scores/assignment/${assignmentId}`);
            return response.data;
        } catch (error) {
            console.error('获取作业最终得分失败:', error.response ? error.response.data : error.message);
            throw error;
        }
    },

    /**
     * 获取答案的最终得分
     * @param {number} answerId 答案ID
     * @returns {Promise<number>} 最终得分
     */
    async getFinalScore(answerId) {
        const axios = createStudentAuthorizedAxios();
        try {
            const response = await axios.get(`/api/student-answer/final-score/${answerId}`);
            return response.data;
        } catch (error) {
            console.error('获取答案最终得分失败:', error.response ? error.response.data : error.message);
            throw error;
        }
    },

    /**
     * 获取学生在作业中的完成率
     * @param {number} studentId 学生ID
     * @param {number} assignmentId 作业ID
     * @returns {Promise<Object>} 完成率数据
     */
    async getCompletionRate(studentId, assignmentId) {
        const axios = createStudentAuthorizedAxios();
        try {
            const response = await axios.get(`/api/student-answer/completion-rate`, {
                params: {
                    studentId,
                    assignmentId
                }
            });
            return response.data;
        } catch (error) {
            console.error('获取完成率失败:', error.response ? error.response.data : error.message);
            throw error;
        }
    },

    /**
     * 获取学生在作业中的准确率
     * @param {number} studentId 学生ID
     * @param {number} assignmentId 作业ID
     * @returns {Promise<Object>} 准确率数据
     */
    async getAccuracyRate(studentId, assignmentId) {
        const axios = createStudentAuthorizedAxios();
        try {
            const response = await axios.get(`/api/student-answer/accuracy-rate`, {
                params: {
                    studentId,
                    assignmentId
                }
            });
            return response.data;
        } catch (error) {
            console.error('获取准确率失败:', error.response ? error.response.data : error.message);
            throw error;
        }
    },

    /**
     * 获取作业的所有答案
     * @param {number} assignmentId 作业ID
     * @returns {Promise<Array>} 答案列表
     */
    async getAnswersByAssignment(assignmentId) {
        const axios = createStudentAuthorizedAxios();
        try {
            const response = await axios.get(`/api/student-answer/assignment/${assignmentId}`);
            return response.data;
        } catch (error) {
            console.error('获取作业答案失败:', error.response ? error.response.data : error.message);
            throw error;
        }
    },

    /**
     * 删除学生答案
     * @param {number} answerId 答案ID
     * @returns {Promise<Object>} 删除结果
     */
    async deleteAnswer(answerId) {
        const axios = createStudentAuthorizedAxios();
        try {
            const response = await axios.delete(`/api/student-answer/${answerId}`);
            return response.data;
        } catch (error) {
            console.error('删除答案失败:', error.response ? error.response.data : error.message);
            throw error;
        }
    }
};

