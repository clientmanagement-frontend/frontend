import React from "react";
import ClientList from "./ClientList";
import ClientView from "./ClientView";
import ClientNotes from "./ClientNotes";
import Tasks from "./Tasks";
import Templates from "./Templates";
import { useNavigate } from "react-router-dom";
import Documents from "./Documents";

export default function Dashboard(props) {
    const navigate = useNavigate();

    return (
      <div style={{ display: "flex", height: "100vh" }}>
        
        {/* Flex shrink here */}
        {/* Left Panel - ClientList */}
        
        {props.currentClient && (
        <div>
          <ClientNotes
          />
        </div>
        )}
  
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
              title={true? "Tasks" : `${props.currentClient.name.substring(
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
              onDoclink={props.onDoclink}
            />

            <Documents
                documents={props.documents.filter(
                    (doc) => doc.client?._id === props.currentClient._id
                )}
                newDoc={() => {
                    props.createDocument(props.currentTemplate)
                }}
                onClick={(doc) => {
                    props.setCurrentDocument(doc);
                    navigate("/documents");}
                  }
                onComplete = {(doc) => {
                    doc.completed = !doc.completed;
                    props.saveDoc(doc);
                  }}
                onSend={props.sendDoc}
                onSave={props.saveDoc}
                
                currentTemplate = {props.currentTemplate}
                setCurrentTemplate = {props.setCurrentTemplate}
                templates = {props.templates}
            
            ></Documents>
          </div>
        )}

  
        {/* Main Content */}
        

        {!props.currentClient && (
            <div>
            <ClientList
              clients={props.clients}
              onClientClick={(client) =>{
                  props.setCurrentClient(client)
              }}
              addClient={() => {
                props.setShowAddClient(true);
                props.setCurrentClient(null);
              }}
              search={props.search}
              setSearch={props.setSearch}
            />
          </div>
          )}

        {!props.currentClient && (
          <div style={{ flex: 1, padding: "10px", gap: 20   , display: "flex", flexDirection: "column" , justifyContent: "space-between"}}>
            <Tasks
              title="My Tasks"
              tasks={props.tasks}
              setShowAddTask={props.setShowAddTask}
              onDone={(task) => {
                if (task.type === "send") {
                    // Send the document
                    // Send prop will handle who to send to
                    props.sendDoc(task, true);

                } 
                // Standard task: delete the task
                else props.removeTask(task)
                
              }}
              onEdit={(task) => {
                props.setEditingClient(true); // Enable editing mode
                props.setCurrentTask(task);
                props.setShowAddTask(true); // Open the modal
              }}
              onDoclink={props.onDoclink}
              isDashboard={true}

            />

            <Templates
              title="My Templates"
              templates={props.templates}
              setShowAddTemplate={props.setShowAddTemplate}
              setCurrentTemplate={props.setCurrentTemplate}
              createDocument={(template) => props.createDocument(template)}
              removeTemplate={props.removeTemplate}
              onBrowse={(template) => {
                props.setCurrentTemplate(template);
                navigate('/documents')
              }}

              
            />
          </div>
        )}
      </div>
    );
  }
  