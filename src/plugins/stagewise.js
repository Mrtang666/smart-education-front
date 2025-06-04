import { StagewiseToolbar } from '@stagewise/toolbar-vue';

const stagewiseConfig = {
  plugins: []
};

export function setupStagewise(app) {
  if (process.env.NODE_ENV === 'development') {
    app.component('StagewiseToolbar', StagewiseToolbar);
    
    // 在顶层组件使用后需要这样调用:
    // <StagewiseToolbar :config="stagewiseConfig" />
  }
}

export { stagewiseConfig }; 