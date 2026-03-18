import VMTranslator from "./VMTranslator/vm-translator.js";
import AssemblerUI from "./assembler/assembler-ui.js";

function init() {
  new AssemblerUI();
  new VMTranslator("");
}

if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", init);
} else {
  init();
}
