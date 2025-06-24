document.addEventListener("DOMContentLoaded", () => {
  if (typeof initApp === "function") {
    initApp();
  } else {
    console.error(
      "initApp function not found. Make sure main.js is loaded correctly and before index.js.",
    );
  }
});
