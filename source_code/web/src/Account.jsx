import React, { useState, useEffect } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";

const Account = (props) => {
  const host = props.host;
  const settings = props.settings ?? {};
  console.log(settings)

  const [company, setCompany] = useState(props.user.company || "");
  const [password, setPassword] = useState("");
  const [newpass1, setNewpass1] = useState("");
  const [newpass2, setNewpass2] = useState("");

  const [done, setDone] = useState(false);
  const [fail, setFail] = useState(false);
  const [errmsg, setErrmsg] = useState("");



  // Default Settings
  const defaultTaskDeadline = settings.defaultTaskDeadline || 3;
  const defaultEmailBody = settings.defaultEmailBody || "Hello, I just sent you the $DOCTYPE$.";
  const defaultEmailSubject = settings.defaultEmailSubject || "Regarding $DOCNAME$";
  const defaultEmailFooter = settings.defaultEmailFooter || "Best Regards,\n$COMPANY$";

  const includeDeadlines = settings.includeDeadlines !== undefined ? settings.includeDeadlines : false;
  const autoTaskGeneration = settings.autoTaskGeneration || {
    finishClientDocuments: true,
    sendClientDocuments: true,
    finishGeneralDocuments: true,
    sendGeneralDocuments: true,
  };

  
  const taskOverviewEmails = settings.taskOverviewEmails || "Weekly";
  const upcomingTaskEmails = settings.upcomingTaskEmails || {
    oneDay: true,
    threeDays: false,
    oneWeek: false,
  };
  const useGoogleVoice = settings.useGoogleVoice || false;
  const googleVoiceAccountIndex = settings.googleVoiceAccountIndex !== undefined ? settings.googleVoiceAccountIndex : null;

  const prettyName = (ugly) => {
    return ugly.replace(/([A-Z])/g, ' $1').replace(/^./, ugly[0].toUpperCase());

  }
  

  const navigate = useNavigate();

  // Update DB and user token on session storage
  const updateAccount = (e) => {
    e.preventDefault();

    const data = {
      newpass: newpass1,
      newcompanyname: company,
      password: password,
      uid: localStorage.getItem("token"),
    };

    axios
      .post(`${host}/update-account`, data)
      .then(() => {
        setDone(true);
        setFail(false);
      })
      .catch((res) => {
        setErrmsg(res.response?.data.message || "An error occurred.");
        setFail(true);
        setDone(true);
      });
  };

  // Logout of this account
  const logout = () => {
    localStorage.clear();
    navigate("/");
    window.location.reload();
  };

  const validateData = () => {
    if (!password || !company) return false;
    if (newpass1 !== newpass2) return false;
    return true;
  };

  // Let the parent control the state so we can also update the database
  const setSetting = (key, value) => {
    props.updateSetting(key, value);
  };

  const saveSettings = () => {
    props.saveSettings();
    
  };

  // Handle navigation away
  useEffect(() => {
    const handleBeforeUnload = (e) => {
      e.preventDefault();
      props.saveSettings(); // Call saveSettings when navigating away
      return e.returnValue = '';
    };
    window.addEventListener('beforeunload', handleBeforeUnload);

    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload);
    };
  }, [props]);

  // Response display
  if (done) {
    if (fail) {
      return (
        <div
          style={{
            display: "flex",
            padding: "20%",
            alignItems: "center",
            flexDirection: "column",
          }}
        >
          <h1 style={{ color: "rgb(92, 119, 226)" }}>Oh no!</h1>
          <p style={{ color: "gray" }}>{errmsg}</p>
        </div>
      );
    } else {
      // Success
      return (
        <div
          style={{
            display: "flex",
            padding: "20%",
            alignItems: "center",
            flexDirection: "column",
          }}
        >
          <h1 style={{ color: "rgb(92, 119, 226)" }}>Success!</h1>
          <p style={{ color: "gray" }}>
            Your account details have been updated.
          </p>
        </div>
      );
    }
  }

  return (
    <div style={{ display: "flex", flexDirection: "row",  flex: 1, overflow: "hidden"}}>
      <div
        style={{
          display: "flex",
          alignItems: "center",
          flexDirection: "column",
          paddingTop: "20px",
          flex: 1
        }}
      >
        <h2 className="title">MODIFY ACCOUNT</h2>
        <form onSubmit={updateAccount}>
          {/* Company Name Input */}
          <div className="form-group">
            <label style={{ marginLeft: "5px", color: "gray" }}>Company Name</label>
            <input
              style={{ margin: "5px" }}
              type="text"
              value={company}
              onChange={(e) => setCompany(e.target.value)}
              className="form-control"
              id="companyInput"
              placeholder="Enter company"
            />
          </div>

          {/* Password Input */}
          <div className="form-group">
            <label style={{ marginLeft: "5px", color: "gray" }}>Password</label>
            <input
              style={{ margin: "5px" }}
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="form-control"
              id="passwordInput"
              placeholder="Enter password"
            />
          </div>

          {/* New Password Input */}
          <div className="form-group">
            <label style={{ marginLeft: "5px", color: "gray" }}>New Password</label>
            <input
              style={{ margin: "5px" }}
              type="password"
              value={newpass1}
              onChange={(e) => setNewpass1(e.target.value)}
              className="form-control"
              id="newpass1Input"
              placeholder="Enter new password"
            />
          </div>

          {/* Confirm New Password Input */}
          <div className="form-group">
            <label style={{ marginLeft: "5px", color: "gray" }}>
              Confirm New Password
            </label>
            <input
              style={{ margin: "5px" }}
              type="password"
              value={newpass2}
              onChange={(e) => setNewpass2(e.target.value)}
              className="form-control"
              id="newpass2Input"
              placeholder="Confirm new password"
            />
          </div>

          <p id="errorMsg">{errmsg}</p>

          <div
            style={{
              margin: "5px",
              display: "flex",
              justifyContent: "space-between",
              paddingTop: "20px",
            }}
          >
            <button
              type="button"
              className="btn btn-outline-secondary"
              id="logout"
              onClick={logout}
            >
              Logout
            </button>
            <button
              style={{ marginRight: "-10px" }}
              type="submit"
              className="btn btn-outline-primary"
              id="login-btn"
              disabled={!validateData()}
            >
              Update
            </button>
          </div>
        </form>
      </div>

      <div
        style={{
          display: "flex",
          alignItems: "center",
          flexDirection: "column",
          paddingTop: "20px",
          flex: 1
        }}
      >

{/* Div to push button to bottom */}
<div style = {{display: "flex", flexDirection: "column", justifyContent: "space-between", flex: 1, paddingBottom: 20}}>
   
    <h2 className="title">PREFERENCES</h2>

        <div>   
            {/* Settings Section: Horizontal gap*/}
            <div style = {{display: "flex", gap: 50}}>

                {/* Left Section: Vertical spacing */}
                <div style = {{display: "flex", flexDirection: "column", gap: 30}}>

            


            {/* Auto Task Generation */}
    
                <div>
                    <h4>Auto Task Generation</h4>
                    {Object.keys(autoTaskGeneration).map((task, index) => (
                        <div key={index} className="form-check" style={{ display: "flex", alignItems: "center" }}>
                        <input
                            type="checkbox"
                            className="form-check-input"
                            id={`autoTaskGeneration-${task}`}
                            checked={autoTaskGeneration[task]}
                            onChange={(e) => setSetting(`autoTaskGeneration.${task}`, e.target.checked)}
                        />
                        <label htmlFor={`autoTaskGeneration-${task}`} className="form-check-label" style={{ marginLeft: "5px", color: "gray" }}>
                            {prettyName(task)}
                        </label>
                        </div>
                        
                    ))}
                </div>

                <div style = {{display: "flex", alignItems: "center", gap: 10}}>
                    {/* Default Task Deadline */}
                    <div className="form-floating mb-3" style = {{flex: 1}}>
                        
                        <input
                        type="number"
                        min="1"
                        value={defaultTaskDeadline}
                        onChange={(e) => setSetting("defaultTaskDeadline", e.target.value)}
                        className="form-control"
                        />

                        <label >
                        Task Deadline
                        </label>            
                    </div>

                    {/* Task Overview Emails */}
                    <div className="form-floating mb-3" style = {{flex: 1}}>
                        
                        <select
                        value={taskOverviewEmails}
                        onChange={(e) => setSetting("taskOverviewEmails", e.target.value)}
                        className="form-control"
                        >
                        <option value="None">None</option>
                        <option value="Weekly">Weekly</option>
                        <option value="Daily">Daily</option>
                        </select>

                        <label>
                        Task Digest
                        </label>
                    </div>
                </div>

                {/* Upcoming Task Emails */}
                <div style={{ paddingTop: "10px" }}>
                    <h4>Upcoming Task Emails</h4>
                    {Object.keys(upcomingTaskEmails).map((timeframe, index) => (
                        <div key={index} className="form-check" style={{ display: "flex", alignItems: "center" }}>
                        <input
                            type="checkbox"
                            className="form-check-input"
                            id={`upcomingTask-${timeframe}`}
                            checked={upcomingTaskEmails[timeframe]}
                            onChange={(e) => setSetting(`upcomingTaskEmails.${timeframe}`, e.target.checked)}
                        />
                        <label style={{ marginLeft: "5px", color: "gray" }} className="form-check-label" htmlFor={`upcomingTask-${timeframe}`}>
                            {prettyName(timeframe)}
                        </label>
                        </div>
                    ))}
                </div>
                {/* End left section */}
            </div> 


            {/* Right Section */}
            <div style = {{display: "flex", flexDirection: "column", gap: 30}}>

                {/* Default Email Body */}
                <div>
                        <h4>
                        Default Message
                        </h4>
                        <div className="form-floating mb-3">
                        
                        <input
                        value={defaultEmailSubject}
                        onChange={(e) => setSetting("defaultEmailSubject", e.target.value)}
                        className="form-control"
                        placeholder="Enter default email subject"
                        
                        />
                        <label>Subject</label>
                    </div>

                    <div className="form-floating mb-3">
                        
                        <textarea
                        style={{ height: 90 }}
                        value={defaultEmailBody}
                        onChange={(e) => setSetting("defaultEmailBody", e.target.value)}
                        className="form-control"
                        placeholder="Enter default email body"
                        
                        />
                        <label>Body</label>
                    </div>

                    <div className="form-floating mb-3">
                        
                        <textarea
                        style={{ height: 80 }}
                        value={defaultEmailFooter}
                        onChange={(e) => setSetting("defaultEmailFooter", e.target.value)}
                        className="form-control"
                        placeholder="Enter default email footer"
                        
                        />
                        <label>Footer</label>
                    </div>

                    {/* Include Deadlines in Email Body */}
                    <div className="form-check">
                        <input
                        type="checkbox"
                        className="form-check-input"
                        id="includeDeadlines"
                        checked={includeDeadlines}
                        onChange={(e) => setSetting("includeDeadlines", e.target.checked)}
                        />
                        <label htmlFor="includeDeadlines" className="form-check-label" >
                            Include Deadlines
                        </label>
                    </div>
                </div>

                {/* Google Voice Integration */}
        <div>
            <div className="form-group" >
                
                    <div className="form-check">
                        <input
                        type="checkbox"
                        className="form-check-input"
                        id="googleVoiceCheckbox"
                        checked={useGoogleVoice}
                        onChange={(e) => setSetting("useGoogleVoice", e.target.checked)}
                        />
                        <label className="form-check-label" htmlFor="googleVoiceCheckbox">
                        Use Google Voice for Text
                        </label>
                    </div>


                    {/* Select Google Voice Account */}
                    {useGoogleVoice && (
                    <div className="form-floating mb-3" style = {{width: "200px"}}>
                        <input
                        type="number"
                        min="1"
                        value={googleVoiceAccountIndex}
                        onChange={(e) => setSetting("googleVoiceAccountIndex", e.target.value)}
                        className="form-control"
                        id="googleVoiceAccountInput"
                        placeholder="Google Voice Account"
                        />
                        <label htmlFor="googleVoiceAccountInput" style={{ color: "gray" }}>
                        Google Index
                        </label>
                    </div>
                    )}


            </div>

            



</div>

                

                
{/* End right section */}
            </div>

          

    
        </div>
                </div>
        {/* Save Settings Button */}
        <button
            style={{ marginTop: "10px" }}
            className="btn btn-outline-primary"
            onClick={saveSettings}
          >
            Save Settings
          </button>
          </div>
      </div>
    </div>
  );
};

export default Account;
