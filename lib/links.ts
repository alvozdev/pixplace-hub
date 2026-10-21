/** Opens the pixPLace app with the prompt filled in; utm_source tells which surface the click came from. */
export function appLink(prompt: string, source: string, campaign: string) {
  return `https://app.pixplace.space/?prompt=${encodeURIComponent(prompt)}&utm_source=${source}&utm_campaign=${encodeURIComponent(campaign)}`;
}
