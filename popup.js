document.getElementById('save').addEventListener('click', () => {
    const rule = document.getElementById('rule').value;
    const apiKey = document.getElementById('apiKey').value;
    
    chrome.storage.sync.set({ rule, apiKey }, () => {
      alert('settings saved');
      window.close();
    });
  });
  
  // 加载已保存的设置
  chrome.storage.sync.get(['rule', 'apiKey'], (data) => {
    document.getElementById('rule').value = data.rule || '';
    document.getElementById('apiKey').value = data.apiKey || '';
  });

  // 打开设置页面
  document.getElementById('openOptions').addEventListener('click', () => {
    chrome.runtime.openOptionsPage();
  });