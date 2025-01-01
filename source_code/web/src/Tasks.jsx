import React from "react";
import Task from "./Task"; // Assuming Task component exists

const Tasks = (props) => {
    

    // const handleAddTask = () => {
    //     setTasks([...tasks, newTask]);
    //     setModalOpen(false);
    // };

    return (
        <div>
            <div style = {{display: "flex"}}>
                <h3>My Tasks</h3>
                <button onClick={() => props.setShowAddTask(true)}>+</button>
            </div>

            <div
                style={{
                    display: "flex",
                    overflowX: "auto",
                    scrollbarWidth: "none",
                    msOverflowStyle: "none",
                    WebkitScrollbar: "none",
                    scrollSnapType: "x mandatory",
                }}
            >
                {props.tasks.map((task, index) => (
                    <div
                        key={index}
                        style={{
                            flex: `0 0 calc(100% / ${Math.floor(
                                window.innerWidth / 400
                            )})`,
                            scrollSnapAlign: "start",
                        }}
                    >
                        <Task task={task} onDone={(task) => props.removeTask(task)} />
                    </div>
                ))}
            </div>
        </div>

    );
};

export default Tasks;
