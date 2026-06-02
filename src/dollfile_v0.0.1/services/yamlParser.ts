import { load } from 'js-yaml';
import type { DollData, FriendlyYamlError, ParseResult } from '../types';

const KEY_ALIAS_TO_SIMPLIFIED: Record<string, string> = {
  代號: '代号',
  名稱: '名称',
  等級: '等级',
  身分: '身份',
  職業: '职业',
  喜愛: '喜爱',
  著裝: '着装',
  戰術: '战术',
  戰損程度: '战损程度',
  破壞能級: '破坏能级',
  結構韌性: '结构韧性',
  神經機動: '神经机动',
  鏈路算力: '链路算力',
  工程製造: '工程制造',
  理智屏障: '理智屏障',
  素體潛能: '素体潜能',
  精神負荷: '精神负荷',
  在場: '在场',
  射擊次數: '射击次数',
  副作用: '副作用',
  狀態: '状态',
  裝備: '装备',
  類型: '类型',
};

const DOLL_FIELD_KEYS = [
  '代号',
  '稀有度',
  '在场',
  '精神负荷',
  '好感度',
  '身份',
  '职业',
  '性格',
  '喜爱',
  '外貌',
  '着装',
  '能力',
  '战术',
  '战损程度',
  '装备',
  '植入物',
  '技能',
];

type PreparedYaml = {
  cleaned: string;
  source: string;
  lineOffset: number;
};

function visualizeForDisplay(str: unknown): string {
  return String(str ?? '')
    .replace(/\t/g, '⇥')
    .replace(/\u00A0/g, '⍽');
}

function decodeCommonHtmlEntities(str: string): string {
  return str
    .replace(/&lt;/gi, '<')
    .replace(/&gt;/gi, '>')
    .replace(/&quot;/gi, '"')
    .replace(/&#39;/gi, "'")
    .replace(/&amp;/gi, '&');
}

function normalizeKey(key: string): string {
  return KEY_ALIAS_TO_SIMPLIFIED[key] || key;
}

function normalizeObjectKeysDeep(input: unknown): unknown {
  if (Array.isArray(input)) {
    return input.map(item => normalizeObjectKeysDeep(item));
  }

  if (!input || typeof input !== 'object') {
    return input;
  }

  const source = input as Record<string, unknown>;
  const output: Record<string, unknown> = {};

  Object.entries(source).forEach(([rawKey, rawValue]) => {
    const normalizedKey = normalizeKey(String(rawKey));
    const normalizedValue = normalizeObjectKeysDeep(rawValue);

    if (!(normalizedKey in output) || rawKey === normalizedKey) {
      output[normalizedKey] = normalizedValue;
    }
  });

  return output;
}

export function normalizeDollDataKeys(data: DollData): DollData {
  return normalizeObjectKeysDeep(data) as DollData;
}

function isRecord(input: unknown): input is Record<string, unknown> {
  return !!input && typeof input === 'object' && !Array.isArray(input);
}

function countDollFields(input: Record<string, unknown>): number {
  return DOLL_FIELD_KEYS.filter(key => key in input).length;
}

function looksLikeDollData(input: unknown): input is DollData {
  return isRecord(input) && countDollFields(input) >= 2 && ('代号' in input || '稀有度' in input || '能力' in input);
}

function unwrapDollData(parsedData: unknown): DollData | null {
  const normalized = normalizeObjectKeysDeep(parsedData);

  if (looksLikeDollData(normalized)) {
    return normalized;
  }

  if (Array.isArray(normalized)) {
    const firstDoll = normalized.find(item => looksLikeDollData(item));
    return firstDoll ? (firstDoll as DollData) : null;
  }

  if (!isRecord(normalized)) return null;

  const wrapperKeys = ['doll_files', 'DOLL_FILES', '人形生成', '人形档案', '人形資料', '人形资料'];
  for (const key of wrapperKeys) {
    const value = normalized[key];
    if (looksLikeDollData(value)) return value;
    if (Array.isArray(value)) {
      const firstDoll = value.find(item => looksLikeDollData(item));
      if (firstDoll) return firstDoll as DollData;
    }
  }

  const entries = Object.entries(normalized);
  if (entries.length === 1) {
    const [codeName, value] = entries[0];
    if (isRecord(value) && countDollFields(value) >= 2) {
      return {
        代号: String(value.代号 || codeName),
        ...value,
      } as DollData;
    }
  }

  return null;
}

function unwrapDollFilesWrapper(yamlStr: string): { source: string; lineOffset: number } {
  const text = decodeCommonHtmlEntities(String(yamlStr ?? '')).trim();
  const openMatch = text.match(/^<doll_files>\s*/i) || text.match(/^<人形生成>\s*/i);
  const closeMatch = text.match(/\s*<\/doll_files>$/i) || text.match(/\s*<\/人形生成>$/i);

  if (!openMatch || !closeMatch || openMatch[0].length >= text.length - closeMatch[0].length) {
    return { source: text, lineOffset: 0 };
  }

  const source = text.slice(openMatch[0].length, text.length - closeMatch[0].length);
  const lineOffset = openMatch[0].split('\n').length - 1;
  return { source, lineOffset };
}

function prepareYaml(yamlStr: string): PreparedYaml {
  if (!yamlStr) return { cleaned: '', source: '', lineOffset: 0 };

  const unwrapped = unwrapDollFilesWrapper(yamlStr);
  const normalized = unwrapped.source
    .replace(/\u00A0/g, ' ')
    .replace(/\t/g, '  ')
    .replace(/】/g, ']')
    .replace(/【/g, '[');

  const lines = normalized.split('\n');
  const sensitiveKeys = [
    '代号',
    '代號',
    '稀有度',
    '身份',
    '身分',
    '职业',
    '職業',
    '性格',
    '喜爱',
    '喜愛',
    '外貌',
    '着装',
    '著裝',
    '战术',
    '戰術',
    '战损程度',
    '戰損程度',
    '描述',
    '效果',
    '消耗',
    '类型',
    '類型',
    '名称',
    '名稱',
    '等级',
    '等級',
    '位置',
    '射程',
    '射击次数',
    '射擊次數',
    '威力',
    '状态',
    '狀態',
    '副作用',
  ];
  const attrKeys = [
    '破坏能级',
    '破壞能級',
    '结构韧性',
    '結構韌性',
    '神经机动',
    '神經機動',
    '链路算力',
    '鏈路算力',
    '工程制造',
    '工程製造',
    '理智屏障',
    '素体潜能',
    '素體潛能',
  ];

  const cleanedLines = lines.map(line => {
    line = line.replace(/^(\s*)(-\s*)?([-\w\u4e00-\u9fa5]+)\s*：/, (_m, indent, dash, key) => {
      return `${indent}${dash || ''}${key}:`;
    });

    const match = line.match(/^(\s*)(-\s*)?([-\w\u4e00-\u9fa5]+)\s*:\s*(.*)$/);
    if (!match) return line;

    const indent = match[1];
    const dash = match[2] || '';
    const key = match[3];
    let val = match[4].trim();

    if (!val) return line;
    if (val.startsWith('|') || val.startsWith('>')) return line;

    if (attrKeys.some(k => key.includes(k))) {
      if ((/[+=]/.test(val) || val.includes('{')) && !/^["'].*["']$/.test(val)) {
        val = val.replace(/"/g, '\\"');
        return `${indent}${dash}${key}: "${val}"`;
      }
    }

    const isSensitive = sensitiveKeys.some(k => key.includes(k));
    const hasDangerousChars = /[{}[\]]/.test(val);
    const hasQuoteInside = val.includes('"');
    const isFullyQuoted = /^["'].*["']$/.test(val);

    if ((isSensitive || hasDangerousChars || hasQuoteInside) && !isFullyQuoted) {
      val = val.replace(/"/g, '\\"');
      return `${indent}${dash}${key}: "${val}"`;
    }

    return line;
  });

  return {
    cleaned: cleanedLines.join('\n'),
    source: unwrapped.source,
    lineOffset: unwrapped.lineOffset,
  };
}

export function cleanYaml(yamlStr: string): string {
  return prepareYaml(yamlStr).cleaned;
}

function buildFriendlyYamlError(
  err: unknown,
  originalYaml: string,
  cleanedYaml: string,
  lineOffset: number,
): FriendlyYamlError {
  const e = err as { reason?: string; message?: string; mark?: { line?: number; column?: number } };
  const mark = e?.mark;
  const message = String(e?.reason || e?.message || String(err));

  if (!mark || typeof mark.line !== 'number') {
    return { message };
  }

  const line = mark.line;
  const column = typeof mark.column === 'number' ? mark.column : 0;
  const originalLineIndex = line + lineOffset;
  const originalLines = String(originalYaml ?? '').split('\n');
  const cleanedLines = String(cleanedYaml ?? '').split('\n');
  const cleanedLine = visualizeForDisplay(cleanedLines[line] ?? '');
  const originalLine = visualizeForDisplay(originalLines[originalLineIndex] ?? '');
  const caretPad = ' '.repeat(Math.max(0, Math.min(column, cleanedLine.length)));

  return {
    message,
    line: originalLineIndex,
    column,
    cleanedLine,
    originalLine,
    caretLine: `${caretPad}^`,
  };
}

export function parseDollYaml(yamlText: string): ParseResult {
  const prepared = prepareYaml(yamlText);
  try {
    const parsedData = load(prepared.cleaned) as unknown;
    if (!parsedData) throw new Error('解析结果为空');

    const dollData = unwrapDollData(parsedData);
    if (!dollData) {
      throw new Error('解析结果不是当前人形资料结构，请确认 YAML 顶层包含 代号、稀有度、能力、装备、植入物、技能 等字段');
    }

    return { success: true, data: dollData };
  } catch (err) {
    return {
      success: false,
      error: buildFriendlyYamlError(err, yamlText, prepared.cleaned, prepared.lineOffset),
    };
  }
}

export const parseCharacterYaml = parseDollYaml;
