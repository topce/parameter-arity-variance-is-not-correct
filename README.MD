# Parameter Arity Variance Is Not Correct

> **TypeScript lets you assign a function with fewer parameters than the target type expects. That's a soundness hole — and it doesn't have to be one.**

A custom TypeScript compiler extension (`--strictArity`) that proves parameter arity variance *can* be checked at compile time without breaking real-world code.

[![ISC License](https://img.shields.io/github/license/topce/parameter-arity-variance-is-not-correct)](LICENSE)
[![GitHub issues](https://img.shields.io/github/issues/topce/parameter-arity-variance-is-not-correct)](https://github.com/topce/parameter-arity-variance-is-not-correct/issues)
[![TypeScript](https://img.shields.io/badge/TypeScript-7.0-blue?logo=typescript)](https://www.typescriptlang.org/)
[![npm](https://img.shields.io/badge/npm-%40topce%2Fnative--preview-red?logo=npm)](https://www.npmjs.com/package/@topce/native-preview)
[![Tests](https://img.shields.io/badge/tests-19%2F19-brightgreen)](#test-matrix)

---

## The Problem

TypeScript's type system has a long-standing design choice: **a function type `(a: string, b: number) => void` is assignable from `(a: string) => void`**. This is "parameter arity variance" — specifically, *contravariance of parameter count* — and it lets you silently drop parameters.

```typescript
type Handler = (a: string, b: number) => void;

const ok: Handler = (a: string) => {
  // TypeScript: ✅ no error
  // Runtime:   💥 `b` is `undefined`, not `number`
};
```

This isn't just a theoretical concern — it can mask real bugs:

```typescript
// A callback that silently ignores the second argument
const logEvent = (eventName: string) => {
  console.log(`Event: ${eventName}`);
  // Never logs the payload — signature says it should
};

// Registering with a stricter type — no error from TS
function onEvent(handler: (name: string, payload: unknown) => void) {
  handler("click", { key: "data" });
}

onEvent(logEvent);
// Compiles ✅  Runtime: payload silently dropped
```

The TypeScript issue tracker has been debating this for nearly a decade:

| Issue | Title | Status |
|-------|-------|--------|
| [#13043](https://github.com/Microsoft/TypeScript/issues/13043) | Provide option to disallow functions with fewer parameters in function type compatibility checks | Open since 2016 |
| [#16871](https://github.com/Microsoft/TypeScript/issues/16871) | Option to enforce exact parameter counts in function type compatibility | Open |
| [#17868](https://github.com/Microsoft/TypeScript/issues/17868) | `strictFunctionTypes` should also apply to function parameter arity | Open |
| [#20274](https://github.com/Microsoft/TypeScript/issues/20274) | Function parameter bivariance is unsound | Open |
| [#20541](https://github.com/Microsoft/TypeScript/issues/20541) | `strictBindCallApply` should also affect function parameter arity | Open |
| [#21868](https://github.com/Microsoft/TypeScript/issues/21868) | Suggestion: strict parameter arity check | Open |

The TypeScript team's position has been that stricter parameter checking would be too disruptive, especially for callback-heavy APIs like `Array.prototype.forEach` and event handlers. **This repo exists to test that assumption — and to show it can be done granularly.**

---

## The Solution

**`--strictArity`** — a new compiler flag implemented in the custom compiler [`@topce/native-preview`](https://www.npmjs.com/package/@topce/native-preview) (forked from [microsoft/TypeScript](https://github.com/microsoft/TypeScript)).

The implementation is surgical: it adds an additional check in the type assignability logic that compares the number of required parameters between source and target function types.

```typescript
// Without --strictArity (default): compiles
const cs1: CallSig = (a: string) => {};

// With --strictArity:     ❌ error TS2322
//   Target signature provides too few arguments.
//   Expected 2 or more, but got 1.
```

### Design Goals

- **Backward-compatible** — defaults to current TypeScript behavior
- **Granular** — opt in per syntactic kind, not globally
- **Transparent** — emits standard TS error diagnostics with clear messages

---

## Quick Start

```bash
# 1. Install
npm install

# 2. Run the test suite
npm test

# 3. Compile with strict arity checking
npx tsgo --noEmit --strictArity all test.ts

# 4. Selective checking
npx tsgo --noEmit --strictArity callsignature,methodsignature test.ts
```

---

## Supported Kinds

The flag applies to specific syntactic kinds, giving you incremental adoption:

| Flag | Scope | Example |
|------|-------|---------|
| `callsignature` | Call signatures in interfaces/types | `interface F { (a: string, b: number): void }` |
| `constructsignature` | Constructor signatures | `new (a: string, b: number) => {}` |
| `methodsignature` | Interface method declarations | `interface I { foo(a: string, b: number): void }` |
| `methoddeclaration` | Class/object method overrides | `class A { foo(a: string, b: number): void {} }` |
| `constructor` | Constructor parameter mismatches | `class B extends A { constructor(a: string) { ... } }` |
| `functiondeclaration` | Function declarations used as types | `function f(a: string, b: number): void` |
| `functionexpression` | Function expressions with target types | `const f: FnType = function(a: string): void {}` |
| `arrowfunction` | Arrow functions with target types | `const f: FnType = (a: string): void => {}` |
| `functiontype` | Callback parameter types | `takesCallback((a: string): void => {})` |
| `constructortype` | Constructor type expressions | `type C = new (a: string, b: number) => {}` |
| `indexsignature` | — | No flag (by design) |
| `jsdocfunctiontype` | — | No flag (by design) |
| `jsdocsignature` | — | No flag (by design) |

### Presets

| Flag | Equivalent To | Errors on `test.ts` |
|------|---------------|---------------------|
| `--strictArity all` / `--strictArity true` | All 10 flags above | **9** |
| `--strictArity none` / `--strictArity false` | Disables all | **0** |
| `--strictArity callsignature,methodsignature` | Subset combo | **2** |

### Recommended for Existing Projects

```bash
tsgo --strictArity methoddeclaration,methodsignature,callsignature,constructsignature
```

This targets **contract-facing kinds** (interfaces, classes, call/construct signatures) while excluding callback-heavy kinds that `forEach`-style APIs rely on. Start here, then opt into stricter checks as your codebase evolves.

---

## Test Matrix

`test.ts` contains **10 test cases**, one per kind. Each assigns a function with *fewer* parameters than the target type expects:

| # | Kind | Expected with `--strictArity all` |
|---|------|----------------------------------|
| 1 | `callsignature` | ✅ error |
| 2 | `constructsignature` | ✅ error |
| 3 | `methodsignature` | ✅ error |
| 4 | `methoddeclaration` | ✅ error |
| 5 | `constructor` | ⚠️ 0 errors in TS 7.0.3 (not triggered by derived class ctors) |
| 6 | `functiondeclaration` | ✅ error |
| 7 | `functionexpression` | ⚠️ overlaps with `functiontype` |
| 8 | `arrowfunction` | ⚠️ overlaps with `functiontype` |
| 9 | `functiontype` | ✅ 3 errors (catches #7, #8, #9) |
| 10 | `constructortype` | ✅ error |

All **19 flag/test combinations** pass. Run `npm test` to verify.

---

## Why Not Just ESLint?

ESLint's `@typescript-eslint/no-unused-vars` and similar rules check *lexical usage*, not *type-level arity*. They can't catch:

```typescript
function handler(a: string, b: number) {
  // Uses both params — no lint warning
  console.log(a, b);
}

type TakesOne = (a: string) => void;
const bad: TakesOne = handler; // ✅ no lint error, ✅ no TS error
//     ^^^ soundness hole — `bad` receives only one arg at the call site
//         but `handler` expects two at runtime
```

`--strictArity` operates at the **type system** level, catching soundness issues no linter can.

---

## FAQ

### Doesn't this break `forEach` and event handlers?

Potentially — which is why the flag is **granular**. The recommended preset excludes `functiontype`, `functionexpression`, and `arrowfunction`, so `xs.forEach(x => ...)` still works. You start with strict contract-facing checks and opt into stricter callback validation as your codebase evolves.

### Is this compatible with upstream TypeScript?

**Yes.** The modified compiler:
- Produces identical emit to upstream TypeScript
- Only adds type-checking errors — it never removes them
- Defaults to `--strictArity none` (no behavioral change)
- Can be dropped into any build pipeline

### Can I use this today?

Install `@topce/native-preview` from npm and pass `--strictArity` flags. See [Quick Start](#quick-start).

### Why are `indexsignature`, `jsdocfunctiontype`, and `jsdocsignature` excluded?

These kinds don't participate in the same assignability pathways. `indexsignature` uses index types, and JSDoc types are a separate concern. There's no soundness argument for extending strict arity to them.

---

## Architecture

```
parameter-arity-variance-is-not-correct/
├── test.ts            # 10 test cases covering all StrictArity kinds
├── test.sh            # Test matrix runner (flag combinations vs expected errors)
├── LICENSE            # ISC license
├── package.json       # Depends on @topce/native-preview (custom TS compiler)
├── tsconfig.json      # TypeScript 7.x project config
└── README.MD          # This file
```

The actual implementation lives in the [`@topce/native-preview`](https://github.com/topce/native-preview) fork. This repo demonstrates and validates it.

---

## Related Work

- [TypeScript PR #42064](https://github.com/microsoft/TypeScript/pull/42064) — Previous attempt to add strict arity checking (closed)
- [TypeScript issue #13043](https://github.com/Microsoft/TypeScript/issues/13043) — Original feature request (2016)
- [TypeScript issue #20274](https://github.com/Microsoft/TypeScript/issues/20274) — Function parameter bivariance is unsound
- [type-fest](https://github.com/sindresorhus/type-fest) — Community type utilities
- [native-preview](https://github.com/topce/native-preview) — The compiler fork implementing `--strictArity`

---

## License

ISC — see [LICENSE](LICENSE).
