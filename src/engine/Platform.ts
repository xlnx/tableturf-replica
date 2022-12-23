import MobileDetect from "mobile-detect";

const md = new MobileDetect(window.navigator.userAgent);
const isMobile = md.mobile() != null;

export class Platform {
  static get isMobile() {
    return isMobile;
  }
}
