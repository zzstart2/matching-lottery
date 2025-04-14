// DOM 元素
const femaleNumber = document.getElementById('female-number');
const maleNumber = document.getElementById('male-number');
const controlButton = document.getElementById('control-button');
const resultContainer = document.getElementById('result-container');
const resultText = document.getElementById('result-text');
const mainContent = document.getElementById('main-content');
const settingsButton = document.getElementById('settings-button');
const settingsPanel = document.getElementById('settings-panel');
const saveSettingsButton = document.getElementById('save-settings');
const cancelSettingsButton = document.getElementById('cancel-settings');

// 设置表单元素
const femaleMinInput = document.getElementById('female-min');
const femaleMaxInput = document.getElementById('female-max');
const maleMinInput = document.getElementById('male-min');
const maleMaxInput = document.getElementById('male-max');
const titleSizeInput = document.getElementById('title-size');
const numberSizeInput = document.getElementById('number-size');
const labelSizeInput = document.getElementById('label-size');

// 默认设置
let settings = {
    femaleRange: { min: 1, max: 103 },
    maleRange: { min: 1, max: 73 },
    fontSize: {
        title: 48,
        number: 80,
        label: 28
    }
};

// 应用状态
let state = {
    rolling: false,
    rollInterval: null,
    selectedFemale: null,
    selectedMale: null,
    step: 0,  // 0: 初始状态, 1: 停止滚动, 2: 显示结果
};

// 初始化
function init() {
    loadSettings();
    applySettings();
    bindEvents();
}

// 加载设置
function loadSettings() {
    const savedSettings = localStorage.getItem('matchingLotterySettings');
    if (savedSettings) {
        try {
            settings = JSON.parse(savedSettings);
        } catch (e) {
            console.error('Failed to parse settings:', e);
        }
    }
}

// 保存设置
function saveSettings() {
    localStorage.setItem('matchingLotterySettings', JSON.stringify(settings));
}

// 应用设置到UI
function applySettings() {
    // 应用字体大小
    document.documentElement.style.setProperty('--title-size', `${settings.fontSize.title}px`);
    document.documentElement.style.setProperty('--number-size', `${settings.fontSize.number}px`);
    document.documentElement.style.setProperty('--label-size', `${settings.fontSize.label}px`);
    
    // 更新设置表单的值
    femaleMinInput.value = settings.femaleRange.min;
    femaleMaxInput.value = settings.femaleRange.max;
    maleMinInput.value = settings.maleRange.min;
    maleMaxInput.value = settings.maleRange.max;
    titleSizeInput.value = settings.fontSize.title;
    numberSizeInput.value = settings.fontSize.number;
    labelSizeInput.value = settings.fontSize.label;
    
    // 根据设置调整CSS
    document.querySelector('.title').style.fontSize = `${settings.fontSize.title}px`;
    document.querySelectorAll('.section-title').forEach(el => {
        el.style.fontSize = `${settings.fontSize.label}px`;
    });
    document.querySelectorAll('.number').forEach(el => {
        el.style.fontSize = `${settings.fontSize.number}px`;
    });
}

// 绑定事件
function bindEvents() {
    controlButton.addEventListener('click', handleControlButton);
    settingsButton.addEventListener('click', showSettings);
    saveSettingsButton.addEventListener('click', handleSaveSettings);
    cancelSettingsButton.addEventListener('click', hideSettings);
    
    // 防止表单提交刷新页面
    document.querySelectorAll('form').forEach(form => {
        form.addEventListener('submit', e => e.preventDefault());
    });
}

// 控制按钮处理
function handleControlButton() {
    switch (state.step) {
        case 0: // 开始滚动
            startRolling();
            break;
        case 1: // 停止滚动
            stopRolling();
            break;
        case 2: // 重新开始
            resetState();
            break;
    }
}

// 开始滚动
function startRolling() {
    state.rolling = true;
    state.step = 1;
    controlButton.textContent = '停止';
    
    state.rollInterval = setInterval(() => {
        const femaleRandomNumber = getRandomNumber(settings.femaleRange.min, settings.femaleRange.max);
        const maleRandomNumber = getRandomNumber(settings.maleRange.min, settings.maleRange.max);
        
        femaleNumber.textContent = femaleRandomNumber;
        maleNumber.textContent = maleRandomNumber;
    }, 50);
}

// 停止滚动
function stopRolling() {
    if (state.rollInterval) {
        clearInterval(state.rollInterval);
        state.rollInterval = null;
    }
    
    state.rolling = false;
    state.step = 2;
    state.selectedFemale = parseInt(femaleNumber.textContent);
    state.selectedMale = parseInt(maleNumber.textContent);
    
    showResult();
    controlButton.textContent = '重新开始';
}

// 显示结果
function showResult() {
    // 隐藏主抽奖容器，显示结果容器
    document.querySelector('.lottery-container').style.display = 'none';
    resultContainer.style.display = 'flex';
    
    // 创建心形符号
    resultText.innerHTML = `${state.selectedFemale} <span style="color: #ff4d7e;">❤</span> ${state.selectedMale}`;
    
    // 添加结果动画
    resultText.classList.add('animated');
}

// 重置状态
function resetState() {
    state.step = 0;
    state.selectedFemale = null;
    state.selectedMale = null;
    
    // 重置UI
    document.querySelector('.lottery-container').style.display = 'flex';
    resultContainer.style.display = 'none';
    resultText.classList.remove('animated');
    
    // 重置按钮文本
    controlButton.textContent = '开始';
    
    // 初始化数字
    femaleNumber.textContent = settings.femaleRange.min;
    maleNumber.textContent = settings.maleRange.min;
}

// 显示设置面板
function showSettings() {
    settingsPanel.style.display = 'block';
    mainContent.style.display = 'none';
}

// 隐藏设置面板
function hideSettings() {
    settingsPanel.style.display = 'none';
    mainContent.style.display = 'flex';
}

// 保存设置
function handleSaveSettings() {
    // 验证和获取输入值
    const femaleMin = Math.max(1, parseInt(femaleMinInput.value) || 1);
    const femaleMax = Math.max(femaleMin, parseInt(femaleMaxInput.value) || 103);
    const maleMin = Math.max(1, parseInt(maleMinInput.value) || 1);
    const maleMax = Math.max(maleMin, parseInt(maleMaxInput.value) || 73);
    
    const titleSize = Math.max(16, Math.min(72, parseInt(titleSizeInput.value) || 48));
    const numberSize = Math.max(16, Math.min(160, parseInt(numberSizeInput.value) || 80));
    const labelSize = Math.max(12, Math.min(48, parseInt(labelSizeInput.value) || 28));
    
    // 更新设置
    settings.femaleRange.min = femaleMin;
    settings.femaleRange.max = femaleMax;
    settings.maleRange.min = maleMin;
    settings.maleRange.max = maleMax;
    settings.fontSize.title = titleSize;
    settings.fontSize.number = numberSize;
    settings.fontSize.label = labelSize;
    
    // 保存并应用设置
    saveSettings();
    applySettings();
    
    // 关闭设置面板
    hideSettings();
    
    // 重置状态
    resetState();
}

// 获取随机数
function getRandomNumber(min, max) {
    return Math.floor(Math.random() * (max - min + 1)) + min;
}

// 页面加载完成后初始化
document.addEventListener('DOMContentLoaded', init); 