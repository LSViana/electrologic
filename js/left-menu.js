var leftMenuOpen = false;
/**
 * @type {HTMLElement}
 */
var toggleLeftButton;
/**
 * @type {HTMLElement}
 */
var leftMenu;
window.addEventListener("load", () => {
    toggleLeftButton = document.getElementById("toggle-left");
    toggleLeftButton.addEventListener("click", toggleLeftMenu);
    leftMenu = document.getElementById("left-menu");
    toggleLeftMenu();
});
var leftMenuHiddenClass = "left-menu-shown";
//
function toggleLeftMenu() {
    leftMenu.classList.toggle(leftMenuHiddenClass);
    //
    if (leftMenu.classList.contains(leftMenuHiddenClass)) {
        toggleLeftButton.innerText = "«";
    }
    else {
        toggleLeftButton.innerText = "»";
    }
}