// TypeScript Issue #20274: Allow specifying that a function parameter is required

type Handler<T> = (item: T) => void;

// Problem: Both of these are allowed, but sometimes you want to require the parameter
const ignoresParam: Handler<string> = () => {}; // Should be error?
const usesParam: Handler<string> = (item) => console.log(item); // OK
