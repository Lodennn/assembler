import AssemblerUI from "./assembler-ui.js";
function init() {
    new AssemblerUI();
}
if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
}
else {
    init();
}
//# sourceMappingURL=index.js.map