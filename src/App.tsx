import { For, Show, createSignal } from 'solid-js';
import { ChartNode, SumTask, isSumTask } from './domain/sum-task';
import counter from './utils/counter.ts';
import { Task } from './domain/task.ts';
import './App.css';

function App() {
    let project: SumTask;
    const [gantt, setGantt] = createSignal<ChartNode[]>([]);
    const [selected, setSelected] = createSignal<number>(0);

    const addSumTask = () => {
        const id = counter();
        if (gantt().length) {
            const root = selected() > 0 ? project.getNodeById(selected()) : project;
            if (isSumTask(root)) {
                root.addTask(new SumTask(id, `Суммарная задача ${id}`, root.id));
                setGantt(project.getChartTasks());
            }
        } else {
            project = new SumTask(id, `Суммарная задача ${id}`, 0);
            project.expanded = true;
            setGantt(project.getChartTasks());
        }
    };

    const addTask = () => {
        if (gantt().length) {
            const id = counter();
            const root = selected() > 0 ? project.getNodeById(selected()) : project;
            if (isSumTask(root)) {
                root.addTask(new Task(id, `Задача ${id}`, root.id));
                setGantt(project.getChartTasks());
            }
        }
    };

    const toggleExpand = (id: number) => {
        const node = project.getNodeById(id);

        if (isSumTask(node)) {
            node.expanded = !node.expanded;
            setGantt(project.getChartTasks());
        }
    };

    const genArrow = (t: ChartNode) => {
        if (!('expanded' in t)) return <></>;
        if (t.expanded) {
            return <i class="bx bxs-down-arrow"></i>;
        } else {
            return <i class="bx bxs-right-arrow"></i>;
        }
    };

    const changeDays = (e: Event, t: ChartNode) => {
        setSelected(t.id);
        const td = e.target as HTMLElement;
        const daysInput = document.createElement('input');
        daysInput.setAttribute('type', 'number');
        daysInput.setAttribute('step', '1');
        daysInput.setAttribute('min', '1');
        daysInput.setAttribute('value', t.days.toString());
        daysInput.classList.add('days-input');
        daysInput.addEventListener('blur', function () {
            const task = project.getNodeById(t.id);
            if (task) {
                task.days = Number(this.value);
                project.chainUpdateFromTask(task.id);
            }
            setSelected(0);
            setGantt(project.getChartTasks());
        });
        td.innerHTML = '';
        td.append(daysInput);
    };

    const genRow = (t: ChartNode) => {
        if ('expanded' in t /* Sum Task */) {
            return (
                <tr style={{ 'background-color': `${selected() === t.id ? 'lightblue' : 'transparent'}` }}>
                    <td onClick={() => setSelected(t.id)}>{t.id}</td>
                    <td onClick={() => toggleExpand(t.id)} class="td-title">
                        {genArrow(t)} {t.title}
                    </td>
                    <td class="days">{t.days}</td>
                    <td>{t.startDate}</td>
                    <td>{t.endDate}</td>
                </tr>
            );
        } else {
            return (
                <tr>
                    <td>{t.id}</td>
                    <td class="td-title">{t.title}</td>
                    <td onDblClick={(e) => changeDays(e, t)} class="days">
                        {t.days}
                    </td>
                    <td>{t.startDate}</td>
                    <td>{t.endDate}</td>
                </tr>
            );
        }
    };

    return (
        <>
            <div class="actions">
                <button onClick={addSumTask}>Add sum task</button>
                <button onClick={addTask}>Add task</button>
            </div>
            <table>
                <thead>
                    <tr>
                        <th>id</th>
                        <th class="title">title</th>
                        <th>days</th>
                        <th>start</th>
                        <th>end</th>
                    </tr>
                </thead>
                <tbody>
                    <Show when={gantt()}>
                        <For each={gantt()}>
                            {(g) => {
                                return genRow(g);
                            }}
                        </For>
                    </Show>
                </tbody>
            </table>
        </>
    );
}

export default App;
