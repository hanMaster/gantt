const createCounter = () => {
    let count = 2;
    return function () {
        return count++;
    };
};

export default createCounter();
