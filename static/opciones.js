
const listOpciones = ["op-color", "hilos-color", "ocultar-publicidad", "espacio-lateral", "ocultar-avisos", "usuarios-ignorados", "temas-ignorados"
  , "notas-usuario", "ocultar-usuarios-ignorados", "ocultar-foros-relacionados-nuevo", "ocultar-foros-relacionados-viejo", "ocultar-trending"
  , "avatar-cuadrado", "avatar-grande", "likes", "usuario-color"]

//Sets value of the op-color setting (all messages from OP) to the local chrome storage without activating the option
document.getElementById("op-color").addEventListener("input", function () {
  setValueNoCheck("op-color")
});
//When color is selected, reload tab to display newer selection
document.getElementById("op-color").addEventListener("blur", function () {
  sendReload();
});
//Sets value of the hilos-color setting (threads without any message) to the local chrome storage without activating the option
document.getElementById("hilos-color").addEventListener("input", function () {
  setValueNoCheck("hilos-color")
});
//When color is selected, reload tab to display newer selection
document.getElementById("hilos-color").addEventListener("blur", function () {
  sendReload();
});
//Sets value of the hilos-color setting (threads without any message) to the local chrome storage without activating the option
document.getElementById("usuario-color").addEventListener("input", function () {
  setValueNoCheck("usuario-color")
});
//When color is selected, reload tab to display newer selection
document.getElementById("usuario-color").addEventListener("blur", function () {
  sendReload();
});
//When a checkbox changes status on the options screen, reload tab to reflect changes
$('.checkbox-label').each(function () {
  $(this).children('input').click(function () {
    let name = this.id.split('checkbox-')[1];
    if (name === "op-color" || name === "hilos-color" || name === "usuario-color") {
      setValueNoCheck(name);
    }
    else {
      setCheck(name);
    }
    sendReload();
  });
});

//Loads options from the local Chrome storage and displays the values on the options screen
const loadOptions = () => {
  chrome.storage.sync.get(function (items) {
    //If local Chrome storage doesn't contains opciones, initialize each opciones to false
    if (!items.opciones) { items.opciones = {}; }
    //Check wether the option is in the Chrome storage or no
    for (let opcion of listOpciones) {
      let opciones = items.opciones;
      if (!(opcion in items.opciones)) {
        if (opcion === "op-color" || opcion === "hilos-color" || opcion === "usuario-color") {
          opciones[opcion] = { "value": $(`#${opcion}`)[0].value, "checked": false }
        }
        else {
          opciones[opcion] = { "checked": false }
        }
      }
      items.opciones = opciones;
      chrome.storage.sync.set(items);
    }

    if (Object.keys(items).length > 0 && items.opciones) {
      for (let item in items.opciones) {
        $(`#checkbox-${item}`)[0].checked = items.opciones[item].checked;
        if (item === "op-color" || item === "hilos-color" || item === "usuario-color") {
          $(`#${item}`)[0].value = items.opciones[item].value;
        }
      };
      if (!$("#checkbox-usuarios-ignorados")[0].checked) {
        $('#checkbox-ocultar-usuarios-ignorados').attr("disabled", true);
      }
    }
  });
};


//Reloads current tab
const sendReload = () => {
  chrome.runtime.sendMessage({ sender: "opciones", type: "reload" });
}

//Sets value of the checkbox and sets the current value (colour) in the local Chrome storage
const setValueAndCheck = (id) => {
  chrome.runtime.sendMessage({ from: "opciones", type: "chrome-storage", content: { loc: "opciones", message: { "id": id, "value": $(`#${id}`)[0].value, "checked": $(`#checkbox-${id}`)[0].checked } } });
}

//Sets the current value (colour) in the local Chrome storage
const setValueNoCheck = (id) => {
  chrome.runtime.sendMessage({ from: "opciones", type: "chrome-storage", content: { loc: "opciones", message: { "id": id, "value": $(`#${id}`)[0].value, "checked": $(`#checkbox-${id}`)[0].checked } } });
}

//Sets value of the checkbox in the local Chrome storage
const setCheck = (id) => {
  chrome.runtime.sendMessage({ from: "opciones", type: "chrome-storage", content: { loc: "opciones", message: { "id": id, "checked": $(`#checkbox-${id}`)[0].checked } } });
}

//Checks whether checkbox-usuarios-ignorados is ticked or not, and then enables/disables checkbox-ocultar-usuarios-ignorados
document.getElementById("checkbox-usuarios-ignorados")
  .addEventListener("click", function () {
    if (!this.checked) {
      $('#checkbox-ocultar-usuarios-ignorados').attr("disabled", true);
    }
    else {
      $('#checkbox-ocultar-usuarios-ignorados').attr("disabled", false);
    }
  })

loadOptions();