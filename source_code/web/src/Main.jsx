import React, { useState, useEffect, useCallback, useMemo } from "react";
import axios from "axios";
import Login from "./Login";
import { BrowserRouter,  useLocation} from "react-router-dom";
import MyRouter from "./MyRouter.jsx";

// Modals
import AddTemplate from "./AddTemplate.jsx";
import AddTask from "./AddTask.jsx";
import AddClient from "./AddClient.jsx";
import SendDocument from "./SendDocument.jsx";

const Main = () => {
  const SERVER_URL = `http://localhost:3001`;
  

  document.body.style = "background: #f2f2f2";

  // Details about the user
  const [user, setUser] = useState(null);
  const [clients, setClients] = useState(null);
  const [tasks, setTasks] = useState(null);
  const [templates, setTemplates] = useState(null);
  const [documents, setDocuments] = useState(null);


  // Loading page while we get user info
  const [loading, setLoading] = useState(true);

  // Modals
  const [showAddTask, setShowAddTask] = useState(false);
  const [showAddClient, setShowAddClient] = useState(false);
  const [showAddTemplate, setShowAddTemplate] = useState(false);
  const [showSend, setShowSend] = useState(false);


  // The current client
  const [currentClient, setCurrentClient] = useState(null);
  const [editingClient, setEditingClient] = useState(false);

  // The current task
  const [currentTask, setCurrentTask] = useState(null);
  const [currentTemplate, setCurrentTemplate] = useState(null);

  // Current document to edit
  const [currentDocument, setCurrentDocument] = useState(null);

  // Search term for documents and clients
  const [search, setSearch] = useState("");

  // Filter documents by search and current template
  const filteredDocuments = useMemo(() => {
    if (!documents) return []
    if (!currentTemplate) return documents.filter((doc) => doc.client?.name ? doc.client.name.toLowerCase().includes(search.toLowerCase()) : true);
    return documents.filter((doc) =>
      (doc.templateId === currentTemplate?._id && (doc.client?.name ? doc.client.name.toLowerCase().includes(search.toLowerCase()) : true))
    );
  }, [documents, search, currentTemplate]);



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
          setDocuments(response.data.user.documents);

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

  // Save document to server
  const saveDoc = async (doc, del, complete) => {
    doc.completed = complete;

    if (complete)
    {
      // We just completed the document.
      // Show some magic on the frontend. Task gets created after backend response of save-doc (so we have the id )
      
    }

    


    const formData = {
      userId: user.id,
      document: doc
    }

    setCurrentDocument(null);


    if (del) {
      setDocuments((prev) => prev.filter((d) => d._id !== doc._id));
      axios.post(`${SERVER_URL}/delete-document`, formData)
      .then((response) => {

        // we need to delete the task for this document, if there is a task
        const task = tasks[doc.client ? doc.client._id : "none"].find((t) => t._id === doc._id);
        if (task) handleTask(task, true);
        
        // we no longer wait for the response
        // setCurrentDocument(null);
      })
      .catch((error) => {
        // Put it back in state
        setDocuments((prev) => [...prev, doc]);
        console.log(error);
        alert("An error occurred. Please try again.");
      });

      return;
    }
    // If the document is being edited update the state immediately for UI responsiveness
    if (doc._id) {
      setDocuments((prev) => prev.map((d) => d._id === doc._id ? doc : d));
    }

    axios.post(`${SERVER_URL}/save-document`, formData)
    .then((response) => {

      // Get the updated document: the server may have added an ID, completed status, etc.
      doc = response.data.doc;



      // Success
      // Update the document in state variable, or add to state if it didnt exist
      if (response.status === 201) {
        // The document is new, so add it to the state
        setDocuments((prev) => [...prev, doc]);

      }

      // The document was edited, so update the document in the state again in case the server changed it
      else setDocuments((prev) => prev.map((d) => d._id === doc._id ? doc : d));

      // Handle task creation for the form
      // Check the deadline. If it is null, try to delete task with id of formId
      // if there is a deadline, we need to create or update the deadline with the formId to the deadline
      
      // if complete, we need to delete the task

      // If the document is complete, we need to create a task to send the document

      // add && doc.client if we only want to send tasks for clients
      if (complete) {
        handleTask({
          name: `Send ${doc.name}`,
          description: `Send out the ${doc.type}`,
          due: new Date(),
          client: doc.client,
          type: "send",
          doclink: doc._id
        }, false);
      }


        // Find the task to modify (the complete task)
        const task = tasks[doc.client ? doc.client._id : "none"]?.find((t) => t.doclink === doc._id && t.type === "complete");


        // If it doesn't exist, create a new task, if we saved a draft
        
        if (!task && !complete)
        {
          handleTask({
            doclink: doc._id,
            name: `Finish ${doc.name}`,
            description: "",
            due: doc.deadline,
            client: doc.client,
            type: "complete"
          }, false);
        }
        

        // Task existed, and we finished the document, so delete the task
        else if (complete) handleTask(task, true);

        // Task existed, and we didn't finish the document, so update the task with the new deadline
        else if (doc.deadline) handleTask(task, false);

      // Change to a toast notification
      // alert(response.data.message);
    })
    .catch((error) => {
      // Remove from state if it failed
      console.log(error);
    });

  }


  // Create a new document from a template
  const createDocument = async(template) => {
    if (!template) {
      setShowAddTemplate(true);
      return;
    }
    setCurrentTemplate(template)

    setCurrentDocument({completed: false, templateId: template._id, fields: template.fields, type: template.name, name: `New ${template.name} Document`});


     axios.get(`${SERVER_URL}/download-file`, {
      params: {
        path: `${user.id}/templates`, // Assuming document contains userId
        fileId: template._id,
      },
      responseType: "arraybuffer", // Necessary to handle binary data
    })

    // Add the file once it is downloaded
    .then((response) => {
      setCurrentDocument((prev) => ({ ...prev, data: response.data }));
    }
    )

  }

  // Download the document when setting the current document
  useEffect(() => {
    if (currentDocument && !currentDocument.data) {
      axios.get(`${SERVER_URL}/download-file`, {
        params: {
          path: `${user.id}/documents`, 
          fileId: currentDocument._id,
        },
        responseType: "arraybuffer",
      })
      .then((response) => {
        setCurrentDocument((prev) => ({ ...prev, data: response.data }));
      })
      .catch((error) => {
        console.log(error);
        alert("An error occurred. Please try again.");
      });
    }
  }, [currentDocument, user?.id, SERVER_URL]);


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
      curClient: currentTask?.client ?? task.client,
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

  // Doclink: Clicked on a link from a task to open a document
  const docLink = (task) => {

    // Links to a document
    if (task.doclink)
    {
      setCurrentDocument(documents.find((d) => d._id === task.doclink));
      
    }
    else
    {
      // Otherwise, link to a client
      setCurrentClient(task.client);
    }
    
  }



  // Add delete or edit a template
  const handleTemplate = (template, del) => {

    if (del) {
      axios.post(`${SERVER_URL}/delete-template`, {
        userId: user.id,
        templateId: template._id,
      })
      .then((response) => {
        setTemplates((prevTemplates) => 
          prevTemplates.filter((t) => t._id !== template._id)
        );
        
        
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

      // Whether the template is new or not, set the current template
      setCurrentTemplate(template);

      
    })
    .catch((error) => {
      console.log(error);
      alert("An error occurred. Please try again.");
    });

  }

  // Send a document to the client
  // (TODO)
  const prepSendDoc = async (doc, isTask) => {

    // Pressed send through the task
    // Need to present the send modal
    if (isTask) {
      // Make a deep copy of doc using spread operator
      // Reference the task, so we know to satisfy it when sending the message
      setCurrentTask({ ...doc });

      doc = documents.find((d) => d._id === doc.doclink);
    }
    setCurrentDocument(doc);
    setShowSend(true);
  }

  // Actually send the document
  // Called from the SendDocument modal
  const sendDocument = async (doc, msg) => {
    

    const formData = {
      userId: user.id,
      document: doc,
      message: msg,
      allClients: !msg.client ? clients : null,
    }

    // We can close the modal
    setShowSend(false);
    setCurrentDocument(null);

    // Text message to send (Text or Both)
    if (msg.method !== "Email") {

      // Google Voice API
      // Open a link in the new tab
      const newTab = window.open(`https://voice.google.com/u/1/messages?itemId=t.%2B1${msg.client?.phone}`)
      
      
      if (newTab) {
        newTab.onload = () => {
          // Select the textarea element
          const messageField = newTab.document.querySelector('textarea.cdk-textarea-autosize');
          if (messageField) {
            messageField.value = `${msg.subject}\n\n${msg.body}`;
          }
        };
      }


    }

    
    axios.post(`${SERVER_URL}/send-document`, formData)
    .then((response) => {
      // We need to update the task to be satisfied, if it exists
      if (currentTask?.doclink === currentDocument?._id) handleTask(currentTask, true);
      setCurrentTask(null);
      

      // Success
      alert(response.data.message);
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

        // User
        user={user}

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

        saveDoc = {saveDoc}
        documents = {filteredDocuments}

        // Search term
        search = {search}
        setSearch = {setSearch}

        // Document saving / sending
        sendDoc = {prepSendDoc}

        // Doclink
        onDoclink = {docLink}
        showSend = {showSend}



      />

      {/* Modals Container */}
    {/* <div
      style={{
        display: "flex",
        justifyContent: "center",
        gap: "50px",
        position: "fixed",
        top: "50%",
        left: "50%",
        transform: "translate(-50%, -50%)",
        zIndex: 1000,
      }}
    > */}
      {showSend && (
        <SendDocument
        //  Provide the current client for who to send to
          currentClient={clients.find((c) => c._id === currentDocument.client?._id)}
          setEditingClient={(edit) =>{
            setEditingClient(edit);
            setShowAddClient(edit);
          }}
          clients={clients}

          task={currentTask}
          doc={currentDocument}
          onSend={sendDocument}
          close={() => {
            setShowSend(false);
            setCurrentTask(null);
            setCurrentDocument(null);
          }}
        />
      )}

      {showAddTask && (
        <AddTask
          clients={clients}
          close={() => {
            setShowAddTask(false);
            setEditingClient(false);
          }}
          handle={(task, del) => {
            handleTask(task, del);
            setShowAddTask(false);
            setCurrentTask(null);
          }}
          task={editingClient ? currentTask : null}
          currentClient={currentClient}
        />
      )}

      {showAddClient && (
        <AddClient
          close={() => {
            setShowAddClient(false);
            setEditingClient(false);
          }}
          add={(client, del) => {
            addClient(client, del);
            setShowAddClient(false);
          }}
          client={editingClient ? currentClient : null}
        />
      )}

      {showAddTemplate && (
        <AddTemplate
          close={() => {
            setShowAddTemplate(false);
            setEditingClient(false);
          }}
          handle={(template, del) => {
            handleTemplate(template, del);
            setShowAddTemplate(false);
            setCurrentTemplate(null);
          }}
          template={editingClient ? currentTemplate : null}
        />
      )}
    {/* </div> */}


    </BrowserRouter>
  );
};

export default Main;
