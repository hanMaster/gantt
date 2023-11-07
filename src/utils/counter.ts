const createCounter = () => {
    let count = 1;
    return function () {
        return count++;
    };
};

export default createCounter();
