
import React from 'react';
import { Routes, Route, useNavigate } from "react-router-dom";

import Nav from './Nav';
import Account from './Account';
import ContactForm from './ContactForm';
import Dashboard from './Dashboard';
import DocumentBrowser from './DocumentBrowser';

const MyRouter = (props) => {
  const navigate = useNavigate();
   
    return (
      <div style = {{display: "flex", flexDirection: "column", width: "100vw", height: "100vh"}}>
    {/* Navbar section */}
    
    <Nav></Nav>
      <Routes>
          <Route index element={
            <Dashboard 
              user = {props.user}
              isMobile = {props.isMobile}
              mobileMenuOpen = {props.mobileMenuOpen}
              setMobileMenuOpen = {props.setMobileMenuOpen}
              clients = {props.clients}
              tasks = {props.tasks}
              templates = {props.templates}
              settings = {props.settings}

              setShowAddTask = {props.setShowAddTask}
              setShowAddClient = {props.setShowAddClient}

              currentClient = {props.currentClient}
              setCurrentClient = {props.setCurrentClient}

              editingClient = {props.editingClient}
              setEditingClient = {props.setEditingClient}

              removeTask = {props.removeTask}
              setCurrentTask = {props.setCurrentTask}

              setShowAddTemplate = {props.setShowAddTemplate}
              removeTemplate = {props.removeTemplate}
              setCurrentTemplate = {props.setCurrentTemplate}
              currentTemplate = {props.currentTemplate}

              // Document editor
              createDocument = {props.createDocument}
              currentDocument = {props.currentDocument}
              setCurrentDocument = {props.setCurrentDocument}

              saveDoc = {props.saveDoc}
              showSend = {props.showSend}

              // Browse documents of a template
              documents = {props.documents}

              // Search term for client / template search
              search = {props.search}
              setSearch = {props.setSearch}

              // Document sending
              sendDoc={(doc, msg) => {
                  props.sendDoc(doc, msg)
                  navigate("/documents")
                }}

              // Doclink
              onDoclink = {(task) => {
                props.onDoclink(task);

                if (task.doclink)
                navigate("/documents");
              }}

              // Notes
              addNote = {props.addNote}
              deleteNote = {props.deleteNote}
              notes = {props.notes}




            />} />
            <Route path="documents" element={
              <DocumentBrowser
                settings = {props.settings}
                documents = {props.documents}
                templates = {props.templates}
                isMobile = {props.isMobile}

                clients = {props.clients}
                user = {props.user}

                onBack={() => {
                  // Navigate back to the dashboard
                  navigate("/");

                  
                  // props.setBrowsing(false);
                  // props.setCurrentTemplate(null);
                }}
                currentDocument = {props.currentDocument}
                setCurrentDocument = {props.setCurrentDocument}

                onClick={(doc) => {
                  props.setCurrentDocument(doc);
                  navigate("/documents");}
                }
                type = {props.currentTemplate?.name}
                newDoc={() => {
                  props.createDocument(props.currentTemplate);
                  navigate("/documents");

                }}

                onComplete = {(doc) => {
                  doc.completed = !doc.completed;
                  props.saveDoc(doc);
                  console.log("ballsack!")
                }}

                onEdit={() => {
                  props.setEditingClient(true); // Enable editing mode
                  props.setCurrentTemplate(props.currentTemplate);
                  props.setShowAddTemplate(true); // Open the modal
                }}

                onSend={(doc, msg) => {
                  props.sendDoc(doc, msg)
                  navigate("/documents")
                }}
                saveDoc = {props.saveDoc}

                search = {props.search}
                setSearch = {props.setSearch}

                setCurrentClient = {props.setCurrentClient}
                setShowAddClient = {props.setShowAddClient}

                currentTemplate = {props.currentTemplate}
                setCurrentTemplate = {props.setCurrentTemplate}
              
              />} />
          <Route path="account" element={<Account host = {props.host} user = {props.user} settings = {props.settings} saveSettings = {props.saveSettings} updateSetting = {props.updateSetting} />} />
          <Route path="contact" element={<ContactForm host = {props.host}/>} />
      </Routes>
    
      
    
    </div>
  

    )

}

export default MyRouter;