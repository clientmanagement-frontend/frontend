
import React from 'react';
import { Routes, Route } from "react-router-dom";

import Nav from './Nav';
import Account from './Account';
import ContactForm from './ContactForm';
import Dashboard from './Dashboard';


const MyRouter = (props) => {
   
    return (
      <div style = {{display: "flex", flexDirection: "column", width: "100vw", height: "100vh"}}>
    {/* Navbar section */}
    
    <Nav></Nav>
      <Routes>
          <Route index element={
            <Dashboard 
              clients = {props.clients}
              tasks = {props.tasks}
              templates = {props.templates}

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




            />} />
          <Route path="account" element={<Account host = {props.host}/>} />
          <Route path="contact" element={<ContactForm host = {props.host}/>} />
      </Routes>
    
      
    
    </div>
  

    )

}

export default MyRouter;