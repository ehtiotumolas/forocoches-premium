import { fetchUsers, buscarUsuario, usuarios } from "./users.js";
import { createTable, currentPage, setPagina, rowsPerPage } from "./table.js";

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
            buscarUsuario(document.getElementById("user-buscar").value);
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
});

$("#pagina-right").click(function () {
    setPagina(currentPage + 1);
});

$("#pagina-first").click(function () {
    setPagina(0);
});

$("#pagina-last").click(function () {
    setPagina(Math.floor(usuarios.length/rowsPerPage));
});