chrome.tabs.onUpdated.addListener(async (tabId, tab) => {
    setTimeout(function () {
        if (tab.url && tab.url.includes("foro/showthread.php")) {
            const queryParameters = tab.url.split("?t=")[1];
            if (!queryParameters.includes("page")) {
                chrome.tabs.sendMessage(tabId, {
                    type: "hilo_info",
                    id: queryParameters
                }, async (response) => {
                    console.log("Response: ", response);
                    addThread(response);
                });
            }
            chrome.tabs.sendMessage(tabId, {
                type: "hilo_usuarios_info",
                id: queryParameters
            }, async (response) => {
                console.log("Response: ", response);
                addUsers(response);
            });
        }
        if (tab.url && tab.url.includes("foro/member.php")) {
            const queryParameters = tab.url.split("?u=")[1];
            chrome.tabs.sendMessage(tabId, {
                type: "usuario_info",
                id: queryParameters
            }, (response) => {
                console.log("Response: ", response);
                addUser(response);
            });
        }
    }, 2000);
});

chrome.commands.onCommand.addListener((shortcut) => {
    console.log('lets reload');
    console.log(shortcut);
    if (shortcut.includes("+M")) {
        chrome.runtime.reload();
    }
})

const addUser = (json) => {
    var data = json;
    var headers = {
        "Content-Type": "application/json",
        "Access-Control-Origin": "*"
    }
    var url = 'http://192.168.0.172:5001/addUser';
    fetch(url, {
        method: 'POST',
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
            console.log("addUser: " + err)
        });
}

const addUsers = (json) => {
    var data = json;
    var headers = {
        "Content-Type": "application/json",
        "Access-Control-Origin": "*"
    }
    var url = 'http://192.168.0.172:5001/addUsers';
    fetch(url, {
        method: 'POST',
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
            console.log("addUsers: " + err)
        });
}

const addThread = (json) => {
    var data = json;
    var headers = {
        "Content-Type": "application/json",
        "Access-Control-Origin": "*"
    }
    var url = 'http://192.168.0.172:5001/addThread';
    fetch(url, {
        method: 'POST',
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
            console.log("addUser: " + err)
        });
}
