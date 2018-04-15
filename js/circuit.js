// Types and Classes Definitions
const connectorClass = "connector";
const connectionClass = "connection";
const activeConnectionOptions = "connection-options-active";
const activeConnectionClass = "connection-active";
const mainFieldInsertingClass = "main-field-inserting";
const activeElementClass = "element-active";
const connectorIndexAttribute = "data-connector-index";
const connectionIndexAttribute = "data-connection-index";
const elementDemonstrationClass = "demo";
const connectionWidth = 12;
const connectionWidthText = `${connectionWidth}px`;
// Dummy element used to hide Drag and Drop previews
const dummyElement = document.createElement("div");
dummyElement.style.position = "absolute";
dummyElement.style.width = dummyElement.style.height = "1px";
dummyElement.style.left = dummyElement.style.top = "-1px";
document.body.appendChild(dummyElement);

/**
 * Class to represent circuit element
 */
class CircuitElement {
    /**
     * Standard constructor to CircuitElement to keep description and element representing it
     * @param {HTMLElement} element 
     * @param {CircuitElementDescriptor} circuitDescriptor 
     */
    constructor(element, circuitDescriptor) {
        this.element = element;
        this.circuitDescriptor = circuitDescriptor;
    }
}
/**
 * Class to describe how to build circuit elements
 */
class CircuitElementDescriptor {
    /**
     * Creating a new Circuit Element Descriptor allows to build elements at DOM
     * @param {String} gateCode 
     * @param {String} gatePath 
     * @param {String} description 
     * @param {Array} connectors 
     */
    constructor(gateCode, gatePath, description, connectors) {
        this.gateCode = gateCode;
        this.gatePath = gatePath;
        this.description = description;
        this.connectors = connectors;
    }
}
class CircuitConnection {
    /**
     * Creating a new Circuit Connection that makes the bindings between circuit elements
     * @param {String} connectionId
     * @param {String} originId
     * @param {Number} originConnectorId 
     * @param {Number} originIndex 
     * @param {String} destinyId 
     * @param {Number} destinyConnectorId 
     * @param {Number} destinyIndex 
     */
    constructor(connectionId, originId, originConnectorId, originIndex, destinyId, destinyConnectorId, destinyIndex) {
        this.connectionId = connectionId;
        this.originId = originId;
        this.originConnectorId = originConnectorId;
        this.originIndex = originIndex;
        this.destinyId = destinyId;
        this.destinyConnectorId = destinyConnectorId;
        this.destinyIndex = destinyIndex;
    }
}

// Globals
/**
 * @type {CircuitElement}
 */
var currentInsertingElement = new CircuitElement();
/**
 * @type {HTMLElement}
 */
var currentFieldElement;
/**
 * @type {CircuitConnection}
 */
var currentConnection = new CircuitConnection();
/**
 * @type {Map<String, CircuitElementDescriptor>}
 */
var elements = new Map();
/**
 * @type {Array<CircuitConnection>}
 */
var connections = new Array();
/**
 * @type {HTMLElement}
 */
var mainField = {};
/**
 * @type {HTMLElement}
 */
var connectionOptions = {};
//
var lastDragButtons = 0,
    lastPosX = 0,
    lastPosY = 0;

// Available Circuit Elements
const circuitDescriptors = [
    new CircuitElementDescriptor("and", "./svg/and-gate.svg", "AND Gate", [{
            x: "10%",
            y: "33%",
            input: true
        },
        {
            x: "10%",
            y: "52%",
            input: true
        },
        {
            x: "82%",
            y: "42%",
            output: true
        }
    ])
];

var elementIds = {};
/**
 * Function to load element IDs to be used as identity
 */
function loadElementIds() {
    for (var circuitDescriptorIndex in circuitDescriptors) {
        let circuitDescriptor = circuitDescriptors[circuitDescriptorIndex];
        elementIds[circuitDescriptor.gateCode] = 1;
    }
    // Adding custom ID counters
    elementIds[connectorClass] = 1;
    elementIds[connectionClass] = 1;
};
loadElementIds();

window.addEventListener("load", initializeWindow);

function initializeWindow() {
    // Getting Main Field to configure element insertion
    mainField = document.querySelector("#main-field");
    connectionOptions = document.querySelector("#connection-options");
    mainField.addEventListener("click", handleClickMainField);
    // Initializing Circuit Elements
    let circuitElements = Array.from(document.querySelectorAll(".circuit-element"));
    // Setting up elements to the element container
    circuitElements.forEach((value) => {
        /**
         * @type {String}
         */
        let dataCode = value.getAttribute("data-code");
        let elementDescriptor = getDescriptor(dataCode);
        value.id = getId(dataCode);
        value.setAttribute(elementDemonstrationClass, true);
        buildElement(value, elementDescriptor);
    });
    // Initializing Circuit Element factory
    circuitElements.forEach((value) => {
        buildElementFactory(value);
    });
}

/**
 * Get the CircuitElementDescriptor corresponding to this data-code String attribute
 * @param {String} dataCode 
 * @returns {CircuitElementDescriptor}
 */
function getDescriptor(dataCode) {
    return circuitDescriptors.filter(isCorrectDescriptor, dataCode)[0];
}

/**
 * Initialize MainField
 * @param {MouseEvent} event 
 */
function handleClickMainField(event) {
    // Removing any select connection
    selectConnection(null);
    // Verifying element insertion
    if (currentInsertingElement.element) {
        let div = document.createElement("div");
        div.id = getId(currentInsertingElement.circuitDescriptor.gateCode);
        div.classList.add("circuit-element-field");
        div.setAttribute("data-code", currentInsertingElement.circuitDescriptor.gateCode);
        div.style.position = "absolute";
        mainField.appendChild(div);
        div.style.left = `${event.layerX - div.clientWidth / 2}px`;
        div.style.top = `${event.layerY - div.clientHeight / 2}px`;
        buildElement(div, currentInsertingElement.circuitDescriptor);
        currentInsertingElement.circuitDescriptor = currentInsertingElement.element = null;
    }
}

/**
 * Return a positive whole number as ID to the corresponding element code
 * @param {String} dataCode 
 */
function getId(dataCode) {
    return `${dataCode}-${elementIds[dataCode.toLowerCase()]++}`;
}

/**
 * Element used as shape to create another circuit elements
 * @param {HTMLElement} element 
 */
function buildElementFactory(element) {
    element.addEventListener("click", () => {
        startInsertingElement(element);
    });
}

function startInsertingElement(element) {
    currentInsertingElement.circuitDescriptor = elements[element.id];
    currentInsertingElement.element = element;
}

/**
 * Function to get the descriptor corresponding to this data-code
 * @param {CircuitElementDescriptor} descriptor
 */
function isCorrectDescriptor(descriptor) {
    // @this is the dataCode here!
    return descriptor.gateCode.toLocaleLowerCase() == this;
}

/**
 * Function to build a circuit element from a div element
 * @param {HTMLElement} element 
 * @param {CircuitElementDescriptor} descriptor
 */
function buildElement(element, descriptor) {
    // Creating <img> element
    let img = document.createElement("img");
    img.setAttribute("src", descriptor.gatePath);
    img.setAttribute("alt", descriptor.description);
    // Adding <img> element to the div.circuit-element
    element.appendChild(img);
    // Creating <div> connectors
    for (let connectorIndex in descriptor.connectors) {
        let connector = descriptor.connectors[connectorIndex];
        let div = document.createElement("div");
        div.id = getId(connectorClass);
        div.style.position = "absolute";
        div.classList.add(connectorClass);
        div.style.left = `calc(${connector.x} - ${div.clientWidth / 2}px)`;
        div.style.top = `calc(${connector.y} - ${div.clientHeight / 2}px)`;
        div.style.top = connector.y;
        div.setAttribute(connectorIndexAttribute, connectorIndex);
        div.addEventListener("click", handleConnectorClick);
        element.appendChild(div);
    }
    // Adding custom changes
    if (!element.getAttribute(elementDemonstrationClass)) {
        makeMobileDraggable(element);
        makeDesktopDraggable(element);
        element.addEventListener("click", handleElementClick);
        let mo = new MutationObserver(handleChanges);
        mo.observe(element, {
            attributeFilter: ["style"]
        });
    }
    //
    elements[element.id] = descriptor;
}

/**
 * Makes an HTML Element draggable at mobile platforms
 * @param {HTMLElement} element 
 */
function makeMobileDraggable(element) {
    element.setAttribute("draggable", true);
    let dragSource;
    element.addEventListener("touchstart", (ev) => {
        if (element.getAttribute("draggable")) {
            dragSource = element;
            return false;
        }
    }, {
        passive: true
    });
    let lastTouchX = -1,
        lastTouchY = -1;
    element.addEventListener("touchmove", (ev) => {
        if (element == dragSource) {
            let touch = ev.touches[0];
            if (lastTouchX == -1 || lastTouchY == -1) {
                // Nothing before initializing
            } else {
                element.style.left = `${pxToNumber(element.style.left) + (touch.clientX - lastTouchX)}px`;
                element.style.top = `${pxToNumber(element.style.top) + (touch.clientY - lastTouchY)}px`;
            }
            lastTouchX = touch.clientX;
            lastTouchY = touch.clientY;
            ev.preventDefault();
        }
    });
    element.addEventListener("touchend", (ev) => {
        if (element == dragSource) {
            dragSource = null;
            return false;
        }
    });
}

/**
 * Makes an element draggable at Desktop Platforms
 * @param {HTMLElement} element 
 */
function makeDesktopDraggable(element) {
    let lastTouchX = -1,
        lastTouchY = -1;
    element.addEventListener("dragstart", (ev) => {
        ev.preventDefault();
        return false;
    });
    element.addEventListener("mousedown", (ev) => {
        let rect = element.getBoundingClientRect();
        lastTouchX = ev.screenX;
        lastTouchY = ev.screenY;
    });
    element.addEventListener("mousemove", (ev) => {
        if ((ev.buttons & 1) != 0) {
            element.style.zIndex = "1000";
            if (lastTouchX != -1 && lastTouchY != -1) {
                moveAt(ev.screenX, ev.screenY);
            }
            lastTouchX = ev.screenX;
            lastTouchY = ev.screenY;
        }
    });
    element.addEventListener("mouseup", () => {
        element.style.zIndex = "";
    });

    function moveAt(posX, posY) {
        let x = (posX - lastTouchX) + element.offsetLeft,
            y = (posY - lastTouchY) + element.offsetTop;
        if (x < 0)
            x = 0;
        if (y < 0)
            y = 0;
        element.style.left = x + 'px';
        element.style.top = y + 'px';
    }
}

/**
 * Method used to handle changes at Circuit Elements at Field
 * @param {Array} mutationList 
 */
function handleChanges(mutationList) {
    for (let mutationIndex in mutationList) {
        /**
         * @type {MutationRecord}
         */
        let mutation = mutationList[mutationIndex];
        let targetId = mutation.target.id;
        let _connections = connections.filter((value) => {
            return (value.originId == targetId || value.destinyId == targetId)
        });
        for (let connection of connections) {
            updateConnection(connection);
        }
    }
}

/**
 * Handles element click operation
 * @param {MouseEvent} event 
 */
function handleElementClick(event) {
    event.stopPropagation();
    if (currentFieldElement != this) {
        if (currentFieldElement) {
            currentFieldElement.classList.remove(activeElementClass);
        }
        lastPosX = event.screenX;
        lastPosY = event.screenY;
        currentFieldElement = this;
        currentFieldElement.classList.add(activeElementClass);
    }
}

/**
 * Method that handles connector click, when it is starting to connect or ending a connection
 * @param {MouseEvent} event 
 */
function handleConnectorClick(event) {
    /**
     * @type {HTMLDivElement}
     */
    let current = this;
    if (current.parentElement.getAttribute(elementDemonstrationClass))
        return;
    if (!currentConnection.connectionId)
        currentConnection.connectionId = getId(connectionClass);
    if (currentConnection.originId) {
        // Connection already exists
        if (currentConnection.originId == current.parentElement.id) {} else {
            currentConnection.destinyId = current.parentElement.id;
            currentConnection.destinyConnectorId = current.id;
            currentConnection.destinyIndex = Number(current.getAttribute(connectorIndexAttribute));
            // Connection done
            connections.push(currentConnection);
            buildConnection(currentConnection);
            // Reset the connect operation and focus mainField to remove any :hover at mobile platforms
            currentConnection = new CircuitConnection();
        }
    } else {
        currentConnection.originId = current.parentElement.id;
        currentConnection.originConnectorId = current.id;
        currentConnection.originIndex = Number(current.getAttribute(connectorIndexAttribute));
    }
}

/**
 * Build connection graphically to be shown at field
 * @param {CircuitConnection} connection 
 */
function buildConnection(connection) {
    let div1 = document.createElement("div");
    let div2 = document.createElement("div");
    let div3 = document.createElement("div");
    let divs = [div1, div2, div3];
    let divIndex = 0;
    for (let div of divs) {
        div.addEventListener("click", handleConnectionClick);
        div.classList.add(connection.connectionId);
        div.setAttribute(connectionIndexAttribute, divIndex++);
        mainField.appendChild(div);
    }
    //#region DIV1
    updateConnection(connection);
}

let activeConnection;
/**
 * Handle click events at connections
 * @param {MouseEvent} ev 
 */
function handleConnectionClick(ev) {
    let connectionId;
    for (let className of this.classList) {
        if (className.indexOf(`${connectionClass}-`) != -1 && Number.parseInt(className.substr(connectionClass.length + 1))) {
            connectionId = className;
        }
    }
    selectConnection(connectionId);
    ev.stopPropagation();
}

/**
 * Select the divs correspoding to this connection
 * @param {String} connectionId 
 */
function selectConnection(connectionId) {
    if (connectionId) {
        let divs = Array.from(document.querySelectorAll(`.${connectionId}`));
        if (activeConnection == connectionId) {

        } else {
            selectConnection(null);
            for (let div of divs) {
                div.classList.add(activeConnectionClass);
            }
        }
        connectionOptions.classList.add(activeConnectionOptions);
    } else {
        let divs = Array.from(document.querySelectorAll(`.${activeConnectionClass}`));
        for (let div of divs) {
            div.classList.remove(activeConnectionClass);
        }
        connectionOptions.classList.remove(activeConnectionOptions);
    }
    activeConnection = connectionId;
}

/**
 * Update positions at CircuitConnection elements
 * @param {CircuitConnection} connection 
 */
function updateConnection(connection) {
    let originConnector = document.getElementById(connection.originConnectorId);
    let destinyConnector = document.getElementById(connection.destinyConnectorId);
    let originBounds = originConnector.getBoundingClientRect();
    let destinyBounds = destinyConnector.getBoundingClientRect();
    var mainBounds = mainField.getBoundingClientRect();
    let invertVertically = false,
        invertHorizontally = false;
    let divs = Array.from(document.getElementsByClassName(connection.connectionId));
    let div1 = divs.filter((value) => {
        return value.getAttribute(connectionIndexAttribute) == "0";
    })[0];
    let div2 = divs.filter((value) => {
        return value.getAttribute(connectionIndexAttribute) == "1";
    })[0];
    let div3 = divs.filter((value) => {
        return value.getAttribute(connectionIndexAttribute) == "2";
    })[0];
    div1.style.position = "absolute";
    let div1Height = connectionWidth;
    let div1Width = Math.abs(originBounds.x - destinyBounds.x) / 2 + connectionWidth;
    let div1Left = originBounds.x - mainBounds.x + originBounds.width / 4;
    let div1Top = originBounds.y - mainBounds.y + originBounds.height / 4;
    if (invertHorizontally = (originBounds.x > destinyBounds.x)) {
        div1Height = Math.abs(originBounds.y - destinyBounds.y) / 2;
        div1Width = connectionWidth;
    }
    if (invertVertically = (originBounds.y > destinyBounds.y)) {
        if (invertHorizontally) {
            div1Top -= div1Height - connectionWidth;
        }
    }
    div1.style.height = `${div1Height}px`;
    div1.style.width = `${div1Width}px`;
    div1.style.left = `${div1Left}px`;
    div1.style.top = `${div1Top}px`;
    mainField.appendChild(div1);
    //#endregion
    //#region DIV2
    div2.style.position = "absolute";
    let div2Height = Math.abs(originBounds.y - destinyBounds.y) + originBounds.height / 2;
    let div2Left = div1Left;
    let div2Top = div1Top;
    let div2Width = connectionWidth;
    //
    if (invertVertically) {
        div2Top -= div2Height;
        div2Top += originConnector.clientHeight;
    }
    if (!invertHorizontally) {
        div2Left += div1Width - connectionWidth;
    } else {
        div2Top = div1Top + div1Height - connectionWidth;
        div2Height = connectionWidth;
        div2Width = Math.abs(originBounds.x - destinyBounds.x) + connectionWidth;
        div2Left -= div2Width - connectionWidth;
    }
    if (invertVertically) {
        div2Top -= div1Height - connectionWidth;
    }
    //
    div2.style.height = `${div2Height}px`;
    div2.style.width = `${div2Width}px`;
    div2.style.left = `${div2Left}px`;
    div2.style.top = `${div2Top}px`;
    mainField.appendChild(div2);
    //#endregion
    //#region DIV3
    div3.style.position = "absolute";
    let div3Left = div2Left;
    let div3Top = div2Top;
    let div3Height = div1Height;
    if (!invertVertically) {
        div3Top += div2.clientHeight - connectionWidth;
    }
    if (invertHorizontally) {
        div3Left -= div1Width - originBounds.width / 2;
        div3Height += 2 * connectionWidth;
    }
    if (invertVertically) {
        if (invertHorizontally) {
            div3Top -= div1Height + connectionWidth;
            div3Height = div1Height + 2 * connectionWidth;
        } else {
            div3Height = div1Height;
        }
    }
    div3.style.width = div1.style.width;
    div3.style.height = `${div3Height}px`;
    div3.style.left = `${div3Left}px`;
    div3.style.top = `${div3Top}px`;
    mainField.appendChild(div3);
    //#endregion
    div1.classList.add(connectionClass);
    div2.classList.add(connectionClass);
    div3.classList.add(connectionClass);
}

// Utilities
/**
 * Converts, for example, "72px" to 72 as Number
 * @param {String} value 
 */
function pxToNumber(value) {
    return Number(value.replace("px", ""));
}