# DeepFocus
## 使用
1. 配置apiKey。
前往[阿里百炼平台](https://bailian.console.aliyun.com/)注册账号获取apiKey, 将apiKey填写到**高级设置->基础设置**中。

2. 设置专注时间段
前往**高级设置->拦截时段**中设置专注时间段

3. 客制化拦截规则（可选）

    * 前往**高级设置->自定义规则**中设置提示词, 例如：
        ```text
        你是一个网页内容分析助手，帮助判断网页是否可能影响工作效率。
        我的工作是研究人工智能技术，平时会看一些关于技术的网页，请你准确地判断
        ```
        发挥你的创意！用简短的文字描述你想要拦截的内容类型！
    * 大模型有时候还是会误判，将一些学习知识类型的网站（例如知乎里面关于某个科技话题的讨论）判定为拦截，你可以在拦截界面点击”这是误判“进行修正，或者前往
    **高级设置->自定义规则**中手动设置负样本。 这两种方式设定的负样本共享空间（10个）