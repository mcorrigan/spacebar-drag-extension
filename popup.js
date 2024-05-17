const options = {};
const optionsForm = document.getElementById("settingsForm");

optionsForm.activeBorder.addEventListener("change", (event) => {
  options.activeBorder = event.target.value;
  chrome.storage.sync.set({ options });
});

optionsForm.activeBorderThickness.addEventListener("change", (event) => {
  options.activeBorderThickness = parseInt(event.target.value);
  chrome.storage.sync.set({ options });
});

optionsForm.activeBorderThickness.addEventListener("input", (event) => {
  document.getElementById("activeBorderThicknessValue").textContent =
    event.target.value;
});

optionsForm.activeBackgroundColor.addEventListener("change", (event) => {
  options.activeBackgroundColor = event.target.value;
  chrome.storage.sync.set({ options });
});

optionsForm.activeBackgroundOpacity.addEventListener("change", (event) => {
  options.activeBackgroundOpacity = parseFloat(event.target.value);
  chrome.storage.sync.set({ options });
});

optionsForm.activeBackgroundOpacity.addEventListener("input", (event) => {
  document.getElementById("activeBackgroundOpacityValue").textContent =
    parseFloat(event.target.value).toFixed(2);
});

optionsForm.invertScroll.addEventListener("change", (event) => {
  options.invertScroll = event.target.checked;
  chrome.storage.sync.set({ options });
});

optionsForm.displayToolTip.addEventListener("change", (event) => {
  options.displayToolTip = event.target.checked;
  chrome.storage.sync.set({ options });
});

// add useVelocities checkbox
optionsForm.useVelocities.addEventListener("change", (event) => {
  options.useVelocities = event.target.checked;
  optionsForm.velocityFriction.disabled = !event.target.checked;
  chrome.storage.sync.set({ options });
});

// add velocityFriction input
optionsForm.velocityFriction.addEventListener("change", (event) => {
  options.velocityFriction = parseFloat(event.target.value);
  chrome.storage.sync.set({ options });
});

optionsForm.velocityFriction.addEventListener("input", (event) => {
  document.getElementById("velocityFrictionValue").textContent = parseFloat(
    event.target.value
  ).toFixed(2);
});

// add activatedMouseButton input
optionsForm.activatedMouseButton.addEventListener("change", (event) => {
  options.activatedMouseButton = parseInt(event.target.value);
  chrome.storage.sync.set({ options });
});

optionsForm.closeBtn.addEventListener("click", () => {
  window.close();
});

// inital data load
chrome.storage.sync.get("options", (data) => {
  // get any data currently stored for this extension
  Object.assign(options, data.options);
  options.activeBorder = options.activeBorder || "#008CFF";
  if (options.activeBorderThickness === undefined) {
    options.activeBorderThickness = 4;
  }
  options.activeBackgroundColor = options.activeBackgroundColor || "#000000";
  if (options.activeBackgroundOpacity === undefined) {
    options.activeBackgroundOpacity = 0.15;
  }
  if (options.activatedMouseButton === undefined) {
    options.activatedMouseButton = 0; // 0 = left mouse button
  }
  if (options.velocityFriction === undefined) {
    options.velocityFriction = 0.9;
  }
  if (options.displayToolTip === undefined) {
    options.displayToolTip = true;
  }

  // sync anything we may have set defaults for
  chrome.storage.sync.set({ options });

  optionsForm.activeBorder.value = options.activeBorder;
  optionsForm.activeBorderThickness.value = options.activeBorderThickness;
  optionsForm.activeBackgroundColor.value = options.activeBackgroundColor;
  optionsForm.activeBackgroundOpacity.value = options.activeBackgroundOpacity;
  optionsForm.invertScroll.checked = Boolean(options.invertScroll);
  optionsForm.displayToolTip.checked = Boolean(options.displayToolTip);
  optionsForm.useVelocities.checked = Boolean(options.useVelocities);
  optionsForm.velocityFriction.value = options.velocityFriction;
  optionsForm.activatedMouseButton.value = options.activatedMouseButton;

  // set field to disabled if useVelocities is false
  optionsForm.velocityFriction.disabled = !options.useVelocities;

  document.getElementById("activeBackgroundOpacityValue").textContent =
    parseFloat(options.activeBackgroundOpacity).toFixed(2);

  document.getElementById("activeBorderThicknessValue").textContent =
    options.activeBorderThickness;

  document.getElementById("velocityFrictionValue").textContent = parseFloat(
    options.velocityFriction
  ).toFixed(2);
});
