async function loadTimers() {
  const res = await fetch("/getAllTimers");
  const data = await res.json();

  timers = Object.entries(data).map(([id, timer]) => ({
    id,
    ...timer
  }));

  renderTimers();
}


const modalOverlay = document.getElementById("modalOverlay");
const timerList = document.getElementById("timerList");
var currentState = 'on'

document.querySelectorAll("#timerState button").forEach(btn => {
  btn.addEventListener("click", () => {
    document.querySelectorAll("#timerState button")
      .forEach(b => b.classList.remove("active"));

    btn.classList.add("active");
    currentState = btn.dataset.value;

    updateModalFields();
  });
});

const allDaysCheckbox = document.getElementById("allDays");

allDaysCheckbox.addEventListener("change", () => {
  const container = document.getElementById("daysContainer");

  if (allDaysCheckbox.checked) {
    container.style.display = "none";

    // uncheck others so state stays clean
    container.querySelectorAll("input").forEach(cb => cb.checked = false);
  } else {
    container.style.display = "grid";
  }
});



let timers = [];

function addTimer() {
  modalOverlay.style.display = "flex";
  resetModal();
}

function closeModal() {
  modalOverlay.style.display = "none";
}

// Helper: show or hide all children of a wrapper
function setWrapperVisibility(wrapperId, visible) {
  const wrapper = document.getElementById(wrapperId);
  if(wrapper) wrapper.style.display = visible ? "" : "none";
}

// Update modal fields dynamically
function updateModalFields() {
  const state = currentState;
  const oneTime = document.getElementById("oneTime").checked;

  // Days section
  const daysContainer = document.getElementById("daysContainer");
  const daysLabel = document.getElementById("daysLabel");
  daysContainer.style.display = oneTime ? "none" : "flex";
  daysLabel.style.display = oneTime ? "none" : "flex";

  // Optionals wrapper
  setWrapperVisibility("optionals", state === "on");

  // Inside Optionals, toggle individual fields based on their checkboxes
  const useColor = document.getElementById("useColor");
  const useBrightness = document.getElementById("useBrightness");

  setWrapperVisibility("colorField", state === "on" && useColor.checked);
  setWrapperVisibility("brightnessField", state === "on" && useBrightness.checked);
}

// Reset modal to defaults
function resetModal() {
  currentState = "on";

  // sync toggle UI
  document.querySelectorAll("#timerState button")
    .forEach(b => b.classList.remove("active"));

  document.querySelector('#timerState button[data-value="on"]')
    .classList.add("active");

  document.getElementById("oneTime").checked = false;
  document.getElementById("useColor").checked = true;
  document.getElementById("useBrightness").checked = true;
  document.getElementById("timerBrightness").value = 100;

  updateBrightnessLabel();
  updateModalFields();
}


// Brightness display
function updateBrightnessLabel() {
  const brightness = document.getElementById("timerBrightness").value;
  document.getElementById("brightnessValue").innerText = brightness + "%";
}

// Save timer
async function saveTimer() {
  const state = currentState;
  const time = document.getElementById("timerTime").value;
  const oneTime = document.getElementById("oneTime").checked;
  const name = document.getElementById("timerName").value

  let days = "all";

  if (!oneTime && !document.getElementById("allDays").checked) {
    const dayCheckboxes = Array.from(
      document.querySelectorAll("#daysContainer input:checked")
    );
    days = dayCheckboxes.map(cb => Number(cb.value));
  }

  const action = {};

  if (state === "on") {
    if (useColor.checked)
      action.color = document.getElementById("timerColor").value;

    if (useBrightness.checked)
      action.brightness = parseInt(
        document.getElementById("timerBrightness").value
      );

    action.state = true;
  } else {
    action.state = false;
  }

  const id = name

  const timer = {
    time,
    days,
    repeating: !oneTime,
    action
  };

  await fetch("/newTimer", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ id, timer })
  });

  closeModal();
  loadTimers(); // refresh from server
}


// Render timers list
function renderTimers() {
  timerList.innerHTML = "";
  timers.forEach(timer => {
    const div = document.createElement("div");
    div.className = "timer-item";
    div.innerHTML = `
      <span>${timer.time} | ${Array.isArray(timer.days) ? timer.days.join(",") : timer.days} | ${JSON.stringify(timer.action)}</span>
      <button class="delete-btn" onclick="removeTimer('${timer.id}')">×</button>
    `;
    timerList.appendChild(div);
  });
}

async function removeTimer(id) {
  await fetch("/deleteTimer", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ id })
  });

  loadTimers();
}


function updateColor() {
    const color = document.getElementById("colorText").value
    const rgb = color2rgb(color)
    document.getElementById("timerColor").value = rgbToHex(...rgb)

}

function updateColorText() {
    const color = document.getElementById("timerColor").value
    document.getElementById("colorText").value = color
}

renderTimers();
updateModalFields();




