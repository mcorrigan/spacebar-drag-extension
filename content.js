(function () {
  const MOUSE_LEFT_BTN = 0;
  const MOUSE_MIDDLE_BTN = 1;
  const MOUSE_RIGHT_BTN = 2;

  // configuration set by popup.html - Retrieve settings from local storage
  let activeBorder = "4px solid rgb(0, 140, 256)";
  let activeBackgroundColor = "rgba(0, 0, 0, 0.15)";
  let activeBackgroundOpacity = 0.15;
  let activeBorderThickness = 2;
  let invertScroll = false;
  let displayToolTip = true;
  let activatedMouseButton = MOUSE_LEFT_BTN;

  chrome.storage.onChanged.addListener((changes, area) => {
    if (area === "sync" && changes.options?.newValue) {
      activeBorder = changes.options.newValue.activeBorder;
      activeBorderThickness = changes.options.newValue.activeBorderThickness;
      activeBackgroundColor = changes.options.newValue.activeBackgroundColor;
      activeBackgroundOpacity =
        changes.options.newValue.activeBackgroundOpacity;
      invertScroll = changes.options.newValue.invertScroll;
      displayToolTip = changes.options.newValue.displayToolTip;
    }
  });

  chrome.storage.sync.get("options", (data) => {
    // get any data currently stored for this extension
    activeBorder = data.options.activeBorder;
    activeBorderThickness = data.options.activeBorderThickness;
    activeBackgroundColor = data.options.activeBackgroundColor;
    activeBackgroundOpacity = data.options.activeBackgroundOpacity;
    invertScroll = data.options.invertScroll;
    displayToolTip = data.options.displayToolTip;
  });

  // internals
  let spaceBarActive = false;
  let dragScrollActive = false;
  let userSelectDefault = document.body.style.userSelect; // we have to prevent select or dragging will select stuff
  const SPACEBAR = 32;

  const overlay = document.createElement("div");
  overlay.style.cssText = `
    position: fixed;
    top: 0;
    left: 0;
    width: 100%;
    height: 0;
    z-index: 9999999;
    cursor: grab;
    box-sizing: border-box;
    border: 4px solid rgb(0, 140, 256);
    background-color: rgba(0, 0, 0, 0.15);
    transition: opacity 0.2s;
    opacity: 0;
    overflow: hidden;
  `;

  const hint = document.createElement("div");
  hint.style.cssText = `
    position: fixed;
    top: 50%;
    left: 50%;
    transform: translate(-50%, -50%);
    padding: 10px 20px;
    background-color: rgba(0, 0, 0, 0.7);
    color: white;
    border-radius: 5px;
    font-family: Arial, sans-serif;
    font-size: 22px;
    display: block;
  `;
  hint.textContent = "Click and drag 🖱️ to pan";

  overlay.appendChild(hint);
  document.body.appendChild(overlay);

  function loadSettings() {
    // set do these in bulk to avoid reflow
    overlay.style.border = `${activeBorderThickness}px solid ${activeBorder}`;
    overlay.style.backgroundColor = activeBackgroundColor;
    overlay.style.backgroundColor = `rgba(0, 0, 0, ${activeBackgroundOpacity})`;
    hint.style.display = displayToolTip ? "block" : "none";
  }

  function handleKeyDown(event) {
    // make sure we are not trying to type or interact with a valid element
    if (!activeElementInputType() && event.keyCode === SPACEBAR) {
      if (!spaceBarActive) {
        event.preventDefault();

        loadSettings();
        spaceBarActive = true;
        overlay.style.opacity = 1;
        overlay.style.height = "100%";

        // set the whole document to be no-select
        document.body.style.userSelect = "none";
      } else {
        event.preventDefault();
      }
    }
  }
  function handleKeyUp(event) {
    if (event.keyCode === SPACEBAR && !activeElementInputType()) {
      spaceBarActive = false;
      overlay.style.opacity = 0;
      overlay.style.height = 0;
      document.body.style.userSelect = userSelectDefault;
    }
  }

  function handleMouseDown(event) {
    if (event.button === activatedMouseButton && spaceBarActive) {
      dragScrollActive = true;
      overlay.style.cursor = "grabbing";
    }
  }

  function handleMouseUp(event) {
    if (event.button === activatedMouseButton && dragScrollActive) {
      dragScrollActive = false;
      overlay.style.cursor = "grab";
    }
  }

  function handleMouseMove(event) {
    if (dragScrollActive) {
      // invert the movement to scroll in the right direction
      if (!invertScroll) {
        window.scrollBy(-event.movementX, -event.movementY);
      } else {
        window.scrollBy(event.movementX, event.movementY);
      }
    }
  }

  function activeElementInputType() {
    const focusedElement = document.activeElement;
    const inputLikeElements = [
      "OPTION",
      "SELECT",
      "INPUT",
      "TEXTAREA",
      "SELECT",
      "BUTTON",
      "A",
      "IFRAME",
      "CANVAS",
    ];
    return (
      inputLikeElements.includes(focusedElement.tagName) ||
      focusedElement.contentEditable === "true"
    );
  }

  document.addEventListener("mousedown", handleMouseDown);
  document.addEventListener("mouseup", handleMouseUp);
  document.addEventListener("mousemove", handleMouseMove);
  document.addEventListener("keydown", handleKeyDown);
  document.addEventListener("keyup", handleKeyUp);

  loadSettings();
})();
