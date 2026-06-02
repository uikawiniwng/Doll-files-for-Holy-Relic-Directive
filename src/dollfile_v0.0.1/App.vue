<template>
  <div class="viewer-root">
    <div v-if="parseError" class="error-card">
      <h3>YAML 解析失败</h3>
      <div class="error-body">
        <div class="yaml-error-row"><b>技术信息:</b>{{ parseError.message }}</div>
        <div v-if="parseError.line !== undefined" class="yaml-error-row">
          <b>定位:</b>第 {{ (parseError.line ?? 0) + 1 }} 行，第 {{ (parseError.column ?? 0) + 1 }} 列
        </div>
        <ul class="yaml-fix-list">
          <li v-for="tip in parseErrorTips" :key="tip">{{ tip }}</li>
        </ul>
        <template v-if="parseError.cleanedLine">
          <div class="yaml-error-title">系统定位到的出错行</div>
          <pre class="yaml-error-pre"
            >{{ parseError.cleanedLine }}
{{ parseError.caretLine }}</pre
          >
        </template>
      </div>
    </div>

    <div v-else-if="sheetData" class="sp-shell">
      <div ref="bgLayerRef" class="sp-card">
        <canvas id="particle-canvas" ref="canvasRef"></canvas>

        <div class="terminal-layout">
          <!-- Left Panel: Fixed Hero Info -->
          <div class="terminal-left">
            <HeroPanel
              :code-text="codeText"
              :rarity-text="rarityText"
              :occupation-text="occupationText"
              :active-page="activePage"
              :nav-items="navItems"
              :importing="importing"
              @update:active-page="activePage = $event"
              @import-worldbook="onImportWorldbook"
              @import-mvu="onImportMvu"
            />
          </div>

          <!-- Right Panel: Scrollable Content -->
          <div class="terminal-right">
            <main class="page-stack">
              <!-- Mobile-only overview page. Desktop keeps this panel in the fixed left rail. -->
              <section v-show="activePage === 'overview'" class="page mobile-overview-page">
                <HeroPanel
                  :code-text="codeText"
                  :rarity-text="rarityText"
                  :occupation-text="occupationText"
                  :active-page="activePage"
                  :nav-items="navItems"
                  :importing="importing"
                  @update:active-page="activePage = $event"
                  @import-worldbook="onImportWorldbook"
                  @import-mvu="onImportMvu"
                />
              </section>

              <!-- Page 1: Status & Radar -->
              <section v-show="activePage === 'status'" class="page">
                <div class="status-overview">
                  <RadarChart
                    :abilities="abilities"
                    :selected-ability-key="selectedAbilityKey"
                    @select="selectedAbilityKey = $event"
                  />

                  <div
                    class="potential-dock"
                    @mouseenter="showPotential = true"
                    @mouseleave="showPotential = false"
                  >
                    <button
                      type="button"
                      class="potential-scan-btn"
                      :aria-expanded="showPotential"
                      @click="showPotential = !showPotential"
                    >
                      <span class="potential-dot"></span>
                      <span class="potential-copy">
                        <span class="potential-label">素体潜能</span>
                        <span class="potential-command">POTENTIAL SCAN</span>
                      </span>
                    </button>

                    <transition name="glitch-fade">
                      <div v-if="showPotential" class="potential-readout">
                        <span class="readout-label">SCAN RESULT</span>
                        <span class="readout-value">{{ potentialText }}</span>
                      </div>
                    </transition>
                  </div>
                </div>

                <!-- Moved Basic Info (Identity, Specialty, etc.) below the radar -->
                <div class="basic-info-grid">
                  <div class="info-item">
                    <span class="info-label">身份 IDENTITY</span>
                    <span class="info-val">{{ identityText }}</span>
                  </div>
                  <div class="info-item">
                    <span class="info-label">职业 OCCUPATION</span>
                    <span class="info-val">{{ occupationText }}</span>
                  </div>
                  <div class="info-item">
                    <span class="info-label">战损程度 DAMAGE</span>
                    <span class="info-val">{{ damageText }}</span>
                  </div>
                  <div class="info-item">
                    <span class="info-label">战术 TACTIC</span>
                    <span class="info-val">{{ tacticText }}</span>
                  </div>
                </div>
              </section>

              <!-- Page 2: Skills -->
              <section v-show="activePage === 'skills'" class="page">
                <h2 class="section-title">技能列表 / SKILLS</h2>
                <DataCard
                  v-for="(item, index) in skills"
                  :key="`skill-${index}-${itemName(item)}`"
                  :title="itemName(item)"
                  :level="itemLevel(item)"
                >
                  <p v-if="itemType(item)"><span class="card-label">类型</span>{{ itemType(item) }}</p>
                  <p v-if="itemCost(item)"><span class="card-label">消耗</span>{{ itemCost(item) }}</p>
                  <ul v-if="itemEffectEntries(item).length > 0" class="effect-list">
                    <li v-for="(entry, eIdx) in itemEffectEntries(item)" :key="eIdx" class="effect-item">
                      <span v-if="!entry.fallback" class="effect-name">{{ entry.name }}</span>
                      <span class="effect-text">{{ entry.content }}</span>
                    </li>
                  </ul>
                  <p v-if="itemDescription(item)" class="card-description">{{ itemDescription(item) }}</p>
                </DataCard>
                <div v-if="skills.length === 0" class="empty-state">暂无技能数据 NO SKILL DATA</div>
              </section>

              <!-- Page 3: Equipment -->
              <section v-show="activePage === 'equipment'" class="page">
                <h2 class="section-title">武装系统 / EQUIPMENT</h2>
                <DataCard
                  v-for="(item, index) in equipments"
                  :key="`equip-${index}-${itemName(item)}`"
                  :title="itemName(item)"
                  :level="itemLevel(item)"
                >
                  <p v-if="itemType(item)"><span class="card-label">类型</span>{{ itemType(item) }}</p>
                  <p v-if="itemPosition(item)"><span class="card-label">位置</span>{{ itemPosition(item) }}</p>
                  <p v-if="itemState(item)"><span class="card-label">状态</span>{{ itemState(item) }}</p>

                  <div v-if="itemRange(item) || itemShots(item) || itemPower(item)" class="stat-line">
                    <span v-if="itemRange(item)">射程 {{ itemRange(item) }}</span>
                    <span v-if="itemShots(item)">射击 {{ itemShots(item) }}</span>
                    <span v-if="itemPower(item)">威力 {{ itemPower(item) }}</span>
                  </div>

                  <ul v-if="itemEffectEntries(item).length > 0" class="effect-list">
                    <li v-for="(entry, eIdx) in itemEffectEntries(item)" :key="eIdx" class="effect-item">
                      <span v-if="!entry.fallback" class="effect-name">{{ entry.name }}</span>
                      <span class="effect-text">{{ entry.content }}</span>
                    </li>
                  </ul>
                  <p v-if="itemDescription(item)" class="card-description">{{ itemDescription(item) }}</p>
                </DataCard>
                <div v-if="equipments.length === 0" class="empty-state">暂无武装数据 NO EQUIPMENT DATA</div>
              </section>

              <!-- Page 4: Implants -->
              <section v-show="activePage === 'implants'" class="page">
                <h2 class="section-title">植入系统 / IMPLANTS</h2>
                <DataCard
                  v-for="(item, index) in implants"
                  :key="`implant-${index}-${itemName(item)}`"
                  :title="itemName(item)"
                  :level="itemLevel(item)"
                >
                  <p v-if="itemType(item)"><span class="card-label">类型</span>{{ itemType(item) }}</p>
                  <p v-if="itemState(item)"><span class="card-label">状态</span>{{ itemState(item) }}</p>
                  <p v-if="implantSideEffect(item)">
                    <span class="card-label">副作用</span>{{ implantSideEffect(item) }}
                  </p>

                  <ul v-if="itemEffectEntries(item).length > 0" class="effect-list">
                    <li v-for="(entry, eIdx) in itemEffectEntries(item)" :key="eIdx" class="effect-item">
                      <span v-if="!entry.fallback" class="effect-name">{{ entry.name }}</span>
                      <span class="effect-text">{{ entry.content }}</span>
                    </li>
                  </ul>
                  <p v-if="itemDescription(item)" class="card-description">{{ itemDescription(item) }}</p>
                </DataCard>
                <div v-if="implants.length === 0" class="empty-state">暂无植入物数据 NO IMPLANT DATA</div>
              </section>

              <!-- Page 5: Profile -->
              <section v-show="activePage === 'profile'" class="page">
                <h2 class="section-title">机密档案 / PROFILE</h2>
                <div class="profile-content">
                  <DataCard v-if="personalityText" title="性格分析">
                    <p>{{ personalityText }}</p>
                  </DataCard>
                  <DataCard v-if="likesText" title="偏好记录">
                    <p>{{ likesText }}</p>
                  </DataCard>
                  <DataCard v-if="appearanceText" title="外观特征">
                    <p>{{ appearanceText }}</p>
                  </DataCard>
                  <DataCard v-if="attireText" title="常规着装">
                    <p>{{ attireText }}</p>
                  </DataCard>
                  <div v-if="!hasProfile" class="empty-state">档案访问受限 ACCESS DENIED</div>
                </div>
              </section>
            </main>

            <!-- Mobile Bottom Navigation (Visible only on mobile) -->
            <nav class="mobile-bottom-nav">
              <button
                v-for="nav in mobileNavItems"
                :key="nav.key"
                type="button"
                class="mobile-nav-item"
                :class="{ active: activePage === nav.key }"
                :data-page="nav.key"
                @click="activePage = nav.key"
              >
                <span class="mobile-nav-icon" aria-hidden="true"></span>
                <span class="mobile-nav-label">{{ mobileNavLabel(nav.key) }}</span>
              </button>
            </nav>
          </div>
        </div>
      </div>
    </div>

    <div v-else class="loading-card">
      <div class="loader-glitch" data-text="WAITING FOR SYS DATA...">WAITING FOR SYS DATA...</div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, nextTick, onBeforeUnmount, onMounted, ref, watchEffect } from 'vue';

import { getSmartArray, hasText } from './services/common';
import { importToMvuVariables, saveToChatWorldbook } from './services/importService';
import { createParticleEngine, type ParticleEngine } from './services/particleEngine';
import { applyTheme, normalizeRarity, resolveTheme } from './services/themeService';
import { parseDollYaml } from './services/yamlParser';
import type { DollData, FriendlyYamlError, ThemeResolved } from './types';

// Components
import DataCard from './components/DataCard.vue';
import HeroPanel from './components/HeroPanel.vue';
import RadarChart from './components/RadarChart.vue';

const dcAbilityKeys = ['破坏能级', '结构韧性', '神经机动', '链路算力', '工程制造', '理智屏障'] as const;

type ContentPageKey = 'status' | 'skills' | 'equipment' | 'implants' | 'profile';
type PageKey = 'overview' | ContentPageKey;
type NavItem<Key extends PageKey = PageKey> = { key: Key; label: string };
type ItemObject = Record<string, any>;
type AbilityKey = (typeof dcAbilityKeys)[number];

type EffectEntry = {
  name: string;
  content: string;
  fallback: boolean;
};

const abilityShortMap: Record<AbilityKey, string> = {
  破坏能级: '破坏',
  结构韧性: '韧性',
  神经机动: '机动',
  链路算力: '算力',
  工程制造: '工程',
  理智屏障: '理智',
};

const sheetData = ref<DollData | null>(null);
const parseError = ref<FriendlyYamlError | null>(null);
const originalYamlText = ref('');
const theme = ref<ThemeResolved | null>(null);
const activePage = ref<PageKey>('status');
const selectedAbilityKey = ref<AbilityKey>('破坏能级');

const canvasRef = ref<HTMLCanvasElement | null>(null);
const bgLayerRef = ref<HTMLElement | null>(null);
let engine: ParticleEngine | null = null;
let mobileMediaQuery: MediaQueryList | null = null;

const importing = ref(false);
const showPotential = ref(false);
const isMobileViewport = ref(false);

const parseErrorTips = [
  '确认顶层字段是 代号、稀有度、能力、装备、植入物、技能 这类人形字段',
  '多行文字字段使用 | 后，下一行要多缩进两格',
  '装备、植入物、技能必须是 - 名称: ... 这种列表格式',
  '如果使用 <doll_files> 包裹，确认闭合标签存在',
];

function pickField(source: unknown, ...keys: string[]): unknown {
  if (!source || typeof source !== 'object') return undefined;
  const obj = source as Record<string, unknown>;
  for (const key of keys) {
    const value = obj[key];
    if (value !== undefined && value !== null) return value;
  }
  return undefined;
}

function textFromUnknown(value: unknown): string {
  if (value === undefined || value === null) return '';
  if (typeof value === 'string') return value.trim();
  if (typeof value === 'number' || typeof value === 'boolean') return String(value);
  if (Array.isArray(value))
    return value
      .map(v => textFromUnknown(v))
      .filter(Boolean)
      .join(' / ');
  if (typeof value === 'object') {
    return Object.entries(value as Record<string, unknown>)
      .map(([key, val]) => {
        const content = textFromUnknown(val);
        return content ? `${key}: ${content}` : '';
      })
      .filter(Boolean)
      .join('； ');
  }
  return String(value);
}

function asObjectArray(input: unknown): ItemObject[] {
  if (Array.isArray(input)) return input.filter(item => item && typeof item === 'object') as ItemObject[];
  if (!input || typeof input !== 'object') return [];
  return Object.entries(input as Record<string, unknown>)
    .map(([name, value]) => {
      if (value && typeof value === 'object') return { 名称: name, ...(value as Record<string, unknown>) };
      return { 名称: name, 描述: textFromUnknown(value) };
    })
    .filter(item => hasText(item.名称));
}

// Extracted Data Setup
const codeText = computed(() => textFromUnknown(pickField(sheetData.value, '代号')) || 'Unknown');
const rarityText = computed(() => normalizeRarity(pickField(sheetData.value, '稀有度')) || 'C');
const identityText = computed(() => getSmartArray(pickField(sheetData.value, '身份')).join(' / ') || '-');
const occupationText = computed(() => getSmartArray(pickField(sheetData.value, '职业')).join(' / ') || '-');
const damageText = computed(() => textFromUnknown(pickField(sheetData.value, '战损程度')) || '未记录');
const tacticText = computed(() => textFromUnknown(pickField(sheetData.value, '战术')) || '未设定');
const potentialText = computed(() => {
  const abilityObj = (pickField(sheetData.value, '能力') || {}) as Record<string, unknown>;
  return textFromUnknown(abilityObj.素体潜能) || '-';
});

const personalityText = computed(() => textFromUnknown(pickField(sheetData.value, '性格')));
const likesText = computed(() => textFromUnknown(pickField(sheetData.value, '喜爱')));
const appearanceText = computed(() => textFromUnknown(pickField(sheetData.value, '外貌')));
const attireText = computed(() => textFromUnknown(pickField(sheetData.value, '着装')));

const hasProfile = computed(
  () =>
    hasText(personalityText.value) ||
    hasText(likesText.value) ||
    hasText(appearanceText.value) ||
    hasText(attireText.value),
);

// Abilities for Radar
const abilities = computed(() => {
  const abilityObj = (pickField(sheetData.value, '能力') || {}) as Record<string, unknown>;
  return dcAbilityKeys.map(key => ({
    key,
    short: abilityShortMap[key],
    value: textFromUnknown(abilityObj[key]) || '-',
    score: abilityScore(abilityObj[key]),
  }));
});

function abilityScore(raw: unknown): number {
  const text = textFromUnknown(raw)
    .toUpperCase()
    .replace(/[级級]/g, '');
  const num = Number.parseFloat(text);
  if (Number.isFinite(num)) return Math.max(0, Math.min(100, num));
  if (text.includes('EX')) return 100;
  if (text.includes('SSS') || text.includes('SS') || text.includes('X')) return 90;
  if (text.includes('S')) return 74;
  if (text.includes('A')) return 62;
  if (text.includes('B')) return 46;
  if (text.includes('C')) return 30;
  if (text.includes('D')) return 18;
  return 0;
}

// Effect parsing
function parseNamedEffectLine(line: string): EffectEntry | null {
  const normalized = String(line || '').trim();
  if (!normalized) return null;

  const bracketMatch = normalized.match(/^\[([^\]]+)\]\s*[：:]\s*(.*)$/);
  if (bracketMatch) {
    const name = String(bracketMatch[1] || '').trim();
    const content = String(bracketMatch[2] || '').trim();
    if (name && content) return { name, content, fallback: false };
    return null;
  }

  const splitIndex = normalized.search(/[：:]/);
  if (splitIndex <= 0) return null;

  const name = normalized.slice(0, splitIndex).trim();
  const content = normalized.slice(splitIndex + 1).trim();
  if (!name || !content) return null;
  return { name, content, fallback: false };
}

function parseEffectTextEntries(raw: string): EffectEntry[] {
  const text = String(raw || '')
    .replace(/\r\n/g, '\n')
    .trim();
  if (!text) return [];

  const lines = text
    .split('\n')
    .map(line => line.trim())
    .filter(Boolean);
  const entries: EffectEntry[] = [];
  const remains: string[] = [];

  lines.forEach(line => {
    const named = parseNamedEffectLine(line);
    if (named) entries.push(named);
    else remains.push(line);
  });

  if (entries.length === 0) return [{ name: '描述', content: text, fallback: true }];
  if (remains.length > 0) entries.push({ name: '描述', content: remains.join('\n'), fallback: true });
  return entries;
}

function normalizeEffectEntries(value: unknown): EffectEntry[] {
  if (value && typeof value === 'object' && !Array.isArray(value)) {
    return Object.entries(value as Record<string, unknown>)
      .map(([name, raw]) => {
        const safeName = String(name || '').trim() || '描述';
        const content = textFromUnknown(raw).trim();
        return {
          name: safeName,
          content,
          fallback: safeName === '描述',
        };
      })
      .filter(entry => entry.content.length > 0);
  }
  return parseEffectTextEntries(textFromUnknown(value));
}

// Item getters
function itemName(item: ItemObject): string {
  return textFromUnknown(item?.名称 || item?.名稱) || '未命名';
}
function itemLevel(item: ItemObject): string {
  return textFromUnknown(item?.等级 || item?.等級 || item?.稀有度);
}
function itemType(item: ItemObject): string {
  return textFromUnknown(item?.类型 || item?.類型 || item?.分类 || item?.分類);
}
function itemPosition(item: ItemObject): string {
  return textFromUnknown(item?.位置);
}
function itemRange(item: ItemObject): string {
  return textFromUnknown(item?.射程);
}
function itemShots(item: ItemObject): string {
  return textFromUnknown(item?.射击次数 || item?.射擊次數);
}
function itemPower(item: ItemObject): string {
  return textFromUnknown(item?.威力);
}
function itemState(item: ItemObject): string {
  return textFromUnknown(item?.状态 || item?.狀態);
}
function itemDescription(item: ItemObject): string {
  return textFromUnknown(item?.描述);
}
function itemCost(item: ItemObject): string {
  return textFromUnknown(item?.消耗);
}
function implantSideEffect(item: ItemObject): string {
  return textFromUnknown(item?.副作用);
}
function itemEffectEntries(item: ItemObject): EffectEntry[] {
  return normalizeEffectEntries(item?.效果);
}

const equipments = computed(() => asObjectArray(sheetData.value?.装备));
const implants = computed(() => asObjectArray(sheetData.value?.植入物));
const skills = computed(() => asObjectArray(sheetData.value?.技能));

const navItems = computed<NavItem<ContentPageKey>[]>(() => [
  { key: 'status' as const, label: 'SYS_STATUS' },
  ...(skills.value.length > 0 ? [{ key: 'skills' as const, label: 'SKILLS' }] : []),
  ...(equipments.value.length > 0 ? [{ key: 'equipment' as const, label: 'EQUIPMENT' }] : []),
  ...(implants.value.length > 0 ? [{ key: 'implants' as const, label: 'IMPLANTS' }] : []),
  { key: 'profile' as const, label: 'PROFILE' },
]);

const mobileNavItems = computed<NavItem[]>(() => [{ key: 'overview', label: 'PROFILE' }, ...navItems.value]);

function mobileNavLabel(key: PageKey): string {
  const labels: Record<PageKey, string> = {
    overview: 'INFO',
    status: 'STATUS',
    skills: 'SKILL',
    equipment: 'EQUIP',
    implants: 'IMPLANT',
    profile: 'PROFILE',
  };
  return labels[key];
}

watchEffect(() => {
  const allowedItems = isMobileViewport.value ? mobileNavItems.value : navItems.value;
  if (!allowedItems.some(item => item.key === activePage.value)) activePage.value = 'status';
});

function syncMobileViewport() {
  isMobileViewport.value = mobileMediaQuery?.matches ?? false;
}

function detectIOSSafari(): boolean {
  const ua = navigator.userAgent || '';
  const isIOS = /iPad|iPhone|iPod/.test(ua) || (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);
  const isSafari = /Safari/i.test(ua) && !/CriOS|FxiOS|EdgiOS|OPiOS/i.test(ua);
  return isIOS && isSafari;
}

function setupParticleEngine() {
  if (!canvasRef.value || !bgLayerRef.value || !theme.value) return;
  engine?.destroy();
  engine = createParticleEngine({
    canvas: canvasRef.value,
    host: bgLayerRef.value,
    tier: theme.value.tier,
    colorHex: theme.value.rarityHex,
    isIOSSafari: detectIOSSafari(),
  });
  engine.start();
}

function initFromYaml() {
  const yamlNode = document.getElementById('data-source');
  const yamlText = yamlNode?.textContent?.trim() || '';
  originalYamlText.value = yamlText;

  if (!yamlText) {
    parseError.value = { message: '未检测到 YAML 数据（#data-source 为空）。' };
    return;
  }

  const parsed = parseDollYaml(yamlText);
  if (!parsed.success) {
    parseError.value = parsed.error;
    return;
  }

  parseError.value = null;
  sheetData.value = parsed.data;
  theme.value = resolveTheme(parsed.data);
  applyTheme(theme.value);
  selectedAbilityKey.value = dcAbilityKeys[0];

  nextTick(() => setupParticleEngine());
}

async function onImportMvu() {
  if (!sheetData.value || importing.value) return;
  importing.value = true;
  try {
    const ok = window.confirm(
      `确定要将人形 "${sheetData.value.代号 || 'Unknown'}" 导入到 MVU 变量 stat_data.人形列表 吗？\n如果已存在同代号人形，将以当前 YAML 覆盖同名字段。`,
    );
    if (!ok) return;
    await importToMvuVariables(sheetData.value);
    window.alert('已导入 MVU 人形列表');
  } catch (err: any) {
    console.error('MVU Import Error:', err);
    window.alert(`导入失败: ${err?.message || String(err)}`);
  } finally {
    importing.value = false;
  }
}

async function onImportWorldbook() {
  if (!sheetData.value || importing.value) return;
  importing.value = true;
  try {
    await saveToChatWorldbook(sheetData.value, originalYamlText.value);
    window.alert('已保存到聊天世界书');
  } catch (err: any) {
    console.error('Worldbook Save Error:', err);
    window.alert(`保存失败: ${err?.message || String(err)}`);
  } finally {
    importing.value = false;
  }
}

onMounted(() => {
  mobileMediaQuery = window.matchMedia('(max-width: 800px)');
  syncMobileViewport();
  mobileMediaQuery.addEventListener('change', syncMobileViewport);
  initFromYaml();
});
onBeforeUnmount(() => {
  mobileMediaQuery?.removeEventListener('change', syncMobileViewport);
  mobileMediaQuery = null;
  engine?.destroy();
  engine = null;
});
</script>

<style>
html,
body {
  width: 100%;
  margin: 0;
  padding: 0;
  overflow-x: hidden;
  background: transparent;
}

#app {
  width: 100%;
}

@media (max-width: 800px) {
  #app {
    width: 100%;
    max-width: 600px;
    margin: 0 auto;
    aspect-ratio: 3 / 5.8;
  }

  #app > .viewer-root {
    height: 100%;
  }
}
</style>

<style scoped>
:root {
  --rarity-color: #facc15;
  --rarity-color-rgb: 250, 204, 21;
  --race-color: var(--rarity-color);
  --race-color-rgb: var(--rarity-color-rgb);
  --tier-color: var(--rarity-color);
  --tier-color-rgb: var(--rarity-color-rgb);
  --cyber-blue: #00a1b7;
  --cyber-blue-rgb: 0, 161, 183;
}

.viewer-root {
  /* No padding, let the iframe define the bounds */
  width: 100%;
  color: #f7f7fb;
  font-family: 'Noto Sans SC', 'Microsoft YaHei', sans-serif;
  background: transparent;
}

.sp-shell {
  width: 100%;
  max-width: 960px;
  margin: 0 auto;
}

.sp-card {
  position: relative;
  width: 100%;
  aspect-ratio: 4 / 3; /* Fixed aspect ratio to prevent infinite height */
  border-radius: 4px;
  background: #050609;
  border: 1px solid rgba(0, 161, 183, 0.4);
  box-shadow:
    0 0 30px rgba(0, 0, 0, 0.8),
    0 0 0 1px rgba(var(--rarity-color-rgb), 0.1),
    inset 0 0 20px rgba(0, 161, 183, 0.05);
  overflow: hidden;
}

/* CRT Scanlines overlay */
.sp-card::before {
  content: '';
  position: absolute;
  inset: 0;
  pointer-events: none;
  z-index: 100; /* High z-index to overlay on everything */
  background: repeating-linear-gradient(
    0deg,
    transparent,
    transparent 2px,
    rgba(0, 0, 0, 0.1) 3px,
    rgba(0, 0, 0, 0.1) 4px
  );
  opacity: 0.5;
}

#particle-canvas {
  position: absolute;
  inset: 0;
  z-index: 0;
  width: 100%;
  height: 100%;
  opacity: 0.4;
  pointer-events: none;
}

/* 2-Column Terminal Layout */
.terminal-layout {
  position: relative;
  z-index: 4;
  display: flex;
  flex-direction: row;
  height: 100%;
}

.terminal-left {
  flex: 0 0 320px;
  height: 100%;
}

.terminal-right {
  flex: 1;
  min-width: 0;
  display: flex;
  flex-direction: column;
  position: relative;
  background: rgba(4, 6, 10, 0.8);
}

.page-stack {
  flex: 1;
  min-height: 0;
  padding: 30px 40px 24px;
  overflow: hidden;
}

.page {
  height: 100%;
  overflow-y: auto;
  padding-right: 8px;
  scrollbar-width: thin;
  scrollbar-color: rgba(0, 161, 183, 0.5) transparent;
}

.page::-webkit-scrollbar {
  width: 6px;
}

.page::-webkit-scrollbar-thumb {
  background: rgba(0, 161, 183, 0.5);
  border-radius: 0;
}

.mobile-bottom-nav {
  display: none;
}

.mobile-nav-item {
  min-width: 0;
}

.section-title {
  margin: 0 0 20px;
  color: #00a1b7;
  font-size: 1.2rem;
  font-weight: 800;
  letter-spacing: 2px;
  text-transform: uppercase;
  border-bottom: 2px solid rgba(0, 161, 183, 0.3);
  padding-bottom: 8px;
  text-shadow: 0 0 10px rgba(0, 161, 183, 0.4);
}

.status-overview {
  position: relative;
  min-height: 378px;
}

.potential-dock {
  position: absolute;
  right: 0;
  bottom: 18px;
  z-index: 6;
}

.potential-scan-btn {
  display: inline-flex;
  align-items: center;
  gap: 10px;
  min-width: 168px;
  min-height: 42px;
  padding: 8px 14px;
  border: 1px solid rgba(var(--rarity-color-rgb), 0.45);
  background:
    linear-gradient(135deg, rgba(var(--rarity-color-rgb), 0.14), rgba(0, 161, 183, 0.05)),
    rgba(2, 3, 5, 0.88);
  color: #facc15;
  cursor: pointer;
  outline: none;
  clip-path: polygon(0 0, calc(100% - 10px) 0, 100% 10px, 100% 100%, 10px 100%, 0 calc(100% - 10px));
  box-shadow: 0 0 16px rgba(var(--rarity-color-rgb), 0.12);
  transition:
    border-color 0.2s ease,
    box-shadow 0.2s ease,
    transform 0.2s ease;
}

.potential-scan-btn:hover,
.potential-scan-btn:focus-visible {
  border-color: rgba(var(--rarity-color-rgb), 0.85);
  box-shadow:
    0 0 18px rgba(var(--rarity-color-rgb), 0.22),
    inset 0 0 14px rgba(var(--rarity-color-rgb), 0.12);
}

.potential-scan-btn:active {
  transform: scale(0.98);
}

.potential-dot {
  width: 8px;
  height: 8px;
  background: var(--rarity-color);
  box-shadow: 0 0 10px rgba(var(--rarity-color-rgb), 0.85);
  animation: pulse 2s infinite;
}

.potential-copy {
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  gap: 2px;
  line-height: 1.1;
}

.potential-label {
  color: rgba(255, 255, 255, 0.82);
  font-size: 0.72rem;
  font-weight: 800;
}

.potential-command {
  color: var(--rarity-color);
  font-family: 'Consolas', 'Courier New', monospace;
  font-size: 0.68rem;
  font-weight: 900;
  letter-spacing: 1px;
}

.potential-readout {
  position: absolute;
  right: 0;
  bottom: calc(100% + 8px);
  min-width: 168px;
  padding: 12px 14px;
  border: 1px solid rgba(var(--rarity-color-rgb), 0.7);
  background: rgba(5, 6, 9, 0.96);
  box-shadow: 0 0 20px rgba(var(--rarity-color-rgb), 0.18);
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
}

.readout-label {
  color: rgba(255, 255, 255, 0.58);
  font-size: 0.62rem;
  font-weight: 800;
  letter-spacing: 1px;
  white-space: nowrap;
}

.readout-value {
  color: var(--rarity-color);
  font-family: 'Consolas', 'Courier New', monospace;
  font-size: 1.35rem;
  font-weight: 900;
  line-height: 1;
  text-shadow: 0 0 10px rgba(var(--rarity-color-rgb), 0.45);
}

.basic-info-grid {
  display: grid;
  grid-template-columns: repeat(4, minmax(0, 1fr));
  gap: 8px;
  margin-top: 4px;
  padding-top: 12px;
  border-top: 1px solid rgba(0, 161, 183, 0.22);
}

.info-item {
  min-height: 76px;
  display: flex;
  flex-direction: column;
  justify-content: space-between;
  gap: 8px;
  padding: 12px 12px 11px;
  background:
    linear-gradient(180deg, rgba(0, 161, 183, 0.09), rgba(0, 161, 183, 0.025)),
    rgba(2, 3, 5, 0.55);
  border: 1px solid rgba(0, 161, 183, 0.16);
  border-left: 2px solid rgba(0, 161, 183, 0.58);
  clip-path: polygon(0 0, calc(100% - 9px) 0, 100% 9px, 100% 100%, 0 100%);
}

.info-label {
  color: rgba(0, 161, 183, 0.8);
  font-size: 0.66rem;
  font-weight: 800;
  letter-spacing: 1px;
  line-height: 1.25;
  text-transform: uppercase;
}

.info-val {
  color: rgba(255, 255, 255, 0.9);
  font-size: 0.88rem;
  font-weight: 700;
  line-height: 1.35;
  word-break: break-word;
}

.stat-line {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  margin: 12px 0;
}

.stat-line span {
  padding: 4px 10px;
  border: 1px solid rgba(0, 161, 183, 0.3);
  background: rgba(0, 161, 183, 0.1);
  color: #00a1b7;
  font-family: 'Consolas', monospace;
  font-size: 0.8rem;
  font-weight: bold;
}

.empty-state {
  padding: 40px;
  color: rgba(0, 161, 183, 0.4);
  text-align: center;
  font-family: 'Consolas', monospace;
  letter-spacing: 2px;
  border: 1px dashed rgba(0, 161, 183, 0.2);
  background: rgba(0, 0, 0, 0.3);
}

.bottom-nav {
  height: 64px;
  display: flex;
  align-items: stretch;
  background: #020305;
  border-top: 1px solid rgba(0, 161, 183, 0.3);
  z-index: 10;
}

.nav-pages {
  flex: 1;
  display: flex;
}

.nav-item {
  flex: 1;
  min-width: 0;
  border: 0;
  border-right: 1px solid rgba(0, 161, 183, 0.15);
  background: transparent;
  color: rgba(0, 161, 183, 0.4);
  font-size: 0.75rem;
  font-weight: 800;
  letter-spacing: 1px;
  cursor: pointer;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 4px;
  transition: all 0.3s ease;
}

.nav-item:hover {
  background: rgba(0, 161, 183, 0.05);
  color: rgba(0, 161, 183, 0.8);
}

.nav-item.active {
  color: #fff;
  background: rgba(0, 161, 183, 0.15);
  text-shadow: 0 0 8px rgba(0, 161, 183, 0.6);
  border-bottom: 3px solid #00a1b7;
}

.nav-actions {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 0 16px;
}

.loading-card,
.error-card {
  max-width: 760px;
  margin: 0 auto;
  border: 1px solid #00a1b7;
  background: rgba(5, 6, 9, 0.9);
  padding: 24px;
  box-shadow: 0 0 20px rgba(0, 161, 183, 0.2);
}

.loader-glitch {
  color: #00a1b7;
  font-family: 'Consolas', monospace;
  font-size: 1.2rem;
  text-align: center;
  animation: text-flicker 2s linear infinite;
}

@keyframes text-flicker {
  0% {
    opacity: 1;
  }
  5% {
    opacity: 0.8;
  }
  10% {
    opacity: 0.9;
    text-shadow: 0 0 10px #00a1b7;
  }
  15% {
    opacity: 0.1;
  }
  20% {
    opacity: 1;
    text-shadow: none;
  }
  100% {
    opacity: 1;
  }
}

@keyframes pulse {
  0% {
    opacity: 0.35;
  }
  50% {
    opacity: 1;
    box-shadow: 0 0 12px rgba(var(--rarity-color-rgb), 0.9);
  }
  100% {
    opacity: 0.35;
  }
}

.glitch-fade-enter-active,
.glitch-fade-leave-active {
  transition: all 0.18s ease;
}

.glitch-fade-enter-from,
.glitch-fade-leave-to {
  opacity: 0;
  transform: translateY(8px);
}

/* Responsive down to mobile */
@media (max-width: 800px) {
  .viewer-root {
    display: flex;
    justify-content: center;
    align-items: stretch;
    max-width: 600px;
    margin: 0 auto;
    height: 100%;
    overflow-x: hidden;
  }

  .sp-shell {
    width: 100%;
    height: 100%;
    max-width: 600px;
  }

  .terminal-layout {
    flex-direction: column;
    min-height: 0;
  }

  .terminal-left {
    display: none;
  }

  .terminal-right {
    flex: 1;
    min-height: 0;
    overflow: hidden;
  }

  .sp-card {
    height: 100%;
    aspect-ratio: auto;
    overflow: hidden;
  }

  .page-stack {
    min-height: 0;
    padding: 18px 18px 16px;
    flex: 1;
    overflow: hidden;
  }

  .page {
    height: 100%;
    overflow-y: auto;
    padding-right: 2px;
    padding-bottom: 16px;
  }

  .mobile-overview-page {
    padding-right: 0;
  }

  .mobile-overview-page :deep(.hero-panel) {
    height: auto;
    border-right: 0;
  }

  .basic-info-grid {
    grid-template-columns: repeat(2, minmax(0, 1fr));
    gap: 10px;
    margin-top: 8px;
  }

  .status-overview {
    min-height: 0;
  }

  .potential-dock {
    position: relative;
    right: auto;
    bottom: auto;
    display: flex;
    justify-content: flex-end;
    margin: -8px 0 14px;
  }

  .potential-readout {
    right: 0;
    left: auto;
  }

  .mobile-bottom-nav {
    display: flex;
    height: 50px;
    z-index: 100;
    flex-shrink: 0;
    background: #0f0f12;
    border-top: 1px solid rgba(0, 161, 183, 0.28);
    box-shadow: 0 -8px 18px rgba(0, 0, 0, 0.5);
  }

  .mobile-nav-item {
    flex: 1 1 0;
    display: flex;
    min-width: 0;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    gap: 3px;
    padding: 0 2px;
    border: 0;
    border-right: 1px solid rgba(0, 161, 183, 0.12);
    background: transparent;
    color: rgba(0, 161, 183, 0.5);
    cursor: pointer;
    font-family: 'Consolas', 'Courier New', monospace;
    font-size: 0.58rem;
    font-weight: 800;
    letter-spacing: 0.5px;
    line-height: 1;
    text-align: center;
  }

  .mobile-nav-item:last-child {
    border-right: 0;
  }

  .mobile-nav-item.active {
    color: var(--rarity-color);
    background: rgba(var(--rarity-color-rgb), 0.06);
    text-shadow: 0 0 8px rgba(var(--rarity-color-rgb), 0.65);
  }

  .mobile-nav-icon {
    width: 16px;
    height: 16px;
    background: currentColor;
    clip-path: polygon(50% 0, 90% 26%, 76% 78%, 50% 100%, 24% 78%, 10% 26%);
    opacity: 0.85;
  }

  .mobile-nav-item[data-page='status'] .mobile-nav-icon {
    clip-path: polygon(50% 0, 100% 100%, 0 100%);
  }

  .mobile-nav-item[data-page='overview'] .mobile-nav-icon {
    clip-path: polygon(16% 10%, 84% 10%, 84% 100%, 16% 100%);
  }

  .mobile-nav-item[data-page='skills'] .mobile-nav-icon {
    clip-path: polygon(44% 0, 58% 0, 58% 68%, 76% 68%, 50% 100%, 24% 68%, 44% 68%);
  }

  .mobile-nav-item[data-page='equipment'] .mobile-nav-icon {
    clip-path: polygon(18% 20%, 82% 20%, 100% 42%, 88% 100%, 12% 100%, 0 42%);
  }

  .mobile-nav-item[data-page='implants'] .mobile-nav-icon {
    clip-path: polygon(50% 0, 68% 30%, 100% 36%, 76% 60%, 82% 100%, 50% 78%, 18% 100%, 24% 60%, 0 36%, 32% 30%);
  }

  .mobile-nav-item[data-page='profile'] .mobile-nav-icon {
    clip-path: polygon(18% 0, 82% 0, 82% 100%, 18% 100%);
  }

  .mobile-nav-label {
    display: block;
    max-width: 100%;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }
}
</style>
