$("#submit-temas-ignorados").click(function () {
  var tema = $("#temas-ignorados-input").val().trim();
  if (tema != "") {
    createIgnorado(tema, "tema");
    addToChromeStorage("temas-ignorados", tema)
    $("#temas-ignorados-input").val('');
  }
});

$("#submit-usuarios-ignorados").click(function () {
  var usuario = $("#usuarios-ignorados-input").val().trim();
  if (usuario != "") {
    createIgnorado(usuario, "usuario");
    addToChromeStorage("usuarios-ignorados", usuario)
    $("#usuarios-ignorados-input").val('');
  }
});

function createIgnorado(id, loc) {
  var divWrapper = $("<div>")
    .addClass(`${loc}-ignorado-wrapper`);
  var divUsuario = $(`<div>${id}</div>`)
    .addClass(`${loc}-ignorado-id`);
  var divEliminar = $(`<div>-</div>`)
    .addClass(`${loc}-ignorado-eliminar`);
  divWrapper.append(divUsuario, divEliminar);
  $(`.list-wrapper.${loc}s-ignorados`).append(divWrapper);
}

function addToChromeStorage(loc, id) {
  chrome.storage.sync.get(function (items) {
    if (loc == "temas-ignorados") {
      if (Object.keys(items).length > 0 && items.temas_ignorados) {
        items.temas_ignorados.push(id);
      }
      else { items.temas_ignorados = [id]; }
    }
    if (loc == "usuarios-ignorados") {
      if (Object.keys(items).length > 0 && items.usuarios_ignorados) {
        items.usuarios_ignorados.push(id);
      }
      else { items.usuarios_ignorados = [id]; }
    }
    chrome.storage.sync.set(items, function () {
      console.log(`Added ${id}`);
    });

  });
}

function loadLists() {
  chrome.storage.sync.get(function (items) {
    if (Object.keys(items).length > 0 && items.temas_ignorados) {
      items.temas_ignorados.forEach((x) => {
        createIgnorado(x, "tema")
      });
    }
    if (Object.keys(items).length > 0 && items.usuarios_ignorados) {
      items.usuarios_ignorados.forEach((x) => {
        createIgnorado(x, "usuario")
      });
    }
  });
}


loadLists();