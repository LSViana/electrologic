// Globals
/**
 * @type {CircuitElement}
 */
var currentElement = {};
/**
 * @type {NodeListOf<HTMLElement>}
 */
var elements = {};
/**
 * @type {HTMLElement}
 */
var mainField = {};

// Types and Classes Definitions
const connectorClass = "connector";
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

// Available Circuit Elements
const circuitDescriptors = [
    new CircuitElementDescriptor("and", "./svg/and-gate.svg", "AND Gate", [
        { x: "10%", y: "33%" },
        { x: "10%", y: "52%" },
        { x: "82%", y: "42%" }
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
        div.style.left = `calc(${event.x}px - ${mainField.style.margin})`;
        div.style.top = `calc(${event.y}px - ${mainField.style.margin})`;
        mainField.appendChild(div);
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
        element.appendChild(div);
    }
    //
    elements[element.id] = descriptor;
}