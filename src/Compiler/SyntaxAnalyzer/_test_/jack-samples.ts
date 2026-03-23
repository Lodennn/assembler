export type JackSampleId = "sum" | "max" | "multi" | "rectangle";

export const JACK_SAMPLES: Record<JackSampleId, string> = {
  sum: `
class Main {
  function void main() {
    var int x, y, z;
    let x = 10;
    let y = 20;
    let z = x + y;
    do Output.printInt(z);
    return;
  }
}
`,
  max: `
class Main {
  function void main() {
    var int x, y, m;
    let x = 10;
    let y = 20;
    if (x < y) {
      let m = y;
    } else {
      let m = x;
    }
    do Output.printInt(m);
    return;
  }
}
`,
  multi: `
class Main {
  function void main() {
    var int x, y, z;
    let x = 6;
    let y = 7;
    let z = x * y;
    do Output.printInt(z);
    return;
  }
}
`,
  rectangle: `
class Main {
  function void main() {
    var int x, y;
    let x = 0;
    while (x < 10) {
      let y = 0;
      while (y < 5) {
        do Screen.setColor(1);
        do Screen.drawPixel(x, y);
        let y = y + 1;
      }
      let x = x + 1;
    }
    return;
  }
}
`,
};

