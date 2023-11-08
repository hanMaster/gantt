export const forDateInput = (date: string) => {
    const d = date.split('.');
    const res = `${d[2]}-${d[1]}-${d[0]}`;
    return res;
};
