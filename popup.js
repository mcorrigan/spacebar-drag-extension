const options = {};
const optionsForm = document.getElementById("settingsForm");

optionsForm.activeBorder.addEventListener("change", (event) => {
  options.activeBorder = event.target.value;
  chrome.storage.sync.set({ options });
});

optionsForm.activeBorderThickness.addEventListener("change", (event) => {
  options.activeBorderThickness = event.target.value;
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
  options.activeBackgroundOpacity = event.target.value;
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

optionsForm.saveBtn.addEventListener("click", () => {
  window.close();
});

// inital data load
chrome.storage.sync.get("options", (data) => {
  // get any data currently stored for this extension
  Object.assign(options, data.options);
  options.activeBorder = options.activeBorder || "#008CFF";
  options.activeBorderThickness = options.activeBorderThickness || 2;
  options.activeBackgroundColor = options.activeBackgroundColor || "#000000";
  options.activeBackgroundOpacity = options.activeBackgroundOpacity || 0.15;
  options.invertScroll = options.invertScroll;
  options.displayToolTip = options.displayToolTip;

  optionsForm.activeBorder.value = options.activeBorder;
  optionsForm.activeBorderThickness.value = options.activeBorderThickness;
  optionsForm.activeBackgroundColor.value = options.activeBackgroundColor;
  optionsForm.activeBackgroundOpacity.value = options.activeBackgroundOpacity;
  optionsForm.invertScroll.checked = Boolean(options.invertScroll);
  optionsForm.displayToolTip.checked = Boolean(options.displayToolTip);

  // sync anything we may have set
  chrome.storage.sync.set({ options });

  document.getElementById("activeBackgroundOpacityValue").textContent =
    parseFloat(options.activeBackgroundOpacity).toFixed(2);

  document.getElementById("activeBorderThicknessValue").textContent =
    options.activeBorderThickness;
});
