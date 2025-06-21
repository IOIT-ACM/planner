document.addEventListener("DOMContentLoaded", () => {
  const addEventBtn = document.getElementById("add-event-btn");
  const eventDialog = document.getElementById("event-dialog");
  const eventForm = document.getElementById("event-form");
  const cancelEventBtn = document.getElementById("cancel-event-btn");
  const deleteEventBtn = document.getElementById("delete-event-btn");
  const dialogTitle = document.getElementById("dialog-title");
  const eventIdInput = document.getElementById("event-id");
  const eventTitleInput = document.getElementById("event-title-input");
  const eventDaySelect = document.getElementById("event-day-select");
  const eventStartTimeInput = document.getElementById("event-start-time");
  const eventEndTimeInput = document.getElementById("event-end-time");
  const eventCategoryInput = document.getElementById("event-category");
  const eventColorInput = document.getElementById("event-color");
  const eventSpeakerInput = document.getElementById("event-speaker");
  const eventLocationInput = document.getElementById("event-location");
  const eventNotesInput = document.getElementById("event-notes");
  const eventAttachmentsInput = document.getElementById("event-attachments");

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

  let events = [];
  let currentDay = 1;
  let maxDays = 1;
  let timelineScale = 60;
  const TIMELINE_START_HOUR = 0;
  const TIMELINE_END_HOUR = 24;
  const MIN_EVENT_WIDTH_PX = 20;

  let draggingEvent = null;
  let resizingEvent = null;
  let dragOffsetX = 0;
  let resizeHandleType = null;
  let initialEventRect = null;

  function parseTimeToMinutes(timeStr) {
    if (!timeStr) return 0;
    const [hours, minutes] = timeStr.split(":").map(Number);
    return hours * 60 + minutes;
  }

  function formatMinutesToTime(totalMinutes) {
    const hours = Math.floor(totalMinutes / 60) % 24;
    const minutes = totalMinutes % 60;
    return `${String(hours).padStart(2, "0")}:${String(minutes).padStart(
      2,
      "0",
    )}`;
  }

  function formatTimeForDisplay(timeStr24hr) {
    if (!timeStr24hr) return "";
    const [hours, minutes] = timeStr24hr.split(":").map(Number);
    const ampm = hours >= 12 ? "PM" : "AM";
    const displayHours = hours % 12 || 12;
    return `${displayHours}:${String(minutes).padStart(2, "0")} ${ampm}`;
  }

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
    updateDaySelectOptions();
  }

  function updateDaySelectOptions() {
    eventDaySelect.innerHTML = "";
    for (let i = 1; i <= maxDays; i++) {
      const option = document.createElement("option");
      option.value = i;
      option.textContent = `Day ${i}`;
      eventDaySelect.appendChild(option);
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
      updateDaySelectOptions();
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
    const pixelsPerMinute = timelineScale / 60;
    const timelineDurationHours = TIMELINE_END_HOUR - TIMELINE_START_HOUR;
    const totalTimelineWidth = timelineDurationHours * timelineScale;

    timelineContainer.style.width = `${totalTimelineWidth}px`;
    timeRuler.innerHTML = "";
    timelineEventsContainer.innerHTML = "";

    for (let hour = TIMELINE_START_HOUR; hour <= TIMELINE_END_HOUR; hour++) {
      const tick = document.createElement("div");
      tick.classList.add("time-tick");
      if (hour % 1 === 0) tick.classList.add("major");
      const tickPosition = (hour - TIMELINE_START_HOUR) * timelineScale;
      tick.style.left = `${tickPosition}px`;

      const label = document.createElement("span");
      label.textContent = formatTimeForDisplay(
        `${String(hour).padStart(2, "0")}:00`,
      );
      tick.appendChild(label);
      timeRuler.appendChild(tick);

      if (hour < TIMELINE_END_HOUR) {
        const halfHourTick = document.createElement("div");
        halfHourTick.classList.add("time-tick");
        const halfHourPosition = tickPosition + timelineScale / 2;
        halfHourTick.style.left = `${halfHourPosition}px`;
        timeRuler.appendChild(halfHourTick);
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

    dayEvents.forEach((event) => {
      const startMinutes = parseTimeToMinutes(event.startTime);
      const endMinutes = parseTimeToMinutes(event.endTime);
      if (startMinutes >= endMinutes) return;

      const eventStartOffset =
        (startMinutes - TIMELINE_START_HOUR * 60) * pixelsPerMinute;
      let eventWidth = (endMinutes - startMinutes) * pixelsPerMinute;
      if (eventWidth < MIN_EVENT_WIDTH_PX) eventWidth = MIN_EVENT_WIDTH_PX;

      const eventBlock = document.createElement("div");
      eventBlock.classList.add("event-block");
      eventBlock.dataset.eventId = event.id;
      eventBlock.style.backgroundColor = event.color;
      eventBlock.style.borderColor = darkenColor(event.color, 20);
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
      titleSpan.textContent = event.title;
      eventBlock.appendChild(titleSpan);

      const leftHandle = document.createElement("div");
      leftHandle.classList.add("resize-handle", "left");
      eventBlock.appendChild(leftHandle);

      const rightHandle = document.createElement("div");
      rightHandle.classList.add("resize-handle", "right");
      eventBlock.appendChild(rightHandle);

      timelineEventsContainer.appendChild(eventBlock);
      maxBottom = Math.max(
        maxBottom,
        parseFloat(eventBlock.style.top) + eventHeight + eventMargin,
      );
    });
    timelineEventsContainer.style.height = `${maxBottom}px`;
  }

  function darkenColor(color, percent) {
    let r, g, b;
    if (color.startsWith("#")) {
      color = color.slice(1);
      if (color.length === 3) {
        r = parseInt(color[0] + color[0], 16);
        g = parseInt(color[1] + color[1], 16);
        b = parseInt(color[2] + color[2], 16);
      } else if (color.length === 6) {
        r = parseInt(color.substring(0, 2), 16);
        g = parseInt(color.substring(2, 4), 16);
        b = parseInt(color.substring(4, 6), 16);
      } else {
        return "#000000";
      }
    } else {
      return "#000000";
    }

    r = Math.floor(r * (1 - percent / 100));
    g = Math.floor(g * (1 - percent / 100));
    b = Math.floor(b * (1 - percent / 100));
    return `#${[r, g, b]
      .map((x) => Math.max(0, Math.min(255, x)).toString(16).padStart(2, "0"))
      .join("")}`;
  }

  function toggleEventDetails(listItem) {
    const detailsDiv = listItem.querySelector(".event-details");
    const chevronBtn = listItem.querySelector(
      '.event-actions button[title="Toggle Details"]',
    );
    if (!detailsDiv || !chevronBtn) return;

    const isExpanded = chevronBtn.dataset.expanded === "true";
    detailsDiv.classList.toggle("hidden", isExpanded);
    chevronBtn.innerHTML = isExpanded ? "▼" : "▲";
    chevronBtn.dataset.expanded = String(!isExpanded);
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

        const timeSpan = document.createElement("span");
        timeSpan.classList.add("event-time");
        timeSpan.textContent = `${formatTimeForDisplay(
          event.startTime,
        )} - ${formatTimeForDisplay(event.endTime)}`;
        li.appendChild(timeSpan);

        const titleSpan = document.createElement("span");
        titleSpan.classList.add("event-title");
        titleSpan.textContent = event.title;
        titleSpan.addEventListener("click", () => toggleEventDetails(li));
        li.appendChild(titleSpan);

        const actionsSpan = document.createElement("span");
        actionsSpan.classList.add("event-actions");

        const editBtn = document.createElement("button");
        editBtn.innerHTML = "✏️";
        editBtn.title = "Edit Event";
        editBtn.addEventListener("click", () => openEditDialog(event.id));
        actionsSpan.appendChild(editBtn);

        const chevronBtn = document.createElement("button");
        chevronBtn.innerHTML = "▼";
        chevronBtn.title = "Toggle Details";
        chevronBtn.dataset.expanded = "false";
        chevronBtn.addEventListener("click", () => toggleEventDetails(li));
        actionsSpan.appendChild(chevronBtn);

        li.appendChild(actionsSpan);

        const detailsDiv = document.createElement("div");
        detailsDiv.classList.add("event-details", "hidden");
        detailsDiv.innerHTML = `
                    <p><strong>Category:</strong> ${event.category || "N/A"}</p>
                    <p><strong>Speaker:</strong> ${event.speaker || "N/A"}</p>
                    <p><strong>Location:</strong> ${event.location || "N/A"}</p>
                    <p><strong>Notes:</strong> ${event.notes || "N/A"}</p>
                    <p><strong>Attachments:</strong> ${
                      event.attachments || "N/A"
                    }</p>
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

    if (currentDay === 1 && dayEvents.length === 0) {
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
    updateDaySelectOptions();
    eventDaySelect.value = currentDay;
    eventColorInput.value = "#3498db";
    deleteEventBtn.style.display = "none";
    eventDialog.showModal();
  }

  function openEditDialog(id) {
    const event = events.find((e) => e.id === id);
    if (!event) return;

    dialogTitle.textContent = "Edit Event";
    eventIdInput.value = event.id;
    eventTitleInput.value = event.title;
    updateDaySelectOptions();
    eventDaySelect.value = event.day;
    eventStartTimeInput.value = event.startTime;
    eventEndTimeInput.value = event.endTime;
    eventCategoryInput.value = event.category;
    eventColorInput.value = event.color;
    eventSpeakerInput.value = event.speaker || "";
    eventLocationInput.value = event.location || "";
    eventNotesInput.value = event.notes || "";
    eventAttachmentsInput.value = event.attachments || "";

    deleteEventBtn.style.display = "inline-block";
    eventDialog.showModal();
  }

  eventForm.addEventListener("submit", (e) => {
    e.preventDefault();
    const id = eventIdInput.value;
    const startMinutes = parseTimeToMinutes(eventStartTimeInput.value);
    const endMinutes = parseTimeToMinutes(eventEndTimeInput.value);

    if (startMinutes >= endMinutes) {
      alert("End time must be after start time.");
      return;
    }

    const eventData = {
      id: id || Date.now().toString(),
      title: eventTitleInput.value,
      day: parseInt(eventDaySelect.value),
      startTime: eventStartTimeInput.value,
      endTime: eventEndTimeInput.value,
      category: eventCategoryInput.value,
      color: eventColorInput.value,
      speaker: eventSpeakerInput.value,
      location: eventLocationInput.value,
      notes: eventNotesInput.value,
      attachments: eventAttachmentsInput.value,
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
    if (id && confirm("Are you sure you want to delete this event?")) {
      events = events.filter((event) => event.id !== id);
      saveEvents();
      renderAll();
      eventDialog.close();
    }
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

  fitTimelineBtn.addEventListener("click", () => {
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
          parseTimeToMinutes(event.endTime),
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
  });

  timelineEventsContainer.addEventListener("mousedown", (e) => {
    const eventBlock = e.target.closest(".event-block");
    if (!eventBlock) return;

    const eventId = eventBlock.dataset.eventId;
    const event = events.find((ev) => ev.id === eventId);
    if (!event) return;

    initialEventRect = eventBlock.getBoundingClientRect();

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
        parseTimeToMinutes(draggingEvent.endTime) -
        parseTimeToMinutes(draggingEvent.startTime);
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
      const originalEndMinutes = parseTimeToMinutes(resizingEvent.endTime);
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

  document.addEventListener("mouseup", () => {
    if (draggingEvent) {
      const eventBlock = timelineEventsContainer.querySelector(
        `.event-block[data-event-id="${draggingEvent.id}"]`,
      );
      if (eventBlock) {
        const pixelsPerMinute = timelineScale / 60;
        const newStartPx = parseFloat(eventBlock.style.left);
        const currentDurationMinutes =
          parseTimeToMinutes(draggingEvent.endTime) -
          parseTimeToMinutes(draggingEvent.startTime);

        let newStartMinutes =
          Math.round(newStartPx / pixelsPerMinute) + TIMELINE_START_HOUR * 60;
        newStartMinutes = Math.max(TIMELINE_START_HOUR * 60, newStartMinutes);
        let newEndMinutes = newStartMinutes + currentDurationMinutes;

        if (newEndMinutes > TIMELINE_END_HOUR * 60) {
          newEndMinutes = TIMELINE_END_HOUR * 60;
          newStartMinutes = newEndMinutes - currentDurationMinutes;
          newStartMinutes = Math.max(TIMELINE_START_HOUR * 60, newStartMinutes);
        }

        draggingEvent.startTime = formatMinutesToTime(newStartMinutes);
        draggingEvent.endTime = formatMinutesToTime(newEndMinutes);

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

        let newStartMinutes =
          Math.round(newStartPx / pixelsPerMinute) + TIMELINE_START_HOUR * 60;
        let newEndMinutes =
          Math.round((newStartPx + newWidthPx) / pixelsPerMinute) +
          TIMELINE_START_HOUR * 60;

        newStartMinutes = Math.max(TIMELINE_START_HOUR * 60, newStartMinutes);
        newEndMinutes = Math.min(TIMELINE_END_HOUR * 60, newEndMinutes);

        const minDurationMinutes = Math.round(
          MIN_EVENT_WIDTH_PX / pixelsPerMinute,
        );
        if (newEndMinutes - newStartMinutes < minDurationMinutes) {
          if (resizeHandleType === "right") {
            newEndMinutes = newStartMinutes + minDurationMinutes;
          } else {
            newStartMinutes = newEndMinutes - minDurationMinutes;
          }
          newStartMinutes = Math.max(TIMELINE_START_HOUR * 60, newStartMinutes);
          newEndMinutes = Math.min(TIMELINE_END_HOUR * 60, newEndMinutes);
        }

        resizingEvent.startTime = formatMinutesToTime(newStartMinutes);
        resizingEvent.endTime = formatMinutesToTime(newEndMinutes);

        saveEvents();
        renderAll();
      }
      document.body.style.cursor = "default";
    }

    draggingEvent = null;
    resizingEvent = null;
    resizeHandleType = null;
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
          if (
            confirm(
              "Importing this file will overwrite current data. Continue?",
            )
          ) {
            events = importedData.events;
            maxDays = importedData.maxDays || 1;
            if (maxDays === 0) maxDays = 1;
            currentDay = 1;
            saveEvents();
            updateDaySelectOptions();
            renderAll();
            alert("Data imported successfully!");
          }
        } else {
          alert("Invalid file format. Expected { events: [], maxDays: N }");
        }
      } catch (error) {
        alert("Error parsing JSON file: " + error.message);
      } finally {
        importFileInput.value = null;
      }
    };
    reader.onerror = () => {
      alert("Error reading file.");
      importFileInput.value = null;
    };
    reader.readAsText(file);
  }

  exportDataBtn.addEventListener("click", handleExportData);
  importDataBtn.addEventListener("click", () => importFileInput.click());
  importFileInput.addEventListener("change", handleImportData);

  clearDayBtn.addEventListener("click", () => {
    const isDeleteAction = clearDayBtn.textContent === "Delete Day";

    if (isDeleteAction) {
      if (
        confirm(
          `Do you really want to delete Day ${currentDay}? This action cannot be undone.`,
        )
      ) {
        const dayToDelete = currentDay;

        events.forEach((event) => {
          if (event.day > dayToDelete) {
            event.day -= 1;
          }
        });
        events = events.filter((event) => event.day !== dayToDelete);

        maxDays -= 1;

        if (maxDays === 0) {
          maxDays = 1;
          currentDay = 1;
        } else if (currentDay > maxDays) {
          currentDay = maxDays;
        }

        currentDay = Math.max(1, currentDay);

        saveEvents();
        updateDaySelectOptions();
        renderAll();
        alert(`Day ${dayToDelete} has been deleted.`);
      }
    } else {
      if (
        confirm(
          `Do you really want to delete all events for Day ${currentDay}? This action cannot be undone.`,
        )
      ) {
        events = events.filter((event) => event.day !== currentDay);
        saveEvents();
        renderAll();
        alert(`Events for Day ${currentDay} have been cleared.`);
      }
    }
  });

  clearAllDataBtn.addEventListener("click", () => {
    if (
      confirm(
        "Do you really want to delete ALL data for ALL days? This action cannot be undone and will reset the planner.",
      )
    ) {
      events = [];
      maxDays = 1;
      currentDay = 1;
      saveEvents();
      updateDaySelectOptions();
      renderAll();
      alert("All data has been cleared.");
    }
  });

  function renderAll() {
    renderDayTabs();
    renderTimeline();
    renderEventList();
  }

  loadEvents();
  renderAll();
});
