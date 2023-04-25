import { setPagina, rowsPerPage } from "./table.js";

export var usuarios;
export var poles;
const server = "https://www.forocochero.com"

//Fetches all users from the DB
export async function fetchUsers() {
    var url = `${server}/getAllUsers`;
    try {
        await fetch(url, {
            method: 'GET',
        })
            .then(async function (response) {
                if (response.status == 200) {
                    usuarios = await response.json();
                    return response;
                }
                else
                    console.log(response.status)
                return response;
            })
            .catch(function (err) {
                console.log("fetchUsers: " + err)
                return err.status;
            });
    }
    catch (e) {
        console.log(e);
        return response;
    }
}

//Fetches all poles from the DB
export async function fetchPoles() {
    var url = `${server}/getAllPoles`;
    try {
        await fetch(url, {
            method: 'GET',
        })
            .then(async function (response) {
                if (response.status == 200) {
                    poles = await response.json();
                    return response;
                }
                else
                    console.log(response.status)
                return response;
            })
            .catch(function (err) {
                console.log("fetchPoles: " + err)
                return err.status;
            });
    }
    catch (e) {
        console.log(e);
        return response;
    }
}

//Searchs user on the Ranking Forococheros and moves the current position of the table to the found user, whichever page it's found
export function buscarUsuario(usuario) {
    try {
        var offset = (parseInt(getComputedStyle(document.body).getPropertyValue('--fs-header')) * 16 + 50);
        var usuarioEncontrado = Object.keys(usuarios).find(key => usuarios[key].usuario === usuario);
        if (usuarioEncontrado != null) {
            setPagina(Math.floor(usuarioEncontrado / rowsPerPage));
            var element = document.getElementById(usuario.trim())
        }
        var pos = element.getBoundingClientRect();
        var total = (pos.top - offset);
        if (element.classList != "selRow") element.click();
        window.scrollTo({ top: total, behavior: 'smooth' });
        document.getElementById("add-user-message").innerText = "Usuario encontrado!";
    }
    catch {
        document.getElementById("add-user-message").innerText = "Usuario no encontrado en la lista.";
    }
}