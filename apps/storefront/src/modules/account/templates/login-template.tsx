"use client"

import { useState } from "react"
import Image from "next/image"

import Register from "@modules/account/components/register"
import Login from "@modules/account/components/login"

export enum LOGIN_VIEW {
  SIGN_IN = "sign-in",
  REGISTER = "register",
}

const LoginTemplate = () => {
  const [currentView, setCurrentView] = useState("sign-in")

  return (
    <div className="ink-login-layout"><aside className="ink-login-aside" style={{ backgroundColor: "#fff8dc" }}>
      <Image src="/brand/mukkys-logo.png" alt="Mukky’s 3D Shop" width={250} height={125} sizes="(max-width: 600px) 160px, 250px"
        style={{ width: "clamp(150px, 22vw, 250px)", maxWidth: "100%", height: "auto", marginBottom: 12 }} />
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
