// Issue #21868: Function with no parameters incorrectly assignable to function type expecting parameters
// https://github.com/microsoft/TypeScript/issues/21868

// This should be an error because the function type expects a parameter
// but the implementation completely ignores it
const some: ((arg: string) => boolean) = () => true;

// Another example of the same issue
const processor: ((data: string, index: number) => void) = () => {
    console.log("Processing without using any parameters");
};

// This is problematic because callers expect the function to use the parameters
function callProcessor(fn: (data: string, index: number) => void) {
    fn("important data", 42); // Parameters are ignored by the implementation
}

callProcessor(processor); // Should error - processor ignores required parameters