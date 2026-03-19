import VMTranslatorUI from "./VMTranslator/vm-translator-ui.js";
import AssemblerUI from "./assembler/assembler-ui.js";

function updateScrollBackground(): void {
  const maxScroll = document.documentElement.scrollHeight - window.innerHeight;
  const progress = maxScroll > 0 ? window.scrollY / maxScroll : 0;

  const topLightness = 48 - progress * 20;
  const bottomLightness = 38 - progress * 20;

  document.documentElement.style.setProperty(
    "--bg-top-lightness",
    `${Math.max(20, topLightness)}%`,
  );
  document.documentElement.style.setProperty(
    "--bg-bottom-lightness",
    `${Math.max(10, bottomLightness)}%`,
  );
}

function bindScrollBackground(): void {
  updateScrollBackground();
  window.addEventListener("scroll", updateScrollBackground, { passive: true });
  window.addEventListener("resize", updateScrollBackground);
}

function init() {
  new AssemblerUI();
  new VMTranslatorUI();
  bindScrollBackground();
}

if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", init);
} else {
  init();
}
