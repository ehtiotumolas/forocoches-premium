
chrome.runtime.onMessage.addListener((obj, sender, sendResponse) => {
    const { type, value, id } = obj;
    if (type === "hilo_info") {
        sendResponse(newHiloInfoLoaded(id));
    }
    if (type === "usuario_info") {
        sendResponse(newUserInfoLoaded(id));
    }
    if (type === "hilo_usuarios_info") {
        sendResponse(newUsersInfoLoaded(id));
    }
    return true;
});

const newHiloInfoLoaded = (id) => {
    var numero;
    if ($('span:contains("Modo noche")').length > 0) {
        numero = $("div > div > div > div > a", ".postbit_wrapper")[1].href.split('php?u=')[1]
    }
    return { "hilo_id": id, "usuario_id": numero }

}
const newUserInfoLoaded = (id) => {
    var usuario, mensajes, hilos, registro;
    if ($('span:contains("Modo noche")').length > 0) {
        usuario = $(document).attr('title').replace("Forocoches - Ver Perfil: ", "");
        mensajes = $($('span:contains("Mensajes"):not(:contains("privados"))')[0]).prev("span")[0].innerText.replace(".", "");
        hilos = $($('span:contains("Hilos")')[0]).prev("span")[0].innerText.replace(".", "");
        registro = $($('span:contains("Desde")')[0]).next("span")[0].innerText;
    }
    return { "usuario": usuario, "id": id, "mensajes": mensajes ? mensajes : 0, "hilos": hilos ? hilos : 0, "registro": registro };
}

const newUsersInfoLoaded = (id) => {
    var usuarios = []
    if ($('span:contains("Modo noche")').length > 0) {
        var elements = $('*[id*=postmenu_]:visible')
        for (var element of elements) {
            var id = element.id;
            var usuario = $(`*[id*=${id}_menu] > div > div > h2`)[0].innerText.replaceAll('\n', '').trim();
            var usuario_id = $(`*[id*=${id}_menu] > div > div > h2 >a`)[0].href.split('php?u=')[1].trim();
            var registro = $(`*[id*=${id}_menu] > div > div > div > div:contains("Registro")`)[0].innerText.split('Registro: ')[1].replaceAll('\n', '').trim();
            var mensajes = $(`*[id*=${id}_menu] > div > div > div > div:contains("Mensajes")`)[0].innerText.split('Mensajes: ')[1].replaceAll('.', '').trim();
            usuarios.push({ "usuario": usuario, "id": usuario_id, "registro": registro, "mensajes": mensajes ? mensajes : 0 })
        }
    }
    return usuarios
}
