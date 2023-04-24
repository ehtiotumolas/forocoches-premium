const server = 'http://192.168.0.172:5001/';

chrome.tabs.onUpdated.addListener(function async(tabId, info, tab) {
    if (info.status === 'complete') {
        if (tab.url && tab.url.includes("foro/showthread.php")) {
            const pageInfo = tab.url.split("=")[1];
            const [id, queryParameters] = pageInfo.split(/[.\&#/_]/)
            if (!queryParameters || queryParameters.includes("highlight")) {
                chrome.tabs.sendMessage(tabId, {
                    type: "hilo_info",
                    id: id
                }, async (response) => {
                    console.log("Response hilo_info: ", await response.status);
                    if (response.status == 200) addPole(response.message);
                    if (response.status == 400) removePole(response.message);
                });
            }
            chrome.tabs.sendMessage(tabId, {
                type: "hilo_usuarios_info",
                id: id
            }, async (response) => {
                console.log("Response hilo_usuarios_info: ", await response.status);
                if (response.status == 200) addUsers(response.message);
            });
        }
        if (tab.url && tab.url.includes("search.php?searchid=")) {
            chrome.tabs.sendMessage(tabId, {
                type: "usuario_info_old_hilos"
            }, async (response) => {
                console.log("Response usuario_info_old_hilos: ", await response.status);
                if (response.status == 200) addUserHilosOld(response.message);
            });
        }
        if (tab.url && tab.url.includes("foro/member.php")) {
            const queryParameters = tab.url.split("?u=")[1].split("#")[0].split("&")[0];
            chrome.tabs.sendMessage(tabId, {
                type: "usuario_info",
                id: queryParameters
            }, async (response) => {
                console.log("Response usuario_info: ", await response.status);
                if (response.status == 200) addUser(response.message);
            });
        }
    }
});

chrome.commands.onCommand.addListener((shortcut) => {
    console.log('reload bitch');
    console.log(shortcut);
    if (shortcut.includes("+Z")) {
        chrome.runtime.reload();
        chrome.tabs.reload();
    }
})

chrome.runtime.onMessage.addListener((obj) => {
    if (obj.type === "reload") {
        chrome.tabs.reload();
    }
    if (obj.type === "chrome-storage") {
        addToChromeStorage(obj.content.loc, obj.content.message, obj.content.action);
    }
});

const addUser = (json) => {
    sendRequest('POST', server + 'addUser', json, 'addUser')
}

const addUserHilosOld = (json) => {
    sendRequest('POST', server + 'addUserHilosOld', json, 'addUserHilosOld')
}

const addUsers = (json) => {
    sendRequest('POST', server + 'addUsers', json, 'addUsers')
}

const addPole = (json) => {
    sendRequest('POST', server + 'addPole', json, 'addPole')
}

const removePole = (json) => {
    sendRequest('POST', server + 'removePole', json, 'removePole')
}

const addToChromeStorage = (loc, message, action) => {
    chrome.storage.sync.get(function (items) {
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
                items.notas[message.usuario]= {"text": message.text};
            }
        }
        chrome.storage.sync.set(items);
    });
}

const sendRequest = (method, url, data, sender) => {
    var data = data;
    var headers = {
        "Content-Type": "application/json",
        "Access-Control-Origin": "*"
    }
    var url = url;
    fetch(url, {
        method: method,
        headers: headers,
        body: JSON.stringify(data)
    })
        .then(function (response) {
            if (response.status == 200)
                console.log(response.status)
            else
                console.log(response.status)
        })
        .catch(function (err) {
            console.log(sender + ": " + err)
        });
}
