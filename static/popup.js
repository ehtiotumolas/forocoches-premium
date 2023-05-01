//Imports functions from other scripts
import { fetchUsers, fetchPoles, buscarUsuario, usuarios } from "./users.js";
import { createTableRanking, createTablePoles, currentPage, setPagina, rowsPerPage } from "./table.js";

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
        setAndCompareVersions();

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

//Gets current tab that is active
export async function getCurrentTab() {
    return await chrome.tabs.query({ active: true, currentWindow: true }).tabs;
}

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

//Adds link to the chrome store reviews
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

    $(".container-error, .container-default, .section-nav, .main-content").each(function () {
        if (!$(this).hasClass("visually-hidden")) $(this).toggleClass("visually-hidden");
        $(".container-error").toggleClass("visually-hidden");
    });
    throw `Cannot connect with the server: ${res.status}`;
}

async function setAndCompareVersions() {
    const manifestData = chrome.runtime.getManifest();
    //Sets current version 

    $(".version-num").text(`versión ${manifestData.version}`);
    chrome.storage.sync.get(function (items) {
        if (Object.keys(items).length > 0 && items.version) {
            if (items.version != manifestData.version) {
                items.version = manifestData.version;
                chrome.storage.sync.set(items);
                //TODO create new section in the popup.html to display new changes
            };
        }
        //If local Chrome storage is empty, initialize version to current version
        else {
            if (!items.version) {
                items.version = manifestData.version;
                chrome.storage.sync.set(items);
                //TODO create new section in the popup.html to display new changes
            }
        }
    });
};

start();