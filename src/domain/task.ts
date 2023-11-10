import { toEndDate, toSatrtDate } from './../utils/dates';
import dayjs from 'dayjs';
import { ChartNode, Dependency, NewTask, Persisted, isPersisted } from './interfaces';
import { Project } from './project';

export class Task {
    #id: number;
    #title: string;
    project: Project;
    #sumTaskId: number;
    #dependencies: Dependency[] = [];
    #startDate = toSatrtDate(new Date());
    #days = 1;
    #endDate = dayjs(this.#startDate).add(1, 'days').subtract(1, 'second').toDate();
    #volume = 0;

    constructor(project: Project, p: Persisted);
    constructor(project: Project, p: NewTask);
    constructor(project: Project, p: Persisted | NewTask) {
        if (isPersisted(p)) {
            this.#id = p.id;
            this.#title = p.title;
            this.#sumTaskId = p.sumTaskId;
            this.#startDate = new Date(p.startDate);
            this.#days = p.days;
            this.#endDate = new Date(p.endDate);
            this.#dependencies = p.dependencies;
            this.project = project;
        } else {
            this.#id = p.id;
            this.#title = p.title;
            this.#sumTaskId = p.sumTaskId;
            this.project = project;
        }
    }

    persist(): Persisted {
        return {
            id: this.#id,
            title: this.#title,
            sumTaskId: this.#sumTaskId,
            dependencies: this.#dependencies,
            startDate: this.#startDate,
            days: this.#days,
            endDate: this.#endDate,
        };
    }

    get isStartDateChangeAllowed() {
        let parentAllowed = true;
        if (this.#sumTaskId > 1) {
            const parent = this.project.getNodeById(this.#sumTaskId);
            if (parent.dependencies.length) {
                parentAllowed = false;
            }
        }
        return parentAllowed && this.#dependencies.length === 0;
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

    get days() {
        return this.#days;
    }

    get volume() {
        return this.#volume;
    }

    get title() {
        return this.#title;
    }

    get sumTaskId() {
        return this.#sumTaskId;
    }

    get dependencies() {
        return this.#dependencies;
    }

    deleteDependency(depId: number) {
        this.#dependencies = this.#dependencies.filter((d) => d.id !== depId);
    }

    set title(title: string) {
        this.#title = title;
    }

    set volume(vol: number) {
        this.#volume = vol;
    }

    set startDate(date: Date) {
        this.#startDate = toSatrtDate(date);
        const newDays = dayjs(this.#endDate).diff(this.#startDate, 'days') + 1;
        if (newDays > 0) {
            this.#days = newDays;
        } else {
            this.#endDate = dayjs(this.#startDate).add(this.#days, 'days').subtract(1, 'second').toDate();
        }
        this.project.calcDeps();
    }

    set depStartDate(date: Date) {
        this.#startDate = toSatrtDate(date);
        this.#endDate = dayjs(this.#startDate).add(this.#days, 'days').subtract(1, 'second').toDate();
    }

    set days(days: number) {
        this.#days = days;
        this.#endDate = dayjs(this.#startDate).add(this.#days, 'days').subtract(1, 'second').toDate();
        this.project.calcDeps();
    }

    set endDate(date: Date) {
        if (dayjs(date).isBefore(dayjs(this.#startDate))) {
            if (this.isStartDateChangeAllowed) {
                this.#startDate = dayjs(date)
                    .subtract(this.#days - 1, 'days')
                    .toDate();
                this.#endDate = toEndDate(date);
            }
        } else {
            this.#endDate = toEndDate(date);
            this.#days = dayjs(this.#endDate).diff(this.#startDate, 'days') + 1;
        }
        this.project.calcDeps();
    }

    toChart(): ChartNode {
        return {
            id: this.id,
            title: this.title,
            days: this.days,
            startDate: dayjs(this.startDate).format('DD.MM.YYYY'),
            endDate: dayjs(this.endDate).format('DD.MM.YYYY'),
            deps: this.#dependencies,
        };
    }
}
