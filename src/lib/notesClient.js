import {
  NOTE_COLORS,
  STORAGE_KEY,
  createNoteRecord,
  getNotesForLetter,
  parseStoredNotes,
  removeNote,
  serializeNotes,
  upsertNote,
} from "./letterNotes.js";
import {
  AI_SETTINGS_KEY,
  hasAiKey,
  parseAiSettings,
  requestAiExplanation,
  serializeAiSettings,
} from "./aiExplain.js";

const COLOR_LABELS = {
  amber: "Amber",
  mint: "Mint",
  sky: "Sky",
  plum: "Plum",
  rose: "Rose",
};

function loadAllNotes() {
  return parseStoredNotes(window.localStorage.getItem(STORAGE_KEY));
}

function saveAllNotes(notes) {
  window.localStorage.setItem(STORAGE_KEY, serializeNotes(notes));
}

function loadAiSettings() {
  return parseAiSettings(window.localStorage.getItem(AI_SETTINGS_KEY));
}

function saveAiSettings(settings) {
  window.localStorage.setItem(AI_SETTINGS_KEY, serializeAiSettings(settings));
}

function getSelectionBoundaryOffset(container, node, nodeOffset) {
  if (!node) {
    return -1;
  }

  if (node.nodeType === Node.ELEMENT_NODE) {
    const childNode = node.childNodes[nodeOffset];
    if (childNode) {
      return getSelectionBoundaryOffset(container, childNode, 0);
    }

    return getSelectionBoundaryOffset(container, node.lastChild, node.lastChild?.textContent?.length ?? 0);
  }

  const walker = document.createTreeWalker(container, NodeFilter.SHOW_TEXT);
  let currentNode;
  let total = 0;

  while ((currentNode = walker.nextNode())) {
    if (currentNode === node) {
      return total + nodeOffset;
    }

    total += currentNode.textContent.length;
  }

  return -1;
}

function getSelectionContext() {
  const selection = window.getSelection();

  if (!selection || selection.rangeCount === 0 || selection.isCollapsed) {
    return null;
  }

  const range = selection.getRangeAt(0);
  const startScope = range.startContainer.parentElement?.closest("[data-note-scope]");
  const endScope = range.endContainer.parentElement?.closest("[data-note-scope]");

  if (!startScope || startScope !== endScope) {
    return null;
  }

  const content = startScope.querySelector("[data-note-content]");
  if (!content) {
    return null;
  }

  const startOffset = getSelectionBoundaryOffset(content, range.startContainer, range.startOffset);
  const endOffset = getSelectionBoundaryOffset(content, range.endContainer, range.endOffset);
  const selectedText = selection.toString().replace(/\s+/g, " ").trim();

  if (startOffset < 0 || endOffset <= startOffset || !selectedText) {
    return null;
  }

  return {
    range,
    blockId: startScope.dataset.blockId,
    language: startScope.dataset.language,
    selectedText,
    startOffset,
    endOffset,
  };
}

function buildHighlightMap(notes) {
  const map = new Map();

  for (const note of notes) {
    const key = `${note.blockId}:${note.language}`;
    const items = map.get(key) ?? [];
    items.push(note);
    map.set(key, items);
  }

  for (const items of map.values()) {
    items.sort((left, right) => left.startOffset - right.startOffset);
  }

  return map;
}

function sliceTextNode(node, start, end, color) {
  const range = document.createRange();
  range.setStart(node, start);
  range.setEnd(node, end);

  const mark = document.createElement("mark");
  mark.className = `note-highlight note-highlight--${color}`;
  range.surroundContents(mark);
}

function applyHighlightToContent(content, highlights) {
  const walker = document.createTreeWalker(content, NodeFilter.SHOW_TEXT);
  let currentNode;
  let total = 0;
  let noteIndex = 0;

  while ((currentNode = walker.nextNode()) && noteIndex < highlights.length) {
    const nodeLength = currentNode.textContent.length;
    const nodeStart = total;
    const nodeEnd = total + nodeLength;

    while (noteIndex < highlights.length && highlights[noteIndex].endOffset <= nodeStart) {
      noteIndex += 1;
    }

    if (noteIndex >= highlights.length) {
      break;
    }

    const note = highlights[noteIndex];
    if (note.startOffset < nodeEnd && note.endOffset > nodeStart) {
      const start = Math.max(0, note.startOffset - nodeStart);
      const end = Math.min(nodeLength, note.endOffset - nodeStart);
      sliceTextNode(currentNode, start, end, note.color);
    }

    total = nodeEnd;
  }
}

function renderHighlights(letterSlug) {
  const notes = getNotesForLetter(loadAllNotes(), letterSlug);
  const highlightMap = buildHighlightMap(notes);

  document.querySelectorAll("[data-note-content]").forEach((content) => {
    if (!content.dataset.originalHtml) {
      content.dataset.originalHtml = content.innerHTML;
    }

    content.innerHTML = content.dataset.originalHtml;

    const scope = content.closest("[data-note-scope]");
    const key = `${scope?.dataset.blockId}:${scope?.dataset.language}`;
    const highlights = highlightMap.get(key) ?? [];

    if (highlights.length > 0) {
      applyHighlightToContent(content, highlights);
    }
  });
}

function formatLabel(note) {
  return `${note.blockId.toUpperCase()} · ${note.language === "en" ? "English" : "中文"}`;
}

function renderNotesPanel(letterSlug) {
  const notes = getNotesForLetter(loadAllNotes(), letterSlug);
  const countNode = document.querySelector("[data-notes-count]");
  const listNode = document.querySelector("[data-notes-list]");
  const emptyNode = document.querySelector("[data-notes-empty]");

  if (!countNode || !listNode || !emptyNode) {
    return;
  }

  countNode.textContent = String(notes.length);
  listNode.innerHTML = "";
  emptyNode.hidden = notes.length > 0;

  for (const note of notes) {
    const item = document.createElement("article");
    item.className = "notes-item";

    const meta = document.createElement("div");
    meta.className = "notes-item__meta";

    const swatch = document.createElement("span");
    swatch.className = `notes-item__swatch notes-item__swatch--${note.color}`;
    swatch.setAttribute("aria-hidden", "true");

    const metaText = document.createElement("span");
    metaText.textContent = formatLabel(note);

    meta.append(swatch, metaText);

    const quote = document.createElement("blockquote");
    quote.className = "notes-item__quote";
    quote.textContent = note.selectedText;

    const body = document.createElement("p");
    body.className = "notes-item__body";
    body.textContent = note.note || "仅高亮，未添加笔记。";

    const actions = document.createElement("div");
    actions.className = "notes-item__actions";

    const jumpButton = document.createElement("button");
    jumpButton.type = "button";
    jumpButton.className = "notes-item__button";
    jumpButton.textContent = "定位";
    jumpButton.addEventListener("click", () => {
      const target = document.querySelector(
        `[data-note-scope][data-block-id="${note.blockId}"][data-language="${note.language}"]`,
      );

      target?.scrollIntoView({ behavior: "smooth", block: "center" });
    });

    const deleteButton = document.createElement("button");
    deleteButton.type = "button";
    deleteButton.className = "notes-item__button notes-item__button--danger";
    deleteButton.textContent = "删除";
    deleteButton.addEventListener("click", () => {
      saveAllNotes(removeNote(loadAllNotes(), note.id));
      renderHighlights(letterSlug);
      renderNotesPanel(letterSlug);
    });

    actions.append(jumpButton, deleteButton);
    item.append(meta, quote, body, actions);
    listNode.append(item);
  }
}

function createSelectionMenu() {
  const menu = document.createElement("div");
  menu.className = "selection-menu";
  menu.hidden = true;
  menu.innerHTML = `
    <div class="selection-menu__actions" data-selection-actions>
      <button type="button" class="selection-menu__icon-button" data-selection-edit aria-label="高亮和笔记">
        <svg viewBox="0 0 24 24" aria-hidden="true">
          <path d="M12 20h9" />
          <path d="M16.5 3.5a2.1 2.1 0 0 1 3 3L7 19l-4 1 1-4Z" />
        </svg>
      </button>
      <button type="button" class="selection-menu__icon-button" data-selection-ai aria-label="AI 解释">
        <svg viewBox="0 0 24 24" aria-hidden="true">
          <path d="M12 3l1.7 5.2L19 10l-5.3 1.8L12 17l-1.7-5.2L5 10l5.3-1.8Z" />
          <path d="M19 15l.8 2.2L22 18l-2.2.8L19 21l-.8-2.2L16 18l2.2-.8Z" />
        </svg>
      </button>
    </div>
    <div class="selection-editor" data-selection-editor hidden>
      <div class="selection-editor__colors" data-selection-colors></div>
      <div class="selection-editor__form">
        <input
          type="text"
          class="selection-editor__input"
          data-selection-note
          maxlength="200"
          placeholder="记一点自己的想法"
        />
        <button type="button" class="selection-editor__save" data-selection-save>保存</button>
      </div>
    </div>
  `;

  const colorsNode = menu.querySelector("[data-selection-colors]");
  for (const color of NOTE_COLORS) {
    const button = document.createElement("button");
    button.type = "button";
    button.className = `selection-editor__color selection-editor__color--${color}`;
    button.dataset.selectionColor = color;
    button.setAttribute("aria-label", COLOR_LABELS[color]);
    colorsNode?.append(button);
  }

  document.body.append(menu);
  return menu;
}

function createAiModals() {
  const root = document.createElement("div");
  root.innerHTML = `
    <div class="ai-modal" data-ai-settings-modal hidden>
      <div class="ai-modal__scrim" data-ai-close></div>
      <section class="ai-dialog ai-dialog--settings" role="dialog" aria-modal="true" aria-labelledby="ai-settings-title">
        <header class="ai-dialog__header">
          <h2 id="ai-settings-title">模型设置</h2>
          <button type="button" class="ai-dialog__close" data-ai-close aria-label="关闭">×</button>
        </header>
        <div class="ai-dialog__body">
          <div class="ai-provider-choice" role="radiogroup" aria-label="默认模型">
            <label><input type="radio" name="ai-provider" value="deepseek" data-ai-provider /> DeepSeek</label>
            <label><input type="radio" name="ai-provider" value="openai" data-ai-provider /> OpenAI</label>
          </div>
          <label class="ai-key-row">
            <span>DeepSeek</span>
            <input type="password" data-ai-deepseek-key placeholder="sk-xxxxxxxxxxxxxxxxxxxxxxxx" autocomplete="off" />
            <a href="https://platform.deepseek.com/api_keys" target="_blank" rel="noreferrer">获取 Key</a>
          </label>
          <label class="ai-key-row">
            <span>OpenAI</span>
            <input type="password" data-ai-openai-key placeholder="sk-proj-xxxxxxxxxxxxxxxxxxxx" autocomplete="off" />
            <a href="https://platform.openai.com/api-keys" target="_blank" rel="noreferrer">获取 Key</a>
          </label>
          <p class="ai-dialog__message" data-ai-settings-message></p>
          <button type="button" class="ai-dialog__primary" data-ai-settings-save>保存设置</button>
        </div>
      </section>
    </div>

    <div class="ai-modal" data-ai-explain-modal hidden>
      <div class="ai-modal__scrim" data-ai-close></div>
      <section class="ai-dialog ai-dialog--explain" role="dialog" aria-modal="true" aria-labelledby="ai-explain-title">
        <header class="ai-dialog__header">
          <h2 id="ai-explain-title">AI 解释</h2>
          <button type="button" class="ai-dialog__close" data-ai-close aria-label="关闭">×</button>
        </header>
        <div class="ai-dialog__body">
          <label class="ai-field">
            <span>原文</span>
            <textarea data-ai-source rows="4"></textarea>
          </label>
          <label class="ai-field">
            <span>问题</span>
            <input type="text" data-ai-question value="解释一下" />
          </label>
          <div class="ai-dialog__actions">
            <button type="button" class="ai-dialog__secondary" data-ai-settings-open>模型设置</button>
            <button type="button" class="ai-dialog__primary" data-ai-send>发送</button>
          </div>
          <div class="ai-result" data-ai-result hidden></div>
        </div>
      </section>
    </div>
  `;

  document.body.append(...root.children);

  return {
    settingsModal: document.querySelector("[data-ai-settings-modal]"),
    explainModal: document.querySelector("[data-ai-explain-modal]"),
  };
}

export function ensureSingleSelectionMenu(menus) {
  const activeMenu = menus[menus.length - 1] ?? null;

  menus.slice(0, -1).forEach((menu) => menu.remove());
  return activeMenu;
}

function clampHorizontal(left, menuWidth) {
  const min = window.scrollX + 12;
  const max = window.scrollX + window.innerWidth - menuWidth - 12;
  return Math.max(min, Math.min(left, max));
}

function positionMenu(menu, range) {
  const rect = range.getBoundingClientRect();
  const menuRect = menu.getBoundingClientRect();
  const left = clampHorizontal(window.scrollX + rect.left, menuRect.width || 220);
  const top = window.scrollY + rect.top - menuRect.height - 12;

  menu.style.left = `${left}px`;
  menu.style.top = `${Math.max(window.scrollY + 12, top)}px`;
}

function setActiveColor(menu, color) {
  menu.dataset.color = color;
  menu.querySelectorAll("[data-selection-color]").forEach((button) => {
    const isActive = button.dataset.selectionColor === color;
    button.classList.toggle("is-active", isActive);
    button.setAttribute("aria-pressed", String(isActive));
  });
}

function setMenuMode(menu, mode) {
  const actions = menu.querySelector("[data-selection-actions]");
  const editor = menu.querySelector("[data-selection-editor]");

  menu.dataset.mode = mode;
  actions.hidden = mode !== "trigger";
  editor.hidden = mode !== "editor";
}

function hideSelectionMenu(menu, state) {
  menu.hidden = true;
  setMenuMode(menu, "trigger");
  state.selectionContext = null;
  state.noteInput.value = "";
  state.noteColor = "amber";
  setActiveColor(menu, state.noteColor);
}

function showSelectionTrigger(menu, state, selectionContext) {
  state.selectionContext = selectionContext;
  menu.hidden = false;
  state.noteInput.value = "";
  state.noteColor = "amber";
  setActiveColor(menu, state.noteColor);
  setMenuMode(menu, "trigger");
  positionMenu(menu, selectionContext.range);
}

function showSelectionEditor(menu, state) {
  if (!state.selectionContext) {
    return;
  }

  menu.hidden = false;
  setMenuMode(menu, "editor");
  positionMenu(menu, state.selectionContext.range);
}

function createDraft(page, state) {
  if (!state.selectionContext || !page.dataset.letterSlug) {
    return null;
  }

  return createNoteRecord({
    letterSlug: page.dataset.letterSlug,
    blockId: state.selectionContext.blockId,
    language: state.selectionContext.language,
    selectedText: state.selectionContext.selectedText,
    note: state.noteInput.value,
    color: state.noteColor,
    startOffset: state.selectionContext.startOffset,
    endOffset: state.selectionContext.endOffset,
  });
}

export function shouldRefreshSelectionTrigger({ menu, mode, target }) {
  if (mode === "editor") {
    return false;
  }

  if (menu?.contains(target)) {
    return false;
  }

  return true;
}

export function setupLetterNotes() {
  const page = document.querySelector("[data-letter-page]");

  if (!page || page.dataset.notesInitialized === "true") {
    return;
  }

  page.dataset.notesInitialized = "true";

  const letterSlug = page.dataset.letterSlug;
  const drawer = document.querySelector("[data-notes-drawer]");
  const drawerToggle = document.querySelector("[data-notes-drawer-toggle]");
  const drawerClose = document.querySelector("[data-notes-drawer-close]");
  const drawerScrim = document.querySelector("[data-notes-drawer-scrim]");
  const menu = ensureSingleSelectionMenu([
    ...document.querySelectorAll(".selection-menu"),
    createSelectionMenu(),
  ]);
  const aiModals = createAiModals();
  const state = {
    selectionContext: null,
    noteColor: "amber",
    noteInput: menu.querySelector("[data-selection-note]"),
    pendingAiText: "",
    openExplainAfterSettings: false,
  };

  renderHighlights(letterSlug);
  renderNotesPanel(letterSlug);
  setActiveColor(menu, state.noteColor);

  function toggleNotesDrawer(open) {
    if (!drawer) {
      return;
    }

    drawer.setAttribute("aria-hidden", String(!open));
    drawerToggle?.setAttribute("aria-expanded", String(open));
    document.documentElement.classList.toggle("has-notes-drawer", open);

    if (open) {
      drawer.hidden = false;
      if (drawerScrim) {
        drawerScrim.hidden = false;
      }

      window.requestAnimationFrame(() => {
        drawer.classList.add("is-open");
        drawerScrim?.classList.add("is-open");
      });
      return;
    }

    drawer.classList.remove("is-open");
    drawerScrim?.classList.remove("is-open");
    window.setTimeout(() => {
      if (!drawer.classList.contains("is-open")) {
        drawer.hidden = true;
        if (drawerScrim) {
          drawerScrim.hidden = true;
        }
      }
    }, 220);
  }

  drawerToggle?.addEventListener("click", () => {
    toggleNotesDrawer(!drawer?.classList.contains("is-open"));
  });

  drawerClose?.addEventListener("click", () => toggleNotesDrawer(false));
  drawerScrim?.addEventListener("click", () => toggleNotesDrawer(false));

  document.addEventListener("selectionchange", () => {
    if (menu.dataset.mode === "editor") {
      return;
    }

    const selection = window.getSelection();
    if (!selection || selection.isCollapsed) {
      hideSelectionMenu(menu, state);
    }
  });

  function closeAiModal(modal) {
    if (modal) {
      modal.hidden = true;
    }
  }

  function openAiSettingsModal({ afterSave = false } = {}) {
    const settings = loadAiSettings();
    state.openExplainAfterSettings = afterSave;

    aiModals.settingsModal.querySelectorAll("[data-ai-provider]").forEach((input) => {
      input.checked = input.value === settings.provider;
    });
    aiModals.settingsModal.querySelector("[data-ai-deepseek-key]").value = settings.deepseekKey;
    aiModals.settingsModal.querySelector("[data-ai-openai-key]").value = settings.openaiKey;
    aiModals.settingsModal.querySelector("[data-ai-settings-message]").textContent = "";
    aiModals.settingsModal.hidden = false;
  }

  function openAiExplainModal(sourceText = "") {
    const result = aiModals.explainModal.querySelector("[data-ai-result]");

    aiModals.explainModal.querySelector("[data-ai-source]").value = sourceText;
    aiModals.explainModal.querySelector("[data-ai-question]").value = "解释一下";
    result.hidden = true;
    result.textContent = "";
    aiModals.explainModal.hidden = false;
  }

  function refreshSelectionTrigger(eventTarget = null) {
    if (!shouldRefreshSelectionTrigger({ menu, mode: menu.dataset.mode, target: eventTarget })) {
      return;
    }

    const context = getSelectionContext();

    if (!context) {
      hideSelectionMenu(menu, state);
      return;
    }

    showSelectionTrigger(menu, state, context);
  }

  document.addEventListener("mouseup", (event) => {
    window.setTimeout(() => refreshSelectionTrigger(event.target), 0);
  });

  document.addEventListener("keyup", (event) => {
    if (event.key.startsWith("Arrow") || event.key === "Shift") {
      window.setTimeout(() => refreshSelectionTrigger(event.target), 0);
    }
  });

  menu.addEventListener("click", (event) => {
    const colorButton = event.target.closest("[data-selection-color]");
    if (colorButton) {
      state.noteColor = colorButton.dataset.selectionColor;
      setActiveColor(menu, state.noteColor);
      return;
    }

    if (event.target.closest("[data-selection-edit]")) {
      showSelectionEditor(menu, state);
      return;
    }

    if (event.target.closest("[data-selection-ai]")) {
      if (!state.selectionContext) {
        hideSelectionMenu(menu, state);
        return;
      }

      state.pendingAiText = state.selectionContext.selectedText;
      menu.hidden = true;

      if (hasAiKey(loadAiSettings())) {
        openAiExplainModal(state.pendingAiText);
      } else {
        openAiSettingsModal({ afterSave: true });
      }
      return;
    }

    if (event.target.closest("[data-selection-save]")) {
      const draft = createDraft(page, state);
      if (!draft) {
        hideSelectionMenu(menu, state);
        return;
      }

      saveAllNotes(upsertNote(loadAllNotes(), draft));
      window.getSelection()?.removeAllRanges();
      hideSelectionMenu(menu, state);
      renderHighlights(letterSlug);
      renderNotesPanel(letterSlug);
    }
  });

  document.addEventListener("click", async (event) => {
    if (event.target.closest("[data-ai-close]")) {
      closeAiModal(event.target.closest("[data-ai-settings-modal], [data-ai-explain-modal]"));
      return;
    }

    if (event.target.closest("[data-ai-settings-open]")) {
      state.pendingAiText = aiModals.explainModal.querySelector("[data-ai-source]").value;
      closeAiModal(aiModals.explainModal);
      openAiSettingsModal({ afterSave: true });
      return;
    }

    if (event.target.closest("[data-ai-settings-save]")) {
      const provider =
        aiModals.settingsModal.querySelector("[data-ai-provider]:checked")?.value ?? "deepseek";
      const settings = {
        provider,
        deepseekKey: aiModals.settingsModal.querySelector("[data-ai-deepseek-key]").value,
        openaiKey: aiModals.settingsModal.querySelector("[data-ai-openai-key]").value,
      };
      const normalizedSettings = parseAiSettings(serializeAiSettings(settings));
      const message = aiModals.settingsModal.querySelector("[data-ai-settings-message]");

      saveAiSettings(normalizedSettings);
      if (!hasAiKey(normalizedSettings)) {
        message.textContent = "请至少填写一个 AI Key。";
        return;
      }

      closeAiModal(aiModals.settingsModal);
      if (state.openExplainAfterSettings) {
        openAiExplainModal(state.pendingAiText);
      }
      return;
    }

    if (event.target.closest("[data-ai-send]")) {
      const result = aiModals.explainModal.querySelector("[data-ai-result]");
      const sendButton = aiModals.explainModal.querySelector("[data-ai-send]");
      const sourceText = aiModals.explainModal.querySelector("[data-ai-source]").value;
      const question = aiModals.explainModal.querySelector("[data-ai-question]").value;

      result.hidden = false;
      result.textContent = "正在解释...";
      sendButton.disabled = true;

      try {
        result.textContent = await requestAiExplanation({
          settings: loadAiSettings(),
          sourceText,
          question,
        });
      } catch (error) {
        result.textContent = error.message || "AI 解释失败，请检查 Key 或网络。";
      } finally {
        sendButton.disabled = false;
      }
    }
  });

  document.addEventListener("pointerdown", (event) => {
    if (!menu.hidden && !menu.contains(event.target)) {
      hideSelectionMenu(menu, state);
    }
  });

  document.addEventListener("keydown", (event) => {
    if (event.key === "Escape" && drawer && !drawer.hidden) {
      toggleNotesDrawer(false);
      drawerToggle?.focus();
    }
  });

  window.addEventListener("scroll", () => {
    if (!menu.hidden && state.selectionContext) {
      positionMenu(menu, state.selectionContext.range);
    }
  });

  window.addEventListener("resize", () => {
    if (!menu.hidden && state.selectionContext) {
      positionMenu(menu, state.selectionContext.range);
    }
  });
}
