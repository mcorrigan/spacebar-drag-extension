// configuration set by popup.html - Retrieve settings from local storage
const activeBorder =
  localStorage.getItem("activeBorder") || "0px solid rgb(0, 140, 256)";
const activeBackgroundColor =
  localStorage.getItem("activeBackgroundColor") || "rgba(0, 0, 0, 0.15)";
const invertScroll = JSON.parse(localStorage.getItem("invertScroll")) || false;
const displayToolTip =
  JSON.parse(localStorage.getItem("displayToolTip")) || true;
const toolActive = JSON.parse(localStorage.getItem("toolActive")) || true;

// internals
let spaceBarActive = false;
let dragScrollActive = false;
let userSelectDefault = document.body.style.userSelect; // we have to prevent select or dragging will select stuff
const SPACEBAR = 32;

if (toolActive) {
  const overlay = document.createElement("div");
  overlay.style.position = "fixed";
  overlay.style.top = 0;
  overlay.style.left = 0;
  overlay.style.width = "100%";
  overlay.style.height = "100%";
  overlay.style.zIndex = 9999999;
  overlay.style.backgroundColor = activeBackgroundColor;
  overlay.style.cursor = "grab";
  overlay.style.boxSizing = "border-box";
  overlay.style.border = activeBorder;

  if (displayToolTip) {
    const hint = document.createElement("div");
    hint.style.position = "fixed";
    hint.style.top = "50%";
    hint.style.left = "50%";
    hint.style.transform = "translate(-50%, -50%)";
    hint.style.padding = "10px 20px";
    hint.style.backgroundColor = "rgba(0, 0, 0, 0.7)";
    hint.style.color = "white";
    hint.style.borderRadius = "5px";
    hint.style.fontFamily = "Arial, sans-serif";
    hint.style.fontSize = "22px";
    hint.innerHTML = "Click and drag 🖱️ to scroll";
    overlay.appendChild(hint);
  }

  function handleKeyDown(event) {
    // make sure we are not trying to type or interact with a valid element
    if (!activeElementInputType() && event.keyCode === SPACEBAR) {
      if (!spaceBarActive) {
        event.preventDefault();
        spaceBarActive = true;

        document.body.appendChild(overlay);
        overlay.style.opacity = 1;

        // set the whole document to be no-select
        document.body.style.userSelect = "none";
      } else {
        event.preventDefault();
      }
    }
  }
  function handleKeyUp(event) {
    if (event.keyCode === 32 && !activeElementInputType()) {
      spaceBarActive = false;
      document.body.removeChild(overlay);
      document.body.style.userSelect = userSelectDefault;
    }
  }

  function handleLeftMouseDown(event) {
    if (event.button === 0 && spaceBarActive) {
      dragScrollActive = true;
      overlay.style.cursor = "grabbing";
    }
  }

  function handleLeftMouseUp(event) {
    if (event.button === 0 && dragScrollActive) {
      dragScrollActive = false;
      overlay.style.cursor = "grab";
    }
  }

  function logMouseCoordinates(event) {
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
      "INPUT",
      "TEXTAREA",
      "SELECT",
      "BUTTON",
      "A",
      "IFRAME",
    ];
    return (
      inputLikeElements.includes(focusedElement.tagName) ||
      focusedElement.contentEditable === "true"
    );
  }

  document.addEventListener("mousedown", handleLeftMouseDown);
  document.addEventListener("mouseup", handleLeftMouseUp);
  document.addEventListener("mousemove", logMouseCoordinates);
  document.addEventListener("keydown", handleKeyDown);
  document.addEventListener("keyup", handleKeyUp);
}
