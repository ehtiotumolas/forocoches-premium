
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
    const numero = $("div > div > div > div > a", ".postbit_wrapper")[1].href.split('php?u=')[1]
    return { "hilo_id": id, "usuario_id": numero }
}
const newUserInfoLoaded = (id) => {
    const usuario = $(document).attr('title').replace("Forocoches - Ver Perfil: ", "");
    const mensajes = $($('span:contains("Mensajes")')[1]).prev("span")[0].innerText.replace(".", "");
    const hilos = $($('span:contains("Hilos")')[0]).prev("span")[0].innerText.replace(".", "");
    const registro = $($('span:contains("Desde")')[0]).next("span")[0].innerText;
    return { "usuario": usuario, "id": id, "mensajes": mensajes, "hilos": hilos, "registro": registro };
}

const newUsersInfoLoaded = (id) => {
    var elements = $('*[id*=postmenu_]:visible')
    var usuarios = []
    for (var element of elements) {
        var id = element.id;
        var usuario = $(`*[id*=${id}_menu] > div > div > h2`)[0].innerText.replaceAll('\n', '').trim();
        var usuario_id = $(`*[id*=${id}_menu] > div > div > h2 >a`)[0].href.split('php?u=')[1].trim();
        var registro = $(`*[id*=${id}_menu] > div > div > div > div:contains("Registro")`)[0].innerText.split('Registro: ')[1].replaceAll('\n', '').trim();
        var mensajes = $(`*[id*=${id}_menu] > div > div > div > div:contains("Mensajes")`)[0].innerText.split('Mensajes: ')[1].replaceAll('.', '').trim();
        usuarios.push({"usuario": usuario, "id": usuario_id, "registro": registro, "mensajes": mensajes})
    }
    return usuarios
}
