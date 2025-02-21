// 随机背景图片数组
const backgrounds = [
  'https://images.pexels.com/photos/1172207/pexels-photo-1172207.jpeg',
];

// 随机选择背景图片
document.body.style.backgroundImage = `url(${backgrounds[Math.floor(Math.random() * backgrounds.length)]})`;

// 添加返回工作按钮事件
document.getElementById('return').addEventListener('click', () => {
  chrome.tabs.getCurrent(tab => {
    chrome.tabs.remove(tab.id);
  });
});

// 添加误报处理
document.getElementById('reportError').addEventListener('click', async () => {
  console.log("wubao");
  const urlParams = new URLSearchParams(window.location.search);
  const title = decodeURIComponent(urlParams.get('title'));
  const domain = decodeURIComponent(urlParams.get('domain'));
  console.log("Wrong sample: ", title, domain);
  
  if (title && domain) {
    try {
      // 获取现有的负样本
      const { negativeSamples = [] } = await chrome.storage.sync.get(['negativeSamples']);
      
      // 检查是否已经存在相同的样本
      const exists = negativeSamples.some(sample => 
        sample.title === title && sample.domain === domain
      );
      
      if (exists) {
        alert('该网页已在负样本列表中');
        return;
      }
      
      // 检查负样本列表是否已满
      if (negativeSamples.length >= 10) {
        alert('负样本列表已满（最多10个），请先在设置页面中删除一些再添加');
        return;
      }
      
      // 添加新的负样本
      const newSample = { title, domain, timestamp: Date.now() };
      const updatedSamples = [newSample, ...negativeSamples];
      
      await chrome.storage.sync.set({ negativeSamples: updatedSamples });
      console.log("负样本已添加：", newSample);
      alert('已成功将该网页添加到负样本列表中');
      
      // 返回原始页面
      window.history.back();
    } catch (error) {
      console.error("保存负样本时出错：", error);
      alert("保存失败：" + error.message);
    }
  } else {
    console.error("未能获取页面信息");
    alert("无法获取页面信息：标题或域名为空");
  }
}); 