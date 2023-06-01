//Imports functions from other scripts
import { setValueNoCheck } from "./opciones.js";

function getBrowser() {
    if (typeof browser !== "undefined") {
        return browser;
    } else {
        return chrome;
    }
}

export const browserInUser = getBrowser();

//Reloads the extensions and tab
browserInUser.commands.onCommand.addListener((shortcut) => {
    console.log('reload bitch');
    if (shortcut.includes("+Z")) {
        browserInUser.runtime.reload();
        browserInUser.tabs.reload();
    }
})

//Gets current tab that is active
export function getCurrentTab() {
    return new Promise(function (res, rej) {
        res(browserInUser.tabs.query({ currentWindow: true, active: true }));
    })
}

function getPermissions() {
    return new Promise(function (res, rej) {
        res(browserInUser.permissions.getAll())
    })
}

function checkIfPermissions() {
    if (typeof browser !== "undefined") {
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
                                    .text("Haz click derecho en el icono de la extensión y luego en \"Permitir siempre en forocoches.com\". Despues de esto, actualiza la que la extensión empieza a funcionar.")
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
                                $('.section-nav').addClass('visually-hidden');
                            }
                        })
                }
            })
    }
    else {

    }
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
        const manifestData = browserInUser.runtime.getManifest();
        $(".version-num").text(`versión ${manifestData.version}`);
        $('.color-selector').minicolors({
            opacity: false,
            control: 'hue',
            textfield: false,
            change: function () {
                setValueNoCheck(this.id)
            }
        });
    }
    catch (error) {
        console.error(error);
    }
}

//Searchs user on the Ranking Forocochero

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

function setVoteLink() {
    if (browserInUser === chrome) {
        //Adds link to the chrome store reviews
        document.getElementById("footer-rate")
            .addEventListener("click", function () {
                openInNewTab("https://chrome.google.com/webstore/detail/forocoches-premium/hdiegimcikljdcgohlcnilgephloaiaa/reviews");
            });
    }
    else {
        //Adds link to the chrome store reviews
        document.getElementById("footer-rate")
            .addEventListener("click", function () {
                openInNewTab("https://addons.mozilla.org/es/firefox/addon/forocoches-premium/");
            });

    }
}

//Adds link to the github repository
document.getElementById("footer-github")
    .addEventListener("click", function () {
        openInNewTab("https://github.com/ehtiotumolas/forocoches-premium");
    });

//Opens link in new tab
const openInNewTab = (url) => {
    window.open(url, "_blank");
}

setVoteLink();
start();