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
    ], function (element) {
        manageLogicGateChanges(this, element, (inputStats) => {
            return inputStats.reduce((previous, current) => {
                return previous && current;
            }, inputStats[0]);
        });
    }),
    new CircuitElementDescriptor("or", "./svg/or-gate.svg", "OR Gate", [{
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
    ], function (element) {
        manageLogicGateChanges(this, element, (inputStats) => {
            return inputStats.reduce((previous, current) => {
                return previous || current;
            }, inputStats[0]);
        });
    }),
    new CircuitElementDescriptor("nand", "./svg/nand-gate.svg", "NAND Gate", [{
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
    ], function (element) {
        manageLogicGateChanges(this, element, (inputStats) => {
            return !(inputStats.reduce((previous, current) => {
                return previous && current;
            }, inputStats[0]));
        });
    }),
    new CircuitElementDescriptor("nor", "./svg/nor-gate.svg", "NOR Gate", [{
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
    ], function (element) {
        manageLogicGateChanges(this, element, (inputStats) => {
            return !(inputStats.reduce((previous, current) => {
                return previous || current;
            }, inputStats[0]));
        });
    }),
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
    ], function (element) {
        let active = element.getAttribute(activeClass) == "true";
        let outputConnectors = this.getOutputConnectors(element);
        for (let outputConnector of outputConnectors) {
            let _connections = connections.filter((value) => {
                return value.originConnectorId == outputConnector.id || value.destinyConnectorId == outputConnector.id;
            });
            for (let _connection of _connections)
                setConnectionState(_connection, active);
        }
    }),
    new CircuitElementDescriptor("lamp", "./svg/lamp.svg", "Lamp", [{
        x: "20%",
        y: "50%",
        input: true
    }, {
        x: "57.5%",
        y: "50%",
        lamp: true
    }], function (element) {
        let inputs = this.getInputConnectors(element);
        let result = getConnectorsStates(inputs)[0];
        let lamp = document.querySelector(`#${element.id} .${lampLightClass}`);
        //
        if (result) {
            lamp.classList.add(activeClass);
        } else {
            lamp.classList.remove(activeClass);
        }
    })
];

var elementIds = {};