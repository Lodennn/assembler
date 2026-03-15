declare class AssemblerUI {
    private textarea;
    private resultEl;
    private outputEl;
    private errorEl;
    private sectionEl;
    private samples;
    constructor();
    private bindSampleButtons;
    private bindAssembleButton;
    private bindClearButton;
    private onClear;
    private onAssemble;
    private showMachineCode;
    private showError;
    private clearMachineCode;
    private clearError;
    private scrollToMachineCodeSection;
    private loadSample;
}
export default AssemblerUI;
//# sourceMappingURL=assembler-ui.d.ts.map