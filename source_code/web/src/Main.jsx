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
import { ToastContainer, toast } from 'react-toastify';
import Confetti from 'react-confetti';

const Main = () => {
  const SERVER_URL = `http://localhost:3001`;
  

  document.body.style = "background: #f2f2f2";

  // Details about the user
  const [user, setUser] = useState(null);
  const [settings, setSettings] = useState(null);
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
  const [notes, setNotes] = useState("");


  // The current task
  const [currentTask, setCurrentTask] = useState(null);
  const [currentTemplate, setCurrentTemplate] = useState(null);

  // Current document to edit
  const [currentDocument, setCurrentDocument] = useState(null);

  // Search term for documents and clients
  const [search, setSearch] = useState("");

  // Confetti

  const [showConfetti, setShowConfetti] = useState(false);

  const [isMobile, setIsMobile] = useState(false);
  const [ mobileMenuOpen, setMobileMenuOpen] = useState(false)

  useEffect(() => {
    // Function to check if the site is opened on a mobile device
    const checkMobile = () => {
      // Option 1: Check screen width
      const isMobileDevice = window.innerWidth <= 768;

      // Option 2: Use navigator.userAgent (less preferred)
      const userAgent = navigator.userAgent.toLowerCase();
      const isMobileAgent =
        /iphone|ipod|android|blackberry|opera mini|iemobile|wpdesktop/.test(userAgent);

      setIsMobile(isMobileDevice || isMobileAgent);
      if (mobileMenuOpen)
      setMobileMenuOpen(isMobileDevice || isMobileAgent)
    };

    // Call checkMobile on component mount
    checkMobile();

    // Update on window resize
    window.addEventListener("resize", checkMobile);

    // Cleanup event listener
    return () => {
      window.removeEventListener("resize", checkMobile);
    };
  }, [mobileMenuOpen]);

  const triggerConfetti = () => {
    if (!showConfetti)
    {
      setShowConfetti(true);
      setTimeout(() => setShowConfetti(false), 4000);
    }
    
  };

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
          setSettings(response.data.user.settings);

          setNotes(response.data.user.notes); // For performance, we can get notes for a client when we click on the client

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


  // Delete a note
const deleteNote = (id) => {
  axios
    .post(`${SERVER_URL}/delete-note`, {
      userId: user.id,
      clientId: currentClient._id,
      noteId: id,
    })
    .then((response) => {
      setNotes((prev) => ({
        ...prev,
        [currentClient._id]: prev[currentClient._id].filter(
          (n) => n._id !== id
        ),
      }));
    })
    .catch((error) => {
      console.error(error);
      toast.error("An error occurred. Please try again.");

    });
};

// Add or update a note
const addNote = (note) => {
  // Add the note to state immediately if it's a new note (no _id)
  if (!note._id) {
    setNotes((prev) => ({
      ...prev,
      [currentClient._id]: [...(prev[currentClient._id] || []), note],
    }));
  } else {
    // Update the note in state
    setNotes((prev) => ({
      ...prev,
      [currentClient._id]: prev[currentClient._id].map((n) =>
        n._id === note._id ? note : n
      ),
    }));
  }

  axios
    .post(`${SERVER_URL}/add-note`, {
      userId: user.id,
      clientId: currentClient._id,
      note: note,
    })
    .then((response) => {
      // If it was a new note, update the state with the new note _id from the server
      if (!note._id) {
        const newNote = { ...note, _id: response.data.id };
        setNotes((prev) => ({
          ...prev,
          [currentClient._id]: prev[currentClient._id].map((n) =>
            n.timestamp === note.timestamp ? newNote : n
          ),
        }));
      }
    })
    .catch((error) => {
      console.error(error);
      toast.error("An error occurred. Please try again.");

    });
};


  // Save document to server
  const saveDoc = async (doc, del, complete) => {
    doc.completed = complete;
    let id

    // Task associated with this document
    const task = structuredClone(
      tasks[doc.client ? doc.client._id : "none"]?.find((t) => t.doclink && t.doclink === doc._id)
    );

    // Delete the existing task (harshly = without confetti). We make a new one
    if (task) handleTask(task, true, !complete);


    if (complete && !del)
    {
      // We just completed the document.
      // Show some magic on the frontend. Task gets created after backend response of save-doc (so we have the id )
      id = toast.success("Document completing...", {autoClose: false});
      
      
    }
    else if (!del)
    {
      id = toast.loading("Saving document...", {autoClose: false});

    }
    if (!doc._id && complete)
    {
      // We created and completed this document in one go. Show confetti, because there was no task
      triggerConfetti();
    }

    


    const formData = {
      userId: user.id,
      document: doc
    }

    setCurrentDocument(null);


    if (del) {
      id = toast.loading("Deleting document...")
      setDocuments((prev) => prev.filter((d) => d._id !== doc._id));
      
      ;

      
      axios.post(`${SERVER_URL}/delete-document`, formData)
      .then((response) => {
        toast.update(id, {render: "Document deleted!", type: "success", isLoading: false});
      setTimeout(() => {
        toast.dismiss(id); // Dismiss the toast after 2 seconds
      }, 2000); // 2000 ms (2 seconds)

        
        
        // we no longer wait for the response
        // setCurrentDocument(null);
      })
      .catch((error) => {
        // Put it back in state

        // we need to UNdelete the task for this document, if there was a task
        if (task) handleTask(task, false);
        
        setDocuments((prev) => [...prev, doc]);
        console.log(error);
        toast.update(id, {render: "Error deleting document", type: "error", isLoading: false});
      setTimeout(() => {
        toast.dismiss(id); // Dismiss the toast after 2 seconds
      }, 2000); // 2000 ms (2 seconds)
      });

      return;
    }
    // find the completion task, and mark as complete if we just completed
    // Find the task to modify (the complete task)
    // const task = structuredClone(
    //   tasks[doc.client ? doc.client._id : "none"]?.find((t) => t.doclink === doc._id && t.type === "complete")
    // )
    // Task existed, and we finished the document, so delete the task
    // if (task && complete) handleTask(task, true);

    



    // If the document is being edited update the state immediately for UI responsiveness
    if (doc._id) {
      setDocuments((prev) => prev.map((d) => d._id === doc._id ? doc : d));
    }
    

    axios.post(`${SERVER_URL}/save-document`, formData)
    .then((response) => {

      toast.update(id, {render: complete ? "Document completed!" : "Document saved!", type: "success", isLoading: false});
      setTimeout(() => {
        toast.dismiss(id); // Dismiss the toast after 2 seconds
      }, 2000); // 2000 ms (2 seconds)

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
      if ((doc.client ? settings.autoTaskGeneration.sendClientDocuments : settings.autoTaskGeneration.sendGeneralDocuments) && complete) {
        handleTask({
          name: `Send ${doc.name}`,
          description: `Send out the ${doc.type}`,
          due: new Date(),
          client: doc.client,
          type: "send",
          doclink: doc._id
        }, false);
      }


        


        // create a new task, if we saved a draft
        
        if (!complete && (doc.client ? settings.autoTaskGeneration.finishClientDocuments : settings.autoTaskGeneration.finishGeneralDocuments))
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
        
        // Task existed, and we didn't finish the document, so update the task with the new deadline
        else if (task && !complete && doc.deadline) handleTask(task, false);

      })
    .catch((error) => {
      // Remove from state if it failed
      console.log(error);

      // add the task back
      if (complete) handleTask(task, false);

      toast.update(id, {render: "Error saving document", type: "error", isLoading: false});
      setTimeout(() => {
        toast.dismiss(id); // Dismiss the toast after 2 seconds
      }, 2000); // 2000 ms (2 seconds)
    });

  }


  // Create a new document from a template
  const createDocument = async(template) => {
    if (!template) {
      setShowAddTemplate(true);
      return;
    }
    setCurrentTemplate(template)

    setCurrentDocument({completed: false, templateId: template._id, fields: template.fields, type: template.name, name: `New ${template.name} Document`, client: currentClient});


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
        toast.error("An error occurred. Please try again.");

      });
    }
  }, [currentDocument, user?.id, SERVER_URL]);


  // Add, delete or edit the task
  const handleTask = (task, del, harsh) => {
    // The client to associate the task with
    const client = task.client ? task.client._id : "none"

    if (del && !harsh)
    {
      triggerConfetti();
    }

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
        toast.error("An error occurred. Please try again.");

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
        toast.error("An error occurred. Please try again.");

      
      
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
        toast.error("An error occurred. Please try again.");

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
      toast.error("An error occurred. Please try again.");

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
        toast.error("An error occurred. Please try again.");

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
      toast.error("An error occurred. Please try again.");

    });

  }

  // Send a document to the client
  const prepSendDoc = async (doc) => {
    setCurrentDocument(doc);
    setShowSend(true);
  }

  // Actually send the document
  // Called from the SendDocument modal
  const sendDocument = async (doc, msg) => {

    // Is there a task associated with sending this document?
    
    const task = structuredClone(
      tasks[doc.client?._id || "none"].find((t) => t.doclink === doc._id )
    );

    const formData = {
      userId: user.id,
      document: doc,
      message: msg,
      allClients: !msg.client ? clients : null,
      email: user.email,
      company: user.company,
    }

    // We can close the modal
    setShowSend(false);

    // Text message to send (Text or Both)
    if (msg.method !== "Email") {

      if (settings.useGoogleVoice)
      {
        // Google Voice API
        // Open a link in the new tab
        const newTab = window.open(`https://voice.google.com/u/${settings.googleVoiceAccountIndex}/messages?itemId=t.%2B1${msg.client?.phone}`)
      
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
    }

    const id = toast.loading("Sending your email!", {autoClose: false});
    // We need to update the task to be satisfied, if it exists
    if (task) handleTask(task, true);
    
    axios.post(`${SERVER_URL}/send-document`, formData)
    .then((response) => {
      

      setCurrentTask(null);
      toast.update(id, {render: response.data.message, type: "success", isLoading: false});
      setTimeout(() => {
        toast.dismiss(id); // Dismiss the toast after 2 seconds
      }, 2000); // 2000 ms (2 seconds)
      
      setCurrentDocument(null);

      // Success
    })
    .catch((error) => {
      console.log(error);
      toast.update(id, {render: "Something went wrong, please try again", type: "error", isLoading: false});
      setTimeout(() => {
        toast.dismiss(id); // Dismiss the toast after 2 seconds
      }, 2000); // 2000 ms (2 seconds)
      setCurrentDocument(null);

      // We need to update the task to be satisfied, if it exists
      if (task) handleTask(task, false);
    });
  }

  const ScrollToTopOnRouteChange = () => {
    const { pathname } = useLocation();

    useEffect(() => {
      window.scrollTo(0, 0);
    }, [pathname]);

    return null;
  };

  



// Update a setting
const updateSetting = (setting, value) => {
  const keys = setting.split('.');
  let updatedSettings = { ...settings };

  keys.reduce((acc, currentKey, index) => {
    if (index === keys.length - 1) {
      acc[currentKey] = value;
    } else {
      acc[currentKey] = acc[currentKey] || {};
    }
    return acc[currentKey];
  }, updatedSettings);

  setSettings(updatedSettings);
};


  // Set the settings object for the user in the db
  const saveSettings = () => {
    axios.post(`${SERVER_URL}/save-settings`, {
      userId: user.id,
      settings: settings,
    })
    .then((response) => {
      // Success
      toast.info("Settings saved!");
    })
    .catch((error) => {
      console.log(error);
      toast.error("An error occurred. Please try again.");

    });
  }


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
        isMobile={isMobile}
        mobileMenuOpen = {mobileMenuOpen}
        setMobileMenuOpen = {setMobileMenuOpen}

        // User
        user={user}
        settings={settings}
        updateSetting={updateSetting}
        saveSettings={saveSettings}

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
        removeTask={(task, dismiss) => handleTask(task, true, dismiss)}
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

        // Notes
        notes = {notes}
        addNote = {addNote}
        deleteNote = {deleteNote}



      />

      <ToastContainer />
      {showConfetti && 
      <Confetti
      gravity={0.2}
      style={{
        animation: 'fadeOut 5s ease-in-out',
      }} />}

      {showSend && (
        <SendDocument
        //  Provide the current client for who to send to
          currentClient={clients.find((c) => c._id === currentDocument?.client?._id)}
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
            // Leave the document open incase of making changes
            //setCurrentDocument(null);
          }}
          settings = {settings}
          user = {user}
        />
      )}

      {showAddTask && (
        <AddTask
          clients={clients}
          close={() => {
            setShowAddTask(false);
            setEditingClient(false);
          }}
          handle={(task, del, harsh) => {
            handleTask(task, del, harsh);
            setShowAddTask(false);
            setCurrentTask(null);
          }}
          task={editingClient ? currentTask : null}
          currentClient={currentClient}
          due={settings.defaultTaskDeadline ?? 3}
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
