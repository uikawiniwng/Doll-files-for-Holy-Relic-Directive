export type Rarity = 'D' | 'C' | 'B' | 'A' | 'S' | 'X' | 'EX' | string;

export type EffectMap = Record<string, string>;

export interface EquipmentData {
  名称?: string;
  等级?: string;
  类型?: string;
  位置?: string;
  射程?: string;
  射击次数?: string;
  威力?: string;
  效果?: EffectMap | string;
  描述?: string;
  状态?: string;
  [key: string]: any;
}

export interface ImplantData {
  名称?: string;
  等级?: string;
  类型?: string;
  效果?: EffectMap | string;
  副作用?: string;
  描述?: string;
  状态?: string;
  [key: string]: any;
}

export interface SkillData {
  名称?: string;
  等级?: string;
  类型?: string;
  消耗?: string;
  效果?: EffectMap | string;
  描述?: string;
  [key: string]: any;
}

export interface DollData {
  代号?: string;
  稀有度?: Rarity;
  在场?: boolean | string;
  精神负荷?: number | string;
  好感度?: number | string;
  身份?: string | string[];
  职业?: string | string[];
  性格?: string | string[];
  喜爱?: string | string[];
  外貌?: string;
  着装?: string;
  能力?: Partial<
    Record<'破坏能级' | '结构韧性' | '神经机动' | '链路算力' | '工程制造' | '理智屏障' | '素体潜能', string | number>
  >;
  战术?: string;
  战损程度?: string;
  装备?: EquipmentData[];
  植入物?: ImplantData[];
  技能?: SkillData[];
  [key: string]: any;
}

export interface ParseSuccess {
  success: true;
  data: DollData;
}

export interface FriendlyYamlError {
  message: string;
  line?: number;
  column?: number;
  cleanedLine?: string;
  originalLine?: string;
  caretLine?: string;
}

export interface ParseFailure {
  success: false;
  error: FriendlyYamlError;
}

export type ParseResult = ParseSuccess | ParseFailure;

export interface ThemeResolved {
  rarity: string;
  rarityHex: string;
  rarityRgb: string;
  tier: number;
  raceKey: string;
  raceHex: string;
  tierHex: string;
  raceRgb: string;
  tierRgb: string;
}
