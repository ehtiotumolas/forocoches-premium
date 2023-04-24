import { fetchUsers } from "./users.js";
import { createTable } from "./table.js";

async function start() {
    await fetchUsers()
        .then(() => createTable())
        .then((x) => {
            if (x.status == 200) {
                toggleHidden();
            }
        })
        .catch((e) => {
            console.log(e);
        });
}

export async function getCurrentTab() {
    return await chrome.tabs.query({ active: true, currentWindow: true }).tabs[0];
}

toggleHidden();
start();

function toggleHidden() {
    $("html, body, .table-container").toggleClass("visually-hidden");
}