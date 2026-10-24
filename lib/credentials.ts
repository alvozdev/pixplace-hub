import { PORTAL_ACCOUNTS } from "./portal-accounts";

/** Everything the admin panel lets you connect, grouped by service. */

export interface Field {
  key: string;
  label: string;
  secret: boolean;
  placeholder?: string;
  /** Not needed for the service to work, e.g. a URL with a sensible default. */
  optional?: boolean;
  /** Shows a button that fills the field with a random token. */
  generate?: boolean;
}

export interface Service {
  id: string;
  title: string;
  how: string;
  fields: Field[];
  /** Whether the "Check" button can verify this service without side effects. */
  testable: boolean;
}

export const SERVICES: Service[] = [
  {
    id: "n8n-hub",
    title: "Связь панели с n8n",
    how: "Токен, по которому n8n узнаёт панель. Нажмите «Сгенерировать», скопируйте строку и сохраните. Ту же строку вставьте в n8n: Credentials → Header Auth «pixPLace Hub token», Name = x-hub-token, Value = эта строка. Адрес менять не нужно.",
    testable: false,
    fields: [
      { key: "HUB_N8N_TOKEN", label: "Токен панели", secret: true, generate: true },
      { key: "N8N_WEBHOOK_BASE", label: "Адрес вебхуков n8n (необязательно)", secret: false, optional: true, placeholder: "https://alv-n8n.pixplace.space/webhook" },
    ],
  },
  {
    id: "make",
    title: "Pinterest через Make (необязательно)",
    how: "Заполнять не нужно: воркфлоу n8n сам берёт вебхуки Make из старых воркфлоу и так же делит месяц между аккаунтами Make. Поле — только если захотите заменить вебхук ниши (можно 2–3 через пробел).",
    testable: false,
    fields: [
      { key: "MAKE_WEBHOOK_CLIPART", label: "Вебхук Make · Clipart", secret: true, optional: true, placeholder: "https://hook.us2.make.com/…" },
      { key: "MAKE_WEBHOOK_INTERIOR", label: "Вебхук Make · Interior", secret: true, optional: true, placeholder: "https://hook.us2.make.com/…" },
      { key: "MAKE_WEBHOOK_FASHION", label: "Вебхук Make · Fashion", secret: true, optional: true, placeholder: "https://hook.us2.make.com/…" },
      { key: "MAKE_WEBHOOK_PRODUCTS", label: "Вебхук Make · Product mockups", secret: true, optional: true, placeholder: "https://hook.us2.make.com/…" },
      { key: "MAKE_WEBHOOK_CHARACTERS", label: "Вебхук Make · Characters & poses", secret: true, optional: true, placeholder: "https://hook.us2.make.com/…" },
    ],
  },
  {
    id: "telegram",
    title: "Telegram-бот",
    how: "Нужен только токен того же бота, что публикует из n8n: @BotFather → /mybots → бот → API Token. Группа и треды для черновиков уже прописаны в нишах; ID канала и группы нужны только для ручных постов на «Пульте».",
    testable: true,
    fields: [
      { key: "TELEGRAM_BOT_TOKEN", label: "Токен бота", secret: true, placeholder: "123456:ABC…" },
      { key: "TELEGRAM_CHANNEL_ID", label: "ID канала (необязательно)", secret: false, optional: true, placeholder: "-100…" },
      { key: "TELEGRAM_GROUP_ID", label: "ID группы (необязательно)", secret: false, optional: true, placeholder: "-100…" },
    ],
  },
  {
    id: "buffer",
    title: "Buffer",
    how: "Токен доступа из настроек Buffer и ID профилей, куда публиковать.",
    testable: false,
    fields: [
      { key: "BUFFER_ACCESS_TOKEN", label: "Токен доступа", secret: true },
      { key: "BUFFER_PROFILE_INSTAGRAM", label: "Профиль Instagram", secret: false },
      { key: "BUFFER_PROFILE_TIKTOK", label: "Профиль TikTok", secret: false },
      { key: "BUFFER_PROFILE_YOUTUBE", label: "Профиль YouTube", secret: false },
      { key: "BUFFER_PROFILE_LINKEDIN", label: "Профиль LinkedIn", secret: false },
    ],
  },
  {
    id: "pixplace",
    title: "Портал pixPLace",
    how: "Каждое направление публикует со своего аккаунта. Ключ: войти на pixplace.space под аккаунтом направления → Settings → Developer → создать ключ ppk_live_… (показывается один раз). Лимит портала — 50 постов в сутки на ключ. «Проверить» читает последний пост каждого аккаунта, ничего не публикуя.",
    testable: true,
    fields: PORTAL_ACCOUNTS.map((a) => ({ key: a.keyName, label: `${a.name} · @${a.username}`, secret: true, optional: true, placeholder: "ppk_live_…" })),
  },
];

export const FIELD_KEYS = new Set(SERVICES.flatMap((s) => s.fields.map((f) => f.key)));
