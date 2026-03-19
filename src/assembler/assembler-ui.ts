import Assembler from "./assembler.js";
import sumAssembly from "./_test_/sum.js";
import maxAssembly from "./_test_/max.js";
import multiAssembly from "./_test_/multi.js";
import rectangleAssembly from "./_test_/rectangle.js";

type SampleId = "sum" | "max" | "multi" | "rectangle";

const SAMPLES: Record<SampleId, string> = {
  sum: sumAssembly,
  max: maxAssembly,
  multi: multiAssembly,
  rectangle: rectangleAssembly,
};

class AssemblerUI {
  private rootEl: HTMLElement | null = null;
  private textarea: HTMLTextAreaElement | null = null;
  private resultEl: HTMLElement | null = null;
  private outputEl: HTMLElement | null = null;
  private errorEl: HTMLElement | null = null;
  private sectionEl: HTMLElement | null = null;
  private samples: Record<SampleId, string> = SAMPLES;

  constructor() {
    this.rootEl = document.getElementById("assembler");
    if (!this.rootEl) return;
    this.textarea = this.rootEl.querySelector<HTMLTextAreaElement>("#code");
    this.resultEl = document.getElementById("machine-code-result");
    this.outputEl = document.getElementById("machine-code-output");
    this.errorEl = document.getElementById("machine-code-error");
    this.sectionEl = document.getElementById("machine-code-section");
    if (!this.textarea || !this.resultEl || !this.outputEl || !this.errorEl || !this.sectionEl) return;
    this.bindSampleButtons();
    this.bindAssembleButton();
    this.bindClearButton();
  }

  private bindSampleButtons(): void {
    const buttons =
      this.rootEl?.querySelectorAll<HTMLElement>("[data-sample]") ?? [];
    buttons.forEach((el) => {
      const sampleId = el.getAttribute("data-sample") as SampleId | null;
      if (sampleId && sampleId in this.samples) {
        el.addEventListener("click", (e) => {
          e.preventDefault();
          this.loadSample(sampleId as SampleId);
        });
      }
    });
  }

  private bindAssembleButton(): void {
    const btn = this.rootEl?.querySelector<HTMLElement>(
      '[data-action="assemble"]',
    );
    if (!btn) return;
    btn.addEventListener("click", () => this.onAssemble());
  }

  private bindClearButton(): void {
    const btn = this.rootEl?.querySelector<HTMLElement>('[data-action="clear"]');
    if (!btn) return;
    btn.addEventListener("click", () => this.onClear());
  }

  private onClear(): void {
    if (this.textarea) this.textarea.value = "";
    this.clearMachineCode();
    this.clearError();
  }

  private onAssemble(): void {
    if (
      !this.textarea ||
      !this.resultEl ||
      !this.outputEl ||
      !this.errorEl ||
      !this.sectionEl
    )
      return;
    const source = this.textarea.value;
    try {
      const machineCode = Assembler.assemble(source);
      if (machineCode.length === 0) {
        throw new Error("An empty assembly file is not allowed");
      }
      this.showMachineCode(machineCode);
      this.clearError();
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      this.showError(message);
      this.clearMachineCode();
    }
    this.scrollToMachineCodeSection();
  }

  private showMachineCode(lines: string[]): void {
    if (!this.resultEl || !this.outputEl || !this.errorEl) return;
    this.outputEl.textContent = lines.join("\n");
    this.resultEl.hidden = false;
    this.errorEl.hidden = true;
    this.errorEl.textContent = "";
  }

  private showError(message: string): void {
    if (!this.resultEl || !this.errorEl) return;
    this.errorEl.textContent = message;
    this.errorEl.hidden = false;
    this.resultEl.hidden = true;
  }

  private clearMachineCode(): void {
    if (this.resultEl && this.outputEl) {
      this.outputEl.textContent = "";
      this.resultEl.hidden = true;
    }
  }

  private clearError(): void {
    if (this.errorEl) {
      this.errorEl.textContent = "";
      this.errorEl.hidden = true;
    }
  }

  private scrollToMachineCodeSection(): void {
    this.sectionEl?.scrollIntoView({ behavior: "smooth", block: "start" });
  }

  private loadSample(sampleId: SampleId): void {
    if (!this.textarea) return;
    this.textarea.value = this.samples[sampleId].trim();
  }
}

export default AssemblerUI;
