import { TaskNode } from '../domain/sum-task';

export const swapItems = (children: TaskNode[], taskId: number, up: boolean) => {
    if (children.length === 1) return;
    const idx = children.findIndex((child) => child.id === taskId);
    if ((idx === 0 && up) || (idx === children.length - 1 && !up)) return;
    if (up) {
        [children[idx - 1], children[idx]] = [children[idx], children[idx - 1]];
    } else {
        [children[idx + 1], children[idx]] = [children[idx], children[idx + 1]];
    }
};
