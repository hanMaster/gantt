import dayjs from 'dayjs';
import minMax from 'dayjs/plugin/minMax';
import { Task } from './task';
import { ChartNode, DependencyTask, Persisted, TaskNode, isSumTask } from './interfaces';
import { Project } from './project';

dayjs.extend(minMax);

export class SumTask extends Task {
    #children: TaskNode[] = [];
    expanded = false;
    constructor(id: number, title: string, sumTaskId: number, project: Project) {
        super(id, title, sumTaskId, project);
    }

    persist(): Persisted {
        const p = super.persist();
        p.expanded = this.expanded;
        p.children = this.#children.map((i) => i.id);
        return p;
    }

    get children() {
        return this.#children;
    }

    addTask(task: TaskNode) {
        this.#children.push(task);
        this.project.registerTask(task);
        this.updateDates();
    }

    toChart(): ChartNode {
        const res = super.toChart();
        res.expanded = this.expanded;
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

    updateDates() {
        const { start, end } = this.calcDatesFromChildren();
        this.startDate = start;
        this.endDate = end;
    }

    getChildrenForFilter(taskId: number): number[] {
        const result = [];
        const task = this.project.getNodeById(taskId);
        if (isSumTask(task)) {
            for (let node of task.children) {
                if (isSumTask(node)) {
                    result.push(...node.getChildrenForFilter(node.id));
                } else {
                    result.push(node.id);
                }
            }
        }

        return result;
    }

    getParentsForFilter(taskId: number): number[] {
        const res = [];
        let id = taskId;
        res.push(taskId);
        while (id > 0) {
            const task = this.project.getNodeById(id);
            res.push(task.sumTaskId);
            id = task.sumTaskId;
        }
        return res;
    }

    getDependenciesForTask(taskId: number): DependencyTask[] {
        const task = this.project.getNodeById(taskId);
        const chartTasks = this.project.getAllTasks();
        const excludeList: number[] = this.getParentsForFilter(taskId);
        if (isSumTask(task)) {
            excludeList.push(...task.getChildrenForFilter(taskId));
        }

        const res = chartTasks
            .filter((t) => !excludeList.includes(t.id))
            .map((t) => ({
                id: t.id,
                title: t.title,
                startDate: dayjs(this.startDate).format('DD.MM.YYYY'),
                endDate: dayjs(this.endDate).format('DD.MM.YYYY'),
            }));
        return res;
    }

    private calcDatesFromChildren(): { start: Date; end: Date } {
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
