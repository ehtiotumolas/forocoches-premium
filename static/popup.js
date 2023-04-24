import { fetchUsers } from "./users.js";
import { createTable } from "./table.js";

async function start() {
        await fetchUsers()
                .then(() => createTable());
}


export async function getCurrentTab() {
        return await chrome.tabs.query({active: true, currentWindow: true}).tabs[0];
}

start();