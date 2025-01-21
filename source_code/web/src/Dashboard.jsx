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
  
    function getGreeting() {
        const currentHour = new Date().getHours(); // Get the current hour in 24-hour format
      
        if (currentHour >= 5 && currentHour < 12) {
          return "Good morning";
        } else if (currentHour >= 12 && currentHour < 18) {
          return "Good afternoon";
        } else {
          return "Good evening";
        }
      }

    return (
      <div
        style={{
          display: "flex",
          height: "100vh",
          overflow: "hidden",
        }}
      >
        {/* Left Panel - ClientList */}
        {!props.currentClient && (
          <div
            style={{
              display: "flex",
              minWidth: props.mobileMenuOpen
                ? "100%"
                : props.isMobile
                ? 0
                : "300px",
              flexShrink: 0,
              overflow: "hidden",
            }}
          >
            <ClientList
              clients={props.clients}
              onClientClick={(client) => props.setCurrentClient(client)}
              addClient={() => {
                props.setShowAddClient(true);
                props.setCurrentClient(null);
              }}
              search={props.search}
              setSearch={props.setSearch}
              isMobile={props.isMobile}
              mobileMenuOpen={props.mobileMenuOpen}
              setMobileMenuOpen={props.setMobileMenuOpen}
            />
          </div>
        )}
  
        {/* Main Content */}
        <div
          style={{
            flex: 1,
            display: "flex",
            flexDirection: "column",
            gap: 20,
            paddingRight: "10px",
            overflow: "hidden", // Prevent scrolling
          }}
        >
            {!props.currentClient && <h1 style = {{paddingLeft: 10, fontWeight: 100}}>{getGreeting()}{props.user.name ? ", " : ""}{props.user.name || ""}</h1>}
          {!props.currentClient && (
            <div style = {{display: "flex", flexDirection: "column", flex: 1, justifyContent: "space-around"}}>
              <Tasks
                title="My Tasks"
                tasks={props.tasks}
                setShowAddTask={props.setShowAddTask}
                onDone={(task, dismiss) => {
                  if (task.type === "send") {
                    // find the document to send
                    const doc = props.documents.find((d) => d._id === task.doclink)
                    props.sendDoc(doc);
                  } else {
                    props.removeTask(task, dismiss);
                  }
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
                  navigate("/documents");
                }}
              />
            </div>
          )}
  
          {props.currentClient && (
            <>
              <div
                style={{
                  display: "flex",
                  flex: 1,
                  overflow: "hidden", // Prevent content from spilling
                }}
              >
                <div style = {{display: "flex", minWidth: props.mobileMenuOpen? "100%" : props.isMobile ? 0 : "300px"}}>
                    <ClientNotes
                    addNote={props.addNote}
                    deleteNote={props.deleteNote}
                    notes={props.notes[props.currentClient._id] || []}
                    isMobile={props.isMobile}
                    mobileMenuOpen={props.mobileMenuOpen}
                    setMobileMenuOpen={props.setMobileMenuOpen}
                    />
                    </div>
                <div
                  style={{
                    flex: 1,
                    display: "flex",
                    flexDirection: "column",
                    overflow: "hidden",
                    justifyContent: "space-between"
                  }}
                >
                  <ClientView
                    client={props.currentClient}
                    onBack={() => props.setCurrentClient(null)}
                    onEdit={() => {
                      props.setEditingClient(true);
                      props.setShowAddClient(true);
                    }}
                    mobileMenuOpen={props.mobileMenuOpen}
                  />
                  <Tasks
                    title={
                      false
                        ? "Tasks"
                        : `${props.currentClient.name.substring(
                            0,
                            props.currentClient.name.indexOf(" ") > 0
                              ? props.currentClient.name.indexOf(" ")
                              : props.currentClient.name.length
                          )}'s Tasks`
                    }
                    tasks={props.tasks[props.currentClient._id] || []}
                    setShowAddTask={props.setShowAddTask}
                    removeTask={props.removeTask}
                    onEdit={(task) => {
                      props.setEditingClient(true);
                      props.setCurrentTask(task);
                      props.setShowAddTask(true);
                    }}
                    onDoclink={props.onDoclink}
                    onDone={(task, dismiss) => {
                      if (task.type === "send") {
                        const doc = props.documents.find((d) => d._id === task.doclink)
                        props.sendDoc(doc);
                      } else {
                        props.removeTask(task, dismiss);
                      }
                    }}
                  />
                  <Documents
                    documents={props.documents.filter(
                      (doc) => doc.client?._id === props.currentClient._id
                    )}
                    newDoc={() => {
                      props.createDocument(props.currentTemplate);
                      navigate("/documents");
                    }}
                    onClick={(doc) => {
                      props.setCurrentDocument(doc);
                      navigate("/documents");
                    }}
                    onComplete={(doc) => {
                      doc.completed = !doc.completed;
                      props.saveDoc(doc);
                    }}
                    onSend={props.sendDoc}
                    currentTemplate={props.currentTemplate}
                    setCurrentTemplate={props.setCurrentTemplate}
                    templates={props.templates}
                    
                  />
                </div>
              </div>
            </>
          )}
        </div>
      </div>
    );
  }
  