/**
 * Wraps every page in the main part of the shop. Unlike a layout, a template
 * is mounted afresh on each navigation, so the new page fades in instead of
 * snapping into place (see `.mk-page` in styles/minimal.css).
 */
export default function MainTemplate({ children }: { children: React.ReactNode }) {
  return <div className="mk-page">{children}</div>
}
