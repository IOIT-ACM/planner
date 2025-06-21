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

  let events = [];
  let currentDay = 1;
  let maxDays = 1;
  let timelineScale = 60;
  const TIMELINE_START_HOUR = 0;
  const TIMELINE_END_HOUR = 24;
  const MIN_EVENT_WIDTH_PX = 20;
  const CLICK_THRESHOLD_PX = 5;

  let draggingEvent = null;
  let resizingEvent = null;
  let dragOffsetX = 0;
  let resizeHandleType = null;
  let initialEventRect = null;
  let mouseDownPos = null;

  function saveEvents() {
    localStorage.setItem(
      "eventPlannerData",
      JSON.stringify({ events, maxDays }),
    );
  }

  function loadEvents() {
    const storedData = localStorage.getItem("eventPlannerData");
    if (storedData) {
      const parsedData = JSON.parse(storedData);
      events = parsedData.events || [];
      maxDays = parsedData.maxDays || 1;
      if (maxDays === 0) maxDays = 1;
      currentDay = Math.min(currentDay, maxDays);
      currentDay = Math.max(1, currentDay);
    }
    updateDayRadioOptions();
  }

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
      });
      dayTabsContainer.appendChild(tab);
    }
    const addDayButton = document.createElement("button");
    addDayButton.id = "add-day-btn";
    addDayButton.textContent = "+";
    addDayButton.title = "Add New Day";
    addDayButton.addEventListener("click", () => {
      maxDays++;
      updateDayRadioOptions();
      saveEvents();
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

  function renderTimeline() {
    const isMobile = window.matchMedia("(max-width: 768px)").matches;

    const pixelsPerMinute = timelineScale / 60;
    const timelineDurationHours = TIMELINE_END_HOUR - TIMELINE_START_HOUR;
    const totalTimelineWidth = timelineDurationHours * timelineScale;

    timelineContainer.style.width = `${totalTimelineWidth}px`;
    timeRuler.innerHTML = "";
    timelineEventsContainer.innerHTML = "";

    for (let hour = TIMELINE_START_HOUR; hour <= TIMELINE_END_HOUR; hour++) {
      const tick = document.createElement("div");
      tick.classList.add("time-tick");
      const tickPosition = (hour - TIMELINE_START_HOUR) * timelineScale;
      tick.style.left = `${tickPosition}px`;

      let showLabelAndMajor = false;
      if (isMobile) {
        if (hour % 3 === 0) {
          showLabelAndMajor = true;
        }
      } else {
        showLabelAndMajor = true;
      }

      if (showLabelAndMajor) {
        tick.classList.add("major");
        const label = document.createElement("span");
        label.textContent = formatTimeForDisplay(
          `${String(hour % 24).padStart(2, "0")}:00`,
        );
        tick.appendChild(label);
      }

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

    const dayEvents = events.filter((event) => event.day === currentDay);
    const eventHeight = 40;
    const eventMargin = 5;
    let maxBottom = 100;

    dayEvents.sort(
      (a, b) =>
        parseTimeToMinutes(a.startTime) - parseTimeToMinutes(b.startTime),
    );

    const lanes = [];

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

      const eventBlock = document.createElement("div");
      eventBlock.classList.add("event-block");
      eventBlock.dataset.eventId = eventData.id;
      eventBlock.style.backgroundColor = eventData.color;
      eventBlock.style.borderColor = darkenColor(eventData.color, 20);
      eventBlock.style.left = `${eventStartOffset}px`;
      eventBlock.style.width = `${eventWidth}px`;

      let placed = false;
      for (let i = 0; i < lanes.length; i++) {
        if (lanes[i] <= startMinutes) {
          eventBlock.style.top = `${i * (eventHeight + eventMargin)}px`;
          lanes[i] = endMinutes;
          placed = true;
          break;
        }
      }
      if (!placed) {
        eventBlock.style.top = `${
          lanes.length * (eventHeight + eventMargin)
        }px`;
        lanes.push(endMinutes);
      }

      const titleSpan = document.createElement("span");
      titleSpan.classList.add("event-block-title");
      titleSpan.textContent = eventData.title;
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

      timelineEventsContainer.appendChild(eventBlock);
      maxBottom = Math.max(
        maxBottom,
        parseFloat(eventBlock.style.top) + eventHeight + eventMargin,
      );
    });
    timelineEventsContainer.style.height = `${maxBottom}px`;
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
          const targetEvent = events.find((ev) => ev.id === event.id);
          if (targetEvent) {
            targetEvent.color = e.target.value;
            saveEvents();
            renderTimeline();
            const timelineBlock = timelineEventsContainer.querySelector(
              `.event-block[data-event-id="${event.id}"]`,
            );
            if (timelineBlock) {
              timelineBlock.style.backgroundColor = e.target.value;
              timelineBlock.style.borderColor = darkenColor(e.target.value, 20);
            }
          }
        });
        li.appendChild(colorInput);

        const actionsSpan = document.createElement("span");
        actionsSpan.classList.add("event-actions");

        const editBtn = document.createElement("button");
        editBtn.innerHTML = "✏️";
        editBtn.title = "Edit Event";
        editBtn.addEventListener("click", () => openEditDialog(event.id));
        actionsSpan.appendChild(editBtn);

        const deleteListBtn = document.createElement("button");
        deleteListBtn.innerHTML = "🗑️";
        deleteListBtn.title = "Delete Event";
        deleteListBtn.addEventListener("click", () => {
          showCustomConfirm(
            `Are you sure you want to delete the event "<strong>${event.title}</strong>"?`,
            "Delete Event",
            () => {
              events = events.filter((ev) => ev.id !== event.id);
              saveEvents();
              renderAll();
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
    saveEvents();
    renderAll();
    eventDialog.close();
  });

  deleteEventBtn.addEventListener("click", () => {
    const id = eventIdInput.value;
    if (id) {
      showCustomConfirm(
        "Are you sure you want to delete this event?",
        "Delete Event",
        () => {
          events = events.filter((event) => event.id !== id);
          saveEvents();
          renderAll();
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

    const newEvent = {
      id: Date.now().toString(),
      title: eventTitleInput.value + " (Copy)",
      day: parseInt(selectedDayRadio.value),
      startTime: startTimeValue,
      endTime: endTimeValue,
      color: eventColorInput.value,
      location: eventLocationInput.value,
      notes: eventNotesInput.value,
    };

    events.push(newEvent);
    saveEvents();
    renderAll();
    eventDialog.close();
  });

  addEventBtn.addEventListener("click", openAddDialog);
  cancelEventBtn.addEventListener("click", () => eventDialog.close());

  zoomInBtn.addEventListener("click", () => {
    timelineScale = Math.min(300, timelineScale + 20);
    renderTimeline();
  });

  zoomOutBtn.addEventListener("click", () => {
    const minScale = getMinTimelineScale();
    timelineScale = Math.max(minScale, timelineScale - 20);
    renderTimeline();
  });

  function FitTimelineOnPage() {
    const dayEvents = events.filter((event) => event.day === currentDay);
    const wrapperWidth = timelineContainerWrapper.clientWidth;

    if (dayEvents.length === 0) {
      timelineScale = getMinTimelineScale();
      renderTimeline();
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
        renderTimeline();
        timelineContainerWrapper.scrollLeft = 0;
        return;
      }

      let newScale = (wrapperWidth * 60) / finalViewDurationMinutes;
      newScale = Math.max(getMinTimelineScale(), newScale);
      newScale = Math.min(300, newScale);
      timelineScale = newScale;
      renderTimeline();

      const scrollTargetPx =
        (viewStartMinutes - TIMELINE_START_HOUR * 60) * (timelineScale / 60);
      timelineContainerWrapper.scrollLeft = scrollTargetPx;
    }
  }

  fitTimelineBtn.addEventListener("click", FitTimelineOnPage);

  timelineEventsContainer.addEventListener("mousedown", (e) => {
    const eventBlock = e.target.closest(".event-block");
    if (!eventBlock) return;

    const eventId = eventBlock.dataset.eventId;
    const event = events.find((ev) => ev.id === eventId);
    if (!event) return;

    initialEventRect = eventBlock.getBoundingClientRect();
    mouseDownPos = { x: e.clientX, y: e.clientY };

    if (e.target.classList.contains("resize-handle")) {
      resizingEvent = event;
      resizeHandleType = e.target.classList.contains("left") ? "left" : "right";
      document.body.style.cursor = "ew-resize";
    } else {
      draggingEvent = event;
      dragOffsetX = e.clientX - initialEventRect.left;
      eventBlock.style.cursor = "grabbing";
      eventBlock.style.zIndex = "1000";
    }
    e.preventDefault();
  });

  document.addEventListener("mousemove", (e) => {
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

        if (newStartPx + newWidthPx > originalStartPx + originalWidthPx) {
          newStartPx = originalStartPx + originalWidthPx - newWidthPx;
        }
        newStartPx = Math.max(0, newStartPx);
        eventBlock.style.left = `${newStartPx}px`;
        eventBlock.style.width = `${newWidthPx}px`;
      }
    }
  });

  document.addEventListener("mouseup", (e) => {
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
          renderAll();
          return;
        }

        const pixelsPerMinute = timelineScale / 60;
        const newLeftPx = parseFloat(eventBlock.style.left);
        const eventDurationMinutes =
          getInterpretedEndMinutes(
            draggingEvent.startTime,
            draggingEvent.endTime,
          ) - parseTimeToMinutes(draggingEvent.startTime);
        let newStartMinutes =
          Math.round(newLeftPx / pixelsPerMinute) + TIMELINE_START_HOUR * 60;
        newStartMinutes = snapToNearestQuarterHour(newStartMinutes);
        newStartMinutes = Math.max(TIMELINE_START_HOUR * 60, newStartMinutes);
        let newEndMinutes = newStartMinutes + eventDurationMinutes;

        if (newEndMinutes > TIMELINE_END_HOUR * 60) {
          newEndMinutes = TIMELINE_END_HOUR * 60;
          newStartMinutes = newEndMinutes - eventDurationMinutes;
          newStartMinutes = snapToNearestQuarterHour(newStartMinutes);
          newStartMinutes = Math.max(TIMELINE_START_HOUR * 60, newStartMinutes);
        }

        draggingEvent.startTime = formatMinutesToTime(newStartMinutes);
        if (newEndMinutes === TIMELINE_END_HOUR * 60) {
          draggingEvent.endTime = "00:00";
        } else {
          draggingEvent.endTime = formatMinutesToTime(newEndMinutes);
        }
        eventBlock.style.cursor = "grab";
        eventBlock.style.zIndex = "10";
        saveEvents();
        renderAll();
      }
    } else if (resizingEvent) {
      const eventBlock = timelineEventsContainer.querySelector(
        `.event-block[data-event-id="${resizingEvent.id}"]`,
      );
      if (eventBlock) {
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
          finalStartMinutes = snapToNearestQuarterHour(tentativeStartMinutes);
          finalEndMinutes = originalEventEndMinutes;
        } else {
          finalStartMinutes = originalEventStartMinutes;
          finalEndMinutes = snapToNearestQuarterHour(tentativeEndMinutes);
        }

        finalStartMinutes = Math.max(
          TIMELINE_START_HOUR * 60,
          finalStartMinutes,
        );
        finalEndMinutes = Math.min(TIMELINE_END_HOUR * 60, finalEndMinutes);

        if (finalEndMinutes - finalStartMinutes < MIN_RESIZE_DURATION_MINUTES) {
          if (resizeHandleType === "right") {
            finalEndMinutes = finalStartMinutes + MIN_RESIZE_DURATION_MINUTES;
            finalEndMinutes = snapToNearestQuarterHour(finalEndMinutes);
          } else {
            finalStartMinutes = finalEndMinutes - MIN_RESIZE_DURATION_MINUTES;
            finalStartMinutes = snapToNearestQuarterHour(finalStartMinutes);
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
            );
          } else {
            finalEndMinutes = originalEventEndMinutes;
            finalStartMinutes = snapToNearestQuarterHour(
              finalEndMinutes - MIN_RESIZE_DURATION_MINUTES,
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
        saveEvents();
        renderAll();
      }
    }

    draggingEvent = null;
    resizingEvent = null;
    resizeHandleType = null;
    mouseDownPos = null;
    document.body.style.cursor = "default";
    const allEventBlocks =
      timelineEventsContainer.querySelectorAll(".event-block");
    allEventBlocks.forEach((block) => {
      block.style.cursor = "grab";
      block.style.zIndex = "10";
    });
  });

  function handleExportData() {
    const dataToExport = {
      events: events,
      maxDays: maxDays,
    };
    const jsonString = JSON.stringify(dataToExport, null, 2);
    const blob = new Blob([jsonString], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "event-planner-data.json";
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
          showCustomConfirm(
            "Importing this file will overwrite current data. Continue?",
            "Import Data",
            () => {
              events = importedData.events;
              maxDays = importedData.maxDays || 1;
              if (maxDays === 0) maxDays = 1;
              currentDay = 1;
              saveEvents();
              updateDayRadioOptions();
              renderAll();
              closeMobileSidebar();
              FitTimelineOnPage();
            },
          );
        } else {
          showCustomAlert(
            "Invalid file format. Expected { events: [], maxDays: N }",
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
          saveEvents();
          updateDayRadioOptions();
          renderAll();
        },
      );
    } else {
      showCustomConfirm(
        `Do you really want to delete all events for Day ${currentDay}? This action cannot be undone.`,
        "Clear Day Events",
        () => {
          events = events.filter((event) => event.day !== currentDay);
          saveEvents();
          renderAll();
        },
      );
    }
  });

  function handleClearAllData() {
    showCustomConfirm(
      "Do you really want to delete ALL data for ALL days? This action cannot be undone and will reset the planner.",
      "Clear All Data",
      () => {
        events = [];
        maxDays = 1;
        currentDay = 1;
        saveEvents();
        updateDayRadioOptions();
        renderAll();
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

  function renderAll() {
    renderDayTabs();
    renderTimeline();
    renderEventList();
  }

  loadEvents();
  renderAll();
  FitTimelineOnPage();
}
