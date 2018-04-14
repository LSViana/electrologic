// Types and Classes Definitions
const connectorClass = "connector";
const connectionClass = "connection";
const connectorIndexAttribute = "data-connector-index";
const elementDemonstrationClass = "demo";
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
     * @param {String} originId
     * @param {Number} originConnectorId 
     * @param {Number} originIndex 
     * @param {String} destinyId 
     * @param {Number} destinyConnectorId 
     * @param {Number} destinyIndex 
     */
    constructor(originId, originConnectorId, originIndex, destinyId, destinyConnectorId, destinyIndex) {
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
var currentElement = new CircuitElement();
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

// Available Circuit Elements
const circuitDescriptors = [
    new CircuitElementDescriptor("and", "./svg/and-gate.svg", "AND Gate", [
        { x: "10%", y: "33%", input: true },
        { x: "10%", y: "52%", input: true },
        { x: "82%", y: "42%", output: true }
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
    // Adding connector ID counter
    elementIds[connectorClass] = 1;
};
loadElementIds();

window.addEventListener("load", initializeWindow);

function initializeWindow() {
    // Getting Main Field to configure element insertion
    mainField = document.querySelector("#main-field");
    mainField.addEventListener("click", onClickMainField);
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
function onClickMainField(event) {
    if (currentElement.element) {
        let div = document.createElement("div");
        div.id = getId(currentElement.circuitDescriptor.gateCode);
        div.classList.add("circuit-element-field");
        div.setAttribute("data-code", currentElement.circuitDescriptor.gateCode);
        div.style.position = "absolute";
        mainField.appendChild(div);
        div.style.left = `${event.x - pxToNumber(mainField.style.margin) - div.clientWidth / 2}px`;
        div.style.top = `${event.y - pxToNumber(mainField.style.margin) - div.clientHeight / 2}px`;
        buildElement(div, currentElement.circuitDescriptor);
    }
    currentElement.circuitDescriptor = currentElement.element = null;
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
    currentElement.circuitDescriptor = elements[element.id];
    currentElement.element = element;
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
    //
    elements[element.id] = descriptor;
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
    if (currentConnection.originId) {
        // Connection already exists
        if (currentConnection.originId == current.parentElement.id) {
        } else {
            currentConnection.destinyId = current.parentElement.id;
            currentConnection.destinyConnectorId = current.id;
            currentConnection.destinyIndex = Number(current.getAttribute(connectorIndexAttribute));
            // Connection done
            connections.push(currentConnection);
            buildConnection(currentConnection);
            // Reset the connect operation
            currentConnection = new CircuitConnection();
        }
    }
    else {
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
    let originConnector = document.getElementById(connection.originConnectorId);
    let destinyConnector = document.getElementById(connection.destinyConnectorId);
    let originBounds = originConnector.getBoundingClientRect();
    let destinyBounds = destinyConnector.getBoundingClientRect();
    let invertVertically = false, invertHorizontally = false;
    let originComputed = window.getComputedStyle(originConnector), destinyComputed = window.getComputedStyle(destinyConnector);
    // Building connection graphically
    let originX = pxToNumber(originComputed.left), originY = pxToNumber(originComputed.top);
    let destinyX = pxToNumber(destinyComputed.left), destinyY = pxToNumber(destinyComputed.top);
    //#region DIV1
    let div1 = document.createElement("div");
    div1.style.position = "absolute";
    let div1Width = Math.abs((pxToNumber(destinyConnector.parentElement.style.left) + destinyX) - (pxToNumber(originConnector.parentElement.style.left) + originX)) / 2 + originConnector.clientWidth;
    let div1Left = pxToNumber(originConnector.parentElement.style.left) + originX + pxToNumber(originComputed.borderTopWidth);
    let div1Top = pxToNumber(originConnector.parentElement.style.top) + originY + pxToNumber(originComputed.borderTopWidth);
    if(invertHorizontally = (originBounds.x > destinyBounds.x)) {
        div1Left -= div1Width;
        div1Left += originConnector.clientHeight;
    }
    div1.style.width = `${div1Width}px`;
    div1.style.left = `${div1Left}px`;
    div1.style.top = `${div1Top}px`;
    div1.classList.add(connectionClass);
    mainField.appendChild(div1);
    //#endregion
    //#region DIV2
    let div2 = document.createElement("div");
    div2.style.position = "absolute";
    let div2Height = Math.round(Math.abs((pxToNumber(destinyConnector.parentElement.style.top) + destinyY) - (pxToNumber(originConnector.parentElement.style.top) + originY)) + originConnector.clientHeight);
    let div2Left = pxToNumber(div1.style.left);
    let div2Top = pxToNumber(originConnector.parentElement.style.top) + originY + originConnector.clientHeight / 2;
    //
    if(invertVertically = (originBounds.y > destinyBounds.y)) {
        div2Top -= div2Height;
        div2Top += originConnector.clientHeight;
    }
    if(!invertHorizontally) {
        div2Left += pxToNumber(div1.style.width) - originBounds.width / 2;
    }
    //
    div2.style.height = `${div2Height}px`;
    div2.style.left = `${div2Left}px`;
    div2.style.top = `${div2Top}px`;
    div2.classList.add(connectionClass);
    mainField.appendChild(div2);
    //#endregion
    //#region DIV3
    let div3 = document.createElement("div");
    div3.style.position = "absolute";
    let div3Left = pxToNumber(div2.style.left);
    let div3Top = pxToNumber(div2.style.top);
    if(!invertVertically) {
        div3Top += div2.clientHeight;
    }
    if(invertHorizontally) {
        div3Left -= div1Width - originBounds.width / 2;
    }
    div3.style.width = div1.style.width;
    div3.style.left = `${div3Left}px`;
    div3.style.top = `${div3Top}px`;
    div3.classList.add(connectionClass);
    mainField.appendChild(div3);
    //#endregion
}

// Utilities
/**
 * Converts, for example, "72px" to 72 as Number
 * @param {String} value 
 */
function pxToNumber(value) {
    return Number(value.replace("px", ""));
}