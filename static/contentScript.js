const mo = new MutationObserver(onMutation);
let temas_ignorados;
let usuarios_ignorados;
let opciones;
let toListen = [];
let savedNotas;
let darkMode;
let forocochero;
async function retrieveStorage(key) {
    return new Promise((resolve, reject) => {
        chrome.storage.sync.get(key, resolve);
    })
        .then(result => {
            temas_ignorados = result.temas_ignorados;
            usuarios_ignorados = result.usuarios_ignorados;
            opciones = result.opciones;
            savedNotas = result.notas;
        })
}

chrome.runtime.onMessage.addListener((obj, sender, sendResponse) => {
    console.log("Listening")
    const { type, value } = obj;
    if (type === "usuario_info") {
        sendResponse(userInfo(value));
        return;
    }
    if (type === "usuario_info_old_hilos") {
        sendResponse(userInfoHilosOld());
        return;
    }
    if (type === "hilo_mensaje_likes") {
        sendResponse(getAllPostsId());
        return;
    }
    if (type === "estadisticas") {
        sendResponse(findEstadisticas());
        return;
    }
    const id = $("a[href*=searchthreadid]")[0].href.split('=')[1].split('&')[0];
    if (type === "hilo_info") {
        sendResponse(hiloInfo(id));
        return;
    }
    if (type === "hilo_usuarios_info") {
        sendResponse(usersInfo(id));
        return;
    }
    if (type === "likes_info") {
        updateAllLikes(value);
        return;
    }
});

const listenThread = () => {
    retrieveStorage()
        .then(() => {
            $.each(opciones, function (opcion) {
                if (opciones[opcion].checked) {
                    if ((opcion == "temas-ignorados" || opcion == "hilos-color") && !location.href.includes("forumdisplay.php")) {
                        return;
                    }
                    if ((opcion == "op-color") && !location.href.includes("showthread.php?")) {
                        return;
                    }
                    toListen.push(opcion);
                }
            });
            onMutation([{ addedNodes: [document.documentElement] }]);
            observe();
        })
};

function onMutation(mutations) {
    let stopped;
    for (const { addedNodes } of mutations) {
        for (const n of addedNodes) {
            if (n.tagName) {
                if (darkMode == undefined && ((n.tagName == 'MAIN') || (n.tagName == 'A' && n.id == 'poststop'))) {
                    if (n.tagName == 'MAIN') {
                        darkMode = true;
                        forocochero = $('.username')[0].innerHTML;
                    }
                    else {
                        darkMode = false;
                        forocochero = $('.smallfont > strong > a')[0].innerText;
                    }
                }
                if (toListen.includes("temas-ignorados")) {
                    if (n.tagName == 'A' && n.id.includes('thread_title_') && temas_ignorados && temas_ignorados.some(substring => n.innerText.includes(substring))) {
                        var papa = $(n).parent().parent().parent();
                        if ((darkMode)) papa = $(papa).parent();
                        $(papa).next("separator").remove();
                        $(papa).remove();
                    }
                }
                if (toListen.includes("usuarios-ignorados")) {
                    if (n.tagName == 'DIV') {
                        if (n.id.includes('edit')) {
                            var postId = "postmenu_" + n.id.split('edit')[1];
                            var postDiv = $(`div[id=${postId}]`)[0];
                            var calaveraBtn = $("<a/>")
                                .attr('id', 'ignorar-usuario-div')
                                .css({
                                    position: "absolute",
                                    textDecoration: "none",
                                    marginTop: "-22px",
                                    cursor: "pointer",
                                })
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
                            if (darkMode) {
                                if ($(postDiv).parent().parent().children("#container-opciones").length == 0) {
                                    $("<div/>").attr('id', 'container-opciones').css({ paddingLeft: "5px" }).insertAfter($(postDiv).parent().parent().children()[0]);;
                                }
                                calaveraBtn.appendTo($(postDiv).parent().parent().children("#container-opciones"));
                            }
                            else {
                                calaveraBtn.css({ marginLeft: "0px", position: "relative" }).height("auto").appendTo($(postDiv).parent());
                            }
                        }
                        if ($(n).children('b').length > 0 && usuarios_ignorados && usuarios_ignorados.some(substring => n.innerText.includes(`Cita de ${substring}`))) {
                            if (toListen.includes("ocultar-usuarios-ignorados")) {
                                var papa = $(n).parent().parent().parent();
                                if (darkMode) {
                                    papa.remove();
                                }
                                else {
                                    papa.parent().parent().remove();
                                }
                            }
                            else {
                                var usuario = $(n);
                                $(usuario).children('b')[0].innerText = "(Usuario Ignorado)";
                                if ((darkMode)) usuario = $(usuario).parent('div')[0];
                                $(usuario).next('div')[0].innerText = "(Texto ignorado)";
                            }
                        }
                    }
                    if (n.tagName == 'A' && n.href.includes('member.php?u=') && usuarios_ignorados && usuarios_ignorados.some(substring => n.innerText.includes(substring))) {
                        var id = "#edit" + $(n).parent()[0].id.split("_")[1];
                        $(id).remove();
                    }
                    if (n.tagName == 'SPAN') {
                        if (darkMode && usuarios_ignorados && usuarios_ignorados.some(substring => n.innerText.includes(`@${substring}`))) {
                            var papa = $(n).parent().parent().parent().parent().parent();
                            papa.next("separator").remove();
                            papa.remove();
                        }
                        else {
                            if (usuarios_ignorados && usuarios_ignorados.some(substring => n.innerText.includes(`${substring}`)) && $(n).parent().hasClass("smallfont")) {
                                var papa = $(n).parent().parent().parent();
                                papa.next("separator").remove();
                                papa.remove();
                            }
                        }
                    }
                }
                if (toListen.includes("notas-usuario")) {
                    if (n.tagName == 'DIV') {
                        if (n.id.includes('postmenu_') && !n.id.includes('_menu')) {
                            var postDiv = $(n)[0];
                            var usuario = "";
                            if (darkMode) {
                                usuario = $(postDiv)[0].innerText;
                            }
                            else {
                                try {
                                    usuario = $(postDiv)[0].innerText;
                                }
                                catch (err) {
                                    console.log(err)
                                }
                            }
                            var notasBtn = $("<a/>")
                                .attr('id', 'notas-usuarios-div')
                                .css({
                                    position: "absolute",
                                    textDecoration: "none",
                                    cursor: "pointer"
                                })
                                .text("✏️")
                                .click(function (e) {
                                    e.preventDefault();
                                    $("#notas-popup-div").remove();
                                    if ($(this).children("#notas-popup-div").length == 0) {
                                        var notas = $("<div/>")
                                            .attr('id', 'notas-popup-div')
                                            .css({
                                                position: "absolute",
                                                zIndex: 1,
                                                textDecoration: "none",
                                                height: "300px",
                                                width: "300px",
                                                backgroundColor: "rgba(0, 0, 0, 0.9)",
                                                border: "1px",
                                                borderRadius: "1.5rem",
                                                filter: "drop-shadow(0 0.2rem 0.25rem rgba(0, 0, 0, 0.2))",
                                            })
                                        if (darkMode) {
                                            $(notas).css({ marginLeft: "-20px", marginTop: "0px" })
                                        }
                                        else {
                                            $(notas).css({ marginTop: "-20px" })
                                        }
                                        $("<div/>")
                                            .attr('id', 'notas-popup-title')
                                            .css({
                                                position: "absolute",
                                                color: "white",
                                                zIndex: 1,
                                                textDecoration: "none",
                                                height: "20px",
                                                width: "fit-content",
                                                backgroundColor: "transparent",
                                                left: 0,
                                                right: 0,
                                                margin: "auto",
                                                padding: "10px",
                                                backgroundColor: "rgba(0, 0, 0, 1)",
                                            })
                                            .text(`NOTAS de ${usuario}`)
                                            .appendTo(notas);

                                        var textContainer = $("<div/>")
                                            .attr('id', 'notas-popup-text-container')
                                            .css({
                                                height: "220px",
                                                width: "280px",
                                                backgroundColor: "white",
                                                backgroundColor: "rgba(255,255,255, 0.2)",
                                                color: "white",
                                                margin: "auto",
                                                marginTop: "40px",
                                                textDecoration: "none",
                                                border: "1px",
                                                borderRadius: "1rem",
                                                overflow: "auto",
                                                outline: "0px solid transparent"
                                            }).appendTo(notas);

                                        var textEditable = $("<p/>")
                                            .attr('id', 'notas-popup-text-editable')
                                            .attr('contenteditable', true)
                                            .css({
                                                height: "170px",
                                                width: "250px",
                                                border: "1px",
                                                marginTop: 10,
                                                marginLeft: 10,
                                                marginBottom: 10,
                                                borderRadius: "1rem",
                                                outline: "0px solid transparent"
                                            })
                                            .appendTo(textContainer);
                                        $("<button/>")
                                            .attr('id', 'notas-popup-button')
                                            .css({
                                                position: "absolute",
                                                height: "22px",
                                                width: "80px",
                                                margin: "auto",
                                                left: 0,
                                                right: 0,
                                                cursor: "pointer",
                                                marginTop: "10px"
                                            })
                                            .text("Guardar")
                                            .click(function (e) {
                                                e.preventDefault();
                                                var textToSave = `${$("#notas-popup-text-editable")[0].innerText}`;
                                                if (savedNotas == undefined) savedNotas = {}
                                                savedNotas[usuario] = { "text": textToSave };
                                                if (textToSave == "") {
                                                    notasBtn.css({ border: 0, borderRadius: "6px" });
                                                }
                                                else {
                                                    notasBtn.css({ border: "solid 2px Red", borderRadius: "6px" });
                                                }
                                                chrome.runtime.sendMessage({ sender: "contentScript", type: "chrome-storage", content: { loc: "notas", message: { "usuario": usuario, "text": textToSave }, action: "add" } });
                                                chrome.runtime.sendMessage({ sender: "contentScript", type: "reload" });
                                            })
                                            .appendTo(notas);

                                        notas.insertAfter($(this).parent().children("#notas-usuarios-div"));
                                        if (savedNotas != undefined && savedNotas.hasOwnProperty(usuario)) {
                                            $('#notas-popup-text-editable')[0].innerText = savedNotas[usuario].text;
                                        }
                                    }
                                });
                            if (savedNotas != undefined && savedNotas.hasOwnProperty(usuario)) {
                                notasBtn.css({ border: "solid 2px Red", borderRadius: "6px" });
                            }

                            if (darkMode) {
                                if ($(postDiv).parent().parent().children("#container-opciones").length == 0) {
                                    $("<div/>").attr('id', 'container-opciones').insertAfter($(postDiv).parent().parent().children()[0]);;
                                }
                                notasBtn.appendTo($(postDiv).parent().parent().children("#container-opciones"));
                            }
                            else {
                                notasBtn.css({ marginLeft: "5px", position: "relative" }).height("auto").appendTo($(postDiv).parent());
                            }
                        }
                    }
                    if (n.tagName == 'A' && n.href.includes('member.php?u=') && usuarios_ignorados && usuarios_ignorados.some(substring => n.innerText.includes(substring))) {
                        var id = "#edit" + $(n).parent()[0].id.split("_")[1];
                        $(id).remove();
                    }
                }
                if (toListen.includes("op-color")) {
                    if (darkMode) {
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
                    if (n.tagName == 'A' && n.href.includes("misc.php?do=whoposted")) {
                        if (n.innerText == "0") {
                            var papa = $(n).parent().parent().parent();
                            if (darkMode) {
                                $(papa).css("background-color", opciones["hilos-color"].value);
                            }
                            else {
                                $(papa).find('.alt1').css('background-color', opciones["hilos-color"].value)
                                $(papa).find('.alt2').css('background-color', shadeColor(opciones["hilos-color"].value, -10));

                            }
                        }
                    }
                }
                if (toListen.includes("ocultar-publicidad")) {
                    if (n.tagName == 'DIV') {
                        if (darkMode != undefined && darkMode) {
                            if ($(n).hasClass("fixed_adslot")) {
                                $(n).parent().remove();
                            }
                            if (n.id.indexOf("optidigital-adslot-Content_") > -1) {
                                $(n).remove();
                            }
                            if ($(n).hasClass("optidigital-wrapper-div")) {
                                $(n).remove();
                            }
                            if ($(n)[0].id === "h1") {
                                $(n).parent().remove();
                            }
                        }
                        else {
                            if (n.id.indexOf("optidigital-adslot-Billboard_") > -1 ||
                                n.id.indexOf("optidigital-adslot-Rectangle_") > -1 ||
                                n.id.indexOf("optidigital-adslot-Skyscraper_") > -1 ||
                                n.id == 'fcs') {
                                var papa = $(n).parents("table:first");
                                if (n.id.indexOf("optidigital-adslot-Skyscraper_") > -1) {
                                    papa = papa.parents("table:first");
                                }
                                papa.prev().remove();
                                papa.next().remove();
                                papa.remove();
                            }
                        }
                    }
                    if (n.tagName == 'TABLE' && $(n).hasClass("cajasprin")) {
                        $(n).next('br').remove();
                        $(n).prev('br').remove();
                        //$(n).remove();
                    }
                }
                if (toListen.includes("ocultar-trending")) {
                    if (n.tagName == 'H2' && n.innerText === "Trending") {
                        if (darkMode) {
                            if ($(n).parent().parent().parent()[0].id === "sidebar") {
                                $(n).parent().parent().remove();
                            }
                        }
                    }
                }
                if (toListen.includes("ocultar-foros-relacionados-nuevo")) {
                    if (n.tagName == 'H2' && (n.innerText === "Foros Relacionados" || n.innerText === "Foros relacionados")) {
                        if (darkMode) {
                            if ($(n).parent().parent()[0].id === "sidebar") {
                                $(n).parent().remove();
                            }
                        }
                    }
                }
                if (toListen.includes("ocultar-foros-relacionados-viejo")) {
                    if (n.tagName == 'SPAN' && $(n).hasClass("smallfont") && n.innerText == "Foros Relacionados") {
                        if (!darkMode) {
                            $($($(".smallfont")[0]).closest(".tborder")[0]).parent()[0].remove()
                        }
                    }
                }
                if (toListen.includes("ocultar-avisos")) {
                    if ($(n).hasClass("navbar_notice")) {
                        var papa = $(n).parent().parent();
                        if (darkMode) {
                            papa.remove();
                        }
                        else {
                            papa.parent().parent().remove();
                        }
                    }
                }
                if (toListen.includes("espacio-lateral")) {
                    if (darkMode) {
                        if (!toListen.includes("ocultar-foros-relacionados-nuevo") ||
                            !toListen.includes("ocultar-trending") ||
                            !toListen.includes("ocultar-publicidad")) {
                            $($("main")[0]).css({
                                "grid-template-columns": "24fr 5fr",
                                "max-width": "90%"
                            });
                        }
                        else if (toListen.includes("ocultar-foros-relacionados-nuevo") &&
                            toListen.includes("ocultar-trending") &&
                            toListen.includes("ocultar-publicidad")) {
                            if ($(window).width() > 1024) {
                                $($("main")[0]).css({
                                    "grid-template-columns": "24fr",
                                    "max-width": "90%"
                                });
                            }
                            else {
                                $($("main")[0]).css({
                                    "max-width": "100%"
                                });
                            }
                            $(window).resize(function () {
                                if ($(window).width() <= 1024) {
                                    $($("main")[0]).css({
                                        "max-width": "100%"
                                    });
                                }
                                else {
                                    $($("main")[0]).css({
                                        "grid-template-columns": "24fr",
                                        "max-width": "90%"
                                    });
                                }
                            });
                        }
                        else {
                            $($("main")[0]).css({
                                "grid-template-columns": "24fr",
                                "padding-left": "0",
                                "padding-right": "0",
                            });
                        }
                    }
                }
                if (toListen.includes("avatar-cuadrado")) {
                    if (darkMode && n.tagName === 'IMG' && $(n).hasClass("thread-profile-image")) {
                        $(n).css({
                            borderRadius: "0"
                        });
                    }
                }
                if (toListen.includes("avatar-grande")) {
                    if (darkMode && n.tagName === 'IMG' && $(n).hasClass("thread-profile-image")) {
                        $(n).css({
                            width: "70px",
                            height: "70px"
                        });
                        $(n).parent().css({
                            height: "70px"
                        });
                    }
                }
                if (toListen.includes("likes")) {
                    if (n.tagName === 'A' && n.href.indexOf("report.php?p=") != -1) {
                        var likeBtn = $("<a/>")
                            .css({
                                display: "flex",
                                alignItems: "center",
                                fontWeight: "700",
                                justifyContent: "center",
                                alignItems: "center",
                                color: "white",
                                textDecoration: "none",
                                position: "relative"
                            })
                        if (!darkMode) {
                            likeBtn.css({ justifyContent: "right" })
                        }
                        $("<span/>")
                            .attr('id', 'like-text')
                            .css({
                                fontSize: "1.5rem",
                                height: "26px",
                                textDecoration: "none",
                                pointerEvents: "none"
                            })
                            .text(0)
                            .appendTo(likeBtn);
                        $("<span/>")
                            .attr('id', 'like-button')
                            .css({
                                textDecoration: "none",
                                cursor: "pointer",
                                marginLeft: "6px",
                                marginRight: "6px",
                                fontSize: "1.625rem",
                                display: "flex",
                            })
                            .text("❤")
                            .click(function (e) {
                                var postId, likes
                                if (darkMode) {
                                    postId = $($($(this)).parent()[0].closest('section')).parent()[0].id.split('edit')[1];
                                }
                                else {
                                    postId = $($(this)).parent()[0].closest('div').id.split('edit')[1];
                                }
                                var likes = $(this).prev('span')[0];

                                if (!$(this).hasClass("liked")) {
                                    $(this)
                                        .css({ color: "red" })
                                        .toggleClass("liked");
                                    likes.innerText = Number(likes.innerText) + 1
                                    updateLikes(postId, forocochero, "add")
                                }
                                else {
                                    $(this)
                                        .css({ color: "white" })
                                        .toggleClass("liked");
                                    likes.innerText = Number(likes.innerText) - 1
                                    updateLikes(postId, forocochero, "remove")
                                }
                            })
                            .appendTo(likeBtn);
                        likeBtn.appendTo($(n).parent());
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

const updateLikes = (postId, user, action) => {
    chrome.runtime.sendMessage({ sender: "contentScript", type: "update-likes", content: { id: postId, usuario: user, action: action } });
}

const updateAllLikes = (likedPosts) => {
    for (var liked of likedPosts) {
        var likedPost = $($(`#edit${liked.post}`)[0]);
        likedPost.find('#like-text')[0].innerText = liked.likes;
        if (liked.liked == 1) {
            $(likedPost.find('#like-button')[0])
                .toggleClass("liked")
                .css({ color: "red" });
        }
    }
}

const getAllPostsId = () => {
    let posts = [];
    $.each($('div[id*=edit]'), function (i, obj) {
        posts.push(obj.id.split('edit')[1])
    });
    return { "status": 200, "message": { "posts": posts, "usuario": forocochero } };
}

const hiloInfo = (id) => {
    var usuario, usuario_id;
    if ($('center:contains("Tema especificado inválido")')[0] != null) {
        console.log("Tema especificado inválido");
        return { "status": 400, "message": { "hilo_id": id } }
    };

    if (darkMode) {
        try {
            var postFound = $(".date-and-time-gray").filter(function () {
                return this.innerText === "#2";
            }).parent().parent().parent().parent()[0].id.split('post')[1]
            var divFound = $(`div[id='postmenu_${postFound}'] > a`)[0];
            usuario = divFound.innerText
            usuario_id = divFound.href.split("php?u=")[1];
        }
        catch (err) {
            return { "status": 404, "message": err }
        }
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
        if (darkMode) {
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
        if (darkMode) {
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

const findEstadisticas = () => {
    try {
        var mensajes_totales, hilos_totales;
        if (darkMode) {            
            mensajes_totales = $('span:contains("Mensajes totales:")')[0].innerText.split('Mensajes totales: ')[1].replaceAll('.', '');
            hilos_totales = $('span:contains("Temas:")')[0].innerText.split('Temas: ')[1].replaceAll('.', '');
        }
        else {
            var info = $('#collapseobj_forumhome_stats div')[0].innerText.split('Temas: ')[1].split(',');
            mensajes_totales = info[1].split("Mensajes: ")[1].replaceAll(".", "");
            hilos_totales = info[0].replaceAll(".", "");
        }
        return { "status": 200, "message": { "mensajes_totales": mensajes_totales, "hilos_totales": hilos_totales } }
    }
    catch {
        return { "status": 400 }
    }
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

document.onmousedown = function (e) {
    if ((e.target.id !== 'notas-popup-div' && e.target.id !== 'notas-usuarios-div' &&
        e.target.id !== 'notas-popup-title' && e.target.id !== 'notas-popup-edit' &&
        e.target.id !== 'notas-popup-text-container' && e.target.id !== 'notas-popup-text-editable' && e.target.id !== 'notas-popup-button') ||
        e.target.id == '') {
        $("#notas-popup-div").remove();
    }
}

listenThread();