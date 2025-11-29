interface KnockoutElement<T> {
  // Getter
  (): T;
  // Setter
  (value: T): void;
}

// Implementation of KnockoutElement<T>
function createKnockoutElement<T>(initialValue: T): KnockoutElement<T> {
  let value = initialValue;
  const fn = ((v?: T) => {
    if (typeof v !== "undefined") {
      value = v;
      return;
    }
    return value;
  }) as KnockoutElement<T>;
  return fn;
}



function readFile(finished: (contents: string) => void) { /*... */ }
let ko: KnockoutElement<number> = createKnockoutElement<number>(42);
readFile(ko); // No error, but passes a string to a number-expecting setter!