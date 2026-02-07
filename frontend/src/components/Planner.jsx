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
    ControlButton,
} from 'reactflow';
import 'reactflow/dist/style.css';
import { getTasks } from '../api'; // Ensure this path is correct
import { Workflow, GripVertical, Save, Trash2, Maximize, ChevronLeft, ChevronRight, Check } from 'lucide-react';
import './Planner.css';

const flowKey = 'chronodex-planner-flow';

const Planner = () => {
    const reactFlowWrapper = useRef(null);
    const [nodes, setNodes, onNodesChange] = useNodesState([]);
    const [edges, setEdges, onEdgesChange] = useEdgesState([]);
    const [reactFlowInstance, setReactFlowInstance] = useState(null);
    const [tasks, setTasks] = useState([]);
    const [loading, setLoading] = useState(true);
    const [isDraggingNode, setIsDraggingNode] = useState(false);
    const trashZoneRef = useRef(null);

    const calculateDynamicScore = (task) => {
        const priorityMap = { Critical: 0, High: 10, Medium: 20, Low: 30 };
        const weight = priorityMap[task.priority] !== undefined ? priorityMap[task.priority] : 30;
        const now = Date.now();
        const deadline = new Date(task.deadline).getTime();
        const diffInHours = (deadline - now) / 3600000;
        return weight + Math.max(0, Math.min(diffInHours, 19));
    };

    // Clear Layout Handler
    const onClear = useCallback(() => {
        if (window.confirm('Are you sure you want to clear the entire layout?')) {
            setNodes([]);
            setEdges([]);
            localStorage.removeItem(flowKey);
        }
    }, [setNodes, setEdges]);

    // Node Drag Stop Handler (for deletion)
    const onNodeDragStop = useCallback((event, node) => {
        setIsDraggingNode(false);

        // Simple bounding box check for the trash zone
        const trashZone = trashZoneRef.current;
        if (trashZone) {
            const trashRect = trashZone.getBoundingClientRect();
            const { clientX, clientY } = event;

            if (
                clientX >= trashRect.left &&
                clientX <= trashRect.right &&
                clientY >= trashRect.top &&
                clientY <= trashRect.bottom
            ) {
                // Delete node
                setNodes((nds) => nds.filter((n) => n.id !== node.id));
                setEdges((eds) => eds.filter((e) => e.source !== node.id && e.target !== node.id));
            }
        }
    }, [setNodes, setEdges]);

    // Node Drag Start Handler (to highlight trash zone)
    // Note: ReactFlow doesn't prompt onNodeDragStart by default in controls, need to add if strictly required visual feedback
    // but we can use onNodeDrag as well if needed. For now simplest is css hover on zone, but we can toggle global drag state
    // if we hook into onNodeDragStart property of ReactFlow comp.

    const onNodeDragStart = useCallback(() => {
        setIsDraggingNode(true);
    }, []);

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

        const intervalId = setInterval(() => {
            setTasks((prevTasks) => {
                const sorted = [...prevTasks].sort((a, b) => {
                    const scoreA = calculateDynamicScore(a);
                    const scoreB = calculateDynamicScore(b);
                    return scoreA - scoreB;
                });
                return sorted;
            });
        }, 60000); // 60 seconds

        return () => clearInterval(intervalId);
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

    // Fullscreen Toggle Handler
    const toggleFullScreen = () => {
        if (!document.fullscreenElement) {
            reactFlowWrapper.current.requestFullscreen().catch(err => {
                console.error(`Error attempting to enable full-screen mode: ${err.message} (${err.name})`);
            });
        } else {
            document.exitFullscreen();
        }
    };

    const [selectedDate, setSelectedDate] = useState(new Date());

    // Normalize date helper
    const normalizeDateString = (date) => {
        if (!date) return '';
        const d = new Date(date);
        const year = d.getFullYear();
        const month = String(d.getMonth() + 1).padStart(2, '0');
        const day = String(d.getDate()).padStart(2, '0');
        return `${year}-${month}-${day}`;
    };

    const handlePrevDay = () => {
        const newDate = new Date(selectedDate);
        newDate.setDate(selectedDate.getDate() - 1);
        setSelectedDate(newDate);
    };

    const handleNextDay = () => {
        const newDate = new Date(selectedDate);
        newDate.setDate(selectedDate.getDate() + 1);
        setSelectedDate(newDate);
    };

    const handleToday = () => {
        setSelectedDate(new Date());
    };

    // Filter tasks for selected date
    const getDailyTasks = () => {
        const dateStr = normalizeDateString(selectedDate);
        const dailyTasks = tasks.filter(task => {
            if (!task.deadline) return false;
            return normalizeDateString(task.deadline) === dateStr;
        });

        // Sort: Active first (by priority), then Completed
        return dailyTasks.sort((a, b) => {
            if (a.status === 'completed' && b.status !== 'completed') return 1;
            if (a.status !== 'completed' && b.status === 'completed') return -1;
            // Then by priority score if needed, or keeping original sort
            const scoreA = calculateDynamicScore(a);
            const scoreB = calculateDynamicScore(b);
            return scoreA - scoreB;
        });
    };

    const filteredTasks = getDailyTasks();

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
                        onNodeDragStop={onNodeDragStop}
                        onNodeDragStart={onNodeDragStart}
                        fitView
                    >
                        <Controls>
                            <ControlButton onClick={toggleFullScreen} title="Toggle Fullscreen">
                                <Maximize size={12} />
                            </ControlButton>
                        </Controls>
                        <Background color="#aaa" gap={16} />
                        <MiniMap style={{ background: 'rgba(15, 23, 42, 0.8)' }} nodeColor="#38bdf8" />
                        <Panel position="top-right">
                            <div className="panel-controls" style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
                                <button className="clear-btn" onClick={onClear} style={{
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: '5px',
                                    background: 'rgba(239, 68, 68, 0.2)',
                                    border: '1px solid rgba(239, 68, 68, 0.5)',
                                    color: '#fca5a5',
                                    padding: '8px 12px',
                                    borderRadius: '8px',
                                    cursor: 'pointer',
                                    fontWeight: '600',
                                    backdropFilter: 'blur(10px)'
                                }}>
                                    <Trash2 size={16} /> Clear Layout
                                </button>
                                <button className="save-btn" onClick={onSave} style={{
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: '5px',
                                    background: 'linear-gradient(135deg, #0369a1 0%, #0ea5e9 100%)',
                                    border: 'none',
                                    color: 'white',
                                    padding: '8px 12px',
                                    borderRadius: '8px',
                                    cursor: 'pointer',
                                    fontWeight: '600',
                                    boxShadow: '0 4px 12px rgba(56, 189, 248, 0.3)'
                                }}>
                                    <Save size={16} /> Save Layout
                                </button>
                            </div>
                        </Panel>

                        {/* Trash Zone */}
                        <Panel position="bottom-center">
                            <div
                                className={`trash-zone ${isDraggingNode ? 'active' : ''}`}
                                ref={trashZoneRef}
                            >
                                <Trash2 size={24} />
                                <span>Drag here to remove</span>
                            </div>
                        </Panel>
                    </ReactFlow>
                </ReactFlowProvider>
            </div>

            {/* Sidebar with Daily Tasks (Right) */}
            <div className="planner-sidebar">
                <div className="sidebar-header">
                    <h3>
                        <Workflow size={20} />
                        Task Planner
                    </h3>

                    {/* Date Navigation */}
                    <div className="date-navigation">
                        <button onClick={handlePrevDay} className="nav-btn" title="Previous Day">
                            <ChevronLeft size={16} />
                        </button>
                        <span className="current-date" onClick={handleToday} title="Go to Today">
                            {selectedDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                        </span>
                        <button onClick={handleNextDay} className="nav-btn" title="Next Day">
                            <ChevronRight size={16} />
                        </button>
                    </div>
                </div>

                <div className="tasks-list">
                    {loading ? (
                        <p style={{ color: '#9ca3af', textAlign: 'center', marginTop: '20px' }}>Loading tasks...</p>
                    ) : filteredTasks.length === 0 ? (
                        <div className="empty-state">
                            <p>No tasks for this day.</p>
                            <span className="empty-hint">Enjoy your free time!</span>
                        </div>
                    ) : (
                        filteredTasks.map((task) => (
                            <div
                                key={task._id}
                                className={`draggable-task ${task.status === 'completed' ? 'completed' : ''}`}
                                onDragStart={(event) => onDragStart(event, task)}
                                draggable
                            >
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                                    <h4 style={task.status === 'completed' ? { textDecoration: 'line-through', opacity: 0.7 } : {}}>
                                        {task.title}
                                    </h4>
                                    {task.status === 'completed' ? (
                                        <Check size={16} color="#4ade80" />
                                    ) : (
                                        <GripVertical size={16} color="#6b7280" />
                                    )}
                                </div>
                                <p>{new Date(task.deadline).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</p>
                                <div className="task-meta">
                                    <span className={`priority-badge priority-${task.priority.toLowerCase()}`}>
                                        {task.priority}
                                    </span>
                                    {task.status === 'completed' && (
                                        <span className="status-badge completed">Done</span>
                                    )}
                                </div>
                            </div>
                        ))
                    )}
                </div>
            </div>
        </div>
    );
};

export default Planner;
