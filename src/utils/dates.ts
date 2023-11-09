export const forDateInput = (date: string) => {
    const d = date.split('.');
    const res = `${d[2]}-${d[1]}-${d[0]}`;
    return res;
};

export const toSatrtDate = (date: Date): Date => {
    return new Date(date.getFullYear(), date.getMonth(), date.getDate());
};

export const toEndDate = (date: Date): Date => {
    return new Date(date.getFullYear(), date.getMonth(), date.getDate(), 23, 59, 59);
};
