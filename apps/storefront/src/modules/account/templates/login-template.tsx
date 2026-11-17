"use client"

import { useState } from "react"

import BrandLogo from "@modules/common/components/brand-logo"
import Register from "@modules/account/components/register"
import Login from "@modules/account/components/login"

export enum LOGIN_VIEW {
  SIGN_IN = "sign-in",
  REGISTER = "register",
}

const LoginTemplate = () => {
  const [currentView, setCurrentView] = useState("sign-in")

  return (
    <div className="ink-login-layout"><aside className="ink-login-aside">
      <BrandLogo className="mk-logo-lg" />
      <h2>Your account</h2><p>Track your prints, check refunds and find your order updates here.</p>
      <span className="ink-login-est">Fidgets from the workshop · Est. 2026</span></aside><div className="ink-login-form">
      {currentView === "sign-in" ? (
        <Login setCurrentView={setCurrentView} />
      ) : (
        <Register setCurrentView={setCurrentView} />
      )}
    </div></div>
  )
}

export default LoginTemplate
