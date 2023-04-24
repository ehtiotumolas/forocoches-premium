import { usuarios } from "./users.js";
import { getCurrentTab } from "./popup.js";

export let currentPage = 0;

export async function createTable() {
    try {
        var theader = document.createElement("div");
        theader.classList.add("table_row", "table_header");
        var headersList = ["&nbsp", "usuario", "puntos", "mensajes", "hilos",];
        for (var i = 0; i < headersList.length; i++) {
            var header = document.createElement("div");
            header.classList.add("table_cell");
            if (i == 0) { header.classList.add("table_cell_first") }
            if (i == 1) { header.classList.add("table_cell_usuario") }
            if (i == 2) { header.classList.add("table_cell_puntos") }
            if (i == 3) { header.classList.add("table_cell_mensajes") }
            if (i == 4) { header.classList.add("table_cell_hilos") }
            header.innerHTML = headersList[i];
            theader.appendChild(header);
        }
        document.getElementById("content-table").append(theader);
        document.getElementById("content-table").classList.add("visually-hiden");

        var response = await updateTable();
        return response
    }
    catch (e) {
        console.log(e)
        return {"status": 400, "message": "Not OK"};
    }
}
export async function updateTable() {
    try {
        var desde = currentPage * 50;
        var hasta = Math.min(((currentPage + 1) * 50), usuarios.length);
        if (desde > hasta) {
            currentPage =  Math.floor(hasta/50);
            return;
        }
        var userTable = $(".content-table")[0];
        $(".table_body").remove();
        for (let i = desde; i < hasta; i++) {
            const row = document.createElement("div");
            row.classList.add("table_row", "table_body");
            row.addEventListener("click", function () {
                var selected = false;
                if (row.classList.contains("selRow")) {
                    selected = true;
                }                
                if (!selected) row.classList.add("selRow");
                chrome.tabs.update(getCurrentTab().id, { url: 'https://forocoches.com/foro/member.php?u=' + user.id })
            });

            row.id = usuarios[i].usuario;
            var position = document.createElement("div");
            position.classList.add("table_cell", "table_cell_first");
            position.innerText = document.getElementsByClassName("table_row").length + (currentPage * 50);
            row.appendChild(position);
            var usuario = document.createElement("div");
            usuario.classList.add("table_cell_usuario");
            usuario.innerText = usuarios[i].usuario;
            row.append(usuario);
            for (let key in usuarios[i]) {
                var cell = document.createElement("div");
                var valido = false;
                cell.classList.add("table_cell");
                if (key == "puntos") { cell.classList.add("table_cell_puntos"); valido = true; }
                if (key == "mensajes") { cell.classList.add("table_cell_mensajes"); valido = true; }
                if (key == "hilos") { cell.classList.add("table_cell_hilos"); valido = true; }
                if (valido) {
                    cell.innerText = usuarios[i][key];
                    row.appendChild(cell);
                }
            }
            userTable.appendChild(row);
        };
        return {"status": 200, "message": "OK"};
    }
    catch (e) {
        console.log(e)
        return {"status": 400, "message": "Not OK"};
    }
}

export function setPagina(numero) {
    currentPage = numero;
    updateTable();
}