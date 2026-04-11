const autocompleteContainer = document.getElementById("autocomplete-container");
let Save = localStorage.getItem("SAVE") ?? "";

const Lorem = [
  `Lorem ipsum dolor sit amet consectetur, adipiscing elit interdum. Viverra dui penatibus lacus odio convallis cum ridiculus habitasse inceptos eleifend mus vehicula, semper felis consequat erat feugiat fusce class congue mollis curabitur.`,
  `Lorem, ipsum dolor sit amet consectetur adipisicing elit. Ex magnam cupiditate fugiat vel doloribus sapiente accusantium error dolores, tempora distinctio exercitationem, esse sint ipsum placeat harum?`,
  `Lorem ipsum dolor sit amet consectetur adipisicing elit. Est hic facilis atque impedit. Porro nihil esse reprehenderit consequuntur fugit expedita.`,
];

const { jsPDF } = window.jspdf;
let indexEntries = [];

const Text_tags = [
  {
    name: "titulo1",
    fontSize: 12,
    fontStyle: "bold",
    margen: 105,
    align: "center",
  },
  {
    name: "subTitulo",
    fontSize: 12,
    fontStyle: "bolditalic",
    margen: 105,
    align: "center",
  },
  { name: "titulo2", fontSize: 12, fontStyle: "bold", margen: 20 },
  { name: "titulo3", fontSize: 12, fontStyle: "bolditalic", margen: 20 },
  { name: "titulo4", fontSize: 12, fontStyle: "bold", margen: 20, inde: true },
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
  { name: "Portada", fontStyle: "bold", fontSize: 12, margen: 105 },
];

const all_Tags = Text_tags.concat(Func_tags);

CodeMirror.defineMode("customTags", function () {
  return {
    token: function (stream) {
      if (stream.match("-|", true)) return "tg";
      for (const tag of Text_tags) {
        if (stream.match(`@${tag.name}@`, true)) return "tg";
        if (stream.match(`@/${tag.name}@`, true)) return "tgc";
      }
      for (const tag of Func_tags) {
        if (stream.match(`@${tag.name}@`, true)) return "Ftg";
        if (stream.match(`@/${tag.name}@`, true)) return "Ftgc";
      }
      stream.next();
      return null;
    },
  };
});

const editor = CodeMirror.fromTextArea(document.getElementById("code"), {
  lineNumbers: true,
  theme: "monokai",
  mode: "customTags",
  lineWrapping: true,
});

if (Save) {
  editor.setValue(Save);
} else {
  editor.setValue(
    `@Portada@\nUNIVERSIDAD DE PRUEBA\n-|\nTÍTULO DEL TRABAJO ACADÉMICO EN FORMATO APA\n-|\nJuan Pérez\nMaría Gómez\nCarlos Ruiz\n-|\nDr. Roberto Jiménez\n-|\nFacultad de Ingeniería\n-|\nCiudad, País\n-|\n2026\n@/Portada@\n\n@Indice@\n@/Indice@\n\n@Introduccion@\nEsta es la introducción del documento. Aquí se presenta el tema central de la investigación de manera detallada siguiendo las normas APA de sangría y estilo.\n@/Introduccion@\n\n@titulo1@\nCapítulo 1: Fundamentos\n@/titulo1@\n\n@parr@\nEste es un párrafo de prueba donde se explica el concepto básico. El sistema justifica el texto y aplica la sangría de primera línea automáticamente según el margen configurado.\n@/parr@\n\n@titulo2@\n1.1 Marco Teórico\n@/titulo2@\n\n@parr@\nAquí se desarrolla la teoría principal del capítulo. Podemos notar cómo los títulos de nivel 2 se alinean a la izquierda en negrita.\n@/parr@\n\n@titulo4@\nTítulo de nivel 4\n@/titulo4@\n\n@parr@\nNótese que los títulos de nivel 4 llevan un punto final y el texto del párrafo siguiente debería comenzar justo después si se usa la lógica de retraso.\n@/parr@\n\n@Conclusion@\nEl generador CodePDF facilita enormemente la creación de documentos estructurados con índice automático.\n@/Conclusion@`,
  );
}

// --- CONTADOR DE PALABRAS Y CARACTERES ---
function updateCounts() {
  const text = editor.getValue();
  let printableText = "";

  // Regex corregido: Busca pares de etiquetas @tag@ ... @/tag@
  // Captura el grupo 2 (el contenido interno)
  // [\s\S] asegura que capture saltos de línea también
  const tagRegex = /@(\w+)@([\s\S]*?)@\/\1@/g;
  let match;

  while ((match = tagRegex.exec(text)) !== null) {
    let content = match[2];

    // Limpieza adicional: Remover el separador especial -| usado en portadas y otros
    content = content.replace(/-\|/g, " ");

    // Acumular el contenido limpio
    printableText += content + " ";
  }

  // Limpiar espacios múltiples y contar
  const cleanText = printableText.replace(/\s+/g, " ").trim();
  const words = cleanText ? cleanText.split(" ").length : 0;
  const chars = cleanText.length;

  document.getElementById("word-count").textContent = `${words} palabras`;
  document.getElementById("char-count").textContent = `${chars} caracteres`;
}

editor.on("change", updateCounts);
// Inicializar conteo
updateCounts();

// --- BARRA DE HERRAMIENTAS ---
function insertTagFromToolbar(tagName) {
  const cursorPosition = editor.getCursor();
  const tagData = all_Tags.find((t) => t.name === tagName) || { name: tagName };
  insertTag(tagData, -1, cursorPosition, true); // true flag para indicar inserción directa
}

// --- AUTOCOMPLETADO MEJORADO ---
function handleKeyUp(event) {
  if (event.key === "Enter") autocompleteContainer.style.display = "none";
  else filterAutocomplete();
}

function filterAutocomplete() {
  const cursorPosition = editor.getCursor();
  const line = editor.getLine(cursorPosition.line);
  const lastHyphen = line.lastIndexOf("-");
  if (lastHyphen === -1) {
    autocompleteContainer.style.display = "none";
    return;
  }
  const query = line.slice(lastHyphen + 1).toLowerCase();
  const filteredTags = all_Tags.filter((tag) =>
    tag.name.toLowerCase().includes(query),
  );
  autocompleteContainer.innerHTML = "";
  filteredTags.forEach((tag) => {
    const item = document.createElement("div");
    item.textContent = tag.name;
    item.classList.add("autocomplete-item");
    item.onclick = () => insertTag(tag, lastHyphen, cursorPosition);
    autocompleteContainer.appendChild(item);
  });
  if (filteredTags.length) {
    autocompleteContainer.style.display = "flex";
    const coords = editor.cursorCoords(true, "window");
    const windowHeight = window.innerHeight;
    if (windowHeight - coords.bottom < 250) {
      autocompleteContainer.style.flexDirection = "column-reverse";
      autocompleteContainer.style.top = "auto";
      autocompleteContainer.style.bottom = windowHeight - coords.top + 5 + "px";
    } else {
      autocompleteContainer.style.flexDirection = "column";
      autocompleteContainer.style.bottom = "auto";
      autocompleteContainer.style.top = coords.bottom + 5 + "px";
    }
    autocompleteContainer.style.left = coords.left + 5 + "px";
  } else autocompleteContainer.style.display = "none";
}

function insertTag(tag, lastHyphen, cursorPosition, isDirect = false) {
  let newLine;

  if (isDirect) {
    // Inserción directa desde toolbar (en la posición actual)
    const textToInsert =
      tag.name === "Lorem"
        ? `${Lorem[Math.floor(Math.random() * Lorem.length)]}`
        : `@${tag.name}@\n@/${tag.name}@`;
    editor.replaceRange(textToInsert, cursorPosition);

    // Mover cursor dentro de la etiqueta
    if (tag.name !== "Lorem") {
      editor.setCursor(cursorPosition.line + 1, 0);
    }
  } else {
    // Inserción vía autocompletado (reemplazando el guión)
    const line = editor.getLine(cursorPosition.line);
    const beforeHyphen = line.slice(0, lastHyphen);
    const afterHyphen = line.slice(lastHyphen + 1 + tag.name.length);
    newLine =
      beforeHyphen +
      (tag.name === "Lorem"
        ? `${Lorem[Math.floor(Math.random() * Lorem.length)]}`
        : `@${tag.name}@\n@/${tag.name}@`) +
      afterHyphen;
    editor.replaceRange(
      newLine,
      { line: cursorPosition.line, ch: 0 },
      { line: cursorPosition.line, ch: line.length },
    );
    editor.setCursor(cursorPosition.line + 1, 0);
  }

  editor.focus();
  autocompleteContainer.style.display = "none";
}

editor.on("keyup", handleKeyUp);
editor.on("scroll", () => (autocompleteContainer.style.display = "none"));

// --- PDF GENERATOR ---
function generatePDF() {
  const btn = document.getElementById("generateBtn");
  const originalText = btn.innerHTML;
  btn.disabled = true;
  btn.innerHTML =
    '<span class="material-symbols-outlined animate-spin mr-2">progress_activity</span> Generando...';

  setTimeout(() => {
    try {
      localStorage.setItem("SAVE", editor.getValue());
      indexEntries = [];
      const doc = new jsPDF();
      const margin = 20;

      const contentPages = ProcessText(doc, margin);

      if (Array.isArray(contentPages)) {
        contentPages.forEach((Pagina, pageIndex) => {
          if (pageIndex > 0) doc.addPage();

          Pagina.forEach((Linea) => {
            const { line, Y, tag } = Linea;
            if (!line) return;
            doc.setFontSize(tag.fontSize || 12);
            doc.setFont("times", tag.fontStyle || "normal");
            doc.text(line, tag.margen, Y * 10 + 20, {
              align: tag.align || "left",
            });
          });
          addPageNumber(doc, pageIndex + 1);
        });
      }

      const pdfBlob = doc.output("blob");
      document.getElementById("preview").src = URL.createObjectURL(pdfBlob);
      document.getElementById("empty-state").style.display = "none";
      showToast("PDF Generado con éxito", "success");
    } catch (error) {
      console.error(error);
      showToast("Error: " + error.message, "error");
    } finally {
      btn.disabled = false;
      btn.innerHTML = originalText;
    }
  }, 500);
}

function addPageNumber(doc, pageNumber) {
  doc.setFontSize(10);
  doc.setFont("times", "normal");
  doc.text(`${pageNumber}`, doc.internal.pageSize.width - 15, 10, {
    align: "right",
  });
}

function ProcessText(doc, margin) {
  let Textoo = [];
  const lines = editor.getValue().split("\n");
  const pageWidth = doc.internal.pageSize.width;
  const usableWidth = pageWidth + 2 * margin;
  let CurrentId = 1;

  lines.forEach((line, index) => {
    all_Tags.forEach((tag) => {
      if (line.includes(`@${tag.name}@`)) {
        let j = 1;
        let tagContent = "";
        while (
          lines[index + j] !== undefined &&
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
            usableWidth,
          );
        }
        Textoo.push({ text: objetoPartes, tag, Id: CurrentId++ });
      }
    });
  });
  return organizeTextByPages(Textoo, 25, doc);
}

function organizeTextByPages(Textoo, maxLinesPerPage, docc) {
  let pages = [];
  let currentPage = [];
  let currentLineCount = 0;
  let IdCurrent = 0;
  let Retraso = { Tx: "", Ln: 1, ParResi: "" };
  let indexStartPageIndex = -1;

  Textoo.forEach((item) => {
    const { text, tag, Id } = item;
    let OnePagueEtiq = {
      Intro: false,
      Indi: false,
      Conclu: false,
      Port: false,
    };

    Object.values(text).forEach((lines) => {
      lines.forEach((line) => {
        if (currentLineCount >= maxLinesPerPage) {
          pages.push(currentPage);
          currentPage = [];
          currentLineCount = 0;
        }

        switch (tag.name) {
          case "Portada":
            if (!OnePagueEtiq.Port) {
              if (currentPage.length > 0) pages.push(currentPage);
              currentPage = [];

              const headerText = text.parte1 ? text.parte1.toString() : "";
              const hLines = docc.splitTextToSize(
                headerText,
                docc.internal.pageSize.width - 20,
              );
              hLines.forEach((l) => {
                currentPage.push({
                  line: l,
                  Y: currentPage.length + 1,
                  tag: { margen: 105, align: "center", fontSize: 12 },
                });
              });

              const titleText = text.parte2 ? text.parte2.toString() : "";
              const tLines = docc.splitTextToSize(
                titleText,
                docc.internal.pageSize.width - 40,
              );
              let tY = 10;
              tLines.forEach((l) => {
                currentPage.push({
                  line: l,
                  Y: tY++,
                  tag: {
                    fontSize: 16,
                    fontStyle: "bold",
                    margen: 105,
                    align: "center",
                  },
                });
              });

              const footerParts = Object.keys(text)
                .slice(2)
                .map((key) => text[key])
                .join("\n");
              const footerLines = docc.splitTextToSize(footerParts, 60);
              let startY = Math.max(tY + 2, 26 - footerLines.length);
              footerLines.forEach((line, index) => {
                currentPage.push({
                  line: line,
                  Y: startY + index,
                  tag: {
                    fontSize: 12,
                    margen: docc.internal.pageSize.width - 20,
                    align: "right",
                  },
                });
              });

              OnePagueEtiq.Port = true;
              pages.push(currentPage);
              currentPage = [];
            }
            break;

          case "Indice":
            if (currentPage.length > 0) pages.push(currentPage);
            indexStartPageIndex = pages.length;
            pages.push([
              {
                line: "%%INDEX_PLACEHOLDER%%",
                Y: 1,
                tag: {
                  fontSize: 16,
                  fontStyle: "bold",
                  margen: 105,
                  align: "center",
                },
              },
            ]);
            currentPage = [];
            currentLineCount = 0;
            break;

          case "parr":
            if (Retraso.ParResi) {
              let Split = Retraso.ParResi.toString() + " " + line;
              if (
                docc.getTextWidth(Retraso.ParResi) <
                docc.internal.pageSize.width + 40
              ) {
                let splitText = docc.splitTextToSize(
                  Split,
                  docc.internal.pageSize.width + 40,
                );
                Split = splitText[0];
                Retraso.ParResi = splitText.slice(1).join(" ");
                line = "";
              }
              currentPage.push({ line: Split, Y: currentLineCount + 1, tag });
              currentLineCount++;
            }
            if (Retraso.Tx) {
              currentLineCount--;
              const initialIndent = " ".repeat(
                Math.ceil(
                  (docc.getTextWidth(Retraso.Tx.trim()) * 1.2) /
                    docc.getTextWidth(" "),
                ),
              );
              line = initialIndent + line;
              let splitText = docc.splitTextToSize(
                line,
                docc.internal.pageSize.width + 40,
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
          case "Conclusion":
            if (
              (tag.name === "Introduccion" && !OnePagueEtiq.Intro) ||
              (tag.name === "Conclusion" && !OnePagueEtiq.Conclu)
            ) {
              if (currentPage.length > 0) pages.push(currentPage);
              currentPage = [];
              currentLineCount = 0;
              let title =
                tag.name === "Introduccion" ? "Introducción" : "Conclusión";
              currentPage.push({
                line: title,
                Y: 1,
                tag: {
                  fontSize: 12,
                  fontStyle: "bold",
                  margen: 105,
                  align: "center",
                },
              });
              currentLineCount = 2;
              indexEntries.push({ title, page: pages.length + 1, level: 1 });
              if (tag.name === "Introduccion") OnePagueEtiq.Intro = true;
              else OnePagueEtiq.Conclu = true;
            }
            currentPage.push({ line, Y: currentLineCount + 1, tag });
            currentLineCount++;
            break;

          case "titulo4":
          case "titulo5":
            line += ". ";
            currentPage.push({ line, Y: currentLineCount + 1, tag });
            currentLineCount++;
            Retraso.Tx = line;
            if (IdCurrent != Id) {
              indexEntries.push({
                title: line.trim(),
                page: pages.length + 1,
                level: 3,
              });
            }
            break;

          default:
            currentPage.push({ line, Y: currentLineCount + 1, tag });
            currentLineCount++;
            if (IdCurrent != Id && tag.name.includes("titulo")) {
              let lvl =
                tag.name.includes("2") || tag.name.includes("3") ? 2 : 1;
              indexEntries.push({
                title: line.trim(),
                page: pages.length + 1,
                level: lvl,
              });
            }
            break;
        }
        IdCurrent = Id;
      });
    });

    if (
      ["Portada", "Indice", "Introduccion", "Conclusion"].includes(tag.name)
    ) {
      if (currentPage.length > 0) {
        pages.push(currentPage);
        currentPage = [];
        currentLineCount = 0;
      }
    }
  });
  if (currentPage.length > 0) pages.push(currentPage);
  return AggIndice(pages, docc, indexStartPageIndex);
}

function AggIndice(pages, doc, placeholderIndex) {
  if (placeholderIndex === -1) return pages;

  let indexPages = [];
  let currentIdxPage = [
    {
      line: "Índice",
      Y: 1,
      tag: { fontSize: 14, fontStyle: "bold", margen: 105, align: "center" },
    },
  ];
  let yCounter = 3;

  indexEntries.forEach((entry) => {
    if (yCounter > 25) {
      indexPages.push(currentIdxPage);
      currentIdxPage = [];
      yCounter = 2;
    }
    const indent =
      entry.level === 2 ? "    " : entry.level === 3 ? "        " : "";
    const cleanTitle =
      entry.title.length > 40
        ? entry.title.substring(0, 37) + "..."
        : entry.title;

    let dots = doc.splitTextToSize(
      indent + cleanTitle + "......".repeat(28),
      doc.internal.pageSize.width + 40,
    );
    let textLine = dots[0] + " " + entry.page;

    currentIdxPage.push({
      line: textLine,
      Y: yCounter++,
      tag: { fontSize: 11, fontStyle: "normal", margen: 20, align: "left" },
    });
  });
  indexPages.push(currentIdxPage);

  const extraPages = indexPages.length - 1;
  if (extraPages > 0) {
    indexEntries.forEach((e) => {
      if (e.page > placeholderIndex + 1) e.page += extraPages;
    });
    return AggIndice(pages, doc, placeholderIndex);
  }

  pages.splice(placeholderIndex, 1, ...indexPages);
  return pages;
}

function showToast(message, type) {
  const container = document.getElementById("toast-container");
  const toast = document.createElement("div");
  toast.className = `${type === "success" ? "bg-indigo-600" : "bg-red-600"} text-white px-6 py-3 rounded-lg shadow-xl mb-3 transition-all duration-300`;
  toast.innerHTML = message;
  container.appendChild(toast);
  setTimeout(() => {
    toast.style.opacity = "0";
    setTimeout(() => toast.remove(), 500);
  }, 3000);
}

// --- FUNCIÓN TOGGLE THEME ---
function toggleTheme() {
  document.body.classList.toggle("dark");
  const isDark = document.body.classList.contains("dark");

  // Cambiar tema de CodeMirror
  if (isDark) {
    editor.setOption("theme", "monokai");
  } else {
    editor.setOption("theme", "default");
  }
}

function saveToLocal() {
  localStorage.setItem("SAVE", editor.getValue());
  showToast("Progreso guardado localmente", "success");
}

// --- DESCARGAR CÓDIGO FUENTE ---
function downloadSource() {
  const text = editor.getValue();
  const blob = new Blob([text], { type: "text/plain" });
  const url = window.URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = "mi_documento_apa.txt";
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  window.URL.revokeObjectURL(url);
  showToast("Descarga iniciada", "success");
}
