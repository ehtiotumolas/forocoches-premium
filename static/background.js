const server = 'http://192.168.0.172:5001/';
chrome.tabs.onUpdated.addListener(function async(tabId, info, tab) {
    if (info.status === 'complete') {
        if (tab.url && tab.url.includes("foro/showthread.php")) {
            const queryParameters = tab.url.split("?t=")[1].split("&")[0];
            if (!queryParameters.includes("page")) {
                chrome.tabs.sendMessage(tabId, {
                    type: "hilo_info",
                    id: queryParameters
                }, async (response) => {
                    console.log("Response: ", response.status);
                    if (response.status == 200) addHilos(response.message);
                });
            }
            chrome.tabs.sendMessage(tabId, {
                type: "hilo_usuarios_info",
                id: queryParameters
            }, async (response) => {
                console.log("Response: ", response.status);
                if (response.status == 200) addUsers(response.message);
            });
        }
        if (tab.url && tab.url.includes("foro/member.php")) {
            const queryParameters = tab.url.split("?u=")[1].split("#")[0].split("&")[0];
            chrome.tabs.sendMessage(tabId, {
                type: "usuario_info",
                id: queryParameters
            }, (response) => {
                console.log("Response: ", response.status);
                if (response.status == 200) addUser(response.message);
            });
        }
        if (tab.url && tab.url.includes("search.php?searchid=")) {
            chrome.tabs.sendMessage(tabId, {
                type: "usuario_info_old_hilos"
            }, (response) => {
                console.log("Response: ", response.status);
                if (response.status == 200) addUserHilosOld(response.message);
            });
        }
    }
});

chrome.commands.onCommand.addListener((shortcut) => {
    console.log('lets reload');
    console.log(shortcut);
    if (shortcut.includes("+M")) {
        chrome.runtime.reload();
    }
})

const addUser = (json) => {
    sendRequest('POST', server + 'addUser', json, 'addUser')
}

const addUserHilosOld = (json) => {
    sendRequest('POST', server + 'addUserHilosOld', json, 'addUserHilosOld')
}

const addUsers = (json) => {
    sendRequest('POST', server + 'addUsers', json, 'addUsers')
}

const addHilos = (json) => {
    sendRequest('POST', server + 'addHilos', json, 'addHilos')
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
