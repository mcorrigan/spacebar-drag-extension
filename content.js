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
  let useNavThumbnail = true;

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
    useNavThumbnail = data.useNavThumbnail;
    if (useNavThumbnail && pageMapImg.src === "")
      debouncedCaptureScreenshot();
  }

  function debounce(func, delay) {
    let timeoutId;
    return function(...args) {
      clearTimeout(timeoutId);
      timeoutId = setTimeout(() => {
        console.log(lastAnimationTime);
        func.apply(this, args);
      }, delay);
    };
  }

  // internals
  let spaceBarActive = false;
  let dragScrollActive = false;
  let userSelectDefault = document.body.style.userSelect; // we have to prevent select or dragging will select stuff
  let velocityX = 0;
  let velocityY = 0;
  let lastAnimationTime = 0;
  
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
    pointer-events: none;
  `;

  overlay.appendChild(hint);
  document.body.appendChild(overlay);

  // Create an image element to display the thumbnail
  const pageMap = document.createElement('div');
  pageMap.style.cssText = `
    position: fixed;
    top: 0px;
    right: 0px;
    bottom: 0px;
    left: calc(100% - 180px);
    z-index: 2147483647;
    box-sizing: border-box;
    border-left: 2px solid rgb(200, 200, 200);
    background-color: rgb(65, 65, 65);
    box-shadow: 0px 0px 10px 0px;
    transition: opacity 0.2s;
    opacity: 0;
  `;
  // add hover
  pageMap.addEventListener('dragenter', () => {
    if (spaceBarActive)
      pageMap.style.opacity = .25;
  });
  pageMap.addEventListener('dragleave', () => {
    if (spaceBarActive)
      pageMap.style.opacity = 1;
  });
  pageMap.addEventListener('mouseenter', () => {
    if (spaceBarActive)
      pageMap.style.opacity = .25;
  });
  pageMap.addEventListener('mouseleave', () => {
    if (spaceBarActive)
      pageMap.style.opacity = 1;
  });
  const pageMapImg = document.createElement('img');
  pageMapImg.style.cssText = `
    width: 100%;
  `;
  pageMap.appendChild(pageMapImg);
  const mapOverlay = document.createElement('div');
  mapOverlay.style.cssText = `
    background-color: rgba(255, 255, 255, .25);
    width: 100%;
    height: 120px;
    position: absolute;
    top: 0px;
    border: 1px solid black;
  `;
  pageMap.appendChild(mapOverlay);
  document.body.appendChild(pageMap);

  // determine when the page has fully finished loading or window is resized - debounce these events before capturing screenshot
  // TODO: If user is actively scrolling or typing, don't capture screenshot yet, continue to debounce screenshot capture
  const debouncedCaptureScreenshot = debounce(captureScreenshot, 250);
  const handleCaptureScreenshot = () => {
    if (useNavThumbnail)
      debouncedCaptureScreenshot();
  };
  window.addEventListener("load", handleCaptureScreenshot); // page fully loads
  window.addEventListener("resize", handleCaptureScreenshot); // page resizes
  window.addEventListener("popstate", handleCaptureScreenshot); // URL changes?
  window.addEventListener("hashchange", handleCaptureScreenshot); // hash changes?
  // these should only affect is a capture is already going to happen, not trigger a new capture
  // window.addEventListener("scroll", handleCaptureScreenshot); // scroll changes
  // window.addEventListener("keydown", handleCaptureScreenshot); // keydown changes
  // window.addEventListener("mousemove", handleCaptureScreenshot); // mousemove changes

  // listen for body scroll height or width changes indicating a dynamically loaded page
  // Initial scroll height and width
  let lastScrollHeight = document.body.scrollHeight;
  let lastScrollWidth = document.body.scrollWidth;
  // Observer callback
  const observerCallback = () => {
    const currentScrollHeight = document.body.scrollHeight;
    const currentScrollWidth = document.body.scrollWidth;

    if (useNavThumbnail && 
        (currentScrollHeight !== lastScrollHeight || currentScrollWidth !== lastScrollWidth)) {
      lastScrollHeight = currentScrollHeight;
      lastScrollWidth = currentScrollWidth;
      debouncedCaptureScreenshot();
    }
  };
  const observer = new MutationObserver(observerCallback);
  observer.observe(document.body, {
    attributes: true,
    childList: true,
    subtree: true,
  });


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
    if (isNonInputElement() && event.keyCode === SPACEBAR_KEY) {
      if (!spaceBarActive) {
        event.preventDefault();

        if (useNavThumbnail){
          pageMap.style.opacity = 1;
          updateThumbnailOverlay();
        }else{
          pageMap.style.opacity = 0;
        }

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
    if (event.keyCode === SPACEBAR_KEY && isNonInputElement()) {
      spaceBarActive = false;
      overlay.style.opacity = 0;
      overlay.style.height = 0;
      overlay.style.border = "none";

      pageMap.style.opacity = 0;

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

      if (useNavThumbnail){
        updateThumbnailOverlay();
      }
    }
  }

  function slowScroll() {
    // Gradually slow down scrolling using velocity and friction
    if (Math.abs(velocityX) > 0.1 || Math.abs(velocityY) > 0.1) {
      lastAnimationTime = performance.now();
      if (!invertScroll) {
        window.scrollBy(-velocityX, -velocityY);
      } else {
        window.scrollBy(velocityX, velocityY);
      }
      updateThumbnailOverlay();
      velocityX *= friction;
      velocityY *= friction;
      requestAnimationFrame(slowScroll);
    }
  }

  function updateThumbnailOverlay() {

    // TODO: the constaints should be on the image height, not the window height

    const scrollX = window.scrollX;
    const scrollY = window.scrollY;
    const pageWidth = document.body.scrollWidth;
    const pageHeight = document.body.scrollHeight;
    const viewportWidth = window.innerWidth;
    const viewportHeight = window.innerHeight;

    const x = (scrollX / pageWidth) * 100;
    const y = (scrollY / pageHeight) * 100;
    const width = (viewportWidth / pageWidth) * 100;
    const height = (viewportHeight / pageHeight) * 100;

    mapOverlay.style.left = `${x}%`;
    mapOverlay.style.top = `${y}%`;
    mapOverlay.style.width = `${width}%`;
    mapOverlay.style.height = `${height}%`;
  }

  function isNonInputElement() {
    const focusedElement = document.activeElement;
    const generallySafeElements = [
      "BODY", 
      "DIV", "SPAN", "P", 
      "H1", "H2", "H3", "H4", "H5", "H6", 
      "UL", "OL", "LI",
      "DL", "DT", "DD",
      "TABLE", "TR", "TD", "TH", "TBODY", "THEAD", "TFOOT", "CAPTION", "COL", "COLGROUP",
      "THEAD", "TFOOT", "TBODY", "TR", "TD", "TH",
    ];

    return generallySafeElements.includes(focusedElement.tagName) &&
      focusedElement.contentEditable !== "true" &&
      focusedElement.onclick === null;
  }

  function activeElementInputType() {
    const focusedElement = document.activeElement;
    console.log(focusedElement.tagName)

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

  function captureScreenshot() {
    // Use html2canvas to capture the body
    console.log('capturing screenshot...')
    const options = {
      // ignore our nav thumbnail and outline 
      // https://html2canvas.hertzen.com/configuration
      ignoreElements: (element) => {
        return element === pageMap || element === overlay;
      },
      logging: false,
    };
    html2canvas(document.body, options).then(canvas => {
      // Convert the canvas to an image
      const imgData = canvas.toDataURL('image/png');
      pageMapImg.src = imgData;
    }).catch(err => {
      console.error('Error capturing screenshot:', err);
    });
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
