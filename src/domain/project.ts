import dayjs from 'dayjs';
import { ChartNode, Dependency, DependencyTask, DependencyType, TaskNode, isSumTask } from './interfaces';
import { toSatrtDate } from '../utils/dates';
import { swapItems } from '../utils/children';
import { SumTask } from './sum-task';

export class Project {
    root: SumTask = new SumTask(1, 'Проект', 0, this);
    #nodes: TaskNode[] = [this.root];
    #calcDepsActive = false;

    constructor() {}

    get isCalcDepsActive() {
        return this.#calcDepsActive;
    }

    addTask(task: TaskNode) {
        this.root.children.push(task);
        this.registerTask(task);
        this.root.updateDates();
    }

    getChartTasks(): ChartNode[] {
        return this.root.getChartTasks();
    }

    getDependenciesForTask(taskId: number): DependencyTask[] {
        return this.root.getDependenciesForTask(taskId);
    }

    registerTask(task: TaskNode) {
        this.#nodes.push(task);
    }

    getAllTasks(): TaskNode[] {
        return this.#nodes;
    }

    getNodeById(id: number): TaskNode {
        const res = this.#nodes.find((n) => n.id === id);

        if (!res) throw new Error('TaskNode not found');
        return res;
    }

    moveChild(taskId: number, up = true) {
        const parentId = this.getNodeById(taskId)?.sumTaskId;
        if (parentId && parentId > 0) {
            const parent = this.getNodeById(parentId);
            if (parent && isSumTask(parent)) {
                swapItems(parent.children, taskId, up);
            }
        }
    }

    chainUpdateFromTask(taskId: number) {
        const task = this.getNodeById(taskId);
        let parentId = task.sumTaskId;
        while (parentId > 0) {
            const parent = this.getNodeById(parentId);
            if (isSumTask(parent)) {
                parent.updateDates();
                parentId = parent.sumTaskId;
            }
        }
    }

    addOrUpdateDependency(d: Dependency, taskId: number) {
        const task = this.getNodeById(taskId);
        const idx = task.dependencies.findIndex((i) => i.id === d.id);
        if (idx === -1) {
            task.dependencies.push(d);
        } else {
            task.dependencies.splice(idx, 1, d);
        }
        this.calcDeps();
    }

    calcDeps() {
        if (this.#calcDepsActive) return;
        this.#calcDepsActive = true;
        const tasks = this.getAllTasks();
        tasks.forEach((t) => {
            const parentDeps = [];
            if (t.sumTaskId > 1) {
                const parent = this.getNodeById(t.sumTaskId);
                parentDeps.push(...parent.dependencies);
            }

            const deps = [...parentDeps, ...t.dependencies];

            if (deps.length) {
                const dates = deps.map((d) => {
                    const dep = this.getNodeById(d.id);
                    if (d.dependencyType === DependencyType.EndStart) {
                        return dayjs(toSatrtDate(dep.endDate)).add(1, 'days').add(d.delayInDays, 'days');
                    } else {
                        return dayjs(dep.startDate).add(d.delayInDays, 'days');
                    }
                });

                const newDate = dayjs.max([...dates])?.toDate();
                t.startDate = newDate as Date;
                t.days = t.days;
                this.chainUpdateFromTask(t.id);
            }
        });
        this.#calcDepsActive = false;
    }
}
