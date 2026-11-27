import i18n from "i18next";

export function getMenuTitle(
  transKey?: string,
  defaultTitle?: string,
  fallbackId?: string
): string {
  if (transKey && i18n.isInitialized && i18n.exists(transKey)) {
    const translated = i18n.t(transKey);
    if (translated && translated !== transKey) {
      return translated;
    }
  }
  return defaultTitle || fallbackId || "";
}
