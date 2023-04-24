import { usuarios, poles } from "./users.js";
import { getCurrentTab } from "./popup.js";

export let currentPage = 0;
export const rowsPerPage = 20;

export async function createTableRanking() {
    try {
        var theader = document.createElement("div");
        theader.classList.add("table_row", "table_header", "table_ranking");
        var headersList = ["&nbsp", "usuario", "puntos", "mensajes", "hilos",];
        for (var i = 0; i < headersList.length; i++) {
            var header = document.createElement("div");
            header.classList.add("table_header_ranking");
            if (i == 0) { header.classList.add("table_header_ranking_first") }
            if (i == 1) { header.classList.add("table_header_ranking_usuario") }
            if (i == 2) { header.classList.add("table_header_ranking_puntos") }
            if (i == 3) { header.classList.add("table_header_ranking_mensajes") }
            if (i == 4) { header.classList.add("table_header_ranking_hilos") }
            header.innerHTML = headersList[i];
            theader.appendChild(header);
        }
        document.getElementById("content-table-ranking").append(theader);

        var response = await updateTableRanking();
        return response
    }
    catch (e) {
        console.log(e)
        return { "status": 400, "message": "Not OK" };
    }
}

export async function updateTableRanking() {
    try {
        var desde = currentPage * rowsPerPage;
        var hasta = Math.min(((currentPage + 1) * rowsPerPage), usuarios.length);
        if (desde > hasta) {
            currentPage = Math.floor(hasta / rowsPerPage);
            return;
        }
        var userTable = $(".content-table-ranking")[0];
        $(".table_body.table_ranking").remove();
        for (let i = desde; i < hasta; i++) {
            var usuario = usuarios[i].usuario;
            const row = document.createElement("div");
            row.classList.add("table_row", "table_body", "table_ranking");
            row.addEventListener("click", function () {
                var selected = false;
                if (row.classList.contains("selRow")) {
                    selected = true;
                }
                userTable.querySelectorAll('.table_row').forEach(tr => tr.classList.remove("selRow"));
                if (!selected) row.classList.add("selRow");
                chrome.tabs.update(getCurrentTab().id, { url: 'https://forocoches.com/foro/member.php?u=' + usuarios[i].usuario_id })
            });

            row.id = usuario;
            var position = document.createElement("div");
            var numRows = $(".table_row.table_ranking").length;
            position.classList.add("table_cell", "table_cell_first");
            position.innerText = numRows + (currentPage * rowsPerPage);
            if (position.innerText == 1) {row.classList.add("first-row")}
            if (position.innerText == 2) {row.classList.add("second-row")}
            if (position.innerText == 3) {row.classList.add("third-row")}
            row.appendChild(position);
            var usuario_ele = document.createElement("div");
            usuario_ele.classList.add("table_cell_usuario");
            usuario_ele.innerText = usuario;
            row.append(usuario_ele);
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
        return { "status": 200, "message": "OK" };
    }
    catch (e) {
        console.log(e)
        return { "status": 400, "message": "Not OK" };
    }
}


export async function createTablePoles() {
    try {
        var theader = document.createElement("div");
        theader.classList.add("table_row", "table_header", "table_poles");
        var headersList = ["&nbsp", "usuario", "poles", "+info"];
        for (var i = 0; i < headersList.length; i++) {
            var header = document.createElement("div");
            header.classList.add("table_header_poles");
            if (i == 0) { header.classList.add("table_header_poles_first") }
            if (i == 1) { header.classList.add("table_header_poles_usuario") }
            if (i == 2) { header.classList.add("table_header_poles_poles") }
            if (i == 3) { header.classList.add("table_header_poles_mas_info") }
            header.innerHTML = headersList[i];
            theader.appendChild(header);
        }
        document.getElementById("content-table-poles").append(theader);

        var response = await updateTablePoles();
        return response
    }
    catch (e) {
        console.log(e)
        return { "status": 400, "message": "Not OK" };
    }
}

export async function updateTablePoles() {
    try {
        var userTable = $(".content-table-poles")[0];
        var hasta = Math.min(20, poles.length);

        //$(".table_body").remove();
        for (let i = 0; i < hasta; i++) {
            var usuario = poles[i].usuario;
            const row = document.createElement("div");
            row.classList.add("table_row", "table_body", "table_poles");
            row.addEventListener("click", function () {
                var selected = false;
                if (row.classList.contains("selRow")) {
                    selected = true;
                }
                userTable.querySelectorAll('.table_row').forEach(tr => tr.classList.remove("selRow"));
                if (!selected) row.classList.add("selRow");
                chrome.tabs.update(getCurrentTab().id, { url: 'https://forocoches.com/foro/member.php?u=' + poles[i].usuario_id })
            });

            row.id = usuario;
            var position = document.createElement("div");
            var numRows = document.getElementsByClassName("table_poles").length;
            position.classList.add("table_cell", "table_cell_first");
            position.innerText = numRows;
            if (position.innerText == 1) {row.classList.add("first-row")}
            if (position.innerText == 2) {row.classList.add("second-row")}
            if (position.innerText == 3) {row.classList.add("third-row")}
            row.appendChild(position);
            var usuario_ele = document.createElement("div");
            usuario_ele.classList.add("table_cell_usuario_poles");
            usuario_ele.innerText = usuario;
            row.append(usuario_ele);
            for (let key in poles[i]) {
                var cell = document.createElement("div");
                var valido = false;
                cell.classList.add("table_cell");
                if (key == "poles") { cell.classList.add("table_cell_poles_poles"); valido = true; }
                if (key == "mas_info") { cell.classList.add("table_cell_mas_info_poles"); valido = true; }
                if (valido) {
                    cell.innerText = poles[i][key];
                    row.appendChild(cell);
                }
            }
            userTable.appendChild(row);
        };
        return { "status": 200, "message": "OK" };
    }
    catch (e) {
        console.log(e)
        return { "status": 400, "message": "Not OK" };
    }
}

export function setPagina(numero) {
    currentPage = numero;
    if (currentPage == 0) {
        $("#pagina-left").addClass("page-visually-hidden");
        $("#pagina-first").addClass("page-visually-hidden");
    }
    else if (currentPage != 0) {
        $("#pagina-left").removeClass("page-visually-hidden");
        $("#pagina-first").removeClass("page-visually-hidden");
    }
    if (Math.floor(usuarios.length / rowsPerPage) == currentPage) {
        $("#pagina-right").addClass("page-visually-hidden");
        $("#pagina-last").addClass("page-visually-hidden");
    }
    else if (Math.floor(usuarios.length / rowsPerPage) > currentPage) {
        $("#pagina-right").removeClass("page-visually-hidden");
        $("#pagina-last").removeClass("page-visually-hidden");
    }
    updateTableRanking();
}