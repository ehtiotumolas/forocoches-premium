//Imports functions from other scripts
import { fetchUsers, fetchPoles, buscarUsuario, usuarios } from "./users.js";
import { setValueNoCheck } from "./opciones.js";
import { createTableRanking, createTablePoles, currentPage, setPagina, rowsPerPage } from "./table.js";

//Gets current tab that is active
export function getCurrentTab() {
    return new Promise(function (res, rej) {
        res(browser.tabs.query({ currentWindow: true, active: true }));
    })
}

function getPermissions() {
    return new Promise(function (res, rej) {
        res(browser.permissions.getAll())
    })
}

function checkIfPermissions() {
    getCurrentTab()
        .then(function (result) {
            if (result[0].url.includes("forocoches.com")) {
                getPermissions()
                    .then(function (result) {
                        if (!result.origins.includes("*://forocoches.com/*")) {
                            let firefoxContainer = $("<div/>")
                                .attr('id', 'firefox-container')
                                .attr('class', 'dashed')
                            let firefoxPermissions = $("<div/>")
                                .attr('id', 'firefox-permissions')
                                .text("Haz click derecho en el icono de la extensión y luego en \"Permitir siempre en forocoches.com\". Despues de esto, actualiza la página para que los cambios se hagan efectivos.")
                            let firefoxPermissionsAlert = $("<div/>")
                                .attr('id', 'firefox-permissions-alert')
                                .text("Acción requerida: dar los permisos necesarios a la extensión.")
                            let firefoxPermissionsImg = $("<img/>")
                                .attr('id', 'firefox-permissions-img')
                                .attr('src', '../static/images/permissions.png')
                            firefoxContainer.appendTo($(".section-body")[0])
                            firefoxPermissionsAlert.appendTo($("#firefox-container"));
                            firefoxPermissions.appendTo($("#firefox-container"));
                            firefoxPermissionsImg.appendTo($("#firefox-container"));
                            $('.container-default').addClass('visually-hidden');
                        }
                    })
            }
        })
}

checkIfPermissions();

// starts the logic
async function start() {
    try {
        /*
        ################################
        COMMENT SECTION ONLY FOR TESTING
        REMEMBER TO UNCOMMENT IT AFTER!!
        ################################
        */
        //Sets version
        const manifestData = browser.runtime.getManifest();
        $(".version-num").text(`versión ${manifestData.version}`);
        $('.color-selector').minicolors({
            opacity: false,
            control: 'hue',
            textfield: false,
            change: function() {
                setValueNoCheck(this.id)
             }
        });
        //Fetches all users from the DB and creates the Ranking Forocochero elements
        await fetchUsers()
            .then(() => createTableRanking())
            .then((res) => {
                if (res.status != 200) {
                    errorConnection();
                }
            });

        //Fetches all poles from the DB and creates the Ranking de Poles elements
        await fetchPoles()
            .then(() => createTablePoles())
            .then((res) => {
                if (res.status != 200) {
                    errorConnection();
                }
            });

    }
    catch (error) {
        console.error(error);
    }
}

//Searchs user on the Ranking Forocochero
['click'].forEach(evt => {
    document.getElementById("submit-buscar")
        .addEventListener(evt, function (event) {
            event.preventDefault();
            this.tabIndex = 1;
            buscarUsuario($("#user-buscar").val());
            $("#user-buscar").val('');
        });
});

//Pressing enter will search for user on the Ranking Forocochero
document.getElementById("user-buscar")
    .addEventListener("keyup", function (event) {
        event.preventDefault();
        if (event.keyCode === 13 && !this.hasAttribute('disabled')) {
            document.getElementById("submit-buscar").click();
        }
    });

//Hides and shows the different menus on the popup screen
$(".nav-element-container").click(function (e) {
    $('.main-content:not("visually-hidden")').addClass("visually-hidden")
    if ($(this).hasClass("clicked")) {
        $(this).removeClass("clicked")
        $(".container-default").removeClass("visually-hidden");
        $('.container-' + $(this).attr('id')).addClass("visually-hidden");
    }
    else {
        $(".nav-element-container").removeClass("clicked");
        $(".container-")
        $(this).addClass("clicked");
        $('.container-' + $(this).attr('id')).removeClass("visually-hidden");
    }
});

// Page navigation on the Ranking Forocochero
$("#pagina-left").click(function () {
    setPagina(currentPage - 1);
});

$("#pagina-right").click(function () {
    setPagina(currentPage + 1);
});

$("#pagina-first").click(function () {
    setPagina(0);
});

$("#pagina-last").click(function () {
    setPagina(Math.floor(usuarios.length / rowsPerPage));
});

//Hiddes/shows the text from each of the sections on the main page on the popup
$(".topDiv").each(function () {
    $(this).on("click", function (e) {
        e.preventDefault();
        if ($(this).next('.botDiv').css('display') == 'none') {
            $(this).next('.botDiv').slideDown(300);
        } else {
            $(this).next('.botDiv').slideUp(400);
        }
    });
});

//Adds link to paypal
document.getElementById("footer-donate")
    .addEventListener("click", function () {
        openInNewTab("https://www.paypal.com/donate/?hosted_button_id=G8DCS8GX6METS");
    });

//Adds link to the browser store reviews
document.getElementById("footer-rate")
    .addEventListener("click", function () {
        openInNewTab("https://chrome.google.com/webstore/detail/forocoches-premium/hdiegimcikljdcgohlcnilgephloaiaa/reviews");
    });

//Adds link to the github repository
document.getElementById("footer-github")
    .addEventListener("click", function () {
        openInNewTab("https://github.com/ehtiotumolas/forocoches-premium");
    });

//Opens link in new tab
const openInNewTab = (url) => {
    window.open(url, "_blank");
}

const errorConnection = () => {
    /*
    ################################
    COMMENT SECTION ONLY FOR TESTING
    REMEMBER TO UNCOMMENT IT AFTER!!
    ################################
    */


    var error = $("<hi/>")
        .attr('class', 'error-menssage')
        .text('Algo pasa con el servidor. Contacta ')
    var mailto = $("<a/>")
        .attr('href', "mailto:ehtiotumolas@gmail.com")
        .text('ehtiotumolas@gmail.com')
    $(mailto).appendTo(error);
    $(".container-ranking").empty();
    $(".container-poles").empty();
    $(error).appendTo($(".container-ranking, .container-poles"));

    // $(".container-error, .container-default, .section-nav, .main-content").each(function () {
    //     if (!$(this).hasClass("visually-hidden")) $(this).toggleClass("visually-hidden");
    //     $(".container-error").toggleClass("visually-hidden");
    // });
    // throw `Cannot connect with the server`;
}
start();