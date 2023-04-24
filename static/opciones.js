document.getElementById("op-color").addEventListener("input", function () {
  setValueNoCheck("op-color")
});

document.getElementById("op-color").addEventListener("blur", function () {
  sendReload();
});

document.getElementById("hilos-color").addEventListener("input", function () {
  setValueNoCheck("hilos-color")
});

document.getElementById("hilos-color").addEventListener("blur", function () {
  sendReload();
});

$('.checkbox-label').each(function(){
  $(this).children('input').click(function () {
    var name = this.id.split('checkbox-')[1];
    if (name === "op-color" || name === "hilos-color")
    {
      setValueNoCheck(name);
    }
    else {
      setCheck(name);
    }
    sendReload();
  });
});

const loadOptions = () => {
  chrome.storage.sync.get(function (items) {
    if (Object.keys(items).length > 0 && items.opciones) {
      for (var item in items.opciones) {
        $(`#checkbox-${item}`)[0].checked = items.opciones[item].checked;
        if (item === "op-color") {
          $("#op-color")[0].value = items.opciones[item].value;
        }
        if (item === "hilos-color") {
          $("#hilos-color")[0].value = items.opciones[item].value;
        }
      };
    }
    else {
      if (!items.opciones) {
        var opciones = {};
        opciones["op-color"] = { "value": $("#op-color")[0].value, "checked": false }
        opciones["hilos-color"] = { "value": $("#hilos-color")[0].value, "checked": false }
        opciones["ocultar-publicidad"] = { "checked": false }
        opciones["espacio-lateral"] = { "checked": false }
        opciones["ocultar-avisos"] = { "checked": false }
        opciones["usuarios-ignorados"] = { "checked": false }
        opciones["temas-ignorados"] = { "checked": false }
        opciones["notas-usuario"] = { "checked": false }
        opciones["ocultar-usuarios-ignorados"] = { "checked": false }
        opciones["ocultar-foros-relacionados-nuevo"] = { "checked": false }
        opciones["ocultar-foros-relacionados-viejo"] = { "checked": false }
        opciones["ocultar-trending"] = { "checked": false }
        opciones["avatar-cuadrado"] = { "checked": false }
        opciones["avatar-grande"] = { "checked": false }
        opciones["likes"] = { "checked": false }
        items.opciones = opciones;
        chrome.storage.sync.set(items);
      }
    }
  });
};

const sendReload = () => {
  chrome.runtime.sendMessage({ sender: "opciones", type: "reload" });
}

const setValueAndCheck = (id) => {
  chrome.runtime.sendMessage({ from: "opciones", type: "chrome-storage", content: { loc: "opciones", message: { "id": id, "value": $(`#${id}`)[0].value, "checked": $(`#checkbox-${id}`)[0].checked } } });
}

const setValueNoCheck = (id) => {
  chrome.runtime.sendMessage({ from: "opciones", type: "chrome-storage", content: { loc: "opciones", message: { "id": id, "value": $(`#${id}`)[0].value, "checked": $(`#checkbox-${id}`)[0].checked } } });
}

const setCheck = (id) => {
  chrome.runtime.sendMessage({ from: "opciones", type: "chrome-storage", content: { loc: "opciones", message: { "id": id, "checked": $(`#checkbox-${id}`)[0].checked } } });
}

loadOptions();