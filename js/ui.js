function showCustomAlert(message, title = "Alert") {
  const customDialog = document.getElementById("custom-dialog");
  const customDialogTitle = document.getElementById("custom-dialog-title");
  const customDialogMessage = document.getElementById("custom-dialog-message");
  const customDialogButtons = document.getElementById("custom-dialog-buttons");

  if (!customDialog || !customDialogTitle || !customDialogMessage || !customDialogButtons) {
    alert(`${title}: ${message}`);
    return;
  }

  customDialogTitle.textContent = title;
  customDialogMessage.textContent = message;
  customDialogButtons.innerHTML = "";

  const okButton = document.createElement("button");
  okButton.textContent = "OK";
  okButton.classList.add("alert-ok-btn");
  okButton.addEventListener("click", () => customDialog.close());
  customDialogButtons.appendChild(okButton);
  if (customDialog.showModal) {
    customDialog.showModal();
  } else {
    alert(`${title}: ${message}`);
  }
}

function showCustomConfirm(
  message,
  title = "Confirm",
  onConfirmCallback,
  onCancelCallback,
) {
  const customDialog = document.getElementById("custom-dialog");
  const customDialogTitle = document.getElementById("custom-dialog-title");
  const customDialogMessage = document.getElementById("custom-dialog-message");
  const customDialogButtons = document.getElementById("custom-dialog-buttons");

  if (!customDialog || !customDialogTitle || !customDialogMessage || !customDialogButtons) {
    if (confirm(`${title}: ${message}`)) {
        if (typeof onConfirmCallback === "function") onConfirmCallback();
    } else {
        if (typeof onCancelCallback === "function") onCancelCallback();
    }
    return;
  }

  customDialogTitle.textContent = title;
  customDialogMessage.innerHTML = message; 
  customDialogButtons.innerHTML = "";

  const confirmButton = document.createElement("button");
  confirmButton.textContent = "Confirm";
  confirmButton.classList.add("confirm-btn");
  confirmButton.addEventListener("click", () => {
    customDialog.close();
    if (typeof onConfirmCallback === "function") {
      onConfirmCallback();
    }
  });

  const cancelButton = document.createElement("button");
  cancelButton.textContent = "Cancel";
  cancelButton.classList.add("cancel-btn");
  cancelButton.addEventListener("click", () => {
    customDialog.close();
    if (typeof onCancelCallback === "function") {
      onCancelCallback();
    }
  });

  customDialogButtons.appendChild(cancelButton);
  customDialogButtons.appendChild(confirmButton);
  if (customDialog.showModal) {
    customDialog.showModal();
  } else {
     if (confirm(`${title}: ${message}`)) {
        if (typeof onConfirmCallback === "function") onConfirmCallback();
    } else {
        if (typeof onCancelCallback === "function") onCancelCallback();
    }
  }
}

function updateTooltipPosition(e, timelineTooltip) {
  if (!timelineTooltip || timelineTooltip.classList.contains("hidden")) return;

  const offsetX = 15;
  const offsetY = 15;
  let newX = e.clientX + offsetX;
  let newY = e.clientY + offsetY;

  const tooltipWidth = timelineTooltip.offsetWidth;
  const tooltipHeight = timelineTooltip.offsetHeight;
  const viewportWidth = window.innerWidth;
  const viewportHeight = window.innerHeight;

  if (newX + tooltipWidth > viewportWidth) {
    newX = e.clientX - tooltipWidth - offsetX;
  }
  if (newX < 0) {
    newX = offsetX;
  }
  if (newY + tooltipHeight > viewportHeight) {
    newY = e.clientY - tooltipHeight - offsetY;
  }
  if (newY < 0) {
    newY = offsetY;
  }

  timelineTooltip.style.left = `${newX}px`;
  timelineTooltip.style.top = `${newY}px`;
}

function toggleEventDetails(listItem) {
  const detailsDiv = listItem.querySelector(".event-details");
  const chevronBtn = listItem.querySelector(".event-list-chevron-btn");
  if (!detailsDiv || !chevronBtn) return;

  const isExpanded = chevronBtn.dataset.expanded === "true";
  detailsDiv.classList.toggle("hidden", isExpanded);
  chevronBtn.innerHTML = isExpanded ? "▼" : "▲";
  chevronBtn.dataset.expanded = String(!isExpanded);
}