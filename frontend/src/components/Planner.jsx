import React, { useState, useCallback, useRef, useEffect } from 'react';
import ReactFlow, {
    ReactFlowProvider,
    addEdge,
    useNodesState,
    useEdgesState,
    Controls,
    Background,
    MiniMap,
    Panel,
} from 'reactflow';
import 'reactflow/dist/style.css';
import { getTasks } from '../api'; // Ensure this path is correct
import { Workflow, GripVertical, Save } from 'lucide-react';
import './Planner.css';

const flowKey = 'chronodex-planner-flow';

const Planner = () => {
    const reactFlowWrapper = useRef(null);
    const [nodes, setNodes, onNodesChange] = useNodesState([]);
    const [edges, setEdges, onEdgesChange] = useEdgesState([]);
    const [reactFlowInstance, setReactFlowInstance] = useState(null);
    const [tasks, setTasks] = useState([]);
    const [loading, setLoading] = useState(true);

    // Load graph from local storage on init
    useEffect(() => {
        const restoreFlow = async () => {
            const flow = JSON.parse(localStorage.getItem(flowKey));
            if (flow) {
                const { x = 0, y = 0, zoom = 1 } = flow.viewport;
                setNodes(flow.nodes || []);
                setEdges(flow.edges || []);
                // Viewport adjustments would usually happen via reactFlowInstance.setViewport if instance is ready
            }
        };
        restoreFlow();
    }, [setNodes, setEdges]); // Only run once on mount (setNodes/setEdges are stable)

    // Fetch tasks for the sidebar
    useEffect(() => {
        const fetchTasks = async () => {
            try {
                const data = await getTasks();
                const taskList = data.tasks || (Array.isArray(data) ? data : []);
                setTasks(taskList);
            } catch (error) {
                console.error('Error fetching tasks for planner:', error);
            } finally {
                setLoading(false);
            }
        };

        fetchTasks();
    }, []);

    const onConnect = useCallback(
        (params) => setEdges((eds) => addEdge(params, eds)),
        [setEdges],
    );

    const onSave = useCallback(() => {
        if (reactFlowInstance) {
            const flow = reactFlowInstance.toObject();
            localStorage.setItem(flowKey, JSON.stringify(flow));
            alert('Planner layout saved successfully!');
        }
    }, [reactFlowInstance]);

    // Auto-save effectively on unmount or periodical could be added, but explicit save is safer for now based on user request "add an option to save it"

    const onDragStart = (event, task) => {
        event.dataTransfer.setData('application/reactflow', 'default');
        event.dataTransfer.setData('application/taskData', JSON.stringify(task));
        event.dataTransfer.effectAllowed = 'move';
    };

    const onDragOver = useCallback((event) => {
        event.preventDefault();
        event.dataTransfer.dropEffect = 'move';
    }, []);

    const onDrop = useCallback(
        (event) => {
            event.preventDefault();

            const type = event.dataTransfer.getData('application/reactflow');
            const taskDataString = event.dataTransfer.getData('application/taskData');

            if (typeof type === 'undefined' || !type || !taskDataString) {
                return;
            }

            const task = JSON.parse(taskDataString);

            // Check if node already exists to prevent duplicates
            const existingNode = nodes.find(n => n.id === task._id);
            if (existingNode) {
                alert(`Task "${task.title}" is already on the board.`);
                return;
            }

            const position = reactFlowInstance.screenToFlowPosition({
                x: event.clientX,
                y: event.clientY,
            });

            const newNode = {
                id: task._id,
                type,
                position,
                data: { label: task.title },
            };

            setNodes((nds) => nds.concat(newNode));
        },
        [reactFlowInstance, nodes, setNodes],
    );

    return (
        <div className="planner-container">
            {/* Canvas Area (Left) */}
            <div className="planner-canvas" ref={reactFlowWrapper}>
                <ReactFlowProvider>
                    <ReactFlow
                        nodes={nodes}
                        edges={edges}
                        onNodesChange={onNodesChange}
                        onEdgesChange={onEdgesChange}
                        onConnect={onConnect}
                        onInit={setReactFlowInstance}
                        onDrop={onDrop}
                        onDragOver={onDragOver}
                        fitView
                    >
                        <Controls />
                        <Background color="#aaa" gap={16} />
                        <MiniMap style={{ background: '#1f2937' }} nodeColor="#9333ea" />
                        <Panel position="top-right">
                            <div className="panel-controls" style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
                                <button className="save-btn" onClick={onSave} style={{
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: '5px',
                                    background: '#7c3aed',
                                    border: 'none',
                                    color: 'white',
                                    padding: '5px 10px',
                                    borderRadius: '5px',
                                    cursor: 'pointer'
                                }}>
                                    <Save size={14} /> Save Layout
                                </button>
                                <div style={{ color: '#ccc', fontSize: '12px' }}>Drag tasks from sidebar</div>
                            </div>
                        </Panel>
                    </ReactFlow>
                </ReactFlowProvider>
            </div>

            {/* Sidebar with Tasks (Right) */}
            <div className="planner-sidebar">
                <h3>
                    <Workflow size={20} />
                    Task Planner
                </h3>
                <div className="tasks-list">
                    {loading ? (
                        <p style={{ color: '#9ca3af' }}>Loading tasks...</p>
                    ) : tasks.length === 0 ? (
                        <p style={{ color: '#9ca3af' }}>No tasks available.</p>
                    ) : (
                        tasks.map((task) => (
                            <div
                                key={task._id}
                                className="draggable-task"
                                onDragStart={(event) => onDragStart(event, task)}
                                draggable
                            >
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                                    <h4>{task.title}</h4>
                                    <GripVertical size={16} color="#6b7280" />
                                </div>
                                <p>{new Date(task.deadline).toLocaleDateString()}</p>
                                <span className={`priority-badge priority-${task.priority.toLowerCase()}`}>
                                    {task.priority}
                                </span>
                            </div>
                        ))
                    )}
                </div>
            </div>
        </div>
    );
};

export default Planner;
