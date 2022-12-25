import EnUs from "./i18n/EnUs";

class I18n_0 {
  localize(section: keyof typeof EnUs, key: string): string {
    const lang = EnUs;
    if (section in lang && key in lang[section]) {
      return lang[section][key];
    }
    return `$${key}`;
  }
}

export const I18n = new I18n_0();
