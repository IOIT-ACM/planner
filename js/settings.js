document.addEventListener("DOMContentLoaded", () => {
  const themeSelector = document.getElementById("theme-selector");
  const customThemeCreator = document.getElementById("custom-theme-creator");
  const customColorPickers = document.getElementById("custom-color-pickers");
  const applyCustomThemeBtn = document.getElementById("apply-custom-theme-btn");
  const snapDurationInput = document.getElementById("snap-duration-input");
  const projectCountSpan = document.getElementById("project-count");
  const projectListUl = document.getElementById("settings-project-list");
  const noProjectsMessage = document.getElementById("no-projects-message");
  const resetSettingsBtn = document.getElementById("reset-settings-btn");
  const eraseDataBtn = document.getElementById("erase-data-btn");

  const SETTINGS_KEY = "eventPlannerSettings";
  const PROJECTS_KEY = "eventPlannerProjects";
  const baseColors = {
    "--sys-color-1": "Primary Text/BG",
    "--sys-color-2": "Secondary Accent",
    "--sys-color-3": "Main Background",
    "--sys-color-4": "Highlight/CTA",
    "--sys-color-5": "Accent Border/Action",
  };
  const predefinedThemes = {
    default: {
      name: "Default (Olive)",
      colors: {
        "--sys-color-1": "#283618",
        "--sys-color-2": "#606c38",
        "--sys-color-3": "#fefae0",
        "--sys-color-4": "#dda15e",
        "--sys-color-5": "#bc6c25",
      },
    },
    ocean: {
      name: "Ocean Blue",
      colors: {
        "--sys-color-1": "#003049",
        "--sys-color-2": "#00507A",
        "--sys-color-3": "#F7F7F7",
        "--sys-color-4": "#D62828",
        "--sys-color-5": "#FCBF49",
      },
    },
    forest: {
      name: "Deep Forest",
      colors: {
        "--sys-color-1": "#1A4314",
        "--sys-color-2": "#2E6D23",
        "--sys-color-3": "#F4F3EE",
        "--sys-color-4": "#B28900",
        "--sys-color-5": "#789018",
      },
    },
    dusk: {
      name: "Dusk",
      colors: {
        "--sys-color-1": "#F3F3F3",
        "--sys-color-2": "#4A4A4A",
        "--sys-color-3": "#2C2C2C",
        "--sys-color-4": "#8E44AD",
        "--sys-color-5": "#E74C3C",
      },
    },
    custom: {
      name: "Custom",
      colors: {},
    },
  };

  let currentSettings = {};

  function loadSettings() {
    currentSettings = JSON.parse(localStorage.getItem(SETTINGS_KEY)) || {};
    if (!currentSettings.theme) {
      currentSettings.theme = { name: "default" };
    }
    if (
      currentSettings.theme.name === "custom" &&
      currentSettings.theme.colors
    ) {
      predefinedThemes.custom.colors = currentSettings.theme.colors;
    }
  }

  function saveSettings() {
    localStorage.setItem(SETTINGS_KEY, JSON.stringify(currentSettings));
  }

  function applyTheme(theme) {
    document.documentElement.removeAttribute("data-theme");
    const allVars = [
      ...Object.keys(predefinedThemes.default.colors),
      "--sys-color-1-rgba",
      "--sys-color-4-rgba",
      "--sys-color-2-light",
      "--sys-color-2-lighter",
      "--sys-color-5-dark",
    ];
    allVars.forEach((key) =>
      document.documentElement.style.removeProperty(key),
    );

    if (theme.name === "custom" && theme.colors) {
      Object.keys(theme.colors).forEach((key) => {
        document.documentElement.style.setProperty(key, theme.colors[key]);
      });
    } else if (theme.name !== "default") {
      document.documentElement.setAttribute("data-theme", theme.name);
    }
  }

  function calculateDerivedColors(colors) {
    return {
      "--sys-color-1-rgba": hexToRgb(colors["--sys-color-1"]),
      "--sys-color-4-rgba": hexToRgb(colors["--sys-color-4"]),
      "--sys-color-2-light": lightenColor(colors["--sys-color-2"], 20),
      "--sys-color-2-lighter": lightenColor(colors["--sys-color-2"], 60),
      "--sys-color-5-dark": darkenColor(colors["--sys-color-5"], 20),
    };
  }

  function renderThemeSelector() {
    themeSelector.innerHTML = "";
    Object.keys(predefinedThemes).forEach((themeKey) => {
      const theme = predefinedThemes[themeKey];
      const option = document.createElement("label");
      option.className = "theme-option";

      const radio = document.createElement("input");
      radio.type = "radio";
      radio.name = "theme";
      radio.value = themeKey;
      radio.checked = currentSettings.theme.name === themeKey;

      const swatch = document.createElement("div");
      swatch.className = "theme-swatch";

      const colorsDiv = document.createElement("div");
      colorsDiv.className = "theme-swatch-colors";

      const colorsToDisplay =
        themeKey === "custom" && Object.keys(theme.colors).length > 0
          ? theme.colors
          : predefinedThemes[themeKey].colors;

      Object.values(colorsToDisplay)
        .slice(0, 5)
        .forEach((color) => {
          const colorDiv = document.createElement("div");
          colorDiv.className = "swatch-color";
          colorDiv.style.backgroundColor = color;
          colorsDiv.appendChild(colorDiv);
        });

      const nameP = document.createElement("p");
      nameP.textContent = theme.name;

      swatch.appendChild(colorsDiv);
      swatch.appendChild(nameP);
      option.appendChild(radio);
      option.appendChild(swatch);
      themeSelector.appendChild(option);

      radio.addEventListener("change", () => {
        customThemeCreator.classList.toggle("hidden", radio.value !== "custom");
        const newThemeName = radio.value;
        currentSettings.theme.name = newThemeName;

        if (newThemeName === "custom") {
          let colorsToApply = predefinedThemes.custom.colors;
          if (!colorsToApply || Object.keys(colorsToApply).length === 0) {
            colorsToApply = { ...predefinedThemes.default.colors };
            const derived = calculateDerivedColors(colorsToApply);
            colorsToApply = { ...colorsToApply, ...derived };
          }
          currentSettings.theme.colors = colorsToApply;
          predefinedThemes.custom.colors = colorsToApply;
          renderCustomThemeCreator();
        } else {
          delete currentSettings.theme.colors;
        }

        applyTheme(currentSettings.theme);
        saveSettings();
      });
    });
  }

  function renderCustomThemeCreator() {
    if (!customColorPickers) return;
    customColorPickers.innerHTML = "";
    const currentCustomColors =
      predefinedThemes.custom.colors || predefinedThemes.default.colors;

    Object.keys(baseColors).forEach((key) => {
      const pickerDiv = document.createElement("div");
      pickerDiv.className = "custom-color-picker";

      const label = document.createElement("label");
      label.htmlFor = `picker-${key}`;
      label.textContent = `${baseColors[key]}:`;

      const input = document.createElement("input");
      input.type = "color";
      input.id = `picker-${key}`;
      input.dataset.colorVar = key;
      input.value =
        currentCustomColors[key] || predefinedThemes.default.colors[key];

      pickerDiv.appendChild(label);
      pickerDiv.appendChild(input);
      customColorPickers.appendChild(pickerDiv);
    });

    customThemeCreator.classList.toggle(
      "hidden",
      currentSettings.theme.name !== "custom",
    );
  }

  function renderSnapDuration() {
    snapDurationInput.value = currentSettings.snapDuration || 15;
  }

  function renderProjects() {
    const projects = JSON.parse(localStorage.getItem(PROJECTS_KEY)) || [];
    projectCountSpan.textContent = projects.length;
    projectListUl.innerHTML = "";

    if (projects.length === 0) {
      noProjectsMessage.classList.remove("hidden");
      projectListUl.classList.add("hidden");
      return;
    }

    noProjectsMessage.classList.add("hidden");
    projectListUl.classList.remove("hidden");

    const scopes = {
      days: "Days",
      weeks: "Weeks",
      months: "Months",
      years: "Years",
    };

    Object.entries(scopes).forEach(([scopeKey, scopeName]) => {
      const projectsInScope = projects.filter(
        (p) => (p.data.scope || "days") === scopeKey,
      );

      if (projectsInScope.length > 0) {
        const headerLi = document.createElement("li");
        headerLi.className = "project-scope-header";
        headerLi.textContent = `${scopeName} Projects`;
        projectListUl.appendChild(headerLi);

        projectsInScope.forEach((proj) => {
          const li = document.createElement("li");
          li.textContent = proj.title;

          const deleteBtn = document.createElement("button");
          deleteBtn.textContent = "Delete";
          deleteBtn.className = "delete-project-settings-btn";
          deleteBtn.title = `Delete project: ${proj.title}`;
          deleteBtn.addEventListener("click", () => {
            showCustomConfirm(
              `Are you sure you want to permanently delete the project "<strong>${proj.title}</strong>"? This cannot be undone.`,
              "Delete Project",
              () => {
                const allProjects =
                  JSON.parse(localStorage.getItem(PROJECTS_KEY)) || [];
                const updatedProjects = allProjects.filter(
                  (p) => p.id !== proj.id,
                );
                localStorage.setItem(
                  PROJECTS_KEY,
                  JSON.stringify(updatedProjects),
                );

                const currentData = JSON.parse(
                  localStorage.getItem("eventPlannerData"),
                );
                if (currentData && currentData.projectId === proj.id) {
                  localStorage.removeItem("eventPlannerData");
                }
                renderProjects();
              },
            );
          });

          li.appendChild(deleteBtn);
          projectListUl.appendChild(li);
        });
      }
    });
  }

  applyCustomThemeBtn.addEventListener("click", () => {
    const newCustomColors = {};
    document.querySelectorAll(".custom-color-picker input").forEach((input) => {
      newCustomColors[input.dataset.colorVar] = input.value;
    });

    const derivedColors = calculateDerivedColors(newCustomColors);
    const fullThemeColors = { ...newCustomColors, ...derivedColors };

    currentSettings.theme = {
      name: "custom",
      colors: fullThemeColors,
    };
    predefinedThemes.custom.colors = fullThemeColors;

    saveSettings();
    applyTheme(currentSettings.theme);
    renderThemeSelector();
  });

  snapDurationInput.addEventListener("change", () => {
    const duration = parseInt(snapDurationInput.value, 10);
    if (duration > 0 && duration <= 60) {
      currentSettings.snapDuration = duration;
      saveSettings();
    } else {
      snapDurationInput.value = currentSettings.snapDuration || 15;
    }
  });

  resetSettingsBtn.addEventListener("click", () => {
    showCustomConfirm(
      "Are you sure you want to reset all settings to their defaults? This will reset the theme and snap interval.",
      "Reset Settings",
      () => {
        localStorage.removeItem(SETTINGS_KEY);
        window.location.reload();
      },
    );
  });

  eraseDataBtn.addEventListener("click", () => {
    showCustomConfirm(
      "This will permanently delete ALL projects, settings, and planner data from your browser. This action cannot be undone. Are you absolutely sure?",
      "Erase All Site Data",
      () => {
        localStorage.clear();
        alert("All site data has been erased. The page will now reload.");
        window.location.reload();
      },
    );
  });

  loadSettings();
  renderThemeSelector();
  renderCustomThemeCreator();
  renderSnapDuration();
  renderProjects();
});
