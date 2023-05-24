//APIs server
const server = "https://www.forocochero.com"

//Listens to chrome tabs on forocoches.com
//Depending on the content of the URL, different actions are performed
chrome.tabs.onUpdated.addListener(function async(tabId, info, tab) {
    if (info.status === 'complete') {
        if (tab.url && tab.url.includes("foro/showthread.php")) {
            const pageInfo = tab.url.split("=")[1];
            const [id, queryParameters] = pageInfo.split(/[.\&#/_]/)
            if (!queryParameters || queryParameters.includes("highlight")) {
                chrome.tabs.sendMessage(tabId, {
                    type: "hilo_info",
                }, async (response) => {
                    console.log("Response hilo_info: ", await response.status);
                    //If thread exists, add Pole
                    if (response.status == 200) {
                        if (response.message != "") {
                            addPole(response.message);
                        }
                        //Finds out the number of messages created by each user in the thread
                        chrome.tabs.sendMessage(tabId, {
                            type: "hilo_usuarios_info",
                        }, async (response) => {
                            console.log("Response hilo_usuarios_info: ", await response.status);
                            if (response.status == 200) addUsers(response.message);
                        });
                        //Finds out if any of the messages on the current thread have any likes
                        chrome.tabs.sendMessage(tabId, {
                            type: "hilo_mensaje_likes",
                        }, async (response) => {
                            console.log("hilo_mensaje_likes: ", await response.status);
                            if (response.status == 200)
                                findLikedPosts(tabId, response.message);
                        });
                    }
                    //If thread is now deleted, remove pole from DB
                    if (response.status == 400) {
                        removePole({ "hilo_id": id });
                    }
                    if (response.status == 404) console.log(response.message);
                });
            }
        }
        //Gets number of threads created by a particular searched user
        if (tab.url && tab.url.includes("search.php?searchid=")) {
            chrome.tabs.sendMessage(tabId, {
                type: "usuario_info_old_hilos"
            }, async (response) => {
                console.log("Response usuario_info_old_hilos: ", await response.status);
                if (response.status == 200) addUserHilosOld(response.message);
            });
        }
        //Gets the number of threads and messages created by a particular user
        if (tab.url && tab.url.includes("member.php")) {
            const queryParameters = tab.url.split("?u=")[1].split("#")[0].split("&")[0];
            chrome.tabs.sendMessage(tabId, {
                type: "usuario_info",
                value: queryParameters
            }, async (response) => {
                console.log("Response usuario_info: ", await response.status);
                if (response.status == 200) addUser(response.message);
            });
        }
        //Gets forocoches´ total number of messages
        if (tab.url && tab.url == "https://forocoches.com/foro/") {
            chrome.tabs.sendMessage(tabId, {
                type: "estadisticas"
            }, async (response) => {
                console.log("Response estadisticas: ", await response.status);
                if (response.status == 200) addEstadisticas(response.message);
            });
        }
        if (tab.url && tab.url.includes("forocoches.com/foro")) {
            chrome.tabs.sendMessage(tabId, {
                type: "DOM loaded",
                value: tab.url
            }, async (response) => {
                console.log("DOM loaded: ", await response.status);
            });
        }
    }
});

//Reloads the extensions and tab
chrome.commands.onCommand.addListener((shortcut) => {
    console.log('reload bitch');
    if (shortcut.includes("+Z")) {
        chrome.runtime.reload();
        chrome.tabs.reload();
    }
})

//Listen to messages from other scripts
chrome.runtime.onMessage.addListener((obj) => {
    //Reloads current tab
    if (obj.type === "reload") {
        chrome.tabs.reload();
    }
    //Adds to local chrome storage
    if (obj.type === "chrome-storage") {
        addToChromeStorage(obj.content.loc, obj.content.message, obj.content.action);
    }
    //Updates message's likes on the DB
    if (obj.type === "update-likes") {
        sendRequest('POST', server + '/' + 'updateLikes', obj.content, 'updateLikes')
            .then((response) => response.json())
            .then((response) => {
                console.log('updateLikes' + ': ' + response.status)
            });
    }
});

//Adds user's number of messages and threads to the DB
const addUser = (json) => {
    sendRequest('POST', server + '/' + 'addUser', json, 'addUser')
        .then((response) => response.json())
        .then((response) => {
            console.log('addUser' + ': ' + response.status)
        });
}

//Adds user's number of messages and threads to the DB from the search page
const addUserHilosOld = (json) => {
    sendRequest('POST', server + '/' + 'addUserHilosOld', json, 'addUserHilosOld')
        .then((response) => response.json())
        .then((response) => {
            console.log('addUserHilosOld' + ': ' + response.status)
        });
}

//Adds all thread users number of messages to the DB
const addUsers = (json) => {
    sendRequest('POST', server + '/' + 'addUsers', json, 'addUsers')
        .then((response) => response.json())
        .then((response) => {
            console.log('addUsers' + ': ' + response.status)
        });
}

//Add thread's pole to the DB
const addPole = (json) => {
    sendRequest('POST', server + '/' + 'addPole', json, 'addPole')
        .then((response) => response.json())
        .then((response) => {
            console.log('addPole' + ': ' + response.status)
        });
}

//Removes pole from the DB when thread is deleted
const removePole = (json) => {
    sendRequest('POST', server + '/' + 'removePole', json, 'removePole')
        .then((response) => response.json())
        .then((response) => {
            console.log('removePole' + ': ' + response.status)
        });
}

//Adds forocoches' total number of messages to the DB
const addEstadisticas = (json) => {
    sendRequest('POST', server + '/' + 'addEstadisticas', json, 'addEstadisticas')
        .then((response) => response.json())
        .then((response) => {
            console.log('addEstadisticas' + ': ' + response.status)
        });
}

//Adds info such as ignored users, ignored threads and notes to the local Chrome storage
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
        chrome.storage.sync.set(items);
    });
}

//Helps calling API
function sendRequest(method, url, data, sender) {
    let headers = {
        "Content-Type": "application/json",
        "Access-Control-Origin": "*"
    }
    return fetch(url, {
        method: method,
        headers: headers,
        body: JSON.stringify(data)
    })
}

//Finds all liked messages from the current thread
function findLikedPosts(tabId, json) {
    sendRequest('POST', server + '/' + 'getAllLikes', json, 'getAllLikes')
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