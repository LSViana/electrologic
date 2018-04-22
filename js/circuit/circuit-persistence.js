/**
 * @type {HTMLElement}
 */
let saveCircuitButton;
/**
 * @type {HTMLElement}
 */
let getCircuitButton;
/**
 * @type {HTMLElement}
 */
let clearCircuitButton;

window.addEventListener("load", (ev) => {
    // Adding a new entry to Circuit at LocalStorage if it doesn't exist yet
    if (localStorage.getItem(circuitsIdentifier) == null) {
        localStorage.setItem(circuitsIdentifier, JSON.stringify([]));
    }
    // Save Circuit Button
    saveCircuitButton = document.getElementById("save-circuit");
    saveCircuitButton.addEventListener("click", handleSaveCircuitButtonClick);
    // Get Circuit Button
    getCircuitButton = document.getElementById("get-circuit");
    getCircuitButton.addEventListener("click", handleGetCircuitButtonClick);
    // Clear Circuit Button
    clearCircuitButton = document.getElementById("clear-circuit");
    clearCircuitButton.addEventListener("click", handleClearCircuitButtonClick);

});

/**
 * Handler to Clear Circuit Operation
 * @param {MouseEvent} ev 
 */
function handleClearCircuitButtonClick(ev) {
    clearCircuit();
}

/**
 * Function used to Clear the Circuit
 */
function clearCircuit() {
    for (let kvp of elements) {
        let htmlElement = document.getElementById(kvp["0"]);
        if (htmlElement.getAttribute(elementDemonstrationClass)) {
            continue;
        }
        removeElement(htmlElement);
    }
    deselectAll();
}

/**
 * Handler to Save Circuit Operation
 * @param {MouseEvent} ev 
 */
function handleSaveCircuitButtonClick(ev) {
    let circuitName = prompt("Write the name for this circuit to be saved: ", "circuit-");
    if (circuitName) {
        let circuits = getCircuitsFromLS();
        //
        if (circuits.filter((circuit) => {
                return circuit.name == circuitName;
            }).length > 0) {
            if (confirm("Are you sure about overwriting this circuit?")) {
                saveCurrentCircuit(circuitName);
            }
        } else {
            saveCurrentCircuit(circuitName);
        }
    }
}

/**
 * Handler to Get Circuit Operation
 * @param {MouseEvent} ev 
 */
function handleGetCircuitButtonClick(ev) {
    let promptMessage = getCircuitsFromLS().map((value) => {
        return value.name;
    }).reduce((previous, current) => {
        return previous + "\n" + current;
    }, "Select one of the next circuits:\n");
    //
    let circuitName = prompt(promptMessage, "circuit-");
    if (circuitName) {
        let circuits = getCircuitsFromLS();
        let circuit = circuits.filter((value) => {
            return value.name == circuitName;
        })[0];
        if (circuit != null) {
            clearCircuit();
            buildCircuit(circuit);
        } else {
            alert("Circuit not found, try again!");
        }
    }
}

/**
 * Captures the current circuit and pushes it into LocalStorage using the supplied name
 * @param {String} circuitName 
 */
function saveCurrentCircuit(circuitName) {
    let circuit = getCurrentCircuit();
    circuit.name = circuitName;
    pushCircuit(circuit);
    alert("Circuit saved!");
}

/**
 * Pushs a new Circuit into LocalStorage
 * @param {Circuit} circuit 
 * @param {Array<Circuit>} circuits
 */
function pushCircuit(circuit, circuits = getCircuitsFromLS()) {
    let indexOfCircuit = -1;
    circuits.filter((value, index) => {
        if (value.name == circuit.name) {
            indexOfCircuit = index;
            return;
        }
    });
    if (indexOfCircuit == -1)
        circuits.push(circuit);
    else
        circuits.splice(indexOfCircuit, 1, circuit);
    setCircuitsToLS(circuits);
}

/**
 * @returns {Array<Circuit>}
 */
function getCircuitsFromLS() {
    return JSON.parse(localStorage.getItem(circuitsIdentifier));
}

/**
 * @param {Array<Circuit>} circuits
 * @returns {Array<Circuit>}
 */
function setCircuitsToLS(circuits) {
    localStorage.setItem(circuitsIdentifier, JSON.stringify(circuits));
    return circuits;
}

/**
 * Build the circuit with its elements and connections at field, the already existing elements are kept
 * @param {Circuit} circuit 
 */
function buildCircuit(circuit) {
    // Registering incompabilites, this Map is used to indicate that the elements MUST change its IDS and connections ITS identifiers to avoid collisions with the already existents elements on field
    /**
     * @type {Map<String, String>}
     */
    let freshIds = new Map();
    for (let element of circuit.elements) {
        if (document.getElementById(element.id) != null) {
            freshIds.set(element.id, getId(element["data-code"]));
        } else {
            freshIds.set(element.id, element.id);
        }
        for (let additional of element.additionals) {
            freshIds.set(additional, getId(additional.substr(0, additional.lastIndexOf("-"))));
        }
    }
    // Building elements
    for (let element of circuit.elements) {
        let div = document.createElement("div");
        //
        for (let prop in element) {
            if (prop != "additionals")
                div.setAttribute(prop, element[prop]);
        }
        //
        if (freshIds.get(div.id) != null) {
            div.id = freshIds.get(div.id);
        }
        mainField.appendChild(div);
        div.classList.add(circuitElementFieldClass);
        buildElement(div, getDescriptor(element["data-code"]));
        // Renaming children to match the new IDs
        let _index = 0;
        for (let _element of div.children) {
            if (_element.tagName.toLowerCase() == "div") {
                if (_element.id) {
                    _element.id = freshIds.get(element.additionals[_index]);
                    _index++;
                }
            }
        }
    }
    // Building connections
    for (let connection of circuit.connections) {
        for (let prop in connection) {
            if (freshIds.get(connection[prop]) != null) {
                connection[prop] = freshIds.get(connection[prop]);
            }
        }
        //
        insertConnection(connection);
    }
}