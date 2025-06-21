document.addEventListener("DOMContentLoaded", () => {
  const urlInput = document.getElementById("url-input");
  const loadDataBtn = document.getElementById("load-data-btn");
  const errorMessageContainer = document.getElementById("error-message-container");

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
    if (!url) {
      displayError("URL cannot be empty.");
      return;
    }

    try {
      const response = await fetch(url);
      if (!response.ok) {
        throw new Error(`Failed to fetch data. Status: ${response.status} ${response.statusText}`);
      }
      const data = await response.json();

      if (
        data &&
        typeof data === 'object' &&
        Array.isArray(data.events) &&
        typeof data.maxDays === "number" &&
        data.maxDays >= 0 
      ) {
        
        const plannerData = {
            events: data.events,
            maxDays: data.maxDays === 0 ? 1 : data.maxDays 
        };

        localStorage.setItem("eventPlannerData", JSON.stringify(plannerData));
        window.location.href = "./index.html"; 
      } else {
        throw new Error("Invalid JSON format. Expected { events: [], maxDays: N } where N is a non-negative number.");
      }
    } catch (error) {
      console.error("Error loading data:", error);
      displayError(`Invalid URL or data format. Please ensure the URL is correct and returns JSON in the expected format (e.g., {"events": [...], "maxDays": 1}). Details: ${error.message}`);
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