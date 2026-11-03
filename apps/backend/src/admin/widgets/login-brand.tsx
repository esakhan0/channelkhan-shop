import { defineWidgetConfig } from "@medusajs/admin-sdk"
import logo from "../assets/mukkys-printer.webp"

const LoginBrand = () => {
  return <div style={{ background: "#fff8dc", color: "#302519", border: "1px solid #dbc982",
    borderRadius: 12, padding: "12px 16px", textAlign: "center" }}>
    <img src={logo} width={180} height={90} alt="Mukky’s 3D Shop"
      style={{ display: "block", maxWidth: "100%", height: "auto", margin: "0 auto" }} />
    <p style={{ margin: "4px 0 0", fontSize: 12 }}>Workshop admin · Est. 2026</p>
  </div>
}

export const config = defineWidgetConfig({ zone: "login.before" })
export default LoginBrand
