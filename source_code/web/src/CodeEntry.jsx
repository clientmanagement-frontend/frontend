import React from "react";
import ReactInputVerificationCode from "react-input-verification-code";
import "bootstrap/dist/css/bootstrap.min.css";

export default function CodeEntry({ fulfilled, status }) {
  return (
    <div style = {{display: "flex", flexDirection: "column", margin: 20, alignSelf: "center"}}>
      <h2 className="text-center">Enter Verification Code</h2>
      <p className="text-center">{status}</p>
      <div className="custom-styles">
        <ReactInputVerificationCode
        autoFocus
        onCompleted = {(code) => fulfilled(code)}
        length = {5}
        placeholder=""
        />
    </div>
        {/* <button className="btn btn-primary" onClick={handleSubmit}>
          Submit
        </button> */}
    </div>
  );
}
