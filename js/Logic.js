const autocompleteContainer = document.getElementById("autocomplete-container");
let Save = localStorage.getItem("SAVE") ?? "";

const Lorem = [
  `Lorem ipsum dolor sit amet consectetur, adipiscing elit interdum. Viverra dui penatibus lacus odio convallis cum ridiculus habitasse inceptos eleifend mus vehicula, semper felis consequat erat feugiat fusce class congue mollis curabitur.`,
  `Lorem, ipsum dolor sit amet consectetur adipisicing elit. Ex magnam cupiditate fugiat vel doloribus sapiente accusantium error dolores, tempora distinctio exercitationem, esse sint ipsum placeat harum?`,
  `Lorem ipsum dolor sit amet consectetur adipisicing elit. Est hic facilis atque impedit. Porro nihil esse reprehenderit consequuntur fugit expedita.`,
];

const { jsPDF } = window.jspdf;
let indexEntries = [];

// Normas APA 7ma Edición
const APA_MARGIN = 25.4;
const APA_INDENT = 12.7;

const Text_tags = [
  { name: "titulo1", fontSize: 12, fontStyle: "bold", margen: 105, align: "center", inde: false },
  { name: "subTitulo", fontSize: 12, fontStyle: "bolditalic", margen: 105, align: "center", inde: false },
  { name: "titulo2", fontSize: 12, fontStyle: "bold", margen: APA_MARGIN, inde: false },
  { name: "titulo3", fontSize: 12, fontStyle: "bolditalic", margen: APA_MARGIN, inde: false },
  { name: "titulo4", fontSize: 12, fontStyle: "bold", margen: APA_MARGIN + APA_INDENT, inde: true },
  { name: "titulo5", fontSize: 12, fontStyle: "bolditalic", margen: APA_MARGIN + APA_INDENT, inde: true },
  { name: "parr", fontSize: 12, fontStyle: "normal", margen: APA_MARGIN, inde: true },
  { name: "citaLarga", fontSize: 12, fontStyle: "normal", margen: APA_MARGIN + APA_INDENT, inde: false },
  { name: "referencias", fontSize: 12, fontStyle: "normal", margen: APA_MARGIN, isRef: true },
  { name: "lista", fontSize: 12, fontStyle: "normal", margen: APA_MARGIN + APA_INDENT, inde: false },
  { name: "notaPie", fontSize: 10, fontStyle: "normal", margen: APA_MARGIN, isFootnote: true },
];

const Func_tags = [
  { name: "linebreak" },
  { name: "pagebreak" },
  { name: "Lorem" },
  { name: "Indice" },
  { name: "Introduccion", fontSize: 12, fontStyle: "normal", margen: APA_MARGIN, inde: true },
  { name: "Conclusion", fontSize: 12, fontStyle: "normal", margen: APA_MARGIN, inde: true },
  { name: "Resumen", fontSize: 12, fontStyle: "normal", margen: APA_MARGIN, inde: false },
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
  
  // Limpiar todas las etiquetas @nombre@ para contar solo el texto real
  let cleanText = text.replace(/@\/?\w+@/g, " ");
  // Limpiar el separador especial usado en portadas
  cleanText = cleanText.replace(/-\|/g, " ");
  // Normalizar los espacios
  cleanText = cleanText.replace(/\s+/g, " ").trim();

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
  const noCloseTags = ["linebreak", "pagebreak", "Lorem", "Indice", "notaPie"];

  if (isDirect) {
    const textToInsert =
      tag.name === "Lorem"
        ? `${Lorem[Math.floor(Math.random() * Lorem.length)]}`
        : noCloseTags.includes(tag.name)
        ? `@${tag.name}@\n`
        : `@${tag.name}@\n@/${tag.name}@`;
    editor.replaceRange(textToInsert, cursorPosition);

    if (tag.name !== "Lorem" && !noCloseTags.includes(tag.name)) {
      editor.setCursor(cursorPosition.line + 1, 0);
    }
  } else {
    const line = editor.getLine(cursorPosition.line);
    const beforeHyphen = line.slice(0, lastHyphen);
    const afterHyphen = line.slice(lastHyphen + 1 + tag.name.length);
    newLine =
      beforeHyphen +
      (tag.name === "Lorem"
        ? `${Lorem[Math.floor(Math.random() * Lorem.length)]}`
        : noCloseTags.includes(tag.name)
        ? `@${tag.name}@\n`
        : `@${tag.name}@\n@/${tag.name}@`) +
      afterHyphen;
    editor.replaceRange(
      newLine,
      { line: cursorPosition.line, ch: 0 },
      { line: cursorPosition.line, ch: line.length },
    );
    if (tag.name !== "Lorem" && !noCloseTags.includes(tag.name)) {
        editor.setCursor(cursorPosition.line + 1, 0);
    }
  }

  editor.focus();
  autocompleteContainer.style.display = "none";
}

editor.on("keyup", handleKeyUp);
editor.on("scroll", () => (autocompleteContainer.style.display = "none"));

// --- PDF GENERATOR ---
async function generatePDF() {
  const btn = document.getElementById("generateBtn");
  const originalText = btn.innerHTML;
  btn.disabled = true;
  btn.innerHTML =
    '<span class="material-symbols-outlined animate-spin mr-2">progress_activity</span> Generando...';

  // Permitir a la UI actualizarse antes del proceso pesado
  await new Promise(r => setTimeout(r, 50));

  try {
    localStorage.setItem("SAVE", editor.getValue());
    indexEntries = [];
    const doc = new jsPDF();
    const margin = 20;

    const contentPages = ProcessText(doc, margin);

    let totalPages = doc.internal.getNumberOfPages();
    let markdownState = { bold: false, italic: false };
    let currentTagName = "";

    if (Array.isArray(contentPages)) {
      for (let pageIndex = 0; pageIndex < contentPages.length; pageIndex++) {
        const Pagina = contentPages[pageIndex];
        if (pageIndex > 0) doc.addPage();

        Pagina.forEach((Linea) => {
          const { line, Y, tag } = Linea;
          if (!line) return;
          
          if (currentTagName !== tag.name) {
             markdownState = { bold: false, italic: false };
             currentTagName = tag.name;
          }
          
          renderInlineStyles(doc, line, tag.margen || 25.4, Y * 10 + 15.4, {
            align: tag.align || "left",
            fontSize: tag.fontSize || 12,
            fontStyle: tag.fontStyle || "normal"
          }, markdownState);
        });
        addPageNumber(doc, pageIndex + 1);
        
        // Pausar un microinstante cada 5 páginas para liberar la UI
        if (pageIndex % 5 === 0) await new Promise(r => setTimeout(r, 0));
      }
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
}

function addPageNumber(doc, pageNumber) {
  doc.setFontSize(10);
  doc.setFont("times", "normal");
  doc.text(`${pageNumber}`, doc.internal.pageSize.width - 15, 10, {
    align: "right",
  });
}

function renderInlineStyles(doc, text, x, y, options, state) {
  if (!text.includes('*') && !state.bold && !state.italic) {
    doc.setFont("times", options.fontStyle);
    doc.setFontSize(options.fontSize);
    doc.text(text, x, y, { align: options.align });
    return;
  }

  let tokens = [];
  let currentText = "";
  
  for (let i = 0; i < text.length; i++) {
    if (text[i] === '*' && text[i+1] === '*') {
      if (currentText) {
        tokens.push({ text: currentText, bold: state.bold, italic: state.italic });
        currentText = "";
      }
      state.bold = !state.bold;
      i++; // skip second *
    } else if (text[i] === '*') {
      if (currentText) {
        tokens.push({ text: currentText, bold: state.bold, italic: state.italic });
        currentText = "";
      }
      state.italic = !state.italic;
    } else {
      currentText += text[i];
    }
  }
  
  if (currentText) {
    tokens.push({ text: currentText, bold: state.bold, italic: state.italic });
  }

  let totalWidth = 0;
  if (options.align === 'center' || options.align === 'right' || options.align === 'justify') {
    tokens.forEach(t => {
      let style = options.fontStyle;
      if (t.bold && t.italic) style = "bolditalic";
      else if (t.bold) style = "bold";
      else if (t.italic) style = "italic";
      doc.setFont("times", style);
      doc.setFontSize(options.fontSize);
      totalWidth += doc.getTextWidth(t.text);
    });
  }

  let startX = x;
  if (options.align === 'center') {
    startX = x - (totalWidth / 2);
  } else if (options.align === 'right' || options.align === 'justify') {
    startX = x - totalWidth;
  }

  let currentX = startX;
  tokens.forEach(t => {
    let style = options.fontStyle;
    if (options.fontStyle === "bold" || options.fontStyle === "italic" || options.fontStyle === "bolditalic") {
       if (t.bold && t.italic) style = "bolditalic";
       else if (t.bold && options.fontStyle === "italic") style = "bolditalic";
       else if (t.italic && options.fontStyle === "bold") style = "bolditalic";
       else if (t.bold) style = "bold";
       else if (t.italic) style = "italic";
    } else {
       if (t.bold && t.italic) style = "bolditalic";
       else if (t.bold) style = "bold";
       else if (t.italic) style = "italic";
    }

    doc.setFont("times", style);
    doc.setFontSize(options.fontSize);
    doc.text(t.text, currentX, y, { align: "left" });
    currentX += doc.getTextWidth(t.text);
  });
}

function wrapText(doc, text, firstLineW, otherLineW) {
    let tokens = text.split(" ");
    let lines = [];
    let currentLine = "";
    let widthLimit = firstLineW;

    for (let i = 0; i < tokens.length; i++) {
        let testLine = currentLine ? currentLine + " " + tokens[i] : tokens[i];
        let cleanLine = testLine.replace(/\*/g, ""); // Safely measure without markdown fake extensions

        if (doc.getTextWidth(cleanLine) > widthLimit && currentLine) {
            lines.push(currentLine);
            currentLine = tokens[i];
            widthLimit = otherLineW;
        } else {
            currentLine = testLine;
        }
    }
    if (currentLine) lines.push(currentLine);
    return lines.length ? lines : [""];
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
        
        // Evitar que etiquetas sin cierre devoren el resto del documento
        if (!["pagebreak", "linebreak", "Indice"].includes(tag.name)) {
          while (
            lines[index + j] !== undefined &&
            !lines[index + j].includes(`@/${tag.name}@`)
          ) {
            tagContent += lines[index + j] + " ";
            j++;
          }
        }
        const indent = ""; // Removemos los falsos espacios, calculamos coordenadamente

        const partes = tagContent.trim().split("-|");
        const objetoPartes = partes.reduce((acc, parte, i) => {
          acc[`parte${i + 1}`] = indent + parte.trim();
          return acc;
        }, {});

        // Ajuste rígido de anchos APA
        let anchoCalculado = doc.internal.pageSize.width - 50.8; // Márgenes de 25.4 a cada lado
        
        // Coordenadas dinámicas de inicio de renglón
        let firstW = anchoCalculado;
        let otherW = anchoCalculado;
        
        if (tag.inde) {
            firstW = anchoCalculado - 12.7; 
        } else if (tag.name === "citaLarga") {
            firstW = anchoCalculado - 12.7;
            otherW = anchoCalculado - 12.7;
        } else if (tag.name === "lista") {
            firstW = anchoCalculado - 12.7;
            otherW = anchoCalculado - 19.05; // .25 pulgadas más del left
        } else if (tag.name === "referencias") {
            firstW = anchoCalculado;
            otherW = anchoCalculado - 12.7;
        }

        for (let key in objetoPartes) {
          doc.setFont("times", tag.fontStyle || "normal");
          doc.setFontSize(tag.fontSize || 12);
          if (tag.name === "parr") {
             // Defer wrapText to organizeTextByPages so inline titles can affect the first line
             objetoPartes[key] = [objetoPartes[key]];
          } else {
             objetoPartes[key] = wrapText(doc, objetoPartes[key], firstW, otherW);
          }
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
      Ref: false,
      Resu: false, // Etiqueta APA Resumen
    };

    Object.values(text).forEach((lines) => {
      lines.forEach((line, lineIdx) => {
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

          case "citaLarga":
            currentPage.push({ line, Y: currentLineCount + 1, tag: { ...tag, margen: 35 } });
            currentLineCount++;
            break;

          case "referencias":
            if (!OnePagueEtiq.Ref) {
              if (currentPage.length > 0) pages.push(currentPage);
              currentPage = [];
              currentLineCount = 0;
              currentPage.push({
                line: "Referencias",
                Y: 1,
                tag: {
                  fontSize: 12,
                  fontStyle: "bold",
                  margen: 105,
                  align: "center",
                },
              });
              currentLineCount = 2;
              indexEntries.push({ title: "Referencias", page: pages.length + 1, level: 1 });
              OnePagueEtiq.Ref = true;
            }
            
            // APA Hanging Indent: line 0 = 25.4 (1 inch), others = 38.1 (+1.27cm)
            let refMargen = (lineIdx === 0) ? 25.4 : 38.1;
            currentPage.push({ line, Y: currentLineCount + 1, tag: { ...tag, margen: refMargen } });
            currentLineCount++;
            break;

          case "lista":
            // APA Lista: Viñeta a 38.1 en coords, texto a 44.45 (+0.63)
            let listMargen = (lineIdx === 0) ? 38.1 : 44.45; 
            let listLine = (lineIdx === 0) ? "• " + line : line;
            currentPage.push({ line: listLine, Y: currentLineCount + 1, tag: { ...tag, margen: listMargen } });
            currentLineCount++;
            break;
            
          case "notaPie":
            if (lineIdx === 0) {
               currentPage.push({ line: "__________________", Y: currentLineCount + 1, tag: { ...tag, fontSize: 12 } });
               currentLineCount++;
               line = "¹ " + line;
            }
            currentPage.push({ line, Y: currentLineCount + 1, tag });
            currentLineCount++;
            break;

          case "parr":
            docc.setFontSize(tag.fontSize || 12);
            docc.setFont("times", tag.fontStyle || "normal");

            if (Retraso.Tx) {
              currentLineCount--;
              
              // Cambio a la fuente del título para medir su ANCHO REAL y evitar colisiones
              docc.setFontSize(Retraso.tag.fontSize || 12);
              docc.setFont("times", Retraso.tag.fontStyle || "bold");
              let titleMargin = Retraso.tag.margen;
              let titleTextWidth = docc.getTextWidth(Retraso.Tx.replace(/\*/g, "").trim());
              
              // Regresamos a la fuente de párrafo
              docc.setFontSize(tag.fontSize || 12);
              docc.setFont("times", tag.fontStyle || "normal");
              
              // Insertamos gramaticalmente el ancho perfecto de 1 espacio en blando
              let spaceWidth = docc.getTextWidth(" ");
              let startX = titleMargin + titleTextWidth + Math.max(spaceWidth, 1.5);
              
              let firstWordW = docc.internal.pageSize.width - 25.4 - startX;
              let otherLineW = docc.internal.pageSize.width - 50.8;
              let splits = wrapText(docc, line, firstWordW, otherLineW);
              
              Retraso.Tx = "";
              
              splits.forEach((s, idx) => {
                 if (s && s.trim() !== "") {
                    // Verificación de límite de hoja por desbordamiento dinámico
                    if (currentLineCount >= maxLinesPerPage) {
                       pages.push(currentPage);
                       currentPage = [];
                       currentLineCount = 0;
                    }
                    let curMargen = (idx === 0) ? startX : tag.margen;
                    currentPage.push({ line: s, Y: currentLineCount + 1, tag: { ...tag, margen: curMargen } });
                    currentLineCount++;
                 }
              });
            } else {
              let firstWordW = docc.internal.pageSize.width - 50.8;
              let otherLineW = docc.internal.pageSize.width - 50.8;
              if (tag.inde) firstWordW -= 12.7;
              
              let splits = wrapText(docc, line, firstWordW, otherLineW);
              
              splits.forEach((s, idx) => {
                 if (s && s.trim() !== "") {
                    // Verificación de límite de hoja por desbordamiento dinámico
                    if (currentLineCount >= maxLinesPerPage) {
                       pages.push(currentPage);
                       currentPage = [];
                       currentLineCount = 0;
                    }
                    let curMargen = tag.margen;
                    if (idx === 0 && tag.inde) curMargen += 12.7;
                    
                    currentPage.push({ line: s, Y: currentLineCount + 1, tag: { ...tag, margen: curMargen } });
                    currentLineCount++;
                 }
              });
            }
            break;

          case "Resumen":
          case "Introduccion":
          case "Conclusion":
            if (
              (tag.name === "Introduccion" && !OnePagueEtiq.Intro) ||
              (tag.name === "Conclusion" && !OnePagueEtiq.Conclu) ||
              (tag.name === "Resumen" && !OnePagueEtiq.Resu)
            ) {
              if (currentPage.length > 0) pages.push(currentPage);
              currentPage = [];
              currentLineCount = 0;
              let title =
                tag.name === "Introduccion" ? "Introducción" : 
                tag.name === "Conclusion" ? "Conclusión" : "Resumen";
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
              else if (tag.name === "Conclusion") OnePagueEtiq.Conclu = true;
              else OnePagueEtiq.Resu = true;
            }
            let blockMargen = tag.margen;
            if (lineIdx === 0 && tag.inde) {
               blockMargen += 12.7;
            }
            currentPage.push({ line, Y: currentLineCount + 1, tag: { ...tag, margen: blockMargen } });
            currentLineCount++;
            break;

          case "titulo4":
          case "titulo5":
            line += ". ";
            currentPage.push({ line, Y: currentLineCount + 1, tag });
            currentLineCount++;
            Retraso.Tx = line;
            Retraso.tag = tag;
            if (IdCurrent != Id) {
              indexEntries.push({
                title: line.trim(),
                page: pages.length + 1,
                level: 3,
              });
            }
            break;

          case "pagebreak":
            if (currentPage.length > 0) pages.push(currentPage);
            currentPage = [];
            currentLineCount = 0;
            Retraso.Tx = "";
            break;

          case "linebreak":
            currentLineCount++;
            Retraso.Tx = "";
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
      ["Portada", "Indice", "Introduccion", "Conclusion", "Resumen"].includes(tag.name)
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

  // 1. Calcular cuántas páginas extras ocupará el índice
  const entriesPerPage = 23; // Y máximo 25 - Y inicial 2 = 23 entradas
  const numIndexPages = Math.ceil(indexEntries.length / entriesPerPage) || 1;
  const extraPages = numIndexPages - 1;

  // 2. Corregir los números de página secuenciados antes de generar
  if (extraPages > 0) {
    indexEntries.forEach((e) => {
      // Si la página en la que se generó estaba después del índice, se desplaza
      if (e.page > placeholderIndex + 1) {
        e.page += extraPages;
      }
    });
  }

  // 3. Organizar las celdas y filas del índice
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
      currentIdxPage = [
        { line: "Índice (Cont.)", Y: 1, tag: { fontSize: 12, fontStyle: "italic", margen: 105, align: "center" } }
      ];
      yCounter = 3;
    }
    // Filtrar formato markdown para evitar corrupción lógica en el Índice
    const rawTitle = entry.title.replace(/\*/g, "").trim();

    doc.setFontSize(11);
    doc.setFont("times", "normal");
    
    // Cálculo de márgenes escalonados según Normas APA (1.27 cm o ~12.7 mm)
    const apaIndent = 12.7;
    const currentIndent = 20 + (entry.level > 1 ? (entry.level - 1) * apaIndent : 0);
    
    // Cálculo seguro de anchos relativos
    const dotWidth = doc.getTextWidth(".");
    const pageNumStr = " " + entry.page.toString();
    const fixWidth = doc.getTextWidth(pageNumStr);
    const usableWidth = doc.internal.pageSize.width - 20 - currentIndent; // Ancho considerando el salto a la derecha
    
    let currentTitle = rawTitle;
    let titleWidth = doc.getTextWidth(currentTitle);
    
    // Truncar con elipsis si el título por sí solo sobrepasa la longitud permitida
    if (titleWidth > usableWidth - fixWidth - 10) {
      while (doc.getTextWidth(currentTitle + "...") > usableWidth - fixWidth - 10 && currentTitle.length > 0) {
        currentTitle = currentTitle.slice(0, -1);
      }
      currentTitle += "...";
      titleWidth = doc.getTextWidth(currentTitle);
    }
    
    // Rellenamos el vacío sobrante con punteado iterativo matemático
    const gap = usableWidth - titleWidth - fixWidth;
    const numDots = Math.max(0, Math.floor(gap / dotWidth));
    
    let textLine = rawTitle.length > 0 ? currentTitle + ".".repeat(numDots) + pageNumStr : currentTitle;

    currentIdxPage.push({
      line: textLine,
      Y: yCounter++,
      tag: { fontSize: 11, fontStyle: "normal", margen: currentIndent, align: "left" },
    });
  });
  
  if (currentIdxPage.length > 0) indexPages.push(currentIdxPage);

  // 4. Reemplazar el placeholder por las páginas del índice y retornar
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
