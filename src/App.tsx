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
        const td = e.target as HTMLElement;
        const daysInput = document.createElement('input');
        daysInput.setAttribute('type', 'number');
        daysInput.setAttribute('step', '1');
        daysInput.setAttribute('min', '1');
        daysInput.setAttribute('value', t.days.toString());
        daysInput.classList.add('days-input');
        const handleDaysBlur = (e: Event) => {
            const input = e.target as HTMLInputElement;
            const task = project.getNodeById(t.id);
            if (task) {
                task.days = Number(input.value);
                project.chainUpdateFromTask(task.id);
            }
            setGantt(project.getChartTasks());
            daysInput.removeEventListener('blur', handleDaysBlur);
            daysInput.removeEventListener('keydown', handleKeyDown);
        };
        function handleKeyDown(e: KeyboardEvent) {
            if (e.key == 'Enter') {
                handleDaysBlur(e);
            }
        }
        daysInput.addEventListener('blur', handleDaysBlur);
        daysInput.addEventListener('keydown', handleKeyDown);
        td.innerHTML = '';
        td.append(daysInput);
        daysInput.focus();
    };

    const changeTitle = (e: Event, t: ChartNode) => {
        const td = e.target as HTMLElement;
        const titleInput = document.createElement('input');
        titleInput.setAttribute('type', 'text');
        titleInput.setAttribute('value', t.title.toString());
        titleInput.classList.add('title-input');
        const handleDaysBlur = (e: Event) => {
            const input = e.target as HTMLInputElement;
            const task = project.getNodeById(t.id);
            const newVal = input.value.trim();
            if (task && newVal) {
                task.title = newVal;
            }
            setGantt(project.getChartTasks());
            titleInput.removeEventListener('blur', handleDaysBlur);
            titleInput.removeEventListener('keydown', handleKeyDown);
        };

        titleInput.addEventListener('blur', handleDaysBlur);
        titleInput.addEventListener('keydown', handleKeyDown);

        function handleKeyDown(e: KeyboardEvent) {
            if (e.key == 'Enter') {
                handleDaysBlur(e);
            }
        }
        td.innerHTML = '';
        td.append(titleInput);
        titleInput.focus();
        titleInput.selectionStart = titleInput.selectionEnd = titleInput.value.length;
    };

    const genRow = (t: ChartNode) => {
        if ('expanded' in t /* Sum Task */) {
            return (
                <tr style={{ 'background-color': `${selected() === t.id ? 'lightblue' : 'transparent'}` }}>
                    <td onClick={() => setSelected(t.id)}>{t.id}</td>
                    <td onDblClick={(e) => changeTitle(e, t)} class="td-title">
                        <span onClick={() => toggleExpand(t.id)}>{genArrow(t)}</span> {t.title}
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
                    <td onDblClick={(e) => changeTitle(e, t)} class="td-title">
                        {t.title}
                    </td>
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
