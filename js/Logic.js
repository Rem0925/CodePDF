const autocompleteContainer = document.getElementById("autocomplete-container");
let Contenidos = [];

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

const Text_tags = [
  {
    name: "titulo1",
    fontSize: 12,
    fontStyle: "bold",
  },
  {
    name: "subTitulo",
    fontSize: 12,
    fontStyle: "bolditalic",
  },
  {
    name: "titulo2",
    fontSize: 12,
    fontStyle: "bold",
  },
  {
    name: "titulo3",
    fontSize: 12,
    fontStyle: "bolditalic",
  },
  {
    name: "titulo4",
    fontSize: 12,
    fontStyle: "bold",
  },
  {
    name: "titulo5",
    fontSize: 12,
    fontStyle: "bolditalic",
  },
  { name: "parr", fontSize: 12, fontStyle: "normal" },
  
];
const Func_tags = [
  { name: "linebreak" },
  { name: "pagebreak" },
  { name: "Lorem" },
  {
    name: "Introduccion",
    fontSize: 12,
    fontStyle: "normal",
    fontStyleT: "bold",
  },
  {
    name: "Conclusion",
    fontSize: 12,
    fontStyle: "normal",
    fontStyleT: "bold",
  },
];

const all_Tags = Text_tags.concat(Func_tags);

// Definir el modo personalizado
CodeMirror.defineMode("customTags", function () {
  return {
    token: function (stream) {
      if (stream.match("-|",true)) {
        return "tg";
      }
      for (const Line of Contenidos) {
        if (stream.match(Line, true)) {
          
          return "Cont";

        }
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

function handleKeyUp(event) {
  if (event.key === "Enter") {
    autocompleteContainer.style.display = "none";
    LineasReco();
  } else {
    LineasReco();
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
  LineasReco();
  autocompleteContainer.style.display = "none"; // Ocultar sugerencias después de insertar
}

editor.on("keyup", handleKeyUp);

document.addEventListener("click", function () {
  autocompleteContainer.style.display = "none";
});

function LineasReco() {
  let Contenido = [];
  let Lineas = editor.getValue().split("\n");
  Lineas.forEach((line, index) => {
    all_Tags.forEach((tag) => {
      if (line.includes(`@${tag.name}@`)) {
        let j = 1;
        while (
          Lineas[index + j] &&
          !Lineas[index + j].includes(`@/${tag.name}@`)
        ) {
          let Cont = Lineas[index + j].replace("-|"," ");
          Contenido.push(Cont.trim());
          j++;
        }
      }
    });
  });
  Contenidos = Contenido;
}

function generatePDF() {
  const { jsPDF } = window.jspdf;
  const doc = new jsPDF();
  const margin = 20;
  let y = margin;
  const pageHeight = doc.internal.pageSize.height - (margin + 10);
  const contentLines = [];
  let splitText;
  var Titt = "";
  let PrinEti = { Intro: false, Conclu: false };
  const lines = editor.getValue().split("\n");
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
        contentLines.push({ text: tagContent, tag });
      }
    });
  });

  for (let index = 0; index < contentLines.length; index++) {
    switch (contentLines[index].tag.name) {
      case "Introduccion":
        if (PrinEti.Intro == false) {
          if (Titt != "") {
            Titt = "";
          }
          addPageNumber(doc.internal.getNumberOfPages());
          if (y != margin) {
            doc.addPage();
          }
          y = margin;
          //Titulo
          doc.setFontSize(contentLines[index].tag.fontSize);
          doc.setFont("times", contentLines[index].tag.fontStyleT);
          doc.text(105,y,"Introduccion",{align:"center"})
          y +=10; 
          //Contenido 
          doc.setFont("times", contentLines[index].tag.fontStyle);
          let ContenidoLineas = contentLines[index].text.trim().split("-|");
          ContenidoLineas.forEach((Lineas)=> {
            splitText = doc.splitTextToSize(
              "           " + Lineas.trim(),
              doc.internal.pageSize.width - 2 * margin
            );
            splitText.forEach((textLine) => {
              if (y + 10 > pageHeight) {
                addPageNumber(doc.internal.getNumberOfPages());
                doc.addPage();
                y = margin;
              }
              doc.text(margin, y, textLine, {});
              y += 10;
            });
          });
          addPageNumber(doc.internal.getNumberOfPages());
          doc.addPage();
          y = margin;
          PrinEti.Intro = true;
        }
        break;
      case "titulo1":
      case "subTitulo":
        if (Titt != "") {
          y += 10;
          Titt = "";
        }
        doc.setFontSize(contentLines[index].tag.fontSize);
        doc.setFont("times", contentLines[index].tag.fontStyle);
        splitText = doc.splitTextToSize(
          contentLines[index].text.trim(),
          doc.internal.pageSize.width - 2 * margin
        );
        splitText.forEach((textLine) => {
          if (y + 10 > pageHeight) {
            addPageNumber(doc.internal.getNumberOfPages());
            doc.addPage();
            y = margin;
          }
          doc.text(105, y, textLine, { align: "center" });
          y += 10;
        });
        break;
      case "titulo2":
      case "titulo3":
        if (Titt != "") {
          y += 10;
          Titt = "";
        }
        doc.setFontSize(contentLines[index].tag.fontSize);
        doc.setFont("times", contentLines[index].tag.fontStyle);
        splitText = doc.splitTextToSize(
          contentLines[index].text.trim(),
          doc.internal.pageSize.width - 2 * margin
        );
        splitText.forEach((textLine) => {
          if (y + 10 > pageHeight) {
            addPageNumber(doc.internal.getNumberOfPages());
            doc.addPage();
            y = margin;
          }
          doc.text(margin, y, textLine, {});
          y += 10;
        });
        break;
      case "titulo4":
      case "titulo5":
        if (Titt != "") {
          y += 10;
          Titt = "";
        }

        doc.setFontSize(contentLines[index].tag.fontSize);
        doc.setFont("times", contentLines[index].tag.fontStyle);
        splitText = doc.splitTextToSize(
          contentLines[index].text.trim(),
          doc.internal.pageSize.width - 2 * margin
        );
        Titt = splitText[0];
        splitText.forEach((textLine) => {
          if (y + 10 > pageHeight) {
            addPageNumber(doc.internal.getNumberOfPages());
            doc.addPage();
            y = margin;
          }
          doc.text(margin, y, "           " + textLine + ".", {});
        });
        break;
      case "parr":
        doc.setFontSize(contentLines[index].tag.fontSize);
        doc.setFont("times", contentLines[index].tag.fontStyle);
        const initialIndent = Titt
          ? "           " +
            " ".repeat(
              Math.ceil(doc.getTextWidth(Titt) * 1.2) -
                Math.ceil(doc.getTextWidth(Titt) * 1.2 * 0.1)
            )
          : "           ";

        splitText = doc.splitTextToSize(
          initialIndent + contentLines[index].text.trim(),
          doc.internal.pageSize.width - 2 * margin
        );
        splitText.forEach((textLine) => {
          if (y + 10 > pageHeight) {
            addPageNumber(doc.internal.getNumberOfPages());
            doc.addPage();
            y = margin;
          }
          doc.text(margin, y, textLine, {});
          y += 10;
        });
        Titt = "";
        break;
      case "linebreak":
        if (Titt != "") {
          Titt = "";
        }
        num = Number(contentLines[index].text);
        console.log(num);
        for (let index = 0; index < num; index++) {
          y += 10;
        }
        if (y + 10 > pageHeight) {
          addPageNumber(doc.internal.getNumberOfPages());
          doc.addPage();
          y = margin;
        }
        break;
      case "pagebreak":
        if (Titt != "") {
          Titt = "";
        }
        doc.addPage();
        y = margin;
        break;
      default:
        break;
        case "Conclusion":
        if (PrinEti.Conclu == false) {
          if (Titt != "") {
            Titt = "";
          }
          addPageNumber(doc.internal.getNumberOfPages());
          if (y != margin) {
            doc.addPage();
          }
          y = margin;
          //Titulo
          doc.setFontSize(contentLines[index].tag.fontSize);
          doc.setFont("times", contentLines[index].tag.fontStyleT);
          doc.text(105,y,"Conclusion",{align:"center"})
          y +=10; 
          //Contenido 
          doc.setFont("times", contentLines[index].tag.fontStyle);
          let ContenidoLineas = contentLines[index].text.trim().split("-|");
          ContenidoLineas.forEach((Lineas)=> {
            splitText = doc.splitTextToSize(
              "           " + Lineas.trim(),
              doc.internal.pageSize.width - 2 * margin
            );
            splitText.forEach((textLine) => {
              if (y + 10 > pageHeight) {
                addPageNumber(doc.internal.getNumberOfPages());
                doc.addPage();
                y = margin;
              }
              doc.text(margin, y, textLine, {});
              y += 10;
            });
          });
          addPageNumber(doc.internal.getNumberOfPages());
          doc.addPage();
          y = margin;
          PrinEti.Conclu = true;
        }
        break;
    }
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
  }
}
