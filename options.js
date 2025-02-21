// 切换标签页
document.querySelectorAll('.sidebar-item').forEach(item => {
  item.addEventListener('click', () => {
    // 移除所有active类
    document.querySelectorAll('.sidebar-item').forEach(i => i.classList.remove('active'));
    document.querySelectorAll('.tab-content').forEach(i => i.classList.remove('active'));
    
    // 添加active类到当前项
    item.classList.add('active');
    document.getElementById(item.dataset.tab).classList.add('active');
  });
});

// 设置默认时间范围
const DEFAULT_WORKDAY_RANGES = [{ start: '09:00', end: '18:00' }];
const DEFAULT_WEEKEND_RANGES = [{ start: '10:00', end: '16:00' }];

// 初始化每天的时间设置
function initWeekdaySettings() {
  const days = ['一', '二', '三', '四', '五', '六', '日'];
  
  days.forEach((day, index) => {
    const dayElement = document.querySelector(`.weekday-item[data-day="${index + 1}"]`);
    const timeRangesContainer = dayElement.querySelector('.time-ranges');
    
    // 清空现有时间段
    timeRangesContainer.innerHTML = '';
    
    // 添加默认时间段
    const defaultRanges = (index < 5) ? DEFAULT_WORKDAY_RANGES : DEFAULT_WEEKEND_RANGES;
    defaultRanges.forEach(range => {
      const rangeElement = document.createElement('div');
      rangeElement.className = 'time-range';
      rangeElement.innerHTML = `
        <input type="time" class="start-time" value="${range.start}">
        <span>至</span>
        <input type="time" class="end-time" value="${range.end}">
        <button type="button" class="remove-range">×</button>
      `;
      timeRangesContainer.appendChild(rangeElement);
    });
  });
  
  // 初始化工作日和周末开关状态
  document.getElementById('workdaySwitch').checked = true;
  document.getElementById('weekendSwitch').checked = true;
}

// 添加新的时间段
function addTimeRange(dayElement) {
  const timeRangesContainer = dayElement.querySelector('.time-ranges');
  const newRange = document.createElement('div');
  newRange.className = 'time-range';
  newRange.innerHTML = `
    <input type="time" class="start-time" value="00:00">
    <span>至</span>
    <input type="time" class="end-time" value="23:59">
    <button type="button" class="remove-range">×</button>
  `;
  timeRangesContainer.appendChild(newRange);
}

// 保存设置
document.getElementById('save').addEventListener('click', async () => {
  const timeRanges = {};
  
  // 获取工作日和周末的启用状态
  const workdayEnabled = document.getElementById('workdaySwitch').checked;
  const weekendEnabled = document.getElementById('weekendSwitch').checked;
  
  // 收集每天的时间段设置
  for (let day = 1; day <= 7; day++) {
    const isWeekend = day > 5;
    const enabled = isWeekend ? weekendEnabled : workdayEnabled;
    
    const ranges = [];
    if (enabled) {
      const timeRangesContainer = document.querySelector(`.weekday-item[data-day="${day}"] .time-ranges`);
      timeRangesContainer.querySelectorAll('.time-range').forEach(rangeElement => {
        const start = rangeElement.querySelector('.start-time').value;
        const end = rangeElement.querySelector('.end-time').value;
        if (start && end) {
          ranges.push({ start, end });
        }
      });
    }
    
    timeRanges[day] = {
      enabled,
      ranges
    };
  }
  
  const negativeSamples = Array.from(document.querySelectorAll('.negative-sample')).map(sample => ({
    domain: sample.querySelector('.domain').value,
    title: sample.querySelector('.title').value,
    timestamp: Date.now()
  }));
  
  const settings = {
    model: document.getElementById('model').value,
    apiKey: document.getElementById('apiKey').value,
    timeRanges,
    customPrompt: document.getElementById('customPrompt').value,
    negativeSamples
  };
  
  chrome.storage.sync.set(settings, () => {
    alert('设置已保存');
  });
});

// 加载保存的设置
chrome.storage.sync.get(['model', 'apiKey', 'timeRanges', 'customPrompt'], (data) => {
  if (data.model) document.getElementById('model').value = data.model;
  if (data.apiKey) document.getElementById('apiKey').value = data.apiKey;
  
  if (data.timeRanges) {
    // 设置工作日和周末开关状态
    const workdayEnabled = data.timeRanges[1]?.enabled ?? true;
    const weekendEnabled = data.timeRanges[6]?.enabled ?? true;
    document.getElementById('workdaySwitch').checked = workdayEnabled;
    document.getElementById('weekendSwitch').checked = weekendEnabled;
    
    // 更新每天的时间段
    for (let day = 1; day <= 7; day++) {
      const dayData = data.timeRanges[day];
      if (dayData && dayData.ranges.length > 0) {
        const timeRangesContainer = document.querySelector(`.weekday-item[data-day="${day}"] .time-ranges`);
        timeRangesContainer.innerHTML = ''; // 清空默认时间段
        
        dayData.ranges.forEach(range => {
          const rangeElement = document.createElement('div');
          rangeElement.className = 'time-range';
          rangeElement.innerHTML = `
            <input type="time" class="start-time" value="${range.start}">
            <span>至</span>
            <input type="time" class="end-time" value="${range.end}">
            <button type="button" class="remove-range">×</button>
          `;
          timeRangesContainer.appendChild(rangeElement);
        });
      }
    }
  }
  
  if (data.customPrompt) document.getElementById('customPrompt').value = data.customPrompt;
});

// 绑定添加时间段按钮事件
document.querySelectorAll('.add-time-range').forEach(button => {
  button.addEventListener('click', () => {
    const dayElement = button.closest('.weekday-item');
    addTimeRange(dayElement);
  });
});

// 绑定删除时间段按钮事件（使用事件委托）
document.querySelector('.weekday-settings').addEventListener('click', (e) => {
  if (e.target.classList.contains('remove-range')) {
    const rangeElement = e.target.closest('.time-range');
    const timeRangesContainer = rangeElement.parentElement;
    if (timeRangesContainer.children.length > 1) {
      rangeElement.remove();
    }
  }
});

// 工作日和周末开关状态变化处理
document.getElementById('workdaySwitch').addEventListener('change', function(e) {
  const isEnabled = e.target.checked;
  for (let day = 1; day <= 5; day++) {
    const dayContainer = document.querySelector(`.weekday-item[data-day="${day}"]`);
    dayContainer.classList.toggle('disabled', !isEnabled);
  }
});

document.getElementById('weekendSwitch').addEventListener('change', function(e) {
  const isEnabled = e.target.checked;
  for (let day = 6; day <= 7; day++) {
    const dayContainer = document.querySelector(`.weekday-item[data-day="${day}"]`);
    dayContainer.classList.toggle('disabled', !isEnabled);
  }
});

// 渲染负样本列表
function renderNegativeSamples(samples) {
  const container = document.getElementById('negativeSamples');
  container.innerHTML = samples.map((sample, index) => `
    <div class="negative-sample" data-index="${index}">
      <input type="text" class="domain" value="${sample.domain}" placeholder="域名">
      <input type="text" class="title" value="${sample.title}" placeholder="标题">
      <button class="remove-sample">删除</button>
    </div>
  `).join('');
}

// 加载负样本
chrome.storage.sync.get(['negativeSamples'], (data) => {
  const samples = data.negativeSamples || [];
  renderNegativeSamples(samples);
});

// 添加负样本
document.getElementById('addNegativeSample').addEventListener('click', async () => {
  const { negativeSamples = [] } = await chrome.storage.sync.get(['negativeSamples']);
  if (negativeSamples.length >= 10) {
    alert('最多只能添加10个负样本');
    return;
  }
  
  negativeSamples.unshift({ domain: '', title: '', timestamp: Date.now() });
  await chrome.storage.sync.set({ negativeSamples });
  renderNegativeSamples(negativeSamples);
});

// 处理负样本的修改和删除
document.getElementById('negativeSamples').addEventListener('click', async (e) => {
  if (e.target.classList.contains('remove-sample')) {
    const sample = e.target.closest('.negative-sample');
    const index = parseInt(sample.dataset.index);
    
    const { negativeSamples = [] } = await chrome.storage.sync.get(['negativeSamples']);
    negativeSamples.splice(index, 1);
    await chrome.storage.sync.set({ negativeSamples });
    renderNegativeSamples(negativeSamples);
  }
});

document.getElementById('negativeSamples').addEventListener('change', async (e) => {
  if (e.target.classList.contains('domain') || e.target.classList.contains('title')) {
    const sample = e.target.closest('.negative-sample');
    const index = parseInt(sample.dataset.index);
    
    const { negativeSamples = [] } = await chrome.storage.sync.get(['negativeSamples']);
    negativeSamples[index] = {
      domain: sample.querySelector('.domain').value,
      title: sample.querySelector('.title').value,
      timestamp: negativeSamples[index].timestamp
    };
    
    await chrome.storage.sync.set({ negativeSamples });
  }
});

// 页面加载完成后初始化
document.addEventListener('DOMContentLoaded', () => {
  initWeekdaySettings();
}); 