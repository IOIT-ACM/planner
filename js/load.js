document.addEventListener("DOMContentLoaded", () => {
  const urlInput = document.getElementById("url-input");
  const loadDataBtn = document.getElementById("load-data-btn");
  const errorMessageContainer = document.getElementById(
    "error-message-container",
  );
  const loadingOverlay = document.getElementById("loading-overlay");

  function showLoader() {
    if (loadingOverlay) {
      loadingOverlay.classList.remove("hidden");
    }
  }

  function hideLoader() {
    if (loadingOverlay) {
      loadingOverlay.classList.add("hidden");
    }
  }

  function displayError(message) {
    errorMessageContainer.textContent = `Error: ${message}`;
    errorMessageContainer.classList.remove("hidden");
  }

  function clearError() {
    errorMessageContainer.textContent = "";
    errorMessageContainer.classList.add("hidden");
  }

  async function loadDataFromUrl(url) {
    clearError();
    showLoader();

    if (!url) {
      displayError("URL cannot be empty.");
      hideLoader();
      return;
    }

    try {
      const response = await fetch(url);
      if (!response.ok) {
        throw new Error(
          `Failed to fetch data. Status: ${response.status} ${response.statusText}`,
        );
      }
      const data = await response.json();

      if (
        data &&
        typeof data === "object" &&
        Array.isArray(data.events) &&
        typeof data.maxDays === "number" &&
        data.maxDays >= 0
      ) {
        const projectTitle = data.projectTitle || "Loaded Project from URL";
        const projectId = Date.now().toString();

        const plannerData = {
          events: data.events,
          maxDays: data.maxDays === 0 ? 1 : data.maxDays,
          projectTitle: projectTitle,
          projectId: projectId,
        };

        localStorage.setItem("eventPlannerData", JSON.stringify(plannerData));
        window.location.href = "./index.html";
      } else {
        throw new Error(
          "Invalid JSON format. Expected { events: [], maxDays: N, projectTitle: (optional) string } where N is a non-negative number.",
        );
      }
    } catch (error) {
      console.error("Error loading data:", error);
      displayError(
        `Invalid URL or data format. Please ensure the URL is correct and returns JSON in the expected format (e.g., {"events": [...], "maxDays": 1, "projectTitle": "My Project"}). Details: ${error.message}`,
      );
      hideLoader();
    }
  }

  loadDataBtn.addEventListener("click", () => {
    const url = urlInput.value.trim();
    loadDataFromUrl(url);
  });

  urlInput.addEventListener("keypress", (event) => {
    if (event.key === "Enter") {
      event.preventDefault();
      loadDataBtn.click();
    }
  });

  const queryParams = new URLSearchParams(window.location.search);
  const srcUrl = queryParams.get("src");

  if (srcUrl) {
    urlInput.value = srcUrl;
    loadDataFromUrl(srcUrl);
  }
});
