import dayjs from 'dayjs';
import { Task } from './task';
import { swapItems } from '../utils/children';
import { ChartNode, TaskNode, isSumTask } from './interfaces';

export class SumTask extends Task {
    #children: TaskNode[] = [];
    expanded = false;
    constructor(id: number, title: string, sumTaskId: number) {
        super(id, title, sumTaskId);
    }

    addTask(task: TaskNode) {
        this.#children.push(task);
        this.updateDates();
    }

    getNodeById(id: number): TaskNode | null {
        let res;
        if (this.id === id) {
            res = this;
        } else {
            res = this.#children.find((n) => n.id === id) ?? null;
        }
        if (res === null) {
            for (let node of this.#children) {
                if (isSumTask(node)) {
                    res = node.getNodeById(id);
                    if (res) break;
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

    chainUpdateFromTask(taskId: number) {
        const task = this.getNodeById(taskId);
        if (task) {
            let parentId = task.sumTaskId;
            while (parentId > 0) {
                const parent = this.getNodeById(parentId);
                if (isSumTask(parent)) {
                    parent.updateDates();
                    parentId = parent.sumTaskId;
                }
            }
        }
    }

    updateDates() {
        const { start, end } = this.calcDates();
        this.startDate = start;
        this.endDate = end;
    }

    moveChild(taskId: number, up = true) {
        const parentId = this.getNodeById(taskId)?.sumTaskId;
        if (parentId && parentId > 0) {
            const parent = this.getNodeById(parentId);
            if (parent && isSumTask(parent)) {
                swapItems(parent.#children, taskId, up);
            }
        }
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
