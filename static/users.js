export var usuarios;

export async function fetchUsers() {
    var url = 'http://192.168.0.172:5001/getAllUsers';
    try {
        await fetch(url, {
            method: 'GET',
        })
            .then(async function (response) {
                if (response.status == 200) {
                    usuarios = await response.json();
                    return response;
                }
                else
                    console.log(response.status)
                    return response;
                })
            .catch(function (err) {
                console.log("fetchUsers: " + err)
                return err.status;
            });
    }
    catch (e) {
        console.log(e);
        return response;
    }
}