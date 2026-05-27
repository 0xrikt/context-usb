export const STRUCTURIZE_PROMPT = `你是一个个人上下文分析师。你的任务是从用户的个人记录中提取关于用户本人的深层信息，生成一份结构化的个人画像。

## 输入
用户从个人笔记、社交媒体、日记等平台导出的记录。

## 输出要求
请严格按照以下 JSON 格式输出。每个字段都要有内容——如果信息不足，写"暂无足够信息"而不是留空。

{
  "identity": {
    "summary": "一句话概括这个人",
    "traits": ["性格特征，每条 10-20 字描述"],
    "values": ["看重什么、信什么"],
    "life_stage": "当前人生阶段和核心身份"
  },
  "interests": {
    "summary": "一句话概括兴趣取向",
    "reading": ["在读/喜欢的书或内容类型"],
    "topics": ["持续关注的话题"],
    "aesthetic": "审美和品味偏好"
  },
  "growth_journal": {
    "summary": "一句话概括近期状态",
    "recent_thoughts": ["近期的核心思考，每条 15-30 字"],
    "emotional_state": "近期情绪基调",
    "challenges": ["面对的挑战或困惑"],
    "breakthroughs": ["近期的领悟或突破"]
  },
  "relationships": {
    "summary": "一句话概括社交模式",
    "important_people": ["提到的重要人物及与用户的关系"],
    "social_patterns": "社交风格和模式"
  },
  "goals": {
    "summary": "一句话概括目标方向",
    "short_term": ["近期想做的事"],
    "long_term": ["长期方向或愿景"],
    "dilemmas": ["正在纠结的决定"]
  },
  "voice": {
    "summary": "一句话概括表达风格",
    "style": "表达风格描述（直接/含蓄/幽默/学术等）",
    "common_expressions": ["常用表达或口头禅"],
    "humor_type": "幽默方式"
  }
}

## 规则
1. 只提取有证据支持的信息。宁可写"暂无足够信息"也不要推测
2. 所有描述用自然中文，像在向一个朋友介绍这个人
3. 注意时间线：区分"过去"和"当前"
4. 如果有矛盾（先说想做A后说想做B），如实标记为纠结
5. 总输出控制在合理范围，每个数组最多 5 条

## 用户记录
---
{entries}
---

请直接输出 JSON，不要包含 markdown 代码块标记。`;

export function buildStructurizePrompt(entries: string): string {
  return STRUCTURIZE_PROMPT.replace('{entries}', entries);
}

export function buildContextMarkdown(
  type: string,
  data: Record<string, unknown>
): string {
  switch (type) {
    case 'identity':
      return buildIdentity(data);
    case 'interests':
      return buildInterests(data);
    case 'growth-journal':
      return buildGrowthJournal(data);
    case 'relationships':
      return buildRelationships(data);
    case 'goals':
      return buildGoals(data);
    case 'voice':
      return buildVoice(data);
    default:
      return '';
  }
}

function buildIdentity(d: Record<string, unknown>): string {
  const summary = d.summary as string || '';
  const traits = (d.traits as string[]) || [];
  const values = (d.values as string[]) || [];
  const lifeStage = d.life_stage as string || '';
  return [
    summary ? `> ${summary}` : '',
    '',
    lifeStage ? `**人生阶段**：${lifeStage}` : '',
    '',
    traits.length > 0 ? `**性格特征**：\n${traits.map(t => `- ${t}`).join('\n')}` : '',
    '',
    values.length > 0 ? `**价值观**：\n${values.map(v => `- ${v}`).join('\n')}` : '',
  ].filter(Boolean).join('\n');
}

function buildInterests(d: Record<string, unknown>): string {
  const summary = d.summary as string || '';
  const reading = (d.reading as string[]) || [];
  const topics = (d.topics as string[]) || [];
  const aesthetic = d.aesthetic as string || '';
  return [
    summary ? `> ${summary}` : '',
    '',
    reading.length > 0 ? `**阅读偏好**：\n${reading.map(r => `- ${r}`).join('\n')}` : '',
    '',
    topics.length > 0 ? `**关注话题**：\n${topics.map(t => `- ${t}`).join('\n')}` : '',
    '',
    aesthetic ? `**审美取向**：${aesthetic}` : '',
  ].filter(Boolean).join('\n');
}

function buildGrowthJournal(d: Record<string, unknown>): string {
  const summary = d.summary as string || '';
  const thoughts = (d.recent_thoughts as string[]) || [];
  const emotional = d.emotional_state as string || '';
  const challenges = (d.challenges as string[]) || [];
  const breakthroughs = (d.breakthroughs as string[]) || [];
  return [
    summary ? `> ${summary}` : '',
    '',
    emotional ? `**近期情绪**：${emotional}` : '',
    '',
    thoughts.length > 0 ? `**核心思考**：\n${thoughts.map(t => `- ${t}`).join('\n')}` : '',
    '',
    challenges.length > 0 ? `**面对的挑战**：\n${challenges.map(c => `- ${c}`).join('\n')}` : '',
    '',
    breakthroughs.length > 0 ? `**近期领悟**：\n${breakthroughs.map(b => `- ${b}`).join('\n')}` : '',
  ].filter(Boolean).join('\n');
}

function buildRelationships(d: Record<string, unknown>): string {
  const summary = d.summary as string || '';
  const people = (d.important_people as string[]) || [];
  const patterns = d.social_patterns as string || '';
  return [
    summary ? `> ${summary}` : '',
    '',
    people.length > 0 ? `**重要的人**：\n${people.map(p => `- ${p}`).join('\n')}` : '',
    '',
    patterns ? `**社交模式**：${patterns}` : '',
  ].filter(Boolean).join('\n');
}

function buildGoals(d: Record<string, unknown>): string {
  const summary = d.summary as string || '';
  const shortTerm = (d.short_term as string[]) || [];
  const longTerm = (d.long_term as string[]) || [];
  const dilemmas = (d.dilemmas as string[]) || [];
  return [
    summary ? `> ${summary}` : '',
    '',
    shortTerm.length > 0 ? `**近期目标**：\n${shortTerm.map(s => `- ${s}`).join('\n')}` : '',
    '',
    longTerm.length > 0 ? `**长期愿景**：\n${longTerm.map(l => `- ${l}`).join('\n')}` : '',
    '',
    dilemmas.length > 0 ? `**纠结中**：\n${dilemmas.map(d => `- ${d}`).join('\n')}` : '',
  ].filter(Boolean).join('\n');
}

function buildVoice(d: Record<string, unknown>): string {
  const summary = d.summary as string || '';
  const style = d.style as string || '';
  const expressions = (d.common_expressions as string[]) || [];
  const humor = d.humor_type as string || '';
  return [
    summary ? `> ${summary}` : '',
    '',
    style ? `**表达风格**：${style}` : '',
    '',
    expressions.length > 0 ? `**常用表达**：\n${expressions.map(e => `- "${e}"`).join('\n')}` : '',
    '',
    humor ? `**幽默方式**：${humor}` : '',
  ].filter(Boolean).join('\n');
}
