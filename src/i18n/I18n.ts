import EnUs from "./i18n/EnUs";

class I18n_0 {
  get(key: string): string {
    const lang = EnUs;
    if (key in lang) {
      return lang[key];
    }
    return `$${key}`;
  }
}

export const I18n = new I18n_0();
