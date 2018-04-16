// Constants
const gridClass = "back-grid";
const gridCellSize = 50;
const gridSize = 2000;
const initialGridOffset = 100;
// Classes
class FieldElement {
    /**
     * Default constructor to a element on field
     * @param {HTMLElement} element
     * @param {Boolean} movable
     */
    constructor(element, movable) {
        this.element = element;
        this.transform = new ElementTransform(this, movable);
        //

    }
}
class ElementTransform {
    /**
     * Represent an object's transform to move it at the map
     * @param {FieldElement} element
     * @param {Boolean} movable
     */
    constructor(element, movable) {
        if (!element)
            return;
        this.fieldElement = element;
        this.element = element.element;
        this.element.style.position = "absolute";
        // Standards
        this.posX = 0;
        this.posY = 0;
        this.scaleX = 1;
        this.scaleY = 1;
        this.rotate = 0;
        // Setting
        this.setPosX(this.element.clientLeft);
        this.setPosY(this.element.clientTop);
        //
        if (movable)
            this.element.addEventListener("mousemove", (ev) => {
                if (!this.element.style.transform) {
                    transform.setTransform();
                }
                //
                if (ev.buttons & 1 != 0) {
                    let freshX = this.posX + ev.movementX;
                    this.element.setAttribute("a", freshX);
                    this.setPosX(freshX);
                    if (freshX >= window.innerWidth / 2) { // Escaping to right
                        let intervalId = setInterval(() => {
                            this.setPosX(this.posX - .5);
                            if (this.posX <= window.innerWidth / 2) {
                                this.posX = window.innerWidth / 2;
                                clearInterval(intervalId);
                            }
                        }, 16);
                    } else if (freshX <= window.innerWidth / 2 - gridSize) { // Escaped to left
                        let intervalId = setInterval(() => {
                            this.setPosX(this.posX + .5);
                            if (this.posX >= window.innerWidth / 2 - gridSize) {
                                this.posX = window.innerWidth / 2 - gridSize;
                                clearInterval(intervalId);
                            }
                        }, 16);
                    }
                    let freshY = this.posY + ev.movementY;
                    this.setPosY(freshY);
                    if (freshY >= window.innerHeight / 2) { // Escaping to top
                        let intervalId = setInterval(() => {
                            this.setPosY(this.posY - .5);
                            if (this.posY <= window.innerHeight / 2) {
                                this.posY = window.innerHeight / 2;
                                clearInterval(intervalId);
                            }
                        }, 16);
                    } else if (freshY <= window.innerHeight / 2 - gridSize) { // Escaped to bottom
                        let intervalId = setInterval(() => {
                            this.setPosY(this.posY + .5);
                            if (this.posY >= window.innerHeight / 2 - gridSize) {
                                this.posY = window.innerHeight / 2 - gridSize;
                                clearInterval(intervalId);
                            }
                        }, 16);
                    }
                }
            });
    }
    setPosX(posX) {
        this.posX = posX;
        this.setTransform();
    }
    setPosY(posY) {
        this.posY = posY;
        this.setTransform();
    }
    setScaleX(scaleX) {
        this.scaleX = scaleX;
        this.setTransform();
    }
    setScaleY(scaleY) {
        this.scaleY = scaleY;
        this.setTransform();
    }
    setRotate(rotate) {
        this.rotate = rotate;
        this.setTransform();
    }
    setTransform() {
        this.element.style.transform = `translate3d(${this.posX}px, ${this.posY}px, 0px) rotate(${this.rotate}deg) scale3d(${this.scaleX}, ${this.scaleY}, 1)`;
    }
}
// On Load
window.addEventListener("load", (ev) => {
    let element = document.getElementById("main-field");
    let parentElement = element.parentElement;
    let backGrid = new FieldElement(element, false);
    backGrid.element.style.width = `${gridSize}px`;
    backGrid.element.style.height = `${gridSize}px`;
    parentElement.style.width = `${1.125 * element.clientWidth}px`;
    parentElement.style.height = `${1.125 * element.clientHeight}px`;
    element.style.margin = `${.0625 * element.clientHeight}px ${.0625 * element.clientWidth}px`;
    // UNCOMMENT THIS LINE TO CREATE THE GRID
    // makeGrid(backGrid, gridCellSize, gridCellSize);
    // backGrid.transform.setPosX(initialGridOffset);
    // backGrid.transform.setPosY(initialGridOffset);
});
// Functions
/**
 * Adding a field as background to this element
 * @param {FieldElement} element 
 * @param {Number} height
 * @param {Number} width
 */
function makeGrid(element, height, width) {
    let child = element.element;
    let amountX = child.clientWidth / width;
    let amountY = child.clientHeight / height;
    //
    for (let y = 0; y < amountY; y++) {
        let row = document.createElement("div");
        row.style.transform = `translateX(${y * width}px)`;
        child.appendChild(row);
        for (let x = 0; x < amountX; x++) {
            let grid = document.createElement("div");
            grid.classList.add(gridClass);
            grid.style.width = `${width}px`;
            grid.style.height = `${height}px`;
            row.appendChild(grid);
        }
    }
}