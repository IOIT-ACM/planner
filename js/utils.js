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
  const ampm = hours >= 12 && hours < 24 ? "PM" : "AM";
  let displayHours = hours % 12;
  if (displayHours === 0) {
    displayHours = 12;
  }
  return `${displayHours}:${String(minutes).padStart(2, "0")} ${ampm}`;
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

function snapToNearestQuarterHour(minutes, interval = 15) {
  return Math.round(minutes / interval) * interval;
}

function getInterpretedEndMinutes(startTimeStr, endTimeStr) {
  const TIMELINE_END_HOUR = 24;
  const startMinutes = parseTimeToMinutes(startTimeStr);
  let endMinutes = parseTimeToMinutes(endTimeStr);

  if (endTimeStr === "00:00" && startMinutes !== endMinutes) {
    endMinutes = TIMELINE_END_HOUR * 60;
  }
  return endMinutes;
}

function lightenColor(color, percent) {
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
      return "#ffffff";
    }
  } else {
    return "#ffffff";
  }

  r = Math.floor(r + (255 - r) * (percent / 100));
  g = Math.floor(g + (255 - g) * (percent / 100));
  b = Math.floor(b + (255 - b) * (percent / 100));

  return `#${[r, g, b]
    .map((x) => Math.max(0, Math.min(255, x)).toString(16).padStart(2, "0"))
    .join("")}`;
}

function hexToRgb(hex) {
  if (!hex || !hex.startsWith("#")) return "0, 0, 0";
  let r = 0,
    g = 0,
    b = 0;
  if (hex.length == 4) {
    [r, g, b] = [hex[1], hex[2], hex[3]].map((c) => parseInt(c + c, 16));
  } else if (hex.length == 7) {
    [r, g, b] = [hex.slice(1, 3), hex.slice(3, 5), hex.slice(5, 7)].map((c) =>
      parseInt(c, 16),
    );
  }
  return `${r}, ${g}, ${b}`;
}
