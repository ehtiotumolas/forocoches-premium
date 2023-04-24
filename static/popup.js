import { fetchUsers, buscarUsuario } from "./users.js";
import { createTable } from "./table.js";

async function start() {
    await fetchUsers()
        .then(() => createTable())
        .then((x) => {
            if (x.status != 200) {
                toggleHidden();
            }
        })
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

function toggleHidden() {
    $(".container-table, .container-error").toggleClass("visually-hidden");
}