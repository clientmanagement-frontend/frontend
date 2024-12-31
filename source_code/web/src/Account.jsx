import React, {useState} from "react";
import axios from 'axios';
import { useNavigate } from 'react-router-dom';

const Account = (props) => 
{
    const host = props.host
    const [username, setUsername] = useState(props.token())
    const [done, setDone] = useState(false);
    const [fail, setFail] = useState(false);
    const [errmsg, setErrmsg] = useState('')

    const navigate = useNavigate();
  
    //update DB and user token on session storage
    function updateAccount()
    {
        let password = document.getElementById("passwordInput").value
        let newpass1 = document.getElementById("newpass1Input").value
        let newpass2 = document.getElementById("newpass2Input").value
        let newUsername = document.getElementById("usernameInput").value
        let oldUsername = props.token()
        
        props.setToken(newUsername, null)

        let data = {'newpass1': newpass1, 'newpass2': newpass2, 'username': newUsername, 'password': password, 'oldUsername': oldUsername, 'id': localStorage.getItem('id')}

        axios.post(`${host}/update-account`, data)
        .then((res)=> {
            // Success

        })
        .catch((res) => {
            setErrmsg(res.response.data)
            setFail(true)

        })

        setDone(true)
         
    }

    //logout of this account
    function logout()
    {
        localStorage.clear()
        navigate('/')
        window.location.reload()
    }
    
    function validateData()

    {

        let newUsername = document.getElementById("usernameInput").value
        let oldUsername = props.token()
        
        let valid = true
        // return false if no password is present
        if (! document.getElementById("passwordInput").value || ! username)
            valid = false

        // return false if new passwords to not match
        if (document.getElementById("newpass1Input").value !== document.getElementById("newpass2Input").value)
            valid = false
        if (newUsername === oldUsername)
            valid = false
        

        if (valid) // entries are syntactically good...
        {
            let data = {'username': username}
            let myname = props.token()
            // we need to check the database for this username
            axios.post(`${host}/getUser`, data)
            .then(function (response) {
                
                if ((!response.data["exists"] || username === myname) && username.length > 0) // Username available! Or, its my username!
                {
                    document.getElementById('login-btn').disabled = false;
                    document.getElementById("errorMsg").style.display = "none"
                }
                else
                {
                    document.getElementById('login-btn').disabled = true;
                    error("Username taken!")
                }

                
            })
        }
        else // Syntax is bad, user or pass is empty
        {
            document.getElementById("errorMsg").style.display = "none"
            document.getElementById('login-btn').disabled = true;
        }
        
    }
    // display this error
    function error(err)
    {
        document.getElementById("errorMsg").style.display = "flex"
        document.getElementById("errorMsg").innerHTML = err
    }

    //show password
    function mouseoverPass() {
        let obj = document.getElementById('passwordInput');
        obj.type = 'text';
      }
      function mouseoutPass() {
        let obj = document.getElementById('passwordInput');
        obj.type = 'password';
      }

    // change username
    const handleNameChange = (e) => {
        setUsername(e.target.value);
        validateData()
      };


    // Response display
    if (done)
  {
    if (fail)
    {
      return (
        <div style = {{
          display: 'flex', 
          padding: '20%', 
          alignItems: 'center',
          flexDirection: 'column',}}>
  
          <h1 style = {{color: 'rgb(92, 119, 226)'}}>Oh no!</h1>
          <p style = {{ color: 'gray'}}>{errmsg}</p>
        </div>
        )
    }
    else
    {
      // Success
      return (
      <div style = {{
        display: 'flex', 
        padding: '20%', 
        alignItems: 'center',
        flexDirection: 'column',}}>

        <h1 style = {{color: 'rgb(92, 119, 226)'}}>Success!</h1>
        <p style = {{ color: 'gray'}}>Your account details have been updated.</p>
      </div>
      )
    }
  }


    return(

        <div style = {{
            display: 'flex',
            alignItems: 'center',
            flexDirection: 'column',
            
            paddingTop: '20px'
        }}>
            <p style={{ fontSize:'30px', fontWeight:'100', color: 'rgb(92, 119, 226)'}}>MODIFY ACCOUNT</p>
                <form>
                    <div className="form-group">
                        <label style = {{marginLeft:'5px', color: 'gray'}}>Username</label>
                        <input style = {{margin:'5px'}} type="text" value ={username} className="form-control" onInput={handleNameChange} id="usernameInput"  placeholder="Enter username"></input>
                    </div>

                    <div className="form-group">
                        <label style = {{marginLeft:'5px', color: 'gray'}}>Password</label>
                        <img src="eye.png" id="eye" alt="O" width="23px" onMouseOver={mouseoverPass} onMouseOut={mouseoutPass} />
                        <input style = {{margin:'5px'}} type="password" className="form-control" onInput={validateData} id="passwordInput" placeholder="Enter password"></input>
                        
                    </div>

                    <div className="form-group">
                        <label style = {{marginLeft:'5px', color: 'gray'}}>New Password</label>
                        <img src="eye.png" id="eye" alt="O" width="23px" onMouseOver={mouseoverPass} onMouseOut={mouseoutPass} />
                        <input style = {{margin:'5px'}} type="password" className="form-control" onInput={validateData} id="newpass1Input" placeholder="Enter password"></input>
                        
                    </div>

                    <div className="form-group">
                        <label style = {{marginLeft:'5px', color: 'gray'}}>Confirm New Password</label>
                        <img src="eye.png" id="eye" alt="O" width="23px" onMouseOver={mouseoverPass} onMouseOut={mouseoutPass} />
                        <input style = {{margin:'5px'}} type="password" className="form-control" onInput={validateData} id="newpass2Input" placeholder="Enter password"></input>
                        
                    </div>

                    <p id = "errorMsg">Error msg</p>

                    <div style = {{margin:'5px', display:'flex', justifyContent:'space-between', paddingTop: '20px'}}>
                        <button type="button" className="btn btn-outline-secondary" id = "logout" onClick = {logout} disabled = {localStorage.getItem('id') == null}>Logout</button>
                        <button style = {{marginRight:'-10px'}}type="button" className="btn btn-outline-primary" id = "login-btn" onClick = {updateAccount}>Update</button>

                        
                    </div>
                </form>
        </div>
    
       
      )
}

export default Account;