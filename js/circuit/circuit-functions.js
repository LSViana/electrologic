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
    elementIds[lampLightClass] = 1;
    elementIds[circuitIdentifier] = 1;
};
loadElementIds();

window.addEventListener("load", initializeWindow);

function initializeWindow() {
    // Getting Main Field to configure element insertion
    mainField = document.querySelector("#main-field");
    mainField.onfocus = () => {
        console.log("oi");
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
        if (elementDescriptor) {
            value.id = getId(dataCode);
            value.setAttribute(elementDemonstrationClass, true);
            buildElement(value, elementDescriptor);
        }
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
    let divs = getConnectionElements(`${connection.connectionId}`);
    for (let div of divs) {
        div.remove();
    }
    // Updating INPUT side about the changes
    let inputElement = document.getElementById(document.getElementById(connection.inputConnectorId).parentElement.id);
    let descriptor = getDescriptor(inputElement.getAttribute(dataCodeAttribute));
    descriptor.updateOutput(inputElement);
    // Deselecting any connection
    selectConnection(null);
}

/**
 * Get the CircuitElementDescriptor corresponding to this data-code String
 * @param {String} dataCode 
 * @returns {CircuitElementDescriptor}
 */
function getDescriptor(dataCode) {
    return circuitDescriptors.filter(isCorrectDescriptor, dataCode)[0];
}

/**
 * Get the CircuitConnection corresponding to this connectionId String
 * @param {String} connectionId 
 * @returns {CircuitConnection}
 */
function getConnection(connectionId) {
    return connections.filter((value) => {
        return value.connectionId == connectionId
    })[0];
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
        let div = document.createElement("div");
        div.style.position = "absolute";
        element.appendChild(div);
        // Button
        if (additional.simpleButton != undefined) {
            div.id = getId(simpleButtonClass);
            div.classList.add(simpleButtonClass);
            additionalRectangle = div.getBoundingClientRect();
            div.style.left = `calc(${additional.x} - ${additionalRectangle.width / 2}px)`;
            div.style.top = `calc(${additional.y} - ${additionalRectangle.height / 2}px)`;
            if (!element.getAttribute(elementDemonstrationClass))
                div.addEventListener("click", handleSimpleSwitchButtonClick);
            // Adding button off attribute
            element.setAttribute(activeClass, false);
        }
        // Lamp
        else if (additional.lamp != undefined) {
            div.id = getId(lampLightClass);
            div.classList.add(lampLightClass);
            additionalRectangle = div.getBoundingClientRect();
            div.style.left = `calc(${additional.x} - ${additionalRectangle.width / 2}px)`;
            div.style.top = `calc(${additional.y} - ${additionalRectangle.height / 2}px)`;
        }
        // Standard Connectors
        else {
            div.id = getId(connectorClass);
            div.classList.add(connectorClass);
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
    if (element.id) {
        elements[element.id] = descriptor;
    }
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
    let descriptor = getDescriptor(this.parentElement.getAttribute(dataCodeAttribute));
    descriptor.updateOutput(this.parentElement);
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
    let lastTouchX = 0,
        lastTouchY = 0;
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
                let originDescriptor = getDescriptor(document.querySelector(`#${currentConnection.originId}`).getAttribute(dataCodeAttribute));
                let destinyDescriptor = getDescriptor(document.querySelector(`#${futureDestinyId}`).getAttribute(dataCodeAttribute));
                let isOriginInput = originDescriptor.additionals[currentConnection.originIndex].input;
                if (isOriginInput == destinyDescriptor.additionals[futureDestinyIndex].input) {
                    // Operation not allowed
                    selectConnection(null);
                    selectConnector(null);
                    return;
                }
                //
                currentConnection.destinyId = futureDestinyId;
                currentConnection.destinyConnectorId = connector.id;
                currentConnection.destinyIndex = futureDestinyIndex;
                // Defining the Input Connector at Connection
                if (isOriginInput) {
                    currentConnection.inputConnectorId = currentConnection.originConnectorId;
                } else {
                    currentConnection.inputConnectorId = currentConnection.destinyConnectorId;
                }
                // Connection done
                insertConnection(currentConnection);
                // Reset the connect operation and focus mainField to remove any :hover at mobile platforms
                selectConnector(null);
                selectConnection(null);
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
 * Inserts the connection at the connections collection and builds it graphically through buildConnection()
 * @param {CircuitConnection} connection 
 */
function insertConnection(connection) {
    connections.push(connection);
    buildConnection(connection);
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
        /**
         * This code is going to add mutation observer only to the first DIV, it means the changes will be "reactive" only when the first DIV is changed, it makes the code execution fall to 1/3 than without the IF clause
         */
        if (divIndex == 0) {

            let mo = new MutationObserver(handleConnectionElectricChange);
            mo.observe(div, {
                attributeFilter: [connectionElectrifiedAttribute]
            });
        }
        div.addEventListener("click", handleConnectionClick);
        div.setAttribute(connectionIdAttribute, connection.connectionId);
        div.setAttribute(connectionIndexAttribute, divIndex++);
        mainField.appendChild(div);
    }
    //#region DIV1
    updateConnection(connection);
    // Calling the update output at the connection output side to avoid non-reactive behaviour at first moment of connection
    let inputConnector = document.getElementById(connection.inputConnectorId);
    let outputElement = document.getElementById(inputConnector.parentElement.id == connection.originId ? connection.destinyId : connection.originId);
    let descriptor = getDescriptor(outputElement.getAttribute(dataCodeAttribute));
    descriptor.updateOutput(outputElement);
}

/**
 * Defines to a set connection to ON (electrified) or OFF (non-electrified)
 * @param {CircuitConnection} _connection 
 * @param {Boolean} active 
 */
function setConnectionState(_connection, active) {
    let _elements = getConnectionElements(_connection.connectionId);
    for (let _element of _elements) {
        if (active)
            _element.setAttribute(connectionElectrifiedAttribute, true);
        else
            _element.setAttribute(connectionElectrifiedAttribute, false);
    }
    _connection.active = active;
}

/**
 * Handles all changes made at any connection, enabling or deactivating it
 * @param {Array} mutations  
 */
function handleConnectionElectricChange(mutations) {
    /**
     * @type {MutationRecord}
     */
    let mutation = mutations[0];
    let _connection = getConnection(mutation.target.getAttribute(connectionIdAttribute));
    let destinyElement = document.getElementById(_connection.inputConnectorId).parentElement;
    let destinyDescriptor = getDescriptor(destinyElement.getAttribute(dataCodeAttribute));
    destinyDescriptor.updateOutput(destinyElement);
}

/**
 * Handle click events at connections
 * @param {MouseEvent} ev 
 */
function handleConnectionClick(ev) {
    let connectionId = ev.target.getAttribute(connectionIdAttribute);
    selectConnection(connectionId);
    ev.stopPropagation();
}

/**
 * Select the divs correspoding to this connection
 * @param {String} connectionId 
 */
function selectConnection(connectionId) {
    if (connectionId) {
        let divs = getConnectionElements(connectionId);
        if (currentConnection.connectionId == connectionId) {
            // Nothing here...
        } else {
            selectConnection(null);
            for (let div of divs) {
                div.classList.add(activeConnectionClass);
            }
            currentConnection = connections.filter((value) => {
                return value.connectionId == connectionId
            })[0];
        }
        connectionOptions.classList.add(activeClass);
    } else {
        let divs = Array.from(document.querySelectorAll(`.${activeConnectionClass}`));
        for (let div of divs) {
            div.classList.remove(activeConnectionClass);
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
    let divs = getConnectionElements(connection.connectionId);
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

/**
 * Get all elements that compose a connection with the supplied Identification
 * @param {String} connectionId 
 * @returns {Array<HTMLDivElement>}
 */
function getConnectionElements(connectionId) {
    return Array.from(document.querySelectorAll(`div[${connectionIdAttribute}="${connectionId}"]`));
}

/**
 * Turns a collection of input connectors (HTMLDivElements) into a collection of booleans (true or false) according to if they are receiving electric energy of if they don't do
 * @param {Array<HTMLDivElement>} connectors 
 */
function getConnectorsStates(connectors) {
    /**
     * @type {Array<Array<CircuitConnection>>}
     */
    let _connections = [];
    for (let inputConnector of connectors) {
        _connections.splice(_connections.length, 0, connections.filter((value) => {
            return value.destinyConnectorId == inputConnector.id || value.originConnectorId == inputConnector.id;
        }));
    }
    /**
     * @type {Array<Boolean>}
     */
    let result = [];
    for (let _connectionGroup of _connections) {
        let _result = false;
        for (let _connection of _connectionGroup) {
            _result |= _connection.active;
        }
        result.push(_result);
    }
    return result;
}

/**
 * Set all connections bound to this connector to the state supplied at @active parameter
 * @param {HTMLElement} connector 
 * @param {Boolean} active 
 */
function setConnectorConnectionsState(connector, active) {
    let _connections = connections.filter((value) => {
        return value.destinyConnectorId == connector.id || value.originConnectorId == connector.id;
    });
    //
    for (let _connection of _connections) {
        setConnectionState(_connection, active);
    }
}

/**
 * This function manages the input and output operationss to logic gates with many INPUT and only one OUTPUT (or multiple outputs with the same result)
 * @param {CircuitElementDescriptor} descriptor 
 * @param {HTMLElement} element 
 * @param {Function} evaluator This evaluator will receive an array of Boolean values with the states of electricity at INPUT CONNECTORS and it must return a Boolean value indicating if there will be electricity at the OUTPUT CONNECTOR
 */
function manageLogicGateChanges(descriptor, element, evaluator) {
    let inputConnectors = descriptor.getInputConnectors(element);
    if (inputConnectors.length > 0) {
        let inputStats = getConnectorsStates(inputConnectors);
        let outputConnectors = descriptor.getOutputConnectors(element);
        let result = evaluator(inputStats);
        // let result = inputStats.reduce((previous, current) => {
        //     return previous && current;
        // }, inputStats[0]);
        for (let outputConnector of outputConnectors) {
            setConnectorConnectionsState(outputConnector, result);
        }
    }
}

/**
 * @returns {Circuit} The circuit corresponding to the current configuration of elements at screen
 */
function getCurrentCircuit() {
    /**
     * @type {Array<CircuitElement>}
     */
    let _elements = [];
    // Getting Elements
    for (let key in elements) {
        let _element = document.getElementById(key);
        if (!(_element.getAttribute(elementDemonstrationClass) != null)) {
            _elements.push(new CircuitElement(_element.id, _element.getAttribute(dataCodeAttribute), _element.getAttribute("style")));
        }
    }
    let result = new Circuit(null, _elements, connections);
    //
    return result;
}

// Utilities
/**
 * Converts, for example, "72px" to 72 as Number
 * @param {String} value 
 */
function pxToNumber(value) {
    return Number(value.replace("px", ""));
}