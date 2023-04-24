import { setPagina, rowsPerPage } from "./table.js";

export var usuarios;
export var poles;

export async function fetchUsers() {
    var url = 'http://192.168.0.172:5001/getAllUsers';
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

export async function fetchPoles() {
    var url = 'http://192.168.0.172:5001/getAllPoles';
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

export function buscarUsuario(usuario) {
    try {
        var offset = (parseInt(getComputedStyle(document.body).getPropertyValue('--fs-header')) * 16 + 50);
        var element = document.getElementById(usuario.trim())
        if (element == null) {
            var usuarioEncontrado = Object.keys(usuarios).find(key => usuarios[key].usuario === usuario);
            if (usuarioEncontrado != null) {
                setPagina(Math.floor(usuarioEncontrado/rowsPerPage));
                var element = document.getElementById(usuario.trim())
            }
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