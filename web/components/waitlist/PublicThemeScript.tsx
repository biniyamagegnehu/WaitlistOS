/**
 * PublicThemeScript — server component.
 *
 * Renders an inline <script> that runs *synchronously* before the browser
 * paints, preventing Flash of Unstyled Content (FOUC).
 *
 * - DARK   → always adds the `dark` class
 * - LIGHT  → always removes the `dark` class
 * - SYSTEM → reads prefers-color-scheme, and attaches a live listener
 */
export function PublicThemeScript({
  themeMode,
}: {
  themeMode: "SYSTEM" | "LIGHT" | "DARK";
}) {
  const script = `
(function(m){
  var d=document.documentElement;
  if(m==="DARK"){
    d.classList.add("dark");
  } else if(m==="LIGHT"){
    d.classList.remove("dark");
  } else {
    var mq=window.matchMedia("(prefers-color-scheme: dark)");
    d.classList.toggle("dark",mq.matches);
    mq.addEventListener("change",function(e){d.classList.toggle("dark",e.matches);});
  }
})("${themeMode}");
`.trim();

  return <script dangerouslySetInnerHTML={{ __html: script }} />;
}
