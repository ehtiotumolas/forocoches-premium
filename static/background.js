//APIs server
const server = "https://www.forocochero.com"

function getBrowser() {
    if (typeof browser !== "undefined") {
        return browser;
    } else {
        return chrome;
    }
}

const browserInUser = getBrowser();

//Reloads the extensions and tab
browserInUser.commands.onCommand.addListener((shortcut) => {
    console.log('reload bitch');
    if (shortcut.includes("+Z")) {
        browserInUser.runtime.reload();
        browserInUser.tabs.reload();
    }
})

//Listen to messages from other scripts
browserInUser.runtime.onMessage.addListener((obj, sendResponse) => {
    //Reloads current tab
    if (obj.type === "reload") {
        browserInUser.tabs.reload();
    }
    //Adds to local browser in user storage
    if (obj.type === "browserInUser-storage") {
        addToBrowserStorage(obj.content.loc, obj.content.message, obj.content.action);
    }
    //Adds to local browser in user storage
    if (obj.type === "browser") {
        sendResponse(browserInUser);
    }
});

//Adds info such as ignored users, ignored threads and notes to the local browserInUser storage
const addToBrowserStorage = (loc, message, action) => {
    browserInUser.storage.sync.get(function (items) {
        if (loc == "tema") {
            if (Object.keys(items).length > 0 && items.temas_ignorados) {
                if (action == "add") {
                    items.temas_ignorados.push(message);
                }
                if (action == "remove") {
                    items.temas_ignorados = items.temas_ignorados.filter(x => x !== message);
                }
            }
            else { items.temas_ignorados = [message]; }
        }
        if (loc == "temas") {
            if (Object.keys(items).length > 0 && !items.temas_ignorados) {
                items.temas_ignorados = []
            }
            if (Object.keys(items).length > 0 && items.temas_ignorados) {
                if (action == "add") {
                    message.forEach(tema => {
                        items.temas_ignorados.push(tema);
                    });
                }
            }
        }
        if (loc == "usuario") {
            if (Object.keys(items).length > 0 && items.usuarios_ignorados) {
                if (action == "add") {
                    items.usuarios_ignorados.push(message);
                }
                if (action == "remove") {
                    items.usuarios_ignorados = items.usuarios_ignorados.filter(x => x !== message);
                }
            }
            else { items.usuarios_ignorados = [message]; }
        }
        if (loc == "usuarios") {
            if (Object.keys(items).length > 0 && !items.usuarios_ignorados) {
                items.usuarios_ignorados = []
            }
            if (Object.keys(items).length > 0 && items.usuarios_ignorados) {
                if (action == "add") {
                    message.forEach(usuario => {
                        items.usuarios_ignorados.push(usuario);
                    });
                }
            }
        }
        if (loc.includes("opciones")) {
            if (message.value) {
                items.opciones[message.id].value = message.value;
            }
            items.opciones[message.id].checked = message.checked;
        }
        if (loc == "notas") {
            if (!items.notas) {
                items.notas = {};
            }
            if (message.text == "") {
                delete items.notas[message.usuario];
            }
            else {
                items.notas[message.usuario] = { "text": message.text };
            }
        }
        browserInUser.storage.sync.set(items);
    });
}