(function () {
  const SPACEBAR_KEY = 32;
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
  let useVelocities = false;
  let friction = 0.9;

  // listen for changes to the options
  chrome.storage.onChanged.addListener((changes, area) => {
    if (area === "sync" && changes.options?.newValue) {
      updateVariablesFromData(changes.options.newValue);
    }
  });

  // default load data
  chrome.storage.sync.get("options", (data) =>
    updateVariablesFromData(data.options)
  );

  function updateVariablesFromData(data) {
    activeBorder = data.activeBorder;
    activeBorderThickness = data.activeBorderThickness;
    activeBackgroundColor = data.activeBackgroundColor;
    activeBackgroundOpacity = data.activeBackgroundOpacity;
    invertScroll = data.invertScroll;
    displayToolTip = data.displayToolTip;
    activatedMouseButton = data.activatedMouseButton;
    useVelocities = data.useVelocities;
    friction = Math.min(data.velocityFriction, 0.99); // 1 means never stops
    if (!useVelocities) {
      velocityX = 0;
      velocityY = 0;
    }
  }

  // internals
  let spaceBarActive = false;
  let dragScrollActive = false;
  let userSelectDefault = document.body.style.userSelect; // we have to prevent select or dragging will select stuff
  let velocityX = 0;
  let velocityY = 0;

  const overlay = document.createElement("div");
  overlay.style.cssText = `
    position: fixed;
    top: 0;
    left: 0;
    width: 100%;
    height: 0;
    z-index: 2147483647;
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

  overlay.appendChild(hint);
  document.body.appendChild(overlay);

  function loadSettings() {
    // set do these in bulk to avoid reflow
    overlay.style.border = `${activeBorderThickness}px solid ${activeBorder}`;
    // convert hex color to rgb
    const red = parseInt(activeBackgroundColor.slice(1, 3), 16);
    const green = parseInt(activeBackgroundColor.slice(3, 5), 16);
    const blue = parseInt(activeBackgroundColor.slice(5, 7), 16);
    overlay.style.backgroundColor = `rgba(${red}, ${green}, ${blue}, ${activeBackgroundOpacity})`;
    hint.style.display = displayToolTip ? "block" : "none";
    const button =
      activatedMouseButton === MOUSE_LEFT_BTN
        ? "Left"
        : activatedMouseButton === MOUSE_MIDDLE_BTN
        ? "Middle"
        : "Right";
    hint.textContent = `${button} click 🖱️ and drag to pan`;
  }

  function handleKeyDown(event) {
    // make sure we are not trying to type or interact with a valid element
    if (!activeElementInputType() && event.keyCode === SPACEBAR_KEY) {
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
    if (event.keyCode === SPACEBAR_KEY && !activeElementInputType()) {
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
      // reset the velocity if we are not using it
      velocityX = 0;
      velocityY = 0;
    }
  }

  function handleMouseUp(event) {
    if (event.button === activatedMouseButton && dragScrollActive) {
      event.preventDefault();
      dragScrollActive = false;
      overlay.style.cursor = "grab";
      if (useVelocities) slowScroll();
    }
  }

  function handleMouseMove(event) {
    if (dragScrollActive) {
      velocityX = event.movementX;
      velocityY = event.movementY;

      // invert the movement to scroll in the right direction
      if (!invertScroll) {
        window.scrollBy(-event.movementX, -event.movementY);
      } else {
        window.scrollBy(event.movementX, event.movementY);
      }
    }
  }

  function slowScroll() {
    // Gradually slow down scrolling using velocity and friction
    if (Math.abs(velocityX) > 0.1 || Math.abs(velocityY) > 0.1) {
      if (!invertScroll) {
        window.scrollBy(-velocityX, -velocityY);
      } else {
        window.scrollBy(velocityX, velocityY);
      }
      velocityX *= friction;
      velocityY *= friction;
      requestAnimationFrame(slowScroll);
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

  function handleContextMenu(event) {
    if (spaceBarActive) {
      event.preventDefault();
    }
  }

  function handleMouseLeave(event) {
    if (spaceBarActive && !dragScrollActive) {
      spaceBarActive = false;
      overlay.style.opacity = 0;
      overlay.style.height = 0;
      document.body.style.userSelect = userSelectDefault;
    }
  }

  document.addEventListener("mousedown", handleMouseDown);
  document.addEventListener("mouseup", handleMouseUp);
  document.addEventListener("mousemove", handleMouseMove);
  //   document.addEventListener("mouseleave", handleMouseLeave);
  document.addEventListener("keydown", handleKeyDown);
  document.addEventListener("keyup", handleKeyUp);
  document.addEventListener("contextmenu", handleContextMenu);

  loadSettings();
})();
