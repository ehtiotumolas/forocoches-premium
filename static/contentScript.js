let mo = new MutationObserver(onMutation);
let temas_ignorados;
let usuarios_ignorados;
let opciones;
let savedNotas;
let toListen = new Set();
let newDesign;
let darkMode = false;
let forocochero;
let printed = false;
const clients = ["fea6fcd61bc05c5", "4dc3ae00f7ddb78"]
let currentClient = clients[0]

function getBrowser() {
    if (typeof browser !== "undefined") {
        return browser;
    } else {
        return chrome;
    }
}

const browserInUser = getBrowser();

//Gets info from Chrome local storage where ignored users, ignored threads, options, and notes are stored

//Get storage from Firefox
async function storageLocalGet(keys) {
    //Gets info from browser local storage where ignored users, ignored threads, options, and notes are stored
    await browserInUser.storage.sync.get(keys)
        .then((items) => {
            temas_ignorados = items.temas_ignorados;
            usuarios_ignorados = items.usuarios_ignorados;
            savedNotas = items.notas;
            opciones = items.opciones;
            $.each(opciones, function (opcion) {
                if (opciones[opcion].checked) {
                    if ((opcion == "temas-ignorados" || opcion == "hilos-color") && !location.href.includes("forumdisplay.php")) {
                        return;
                    }
                    if ((opcion == "op-color" || opcion == "usuario-color") && !location.href.includes("showthread.php?")) {
                        return;
                    }
                    toListen.add(opcion);
                }
            })
        });
}

storageLocalGet();

//Listens to the HTML when loading in order to do all the magic
function onMutation(mutations) {
    for (const { addedNodes } of mutations) {
        for (const n of addedNodes) {
            if (n.tagName) {
                checkElement(n)
            }
        }
    }
}

function checkElement(n) {
    //Finds if the user is using the old design or new design of the forum
    if (newDesign == undefined && ((n.tagName == 'MAIN') || (n.tagName == 'A' && n.id == 'poststop'))) {
        if (n.tagName == 'MAIN') {
            newDesign = true;
            if ($('BODY').hasClass("dark_theme")) { darkMode = true; }
            if ($('.username')[0] !== undefined) {
                forocochero = $('.username')[0].innerHTML;
            }
        }
    }
    if (newDesign == undefined && ((n.tagName == 'DIV') && $(n).hasClass("smallfont"))) {
        if ($(n).has("strong")) {
            newDesign = false;
            if ($(n).find('a').length > 1) {
                forocochero = $(n).find('a')[0].innerText;
            }
            else {
                forocochero = $(n).find('a').innerText;
            }
        }
    }
    //Removes ignored threads from the forum
    if (toListen.has("temas-ignorados")) {
        if (n.tagName == 'A' && n.id.includes('thread_title_') && temas_ignorados && temas_ignorados.some(substring => normalizeText(n.innerText).includes(normalizeText(substring)))) {
            let papa = $(n).parent().parent().parent();
            if ((newDesign)) papa = $(papa).parent();
            $(papa).next("separator").remove();
            $(papa).remove();
        }
    }
    //Removes messages from ignored users, but also threads created by ignored users 
    //Also adds skull besides the username in order to allow the user to ignore users
    if (toListen.has("usuarios-ignorados")) {
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
                            browserInUser.runtime.sendMessage({ sender: "contentScript", type: "browserInUser-storage", content: { loc: "usuario", message: usuario, action: "add" } });
                            browserInUser.runtime.sendMessage({ sender: "contentScript", type: "reload" });
                            browserInUser.runtime.sendMessage({ sender: "contentScript", type: "ignore_usuario", content: usuario });
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
                if (toListen.has("ocultar-usuarios-ignorados")) {
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
        if (n.tagName == 'FORM') {
            if (n.id == 'ignorelist_change_form') {
                var papa = $(n).parent();
            }
        }
    }
    //Adds funcionality to write notes for each user
    if (toListen.has("notas-usuario")) {
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
                                    browserInUser.runtime.sendMessage({ sender: "contentScript", type: "browserInUser-storage", content: { loc: "notas", message: { "usuario": usuario, "text": textToSave }, action: "add" } });
                                    browserInUser.runtime.sendMessage({ sender: "contentScript", type: "reload" });
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
    //Changes user messages background colour
    if (toListen.has("usuario-color")) {
        if (newDesign && n.tagName == 'SECTION' && $(n).find(`a:contains(${forocochero})`)[0]) {
            n.style.border = 0;
            n.style.backgroundColor = opciones["usuario-color"].value;
        }
        if (!newDesign && n.tagName == 'TD' && $(n).hasClass("alt1-user")) {
            let papa = $(n);
            //Removes border
            $(papa).closest('.tborder-user').removeClass();
            $(papa).children().css('border', 'none');
            //Changes background color
            $(papa).css('background-color', opciones["usuario-color"].value);
            $(papa).prev().css('background-color', shadeColor(opciones["usuario-color"].value, -5));
        }
    }
    //Changes OP messages background colour
    if (toListen.has("op-color")) {
        if (newDesign) {
            if (n.tagName == 'SECTION' && n.style.borderLeft == 'solid 4px var(--coral)') {
                n.style.border = 0;
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
    if (toListen.has("hilos-color")) {
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
    if (toListen.has("ocultar-publicidad")) {
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
                if (n.id.indexOf("optidigital-adslot") > -1 ||
                    n.id.indexOf("optidigital-adslot") > -1 ||
                    n.id.indexOf("optidigital-adslot") > -1 ||
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
    if (toListen.has("ocultar-trending")) {
        if (n.tagName == 'H2' && n.innerText === "Trending") {
            if (newDesign) {
                if ($(n).parent().parent().parent()[0].id === "sidebar") {
                    $(n).parent().parent().remove();
                }
            }
        }
    }
    //Hides foros-relacionados sidebar on the old design
    if (toListen.has("ocultar-foros-relacionados-viejo")) {
        if (n.tagName == 'SPAN' && $(n).hasClass("smallfont") && n.innerText == "Foros Relacionados") {
            if (!newDesign) {
                $($($(".smallfont")[0]).closest(".tborder")[0]).parent()[0].remove()
            }
        }
    }
    //Hides foros-relacionados sidebar on the new design
    if (toListen.has("ocultar-foros-relacionados-nuevo")) {
        if (n.tagName == 'H2' && (n.innerText === "Foros Relacionados" || n.innerText === "Foros relacionados")) {
            if (newDesign) {
                if ($(n).parent().parent()[0].id === "sidebar") {
                    $(n).parent().remove();
                }
            }
        }
    }
    //Hides messages from forocoches that appear on top of the screen to advertise companies and link to a thread
    if (toListen.has("ocultar-avisos")) {
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
    if (toListen.has("espacio-lateral")) {
        if (newDesign) {
            if (!toListen.has("ocultar-foros-relacionados-nuevo") || !toListen.has("ocultar-trending") || !toListen.has("ocultar-publicidad")) {
                $($("main")[0]).css({
                    "grid-template-columns": "24fr 5fr",
                    "max-width": "90%"
                });
            }
            else if (toListen.has("ocultar-foros-relacionados-nuevo") &&
                toListen.has("ocultar-trending") &&
                toListen.has("ocultar-publicidad")) {
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
            $('.text-format').css({ justifyContent: "", gap: "", paddingRight: "3rem" });
            $('.bbcode-addons').css({ justifyContent: "", gap: "", paddingLeft: 0 })
            $('.text-format').find("*").css({ gap: ".3rem" });
            $('.bbcode-addons').find("*").css({ gap: ".3rem" });

            if ($(".container").width() < 900) {
                $('.text-format').parent().css({ gap: "5vw" });
            }
            else {
                $('.text-format').parent().css({ gap: "" });
            }
        }
    }
    //Makes avatars squared
    if (toListen.has("avatar-cuadrado")) {
        if (newDesign && n.tagName === 'IMG' && $(n).hasClass("thread-profile-image")) {
            $(n).css({
                borderRadius: "0"
            });
        }
    }
    //Makes avatars bigger
    if (toListen.has("avatar-grande")) {
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
    //Adds drag and drop image feature
    if (toListen.has("auto-subir-imagenes")) {
        if (document.URL.includes('/showthread.php') || document.URL.includes('/newreply.php') || document.URL.includes('/newthread.php')) {
            let imgDrop = $("<div/>")
                .attr('id', 'dropArea')
                .css({
                    display: "flex",
                    width: "200px",
                    height: "38px",
                    backgroundColor: "white",
                    border: "1px solid",
                    borderRadius: "4px",
                    color: "gray",
                    justifyContent: "center",
                    alignItems: "center",
                    marginLeft: "auto",
                    marginRight: "auto",
                    marginTop: ".5rem",
                })
                .text("Arrastra imágenes aquí")
            if (n.id == "qr_submit" && document.URL.includes('/showthread.php')) {
                if (newDesign) {
                    imgDrop.insertBefore($('#qr_submit'));
                }
                else {
                    imgDrop.insertAfter($('#vB_Editor_QR'));
                }
                setdropArea();
            }
            if (n.id == "vB_Editor_001_textarea" && (document.URL.includes('/newreply.php') || document.URL.includes('/newthread.php'))) {
                if (!newDesign) {
                    $(n).parent().css({ display: 'block' });
                }
                let parent = $(n).parent().parent();
                imgDrop.css({ left: "0", right: "0", marginLeft: "auto", marginRight: "auto", position: "relative", marginTop: ".5rem" })
                parent.append(imgDrop);
                setdropArea();
            }
        }
    }
}
//Starts observing the thread being loaded
function observe() {
    mo.observe(document, {
        subtree: true,
        childList: true
    });
}

//Listens the current tab, only on forocoches.com, so the HTML can be read and the extension can do its magic
function listenThread() {
    onMutation([{ addedNodes: [document.documentElement] }]);
    observe();
};

listenThread();

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

//Opens link in new tab
const openInNewTab = (url) => {
    window.open(url, "_blank");
}

//Listens for messages from other scripts
browserInUser.runtime.onMessage.addListener((obj, sender, sendResponse) => {
    console.log("Listening")
    printRoto2();
    const { type, value } = obj;
    if (type === "DOM loaded") {
        sendResponse({ "status": 200, "message": "OK" });
        afterDOMLoaded(value);
    }
});

async function compareVersions() {
    const manifestData = browserInUser.runtime.getManifest();
    //Checks current version matches the one stored
    await browserInUser.storage.sync.get()
        .then((items) => {
            const manifestData = browserInUser.runtime.getManifest();
            if (Object.keys(items).length > 0 && items.version) {
                if (items.version.slice('.', items.version.lastIndexOf('.')) !== manifestData.version.slice('.', items.version.lastIndexOf('.'))) {
                    items.version = manifestData.version;
                    openInNewTab(`https://www.forocochero.com/version?version=${manifestData.version.replaceAll('.', '')}`)
                };
            }
            //If local browser storage is empty, initialize version to current version
            else {
                items.version = manifestData.version;
                //TODO create new section in the popup.html to display new changes
            }
            browserInUser.storage.sync.set(items);
        });
};

function printRoto2() {
    if (printed == false) {
        console.log(`    
    ▒█▀▀▀ █▀▀█ █▀▀█ █▀▀█ █▀▀ █▀▀█ █▀▀ █░░█ █▀▀ █▀▀ 　 ▒█▀▀█ █▀▀█ █▀▀ █▀▄▀█ ░▀░ █░░█ █▀▄▀█ 
    ▒█▀▀▀ █░░█ █▄▄▀ █░░█ █░░ █░░█ █░░ █▀▀█ █▀▀ ▀▀█ 　 ▒█▄▄█ █▄▄▀ █▀▀ █░▀░█ ▀█▀ █░░█ █░▀░█ 
    ▒█░░░ ▀▀▀▀ ▀░▀▀ ▀▀▀▀ ▀▀▀ ▀▀▀▀ ▀▀▀ ▀░░▀ ▀▀▀ ▀▀▀ 　 ▒█░░░ ▀░▀▀ ▀▀▀ ▀░░░▀ ▀▀▀ ░▀▀▀ ▀░░░▀                  
                                          .-=*#%%%%##+=:                      
                              .:=+******#@@@@%#*****#%@@@%*=:                 
                         .=*@@%#++======+*#@@#+:::::::-+*%@@@@#+=:           
                      =%@%+-               :*@@*::::::::---=*#%@@@@#:       
                    -%@*.                    .*@@+::::::--------=+#@@+      
                   +@%:                        .%@*::::::---------=*@@=     
                  -@%  :---:                    :@@-:::-=+*##%%@@%%#%@@.    
                  %@##@@@@@@@#=                  *@#-*%@@%*+==-::-+%@@@*    
                 :@@@@@@@@@@@@@%.                :@@@@+.            -@@@.   
                 +@@@@@@@@@@@@@@%                .@@+         :%@@#  -@@%   
                 #@@@@@@@@@@@@@@@                +@#          -@@@@.  %@@=  
                 #@@@@@@@@@@@@@@#                %@=           .-:    =@@@  
                .@@@@@@@@@@@@@@*                 +@%                  -@@@* 
                =@@+#@@@@@@@@*:                  -@@%:                .%@@@ 
                *@@...-%@%#%@@@@@%%%#*+=-:...:-+%@%=%@#-.              =@@@-
                #@%....#@+    ..:::-+@@%%@@@@@%*=:  .@@@@@%#*****#%#+==%@@@=
                *@@....%@=          :@@-            .@@+.:-==+++==@@@%%#*@@=
                -@@=...*@*          :@@-            .@@+          %@#=++*@@=
                 %@%...-@@:         :@@-            .@@+          #@#+++#@@.
                 :@@+.::+@@-        :@@-            .@@+          %@#++*@@+ 
                  =@@=:::-%@#.      :@@-            .@@+          @@*+*@@#  
                   +@@+::::+%@#-    :@@-            .@@+         -@@+#@@*   
                    -@@#-::::=#@@#=.:@@-            .@@+        -@@%@@%:    
                     .#@@*::::::=*%@@@@-            .@@+    .-+@@@@@%-      
                       -%@@+-::::::-+@@-            .@@@@@@@@@%%@@%-        
                         -%@@*-:----=@@-            .@@#++++++%@@=          
                           -#@@%*=--=@@-            .@@#===+#@@#.           
                             .=#@@@%#@@*==++++**##%@@@@+++*@@%-             
                                 :=*%@@@@@@###**##%@@@@@@@@%=     `)
        printed = true;
    }

}

function afterDOMLoaded(url) {
    //Hides foros-relacionados sidebar on the old design if it hasn't been removed before
    if (url.includes('/index.php') || url.includes('/foro/forumdisplay')) {
        if (!newDesign && toListen.has("ocultar-foros-relacionados-viejo")) {
            $("table.tborder[bgcolor='#555576']")[0].remove();
        }
    }
}

function handleDrop(e) {
    let dt = e.dataTransfer
    let files = dt.files

    handleFiles(files)
}

function handleFiles(files) {
    ([...files]).forEach(uploadFile)
}

const uploadFile = async (file) => {
    try {
        var apiUrl = 'https://api.imgur.com/3/image';
        var settings = {
            async: false,
            crossDomain: true,
            processData: false,
            contentType: false,
            type: 'POST',
            url: apiUrl,
            headers: {
                Authorization: 'Client-ID ' + currentClient,
            },
        };
        const myForm = new FormData();
        myForm.append("image", file);
        settings.data = myForm;

        $.ajax(settings).done(function (data, textStatus, request) {
            if (textStatus == "success") {
                if ($('#vB_Editor_001_textarea').css('display') == 'none' || $('#vB_Editor_QR_textarea').css('display') == 'none') {
                    doc = $('.iframe_vB_Editor')[0].contentWindow.document;
                    body = $('body', doc)
                    if (document.URL.includes('postreply')) {
                        body[0].innerHTML += "<br />" + `\n[IMG]${data.data.link}[/IMG]`;
                    }
                    else {
                        body[0].innerHTML += `[IMG]${data.data.link}[/IMG]` + "<br />";
                    }
                }
                if ($('#vB_Editor_QR_textarea').length != 0) {
                    $('#vB_Editor_QR_textarea')[0].value += `\n[IMG]${data.data.link}[/IMG]`;
                }
                else {
                    $('#vB_Editor_001_textarea')[0].value += `\n[IMG]${data.data.link}[/IMG]`;
                }
                console.log(request.getResponseHeader("x-ratelimit-clientremaining"))
            }
            else {
                if (currentClient == clients[0]) {
                    currentClient = clients[1];
                    uploadFile(file);
                    return
                }
                else {
                    alert("Se ha encontrado un problema al intentar subir la imagen a imgur")
                    console.log("Se ha encontrado un problema al intentar subir la imagen a imgur");
                    if (err.response.data.error) {
                        console.log(err.response.data.error);
                        //When trouble shooting, simple informations about the error can be found in err.response.data.error so it's good to display it
                    }
                }
            }
        });
    }
    catch (error) {
        console.log(error);
    }
}

function setdropArea() {
    function preventDefaults(e) {
        e.preventDefault()
        e.stopPropagation()
    }

    ;['dragenter', 'dragover', 'dragleave', 'drop'].forEach(eventName => {
        document.getElementById('dropArea').addEventListener(eventName, preventDefaults, false)
    })

        ;['dragenter', 'dragover'].forEach(eventName => {

            document.getElementById('dropArea').addEventListener(eventName, highlight, false)
        })

        ;['dragleave', 'drop'].forEach(eventName => {
            document.getElementById('dropArea').addEventListener(eventName, unhighlight, false)
        })

    function highlight(e) {
        document.getElementById('dropArea').classList.add('highlight')
    }

    function unhighlight(e) {
        document.getElementById('dropArea').classList.remove('highlight')
    }

    document.getElementById('dropArea').addEventListener('drop', handleDrop, false)
}

compareVersions();