// ==UserScript==
// @name         Filterblade 简体中文汉化
// @namespace    https://github.com/Vithur/mihomo
// @version      4.1
// @description  Filterblade 简体中文汉化（原繁体版作者 Sab）。仅 PoE2；术语以 poe2db.tw/cn 官方简中译名为准。
// @author       Sab (原作) / Vithur (简体化)
// @match        https://www.filterblade.xyz/*
// @match        https://poe2filter.com/*
// @grant        GM_xmlhttpRequest
// @grant        GM_getValue
// @grant        GM_setValue
// @grant        GM_deleteValue
// @connect      raw.githubusercontent.com
// @run-at       document-end
// ==/UserScript==

(function () {
  'use strict';

  const CONFIG = {
    URLS: {
      POE2: 'https://raw.githubusercontent.com/Vithur/mihomo/main/filterblade/poe2.zh-cn.json'
    },
    SELECTORS: {
      OVERLAY_TARGET: '.ItemProgression_ItemLabel',
      OVERLAY_CLASS: 'translation-overlay-parent'
    },
    PERFORMANCE: {
      SEARCH_DEBOUNCE: 300,
      TRANSITION_DURATION: 300
    },
    SEARCH: {
      MAX_CHINESE_LENGTH: 13
    }
  };

  const WORKER_CODE = `
    self.onmessage = function(e) {
      const { type, payload } = e.data;
      if (type === 'INIT') {
        self.translationMap = new Map(payload);
        self.reverseMap = new Map();
        self.searchIndex = [];
        for (const [key, value] of self.translationMap.entries()) {
          self.reverseMap.set(value, key);
          self.searchIndex.push({ o: key.toLowerCase(), t: value, k: key });
        }
        self.postMessage({ type: 'INIT_COMPLETE' });
      } else if (type === 'SEARCH') {
        const query = payload.toLowerCase();
        if (!query) { self.postMessage({ type: 'SEARCH_RESULT', payload: [] }); return; }
        const results = self.searchIndex
          .filter(item => {
            if (item.t.length > 13) return false;
            if (/[>=<?.]/.test(item.o) || /[>=<?.]/.test(item.t)) return false;
            return item.o.includes(query) || item.t.includes(query);
          })
          .slice(0, 10)
          .map(item => ({ original: item.k, translated: item.t }));
        self.postMessage({ type: 'SEARCH_RESULT', payload: results });
      }
    };
  `;

  class Utils {
    static normalizeText(text) {
      return text ? text.replace(/\s+/g, ' ').trim() : '';
    }
    static debounce(func, wait) {
      let timeout;
      return function (...args) {
        clearTimeout(timeout);
        timeout = setTimeout(() => func.apply(this, args), wait);
      };
    }
    static createWorker(code) {
      const blob = new Blob([code], { type: 'application/javascript' });
      return new Worker(URL.createObjectURL(blob));
    }
    static downloadJson(filename, content) {
      const blob = new Blob([content], { type: "application/json" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      setTimeout(() => { URL.revokeObjectURL(url); document.body.removeChild(a); }, 100);
    }
  }

  class DataManager {
    constructor() {
      this.data = new Map();
      this.reverseData = new Map();
    }

    async init() {
      const urls = [CONFIG.URLS.POE2];
      console.log('[DataManager] 载入 PoE2 词典');

      const results = await Promise.all(urls.map(url => this._fetchJson(url)));

      this.data.clear();
      this.reverseData.clear();

      results.forEach(json => {
        if (!json) return;
        for (const [original, translated] of json) {
          const normOriginal = Utils.normalizeText(original);
          this.data.set(normOriginal, translated);
          if (!this.reverseData.has(translated)) {
            this.reverseData.set(translated, normOriginal);
          }
        }
      });

      console.log(`[DataManager] 已载入 ${this.data.size} 条词条。`);
      return Array.from(this.data.entries());
    }

    _fetchJson(url) {
      return new Promise((resolve) => {
        GM_xmlhttpRequest({
          method: 'GET',
          url: `${url}?_t=${Date.now()}`,
          onload: (res) => {
            try {
              resolve(JSON.parse(res.responseText));
            } catch (e) {
              console.error(`[DataManager] JSON 解析失败: ${url}`, e);
              resolve([]);
            }
          },
          onerror: (err) => {
            console.error(`[DataManager] 网络错误: ${url}`, err);
            resolve([]);
          }
        });
      });
    }

    getTranslation(text) { return this.data.get(text); }
    getOriginal(text) { return this.reverseData.get(text); }
  }

  class DOMHandler {
    constructor(dataManager) {
      this.dataManager = dataManager;
      this.observer = null;
      this.isTranslated = false;
    }

    enable() {
      if (this.isTranslated) return;
      this.processRoot(document.body, true);
      this._startObserver();
      this.isTranslated = true;
    }

    disable() {
      if (!this.isTranslated) return;
      this._stopObserver();
      this.processRoot(document.body, false);
      this.isTranslated = false;
    }

    processRoot(root, toTranslated) {
      const walker = document.createTreeWalker(
        root,
        NodeFilter.SHOW_TEXT | NodeFilter.SHOW_ELEMENT,
        null,
        false
      );
      let node;
      while (node = walker.nextNode()) {
        if (node.nodeType === Node.TEXT_NODE) {
          this._handleTextNode(node, toTranslated);
        } else if (node.nodeType === Node.ELEMENT_NODE) {
          this._handleElementNode(node, toTranslated);
        }
      }
    }

    _handleTextNode(node, toTranslated) {
      const text = Utils.normalizeText(node.nodeValue);
      if (!text) return;

      const parent = node.parentNode;
      const isOverlayTarget = parent && parent.classList.contains('ItemProgression_ItemLabel');

      if (toTranslated) {
        const translated = this.dataManager.getTranslation(text);
        if (!translated) return;

        if (isOverlayTarget) {
          if (!parent.classList.contains(CONFIG.SELECTORS.OVERLAY_CLASS)) {
            const originalColor = window.getComputedStyle(parent).color;
            parent.classList.add(CONFIG.SELECTORS.OVERLAY_CLASS);
            parent.dataset.translation = translated;
            parent.style.setProperty('--original-text-color', originalColor);
          }
        } else {
          node.nodeValue = translated;
        }
      } else {
        if (isOverlayTarget) {
          parent.classList.remove(CONFIG.SELECTORS.OVERLAY_CLASS);
          delete parent.dataset.translation;
          parent.style.removeProperty('--original-text-color');
        } else {
          const original = this.dataManager.getOriginal(text);
          if (original) node.nodeValue = original;
        }
      }
    }

    _handleElementNode(node, toTranslated) {
      // 预留：按元素类型定制处理
    }

    _startObserver() {
      if (this.observer) return;
      this.observer = new MutationObserver((mutations) => {
        mutations.forEach((mutation) => {
          mutation.addedNodes.forEach((node) => {
            if (node.nodeType === Node.ELEMENT_NODE) {
              this.processRoot(node, true);
            } else if (node.nodeType === Node.TEXT_NODE) {
              this._handleTextNode(node, true);
            }
          });
        });
      });
      this.observer.observe(document.body, { childList: true, subtree: true });
    }

    _stopObserver() {
      if (this.observer) {
        this.observer.disconnect();
        this.observer = null;
      }
    }

    collectUntranslated() {
      const textsSet = new Set();
      const walker = document.createTreeWalker(
        document.body,
        NodeFilter.SHOW_TEXT,
        null,
        false
      );
      let node;
      while (node = walker.nextNode()) {
        const text = Utils.normalizeText(node.nodeValue);
        if (
          text &&
          !this.dataManager.getTranslation(text) &&
          !/[\u4e00-\u9fa5]/.test(text) &&
          !/^\d+$/.test(text)
        ) {
          const parent = node.parentNode;
          if (parent && parent.classList.contains(CONFIG.SELECTORS.OVERLAY_CLASS)) continue;
          textsSet.add(text);
        }
      }
      return Array.from(textsSet).map((txt) => [txt, ""]);
    }
  }

  class TranslationWidget extends HTMLElement {
    constructor() {
      super();
      this.attachShadow({ mode: 'open' });
      this.state = {
        enabled: true,
        searchResults: [],
        isSearching: false
      };
    }

    connectedCallback() {
      this.render();
      this.setupEvents();
    }

    set onToggle(callback) { this._onToggle = callback; }
    set onSearch(callback) { this._onSearch = callback; }

    updateSearchResults(results) {
      this.state.searchResults = results;
      this.renderResults();
    }

    render() {
      this.shadowRoot.innerHTML = `
        <style>
          :host {
            position: fixed;
            bottom: 20px;
            right: 20px;
            z-index: 99999;
            font-family: 'Segoe UI', sans-serif;
            --primary-color: #4CAF50;
            --bg-color: rgba(33, 33, 33, 0.95);
            --text-color: #eee;
          }
          .container { display: flex; flex-direction: column; align-items: flex-end; gap: 10px; }
          .controls {
            display: flex; gap: 10px; background: var(--bg-color);
            padding: 10px; border-radius: 8px;
            box-shadow: 0 4px 15px rgba(0,0,0,0.3);
            backdrop-filter: blur(5px);
            border: 1px solid rgba(255,255,255,0.1);
          }
          .tooltip-container { position: relative; }
          .tooltip-container:hover::after {
            content: attr(data-tooltip);
            position: absolute; bottom: 120%; left: 50%;
            transform: translateX(-50%);
            background: #222; color: #fff; padding: 5px 10px;
            border-radius: 4px; font-size: 12px; white-space: nowrap;
            pointer-events: none; opacity: 1;
            border: 1px solid #555;
            box-shadow: 0 2px 5px rgba(0,0,0,0.5);
            z-index: 10000;
          }
          button {
            background: var(--primary-color); color: white; border: none;
            padding: 8px 16px; border-radius: 4px; cursor: pointer;
            transition: all 0.3s ease; font-weight: 600;
            display: flex; align-items: center; justify-content: center;
          }
          button:hover { background: #45a049; transform: translateY(-1px); }
          button.inactive { background: #757575; }
          .search-box { position: relative; display: flex; align-items: center; }
          input {
            background: #424242; border: 1px solid #616161; color: white;
            padding: 8px; border-radius: 4px; outline: none; width: 150px;
            transition: width 0.3s;
          }
          input:focus { width: 200px; border-color: var(--primary-color); }
          .results-popover {
            position: absolute; bottom: 100%; right: 0; width: 300px;
            background: #333; border: 1px solid #555; border-radius: 4px;
            margin-bottom: 5px; max-height: 400px; overflow-y: auto;
            display: none; box-shadow: 0 5px 15px rgba(0,0,0,0.5);
          }
          .results-popover.visible { display: block; }
          .result-item {
            padding: 8px 12px; border-bottom: 1px solid #444; color: #eee;
            display: flex; justify-content: space-between; align-items: center;
          }
          .result-item:last-child { border-bottom: none; }
          .result-item:hover { background: #444; }
          .result-content { flex: 1; margin-right: 10px; }
          .result-original { font-size: 0.9em; color: #aaa; word-break: break-all; }
          .result-translated { font-size: 1em; color: var(--primary-color); font-weight: bold; }
          .copy-btn { background: #555; padding: 4px 8px; font-size: 12px; min-width: 50px; }
          .copy-btn:hover { background: #777; }
          .copy-btn:active { background: var(--primary-color); }
        </style>
        <div class="container">
          <div class="results-popover" id="results"></div>
          <div class="controls">
            <div class="search-box tooltip-container" data-tooltip="输入文字搜索，仅显示 13 字以内的翻译结果">
              <input type="text" id="searchInput" placeholder="搜索 / Search...">
            </div>
            <div class="tooltip-container" data-tooltip="点击切换 英文 / 中文 显示模式">
              <button id="toggleBtn">中/En</button>
            </div>
          </div>
        </div>
      `;
    }

    setupEvents() {
      const toggleBtn = this.shadowRoot.getElementById('toggleBtn');
      const searchInput = this.shadowRoot.getElementById('searchInput');
      const resultsContainer = this.shadowRoot.getElementById('results');

      toggleBtn.addEventListener('click', () => {
        this.state.enabled = !this.state.enabled;
        toggleBtn.classList.toggle('inactive', !this.state.enabled);
        if (this._onToggle) this._onToggle(this.state.enabled);
      });

      const debouncedSearch = Utils.debounce((query) => {
        if (this._onSearch) this._onSearch(query);
      }, CONFIG.PERFORMANCE.SEARCH_DEBOUNCE);

      searchInput.addEventListener('input', (e) => {
        const query = e.target.value.trim();
        if (query.length > 0) debouncedSearch(query);
        else resultsContainer.classList.remove('visible');
      });

      searchInput.addEventListener('keydown', (e) => { e.stopPropagation(); });

      document.addEventListener('click', (e) => {
        if (e.target !== this) resultsContainer.classList.remove('visible');
      });

      resultsContainer.addEventListener('click', (e) => {
        if (e.target.classList.contains('copy-btn')) {
          const text = e.target.dataset.text;
          navigator.clipboard.writeText(text).then(() => {
            const originalText = e.target.innerText;
            e.target.innerText = '已复制';
            e.target.style.background = '#4CAF50';
            setTimeout(() => {
              e.target.innerText = originalText;
              e.target.style.background = '';
            }, 1000);
          });
        }
      });
    }

    renderResults() {
      const container = this.shadowRoot.getElementById('results');
      if (!this.state.searchResults.length) {
        container.classList.remove('visible');
        return;
      }
      container.innerHTML = this.state.searchResults.map(item => `
        <div class="result-item">
          <div class="result-content">
            <div class="result-translated">${item.translated}</div>
            <div class="result-original">${item.original}</div>
          </div>
          <button class="copy-btn" data-text="${item.original.replace(/"/g, '&quot;')}">复制</button>
        </div>
      `).join('');
      container.classList.add('visible');
    }
  }

  customElements.define('translation-widget', TranslationWidget);

  class App {
    constructor() {
      this.dataManager = new DataManager();
      this.domHandler = new DOMHandler(this.dataManager);
      this.worker = Utils.createWorker(WORKER_CODE);
      this.widget = null;
    }

    async init() {
      this._injectGlobalStyles();

      const entries = await this.dataManager.init();

      this.worker.postMessage({ type: 'INIT', payload: entries });
      this.worker.onmessage = (e) => this._handleWorkerMessage(e);

      this.widget = document.createElement('translation-widget');
      document.body.appendChild(this.widget);

      this.widget.onToggle = (enabled) => {
        if (enabled) this.domHandler.enable();
        else this.domHandler.disable();
      };

      this.widget.onSearch = (query) => {
        this.worker.postMessage({ type: 'SEARCH', payload: query });
      };

      this.domHandler.enable();
      this._handleWelcomeModal();
      this._setupKeyboardShortcuts();

      console.log('[Filterblade 简体汉化] 已就绪');
    }

    _setupKeyboardShortcuts() {
      document.addEventListener("keydown", (e) => {
        if (e.key === "F8" && e.ctrlKey) {
          e.preventDefault();
          const untranslated = this.domHandler.collectUntranslated();
          if (untranslated.length === 0) {
            alert("没有发现未翻译文字。");
            return;
          }
          const jsonStr = JSON.stringify(untranslated, null, 2);
          Utils.downloadJson("untranslated_text.json", jsonStr);
        }
      });
    }

    _handleWorkerMessage(e) {
      const { type, payload } = e.data;
      if (type === 'SEARCH_RESULT') {
        this.widget.updateSearchResults(payload);
      }
    }

    _injectGlobalStyles() {
      const style = document.createElement('style');
      style.textContent = `
        .translation-overlay-parent {
          position: relative;
          color: transparent !important;
        }
        .translation-overlay-parent::after {
          content: attr(data-translation);
          position: absolute;
          top: 0;
          left: 0;
          width: 100%;
          height: 100%;
          color: var(--original-text-color, black);
          pointer-events: none;
          white-space: pre;
          overflow: hidden;
        }
      `;
      document.head.appendChild(style);
    }

    _handleWelcomeModal() {
      const modalId = 'welcome-modal-sab';
      const checkboxId = 'do-not-show-again-sab';
      const storageKey = 'sab_hide_welcome_modal_until';

      const hideUntil = localStorage.getItem(storageKey);
      if (hideUntil && Date.now() < parseInt(hideUntil)) return;

      const overlay = document.createElement('div');
      overlay.id = modalId;
      overlay.style.cssText = `
          position: fixed; top: 0; left: 0; width: 100%; height: 100%;
          background-color: rgba(0, 0, 0, 0.7); display: flex;
          justify-content: center; align-items: center; z-index: 100000;
        `;

      const modalContent = document.createElement('div');
      modalContent.style.cssText = `
          background-color: #333; color: #eee; padding: 25px; border-radius: 10px;
          box-shadow: 0 5px 15px rgba(0, 0, 0, 0.3); max-width: 450px; width: 90%;
          text-align: left; font-family: 'Segoe UI', sans-serif; line-height: 1.6;
          border: 1px solid #555; position: relative;
        `;

      modalContent.innerHTML = `
            <h3 style="color: #4CAF50; margin-top: 0; border-bottom: 1px solid #555; padding-bottom: 10px; font-size: 1.4em;">欢迎使用简体汉化脚本</h3>
            <p style="margin-bottom: 15px;"><strong>如果进入时载入太久，直接刷新网页即可。</strong></p>
            <p style="margin-bottom: 15px;">原繁体版由 Sab 制作并维护，感谢雕像协助；本简体版在其基础上完成简体化，游戏专有名词以 poe2db.tw 简中站为准。</p>
            <p style="margin-bottom: 15px;">词条托管于 GitHub：Vithur/mihomo → filterblade/</p>
            <p style="margin-bottom: 15px;">遇到漏译或错译，用 Ctrl+F8 导出未翻译清单即可反馈。</p>
            <p style="margin-bottom: 20px;">快捷键：Ctrl+F8 导出未翻译 · Ctrl+F9 重置弹窗设置</p>
            <div style="display: flex; justify-content: space-between; align-items: center; border-top: 1px solid #555; padding-top: 15px;">
                <label for="${checkboxId}" style="cursor: pointer; display: flex; align-items: center;">
                  <input type="checkbox" id="${checkboxId}" style="margin-right: 8px; transform: scale(1.2);">
                  一天内不再显示
                </label>
                <button id="confirm-button-sab" style="
                  background-color: #4CAF50; color: white; padding: 10px 20px;
                  border: none; border-radius: 5px; cursor: pointer; font-size: 1em;
                ">确认</button>
            </div>
        `;

      overlay.appendChild(modalContent);
      document.body.appendChild(overlay);

      document.getElementById('confirm-button-sab').addEventListener('click', () => {
        if (document.getElementById(checkboxId).checked) {
          localStorage.setItem(storageKey, (Date.now() + 86400000).toString());
        }
        overlay.remove();
      });

      document.addEventListener('keydown', function (event) {
        if (event.ctrlKey && event.key === 'F9') {
          localStorage.removeItem(storageKey);
          const toast = document.createElement('div');
          toast.textContent = '已清除「一天内不再显示」的设置';
          toast.style.cssText = `
                    position: fixed; top: 20px; right: 20px; background: #4CAF50; color: white;
                    padding: 15px; border-radius: 5px; z-index: 100001;
                `;
          document.body.appendChild(toast);
          setTimeout(() => toast.remove(), 3000);
        }
      });
    }
  }

  window.addEventListener('load', () => {
    new App().init();
  });

})();
