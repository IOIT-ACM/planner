document.addEventListener("DOMContentLoaded", () => {
  const URL =
    "https://raw.githubusercontent.com/IOIT-ACM/planner/refs/heads/raw/tenet25.json";
  const handleProjectLoadShortcut = (event) => {
    if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === "l") {
      event.preventDefault();

      const activeEl = document.activeElement;
      if (
        activeEl &&
        (activeEl.tagName === "INPUT" ||
          activeEl.tagName === "TEXTAREA" ||
          activeEl.tagName === "SELECT")
      ) {
        return;
      }

      if (document.querySelector("dialog[open]")) {
        return;
      }

      const loadPageUrl = `./load.html?src=${encodeURIComponent(URL)}`;

      window.location.href = loadPageUrl;
    }
  };

  document.addEventListener("keydown", handleProjectLoadShortcut);
});
