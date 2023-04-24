import { fetchUsers, fetchPoles, buscarUsuario, usuarios } from "./users.js";
import { createTableRanking, createTablePoles, currentPage, setPagina, rowsPerPage } from "./table.js";

async function start() {
    try {
        await fetchUsers()
            .then(() => createTableRanking())
            .then((res) => {
                if (res.status != 200) {
                    $(".container-error, .container-default, .section-nav, .main-content").each(function () {
                        if (!$(this).hasClass("visually-hidden")) $(this).toggleClass("visually-hidden");
                        $(".container-error").toggleClass("visually-hidden");
                    });
                    throw `Cannot connect with the server: ${res.status}`;
                }
            });

        await fetchPoles()
            .then(() => createTablePoles())
            .then((res) => {
                if (res.status != 200) {
                    $(".container-error, .container-default, .section-nav, .main-content").each(function () {
                        if (!$(this).hasClass("visually-hidden")) $(this).toggleClass("visually-hidden");
                        $(".container-error").toggleClass("visually-hidden");
                    });
                    throw `Cannot connect with the server: ${res.status}`;
                }
            });
    }
    catch (error) {
        console.error(error);
    }
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
    $('.main-content:not("visually-hidden")').addClass("visually-hidden")
    if ($(this).hasClass("clicked")) {
        $(this).removeClass("clicked")
        $(".container-default").removeClass("visually-hidden");
        $('.container-' + $(this).attr('id')).addClass("visually-hidden");
    }
    else {
        $(".nav-element-container").removeClass("clicked");
        $(".container-")
        $(this).addClass("clicked");
        $('.container-' + $(this).attr('id')).removeClass("visually-hidden");
    }
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
    setPagina(Math.floor(usuarios.length / rowsPerPage));
});