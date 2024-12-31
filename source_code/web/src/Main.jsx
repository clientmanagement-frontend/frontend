import React, { useState, useEffect, useCallback } from 'react';
import axios from 'axios'
import Login from './Login';



const Main = () => {

  const SERVER_URL = `http://localhost:3001`
  
  document.body.style = 'background: #f2f2f2';

  const [user, setUser] = useState(null);
  const [clients, setClients] = useState(null);
  const [loading, setLoading] = useState(true);
  

  

  const login = useCallback((token, storeToken, newAccount, newUser) => {
    if (storeToken) {
      localStorage.setItem('token', token);
    }
  
    axios.post(`${SERVER_URL}/user`, { user_id: token })
      .then(response => {
        setUser({
          id: response.data.user._id,
          email: response.data.user.email,
          name: response.data.user.name,
          company: response.data.user.company,
        });
  
        setClients(response.data.user.clients);
        setLoading(false);
      })
      .catch(error => {
        console.log(error);
        setLoading(false);
      });
  }, [SERVER_URL, setUser, setLoading]);
  

  useEffect(() => {
    // Check local storage for user token
    const token = localStorage.getItem('token');
    if (token) {
      login(token, false, false, null)
    }
    else {
      // Redirect to login
      setLoading(false)

    }
    
  }, [login]);

  if (loading) {
    return (
      <p>Loading...</p>
    )
  }

  if (!user) {
    return (
      <Login login = {login} api = {SERVER_URL}/>
    )
  }

  // Render the main page, user is logged in
  return (

    <p>
      Website
    </p>
  );
};


export default Main;
