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
