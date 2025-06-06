# 智慧教育平台前端项目文档

## 项目介绍

智慧教育平台是一个面向教师和学生的在线教育系统，提供课程管理、知识点管理、考试管理、学习进度跟踪等功能。本项目是该平台的前端部分，基于Vue 3开发。

## 技术栈

- **核心框架**：Vue 3
- **路由管理**：Vue Router 4
- **HTTP请求**：Axios
- **UI组件库**：
  - Element Plus (主要UI框架)
  - Vant (移动端组件)
- **工具库**：
  - BigNumber.js (处理大数字，避免精度问题)
- **开发工具**：
  - Stagewise (开发辅助工具)

## 目录结构

```
src/
├── api/                # API接口定义
│   ├── api.js          # 所有API接口集合
│   └── README.md       # API文档
├── assets/             # 静态资源
├── components/         # 公共组件
├── plugins/            # 插件配置
│   ├── stagewise.js    # Stagewise工具栏配置
│   └── stagewise-init.js # Stagewise工具栏初始化
├── router/             # 路由配置
│   └── index.js        # 路由定义
├── utils/              # 工具函数
│   ├── auth.js         # 认证相关工具
│   └── examManager.js  # 考试管理工具
├── views/              # 页面组件
│   ├── auth/           # 认证相关页面
│   ├── teacher/        # 教师端页面
│   └── student/        # 学生端页面
├── App.vue             # 根组件
└── main.js             # 入口文件
```

## 主要功能模块

### 1. 认证系统

- 用户登录/注册
- Token管理（访问Token和刷新Token）
- 权限控制

### 2. 教师端功能

- **课程管理**：创建、编辑、删除课程
- **知识点管理**：创建、编辑知识点，添加习题
- **考试管理**：创建考试，查看成绩统计
- **学生管理**：查看学生信息，分析学习情况

### 3. 学生端功能

- 课程学习
- 考试参与
- 习题练习
- 学习进度查看

## API接口

项目使用统一的API模块管理所有接口请求，主要包括以下几类：

- **认证API** (authAPI)：处理登录、注册、Token刷新等
- **教师API** (teacherAPI)：教师信息管理
- **学生API** (studentAPI)：学生信息管理
- **课程API** (courseAPI)：课程相关操作
- **知识点API** (knowledgeAPI)：知识点管理
- **考试API** (examAPI)：考试管理
- **学习进度API** (progressAPI)：学习进度跟踪

## 开发工具

### Stagewise工具栏

项目集成了Stagewise开发辅助工具，提供以下功能：

- 上下文信息提供
- 自定义操作支持
- 开发环境调试辅助

使用方法：
1. 在VS Code/Cursor中安装Stagewise扩展
2. 在浏览器中使用Alt+S或点击工具栏按钮激活
3. 选择页面元素，向AI提问

## 路由结构

项目使用Vue Router管理路由，主要分为以下几部分：

- **/login**：登录页面
- **/register**：注册页面
- **/teacher/**：教师端路由
  - **/teacher/center**：教师主页
  - **/teacher/course**：课程管理
  - **/teacher/knowledge**：知识点管理
  - **/teacher/exam**：考试管理
- **/student/**：学生端路由（待开发）

## 权限控制

系统通过路由守卫实现权限控制：

- 需要认证的路由会检查Token有效性
- Token过期会自动尝试使用刷新Token获取新Token
- 认证失败会重定向到登录页面

## 开发规范

- 使用Vue 3组合式API开发组件
- API请求统一通过api.js模块管理
- 认证相关逻辑通过auth.js工具函数处理
- 使用Element Plus作为主要UI组件库