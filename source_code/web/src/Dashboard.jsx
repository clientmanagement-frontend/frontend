import React from "react";
import ClientList from "./ClientList";
import ClientView from "./ClientView";
import Tasks from "./Tasks";
import Templates from "./Templates";

export default function Dashboard(props) {
    return (
      <div style={{ display: "flex", height: "100vh" }}>
        {/* Left Panel - ClientList */}
        {/* Flex shrink here */}
        <div>
          <ClientList
            clients={props.clients}
            onClientClick={(client) => props.setCurrentClient(client)}
            addClient={() => props.setShowAddClient(true)}
          />
        </div>
  
        {/* Client View */}
        {props.currentClient && (
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              justifyContent: "space-between",
              flex: 1,
            }}
          >
            <ClientView
              client={props.currentClient}
              onBack={() => props.setCurrentClient(null)}
              onEdit={() => {
                props.setEditingClient(true); // Enable editing mode
                props.setShowAddClient(true); // Open the modal
              }}
            />
            <Tasks
              title={`${props.currentClient.name.substring(
                0,
                props.currentClient.name.indexOf(" ") > 0
                  ? props.currentClient.name.indexOf(" ")
                  : props.currentClient.name.length
              )}'s Tasks`}
              tasks={props.tasks[props.currentClient._id] || []}
              setShowAddTask={props.setShowAddTask}
              removeTask={props.removeTask}
              onEdit={(task) => {
                props.setEditingClient(true); // Enable editing mode
                props.setCurrentTask(task);
                props.setShowAddTask(true); // Open the modal
              }}
            />
          </div>
        )}
  
        {/* Main Content */}
        {!props.currentClient && (
          <div style={{ flex: 1, padding: "10px", gap: 20   , display: "flex", flexDirection: "column" }}>
            <Tasks
              title="My Tasks"
              tasks={props.tasks}
              setShowAddTask={props.setShowAddTask}
              removeTask={props.removeTask}
              onEdit={(task) => {
                props.setEditingClient(true); // Enable editing mode
                props.setCurrentTask(task);
                props.setShowAddTask(true); // Open the modal
              }}
            />

            <Templates
              title="My Templates"
              templates={props.templates}
              setShowAddTemplate={props.setShowAddTemplate}
              setCurrentTemplate={props.setCurrentTemplate}
              removeTemplate={props.removeTemplate}
              onEdit={(template) => {
                props.setEditingClient(true); // Enable editing mode
                props.setCurrentTemplate(template);
                props.setShowAddTemplate(true); // Open the modal
              }}
            />
          </div>
        )}
      </div>
    );
  }
  