const x = (a = 1) => a;
const y = x;
// TypeScript error: "Supplied parameters do not match signature of call target."
// OK
y('x').toFixed();
const z = y;
// No TypeScript error
// Runtime error: Uncaught TypeError: z(...).toFixed is not a function
z('x').toFixed();
