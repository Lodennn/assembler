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

// export default `/* This is the Calculator class
//    it handles basic math operations */

// class Calculator {

//     // field variables
//     field int result;
//     field boolean isReady;

//     /**
//      * constructor to initialize
//      * the Calculator object
//      */
//     constructor Calculator new() {
//         let result = 0;
//         let isReady = true;
//         return this;
//     }

//     /* add two numbers
//        and store the result */
//     method int add(int a, int b) {
//         let result = a + b; // store the sum
//         return result;
//     }

//     // print the current result to output
//     method void printResult() {
//         if (result > 0) {
//             do Output.printInt(result); // positive number
//         } else {
//             do Output.printString("negative"); // negative number
//         }
//         return;
//     }

//     /**
//      * compute the sum of all
//      * numbers from 0 to x
//      */
//     method int compute(int x) {
//         var int temp; // accumulator
//         var int i;    // counter
//         let temp = 0;
//         let i = 0;
//         while (i < x) {
//             let temp = temp + i; /* add i to temp */
//             let i = i + 1;       /* increment i */
//         }
//         return temp;
//     }
// }`;

export default `/* Memory management class
   handles array operations */

class MemoryManager {

    // static and field variables
    static int instanceCount;
    static boolean isInitialized;
    field int size;
    field Array data;

    /**
     * initialize the class
     * must be called first
     */
    function void init() {
        let instanceCount = 0;
        let isInitialized = true;
        return;
    }

    /* constructor with size parameter */
    constructor MemoryManager new(int initialSize) {
        let size = initialSize;
        let data = Array.new(initialSize);
        let instanceCount = instanceCount + 1;
        return this;
    }

    // get value at index
    method int get(int index) {
        var int value;
        if (index < 0) {
            return -1;
        }
        if (index > size) {
            return -1;
        }
        let value = data[index];
        return value;
    }

    /**
     * set value at index
     * returns true if successful
     */
    method boolean set(int index, int value) {
        if ((index < 0) | (index > size)) {
            return false;
        }
        let data[index] = value;
        return true;
    }

    // fill entire array with a value
    method void fill(int fillValue) {
        var int i;
        let i = 0;
        while (i < size) {
            let data[i] = fillValue; /* set each element */
            let i = i + 1;
        }
        return;
    }

    /* find first occurrence of value
       returns -1 if not found */
    method int find(int target) {
        var int i;
        var int found;
        let i = 0;
        let found = -1;
        while (i < size) {
            if (data[i] = target) {
                let found = i;
                let i = size; // break the loop
            }
            let i = i + 1;
        }
        return found;
    }

    /**
     * dispose the object
     * and free memory
     */
    method void dispose() {
        do data.dispose();
        let instanceCount = instanceCount - 1;
        do Memory.deAlloc(this);
        return;
    }
}`;
