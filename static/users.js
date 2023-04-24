export var usuarios;

export async function fetchUsers() {
    var url = 'http://192.168.0.172:5001/getAllUsers';
    await fetch(url, {
            method: 'GET',
    })
            .then(async function (response) {
                    if (response.status == 200) {
                            usuarios = await response.json();
                            console.log(response.status);
                    }
                    else
                            console.log(response.status)
            })
            .catch(function (err) {
                    console.log("fetchUsers: " + err)
            });
}