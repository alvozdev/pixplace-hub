import { workflow, node, trigger, sticky, newCredential, ifElse, expr } from '@n8n/workflow-sdk';

const USED_IDS_TABLE = { __rl: true, mode: 'list', value: 'zgqakM1tyoPihe7E', cachedResultName: 'USED_IDs' };
const usedIdColumns = ['clip_art', 'interior', 'fashion', 'product_mocups'];
const stringColumn = (id) => ({ id, displayName: id, required: false, defaultMatch: false, display: true, type: 'string', readOnly: false, removed: false });

// ---------------------------------------------------------------- generate

const generateWebhook = trigger({
  type: 'n8n-nodes-base.webhook',
  version: 2.1,
  config: {
    name: 'Generate Webhook',
    parameters: { httpMethod: 'POST', path: 'pixplace-hub/generate', authentication: 'headerAuth', responseMode: 'onReceived', options: { responseData: '{"accepted":true}' } },
    credentials: { httpHeaderAuth: newCredential('pixPLace Hub token') },
    position: [0, 300],
  },
  output: [{ headers: { 'x-hub-token': 'secret' }, body: { jobId: 'job_1', callbackUrl: 'https://hub.example/api/n8n/callback', niche: { id: 'clipart', dedupColumn: 'clip_art', datasetUrl: 'https://dataset.example/api', analyze: {}, variants: {}, styles: [], image: {} } } }],
});

const loadIdeas = node({
  type: 'n8n-nodes-base.httpRequest',
  version: 4.3,
  config: {
    name: 'Load Ideas Dataset',
    parameters: { method: 'GET', url: expr('{{ $json.body.niche.datasetUrl }}'), options: { timeout: 60000, response: { response: { responseFormat: 'json' } } } },
    retryOnFail: true,
    maxTries: 3,
    waitBetweenTries: 5000,
    onError: 'continueErrorOutput',
    position: [220, 300],
  },
  output: [{ id: '123', image: { url: 'https://i.pinimg.com/x.jpg' }, title: 'Idea' }],
});

const getUsedIds = node({
  type: 'n8n-nodes-base.dataTable',
  version: 1.1,
  config: {
    name: 'Get Used Ids',
    parameters: { resource: 'row', operation: 'get', dataTableId: USED_IDS_TABLE, returnAll: true },
    executeOnce: true,
    alwaysOutputData: true,
    position: [440, 300],
  },
  output: [{ id: 1, clip_art: '122' }],
});

const pickIdea = node({
  type: 'n8n-nodes-base.code',
  version: 2,
  config: {
    name: 'Pick Unused Idea',
    parameters: {
      mode: 'runOnceForAllItems',
      jsCode: [
        "const { niche } = $('Generate Webhook').first().json.body;",
        'const column = niche.dedupColumn;',
        "const used = new Set($input.all().map(i => i.json[column]).filter(v => v != null && v !== '' && v !== '-').map(v => String(v).trim()));",
        'const ideas = [];',
        "for (const it of $('Load Ideas Dataset').all()) {",
        '  const j = it.json || {};',
        '  if (Array.isArray(j.pins)) ideas.push(...j.pins);',
        '  else if (Array.isArray(j.data)) ideas.push(...j.data);',
        '  else if (j.id) ideas.push(j);',
        '}',
        'const imageOf = p => p?.image?.url || p?.image_url || p?.imageUrl || p?.images?.orig?.url;',
        'const fresh = ideas.filter(p => p && p.id != null && !used.has(String(p.id).trim()) && imageOf(p));',
        'if (!fresh.length) throw new Error(`Нет неиспользованных идей в датасете: всего ${ideas.length}, уже использовано ${used.size}`);',
        'const idea = fresh[Math.floor(Math.random() * fresh.length)];',
        'return [{ json: { pinId: String(idea.id).trim(), imageUrl: imageOf(idea), ideaTitle: idea.title || idea.grid_title || "", ideasLeft: fresh.length - 1, ideasTotal: ideas.length } }];',
      ].join('\n'),
    },
    onError: 'continueErrorOutput',
    position: [660, 300],
  },
  output: [{ pinId: '123', imageUrl: 'https://i.pinimg.com/x.jpg', ideaTitle: 'Idea', ideasLeft: 10, ideasTotal: 50 }],
});

const markPicked = node({
  type: 'n8n-nodes-base.dataTable',
  version: 1.1,
  config: {
    name: 'Mark Idea Picked',
    parameters: {
      resource: 'row',
      operation: 'insert',
      dataTableId: USED_IDS_TABLE,
      columns: {
        mappingMode: 'defineBelow',
        value: {
          clip_art: expr("{{ $('Generate Webhook').first().json.body.niche.dedupColumn === 'clip_art' ? $json.pinId : '-' }}"),
          interior: expr("{{ $('Generate Webhook').first().json.body.niche.dedupColumn === 'interior' ? $json.pinId : '-' }}"),
          fashion: expr("{{ $('Generate Webhook').first().json.body.niche.dedupColumn === 'fashion' ? $json.pinId : '-' }}"),
          product_mocups: expr("{{ $('Generate Webhook').first().json.body.niche.dedupColumn === 'product_mocups' ? $json.pinId : '-' }}"),
          used_prompt: expr("hub:picked {{ $('Generate Webhook').first().json.body.jobId }}"),
        },
        matchingColumns: [],
        schema: [...usedIdColumns, 'used_prompt'].map(stringColumn),
      },
    },
    onError: 'continueErrorOutput',
    position: [880, 300],
  },
  output: [{ id: 501 }],
});

const buildAnalyzeRequest = node({
  type: 'n8n-nodes-base.code',
  version: 2,
  config: {
    name: 'Build Analyze Request',
    parameters: {
      mode: 'runOnceForAllItems',
      jsCode: [
        "const { niche } = $('Generate Webhook').first().json.body;",
        "const idea = $('Pick Unused Idea').first().json;",
        'const a = niche.analyze;',
        'const schema = {',
        "  type: 'object', additionalProperties: false,",
        "  required: ['base_prompt', 'title', 'seo_description', 'alt_text'],",
        '  properties: {',
        "    base_prompt: { type: 'string', description: 'Text-to-image prompt that captures the core idea, 80-200 words, one paragraph, English.' },",
        "    title: { type: 'string', description: 'Post title, under 80 characters.' },",
        "    seo_description: { type: 'string', description: 'SEO description, 1-3 sentences.' },",
        "    alt_text: { type: 'string', description: 'Alt text, one sentence.' },",
        '  },',
        '};',
        'return [{ json: { body: {',
        '  model: a.model,',
        '  messages: [',
        "    { role: 'system', content: a.system },",
        "    { role: 'user', content: [{ type: 'text', text: a.user }, { type: 'image_url', image_url: { url: idea.imageUrl } }] },",
        '  ],',
        "  response_format: { type: 'json_schema', json_schema: { name: 'idea_analysis', strict: true, schema } },",
        '  max_tokens: a.maxTokens || 1500,',
        '  temperature: a.temperature ?? 0.7,',
        '} } }];',
      ].join('\n'),
    },
    position: [1100, 300],
  },
  output: [{ body: { model: 'meta-llama/llama-4-maverick', messages: [] } }],
});

const analyzeImage = node({
  type: 'n8n-nodes-base.httpRequest',
  version: 4.3,
  config: {
    name: 'Analyze Idea Image',
    parameters: {
      method: 'POST',
      url: 'https://openrouter.ai/api/v1/chat/completions',
      authentication: 'genericCredentialType',
      genericAuthType: 'httpHeaderAuth',
      sendBody: true,
      specifyBody: 'json',
      jsonBody: expr('{{ JSON.stringify($json.body) }}'),
      options: { timeout: 120000 },
    },
    credentials: { httpHeaderAuth: newCredential('OpenRouter') },
    retryOnFail: true,
    maxTries: 3,
    waitBetweenTries: 5000,
    onError: 'continueErrorOutput',
    position: [1320, 300],
  },
  output: [{ choices: [{ message: { content: '{"base_prompt":"...","title":"...","seo_description":"...","alt_text":"..."}' } }], usage: { cost: 0.002 } }],
});

const parseAnalysis = node({
  type: 'n8n-nodes-base.code',
  version: 2,
  config: {
    name: 'Parse Analysis',
    parameters: {
      mode: 'runOnceForAllItems',
      jsCode: [
        'const res = $input.first().json;',
        'const raw = res.choices?.[0]?.message?.content;',
        "if (!raw) throw new Error('Модель анализа вернула пустой ответ');",
        'let d;',
        "try { d = JSON.parse(String(raw).replace(/```json|```/gi, '').trim()); }",
        "catch (e) { throw new Error('Модель анализа вернула не JSON: ' + e.message); }",
        'if (Array.isArray(d)) d = d[0];',
        "for (const k of ['base_prompt', 'title', 'seo_description', 'alt_text']) if (!d?.[k]) throw new Error('В ответе анализа нет поля ' + k);",
        'return [{ json: { ...d, llmCost: res.usage?.cost ?? 0 } }];',
      ].join('\n'),
    },
    onError: 'continueErrorOutput',
    position: [1540, 300],
  },
  output: [{ base_prompt: 'A bold sticker of a fox', title: 'Fox sticker', seo_description: 'Fox sticker idea.', alt_text: 'A fox sticker.', llmCost: 0.002 }],
});

const buildVariantsRequest = node({
  type: 'n8n-nodes-base.code',
  version: 2,
  config: {
    name: 'Build Variants Request',
    parameters: {
      mode: 'runOnceForAllItems',
      jsCode: [
        "const { niche } = $('Generate Webhook').first().json.body;",
        'const base = $input.first().json;',
        'const v = niche.variants;',
        'const properties = {};',
        'const required = [];',
        'for (const s of niche.styles) {',
        '  const k = s.key.toLowerCase();',
        "  properties['prompt_' + k] = { type: 'string', description: `Prompt for style ${s.key} (${s.direction}). 80-200 words, one paragraph, English.` };",
        "  properties['negative_' + k] = { type: 'string', description: 'Negative prompt, under 40 words.' };",
        "  properties['title_' + k] = { type: 'string', description: 'SEO title, under 80 characters.' };",
        "  properties['description_' + k] = { type: 'string', description: 'SEO description, 1-3 sentences.' };",
        "  properties['alt_' + k] = { type: 'string', description: 'Alt text, one sentence.' };",
        "  required.push('prompt_' + k, 'negative_' + k, 'title_' + k, 'description_' + k, 'alt_' + k);",
        '}',
        "const styles = niche.styles.map(s => `- ${s.key}: ${s.direction}`).join('\\n');",
        "const user = v.user.split('{prompt}').join(base.base_prompt).split('{styles}').join(styles);",
        'return [{ json: { body: {',
        '  model: v.model,',
        "  messages: [{ role: 'system', content: v.system }, { role: 'user', content: user }],",
        "  response_format: { type: 'json_schema', json_schema: { name: 'style_variants', strict: true, schema: { type: 'object', additionalProperties: false, required, properties } } },",
        '  max_tokens: v.maxTokens || 3000,',
        '  temperature: v.temperature ?? 0.8,',
        '} } }];',
      ].join('\n'),
    },
    position: [1760, 300],
  },
  output: [{ body: { model: 'openai/gpt-4.1-mini', messages: [] } }],
});

const writeVariants = node({
  type: 'n8n-nodes-base.httpRequest',
  version: 4.3,
  config: {
    name: 'Write Style Variants',
    parameters: {
      method: 'POST',
      url: 'https://openrouter.ai/api/v1/chat/completions',
      authentication: 'genericCredentialType',
      genericAuthType: 'httpHeaderAuth',
      sendBody: true,
      specifyBody: 'json',
      jsonBody: expr('{{ JSON.stringify($json.body) }}'),
      options: { timeout: 120000 },
    },
    credentials: { httpHeaderAuth: newCredential('OpenRouter') },
    retryOnFail: true,
    maxTries: 3,
    waitBetweenTries: 5000,
    onError: 'continueErrorOutput',
    position: [1980, 300],
  },
  output: [{ choices: [{ message: { content: '{"prompt_a":"..."}' } }], usage: { cost: 0.003 } }],
});

const splitVariants = node({
  type: 'n8n-nodes-base.code',
  version: 2,
  config: {
    name: 'Split Into Variants',
    parameters: {
      mode: 'runOnceForAllItems',
      jsCode: [
        "const { niche } = $('Generate Webhook').first().json.body;",
        'const res = $input.first().json;',
        'const raw = res.choices?.[0]?.message?.content;',
        "if (!raw) throw new Error('Модель стилей вернула пустой ответ');",
        'let d;',
        "try { d = JSON.parse(String(raw).replace(/```json|```/gi, '').trim()); }",
        "catch (e) { throw new Error('Модель стилей вернула не JSON: ' + e.message); }",
        'const img = niche.image;',
        "const uuid = () => 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, c => { const r = Math.random() * 16 | 0; return (c === 'x' ? r : (r & 3) | 8).toString(16); });",
        'return niche.styles.map((s, index) => {',
        '  const k = s.key.toLowerCase();',
        "  const prompt = d['prompt_' + k];",
        '  if (!prompt) throw new Error(`Нет промпта для стиля ${s.key}`);',
        "  const negative = d['negative_' + k] || '';",
        "  const positivePrompt = (s.suffix || '{prompt}').split('{prompt}').join(prompt).slice(0, 2900);",
        '  const task = {',
        "    taskType: 'imageInference', taskUUID: uuid(), model: img.model,",
        '    steps: s.steps ?? img.steps ?? 20, CFGScale: img.cfg ?? 4, numberResults: 1,',
        '    positivePrompt, width: img.width, height: img.height,',
        "    includeCost: true, checkNSFW: true, outputType: ['URL'], outputFormat: img.format || 'WEBP',",
        '  };',
        '  if (negative) task.negativePrompt = negative.slice(0, 2900);',
        '  if (img.lora?.length) task.lora = img.lora;',
        '  return { json: {',
        "    index, style: s.key, label: s.label, prompt, negative,",
        "    seoTitle: d['title_' + k], seoDescription: d['description_' + k], altText: d['alt_' + k],",
        '    llmCost: res.usage?.cost ?? 0, runwareBody: [task],',
        '  } };',
        '});',
      ].join('\n'),
    },
    onError: 'continueErrorOutput',
    position: [2200, 300],
  },
  output: [{ index: 0, style: 'A', label: 'Marker', prompt: '...', negative: '', seoTitle: '', seoDescription: '', altText: '', llmCost: 0, runwareBody: [{}] }],
});

const renderVariant = node({
  type: 'n8n-nodes-base.httpRequest',
  version: 4.3,
  config: {
    name: 'Render Variant',
    parameters: {
      method: 'POST',
      url: 'https://api.runware.ai/v1/',
      authentication: 'genericCredentialType',
      genericAuthType: 'httpHeaderAuth',
      sendBody: true,
      specifyBody: 'json',
      jsonBody: expr('{{ JSON.stringify($json.runwareBody) }}'),
      options: { timeout: 180000 },
    },
    credentials: { httpHeaderAuth: newCredential('Runware') },
    retryOnFail: true,
    maxTries: 2,
    waitBetweenTries: 5000,
    onError: 'continueErrorOutput',
    position: [2420, 300],
  },
  output: [{ data: [{ imageURL: 'https://im.runware.ai/image/x.webp', cost: 0.004, seed: 42 }] }],
});

const assembleDraft = node({
  type: 'n8n-nodes-base.code',
  version: 2,
  config: {
    name: 'Assemble Draft',
    parameters: {
      mode: 'runOnceForAllItems',
      jsCode: [
        "const body = $('Generate Webhook').first().json.body;",
        "const idea = $('Pick Unused Idea').first().json;",
        "const analysis = $('Parse Analysis').first().json;",
        "const picked = $('Mark Idea Picked').first().json;",
        "const parts = $('Split Into Variants').all();",
        'const rendered = $input.all();',
        'const variants = parts.map((p, i) => {',
        '  const r = rendered[i]?.json?.data?.[0] || {};',
        '  if (!r.imageURL) throw new Error(`Runware не вернул картинку для стиля ${p.json.style}`);',
        '  return { style: p.json.style, label: p.json.label, prompt: p.json.prompt, negative: p.json.negative,',
        '    seoTitle: p.json.seoTitle, seoDescription: p.json.seoDescription, altText: p.json.altText,',
        '    imageUrl: r.imageURL, cost: Number(r.cost) || 0, seed: r.seed ?? null };',
        '});',
        'const imageCost = variants.reduce((s, v) => s + v.cost, 0);',
        'const llmCost = (Number(analysis.llmCost) || 0) + (Number(parts[0]?.json.llmCost) || 0);',
        'return [{ json: { jobId: body.jobId, status: "ready", draft: {',
        '  nicheId: body.niche.id, pinId: idea.pinId, sourceImageUrl: idea.imageUrl, usedRowId: picked.id,',
        '  title: analysis.title, seoDescription: analysis.seo_description, altText: analysis.alt_text, basePrompt: analysis.base_prompt,',
        '  variants, width: body.niche.image.width, height: body.niche.image.height,',
        '  cost: { images: imageCost, llm: llmCost, total: imageCost + llmCost },',
        '  ideasLeft: idea.ideasLeft, ideasTotal: idea.ideasTotal,',
        '} } }];',
      ].join('\n'),
    },
    onError: 'continueErrorOutput',
    position: [2640, 300],
  },
  output: [{ jobId: 'job_1', status: 'ready', draft: { variants: [] } }],
});

const returnDraft = node({
  type: 'n8n-nodes-base.httpRequest',
  version: 4.3,
  config: {
    name: 'Return Draft to Hub',
    parameters: {
      method: 'POST',
      url: expr("{{ $('Generate Webhook').first().json.body.callbackUrl }}"),
      sendHeaders: true,
      headerParameters: { parameters: [{ name: 'x-hub-token', value: expr("{{ $('Generate Webhook').first().json.headers['x-hub-token'] }}") }] },
      sendBody: true,
      specifyBody: 'json',
      jsonBody: expr('{{ JSON.stringify($json) }}'),
      options: { timeout: 30000 },
    },
    retryOnFail: true,
    maxTries: 3,
    waitBetweenTries: 3000,
    position: [2860, 300],
  },
  output: [{ ok: true }],
});

const reportGenerateFailure = node({
  type: 'n8n-nodes-base.httpRequest',
  version: 4.3,
  config: {
    name: 'Report Generation Failure',
    parameters: {
      method: 'POST',
      url: expr("{{ $('Generate Webhook').first().json.body.callbackUrl }}"),
      sendHeaders: true,
      headerParameters: { parameters: [{ name: 'x-hub-token', value: expr("{{ $('Generate Webhook').first().json.headers['x-hub-token'] }}") }] },
      sendBody: true,
      specifyBody: 'json',
      jsonBody: expr("{{ JSON.stringify({ jobId: $('Generate Webhook').first().json.body.jobId, status: 'failed', error: String($json.error?.message || $json.error || $json.message || 'Ошибка в n8n при генерации') }) }}"),
      options: { timeout: 30000 },
    },
    executeOnce: true,
    retryOnFail: true,
    maxTries: 3,
    waitBetweenTries: 3000,
    position: [1540, 600],
  },
  output: [{ ok: true }],
});

// ----------------------------------------------------------------- publish

const publishWebhook = trigger({
  type: 'n8n-nodes-base.webhook',
  version: 2.1,
  config: {
    name: 'Publish Webhook',
    parameters: { httpMethod: 'POST', path: 'pixplace-hub/publish', authentication: 'headerAuth', responseMode: 'onReceived', options: { responseData: '{"accepted":true}' } },
    credentials: { httpHeaderAuth: newCredential('pixPLace Hub token') },
    position: [0, 1000],
  },
  output: [{ headers: { 'x-hub-token': 'secret' }, body: { jobId: 'job_1', callbackUrl: 'https://hub.example/api/n8n/callback', makeWebhookUrl: '', niche: { id: 'clipart', telegram: {} }, draft: { variants: [] } } }],
});

const buildAlbum = node({
  type: 'n8n-nodes-base.code',
  version: 2,
  config: {
    name: 'Build Telegram Album',
    parameters: {
      mode: 'runOnceForAllItems',
      jsCode: [
        "const { niche, draft } = $('Publish Webhook').first().json.body;",
        'const tg = niche.telegram;',
        "const esc = s => String(s ?? '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');",
        "const visible = html => html.replace(/<[^>]+>/g, '').replace(/&(amp|lt|gt);/g, '_');",
        "const utm = encodeURIComponent(tg.utmCampaign || niche.id);",
        'const runLink = p => `https://app.pixplace.space/?prompt=${encodeURIComponent(p)}&utm_source=telegram&utm_campaign=${utm}`;',
        'const build = snippet => {',
        '  const lines = draft.variants.map(v => {',
        "    const cut = snippet ? ` <i>${esc(v.prompt.slice(0, snippet))}…</i>` : '';",
        '    return `<b>${esc(v.style)}</b> · ${esc(v.label)}${cut} <a href="${runLink(v.prompt)}">[ RUN ${esc(v.style)} IN APP ]</a>`;',
        '  });',
        "  const parts = [`<b>${esc(draft.title)}</b>`];",
        '  if (tg.intro) parts.push(esc(tg.intro));',
        "  parts.push(lines.join('\\n\\n'));",
        '  if (tg.footer) parts.push(esc(tg.footer));',
        '  if (tg.hashtags) parts.push(esc(tg.hashtags));',
        "  return parts.join('\\n\\n');",
        '};',
        'let caption = null;',
        'for (const snippet of [110, 70, 40, 0]) {',
        '  const c = build(snippet);',
        '  if (visible(c).length <= 1000) { caption = c; break; }',
        '}',
        "if (!caption) throw new Error('Подпись не помещается в лимит Telegram 1024 символа даже без фрагментов промптов');",
        'return [{ json: {',
        '  chatId: String(tg.chatId), threadId: Number(tg.threadId) || 0, caption,',
        '  media: draft.variants.map(v => v.imageUrl),',
        '} }];',
      ].join('\n'),
    },
    onError: 'continueErrorOutput',
    position: [220, 1000],
  },
  output: [{ chatId: '-1003815965313', threadId: 21, caption: '<b>Title</b>', media: ['https://a', 'https://b', 'https://c', 'https://d'] }],
});

const postAlbum = node({
  type: 'n8n-nodes-base.telegram',
  version: 1.2,
  config: {
    name: 'Post Album to Group',
    parameters: {
      resource: 'message',
      operation: 'sendMediaGroup',
      chatId: expr('{{ $json.chatId }}'),
      media: {
        media: [
          { type: 'photo', media: expr('{{ $json.media[0] }}'), additionalFields: { caption: expr('{{ $json.caption }}'), parse_mode: 'HTML' } },
          { type: 'photo', media: expr('{{ $json.media[1] }}'), additionalFields: {} },
          { type: 'photo', media: expr('{{ $json.media[2] }}'), additionalFields: {} },
          { type: 'photo', media: expr('{{ $json.media[3] }}'), additionalFields: {} },
        ],
      },
      additionalFields: { disable_notification: true, message_thread_id: expr('{{ $json.threadId }}') },
    },
    credentials: { telegramApi: newCredential('pixPLace Telegram bot') },
    onError: 'continueErrorOutput',
    position: [440, 1000],
  },
  output: [{ ok: true, result: [{ message_id: 777 }] }],
});

const listImages = node({
  type: 'n8n-nodes-base.code',
  version: 2,
  config: {
    name: 'List Variant Images',
    parameters: {
      mode: 'runOnceForAllItems',
      jsCode: "return $('Publish Webhook').first().json.body.draft.variants.map((v, i) => ({ json: { index: i, url: v.imageUrl } }));",
    },
    position: [660, 1000],
  },
  output: [{ index: 0, url: 'https://im.runware.ai/image/a.webp' }],
});

const downloadImage = node({
  type: 'n8n-nodes-base.httpRequest',
  version: 4.3,
  config: {
    name: 'Download Variant Image',
    parameters: { method: 'GET', url: expr('{{ $json.url }}'), options: { timeout: 60000, response: { response: { responseFormat: 'file', outputPropertyName: 'image' } } } },
    retryOnFail: true,
    maxTries: 3,
    waitBetweenTries: 3000,
    onError: 'continueRegularOutput',
    position: [880, 1000],
  },
  output: [{ index: 0 }],
});

const stackImages = node({
  type: 'n8n-nodes-base.code',
  version: 2,
  config: {
    name: 'Stack Images',
    parameters: {
      mode: 'runOnceForAllItems',
      jsCode: [
        'const out = { json: {}, binary: {} };',
        '$input.all().forEach((it, i) => {',
        "  if (!it.binary?.image) throw new Error(`Не скачалась картинка ${i + 1} для коллажа`);",
        "  out.binary['image' + i] = it.binary.image;",
        '});',
        'return [out];',
      ].join('\n'),
    },
    onError: 'continueRegularOutput',
    position: [1100, 1000],
  },
  output: [{}],
});

const buildCollage = node({
  type: 'n8n-nodes-base.editImage',
  version: 1,
  config: {
    name: 'Build 4-in-1 Collage',
    parameters: {
      operation: 'multiStep',
      dataPropertyName: 'collage',
      operations: {
        operations: [
          { operation: 'create', backgroundColor: '#ffffff', width: expr("{{ $('Publish Webhook').first().json.body.draft.width * 2 }}"), height: expr("{{ $('Publish Webhook').first().json.body.draft.height * 2 }}") },
          { operation: 'composite', dataPropertyNameComposite: 'image0', positionX: 0, positionY: 0 },
          { operation: 'composite', dataPropertyNameComposite: 'image1', positionX: expr("{{ $('Publish Webhook').first().json.body.draft.width }}"), positionY: 0 },
          { operation: 'composite', dataPropertyNameComposite: 'image2', positionX: 0, positionY: expr("{{ $('Publish Webhook').first().json.body.draft.height }}") },
          { operation: 'composite', dataPropertyNameComposite: 'image3', positionX: expr("{{ $('Publish Webhook').first().json.body.draft.width }}"), positionY: expr("{{ $('Publish Webhook').first().json.body.draft.height }}") },
          { operation: 'resize', width: 50, height: 50, resizeOption: 'percent' },
        ],
      },
      options: { format: 'jpeg', quality: 88 },
    },
    onError: 'continueRegularOutput',
    position: [1320, 1000],
  },
  output: [{}],
});

const collageToDataUri = node({
  type: 'n8n-nodes-base.code',
  version: 2,
  config: {
    name: 'Collage to Data URI',
    parameters: {
      mode: 'runOnceForAllItems',
      jsCode: [
        "if (!$input.first().binary?.collage) throw new Error('Коллаж не собран');",
        "const buffer = await this.helpers.getBinaryDataBuffer(0, 'collage');",
        "const mime = $input.first().binary.collage.mimeType || 'image/jpeg';",
        "return [{ json: { body: [{ taskType: 'imageUpload', taskUUID: 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, c => { const r = Math.random() * 16 | 0; return (c === 'x' ? r : (r & 3) | 8).toString(16); }), image: `data:${mime};base64,${buffer.toString('base64')}` }] } }];",
      ].join('\n'),
    },
    onError: 'continueRegularOutput',
    position: [1540, 1000],
  },
  output: [{ body: [{ taskType: 'imageUpload' }] }],
});

const uploadCollage = node({
  type: 'n8n-nodes-base.httpRequest',
  version: 4.3,
  config: {
    name: 'Upload Collage to Runware',
    parameters: {
      method: 'POST',
      url: 'https://api.runware.ai/v1/',
      authentication: 'genericCredentialType',
      genericAuthType: 'httpHeaderAuth',
      sendBody: true,
      specifyBody: 'json',
      jsonBody: expr('{{ JSON.stringify($json.body) }}'),
      options: { timeout: 120000 },
    },
    credentials: { httpHeaderAuth: newCredential('Runware') },
    retryOnFail: true,
    maxTries: 2,
    waitBetweenTries: 5000,
    onError: 'continueRegularOutput',
    position: [1760, 1000],
  },
  output: [{ data: [{ imageURL: 'https://im.runware.ai/image/collage.jpg' }] }],
});

const buildMakePayload = node({
  type: 'n8n-nodes-base.code',
  version: 2,
  config: {
    name: 'Build Make Payload',
    parameters: {
      mode: 'runOnceForAllItems',
      jsCode: [
        "const { niche, draft } = $('Publish Webhook').first().json.body;",
        "const album = $('Post Album to Group').first().json;",
        'const messageId = album.result?.[0]?.message_id;',
        "const group = niche.telegram.publicUsername || 'pixplace_public';",
        "const offerLink = messageId ? `https://t.me/${group}/${niche.telegram.threadId}/${messageId}` : '';",
        "let collageUrl = '';",
        "try { collageUrl = $input.first().json.data?.[0]?.imageURL || ''; } catch (e) { collageUrl = ''; }",
        'const payload = { niche: niche.id, title: draft.title, offer_link: offerLink, "4_image_composite": collageUrl };',
        'for (const v of draft.variants) {',
        '  const k = v.style.toLowerCase();',
        "  payload['prompt_' + k] = v.prompt;",
        "  payload['seo_description_' + k] = v.seoDescription;",
        "  payload['seo_alt_text_' + k] = v.altText;",
        "  payload['seo_clipart_title_' + k] = v.seoTitle;",
        "  payload['generated_image_url_' + k] = v.imageUrl;",
        '}',
        'return [{ json: { payload, offerLink, collageUrl } }];',
      ].join('\n'),
    },
    position: [1980, 1000],
  },
  output: [{ payload: {}, offerLink: 'https://t.me/pixplace_public/21/777', collageUrl: '' }],
});

const hasMakeWebhook = ifElse({
  version: 2.2,
  config: {
    name: 'Has Make Webhook',
    parameters: {
      conditions: {
        options: { caseSensitive: true, leftValue: '', typeValidation: 'loose', version: 2 },
        conditions: [
          { id: 'make-url-set', leftValue: expr("{{ $('Publish Webhook').first().json.body.makeWebhookUrl }}"), rightValue: '', operator: { type: 'string', operation: 'notEmpty', singleValue: true } },
        ],
        combinator: 'and',
      },
      options: {},
    },
    position: [2200, 1000],
  },
});

const sendToMake = node({
  type: 'n8n-nodes-base.httpRequest',
  version: 4.3,
  config: {
    name: 'Send to Make (Pinterest)',
    parameters: {
      method: 'POST',
      url: expr("{{ $('Publish Webhook').first().json.body.makeWebhookUrl }}"),
      sendBody: true,
      specifyBody: 'json',
      jsonBody: expr('{{ JSON.stringify($json.payload) }}'),
      options: { timeout: 30000, response: { response: { fullResponse: true, neverError: true } } },
    },
    onError: 'continueRegularOutput',
    position: [2420, 900],
  },
  output: [{ statusCode: 200, body: 'Accepted' }],
});

const pinterestResult = node({
  type: 'n8n-nodes-base.code',
  version: 2,
  config: {
    name: 'Pinterest Result',
    parameters: {
      mode: 'runOnceForAllItems',
      jsCode: [
        'const r = $input.first().json;',
        "const ok = Number(r.statusCode) >= 200 && Number(r.statusCode) < 300;",
        "return [{ json: { pinterest: ok ? 'sent' : 'failed', pinterestDetail: ok ? '' : String(r.error?.message || r.body || r.statusCode || 'нет ответа').slice(0, 300) } }];",
      ].join('\n'),
    },
    position: [2640, 900],
  },
  output: [{ pinterest: 'sent', pinterestDetail: '' }],
});

const skipPinterest = node({
  type: 'n8n-nodes-base.code',
  version: 2,
  config: {
    name: 'Skip Pinterest',
    parameters: { mode: 'runOnceForAllItems', jsCode: "return [{ json: { pinterest: 'skipped', pinterestDetail: 'Вебхук Make для ниши не задан в панели' } }];" },
    position: [2640, 1100],
  },
  output: [{ pinterest: 'skipped', pinterestDetail: '' }],
});

const recordPublication = node({
  type: 'n8n-nodes-base.dataTable',
  version: 1.1,
  config: {
    name: 'Record Publication',
    parameters: {
      resource: 'row',
      operation: 'update',
      dataTableId: USED_IDS_TABLE,
      filters: { conditions: [{ keyName: 'id', condition: 'eq', keyValue: expr("{{ $('Publish Webhook').first().json.body.draft.usedRowId }}") }] },
      columns: {
        mappingMode: 'defineBelow',
        value: {
          telgram_post: expr("{{ $('Build Make Payload').first().json.offerLink }}"),
          cost: expr("{{ String($('Publish Webhook').first().json.body.draft.cost?.total ?? '') }}"),
          used_prompt: expr("{{ $('Publish Webhook').first().json.body.draft.variants[0]?.prompt ?? '' }}"),
          used_prompt_2: expr("{{ $('Publish Webhook').first().json.body.draft.variants[1]?.prompt ?? '' }}"),
          used_prompt_3: expr("{{ $('Publish Webhook').first().json.body.draft.variants[2]?.prompt ?? '' }}"),
          used_prompt_4: expr("{{ $('Publish Webhook').first().json.body.draft.variants[3]?.prompt ?? '' }}"),
          image_url: expr("{{ $('Publish Webhook').first().json.body.draft.variants[0]?.imageUrl ?? '' }}"),
          image_url_2: expr("{{ $('Publish Webhook').first().json.body.draft.variants[1]?.imageUrl ?? '' }}"),
          image_url_3: expr("{{ $('Publish Webhook').first().json.body.draft.variants[2]?.imageUrl ?? '' }}"),
          image_url_4: expr("{{ $('Publish Webhook').first().json.body.draft.variants[3]?.imageUrl ?? '' }}"),
        },
        matchingColumns: [],
        schema: ['telgram_post', 'cost', 'used_prompt', 'used_prompt_2', 'used_prompt_3', 'used_prompt_4', 'image_url', 'image_url_2', 'image_url_3', 'image_url_4'].map(stringColumn),
      },
    },
    onError: 'continueRegularOutput',
    position: [2860, 1000],
  },
  output: [{ id: 501 }],
});

const reportPublished = node({
  type: 'n8n-nodes-base.httpRequest',
  version: 4.3,
  config: {
    name: 'Report Published',
    parameters: {
      method: 'POST',
      url: expr("{{ $('Publish Webhook').first().json.body.callbackUrl }}"),
      sendHeaders: true,
      headerParameters: { parameters: [{ name: 'x-hub-token', value: expr("{{ $('Publish Webhook').first().json.headers['x-hub-token'] }}") }] },
      sendBody: true,
      specifyBody: 'json',
      jsonBody: expr("{{ JSON.stringify({ jobId: $('Publish Webhook').first().json.body.jobId, status: 'published', result: { telegramUrl: $('Build Make Payload').first().json.offerLink, collageUrl: $('Build Make Payload').first().json.collageUrl, pinterest: $('Pinterest Result').isExecuted ? $('Pinterest Result').first().json.pinterest : 'skipped' } }) }}"),
      options: { timeout: 30000 },
    },
    executeOnce: true,
    retryOnFail: true,
    maxTries: 3,
    waitBetweenTries: 3000,
    position: [3080, 1000],
  },
  output: [{ ok: true }],
});

const reportPublishFailure = node({
  type: 'n8n-nodes-base.httpRequest',
  version: 4.3,
  config: {
    name: 'Report Publish Failure',
    parameters: {
      method: 'POST',
      url: expr("{{ $('Publish Webhook').first().json.body.callbackUrl }}"),
      sendHeaders: true,
      headerParameters: { parameters: [{ name: 'x-hub-token', value: expr("{{ $('Publish Webhook').first().json.headers['x-hub-token'] }}") }] },
      sendBody: true,
      specifyBody: 'json',
      jsonBody: expr("{{ JSON.stringify({ jobId: $('Publish Webhook').first().json.body.jobId, status: 'publish_failed', error: String($json.error?.message || $json.error || $json.message || 'Ошибка в n8n при публикации') }) }}"),
      options: { timeout: 30000 },
    },
    executeOnce: true,
    retryOnFail: true,
    maxTries: 3,
    waitBetweenTries: 3000,
    position: [440, 1300],
  },
  output: [{ ok: true }],
});

const setupNote = sticky(
  '## pixPLace Hub · пост для ниши\n' +
    'Запускается **только из панели** (вебхуки generate и publish). Настройки ниши приходят в теле запроса.\n\n' +
    '**Один раз после импорта выбрать учётки:**\n' +
    '- оба вебхука → Header Auth `pixPLace Hub token` (имя заголовка `x-hub-token`, значение = токен из админки панели)\n' +
    '- Analyze Idea Image, Write Style Variants → OpenRouter\n' +
    '- Render Variant, Upload Collage to Runware → Runware\n' +
    '- Post Album to Group → бот pixPLace\n\n' +
    'Идея помечается в USED_IDs **до** генерации — параллельные запуски не возьмут один пин.',
  [generateWebhook, publishWebhook],
  { color: 4, position: [-40, -40], width: 520, height: 300 },
);

export default workflow('pixplace-hub-niche-post', 'pixPLace Hub · Niche post (generate + publish)')
  .add(setupNote)
  .add(generateWebhook)
  .to(loadIdeas.onError(reportGenerateFailure))
  .add(loadIdeas)
  .to(getUsedIds)
  .to(pickIdea.onError(reportGenerateFailure))
  .add(pickIdea)
  .to(markPicked.onError(reportGenerateFailure))
  .add(markPicked)
  .to(buildAnalyzeRequest)
  .to(analyzeImage.onError(reportGenerateFailure))
  .add(analyzeImage)
  .to(parseAnalysis.onError(reportGenerateFailure))
  .add(parseAnalysis)
  .to(buildVariantsRequest)
  .to(writeVariants.onError(reportGenerateFailure))
  .add(writeVariants)
  .to(splitVariants.onError(reportGenerateFailure))
  .add(splitVariants)
  .to(renderVariant.onError(reportGenerateFailure))
  .add(renderVariant)
  .to(assembleDraft.onError(reportGenerateFailure))
  .add(assembleDraft)
  .to(returnDraft)
  .add(publishWebhook)
  .to(buildAlbum.onError(reportPublishFailure))
  .add(buildAlbum)
  .to(postAlbum.onError(reportPublishFailure))
  .add(postAlbum)
  .to(listImages)
  .to(downloadImage)
  .to(stackImages)
  .to(buildCollage)
  .to(collageToDataUri)
  .to(uploadCollage)
  .to(buildMakePayload)
  .to(hasMakeWebhook.onTrue(sendToMake.to(pinterestResult.to(recordPublication))).onFalse(skipPinterest.to(recordPublication)))
  .add(recordPublication)
  .to(reportPublished);
