import { For, Show, createSignal } from 'solid-js';
import { ChartNode, SumTask, isSumTask } from './domain/sum-task';
import counter from './utils/counter.ts';
import { Task } from './domain/task.ts';
import './App.css';
import { forDateInput } from './utils/dates.ts';

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
            if (e.key == 'Escape') {
                daysInput.value = t.days.toString();
                td.innerHTML = '';
            } else if (e.key == 'Enter') {
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
            if (e.key == 'Escape') {
                titleInput.value = t.title;
                td.innerHTML = '';
            } else if (e.key == 'Enter') {
                handleDaysBlur(e);
            }
        }
        td.innerHTML = '';
        td.append(titleInput);
        titleInput.focus();
        titleInput.selectionStart = titleInput.selectionEnd = titleInput.value.length;
    };

    const changeDate = (e: Event, t: ChartNode, start = true) => {
        const td = e.target as HTMLElement;
        const date = start ? t.startDate : t.endDate;
        const sdInput = document.createElement('input');
        sdInput.setAttribute('type', 'date');
        sdInput.setAttribute('value', forDateInput(date));
        sdInput.classList.add('date-input');
        const handleDaysBlur = (e: Event) => {
            const input = e.target as HTMLInputElement;
            const task = project.getNodeById(t.id);
            if (task && input.value) {
                if (start) {
                    task.startDate = new Date(input.value);
                } else {
                    task.endDate = new Date(input.value);
                }
                project.chainUpdateFromTask(task.id);
            }
            setGantt(project.getChartTasks());
            sdInput.removeEventListener('blur', handleDaysBlur);
            sdInput.removeEventListener('keydown', handleKeyDown);
        };

        sdInput.addEventListener('blur', handleDaysBlur);
        sdInput.addEventListener('keydown', handleKeyDown);

        function handleKeyDown(e: KeyboardEvent) {
            if (e.key == 'Escape') {
                td.innerHTML = start ? t.startDate : t.endDate;
            } else if (e.key == 'Enter') {
                handleDaysBlur(e);
            }
        }
        td.innerHTML = '';
        td.append(sdInput);
        sdInput.focus();
    };

    const genRow = (t: ChartNode) => {
        if ('expanded' in t /* Sum Task */) {
            return (
                <tr style={{ 'background-color': `${selected() === t.id ? 'lightblue' : 'transparent'}` }}>
                    <td onClick={() => setSelected(selected() === t.id ? 0 : t.id)}>{t.id}</td>
                    <td onDblClick={(e) => changeTitle(e, t)} class="td-title">
                        <span onClick={() => toggleExpand(t.id)}>{genArrow(t)}</span> {t.title}
                    </td>
                    <td class="days">{t.days}</td>
                    <td class="date">{t.startDate}</td>
                    <td class="date">{t.endDate}</td>
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
                    <td onDblClick={(e) => changeDate(e, t)} class="date">
                        {t.startDate}
                    </td>
                    <td onDblClick={(e) => changeDate(e, t, false)} class="date">
                        {t.endDate}
                    </td>
                </tr>
            );
        }
    };

    return (
        <>
            <div class="actions">
                <button onClick={addSumTask}>Суммарная задача</button>
                <button onClick={addTask}>Задача</button>
            </div>
            <table>
                <thead>
                    <tr>
                        <th class="id">№</th>
                        <th class="title">Наименование</th>
                        <th class="days">Дни</th>
                        <th class="date">Начало</th>
                        <th class="date">Окончание</th>
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
