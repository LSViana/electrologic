// Types and Classes Definitions
const connectorClass = "connector";
const simpleButtonClass = "simple-button";
const connectionClass = "connection";
const activeClass = "active";
const currentConnectionClass = "connection-active";
const dataCodeAttribute = "data-code";
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
     * @param {Array} additionals 
     */
    constructor(gateCode, gatePath, description, additionals) {
        this.gateCode = gateCode;
        this.gatePath = gatePath;
        this.description = description;
        this.additionals = additionals;
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
     * @param {Number} alignment
     */
    constructor(connectionId, originId, originConnectorId, originIndex, destinyId, destinyConnectorId, destinyIndex, alignment = .5) {
        this.connectionId = connectionId;
        this.originId = originId;
        this.originConnectorId = originConnectorId;
        this.originIndex = originIndex;
        this.destinyId = destinyId;
        this.destinyConnectorId = destinyConnectorId;
        this.destinyIndex = destinyIndex;
        this.alignment = alignment;
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
/**
 * @type {HTMLElement}
 */
var elementOptions = {};
//
var lastDragButtons = 0,
    lastPosX = 0,
    lastPosY = 0;

// Available Circuit Elements
const circuitDescriptors = [
    new CircuitElementDescriptor("and", "./svg/and-gate.svg", "AND Gate", [{
            x: "14%",
            y: "41%",
            input: true
        },
        {
            x: "14%",
            y: "60%",
            input: true
        },
        {
            x: "86%",
            y: "50%",
            input: false
        }
    ]),
    new CircuitElementDescriptor("simple-switch", "./svg/simple-switch.svg", "Simple Switch", [{
            simpleButton: true,
            x: "37%",
            y: "50%",
        },
        {
            x: "81%",
            y: "50%",
            input: false
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
    elementIds[simpleButtonClass] = 1;
};
loadElementIds();

window.addEventListener("load", initializeWindow);

function initializeWindow() {
    // Getting Main Field to configure element insertion
    mainField = document.querySelector("#main-field");
    mainField.onfocus = () => {
        console.log("oi")
    };
    connectionOptions = document.querySelector("#connection-options");
    initializeConnectionOptions(connectionOptions);
    elementOptions = document.querySelector("#element-options");
    initializeElementOptions(elementOptions);
    mainField.addEventListener("click", handleClickMainField);
    // Initializing Circuit Elements
    let circuitElements = Array.from(document.querySelectorAll(".circuit-element"));
    // Setting up elements to the element container
    circuitElements.forEach((value) => {
        /**
         * @type {String}
         */
        let dataCode = value.getAttribute(dataCodeAttribute);
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
 * Initializes settings at Connection Options
 * @param {HTMLElement} connectionOptions 
 */
function initializeConnectionOptions(connectionOptions) {
    let removeLeftButton = document.querySelector("#remove-connection-left");
    removeLeftButton.addEventListener("click", (ev) => {
        if (currentConnection) {
            removeConnection(currentConnection);
        }
    });
}

/**
 * Initializes settings at Element Options
 * @param {HTMLElement} elementOptions 
 */
function initializeElementOptions(elementOptions) {
    let removeLeftButton = document.querySelector("#remove-element-left");
    removeLeftButton.addEventListener("click", (ev) => {
        if (currentFieldElement)
            removeElement(currentFieldElement);
    });
}

/**
 * Remove the element and the connections associated at memory and DOM
 * @param {HTMLElement} element 
 */
function removeElement(element) {
    let connectionsAssociated = connections.filter((value) => {
        return (value.originId == element.id || value.destinyId == element.id);
    });
    // Removing the connections associated from the @connections variable
    connections = connections.filter((value) => {
        return (value.originId != element.id && value.destinyId != element.id);
    });
    // Removing each associated connection
    for (let connection of connectionsAssociated) {
        removeConnection(connection);
    }
    // Removing the current connection element from DOM
    element.remove();
}

/**
 * Remove a connection from @connections and from DOM
 * @param {CircuitConnection} connection 
 */
function removeConnection(connection) {
    let _connectionIndex = -1;
    let _currentConnection = connections.filter((value, index) => {
        let result = value.connectionId == connection.connectionId;
        if (result)
            _connectionIndex = index;
        return result;
    })[0];
    connections.splice(_connectionIndex, 1);
    let divs = Array.from(document.querySelectorAll(`.${connection.connectionId}`));
    for (let div of divs) {
        div.remove();
    }
    selectConnection(null);
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
    // Removing any connection selection
    selectConnection(null);
    // Removing any connector selection
    selectConnector(null);
    // Removing any element selection
    selectElement(null);
    // Verifying element insertion
    if (currentInsertingElement.element) {
        let div = document.createElement("div");
        div.id = getId(currentInsertingElement.circuitDescriptor.gateCode);
        div.classList.add("circuit-element-field");
        div.setAttribute("data-code", currentInsertingElement.circuitDescriptor.gateCode);
        div.style.position = "absolute";
        mainField.appendChild(div);
        div.style.left = `${event.offsetX - div.clientWidth / 2}px`;
        div.style.top = `${event.offsetY - div.clientHeight / 2}px`;
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
    element.classList.add(descriptor.gateCode);
    // Creating <img> element
    let img = document.createElement("img");
    img.setAttribute("src", descriptor.gatePath);
    img.setAttribute("alt", descriptor.description);
    // Adding <img> element to the div.circuit-element
    element.appendChild(img);
    /**
     * @type {DOMRect}
     */
    let additionalRectangle;
    // Creating <div> connectors
    for (let additionalIndex in descriptor.additionals) {
        let additional = descriptor.additionals[additionalIndex];
        // Button
        if (additional.simpleButton) {
            let div = document.createElement("div");
            div.id = getId(simpleButtonClass);
            div.style.position = "absolute";
            div.classList.add(simpleButtonClass);
            element.appendChild(div);
            additionalRectangle = div.getBoundingClientRect();
            div.style.left = `calc(${additional.x} - ${additionalRectangle.width / 2}px)`;
            div.style.top = `calc(${additional.y} - ${additionalRectangle.height / 2}px)`;
            if (!element.getAttribute(elementDemonstrationClass))
                div.addEventListener("click", handleSimpleSwitchButtonClick);
            // Adding button off attribute
            element.setAttribute(activeClass, false);
        }
        // Standard Connectors
        else {
            let div = document.createElement("div");
            div.id = getId(connectorClass);
            div.style.position = "absolute";
            div.classList.add(connectorClass);
            element.appendChild(div);
            additionalRectangle = div.getBoundingClientRect();
            div.style.left = `calc(${additional.x} - ${additionalRectangle.width / 2}px)`;
            div.style.top = `calc(${additional.y} - ${additionalRectangle.height / 2}px)`;
            div.setAttribute(connectorIndexAttribute, additionalIndex);
            if (!element.getAttribute(elementDemonstrationClass))
                div.addEventListener("click", handleConnectorClick);
        }
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
 * Handle the click at the simple switch button
 * @param {MouseEvent} event 
 */
function handleSimpleSwitchButtonClick(event) {
    // Graphical Treatment
    let _state = this.parentElement.getAttribute(activeClass);
    let state = _state == "true";
    this.parentElement.setAttribute(activeClass, !state);
    // Switching Output
}

/**
 * Makes an HTML Element draggable at mobile platforms
 * @param {HTMLElement} element 
 */
function makeMobileDraggable(element) {
    element.setAttribute("draggable", true);
    let dragSource;
    element.addEventListener("touchstart", (ev) => {
        selectElement(element);
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
        selectElement(element);
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
        selectElement(this);
        lastPosX = event.screenX;
        lastPosY = event.screenY;
    }
}

/**
 * Select an HTML element as the current at DOM and variable @currentFieldElement
 * @param {HTMLElement} element
 */
function selectElement(element) {
    if (element) {
        if (element != currentFieldElement && currentFieldElement)
            currentFieldElement.classList.remove(activeElementClass);
        currentFieldElement = element;
        currentFieldElement.classList.add(activeElementClass);
    } else {
        if (currentFieldElement) {
            currentFieldElement.classList.remove(activeElementClass);
        }
        currentFieldElement = null;
    }
    //
    if (currentFieldElement) {
        elementOptions.classList.add(activeClass);
    } else {
        elementOptions.classList.remove(activeClass);
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
    selectConnector(current);
}

function selectConnector(connector) {
    if (connector) {
        if (connector.parentElement.getAttribute(elementDemonstrationClass))
            return;
        if (!currentConnection.connectionId)
            currentConnection.connectionId = getId(connectionClass);
        if (currentConnection.originId) {
            // Connection already exists
            if (currentConnection.destinyId) {
                selectConnection(null);
                selectConnector(connector);
            }
            let parentDataCode = connector.parentElement.getAttribute(dataCodeAttribute);
            let descriptor = circuitDescriptors.filter((value) => {
                return parentDataCode == value.gateCode;
            })[0];
            if (currentConnection.originId != connector.parentElement.id) {
                let futureDestinyIndex = Number(connector.getAttribute(connectorIndexAttribute));
                let futureDestinyId = connector.parentElement.id;
                // The connection is only allowed if the connectors have different Input/Output characteristics
                let originDescriptor = circuitDescriptors.filter((value) => { return currentConnection.originId.indexOf(value.gateCode) != -1; })[0];
                let destinyDescriptor = circuitDescriptors.filter((value) => { return futureDestinyId.indexOf(value.gateCode) != -1; })[0];
                if(originDescriptor.additionals[currentConnection.originIndex].input == destinyDescriptor.additionals[futureDestinyIndex].input)
                {
                    // Operation not allowed
                    selectConnection(null);
                    selectConnector(null);
                    return;
                }
                //
                currentConnection.destinyId = futureDestinyId;
                currentConnection.destinyConnectorId = connector.id;
                currentConnection.destinyIndex = futureDestinyIndex;
                // Connection done
                connections.push(currentConnection);
                buildConnection(currentConnection);
                // Reset the connect operation and focus mainField to remove any :hover at mobile platforms
                selectConnector(null);
            }
        } else {
            currentConnection.originId = connector.parentElement.id;
            currentConnection.originConnectorId = connector.id;
            currentConnection.originIndex = Number(connector.getAttribute(connectorIndexAttribute));
        }
    } else {
        // Reset any existing active connectors
        currentConnection = new CircuitConnection();
        mainField.focus();
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
        if (currentConnection.connectionId == connectionId) {
            // Nothing here...
        } else {
            selectConnection(null);
            for (let div of divs) {
                div.classList.add(currentConnectionClass);
            }
            currentConnection = connections.filter((value) => {
                return value.connectionId == connectionId
            })[0];
        }
        connectionOptions.classList.add(activeClass);
    } else {
        let divs = Array.from(document.querySelectorAll(`.${currentConnectionClass}`));
        for (let div of divs) {
            div.classList.remove(currentConnectionClass);
        }
        connectionOptions.classList.remove(activeClass);
        currentConnection = new CircuitConnection();
    }
    currentConnection.connectionId = connectionId;
}

/**
 * Update positions at CircuitConnection elements
 * @param {CircuitConnection} connection 
 */
function updateConnection(connection) {
    let alignment = connection.alignment;
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
    let div1Width = Math.abs(originBounds.x - destinyBounds.x) / (1 / alignment) + connectionWidth;
    let div1Left = originBounds.x - mainBounds.x + originBounds.width / 4;
    let div1Top = originBounds.y - mainBounds.y + originBounds.height / 4;
    if (invertHorizontally = (originBounds.x > destinyBounds.x)) {
        div1Height = Math.abs(originBounds.y - destinyBounds.y) / (1 / alignment) + connectionWidth;
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
    let div3Width = Math.abs(originBounds.x - destinyBounds.x) - div1Width + 2 * connectionWidth;
    if (!invertVertically) {
        div3Top += div2.clientHeight - connectionWidth;
    }
    if (invertHorizontally) {
        div3Left -= div1Width - originBounds.width / 2;
        div3Height = Math.abs(originBounds.y - destinyBounds.y) - div1Height + 2 * connectionWidth;
        div3Width = div1Width;
    }
    if (invertVertically) {
        if (invertHorizontally) {
            div3Height = Math.abs(originBounds.y - destinyBounds.y) - div1Height + 2 * connectionWidth;
            div3Top -= (div3Height - connectionWidth);
        } else {
            div3Height = div1Height;
        }
    }
    div3.style.width = `${div3Width}px`;
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