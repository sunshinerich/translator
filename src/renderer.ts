const sourceText = document.getElementById('sourceText') as HTMLTextAreaElement;
const targetText = document.getElementById('targetText') as HTMLTextAreaElement;
const statusDiv = document.getElementById('status') as HTMLDivElement;


const charCountSpan = document.getElementById('charCount') as HTMLSpanElement;

let isTranslating = false;
let pendingTranslation: string | null = null;

// Debounce function
function debounce(func: Function, wait: number) {
    let timeout: any;
    return function executedFunction(...args: any[]) {
        const later = () => {
            clearTimeout(timeout);
            func(...args);
        };
        clearTimeout(timeout);
        timeout = setTimeout(later, wait);
    };
}

function detectLanguage(text: string): { source: string, target: string } {
    // Simple detection: if contains Chinese characters, assume source is Chinese
    const hasChinese = /[\u4e00-\u9fa5]/.test(text);
    if (hasChinese) {
        return { source: 'zh-CN', target: 'en' };
    } else {
        return { source: 'en', target: 'zh-CN' };
    }
}

async function performTranslation() {
    const text = sourceText.value.trim();
    charCountSpan.textContent = `${sourceText.value.length} 字符`;

    if (!text) {
        targetText.value = '';
        statusDiv.textContent = '就绪';
        updateUIState();
        return;
    }

    if (isTranslating) {
        pendingTranslation = text;
        return;
    }

    isTranslating = true;
    statusDiv.textContent = '正在翻译...';

    const { source, target } = detectLanguage(text);

    try {
        const result = await window.electronAPI.translate(text, source, target);
        if (result.success && result.text) {
            targetText.value = result.text;
            statusDiv.textContent = '完成';
        } else {
            targetText.value = '错误: ' + (result.error || '未知错误');
            statusDiv.textContent = '错误';
        }
    } catch (err) {
        targetText.value = '通信错误';
        statusDiv.textContent = '通信错误';
    } finally {
        isTranslating = false;
        if (pendingTranslation !== null) {
            const nextText = pendingTranslation;
            pendingTranslation = null;
            if (nextText !== text) {
                performTranslation();
            }
        }
    }
}

// Auto-translate on typing with debounce
// Auto-translate on typing with debounce
const debouncedTranslate = debounce(performTranslation, 1000); // Increased to 1000ms for safety

const clearBtn = document.getElementById('clearBtn') as HTMLButtonElement;

function updateUIState() {
    const length = sourceText.value.length;
    charCountSpan.textContent = `${length} 字符`;
    if (length > 0) {
        clearBtn.style.display = 'flex';
    } else {
        clearBtn.style.display = 'none';
    }
}

sourceText.addEventListener('input', () => {
    updateUIState();
    debouncedTranslate();
});

clearBtn?.addEventListener('click', () => {
    sourceText.value = '';
    targetText.value = '';
    updateUIState();
    statusDiv.textContent = '就绪';
    sourceText.focus();
});

// Right-click to copy result
targetText.addEventListener('contextmenu', (e) => {
    e.preventDefault();
    if (targetText.value) {
        window.electronAPI.showContextMenu(targetText.value);
    }
});

// Custom Resize Logic (Window)
const resizeHandle = document.querySelector('.resize-handle') as HTMLDivElement;
let isWindowResizing = false;

resizeHandle.addEventListener('mousedown', (e) => {
    isWindowResizing = true;
    e.preventDefault();
    e.stopPropagation();
});

// Custom Splitter Logic (Input/Output)
const resizer = document.getElementById('resizer') as HTMLDivElement;
const inputArea = document.querySelector('.input-area') as HTMLDivElement;
const outputArea = document.querySelector('.output-area') as HTMLDivElement;
let isSplitting = false;

resizer.addEventListener('mousedown', (e) => {
    isSplitting = true;
    e.preventDefault();
    e.stopPropagation();
});

// Custom Drag Logic (Window Move)
let isDragging = false;
let dragOffset = { x: 0, y: 0 };

document.addEventListener('mousedown', (e: MouseEvent) => {
    const target = e.target as HTMLElement;
    // Don't drag if clicking on interactive elements or the resize handle
    // Added .result-display to allow text selection in the output area
    if (target.closest('button, input, textarea, select, .win-btn, .dock-btn, .dock-toggle, .resize-handle, .resizer, .modal-content, .result-display')) return;

    isDragging = true;
    dragOffset = { x: e.screenX, y: e.screenY };
});

document.addEventListener('mousemove', (e: MouseEvent) => {
    if (isWindowResizing) {
        window.electronAPI.resizeWindow(e.screenX, e.screenY);
    } else if (isSplitting) {
        const containerRect = document.querySelector('.translation-body')!.getBoundingClientRect();
        const relativeY = e.clientY - containerRect.top;
        const totalHeight = containerRect.height;
        const flexGrow = relativeY / totalHeight;

        if (flexGrow > 0.1 && flexGrow < 0.9) {
            inputArea.style.flex = flexGrow.toString();
            outputArea.style.flex = (1 - flexGrow).toString();
        }
    } else if (isDragging) {
        const dx = e.screenX - dragOffset.x;
        const dy = e.screenY - dragOffset.y;
        window.electronAPI.moveWindow(dx, dy);
        dragOffset = { x: e.screenX, y: e.screenY };
    }
});

document.addEventListener('mouseup', () => {
    isWindowResizing = false;
    isSplitting = false;
    isDragging = false;
});

// Hotkey: Ctrl+Enter to translate immediately
sourceText.addEventListener('keydown', (e) => {
    if (e.ctrlKey && e.key === 'Enter') {
        performTranslation();
    }
});

const alwaysOnTopCheckbox = document.getElementById('alwaysOnTop') as HTMLInputElement;
const monitorClipboardCheckbox = document.getElementById('monitorClipboard') as HTMLInputElement;

alwaysOnTopCheckbox.addEventListener('change', () => {
    window.electronAPI.setAlwaysOnTop(alwaysOnTopCheckbox.checked);
});

// Window Controls
const minimizeBtn = document.getElementById('minimizeBtn');
const closeBtn = document.getElementById('closeBtn');

minimizeBtn?.addEventListener('click', () => {
    window.electronAPI.minimize();
});

closeBtn?.addEventListener('click', () => {
    window.electronAPI.close();
});

// Settings Modal Logic
const settingsBtn = document.getElementById('settingsBtn') as HTMLButtonElement;
const settingsModal = document.getElementById('settingsModal') as HTMLDivElement;
const closeSettingsBtn = document.querySelector('.close') as HTMLSpanElement;
const saveSettingsBtn = document.getElementById('saveSettingsBtn') as HTMLButtonElement;
const providerSelect = document.getElementById('providerSelect') as HTMLSelectElement;
const youdaoConfig = document.getElementById('youdaoConfig') as HTMLDivElement;
const youdaoAppKey = document.getElementById('youdaoAppKey') as HTMLInputElement;
const youdaoAppSecret = document.getElementById('youdaoAppSecret') as HTMLInputElement;
const baiduConfig = document.getElementById('baiduConfig') as HTMLDivElement;
const baiduAppId = document.getElementById('baiduAppId') as HTMLInputElement;
const baiduKey = document.getElementById('baiduKey') as HTMLInputElement;

settingsBtn.addEventListener('click', () => {
    loadSettingsToModal();
    settingsModal.style.display = 'block';
});

async function loadSettingsToModal() {
    const settings = await window.electronAPI.getSettings();
    providerSelect.value = settings.provider;
    youdaoAppKey.value = settings.youdaoAppKey;
    youdaoAppSecret.value = settings.youdaoAppSecret;
    baiduAppId.value = settings.baiduAppId;
    baiduKey.value = settings.baiduKey;

    if (settings.provider === 'youdao') {
        youdaoConfig.style.display = 'block';
        baiduConfig.style.display = 'none';
    } else if (settings.provider === 'baidu') {
        youdaoConfig.style.display = 'none';
        baiduConfig.style.display = 'block';
    } else {
        youdaoConfig.style.display = 'none';
        baiduConfig.style.display = 'none';
    }

    settingsModal.style.display = 'block';
}

closeSettingsBtn.addEventListener('click', () => {
    settingsModal.style.display = 'none';
});

window.onclick = (event) => {
    if (event.target == settingsModal) {
        settingsModal.style.display = 'none';
    }
}

providerSelect.onchange = () => {
    if (providerSelect.value === 'youdao') {
        youdaoConfig.style.display = 'block';
        baiduConfig.style.display = 'none';
    } else if (providerSelect.value === 'baidu') {
        youdaoConfig.style.display = 'none';
        baiduConfig.style.display = 'block';
    } else {
        youdaoConfig.style.display = 'none';
        baiduConfig.style.display = 'none';
    }
}

saveSettingsBtn.onclick = async () => {
    await window.electronAPI.saveSettings({
        provider: providerSelect.value,
        youdaoAppKey: youdaoAppKey.value,
        youdaoAppSecret: youdaoAppSecret.value,
        baiduAppId: baiduAppId.value,
        baiduKey: baiduKey.value
    });
    settingsModal.style.display = 'none';
    statusDiv.textContent = 'Settings saved';
}

let lastClipboardText = '';
setInterval(async () => {
    if (monitorClipboardCheckbox.checked) {
        const text = await window.electronAPI.readClipboard();
        if (text && text !== lastClipboardText && text.trim().length > 0) {
            lastClipboardText = text;
            sourceText.value = text;
            updateUIState();
            performTranslation();
        }
    }
}, 1000);

// Listen for messages from main process
window.electronAPI.on('go-to-settings', () => {
    settingsBtn.click();
});
