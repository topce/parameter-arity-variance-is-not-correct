// ─── strictArity test cases ───
// Each case assigns a function with FEWER parameters than the target type expects.
// When strictArity covers that kind, the compiler must emit an error.
// All test cases compile without errors when --strictArity is not provided.

// ─── 1. callsignature ───
interface CallSig {
  (a: string, b: number): void;
}
const cs1: CallSig = (a: string) => {};            // strictArity callsignature → error (1 param vs 2)

// ─── 2. constructsignature ───
interface ConSig {
  new (a: string, b: number): {};
}
const cs2: ConSig = class { constructor(a: string) {} };  // strictArity constructsignature → error

// ─── 3. methodsignature ───
interface IMethodSig {
  foo(a: string, b: number): void;
}
class CMethodSig1 implements IMethodSig {
  foo(a: string): void {}                           // strictArity methodsignature → error
}

// ─── 4. methoddeclaration ───
class BaseMethod {
  foo(a: string, b: number): void {}
}
class DerivedMethod extends BaseMethod {
  foo(a: string): void {}                           // strictArity methoddeclaration → error
}

// ─── 5. constructor ───
class ConstrBase {
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  constructor(a: string, b: number) {}
}
class ConstrDerived extends ConstrBase {
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  constructor(a: string) { super(a, 0); }           // strictArity constructor → error
}

// ─── 6. functiondeclaration ───
function funcDeclTarget(a: string, b: number): void {}
// eslint-disable-next-line @typescript-eslint/no-unused-vars
const fd1: typeof funcDeclTarget = function(a: string): void {};  // strictArity functiondeclaration → error

// ─── 7. functionexpression ───
// eslint-disable-next-line @typescript-eslint/no-unused-vars
const fe1: (a: string, b: number) => void = function(a: string): void {};  // strictArity functionexpression → error

// ─── 8. arrowfunction ───
// eslint-disable-next-line @typescript-eslint/no-unused-vars
const af1: (a: string, b: number) => void = (a: string): void => {};       // strictArity arrowfunction → error

// ─── 9. functiontype (callback parameter) ───
function takesCallback(cb: (a: string, b: number) => void): void {
  cb('hello', 42);
}
takesCallback((a: string): void => {});              // strictArity functiontype → error

// ─── 10. constructortype ───
type CtorType = new (a: string, b: number) => {};
// eslint-disable-next-line @typescript-eslint/no-unused-vars
const ct1: CtorType = class { constructor(a: string) {} };  // strictArity constructortype → error

// ─── 11. functiontype (chained unsoundness from #13043) ───
// Unsoundness compounds when arity variance chains through intermediate variables.
// Without strictArity: z is typed as (a: string) => number but at runtime
// it's (a: number = 1) => number — z('x') returns 'x' (string), and .toFixed() explodes.
const chainSrc = (a: number = 1): number => a;
const chainMid: () => number = chainSrc;
// eslint-disable-next-line @typescript-eslint/no-unused-vars
const chainOut: (a: string) => number = chainMid;  // strictArity functiontype → error

// ─── 12. functiontype (#46881 — callback with fewer params) ───
// Minimal case: a callback that ignores parameters. TypeScript allows this
// by design, but when the callback contract changes and callers rely on those
// parameters, the missing implementation silently drops data at runtime.
function handler(cb: (x: number, y: string) => void): void {
  cb(1, 'hello');
}
handler((x: number): void => { console.log(x); });  // strictArity functiontype → error

// ─── 13. methodsignature (#46881 — real-world: interface method gets new param) ───
// Adding a parameter to an interface method silently shifts argument positions
// in existing implementations — the old impl compiles but receives wrong values.
// Real story below: this was found when adding AWS Translate alongside Google Translate.
interface ITranslate {
  isValidLocale(targetLocale: string): Promise<boolean>;
  translateText(text: string, sourceLocale: string, targetLocale: string): Promise<string>;
}
class GoogleTranslate implements ITranslate {
  async isValidLocale(targetLocale: string): Promise<boolean> { return true; }
  // Old implementation — missing sourceLocale. Compiles, but at runtime
  // targetLocale receives the sourceLocale value: shifted argument positions.
  async translateText(text: string, targetLocale: string): Promise<string> { return text; }
  // strictArity methodsignature → error
}
