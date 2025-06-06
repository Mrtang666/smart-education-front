import { StagewiseToolbar } from '@stagewise/toolbar-vue';

// 定义工具栏配置
const stagewiseConfig = {
  plugins: [
    // 可以添加自定义插件
    {
      name: 'smart-education-plugin',
      description: '为智慧教育平台提供上下文信息',
      shortInfoForPrompt: () => {
        return "关于当前选中元素的上下文信息";
      },
      mcp: null,
      actions: [
        {
          name: '示例操作',
          description: '演示自定义操作',
          execute: () => {
            window.alert('这是一个自定义操作!');
          },
        },
      ],
    }
  ]
};

// 设置Stagewise工具栏
export function setupStagewise(app) {
  if (process.env.NODE_ENV === 'development') {
    // 注册组件
    app.component('StagewiseToolbar', StagewiseToolbar);
    
    // 注意：在App.vue中需要添加 <StagewiseToolbar :config="stagewiseConfig" />
    console.log('Stagewise工具栏已初始化，开发环境可用');
  }
}

export { stagewiseConfig }; 