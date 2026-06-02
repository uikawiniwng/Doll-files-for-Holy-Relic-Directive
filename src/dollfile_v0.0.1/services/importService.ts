import type { DollData } from '../types';
import { getSmartArray, normalizeDisplayText } from './common';
import { normalizeDollDataKeys } from './yamlParser';

type VariableScope = { type: 'message'; message_id: 'latest' };

type TavernApiLike = {
  getVariables?: (scope: VariableScope) => Promise<Record<string, any>> | Record<string, any>;
  insertOrAssignVariables?: (payload: Record<string, any>, scope: VariableScope) => Promise<void> | void;
  getOrCreateChatWorldbook?: (chat: 'current', desiredName: string) => Promise<string>;
  createWorldbookEntries?: (bookName: string, entries: Array<Record<string, any>>) => Promise<void>;
  getChatWorldbookName?: (chat: 'current') => Promise<string | null>;
};

function getApi(): TavernApiLike {
  return ((window as any).TavernHelper || (window.parent as any)?.TavernHelper || window) as TavernApiLike;
}

function ensureString(val: unknown): string {
  if (Array.isArray(val)) return val.map(item => ensureString(item)).filter(Boolean).join(', ');
  if (val === undefined || val === null) return '';
  return normalizeDisplayText(val);
}

function ensureNumber(val: unknown, fallback = 0): number {
  const num = Number(val);
  return Number.isFinite(num) ? num : fallback;
}

function ensureBoolean(val: unknown, fallback = true): boolean {
  if (typeof val === 'boolean') return val;
  const text = String(val ?? '').trim().toLowerCase();
  if (['true', 'yes', '1', '在场', '是'].includes(text)) return true;
  if (['false', 'no', '0', '不在场', '否'].includes(text)) return false;
  return fallback;
}

function parseEffectMap(effectVal: unknown): Record<string, string> {
  if (effectVal && typeof effectVal === 'object' && !Array.isArray(effectVal)) {
    const effectObj = effectVal as Record<string, unknown>;
    return Object.fromEntries(
      Object.entries(effectObj)
        .map(([key, value]) => [String(key).trim(), ensureString(value).trim()] as const)
        .filter(([key, value]) => key.length > 0 && value.length > 0),
    );
  }

  const text = ensureString(effectVal).replace(/\r\n/g, '\n').trim();
  if (!text) return {};

  const lines = text
    .split('\n')
    .map(line => line.trim())
    .filter(Boolean);

  const effectMap: Record<string, string> = {};
  const remains: string[] = [];

  lines.forEach(line => {
    const bracketMatch = line.match(/^\[([^\]]+)\]\s*[：:]\s*(.*)$/);
    if (bracketMatch) {
      const key = String(bracketMatch[1] || '').trim();
      const value = String(bracketMatch[2] || '').trim();
      if (key && value) effectMap[key] = value;
      return;
    }

    const plainMatch = line.match(/^([^[\]：:]+?)\s*[：:]\s*(.+)$/);
    if (plainMatch) {
      const key = String(plainMatch[1] || '').trim();
      const value = String(plainMatch[2] || '').trim();
      if (key && value) {
        effectMap[key] = value;
        return;
      }
    }

    remains.push(line);
  });

  if (Object.keys(effectMap).length > 0) {
    if (remains.length > 0) effectMap.描述 = remains.join('\n');
    return effectMap;
  }

  return { 描述: text };
}

function collectionToMap(collection: unknown, kind: 'equipment' | 'implant' | 'skill'): Record<string, Record<string, any>> {
  const map: Record<string, Record<string, any>> = {};
  const items =
    Array.isArray(collection) || !collection || typeof collection !== 'object'
      ? collection
      : Object.entries(collection as Record<string, any>).map(([名称, value]) => {
          if (value && typeof value === 'object') return { 名称, ...(value as Record<string, any>) };
          return { 名称, 描述: ensureString(value).trim() };
        });

  if (!Array.isArray(items)) return map;

  items.forEach(item => {
    if (!item || typeof item !== 'object') return;
    const source = item as Record<string, any>;
    const name = ensureString(source.名称 || source.名稱).trim();
    if (!name) return;

    const { 名称, 名稱, ...rest } = source;
    const processed: Record<string, any> = { ...rest };

    if (kind !== 'skill') {
      processed.等级 = ensureString(processed.等级 || processed.等級).trim();
      processed.类型 = ensureString(processed.类型 || processed.類型 || processed.分类 || processed.分類).trim();
      processed.描述 = ensureString(processed.描述).trim();
      processed.状态 = ensureString(processed.状态 || processed.狀態).trim();
    }

    if (kind === 'equipment') {
      processed.位置 = ensureString(processed.位置).trim();
      processed.射程 = ensureString(processed.射程).trim();
      processed.射击次数 = ensureString(processed.射击次数 || processed.射擊次數).trim();
      processed.威力 = ensureString(processed.威力).trim();
    }

    if (kind === 'implant') {
      processed.副作用 = ensureString(processed.副作用).trim();
    }

    if (kind === 'skill') {
      processed.等级 = ensureString(processed.等级 || processed.等級).trim();
      processed.类型 = ensureString(processed.类型 || processed.類型).trim();
      processed.消耗 = ensureString(processed.消耗).trim();
      processed.描述 = ensureString(processed.描述).trim();
    }

    processed.效果 = parseEffectMap(processed.效果);
    map[name] = processed;
  });

  return map;
}

function buildDollMvuData(data: DollData, previous: Record<string, any> = {}): Record<string, any> {
  const previousFavor = previous.好感度;
  const previousMentalLoad = previous.精神负荷;

  return {
    ...previous,
    在场: ensureBoolean(data.在场, true),
    身份: getSmartArray(data.身份).join(', '),
    职业: getSmartArray(data.职业).join(', '),
    稀有度: ensureString(data.稀有度 || 'C').trim(),
    精神负荷: previousMentalLoad === undefined ? ensureNumber(data.精神负荷, 0) : ensureNumber(previousMentalLoad, 0),
    好感度: previousFavor === undefined ? ensureNumber(data.好感度, 0) : ensureNumber(previousFavor, 0),
    性格: ensureString(data.性格).trim(),
    喜爱: ensureString(data.喜爱).trim(),
    外貌: ensureString(data.外貌).trim(),
    着装: ensureString(data.着装).trim(),
    战术: ensureString(data.战术).trim(),
    战损程度: ensureString(data.战损程度).trim(),
    装备: collectionToMap(data.装备, 'equipment'),
    植入物: collectionToMap(data.植入物, 'implant'),
    技能: collectionToMap(data.技能, 'skill'),
    能力: {
      破坏能级: ensureString(data.能力?.破坏能级).trim(),
      结构韧性: ensureString(data.能力?.结构韧性).trim(),
      神经机动: ensureString(data.能力?.神经机动).trim(),
      链路算力: ensureString(data.能力?.链路算力).trim(),
      工程制造: ensureString(data.能力?.工程制造).trim(),
      理智屏障: ensureString(data.能力?.理智屏障).trim(),
      素体潜能: ensureString(data.能力?.素体潜能).trim(),
    },
  };
}

export async function importToMvuVariables(data: DollData): Promise<void> {
  const api = getApi();
  if (typeof api.getVariables !== 'function' || typeof api.insertOrAssignVariables !== 'function') {
    throw new Error('未检测到 TavernHelper API (getVariables / insertOrAssignVariables)。');
  }

  const normalizedData = normalizeDollDataKeys(data);
  const dollCode = ensureString(normalizedData.代号).trim() || 'Unknown';
  const targetScope: VariableScope = { type: 'message', message_id: 'latest' };
  const currentVars = (await api.getVariables(targetScope)) || {};
  const previousDoll = currentVars?.stat_data?.人形列表?.[dollCode] || {};
  const mvuData = buildDollMvuData(normalizedData, previousDoll);

  await api.insertOrAssignVariables(
    {
      stat_data: {
        人形列表: {
          [dollCode]: mvuData,
        },
      },
    },
    targetScope,
  );
}

export async function saveToChatWorldbook(data: DollData, originalYaml: string): Promise<void> {
  const api = getApi();
  if (typeof api.getOrCreateChatWorldbook !== 'function' || typeof api.createWorldbookEntries !== 'function') {
    throw new Error('未检测到 Worldbook API。');
  }

  const normalizedData = normalizeDollDataKeys(data);
  const dollCode = ensureString(normalizedData.代号).trim() || 'Unknown';
  const lorebookKey = dollCode.split(/[·\s]/)[0] || dollCode;

  let bookName: string | null = null;
  if (typeof api.getChatWorldbookName === 'function') {
    bookName = await api.getChatWorldbookName('current');
  }

  if (!bookName) {
    const now = new Date();
    const timeStr = `${now.getFullYear()}_${String(now.getMonth() + 1).padStart(2, '0')}_${String(now.getDate()).padStart(2, '0')}_${now.getHours()}h_${now.getMinutes()}m_${now.getSeconds()}s`;
    const desiredName = `destined-journey-dollinfo-Chat_Book_${timeStr}`;
    bookName = await api.getOrCreateChatWorldbook('current', desiredName);
  }

  const newEntry = {
    name: dollCode,
    enabled: true,
    strategy: { type: 'selective', keys: [lorebookKey] },
    position: { type: 'after_character_definition', order: 152 },
    content: originalYaml,
  };

  await api.createWorldbookEntries(bookName, [newEntry]);
}
