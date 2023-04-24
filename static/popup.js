import { fetchUsers, buscarUsuario, usuarios } from "./users.js";
import { createTable, currentPage, setPagina } from "./table.js";

async function start() {
    await fetchUsers()
        .then(() => createTable())
        .catch((e) => {
            console.log(e);
        });
}

['click'].forEach(evt => {
    document.getElementById("submit-buscar")
        .addEventListener(evt, function (event) {
            event.preventDefault();
            this.tabIndex = 1;
            buscarUsuario(document.getElementById("user-buscar").value, false);
        });
});

document.getElementById("user-buscar")
    .addEventListener("keyup", function (event) {
        event.preventDefault();
        if (event.keyCode === 13 && !this.hasAttribute('disabled')) {
            document.getElementById("submit-buscar").click();
        }
    });

export async function getCurrentTab() {
    return await chrome.tabs.query({ active: true, currentWindow: true }).tabs;
}

start();

$(".nav-element-container").click(function (e) {
    $(".nav-element-container").removeClass("clicked");
    $(this).toggleClass("clicked");
    $('.container-' + $(this).attr('id')).toggleClass("visually-hidden");
});

$("#pagina-left").click(function () {
    setPagina(currentPage - 1);
    if (currentPage == 0) {
        document.getElementById("pagina-left").classList.add("visually-hidden")}
    if (Math.floor(usuarios.length/50) > currentPage) {
        document.getElementById("pagina-right").classList.remove("visually-hidden")
    }
    console.log(currentPage)
});

$("#pagina-right").click(function () {
    setPagina(currentPage + 1);
    if (currentPage != 0) {
        document.getElementById("pagina-left").classList.remove("visually-hidden")}
    if (Math.floor(usuarios.length/50) == currentPage) {
        document.getElementById("pagina-right").classList.add("visually-hidden")
    }
    console.log(currentPage)
});