chrome.runtime.onMessage.addListener((obj, sender, sendResponse) => {
    const { type, value, id } = obj;
    if (type === "hilo_info") {
        sendResponse(hiloInfo(id));
    }
    if (type === "usuario_info") {
        sendResponse(userInfo(id));
    }
    if (type === "hilo_usuarios_info") {
        sendResponse(usersInfo(id));
    }
    if (type === "usuario_info_old_hilos") {
        sendResponse(userInfoHilosOld());
    }
    return true;
});

const hiloInfo = (id) => {
    var usuario, usuario_id;

    if ($('center:contains("Tema especificado inválido")')[0] != null) {
        console.log("Tema especificado inválido");
        return { "status": 400, "message": { "hilo_id": id } }
    };

    if ($('span:contains("Modo noche")').length > 0) {
        usuario = $("div > div > div > div > a", ".postbit_wrapper")[1].innerText;
        usuario_id = $("div > div > div > div > a", ".postbit_wrapper")[1].href.split("php?u=")[1];
    }
    else {
        usuario = ($('a[class="bigusername"]')[1]).innerText;
        usuario_id = ($('a[class="bigusername"]')[1]).href.split("php?u=")[1];
    }

    return { "status": 200, "message": { "hilo_id": id, "usuario": usuario, "usuario_id": usuario_id } }

}
const userInfo = (id) => {
    var usuario, mensajes, hilos, registro;
    usuario = $(document).attr('title').replace("Forocoches - Ver Perfil: ", "");
    try {
        if ($('span:contains("Modo noche")').length > 0) {
            var usuario, mensajes, hilos, registro;
            mensajes = $($('span:contains("Mensajes"):not(:contains("privados"))')[0]).prev("span")[0].innerText.replace(".", "");
            hilos = $($('span:contains("Hilos")')[2]).prev("span")[0].innerText.replace(".", "")
            registro = $($('span:contains("Desde")')[0]).next("span")[0].innerText
        }
        else {
            var [registro, mensajes] = $('span:contains("Registro: "):contains("Mensajes")')[0].innerText.split('\n')
            registro = registro.split("Registro: ")[1];
            mensajes = mensajes.split("Mensajes: ")[1].replaceAll('.', '')
        }
        return { "status": 200, "message": { "usuario": usuario, "id": id, "mensajes": mensajes ? mensajes : 0, "hilos": hilos ? hilos : 0, "registro": registro } }
    }
    catch {
        return { "status": 400 }
    }
}

const userInfoHilosOld = () => {
    if ($('span:contains("Modo noche")').length == 0) {
        var url = ($("a[href^='search.php?']:contains('Buscar')")[0]).href;
        var matches = url.match(/(exactname=1|starteronly=1|forumchoice[[]]=0|showposts=0|replyless=0|replylimit=0|searchuser)/g).length;
        if (matches == 7 || (matches == 6 && !url.match("forumchoice[[]]="))
            || (!url.match("userid=0")) && !url.match("showposts=1")) {
            hilos = $('span:contains("Mostrando resultado")')[0].innerText.split('\n')[0].split("de ")[1];
            usuario = $('*:contains("Autores de Tema:") > a > b')[0].innerText;
            return { "status": 200, "message": { "usuario": usuario, "hilos": hilos } };
        }
    }
    return { "status": 400 }
}

const usersInfo = (id) => {
    var usuarios = []
    var elements = $('*[id*=postmenu_]:visible')
    for (var element of elements) {
        if ($('span:contains("Modo noche")').length > 0) {
            var id = element.id;
            try {
                var usuario = $(`*[id*=${id}_menu] > div > div > h2`)[0].innerText.replaceAll('\n', '').trim();
                var usuario_id = $(`*[id*=${id}_menu] > div > div > h2 > a`)[0].href.split('php?u=')[1].trim();
                var registro = $(`*[id*=${id}_menu] > div > div > div > div:contains("Registro")`)[0].innerText.split('Registro: ')[1].replaceAll('\n', '').trim();
                var mensajes = $(`*[id*=${id}_menu] > div > div > div > div:contains("Mensajes")`)[0].innerText.split('Mensajes: ')[1].replaceAll('.', '').trim();
                usuarios.push({ "usuario": usuario, "id": usuario_id, "registro": registro, "mensajes": mensajes ? mensajes : 0 })
            }
            catch {
                console.log("Usuario invitado")
            }
        }
        else {
            var id = element.id;
            var usuario = ($(`*[id*=${id}] > a`)[0]).innerText;
            var usuario_id = ($(`*[id*=${id}] > a`)[0]).href.split('php?u=')[1].trim();
            var info = $($($(`*[id*=${id}]:visible`)[0]).parent()[0]).find('div:contains("Mens.")')[1].innerText;
            var [registro, mensajes] = info.split('|')
            registro = registro.trim()
            var mensajes = mensajes.trim().split(' ')[0].replace(".", "");
            usuarios.push({ "usuario": usuario, "id": usuario_id, "registro": registro, "mensajes": mensajes ? mensajes : 0 })
        }
    }
    return { "status": 200, "message": usuarios }
}