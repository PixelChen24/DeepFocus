// 保存当前网页标题
let web_title = '';
let web_domain = '';
let processingTab = null;  // 用于追踪正在处理的标签页
let processing_title = null;
let lastProcessedUrl = null;


// 监听标签页加载完成事件
chrome.webNavigation.onCompleted.addListener(async (details) => {
  try {
    processingTab = details.tabId;
    // 等待一段时间后获取最终标题
    setTimeout(async () => {
      await updatePageTitle(details.tabId);
      processingTab = null;  // 处理完成后重置
    }, 5000);
  } catch (error) {
    console.error('获取页面标题时发生错误:', error);
    processingTab = null;
  }
});

// 监听标签页更新事件
chrome.tabs.onUpdated.addListener(async (tabId, changeInfo, tab) => {
  // 只在标题变化且不是正在处理中的标签页时处理
  if (changeInfo.title && tabId !== processingTab) {
    processingTab = tabId;
    // 等待页面稳定后获取标题
    setTimeout(async () => {
      await updatePageTitle(tabId);
      processingTab = null;
    }, 5000);
  }
});

// 检查是否在拦截时间段内
async function isInBlockingTime() {
  const { timeRanges } = await chrome.storage.sync.get(['timeRanges']);
  if (!timeRanges) return true; // 如果未设置时间段，默认总是拦截
  
  const now = new Date();
  const day = now.getDay() || 7; // 将周日的0转换为7
  const currentTime = now.getHours() * 60 + now.getMinutes();
  
  const daySettings = timeRanges[day];
  if (!daySettings || !daySettings.enabled || !daySettings.ranges.length) {
    return false; // 当天未启用或没有设置时间段
  }
  
  // 检查是否在任意时间段内
  return daySettings.ranges.some(range => {
    const [startHour, startMinute] = range.start.split(':').map(Number);
    const [endHour, endMinute] = range.end.split(':').map(Number);
    
    const startTime = startHour * 60 + startMinute;
    const endTime = endHour * 60 + endMinute;
    
    return currentTime >= startTime && currentTime <= endTime;
  });
}

// 更新图标状态
async function updateIcon() {
  const blocking = await isInBlockingTime();
  const iconPath = blocking ? {
    16: "icons/focus16.png",
    32: "icons/focus32.png",
    48: "icons/focus48.png",
    128: "icons/focus128.png"
  } : {
    16: "icons/normal16.png",
    32: "icons/normal32.png",
    48: "icons/normal48.png",
    128: "icons/normal128.png"
  };
  
  chrome.action.setIcon({ path: iconPath });
}

// 获取并更新标题的函数
async function updatePageTitle(tabId) {
  try {
    const tab = await chrome.tabs.get(tabId);
    // 检查标签页是否存在
    if (!tab) {
      console.log(`标签页 ${tabId} 不存在`);
      return;
    }
    
    const currentUrl = tab.url;
    
    // 检查是否是扩展本身的页面
    if (currentUrl.startsWith('chrome-extension://') || currentUrl.startsWith('chrome://') || currentUrl === "") {
      return;
    }

    // 如果这个URL已经处理过，直接返回
    if (currentUrl === lastProcessedUrl) {
      return;
    }
    lastProcessedUrl = currentUrl;

    const results = await chrome.scripting.executeScript({
      target: { tabId },
      func: () => ({
        title: document.title,
        domain: window.location.hostname
      })
    });
    web_title = results[0].result.title;
    web_domain = results[0].result.domain.replace(/^www\./, '');
    if (web_title !== processing_title) {
      // 检查是否在拦截时间段内
      if (!await isInBlockingTime()) {
        processing_title = web_title;
        console.log("不在拦截时间段内")
        return;
      }
      
      console.log('title:', web_title);
      console.log('domain:', web_domain);
      
      // 调用 DeepSeek API
      try {
        const { apiKey, model, customPrompt } = await chrome.storage.sync.get(['apiKey', 'model', 'customPrompt']);
        if (!apiKey) {
          console.warn('未设置 API Key');
          return;
        }
        console.log('apiKey:', apiKey);
        console.log('customPrompt', customPrompt)

        const systemPrompt = customPrompt || "你是一个网页内容分析助手，帮助判断网页是否可能影响工作效率。";
        
        const response = await fetch('https://dashscope.aliyuncs.com/compatible-mode/v1/chat/completions', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${apiKey}`
          },
          body: JSON.stringify({
            "model": model || "deepseek-v3",
            "messages": [
              {
                "role": "system",
                "content": systemPrompt
              },
              {
                "role": "user",
                "content": `请分析这个网页是否可能影响工作效率。网页信息：\n域名：${web_domain}\n标题：${web_title}\n请直接回答"是"或"否"。`
              }
            ]
          })
        });
        console.log("response: ", response);
        const result = await response.json();
        const answer = result.choices[0].message.content.trim().toLowerCase();
        console.log('API Response:', result);
        if (answer === '是') {
          // 打开提醒页面
          chrome.tabs.update(tabId, {
            url: chrome.runtime.getURL('focus.html')
          });
        }
      } catch (error) {
        console.log('调用 DeepSeek API 时发生错误:', error);
      }

    }
  } catch (error) {
    console.log(`获取标签页 ${tabId} 时发生错误:`, error);
    return;
  }
}

// 设置定时更新图标
try {
  chrome.alarms.create('updateIcon', { periodInMinutes: 1 });
  chrome.alarms.onAlarm.addListener((alarm) => {
    if (alarm.name === 'updateIcon') {
      updateIcon();
    }
  });
} catch (error) {
  console.error('创建定时器失败:', error);
}

// 初始化时更新图标
updateIcon();