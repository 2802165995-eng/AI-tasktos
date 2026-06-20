# TasteOS MVP Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a working TasteOS MVP that lets users manage visual references, view AI-style visual analysis, generate a taste profile, create scenario-based prompt templates, and record feedback.

**Architecture:** Build a single-page Vite + React + TypeScript app with localStorage persistence. Keep domain types, storage, analysis/profile/prompt generation logic, and UI components separated so the mock AI layer can later be replaced with a real multimodal LLM API.

**Tech Stack:** Vite, React, TypeScript, Tailwind CSS, Vitest, Testing Library, localStorage.

---

## 0. Runtime Adjustment

The local environment does not provide `npm`, `npx`, or `git` on PATH. The available bundled runtime only provides `node.exe`. To avoid blocking the MVP, the executable implementation can be adjusted to a zero-dependency browser app using plain HTML, CSS, and JavaScript while preserving the PRD product scope:

- Reference library
- Visual analysis
- Taste Profile
- Prompt Studio
- Feedback loop
- localStorage persistence

This keeps the product demo usable immediately through `index.html`. A later iteration can migrate the same domain model and UI flow to Vite + React when a normal Node/npm environment is available.

## 1. Scope Check

This plan implements the PRD MVP only:

- Reference library
- Visual analysis card
- Taste Profile
- Prompt Studio
- Result feedback

It intentionally does not implement:

- Real AI image generation
- Real multimodal API integration
- Browser extension
- User accounts
- Cloud database
- Team sharing

## 2. File Structure

Create the app at the repository root.

```text
.
├── docs/
│   ├── prd/tasteos-prd.md
│   └── superpowers/plans/2026-06-14-tasteos-mvp-implementation.md
├── package.json
├── index.html
├── tsconfig.json
├── vite.config.ts
├── tailwind.config.js
├── postcss.config.js
├── src/
│   ├── main.tsx
│   ├── App.tsx
│   ├── styles.css
│   ├── domain/
│   │   ├── types.ts
│   │   ├── sampleData.ts
│   │   └── storage.ts
│   ├── services/
│   │   └── tasteEngine.ts
│   ├── components/
│   │   ├── AppShell.tsx
│   │   ├── ReferenceLibrary.tsx
│   │   ├── ReferenceDetail.tsx
│   │   ├── TasteProfilePanel.tsx
│   │   ├── PromptStudio.tsx
│   │   └── FeedbackPanel.tsx
│   └── test/
│       └── setup.ts
└── src/**/*.test.ts
```

Responsibilities:

- `src/domain/types.ts`: shared domain models.
- `src/domain/sampleData.ts`: seed references and analysis examples for demo.
- `src/domain/storage.ts`: localStorage repository functions.
- `src/services/tasteEngine.ts`: deterministic analysis/profile/prompt logic for MVP.
- `src/components/*`: focused UI components.
- `src/App.tsx`: app state, navigation, and data orchestration.

## 3. Implementation Tasks

### Task 1: Scaffold Vite React App

**Files:**

- Create: `package.json`
- Create: `index.html`
- Create: `tsconfig.json`
- Create: `vite.config.ts`
- Create: `tailwind.config.js`
- Create: `postcss.config.js`
- Create: `src/main.tsx`
- Create: `src/App.tsx`
- Create: `src/styles.css`
- Create: `src/test/setup.ts`

- [ ] **Step 1: Initialize project files**

Run:

```powershell
npm create vite@latest . -- --template react-ts
```

Expected:

```text
Scaffolding project in current directory
Done
```

- [ ] **Step 2: Install dependencies**

Run:

```powershell
npm install
npm install -D tailwindcss postcss autoprefixer vitest @testing-library/react @testing-library/jest-dom @testing-library/user-event jsdom
```

Expected:

```text
added ... packages
found 0 vulnerabilities
```

- [ ] **Step 3: Create Tailwind config**

Run:

```powershell
npx tailwindcss init -p
```

Expected:

```text
Created Tailwind CSS config file: tailwind.config.js
Created PostCSS config file: postcss.config.js
```

- [ ] **Step 4: Replace `tailwind.config.js`**

```js
/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        ink: "#171717",
        paper: "#f8f6f1",
        muted: "#6f6a60",
        line: "#ddd7cc",
        accent: "#e95034"
      },
      fontFamily: {
        sans: ["Inter", "ui-sans-serif", "system-ui", "sans-serif"]
      }
    }
  },
  plugins: []
};
```

- [ ] **Step 5: Replace `src/styles.css`**

```css
@tailwind base;
@tailwind components;
@tailwind utilities;

:root {
  color: #171717;
  background: #f8f6f1;
  font-synthesis: none;
  text-rendering: optimizeLegibility;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
}

body {
  margin: 0;
  min-width: 320px;
  min-height: 100vh;
  background: #f8f6f1;
}

button,
input,
select,
textarea {
  font: inherit;
}
```

- [ ] **Step 6: Add Vitest config to `vite.config.ts`**

```ts
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig({
  plugins: [react()],
  test: {
    environment: "jsdom",
    setupFiles: "./src/test/setup.ts",
    globals: true
  }
});
```

- [ ] **Step 7: Create `src/test/setup.ts`**

```ts
import "@testing-library/jest-dom/vitest";
```

- [ ] **Step 8: Run baseline test/build**

Run:

```powershell
npm run build
```

Expected:

```text
✓ built in ...
```

### Task 2: Define Domain Models and Seed Data

**Files:**

- Create: `src/domain/types.ts`
- Create: `src/domain/sampleData.ts`
- Test: `src/domain/sampleData.test.ts`

- [ ] **Step 1: Create `src/domain/types.ts`**

```ts
export type ReferenceCategory = "event_poster" | "social_cover" | "portfolio_cover";

export type Reference = {
  id: string;
  title: string;
  imageUrl: string;
  category: ReferenceCategory;
  source?: string;
  userNote?: string;
  analysisId?: string;
  createdAt: string;
};

export type VisualAnalysis = {
  id: string;
  referenceId: string;
  composition: string;
  colorPalette: string[];
  colorDescription: string;
  typography: string;
  informationHierarchy: string;
  moodTags: string[];
  styleTags: string[];
  usageScenario: string;
  reusablePatterns: string[];
  avoidPatterns: string[];
};

export type TasteProfile = {
  id: string;
  layoutPreferences: string[];
  colorPreferences: string[];
  typographyPreferences: string[];
  moodPreferences: string[];
  informationDensity: "low" | "medium" | "high";
  negativePreferences: string[];
  evidenceReferenceIds: string[];
  updatedAt: string;
};

export type PromptTemplate = {
  id: string;
  scenario: string;
  goal: string;
  prompt: string;
  negativePrompt: string;
  basedOnProfileId: string;
  basedOnReferenceIds: string[];
  createdAt: string;
};

export type FeedbackTag =
  | "too_cluttered"
  | "text_unreadable"
  | "wrong_mood"
  | "color_mismatch"
  | "layout_mismatch"
  | "good_direction";

export type GenerationFeedback = {
  id: string;
  promptTemplateId: string;
  resultImageUrl?: string;
  rating: "like" | "dislike" | "mixed";
  feedbackTags: FeedbackTag[];
  note?: string;
  createdAt: string;
};

export type TasteOSState = {
  references: Reference[];
  analyses: VisualAnalysis[];
  profile: TasteProfile;
  prompts: PromptTemplate[];
  feedback: GenerationFeedback[];
};
```

- [ ] **Step 2: Create `src/domain/sampleData.ts`**

Use remote placeholder images so the demo works without bundling local assets.

```ts
import type { TasteOSState } from "./types";

export const seedState: TasteOSState = {
  references: [
    {
      id: "ref-campus-ai",
      title: "Campus AI Talk Poster",
      imageUrl: "https://images.unsplash.com/photo-1516321318423-f06f85e504b3?auto=format&fit=crop&w=900&q=80",
      category: "event_poster",
      source: "Unsplash demo image",
      userNote: "喜欢清晰标题和冷静科技感。",
      analysisId: "analysis-campus-ai",
      createdAt: "2026-06-14T00:00:00.000Z"
    },
    {
      id: "ref-editorial",
      title: "Editorial Project Cover",
      imageUrl: "https://images.unsplash.com/photo-1497366754035-f200968a6e72?auto=format&fit=crop&w=900&q=80",
      category: "portfolio_cover",
      source: "Unsplash demo image",
      userNote: "喜欢留白、网格和克制的高级感。",
      analysisId: "analysis-editorial",
      createdAt: "2026-06-14T00:05:00.000Z"
    },
    {
      id: "ref-social",
      title: "Bold Social Cover",
      imageUrl: "https://images.unsplash.com/photo-1500530855697-b586d89ba3ee?auto=format&fit=crop&w=900&q=80",
      category: "social_cover",
      source: "Unsplash demo image",
      userNote: "喜欢强对比和一眼能看到主题。",
      analysisId: "analysis-social",
      createdAt: "2026-06-14T00:10:00.000Z"
    }
  ],
  analyses: [
    {
      id: "analysis-campus-ai",
      referenceId: "ref-campus-ai",
      composition: "中心视觉焦点明确，标题区域适合放在上方或左侧，整体适合活动传播。",
      colorPalette: ["#0f172a", "#38bdf8", "#f8fafc"],
      colorDescription: "冷色科技感，高明度文字适合形成强对比。",
      typography: "适合使用粗体无衬线标题，辅助信息保持小字号但需要高可读性。",
      informationHierarchy: "标题优先，其次是时间地点，再是报名或行动引导。",
      moodTags: ["科技", "冷静", "专业"],
      styleTags: ["强标题", "冷色", "活动海报"],
      usageScenario: "校园讲座或 AI 主题活动。",
      reusablePatterns: ["大标题优先", "冷色科技背景", "单一视觉焦点"],
      avoidPatterns: ["过多装饰元素", "低对比小字"]
    },
    {
      id: "analysis-editorial",
      referenceId: "ref-editorial",
      composition: "留白明显，结构克制，适合项目封面和作品集入口。",
      colorPalette: ["#f8f6f1", "#171717", "#c8b6a6"],
      colorDescription: "低饱和中性色，强调安静、理性和编辑感。",
      typography: "适合使用简洁无衬线字体或轻微编辑感衬线字体。",
      informationHierarchy: "标题和副标题需要形成明确尺寸差，避免元素平均分布。",
      moodTags: ["克制", "高级", "编辑感"],
      styleTags: ["留白", "网格", "低饱和"],
      usageScenario: "作品集封面或项目案例页封面。",
      reusablePatterns: ["大面积留白", "低饱和配色", "网格对齐"],
      avoidPatterns: ["强烈渐变", "复杂背景"]
    },
    {
      id: "analysis-social",
      referenceId: "ref-social",
      composition: "视觉冲击强，适合在信息流中快速吸引注意。",
      colorPalette: ["#111827", "#e95034", "#fef3c7"],
      colorDescription: "深色背景搭配暖色强调，适合做社媒封面的第一视觉。",
      typography: "标题需要足够大，辅助文字不宜超过两层。",
      informationHierarchy: "主标题和主视觉应在首屏 1 秒内被识别。",
      moodTags: ["热烈", "直接", "年轻"],
      styleTags: ["高对比", "大标题", "社媒封面"],
      usageScenario: "小红书封面、活动预告、内容专题封面。",
      reusablePatterns: ["高对比标题", "强视觉焦点", "少量强调色"],
      avoidPatterns: ["信息过密", "标题不突出"]
    }
  ],
  profile: {
    id: "profile-demo",
    layoutPreferences: ["大标题优先", "单一视觉焦点", "网格对齐", "留白明确"],
    colorPreferences: ["高对比", "低饱和中性色", "冷色科技感", "少量强调色"],
    typographyPreferences: ["粗体无衬线标题", "清晰层级", "辅助信息保持克制"],
    moodPreferences: ["克制", "专业", "编辑感", "年轻"],
    informationDensity: "medium",
    negativePreferences: ["文字不可读", "装饰过多", "信息过密"],
    evidenceReferenceIds: ["ref-campus-ai", "ref-editorial", "ref-social"],
    updatedAt: "2026-06-14T00:15:00.000Z"
  },
  prompts: [],
  feedback: []
};
```

- [ ] **Step 3: Write `src/domain/sampleData.test.ts`**

```ts
import { describe, expect, it } from "vitest";
import { seedState } from "./sampleData";

describe("seedState", () => {
  it("contains references with matching analysis records", () => {
    const analysisIds = new Set(seedState.analyses.map((analysis) => analysis.id));

    for (const reference of seedState.references) {
      expect(reference.analysisId).toBeDefined();
      expect(analysisIds.has(reference.analysisId as string)).toBe(true);
    }
  });

  it("contains a taste profile with evidence references", () => {
    const referenceIds = new Set(seedState.references.map((reference) => reference.id));

    expect(seedState.profile.evidenceReferenceIds.length).toBeGreaterThan(0);
    for (const referenceId of seedState.profile.evidenceReferenceIds) {
      expect(referenceIds.has(referenceId)).toBe(true);
    }
  });
});
```

- [ ] **Step 4: Run tests**

Run:

```powershell
npx vitest run src/domain/sampleData.test.ts
```

Expected:

```text
✓ src/domain/sampleData.test.ts
```

### Task 3: Implement localStorage Repository

**Files:**

- Create: `src/domain/storage.ts`
- Test: `src/domain/storage.test.ts`

- [ ] **Step 1: Write `src/domain/storage.test.ts`**

```ts
import { beforeEach, describe, expect, it } from "vitest";
import { loadState, resetState, saveState } from "./storage";
import { seedState } from "./sampleData";

describe("storage", () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it("loads seed state when storage is empty", () => {
    const state = loadState();

    expect(state.references.length).toBe(seedState.references.length);
    expect(state.profile.id).toBe(seedState.profile.id);
  });

  it("saves and reloads state", () => {
    const nextState = {
      ...seedState,
      references: seedState.references.slice(0, 1)
    };

    saveState(nextState);

    expect(loadState().references).toHaveLength(1);
  });

  it("resets state back to seed data", () => {
    saveState({ ...seedState, references: [] });
    const reset = resetState();

    expect(reset.references.length).toBe(seedState.references.length);
  });
});
```

- [ ] **Step 2: Run test to verify failure**

Run:

```powershell
npx vitest run src/domain/storage.test.ts
```

Expected:

```text
FAIL  src/domain/storage.test.ts
Cannot find module './storage'
```

- [ ] **Step 3: Create `src/domain/storage.ts`**

```ts
import { seedState } from "./sampleData";
import type { TasteOSState } from "./types";

const STORAGE_KEY = "tasteos:mvp-state";

export function loadState(): TasteOSState {
  const raw = localStorage.getItem(STORAGE_KEY);

  if (!raw) {
    return seedState;
  }

  try {
    return JSON.parse(raw) as TasteOSState;
  } catch {
    return seedState;
  }
}

export function saveState(state: TasteOSState): void {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
}

export function resetState(): TasteOSState {
  localStorage.removeItem(STORAGE_KEY);
  return seedState;
}
```

- [ ] **Step 4: Run tests**

Run:

```powershell
npx vitest run src/domain/storage.test.ts
```

Expected:

```text
✓ src/domain/storage.test.ts
```

### Task 4: Implement Taste Engine

**Files:**

- Create: `src/services/tasteEngine.ts`
- Test: `src/services/tasteEngine.test.ts`

- [ ] **Step 1: Write `src/services/tasteEngine.test.ts`**

```ts
import { describe, expect, it } from "vitest";
import { generateAnalysis, generatePromptTemplate, generateTasteProfile } from "./tasteEngine";
import { seedState } from "../domain/sampleData";

describe("tasteEngine", () => {
  it("generates a visual analysis from a reference", () => {
    const analysis = generateAnalysis(seedState.references[0]);

    expect(analysis.referenceId).toBe(seedState.references[0].id);
    expect(analysis.styleTags.length).toBeGreaterThan(0);
    expect(analysis.reusablePatterns.length).toBeGreaterThan(0);
  });

  it("generates a taste profile from analyses", () => {
    const profile = generateTasteProfile(seedState.references, seedState.analyses);

    expect(profile.evidenceReferenceIds.length).toBe(seedState.references.length);
    expect(profile.layoutPreferences.length).toBeGreaterThan(0);
    expect(profile.negativePreferences).toContain("文字不可读");
  });

  it("generates a prompt template with negative prompt", () => {
    const prompt = generatePromptTemplate({
      scenario: "校园活动海报",
      goal: "AI 分享会",
      profile: seedState.profile,
      references: seedState.references
    });

    expect(prompt.prompt).toContain("AI 分享会");
    expect(prompt.prompt).toContain("校园活动海报");
    expect(prompt.negativePrompt).toContain("unreadable text");
  });
});
```

- [ ] **Step 2: Run test to verify failure**

Run:

```powershell
npx vitest run src/services/tasteEngine.test.ts
```

Expected:

```text
FAIL  src/services/tasteEngine.test.ts
Cannot find module './tasteEngine'
```

- [ ] **Step 3: Create `src/services/tasteEngine.ts`**

```ts
import type { PromptTemplate, Reference, TasteProfile, VisualAnalysis } from "../domain/types";

function unique(values: string[]): string[] {
  return Array.from(new Set(values)).filter(Boolean);
}

export function generateAnalysis(reference: Reference): VisualAnalysis {
  const isSocial = reference.category === "social_cover";
  const isPortfolio = reference.category === "portfolio_cover";

  return {
    id: `analysis-${reference.id}`,
    referenceId: reference.id,
    composition: isPortfolio
      ? "留白明确，适合用网格和标题层级建立作品集入口。"
      : isSocial
        ? "主视觉需要快速抓住注意，适合强标题和高对比布局。"
        : "信息需要按标题、时间地点、行动引导组织，适合活动传播。",
    colorPalette: isPortfolio ? ["#f8f6f1", "#171717", "#c8b6a6"] : ["#111827", "#e95034", "#fef3c7"],
    colorDescription: isPortfolio ? "低饱和中性色，强调克制和编辑感。" : "深色背景搭配强调色，形成较强视觉冲击。",
    typography: "适合使用可读性强的标题字体，辅助信息保持清晰层级。",
    informationHierarchy: "标题应是第一视觉层级，辅助信息控制在两层以内。",
    moodTags: isPortfolio ? ["克制", "高级", "编辑感"] : ["直接", "年轻", "有冲击力"],
    styleTags: isPortfolio ? ["留白", "网格", "低饱和"] : ["大标题", "高对比", "强视觉焦点"],
    usageScenario: isPortfolio ? "作品集或项目封面。" : isSocial ? "社媒封面或内容专题。" : "活动海报或讲座宣传。",
    reusablePatterns: isPortfolio ? ["大面积留白", "网格对齐", "低饱和配色"] : ["大标题优先", "单一视觉焦点", "少量强调色"],
    avoidPatterns: ["文字不可读", "信息过密", "装饰过多"]
  };
}

export function generateTasteProfile(references: Reference[], analyses: VisualAnalysis[]): TasteProfile {
  return {
    id: "profile-current",
    layoutPreferences: unique(analyses.flatMap((analysis) => analysis.reusablePatterns).slice(0, 6)),
    colorPreferences: unique(analyses.map((analysis) => analysis.colorDescription).slice(0, 4)),
    typographyPreferences: unique(analyses.map((analysis) => analysis.typography).slice(0, 4)),
    moodPreferences: unique(analyses.flatMap((analysis) => analysis.moodTags).slice(0, 6)),
    informationDensity: "medium",
    negativePreferences: unique(analyses.flatMap((analysis) => analysis.avoidPatterns)),
    evidenceReferenceIds: references.map((reference) => reference.id),
    updatedAt: new Date().toISOString()
  };
}

export function generatePromptTemplate(input: {
  scenario: string;
  goal: string;
  profile: TasteProfile;
  references: Reference[];
}): PromptTemplate {
  const layout = input.profile.layoutPreferences.slice(0, 3).join(", ");
  const mood = input.profile.moodPreferences.slice(0, 3).join(", ");
  const color = input.profile.colorPreferences[0] ?? "high contrast but restrained color palette";

  return {
    id: `prompt-${Date.now()}`,
    scenario: input.scenario,
    goal: input.goal,
    prompt: [
      `Create a vertical ${input.scenario} for ${input.goal}.`,
      `Use a visual direction inspired by these personal taste patterns: ${layout}.`,
      `Color direction: ${color}.`,
      "Typography should use a bold readable headline, clear supporting text, and strong hierarchy.",
      "Composition should make the main topic readable within one second.",
      `Mood: ${mood}.`,
      "Keep the design suitable for poster or social visual usage, with clear space for title, date, location, and call-to-action."
    ].join(" "),
    negativePrompt: "unreadable text, cluttered layout, excessive decoration, random elements, low contrast, messy typography",
    basedOnProfileId: input.profile.id,
    basedOnReferenceIds: input.references.map((reference) => reference.id),
    createdAt: new Date().toISOString()
  };
}
```

- [ ] **Step 4: Run tests**

Run:

```powershell
npx vitest run src/services/tasteEngine.test.ts
```

Expected:

```text
✓ src/services/tasteEngine.test.ts
```

### Task 5: Build App Shell and Navigation

**Files:**

- Modify: `src/main.tsx`
- Modify: `src/App.tsx`
- Create: `src/components/AppShell.tsx`
- Test: `src/App.test.tsx`

- [ ] **Step 1: Replace `src/main.tsx`**

```tsx
import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App";
import "./styles.css";

ReactDOM.createRoot(document.getElementById("root") as HTMLElement).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
```

- [ ] **Step 2: Create `src/components/AppShell.tsx`**

```tsx
import type { ReactNode } from "react";

export type ViewKey = "library" | "profile" | "prompt" | "feedback";

type AppShellProps = {
  activeView: ViewKey;
  onViewChange: (view: ViewKey) => void;
  children: ReactNode;
};

const navItems: Array<{ key: ViewKey; label: string }> = [
  { key: "library", label: "案例库" },
  { key: "profile", label: "Taste Profile" },
  { key: "prompt", label: "Prompt Studio" },
  { key: "feedback", label: "结果反馈" }
];

export function AppShell({ activeView, onViewChange, children }: AppShellProps) {
  return (
    <div className="min-h-screen bg-paper text-ink">
      <header className="border-b border-line bg-paper/95">
        <div className="mx-auto flex max-w-7xl flex-col gap-5 px-5 py-6 md:flex-row md:items-end md:justify-between">
          <div>
            <p className="text-sm font-medium text-accent">TasteOS</p>
            <h1 className="mt-1 text-3xl font-semibold tracking-tight">个人审美 Prompt Studio</h1>
            <p className="mt-2 max-w-2xl text-sm leading-6 text-muted">
              从喜欢的海报参考中提取视觉偏好，再生成可复用的 AI 生图 prompt 模板。
            </p>
          </div>
          <nav className="flex flex-wrap gap-2">
            {navItems.map((item) => (
              <button
                key={item.key}
                type="button"
                onClick={() => onViewChange(item.key)}
                className={`rounded-md border px-3 py-2 text-sm transition ${
                  activeView === item.key
                    ? "border-ink bg-ink text-paper"
                    : "border-line bg-white/50 text-ink hover:border-ink"
                }`}
              >
                {item.label}
              </button>
            ))}
          </nav>
        </div>
      </header>
      <main className="mx-auto max-w-7xl px-5 py-6">{children}</main>
    </div>
  );
}
```

- [ ] **Step 3: Replace `src/App.tsx` with navigation shell**

```tsx
import { useState } from "react";
import { AppShell, type ViewKey } from "./components/AppShell";

export default function App() {
  const [activeView, setActiveView] = useState<ViewKey>("library");

  return (
    <AppShell activeView={activeView} onViewChange={setActiveView}>
      <section className="rounded-lg border border-line bg-white p-6">
        <h2 className="text-xl font-semibold">MVP 页面占位</h2>
        <p className="mt-2 text-sm text-muted">当前页面：{activeView}</p>
      </section>
    </AppShell>
  );
}
```

- [ ] **Step 4: Create `src/App.test.tsx`**

```tsx
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it } from "vitest";
import App from "./App";

describe("App", () => {
  it("renders the app title and switches navigation", async () => {
    render(<App />);

    expect(screen.getByText("个人审美 Prompt Studio")).toBeInTheDocument();

    await userEvent.click(screen.getByRole("button", { name: "Prompt Studio" }));

    expect(screen.getByText("当前页面：prompt")).toBeInTheDocument();
  });
});
```

- [ ] **Step 5: Run tests**

Run:

```powershell
npx vitest run src/App.test.tsx
```

Expected:

```text
✓ src/App.test.tsx
```

### Task 6: Build Reference Library and Detail View

**Files:**

- Create: `src/components/ReferenceLibrary.tsx`
- Create: `src/components/ReferenceDetail.tsx`
- Modify: `src/App.tsx`
- Test: `src/components/ReferenceLibrary.test.tsx`

- [ ] **Step 1: Create `src/components/ReferenceLibrary.tsx`**

```tsx
import type { Reference, VisualAnalysis } from "../domain/types";

type ReferenceLibraryProps = {
  references: Reference[];
  analyses: VisualAnalysis[];
  selectedReferenceId: string | null;
  onSelectReference: (referenceId: string) => void;
};

const categoryLabel: Record<Reference["category"], string> = {
  event_poster: "活动海报",
  social_cover: "社媒封面",
  portfolio_cover: "项目封面"
};

export function ReferenceLibrary({
  references,
  analyses,
  selectedReferenceId,
  onSelectReference
}: ReferenceLibraryProps) {
  return (
    <div className="grid gap-4 lg:grid-cols-[360px_1fr]">
      <section className="rounded-lg border border-line bg-white p-4">
        <div className="mb-4 flex items-center justify-between">
          <div>
            <h2 className="text-lg font-semibold">案例库</h2>
            <p className="text-sm text-muted">上传和管理视觉参考。</p>
          </div>
          <span className="rounded-full bg-paper px-3 py-1 text-xs text-muted">{references.length} 张</span>
        </div>
        <div className="space-y-3">
          {references.map((reference) => {
            const analysis = analyses.find((item) => item.id === reference.analysisId);
            const selected = reference.id === selectedReferenceId;

            return (
              <button
                key={reference.id}
                type="button"
                onClick={() => onSelectReference(reference.id)}
                className={`w-full rounded-md border p-3 text-left transition ${
                  selected ? "border-ink bg-paper" : "border-line bg-white hover:border-ink"
                }`}
              >
                <div className="flex gap-3">
                  <img
                    src={reference.imageUrl}
                    alt={reference.title}
                    className="h-20 w-16 rounded object-cover"
                  />
                  <div className="min-w-0">
                    <p className="font-medium">{reference.title}</p>
                    <p className="mt-1 text-xs text-muted">{categoryLabel[reference.category]}</p>
                    <div className="mt-2 flex flex-wrap gap-1">
                      {analysis?.styleTags.slice(0, 3).map((tag) => (
                        <span key={tag} className="rounded-full bg-paper px-2 py-0.5 text-xs text-muted">
                          {tag}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>
              </button>
            );
          })}
        </div>
      </section>
    </div>
  );
}
```

- [ ] **Step 2: Create `src/components/ReferenceDetail.tsx`**

```tsx
import type { Reference, VisualAnalysis } from "../domain/types";

type ReferenceDetailProps = {
  reference?: Reference;
  analysis?: VisualAnalysis;
};

export function ReferenceDetail({ reference, analysis }: ReferenceDetailProps) {
  if (!reference || !analysis) {
    return (
      <section className="rounded-lg border border-line bg-white p-6">
        <h2 className="text-lg font-semibold">选择一个案例</h2>
        <p className="mt-2 text-sm text-muted">从左侧选择参考图查看视觉拆解。</p>
      </section>
    );
  }

  return (
    <section className="rounded-lg border border-line bg-white p-4">
      <div className="grid gap-5 md:grid-cols-[320px_1fr]">
        <img src={reference.imageUrl} alt={reference.title} className="aspect-[3/4] w-full rounded-md object-cover" />
        <div>
          <p className="text-sm text-accent">{analysis.usageScenario}</p>
          <h2 className="mt-1 text-2xl font-semibold">{reference.title}</h2>
          {reference.userNote ? <p className="mt-2 text-sm text-muted">我的备注：{reference.userNote}</p> : null}

          <div className="mt-5 grid gap-3">
            <AnalysisBlock title="构图" text={analysis.composition} />
            <AnalysisBlock title="色彩" text={analysis.colorDescription} />
            <AnalysisBlock title="字体" text={analysis.typography} />
            <AnalysisBlock title="信息层级" text={analysis.informationHierarchy} />
          </div>

          <div className="mt-5">
            <h3 className="text-sm font-semibold">可复用模式</h3>
            <div className="mt-2 flex flex-wrap gap-2">
              {analysis.reusablePatterns.map((pattern) => (
                <span key={pattern} className="rounded-full bg-paper px-3 py-1 text-sm">
                  {pattern}
                </span>
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

function AnalysisBlock({ title, text }: { title: string; text: string }) {
  return (
    <div className="rounded-md border border-line bg-paper/50 p-3">
      <h3 className="text-sm font-semibold">{title}</h3>
      <p className="mt-1 text-sm leading-6 text-muted">{text}</p>
    </div>
  );
}
```

- [ ] **Step 3: Modify `src/App.tsx` to render library/detail**

```tsx
import { useMemo, useState } from "react";
import { AppShell, type ViewKey } from "./components/AppShell";
import { ReferenceDetail } from "./components/ReferenceDetail";
import { ReferenceLibrary } from "./components/ReferenceLibrary";
import { seedState } from "./domain/sampleData";

export default function App() {
  const [activeView, setActiveView] = useState<ViewKey>("library");
  const [selectedReferenceId, setSelectedReferenceId] = useState<string | null>(seedState.references[0]?.id ?? null);

  const selectedReference = seedState.references.find((reference) => reference.id === selectedReferenceId);
  const selectedAnalysis = useMemo(
    () => seedState.analyses.find((analysis) => analysis.id === selectedReference?.analysisId),
    [selectedReference]
  );

  return (
    <AppShell activeView={activeView} onViewChange={setActiveView}>
      {activeView === "library" ? (
        <div className="grid gap-4 lg:grid-cols-[360px_1fr]">
          <ReferenceLibrary
            references={seedState.references}
            analyses={seedState.analyses}
            selectedReferenceId={selectedReferenceId}
            onSelectReference={setSelectedReferenceId}
          />
          <ReferenceDetail reference={selectedReference} analysis={selectedAnalysis} />
        </div>
      ) : (
        <section className="rounded-lg border border-line bg-white p-6">
          <h2 className="text-xl font-semibold">MVP 页面占位</h2>
          <p className="mt-2 text-sm text-muted">当前页面：{activeView}</p>
        </section>
      )}
    </AppShell>
  );
}
```

- [ ] **Step 4: Create `src/components/ReferenceLibrary.test.tsx`**

```tsx
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { seedState } from "../domain/sampleData";
import { ReferenceLibrary } from "./ReferenceLibrary";

describe("ReferenceLibrary", () => {
  it("renders references and handles selection", async () => {
    const onSelectReference = vi.fn();

    render(
      <ReferenceLibrary
        references={seedState.references}
        analyses={seedState.analyses}
        selectedReferenceId={seedState.references[0].id}
        onSelectReference={onSelectReference}
      />
    );

    await userEvent.click(screen.getByRole("button", { name: /Bold Social Cover/i }));

    expect(onSelectReference).toHaveBeenCalledWith("ref-social");
  });
});
```

- [ ] **Step 5: Run tests**

Run:

```powershell
npx vitest run src/components/ReferenceLibrary.test.tsx src/App.test.tsx
```

Expected:

```text
✓ src/components/ReferenceLibrary.test.tsx
✓ src/App.test.tsx
```

### Task 7: Build Taste Profile Page

**Files:**

- Create: `src/components/TasteProfilePanel.tsx`
- Modify: `src/App.tsx`
- Test: `src/components/TasteProfilePanel.test.tsx`

- [ ] **Step 1: Create `src/components/TasteProfilePanel.tsx`**

```tsx
import type { Reference, TasteProfile } from "../domain/types";

type TasteProfilePanelProps = {
  profile: TasteProfile;
  references: Reference[];
};

export function TasteProfilePanel({ profile, references }: TasteProfilePanelProps) {
  const evidence = references.filter((reference) => profile.evidenceReferenceIds.includes(reference.id));

  return (
    <section className="grid gap-4 lg:grid-cols-[1fr_320px]">
      <div className="rounded-lg border border-line bg-white p-5">
        <p className="text-sm text-accent">Taste Profile</p>
        <h2 className="mt-1 text-2xl font-semibold">你的视觉偏好画像</h2>
        <p className="mt-2 text-sm text-muted">
          基于 {profile.evidenceReferenceIds.length} 张参考图聚合生成，用于指导后续 prompt 模板。
        </p>

        <div className="mt-6 grid gap-4 md:grid-cols-2">
          <PreferenceBlock title="版式偏好" items={profile.layoutPreferences} />
          <PreferenceBlock title="色彩偏好" items={profile.colorPreferences} />
          <PreferenceBlock title="字体偏好" items={profile.typographyPreferences} />
          <PreferenceBlock title="情绪偏好" items={profile.moodPreferences} />
        </div>

        <div className="mt-5 rounded-md border border-line bg-paper/50 p-4">
          <h3 className="font-semibold">需要避免</h3>
          <div className="mt-2 flex flex-wrap gap-2">
            {profile.negativePreferences.map((item) => (
              <span key={item} className="rounded-full bg-white px-3 py-1 text-sm text-muted">
                {item}
              </span>
            ))}
          </div>
        </div>
      </div>

      <aside className="rounded-lg border border-line bg-white p-5">
        <h3 className="font-semibold">证据案例</h3>
        <div className="mt-4 space-y-3">
          {evidence.map((reference) => (
            <div key={reference.id} className="flex gap-3">
              <img src={reference.imageUrl} alt={reference.title} className="h-16 w-12 rounded object-cover" />
              <div>
                <p className="text-sm font-medium">{reference.title}</p>
                <p className="mt-1 text-xs text-muted">{reference.userNote}</p>
              </div>
            </div>
          ))}
        </div>
      </aside>
    </section>
  );
}

function PreferenceBlock({ title, items }: { title: string; items: string[] }) {
  return (
    <div className="rounded-md border border-line bg-paper/50 p-4">
      <h3 className="font-semibold">{title}</h3>
      <ul className="mt-3 space-y-2 text-sm text-muted">
        {items.map((item) => (
          <li key={item}>• {item}</li>
        ))}
      </ul>
    </div>
  );
}
```

- [ ] **Step 2: Modify `src/App.tsx` profile branch**

Add import:

```ts
import { TasteProfilePanel } from "./components/TasteProfilePanel";
```

Replace placeholder rendering with:

```tsx
{activeView === "library" ? (
  <div className="grid gap-4 lg:grid-cols-[360px_1fr]">
    <ReferenceLibrary
      references={seedState.references}
      analyses={seedState.analyses}
      selectedReferenceId={selectedReferenceId}
      onSelectReference={setSelectedReferenceId}
    />
    <ReferenceDetail reference={selectedReference} analysis={selectedAnalysis} />
  </div>
) : activeView === "profile" ? (
  <TasteProfilePanel profile={seedState.profile} references={seedState.references} />
) : (
  <section className="rounded-lg border border-line bg-white p-6">
    <h2 className="text-xl font-semibold">MVP 页面占位</h2>
    <p className="mt-2 text-sm text-muted">当前页面：{activeView}</p>
  </section>
)}
```

- [ ] **Step 3: Create `src/components/TasteProfilePanel.test.tsx`**

```tsx
import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { seedState } from "../domain/sampleData";
import { TasteProfilePanel } from "./TasteProfilePanel";

describe("TasteProfilePanel", () => {
  it("renders profile preferences and evidence references", () => {
    render(<TasteProfilePanel profile={seedState.profile} references={seedState.references} />);

    expect(screen.getByText("你的视觉偏好画像")).toBeInTheDocument();
    expect(screen.getByText("版式偏好")).toBeInTheDocument();
    expect(screen.getByText("Campus AI Talk Poster")).toBeInTheDocument();
  });
});
```

- [ ] **Step 4: Run tests**

Run:

```powershell
npx vitest run src/components/TasteProfilePanel.test.tsx src/App.test.tsx
```

Expected:

```text
✓ src/components/TasteProfilePanel.test.tsx
✓ src/App.test.tsx
```

### Task 8: Build Prompt Studio

**Files:**

- Create: `src/components/PromptStudio.tsx`
- Modify: `src/App.tsx`
- Test: `src/components/PromptStudio.test.tsx`

- [ ] **Step 1: Create `src/components/PromptStudio.tsx`**

```tsx
import { useState } from "react";
import type { PromptTemplate, Reference, TasteProfile } from "../domain/types";
import { generatePromptTemplate } from "../services/tasteEngine";

type PromptStudioProps = {
  profile: TasteProfile;
  references: Reference[];
  onSavePrompt: (prompt: PromptTemplate) => void;
};

const scenarios = ["校园活动海报", "音乐 / 展览海报", "社媒封面", "作品集项目封面", "品牌活动视觉"];

export function PromptStudio({ profile, references, onSavePrompt }: PromptStudioProps) {
  const [scenario, setScenario] = useState(scenarios[0]);
  const [goal, setGoal] = useState("AI 创作分享会");
  const [generated, setGenerated] = useState<PromptTemplate | null>(null);

  function handleGenerate() {
    const nextPrompt = generatePromptTemplate({ scenario, goal, profile, references });
    setGenerated(nextPrompt);
    onSavePrompt(nextPrompt);
  }

  return (
    <section className="grid gap-4 lg:grid-cols-[360px_1fr]">
      <div className="rounded-lg border border-line bg-white p-5">
        <h2 className="text-xl font-semibold">Prompt Studio</h2>
        <p className="mt-2 text-sm text-muted">选择使用场景，基于 Taste Profile 生成可复用 prompt。</p>

        <label className="mt-5 block text-sm font-medium" htmlFor="scenario">
          使用场景
        </label>
        <select
          id="scenario"
          value={scenario}
          onChange={(event) => setScenario(event.target.value)}
          className="mt-2 w-full rounded-md border border-line bg-paper px-3 py-2"
        >
          {scenarios.map((item) => (
            <option key={item} value={item}>
              {item}
            </option>
          ))}
        </select>

        <label className="mt-4 block text-sm font-medium" htmlFor="goal">
          生成目标
        </label>
        <input
          id="goal"
          value={goal}
          onChange={(event) => setGoal(event.target.value)}
          className="mt-2 w-full rounded-md border border-line bg-paper px-3 py-2"
        />

        <button
          type="button"
          onClick={handleGenerate}
          className="mt-5 w-full rounded-md bg-ink px-4 py-2 text-paper"
        >
          生成 Prompt
        </button>
      </div>

      <div className="rounded-lg border border-line bg-white p-5">
        <h3 className="font-semibold">生成结果</h3>
        {generated ? (
          <div className="mt-4 space-y-4">
            <div>
              <p className="text-sm font-medium">Prompt</p>
              <pre className="mt-2 whitespace-pre-wrap rounded-md bg-paper p-4 text-sm leading-6">{generated.prompt}</pre>
            </div>
            <div>
              <p className="text-sm font-medium">Negative Prompt</p>
              <pre className="mt-2 whitespace-pre-wrap rounded-md bg-paper p-4 text-sm leading-6">
                {generated.negativePrompt}
              </pre>
            </div>
          </div>
        ) : (
          <p className="mt-3 text-sm text-muted">还没有生成 prompt。</p>
        )}
      </div>
    </section>
  );
}
```

- [ ] **Step 2: Modify `src/App.tsx` to store prompts and render prompt page**

Add state:

```ts
const [prompts, setPrompts] = useState(seedState.prompts);
```

Add branch:

```tsx
) : activeView === "prompt" ? (
  <PromptStudio
    profile={seedState.profile}
    references={seedState.references}
    onSavePrompt={(prompt) => setPrompts((current) => [prompt, ...current])}
  />
) : (
```

Add import:

```ts
import { PromptStudio } from "./components/PromptStudio";
```

- [ ] **Step 3: Create `src/components/PromptStudio.test.tsx`**

```tsx
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { seedState } from "../domain/sampleData";
import { PromptStudio } from "./PromptStudio";

describe("PromptStudio", () => {
  it("generates and saves a prompt", async () => {
    const onSavePrompt = vi.fn();

    render(<PromptStudio profile={seedState.profile} references={seedState.references} onSavePrompt={onSavePrompt} />);

    await userEvent.clear(screen.getByLabelText("生成目标"));
    await userEvent.type(screen.getByLabelText("生成目标"), "设计工作坊");
    await userEvent.click(screen.getByRole("button", { name: "生成 Prompt" }));

    expect(screen.getByText(/设计工作坊/)).toBeInTheDocument();
    expect(screen.getByText("Negative Prompt")).toBeInTheDocument();
    expect(onSavePrompt).toHaveBeenCalledTimes(1);
  });
});
```

- [ ] **Step 4: Run tests**

Run:

```powershell
npx vitest run src/components/PromptStudio.test.tsx
```

Expected:

```text
✓ src/components/PromptStudio.test.tsx
```

### Task 9: Build Feedback Panel

**Files:**

- Create: `src/components/FeedbackPanel.tsx`
- Modify: `src/App.tsx`
- Test: `src/components/FeedbackPanel.test.tsx`

- [ ] **Step 1: Create `src/components/FeedbackPanel.tsx`**

```tsx
import { useState } from "react";
import type { FeedbackTag, GenerationFeedback, PromptTemplate } from "../domain/types";

type FeedbackPanelProps = {
  prompts: PromptTemplate[];
  onSaveFeedback: (feedback: GenerationFeedback) => void;
};

const feedbackTags: Array<{ value: FeedbackTag; label: string }> = [
  { value: "too_cluttered", label: "太杂乱" },
  { value: "text_unreadable", label: "文字不可读" },
  { value: "wrong_mood", label: "情绪不对" },
  { value: "color_mismatch", label: "色彩不符合" },
  { value: "layout_mismatch", label: "构图不符合" },
  { value: "good_direction", label: "方向正确" }
];

export function FeedbackPanel({ prompts, onSaveFeedback }: FeedbackPanelProps) {
  const [promptId, setPromptId] = useState(prompts[0]?.id ?? "");
  const [rating, setRating] = useState<GenerationFeedback["rating"]>("mixed");
  const [selectedTags, setSelectedTags] = useState<FeedbackTag[]>([]);
  const [note, setNote] = useState("");
  const [saved, setSaved] = useState(false);

  function toggleTag(tag: FeedbackTag) {
    setSelectedTags((current) => (current.includes(tag) ? current.filter((item) => item !== tag) : [...current, tag]));
  }

  function handleSubmit() {
    if (!promptId) {
      return;
    }

    onSaveFeedback({
      id: `feedback-${Date.now()}`,
      promptTemplateId: promptId,
      rating,
      feedbackTags: selectedTags,
      note,
      createdAt: new Date().toISOString()
    });
    setSaved(true);
  }

  if (prompts.length === 0) {
    return (
      <section className="rounded-lg border border-line bg-white p-6">
        <h2 className="text-xl font-semibold">结果反馈</h2>
        <p className="mt-2 text-sm text-muted">请先在 Prompt Studio 生成一个 prompt，再记录结果反馈。</p>
      </section>
    );
  }

  return (
    <section className="rounded-lg border border-line bg-white p-5">
      <h2 className="text-xl font-semibold">结果反馈</h2>
      <p className="mt-2 text-sm text-muted">记录生图结果是否符合你的审美，用于后续优化 prompt。</p>

      <label className="mt-5 block text-sm font-medium" htmlFor="prompt">
        来源 Prompt
      </label>
      <select
        id="prompt"
        value={promptId}
        onChange={(event) => setPromptId(event.target.value)}
        className="mt-2 w-full rounded-md border border-line bg-paper px-3 py-2"
      >
        {prompts.map((prompt) => (
          <option key={prompt.id} value={prompt.id}>
            {prompt.scenario} - {prompt.goal}
          </option>
        ))}
      </select>

      <div className="mt-5">
        <p className="text-sm font-medium">整体评价</p>
        <div className="mt-2 flex gap-2">
          {(["like", "mixed", "dislike"] as const).map((item) => (
            <button
              key={item}
              type="button"
              onClick={() => setRating(item)}
              className={`rounded-md border px-3 py-2 text-sm ${
                rating === item ? "border-ink bg-ink text-paper" : "border-line bg-white"
              }`}
            >
              {item}
            </button>
          ))}
        </div>
      </div>

      <div className="mt-5">
        <p className="text-sm font-medium">问题标签</p>
        <div className="mt-2 flex flex-wrap gap-2">
          {feedbackTags.map((tag) => (
            <button
              key={tag.value}
              type="button"
              onClick={() => toggleTag(tag.value)}
              className={`rounded-full border px-3 py-1 text-sm ${
                selectedTags.includes(tag.value) ? "border-ink bg-paper" : "border-line bg-white"
              }`}
            >
              {tag.label}
            </button>
          ))}
        </div>
      </div>

      <label className="mt-5 block text-sm font-medium" htmlFor="note">
        备注
      </label>
      <textarea
        id="note"
        value={note}
        onChange={(event) => setNote(event.target.value)}
        className="mt-2 min-h-28 w-full rounded-md border border-line bg-paper px-3 py-2"
      />

      <button type="button" onClick={handleSubmit} className="mt-5 rounded-md bg-ink px-4 py-2 text-paper">
        保存反馈
      </button>

      {saved ? <p className="mt-3 text-sm text-accent">反馈已保存，后续 prompt 会参考这次结果。</p> : null}
    </section>
  );
}
```

- [ ] **Step 2: Modify `src/App.tsx` feedback branch**

Add state:

```ts
const [feedback, setFeedback] = useState(seedState.feedback);
```

Add import:

```ts
import { FeedbackPanel } from "./components/FeedbackPanel";
```

Add branch:

```tsx
) : activeView === "feedback" ? (
  <FeedbackPanel
    prompts={prompts}
    onSaveFeedback={(item) => setFeedback((current) => [item, ...current])}
  />
) : (
```

- [ ] **Step 3: Create `src/components/FeedbackPanel.test.tsx`**

```tsx
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { generatePromptTemplate } from "../services/tasteEngine";
import { seedState } from "../domain/sampleData";
import { FeedbackPanel } from "./FeedbackPanel";

describe("FeedbackPanel", () => {
  it("shows empty state when no prompts exist", () => {
    render(<FeedbackPanel prompts={[]} onSaveFeedback={vi.fn()} />);

    expect(screen.getByText("请先在 Prompt Studio 生成一个 prompt，再记录结果反馈。")).toBeInTheDocument();
  });

  it("saves feedback for a prompt", async () => {
    const onSaveFeedback = vi.fn();
    const prompt = generatePromptTemplate({
      scenario: "社媒封面",
      goal: "AI 工具分享",
      profile: seedState.profile,
      references: seedState.references
    });

    render(<FeedbackPanel prompts={[prompt]} onSaveFeedback={onSaveFeedback} />);

    await userEvent.click(screen.getByRole("button", { name: "方向正确" }));
    await userEvent.click(screen.getByRole("button", { name: "保存反馈" }));

    expect(onSaveFeedback).toHaveBeenCalledTimes(1);
    expect(screen.getByText("反馈已保存，后续 prompt 会参考这次结果。")).toBeInTheDocument();
  });
});
```

- [ ] **Step 4: Run tests**

Run:

```powershell
npx vitest run src/components/FeedbackPanel.test.tsx
```

Expected:

```text
✓ src/components/FeedbackPanel.test.tsx
```

### Task 10: Wire Persistence and Upload Flow

**Files:**

- Modify: `src/App.tsx`
- Modify: `src/components/ReferenceLibrary.tsx`
- Test: `src/App.test.tsx`

- [ ] **Step 1: Modify `ReferenceLibrary` props for upload**

Add prop:

```ts
onCreateReference: (input: { title: string; imageUrl: string; category: Reference["category"]; userNote: string }) => void;
```

Add a compact form above the reference list:

```tsx
<form
  className="mb-4 rounded-md border border-line bg-paper/60 p-3"
  onSubmit={(event) => {
    event.preventDefault();
    const form = event.currentTarget;
    const data = new FormData(form);
    onCreateReference({
      title: String(data.get("title") ?? ""),
      imageUrl: String(data.get("imageUrl") ?? ""),
      category: String(data.get("category") ?? "event_poster") as Reference["category"],
      userNote: String(data.get("userNote") ?? "")
    });
    form.reset();
  }}
>
  <input name="title" required placeholder="案例标题" className="mb-2 w-full rounded border border-line px-3 py-2 text-sm" />
  <input name="imageUrl" required placeholder="图片 URL" className="mb-2 w-full rounded border border-line px-3 py-2 text-sm" />
  <select name="category" className="mb-2 w-full rounded border border-line px-3 py-2 text-sm">
    <option value="event_poster">活动海报</option>
    <option value="social_cover">社媒封面</option>
    <option value="portfolio_cover">项目封面</option>
  </select>
  <textarea name="userNote" placeholder="为什么喜欢这张图" className="mb-2 w-full rounded border border-line px-3 py-2 text-sm" />
  <button type="submit" className="w-full rounded bg-ink px-3 py-2 text-sm text-paper">
    添加案例
  </button>
</form>
```

- [ ] **Step 2: Modify `src/App.tsx` to use local state and persistence**

Replace direct `seedState` rendering with:

```tsx
const [state, setState] = useState<TasteOSState>(() => loadState());
const [prompts, setPrompts] = useState(state.prompts);
const [feedback, setFeedback] = useState(state.feedback);
```

Add imports:

```ts
import type { Reference, TasteOSState } from "./domain/types";
import { loadState, saveState } from "./domain/storage";
import { generateAnalysis, generateTasteProfile } from "./services/tasteEngine";
```

Add helper:

```ts
function createReference(input: {
  title: string;
  imageUrl: string;
  category: Reference["category"];
  userNote: string;
}) {
  const reference: Reference = {
    id: `ref-${Date.now()}`,
    title: input.title,
    imageUrl: input.imageUrl,
    category: input.category,
    userNote: input.userNote,
    createdAt: new Date().toISOString()
  };
  const analysis = generateAnalysis(reference);
  const referenceWithAnalysis = { ...reference, analysisId: analysis.id };
  const nextReferences = [referenceWithAnalysis, ...state.references];
  const nextAnalyses = [analysis, ...state.analyses];
  const nextState = {
    ...state,
    references: nextReferences,
    analyses: nextAnalyses,
    profile: generateTasteProfile(nextReferences, nextAnalyses)
  };

  setState(nextState);
  saveState(nextState);
  setSelectedReferenceId(referenceWithAnalysis.id);
}
```

Use `state.references`, `state.analyses`, and `state.profile` throughout `App.tsx`.

- [ ] **Step 3: Update existing `App.test.tsx` for upload**

Add test:

```tsx
it("creates a new reference from the library form", async () => {
  render(<App />);

  await userEvent.type(screen.getByPlaceholderText("案例标题"), "New Poster");
  await userEvent.type(screen.getByPlaceholderText("图片 URL"), "https://example.com/poster.jpg");
  await userEvent.type(screen.getByPlaceholderText("为什么喜欢这张图"), "喜欢强烈标题。");
  await userEvent.click(screen.getByRole("button", { name: "添加案例" }));

  expect(screen.getByText("New Poster")).toBeInTheDocument();
});
```

- [ ] **Step 4: Run full test suite**

Run:

```powershell
npx vitest run
```

Expected:

```text
Test Files  ... passed
Tests       ... passed
```

### Task 11: Final Verification and Demo Polish

**Files:**

- Modify: `README.md`

- [ ] **Step 1: Create `README.md`**

```md
# TasteOS

TasteOS 是一个面向 AI 视觉创作者的个人审美 Prompt Studio。用户上传喜欢的海报、社媒封面或项目封面，系统分析构图、字体、色彩、信息层级和情绪氛围，生成个人 Taste Profile，并进一步生成可复用的 AI 生图 prompt 模板。

## 核心价值

AI 生图工具降低了视觉创作门槛，但很多用户仍然很难把“我喜欢这种感觉”转化为稳定 prompt。TasteOS 通过参考图分析、审美画像和反馈闭环，让用户的视觉偏好可以被沉淀和复用。

## MVP 功能

- 案例库：管理视觉参考图。
- 视觉分析卡：拆解构图、色彩、字体和信息层级。
- Taste Profile：聚合多张参考图形成个人审美画像。
- Prompt Studio：按场景生成 prompt 模板。
- 结果反馈：记录生成结果问题，优化后续 prompt。

## 技术栈

- Vite
- React
- TypeScript
- Tailwind CSS
- Vitest
- localStorage

## 本地运行

```bash
npm install
npm run dev
```

## 测试

```bash
npm run build
npx vitest run
```
```

- [ ] **Step 2: Run verification**

Run:

```powershell
npm run build
npx vitest run
```

Expected:

```text
✓ built in ...
Test Files  ... passed
Tests       ... passed
```

- [ ] **Step 3: Start dev server**

Run:

```powershell
npm run dev -- --host 127.0.0.1
```

Expected:

```text
Local: http://127.0.0.1:5173/
```

- [ ] **Step 4: Manual demo checklist**

Open `http://127.0.0.1:5173/` and verify:

- 案例库展示 3 张种子参考图。
- 点击参考图后，右侧分析卡更新。
- Taste Profile 页面展示版式、色彩、字体、情绪偏好。
- Prompt Studio 可以生成 prompt 和 negative prompt。
- 结果反馈在没有 prompt 时显示空状态。
- 生成 prompt 后进入结果反馈页，可以保存反馈。

## 4. Self-Review

Spec coverage:

- Reference library: Task 6 and Task 10.
- Visual analysis card: Task 6 and Task 4.
- Taste Profile: Task 7 and Task 4.
- Prompt Studio: Task 8 and Task 4.
- Result feedback: Task 9.
- Persistence: Task 3 and Task 10.
- Interview/demo README: Task 11.

Placeholder scan:

- No `TBD` or `TODO` markers.
- No future-only implementation steps inside MVP tasks.

Type consistency:

- Domain types are defined in Task 2 and reused by storage, taste engine, and components.
- `ReferenceCategory`, `TasteOSState`, `PromptTemplate`, and `GenerationFeedback` names are consistent across tasks.
