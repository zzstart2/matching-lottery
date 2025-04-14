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
const historyList = document.getElementById('history-list');
const resetHistoryButton = document.getElementById('reset-history');

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

// 已配对的号码
let pairedNumbers = {
    female: [],
    male: []
};

// 配对历史记录
let pairingHistory = [];

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
    loadHistory();
    
    // 如果没有历史记录，添加示例数据
    if (pairingHistory.length === 0) {
        pairingHistory = [
            { female: 8, male: 15 },
            { female: 23, male: 42 },
            { female: 66, male: 31 }
        ];
        saveHistory();
    }
    
    applySettings();
    bindEvents();
    updateHistoryDisplay();
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

// 加载历史记录
function loadHistory() {
    const savedHistory = localStorage.getItem('matchingLotteryHistory');
    const savedPairedNumbers = localStorage.getItem('matchingLotteryPairedNumbers');
    
    if (savedHistory) {
        try {
            pairingHistory = JSON.parse(savedHistory);
        } catch (e) {
            console.error('Failed to parse history:', e);
            pairingHistory = [];
        }
    }
    
    if (savedPairedNumbers) {
        try {
            pairedNumbers = JSON.parse(savedPairedNumbers);
        } catch (e) {
            console.error('Failed to parse paired numbers:', e);
            pairedNumbers = { female: [], male: [] };
        }
    }
}

// 保存设置
function saveSettings() {
    localStorage.setItem('matchingLotterySettings', JSON.stringify(settings));
}

// 保存历史记录
function saveHistory() {
    localStorage.setItem('matchingLotteryHistory', JSON.stringify(pairingHistory));
    localStorage.setItem('matchingLotteryPairedNumbers', JSON.stringify(pairedNumbers));
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
    resetHistoryButton.addEventListener('click', resetHistory);
    
    // 防止表单提交刷新页面
    document.querySelectorAll('form').forEach(form => {
        form.addEventListener('submit', e => e.preventDefault());
    });
}

// 重置历史记录
function resetHistory() {
    if (confirm('确定要清除所有配对记录吗？')) {
        pairingHistory = [];
        pairedNumbers = { female: [], male: [] };
        saveHistory();
        updateHistoryDisplay();
        
        // 重置抽奖状态
        resetState();
    }
}

// 更新历史记录显示
function updateHistoryDisplay() {
    console.log('更新历史记录：', pairingHistory);
    
    // 确保历史记录容器可见
    document.querySelector('.history-container').style.display = 'block';
    
    historyList.innerHTML = '';
    
    if (pairingHistory.length === 0) {
        const emptyMessage = document.createElement('div');
        emptyMessage.className = 'history-item';
        emptyMessage.textContent = '暂无配对记录';
        historyList.appendChild(emptyMessage);
        return;
    }
    
    // 按照最新的记录在前面的顺序显示
    pairingHistory.slice().reverse().forEach(pair => {
        const historyItem = document.createElement('div');
        historyItem.className = 'history-item';
        historyItem.innerHTML = `
            <span class="female-history">${pair.female}</span>
            <span>❤</span>
            <span class="male-history">${pair.male}</span>
        `;
        historyList.appendChild(historyItem);
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

// 获取可用的女生号码
function getAvailableFemaleNumbers() {
    const availableNumbers = [];
    for (let i = settings.femaleRange.min; i <= settings.femaleRange.max; i++) {
        if (!pairedNumbers.female.includes(i)) {
            availableNumbers.push(i);
        }
    }
    return availableNumbers;
}

// 获取可用的男生号码
function getAvailableMaleNumbers() {
    const availableNumbers = [];
    for (let i = settings.maleRange.min; i <= settings.maleRange.max; i++) {
        if (!pairedNumbers.male.includes(i)) {
            availableNumbers.push(i);
        }
    }
    return availableNumbers;
}

// 开始滚动
function startRolling() {
    const availableFemaleNumbers = getAvailableFemaleNumbers();
    const availableMaleNumbers = getAvailableMaleNumbers();
    
    // 检查是否还有可用号码
    if (availableFemaleNumbers.length === 0 || availableMaleNumbers.length === 0) {
        alert('无可用号码！请重置配对记录。');
        return;
    }
    
    state.rolling = true;
    state.step = 1;
    controlButton.textContent = '停止';
    
    state.rollInterval = setInterval(() => {
        // 从可用号码中随机选择
        const femaleRandomIndex = Math.floor(Math.random() * availableFemaleNumbers.length);
        const maleRandomIndex = Math.floor(Math.random() * availableMaleNumbers.length);
        
        const femaleRandomNumber = availableFemaleNumbers[femaleRandomIndex];
        const maleRandomNumber = availableMaleNumbers[maleRandomIndex];
        
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
    
    // 记录配对结果
    pairedNumbers.female.push(state.selectedFemale);
    pairedNumbers.male.push(state.selectedMale);
    pairingHistory.push({
        female: state.selectedFemale,
        male: state.selectedMale
    });
    
    // 保存历史记录
    saveHistory();
    
    // 更新历史记录显示
    updateHistoryDisplay();
    
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
    
    // 找一个未配对的初始号码
    const availableFemaleNumbers = getAvailableFemaleNumbers();
    const availableMaleNumbers = getAvailableMaleNumbers();
    
    if (availableFemaleNumbers.length > 0 && availableMaleNumbers.length > 0) {
        femaleNumber.textContent = availableFemaleNumbers[0];
        maleNumber.textContent = availableMaleNumbers[0];
        
        // 直接开始滚动
        startRolling();
    } else {
        // 如果没有可用号码，显示提示
        femaleNumber.textContent = '-';
        maleNumber.textContent = '-';
        alert('所有号码已配对！请重置配对记录。');
        controlButton.textContent = '开始';
    }
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
    // 获取原始设置
    const oldFemaleMin = settings.femaleRange.min;
    const oldFemaleMax = settings.femaleRange.max;
    const oldMaleMin = settings.maleRange.min;
    const oldMaleMax = settings.maleRange.max;
    
    // 验证和获取输入值
    const femaleMin = Math.max(1, parseInt(femaleMinInput.value) || 1);
    const femaleMax = Math.max(femaleMin, parseInt(femaleMaxInput.value) || 103);
    const maleMin = Math.max(1, parseInt(maleMinInput.value) || 1);
    const maleMax = Math.max(maleMin, parseInt(maleMaxInput.value) || 73);
    
    const titleSize = Math.max(16, Math.min(72, parseInt(titleSizeInput.value) || 48));
    const numberSize = Math.max(16, Math.min(160, parseInt(numberSizeInput.value) || 80));
    const labelSize = Math.max(12, Math.min(48, parseInt(labelSizeInput.value) || 28));
    
    // 检查设置是否改变
    const rangeChanged = (
        femaleMin !== oldFemaleMin || 
        femaleMax !== oldFemaleMax || 
        maleMin !== oldMaleMin || 
        maleMax !== oldMaleMax
    );
    
    // 如果范围改变，重置配对记录
    if (rangeChanged) {
        const confirmReset = confirm('更改号码范围将重置所有配对记录，是否继续？');
        if (!confirmReset) {
            return;
        }
        resetHistory();
    }
    
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