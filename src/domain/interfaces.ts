import { SumTask } from './sum-task';
import { Task } from './task';

export type TaskNode = Task | SumTask;

export function isSumTask(node: Task | SumTask): node is SumTask {
    return node instanceof SumTask;
}

export interface ChartNode {
    id: number;
    title: string;
    days: number;
    startDate: string;
    endDate: string;
    expanded?: boolean;
    deps?: Dependency[];
}

export interface DependencyTask {
    id: number;
    title: string;
    startDate: string;
    endDate: string;
}

export enum DependencyType {
    EndStart = 'es',
    StartStart = 'ss',
}

export interface Dependency {
    id: number;
    dependencyType: DependencyType;
    delayInDays: number;
}

export interface Persisted {
    id: number;
    title: string;
    sumTaskId: number;
    dependencies: Dependency[];
    startDate: Date;
    days: number;
    endDate: Date;
    children?: number[];
    expanded?: boolean;
}

export interface NewTask {
    id: number;
    title: string;
    sumTaskId: number;
}

export function isPersisted(p: Persisted | NewTask): p is Persisted {
    return 'dependencies' in p;
}
