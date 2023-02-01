import { Platform } from "./src/engine/Platform";

type LayoutMode = "fit-screen" | "landscape";

let layoutMode: LayoutMode = Platform.isMobile ? "fit-screen" : "landscape";

function getScreenResolution() {
  if (!Platform.isMobile) {
    return [window.screen.width, window.screen.height];
  } else {
    return [window.innerWidth, window.innerHeight];
  }
}

function computeResolution() {
  let [width, height] = getScreenResolution();
  // ensure width > height
  if (height > width) {
    [width, height] = [height, width];
  }
  // ensure resolution is not too small
  width = Math.max(width, 640);
  height = Math.max(height, 360);
  // ensure resolution matches standard display
  const e = 1920 / 1080;
  const e1 = width / height;
  if (e1 > e) {
    // wider than standard display
    width = height * e;
  }
  if (e1 < e) {
    // narrower than standard display
    height = width / e;
  }
  return [width, height];
}

const [width, height] = computeResolution();

// create iframe
const iframe = document.createElement("iframe");
iframe.frameBorder = "0";
iframe.scrolling = "no";
iframe.style.position = "absolute";
iframe.style.display = "block";
iframe.style.left = "0";
iframe.style.top = "0";
iframe.style.width = `${width}px`;
iframe.style.height = `${height}px`;
iframe.style.transformOrigin = "top left";
const params = new URL(window.location.href).searchParams.toString();
iframe.src = `iframe.html?width=${width}&height=${height}&${params}`;
document.body.appendChild(iframe);

function layoutLandscape() {
  let { innerWidth: w, innerHeight: h } = window;
  const e = width / height;
  const e1 = w / h;
  if (e1 > e) {
    // screen wider than display, leave space left & right
    const dx = (w - e * h) / 2;
    const s = h / height;
    iframe.style.transform = `translateX(${dx}px) scale(${s})`;
  } else {
    // screen narrower than display, leave space top & bottom
    const dy = (h - w / e) / 2;
    const s = w / width;
    iframe.style.transform = `translateY(${dy}px) scale(${s})`;
  }
}

function layoutPortrait() {
  let { innerWidth: w, innerHeight: h } = window;
  const e = width / height;
  const e1 = h / w;
  if (e1 > e) {
    // screen wider than display, leave space left & right
    const dy = (h - e * w) / 2;
    const s = w / height;
    iframe.style.transform = `translate(${w}px, ${dy}px) rotate(90deg) scale(${s})`;
  } else {
    // screen narrower than display, leave space top & bottom
    const dx = w - (w - h / e) / 2;
    const s = h / width;
    iframe.style.transform = `translateX(${dx}px) rotate(90deg) scale(${s})`;
  }
}

function layout() {
  let { innerWidth: w, innerHeight: h } = window;
  if (layoutMode == "landscape") {
    return layoutLandscape();
  }
  if (layoutMode == "fit-screen") {
    if (w > h) {
      return layoutLandscape();
    }
    return layoutPortrait();
  }
}

window.addEventListener("resize", layout);
window.addEventListener("orientationchange", layout);

layout();
