const addOne = (
    effect: (
      arg1: number,
      arg2: () => 'A'
    ) => void
  ): void => {
    effect(1, () => 'A');
  };
  
  addOne(
    (
      arg1: number,
      arg2: (cheese: 'wheel') => void,
    ) => console.log(arg1 + 1)
  );