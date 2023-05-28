let usuarios_ignorados;
let temas_ignorados;

//Updates current ignored users
function submitTemasIgnorados(thread) {
  if (thread != "") {
    createIgnorado(thread, "tema");
    browser.runtime.sendMessage({ sender: "ignorados", type: "browser-storage", content: { loc: "tema", message: thread, action: "add" } });
    browser.runtime.sendMessage({ sender: "ignorados", type: "reload" });
    $("#temas-ignorados-input").val('');
  }
}

//Updates current ignored threads
function submitUsariosIgnorados(user) {
  if (user != "") {
    createIgnorado(user, "usuario");
    browser.runtime.sendMessage({ sender: "ignorados", type: "browser-storage", content: { loc: "usuario", message: user, action: "add" } });
    browser.runtime.sendMessage({ sender: "ignorados", type: "reload" });
    $("#usuarios-ignorados-input").val('');
  }
}

//When enter is pressed, add current user to ignored list
document.getElementById("usuarios-ignorados-input")
  .addEventListener("keyup", function (event) {
    event.preventDefault();
    if (event.keyCode === 13) {
      submitUsariosIgnorados($("#usuarios-ignorados-input").val().trim());
    }
  });

//When enter is pressed, add current thread to ignored list
document.getElementById("temas-ignorados-input")
  .addEventListener("keyup", function (event) {
    event.preventDefault();
    if (event.keyCode === 13) {
      submitTemasIgnorados($("#temas-ignorados-input").val().trim());
    }
  });

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
    browser.runtime.sendMessage({ sender: "ignorados", type: "browser-storage", content: { loc: loc, message: id, action: "remove" } });
    browser.runtime.sendMessage({ sender: "ignorados", type: "reload" });
  });
  divWrapper.append(divUsuario, divEliminar);
  $(`.list-wrapper.${loc}s-ignorados`).append(divWrapper);
}

//Get storage from Firefox
function storageLocalGet(keys) {
  return browser.storage.sync.get(keys);
}

//Loads ignored list from browser local storage
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
browser.runtime.onMessage.addListener((obj) => {
  if (obj.sender == "contentScript" && obj.type == "ignore_usuario") {
    submitUsariosIgnorados(obj.content);
  }
});

//Sets functionality for the load/save buttons on the ignored section
$("#usuarios-ignorados-load").click(function (e) {
  openIgnoradosList("usuarios_ignorados")
});

$("#temas-ignorados-load").click(function (e) {
  openIgnoradosList("temas_ignorados")
});

$("#usuarios-ignorados-save").click(function (e) {
  saveIgnoradosList("usuarios_ignorados")
});

$("#temas-ignorados-save").click(function (e) {
  saveIgnoradosList("temas_ignorados")
});

async function openIgnoradosList(type) {
  alert("Esta función solo funciona en Chrome, de momento. Estoy trabajando en hacerla funcionar en Firefox también.")
}

async function saveIgnoradosList(type) {
  alert("Esta función solo funciona en Chrome, de momento. Estoy trabajando en hacerla funcionar en Firefox también.")
}

//Loads list of ignored users and threads
await loadIgnoradosLists(true, true);

