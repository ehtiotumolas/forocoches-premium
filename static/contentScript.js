const mo = new MutationObserver(onMutation);
let temas_ignorados;
let usuarios_ignorados;
let opciones;
let toListen = [];

async function retrieveStorage(key) {
    return new Promise((resolve, reject) => {
        chrome.storage.sync.get(key, resolve);
    })
        .then(result => {
            temas_ignorados = result.temas_ignorados;
            usuarios_ignorados = result.usuarios_ignorados;
            opciones = result.opciones;
        })
}

chrome.runtime.onMessage.addListener((obj, sender, sendResponse) => {
    console.log("Listening")
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

const listenThread = () => {
    if (location.href.includes("forumdisplay.php")) {
        retrieveStorage()
            .then(() => {
                toListen = ["temas_ignorados"];
                if (opciones["hilos-color"].checked) {
                    toListen.push("hilos-color");
                }
                onMutation([{ addedNodes: [document.documentElement] }]);
                observe();
            });
    }
    if (location.href.includes("showthread.php?")) {
        retrieveStorage()
            .then(() => {
                toListen = ["usuarios_ignorados"];
                if (opciones["op-color"].checked) {
                    toListen.push("op-color");
                }
                onMutation([{ addedNodes: [document.documentElement] }]);
                observe();
            });
    }
}

function onMutation(mutations) {
    let stopped;
    for (const { addedNodes } of mutations) {
        for (const n of addedNodes) {
            if (n.tagName) {
                if (toListen.includes("temas_ignorados")) {
                    if (n.tagName == 'A' && n.id.includes('thread_title_') && temas_ignorados && temas_ignorados.some(substring => n.innerText.includes(substring))) {
                        var papa = $(n).parent().parent().parent()
                        if (($('span:contains("Modo noche")').length != 0)) papa = $(papa).parent();
                        $(papa).next("separator").remove();
                        $(papa).remove();
                    }
                }
                if (toListen.includes("usuarios_ignorados")) {
                    if (n.tagName == 'DIV') {
                        if (n.id.includes('edit')) {
                            var postId = "postmenu_" + n.id.split('edit')[1];
                            var postDiv = $(`div[id=${postId}]`)[0];
                            var calavera = $("<a/>")
                                .attr('id', 'ignorar-usuario-div')
                                .css({
                                    position: "relative",
                                    zIndex: 5,
                                    marginLeft: "-20px",
                                    cursor: "pointer"
                                })
                                .height("48px")
                                .width("14px")
                                .text("💀")
                                .click(function (e) {
                                    e.preventDefault();
                                    var usuario = postDiv.children[0].innerText;
                                    if (confirm(`Seguro que quieres ignorar a ${usuario}?`)) {
                                        chrome.runtime.sendMessage({ sender: "contentScript", type: "chrome-storage", content: { loc: "usuario", message: usuario, action: "add" } });
                                        chrome.runtime.sendMessage({ sender: "contentScript", type: "reload" });
                                        chrome.runtime.sendMessage({ sender: "contentScript", type: "ignore_usuario", content: usuario });
                                    };
                                });
                            if ($('span:contains("Modo noche")').length != 0) {
                                calavera.prependTo($(postDiv).parent().parent()[0]);
                            }
                            else {
                                calavera
                                    .css({ marginLeft: "-5px" }).height("auto").appendTo(postDiv);
                            }
                        }
                        if ($(n).children('b').length > 0 && usuarios_ignorados && usuarios_ignorados.some(substring => n.innerText.includes(`Cita de ${substring}`))) {
                            var usuario = $(n);
                            $(usuario).children('b')[0].innerText = "(Usuario Ignorado)";
                            if (($('span:contains("Modo noche")').length != 0)) usuario = $(usuario).parent('div')[0];
                            $(usuario).next('div')[0].innerText = "(Texto ignorado)";
                        }
                    }
                    if (n.tagName == 'A' && n.href.includes('member.php?u=') && usuarios_ignorados && usuarios_ignorados.some(substring => n.innerText.includes(substring))) {
                        var id = "#edit" + $(n).parent()[0].id.split("_")[1];
                        $(id).remove();
                    }
                }
                if (toListen.includes("op-color")) {
                    if ($('span:contains("Modo noche")').length != 0) {
                        if (n.tagName == 'SECTION' && n.style.borderLeft == 'solid 4px var(--coral)') {
                            n.style.backgroundColor = opciones["op-color"].value;
                        }
                    }
                    else {
                        if (n.tagName == 'IMG' && n.alt == "Respuesta rapida a este mensaje" && $(n).parent().parent().parent().parent().parent().hasClass("tborder-author")) {
                            var papa = $(n).parent().parent().parent().parent();
                            //Removes border
                            $(papa).parent().removeClass();
                            $(papa).children().children().css('border', 'none');
                            //Changes background color
                            $(papa).find('.alt1-author').css('background-color', opciones["op-color"].value);
                            $(papa).find('.alt2').css('background-color', shadeColor(opciones["op-color"].value, -5));
                            //Leave citas normal background
                            $($(papa).find('.alt2:contains("Cita de")')[0]).css('background-color', '');
                        }
                    }
                }
                if (toListen.includes("hilos-color")) {
                    if (n.tagName == 'A' && n.href.includes("misc.php?do=whoposted"))
                    {
                        if (n.innerText == "0") {
                            var papa = $(n).parent().parent().parent();
                            if ($('span:contains("Modo noche")').length > 0)
                            {
                                $(papa).css("background-color", opciones["hilos-color"].value);
                            }
                            else {
                                $(papa).find('.alt1').css('background-color', opciones["hilos-color"].value)
                                $(papa).find('.alt2').css('background-color', shadeColor(opciones["hilos-color"].value, -10));

                            }
                        }
                    }
                }
            }
        }
        if (stopped) observe();
    }
}

function observe() {
    mo.observe(document, {
        subtree: true,
        childList: true,
    });
}

const hiloInfo = (id) => {
    var usuario, usuario_id;
    if ($('center:contains("Tema especificado inválido")')[0] != null) {
        console.log("Tema especificado inválido");
        return { "status": 400, "message": { "hilo_id": id } }
    };

    if ($('span:contains("Modo noche")').length > 0) {
        var postFound = $(".date-and-time-gray").filter(function () {
            return this.innerText === "#2";
        }).parent().parent().parent().parent()[0].id.split('post')[1]
        var divFound = $(`div[id='postmenu_${postFound}'] > a`)[0];
        usuario = divFound.innerText
        usuario_id = divFound.href.split("php?u=")[1];
    }
    else {
        var postFound = $('a[name="2"]')[0].href.split('#post')[1]
        var aFound = $(`div[id=postmenu_${postFound}] > a`)[0];
        usuario = aFound.innerText;
        usuario_id = aFound.href.split("php?u=")[1];
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

const shadeColor = (color, percent) => {
    var R = parseInt(color.substring(1, 3), 16);
    var G = parseInt(color.substring(3, 5), 16);
    var B = parseInt(color.substring(5, 7), 16);
    R = parseInt(R * (100 + percent) / 100);
    G = parseInt(G * (100 + percent) / 100);
    B = parseInt(B * (100 + percent) / 100);
    R = (R < 255) ? R : 255;
    G = (G < 255) ? G : 255;
    B = (B < 255) ? B : 255;
    R = Math.round(R)
    G = Math.round(G)
    B = Math.round(B)
    var RR = ((R.toString(16).length == 1) ? "0" + R.toString(16) : R.toString(16));
    var GG = ((G.toString(16).length == 1) ? "0" + G.toString(16) : G.toString(16));
    var BB = ((B.toString(16).length == 1) ? "0" + B.toString(16) : B.toString(16));
    return "#" + RR + GG + BB;
}

listenThread();
