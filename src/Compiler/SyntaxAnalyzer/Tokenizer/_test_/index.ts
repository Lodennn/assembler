// export default `
// /* block
//    comment */

//    // hello this is me a new comment

//    /**
//     *
//     * hello this is me again
//     * */
// class Main {
//   function main() {
//     var x = 10;
//     var y = 20;
//     var z = x + y;
//     var name = "John";
//     return z;
//   }
// }
// `;

export default `/* This is the Calculator class
   it handles basic math operations */

class Calculator {

    // field variables
    field int result;
    field boolean isReady;

    /**
     * constructor to initialize
     * the Calculator object
     */
    constructor Calculator new() {
        let result = 0;
        let isReady = true;
        return this;
    }

    /* add two numbers
       and store the result */
    method int add(int a, int b) {
        let result = a + b; // store the sum
        return result;
    }

    // print the current result to output
    method void printResult() {
        if (result > 0) {
            do Output.printInt(result); // positive number
        } else {
            do Output.printString("negative"); // negative number
        }
        return;
    }

    /**
     * compute the sum of all
     * numbers from 0 to x
     */
    method int compute(int x) {
        var int temp; // accumulator
        var int i;    // counter
        let temp = 0;
        let i = 0;
        while (i < x) {
            let temp = temp + i; /* add i to temp */
            let i = i + 1;       /* increment i */
        }
        return temp;
    }
}`;
