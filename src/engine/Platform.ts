import MobileDetect from "mobile-detect";
import UAParser from "ua-parser-js";

const md = new MobileDetect(window.navigator.userAgent);
const isMobile = md.mobile() != null;

const parser = new UAParser(window.navigator.userAgent);

export class Platform {
  static get isMobile() {
    return isMobile;
  }

  // support -webkit-* extensions ?
  static get isWebKit() {
    const { name } = parser.getEngine();
    return name == "Blink" || name == "WebKit";
  }
}
