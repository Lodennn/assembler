import Tokenizer from "./SyntaxAnalyzer/Tokenizer/tokenizer.js";
import Parser from "./SyntaxAnalyzer/Parser/parser.js";
import { JACK_SAMPLES, type JackSampleId } from "./SyntaxAnalyzer/_test_/jack-samples.js";

class SyntaxAnalyzerUI {
  private highLevelTextarea: HTMLTextAreaElement | null = null;
  private tokenizerOutputEl: HTMLElement | null = null;
  private parserOutputEl: HTMLElement | null = null;
  private syntaxSectionEl: HTMLElement | null = null;
  private analyzeBtn: HTMLButtonElement | null = null;
  private parseBtn: HTMLButtonElement | null = null;
  private clearBtn: HTMLButtonElement | null = null;

  private tokenizer: Tokenizer | null = null;
  private samples: Record<JackSampleId, string> = JACK_SAMPLES;

  constructor() {
    const highLevelSection = document.getElementById("high-level");
    if (!highLevelSection) return;

    this.highLevelTextarea = highLevelSection.querySelector<HTMLTextAreaElement>(
      "#high-level-code",
    );
    this.analyzeBtn = highLevelSection.querySelector<HTMLButtonElement>(
      '[data-action="analyze"]',
    );
    this.clearBtn = highLevelSection.querySelector<HTMLButtonElement>(
      '[data-action="clear-high-level"]',
    );

    const syntaxSection = document.getElementById("syntax-analyzer");
    if (!syntaxSection) return;
    this.syntaxSectionEl = syntaxSection;

    this.tokenizerOutputEl = syntaxSection.querySelector<HTMLElement>(
      "#tokenizer-output",
    );
    this.parserOutputEl = syntaxSection.querySelector<HTMLElement>(
      "#parser-output",
    );
    this.parseBtn = syntaxSection.querySelector<HTMLButtonElement>(
      '[data-action="parse"]',
    );

    this.bind();
  }

  private bind(): void {
    if (this.analyzeBtn) {
      this.analyzeBtn.addEventListener("click", () => this.onAnalyze());
    }
    if (this.parseBtn) {
      this.parseBtn.addEventListener("click", () => this.onParse());
    }
    if (this.clearBtn) {
      this.clearBtn.addEventListener("click", () => this.onClear());
    }

    this.bindHighLevelSampleButtons();
  }

  private bindHighLevelSampleButtons(): void {
    const highLevelSection = document.getElementById("high-level");
    if (!highLevelSection) return;

    const buttons = highLevelSection.querySelectorAll<HTMLElement>("[data-hl-sample]");
    buttons.forEach((el) => {
      const id = el.getAttribute("data-hl-sample") as JackSampleId | null;
      if (!id) return;
      if (!(id in this.samples)) return;

      el.addEventListener("click", (e) => {
        e.preventDefault();
        this.loadHighLevelSample(id);
      });
    });
  }

  private loadHighLevelSample(id: JackSampleId): void {
    if (!this.highLevelTextarea) return;
    this.highLevelTextarea.value = this.samples[id].trim();
    if (this.tokenizerOutputEl) this.tokenizerOutputEl.textContent = "";
    if (this.parserOutputEl) this.parserOutputEl.textContent = "";
    this.tokenizer = null;
  }

  private onAnalyze(): void {
    if (!this.highLevelTextarea || !this.tokenizerOutputEl) return;
    const source = this.highLevelTextarea.value;

    this.tokenizer = Tokenizer.getInstance(source);
    this.tokenizerOutputEl.textContent = this.tokenizer.getTokensOutput();

    // Reset parser view; it will be filled on Parse.
    if (this.parserOutputEl) this.parserOutputEl.textContent = "";

    // Scroll to tokenizer stage so alignment matches other sections.
    const tokenizerStage = document.getElementById("tokenizer-stage");
    (tokenizerStage ?? this.tokenizerOutputEl).scrollIntoView({
      behavior: "smooth",
      block: "start",
    });
  }

  private onParse(): void {
    if (!this.tokenizerOutputEl || !this.parserOutputEl) return;
    if (!this.tokenizer) {
      this.parserOutputEl.textContent =
        "Run Analyze first to generate tokens.";
      return;
    }

    try {
      // Reset cursor so "Parse" works repeatedly without re-Analyze.
      this.tokenizer.resetCursor();
      const parser = Parser.getInstance(this.tokenizer);
      this.parserOutputEl.textContent = parser.getOutput();
    } catch (err) {
      this.parserOutputEl.textContent =
        err instanceof Error ? err.message : String(err);
    }

    const parserStage = document.getElementById("parser-stage");
    (parserStage ?? this.parserOutputEl).scrollIntoView({
      behavior: "smooth",
      block: "start",
    });
  }

  private onClear(): void {
    if (this.highLevelTextarea) this.highLevelTextarea.value = "";
    if (this.tokenizerOutputEl) this.tokenizerOutputEl.textContent = "";
    if (this.parserOutputEl) this.parserOutputEl.textContent = "";
    this.tokenizer = null;
  }
}

export default SyntaxAnalyzerUI;

