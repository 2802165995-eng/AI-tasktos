import { adaptPromptTemplate, buildPromptPackageText, modelAdapters } from "./promptAdapters.js";
import { buildPromptHistoryItems, removePromptById } from "./promptHistory.js";
import { exportTasteProfileMarkdown } from "./profileExport.js";
import { analyzeReferenceViaApi } from "./apiClient.js";
import { buildLibraryViewModel } from "./libraryViewModel.js";
import { generateAnalysis, generatePromptTemplate, generateTasteProfile } from "./tasteEngine.js";
import { deleteReferenceFromState } from "./referenceState.js";
import { copyTextToClipboard } from "./clipboard.js";
import {
  cancelAnalysisTask,
  createAnalysisTask,
  isCurrentAnalysisTask,
  recoverAnalysisState
} from "./analysisTask.js";
import { findClipboardImageFile, readImageFileAsDataUrl, validateImageFile } from "./imageInput.js";

const STORAGE_KEY = "tasteos:mvp-state-v4";

const categories = {
  event_poster: "活动海报",
  social_cover: "社媒封面",
  portfolio_cover: "项目封面"
};

const scenarios = ["校园活动海报", "音乐 / 展览海报", "社媒封面", "作品集项目封面", "品牌活动视觉"];

const feedbackOptions = [
  ["too_cluttered", "太杂乱"],
  ["text_unreadable", "文字不可读"],
  ["wrong_mood", "情绪不对"],
  ["color_mismatch", "色彩不符合"],
  ["layout_mismatch", "构图不符合"],
  ["good_direction", "方向正确"]
];

const seedReferences = [
  ["ref-campus-ai", "校园 AI 分享海报", "event_poster", "喜欢清晰标题和冷静科技感。", "https://images.unsplash.com/photo-1516321318423-f06f85e504b3?auto=format&fit=crop&w=900&q=80"],
  ["ref-editorial", "极简编辑封面", "portfolio_cover", "喜欢留白、网格和克制的高级感。", "https://images.unsplash.com/photo-1497366754035-f200968a6e72?auto=format&fit=crop&w=900&q=80"],
  ["ref-social", "强对比社媒封面", "social_cover", "喜欢强对比和一眼能看到主题。", "https://images.unsplash.com/photo-1500530855697-b586d89ba3ee?auto=format&fit=crop&w=900&q=80"],
  ["ref-music-festival", "音乐节活动海报", "event_poster", "喜欢热烈的活动氛围和强主视觉。", "https://images.unsplash.com/photo-1492684223066-81342ee5ff30?auto=format&fit=crop&w=900&q=80"],
  ["ref-gallery-opening", "画展开幕海报", "event_poster", "喜欢展览感、留白和安静的情绪。", "https://images.unsplash.com/photo-1547891654-e66ed7ebb968?auto=format&fit=crop&w=900&q=80"],
  ["ref-startup-demo", "创业路演封面", "social_cover", "喜欢科技创业感和明确主题。", "https://images.unsplash.com/photo-1559136555-9303baea8ebd?auto=format&fit=crop&w=900&q=80"],
  ["ref-portfolio-minimal", "作品集极简封面", "portfolio_cover", "喜欢几何结构、低噪音和设计感。", "https://images.unsplash.com/photo-1518005020951-eccb494ad742?auto=format&fit=crop&w=900&q=80"],
  ["ref-workshop-social", "工作坊招募封面", "social_cover", "喜欢清楚的学习场景和温和专业感。", "https://images.unsplash.com/photo-1516321497487-e288fb19713f?auto=format&fit=crop&w=900&q=80"],
  ["ref-retro-zine", "复古杂志封面", "portfolio_cover", "喜欢复古、颗粒感和封面叙事。", "https://images.unsplash.com/photo-1519681393784-d120267933ba?auto=format&fit=crop&w=900&q=80"],
  ["ref-product-launch", "新品发布封面", "social_cover", "喜欢商业发布感和清晰行动目标。", "https://images.unsplash.com/photo-1551434678-e076c223a692?auto=format&fit=crop&w=900&q=80"],
  ["ref-campus-market", "校园市集海报", "event_poster", "喜欢年轻、明快、适合线下活动。", "https://images.unsplash.com/photo-1488459716781-31db52582fe9?auto=format&fit=crop&w=900&q=80"],
  ["ref-case-study", "案例研究封面", "portfolio_cover", "喜欢专业、克制、适合作品集开头。", "https://images.unsplash.com/photo-1497366811353-6870744d04b2?auto=format&fit=crop&w=900&q=80"]
].map(([id, title, category, userNote, imageUrl], index) => ({
  id,
  title,
  imageUrl,
  category,
  source: "演示图片",
  userNote,
  createdAt: new Date(Date.UTC(2026, 5, 14, 0, index * 5)).toISOString()
}));

const seedAnalyses = seedReferences.map(generateAnalysis);
const seedReferencesWithAnalysis = seedReferences.map((reference) => ({
  ...reference,
  analysisId: `analysis-${reference.id}`
}));

const seedState = {
  activeView: "library",
  selectedReferenceId: "ref-campus-ai",
  selectedFeedbackTags: [],
  selectedAdapterId: "generic",
  analysisMode: "mock",
  analysisNotice: "",
  isAnalyzing: false,
  referenceLibraryExpanded: false,
  references: seedReferencesWithAnalysis,
  analyses: seedAnalyses,
  profile: generateTasteProfile(seedReferencesWithAnalysis, seedAnalyses, []),
  prompts: [],
  feedback: [],
  draftPrompt: null,
  feedbackSaved: false,
  promptCopied: false,
  promptCopyNotice: "",
  promptManualCopyText: "",
  profileCopied: false
};

let currentAnalysisTask = null;
let pendingPastedImage = null;
let referenceContextMenu = null;
let state = loadState();

function loadState() {
  const raw = localStorage.getItem(STORAGE_KEY);
  if (!raw) return normalizeState(structuredClone(seedState));
  try {
    return normalizeState(recoverAnalysisState({ ...structuredClone(seedState), ...JSON.parse(raw) }));
  } catch {
    return normalizeState(structuredClone(seedState));
  }
}

function saveState() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
}

function setState(nextState) {
  state = normalizeState(nextState);
  saveState();
  render();
}

function normalizeState(inputState) {
  const analyses = [...(inputState.analyses || [])];
  const references = (inputState.references || []).map((reference) => {
    if (reference.analysisId && analyses.some((analysis) => analysis.id === reference.analysisId)) {
      return reference;
    }
    const analysis = generateAnalysis(reference);
    analyses.push(analysis);
    return { ...reference, analysisId: analysis.id };
  });

  return {
    ...structuredClone(seedState),
    ...inputState,
    references,
    analyses,
    selectedReferenceId: inputState.selectedReferenceId || references[0]?.id || null,
    profile: generateTasteProfile(references, analyses, inputState.feedback || [])
  };
}

function escapeHtml(value) {
  return String(value ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

function render() {
  const app = document.querySelector("#app");
  if (!app) return;
  app.innerHTML = `
    <div class="app-shell">
      ${renderHeader()}
      <div class="app-body">
        ${renderNavigationRail()}
        <main class="main">${renderActiveView()}</main>
      </div>
    </div>
  `;
  bindEvents();
}

function renderHeader() {
  return `
    <header class="topbar" aria-label="个人审美提示词工坊">
      <div class="brand-lockup">
        <span class="brand-mark">T</span>
        <strong>TasteOS</strong>
        <span class="brand-divider">/</span>
        <span class="brand-product">视觉审美工作台</span>
      </div>
      <div class="project-context">
        <strong>我的审美库</strong>
      </div>
      <div class="model-status">
        <span class="status-dot"></span>
        <span>${state.analysisMode === "api" ? "真实模型" : "离线分析"}</span>
        <span class="avatar">我</span>
      </div>
    </header>
  `;
}

function renderNavigationRail() {
  const navItems = [
    ["library", "案例库"],
    ["profile", "审美画像"],
    ["prompt", "提示词工坊"],
    ["feedback", "结果反馈"],
    ["about", "产品说明"]
  ];

  return `
    <aside class="navigation-rail">
      <nav class="nav" aria-label="主导航">
          ${navItems
            .map(
              ([key, label]) => `
                <button type="button" data-view="${key}" class="${state.activeView === key ? "active" : ""}" title="${label}">
                  <span class="nav-icon">${renderNavIcon(key)}</span>
                  <span>${label}</span>
                </button>
              `
            )
            .join("")}
        </nav>
    </aside>
  `;
}

function renderNavIcon(key) {
  const paths = {
    library: '<rect x="3" y="3" width="7" height="7" rx="1"/><rect x="14" y="3" width="7" height="7" rx="1"/><rect x="3" y="14" width="7" height="7" rx="1"/><rect x="14" y="14" width="7" height="7" rx="1"/>',
    profile: '<rect x="3" y="5" width="18" height="16" rx="2"/><circle cx="9" cy="11" r="2"/><path d="m21 15-5-5L5 21"/>',
    prompt: '<path d="m15 4 5 5L8 21H3v-5Z"/><path d="m13 6 5 5"/><path d="M4 14c3 0 6 3 6 6"/>',
    feedback: '<path d="M21 15a4 4 0 0 1-4 4H8l-5 3V7a4 4 0 0 1 4-4h10a4 4 0 0 1 4 4Z"/><path d="M8 11h.01M12 11h.01M16 11h.01"/>',
    about: '<path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"/><path d="M4 4.5A2.5 2.5 0 0 1 6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5Z"/>'
  };
  return `<svg viewBox="0 0 24 24" aria-hidden="true">${paths[key] || paths.library}</svg>`;
}

function renderActiveView() {
  if (state.activeView === "profile") return renderProfile();
  if (state.activeView === "prompt") return renderPromptStudio();
  if (state.activeView === "feedback") return renderFeedback();
  if (state.activeView === "about") return renderAbout();
  return renderLibrary();
}

function renderLibrary() {
  const selected = state.references.find((reference) => reference.id === state.selectedReferenceId) || state.references[0];
  const analysis = state.analyses.find((item) => item.id === selected?.analysisId);
  const library = buildLibraryViewModel(state.references, {
    expanded: state.referenceLibraryExpanded,
    previewCount: 4
  });

  return `
    <div class="workbench library-workbench">
      <aside class="workspace-panel reference-browser">
        <div class="panel-header">
          <div class="section-head">
            <div>
              <p class="panel-kicker">VISUAL REFERENCES</p>
              <h2>案例库</h2>
            </div>
            <span class="count">${state.references.length}</span>
          </div>
          <div class="filter-row">
            <button type="button" class="filter-chip active">全部</button>
            <button type="button" class="filter-chip">海报</button>
            <button type="button" class="filter-chip">封面</button>
          </div>
        </div>
        <div class="reference-list compact">
          ${library.visibleReferences.map((reference) => renderReferenceCard(reference)).join("")}
        </div>
        <div class="library-actions">
          ${library.toggleLabel ? `<button type="button" class="secondary-button" data-toggle-library>${library.toggleLabel}</button>` : ""}
          <button type="button" class="secondary-button" data-reset>重置案例</button>
        </div>
      </aside>
      <section class="analysis-canvas">
        <div class="canvas-toolbar">
          <div>
            <span class="panel-kicker">VISUAL ANALYSIS</span>
            <strong>当前视觉分析</strong>
          </div>
          <span class="canvas-state">${state.isAnalyzing ? "分析中" : "已就绪"}</span>
        </div>
        ${renderReferenceDetail(selected, analysis)}
      </section>
      <aside class="workspace-panel config-sidebar">
        <div class="panel-header">
          <p class="panel-kicker">CONFIGURATION</p>
          <h2>分析配置</h2>
          <p>上传参考图，选择分析方式。</p>
        </div>
        ${renderReferenceForm()}
      </aside>
      ${renderReferenceContextMenu()}
    </div>
  `;
}

function renderReferenceContextMenu() {
  if (!referenceContextMenu) return "";
  const reference = state.references.find((item) => item.id === referenceContextMenu.referenceId);
  if (!reference) return "";
  return `
    <div
      class="reference-context-menu"
      role="menu"
      data-reference-context-menu
      style="left:${referenceContextMenu.x}px;top:${referenceContextMenu.y}px"
    >
      <span>${escapeHtml(reference.title)}</span>
      <button type="button" role="menuitem" data-context-delete-reference="${reference.id}">删除案例</button>
    </div>
  `;
}

function renderReferenceForm() {
  const isAnalyzing = Boolean(state.isAnalyzing);

  return `
    <form class="form-panel" data-reference-form>
      <div class="field">
        <label for="title">标题（可选）</label>
        <input id="title" name="title" placeholder="不填也可以，系统会用图片生成默认名称" ${isAnalyzing ? "disabled" : ""} />
      </div>
      <div class="field">
        <label for="imageUrl">图片链接</label>
        <input id="imageUrl" name="imageUrl" placeholder="https://..." data-image-url-input ${isAnalyzing ? "disabled" : ""} />
      </div>
      <div class="field">
        <label for="imageFile">或上传本地图片</label>
        <input id="imageFile" name="imageFile" type="file" accept="image/*" data-image-file-input ${isAnalyzing ? "disabled" : ""} />
      </div>
      <div class="upload-preview" data-upload-preview>
        <div class="preview-empty">
          <strong>等待图片</strong>
          <span>选择本地图片或粘贴图片链接后，这里会先显示预览。</span>
        </div>
      </div>
      <p class="field-hint">也可以直接按 Ctrl+V / ⌘V 粘贴剪贴板中的图片，支持 JPEG、PNG、WebP，最大 3 MB。</p>
      <div class="field">
        <label for="analysisMode">分析模式</label>
        <select id="analysisMode" name="analysisMode" data-analysis-mode ${isAnalyzing ? "disabled" : ""}>
          <option value="mock" ${state.analysisMode === "mock" ? "selected" : ""}>离线演示分析</option>
          <option value="api" ${state.analysisMode === "api" ? "selected" : ""}>真实模型分析</option>
        </select>
      </div>
      <div class="analysis-actions">
        <button class="primary-button" type="submit" ${isAnalyzing ? "disabled" : ""}>${isAnalyzing ? "分析中..." : "开始分析"}</button>
        ${isAnalyzing ? '<button class="secondary-button cancel-analysis-button" type="button" data-cancel-analysis>取消分析</button>' : ""}
      </div>
      ${state.analysisNotice ? `<p class="status-note">${escapeHtml(state.analysisNotice)}</p>` : ""}
    </form>
  `;
}

function renderReferenceCard(reference) {
  const analysis = state.analyses.find((item) => item.id === reference.analysisId);
  const active = reference.id === state.selectedReferenceId;

  return `
    <button type="button" class="reference-card ${active ? "active" : ""}" data-reference-id="${reference.id}">
      <div class="reference-row">
        <img class="thumb" src="${escapeHtml(reference.imageUrl)}" alt="${escapeHtml(reference.title)}" />
        <div>
          <p class="reference-title">${escapeHtml(reference.title)}</p>
          <p class="reference-meta">${escapeHtml(analysis?.usageScenario || categories[reference.category] || "自动识别")}</p>
          <div class="tag-row">
            ${(analysis?.styleTags || []).slice(0, 3).map((tag) => `<span class="tag">${escapeHtml(tag)}</span>`).join("")}
          </div>
          <span class="delete-reference" data-delete-reference="${reference.id}" aria-label="删除 ${escapeHtml(reference.title)}">删除</span>
        </div>
      </div>
    </button>
  `;
}

function renderReferenceDetail(reference, analysis) {
  if (!reference || !analysis) {
    return `<section class="card"><div class="empty">添加一张参考图后，这里会显示分析摘要。</div></section>`;
  }

  return `
    <section class="card current-analysis-card">
      <div class="card-body current-analysis">
        <div class="analysis-hero">
          <div class="analysis-preview-media">
            <img class="poster-preview" src="${escapeHtml(reference.imageUrl)}" alt="${escapeHtml(reference.title)}" />
          </div>
          <div class="analysis-summary">
            <p class="eyebrow">${escapeHtml(analysis.usageScenario)}</p>
            <h2>${escapeHtml(reference.title)}</h2>
            <p class="muted">系统已根据图片自动识别用途、风格和可复用偏好。</p>
            <div class="tag-row">
              ${analysis.styleTags.slice(0, 5).map((tag) => `<span class="tag strong">${escapeHtml(tag)}</span>`).join("")}
            </div>
            <div class="swatches">
              ${analysis.colorPalette.map((color) => `<span class="swatch" title="${color}" style="background:${color}"></span>`).join("")}
            </div>
            <div class="analysis-brief">
              ${renderAnalysisBlock("反推提示词", analysis.inferredPrompt || analysis.composition)}
            </div>
          </div>
        </div>
        <div class="analysis-details">
          <section class="analysis-detail-section prompt-genes">
            <h3>提示词基因</h3>
            <div class="tag-row">
              ${(analysis.keyPromptTerms || analysis.reusablePatterns).slice(0, 8).map((term) => `<span class="tag">${escapeHtml(term)}</span>`).join("")}
            </div>
          </section>
          <div class="dna-grid">
            <div><span>用途</span><strong>${escapeHtml(analysis.usageCategory || "自动识别")}</strong></div>
            <div><span>风格</span><strong>${escapeHtml(analysis.styleCategory || "自动识别")}</strong></div>
          </div>
          <section class="analysis-detail-section negative-prompts">
            <h3>负向提示词</h3>
            <div class="tag-row">
              ${(analysis.negativePromptTerms || analysis.avoidPatterns).slice(0, 6).map((term) => `<span class="tag">${escapeHtml(term)}</span>`).join("")}
            </div>
          </section>
        </div>
      </div>
    </section>
  `;
}

function renderAnalysisBlock(title, text) {
  return `
    <div class="analysis-block">
      <h3>${title}</h3>
      <p>${escapeHtml(text)}</p>
    </div>
  `;
}

function renderProfile() {
  const evidence = state.references.filter((reference) => state.profile.evidenceReferenceIds.includes(reference.id));
  const profileMarkdown = exportTasteProfileMarkdown(state.profile, evidence);

  return `
    <div class="grid-profile">
      <section class="card">
        <div class="card-body">
          <p class="eyebrow">审美画像</p>
          <h2>你的视觉偏好画像</h2>
          <p class="muted">基于 ${state.profile.evidenceReferenceIds.length} 张参考图和 ${state.feedback.length} 条反馈聚合生成。</p>
          <div class="preference-grid">
            ${renderPreferenceBlock("版式偏好", state.profile.layoutPreferences)}
            ${renderPreferenceBlock("色彩偏好", state.profile.colorPreferences)}
            ${renderPreferenceBlock("字体偏好", state.profile.typographyPreferences)}
            ${renderPreferenceBlock("情绪偏好", state.profile.moodPreferences)}
          </div>
          <div class="analysis-block" style="margin-top:14px">
            <h3>需要避免</h3>
            <div class="tag-row">
              ${state.profile.negativePreferences.map((item) => `<span class="tag">${escapeHtml(item)}</span>`).join("")}
            </div>
          </div>
          <div class="export-panel">
            <div class="section-head">
              <div>
                <h3>导出画像文本</h3>
                <p>把审美画像复制到笔记、提示词工具或项目文档里继续使用。</p>
              </div>
              <button type="button" class="secondary-button" data-copy-profile>复制画像</button>
            </div>
            <pre>${escapeHtml(profileMarkdown)}</pre>
            ${state.profileCopied ? `<p class="status-note">已复制审美画像文本。</p>` : ""}
          </div>
        </div>
      </section>
      <aside class="card">
        <div class="card-body">
          <h2>证据案例</h2>
          <div class="evidence-list">
            ${evidence
              .map(
                (reference) => `
                  <div class="evidence-item">
                    <img src="${escapeHtml(reference.imageUrl)}" alt="${escapeHtml(reference.title)}" />
                    <div>
                      <p class="reference-title">${escapeHtml(reference.title)}</p>
                      <p class="reference-meta">${escapeHtml(reference.userNote || "")}</p>
                    </div>
                  </div>
                `
              )
              .join("")}
          </div>
        </div>
      </aside>
    </div>
  `;
}

function renderPreferenceBlock(title, items) {
  return `
    <div class="preference-block">
      <h3>${title}</h3>
      <ul>${items.map((item) => `<li>${escapeHtml(item)}</li>`).join("")}</ul>
    </div>
  `;
}

function renderPromptStudio() {
  const historyItems = buildPromptHistoryItems(state.prompts);

  return `
    <div class="prompt-grid">
      <section class="card">
        <div class="card-body">
          <h2>提示词工坊</h2>
          <p class="muted">选择使用场景，基于审美画像生成可复用中文提示词。</p>
          <form data-prompt-form>
            <div class="field">
              <label for="scenario">使用场景</label>
              <select id="scenario" name="scenario">
                ${scenarios.map((scenario) => `<option value="${scenario}">${scenario}</option>`).join("")}
              </select>
            </div>
            <div class="field">
              <label for="goal">生成目标</label>
              <input id="goal" name="goal" required value="AI 创作分享会" />
            </div>
            <div class="field">
              <label for="adapterId">生图模型格式</label>
              <select id="adapterId" name="adapterId">
                ${modelAdapters
                  .map(
                    (adapter) => `
                      <option value="${adapter.id}" ${state.selectedAdapterId === adapter.id ? "selected" : ""}>
                        ${adapter.label}
                      </option>
                    `
                  )
                  .join("")}
              </select>
            </div>
            <button type="submit" class="primary-button">生成提示词</button>
          </form>
          <div class="adapter-list">
            ${modelAdapters
              .map(
                (adapter) => `
                  <div class="${state.selectedAdapterId === adapter.id ? "selected" : ""}">
                    <strong>${adapter.label}</strong>
                    <p>${adapter.description}</p>
                  </div>
                `
              )
              .join("")}
          </div>
          <div class="analysis-block" style="margin-top:14px">
            <h3>当前画像摘要</h3>
            <p>${escapeHtml(state.profile.layoutPreferences.slice(0, 3).join("、"))}</p>
          </div>
        </div>
      </section>
      <section class="card">
        <div class="card-body">
          <div class="section-head">
            <div>
              <h2>生成结果</h2>
              <p>复制到 Midjourney、DALL-E、即梦或其他生图工具中继续使用。</p>
            </div>
          </div>
          ${
            state.draftPrompt
              ? `
                <p class="eyebrow">${escapeHtml(state.draftPrompt.adapterLabel || "通用提示词")}</p>
                <div class="prompt-meta-grid">
                  <div><span>适用场景</span><strong>${escapeHtml(state.draftPrompt.scenario || "未指定")}</strong></div>
                  <div><span>推荐格式</span><strong>${escapeHtml(state.draftPrompt.adapterLabel || "通用提示词")}</strong></div>
                </div>
                <h3>正向提示词</h3>
                <pre class="prompt-output">${escapeHtml(state.draftPrompt.prompt)}</pre>
                <h3 style="margin-top:16px">负向提示词</h3>
                <pre class="negative-output">${escapeHtml(state.draftPrompt.negativePrompt)}</pre>
                <h3 style="margin-top:16px">可复用关键词</h3>
                <div class="tag-row">
                  ${(state.draftPrompt.keyPromptTerms || []).slice(0, 8).map((term) => `<span class="tag">${escapeHtml(term)}</span>`).join("") || `<span class="tag">暂无关键词</span>`}
                </div>
                <div class="copy-actions">
                  <button type="button" class="secondary-button" data-copy-prompt="positive">复制正向</button>
                  <button type="button" class="secondary-button" data-copy-prompt="negative">复制负向</button>
                  <button type="button" class="secondary-button" data-copy-prompt="package">复制完整包</button>
                </div>
                ${state.promptCopied ? `<p class="status-note">${escapeHtml(state.promptCopyNotice || "已复制提示词。")}</p>` : ""}
                ${
                  state.promptManualCopyText
                    ? `
                      <div class="manual-copy-panel">
                        <label for="manualCopyText">自动复制受限，请手动复制下面内容</label>
                        <textarea id="manualCopyText" readonly>${escapeHtml(state.promptManualCopyText)}</textarea>
                      </div>
                    `
                    : ""
                }
              `
              : `<div class="empty">还没有生成提示词。</div>`
          }
          <div class="prompt-history">
            <div class="section-head">
              <div>
                <h3>提示词历史</h3>
                <p>保存最近生成的版本，用于回看、复用或清理。</p>
              </div>
              <span class="count">${historyItems.length} 条</span>
            </div>
            ${
              historyItems.length > 0
                ? historyItems
                    .map(
                      (item) => `
                        <article class="history-item">
                          <div>
                            <strong>${escapeHtml(item.title)}</strong>
                            <p>${escapeHtml(item.adapterLabel)} · ${escapeHtml(item.createdLabel)}</p>
                          </div>
                          <div class="history-actions">
                            <button type="button" class="secondary-button" data-load-prompt="${item.id}">载入</button>
                            <button type="button" class="secondary-button" data-delete-prompt="${item.id}">删除</button>
                          </div>
                        </article>
                      `
                    )
                    .join("")
                : `<p class="muted">生成提示词后会出现在这里。</p>`
            }
          </div>
        </div>
      </section>
    </div>
  `;
}

function renderFeedback() {
  if (state.prompts.length === 0) {
    return `
      <section class="card">
        <div class="card-body">
          <h2>结果反馈</h2>
          <p class="muted">请先在 提示词工坊 生成一个提示词，再记录结果反馈。</p>
        </div>
      </section>
    `;
  }

  return `
    <section class="card">
      <div class="card-body">
        <h2>结果反馈</h2>
        <p class="muted">记录生图结果是否符合你的审美，用于后续优化提示词。</p>
        <form data-feedback-form>
          <div class="field">
            <label for="promptId">来源提示词</label>
            <select id="promptId" name="promptId">
              ${state.prompts.map((prompt) => `<option value="${prompt.id}">${escapeHtml(prompt.scenario)} - ${escapeHtml(prompt.goal)}</option>`).join("")}
            </select>
          </div>
          <div class="field">
            <label for="rating">整体评价</label>
            <select id="rating" name="rating">
              <option value="like">喜欢</option>
              <option value="mixed" selected>方向接近</option>
              <option value="dislike">不喜欢</option>
            </select>
          </div>
          <div class="field">
            <label>问题标签</label>
            <div class="feedback-options">
              ${feedbackOptions
                .map(
                  ([value, label]) => `
                    <button type="button" class="pill-button ${state.selectedFeedbackTags.includes(value) ? "selected" : ""}" data-feedback-tag="${value}">
                      ${label}
                    </button>
                  `
                )
                .join("")}
            </div>
          </div>
          <div class="field">
            <label for="resultImage">生成结果图片</label>
            <input id="resultImage" name="resultImage" type="file" accept="image/*" />
          </div>
          <div class="field">
            <label for="note">备注</label>
            <textarea id="note" name="note" placeholder="例如：构图接近，但颜色太暗，标题不够清晰。"></textarea>
          </div>
          <button type="submit" class="primary-button">保存反馈</button>
        </form>
        ${state.feedbackSaved ? `<p class="status-note">反馈已保存，审美画像 已根据这次结果更新。</p>` : ""}
        ${renderFeedbackHistory()}
      </div>
    </section>
  `;
}

function renderFeedbackHistory() {
  if (state.feedback.length === 0) return "";

  return `
    <div class="analysis-block" style="margin-top:18px">
      <h3>反馈记录</h3>
      <div class="evidence-list">
        ${state.feedback
          .slice(0, 4)
          .map((item) => {
            const prompt = state.prompts.find((candidate) => candidate.id === item.promptTemplateId);
            return `
              <div class="evidence-item">
                ${item.resultImageUrl ? `<img src="${escapeHtml(item.resultImageUrl)}" alt="生成结果预览" />` : `<div class="thumb" aria-hidden="true"></div>`}
                <div>
                  <p class="reference-title">${escapeHtml(prompt ? `${prompt.scenario} - ${prompt.goal}` : "未知提示词")}</p>
                  <p class="reference-meta">${escapeHtml(item.rating)} · ${escapeHtml(item.feedbackTags.join("、") || "无标签")}</p>
                  <p class="reference-meta">${escapeHtml(item.note || "")}</p>
                </div>
              </div>
            `;
          })
          .join("")}
      </div>
    </div>
  `;
}

function renderAbout() {
  const loopItems = [
    ["01", "收藏参考图", "保存海报、社媒封面和项目视觉，把分散灵感变成可分析案例。"],
    ["02", "视觉拆解", "从构图、色彩、字体、信息层级和情绪中提取可复用模式。"],
    ["03", "形成画像", "聚合多个案例，生成个人 审美画像 和负向偏好。"],
    ["04", "生成提示词", "按具体场景生成正向提示词与负向提示词，而不是从零盲写。"],
    ["05", "反馈校准", "记录生成结果的问题，让下一轮提示词 更贴近个人审美。"]
  ];

  return `
    <section class="about-hero">
      <div>
        <p class="eyebrow">产品说明</p>
        <h2>TasteOS 不是生图工具，而是生图前的审美表达层。</h2>
        <p>它把用户收藏的视觉参考转化为结构化偏好，再生成适合不同场景的 AI 生图提示词模板。当前 MVP 先验证产品闭环，视觉分析使用可替换的 离线分析。</p>
      </div>
      <div class="about-thesis">
        <span>核心假设</span>
        <strong>用户缺的不是更多图片，而是把“我喜欢这种感觉”说清楚并复用的系统。</strong>
      </div>
    </section>
    <section class="loop-strip" aria-label="核心产品闭环">
      ${loopItems.map(([index, title, body]) => `<article><span>${index}</span><h3>${title}</h3><p>${body}</p></article>`).join("")}
    </section>
    <div class="about-grid">
      <section class="card"><div class="card-body"><h2>演示路径</h2><ol class="demo-steps"><li>在案例库查看 12 个内置视觉参考。</li><li>添加一张自己的图片链接或本地图片。</li><li>进入 审美画像，查看偏好如何被聚合。</li><li>进入 提示词工坊，选择场景并生成中文提示词。</li><li>进入结果反馈，上传生成结果并标记问题。</li></ol></div></section>
      <section class="card"><div class="card-body"><h2>产品边界</h2><div class="decision-list"><div><strong>做</strong><p>参考图管理、视觉偏好结构化、场景化提示词、反馈闭环。</p></div><div><strong>不做</strong><p>完整生图平台、通用素材站、品牌全案、UI 设计系统、视频生成。</p></div><div><strong>后续替换</strong><p>把当前 离线分析 替换为多模态 AI 图像理解服务。</p></div></div></div></section>
      <section class="card"><div class="card-body"><h2>差异化</h2><div class="comparison-grid"><div><span>Pinterest / 花瓣</span><p>解决收藏，不解决复用。</p></div><div><span>ChatGPT</span><p>适合一次性生成，不沉淀长期偏好。</p></div><div><span>生图工具</span><p>关注输出，TasteOS 关注输出前的创作指令。</p></div></div></div></section>
      <section class="card"><div class="card-body"><h2>为什么不是普通提示词工具</h2><p class="muted">普通提示词工具通常从一句需求开始生成文本。TasteOS 从用户长期收藏的视觉参考开始，先沉淀偏好，再按场景生成提示词，并用结果反馈继续校准。</p><div class="tag-row about-links"><a href="./docs/demo/tasteos-demo-script.md">演示脚本</a><a href="./docs/prd/tasteos-prd.md">产品需求文档</a><a href="./README.md">项目说明</a></div></div></section>
    </div>
  `;
}

function bindEvents() {
  document.querySelectorAll("[data-view]").forEach((button) => {
    button.addEventListener("click", () => setState({ ...state, activeView: button.dataset.view, feedbackSaved: false, promptCopied: false, promptCopyNotice: "", promptManualCopyText: "", profileCopied: false }));
  });
  document.querySelectorAll("[data-reference-id]").forEach((button) => {
    button.addEventListener("click", () => setState({ ...state, selectedReferenceId: button.dataset.referenceId }));
    button.addEventListener("contextmenu", handleReferenceContextMenu);
  });
  document.querySelectorAll("[data-delete-reference]").forEach((button) => {
    button.addEventListener("click", (event) => {
      event.stopPropagation();
      deleteReferenceWithConfirmation(button.dataset.deleteReference);
    });
  });
  document.querySelector("[data-context-delete-reference]")?.addEventListener("click", (event) => {
    event.stopPropagation();
    deleteReferenceWithConfirmation(event.currentTarget.dataset.contextDeleteReference);
  });
  document.addEventListener("click", closeReferenceContextMenu, { once: true });
  document.onkeydown = (event) => {
    if (event.key === "Escape") closeReferenceContextMenu();
  };
  window.onscroll = closeReferenceContextMenu;
  document.querySelector("[data-reference-form]")?.addEventListener("submit", handleCreateReference);
  document.querySelector("[data-cancel-analysis]")?.addEventListener("click", handleCancelAnalysis);
  document.querySelector("[data-analysis-mode]")?.addEventListener("change", (event) => {
    state = normalizeState({ ...state, analysisMode: event.currentTarget.value, analysisNotice: "" });
    saveState();
  });
  document.querySelector("[data-toggle-library]")?.addEventListener("click", () => {
    setState({ ...state, referenceLibraryExpanded: !state.referenceLibraryExpanded });
  });
  document.querySelector("[data-image-url-input]")?.addEventListener("input", (event) => {
    const imageUrl = event.currentTarget.value.trim();
    updateUploadPreview(imageUrl, imageUrl ? "图片链接已就绪，点击开始分析。" : "");
  });
  document.querySelector("[data-image-file-input]")?.addEventListener("change", (event) => {
    const file = event.currentTarget.files?.[0];
    if (!file) {
      updateUploadPreview("", "");
      return;
    }
    readImageFileAsDataUrl(file)
      .then((imageUrl) => {
        pendingPastedImage = null;
        updateUploadPreview(imageUrl, `${file.name} 已就绪，点击开始分析。`);
      })
      .catch(() => updateUploadPreview("", "图片读取失败，请换一张图片或使用图片链接。"));
  });
  document.onpaste = handleImagePaste;
  document.querySelector("[data-prompt-form]")?.addEventListener("submit", handleCreatePrompt);
  document.querySelector("[data-feedback-form]")?.addEventListener("submit", handleCreateFeedback);
  document.querySelector("[data-reset]")?.addEventListener("click", () => {
    localStorage.removeItem(STORAGE_KEY);
    pendingPastedImage = null;
    state = normalizeState(structuredClone(seedState));
    render();
  });
  document.querySelectorAll("[data-copy-prompt]").forEach((button) => {
    button.addEventListener("click", async () => {
      if (!state.draftPrompt) return;
      const copyMap = {
        positive: {
          text: state.draftPrompt.prompt,
          notice: "已复制正向提示词。"
        },
        negative: {
          text: state.draftPrompt.negativePrompt,
          notice: "已复制负向提示词。"
        },
        package: {
          text: buildPromptPackageText(state.draftPrompt),
          notice: "已复制完整提示词包。"
        }
      };
      const copyPayload = copyMap[button.dataset.copyPrompt] || copyMap.package;
      try {
        await copyTextToClipboard(copyPayload.text);
        setState({ ...state, promptCopied: true, promptCopyNotice: copyPayload.notice, promptManualCopyText: "" });
      } catch (error) {
        setState({ ...state, promptCopied: true, promptCopyNotice: error.message, promptManualCopyText: copyPayload.text });
      }
    });
  });
  document.querySelector("[data-copy-profile]")?.addEventListener("click", async () => {
    const evidence = state.references.filter((reference) => state.profile.evidenceReferenceIds.includes(reference.id));
    try {
      await copyTextToClipboard(exportTasteProfileMarkdown(state.profile, evidence));
      setState({ ...state, profileCopied: true });
    } catch {
      setState({ ...state, profileCopied: true });
    }
  });
  document.querySelectorAll("[data-feedback-tag]").forEach((button) => {
    button.addEventListener("click", () => {
      const tag = button.dataset.feedbackTag;
      const selectedFeedbackTags = state.selectedFeedbackTags.includes(tag)
        ? state.selectedFeedbackTags.filter((item) => item !== tag)
        : [...state.selectedFeedbackTags, tag];
      setState({ ...state, selectedFeedbackTags, feedbackSaved: false });
    });
  });
  document.querySelectorAll("[data-load-prompt]").forEach((button) => {
    button.addEventListener("click", () => {
      const prompt = state.prompts.find((item) => item.id === button.dataset.loadPrompt);
      if (!prompt) return;
      setState({ ...state, draftPrompt: prompt, selectedAdapterId: prompt.adapterId || state.selectedAdapterId, feedbackSaved: false });
    });
  });
  document.querySelectorAll("[data-delete-prompt]").forEach((button) => {
    button.addEventListener("click", () => {
      const promptId = button.dataset.deletePrompt;
      const prompts = removePromptById(state.prompts, promptId);
      const draftPrompt = state.draftPrompt?.id === promptId ? null : state.draftPrompt;
      const feedback = state.feedback.filter((item) => item.promptTemplateId !== promptId);
      setState({ ...state, prompts, draftPrompt, feedback, feedbackSaved: false });
    });
  });
}

function handleReferenceContextMenu(event) {
  event.preventDefault();
  event.stopPropagation();
  referenceContextMenu = {
    referenceId: event.currentTarget.dataset.referenceId,
    x: Math.min(event.clientX, window.innerWidth - 190),
    y: Math.min(event.clientY, window.innerHeight - 110)
  };
  render();
}

function closeReferenceContextMenu() {
  if (!referenceContextMenu) return;
  referenceContextMenu = null;
  render();
}

function deleteReferenceWithConfirmation(referenceId) {
  const reference = state.references.find((item) => item.id === referenceId);
  referenceContextMenu = null;
  if (!reference || !window.confirm(`确认删除“${reference.title}”吗？`)) {
    render();
    return;
  }
  const nextState = deleteReferenceFromState(state, referenceId);
  setState({
    ...nextState,
    profile: generateTasteProfile(nextState.references, nextState.analyses, nextState.feedback || []),
    analysisNotice: "案例已删除。"
  });
}

function updateUploadPreview(imageUrl, message) {
  const preview = document.querySelector("[data-upload-preview]");
  if (!preview) return;

  if (!imageUrl) {
    preview.innerHTML = `
      <div class="preview-empty">
        <strong>等待图片</strong>
        <span>${escapeHtml(message || "选择本地图片或粘贴图片链接后，这里会先显示预览。")}</span>
      </div>
    `;
    return;
  }

  preview.innerHTML = `
    <img src="${escapeHtml(imageUrl)}" alt="待分析图片预览" />
    <div>
      <strong>待分析</strong>
      <span>${escapeHtml(message || "图片已就绪，点击开始分析。")}</span>
    </div>
  `;
}

async function handleCreateReference(event) {
  event.preventDefault();
  const data = new FormData(event.currentTarget);
  const file = data.get("imageFile");
  const urlInput = String(data.get("imageUrl") || "").trim();
  const finish = async (imageUrl) => {
    if (!imageUrl) {
      alert("请填写图片链接或上传本地图片。");
      return;
    }
    const analysisMode = state.analysisMode;
    const reference = {
      id: `ref-${Date.now()}`,
      title: String(data.get("title") || "").trim() || `参考图 ${new Date().toLocaleString("zh-CN", { month: "2-digit", day: "2-digit", hour: "2-digit", minute: "2-digit" })}`,
      imageUrl,
      category: "event_poster",
      source: pendingPastedImage ? "剪贴板粘贴" : file instanceof File && file.size > 0 ? "本地上传" : "用户输入",
      userNote: "",
      createdAt: new Date().toISOString()
    };
    let analysis;
    let analysisNotice = "";
    const task = createAnalysisTask();
    currentAnalysisTask = task;

    setState({
      ...state,
      isAnalyzing: true,
      analysisNotice: analysisMode === "api" ? "正在调用真实模型分析图片，通常需要 10-30 秒。" : "正在生成离线演示分析。"
    });

    try {
      if (analysisMode === "api") {
        try {
          analysis = await analyzeReferenceViaApi(reference, { signal: task.controller.signal });
          analysisNotice = "已使用真实模型完成视觉分析。";
        } catch (error) {
          if (task.cancelled || error?.name === "AbortError") return;
          analysis = generateAnalysis(reference);
          analysisNotice = `真实模型分析暂不可用，已回退到离线演示分析：${error.message}`;
        }
      } else {
        analysis = generateAnalysis(reference);
        analysisNotice = "已使用离线演示分析。";
      }

      if (!isCurrentAnalysisTask(currentAnalysisTask, task)) return;

      const referenceWithAnalysis = { ...reference, analysisId: analysis.id };
      const references = [referenceWithAnalysis, ...state.references];
      const analyses = [analysis, ...state.analyses];
      setState({
        ...state,
        references,
        analyses,
        profile: generateTasteProfile(references, analyses, state.feedback),
        selectedReferenceId: referenceWithAnalysis.id,
        activeView: "library",
        analysisNotice,
        isAnalyzing: false
      });
      pendingPastedImage = null;
    } finally {
      if (currentAnalysisTask?.id === task.id) {
        currentAnalysisTask = null;
        if (state.isAnalyzing) {
          setState({ ...state, isAnalyzing: false });
        }
      }
    }
  };
  if (file instanceof File && file.size > 0) {
    const validationError = validateImageFile(file);
    if (validationError) {
      alert(validationError);
      return;
    }
    readImageFileAsDataUrl(file).then(finish).catch((error) => alert(`图片读取失败：${error.message}`));
    return;
  }
  if (pendingPastedImage) {
    await finish(pendingPastedImage.dataUrl);
    return;
  }
  await finish(urlInput);
}

function handleImagePaste(event) {
  if (state.isAnalyzing) return;
  const file = findClipboardImageFile(event.clipboardData);
  if (!file) return;
  event.preventDefault();
  const validationError = validateImageFile(file);
  if (validationError) {
    pendingPastedImage = null;
    updateUploadPreview("", validationError);
    return;
  }
  readImageFileAsDataUrl(file)
    .then((dataUrl) => {
      pendingPastedImage = { dataUrl, name: file.name || "剪贴板图片" };
      updateUploadPreview(dataUrl, "剪贴板图片已就绪，点击开始分析。");
    })
    .catch(() => {
      pendingPastedImage = null;
      updateUploadPreview("", "剪贴板图片读取失败，请重新复制后再粘贴，或保存为 PNG/JPG 后上传。");
    });
}

function handleCancelAnalysis() {
  const task = currentAnalysisTask;
  if (!task) return;
  cancelAnalysisTask(task);
  currentAnalysisTask = null;
  setState({
    ...state,
    isAnalyzing: false,
    analysisNotice: "已取消本次分析。"
  });
}

function handleCreatePrompt(event) {
  event.preventDefault();
  const data = new FormData(event.currentTarget);
  const adapterId = String(data.get("adapterId") || "generic");
  const basePrompt = generatePromptTemplate({
    scenario: String(data.get("scenario") || scenarios[0]),
    goal: String(data.get("goal") || "未命名视觉任务"),
    profile: state.profile,
    references: state.references
  });
  const adaptedPrompt = adaptPromptTemplate(basePrompt, adapterId);
  const prompt = {
    ...basePrompt,
    prompt: adaptedPrompt.prompt,
    negativePrompt: adaptedPrompt.negativePrompt,
    keyPromptTerms: adaptedPrompt.keyPromptTerms || basePrompt.keyPromptTerms || [],
    adapterId,
    adapterLabel: adaptedPrompt.label
  };
  setState({ ...state, draftPrompt: prompt, prompts: [prompt, ...state.prompts], selectedAdapterId: adapterId, feedbackSaved: false, promptCopied: false, promptCopyNotice: "", promptManualCopyText: "" });
}

function handleCreateFeedback(event) {
  event.preventDefault();
  const data = new FormData(event.currentTarget);
  const file = data.get("resultImage");
  const finish = (resultImageUrl) => {
    const feedbackItem = {
      id: `feedback-${Date.now()}`,
      promptTemplateId: String(data.get("promptId")),
      resultImageUrl,
      rating: String(data.get("rating") || "mixed"),
      feedbackTags: state.selectedFeedbackTags,
      note: String(data.get("note") || "").trim(),
      createdAt: new Date().toISOString()
    };
    const feedback = [feedbackItem, ...state.feedback];
    setState({ ...state, feedback, selectedFeedbackTags: [], feedbackSaved: true, profile: generateTasteProfile(state.references, state.analyses, feedback) });
  };
  if (file instanceof File && file.size > 0) {
    readFileAsDataUrl(file).then(finish).catch(() => alert("生成结果图片读取失败，请换一张图片或跳过上传。"));
    return;
  }
  finish(undefined);
}

function readFileAsDataUrl(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.addEventListener("load", () => resolve(String(reader.result || "")));
    reader.addEventListener("error", () => reject(reader.error));
    reader.readAsDataURL(file);
  });
}

render();
