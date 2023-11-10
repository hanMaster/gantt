import dayjs from 'dayjs';
import { ChartNode, Dependency, DependencyTask, DependencyType, TaskNode, isSumTask } from './interfaces';
import { toSatrtDate } from '../utils/dates';
import { swapItems } from '../utils/children';

export class Project {
    #nodes: TaskNode[] = [];
    #id: number;
    #title: string;
    #startDate = toSatrtDate(new Date());
    #dependencies: Dependency[] = [];
    #days = 1;
    #endDate = dayjs(this.#startDate).add(1, 'days').subtract(1, 'second').toDate();
    expanded = true;
    sumTaskId = 0;
    #children: TaskNode[] = [];

    constructor(id: number, title: string) {
        this.#id = id;
        this.#title = title;
    }

    get dependencies() {
        return this.#dependencies;
    }

    get id() {
        return this.#id;
    }

    get startDate() {
        return this.#startDate;
    }

    get endDate() {
        return this.#endDate;
    }

    get title() {
        return this.#title;
    }

    registerTask(t: TaskNode) {
        this.#nodes.push(t);
    }

    getAllTasks(): TaskNode[] {
        return this.#nodes;
    }

    getNodeById(id: number): TaskNode {
        const res = this.#nodes.find((n) => n.id === id);
        if (!res) throw new Error('TaskNode not found');
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
            id: this.#id,
            title: this.#title,
            days: this.#days,
            startDate: dayjs(this.#startDate).format('DD.MM.YYYY'),
            endDate: dayjs(this.#endDate).format('DD.MM.YYYY'),
        };
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

    getParentsForFilter(taskId: number): number[] {
        const res = [];
        let id = taskId;
        res.push(taskId);
        while (id > 0) {
            const task = this.getNodeById(id);
            res.push(task.sumTaskId);
            id = task.sumTaskId;
        }
        return res;
    }

    getDependenciesForTask(taskId: number): DependencyTask[] {
        const task = this.getNodeById(taskId);
        const chartTasks = this.getAllTasks();
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

    private calcDeps() {
        const tasks = this.getAllTasks();
        tasks.forEach((t) => {
            if (t.dependencies.length) {
                const dates = t.dependencies.map((d) => {
                    const dep = this.getNodeById(d.id);
                    if (d.dependencyType === DependencyType.EndStart) {
                        return dayjs(toSatrtDate(dep.endDate)).add(1, 'days').add(d.delayInDays, 'days');
                    } else {
                        return dayjs(dep.startDate).add(d.delayInDays, 'days');
                    }
                });

                console.log(dayjs.max([...dates])?.toDate());
            }
        });
    }
}
