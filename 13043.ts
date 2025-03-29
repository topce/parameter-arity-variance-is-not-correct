const x = (a: number = 1): number => a;
const y: () => number = x;
// TypeScript error: "Supplied parameters do not match signature of call target."
// OK
y('x').toFixed();

const z: (a: string) => number = y;
// No TypeScript error
// Runtime error: Uncaught TypeError: z(...).toFixed is not a function
z('x').toFixed();