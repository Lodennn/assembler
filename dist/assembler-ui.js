import Assembler from "./assembler.js";
import sumAssembly from "./_test_/sum.js";
import maxAssembly from "./_test_/max.js";
import multiAssembly from "./_test_/multi.js";
import rectangleAssembly from "./_test_/rectangle.js";
const SAMPLES = {
    sum: sumAssembly,
    max: maxAssembly,
    multi: multiAssembly,
    rectangle: rectangleAssembly,
};
class AssemblerUI {
    constructor() {
        this.textarea = null;
        this.resultEl = null;
        this.outputEl = null;
        this.errorEl = null;
        this.sectionEl = null;
        this.samples = SAMPLES;
        this.textarea = document.getElementById("code");
        this.resultEl = document.getElementById("machine-code-result");
        this.outputEl = document.getElementById("machine-code-output");
        this.errorEl = document.getElementById("machine-code-error");
        this.sectionEl = document.getElementById("machine-code-section");
        if (!this.textarea)
            return;
        this.bindSampleButtons();
        this.bindAssembleButton();
        this.bindClearButton();
    }
    bindSampleButtons() {
        const buttons = document.querySelectorAll("[data-sample]");
        buttons.forEach((el) => {
            const sampleId = el.getAttribute("data-sample");
            if (sampleId && sampleId in this.samples) {
                el.addEventListener("click", (e) => {
                    e.preventDefault();
                    this.loadSample(sampleId);
                });
            }
        });
    }
    bindAssembleButton() {
        const btn = document.querySelector('[data-action="assemble"]');
        if (!btn)
            return;
        btn.addEventListener("click", () => this.onAssemble());
    }
    bindClearButton() {
        const btn = document.querySelector('[data-action="clear"]');
        if (!btn)
            return;
        btn.addEventListener("click", () => this.onClear());
    }
    onClear() {
        if (this.textarea)
            this.textarea.value = "";
        this.clearMachineCode();
        this.clearError();
    }
    onAssemble() {
        if (!this.textarea ||
            !this.resultEl ||
            !this.outputEl ||
            !this.errorEl ||
            !this.sectionEl)
            return;
        const source = this.textarea.value;
        try {
            const machineCode = Assembler.assemble(source);
            if (machineCode.length === 0) {
                throw new Error("An empty assembly file is not allowed");
            }
            this.showMachineCode(machineCode);
            this.clearError();
        }
        catch (err) {
            const message = err instanceof Error ? err.message : String(err);
            this.showError(message);
            this.clearMachineCode();
        }
        this.scrollToMachineCodeSection();
    }
    showMachineCode(lines) {
        if (!this.resultEl || !this.outputEl || !this.errorEl)
            return;
        this.outputEl.textContent = lines.join("\n");
        this.resultEl.hidden = false;
        this.errorEl.hidden = true;
        this.errorEl.textContent = "";
    }
    showError(message) {
        if (!this.resultEl || !this.errorEl)
            return;
        this.errorEl.textContent = message;
        this.errorEl.hidden = false;
        this.resultEl.hidden = true;
    }
    clearMachineCode() {
        if (this.resultEl && this.outputEl) {
            this.outputEl.textContent = "";
            this.resultEl.hidden = true;
        }
    }
    clearError() {
        if (this.errorEl) {
            this.errorEl.textContent = "";
            this.errorEl.hidden = true;
        }
    }
    scrollToMachineCodeSection() {
        this.sectionEl?.scrollIntoView({ behavior: "smooth", block: "start" });
    }
    loadSample(sampleId) {
        if (!this.textarea)
            return;
        this.textarea.value = this.samples[sampleId].trim();
    }
}
export default AssemblerUI;
//# sourceMappingURL=assembler-ui.js.map