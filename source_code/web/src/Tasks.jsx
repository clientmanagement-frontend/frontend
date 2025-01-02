import React from "react";
import Task from "./Task"; 

const Tasks = (props) => {

    let tasks = Object.values(props.tasks).flat()
    
    return (
        <div>
            <div style = {{display: "flex", alignItems: "center", gap: 10}}>
                <h3 style = {{margin: 0}}>My Tasks</h3>
                <img
                    src={`add-button.png`}
                    alt="New Task"
                    style = {{cursor: "pointer", width: "25px", height: "25px"}}
                    onClick={() => {
                        props.setShowAddTask(true)
                    }}
                    />
            </div>
            {tasks.length >= 0    && (
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
                {tasks.map((task, index) => (
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
            )}
        </div>

    );
};

export default Tasks;
