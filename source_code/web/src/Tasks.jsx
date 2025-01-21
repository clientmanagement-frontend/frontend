import React from "react";
import Task from "./Task"; 

const Tasks = (props) => {

    let tasks = Object.values(props.tasks)
  .flat()
  .sort((a, b) => {
    const dateDiff = new Date(a.due) - new Date(b.due);
  
    // If dates are equal, sort by _id lexicographically
    if (dateDiff === 0) {
      return a._id.localeCompare(b._id);
    }
  
    return dateDiff;
  });


    
    return (
        <div>
            <div style = {{display: "flex", alignItems: "center", gap: 10}}>
                <h4 style = {{margin: 0, paddingLeft: 10}}>{props.title}</h4>
                <img
                    src={`add-button.png`}
                    alt="New Task"
                    style = {{cursor: "pointer", width: "25px", height: "25px"}}
                    onClick={() => {
                        props.setShowAddTask(true)
                    }}
                    />
            </div>
            {tasks.length < 1 && (
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
                <div
                style={{
                    flex: `0 0 calc(100% / ${Math.floor(
                        window.innerWidth / 400
                    )})`,
                    scrollSnapAlign: "start",
                    maxWidth: 400
                }}
            >
                <Task task={{name: "All caught up!\t🎉", description: "\nClick to create a task.", noTasks: true}} onEdit={() => props.setShowAddTask(true)} isDashboard={props.isDashboard}/>
            </div>
            </div>
            )}
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
                            maxWidth: 400
                        }}
                    >
                        <Task task={task} onDone={props.onDone} onEdit={props.onEdit} onDoclink={props.onDoclink} isDashboard={props.isDashboard}/>
                    </div>
                ))}
            </div>
            )}
        </div>

    );
};

export default Tasks;
