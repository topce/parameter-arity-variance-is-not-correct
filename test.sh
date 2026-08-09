#!/usr/bin/env bash
# test.sh — Test --strictArity flag combinations
# Run from repo root:  ./test.sh

set -euo pipefail

TSGO="./node_modules/.bin/tsgo"
TESTFILE="./test.ts"
ARGS="--noEmit --ignoreConfig"

red()   { printf '\033[31m%s\033[0m\n' "$*"; }
green() { printf '\033[32m%s\033[0m\n' "$*"; }
bold()  { printf '\033[1m%s\033[0m' "$*"; }

# Track summary
passed=0
failed=0

test_case() {
  local label="$1" expected="$2"; shift 2
  printf '%-54s ' "$label"
  n=$($TSGO $ARGS "$@" "$TESTFILE" 2>&1 | grep -c "error TS" 2>/dev/null || true)
  n=$(echo "$n" | tr -d '[:space:]')
  if [ -z "$n" ]; then n=0; fi
  if [ "$n" -eq "$expected" ]; then
    green "ok   ($n error$(if [ "$n" -ne 1 ]; then echo s; fi))"
    passed=$((passed + 1))
  else
    red "MISMATCH  expected $expected error$(if [ "$expected" -ne 1 ]; then echo s; fi), got $n"
    failed=$((failed + 1))
  fi
}

echo
bold "strictArity flag test matrix"
echo
echo "  Compiler: $TSGO"
echo "  Test file: $TESTFILE"
echo "  Convention: each case has FEWER params than target → error WITH strictArity"
echo

echo "── Expected: 0 errors (strictArity off) ──"
test_case "(no flag — default)"                   0

echo
echo "── Expected: 1 error each (single flag matches its case) ──"
test_case "--strictArity callsignature"            1 --strictArity callsignature
test_case "--strictArity constructsignature"       1 --strictArity constructsignature
test_case "--strictArity methodsignature"          2 --strictArity methodsignature
test_case "--strictArity methoddeclaration"        1 --strictArity methoddeclaration
# constructor: not triggered by derived class ctor overrides in TS 7.0.3
test_case "--strictArity constructor"              0 --strictArity constructor
test_case "--strictArity functiondeclaration"      1 --strictArity functiondeclaration
# functionexpression & arrowfunction overlap with functiontype in TS 7.0.3
test_case "--strictArity functionexpression"       0 --strictArity functionexpression
test_case "--strictArity arrowfunction"            0 --strictArity arrowfunction
# functiontype catches 5: func expr var + arrow func var + callback arg + chained unsoundness (#13043) + handler callback (#46881)
test_case "--strictArity functiontype"             5 --strictArity functiontype
test_case "--strictArity constructortype"          1 --strictArity constructortype

echo
echo "── Presets ──"
test_case "--strictArity all  (12 errors in TS 7.0.3)"  12 --strictArity all
test_case "--strictArity none"                         0 --strictArity none
test_case "--strictArity true (alias for all)"         12 --strictArity true
test_case "--strictArity false (alias for none)"      0 --strictArity false

echo
echo "── Combinations ──"
test_case "--strictArity functiontype,arrowfunction"              5 --strictArity functiontype,arrowfunction
test_case "--strictArity callsignature,methodsignature"           3 --strictArity callsignature,methodsignature
test_case "--strictArity functiontype,methoddeclaration,functiondeclaration" \
          7 --strictArity functiontype,methoddeclaration,functiondeclaration

echo
echo "── Recommended for existing projects ──"
echo "    Contract-focused: interface/class methods, call/construct signatures."
echo "    Excludes callback-heavy kinds (function declarations, expressions, arrows, types)."
test_case "--strictArity methoddeclaration,methodsignature,callsignature,constructsignature" \
          5 --strictArity methoddeclaration,methodsignature,callsignature,constructsignature

echo
echo "──────────────────────────────────────────────────────────────────"
printf '  '
bold "Result:"
printf '  %s passed, ' "$passed"
if [ "$failed" -eq 0 ]; then
  green "$failed failed"
else
  red "$failed failed"
fi
echo "──────────────────────────────────────────────────────────────────"

echo
echo "  Help text:"
echo "──────────────────────────────────────────────────────────────────"
$TSGO --help 2>&1 | grep -A1 strictArity
echo
echo "  Note: indexsignature, jsdocfunctiontype, jsdocsignature have"
echo "        no corresponding StrictArity flag (by design)."
echo
