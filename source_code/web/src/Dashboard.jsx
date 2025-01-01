import React from "react";
import ClientList from "./ClientList";
import ClientView from "./ClientView";
import Tasks from "./Tasks";

export default function Dashboard(props) {


  return (
    <div style={{ display: "flex", height: "100vh" }}>
      {/* Left Panel */}
      <div>
        <ClientList 
            clients={props.clients} 
            onClientClick={(client) => props.setCurrentClient(client)}

            delClient={(client) => props.removeClient(client)}
            addClient={() => props.setShowAddClient(true)}

            
            />
      </div>

      {/* Client View */}
      {props.currentClient && (
        <ClientView
            client={props.currentClient}
            removeClient = {props.removeClient}
            onBack={() => props.setCurrentClient(null)}  
            onEdit={() => {
                props.setEditingClient(true) // Enable editing mode
                props.setShowAddClient(true) // Open the modal
            }}
        />
      )}


      {/* Main Content */}
        {!props.currentClient && (
            <div style={{flex:1, padding: "10px" }}>
            {/* <p>View followups, create tasks, manage documents</p> */}
                <Tasks 
                    tasks = {props.tasks} 
                    clients = {props.clients} 
                    setShowAddTask = {props.setShowAddTask}
                    removeTask = {props.removeTask}

                    
                    ></Tasks>
            </div>
        )}
    </div>
  );
}
