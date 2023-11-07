import { For, Show, createSignal } from 'solid-js';
import { ChartNode, SumTask, isSumTask } from './domain/sum-task';
import counter from './utils/counter.ts';
import './App.css';

function App() {
    let project: SumTask;
    const [title, setTitle] = createSignal<string>('');
    const [gantt, setGantt] = createSignal<ChartNode[]>([]);
    const [selected, setSelected] = createSignal<number>(0);

    const addSumTask = () => {
        if (title() && gantt().length) {
            const root = selected() > 0 ? project.getNodeById(selected()) : project;
            if (isSumTask(root)) {
                root.addTask(new SumTask(counter(), title()));
                setGantt(project.getChartTasks());
                setTitle('');
            }
        } else if (title()) {
            project = new SumTask(counter(), title());
            project.expanded = true;
            setGantt(project.getChartTasks());
            setTitle('');
        }
        console.log(project);
    };

    const toggleExpand = (id: number) => {
        const node = project.getNodeById(id);
        console.log('NODE', node);

        if (isSumTask(node)) {
            node.expanded = !node.expanded;
            setGantt(project.getChartTasks());
        }
    };

    const genRow = (t: ChartNode) => {
        return (
            <tr style={{ 'background-color': `${selected() === t.id ? 'lightblue' : 'transparent'}` }}>
                <td onClick={() => setSelected(t.id)}>{t.id}</td>
                <td onClick={() => toggleExpand(t.id)}>
                    {t.expanded ? 'yes' : 'no'} {t.title}
                </td>
                <td>{t.days}</td>
                <td>{t.startDate}</td>
                <td>{t.endDate}</td>
            </tr>
        );
    };

    return (
        <>
            <div class="actions">
                <input type="text" value={title()} onInput={(e) => setTitle(e.target.value.trim())} />
                <button onClick={addSumTask}>Add sum task</button>
                <button>Add task</button>
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
