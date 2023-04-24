function submitTemasIgnorados(thread) {
  var tema = thread;
  if (tema != "") {
    createIgnorado(tema, "tema");
    addToChromeStorage("tema", tema, "add" );
    $("#temas-ignorados-input").val('');
  }
}

function submitUsariosIgnorados(user) {
  var usuario = user;
  if (usuario != "") {
    createIgnorado(usuario, "usuario");
    addToChromeStorage("usuario", usuario, "add" );
    $("#usuarios-ignorados-input").val('');
  }
}

document.getElementById("usuarios-ignorados-input")
  .addEventListener("keyup", function (event) {
    event.preventDefault();
    if (event.keyCode === 13) {
      submitUsariosIgnorados($("#usuarios-ignorados-input").val().trim());
    }
  });

document.getElementById("temas-ignorados-input")
  .addEventListener("keyup", function (event) {
    event.preventDefault();
    if (event.keyCode === 13) {
      submitTemasIgnorados($("#temas-ignorados-input").val().trim());
    }
  });

$("#submit-usuarios-ignorados").click(function () {
  submitUsariosIgnorados($("#usuarios-ignorados-input").val().trim());
});

$("#submit-temas-ignorados").click(function () {
  submitTemasIgnorados($("#temas-ignorados-input").val().trim());
});

function createIgnorado(id, loc) {
  var divWrapper = $("<div>")
    .addClass(`${loc}-ignorado-wrapper`);
  var divUsuario = $(`<div>${id}</div>`)
    .addClass(`${loc}-ignorado-id`);
  var divEliminar = $(`<div>-</div>`)
    .addClass(`${loc}-ignorado-eliminar`);
  $(divEliminar).click(function (e) {
    e.preventDefault();
    $(this).parent().remove();
    addToChromeStorage(loc, id, "remove");
  });
  divWrapper.append(divUsuario, divEliminar);
  $(`.list-wrapper.${loc}s-ignorados`).append(divWrapper);
}

function loadLists() {
  chrome.storage.sync.get(function (items) {
    if (Object.keys(items).length > 0 && items.temas_ignorados) {
      items.temas_ignorados.forEach((x) => {
        createIgnorado(x, "tema");
      });
    }
    if (Object.keys(items).length > 0 && items.usuarios_ignorados) {
      items.usuarios_ignorados.forEach((x) => {
        createIgnorado(x, "usuario");
      });
    }
  });
}

chrome.runtime.onMessage.addListener(function(message, sender, sendResponse) {
  if (message.from == "contentScript" && message.type == "ignore_usuario") {
    submitUsariosIgnorados(message.content);
  }
});

function addToChromeStorage (loc, id, action) {
  chrome.storage.sync.get(function (items) {
      if (loc == "tema") {
          if (Object.keys(items).length > 0 && items.temas_ignorados) {
              if (action == "add") {
                  items.temas_ignorados.push(id);
              }
              if (action == "remove") {
                  items.temas_ignorados = items.temas_ignorados.filter(x => x !== id);
              }
          }
          else { items.temas_ignorados = [id]; }
      }
      if (loc == "usuario") {
          if (Object.keys(items).length > 0 && items.usuarios_ignorados) {
              if (action == "add") {
                  items.usuarios_ignorados.push(id);
              }
              if (action == "remove") {
                  items.usuarios_ignorados = items.usuarios_ignorados.filter(x => x !== id);
              }
          }
          else { items.usuarios_ignorados = [id]; }
      }
      chrome.storage.sync.set(items);

  });
}

loadLists();