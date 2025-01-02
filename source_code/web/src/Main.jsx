import React, { useState, useEffect, useCallback } from "react";
import axios from "axios";
import Login from "./Login";
import { BrowserRouter, useLocation } from "react-router-dom";
import MyRouter from "./MyRouter.jsx";

// Modals
import AddTemplate from "./AddTemplate.jsx";
import AddTask from "./AddTask.jsx";
import AddClient from "./AddClient.jsx";

const Main = () => {
  const SERVER_URL = `http://localhost:3001`;

  document.body.style = "background: #f2f2f2";

  // Details about the user
  const [user, setUser] = useState(null);
  const [clients, setClients] = useState(null);
  const [tasks, setTasks] = useState(null);
  const [templates, setTemplates] = useState(null);


  // Loading page while we get user info
  const [loading, setLoading] = useState(true);

  // Modals
  const [showAddTask, setShowAddTask] = useState(false);
  const [showAddClient, setShowAddClient] = useState(false);
  const [showAddTemplate, setShowAddTemplate] = useState(false);


  // The current client
  const [currentClient, setCurrentClient] = useState(null);
  const [editingClient, setEditingClient] = useState(false);

  // The current task
  const [currentTask, setCurrentTask] = useState(null);
  const [currentTemplate, setCurrentTemplate] = useState(null);

  // Current document to edit
  const [currentDocument, setCurrentDocument] = useState(null);




  const login = useCallback(
    (token, storeToken) => {
      if (storeToken) {
        localStorage.setItem("token", token);
      }

      axios
        .post(`${SERVER_URL}/user`, { user_id: token })
        .then((response) => {
          setUser({
            id: response.data.user._id,
            email: response.data.user.email,
            name: response.data.user.name,
            company: response.data.user.company,
          });

          setClients(response.data.user.clients);   
          setTasks(response.data.user.tasks);
          setTemplates(response.data.user.templates);

          setLoading(false);
        })
        .catch((error) => {
          console.log(error);
          setLoading(false);
        });
    },
    [SERVER_URL]
  );

  useEffect(() => {
    const token = localStorage.getItem("token");
    if (token) {
      login(token, false);
    } else {
      setLoading(false);
    }
  }, [login]);


  // Create a new document from a template
  const createDocument = (template) => {
    setCurrentDocument(template);
  }


  // Add, delete or edit the task
  const handleTask = (task, del) => {
    // The client to associate the task with
    const client = task.client ? task.client._id : "none"

    if (del) {
      axios.post(`${SERVER_URL}/delete-task`, {
        userId: user.id,
        taskId: task._id,
        taskClient: client
      })
      .then((response) => {
        setTasks((prevTasks) => {
          const updatedTasks = { ...prevTasks };
        
          // Filter tasks for the client and update or remove the client key
          const filteredTasks = (updatedTasks[client]?.filter((t) => t._id !== task._id)) ?? [];
          filteredTasks.length > 0 ? (updatedTasks[client] = filteredTasks) : delete updatedTasks[client];
        
          return updatedTasks;
        });
        
        
        setCurrentTask(null);
        // Clear the current task reference
      })
      .catch((error) => {
        console.log(error);
        alert("An error occurred. Please try again.");
      });

      return;
    }

    // Add to DB using axios
    axios.post(`${SERVER_URL}/add-task`, {
      userId: user.id,
      task: task,
      curClient: currentTask?.client ?? task.client
    })
    .then((response) => {
      

      // Success - get the new task id, if the task was added
      const id = response.data.id;

      // New task: add to the state
      if (id) {
        task._id = id;

        setTasks((prevTasks) => ({
          ...prevTasks,
          [client]: [...(prevTasks[client] ?? []), task],
        }));
        
        
      }

      // The task was edited, so update the task in the state
      else {
        setTasks((prevTasks) => {
          // Extract current and new client IDs from the task
          const oldClientId = currentTask?.client ? currentTask.client._id : "none";
          const newClientId = task.client ? task.client._id : "none";
        
          // Remove the task from the old client's tasks
          const updatedOldClientTasks = prevTasks[oldClientId]?.filter((t) => t._id !== task._id) ?? [];
        
          // Add or replace the task in the new client's tasks
          const updatedNewClientTasks = [
            ...(prevTasks[newClientId]?.filter((t) => t._id !== task._id) ?? []),
            task,
          ];
        
          return {
            ...prevTasks,
            [oldClientId]: updatedOldClientTasks,
            [newClientId]: updatedNewClientTasks,
          };
        });
        
        
        
        // setCurrentTask(task);
        // Update the current task reference 
      }

      
    })
    .catch((error) => {
      console.log(error);
      alert("An error occurred. Please try again.");
    });

  }

  // Add, delete or edit the client
  const addClient = (client, del) => {

    if (del) {
      axios.post(`${SERVER_URL}/delete-client`, {
        userId: user.id,
        clientId: client._id,
      })
      .then((response) => {
        setClients((prev) => prev.filter((c) => c._id !== client._id));
        setCurrentClient(null);
      })
      .catch((error) => {
        console.log(error);
        alert("An error occurred. Please try again.");
      });

      return;
    }

    // Add to DB using axios
    axios.post(`${SERVER_URL}/add-client`, {
      userId: user.id,
      client: client,
    })
    .then((response) => {

      // Success - get the new client id, if the client was added
      const id = response.data.id;

      // New client: add to the state
      if (id) {
        client._id = id;

        setClients((prev) => [...prev, client]);
      }

      // The client was edited, so update the client in the state
      else {
        setClients((prev) => prev.map((c) => c._id === client._id ? client : c));
        setCurrentClient(client);
      }

      
    })
    .catch((error) => {
      console.log(error);
      alert("An error occurred. Please try again.");
    });

  }


  // Add delete or edit a template
  const handleTemplate = (template, del) => {

    if (del) {
      axios.post(`${SERVER_URL}/delete-template`, {
        userId: user.id,
        templateId: template._id,
      })
      .then((response) => {
        setTemplates((prevTemplates) => {
          prevTemplates.filter((t) => t._id !== template._id)
        });
        
        
        setCurrentTemplate(null);
        // Clear the current task reference
      })
      .catch((error) => {
        console.log(error);
        alert("An error occurred. Please try again.");
      });

      return;
    }
    // Add to DB using axios
    const formData = new FormData();
    formData.append('userId', user.id);
    formData.append('template', JSON.stringify(template));
    if (template.file) {
      formData.append('file', template.file);
    }

    axios.post(`${SERVER_URL}/add-template`, formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    })
    .then((response) => {
      

      // Success - get the new template id, if the template was added
      const id = response.data.id;

      // New: add to the state
      if (id) {
        template._id = id;

        // add to the state
        setTemplates((prevTemplates) => [...prevTemplates ?? [], template]);
        
        
      }

      // The task was edited, so update the task in the state
      else {

        // Update the old state value for this template with the new one
        setTemplates((prevTemplates) => prevTemplates.map((t) => t._id === template._id ? template : t));
        
        // setCurrentTemplate(template);
        // Update the current template reference
      }

      
    })
    .catch((error) => {
      console.log(error);
      alert("An error occurred. Please try again.");
    });

  }


  const ScrollToTopOnRouteChange = () => {
    const { pathname } = useLocation();

    useEffect(() => {
      window.scrollTo(0, 0);
    }, [pathname]);

    return null;
  };

  if (loading) {
    return <p>Loading...</p>;
  }

  if (!user) {
    return <Login login={login} api={SERVER_URL} />;
  }

  return (
    <BrowserRouter>
      <ScrollToTopOnRouteChange />
      <MyRouter

        // API URL
        host={SERVER_URL}

        // Modals
        setShowAddTask={setShowAddTask}
        setShowAddClient={setShowAddClient}
        setShowAddTemplate={setShowAddTemplate}

        // User's clients and tasks
        clients={clients}
        tasks={tasks}
        templates ={templates}

        // Which client we are viewing
        currentClient={currentClient}
        setCurrentClient={setCurrentClient}

        // Are we editing the current client, or adding a new one?
        editingClient={editingClient}
        setEditingClient={setEditingClient}

        // Remove a task
        removeTask={(task) => handleTask(task, true)}
        setCurrentTask={setCurrentTask}

        // Templates
        currentTemplate = {currentTemplate}
        setCurrentTemplate = {setCurrentTemplate}
        removeTemplate={(template) => handleTemplate(template, true)}

        // Current document - if we are editing, this is the document to show
        currentDocument = {currentDocument}
        createDocument = {createDocument}
        setCurrentDocument = {setCurrentDocument}



      />

      {showAddTask && (
        <AddTask

          clients={clients}
          close={() => {
            setShowAddTask(false)
            setEditingClient(false)
          }}
          handle={(task, del) => {
            handleTask(task, del);
            setShowAddTask(false);
            setCurrentTask(null);

          }}
          task = {editingClient ? currentTask : null}
          currentClient = {currentClient}
        />
      )}

      {showAddClient && (
        <AddClient
          close={() => {
            setShowAddClient(false);
            setEditingClient(false)
          }}
          add={(client, del) => {
            addClient(client, del);
            setShowAddClient(false);
          }}
          client = {editingClient ? currentClient : null}
        />
      )}

      {showAddTemplate && (
        <AddTemplate

          close={() => {
            setShowAddTemplate(false)
            setEditingClient(false)
          }}
          handle={(template, del) => {
            handleTemplate(template, del);
            setShowAddTemplate(false);
            setCurrentTemplate(null);
          }}
          // If editing, provide the current values
          template = {editingClient ? currentTemplate : null}
        />
      )}


    </BrowserRouter>
  );
};

export default Main;
