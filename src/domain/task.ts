import dayjs from 'dayjs';
import { ChartNode } from './sum-task';

export class Task {
    #id: number;
    #title: string;
    // #relations: number[] = [];
    #startDate = new Date(new Date().getFullYear(), new Date().getMonth(), new Date().getDate());
    #days = 1;
    #endDate = dayjs(this.#startDate).add(this.#days, 'days').subtract(1, 'second').toDate();
    #volume = 0;

    constructor(id: number, title: string) {
        this.#id = id;
        this.#title = title;
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

    set title(title: string) {
        this.#title = title;
    }

    set volume(vol: number) {
        this.#volume = vol;
    }

    set startDate(date: Date) {
        this.#startDate = new Date(date.getFullYear(), date.getMonth(), date.getDate());
        this.#endDate = dayjs(this.#startDate).add(this.#days, 'days').subtract(1, 'second').toDate();
    }

    set days(days: number) {
        this.#days = days;
        this.#endDate = dayjs(this.#startDate).add(this.#days, 'days').subtract(1, 'second').toDate();
    }

    set endDate(date: Date) {
        this.#endDate = new Date(date.getFullYear(), date.getMonth(), date.getDate(), 23, 59, 59);
        this.#days = dayjs(this.#endDate).diff(this.#startDate, 'days') + 1;
    }

    toChart(): ChartNode {
        return {
            id: this.id,
            title: this.title,
            days: this.days,
            startDate: dayjs(this.startDate).format('DD.MM.YYYY'),
            endDate: dayjs(this.endDate).format('DD.MM.YYYY'),
        };
    }
}
