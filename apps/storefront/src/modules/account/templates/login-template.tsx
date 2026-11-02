"use client"

import { useState } from "react"

import Register from "@modules/account/components/register"
import Login from "@modules/account/components/login"

export enum LOGIN_VIEW {
  SIGN_IN = "sign-in",
  REGISTER = "register",
}

const LoginTemplate = () => {
  const [currentView, setCurrentView] = useState("sign-in")

  return (
    <div className="ink-login-layout"><aside className="ink-login-aside"><p className="ink-kicker">YOUR LITTLE CORNER OF MUKKY’S</p><h2>Hello,{" "}<br />happy human.</h2><span className="ink-login-star" aria-hidden="true">✳</span><p>Track your orders, save your details, and make yourself at home.</p><span className="ink-login-est">Making joy. Est. 2026</span></aside><div className="ink-login-form">
      {currentView === "sign-in" ? (
        <Login setCurrentView={setCurrentView} />
      ) : (
        <Register setCurrentView={setCurrentView} />
      )}
    </div></div>
  )
}

export default LoginTemplate
