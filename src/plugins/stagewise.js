import { StagewiseToolbar } from '@stagewise/toolbar-vue';

// 定义工具栏配置
const stagewiseConfig = {
  plugins: [
    {
      name: 'smart-education-plugin',
      description: '智慧教育平台上下文提供器',
      shortInfoForPrompt: (element) => {
        // 获取选中元素的有用信息
        const tagName = element?.tagName?.toLowerCase() || 'unknown';
        const className = element?.className || '';
        const id = element?.id || '';
        const text = element?.innerText?.substring(0, 100) || '';
        
        // 构建上下文信息
        return `
          这是一个智慧教育平台，包含教师端和学生端功能。
          
          当前选中的元素是: ${tagName}
          类名: ${className}
          ID: ${id}
          内容文本: ${text}
          
          平台主要功能包括:
          - 课程管理
          - 考试管理
          - 学生管理
          - 知识点管理
          - 统计分析
          
          请根据上下文帮助用户完成相关功能的开发或修改。
        `;
      },
      mcp: null,
      actions: [
        {
          name: '生成组件',
          description: '根据描述生成新组件',
          execute: () => {
            console.log('触发生成组件操作');
            alert('请在VS Code/Cursor中使用AI功能生成组件');
          },
        },
        {
          name: '优化样式',
          description: '优化当前元素的样式',
          execute: (element) => {
            console.log('触发优化样式操作', element);
            alert('请在VS Code/Cursor中使用AI功能优化样式');
          },
        }
      ],
    }
  ]
};

// 设置Stagewise工具栏
export function setupStagewise(app) {
  if (process.env.NODE_ENV === 'development') {
    // 注册组件
    app.component('StagewiseToolbar', StagewiseToolbar);
    
    console.log('✅ Stagewise工具栏已初始化，可在开发环境使用');
    console.log('📝 使用方法：');
    console.log('1. 在VS Code/Cursor中安装Stagewise扩展');
    console.log('2. 在浏览器中使用Alt+S或点击工具栏按钮激活');
    console.log('3. 选择页面元素，然后向AI提问');
  }
}

export { stagewiseConfig }; 