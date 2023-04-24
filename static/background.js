const server = 'http://192.168.0.172:5001/';

chrome.tabs.onUpdated.addListener(function async(tabId, info, tab) {
    if (info.status === 'complete') {
        if (tab.url && tab.url.includes("foro/showthread.php")) {
            const pageInfo = tab.url.split("=")[1];
            const [id, queryParameters] = pageInfo.split(/[.\&#/_]/)
            chrome.tabs.sendMessage(tabId, {
                type: "hilo_mensaje_likes",
                id: id
            }, async (response) => {
                console.log("hilo_mensaje_likes: ", await response.status);
                if (response.status == 200) {
                    findLikedPosts(tabId, response.message)
                }
            });
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
        return true;
    }
});

chrome.commands.onCommand.addListener((shortcut) => {
    console.log('reload bitch');
    console.log(shortcut);
    if (shortcut.includes("+Z")) {
        chrome.runtime.reload();
        chrome.tabs.reload();
    }
    return true
})

chrome.runtime.onMessage.addListener((obj) => {
    if (obj.type === "reload") {
        chrome.tabs.reload();
    }
    if (obj.type === "chrome-storage") {
        addToChromeStorage(obj.content.loc, obj.content.message, obj.content.action);
    }
    if (obj.type === "update-likes") {
        sendRequest('POST', server + 'updateLikes', obj.content, 'updateLikes')
            .then((response) => response.json())
            .then((response) => {
                console.log('updateLikes' + ': ' + response.status)
            });
    }
    return true;
});

const addUser = (json) => {
    sendRequest('POST', server + 'addUser', json, 'addUser')
        .then((response) => response.json())
        .then((response) => {
            console.log('addUser' + ': ' + response.status)
        });
}

const addUserHilosOld = (json) => {
    sendRequest('POST', server + 'addUserHilosOld', json, 'addUserHilosOld')
        .then((response) => response.json())
        .then((response) => {
            console.log('addUserHilosOld' + ': ' + response.status)
        });
}

const addUsers = (json) => {
    sendRequest('POST', server + 'addUsers', json, 'addUsers')
        .then((response) => response.json())
        .then((response) => {
            console.log('addUsers' + ': ' + response.status)
        });
}

const addPole = (json) => {
    sendRequest('POST', server + 'addPole', json, 'addPole')
        .then((response) => response.json())
        .then((response) => {
            console.log('addPole' + ': ' + response.status)
        });
}

const removePole = (json) => {
    sendRequest('POST', server + 'removePole', json, 'removePole')
        .then((response) => response.json())
        .then((response) => {
            console.log('removePole' + ': ' + response.status)
        });
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
                items.notas[message.usuario] = { "text": message.text };
            }
        }
        chrome.storage.sync.set(items);
    });
}

function sendRequest(method, url, data, sender) {
    var headers = {
        "Content-Type": "application/json",
        "Access-Control-Origin": "*"
    }
    var url = url;
    return fetch(url, {
        method: method,
        headers: headers,
        body: JSON.stringify(data)
    })
}

function findLikedPosts(tabId, json) {
    sendRequest('POST', server + 'getAllLikes', json, 'getAllLikes')
        .then((response) => response.json())
        .then((response) => {
            const status = response.status;
            const content = response.content;
            if (status == 200) {
                console.log('getAllLikes' + ': ' + status)
                chrome.tabs.sendMessage(tabId, { type: "likes_info", value: content, id: 0 });
            }
            else {
                console.log(status)
            }
        });
}
