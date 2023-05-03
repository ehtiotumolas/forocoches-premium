const mo = new MutationObserver(onMutation);
let temas_ignorados;
let usuarios_ignorados;
let opciones;
let savedNotas;
let toListen = [];
let newDesign;
let darkMode = false;
let forocochero;

//Gets info from Chrome local storage where ignored users, ignored threads, options, and notes are stored
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

//Listens for messages from other scripts
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

//Listens the current tab, only on forocoches.com, so the HTML can be read and the extension can do its magic
const listenThread = () => {
    onMutation([{ addedNodes: [document.documentElement] }]);
    observe();
    retrieveStorage()
        .then(() => {
            //Iterates from the current settings of the extension and listens to only the options enabled by the user shurmanito
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
            })
        })
};

//Listens to the HTML when loading in order to do all the magic
function onMutation(mutations) {
    let stopped;
    for (const { addedNodes } of mutations) {
        for (const n of addedNodes) {
            if (n.tagName) {
                //Finds if the user is using the old design or new design of the forum
                if (newDesign == undefined && ((n.tagName == 'MAIN') || (n.tagName == 'A' && n.id == 'poststop'))) {
                    if (n.tagName == 'MAIN') {
                        newDesign = true;
                        if ($('BODY').hasClass("dark_theme")) { darkMode = true; }
                        if ($('.username')[0] !== undefined) {
                            forocochero = $('.username')[0].innerHTML;
                        }
                    }
                    else {
                        newDesign = false;
                        forocochero = $('.smallfont > strong > a')[0].innerText;
                    }
                }
                //Removes ignored threads from the forum
                if (toListen.includes("temas-ignorados")) {
                    if (n.tagName == 'A' && n.id.includes('thread_title_') && temas_ignorados && temas_ignorados.some(substring => normalizeText(n.innerText).includes(normalizeText(substring)))) {
                        let papa = $(n).parent().parent().parent();
                        if ((newDesign)) papa = $(papa).parent();
                        $(papa).next("separator").remove();
                        $(papa).remove();
                    }
                }
                if (!newDesign && n.tagName == 'TD' && $(n).hasClass("alt1-user")) {
                    let papa = $(n);
                    //Removes border
                    $(papa).closest('.tborder-user').removeClass();
                    $(papa).children().css('border', 'none');
                    //Changes background color
                    $(papa).css('background-color', opciones["op-color"].value);
                    $(papa).prev().css('background-color', shadeColor(opciones["op-color"].value, -5));
                }
                //Removes messages from ignored users, but also threads created by ignored users 
                //Also adds skull besides the username in order to allow the user to ignore users
                if (toListen.includes("usuarios-ignorados")) {
                    if (n.tagName == 'DIV') {
                        if (n.id.includes('edit')) {
                            let postId = "postmenu_" + n.id.split('edit')[1];
                            let postDiv = $(`div[id=${postId}]`)[0];
                            let calaveraBtn = $("<a/>")
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
                                    let usuario = postDiv.children[0].innerText;
                                    if (confirm(`Seguro que quieres ignorar a ${usuario}?`)) {
                                        chrome.runtime.sendMessage({ sender: "contentScript", type: "chrome-storage", content: { loc: "usuario", message: usuario, action: "add" } });
                                        chrome.runtime.sendMessage({ sender: "contentScript", type: "reload" });
                                        chrome.runtime.sendMessage({ sender: "contentScript", type: "ignore_usuario", content: usuario });
                                    };
                                });
                            if (newDesign) {
                                if ($(postDiv).parent().parent().children("#container-opciones").length == 0) {
                                    $("<div/>").attr('id', 'container-opciones').css({ paddingLeft: "5px" }).insertAfter($(postDiv).parent().parent().children()[0]);;
                                }
                                calaveraBtn.appendTo($(postDiv).parent().parent().children("#container-opciones"));
                            }
                            else {
                                calaveraBtn.css({ marginLeft: "0px", position: "relative" }).height("auto").appendTo($(postDiv).parent());
                            }
                        }
                        if ($(n).children('b').length > 0 && usuarios_ignorados && usuarios_ignorados.some(substring => n.innerText.toLowerCase().includes(`cita de ${substring.toLowerCase()}`))) {
                            if (toListen.includes("ocultar-usuarios-ignorados")) {
                                let papa = $(n).parent().parent().parent();
                                if (newDesign) {
                                    papa.remove();
                                }
                                else {
                                    papa.parent().parent().remove();
                                }
                            }
                            else {
                                let usuario = $(n);
                                $(usuario).children('b')[0].innerText = "(Usuario Ignorado)";
                                if ((newDesign)) usuario = $(usuario).parent('div')[0];
                                $(usuario).next('div')[0].innerText = "(Texto ignorado)";
                            }
                        }
                    }
                    if (n.tagName == 'A' && usuarios_ignorados) {
                        if (n.href.includes('profile.php?userlist=ignore&do=removelist')) {
                            papa = $(n).parent().parent().parent().parent().closest('div')[0];
                            papa.remove();
                        }
                        if (usuarios_ignorados.some(substring => n.innerText.toLowerCase().includes(substring.toLowerCase()))) {
                            let papa;
                            if (n.href.includes('member.php?u=')) {
                                if (!newDesign) {
                                    papa = $(n).closest('.page');
                                }
                                else {
                                    papa = "#edit" + $(n).parent()[0].id.split("_")[1];
                                }
                            }
                            $(papa).remove();
                        }
                    }
                    if (n.tagName == 'SPAN') {
                        if (newDesign && usuarios_ignorados && usuarios_ignorados.some(substring => n.innerText.toLowerCase().includes(`@${substring.toLowerCase()}`))) {
                            let papa = $(n).parent().parent().parent().parent().parent();
                            papa.next("separator").remove();
                            papa.remove();
                        }
                        if (usuarios_ignorados && usuarios_ignorados.some(substring => n.innerText.toLowerCase().includes(`${substring.toLowerCase()}`)) && $(n).parent().hasClass("smallfont")) {
                            let papa = $(n).parent().parent().parent();
                            papa.next("separator").remove();
                            papa.remove();
                        }
                    }
                }
                //Adds funcionality to write notes for each user
                if (toListen.includes("notas-usuario")) {
                    if (n.tagName == 'DIV') {
                        if (n.id.includes('postmenu_') && !n.id.includes('_menu')) {
                            let postDiv = $(n)[0];
                            let usuario = "";
                            if (newDesign) {
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
                            let notasBtn = $("<a/>")
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
                                        let notas = $("<div/>")
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
                                        if (newDesign) {
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

                                        let textContainer = $("<div/>")
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

                                        let textEditable = $("<p/>")
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
                                                let textToSave = `${$("#notas-popup-text-editable")[0].innerText}`;
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

                            if (newDesign) {
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
                }
                //Changes OP messages background colour
                if (toListen.includes("op-color")) {
                    if (newDesign) {
                        if (n.tagName == 'SECTION' && n.style.borderLeft == 'solid 4px var(--coral)') {
                            n.style.backgroundColor = opciones["op-color"].value;
                        }
                    }
                    else {
                        if (n.tagName == 'TD' && $(n).hasClass("alt1-author") && n.id.includes("td_post_")) {
                            let papa = $(n).closest(".tborder-author");
                            //Removes border
                            $(papa).removeClass();
                            $(papa).children().css('border', 'none');
                            //Changes background color
                            $(papa).find('.alt1-author').css('background-color', opciones["op-color"].value);
                            $(papa).find('.alt2').css('background-color', shadeColor(opciones["op-color"].value, -5));
                            //Leave citas normal background
                            $($(papa).find('.alt2:contains("Cita de")')[0]).css('background-color', '');
                        }
                    }
                }
                //Changes threads with 0 messages background colour
                if (toListen.includes("hilos-color")) {
                    if (n.tagName == 'A' && n.href.includes("misc.php?do=whoposted")) {
                        if (n.innerText == "0") {
                            let papa = $(n).parent().parent().parent();
                            if (newDesign) {
                                $(papa).css("background-color", opciones["hilos-color"].value);
                            }
                            else {
                                $(papa).find('.alt1').css('background-color', opciones["hilos-color"].value)
                                $(papa).find('.alt2').css('background-color', shadeColor(opciones["hilos-color"].value, -10));
                            }
                        }
                    }
                }
                //Hides ads
                if (toListen.includes("ocultar-publicidad")) {
                    if (n.tagName == 'DIV') {
                        if (newDesign != undefined && newDesign) {
                            if ($(n).hasClass("fixed_adslot")) {
                                $(n).parent().remove();
                            }
                            if (n.id.indexOf("optidigital-adslot-Content_") > -1) {
                                if ($(n).next('SEPARATOR').length) {
                                    $(n).next('SEPARATOR').remove();
                                }
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
                                let papa = $(n).parents("table:first");
                                if (n.id.indexOf("optidigital-adslot-Skyscraper_") > -1) {
                                    papa = papa.parents("table:first");
                                }
                                papa.prev().remove();
                                if (n.id.indexOf("optidigital-adslot-Billboard_") == -1) {
                                    papa.next().remove();
                                }
                                papa.remove();
                            }
                            if (n.id.indexOf("opd_bottomstickyad") > -1) {
                                n.remove();
                            }
                        }
                    }
                    if (n.tagName == 'TABLE' && $(n).hasClass("cajasprin") && $(n).find(".Billboard_1").length !== 0) {
                        $(n).next('br').remove();
                        $(n).prev('br').remove();
                        $(n).remove();
                    }
                }
                //Hides trending sidebar
                if (toListen.includes("ocultar-trending")) {
                    if (n.tagName == 'H2' && n.innerText === "Trending") {
                        if (newDesign) {
                            if ($(n).parent().parent().parent()[0].id === "sidebar") {
                                $(n).parent().parent().remove();
                            }
                        }
                    }
                }
                //Hides foros-relacionados sidebar on the new design
                if (toListen.includes("ocultar-foros-relacionados-nuevo")) {
                    if (n.tagName == 'H2' && (n.innerText === "Foros Relacionados" || n.innerText === "Foros relacionados")) {
                        if (newDesign) {
                            if ($(n).parent().parent()[0].id === "sidebar") {
                                $(n).parent().remove();
                            }
                        }
                    }
                }
                //Hides foros-relacionados sidebar on the old design
                if (toListen.includes("ocultar-foros-relacionados-viejo")) {
                    if (n.tagName == 'SPAN' && $(n).hasClass("smallfont") && n.innerText == "Foros Relacionados") {
                        if (!newDesign) {
                            $($($(".smallfont")[0]).closest(".tborder")[0]).parent()[0].remove()
                        }
                    }
                }
                //Hides messages from forocoches that appear on top of the screen to advertise companies and link to a thread
                if (toListen.includes("ocultar-avisos")) {
                    if ($(n).hasClass("navbar_notice")) {
                        let papa = $(n).parent().parent();
                        if (newDesign) {
                            papa.remove();
                        }
                        else {
                            papa.parent().parent().remove();
                        }
                    }
                }
                //Deals with the side space and how this expands when sidebards and ads are removed
                if (toListen.includes("espacio-lateral")) {
                    if (newDesign) {
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
                //Makes avatars squared
                if (toListen.includes("avatar-cuadrado")) {
                    if (newDesign && n.tagName === 'IMG' && $(n).hasClass("thread-profile-image")) {
                        $(n).css({
                            borderRadius: "0"
                        });
                    }
                }
                //Makes avatars bigger
                if (toListen.includes("avatar-grande")) {
                    if (newDesign && n.tagName === 'IMG' && $(n).hasClass("thread-profile-image")) {
                        $(n).css({
                            width: "70px",
                            height: "70px"
                        });
                        $(n).parent().css({
                            height: "70px"
                        });
                    }
                }
                //Adds likes funcionality to the forum
                if (toListen.includes("likes")) {
                    if (n.tagName === 'A' && n.href.indexOf("report.php?p=") != -1) {
                        let likeBtn = $("<a/>")
                            .css({
                                display: "flex",
                                alignItems: "center",
                                fontWeight: "700",
                                justifyContent: "center",
                                alignItems: "center",
                                color: darkMode ? "rgb(243, 234, 234)" : "#43445c",
                                textDecoration: "none",
                                position: "relative"
                            })
                        if (!newDesign) {
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
                                if (newDesign) {
                                    postId = $($($(this)).parent()[0].closest('section')).parent()[0].id.split('edit')[1];
                                }
                                else {
                                    postId = $($(this)).parent()[0].closest('div').id.split('edit')[1];
                                }
                                likes = $(this).prev('span')[0];

                                if (!$(this).hasClass("liked")) {
                                    $(this)
                                        .css({ color: "red" })
                                        .toggleClass("liked");
                                    likes.innerText = Number(likes.innerText) + 1
                                    updateLikes(postId, forocochero, "add")
                                }
                                else {
                                    $(this)
                                        .css({ color: darkMode ? "rgb(243, 234, 234)" : "#43445c" })
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

//Starts observing the thread being loaded
function observe() {
    mo.observe(document, {
        subtree: true,
        childList: true,
    });
}

listenThread();

//Updates likes on the DB
const updateLikes = (postId, user, action) => {
    chrome.runtime.sendMessage({ sender: "contentScript", type: "update-likes", content: { id: postId, usuario: user, action: action } });
}

//Changes colour of the liks heart to red when a message is liked
const updateAllLikes = (likedPosts) => {
    for (let liked of likedPosts) {
        let likedPost = $($(`#edit${liked.post}`)[0]);
        likedPost.find('#like-text')[0].innerText = liked.likes;
        if (liked.liked == 1) {
            $(likedPost.find('#like-button')[0])
                .toggleClass("liked")
                .css({ color: "red" });
        }
    }
}

//Gets current thread's messages id in order to find likes for each of the messages on the DB
const getAllPostsId = () => {
    let posts = [];
    $.each($('div[id*=edit]'), function (i, obj) {
        posts.push(obj.id.split('edit')[1])
    });
    return { "status": 200, "message": { "posts": posts, "usuario": forocochero } };
}

//If thread is invalid, pole is removed from the DB
const hiloInfo = (id) => {
    let usuario, usuario_id;
    if ($('center:contains("Tema especificado inválido")')[0] != null) {
        console.log("Tema especificado inválido");
        return { "status": 400, "message": { "hilo_id": id } }
    };

    if (newDesign) {
        try {
            let postFound = $(".date-and-time-gray").filter(function () {
                return this.innerText === "#2";
            }).parent().parent().parent().parent()[0].id.split('post')[1]
            let divFound = $(`div[id='postmenu_${postFound}'] > a`)[0];
            usuario = divFound.innerText
            usuario_id = divFound.href.split("php?u=")[1];
        }
        catch (err) {
            return { "status": 404, "message": err }
        }
    }
    else {
        let postFound = $('a[name="2"]')[0].href.split('#post')[1]
        let aFound = $(`div[id=postmenu_${postFound}] > a`)[0];
        usuario = aFound.innerText;
        usuario_id = aFound.href.split("php?u=")[1];
    }
    return { "status": 200, "message": { "hilo_id": id, "usuario": usuario, "usuario_id": usuario_id } }
}

//Gets total number of messages and threads created by a user, and the forum DoB
const userInfo = (id) => {
    let usuario, mensajes, hilos, registro;
    usuario = $(document).attr('title').replace("Forocoches - Ver Perfil: ", "");
    try {
        if (newDesign) {
            mensajes = $($('span:contains("Mensajes"):not(:contains("privados"))')[0]).prev("span")[0].innerText.replace(".", "");
            hilos = $($('span:contains("Hilos")')[2]).prev("span")[0].innerText.replace(".", "")
            registro = $($('span:contains("Desde")')[0]).next("span")[0].innerText
        }
        else {
            registro, mensajes = $('span:contains("Registro: "):contains("Mensajes")')[0].innerText.split('\n')
            registro = registro.split("Registro: ")[1];
            mensajes = mensajes.split("Mensajes: ")[1].replaceAll('.', '')
        }
        return { "status": 200, "message": { "usuario": usuario, "id": id, "mensajes": mensajes ? mensajes : 0, "hilos": hilos ? hilos : -1, "registro": registro } }
    }
    catch {
        return { "status": 400 }
    }
}

//Gets total number threads created by a user when using the search funtion
const userInfoHilosOld = () => {
    if ($('span:contains("Modo noche")').length == 0) {
        let url = ($("a[href^='search.php?']:contains('Buscar')")[0]).href;
        let matches = url.match(/(exactname=1|starteronly=1|forumchoice[[]]=0|showposts=0|replyless=0|replylimit=0|searchuser)/g).length;
        if (matches == 7 || (matches == 6 && !url.match("forumchoice[[]]="))
            || (!url.match("userid=0")) && !url.match("showposts=1")) {
            hilos = $('span:contains("Mostrando resultado")')[0].innerText.split('\n')[0].split("de ")[1];
            usuario = $('*:contains("Autores de Tema:") > a > b')[0].innerText;
            return { "status": 200, "message": { "usuario": usuario, "hilos": hilos } };
        }
    }
    return { "status": 400 }
}

//Gets total number of messages and threads created by a user, and the forum DoB, for all the users in the current thread
const usersInfo = (id) => {
    let usuarios = []
    let elements = $('*[id*=postmenu_]:visible')
    for (let element of elements) {
        if (newDesign) {
            let id = element.id;
            try {
                let usuario = $(`*[id*=${id}_menu] > div > div > h2`)[0].innerText.replaceAll('\n', '').trim();
                let usuario_id = $(`*[id*=${id}_menu] > div > div > h2 > a`)[0].href.split('php?u=')[1].trim();
                let registro = $(`*[id*=${id}_menu] > div > div > div > div:contains("Registro")`)[0].innerText.split('Registro: ')[1].replaceAll('\n', '').trim();
                let mensajes = $(`*[id*=${id}_menu] > div > div > div > div:contains("Mensajes")`)[0].innerText.split('Mensajes: ')[1].replaceAll('.', '').trim();
                usuarios.push({ "usuario": usuario, "id": usuario_id, "registro": registro, "mensajes": mensajes ? mensajes : 0 })
            }
            catch {
                console.log("Usuario invitado")
            }
        }
        else {
            let id = element.id;
            let usuario = ($(`*[id*=${id}] > a`)[0]).innerText;
            let usuario_id = ($(`*[id*=${id}] > a`)[0]).href.split('php?u=')[1].trim();
            let info = $($($(`*[id*=${id}]:visible`)[0]).parent()[0]).find('div:contains("Mens.")')[1].innerText;
            let [registro, mensajes] = info.split('|')
            registro = registro.trim()
            mensajes = mensajes.trim().split(' ')[0].replace(".", "");
            usuarios.push({ "usuario": usuario, "id": usuario_id, "registro": registro, "mensajes": mensajes ? mensajes : 0 })
        }
    }
    return { "status": 200, "message": usuarios }
}

//Gets forocoches' total number of threads and messages
const findEstadisticas = () => {
    try {
        let mensajes_totales, hilos_totales;
        if (newDesign) {
            mensajes_totales = $('span:contains("Mensajes totales:")')[0].innerText.split('Mensajes totales: ')[1].replaceAll('.', '');
            hilos_totales = $('span:contains("Temas:")')[0].innerText.split('Temas: ')[1].replaceAll('.', '');
        }
        else {
            let info = $('#collapseobj_forumhome_stats div')[0].innerText.split('Temas: ')[1].split(',');
            mensajes_totales = info[1].split("Mensajes: ")[1].replaceAll(".", "");
            hilos_totales = info[0].replaceAll(".", "");
        }
        return { "status": 200, "message": { "mensajes_totales": mensajes_totales, "hilos_totales": hilos_totales } }
    }
    catch {
        return { "status": 400 }
    }
}

//Gets a shade higher or lower from given colour
const shadeColor = (color, percent) => {
    let R = parseInt(color.substring(1, 3), 16);
    let G = parseInt(color.substring(3, 5), 16);
    let B = parseInt(color.substring(5, 7), 16);
    R = parseInt(R * (100 + percent) / 100);
    G = parseInt(G * (100 + percent) / 100);
    B = parseInt(B * (100 + percent) / 100);
    R = (R < 255) ? R : 255;
    G = (G < 255) ? G : 255;
    B = (B < 255) ? B : 255;
    R = Math.round(R)
    G = Math.round(G)
    B = Math.round(B)
    let RR = ((R.toString(16).length == 1) ? "0" + R.toString(16) : R.toString(16));
    let GG = ((G.toString(16).length == 1) ? "0" + G.toString(16) : G.toString(16));
    let BB = ((B.toString(16).length == 1) ? "0" + B.toString(16) : B.toString(16));
    return "#" + RR + GG + BB;
}

//Removes accents and diaeresis
const accentsMap = new Map([
    ["A", "Á|À|Ä"], ["a", "á|à|ä"], ["E", "É|È|Ë"], ["e", "é|è|ë"], ["I", "Í|Ì|Ï"], ["i", "í|ì|ï"],
    ["O", "Ó|Ò|Ö"], ["o", "ó|ò|ö"], ["U", "Ú|Ù|Ü"], ["u", "ú|ù|ü"], ["C", "Ç"], ["c", "ç"]
]);

const plainText = (str, [key]) => str.replace(new RegExp(accentsMap.get(key), "g"), key);
const normalizeText = (text) => [...accentsMap].reduce(plainText, text.toLowerCase());

//Opens notes pop-up element
document.onmousedown = function (e) {
    if ((e.target.id !== 'notas-popup-div' && e.target.id !== 'notas-usuarios-div' &&
        e.target.id !== 'notas-popup-title' && e.target.id !== 'notas-popup-edit' &&
        e.target.id !== 'notas-popup-text-container' && e.target.id !== 'notas-popup-text-editable' && e.target.id !== 'notas-popup-button') ||
        e.target.id == '') {
        $("#notas-popup-div").remove();
    }
}