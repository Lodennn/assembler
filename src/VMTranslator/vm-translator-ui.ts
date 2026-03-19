import VMTranslator from "./vm-translator.js";

class VMTranslatorUI {
  private rootEl: HTMLElement | null = null;
  private vmTextarea: HTMLTextAreaElement | null = null;
  private assemblerTextarea: HTMLTextAreaElement | null = null;
  private assemblerSection: HTMLElement | null = null;
  private errorEl: HTMLElement | null = null;

  constructor() {
    this.rootEl = document.getElementById("vm-translator");
    this.vmTextarea = document.getElementById("vm-code") as HTMLTextAreaElement | null;
    this.assemblerTextarea = document.getElementById("code") as HTMLTextAreaElement | null;
    this.assemblerSection = document.getElementById("assembler");
    this.errorEl = this.rootEl?.querySelector<HTMLElement>(".output-error") ?? null;

    if (!this.rootEl || !this.vmTextarea || !this.assemblerTextarea) return;
    this.bindTranslateButton();
    this.bindClearButton();
  }

  private bindTranslateButton(): void {
    const btn = this.rootEl?.querySelector<HTMLElement>('[data-action="translate"]');
    if (!btn) return;
    btn.addEventListener("click", () => this.onTranslate());
  }

  private bindClearButton(): void {
    const btn = this.rootEl?.querySelector<HTMLElement>('[data-action="clear"]');
    if (!btn) return;
    btn.addEventListener("click", () => this.onClear());
  }

  private onTranslate(): void {
    if (!this.vmTextarea || !this.assemblerTextarea) return;
    const vmCode = this.vmTextarea.value.trim();
    if (!vmCode) {
      this.showError("An empty VM file is not allowed");
      return;
    }

    try {
      const assembly = VMTranslator.translateVM(vmCode);
      this.assemblerTextarea.value = assembly;
      this.clearError();
      this.scrollToAssembler();
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      this.showError(message);
    }
  }

  private onClear(): void {
    if (!this.vmTextarea) return;
    this.vmTextarea.value = "";
    this.clearError();
  }

  private showError(message: string): void {
    if (!this.errorEl) return;
    this.errorEl.textContent = message;
    this.errorEl.hidden = false;
  }

  private clearError(): void {
    if (!this.errorEl) return;
    this.errorEl.textContent = "";
    this.errorEl.hidden = true;
  }

  private scrollToAssembler(): void {
    this.assemblerSection?.scrollIntoView({ behavior: "smooth", block: "start" });
  }
}

export default VMTranslatorUI;
