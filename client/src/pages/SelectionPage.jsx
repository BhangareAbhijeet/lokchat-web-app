import React from "react";
import "../styles/SelectionPage.css";
import logo from "../assets/logo.png";
import { useNavigate } from "react-router-dom";

function Selectionpage() {
  const navigate = useNavigate();
  return (
    <div className="screen">
      <div className="content">
        <img src={logo} alt="LokChat" className="logo" />
        <h1 className="title">LokChat</h1>
        <button className="login-button" onClick={()=> navigate("/login")} >Login</button>
        <button className="signup-button" onClick={()=> navigate("/signup")}>
          Sign Up
        </button>
      </div>
      <div className="indicator-dots">
        <span className="dot"></span>
        <span className="dot"></span>
        <span className="dot"></span>
        <span className="dot active"></span>
      </div>
    </div>
  );
}

export default Selectionpage;
