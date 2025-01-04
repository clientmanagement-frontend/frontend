import React, { useState } from "react";

const AddTask = ({ clients, close, handle, task, currentClient }) => {
  const getDefaultDueDate = () => {
    const date = new Date();
    date.setDate(date.getDate() + 2);
    return date.toISOString().split("T")[0]; // Format as `YYYY-MM-DD` for `<input type="date">`
  };

  const [taskName, setTaskName] = useState(task ? task.name : "");
  const [description, setDescription] = useState(task ? task.description : "");
  const [dueDate, setDueDate] = useState(
    task && task.due 
      ? (typeof task.due === "string" ? task.due : task.due.toISOString().split("T")[0]) 
      : getDefaultDueDate()
  );
  
  const [selectedClient, setSelectedClient] = useState(currentClient ?? (task ? task.client : null));

  const handleDelete = () => {
    if (task) {
      if (window.confirm(`Are you sure you want to delete ${task.name}?`)) {
        handle(task, true);
      } else {
        return;
      }
    }
  };

  const handleSave = () => {
    if (!taskName || !dueDate) {
      alert("Task name and due date are required.");
      return;
    }

    const newTask = {
      _id: task ? task._id : null,
      name: taskName,
      description: description,
      due: new Date(dueDate).toISOString(),
      client: selectedClient, // Entire client object
    };

    handle(newTask);
  };

  return (
    <div
      className="modal fade show d-block"
      tabIndex="-1"
      role="dialog"
      style={{ backgroundColor: "rgba(0, 0, 0, 0.5)", zIndex: 1050 }}
    >
      <div className="modal-dialog modal-dialog-centered" role="document">
        <div className="modal-content">
          <div className="modal-header">
            <h5 className="modal-title">
              {(task?._id ? "Edit Task" : "New Task") + (currentClient ? " for " + currentClient.name : "")}
            </h5>
            <button
              type="button"
              className="btn-close"
              onClick={close}
              aria-label="Close"
            ></button>
          </div>
          <div className="modal-body">
            <form>
              <div className="mb-3">
                <label htmlFor="taskName" className="form-label">
                  Task Name
                </label>
                <input
                  type="text"
                  className="form-control"
                  id="taskName"
                  value={taskName}
                  onChange={(e) => setTaskName(e.target.value)}
                  placeholder="Enter task name"
                  required
                />
              </div>
              <div className="mb-3">
                <label htmlFor="description" className="form-label">
                  Description
                </label>
                <textarea
                  className="form-control"
                  id="description"
                  rows="3"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Enter task description (optional)"
                ></textarea>
              </div>
              <div className="mb-3">
                <label htmlFor="dueDate" className="form-label">
                  Due Date
                </label>
                <input
                  type="date"
                  className="form-control"
                  id="dueDate"
                  value={dueDate}
                  onChange={(e) => setDueDate(e.target.value)}
                  required
                />
              </div>
              <div className="mb-3" style={{display: currentClient ? "none" : "block"}}>
                <label htmlFor="client" className="form-label">
                  Associate with Client
                </label>
                <select
                  className="form-select"
                  id="client"
                  value={selectedClient ? selectedClient._id : ""}
                  onChange={(e) =>
                    setSelectedClient(
                      clients.find((client) => client._id === e.target.value)
                    )
                  }
                >
                  <option value="">No Client</option>
                  {clients.map((client) => (
                    <option key={client._id} value={client._id}>
                      {client.name}
                    </option>
                  ))}
                </select>
              </div>
            </form>
          </div>
          <div className="modal-footer">
            <div
              style={{
                display: "flex",
                justifyContent: task ? "space-between" : "right",
                flex: 1,
              }}
            >
              <button
                style={{ display: task ? "block" : "none" }}
                className="btn btn-danger"
                onClick={handleDelete}
              >
                Delete Task
              </button>

              <div style={{ display: "flex", gap: 10 }}>
                <button className="btn btn-secondary" onClick={close}>
                  Cancel
                </button>
                <button className="btn btn-primary" onClick={handleSave}>
                  Save Task
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AddTask;
