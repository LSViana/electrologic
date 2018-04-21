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
     * @param {Function} updateOutput
     */
    constructor(gateCode, gatePath, description, additionals, updateOutput) {
        this.gateCode = gateCode;
        this.gatePath = gatePath;
        this.description = description;
        this.additionals = additionals;
        this.updateOutput = updateOutput;
    }

    /**
     * @param {HTMLElement} element
     * @returns {Array<HTMLDivElement>}
     */
    getOutputConnectors(element) {
        return Array.from(element.children).filter((value) => {
            return value.classList.contains(connectorClass) && (this.additionals[value.getAttribute(connectorIndexAttribute)].input === false);
        });
    }

    /**
     * @param {HTMLElement} element
     * @returns {Array<HTMLDivElement>}
     */
    getInputConnectors(element) {
        return Array.from(element.children).filter((value) => {
            return value.classList.contains(connectorClass) && (this.additionals[value.getAttribute(connectorIndexAttribute)].input === true);
        });
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
     * @param {String} inputConnectorId
     * @param {Number} destinyIndex
     * @param {Number} alignment
     * @param {Boolean} active
     */
    constructor(connectionId, originId, originConnectorId, originIndex, destinyId, destinyConnectorId, inputConnectorId, destinyIndex, alignment = .5, active = false) {
        this.connectionId = connectionId;
        this.originId = originId;
        this.originConnectorId = originConnectorId;
        this.originIndex = originIndex;
        this.destinyId = destinyId;
        this.destinyConnectorId = destinyConnectorId;
        this.inputConnectorId = inputConnectorId;
        this.destinyIndex = destinyIndex;
        this.alignment = alignment;
        this.active = active;
    }
}