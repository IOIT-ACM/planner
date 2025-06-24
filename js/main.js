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
  const eventDayRadioGroup = document.getElementById("event-day-radio-group");
  const eventStartTimeInput = document.getElementById("event-start-time");
  const eventEndTimeInput = document.getElementById("event-end-time");
  const eventColorInput = document.getElementById("event-color");
  const eventLocationInput = document.getElementById("event-location");
  const eventNotesInput = document.getElementById("event-notes");

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

  let snapInterval = 15;
  let events = [];
  let currentDay = 1;
  let maxDays = 1;
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

  function getCurrentState() {
    return {
      events: JSON.parse(JSON.stringify(events)),
      maxDays: maxDays,
      projectTitle: currentProjectTitle,
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

    events = state.events;
    maxDays = state.maxDays;
    currentProjectTitle = state.projectTitle;

    saveCurrentProjectState();

    renderProjectTitleDisplay();
    updateDayRadioOptions();

    if (oldMaxDays !== maxDays) {
      renderDayTabs();
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
        console.error("Error parsing saved projects from localStorage:", e);
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

  function updateDayRadioOptions() {
    eventDayRadioGroup.innerHTML = "";
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
      label.textContent = `Day ${i}`;

      radioDiv.appendChild(input);
      radioDiv.appendChild(label);
      eventDayRadioGroup.appendChild(radioDiv);
    }
  }

  function renderDayTabs() {
    dayTabsContainer.innerHTML = "";
    for (let i = 1; i <= maxDays; i++) {
      const tab = document.createElement("button");
      tab.classList.add("day-tab");
      tab.dataset.day = i;
      tab.textContent = `Day ${i}`;
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
    addDayButton.title = "Add New Day";
    addDayButton.addEventListener("click", () => {
      historyManager.recordState(currentProjectId, getCurrentState());
      maxDays++;
      updateDayRadioOptions();
      saveCurrentProjectState();
      renderDayTabs();
    });
    dayTabsContainer.appendChild(addDayButton);
  }

  function getMinTimelineScale() {
    const wrapperWidth = timelineContainerWrapper.clientWidth;
    const timelineDurationHours = TIMELINE_END_HOUR - TIMELINE_START_HOUR;
    if (timelineDurationHours <= 0) return 30;
    return Math.max(10, wrapperWidth / timelineDurationHours);
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
        }</strong><br>${formatTimeForDisplay(
          currentEventData.startTime,
        )} - ${formatTimeForDisplay(currentEventData.endTime)}`;
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
    const isMobile = window.matchMedia("(max-width: 768px)").matches;
    const timelineDurationHours = TIMELINE_END_HOUR - TIMELINE_START_HOUR;
    const totalTimelineWidth = timelineDurationHours * timelineScale;

    timelineContainer.style.width = `${totalTimelineWidth}px`;

    const existingTicks = new Map(
      Array.from(timeRuler.querySelectorAll(".time-tick")).map((el) => [
        el.dataset.tickId,
        el,
      ]),
    );
    const processedTickIds = new Set();

    for (let hour = TIMELINE_START_HOUR; hour <= TIMELINE_END_HOUR; hour++) {
      const hourTickId = `h-${hour}`;
      processedTickIds.add(hourTickId);
      let tick = existingTicks.get(hourTickId);

      if (!tick) {
        tick = document.createElement("div");
        tick.classList.add("time-tick");
        tick.dataset.tickId = hourTickId;
        timeRuler.appendChild(tick);
      }

      const tickPosition = (hour - TIMELINE_START_HOUR) * timelineScale;
      tick.style.left = `${tickPosition}px`;

      let showLabelAndMajor = isMobile ? hour % 3 === 0 : true;

      if (showLabelAndMajor) {
        tick.classList.add("major");
        let label = tick.querySelector("span");
        if (!label) {
          label = document.createElement("span");
          tick.appendChild(label);
        }
        label.textContent = formatTimeForDisplay(
          `${String(hour % 24).padStart(2, "0")}:00`,
        );
      } else {
        tick.classList.remove("major");
        const label = tick.querySelector("span");
        if (label) label.remove();
      }

      if (hour < TIMELINE_END_HOUR) {
        for (let j = 1; j <= 3; j++) {
          const quarterTickId = `q-${hour}-${j}`;
          processedTickIds.add(quarterTickId);
          let quarterTick = existingTicks.get(quarterTickId);

          if (!quarterTick) {
            quarterTick = document.createElement("div");
            quarterTick.classList.add("time-tick");
            quarterTick.dataset.tickId = quarterTickId;
            timeRuler.appendChild(quarterTick);
          }
          const quarterPosition = tickPosition + (timelineScale / 4) * j;
          quarterTick.style.left = `${quarterPosition}px`;
        }
      }
    }

    existingTicks.forEach((tick, id) => {
      if (id && !processedTickIds.has(id)) {
        tick.remove();
      }
    });
  }

  function renderTimelineEvents(isAnimated = false) {
    const pixelsPerMinute = timelineScale / 60;
    const dayEvents = events.filter((event) => event.day === currentDay);

    dayEvents.sort(
      (a, b) =>
        parseTimeToMinutes(a.startTime) - parseTimeToMinutes(b.startTime),
    );

    const lanes = [];
    const eventLayouts = new Map();

    dayEvents.forEach((eventData) => {
      const startMinutes = parseTimeToMinutes(eventData.startTime);
      const endMinutes = getInterpretedEndMinutes(
        eventData.startTime,
        eventData.endTime,
      );

      if (startMinutes >= endMinutes) return;

      const eventStartOffset =
        (startMinutes - TIMELINE_START_HOUR * 60) * pixelsPerMinute;
      let eventWidth = (endMinutes - startMinutes) * pixelsPerMinute;
      if (eventWidth < MIN_EVENT_WIDTH_PX) eventWidth = MIN_EVENT_WIDTH_PX;

      let eventTop = 0;
      let placed = false;
      for (let i = 0; i < lanes.length; i++) {
        if (lanes[i] <= startMinutes) {
          eventTop = i * (EVENT_BLOCK_HEIGHT + EVENT_BLOCK_MARGIN);
          lanes[i] = endMinutes;
          placed = true;
          break;
        }
      }
      if (!placed) {
        eventTop = lanes.length * (EVENT_BLOCK_HEIGHT + EVENT_BLOCK_MARGIN);
        lanes.push(endMinutes);
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

    if (!isAnimated) {
      timelineEventsContainer.innerHTML = "";
      dayEvents.forEach((eventData) => {
        const layout = eventLayouts.get(eventData.id);
        if (!layout) return;
        const eventBlock = createEventBlockElement(eventData, layout);
        timelineEventsContainer.appendChild(eventBlock);
      });
      return;
    }

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
    currentDayListTitle.textContent = `Events for Day ${currentDay}`;
    const dayEvents = events
      .filter((event) => event.day === currentDay)
      .sort(
        (a, b) =>
          parseTimeToMinutes(a.startTime) - parseTimeToMinutes(b.startTime),
      );

    if (dayEvents.length === 0) {
      eventListUl.innerHTML = "<li>No events scheduled for this day.</li>";
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
        timeSpan.textContent = `${formatTimeForDisplay(
          event.startTime,
        )} - ${formatTimeForDisplay(event.endTime)}`;
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
    updateClearDayButtonState();
  }

  function updateClearDayButtonState() {
    const dayEvents = events.filter((event) => event.day === currentDay);
    clearDayBtn.classList.remove("hidden");

    if (currentDay === 1 && dayEvents.length === 0 && maxDays === 1) {
      clearDayBtn.classList.add("hidden");
    } else if (dayEvents.length === 0) {
      clearDayBtn.textContent = "Delete Day";
      clearDayBtn.title = `Delete Day ${currentDay}`;
    } else {
      clearDayBtn.textContent = "Clear Day";
      clearDayBtn.title = `Clear Events for Day ${currentDay}`;
    }
  }

  function openAddDialog() {
    dialogTitle.textContent = "Add Event";
    eventForm.reset();
    eventIdInput.value = "";
    updateDayRadioOptions();
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
    eventIdInput.value = event.id;
    eventTitleInput.value = event.title;
    updateDayRadioOptions();
    const radioToSelect = eventDayRadioGroup.querySelector(
      `input[value="${event.day}"]`,
    );
    if (radioToSelect) {
      radioToSelect.checked = true;
    }
    eventStartTimeInput.value = event.startTime;
    eventEndTimeInput.value = event.endTime;
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
    const startTimeValue = eventStartTimeInput.value;
    const endTimeValue = eventEndTimeInput.value;

    const startMinutes = parseTimeToMinutes(startTimeValue);
    const endMinutes = getInterpretedEndMinutes(startTimeValue, endTimeValue);

    if (startMinutes >= endMinutes) {
      showCustomAlert("End time must be after start time.", "Validation Error");
      return;
    }

    const selectedDayRadio = eventDayRadioGroup.querySelector(
      'input[name="event-day"]:checked',
    );
    if (!selectedDayRadio) {
      showCustomAlert("Please select a day for the event.", "Validation Error");
      return;
    }

    historyManager.recordState(currentProjectId, getCurrentState());

    const eventData = {
      id: id || Date.now().toString(),
      title: eventTitleInput.value,
      day: parseInt(selectedDayRadio.value),
      startTime: startTimeValue,
      endTime: endTimeValue,
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
    const idToDuplicate = eventIdInput.value;
    if (!idToDuplicate) return;

    const startTimeValue = eventStartTimeInput.value;
    const endTimeValue = eventEndTimeInput.value;

    const startMinutes = parseTimeToMinutes(startTimeValue);
    const endMinutes = getInterpretedEndMinutes(startTimeValue, endTimeValue);

    if (startMinutes >= endMinutes) {
      showCustomAlert(
        "End time must be after start time to duplicate.",
        "Validation Error",
      );
      return;
    }

    const selectedDayRadio = eventDayRadioGroup.querySelector(
      'input[name="event-day"]:checked',
    );
    if (!selectedDayRadio) {
      showCustomAlert(
        "Please select a day for the event to duplicate.",
        "Validation Error",
      );
      return;
    }

    historyManager.recordState(currentProjectId, getCurrentState());

    const newEvent = {
      id: Date.now().toString(),
      title: eventTitleInput.value,
      day: parseInt(selectedDayRadio.value),
      startTime: startTimeValue,
      endTime: endTimeValue,
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

    if (dayEvents.length === 0) {
      timelineScale = getMinTimelineScale();
      renderTimeline(true);
      timelineContainerWrapper.scrollLeft = 0;
    } else {
      let minEventStartMinutes = TIMELINE_END_HOUR * 60;
      let maxEventEndMinutes = TIMELINE_START_HOUR * 60;

      dayEvents.forEach((event) => {
        minEventStartMinutes = Math.min(
          minEventStartMinutes,
          parseTimeToMinutes(event.startTime),
        );
        maxEventEndMinutes = Math.max(
          maxEventEndMinutes,
          getInterpretedEndMinutes(event.startTime, event.endTime),
        );
      });

      const FIT_PADDING_MINUTES = 30;
      const MIN_FIT_VIEW_DURATION_MINUTES = 60;
      const FULL_DAY_MINUTES = (TIMELINE_END_HOUR - TIMELINE_START_HOUR) * 60;
      const eventActualSpanMinutes = maxEventEndMinutes - minEventStartMinutes;
      let targetViewDurationMinutes =
        eventActualSpanMinutes + 2 * FIT_PADDING_MINUTES;
      targetViewDurationMinutes = Math.max(
        targetViewDurationMinutes,
        MIN_FIT_VIEW_DURATION_MINUTES,
      );
      targetViewDurationMinutes = Math.min(
        targetViewDurationMinutes,
        FULL_DAY_MINUTES,
      );

      const eventCenterMinutes =
        (minEventStartMinutes + maxEventEndMinutes) / 2;
      let viewStartMinutes = eventCenterMinutes - targetViewDurationMinutes / 2;
      let viewEndMinutes = eventCenterMinutes + targetViewDurationMinutes / 2;

      if (viewStartMinutes < TIMELINE_START_HOUR * 60) {
        viewStartMinutes = TIMELINE_START_HOUR * 60;
        viewEndMinutes = Math.min(
          TIMELINE_END_HOUR * 60,
          viewStartMinutes + targetViewDurationMinutes,
        );
      }
      if (viewEndMinutes > TIMELINE_END_HOUR * 60) {
        viewEndMinutes = TIMELINE_END_HOUR * 60;
        viewStartMinutes = Math.max(
          TIMELINE_START_HOUR * 60,
          viewEndMinutes - targetViewDurationMinutes,
        );
      }

      const finalViewDurationMinutes = viewEndMinutes - viewStartMinutes;

      if (finalViewDurationMinutes <= 0) {
        timelineScale = getMinTimelineScale();
        renderTimeline(true);
        timelineContainerWrapper.scrollLeft = 0;
        return;
      }

      let newScale = (wrapperWidth * 60) / finalViewDurationMinutes;
      newScale = Math.max(getMinTimelineScale(), newScale);
      newScale = Math.min(300, newScale);
      timelineScale = newScale;
      renderTimeline(true);

      const scrollTargetPx =
        (viewStartMinutes - TIMELINE_START_HOUR * 60) * (timelineScale / 60);
      timelineContainerWrapper.scrollLeft = scrollTargetPx;
    }
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

      const pixelsPerMinute = timelineScale / 60;
      const totalTimelineWidthPx =
        (TIMELINE_END_HOUR - TIMELINE_START_HOUR) * 60 * pixelsPerMinute;
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

    const pixelsPerMinute = timelineScale / 60;
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
      const eventDurationMinutes =
        getInterpretedEndMinutes(
          draggingEvent.startTime,
          draggingEvent.endTime,
        ) - parseTimeToMinutes(draggingEvent.startTime);
      const maxLeftPx =
        (TIMELINE_END_HOUR - TIMELINE_START_HOUR) * 60 * pixelsPerMinute -
        eventDurationMinutes * pixelsPerMinute;
      newLeftPx = Math.min(newLeftPx, maxLeftPx);
      eventBlock.style.left = `${newLeftPx}px`;
    } else if (resizingEvent) {
      const eventBlock = timelineEventsContainer.querySelector(
        `.event-block[data-event-id="${resizingEvent.id}"]`,
      );
      if (!eventBlock) return;

      const originalStartMinutes = parseTimeToMinutes(resizingEvent.startTime);
      const originalEndMinutes = getInterpretedEndMinutes(
        resizingEvent.startTime,
        resizingEvent.endTime,
      );
      const originalStartPx =
        (originalStartMinutes - TIMELINE_START_HOUR * 60) * pixelsPerMinute;
      const originalWidthPx =
        (originalEndMinutes - originalStartMinutes) * pixelsPerMinute;

      if (resizeHandleType === "right") {
        let newWidthPx = mouseXInTimeline - originalStartPx;
        newWidthPx = Math.max(MIN_EVENT_WIDTH_PX, newWidthPx);
        const maxTimelinePx =
          (TIMELINE_END_HOUR - TIMELINE_START_HOUR) * 60 * pixelsPerMinute;
        if (originalStartPx + newWidthPx > maxTimelinePx) {
          newWidthPx = maxTimelinePx - originalStartPx;
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

        const minPixelWidthToCreateEvent = 10;
        if (finalWidth < minPixelWidthToCreateEvent) {
          return;
        }

        const pixelsPerMinute = timelineScale / 60;
        let startMinutes = Math.round(
          finalRectLeft / pixelsPerMinute + TIMELINE_START_HOUR * 60,
        );
        let endMinutes = Math.round(
          (finalRectLeft + finalWidth) / pixelsPerMinute +
            TIMELINE_START_HOUR * 60,
        );

        startMinutes = snapToNearestQuarterHour(startMinutes, snapInterval);
        endMinutes = snapToNearestQuarterHour(endMinutes, snapInterval);

        const MIN_CREATION_DURATION_MINUTES = 15;
        if (endMinutes <= startMinutes) {
          endMinutes = startMinutes + MIN_CREATION_DURATION_MINUTES;
        } else if (endMinutes - startMinutes < MIN_CREATION_DURATION_MINUTES) {
          endMinutes = startMinutes + MIN_CREATION_DURATION_MINUTES;
        }

        startMinutes = Math.max(TIMELINE_START_HOUR * 60, startMinutes);
        endMinutes = Math.min(TIMELINE_END_HOUR * 60, endMinutes);

        if (endMinutes <= startMinutes) {
          return;
        }

        const startTimeStr = formatMinutesToTime(startMinutes);
        const endTimeStr =
          endMinutes === TIMELINE_END_HOUR * 60
            ? "00:00"
            : formatMinutesToTime(endMinutes);

        openAddDialog();
        eventStartTimeInput.value = startTimeStr;
        eventEndTimeInput.value = endTimeStr;

        const radioToSelect = eventDayRadioGroup.querySelector(
          `input[value="${currentDay}"]`,
        );
        if (radioToSelect) {
          radioToSelect.checked = true;
        } else {
          const firstRadio = eventDayRadioGroup.querySelector(
            'input[type="radio"]',
          );
          if (firstRadio) firstRadio.checked = true;
        }
      }
      return;
    }

    if (draggingEvent) {
      const eventBlock = timelineEventsContainer.querySelector(
        `.event-block[data-event-id="${draggingEvent.id}"]`,
      );
      if (eventBlock) {
        const distMoved = Math.sqrt(
          Math.pow(e.clientX - mouseDownPos.x, 2) +
            Math.pow(e.clientY - mouseDownPos.y, 2),
        );

        if (distMoved < CLICK_THRESHOLD_PX) {
          openEditDialog(draggingEvent.id);
          eventBlock.style.cursor = "grab";
          eventBlock.style.zIndex = "10";
          draggingEvent = null;
          mouseDownPos = null;
          document.body.style.cursor = "default";
          renderTimeline();
          return;
        }

        historyManager.recordState(currentProjectId, getCurrentState());

        const pixelsPerMinute = timelineScale / 60;
        const newLeftPx = parseFloat(eventBlock.style.left);
        const eventDurationMinutes =
          getInterpretedEndMinutes(
            draggingEvent.startTime,
            draggingEvent.endTime,
          ) - parseTimeToMinutes(draggingEvent.startTime);
        let newStartMinutes =
          Math.round(newLeftPx / pixelsPerMinute) + TIMELINE_START_HOUR * 60;
        newStartMinutes = snapToNearestQuarterHour(
          newStartMinutes,
          snapInterval,
        );
        newStartMinutes = Math.max(TIMELINE_START_HOUR * 60, newStartMinutes);
        let newEndMinutes = newStartMinutes + eventDurationMinutes;

        if (newEndMinutes > TIMELINE_END_HOUR * 60) {
          newEndMinutes = TIMELINE_END_HOUR * 60;
          newStartMinutes = newEndMinutes - eventDurationMinutes;
          newStartMinutes = snapToNearestQuarterHour(
            newStartMinutes,
            snapInterval,
          );
          newStartMinutes = Math.max(TIMELINE_START_HOUR * 60, newStartMinutes);
        }

        draggingEvent.startTime = formatMinutesToTime(newStartMinutes);
        if (newEndMinutes === TIMELINE_END_HOUR * 60) {
          draggingEvent.endTime = "00:00";
        } else {
          draggingEvent.endTime = formatMinutesToTime(newEndMinutes);
        }
        saveCurrentProjectState();
        renderTimeline(true);
        renderEventList();
      }
    } else if (resizingEvent) {
      const eventBlock = timelineEventsContainer.querySelector(
        `.event-block[data-event-id="${resizingEvent.id}"]`,
      );
      if (eventBlock) {
        historyManager.recordState(currentProjectId, getCurrentState());
        const pixelsPerMinute = timelineScale / 60;
        const newStartPx = parseFloat(eventBlock.style.left);
        const newWidthPx = parseFloat(eventBlock.style.width);
        let tentativeStartMinutes =
          Math.round(newStartPx / pixelsPerMinute) + TIMELINE_START_HOUR * 60;
        let tentativeEndMinutes =
          Math.round((newStartPx + newWidthPx) / pixelsPerMinute) +
          TIMELINE_START_HOUR * 60;
        let finalStartMinutes, finalEndMinutes;
        const originalEventStartMinutes = parseTimeToMinutes(
          resizingEvent.startTime,
        );
        const originalEventEndMinutes = getInterpretedEndMinutes(
          resizingEvent.startTime,
          resizingEvent.endTime,
        );
        const MIN_RESIZE_DURATION_MINUTES = 15;

        if (resizeHandleType === "left") {
          finalStartMinutes = snapToNearestQuarterHour(
            tentativeStartMinutes,
            snapInterval,
          );
          finalEndMinutes = originalEventEndMinutes;
        } else {
          finalStartMinutes = originalEventStartMinutes;
          finalEndMinutes = snapToNearestQuarterHour(
            tentativeEndMinutes,
            snapInterval,
          );
        }

        finalStartMinutes = Math.max(
          TIMELINE_START_HOUR * 60,
          finalStartMinutes,
        );
        finalEndMinutes = Math.min(TIMELINE_END_HOUR * 60, finalEndMinutes);

        if (finalEndMinutes - finalStartMinutes < MIN_RESIZE_DURATION_MINUTES) {
          if (resizeHandleType === "right") {
            finalEndMinutes = finalStartMinutes + MIN_RESIZE_DURATION_MINUTES;
            finalEndMinutes = snapToNearestQuarterHour(
              finalEndMinutes,
              snapInterval,
            );
          } else {
            finalStartMinutes = finalEndMinutes - MIN_RESIZE_DURATION_MINUTES;
            finalStartMinutes = snapToNearestQuarterHour(
              finalStartMinutes,
              snapInterval,
            );
          }
          finalStartMinutes = Math.max(
            TIMELINE_START_HOUR * 60,
            finalStartMinutes,
          );
          finalEndMinutes = Math.min(TIMELINE_END_HOUR * 60, finalEndMinutes);
        }

        if (finalStartMinutes >= finalEndMinutes) {
          if (resizeHandleType === "right") {
            finalStartMinutes = originalEventStartMinutes;
            finalEndMinutes = snapToNearestQuarterHour(
              finalStartMinutes + MIN_RESIZE_DURATION_MINUTES,
              snapInterval,
            );
          } else {
            finalEndMinutes = originalEventEndMinutes;
            finalStartMinutes = snapToNearestQuarterHour(
              finalEndMinutes - MIN_RESIZE_DURATION_MINUTES,
              snapInterval,
            );
          }
          finalStartMinutes = Math.max(
            TIMELINE_START_HOUR * 60,
            finalStartMinutes,
          );
          finalEndMinutes = Math.min(TIMELINE_END_HOUR * 60, finalEndMinutes);
          if (finalStartMinutes >= finalEndMinutes) {
            if (resizeHandleType === "right")
              finalEndMinutes = finalStartMinutes + MIN_RESIZE_DURATION_MINUTES;
            else
              finalStartMinutes = finalEndMinutes - MIN_RESIZE_DURATION_MINUTES;
          }
        }

        resizingEvent.startTime = formatMinutesToTime(finalStartMinutes);
        if (finalEndMinutes === TIMELINE_END_HOUR * 60) {
          resizingEvent.endTime = "00:00";
        } else {
          resizingEvent.endTime = formatMinutesToTime(finalEndMinutes);
        }
        saveCurrentProjectState();
        renderTimeline(true);
        renderEventList();
      }
    }

    if (draggingEvent || resizingEvent) {
      document.body.style.cursor = "default";
      const allEventBlocks =
        timelineEventsContainer.querySelectorAll(".event-block");
      allEventBlocks.forEach((block) => {
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
            },
          };
          savedProjects.push(newProjectEntry);
          localStorage.setItem(
            PROJECTS_STORAGE_KEY,
            JSON.stringify(savedProjects),
          );

          events = JSON.parse(JSON.stringify(importedData.events));
          maxDays = importedData.maxDays || 1;
          currentProjectTitle = uniqueImportedTitle;
          currentProjectId = newProjectId;

          if (maxDays === 0) maxDays = 1;
          currentDay = 1;
          saveCurrentProjectState();
          updateDayRadioOptions();
          renderAll();
          renderProjectTitleDisplay();
          closeMobileSidebar();
          FitTimelineOnPage();
        } else {
          showCustomAlert(
            "Invalid file format. Expected { projectTitle: (optional) string, events: [], maxDays: N }",
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
    const isDeleteAction = clearDayBtn.textContent === "Delete Day";

    if (isDeleteAction) {
      showCustomConfirm(
        `Do you really want to delete Day ${currentDay}? This action cannot be undone.`,
        "Delete Day",
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
          updateDayRadioOptions();
          renderAll(true);
          FitTimelineOnPage();
        },
      );
    } else {
      showCustomConfirm(
        `Do you really want to delete all events for Day ${currentDay}? This action cannot be undone.`,
        "Clear Day Events",
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

        updateDayRadioOptions();
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
    renderSavedProjectsList();
    loadSelectedProjectBtn.disabled = true;
    if (projectsDialog.showModal) projectsDialog.showModal();
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

        events = [];
        maxDays = 1;
        currentDay = 1;
        currentProjectTitle = uniqueNewTitle;
        currentProjectId = Date.now().toString();

        const newProjectEntry = {
          id: currentProjectId,
          title: currentProjectTitle,
          data: { events: [], maxDays: 1 },
        };
        savedProjects.push(newProjectEntry);
        localStorage.setItem(
          PROJECTS_STORAGE_KEY,
          JSON.stringify(savedProjects),
        );

        saveCurrentProjectState();

        renderProjectTitleDisplay();
        updateDayRadioOptions();
        renderAll();
        FitTimelineOnPage();

        renderSavedProjectsList();

        dialogSelectedProjectId = currentProjectId;
        loadSelectedProjectBtn.disabled = false;

        const listItem = savedProjectsListUI.querySelector(
          `li[data-project-id="${currentProjectId}"]`,
        );
        if (listItem) {
          Array.from(savedProjectsListUI.children).forEach((child) =>
            child.classList.remove("selected", "is-current-workspace"),
          );
          listItem.classList.add("selected", "is-current-workspace");
        }
      },
    );
  });

  function renderSavedProjectsList() {
    savedProjectsListUI.innerHTML = "";
    if (savedProjects.length === 0) {
      noSavedProjectsMsg.classList.remove("hidden");
      savedProjectsListUI.classList.add("hidden");
    } else {
      noSavedProjectsMsg.classList.add("hidden");
      savedProjectsListUI.classList.remove("hidden");
      savedProjects.forEach((proj) => {
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
    if (!savedProjects.find((p) => p.id === dialogSelectedProjectId)) {
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
    currentDay = 1;

    saveCurrentProjectState();
    updateDayRadioOptions();
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
      if (savedProjects.length > 0) {
        const firstProject = savedProjects[0];
        events = JSON.parse(JSON.stringify(firstProject.data.events));
        maxDays = firstProject.data.maxDays;
        currentProjectTitle = firstProject.title;
        currentProjectId = firstProject.id;
      } else {
        events = [];
        maxDays = 1;
        currentProjectTitle = "Untitled Project";
        const newId = Date.now().toString();
        currentProjectId = newId;
        savedProjects.push({
          id: newId,
          title: "Untitled Project",
          data: { events: [], maxDays: 1 },
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
    renderDayTabs();
    renderTimeline(isAnimated);
    renderEventList();
  }

  loadAppSettings();
  loadSavedProjects();

  const storedCurrentDataText = localStorage.getItem("eventPlannerData");
  let initialLoadPerformed = false;

  if (storedCurrentDataText) {
    const storedCurrentData = JSON.parse(storedCurrentDataText);
    const storedProjectId = storedCurrentData.projectId;
    const storedProjectTitle =
      storedCurrentData.projectTitle || "Untitled Project";

    if (
      storedProjectId &&
      savedProjects.find((p) => p.id === storedProjectId)
    ) {
      const projectToLoad = savedProjects.find((p) => p.id === storedProjectId);
      events = JSON.parse(JSON.stringify(projectToLoad.data.events));
      maxDays = projectToLoad.data.maxDays;
      currentProjectTitle = projectToLoad.title;
      currentProjectId = projectToLoad.id;
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

      const newEntry = {
        id: currentProjectId,
        title: currentProjectTitle,
        data: { events: JSON.parse(JSON.stringify(events)), maxDays: maxDays },
      };
      savedProjects.push(newEntry);
      localStorage.setItem(PROJECTS_STORAGE_KEY, JSON.stringify(savedProjects));
      initialLoadPerformed = true;
    }
  }

  if (!initialLoadPerformed) {
    if (savedProjects.length > 0) {
      const firstProject = savedProjects[0];
      events = JSON.parse(JSON.stringify(firstProject.data.events));
      maxDays = firstProject.data.maxDays;
      currentProjectTitle = firstProject.title;
      currentProjectId = firstProject.id;
    } else {
      const defaultId = Date.now().toString();
      currentProjectId = defaultId;
      currentProjectTitle = "Untitled Project";
      events = [];
      maxDays = 1;

      const defaultEntry = {
        id: currentProjectId,
        title: currentProjectTitle,
        data: { events: JSON.parse(JSON.stringify(events)), maxDays: maxDays },
      };
      savedProjects.push(defaultEntry);
      localStorage.setItem(PROJECTS_STORAGE_KEY, JSON.stringify(savedProjects));
    }
  }

  if (maxDays === 0) maxDays = 1;
  currentDay = Math.min(currentDay, maxDays);
  currentDay = Math.max(1, currentDay);

  saveCurrentProjectState();
  updateDayRadioOptions();
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
      (activeEl.tagName === "INPUT" || activeEl.tagName === "TEXTAREA")
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
