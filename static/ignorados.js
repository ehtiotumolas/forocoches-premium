export let usuarios_ignorados;
export let temas_ignorados;

function getBrowser() {
  if (typeof browser !== "undefined") {
    return browser;
  } else {
    return chrome;
  }
}

const browserInUser = getBrowser();

//Updates current ignored users
function submitTemasIgnorados(thread) {
  if (thread != "") {
    createIgnorado(thread, "tema");
    browserInUser.runtime.sendMessage({ sender: "ignorados", type: "browserInUser-storage", content: { loc: "tema", message: thread, action: "add" } });
    browserInUser.runtime.sendMessage({ sender: "ignorados", type: "reload" });
    $("#temas-ignorados-input").val('');
  }
}

//Updates current ignored threads
function submitUsariosIgnorados(user) {
  if (user != "") {
    createIgnorado(user, "usuario");
    browserInUser.runtime.sendMessage({ sender: "ignorados", type: "browserInUser-storage", content: { loc: "usuario", message: user, action: "add" } });
    browserInUser.runtime.sendMessage({ sender: "ignorados", type: "reload" });
    $("#usuarios-ignorados-input").val('');
  }
}

//When enter is pressed, add current user to ignored list
const uii = document.getElementById("usuarios-ignorados-input");
if (uii) {
  uii.addEventListener("keyup", function (event) {
    event.preventDefault();
    if (event.keyCode === 13) {
      submitUsariosIgnorados($("#usuarios-ignorados-input").val().trim());
    }
  });
}

//When enter is pressed, add current thread to ignored list
const tii = document.getElementById("temas-ignorados-input");
if (tii) {
  tii.addEventListener("keyup", function (event) {
    event.preventDefault();
    if (event.keyCode === 13) {
      submitTemasIgnorados($("#temas-ignorados-input").val().trim());
    }
  });
}


//Add user to ignored list
$("#submit-usuarios-ignorados").click(function () {
  submitUsariosIgnorados($("#usuarios-ignorados-input").val().trim());
});

//Add thread to ignored list
$("#submit-temas-ignorados").click(function () {
  submitTemasIgnorados($("#temas-ignorados-input").val().trim());
});

//Creates HTML elemtents for the ignored lists
function createIgnorado(id, loc) {
  let divWrapper = $("<div>")
    .addClass(`${loc}-ignorado-wrapper`);
  let divUsuario = $(`<div>${id}</div>`)
    .addClass(`${loc}-ignorado-id`);
  let divEliminar = $(`<div>❌</div>`)
    .addClass(`${loc}-ignorado-eliminar`);
  $(divEliminar).click(async function (e) {
    e.preventDefault();
    $(this).parent().remove();
    browserInUser.runtime.sendMessage({ sender: "ignorados", type: "browserInUser-storage", content: { loc: loc, message: id, action: "remove" } });
    browserInUser.runtime.sendMessage({ sender: "ignorados", type: "reload" });
  });
  divWrapper.append(divUsuario, divEliminar);
  $(`.list-wrapper.${loc}s-ignorados`).append(divWrapper);
}

//Get storage from browserInUser
function storageLocalGet(keys) {
  return browserInUser.storage.sync.get(keys);
}

//Loads ignored list from browserInUser local storage
async function loadIgnoradosLists(createUsuarios, createTemas) {
  return await storageLocalGet()
    .then(result => {
      if (Object.keys(result).length > 0 && result.temas_ignorados) {
        temas_ignorados = result.temas_ignorados;
      }
      else {
        temas_ignorados = [];
      }
      if (Object.keys(result).length > 0 && result.usuarios_ignorados) {
        usuarios_ignorados = result.usuarios_ignorados;
      }
      else {
        usuarios_ignorados = [];
      }
      if (createUsuarios) {
        createUsuariosIgnorados();
      }
      if (createTemas) {
        createTemasIgnorados();
      }
    });
}

const createUsuariosIgnorados = () => {
  usuarios_ignorados.forEach((x) => {
    createIgnorado(x, "usuario");
  });
};

const createTemasIgnorados = () => {
  temas_ignorados.forEach((x) => {
    createIgnorado(x, "tema");
  });
};

//Listens for changes on the extension related to ignored users. This happens when user clicks on the skull emoji close to the username
browserInUser.runtime.onMessage.addListener((obj) => {
  if (obj.sender == "contentScript" && obj.type == "ignore_usuario") {
    submitUsariosIgnorados(obj.content);
  }
});

//Loads list of ignored users and threads
await loadIgnoradosLists(true, true);