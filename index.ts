import { Platform } from "./src/engine/Platform";

let { innerWidth: width, innerHeight: height } = window;
const rotateScreen = Platform.isMobile && width < height;

if (rotateScreen) {
  [width, height] = [height, width];
}
if (!Platform.isMobile) {
  width = Math.max(width, 720);
  height = Math.max(height, 1080);
}

const iframe = document.createElement("iframe");
iframe.frameBorder = "0";
iframe.scrolling = "no";
iframe.style.position = "fixed";
iframe.style.display = "block";
const params = new URL(window.location.href).searchParams.toString();
iframe.src = `iframe.html?width=${width}&height=${height}&${params}`;
document.body.appendChild(iframe);

const resize = () => {
  let { innerWidth: width, innerHeight: height } = window;
  if (rotateScreen) {
    [width, height] = [height, width];
  }
  iframe.style.width = `${width}px`;
  iframe.style.height = `${height}px`;
  if (rotateScreen) {
    iframe.style.transformOrigin = "bottom left";
    iframe.style.transform = `translate(0, -${height}px) rotate(90deg)`;
  }
};

new ResizeObserver(resize).observe(document.body);
setTimeout(resize, 0);
