function getBrowser() {
  if (typeof browser !== "undefined") {
    return browser;
  } else {
    return chrome;
  }
}

const browserInUser = getBrowser();

//Sets functionality for the load/save buttons on the ignored section
$("#usuarios-ignorados-load").click(function (e) {
  if (typeof browser == "undefined") {
    openIgnoradosList("usuarios_ignorados")
  }
  else {
    $('.file_usuarios')[0].click(function (e) {
      e.preventDefault();
    });
  }
});

$("#temas-ignorados-load").click(function (e) {
  if (typeof browser == "undefined") {
    openIgnoradosList("temas_ignorados")
  }
  else {
    $('.file_temas')[0].click(function (e) {
      e.preventDefault();
    });
  }
});

$("#usuarios-ignorados-save").click(async function (e) {
  if (typeof browser == "undefined") {
    saveIgnoradosList("usuarios_ignorados")
  }
  else {
    let listIgnorados;
    await storageLocalGet()
      .then(result => {
        if (Object.keys(result).length > 0 && result.usuarios_ignorados) {
          listIgnorados = result.usuarios_ignorados;
        }
        else {
          listIgnorados = [];
        }
      });
    if ($('.ignorados-text')) {
      $('.ignorados-text').remove();
    }
    $("<h2/>")
      .attr('class', 'ignorados-text')
      .css({
        marginTop: '.5rem',
        paddingBottom: '1rem'
      })
      .text("Firefox no permite que una extensión guarde en el disco. Copia manualmente el texto de abajo en un documento de texto y guardálo.")
      .appendTo($('.container-usuarios-ignorados'));

    $("<div/>")
      .attr('class', 'dashed ignorados-text', 'id', 'temas-ignorados-list')
      .css({
        marginTop: 10,
        padding: '1rem'

      })
      .text(listIgnorados)
      .appendTo($('.container-usuarios-ignorados'));
  }
});

$("#temas-ignorados-save").click(async function (e) {
  if (typeof browser == "undefined") {
    saveIgnoradosList("temas_ignorados")
  }
  else {
    let listIgnorados;
    await storageLocalGet()
      .then(result => {
        if (Object.keys(result).length > 0 && result.temas_ignorados) {
          listIgnorados = result.temas_ignorados;
        }
        else {
          listIgnorados = [];
        }
      });
    if ($('.ignorados-text')) {
      $('.ignorados-text').remove();
    }
    $("<h2/>")
      .attr('class', 'ignorados-text')
      .css({
        marginTop: '.5rem',
        paddingBottom: '1rem'
      })
      .text("Firefox no permite que una extensión guarde en el disco. Copia manualmente el texto de abajo en un documento de texto y guardálo.")
      .appendTo($('.container-temas-ignorados'));

    $("<div/>")
      .attr('class', 'dashed ignorados-text', 'id', 'temas-ignorados-list')
      .css({
        marginTop: 10,
        padding: '1rem'

      })
      .text(listIgnorados)
      .appendTo($('.container-temas-ignorados'));
  }
});

console.log("lol")
$('.file').change(function (event) {
  event.preventDefault();
  const file = event.target.files[0];
  var fr = new FileReader();
  fr.onload = function (file) {
    if (event.target.classList.contains('file_usuarios')) {
      const usuarios_ignorados = file.target.result.split(',');
      browserInUser.runtime.sendMessage({ sender: "ignorados", type: "browserInUser-storage", content: { loc: "usuarios", message: usuarios_ignorados, action: "add" } });
    }
    else {
      const temas_ignorados = file.target.result.split(',');
      browserInUser.runtime.sendMessage({ sender: "ignorados", type: "browserInUser-storage", content: { loc: "temas", message: temas_ignorados, action: "add" } });
    }
  };
  fr.readAsText(file);
})

function storageLocalGet(keys) {
  return browserInUser.storage.sync.get(keys);
}

async function openIgnoradosList(type) {
  try {
    if (window.showOpenFilePicker) {
      const handles = await showOpenFilePicker({
        suggestedName: `${type}.txt`,
        types: [{
          description: 'Text Files',
          accept: {
            'text/plain': ['.txt'],
          },
        }],
      })
      const fileData = await handles[0].getFile();
      const fileText = await fileData.text();
      if (type == "usuarios_ignorados") {
        const usuarios_ignorados = fileText.split(',');
        browserInUser.runtime.sendMessage({ sender: "ignorados", type: "browserInUser-storage", content: { loc: "usuarios", message: usuarios_ignorados, action: "add" } });
      }
      else {
        const temas_ignorados = fileText.split(',');
        browserInUser.runtime.sendMessage({ sender: "ignorados", type: "browserInUser-storage", content: { loc: "temas", message: temas_ignorados, action: "add" } });
      }
      return;
    }
  }
  catch (err) {
    if (err.name !== 'AbortError') {
      console.error(err.name, err.message);
      return;
    }
  }
}

async function saveIgnoradosList(type) {
  try {
    if (window.showSaveFilePicker) {
      const handle = await showSaveFilePicker({
        multiple: false,
        types: [{
          description: 'Text Files',
          accept: {
            'text/plain': ['.txt'],
          },
        }],
      });
      const writable = await handle.createWritable();
      let listIgnorados;
      if (type == "usuarios_ignorados") {
        await storageLocalGet()
          .then(result => {
            if (Object.keys(result).length > 0 && result.usuarios_ignorados) {
              listIgnorados = result.usuarios_ignorados;
            }
            else {
              listIgnorados = [];
            }
          });
      }
      if (type == "temas_ignorados") {
        await storageLocalGet()
          .then(result => {
            if (Object.keys(result).length > 0 && result.temas_ignorados) {
              listIgnorados = result.temas_ignorados;
            }
            else {
              listIgnorados = [];
            }
          });
      }
      await writable.write(listIgnorados.toString());
      writable.close();
      return;
    }
  }
  catch (err) {
    if (err.name !== 'AbortError') {
      console.error(err.name, err.message);
      return;
    }
  }
}

//Adds link to paypal
document.getElementById("footer-donate")
    .addEventListener("click", function () {
        openInNewTab("https://www.paypal.com/donate/?hosted_button_id=G8DCS8GX6METS");
    });

function setVoteLink() {
    if (typeof browser == "undefined") {
        //Adds link to the chrome store reviews
        document.getElementById("footer-rate")
            .addEventListener("click", function () {
                openInNewTab("https://chrome.google.com/webstore/detail/forocoches-premium/hdiegimcikljdcgohlcnilgephloaiaa/reviews");
            });
    }
    else {
        //Adds link to the chrome store reviews
        document.getElementById("footer-rate")
            .addEventListener("click", function () {
                openInNewTab("https://addons.mozilla.org/es/firefox/addon/forocoches-premium/");
            });

    }
}

//Adds link to the github repository
document.getElementById("footer-github")
    .addEventListener("click", function () {
        openInNewTab("https://github.com/ehtiotumolas/forocoches-premium");
    });

//Opens link in new tab
const openInNewTab = (url) => {
    window.open(url, "_blank");
}

setVoteLink();