function submitTemasIgnorados(thread) {
  if (thread != "") {
    createIgnorado(thread, "tema");
    chrome.runtime.sendMessage({ sender: "ignorados", type: "chrome-storage", content: { loc: "tema", message: thread, action: "add" } });
    chrome.runtime.sendMessage({ sender: "ignorados", type: "reload" });
    $("#temas-ignorados-input").val('');
  }
}

function submitUsariosIgnorados(user) {
  if (user != "") {
    createIgnorado(user, "usuario");
    chrome.runtime.sendMessage({ sender: "ignorados", type: "chrome-storage", content: { loc: "usuario", message: user, action: "add" } });
    chrome.runtime.sendMessage({ sender: "ignorados", type: "reload" });
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
  $(divEliminar).click(async function (e) {
    e.preventDefault();
    $(this).parent().remove();
    chrome.runtime.sendMessage({ sender: "ignorados", type: "chrome-storage", content: { loc: loc, message: id, action: "remove" } });
    chrome.runtime.sendMessage({ sender: "ignorados", type: "reload" });
  });
  divWrapper.append(divUsuario, divEliminar);
  $(`.list-wrapper.${loc}s-ignorados`).append(divWrapper);
}

function loadIgnoradosLists() {
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

chrome.runtime.onMessage.addListener((obj) => {
  if (obj.sender == "contentScript" && obj.type == "ignore_usuario") {
    submitUsariosIgnorados(obj.content);
  }
});


loadIgnoradosLists();