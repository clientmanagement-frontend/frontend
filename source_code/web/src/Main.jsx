import React, { useState, useEffect, useCallback } from "react";
import axios from "axios";
import Login from "./Login";
import { BrowserRouter, useLocation } from "react-router-dom";
import MyRouter from "./MyRouter.jsx";
import AddTask from "./AddTask.jsx";
import AddClient from "./AddClient.jsx";

const Main = () => {
  const SERVER_URL = `http://localhost:3001`;

  document.body.style = "background: #f2f2f2";

  // Details about the user
  const [user, setUser] = useState(null);
  const [clients, setClients] = useState(null);
  const [tasks, setTasks] = useState([
    {
      name: "Prepare Report",
      due: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000).toISOString(),
      description: "Complete the monthly financial report.",
      client: "John Doe",
    },
  ]);
  const [loading, setLoading] = useState(true);

  // Modals
  const [showAddTask, setShowAddTask] = useState(false);
  const [showAddClient, setShowAddClient] = useState(false);

  // The current client
  const [currentClient, setCurrentClient] = useState(null);
  const [editingClient, setEditingClient] = useState(false);

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

  const removeTask = (task) => {
    setTasks((prev) => prev.filter((t) => t !== task));
    // Remove from DB
  };

  const addTask = (task) => {
    setTasks((prev) => [...prev, task]);
    // Add to DB
  };

  const addClient = (client) => {
    // Are we editing the current client
    setClients((prev) => [...prev, client]);
    // Add to DB
  }

  const removeClient = (client) => {
    setClients((prev) => prev.filter((c) => c !== client));
    // Remove from DB
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

        // User's clients and tasks
        clients={clients}
        tasks={tasks}

        // Delete task and client
        removeTask={removeTask}
        removeClient={removeClient}

        // Which client we are viewing
        currentClient={currentClient}
        setCurrentClient={setCurrentClient}

        // Are we editing the current client, or adding a new one?
        editingClient={editingClient}
        setEditingClient={setEditingClient}

      />

      {showAddTask && (
        <AddTask
          clients={clients}
          close={() => setShowAddTask(false)}
          add={(task) => {
            addTask(task);
            setShowAddTask(false);
          }}
        />
      )}

      {showAddClient && (
        <AddClient
          close={() => {
            setShowAddClient(false);
            setEditingClient(false)
          }}
          add={(client) => {
            addClient(client);
            setShowAddClient(false);
          }}
          client = {editingClient ? currentClient : null}
        />
      )}
    </BrowserRouter>
  );
};

export default Main;
