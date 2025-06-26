function initApp() {
  const addEventBtn = document.getElementById("add-event-btn");
  const eventDialog = document.getElementById("event-dialog");
  const eventForm = document.getElementById("event-form");
  const cancelEventBtn = document.getElementById("cancel-event-btn");
  const deleteEventBtn = document.getElementById("delete-event-btn");
  const duplicateEventBtn = document.getElementById("duplicate-event-btn");
  const dialogTitle = document.getElementById("dialog-title");
  const eventIdInput = document.getElementById("event-id");
  const eventTitleInput = document.getElementById("event-title-input");
  const eventDayLabel = document.getElementById("event-day-label");
  const eventDayRadioGroup = document.getElementById("event-day-radio-group");
  const eventColorInput = document.getElementById("event-color");
  const eventLocationInput = document.getElementById("event-location");
  const eventNotesInput = document.getElementById("event-notes");

  const timeInputsContainer = document.getElementById("time-inputs-container");
  const dayInputsContainer = document.getElementById("day-inputs-container");
  const monthInputsContainer = document.getElementById(
    "month-inputs-container",
  );
  const eventStartTimeInput = document.getElementById("event-start-time");
  const eventEndTimeInput = document.getElementById("event-end-time");
  const eventStartDayInput = document.getElementById("event-start-day");
  const eventEndDayInput = document.getElementById("event-end-day");
  const eventStartMonthSelect = document.getElementById("event-start-month");
  const eventEndMonthSelect = document.getElementById("event-end-month");

  const timelineContainerWrapper = document.getElementById(
    "timeline-container-wrapper",
  );
  const timelineContainer = document.getElementById("timeline-container");
  const timeRuler = document.getElementById("time-ruler");
  const timelineEventsContainer = document.getElementById("timeline-events");
  const eventListUl = document.getElementById("event-list");
  const currentDayListTitle = document.getElementById("current-day-list-title");

  const dayTabsContainer = document.getElementById("day-tabs-container");
  const zoomInBtn = document.getElementById("zoom-in-btn");
  const zoomOutBtn = document.getElementById("zoom-out-btn");
  const fitTimelineBtn = document.getElementById("fit-timeline-btn");

  const exportDataBtn = document.getElementById("export-data-btn");
  const importDataBtn = document.getElementById("import-data-btn");
  const importFileInput = document.getElementById("import-file-input");

  const clearDayBtn = document.getElementById("clear-day-btn");
  const clearAllDataBtn = document.getElementById("clear-all-data-btn");
  const timelineTooltip = document.getElementById("timeline-tooltip");

  const mobileMenuBtn = document.getElementById("mobile-menu-btn");
  const mobileSidebar = document.getElementById("mobile-sidebar");
  const sidebarOverlay = document.getElementById("sidebar-overlay");

  const exportDataBtnMobile = document.getElementById("export-data-btn-mobile");
  const importDataBtnMobile = document.getElementById("import-data-btn-mobile");
  const clearAllDataBtnMobile = document.getElementById(
    "clear-all-data-btn-mobile",
  );

  const manageProjectsBtn = document.getElementById("manage-projects-btn");
  const manageProjectsBtnMobile = document.getElementById(
    "manage-projects-btn-mobile",
  );
  const projectsDialog = document.getElementById("projects-dialog");

  const newProjectBtn = document.getElementById("new-project-btn");
  const savedProjectsListUI = document.getElementById("saved-projects-list");
  const noSavedProjectsMsg = document.getElementById("no-saved-projects");
  const loadSelectedProjectBtn = document.getElementById(
    "load-selected-project-btn",
  );
  const cancelProjectsDialogBtn = document.getElementById(
    "cancel-projects-dialog-btn",
  );

  const projectTitleDisplay = document.getElementById(
    "current-project-title-display",
  );
  const editProjectTitleBtn = document.getElementById("edit-project-title-btn");
  const editProjectTitleDialog = document.getElementById(
    "edit-project-title-dialog",
  );
  const editProjectTitleForm = document.getElementById(
    "edit-project-title-form",
  );
  const editProjectTitleInputMain = document.getElementById(
    "edit-project-title-input-main",
  );
  const cancelEditProjectTitleBtn = document.getElementById(
    "cancel-edit-project-title-btn",
  );

  const changeScopeBtn = document.getElementById("change-scope-btn");
  const scopeDialog = document.getElementById("scope-dialog");
  const scopeForm = document.getElementById("scope-form");
  const cancelScopeBtn = document.getElementById("cancel-scope-btn");
  const scopeRadioGroup = document.getElementById("scope-radio-group");

  let snapInterval = 15;
  let events = [];
  let currentDay = 1;
  let maxDays = 1;
  let currentScope = "days";
  let currentProjectTitle = "Untitled Project";
  let currentProjectId = null;

  let timelineScale = 60;
  const TIMELINE_START_HOUR = 0;
  const TIMELINE_END_HOUR = 24;
  const MIN_EVENT_WIDTH_PX = 20;
  const CLICK_THRESHOLD_PX = 5;
  const EVENT_BLOCK_HEIGHT = 40;
  const EVENT_BLOCK_MARGIN = 5;

  let draggingEvent = null;
  let resizingEvent = null;
  let dragOffsetX = 0;
  let resizeHandleType = null;
  let initialEventRect = null;
  let mouseDownPos = null;

  let isCreatingEvent = false;
  let newEventStartPos = { x: 0, y: 0 };
  let ghostEventBlock = null;

  let savedProjects = [];
  const PROJECTS_STORAGE_KEY = "eventPlannerProjects";
  let dialogSelectedProjectId = null;
  let dialogSelectedScope = "days";

  const MONTH_NAMES = [
    "January",
    "February",
    "March",
    "April",
    "May",
    "June",
    "July",
    "August",
    "September",
    "October",
    "November",
    "December",
  ];

  function getScopeLabel(scope, capitalized = false) {
    const s = scope || currentScope;
    let label = "Day";
    if (s === "weeks") label = "Week";
    else if (s === "months") label = "Month";
    else if (s === "years") label = "Year";
    return capitalized ? label : label.toLowerCase();
  }

  function getTimelineConfig() {
    const monthNamesShort = MONTH_NAMES.map((m) => m.substring(0, 3));
    switch (currentScope) {
      case "weeks":
        return {
          totalUnits: 7,
          unitName: "Day",
          snapInterval: 1,
          rulerLabels: (i) => `Day ${i}`,
          maxVal: 7,
        };
      case "months":
        return {
          totalUnits: 31,
          unitName: "Day",
          snapInterval: 1,
          rulerLabels: (i) => `${i}`,
          maxVal: 31,
        };
      case "years":
        return {
          totalUnits: 12,
          unitName: "Month",
          snapInterval: 1,
          rulerLabels: (i) => monthNamesShort[i - 1],
          maxVal: 12,
        };
      case "days":
      default:
        return {
          totalUnits: 24 * 60,
          unitName: "Minute",
          snapInterval: snapInterval,
          rulerLabels: null,
          maxVal: 24 * 60,
        };
    }
  }

  function parseUnit(value) {
    if (currentScope === "days") {
      if (!value) return 0;
      const parts = String(value).split(":").map(Number);
      const hours = parts[0] || 0;
      const minutes = parts[1] || 0;
      return hours * 60 + minutes;
    }
    return parseInt(value, 10) || 0;
  }

  function getInterpretedEndUnit(startStr, endStr) {
    const config = getTimelineConfig();
    const startUnit = parseUnit(startStr);
    let endUnit = parseUnit(endStr);

    if (currentScope === "days") {
      if (endStr === "00:00" && startUnit !== endUnit) {
        return config.totalUnits;
      }
    }
    return endUnit;
  }

  function formatUnit(units) {
    if (currentScope === "days") {
      const totalMinutes = Math.round(units);
      const hours = Math.floor(totalMinutes / 60) % 24;
      const minutes = totalMinutes % 60;
      return `${String(hours).padStart(2, "0")}:${String(minutes).padStart(
        2,
        "0",
      )}`;
    }
    return String(Math.round(units));
  }

  function snapToUnit(unitValue) {
    const config = getTimelineConfig();
    return Math.round(unitValue / config.snapInterval) * config.snapInterval;
  }

  function formatEventTimeRange(event) {
    if (!event || !event.start || !event.end) return "";
    const start = event.start;
    const end = event.end;

    switch (currentScope) {
      case "days":
        return `${formatTimeForDisplay(start)} - ${formatTimeForDisplay(end)}`;
      case "weeks":
      case "months":
        return `Day ${start} - Day ${end}`;
      case "years":
        return `${MONTH_NAMES[parseInt(start) - 1]} - ${
          MONTH_NAMES[parseInt(end) - 1]
        }`;
      default:
        return `${start} - ${end}`;
    }
  }

  function getCurrentState() {
    return {
      events: JSON.parse(JSON.stringify(events)),
      maxDays: maxDays,
      projectTitle: currentProjectTitle,
      scope: currentScope,
    };
  }

  function loadAppSettings() {
    const settings =
      JSON.parse(localStorage.getItem("eventPlannerSettings")) || {};
    snapInterval = settings.snapDuration || 15;
  }

  function applyState(state) {
    if (!state) return;

    const oldMaxDays = maxDays;
    const oldScope = currentScope;

    events = state.events;
    maxDays = state.maxDays;
    currentProjectTitle = state.projectTitle;
    currentScope = state.scope || "days";

    saveCurrentProjectState();

    renderProjectTitleDisplay();
    updateScopeRadioOptions();

    if (oldMaxDays !== maxDays || oldScope !== currentScope) {
      renderScopeTabs();
    }

    renderTimeline(true);
    renderEventList();

    FitTimelineOnPage();
  }

  function makeTitleUnique(title, baseTitle = "Project") {
    let newTitle = title.trim() || baseTitle;
    let counter = 1;
    const existingTitles = savedProjects.map((p) => p.title);
    while (existingTitles.includes(newTitle)) {
      newTitle = `${title.trim() || baseTitle} (${counter})`;
      counter++;
    }
    return newTitle;
  }

  function loadSavedProjects() {
    const storedProjects = localStorage.getItem(PROJECTS_STORAGE_KEY);
    if (storedProjects) {
      try {
        savedProjects = JSON.parse(storedProjects);
        if (!Array.isArray(savedProjects)) {
          savedProjects = [];
        }
      } catch (e) {
        savedProjects = [];
      }
    } else {
      savedProjects = [];
    }
  }

  function saveCurrentProjectState() {
    localStorage.setItem(
      "eventPlannerData",
      JSON.stringify({
        events,
        maxDays,
        projectTitle: currentProjectTitle,
        projectId: currentProjectId,
        scope: currentScope,
      }),
    );

    if (currentProjectId) {
      const projectInSaved = savedProjects.find(
        (p) => p.id === currentProjectId,
      );
      if (projectInSaved) {
        projectInSaved.data.events = JSON.parse(JSON.stringify(events));
        projectInSaved.data.maxDays = maxDays;
        projectInSaved.title = currentProjectTitle;
        projectInSaved.data.scope = currentScope;
        localStorage.setItem(
          PROJECTS_STORAGE_KEY,
          JSON.stringify(savedProjects),
        );
      }
    }
  }

  function renderProjectTitleDisplay() {
    projectTitleDisplay.textContent = currentProjectTitle;
  }

  editProjectTitleBtn.addEventListener("click", () => {
    editProjectTitleInputMain.value =
      currentProjectTitle === "Untitled Project" && !currentProjectId
        ? ""
        : currentProjectTitle;
    if (editProjectTitleDialog.showModal) editProjectTitleDialog.showModal();
  });

  cancelEditProjectTitleBtn.addEventListener("click", () => {
    editProjectTitleDialog.close();
  });

  editProjectTitleForm.addEventListener("submit", (e) => {
    e.preventDefault();
    const newTitle = editProjectTitleInputMain.value.trim();
    if (!newTitle) {
      showCustomAlert("Project title cannot be empty.", "Invalid Title");
      return;
    }

    if (
      savedProjects.some(
        (p) => p.title === newTitle && p.id !== currentProjectId,
      )
    ) {
      showCustomAlert(
        "A project with this title already exists. Please choose a different title.",
        "Save Project Error",
      );
      return;
    }

    historyManager.recordState(currentProjectId, getCurrentState());

    const existingProject = currentProjectId
      ? savedProjects.find((p) => p.id === currentProjectId)
      : null;

    if (existingProject) {
      existingProject.title = newTitle;
    } else {
      const newId = Date.now().toString();
      const newProjectEntry = {
        id: newId,
        title: newTitle,
        data: {
          events: JSON.parse(JSON.stringify(events)),
          maxDays: maxDays,
          scope: currentScope,
        },
      };
      savedProjects.push(newProjectEntry);
      currentProjectId = newId;
    }

    localStorage.setItem(PROJECTS_STORAGE_KEY, JSON.stringify(savedProjects));
    currentProjectTitle = newTitle;
    saveCurrentProjectState();
    renderProjectTitleDisplay();
    editProjectTitleDialog.close();
  });

  function updateScopeRadioOptions() {
    eventDayRadioGroup.innerHTML = "";
    const scopeLabel = getScopeLabel(null, true);
    eventDayLabel.textContent = `${scopeLabel}:`;
    for (let i = 1; i <= maxDays; i++) {
      const radioDiv = document.createElement("div");
      radioDiv.classList.add("radio-option");

      const input = document.createElement("input");
      input.type = "radio";
      input.name = "event-day";
      input.id = `event-day-${i}`;
      input.value = i;

      const label = document.createElement("label");
      label.htmlFor = `event-day-${i}`;
      label.textContent = `${scopeLabel} ${i}`;

      radioDiv.appendChild(input);
      radioDiv.appendChild(label);
      eventDayRadioGroup.appendChild(radioDiv);
    }
  }

  function renderScopeTabs() {
    dayTabsContainer.innerHTML = "";
    const scopeLabel = getScopeLabel(null, true);
    for (let i = 1; i <= maxDays; i++) {
      const tab = document.createElement("button");
      tab.classList.add("day-tab");
      tab.dataset.day = i;
      tab.textContent = `${scopeLabel} ${i}`;
      if (i === currentDay) {
        tab.classList.add("active");
      }
      tab.addEventListener("click", () => {
        currentDay = i;
        renderAll();
        FitTimelineOnPage();
      });
      dayTabsContainer.appendChild(tab);
    }
    const addDayButton = document.createElement("button");
    addDayButton.id = "add-day-btn";
    addDayButton.textContent = "+";
    addDayButton.title = `Add New ${scopeLabel}`;
    addDayButton.addEventListener("click", () => {
      historyManager.recordState(currentProjectId, getCurrentState());
      maxDays++;
      updateScopeRadioOptions();
      saveCurrentProjectState();
      renderScopeTabs();
    });
    dayTabsContainer.appendChild(addDayButton);
  }

  function getMinTimelineScale() {
    const wrapperWidth = timelineContainerWrapper.clientWidth;
    const config = getTimelineConfig();
    if (config.totalUnits <= 0) return 30;

    if (currentScope === "days") {
      return Math.max(10, wrapperWidth / 24);
    } else {
      return Math.max(10, wrapperWidth / config.totalUnits);
    }
  }

  function createEventBlockElement(eventData, layout) {
    const eventBlock = document.createElement("div");
    eventBlock.classList.add("event-block");
    eventBlock.dataset.eventId = eventData.id;

    eventBlock.style.left = layout.left;
    eventBlock.style.width = layout.width;
    eventBlock.style.top = layout.top;
    eventBlock.style.height = `${EVENT_BLOCK_HEIGHT}px`;
    eventBlock.style.backgroundColor = layout.backgroundColor;
    eventBlock.style.borderColor = layout.borderColor;

    const titleSpan = document.createElement("span");
    titleSpan.classList.add("event-block-title");
    titleSpan.textContent = layout.title;
    eventBlock.appendChild(titleSpan);

    const leftHandle = document.createElement("div");
    leftHandle.classList.add("resize-handle", "left");
    eventBlock.appendChild(leftHandle);

    const rightHandle = document.createElement("div");
    rightHandle.classList.add("resize-handle", "right");
    eventBlock.appendChild(rightHandle);

    eventBlock.addEventListener("mouseenter", (e) => {
      const currentEventData = events.find(
        (ev) => ev.id === eventBlock.dataset.eventId,
      );
      if (currentEventData) {
        timelineTooltip.innerHTML = `<strong>${
          currentEventData.title
        }</strong><br>${formatEventTimeRange(currentEventData)}`;
        timelineTooltip.classList.remove("hidden");
        updateTooltipPosition(e, timelineTooltip);
      }
    });
    eventBlock.addEventListener("mousemove", (e) => {
      updateTooltipPosition(e, timelineTooltip);
    });
    eventBlock.addEventListener("mouseleave", () => {
      timelineTooltip.classList.add("hidden");
    });

    return eventBlock;
  }

  function renderTimeRuler() {
    timeRuler.innerHTML = "";
    const config = getTimelineConfig();

    if (currentScope === "days") {
      const totalTimelineWidth = 24 * timelineScale;
      timelineContainer.style.width = `${totalTimelineWidth}px`;
      for (let hour = TIMELINE_START_HOUR; hour <= TIMELINE_END_HOUR; hour++) {
        const tick = document.createElement("div");
        tick.classList.add("time-tick", "major");
        const tickPosition = (hour - TIMELINE_START_HOUR) * timelineScale;
        tick.style.left = `${tickPosition}px`;
        const label = document.createElement("span");
        label.textContent = formatTimeForDisplay(
          `${String(hour % 24).padStart(2, "0")}:00`,
        );
        tick.appendChild(label);
        timeRuler.appendChild(tick);

        if (hour < TIMELINE_END_HOUR) {
          for (let j = 1; j <= 3; j++) {
            const quarterTick = document.createElement("div");
            quarterTick.classList.add("time-tick");
            const quarterPosition = tickPosition + (timelineScale / 4) * j;
            quarterTick.style.left = `${quarterPosition}px`;
            timeRuler.appendChild(quarterTick);
          }
        }
      }
    } else {
      const totalTimelineWidth = config.totalUnits * timelineScale;
      timelineContainer.style.width = `${totalTimelineWidth}px`;
      const pixelsPerUnit = timelineScale;

      for (let i = 1; i <= config.totalUnits; i++) {
        const tick = document.createElement("div");
        tick.classList.add("time-tick", "major");
        const tickPosition = (i - 1) * pixelsPerUnit;
        tick.style.left = `${tickPosition}px`;

        const label = document.createElement("span");
        label.textContent = config.rulerLabels(i);
        tick.appendChild(label);
        timeRuler.appendChild(tick);
      }
    }
  }

  function renderTimelineEvents(isAnimated = false) {
    const dayEvents = events
      .filter((event) => event.day === currentDay)
      .sort((a, b) => parseUnit(a.start) - parseUnit(b.start));

    const lanes = [];
    const eventLayouts = new Map();
    const config = getTimelineConfig();

    dayEvents.forEach((eventData) => {
      const startUnit = parseUnit(eventData.start);
      const endUnit = getInterpretedEndUnit(eventData.start, eventData.end);

      if (startUnit >= endUnit) {
        return;
      }
      if (currentScope !== "days" && startUnit <= 0) {
        return;
      }

      let eventStartOffset, eventWidth;

      if (currentScope === "days") {
        const pixelsPerMinute = timelineScale / 60;
        eventStartOffset =
          (startUnit - TIMELINE_START_HOUR * 60) * pixelsPerMinute;
        eventWidth = (endUnit - startUnit) * pixelsPerMinute;
      } else {
        const pixelsPerUnit = timelineScale;
        eventStartOffset = (startUnit - 1) * pixelsPerUnit;
        const durationUnits = endUnit - startUnit + 1;
        eventWidth = durationUnits * pixelsPerUnit;
      }

      if (eventWidth < MIN_EVENT_WIDTH_PX) eventWidth = MIN_EVENT_WIDTH_PX;

      let eventTop = 0;
      let placed = false;
      for (let i = 0; i < lanes.length; i++) {
        if (lanes[i] <= startUnit) {
          eventTop = i * (EVENT_BLOCK_HEIGHT + EVENT_BLOCK_MARGIN);
          lanes[i] = endUnit;
          placed = true;
          break;
        }
      }
      if (!placed) {
        eventTop = lanes.length * (EVENT_BLOCK_HEIGHT + EVENT_BLOCK_MARGIN);
        lanes.push(endUnit);
      }

      eventLayouts.set(eventData.id, {
        left: `${eventStartOffset}px`,
        width: `${eventWidth}px`,
        top: `${eventTop}px`,
        backgroundColor: eventData.color,
        borderColor: darkenColor(eventData.color, 20),
        title: eventData.title,
      });
    });

    const maxBottom =
      lanes.length * (EVENT_BLOCK_HEIGHT + EVENT_BLOCK_MARGIN) +
      EVENT_BLOCK_MARGIN;
    timelineEventsContainer.style.height = `${Math.max(
      maxBottom,
      100,
      EVENT_BLOCK_HEIGHT + EVENT_BLOCK_MARGIN,
    )}px`;

    const existingBlocks = new Map(
      Array.from(timelineEventsContainer.querySelectorAll(".event-block")).map(
        (el) => [el.dataset.eventId, el],
      ),
    );
    const processedIds = new Set();

    dayEvents.forEach((eventData) => {
      const layout = eventLayouts.get(eventData.id);
      if (!layout) return;
      processedIds.add(eventData.id);

      if (existingBlocks.has(eventData.id)) {
        const block = existingBlocks.get(eventData.id);
        block.style.left = layout.left;
        block.style.width = layout.width;
        block.style.top = layout.top;
        block.style.backgroundColor = layout.backgroundColor;
        block.style.borderColor = layout.borderColor;
        block.querySelector(".event-block-title").textContent = layout.title;
      } else {
        const eventBlock = createEventBlockElement(eventData, layout);
        eventBlock.style.opacity = "0";
        timelineEventsContainer.appendChild(eventBlock);
        requestAnimationFrame(() => {
          eventBlock.style.opacity = "1";
        });
      }
    });

    existingBlocks.forEach((block, id) => {
      if (!processedIds.has(id)) {
        block.style.opacity = "0";
        const removeBlock = () => {
          if (block.parentElement) {
            block.remove();
          }
        };
        block.addEventListener("transitionend", removeBlock, { once: true });
        setTimeout(removeBlock, 500);
      }
    });
  }

  function renderTimeline(isAnimated = false) {
    renderTimeRuler();
    renderTimelineEvents(isAnimated);
  }

  function renderEventList() {
    eventListUl.innerHTML = "";
    const scopeLabel = getScopeLabel(null, true);
    currentDayListTitle.textContent = `Events for ${scopeLabel} ${currentDay}`;
    const dayEvents = events
      .filter((event) => event.day === currentDay)
      .sort((a, b) => parseUnit(a.start) - parseUnit(b.start));

    if (dayEvents.length === 0) {
      const scopeTerm = getScopeLabel(null, false);
      eventListUl.innerHTML = `<li>No events scheduled for this ${scopeTerm}.</li>`;
    } else {
      dayEvents.forEach((event) => {
        const li = document.createElement("li");
        li.classList.add("event-list-item");
        li.dataset.eventId = event.id;

        const chevronBtn = document.createElement("button");
        chevronBtn.innerHTML = "▼";
        chevronBtn.title = "Toggle Details";
        chevronBtn.dataset.expanded = "false";
        chevronBtn.classList.add("event-list-chevron-btn");
        chevronBtn.addEventListener("click", () => toggleEventDetails(li));
        li.appendChild(chevronBtn);

        const colorInput = document.createElement("input");
        colorInput.type = "color";
        colorInput.classList.add("event-color-dot");
        colorInput.value = event.color;
        colorInput.addEventListener("input", (e) => {
          historyManager.recordState(currentProjectId, getCurrentState());
          const targetEvent = events.find((ev) => ev.id === event.id);
          if (targetEvent) {
            targetEvent.color = e.target.value;
            saveCurrentProjectState();
            renderTimeline(true);
          }
        });
        li.appendChild(colorInput);

        const actionsSpan = document.createElement("span");
        actionsSpan.classList.add("event-actions");

        const editBtn = document.createElement("button");
        editBtn.title = "Edit Event";
        const editIcon = document.createElement("img");
        editIcon.src = "./icons/edit.svg";
        editIcon.alt = "Edit";
        editBtn.appendChild(editIcon);
        editBtn.addEventListener("click", () => openEditDialog(event.id));
        actionsSpan.appendChild(editBtn);

        const deleteListBtn = document.createElement("button");
        deleteListBtn.title = "Delete Event";
        const deleteIcon = document.createElement("img");
        deleteIcon.src = "./icons/delete.svg";
        deleteIcon.alt = "Delete";
        deleteListBtn.appendChild(deleteIcon);
        deleteListBtn.addEventListener("click", () => {
          showCustomConfirm(
            `Are you sure you want to delete the event "<strong>${event.title}</strong>"?`,
            "Delete Event",
            () => {
              historyManager.recordState(currentProjectId, getCurrentState());
              events = events.filter((ev) => ev.id !== event.id);
              saveCurrentProjectState();
              renderTimeline(true);
              renderEventList();
            },
          );
        });
        actionsSpan.appendChild(deleteListBtn);
        li.appendChild(actionsSpan);

        const titleTimeWrapper = document.createElement("div");
        titleTimeWrapper.classList.add("event-title-time-wrapper");

        const titleSpan = document.createElement("span");
        titleSpan.classList.add("event-title");
        titleSpan.textContent = event.title;
        titleSpan.addEventListener("click", () => toggleEventDetails(li));
        titleTimeWrapper.appendChild(titleSpan);

        const timeSpan = document.createElement("span");
        timeSpan.classList.add("event-time");
        timeSpan.textContent = formatEventTimeRange(event);
        titleTimeWrapper.appendChild(timeSpan);
        li.appendChild(titleTimeWrapper);

        const detailsDiv = document.createElement("div");
        detailsDiv.classList.add("event-details", "hidden");
        detailsDiv.innerHTML = `
            <table>
                <tr><td>Location:</td><td>${event.location || "N/A"}</td></tr>
                <tr><td>Notes:</td><td>${event.notes || "N/A"}</td></tr>
            </table>
        `;
        li.appendChild(detailsDiv);
        eventListUl.appendChild(li);
      });
    }
    updateClearScopeButtonState();
  }

  function updateClearScopeButtonState() {
    const dayEvents = events.filter((event) => event.day === currentDay);
    clearDayBtn.classList.remove("hidden");
    const scopeLabel = getScopeLabel(null, true);

    if (currentDay === 1 && dayEvents.length === 0 && maxDays === 1) {
      clearDayBtn.classList.add("hidden");
    } else if (dayEvents.length === 0) {
      clearDayBtn.textContent = `Delete ${scopeLabel}`;
      clearDayBtn.title = `Delete ${scopeLabel} ${currentDay}`;
    } else {
      clearDayBtn.textContent = `Clear ${scopeLabel}`;
      clearDayBtn.title = `Clear Events for ${scopeLabel} ${currentDay}`;
    }
  }

  function updateEventDialogUI() {
    const config = getTimelineConfig();
    timeInputsContainer.classList.add("hidden");
    dayInputsContainer.classList.add("hidden");
    monthInputsContainer.classList.add("hidden");

    // Reset all conditional inputs to not be required
    eventStartTimeInput.required = false;
    eventEndTimeInput.required = false;
    eventStartDayInput.required = false;
    eventEndDayInput.required = false;
    eventStartMonthSelect.required = false;
    eventEndMonthSelect.required = false;

    switch (currentScope) {
      case "weeks":
      case "months":
        dayInputsContainer.classList.remove("hidden");
        eventStartDayInput.required = true;
        eventEndDayInput.required = true;
        eventStartDayInput.max = config.maxVal;
        eventEndDayInput.max = config.maxVal;
        break;
      case "years":
        monthInputsContainer.classList.remove("hidden");
        eventStartMonthSelect.required = true;
        eventEndMonthSelect.required = true;
        eventStartMonthSelect.innerHTML = "";
        eventEndMonthSelect.innerHTML = "";
        for (let i = 1; i <= 12; i++) {
          const option1 = new Option(MONTH_NAMES[i - 1], i);
          const option2 = new Option(MONTH_NAMES[i - 1], i);
          eventStartMonthSelect.add(option1);
          eventEndMonthSelect.add(option2);
        }
        break;
      case "days":
      default:
        timeInputsContainer.classList.remove("hidden");
        eventStartTimeInput.required = true;
        eventEndTimeInput.required = true;
        break;
    }
  }

  function openAddDialog() {
    dialogTitle.textContent = "Add Event";
    eventForm.reset();
    eventIdInput.value = "";
    updateScopeRadioOptions();
    updateEventDialogUI();
    const radioToSelect = eventDayRadioGroup.querySelector(
      `input[value="${currentDay}"]`,
    );
    if (radioToSelect) {
      radioToSelect.checked = true;
    } else {
      const firstRadio = eventDayRadioGroup.querySelector(
        'input[type="radio"]',
      );
      if (firstRadio) {
        firstRadio.checked = true;
      }
    }
    eventColorInput.value = "#3498db";
    deleteEventBtn.style.display = "none";
    duplicateEventBtn.style.display = "none";
    if (eventDialog.showModal) eventDialog.showModal();
  }

  function openEditDialog(id) {
    const event = events.find((e) => e.id === id);
    if (!event) return;

    dialogTitle.textContent = "Edit Event";
    updateEventDialogUI();
    eventIdInput.value = event.id;
    eventTitleInput.value = event.title;
    updateScopeRadioOptions();
    const radioToSelect = eventDayRadioGroup.querySelector(
      `input[value="${event.day}"]`,
    );
    if (radioToSelect) {
      radioToSelect.checked = true;
    }

    switch (currentScope) {
      case "weeks":
      case "months":
        eventStartDayInput.value = event.start;
        eventEndDayInput.value = event.end;
        break;
      case "years":
        eventStartMonthSelect.value = event.start;
        eventEndMonthSelect.value = event.end;
        break;
      case "days":
      default:
        eventStartTimeInput.value = event.start;
        eventEndTimeInput.value = event.end;
        break;
    }

    eventColorInput.value = event.color;
    eventLocationInput.value = event.location || "";
    eventNotesInput.value = event.notes || "";

    deleteEventBtn.style.display = "inline-block";
    duplicateEventBtn.style.display = "inline-block";
    if (eventDialog.showModal) eventDialog.showModal();
  }

  eventForm.addEventListener("submit", (e) => {
    e.preventDefault();

    const id = eventIdInput.value;
    const title = eventTitleInput.value.trim();

    if (!title) {
      showCustomAlert("Event title cannot be empty.", "Validation Error");
      return;
    }

    let startValue, endValue;

    switch (currentScope) {
      case "weeks":
      case "months":
        startValue = eventStartDayInput.value;
        endValue = eventEndDayInput.value;
        break;
      case "years":
        startValue = eventStartMonthSelect.value;
        endValue = eventEndMonthSelect.value;
        break;
      case "days":
      default:
        startValue = eventStartTimeInput.value;
        endValue = eventEndTimeInput.value;
        break;
    }

    const startUnit = parseUnit(startValue);
    const endUnit = getInterpretedEndUnit(startValue, endValue);

    if (startUnit >= endUnit) {
      showCustomAlert("End time must be after start time.", "Validation Error");
      return;
    }

    const selectedDayRadio = eventDayRadioGroup.querySelector(
      'input[name="event-day"]:checked',
    );
    if (!selectedDayRadio) {
      const scopeTerm = getScopeLabel(null, false);
      showCustomAlert(
        `Please select a ${scopeTerm} for the event.`,
        "Validation Error",
      );
      return;
    }

    historyManager.recordState(currentProjectId, getCurrentState());

    const eventData = {
      id: id || Date.now().toString(),
      title: title,
      day: parseInt(selectedDayRadio.value),
      start: startValue,
      end: endValue,
      color: eventColorInput.value,
      location: eventLocationInput.value,
      notes: eventNotesInput.value,
    };

    if (id) {
      events = events.map((event) => (event.id === id ? eventData : event));
    } else {
      events.push(eventData);
    }

    saveCurrentProjectState();
    renderTimeline(true);
    renderEventList();
    eventDialog.close();
  });

  deleteEventBtn.addEventListener("click", () => {
    const id = eventIdInput.value;
    if (id) {
      showCustomConfirm(
        "Are you sure you want to delete this event?",
        "Delete Event",
        () => {
          historyManager.recordState(currentProjectId, getCurrentState());
          events = events.filter((event) => event.id !== id);
          saveCurrentProjectState();
          renderTimeline(true);
          renderEventList();
          eventDialog.close();
        },
      );
    }
  });

  duplicateEventBtn.addEventListener("click", () => {
    if (!eventIdInput.value) return;
    let startValue, endValue;

    switch (currentScope) {
      case "weeks":
      case "months":
        startValue = eventStartDayInput.value;
        endValue = eventEndDayInput.value;
        break;
      case "years":
        startValue = eventStartMonthSelect.value;
        endValue = eventEndMonthSelect.value;
        break;
      case "days":
      default:
        startValue = eventStartTimeInput.value;
        endValue = eventEndTimeInput.value;
        break;
    }

    const startUnit = parseUnit(startValue);
    const endUnit = getInterpretedEndUnit(startValue, endValue);

    if (startUnit > endUnit) {
      showCustomAlert(
        "End must be after start to duplicate.",
        "Validation Error",
      );
      return;
    }

    const selectedDayRadio = eventDayRadioGroup.querySelector(
      'input[name="event-day"]:checked',
    );
    if (!selectedDayRadio) {
      const scopeTerm = getScopeLabel(null, false);
      showCustomAlert(
        `Please select a ${scopeTerm} for the event to duplicate.`,
        "Validation Error",
      );
      return;
    }

    historyManager.recordState(currentProjectId, getCurrentState());

    const newEvent = {
      id: Date.now().toString(),
      title: eventTitleInput.value,
      day: parseInt(selectedDayRadio.value),
      start: startValue,
      end: endValue,
      color: eventColorInput.value,
      location: eventLocationInput.value,
      notes: eventNotesInput.value,
    };

    events.push(newEvent);
    saveCurrentProjectState();
    renderTimeline(true);
    renderEventList();
    eventDialog.close();
  });

  addEventBtn.addEventListener("click", openAddDialog);
  cancelEventBtn.addEventListener("click", () => eventDialog.close());

  zoomInBtn.addEventListener("click", () => {
    timelineScale = Math.min(300, timelineScale + 20);
    renderTimeline(true);
  });

  zoomOutBtn.addEventListener("click", () => {
    const minScale = getMinTimelineScale();
    timelineScale = Math.max(minScale, timelineScale - 20);
    renderTimeline(true);
  });

  function FitTimelineOnPage() {
    const dayEvents = events.filter((event) => event.day === currentDay);
    const wrapperWidth = timelineContainerWrapper.clientWidth;
    const config = getTimelineConfig();

    if (dayEvents.length === 0) {
      timelineScale = getMinTimelineScale();
      renderTimeline(true);
      timelineContainerWrapper.scrollLeft = 0;
      return;
    }

    let minEventStartUnit = config.totalUnits;
    let maxEventEndUnit = 0;

    dayEvents.forEach((event) => {
      minEventStartUnit = Math.min(minEventStartUnit, parseUnit(event.start));
      maxEventEndUnit = Math.max(
        maxEventEndUnit,
        getInterpretedEndUnit(event.start, event.end),
      );
    });

    if (currentScope !== "days") {
      maxEventEndUnit += 1;
    }

    const PADDING_UNITS = currentScope === "days" ? 30 : 1;
    const MIN_VIEW_UNITS = currentScope === "days" ? 60 : 2;

    let viewStartUnit = minEventStartUnit - PADDING_UNITS;
    let viewEndUnit = maxEventEndUnit + PADDING_UNITS;
    let viewDuration = viewEndUnit - viewStartUnit;

    if (viewDuration < MIN_VIEW_UNITS) {
      const center = (viewStartUnit + viewEndUnit) / 2;
      viewStartUnit = center - MIN_VIEW_UNITS / 2;
      viewEndUnit = center + MIN_VIEW_UNITS / 2;
    }

    viewStartUnit = Math.max(0, viewStartUnit);
    viewEndUnit = Math.min(config.totalUnits, viewEndUnit);
    viewDuration = viewEndUnit - viewStartUnit;

    if (viewDuration <= 0) {
      timelineScale = getMinTimelineScale();
      renderTimeline(true);
      return;
    }

    const pixelsPerUnit = wrapperWidth / viewDuration;
    if (currentScope === "days") {
      timelineScale = pixelsPerUnit * 60;
    } else {
      timelineScale = pixelsPerUnit;
    }
    timelineScale = Math.max(getMinTimelineScale(), timelineScale);
    timelineScale = Math.min(300, timelineScale);

    renderTimeline(true);

    const pixelsPerBaseUnit =
      currentScope === "days" ? timelineScale / 60 : timelineScale;
    const scrollStartOffset = currentScope === "days" ? 0 : 1;
    const scrollTargetPx =
      (viewStartUnit - scrollStartOffset) * pixelsPerBaseUnit;

    timelineContainerWrapper.scrollLeft = scrollTargetPx;
  }

  fitTimelineBtn.addEventListener("click", FitTimelineOnPage);

  timelineEventsContainer.addEventListener("mousedown", (e) => {
    const clickedEventBlock = e.target.closest(".event-block");

    if (clickedEventBlock) {
      const eventId = clickedEventBlock.dataset.eventId;
      const event = events.find((ev) => ev.id === eventId);
      if (!event) return;

      initialEventRect = clickedEventBlock.getBoundingClientRect();
      mouseDownPos = { x: e.clientX, y: e.clientY };

      if (e.target.classList.contains("resize-handle")) {
        resizingEvent = event;
        resizeHandleType = e.target.classList.contains("left")
          ? "left"
          : "right";
        document.body.style.cursor = "ew-resize";
      } else {
        draggingEvent = event;
        dragOffsetX = e.clientX - initialEventRect.left;
        clickedEventBlock.style.cursor = "grabbing";
        clickedEventBlock.style.zIndex = "1000";
      }
      e.preventDefault();
    } else if (
      window.matchMedia("(pointer: fine)").matches &&
      e.target === timelineEventsContainer
    ) {
      if (draggingEvent || resizingEvent || isCreatingEvent) return;

      isCreatingEvent = true;
      const rect = timelineEventsContainer.getBoundingClientRect();

      const laneHeightWithMargin = EVENT_BLOCK_HEIGHT + EVENT_BLOCK_MARGIN;
      const clickYInTimelineEvents = e.clientY - rect.top;
      const targetLaneIndex = Math.floor(
        clickYInTimelineEvents / laneHeightWithMargin,
      );
      const ghostTopPx = targetLaneIndex * laneHeightWithMargin;

      newEventStartPos = {
        x: e.clientX - rect.left,
        y: ghostTopPx,
      };

      ghostEventBlock = document.createElement("div");
      ghostEventBlock.classList.add("ghost-event-block");
      ghostEventBlock.style.left = `${newEventStartPos.x}px`;
      ghostEventBlock.style.top = `${newEventStartPos.y}px`;
      ghostEventBlock.style.height = `${EVENT_BLOCK_HEIGHT}px`;
      ghostEventBlock.style.width = "0px";
      timelineEventsContainer.appendChild(ghostEventBlock);
      document.body.style.cursor = "crosshair";
      e.preventDefault();
    }
  });

  document.addEventListener("mousemove", (e) => {
    if (isCreatingEvent && ghostEventBlock) {
      const rect = timelineEventsContainer.getBoundingClientRect();
      let currentX = e.clientX - rect.left;

      const totalTimelineWidthPx = timelineContainer.clientWidth;
      currentX = Math.max(0, Math.min(currentX, totalTimelineWidthPx));

      let newLeft, newWidth;
      if (currentX < newEventStartPos.x) {
        newLeft = currentX;
        newWidth = newEventStartPos.x - currentX;
      } else {
        newLeft = newEventStartPos.x;
        newWidth = currentX - newEventStartPos.x;
      }

      ghostEventBlock.style.left = `${newLeft}px`;
      ghostEventBlock.style.width = `${newWidth}px`;
      e.preventDefault();
      return;
    }

    if (!draggingEvent && !resizingEvent) return;
    e.preventDefault();

    const timelineRect = timelineContainerWrapper.getBoundingClientRect();
    const scrollLeft = timelineContainerWrapper.scrollLeft;
    let mouseXInTimeline = e.clientX - timelineRect.left + scrollLeft;

    if (draggingEvent) {
      const eventBlock = timelineEventsContainer.querySelector(
        `.event-block[data-event-id="${draggingEvent.id}"]`,
      );
      if (!eventBlock) return;

      let newLeftPx = mouseXInTimeline - dragOffsetX;
      newLeftPx = Math.max(0, newLeftPx);

      const eventDurationUnits =
        getInterpretedEndUnit(draggingEvent.start, draggingEvent.end) -
        parseUnit(draggingEvent.start);
      const pixelsPerUnit =
        currentScope === "days" ? timelineScale / 60 : timelineScale;
      const eventWidthPx =
        (eventDurationUnits + (currentScope === "days" ? 0 : 1)) *
        pixelsPerUnit;
      const maxLeftPx = timelineContainer.clientWidth - eventWidthPx;
      newLeftPx = Math.min(newLeftPx, maxLeftPx);
      eventBlock.style.left = `${newLeftPx}px`;
    } else if (resizingEvent) {
      const eventBlock = timelineEventsContainer.querySelector(
        `.event-block[data-event-id="${resizingEvent.id}"]`,
      );
      if (!eventBlock) return;

      const pixelsPerUnit =
        currentScope === "days" ? timelineScale / 60 : timelineScale;
      const originalStartUnit = parseUnit(resizingEvent.start);
      const originalEndUnit = getInterpretedEndUnit(
        resizingEvent.start,
        resizingEvent.end,
      );
      const startOffset = currentScope === "days" ? 0 : 1;

      const originalStartPx = (originalStartUnit - startOffset) * pixelsPerUnit;
      const originalWidthPx =
        (originalEndUnit -
          originalStartUnit +
          (currentScope === "days" ? 0 : 1)) *
        pixelsPerUnit;

      if (resizeHandleType === "right") {
        let newWidthPx = mouseXInTimeline - originalStartPx;
        newWidthPx = Math.max(MIN_EVENT_WIDTH_PX, newWidthPx);
        if (originalStartPx + newWidthPx > timelineContainer.clientWidth) {
          newWidthPx = timelineContainer.clientWidth - originalStartPx;
        }
        eventBlock.style.width = `${newWidthPx}px`;
      } else {
        let newStartPx = mouseXInTimeline;
        newStartPx = Math.max(0, newStartPx);
        let newWidthPx = originalStartPx + originalWidthPx - newStartPx;
        newWidthPx = Math.max(MIN_EVENT_WIDTH_PX, newWidthPx);

        if (
          newStartPx + newWidthPx > originalStartPx + originalWidthPx &&
          newWidthPx === MIN_EVENT_WIDTH_PX
        ) {
          newStartPx = originalStartPx + originalWidthPx - newWidthPx;
        }
        newStartPx = Math.max(0, newStartPx);
        eventBlock.style.left = `${newStartPx}px`;
        eventBlock.style.width = `${newWidthPx}px`;
      }
    }
  });

  document.addEventListener("mouseup", (e) => {
    if (isCreatingEvent) {
      isCreatingEvent = false;
      document.body.style.cursor = "default";

      if (ghostEventBlock) {
        const finalRectLeft = parseFloat(ghostEventBlock.style.left);
        const finalWidth = parseFloat(ghostEventBlock.style.width);

        if (ghostEventBlock.parentElement) {
          timelineEventsContainer.removeChild(ghostEventBlock);
        }
        ghostEventBlock = null;

        if (finalWidth < 10) return;

        const pixelsPerUnit =
          currentScope === "days" ? timelineScale / 60 : timelineScale;
        const startOffset = currentScope === "days" ? 0 : 1;

        let startUnit = snapToUnit(finalRectLeft / pixelsPerUnit + startOffset);
        let endUnit = snapToUnit(
          (finalRectLeft + finalWidth) / pixelsPerUnit + startOffset,
        );

        if (currentScope !== "days") {
          endUnit -= 1;
        }

        const MIN_DURATION = currentScope === "days" ? 15 : 1;
        if (endUnit <= startUnit) {
          endUnit = startUnit + MIN_DURATION;
        }

        const config = getTimelineConfig();
        startUnit = Math.max(startOffset, startUnit);
        endUnit = Math.min(config.totalUnits, endUnit);
        if (startUnit >= endUnit) return;

        openAddDialog();
        switch (currentScope) {
          case "weeks":
          case "months":
            eventStartDayInput.value = formatUnit(startUnit);
            eventEndDayInput.value = formatUnit(endUnit);
            break;
          case "years":
            eventStartMonthSelect.value = formatUnit(startUnit);
            eventEndMonthSelect.value = formatUnit(endUnit);
            break;
          default:
            eventStartTimeInput.value = formatUnit(startUnit);
            eventEndTimeInput.value = formatUnit(endUnit);
            break;
        }
      }
      return;
    }

    if (draggingEvent || resizingEvent) {
      const eventBlock = timelineEventsContainer.querySelector(
        `.event-block[data-event-id="${(draggingEvent || resizingEvent).id}"]`,
      );
      if (eventBlock) {
        if (draggingEvent) {
          const distMoved = Math.sqrt(
            Math.pow(e.clientX - mouseDownPos.x, 2) +
              Math.pow(e.clientY - mouseDownPos.y, 2),
          );
          if (distMoved < CLICK_THRESHOLD_PX) {
            openEditDialog(draggingEvent.id);
            draggingEvent = null;
          } else {
            historyManager.recordState(currentProjectId, getCurrentState());
            const pixelsPerUnit =
              currentScope === "days" ? timelineScale / 60 : timelineScale;
            const startOffset = currentScope === "days" ? 0 : 1;
            const newLeftPx = parseFloat(eventBlock.style.left);
            let newStartUnit = snapToUnit(
              newLeftPx / pixelsPerUnit + startOffset,
            );
            const duration =
              parseUnit(draggingEvent.end) - parseUnit(draggingEvent.start);
            let newEndUnit = newStartUnit + duration;
            draggingEvent.start = formatUnit(newStartUnit);
            draggingEvent.end = formatUnit(newEndUnit);
          }
        } else if (resizingEvent) {
          historyManager.recordState(currentProjectId, getCurrentState());
          const pixelsPerUnit =
            currentScope === "days" ? timelineScale / 60 : timelineScale;
          const startOffset = currentScope === "days" ? 0 : 1;
          const newLeftPx = parseFloat(eventBlock.style.left);
          const newWidthPx = parseFloat(eventBlock.style.width);

          let newStartUnit = snapToUnit(
            newLeftPx / pixelsPerUnit + startOffset,
          );
          let newEndUnit =
            snapToUnit((newLeftPx + newWidthPx) / pixelsPerUnit + startOffset) -
            (currentScope === "days" ? 0 : 1);

          if (newStartUnit >= newEndUnit) {
            if (resizeHandleType === "right") newEndUnit = newStartUnit;
            else newStartUnit = newEndUnit;
          }

          resizingEvent.start = formatUnit(newStartUnit);
          resizingEvent.end = formatUnit(newEndUnit);
        }
        saveCurrentProjectState();
        renderTimeline(true);
        renderEventList();
      }
    }

    if (draggingEvent || resizingEvent) {
      document.body.style.cursor = "default";
      timelineEventsContainer
        .querySelectorAll(".event-block")
        .forEach((block) => {
          block.style.cursor = "grab";
          block.style.zIndex = "10";
        });
    }
    draggingEvent = null;
    resizingEvent = null;
    resizeHandleType = null;
    mouseDownPos = null;
  });

  function handleExportData() {
    const dataToExport = {
      projectTitle: currentProjectTitle,
      events: events,
      maxDays: maxDays,
      scope: currentScope,
    };
    const jsonString = JSON.stringify(dataToExport, null, 2);
    const blob = new Blob([jsonString], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${
      currentProjectTitle.replace(/[^a-z0-9]/gi, "_").toLowerCase() ||
      "event-planner"
    }-data.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }

  function handleImportData(event) {
    const file = event.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const importedData = JSON.parse(e.target.result);

        if (importedData.events && importedData.events.length > 0) {
          if (
            importedData.events[0].startTime !== undefined &&
            importedData.events[0].start === undefined
          ) {
            importedData.scope = "days";
            importedData.events.forEach((event) => {
              event.start = event.startTime;
              event.end = event.endTime;
              delete event.startTime;
              delete event.endTime;
            });
          }
        }

        if (
          importedData &&
          Array.isArray(importedData.events) &&
          typeof importedData.maxDays === "number"
        ) {
          const importedTitleBase =
            importedData.projectTitle || "Imported Project";
          const uniqueImportedTitle = makeTitleUnique(importedTitleBase);
          const newProjectId = Date.now().toString();

          const newProjectEntry = {
            id: newProjectId,
            title: uniqueImportedTitle,
            data: {
              events: JSON.parse(JSON.stringify(importedData.events)),
              maxDays: importedData.maxDays,
              scope: importedData.scope || "days",
            },
          };
          savedProjects.push(newProjectEntry);
          localStorage.setItem(
            PROJECTS_STORAGE_KEY,
            JSON.stringify(savedProjects),
          );

          currentScope = importedData.scope || "days";
          events = JSON.parse(JSON.stringify(importedData.events));
          maxDays = importedData.maxDays || 1;
          currentProjectTitle = uniqueImportedTitle;
          currentProjectId = newProjectId;

          if (maxDays === 0) maxDays = 1;
          currentDay = 1;
          saveCurrentProjectState();
          updateScopeRadioOptions();
          renderAll();
          renderProjectTitleDisplay();
          closeMobileSidebar();
          FitTimelineOnPage();
        } else {
          showCustomAlert(
            "Invalid file format. Expected { projectTitle: (optional) string, events: [], maxDays: N, scope: (optional) string }",
            "Import Error",
          );
        }
      } catch (error) {
        showCustomAlert(
          "Error parsing JSON file: " + error.message,
          "Import Error",
        );
      } finally {
        importFileInput.value = null;
      }
    };
    reader.onerror = () => {
      showCustomAlert("Error reading file.", "Import Error");
      importFileInput.value = null;
    };
    reader.readAsText(file);
  }

  exportDataBtn.addEventListener("click", handleExportData);
  importDataBtn.addEventListener("click", () => importFileInput.click());
  importFileInput.addEventListener("change", handleImportData);

  exportDataBtnMobile.addEventListener("click", () => {
    handleExportData();
    closeMobileSidebar();
  });
  importDataBtnMobile.addEventListener("click", () => {
    importFileInput.click();
  });

  clearDayBtn.addEventListener("click", () => {
    const isDeleteAction = clearDayBtn.textContent.startsWith("Delete");
    const scopeLabel = getScopeLabel(null, true);

    if (isDeleteAction) {
      showCustomConfirm(
        `Do you really want to delete ${scopeLabel} ${currentDay}? This action cannot be undone.`,
        `Delete ${scopeLabel}`,
        () => {
          historyManager.recordState(currentProjectId, getCurrentState());
          const dayToDelete = currentDay;

          const eventsToKeep = [];
          events.forEach((event) => {
            if (event.day < dayToDelete) {
              eventsToKeep.push(event);
            } else if (event.day > dayToDelete) {
              event.day -= 1;
              eventsToKeep.push(event);
            }
          });
          events = eventsToKeep;

          maxDays -= 1;
          if (maxDays === 0) {
            maxDays = 1;
            currentDay = 1;
          } else if (currentDay > maxDays) {
            currentDay = maxDays;
          }
          currentDay = Math.max(1, currentDay);
          saveCurrentProjectState();
          updateScopeRadioOptions();
          renderAll(true);
          FitTimelineOnPage();
        },
      );
    } else {
      showCustomConfirm(
        `Do you really want to delete all events for ${scopeLabel} ${currentDay}? This action cannot be undone.`,
        `Clear ${scopeLabel} Events`,
        () => {
          historyManager.recordState(currentProjectId, getCurrentState());
          events = events.filter((event) => event.day !== currentDay);
          saveCurrentProjectState();
          renderAll(true);
          FitTimelineOnPage();
        },
      );
    }
  });

  function handleClearAllData() {
    const projectToClearName = currentProjectTitle;

    showCustomConfirm(
      `Are you sure you want to clear all events for "<strong>${projectToClearName}</strong>"? The project title will be kept, but all its scheduled events will be removed. This action cannot be undone.`,
      `Clear Events for ${projectToClearName}`,
      () => {
        historyManager.recordState(currentProjectId, getCurrentState());
        events = [];
        maxDays = 1;

        saveCurrentProjectState();

        updateScopeRadioOptions();
        renderAll(true);
        FitTimelineOnPage();
        closeMobileSidebar();
      },
    );
  }

  clearAllDataBtn.addEventListener("click", handleClearAllData);
  clearAllDataBtnMobile.addEventListener("click", handleClearAllData);

  function openMobileSidebar() {
    mobileSidebar.classList.add("open");
    sidebarOverlay.classList.add("open");
  }
  function closeMobileSidebar() {
    mobileSidebar.classList.remove("open");
    sidebarOverlay.classList.remove("open");
  }

  mobileMenuBtn.addEventListener("click", openMobileSidebar);
  sidebarOverlay.addEventListener("click", closeMobileSidebar);

  function openProjectsDialog() {
    dialogSelectedProjectId = null;
    dialogSelectedScope = currentScope;
    renderProjectsDialogScopeTabs();
    renderSavedProjectsList();
    loadSelectedProjectBtn.disabled = true;
    if (projectsDialog.showModal) projectsDialog.showModal();
  }

  function renderProjectsDialogScopeTabs() {
    const scopeTabsContainer = document.getElementById(
      "projects-dialog-scope-tabs",
    );
    scopeTabsContainer.innerHTML = "";
    const scopes = {
      days: "Days",
      weeks: "Weeks",
      months: "Months",
      years: "Years",
    };

    Object.entries(scopes).forEach(([scope, text]) => {
      const tab = document.createElement("button");
      tab.classList.add("day-tab");
      tab.dataset.scope = scope;
      tab.textContent = text;
      if (scope === dialogSelectedScope) {
        tab.classList.add("active");
      }
      tab.addEventListener("click", () => {
        dialogSelectedScope = scope;
        dialogSelectedProjectId = null;
        loadSelectedProjectBtn.disabled = true;
        renderProjectsDialogScopeTabs();
        renderSavedProjectsList();
      });
      scopeTabsContainer.appendChild(tab);
    });
  }

  newProjectBtn.addEventListener("click", () => {
    showCustomPrompt(
      "Enter a title for the new project:",
      "Create New Project",
      "",
      (newTitle) => {
        if (!newTitle) {
          showCustomAlert("Project title cannot be empty.", "Creation Error");
          return;
        }
        const uniqueNewTitle = makeTitleUnique(newTitle);

        historyManager.recordState(currentProjectId, getCurrentState());

        currentScope = dialogSelectedScope;
        events = [];
        maxDays = 1;
        currentDay = 1;
        currentProjectTitle = uniqueNewTitle;
        currentProjectId = Date.now().toString();

        const newProjectEntry = {
          id: currentProjectId,
          title: currentProjectTitle,
          data: { events: [], maxDays: 1, scope: currentScope },
        };
        savedProjects.push(newProjectEntry);
        localStorage.setItem(
          PROJECTS_STORAGE_KEY,
          JSON.stringify(savedProjects),
        );

        saveCurrentProjectState();

        renderProjectTitleDisplay();
        updateScopeRadioOptions();
        renderAll();
        FitTimelineOnPage();
        projectsDialog.close();
      },
    );
  });

  function renderSavedProjectsList() {
    savedProjectsListUI.innerHTML = "";
    const projectsForScope = savedProjects.filter(
      (p) => (p.data.scope || "days") === dialogSelectedScope,
    );

    if (projectsForScope.length === 0) {
      noSavedProjectsMsg.classList.remove("hidden");
      savedProjectsListUI.classList.add("hidden");
    } else {
      noSavedProjectsMsg.classList.add("hidden");
      savedProjectsListUI.classList.remove("hidden");
      projectsForScope.forEach((proj) => {
        const li = document.createElement("li");
        li.textContent = proj.title;
        li.dataset.projectId = proj.id;

        if (proj.id === currentProjectId) {
          li.classList.add("is-current-workspace");
        }
        if (proj.id === dialogSelectedProjectId) {
          li.classList.add("selected");
        }

        li.addEventListener("click", () => {
          if (dialogSelectedProjectId === proj.id) {
            dialogSelectedProjectId = null;
            li.classList.remove("selected");
            loadSelectedProjectBtn.disabled = true;
          } else {
            dialogSelectedProjectId = proj.id;
            Array.from(savedProjectsListUI.children).forEach((child) =>
              child.classList.remove("selected"),
            );
            li.classList.add("selected");
            loadSelectedProjectBtn.disabled = false;
          }
        });

        const deleteBtn = document.createElement("button");
        deleteBtn.textContent = "Delete";
        deleteBtn.classList.add("delete-project-btn");
        deleteBtn.title = `Delete project: ${proj.title}`;
        deleteBtn.addEventListener("click", (e) => {
          e.stopPropagation();
          showCustomConfirm(
            `Are you sure you want to delete project "<strong>${proj.title}</strong>"? This cannot be undone.`,
            "Delete Project",
            () => {
              deleteSavedProject(proj.id);
            },
          );
        });
        li.appendChild(deleteBtn);
        savedProjectsListUI.appendChild(li);
      });
    }
    if (!projectsForScope.find((p) => p.id === dialogSelectedProjectId)) {
      dialogSelectedProjectId = null;
      loadSelectedProjectBtn.disabled = true;
    }
  }

  function handleLoadSelectedProject() {
    if (!dialogSelectedProjectId) {
      showCustomAlert("No project selected to load.", "Load Error");
      return;
    }
    const projectToLoad = savedProjects.find(
      (proj) => proj.id === dialogSelectedProjectId,
    );
    if (!projectToLoad) {
      showCustomAlert("Selected project not found.", "Load Error");
      return;
    }

    events = JSON.parse(JSON.stringify(projectToLoad.data.events));
    maxDays = projectToLoad.data.maxDays;
    currentProjectTitle = projectToLoad.title;
    currentProjectId = projectToLoad.id;
    currentScope = projectToLoad.data.scope || "days";
    currentDay = 1;

    saveCurrentProjectState();
    updateScopeRadioOptions();
    renderAll();
    renderProjectTitleDisplay();
    FitTimelineOnPage();
    projectsDialog.close();
    dialogSelectedProjectId = null;
  }

  function deleteSavedProject(projectIdToDelete) {
    historyManager.deleteHistory(projectIdToDelete);
    savedProjects = savedProjects.filter(
      (proj) => proj.id !== projectIdToDelete,
    );
    localStorage.setItem(PROJECTS_STORAGE_KEY, JSON.stringify(savedProjects));

    if (currentProjectId === projectIdToDelete) {
      let nextProject = savedProjects.find(
        (p) => (p.data.scope || "days") === currentScope,
      );
      if (!nextProject && savedProjects.length > 0) {
        nextProject = savedProjects[0];
      }

      if (nextProject) {
        events = JSON.parse(JSON.stringify(nextProject.data.events));
        maxDays = nextProject.data.maxDays;
        currentProjectTitle = nextProject.title;
        currentProjectId = nextProject.id;
        currentScope = nextProject.data.scope || "days";
      } else {
        events = [];
        maxDays = 1;
        currentProjectTitle = "Untitled Project";
        currentScope = "days";
        const newId = Date.now().toString();
        currentProjectId = newId;
        savedProjects.push({
          id: newId,
          title: "Untitled Project",
          data: { events: [], maxDays: 1, scope: currentScope },
        });
        localStorage.setItem(
          PROJECTS_STORAGE_KEY,
          JSON.stringify(savedProjects),
        );
      }
      saveCurrentProjectState();
      renderProjectTitleDisplay();
      renderAll();
    }
    if (dialogSelectedProjectId === projectIdToDelete) {
      dialogSelectedProjectId = null;
      loadSelectedProjectBtn.disabled = true;
    }
    renderSavedProjectsList();
  }

  manageProjectsBtn.addEventListener("click", openProjectsDialog);
  if (manageProjectsBtnMobile) {
    manageProjectsBtnMobile.addEventListener("click", () => {
      openProjectsDialog();
      closeMobileSidebar();
    });
  }

  loadSelectedProjectBtn.addEventListener("click", handleLoadSelectedProject);
  cancelProjectsDialogBtn.addEventListener("click", () => {
    projectsDialog.close();
    dialogSelectedProjectId = null;
  });

  function renderAll(isAnimated = false) {
    renderScopeTabs();
    renderTimeline(isAnimated);
    renderEventList();
  }

  function openScopeDialog() {
    scopeRadioGroup.innerHTML = "";
    const scopes = {
      days: "Days",
      weeks: "Weeks",
      months: "Months",
      years: "Years",
    };

    Object.entries(scopes).forEach(([value, text]) => {
      const radioDiv = document.createElement("div");
      radioDiv.classList.add("radio-option");

      const input = document.createElement("input");
      input.type = "radio";
      input.name = "scope-type";
      input.id = `scope-type-${value}`;
      input.value = value;
      if (value === currentScope) {
        input.checked = true;
      }

      const label = document.createElement("label");
      label.htmlFor = `scope-type-${value}`;
      label.textContent = text;

      radioDiv.appendChild(input);
      radioDiv.appendChild(label);
      scopeRadioGroup.appendChild(radioDiv);
    });
    if (scopeDialog.showModal) scopeDialog.showModal();
  }

  changeScopeBtn.addEventListener("click", openScopeDialog);
  cancelScopeBtn.addEventListener("click", () => scopeDialog.close());

  scopeForm.addEventListener("submit", (e) => {
    e.preventDefault();
    const selectedScopeInput = scopeRadioGroup.querySelector(
      'input[name="scope-type"]:checked',
    );
    if (!selectedScopeInput) return;

    const selectedScope = selectedScopeInput.value;
    if (selectedScope === currentScope) {
      scopeDialog.close();
      return;
    }

    saveCurrentProjectState();

    currentScope = selectedScope;

    let projectToLoad = savedProjects.find(
      (p) => (p.data.scope || "days") === currentScope,
    );

    if (projectToLoad) {
      events = JSON.parse(JSON.stringify(projectToLoad.data.events));
      maxDays = projectToLoad.data.maxDays;
      currentProjectTitle = projectToLoad.title;
      currentProjectId = projectToLoad.id;
    } else {
      events = [];
      maxDays = 1;
      currentDay = 1;
      currentProjectTitle = "Untitled Project";
      currentProjectId = Date.now().toString();

      const newProjectEntry = {
        id: currentProjectId,
        title: currentProjectTitle,
        data: { events: [], maxDays: 1, scope: currentScope },
      };
      savedProjects.push(newProjectEntry);
      localStorage.setItem(PROJECTS_STORAGE_KEY, JSON.stringify(savedProjects));
    }

    saveCurrentProjectState();
    renderProjectTitleDisplay();
    updateScopeRadioOptions();
    renderAll();
    FitTimelineOnPage();
    scopeDialog.close();
  });

  loadAppSettings();
  loadSavedProjects();

  const storedCurrentDataText = localStorage.getItem("eventPlannerData");
  let initialLoadPerformed = false;

  if (storedCurrentDataText) {
    const storedCurrentData = JSON.parse(storedCurrentDataText);

    if (storedCurrentData.events && storedCurrentData.events.length > 0) {
      if (
        storedCurrentData.events[0].startTime !== undefined &&
        storedCurrentData.events[0].start === undefined
      ) {
        storedCurrentData.scope = "days";
        storedCurrentData.events.forEach((event) => {
          event.start = event.startTime;
          event.end = event.endTime;
          delete event.startTime;
          delete event.endTime;
        });
      }
    }

    const storedProjectId = storedCurrentData.projectId;
    const storedProjectTitle =
      storedCurrentData.projectTitle || "Untitled Project";
    currentScope = storedCurrentData.scope || "days";

    if (
      storedProjectId &&
      savedProjects.find((p) => p.id === storedProjectId)
    ) {
      const projectToLoad = savedProjects.find((p) => p.id === storedProjectId);
      events = JSON.parse(JSON.stringify(projectToLoad.data.events));
      maxDays = projectToLoad.data.maxDays;
      currentProjectTitle = projectToLoad.title;
      currentProjectId = projectToLoad.id;
      currentScope = projectToLoad.data.scope || "days";
      initialLoadPerformed = true;
    } else if (
      (storedCurrentData.events && storedCurrentData.events.length > 0) ||
      storedProjectTitle !== "Untitled Project" ||
      (storedCurrentData.maxDays && storedCurrentData.maxDays > 1)
    ) {
      const titleBase =
        storedProjectTitle === "Untitled Project"
          ? "Untitled Project"
          : storedProjectTitle;
      const uniqueTitle = makeTitleUnique(titleBase);
      const newId = Date.now().toString();

      currentProjectId = newId;
      currentProjectTitle = uniqueTitle;
      events = storedCurrentData.events || [];
      maxDays = storedCurrentData.maxDays || 1;
      currentScope = storedCurrentData.scope || "days";

      const newEntry = {
        id: currentProjectId,
        title: currentProjectTitle,
        data: {
          events: JSON.parse(JSON.stringify(events)),
          maxDays: maxDays,
          scope: currentScope,
        },
      };
      savedProjects.push(newEntry);
      localStorage.setItem(PROJECTS_STORAGE_KEY, JSON.stringify(savedProjects));
      initialLoadPerformed = true;
    }
  }

  if (!initialLoadPerformed) {
    let projectToLoad = savedProjects.find(
      (p) => (p.data.scope || "days") === currentScope,
    );
    if (!projectToLoad && savedProjects.length > 0) {
      projectToLoad = savedProjects[0];
    }

    if (projectToLoad) {
      events = JSON.parse(JSON.stringify(projectToLoad.data.events));
      maxDays = projectToLoad.data.maxDays;
      currentProjectTitle = projectToLoad.title;
      currentProjectId = projectToLoad.id;
      currentScope = projectToLoad.data.scope || "days";
    } else {
      const defaultId = Date.now().toString();
      currentProjectId = defaultId;
      currentProjectTitle = "Untitled Project";
      events = [];
      maxDays = 1;
      currentScope = "days";

      const defaultEntry = {
        id: currentProjectId,
        title: currentProjectTitle,
        data: {
          events: JSON.parse(JSON.stringify(events)),
          maxDays: maxDays,
          scope: currentScope,
        },
      };
      savedProjects.push(defaultEntry);
      localStorage.setItem(PROJECTS_STORAGE_KEY, JSON.stringify(savedProjects));
    }
  }

  if (maxDays === 0) maxDays = 1;
  currentDay = Math.min(currentDay, maxDays);
  currentDay = Math.max(1, currentDay);

  saveCurrentProjectState();
  updateScopeRadioOptions();
  renderProjectTitleDisplay();
  renderAll();
  FitTimelineOnPage();

  function handleUndo() {
    if (!historyManager.canUndo(currentProjectId)) return;
    const previousState = historyManager.undo(
      currentProjectId,
      getCurrentState(),
    );
    if (previousState) {
      applyState(previousState);
    }
  }

  function handleRedo() {
    if (!historyManager.canRedo(currentProjectId)) return;
    const nextState = historyManager.redo(currentProjectId, getCurrentState());
    if (nextState) {
      applyState(nextState);
    }
  }

  document.addEventListener("keydown", (e) => {
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

    if (e.ctrlKey || e.metaKey) {
      if (e.key.toLowerCase() === "z") {
        e.preventDefault();
        if (e.shiftKey) {
          handleRedo();
        } else {
          handleUndo();
        }
      } else if (e.key.toLowerCase() === "y") {
        e.preventDefault();
        handleRedo();
      }
    }
  });
}
