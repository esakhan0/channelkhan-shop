import LoginTemplate from "@modules/account/templates/login-template"

// Account titles belong to the shared layout and dashboard pages. This parallel
// slot also resolves when hidden, so it must not override their metadata.

export default function Login() {
  return <LoginTemplate />
}
