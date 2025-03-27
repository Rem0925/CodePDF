const autocompleteContainer = document.getElementById("autocomplete-container");

let Save = localStorage.getItem("SAVE") ?? "";

const Lorem = [
  `Lorem ipsum dolor sit amet consectetur, adipiscing elit interdum. 
Viverra dui penatibus lacus odio convallis cum ridiculus habitasse inceptos 
eleifend mus vehicula, semper felis consequat erat feugiat fusce class congue
mollis curabitur. Luctus convallis placerat lacus litora non facilisis cubilia
ante hendrerit imperdiet senectus, id varius primis libero hac dis nec sodales
vitae sapien.`,
  `Lorem, ipsum dolor sit amet consectetur adipisicing elit. Ex magnam
cupiditate fugiat vel doloribus sapiente accusantium error dolores,
tempora distinctio exercitationem, esse sint ipsum placeat harum? A
perferendis exercitationem ipsa.`,
  `Lorem ipsum dolor sit amet consectetur adipisicing elit. Est hic facilis
atque impedit. Porro nihil esse reprehenderit consequuntur fugit expedita
perspiciatis sint sapiente doloribus. Consequuntur quasi dolorem obcaecati
eligendi maiores.`,
];

const { jsPDF } = window.jspdf;

const Text_tags = [
  {
    name: "titulo1",
    fontSize: 12,
    fontStyle: "bold",
    margen: 105,
  },
  {
    name: "subTitulo",
    fontSize: 12,
    fontStyle: "bolditalic",
    margen: 105,
  },
  {
    name: "titulo2",
    fontSize: 12,
    fontStyle: "bold",
    margen: 20,
  },
  {
    name: "titulo3",
    fontSize: 12,
    fontStyle: "bolditalic",
    margen: 20,
  },
  {
    name: "titulo4",
    fontSize: 12,
    fontStyle: "bold",
    margen: 20,
    inde: true,
  },
  {
    name: "titulo5",
    fontSize: 12,
    fontStyle: "bolditalic",
    margen: 20,
    inde: true,
  },
  { name: "parr", fontSize: 12, fontStyle: "normal", margen: 20, inde: true },
];
const Func_tags = [
  { name: "linebreak" },
  { name: "pagebreak" },
  { name: "Lorem" },
  { name: "Indice" },
  {
    name: "Introduccion",
    fontSize: 12,
    fontStyle: "normal",
    margen: 20,
    inde: true,
  },
  {
    name: "Conclusion",
    fontSize: 12,
    margen: 20,
    fontStyle: "normal",
    inde: true,
  },
  {
    name: "Portada",
    fontStyle: "bold",
    fontSize: 12,
    fontStyle: "bold",
    margen: 105,
  },
];

const all_Tags = Text_tags.concat(Func_tags);

// Definir el modo personalizado
CodeMirror.defineMode("customTags", function () {
  return {
    token: function (stream) {
      if (stream.match("-|", true)) {
        return "tg";
      }
      for (const tag of Text_tags) {
        if (stream.match(`@${tag.name}@`, true)) {
          return "tg";
        }
        if (stream.match(`@/${tag.name}@`, true)) {
          return "tgc";
        }
      }
      for (const tag of Func_tags) {
        if (stream.match(`@${tag.name}@`, true)) {
          return "Ftg";
        }
        if (stream.match(`@/${tag.name}@`, true)) {
          return "Ftgc";
        }
      }
      stream.next();
      return null;
    },
  };
});

// Inicializar CodeMirror con el modo personalizado
const editor = CodeMirror.fromTextArea(document.getElementById("code"), {
  lineNumbers: true,
  theme: "monokai",
  mode: "customTags",
});

editor.setValue(Save);

function handleKeyUp(event) {
  if (event.key === "Enter") {
    autocompleteContainer.style.display = "none";
  } else {
    filterAutocomplete();
  }
}
function filterAutocomplete() {
  const cursorPosition = editor.getCursor(); // Obtener la posición del cursor
  const line = editor.getLine(cursorPosition.line); // Obtener la línea actual
  const lastHyphen = line.lastIndexOf("-"); // Buscar el último guion en la línea actual
  if (lastHyphen === -1) {
    autocompleteContainer.style.display = "none"; // Si no hay guion, ocultar el autocompletado
    return;
  }
  const query = line.slice(lastHyphen + 1).toLowerCase(); // Obtener la consulta
  const filteredTags = all_Tags.filter((tag) =>
    tag.name.toLowerCase().includes(query)
  );
  autocompleteContainer.innerHTML = "";
  filteredTags.forEach((tag) => {
    const item = document.createElement("div");
    item.textContent = tag.name;
    item.classList.add("autocomplete-item");
    item.onclick = () => insertTag(tag, lastHyphen, cursorPosition);
    autocompleteContainer.appendChild(item);
  });
  autocompleteContainer.style.display = filteredTags.length ? "block" : "none"; // Mostrar u ocultar según los resultados
}

function insertTag(tag, lastHyphen, cursorPosition) {
  const line = editor.getLine(cursorPosition.line); // Obtener la línea actual
  const beforeHyphen = line.slice(0, lastHyphen); // Parte antes del guion
  const afterHyphen = line.slice(lastHyphen + 1 + tag.name.length); // Parte después de la etiqueta
  // Construir la nueva línea con la etiqueta insertada
  const newLine =
    beforeHyphen +
    (tag.name === "Lorem"
      ? `${Lorem[Math.floor(Math.random() * 3)]}`
      : `@${tag.name}@\n@/${tag.name}@`) +
    afterHyphen;
  // Reemplazar la línea actual en el editor
  editor.replaceRange(
    newLine,
    { line: cursorPosition.line, ch: 0 },
    { line: cursorPosition.line, ch: line.length }
  ); // Posicionar el cursor después de la etiqueta
  editor.setCursor(cursorPosition.line + 1, 0);
  autocompleteContainer.style.display = "none"; // Ocultar sugerencias después de insertar
}

editor.on("keyup", handleKeyUp);

document.addEventListener("click", function () {
  autocompleteContainer.style.display = "none";
});

function generatePDF() {
  Save = localStorage.setItem("SAVE", editor.getValue());
  indexEntries = [];
  const { jsPDF } = window.jspdf;
  const doc = new jsPDF();
  const margin = 20;
  let y = margin;
  const pageHeight = doc.internal.pageSize.height - (margin + 10);

  const contentLines = ProcessText(doc, margin);
  console.log(contentLines);

  if (Array.isArray(contentLines)) {
    let currentPageNumber = 1;
    contentLines.forEach((Pagina, pageIndex) => {
      if (pageIndex + 1 !== currentPageNumber) {
        addPageNumber(currentPageNumber);
        doc.addPage();
        y = margin;
        currentPageNumber = pageIndex + 1;
      }
      Pagina.forEach((Linea) => {
        const { line, Y, tag } = Linea;
        doc.setFontSize(tag.fontSize || 12);
        doc.setFont("times", tag.fontStyle || "normal");
        if (y + 10 > pageHeight) {
          addPageNumber(currentPageNumber);
          doc.addPage();
          currentPageNumber++;
        }
        doc.text(
          tag.margen,
          Y * 10 + 20,
          line,
          tag.margen > 20 ? { align: "center" } : {}
        );
      });
    });
    addPageNumber(currentPageNumber);
  }
  addPageNumber(doc.internal.getNumberOfPages());
  const pdfBlob = doc.output("blob");
  const pdfUrl = URL.createObjectURL(pdfBlob);
  const previewFrame = document.getElementById("preview");
  previewFrame.src = pdfUrl;

  function addPageNumber(pageNumber) {
    doc.setFontSize(12);
    doc.text(`${pageNumber}`, doc.internal.pageSize.width - 15, 10, {
      align: "right",
    });
    return pageNumber;
  }
}

function ProcessText(doc, margin) {
  let Textoo = [];
  const lines = editor.getValue().split("\n");
  const pageWidth = doc.internal.pageSize.width;
  const usableWidth = pageWidth + 2 * margin;

  lines.forEach((line, index) => {
    all_Tags.forEach((tag) => {
      if (line.includes(`@${tag.name}@`)) {
        let j = 1;
        let tagContent = "";
        while (
          lines[index + j] &&
          !lines[index + j].includes(`@/${tag.name}@`)
        ) {
          tagContent += lines[index + j] + " ";
          j++;
        }
        const indent = tag.inde ? "           " : "";

        const partes = tagContent.trim().split("-|");

        const objetoPartes = partes.reduce((acc, parte, i) => {
          acc[`parte${i + 1}`] = indent + parte.trim();
          return acc;
        }, {});

        for (let key in objetoPartes) {
          objetoPartes[key] = doc.splitTextToSize(
            objetoPartes[key],
            usableWidth
          );
        }
        Textoo.push({ text: objetoPartes, tag });
      }
    });
  });
  const organizedPages = organizeTextByPages(
    Textoo,
    /*Cantidad de Lineas por Pagina*/ 25,
    doc
  );

  return organizedPages;
}
function organizeTextByPages(Textoo, maxLinesPerPage, docc) {
  const pages = [];
  let currentPage = [];
  let currentLineCount = 0;
  let Retraso = { Tx: "", Ln: 1, ParResi: "" };

  Textoo.forEach((item) => {
    const { text, tag } = item;
    let OnePagueEtiq = {
      Intro: false,
      Indi: false,
      Conclu: false,
      Port: false,
    };
    Object.values(text).forEach((lines) => {
      lines.forEach((line) => {
        if (currentLineCount + 1 > maxLinesPerPage) {
          pages.push(currentPage);
          currentPage = [];
          currentLineCount = 0;
        }
        switch (tag.name) {
          case "Portada":
            if (!OnePagueEtiq.Port) {
              if (currentPage.length > 0) {
                pages.push(currentPage);
              }
              currentPage = [];
              currentLineCount = 0;

              const header = text.parte1.toString().split(`.`);
              const title = text.parte2;
              const footer = Object.values(text)
                .slice(2, 9) // Limitar a 7 elementos
                .map((item) => `${item}`)
                .join("\n");

              // Add header
              const headerLines = docc.splitTextToSize(
                header,
                docc.internal.pageSize.width - 20
              );
              headerLines.forEach((headerLine) => {
                currentPage.push({
                  line: headerLine,
                  Y: currentLineCount + 1,
                  tag: { fontSize: 12, fontStyle: "normal", margen: 105 },
                });
                currentLineCount++;
              });

              // Add title
              const titleLines = docc.splitTextToSize(
                title,
                docc.internal.pageSize.width - 2 * 20
              );
              currentLineCount = 12 - titleLines.length / 2;
              titleLines.forEach((titleLine) => {
                currentPage.push({
                  line: titleLine,
                  Y: currentLineCount + 1,
                  tag: { fontSize: 16, fontStyle: "bold", margen: 105 },
                });
                currentLineCount++;
              });
              // Add footer
              const footerLines = docc.splitTextToSize(footer, 60);
              let footerY =
                docc.internal.pageSize.height -
                2 * 20 -
                footerLines.length * 10;
              footerLines.forEach((footerLine) => {
                currentPage.push({
                  line: footerLine,
                  Y: footerY / 10,
                  tag: {
                    fontSize: 12,
                    fontStyle: "normal",
                    margen: docc.internal.pageSize.width - 2 * 20,
                    align: "right",
                  },
                });
                footerY += 10;
              });

              OnePagueEtiq.Port = true;
              pages.push(currentPage);
              currentPage = [];
              currentLineCount = 0;
            }
            break;
          case "Indice":
            if (currentPage.length > 0) {
              pages.push(currentPage);
            }
            currentPage = [];
            currentLineCount = 0;
            // Reservamos una página placeholder para el índice
            const indexPlaceholder = [
              {
                line: "%%INDEX_PLACEHOLDER%%",
                Y: 1,
                tag: { fontSize: 16, fontStyle: "bold", margen: 105 },
              },
            ];
            pages.push(indexPlaceholder);
            currentPage = [];
            currentLineCount = 0;
            break;
          case "titulo4":
          case "titulo5":
            line += ".";
            currentPage.push({ line, Y: currentLineCount + 1, tag });
            indexEntries.push({
              title: line.slice(0, -1).trim(),
              page: pages.length + 1,
              level: 3,
            });
            Retraso.Ln = 2;
            Retraso.Tx = line;
            break;
          case "parr":
            //Corregir error de la ultima linea---------------------------------------------------------
            if (Retraso.ParResi) {
              let Split = Retraso.ParResi.toString() + " " + line;
              if (
                docc.getTextWidth(Retraso.ParResi) <
                docc.internal.pageSize.width + 40
              ) {
                let splitText = docc.splitTextToSize(
                  Split,
                  docc.internal.pageSize.width + 40
                );
                Split = splitText[0];
                Retraso.ParResi = splitText.slice(1).join(" ");
                line = "";
              }
              currentPage.push({ line: Split, Y: currentLineCount + 1, tag });
              currentLineCount++;
            }
            if (Retraso.Tx) {
              const initialIndent = " ".repeat(
                Math.ceil(
                  (docc.getTextWidth(Retraso.Tx.trim()) * 1.2) /
                    docc.getTextWidth(" ")
                )
              );
              line = initialIndent + line;
              let splitText = docc.splitTextToSize(
                line,
                docc.internal.pageSize.width + 40
              );
              Retraso.Tx = "";
              Retraso.ParResi = splitText.slice(1).join(" ");
              line = splitText[0];
            }
            if (line !== "") {
              currentPage.push({ line, Y: currentLineCount + 1, tag });
              currentLineCount++;
            }
            break;
          case "Introduccion":
            if (!OnePagueEtiq.Intro) {
              if (currentPage.length > 0) {
                pages.push(currentPage);
              }
              currentPage = [];
              currentLineCount = 0;
              currentPage.push({
                line: "Introduccion",
                Y: currentLineCount + 1,
                tag: {
                  fontSize: 12,
                  fontStyle: "bold",
                  margen: 105,
                  name: "Introduccion",
                },
              });
              currentLineCount++;
              indexEntries.push({
                title: "Introduccion",
                page: pages.length + 1,
                level : 1,
              });
            }
            OnePagueEtiq.Intro = true;
            currentPage.push({ line, Y: currentLineCount + 1, tag });
            currentLineCount++;
            let $item2 = Textoo[Textoo.indexOf(item)];
            let Ultimo2 =
              $item2.text[
                Object.keys($item2.text)[Object.keys($item2.text).length - 1]
              ];
            if (Ultimo2[Ultimo2.length - 1] == line) {
              pages.push(currentPage);
              currentPage = [];
              currentLineCount = 0;
            }
            break;
          case "Conclusion":
            if (!OnePagueEtiq.Conclu) {
              if (currentPage.length > 0) {
                pages.push(currentPage);
              }
              currentPage = [];
              currentLineCount = 0;
              currentPage.push({
                line: "Conclusión",
                Y: currentLineCount + 1,
                tag: {
                  fontSize: 12,
                  fontStyle: "bold",
                  margen: 105,
                  name: "Conclusion",
                },
              });
              currentLineCount++;
              indexEntries.push({
                title: "Conclusión",
                page: pages.length + 1,
                level : 1,
              });
            }
            OnePagueEtiq.Conclu = true;
            currentPage.push({ line, Y: currentLineCount + 1, tag });
            currentLineCount++;
            let $item = Textoo[Textoo.indexOf(item)];
            let Ultimo =
              $item.text[
                Object.keys($item.text)[Object.keys($item.text).length - 1]
              ];
            if (Ultimo[Ultimo.length - 1] == line) {
              pages.push(currentPage);
              currentPage = [];
              currentLineCount = 0;
            }
            break;
          case "linebreak":
            currentLineCount += line ? Number(line) : 1;
            break;
          case "pagebreak":
            pages.push(currentPage);
            currentPage = [];
            currentLineCount = 0;
            break;
          case 'titulo2':
          case 'titulo3':
            //Arreglar error de que si el titulo es de mas de una linea, se sobre pone 
            currentLineCount += Retraso.Ln;
            currentPage.push({ line, Y: currentLineCount, tag });
            indexEntries.push({
              title: line.slice(0, -1),
              page: pages.length + 1,
              level : 2,
            });
            Retraso.Ln = 1;
            break;
          default:
            currentLineCount += Retraso.Ln;
            currentPage.push({ line, Y: currentLineCount, tag });
            indexEntries.push({
              title: line.slice(0, -1),
              page: pages.length + 1,
              level : 1,
            });
            Retraso.Ln = 1;
            break;
        }
      });
    });
  });
  if (currentPage.length > 0) {
    pages.push(currentPage);
  }
  return AggIndice(pages, docc);
}
function AggIndice(pages,doc) {
  // Se construye la página de índice usando las entradas acumuladas en indexEntries
  const newIndexPage = [];
  newIndexPage.push({
    line: "Índice",
    Y: 1,
    tag: { fontSize: 16, fontStyle: "bold", margen: 105 },
  });
  let yCounter = 2;
  indexEntries.forEach((entry) => {
    const dots = doc.splitTextToSize(
      (entry.level === 1 ? '' : entry.level === 2 ? '           ' : '                      ') + entry.title + "......".repeat(28),
      doc.internal.pageSize.width + 40
    );
    dots[0] += entry.page;
    newIndexPage.push({
      line: `${dots[0]}`,
      Y: yCounter,
      tag: { fontSize: 12, fontStyle: "normal", margen: 20 },
    });
    yCounter++;
  });
  // Buscamos el placeholder y lo reemplazamos por el contenido del índice
  for (let i = 0; i < pages.length; i++) {
    if (pages[i].length > 0 && pages[i][0].line === "%%INDEX_PLACEHOLDER%%") {
      pages[i] = newIndexPage;
      break;
    }
  }
  return pages;
}
