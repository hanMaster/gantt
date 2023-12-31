import dayjs from 'dayjs';
import { ChartNode, Dependency, DependencyTask, DependencyType, Persisted, TaskNode, isSumTask } from './interfaces';
import { toSatrtDate } from '../utils/dates';
import { swapItems } from '../utils/children';
import { SumTask } from './sum-task';
import { Task } from './task';

export class Project {
    root: SumTask = new SumTask(this, { id: 1, title: 'Проект', sumTaskId: 0 });
    #nodes: TaskNode[] = [this.root];
    #calcDepsActive = false;
    #counter = 2;

    constructor() {
        const tasks = localStorage.getItem('tasks');
        if (tasks) {
            const persisted: Persisted[] = JSON.parse(tasks);
            persisted.forEach((p) => {
                if (p.id === 1) return;
                if ('children' in p) {
                    this.#nodes.push(new SumTask(this, p));
                } else {
                    this.#nodes.push(new Task(this, p));
                }
            });
            this.setChildren(persisted);
            this.root.updateDates();
            this.#counter = Math.max(...persisted.map((p) => p.id)) + 1;
        }
    }

    get counter() {
        return this.#counter++;
    }

    persist() {
        const tasks: Persisted[] = [];
        tasks.push(...this.#nodes.map((n) => n.persist()));
        localStorage.setItem('tasks', JSON.stringify(tasks));
    }

    setChildren(persisted: Persisted[]) {
        persisted.forEach((p) => {
            if ('children' in p) {
                const task = this.getNodeById(p.id);
                if (isSumTask(task)) {
                    p.children?.forEach((c) => {
                        task.children.push(this.getNodeById(c));
                    });
                }
            }
        });
    }

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
