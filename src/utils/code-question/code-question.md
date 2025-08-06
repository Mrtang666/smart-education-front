#编程题的相关逻辑
##编程题的相关字段如下：
```
{
  "id": 0,
  "examId": 0,
  "title": "string",
  "description": "string",
  "sampleInputs": [
    "string"
  ],
  "sampleOutputs": [
    "string"
  ],
  "caseInputs": [
    "string"
  ],
  "caseOutputs": [
    "string"
  ],
  "referenceAnswer": "string",
  "createdAt": "2025-08-06T02:20:16.986Z",
  "updatedAt": "2025-08-06T02:20:16.986Z"
}
```

##字段说明：
- id: 编程题的唯一标识符
- examId: 考试的唯一标识符(目前编程题只能存在于考试中，不能存在于作业中)
- title: 编程题的标题，他是用来简要描述编程题的内容
- description: 编程题的详细描述，包含题目的要求、输入输出格式等
- sampleInputs: 编程题的示例输入，用于展示输入的格式
- sampleOutputs: 编程题的示例输出，用于展示正确的输出结果
- caseInputs: 编程题的测试用例输入，用于测试用例的生成
- caseOutputs: 编程题的测试用例输出，用于测试用例的生成
- referenceAnswer: 编程题的参考答案，用于对编程题的答案进行评判，可以在这里面展示正确代码
- createdAt: 编程题的创建时间
- updatedAt: 编程题的更新时间

##编程题的逻辑说明：
- 编程题只能存在于考试中，不能存在于作业中

##创建编程题的编辑弹窗中的输入字段
- title: 编程题的标题
- description: 编程题的详细描述
- sampleInputs: 编程题的示例输入
- sampleOutputs: 编程题的示例输出
- caseInputs: 编程题的测试用例输入
- caseOutputs: 编程题的测试用例输出
- referenceAnswer: 编程题的参考答案

##创建编程题的编辑弹窗中的按钮
- 保存: 保存编程题的基本信息
- 取消: 取消创建编程题的弹窗

##编程题的详情页中的字段
- title: 编程题的标题
- description: 编程题的详细描述
- sampleInputs: 编程题的示例输入
- sampleOutputs: 编程题的示例输出
- caseInputs: 编程题的测试用例输入
- caseOutputs: 编程题的测试用例输出
- referenceAnswer: 编程题的参考答案
- createdAt: 编程题的创建时间
- updatedAt: 编程题的更新时间

##编程题的详情页中的按钮
- 编辑: 编辑编程题的基本信息，点击后弹出编辑弹窗
- 删除: 删除编程题，点击后弹出确认删除弹窗

##其它细节
- 编程题的sampleInputs和sampleOutputs是一一对应的，长度必须相同
- 编程题的caseInputs和caseOutputs是一一对应的，长度必须相同
- 编程题的referenceAnswer是一个字符串，他是用来展示正确代码的
- 编程题的createdAt和updatedAt是自动生成的，用户不能修改


