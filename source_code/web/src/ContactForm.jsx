import React, { useState } from 'react';
import axios from 'axios';

const ContactForm = (props) => {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [message, setMessage] = useState('');
  const [done, setDone] = useState(false);
  const [fail, setFail] = useState(false);

  const handleSubmit = (e) => {
    e.preventDefault();
    const formData = {
      name: name,
      uid: localStorage.getItem('token'),
      email: email,
      msg: message,
    };
    axios.post(`${props.host}/contact`, formData)
      .then(function (response) {
        // Success
      })
      .catch(function (response) {
        console.log(response);
        setFail(true);
      });

    setDone(true);
  };

  if (done) {
    if (fail) {
      return (
        <div style={{
          margin: "10%",

          display: 'flex',
          alignItems: 'center',
          flexDirection: 'column',
        }}>
          <h1 style={{ color: 'rgb(92, 119, 226)' }}>Oh no!</h1>
          <p style={{ color: 'gray' }}>There was an error sending your message. Please try again later.</p>
        </div>
      );
    } else {
      // Success
      return (
        <div style={{
          margin: "10%",
          display: 'flex',
          alignItems: 'center',
          flexDirection: 'column',
        }}>
          <h1 style={{ color: 'rgb(92, 119, 226)' }}>Success!</h1>
          <p style={{ color: 'gray' }}>Your message has been sent.</p>
        </div>
      );
    }
  }

  // Message not yet sent: Show form
  return (
    <div style = {{display: "flex", flexDirection: props.isMobile ? "column" : "row", alignItems: "center", padding: 10, overflowX: "hidden"}}>
    

    {/* Help */}

    <div style={{ display: "flex", flexDirection: "column", padding: "20px", fontFamily: "'Segoe UI', Tahoma, Geneva, Verdana, sans-serif", maxWidth: "600px", margin: "0 auto" }}>
  <h2 style={{ fontSize: "24px", fontWeight: "bold", marginBottom: "20px", color: "#333" }}>Tips on making documents</h2>
  
  <ol style={{ listStyleType: "none", paddingLeft: "0" }}>
    <li style={{
      backgroundColor: "#f8f9fa", 
      borderRadius: "8px", 
      marginBottom: "12px", 
      padding: "12px", 
      fontSize: "18px", 
      lineHeight: "1.6", 
      boxShadow: "0 4px 6px rgba(0,0,0,0.1)", 
      color: "#555", 
      fontWeight: "500",
      position: "relative"
    }}>
      <span style={{
        position: "absolute", 
        top: "-12px", 
        left: "-12px", 
        backgroundColor: "#007bff", 
        color: "white", 
        fontSize: "18px", 
        fontWeight: "bold", 
        padding: "8px", 
        borderRadius: "50%", 
        width: "30px", 
        height: "30px", 
        display: "flex", 
        justifyContent: "center", 
        alignItems: "center"
      }}>1</span>
      <span>Be sure to give clear, concise names for your fields</span>
    </li>
    
    <li style={{
      backgroundColor: "#f8f9fa", 
      borderRadius: "8px", 
      marginBottom: "12px", 
      padding: "12px", 
      fontSize: "18px", 
      lineHeight: "1.6", 
      boxShadow: "0 4px 6px rgba(0,0,0,0.1)", 
      color: "#555", 
      fontWeight: "500",
      position: "relative"
    }}>
      <span style={{
        position: "absolute", 
        top: "-12px", 
        left: "-12px", 
        backgroundColor: "#007bff", 
        color: "white", 
        fontSize: "18px", 
        fontWeight: "bold", 
        padding: "8px", 
        borderRadius: "50%", 
        width: "30px", 
        height: "30px", 
        display: "flex", 
        justifyContent: "center", 
        alignItems: "center"
      }}>2</span>
      <span>{"To group fields together, name in the format Group:Field, like Gender:Male"}</span>
    </li>

    <li style={{
      backgroundColor: "#f8f9fa", 
      borderRadius: "8px", 
      marginBottom: "12px", 
      padding: "12px", 
      fontSize: "18px", 
      lineHeight: "1.6", 
      boxShadow: "0 4px 6px rgba(0,0,0,0.1)", 
      color: "#555", 
      fontWeight: "500",
      position: "relative"
    }}>
      <span style={{
        position: "absolute", 
        top: "-12px", 
        left: "-12px", 
        backgroundColor: "#007bff", 
        color: "white", 
        fontSize: "18px", 
        fontWeight: "bold", 
        padding: "8px", 
        borderRadius: "50%", 
        width: "30px", 
        height: "30px", 
        display: "flex", 
        justifyContent: "center", 
        alignItems: "center"
      }}>3</span>
      <span>{"It is recommended to use checkboxes, not radios. Start the field with '$' to only permit one choice, like $Gender:Male"}</span>
    </li>

    <li style={{
      backgroundColor: "#f8f9fa", 
      borderRadius: "8px", 
      marginBottom: "12px", 
      padding: "12px", 
      fontSize: "18px", 
      lineHeight: "1.6", 
      boxShadow: "0 4px 6px rgba(0,0,0,0.1)", 
      color: "#555", 
      fontWeight: "500",
      position: "relative"
    }}>
      <span style={{
        position: "absolute", 
        top: "-12px", 
        left: "-12px", 
        backgroundColor: "#007bff", 
        color: "white", 
        fontSize: "18px", 
        fontWeight: "bold", 
        padding: "8px", 
        borderRadius: "50%", 
        width: "30px", 
        height: "30px", 
        display: "flex", 
        justifyContent: "center", 
        alignItems: "center"
      }}>4</span>
      <span>{"Include 'Date' or 'Deadline' in your field to allow calender input. Deadlines are for the recipient to reply by."}</span>
    </li>
  </ol>
</div>


<div style={{
      margin: '20px',
      display: 'flex',
      flexDirection: 'column',
      justifyContent: 'center',
      alignItems: 'center',
    }}>
      <img src='email.png' alt="email icon" width="100px" />
      <p style={{ fontSize: '30px', fontWeight: '100' }}>NEED MORE HELP?</p>
      <form onSubmit={handleSubmit} style={{ width: '100%', maxWidth: '300px' }}>
        <input
          style={{ margin: '5px' }}
          type="text"
          className='form-control'
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Name"
          required
        />
        <input
          style={{ margin: '5px' }}
          type="email"
          className='form-control'
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="Email (optional)"
        />
        <textarea
          style={{ margin: '5px', height: '200px' }}
          className='form-control'
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          placeholder="Your message"
          required
        />
        <button type="submit" className="btn btn-light" style={{ width: '100%' }}>Send Message</button>
      </form>
    </div>

    </div>
  );
};

export default ContactForm;
