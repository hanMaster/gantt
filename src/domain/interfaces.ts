import { Project } from './project';
import { SumTask } from './sum-task';
import { Task } from './task';

export type TaskNode = Task | SumTask;

export function isSumTask(node: Task | Project | null): node is SumTask {
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
