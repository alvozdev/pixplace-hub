/** Everything the admin panel lets you connect, grouped by service. */

export interface Field {
  key: string;
  label: string;
  secret: boolean;
  placeholder?: string;
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
    how: "Нужна, чтобы кнопки «Сгенерировать» и «Опубликовать» запускали воркфлоу «pixPLace Hub · Niche post». Адрес — https://alv-n8n.pixplace.space/webhook. Токен — любая длинная случайная строка; ту же строку вставьте в n8n в учётку Header Auth «pixPLace Hub token» (имя заголовка x-hub-token).",
    testable: false,
    fields: [
      { key: "N8N_WEBHOOK_BASE", label: "Адрес вебхуков n8n", secret: false, placeholder: "https://alv-n8n.pixplace.space/webhook" },
      { key: "HUB_N8N_TOKEN", label: "Токен панели", secret: true },
    ],
  },
  {
    id: "make",
    title: "Pinterest через Make",
    how: "Вебхук сценария Make, который публикует в Pinterest. Его вызывает n8n после публикации в Telegram. Пустое поле — Pinterest пропускается.",
    testable: false,
    fields: [{ key: "MAKE_WEBHOOK_CLIPART", label: "Вебхук Make · Clipart", secret: true, placeholder: "https://hook.us2.make.com/…" }],
  },
  {
    id: "telegram",
    title: "Telegram-бот",
    how: "Создайте бота в @BotFather и добавьте его администратором в канал и группу. ID канала начинается с -100.",
    testable: true,
    fields: [
      { key: "TELEGRAM_BOT_TOKEN", label: "Токен бота", secret: true, placeholder: "123456:ABC…" },
      { key: "TELEGRAM_CHANNEL_ID", label: "ID канала", secret: false, placeholder: "-100…" },
      { key: "TELEGRAM_GROUP_ID", label: "ID группы", secret: false, placeholder: "-100…" },
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
    title: "Портал Pix Place",
    how: "Адрес API портала и ключ с правом публикации.",
    testable: false,
    fields: [
      { key: "PIXPLACE_API_URL", label: "Адрес API", secret: false, placeholder: "https://pixplace…/api" },
      { key: "PIXPLACE_API_KEY", label: "API-ключ", secret: true },
    ],
  },
];

export const FIELD_KEYS = new Set(SERVICES.flatMap((s) => s.fields.map((f) => f.key)));
