let usuarios_ignorados = [];
let temas_ignorados = [];


$("#submit-temas-ignorados").click(function () {
  createIgnorado($("#temas-ignorados-input").val(), "tema");
  $("#temas-ignorados-input").val('');
});

$("#submit-usuarios-ignorados").click(function () {
  createIgnorado($("#usuarios-ignorados-input").val(), "usuario");
  $("#usuarios-ignorados-input").val('');
});

function createIgnorado(id, what) {
  var divWrapper = $("<div>")
    .addClass(`${what}-ignorado-wrapper`);
  var divUsuario = $(`<div>${id}</div>`)
    .addClass(`${what}-ignorado-id`);
  var divEliminar = $(`<div>-</div>`)
    .addClass(`${what}-ignorado-eliminar`);
  divWrapper.append(divUsuario, divEliminar);
  $(`.list-wrapper.${what}s-ignorados`).append(divWrapper);
  if (what == "usuario") {
    usuarios_ignorados.push(id);
    addToChromeStorage("usuarios_ignorados", usuarios_ignorados)
  }
  else {
    temas_ignorados.push(id);
    addToChromeStorage("temas_ignorados", temas_ignorados)
  }
}

async function addToChromeStorage(key, list) {
  await chrome.storage.sync.set({[key]: list })
  .then(() => {
      console.log(`Added ${list} to ${key}`);
  });
}

async function getTemasIgnorados() {
  await chrome.storage.sync.get("temas_ignorados")
  .then((x) => {
      console.log("Value currently is " + x.temas_ignorados);
      temas_ignorados = x.temas_ignorados;
  });
}

async function getUsuariosIgnorados() {
  await chrome.storage.sync.get("usuarios_ignorados")
  .then((x) => {
      console.log("Value currently is " + x.usuarios_ignorados);
      usuarios_ignorados = x.usuarios_ignorados;
  });
}

async function start() {
  await getTemasIgnorados();
  await getUsuariosIgnorados();
}

start();
