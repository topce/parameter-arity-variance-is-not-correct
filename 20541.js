const addOne = (effect) => {
    effect(1, () => 'A');
};
addOne((arg1, arg2) => console.log(arg1 + 1));
