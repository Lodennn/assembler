declare const ISA: {
    C_INSTRUCTION: {
        dest: {
            null: string;
            M: string;
            D: string;
            MD: string;
            A: string;
            AD: string;
            AMD: string;
        };
        comp: {
            "0": string;
            "1": string;
            "-1": string;
            D: string;
            A: string;
            M: string;
            "!D": string;
            "!A": string;
            "!M": string;
            "-D": string;
            "-A": string;
            "-M": string;
            "D+1": string;
            "A+1": string;
            "M+1": string;
            "D-1": string;
            "A-1": string;
            "M-1": string;
            "D+A": string;
            "D+M": string;
            "D-A": string;
            "D-M": string;
            "A-D": string;
            "M-D": string;
            "D&A": string;
            "D&M": string;
            "D|A": string;
            "D|M": string;
        };
        jump: {
            null: string;
            JGT: string;
            JEQ: string;
            JGE: string;
            JLT: string;
            JNE: string;
            JLE: string;
            JMP: string;
        };
    };
    A_INSTRUCTION: {};
};
export default ISA;
//# sourceMappingURL=ISA.d.ts.map