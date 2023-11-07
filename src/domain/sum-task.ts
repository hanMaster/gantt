import dayjs from 'dayjs';
import { Task } from './task';

export type TaskNode = Task | SumTask;

export interface ChartNode {
    id: number;
    title: string;
    days: number;
    startDate: string;
    endDate: string;
    expanded?: boolean;
}

export function isSumTask(node: TaskNode | null): node is SumTask {
    return node instanceof SumTask;
}

export class SumTask extends Task {
    #children: TaskNode[] = [];
    expanded = false;
    constructor(id: number, title: string) {
        super(id, title);
    }

    addTask(task: TaskNode) {
        this.#children.push(task);
        const { start, end } = this.calcDates();
        this.startDate = start;
        this.endDate = end;
    }

    getNodeById(id: number): TaskNode | null {
        let res = this.#children.find((n) => n.id === id) ?? null;
        if (res === null) {
            for (let node of this.#children) {
                if (isSumTask(node)) {
                    res = node.getNodeById(id);
                }
            }
        }

        return res;
    }

    getChartTasks(): ChartNode[] {
        const result = [];
        result.push(this.toChart());
        if (this.expanded) {
            for (let node of this.#children) {
                if (isSumTask(node) && node.expanded) {
                    result.push(...node.getChartTasks());
                } else {
                    result.push(node.toChart());
                }
            }
        }
        return result;
    }

    toChart(): ChartNode {
        return {
            id: this.id,
            title: this.title,
            days: this.days,
            startDate: dayjs(this.startDate).format('DD.MM.YYYY'),
            endDate: dayjs(this.endDate).format('DD.MM.YYYY'),
            expanded: this.expanded,
        };
    }

    private calcDates(): { start: Date; end: Date } {
        let start = new Date();
        let end = new Date();
        if (this.#children.length) {
            start = this.#children[0].startDate;
            end = this.#children[0].endDate;
            for (let i = 0; i < this.#children.length; i++) {
                if (dayjs(start).isAfter(this.#children[i].startDate)) {
                    start = this.#children[i].startDate;
                }
                if (dayjs(end).isBefore(this.#children[i].endDate)) {
                    end = this.#children[i].endDate;
                }
            }
        }

        return { start, end };
    }
}
