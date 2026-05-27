// SPA shell using Navigation API + streamHTMLUnsafe
const content = document.querySelector("#content");

function setActiveTab(pathname) {
  document.querySelectorAll("nav.tabs a").forEach((a) => {
    const isCurrent = new URL(a.href).pathname === pathname;
    if (isCurrent) a.setAttribute("aria-current", "page");
    else a.removeAttribute("aria-current");
  });
}

if ("navigation" in window) {
  navigation.addEventListener("navigate", (event) => {
    if (!event.canIntercept || event.hashChange || event.downloadRequest) return;
    const url = new URL(event.destination.url);
    if (!url.pathname.startsWith("/04/")) return;
    // let the shell load normally on first nav
    if (url.pathname === "/04/" || url.pathname === "/04") return;
    event.intercept({
      async handler() {
        setActiveTab(url.pathname);
        content.replaceChildren();
        content.innerHTML =
          '<div class="skeleton lg"></div><div class="skeleton"></div><div class="skeleton sm"></div>';
        const fragPath = url.pathname.replace("/04/", "/04/fragment/");
        const res = await fetch(fragPath, { signal: event.signal });
        if (!("streamHTMLUnsafe" in content)) {
          content.innerHTML = await res.text();
          return;
        }
        content.replaceChildren();
        await res.body
          .pipeThrough(new TextDecoderStream())
          .pipeTo(content.streamHTMLUnsafe());
      },
    });
  });
  setActiveTab(location.pathname);
} else {
  console.info("Navigation API not available — falling back to full reloads.");
}
