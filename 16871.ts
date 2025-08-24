interface Payload {
  a: string;
  b: number;
}

let doFoo: (payload: Payload) => void;

let executeAction: <P>(action: (payload: P) => void, payload: P) => void;

executeAction(doFoo, { a: "hello", b: 2 }); //no errors, ok
executeAction(doFoo, {}); //no errors, wrong!
executeAction(doFoo, { qwe: 2 }); //errors, ok
executeAction(doFoo, { a: "hola" }); //no errors, wrong!

doFoo({ a: "hello", b: 2 }); //no errors, ok
doFoo({}); //errors, ok
doFoo({ qwe: 2 }); //errors, ok
doFoo({ a: "hola" }); //errors, ok
