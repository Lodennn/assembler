import Assembler from "../assembler.js";
import all_cases from "./all_cases.js";
class TestAssembler {
    constructor() {
        this.files = all_cases;
        this.files.forEach((file) => {
            const assembler = Assembler.getInstance(file);
            console.log(`Testing file: ${file}`);
            assembler.parse(file);
            assembler.print_machine_code();
        });
    }
}
export default TestAssembler;
//# sourceMappingURL=index.js.map