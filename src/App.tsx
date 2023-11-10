import { For, Show, createSignal } from 'solid-js';
import { ChartNode, Dependency, DependencyTask, DependencyType, isSumTask } from './domain/interfaces.ts';
import { SumTask } from './domain/sum-task';
import { Task } from './domain/task.ts';
import { forDateInput } from './utils/dates.ts';
import { Project } from './domain/project.ts';
import './App.css';

function App() {
    const project = new Project();
    const [gantt, setGantt] = createSignal<ChartNode[]>(project.getChartTasks());
    const [selected, setSelected] = createSignal<number>(0);
    const [showLinkForm, setShowLinkForm] = createSignal<boolean>(false);
    const [deps, setDeps] = createSignal<DependencyTask[]>([]);
    const [depTaskId, setDepTaskId] = createSignal<number>(0);
    const [depType, setDepType] = createSignal<DependencyType>(DependencyType.EndStart);
    const [delay, setDelay] = createSignal<number>(0);

    const addSumTask = () => {
        const id = project.counter;
        const root = selected() > 0 ? project.getNodeById(selected()) : project.root;
        if (isSumTask(root)) {
            root.addTask(new SumTask(project, { id, title: `Суммарная задача ${id}`, sumTaskId: root.id }));
            setGantt(project.getChartTasks());
        }
    };

    const addTask = () => {
        const id = project.counter;
        const root = selected() > 0 ? project.getNodeById(selected()) : project.root;
        if (isSumTask(root)) {
            root.addTask(new Task(project, { id, title: `Задача ${id}`, sumTaskId: root.id }));
            setGantt(project.getChartTasks());
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
        if (start) {
            const task = project.getNodeById(t.id);
            if (!task.isStartDateChangeAllowed) {
                return;
            }
        }
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

    const handleUp = (id: number) => {
        project.moveChild(id);
        setGantt(project.getChartTasks());
    };

    const handleDown = (id: number) => {
        project.moveChild(id, false);
        setGantt(project.getChartTasks());
    };

    const handleLink = (id: number) => {
        setDeps(project.getDependenciesForTask(id));
        setSelected(id);
        setShowLinkForm(true);
    };

    const genDeps = (task: ChartNode) => {
        if (task.deps) {
            const res = task.deps
                .map(
                    (dep) =>
                        `${dep.id}${dep.dependencyType == DependencyType.EndStart ? 'он' : 'нн'}${dep.delayInDays}д`
                )
                .join(';');

            return <>{res}</>;
        }
    };

    const genRow = (t: ChartNode) => {
        if ('expanded' in t /* Sum Task */) {
            return (
                <tr style={{ 'background-color': `${selected() === t.id ? 'lightblue' : 'transparent'}` }}>
                    <td onClick={() => setSelected(selected() === t.id ? 0 : t.id)} class="pointer">
                        {t.id}
                    </td>
                    <td onDblClick={(e) => changeTitle(e, t)} class="td-title">
                        <span onClick={() => toggleExpand(t.id)}>{genArrow(t)}</span> {t.title}
                    </td>
                    <td class="days">{t.days}</td>
                    <td class="date">{t.startDate}</td>
                    <td class="date">{t.endDate}</td>
                    <td class="move" onClick={() => handleUp(t.id)}>
                        <i class="bx bxs-up-arrow"></i>
                    </td>
                    <td class="move" onClick={() => handleDown(t.id)}>
                        <i class="bx bxs-down-arrow"></i>
                    </td>
                    <td class={t.id > 1 ? 'deps' : undefined} onClick={() => handleLink(t.id)}>
                        {t.id > 1 && (
                            <>
                                <i class="bx bx-link"></i>&nbsp;
                                {genDeps(t)}
                            </>
                        )}
                    </td>
                </tr>
            );
        } else {
            return (
                <tr>
                    <td>{t.id}</td>
                    <td onDblClick={(e) => changeTitle(e, t)} class="td-title">
                        {t.title}
                    </td>
                    <td onDblClick={(e) => changeDays(e, t)} class="days pointer">
                        {t.days}
                    </td>
                    <td onDblClick={(e) => changeDate(e, t)} class="date pointer">
                        {t.startDate}
                    </td>
                    <td onDblClick={(e) => changeDate(e, t, false)} class="date pointer">
                        {t.endDate}
                    </td>
                    <td class="move" onClick={() => handleUp(t.id)}>
                        <i class="bx bxs-up-arrow"></i>
                    </td>
                    <td class="move" onClick={() => handleDown(t.id)}>
                        <i class="bx bxs-down-arrow"></i>
                    </td>
                    <td class="deps" onClick={() => handleLink(t.id)}>
                        <i class="bx bx-link"></i>&nbsp;
                        {genDeps(t)}
                    </td>
                </tr>
            );
        }
    };

    const handleCancel = () => {
        setSelected(0);
        setDepTaskId(0);
        setDepType(DependencyType.EndStart);
        setDelay(0);
        setShowLinkForm(false);
    };

    const handleAddDependency = (e: Event) => {
        e.preventDefault();
        if (selected() > 0 && depTaskId() > 0) {
            const d: Dependency = {
                id: depTaskId(),
                dependencyType: depType(),
                delayInDays: delay(),
            };
            project.addOrUpdateDependency(d, selected());
            setGantt(project.getChartTasks());
        }
        handleCancel();
    };

    const handleDeleteDependency = (e: Event) => {
        e.preventDefault();
        const task = project.getNodeById(selected());
        if (task && depTaskId() > 0) {
            task.deleteDependency(depTaskId());
            setGantt(project.getChartTasks());
        }
        handleCancel();
    };

    const handlePersist = () => {
        project.persist();
    };

    return (
        <>
            <div class="actions">
                <button onClick={addSumTask}>Суммарная задача</button>
                <button onClick={addTask}>Задача</button>
                <button onClick={handlePersist}>Сохранить</button>
            </div>
            {showLinkForm() && (
                <form class="deps-form">
                    <h2>Редактирование связи</h2>
                    <select
                        class="deps-input"
                        value={depTaskId()}
                        onInput={(e) => setDepTaskId(Number(e.target.value))}
                    >
                        <For each={deps()}>
                            {(dep) => (
                                <option
                                    value={dep.id}
                                >{`№${dep.id} "${dep.title}" С: ${dep.startDate} По: ${dep.endDate}`}</option>
                            )}
                        </For>
                    </select>
                    <div class="deps-properties">
                        <div class="form-group">
                            <label for="dep-type">Тип связи</label>
                            <select
                                id="dep-type"
                                class="deps-input"
                                value={depType()}
                                onInput={(e) =>
                                    setDepType(
                                        e.target.value == 'es' ? DependencyType.EndStart : DependencyType.StartStart
                                    )
                                }
                            >
                                <option value="es">Окночание-Начало</option>
                                <option value="ss">Начало-Начало</option>
                            </select>
                        </div>
                        <div class="form-group">
                            <label for="delay">Задержка</label>
                            <input
                                id="delay"
                                class="deps-input"
                                type="number"
                                step="1"
                                value={delay()}
                                onInput={(e) => setDelay(Number(e.target.value))}
                            />
                        </div>
                    </div>
                    <div class="buttons">
                        <button class="ok" onClick={handleAddDependency}>
                            Создать
                        </button>
                        <button class="ok" onClick={handleDeleteDependency}>
                            Удалить
                        </button>
                        <button class="cancel" onClick={handleCancel}>
                            Отмена
                        </button>
                    </div>
                </form>
            )}
            <table>
                <thead>
                    <tr>
                        <th class="id">№</th>
                        <th class="title">Наименование</th>
                        <th class="days">Дни</th>
                        <th class="date">Начало</th>
                        <th class="date">Окончание</th>
                        <th class="move"></th>
                        <th class="move"></th>
                        <th class="move">Предшественники</th>
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
