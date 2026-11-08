const autocompleteContainer = document.getElementById("autocomplete-container");
let Save = localStorage.getItem("SAVE") ?? "";
let savedText = Save;
let saveTimer = null;
let saveBadgeTimer = null;
let currentEditorMode = "source"; // "source" | "visual"
let visualBlocks = [];
let activeBrushTag = null; // null = cursor normal, o nombre de etiqueta
let currentSelectionState = null; // { blockIndex, start, end, selectedText }

const Lorem = [
    `Lorem ipsum dolor sit amet consectetur, adipiscing elit interdum. Viverra dui penatibus lacus odio convallis cum ridiculus habitasse inceptos eleifend mus vehicula, semper felis consequat erat feugiat fusce class congue mollis curabitur.`,
    `Lorem, ipsum dolor sit amet consectetur adipisicing elit. Ex magnam cupiditate fugiat vel doloribus sapiente accusantium error dolores, tempora distinctio exercitationem, esse sint ipsum placeat harum?`,
    `Lorem ipsum dolor sit amet consectetur adipisicing elit. Est hic facilis atque impedit. Porro nihil esse reprehenderit consequuntur fugit expedita.`,
];

let indexEntries = [];

// === NORMAS APA 7MA EDICIÓN ===
const APA_MARGIN = 25.4;
const APA_INDENT = 12.7;
const LINE_H = 10;
const BASELINE_OFFSET = 15.4;

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
    { name: "palabrasClave", fontSize: 12, fontStyle: "normal", margen: APA_MARGIN, inde: true },
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
const noCloseTags = ["linebreak", "pagebreak", "Lorem", "Indice"];
const CHIP_TAGS = ["parr", "titulo1", "titulo2", "citaLarga", "referencias", "pagebreak", "Lorem"];

const TAG_LABELS = {
    Portada: "Portada",
    Indice: "Índice Automático",
    Resumen: "Resumen (Abstract)",
    palabrasClave: "Palabras clave",
    Introduccion: "Introducción",
    titulo1: "Título 1",
    titulo2: "Título 2",
    titulo3: "Título 3",
    titulo4: "Título 4",
    titulo5: "Título 5",
    subTitulo: "Subtítulo",
    parr: "Párrafo APA",
    citaLarga: "Cita larga (+40 pal.)",
    lista: "Lista de viñetas",
    notaPie: "Nota al pie",
    Conclusion: "Conclusión",
    referencias: "Referencias APA",
    pagebreak: "Salto de página",
    linebreak: "Salto de línea",
    Lorem: "Lorem",
};

const TAG_BADGE_COLORS = {
    Portada: "bg-amber-500/15 text-amber-600 dark:text-amber-300 border-amber-500/30",
    Indice: "bg-purple-500/15 text-purple-600 dark:text-purple-300 border-purple-500/30",
    Resumen: "bg-cyan-500/15 text-cyan-600 dark:text-cyan-300 border-cyan-500/30",
    palabrasClave: "bg-teal-500/15 text-teal-600 dark:text-teal-300 border-teal-500/30",
    Introduccion: "bg-blue-500/15 text-blue-600 dark:text-blue-300 border-blue-500/30",
    Conclusion: "bg-indigo-500/15 text-indigo-600 dark:text-indigo-300 border-indigo-500/30",
    titulo1: "bg-rose-500/15 text-rose-600 dark:text-rose-300 border-rose-500/30",
    titulo2: "bg-pink-500/15 text-pink-600 dark:text-pink-300 border-pink-500/30",
    titulo3: "bg-fuchsia-500/15 text-fuchsia-600 dark:text-fuchsia-300 border-fuchsia-500/30",
    titulo4: "bg-orange-500/15 text-orange-600 dark:text-orange-300 border-orange-500/30",
    titulo5: "bg-yellow-500/15 text-yellow-700 dark:text-yellow-300 border-yellow-500/30",
    subTitulo: "bg-rose-500/10 text-rose-500 dark:text-rose-300 border-rose-500/20",
    parr: "bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 border-emerald-500/30",
    citaLarga: "bg-lime-500/15 text-lime-700 dark:text-lime-300 border-lime-500/30",
    referencias: "bg-violet-500/15 text-violet-600 dark:text-violet-300 border-violet-500/30",
    lista: "bg-sky-500/15 text-sky-600 dark:text-sky-300 border-sky-500/30",
    notaPie: "bg-slate-500/15 text-slate-600 dark:text-slate-300 border-slate-500/30",
    pagebreak: "bg-slate-500/20 text-slate-600 dark:text-slate-300 border-slate-500/40",
    linebreak: "bg-slate-500/20 text-slate-600 dark:text-slate-300 border-slate-500/40",
};

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

autocompleteContainer.style.display = "none";

if (Save) {
    editor.setValue(Save);
} else {
    editor.setValue(
        `@Portada@\nUNIVERSIDAD DE PRUEBA\n-|\nTÍTULO DEL TRABAJO ACADÉMICO EN FORMATO APA\n-|\nJuan Pérez\nMaría Gómez\nCarlos Ruiz\n-|\nDr. Roberto Jiménez\n-|\nFacultad de Ingeniería\n-|\nCiudad, País\n-|\n2026\n@/Portada@\n\n@Indice@\n@/Indice@\n\n@Introduccion@\nEsta es la introducción del documento. Aquí se presenta el tema central de la investigación de manera detallada siguiendo las normas APA de sangría y estilo.\n@/Introduccion@\n\n@titulo1@\nCapítulo 1: Fundamentos\n@/titulo1@\n\n@parr@\nEste es un párrafo de prueba donde se explica el concepto básico. El editor aplica la sangría de primera línea y el interlineado doble automáticamente según las normas APA.\n@/parr@\n\n@titulo2@\n1.1 Marco Teórico\n@/titulo2@\n\n@parr@\nAquí se desarrolla la teoría principal del capítulo. Podemos notar cómo los títulos de nivel 2 se alinean a la izquierda en negrita.\n@/parr@\n\n@titulo4@\nTítulo de nivel 4\n@/titulo4@\n\n@parr@\nNótese que los títulos de nivel 4 llevan un punto final y el texto del párrafo siguiente comienza justo después en la misma línea.\n@/parr@\n\n@Conclusion@\nEl generador CodePDF facilita enormemente la creación de documentos estructurados con índice automático.\n@/Conclusion@`,
    );
}

// =====================================================================
// MODO VISUAL: PARSER, SERIALIZADOR Y CLASIFICADOR INTELIGENTE APA
// =====================================================================

function detectSingleParagraphTag(text, indexInDoc = 0) {
    const clean = text.trim();
    if (!clean) return "parr";

    const lower = clean.toLowerCase();
    if (/^(índice|indice|tabla de contenido|contenido)$/i.test(clean)) return "Indice";
    if (/^(palabras clave|keywords)\s*:/i.test(clean)) return "palabrasClave";
    if (/^[-•*]\s+/.test(clean) || /^\d+\)\s+/.test(clean)) return "lista";

    // Detección de referencia bibliográfica APA: Apellido, N. (2020).
    if (/^[A-ZÁÉÍÓÚÑ][a-záéíóúñA-ZÁÉÍÓÚÑ\s,\.&]+\(\d{4}[a-z]?\)\./.test(clean)) {
        return "referencias";
    }

    // Numeración jerárquica de títulos (1.1.1, 1.1, 1.)
    if (/^\d+\.\d+\.\d+\s+\S+/.test(clean) && clean.length < 110) return "titulo3";
    if (/^\d+\.\d+\s+\S+/.test(clean) && clean.length < 110) return "titulo2";
    if ((/^(cap[íi]tulo|secci[óo]n|parte)\s+\d+/i.test(clean) || /^\d+\.\s+\S+/.test(clean)) && clean.length < 100) {
        return "titulo1";
    }

    // Líneas cortas sin punto final -> Título
    const wordCount = clean.split(/\s+/).length;
    if (clean.length < 75 && wordCount <= 10 && !/[.;:]$/.test(clean)) {
        return "titulo1";
    }

    // Cita larga (>40 palabras entre comillas)
    if (wordCount >= 40 && (/^["“«].*["”»]$/.test(clean))) {
        return "citaLarga";
    }

    return "parr";
}

function smartClassifyRawText(rawText) {
    const lines = rawText.replace(/\r\n/g, "\n").split("\n");
    const resultBlocks = [];
    let i = 0;

    // 1. Detectar si el inicio parece una Portada (primeras líneas cortas con Universidad/Autor/Año)
    let coverCandidate = [];
    let scanIdx = 0;
    while (scanIdx < Math.min(lines.length, 12)) {
        const l = lines[scanIdx].trim();
        if (!l) {
            if (coverCandidate.length >= 2) break;
            scanIdx++;
            continue;
        }
        if (/^(resumen|abstract|introducci[óo]n|índice|indice|cap[íi]tulo\s+1)/i.test(l)) break;
        if (l.length < 95 && !/\.$/.test(l)) {
            coverCandidate.push(l);
            scanIdx++;
        } else {
            break;
        }
    }

    const coverJoined = coverCandidate.join(" ");
    const looksLikeCover =
        coverCandidate.length >= 3 &&
        (/(universidad|instituto|facultad|colegio|escuela|departamento|autor|alumno|estudiante|profesor|docente|catedr[áa]tico|materia|curso|\b202\d\b)/i.test(coverJoined));

    if (looksLikeCover) {
        resultBlocks.push({
            tag: "Portada",
            content: coverCandidate.join("\n-|\n"),
        });
        i = scanIdx;
    }

    // 2. Recorrer el resto de líneas agrupando según contexto de sección
    let pendingSection = null; // "Resumen" | "Introduccion" | "Conclusion" | "referencias"

    while (i < lines.length) {
        let line = lines[i].trim();
        if (!line) {
            i++;
            continue;
        }

        // Encabezados de sección especiales
        if (/^(resumen|abstract)$/i.test(line)) {
            pendingSection = "Resumen";
            i++;
            continue;
        }
        if (/^introducci[óo]n$/i.test(line)) {
            pendingSection = "Introduccion";
            i++;
            continue;
        }
        if (/^(conclusi[óo]n|conclusiones)$/i.test(line)) {
            pendingSection = "Conclusion";
            i++;
            continue;
        }
        if (/^(referencias|referencias bibliogr[áa]ficas|bibliograf[íi]a)$/i.test(line)) {
            pendingSection = "referencias";
            i++;
            continue;
        }
        if (/^(índice|indice|tabla de contenido)$/i.test(line)) {
            resultBlocks.push({ tag: "Indice", content: "" });
            i++;
            continue;
        }

        // Palabras clave
        if (/^(palabras clave|keywords)\s*:/i.test(line)) {
            const cleanKw = line.replace(/^(palabras clave|keywords)\s*:\s*/i, "").trim();
            resultBlocks.push({ tag: "palabrasClave", content: cleanKw });
            if (pendingSection === "Resumen") pendingSection = null;
            i++;
            continue;
        }

        // Si estamos dentro de Referencias
        if (pendingSection === "referencias") {
            resultBlocks.push({ tag: "referencias", content: line });
            i++;
            continue;
        }

        // Si venimos justo después del título Resumen, Introducción o Conclusión
        if (pendingSection === "Resumen" || pendingSection === "Introduccion" || pendingSection === "Conclusion") {
            resultBlocks.push({ tag: pendingSection, content: line });
            pendingSection = null;
            i++;
            continue;
        }

        // Si son viñetas consecutivas, agruparlas en un bloque @lista@
        if (/^[-•*]\s+/.test(line) || /^\d+\)\s+/.test(line)) {
            let listItems = [];
            while (i < lines.length && (/^[-•*]\s+/.test(lines[i].trim()) || /^\d+\)\s+/.test(lines[i].trim()))) {
                listItems.push(lines[i].trim().replace(/^([-•*]|\d+\))\s+/, ""));
                i++;
            }
            resultBlocks.push({ tag: "lista", content: listItems.join("\n-|\n") });
            continue;
        }

        const guessedTag = detectSingleParagraphTag(line, resultBlocks.length);
        resultBlocks.push({ tag: guessedTag, content: line });
        i++;
    }

    return resultBlocks;
}

function parseSourceToBlocks(sourceText) {
    const blocks = [];
    const lines = sourceText.replace(/\r\n/g, "\n").split("\n");
    let i = 0;

    while (i < lines.length) {
        const rawLine = lines[i];
        const trimmed = rawLine.trim();

        if (!trimmed) {
            i++;
            continue;
        }

        let matchedTag = null;
        for (const t of all_Tags) {
            if (trimmed.includes(`@${t.name}@`)) {
                matchedTag = t.name;
                break;
            }
        }

        if (matchedTag) {
            const openToken = `@${matchedTag}@`;
            const closeToken = `@/${matchedTag}@`;

            if (["pagebreak", "linebreak", "Indice"].includes(matchedTag)) {
                // Si es @Indice@ y en la siguiente línea está @/Indice@, saltar el cierre también
                if (lines[i + 1] && lines[i + 1].includes(closeToken)) {
                    i += 2;
                } else {
                    i++;
                }
                blocks.push({ tag: matchedTag, content: "" });
                continue;
            }

            const afterOpen = rawLine.slice(rawLine.indexOf(openToken) + openToken.length);
            if (afterOpen.includes(closeToken)) {
                const inlineContent = afterOpen.slice(0, afterOpen.indexOf(closeToken)).trim();
                blocks.push({ tag: matchedTag, content: inlineContent });
                i++;
                continue;
            }

            let collected = [];
            if (afterOpen.trim()) collected.push(afterOpen.trim());
            i++;
            while (i < lines.length && !lines[i].includes(closeToken)) {
                collected.push(lines[i]);
                i++;
            }
            if (i < lines.length && lines[i].includes(closeToken)) {
                const beforeClose = lines[i].slice(0, lines[i].indexOf(closeToken)).trim();
                if (beforeClose) collected.push(beforeClose);
                i++;
            }
            blocks.push({ tag: matchedTag, content: collected.join("\n").trim() });
        } else {
            // Línea suelta sin etiqueta (ej. texto recién pegado en modo Fuente): auto-clasificar
            const autoBlocks = smartClassifyRawText(trimmed);
            autoBlocks.forEach((b) => blocks.push(b));
            i++;
        }
    }

    return blocks;
}

function serializeBlocksToSource(blocks) {
    return blocks
        .map((b) => {
            if (b.tag === "pagebreak" || b.tag === "linebreak") {
                return `@${b.tag}@`;
            }
            if (b.tag === "Indice") {
                return `@Indice@\n@/Indice@`;
            }
            return `@${b.tag}@\n${(b.content || "").trim()}\n@/${b.tag}@`;
        })
        .join("\n\n");
}

function syncVisualToSource() {
    const newSource = serializeBlocksToSource(visualBlocks);
    if (editor.getValue() !== newSource) {
        editor.setValue(newSource);
    }
}

// =====================================================================
// RENDERIZADO INTERACTIVO DEL MODO VISUAL
// =====================================================================

const BRUSH_OPTIONS = [
    { tag: null, label: "Cursor Normal", icon: "near_me" },
    { tag: "titulo1", label: "Título 1", icon: "title" },
    { tag: "titulo2", label: "Título 2", icon: "format_h2" },
    { tag: "titulo3", label: "Título 3", icon: "format_h3" },
    { tag: "parr", label: "Párrafo", icon: "notes" },
    { tag: "citaLarga", label: "Cita Larga", icon: "format_quote" },
    { tag: "referencias", label: "Referencia", icon: "menu_book" },
    { tag: "lista", label: "Lista", icon: "format_list_bulleted" },
    { tag: "Introduccion", label: "Introducción", icon: "article" },
    { tag: "Conclusion", label: "Conclusión", icon: "task_alt" },
];

const POPOVER_TAGS = [
    "titulo1",
    "titulo2",
    "titulo3",
    "titulo4",
    "parr",
    "citaLarga",
    "referencias",
    "lista",
    "Resumen",
    "palabrasClave",
    "Introduccion",
    "Conclusion",
    "Portada",
];

function buildVisualBrushBar() {
    const container = document.getElementById("brush-buttons-container");
    if (!container) return;
    container.innerHTML = "";

    BRUSH_OPTIONS.forEach((opt) => {
        const isSelected = activeBrushTag === opt.tag;
        const btn = document.createElement("button");
        btn.type = "button";
        btn.className = isSelected
            ? "h-6 px-2.5 rounded-md text-[11px] font-semibold bg-primary text-white flex items-center gap-1 shadow-2xs shrink-0 transition-all"
            : "h-6 px-2 rounded-md text-[11px] font-medium text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-800 flex items-center gap-1 shrink-0 transition-all";
        btn.innerHTML = `<span class="material-symbols-outlined text-[13px]">${opt.icon}</span><span>${opt.label}</span>`;
        btn.onclick = () => {
            activeBrushTag = activeBrushTag === opt.tag ? null : opt.tag;
            const visualContainer = document.getElementById("visual-blocks-container");
            if (visualContainer) {
                visualContainer.classList.toggle("brush-active", Boolean(activeBrushTag));
            }
            buildVisualBrushBar();
        };
        container.appendChild(btn);
    });

    const popoverGrid = document.getElementById("popover-tags-grid");
    if (popoverGrid && !popoverGrid.children.length) {
        POPOVER_TAGS.forEach((tagName) => {
            const btn = document.createElement("button");
            btn.type = "button";
            btn.className =
                "px-2 py-1 rounded-md text-[11px] font-semibold bg-slate-800 hover:bg-primary text-slate-100 hover:text-white transition-colors";
            btn.textContent = TAG_LABELS[tagName] || tagName;
            btn.onmousedown = (e) => {
                e.preventDefault();
                applyTagToCurrentSelection(tagName);
            };
            popoverGrid.appendChild(btn);
        });
    }
}

function autoResizeTextarea(ta) {
    if (!ta) return;
    ta.style.height = "auto";
    ta.style.height = Math.max(32, ta.scrollHeight) + "px";
}

function renderVisualBlocks() {
    const container = document.getElementById("visual-blocks-container");
    if (!container) return;
    container.innerHTML = "";
    container.classList.toggle("brush-active", Boolean(activeBrushTag));

    if (!visualBlocks.length) {
        visualBlocks.push({ tag: "parr", content: "" });
    }

    visualBlocks.forEach((block, idx) => {
        const card = document.createElement("div");
        card.className =
            "visual-block-card group rounded-xl bg-surface-light dark:bg-surface-dark border border-border-light dark:border-slate-800/90 p-3.5 shadow-2xs";

        // Si el usuario hace clic con una Brocha activa, cambiar etiqueta al instante
        card.addEventListener("click", (e) => {
            if (activeBrushTag && !e.target.closest("button") && !e.target.closest("select")) {
                block.tag = activeBrushTag;
                syncVisualToSource();
                renderVisualBlocks();
                showToast(`Etiqueta cambiada a ${TAG_LABELS[activeBrushTag] || activeBrushTag}`, "success");
            }
        });

        // Cabecera del bloque: Selector de etiqueta + Acciones rápidas
        const header = document.createElement("div");
        header.className = "flex items-center justify-between gap-2 mb-2";

        const leftControls = document.createElement("div");
        leftControls.className = "flex items-center gap-2";

        const badgeColor = TAG_BADGE_COLORS[block.tag] || "bg-slate-500/15 text-slate-500 border-slate-500/30";
        const select = document.createElement("select");
        select.className = `h-6 py-0 pl-2 pr-6 rounded-md text-[11px] font-bold border ${badgeColor} bg-transparent cursor-pointer focus:ring-1 focus:ring-primary`;
        Object.keys(TAG_LABELS).forEach((tKey) => {
            if (tKey === "Lorem") return;
            const opt = document.createElement("option");
            opt.value = tKey;
            opt.textContent = TAG_LABELS[tKey];
            opt.className = "bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-100";
            if (tKey === block.tag) opt.selected = true;
            select.appendChild(opt);
        });
        select.onchange = () => {
            block.tag = select.value;
            syncVisualToSource();
            renderVisualBlocks();
        };
        leftControls.appendChild(select);

        if (block.tag === "Portada" || block.tag === "lista") {
            const hint = document.createElement("span");
            hint.className = "text-[10px] text-slate-400 dark:text-slate-500 hidden sm:inline";
            hint.textContent = "Usa saltos de línea o -| para separar elementos";
            leftControls.appendChild(hint);
        }

        const rightControls = document.createElement("div");
        rightControls.className = "flex items-center gap-0.5 opacity-70 group-hover:opacity-100 transition-opacity";

        // Subir bloque
        const upBtn = document.createElement("button");
        upBtn.type = "button";
        upBtn.className = "p-1 rounded hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-400 hover:text-slate-700 dark:hover:text-slate-200";
        upBtn.title = "Mover arriba";
        upBtn.innerHTML = `<span class="material-symbols-outlined text-[15px]">arrow_upward</span>`;
        upBtn.onclick = () => moveVisualBlock(idx, -1);

        // Bajar bloque
        const downBtn = document.createElement("button");
        downBtn.type = "button";
        downBtn.className = "p-1 rounded hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-400 hover:text-slate-700 dark:hover:text-slate-200";
        downBtn.title = "Mover abajo";
        downBtn.innerHTML = `<span class="material-symbols-outlined text-[15px]">arrow_downward</span>`;
        downBtn.onclick = () => moveVisualBlock(idx, 1);

        // Unir con el bloque siguiente
        const mergeBtn = document.createElement("button");
        mergeBtn.type = "button";
        mergeBtn.className = "p-1 rounded hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-400 hover:text-slate-700 dark:hover:text-slate-200";
        mergeBtn.title = "Unir con el bloque de abajo";
        mergeBtn.innerHTML = `<span class="material-symbols-outlined text-[15px]">merge</span>`;
        mergeBtn.onclick = () => mergeWithNextBlock(idx);

        // Insertar bloque debajo
        const addBelowBtn = document.createElement("button");
        addBelowBtn.type = "button";
        addBelowBtn.className = "p-1 rounded hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-400 hover:text-primary dark:hover:text-emerald-400";
        addBelowBtn.title = "Insertar bloque debajo";
        addBelowBtn.innerHTML = `<span class="material-symbols-outlined text-[15px]">add_circle</span>`;
        addBelowBtn.onclick = () => addVisualBlock("parr", "", idx + 1);

        // Eliminar bloque
        const delBtn = document.createElement("button");
        delBtn.type = "button";
        delBtn.className = "p-1 rounded hover:bg-red-500/10 text-slate-400 hover:text-red-500";
        delBtn.title = "Eliminar bloque";
        delBtn.innerHTML = `<span class="material-symbols-outlined text-[15px]">delete</span>`;
        delBtn.onclick = () => deleteVisualBlock(idx);

        rightControls.append(upBtn, downBtn, mergeBtn, addBelowBtn, delBtn);
        header.append(leftControls, rightControls);
        card.appendChild(header);

        // Cuerpo del bloque
        if (["Indice", "pagebreak", "linebreak"].includes(block.tag)) {
            const dividerInfo = document.createElement("div");
            dividerInfo.className =
                "py-2 px-3 rounded-lg bg-slate-100 dark:bg-slate-900/90 border border-dashed border-slate-300 dark:border-slate-700 text-center text-xs text-slate-500 dark:text-slate-400 font-medium";
            dividerInfo.textContent =
                block.tag === "Indice"
                    ? "📑 Aquí se generará automáticamente la Tabla de Contenidos (Índice APA) con números de página"
                    : block.tag === "pagebreak"
                    ? "✂️ Salto de Página (el siguiente bloque iniciará en una hoja nueva)"
                    : "↵ Salto de Línea en blanco";
            card.appendChild(dividerInfo);
        } else {
            const ta = document.createElement("textarea");
            ta.rows = 1;
            ta.value = block.content || "";
            ta.placeholder = "Escribe o pega texto aquí... (Selecciona cualquier parte con el ratón para etiquetarla)";
            ta.className = `visual-block-textarea text-slate-800 dark:text-slate-100 apa-style-${block.tag}`;

            ta.addEventListener("input", () => {
                block.content = ta.value;
                autoResizeTextarea(ta);
                syncVisualToSource();
            });

            // Si el usuario pega múltiples párrafos dentro de un bloque vacío o pequeño, ofrecer auto-separación inteligente
            ta.addEventListener("paste", (e) => {
                const pasted = (e.clipboardData || window.clipboardData).getData("text");
                if (pasted && pasted.includes("\n") && pasted.trim().split("\n").length >= 3 && !ta.value.trim()) {
                    e.preventDefault();
                    const detected = smartClassifyRawText(pasted);
                    if (detected.length) {
                        visualBlocks.splice(idx, 1, ...detected);
                        syncVisualToSource();
                        renderVisualBlocks();
                        showToast(`${detected.length} bloques APA detectados automáticamente`, "success");
                    }
                }
            });

            // Detectar selección con el ratón para mostrar el menú flotante
            ta.addEventListener("mouseup", (e) => handleTextareaMouseUp(e, ta, idx));
            ta.addEventListener("keyup", (e) => {
                if (e.shiftKey && e.key.startsWith("Arrow")) {
                    handleTextareaMouseUp(e, ta, idx);
                }
            });

            card.appendChild(ta);
            requestAnimationFrame(() => autoResizeTextarea(ta));
        }

        container.appendChild(card);
    });
}

function handleTextareaMouseUp(event, textarea, blockIndex) {
    if (activeBrushTag) return;
    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const selectedText = textarea.value.slice(start, end).trim();

    const popover = document.getElementById("visual-selection-popover");
    if (!popover) return;

    if (!selectedText || selectedText.length < 2) {
        popover.classList.add("hidden");
        popover.classList.remove("flex");
        currentSelectionState = null;
        return;
    }

    currentSelectionState = {
        blockIndex,
        start,
        end,
        selectedText,
    };

    popover.classList.remove("hidden");
    popover.classList.add("flex");

    const rect = textarea.getBoundingClientRect();
    const clientX = event.clientX || rect.left + rect.width / 2;
    const clientY = event.clientY || rect.top + 20;

    const popWidth = Math.min(380, window.innerWidth - 24);
    const leftPos = Math.max(12, Math.min(window.innerWidth - popWidth - 12, clientX - popWidth / 2));
    const topPos = Math.max(12, clientY - 115);

    popover.style.left = `${leftPos}px`;
    popover.style.top = `${topPos}px`;
}

// Ocultar el menú flotante si se hace clic fuera
document.addEventListener("mousedown", (e) => {
    const popover = document.getElementById("visual-selection-popover");
    if (!popover || popover.classList.contains("hidden")) return;
    if (!popover.contains(e.target)) {
        popover.classList.add("hidden");
        popover.classList.remove("flex");
    }
});

function applyInlineFormatToSelection(marker) {
    if (!currentSelectionState) return;
    const { blockIndex, start, end } = currentSelectionState;
    const block = visualBlocks[blockIndex];
    if (!block) return;

    const raw = block.content || "";
    const target = raw.slice(start, end);
    if (!target) return;

    block.content = raw.slice(0, start) + `${marker}${target}${marker}` + raw.slice(end);
    hideSelectionPopover();
    syncVisualToSource();
    renderVisualBlocks();
}

function applyTagToCurrentSelection(newTag) {
    if (!currentSelectionState) return;
    const { blockIndex, start, end } = currentSelectionState;
    const block = visualBlocks[blockIndex];
    if (!block) return;

    const fullText = block.content || "";
    const before = fullText.slice(0, start).trim();
    const selected = fullText.slice(start, end).trim();
    const after = fullText.slice(end).trim();

    // Si seleccionó casi todo el bloque (o no hay texto antes ni después), solo cambia la etiqueta del bloque actual
    if (!before && !after) {
        block.tag = newTag;
    } else {
        // Dividir automáticamente el bloque en hasta 3 partes: antes, selección con la nueva etiqueta, y después
        const replacement = [];
        if (before) replacement.push({ tag: block.tag, content: before });
        if (selected) replacement.push({ tag: newTag, content: selected });
        if (after) replacement.push({ tag: block.tag, content: after });
        visualBlocks.splice(blockIndex, 1, ...replacement);
    }

    hideSelectionPopover();
    syncVisualToSource();
    renderVisualBlocks();
    showToast(`Asignado como ${TAG_LABELS[newTag] || newTag}`, "success");
}

function hideSelectionPopover() {
    const popover = document.getElementById("visual-selection-popover");
    if (popover) {
        popover.classList.add("hidden");
        popover.classList.remove("flex");
    }
    currentSelectionState = null;
}

function addVisualBlock(tag = "parr", content = "", insertAt = visualBlocks.length) {
    visualBlocks.splice(insertAt, 0, { tag, content });
    syncVisualToSource();
    renderVisualBlocks();
}

function deleteVisualBlock(index) {
    if (visualBlocks.length <= 1) {
        visualBlocks[0] = { tag: "parr", content: "" };
    } else {
        visualBlocks.splice(index, 1);
    }
    syncVisualToSource();
    renderVisualBlocks();
}

function moveVisualBlock(index, direction) {
    const target = index + direction;
    if (target < 0 || target >= visualBlocks.length) return;
    const temp = visualBlocks[index];
    visualBlocks[index] = visualBlocks[target];
    visualBlocks[target] = temp;
    syncVisualToSource();
    renderVisualBlocks();
}

function mergeWithNextBlock(index) {
    if (index + 1 >= visualBlocks.length) return;
    const curr = visualBlocks[index];
    const next = visualBlocks[index + 1];
    const sep = curr.tag === "Portada" || curr.tag === "lista" ? "\n-|\n" : " ";
    curr.content = `${(curr.content || "").trim()}${sep}${(next.content || "").trim()}`.trim();
    visualBlocks.splice(index + 1, 1);
    syncVisualToSource();
    renderVisualBlocks();
    showToast("Bloques unidos", "success");
}

function autoClassifyExistingBlocks() {
    const rawCombined = visualBlocks.map((b) => b.content).filter(Boolean).join("\n\n");
    if (!rawCombined.trim()) return;
    visualBlocks = smartClassifyRawText(rawCombined);
    syncVisualToSource();
    renderVisualBlocks();
    showToast("Documento auto-clasificado con normas APA", "success");
}

function openSmartPasteModal() {
    const modal = document.getElementById("smart-paste-modal");
    const ta = document.getElementById("smart-paste-textarea");
    if (modal) {
        modal.classList.remove("hidden");
        modal.classList.add("flex");
        if (ta) {
            ta.value = "";
            setTimeout(() => ta.focus(), 50);
        }
    }
}

function closeSmartPasteModal() {
    const modal = document.getElementById("smart-paste-modal");
    if (modal) {
        modal.classList.add("hidden");
        modal.classList.remove("flex");
    }
}

function processSmartPaste(replaceAll = true) {
    const ta = document.getElementById("smart-paste-textarea");
    const raw = ta ? ta.value : "";
    if (!raw.trim()) {
        closeSmartPasteModal();
        return;
    }
    const newBlocks = smartClassifyRawText(raw);
    if (replaceAll) {
        // Incluir Índice automático después de la Portada si se detectó Portada
        if (newBlocks.length && newBlocks[0].tag === "Portada" && !newBlocks.some((b) => b.tag === "Indice")) {
            newBlocks.splice(1, 0, { tag: "Indice", content: "" });
        }
        visualBlocks = newBlocks;
    } else {
        visualBlocks = visualBlocks.concat(newBlocks);
    }
    closeSmartPasteModal();
    syncVisualToSource();
    renderVisualBlocks();
    showToast(`${newBlocks.length} secciones APA organizadas automáticamente`, "success");
}

// --- CAMBIO DE MODO: FUENTE / VISUAL (ESTILO OVERLEAF) ---
function setEditorMode(mode) {
    currentEditorMode = mode;
    const sourceBtn = document.getElementById("mode-source-btn");
    const visualBtn = document.getElementById("mode-visual-btn");
    const sideSourceBtn = document.getElementById("side-source-btn");
    const sideVisualBtn = document.getElementById("side-visual-btn");
    const sourceView = document.getElementById("source-editor-view");
    const visualView = document.getElementById("visual-editor-view");
    const quickTags = document.getElementById("quick-tags");
    const visualToolbar = document.getElementById("visual-toolbar");
    const visualBrushBar = document.getElementById("visual-brush-bar");
    const shortcutsInfo = document.getElementById("status-shortcuts");

    if (mode === "visual") {
        sourceBtn.classList.remove("active");
        sourceBtn.setAttribute("aria-selected", "false");
        visualBtn.classList.add("active");
        visualBtn.setAttribute("aria-selected", "true");

        if (sideSourceBtn && sideVisualBtn) {
            sideVisualBtn.className = "p-2.5 rounded-xl bg-primary/10 dark:bg-emerald-500/20 text-primary dark:text-emerald-400 transition-all hover:scale-105";
            sideSourceBtn.className = "p-2.5 rounded-xl text-slate-500 dark:text-slate-300 hover:text-primary dark:hover:text-emerald-400 transition-all hover:bg-slate-100 dark:hover:bg-slate-800";
        }

        // Parsear el código actual a bloques visuales
        visualBlocks = parseSourceToBlocks(editor.getValue());
        buildVisualBrushBar();
        renderVisualBlocks();

        sourceView.classList.add("hidden");
        visualView.classList.remove("hidden");
        visualView.classList.add("flex");
        if (quickTags) quickTags.classList.add("hidden");
        if (visualToolbar) {
            visualToolbar.classList.remove("hidden");
            visualToolbar.classList.add("flex");
        }
        if (visualBrushBar) {
            visualBrushBar.classList.remove("hidden");
            visualBrushBar.classList.add("flex");
        }
        if (shortcutsInfo) {
            shortcutsInfo.innerHTML = `<span class="text-primary dark:text-emerald-400 font-semibold">Modo Visual Activo</span> · Selecciona texto con el ratón para dividir y etiquetar`;
        }
        hideAutocomplete();
    } else {
        visualBtn.classList.remove("active");
        visualBtn.setAttribute("aria-selected", "false");
        sourceBtn.classList.add("active");
        sourceBtn.setAttribute("aria-selected", "true");

        if (sideSourceBtn && sideVisualBtn) {
            sideSourceBtn.className = "p-2.5 rounded-xl bg-primary/10 dark:bg-emerald-500/20 text-primary dark:text-emerald-400 transition-all hover:scale-105";
            sideVisualBtn.className = "p-2.5 rounded-xl text-slate-500 dark:text-slate-300 hover:text-primary dark:hover:text-emerald-400 transition-all hover:bg-slate-100 dark:hover:bg-slate-800";
        }

        hideSelectionPopover();
        visualView.classList.add("hidden");
        visualView.classList.remove("flex");
        sourceView.classList.remove("hidden");
        if (quickTags) quickTags.classList.remove("hidden");
        if (visualToolbar) {
            visualToolbar.classList.add("hidden");
            visualToolbar.classList.remove("flex");
        }
        if (visualBrushBar) {
            visualBrushBar.classList.add("hidden");
            visualBrushBar.classList.remove("flex");
        }
        if (shortcutsInfo) {
            shortcutsInfo.innerHTML = `<kbd>Ctrl+Enter</kbd> compila PDF · <kbd>Ctrl+S</kbd> guarda · <kbd>-</kbd> autocompleta etiqueta`;
        }
        editor.refresh();
        editor.focus();
    }
}

// --- CONTADOR DE PALABRAS Y CARACTERES ---
function updateCounts() {
    const text = editor.getValue();
    let cleanText = text.replace(/@\/?\w+@/g, " ");
    cleanText = cleanText.replace(/-\|/g, " ").replace(/\*/g, " ");
    cleanText = cleanText.replace(/\s+/g, " ").trim();

    const words = cleanText ? cleanText.split(" ").length : 0;
    const chars = cleanText.length;

    document.getElementById("word-count").textContent = `${words} palabras`;
    document.getElementById("char-count").textContent = `${chars} caracteres`;
}

// --- AUTOSAVE REAL ---
const saveBadge = document.getElementById("save-status");

function showSaveStatus() {
    if (!saveBadge) return;
    saveBadge.classList.remove("opacity-0");
    clearTimeout(saveBadgeTimer);
    saveBadgeTimer = setTimeout(() => saveBadge.classList.add("opacity-0"), 1600);
}

function scheduleAutosave() {
    clearTimeout(saveTimer);
    saveTimer = setTimeout(() => {
        savedText = editor.getValue();
        localStorage.setItem("SAVE", savedText);
        showSaveStatus();
    }, 800);
}

window.addEventListener("beforeunload", (event) => {
    if (editor.getValue() !== savedText) {
        event.preventDefault();
        event.returnValue = "";
    }
});

editor.on("change", updateCounts);
editor.on("change", scheduleAutosave);
updateCounts();

// --- ATAJOS DE TECLADO ---
document.addEventListener("keydown", (event) => {
    const ctrl = event.ctrlKey || event.metaKey;
    if (!ctrl) return;
    if (event.key === "Enter") {
        event.preventDefault();
        generatePDF();
    } else if (event.key === "s" || event.key === "S") {
        event.preventDefault();
        saveToLocal();
    }
});

// --- BARRA DE HERRAMIENTAS (CHIPS RÁPIDOS EN MODO FUENTE) ---
function insertTagFromToolbar(tagName) {
    const cursorPosition = editor.getCursor();
    const tagData = all_Tags.find((t) => t.name === tagName) || { name: tagName };
    insertTag(tagData, -1, cursorPosition, true);
}

function buildToolbar() {
    const quickTags = document.getElementById("quick-tags");
    if (quickTags) {
        quickTags.innerHTML = "";
        CHIP_TAGS.forEach((name) => {
            const chip = document.createElement("button");
            chip.type = "button";
            chip.className =
                "h-7 px-2.5 rounded-md text-[11px] font-semibold text-slate-600 dark:text-slate-200 bg-slate-100 dark:bg-slate-800/90 hover:bg-primary/10 dark:hover:bg-emerald-500/20 hover:text-primary dark:hover:text-emerald-300 border border-transparent hover:border-primary/20 dark:hover:border-emerald-500/30 whitespace-nowrap transition-all";
            chip.textContent = TAG_LABELS[name] || name;
            chip.title = `Insertar @${name}@`;
            chip.onclick = () => insertTagFromToolbar(name);
            quickTags.appendChild(chip);
        });
    }
}

// --- AUTOCOMPLETADO ---
let activeSuggestionList = [];
let activeSuggestionIndex = -1;
let activeTrigger = null;

function isAutocompleteOpen() {
    return autocompleteContainer.style.display === "flex";
}

function hideAutocomplete() {
    autocompleteContainer.style.display = "none";
    activeSuggestionIndex = -1;
    activeTrigger = null;
}

function handleKeyUp(instance, event) {
    if (event.key === "Enter" || event.key === "Escape") {
        hideAutocomplete();
        return;
    }
    const ignoredKeys = [
        "ArrowUp",
        "ArrowDown",
        "ArrowLeft",
        "ArrowRight",
        "Shift",
        "Control",
        "Alt",
        "Meta",
        "CapsLock",
        "Tab",
    ];
    if (!ignoredKeys.includes(event.key)) filterAutocomplete();
}

function moveAutocompleteSelection(dir) {
    if (!isAutocompleteOpen() || !activeSuggestionList.length) {
        return CodeMirror.Pass;
    }
    const len = activeSuggestionList.length;
    activeSuggestionIndex = (activeSuggestionIndex + dir + len) % len;
    renderAutocompleteItems();
    positionAutocomplete();
    const marcada = autocompleteContainer.querySelector(".autocomplete-item.selected");
    if (marcada && marcada.scrollIntoView) {
        marcada.scrollIntoView({ block: "nearest" });
    }
    return true;
}

function confirmAutocompleteSelection() {
    if (!isAutocompleteOpen() || !activeSuggestionList.length) {
        return CodeMirror.Pass;
    }
    const tag = activeSuggestionList[activeSuggestionIndex] || activeSuggestionList[0];
    if (tag && activeTrigger) {
        insertTag(tag, activeTrigger.lastHyphen, activeTrigger.cursorPosition);
    }
    hideAutocomplete();
    return true;
}

function filterAutocomplete() {
    const cursorPosition = editor.getCursor();
    const line = editor.getLine(cursorPosition.line);
    const uptoCursor = line.slice(0, cursorPosition.ch);
    const lastHyphen = uptoCursor.lastIndexOf("-");
    if (lastHyphen === -1) {
        hideAutocomplete();
        return;
    }
    if (lastHyphen !== 0 && !/\s/.test(line[lastHyphen - 1])) {
        hideAutocomplete();
        return;
    }
    const query = uptoCursor.slice(lastHyphen + 1).toLowerCase();
    if (query.length > 25 || /\s/.test(query)) {
        hideAutocomplete();
        return;
    }
    const filteredTags = all_Tags.filter((tag) => tag.name.toLowerCase().includes(query));
    if (!filteredTags.length) {
        hideAutocomplete();
        return;
    }

    activeSuggestionList = filteredTags;
    activeSuggestionIndex = 0;
    activeTrigger = {
        lastHyphen,
        cursorPosition: { line: cursorPosition.line, ch: cursorPosition.ch },
    };

    renderAutocompleteItems();
    positionAutocomplete();
}

function renderAutocompleteItems() {
    autocompleteContainer.innerHTML = "";
    activeSuggestionList.forEach((tag, i) => {
        const item = document.createElement("div");
        item.classList.add("autocomplete-item");
        if (i === activeSuggestionIndex) item.classList.add("selected");

        const nameSpan = document.createElement("span");
        nameSpan.textContent = tag.name;
        nameSpan.className = "flex-1 font-semibold";

        const labelSpan = document.createElement("span");
        labelSpan.textContent = TAG_LABELS[tag.name] || "";
        labelSpan.className = "text-[11px] opacity-75 ml-3 font-sans";

        item.appendChild(nameSpan);
        item.appendChild(labelSpan);

        item.onclick = () => insertTag(tag, activeTrigger.lastHyphen, activeTrigger.cursorPosition);
        autocompleteContainer.appendChild(item);
    });
    autocompleteContainer.style.display = "flex";
}

function positionAutocomplete() {
    autocompleteContainer.style.flexDirection = "column";
    const coords = editor.cursorCoords(true, "window");
    const windowHeight = window.innerHeight;
    if (windowHeight - coords.bottom < 260) {
        autocompleteContainer.style.top = "auto";
        autocompleteContainer.style.bottom = windowHeight - coords.top + 5 + "px";
    } else {
        autocompleteContainer.style.bottom = "auto";
        autocompleteContainer.style.top = coords.bottom + 5 + "px";
    }
    autocompleteContainer.style.left = coords.left + 5 + "px";
}

function insertTag(tag, lastHyphen, cursorPosition, isDirect = false) {
    if (isDirect) {
        const selection = editor.getSelection();
        if (selection && !noCloseTags.includes(tag.name)) {
            editor.replaceSelection(`@${tag.name}@\n${selection}\n@/${tag.name}@`);
        } else {
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
        }
    } else {
        const line = editor.getLine(cursorPosition.line);
        const beforeHyphen = line.slice(0, lastHyphen);
        const afterCursor = line.slice(cursorPosition.ch);
        const newLine =
            beforeHyphen +
            (tag.name === "Lorem"
                ? `${Lorem[Math.floor(Math.random() * Lorem.length)]}`
                : noCloseTags.includes(tag.name)
                ? `@${tag.name}@\n`
                : `@${tag.name}@\n@/${tag.name}@`) +
            afterCursor;
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
    hideAutocomplete();
}

editor.on("keyup", handleKeyUp);
editor.on("scroll", hideAutocomplete);

const cmWrapper = editor.getWrapperElement ? editor.getWrapperElement() : null;
if (cmWrapper) {
    cmWrapper.addEventListener(
        "keydown",
        (event) => {
            if (!isAutocompleteOpen()) return;
            switch (event.key) {
                case "ArrowDown":
                    event.preventDefault();
                    event.stopPropagation();
                    moveAutocompleteSelection(1);
                    return;
                case "ArrowUp":
                    event.preventDefault();
                    event.stopPropagation();
                    moveAutocompleteSelection(-1);
                    return;
                case "Enter":
                case "Tab":
                    event.preventDefault();
                    event.stopPropagation();
                    confirmAutocompleteSelection();
                    return;
                case "Escape":
                    event.stopPropagation();
                    hideAutocomplete();
                    return;
            }
        },
        true,
    );
}

// --- GENERADOR DE PDF ---
const PREVIEW = document.getElementById("preview");
const EMPTY_STATE = document.getElementById("empty-state");
const DOWNLOAD_BTN = document.getElementById("downloadPdfBtn");
let lastPdfUrl = null;
let docMeta = null;

async function generatePDF() {
    const btn = document.getElementById("generateBtn");
    if (btn.disabled) return;
    const originalText = btn.innerHTML;
    btn.disabled = true;
    btn.innerHTML =
        '<span class="material-symbols-outlined animate-spin text-[18px]">progress_activity</span><span>Compilando...</span>';

    await new Promise((r) => setTimeout(r, 40));

    try {
        if (currentEditorMode === "visual") {
            syncVisualToSource();
        }
        localStorage.setItem("SAVE", editor.getValue());
        savedText = editor.getValue();
        indexEntries = [];
        docMeta = null;

        const jsPDF = window.jspdf && window.jspdf.jsPDF;
        if (!jsPDF) throw new Error("No se pudo cargar jsPDF");
        const doc = new jsPDF({ orientation: "portrait", unit: "mm", format: "letter" });

        const contentPages = ProcessText(doc);

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

                    const x =
                        tag.align === "center" ? doc.internal.pageSize.width / 2 : tag.margen || 25.4;
                    renderInlineStyles(doc, line, x, Y * LINE_H + BASELINE_OFFSET, {
                        align: tag.align || "left",
                        fontSize: tag.fontSize || 12,
                        fontStyle: tag.fontStyle || "normal",
                    }, markdownState);
                });
                addPageNumber(doc, pageIndex + 1);

                if (pageIndex % 5 === 0) await new Promise((r) => setTimeout(r, 0));
            }
        }

        doc.setProperties({
            title: (docMeta && docMeta.title) || "Documento APA",
            subject: "Documento elaborado con Normas APA 7ma edición (CodePDF)",
            author: (docMeta && docMeta.author) || "",
            creator: "CodePDF - APA Generator Studio",
        });

        const pdfBlob = doc.output("blob");
        if (lastPdfUrl) URL.revokeObjectURL(lastPdfUrl);
        lastPdfUrl = URL.createObjectURL(pdfBlob);
        PREVIEW.src = lastPdfUrl;
        EMPTY_STATE.style.display = "none";
        if (DOWNLOAD_BTN) {
            DOWNLOAD_BTN.disabled = false;
            DOWNLOAD_BTN.classList.remove("opacity-40", "cursor-not-allowed");
        }
        showToast("PDF generado correctamente", "success");
    } catch (error) {
        console.error(error);
        showToast("Error: " + error.message, "error");
    } finally {
        btn.disabled = false;
        btn.innerHTML = originalText;
    }
}

function downloadPdf() {
    if (!lastPdfUrl) return;
    const a = document.createElement("a");
    a.href = lastPdfUrl;
    const base = (docMeta && docMeta.title ? docMeta.title : "documento_apa")
        .replace(/\*/g, "")
        .replace(/[\\/:*?"<>|]/g, "")
        .trim()
        .replace(/\s+/g, "_")
        .slice(0, 60) || "documento_apa";
    a.download = base + ".pdf";
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    showToast("Descarga de PDF iniciada", "success");
}

function openLocalFile() {
    const input = document.getElementById("file-input");
    if (!input) return;
    input.value = "";
    input.click();
}

function handleFileSelected(event) {
    const file = event.target.files && event.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
        const content = String(reader.result || "");
        editor.setValue(content);
        if (currentEditorMode === "visual") {
            visualBlocks = parseSourceToBlocks(content);
            renderVisualBlocks();
        }
        showToast("Archivo cargado: " + file.name, "success");
    };
    reader.onerror = () => showToast("No se pudo leer el archivo", "error");
    reader.readAsText(file);
}

function addPageNumber(doc, pageNumber) {
    doc.setFont("times", "normal");
    doc.setFontSize(12);
    doc.text(`${pageNumber}`, doc.internal.pageSize.width - APA_MARGIN, 12.7, {
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
            i++;
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
        let cleanLine = testLine.replace(/\*/g, "");

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

function getMaxLinesPerPage(doc) {
    return Math.floor((doc.internal.pageSize.height - 40.8) / LINE_H);
}

function splitBlockParts(tagLines) {
    const joined = tagLines.join("\n");
    return joined.split(/\n|-\|/).map((p) => p.trim());
}

function referenceKey(referenceText) {
    let first = (referenceText && referenceText.parte1) || "";
    if (Array.isArray(first)) first = first[0] || "";
    return String(first).replace(/\*/g, "").trim().toLowerCase();
}

function sortReferencesGroups(Textoo) {
    const sortInto = (texto) => {
        const entradas = Object.keys(texto)
            .sort((a, b) => Number(a.replace("parte", "")) - Number(b.replace("parte", "")))
            .map((k) => texto[k]);
        entradas.sort((a, b) => referenceKey({ parte1: a }).localeCompare(referenceKey({ parte1: b }), "es"));
        const ordenado = {};
        entradas.forEach((e, idx) => { ordenado[`parte${idx + 1}`] = e; });
        return ordenado;
    };

    let i = 0;
    while (i < Textoo.length) {
        if (Textoo[i].tag.name === "referencias") {
            let fin = i;
            while (fin + 1 < Textoo.length && Textoo[fin + 1].tag.name === "referencias") fin++;
            for (let k = i; k <= fin; k++) {
                Textoo[k].text = sortInto(Textoo[k].text);
            }
            if (fin > i) {
                const grupo = Textoo.slice(i, fin + 1);
                grupo.sort((a, b) => referenceKey(a.text).localeCompare(referenceKey(b.text), "es"));
                Textoo.splice(i, fin - i + 1, ...grupo);
            }
            i = fin + 1;
        } else {
            i++;
        }
    }
}

function ProcessText(doc) {
    let Textoo = [];
    const lines = editor.getValue().split("\n");
    let CurrentId = 1;

    lines.forEach((line, index) => {
        all_Tags.forEach((tag) => {
            const openTag = `@${tag.name}@`;
            const closeTag = `@/${tag.name}@`;

            if (line.includes(openTag)) {
                let tagContent = [];
                const afterOpen = line.slice(line.indexOf(openTag) + openTag.length);

                if (!["pagebreak", "linebreak", "Indice"].includes(tag.name)) {
                    if (afterOpen.includes(closeTag)) {
                        const inlineContent = afterOpen.slice(0, afterOpen.indexOf(closeTag)).trim();
                        if (inlineContent) tagContent.push(inlineContent);
                    } else {
                        if (afterOpen.trim()) tagContent.push(afterOpen.trim());
                        let j = 1;
                        while (
                            lines[index + j] !== undefined &&
                            !lines[index + j].includes(closeTag)
                        ) {
                            tagContent.push(lines[index + j]);
                            j++;
                        }
                        if (lines[index + j] !== undefined && lines[index + j].includes(closeTag)) {
                            const beforeClose = lines[index + j].slice(0, lines[index + j].indexOf(closeTag)).trim();
                            if (beforeClose) tagContent.push(beforeClose);
                        }
                    }
                }

                const partes = {};
                splitBlockParts(tagContent).forEach((p, i) => {
                    if (p) partes[`parte${i + 1}`] = p;
                });

                if (tag.name === "Portada") {
                    const ordenados = Object.keys(partes)
                        .sort((a, b) => Number(a.replace("parte", "")) - Number(b.replace("parte", "")))
                        .map((k) => partes[k]);
                    docMeta = {
                        title: ordenados[1] || "",
                        author: ordenados.slice(2).join(", "),
                    };
                }

                let anchoCalculado = doc.internal.pageSize.width - 50.8;
                let firstW = anchoCalculado;
                let otherW = anchoCalculado;

                if (tag.inde) {
                    firstW = anchoCalculado - APA_INDENT;
                } else if (tag.name === "citaLarga") {
                    firstW = anchoCalculado - APA_INDENT;
                    otherW = anchoCalculado - APA_INDENT;
                } else if (tag.name === "lista") {
                    firstW = anchoCalculado - APA_INDENT;
                    otherW = anchoCalculado - 19.05;
                } else if (tag.name === "referencias") {
                    firstW = anchoCalculado;
                    otherW = anchoCalculado - APA_INDENT;
                }

                for (let key in partes) {
                    doc.setFont("times", tag.fontStyle || "normal");
                    doc.setFontSize(tag.fontSize || 12);
                    if (tag.name === "parr" || tag.name === "palabrasClave" || tag.name === "Portada") {
                        partes[key] = [partes[key]];
                    } else {
                        partes[key] = wrapText(doc, partes[key], firstW, otherW);
                    }
                }
                Textoo.push({ text: partes, tag, Id: CurrentId++ });
            }
        });
    });

    sortReferencesGroups(Textoo);
    return organizeTextByPages(Textoo, getMaxLinesPerPage(doc), doc);
}

function organizeTextByPages(Textoo, maxLinesPerPage, docc) {
    let pages = [];
    let currentPage = [];
    let currentLineCount = 0;
    let IdCurrent = 0;
    let Retraso = { Tx: "", tag: null };
    let indexStartPageIndices = [];
    let prevElementName = "";
    let OnePagueEtiq = {
        Intro: false,
        Indi: false,
        Conclu: false,
        Port: false,
        Ref: false,
        Resu: false,
    };

    function pushWrappedLines(rawLine, tag, prefix = "") {
        docc.setFontSize(tag.fontSize || 12);
        docc.setFont("times", tag.fontStyle || "normal");

        let firstW = docc.internal.pageSize.width - 50.8;
        let otherW = docc.internal.pageSize.width - 50.8;
        if (tag.inde) firstW -= APA_INDENT;

        const splits = wrapText(docc, prefix + rawLine, firstW, otherW);
        splits.forEach((s, idx) => {
            if (s && s.trim() !== "") {
                if (currentLineCount >= maxLinesPerPage) {
                    pages.push(currentPage);
                    currentPage = [];
                    currentLineCount = 0;
                }
                let curMargen = tag.margen;
                if (idx === 0 && tag.inde) curMargen += APA_INDENT;

                currentPage.push({ line: s, Y: currentLineCount + 1, tag: { ...tag, margen: curMargen } });
                currentLineCount++;
            }
        });
    }

    Textoo.forEach((item) => {
        const { text, tag, Id } = item;

        if (Retraso.Tx && tag.name !== "parr") {
            Retraso.Tx = "";
            Retraso.tag = null;
        }

        if (!prevElementName) prevElementName = "";
        switch (tag.name) {
            case "pagebreak":
                if (currentPage.length > 0) pages.push(currentPage);
                currentPage = [];
                currentLineCount = 0;
                Retraso.Tx = "";
                Retraso.tag = null;
                prevElementName = tag.name;
                return;
            case "linebreak":
                currentLineCount++;
                Retraso.Tx = "";
                Retraso.tag = null;
                prevElementName = tag.name;
                return;
            case "Indice":
                if (currentPage.length > 0) pages.push(currentPage);
                indexStartPageIndices.push(pages.length);
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
                prevElementName = tag.name;
                return;
        }

        if (prevElementName === "Resumen" && tag.name !== "palabrasClave" && currentPage.length > 0) {
            pages.push(currentPage);
            currentPage = [];
            currentLineCount = 0;
        } else if (tag.name === "palabrasClave" && prevElementName === "Resumen" && currentLineCount > 0) {
            currentLineCount++;
        }

        Object.values(text).forEach((lines) => {
            lines.forEach((line, lineIdx) => {
                if (currentLineCount >= maxLinesPerPage) {
                    pages.push(currentPage);
                    currentPage = [];
                    currentLineCount = 0;
                }

                switch (tag.name) {
                    case "Portada": {
                        if (!OnePagueEtiq.Port) {
                            if (currentPage.length > 0) pages.push(currentPage);
                            currentPage = [];
                            currentLineCount = 0;

                            const pageWidth = docc.internal.pageSize.width;
                            const anchoTexto = pageWidth - 50.8;

                            const pushCenteredLines = (s, y, fontSize, fontStyle) => {
                                const str = Array.isArray(s) ? s.join(" ") : String(s || "");
                                docc.setFont("times", fontStyle);
                                docc.setFontSize(fontSize);
                                const parts = docc.splitTextToSize(str, anchoTexto);
                                parts.forEach((l) => {
                                    currentPage.push({
                                        line: l,
                                        Y: y,
                                        tag: { name: "Portada", fontSize, fontStyle, margen: pageWidth / 2, align: "center" },
                                    });
                                    y++;
                                });
                                return y;
                            };

                            const partesOrdenadas = Object.keys(text)
                                .sort((a, b) => Number(a.replace("parte", "")) - Number(b.replace("parte", "")))
                                .map((k) => (Array.isArray(text[k]) ? text[k].join(" ") : String(text[k] || "")));

                            const titleIndex = partesOrdenadas.length >= 2 ? 1 : 0;

                            if (partesOrdenadas.length > 0) {
                                const altoDe = (parte) => {
                                    docc.setFont("times", "normal");
                                    docc.setFontSize(12);
                                    return docc.splitTextToSize(parte, anchoTexto).length;
                                };

                                if (titleIndex > 0) {
                                    pushCenteredLines(partesOrdenadas[0], 1, 12, "normal");
                                }

                                pushCenteredLines(partesOrdenadas[titleIndex], 3, 12, "bold");

                                const resto = partesOrdenadas.slice(titleIndex + 1);
                                if (resto.length) {
                                    const filaInicial = 5;
                                    const ultimaFila = maxLinesPerPage;
                                    const lineasResto = resto.reduce((s, p) => s + altoDe(p), 0);
                                    const huecos = resto.length - 1;
                                    const filasLibres = (ultimaFila - filaInicial + 1) - lineasResto;
                                    const hueco = huecos > 0
                                        ? Math.max(1, Math.floor(filasLibres / huecos))
                                        : Math.max(1, Math.floor((filasLibres - 1) / 2));
                                    let y = filaInicial;
                                    resto.forEach((parte) => {
                                        if (y > ultimaFila) return;
                                        y = pushCenteredLines(parte, y, 12, "normal");
                                        y += hueco;
                                    });
                                }
                            }

                            OnePagueEtiq.Port = true;
                            pages.push(currentPage);
                            currentPage = [];
                        }
                        break;
                    }

                    case "palabrasClave":
                        pushWrappedLines(line, tag, lineIdx === 0 ? "*Palabras clave:* " : "");
                        break;

                    case "citaLarga":
                        currentPage.push({ line, Y: currentLineCount + 1, tag: { ...tag, margen: 38.1 } });
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
                                    name: "referencias",
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

                        let refMargen = (lineIdx === 0) ? 25.4 : 38.1;
                        currentPage.push({ line, Y: currentLineCount + 1, tag: { ...tag, margen: refMargen } });
                        currentLineCount++;
                        break;

                    case "lista":
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
                        if (Retraso.Tx) {
                            currentLineCount--;

                            docc.setFontSize(Retraso.tag.fontSize || 12);
                            docc.setFont("times", Retraso.tag.fontStyle || "bold");
                            let titleMargin = Retraso.tag.margen;
                            let titleTextWidth = docc.getTextWidth(Retraso.Tx.replace(/\*/g, "").trim());

                            docc.setFontSize(tag.fontSize || 12);
                            docc.setFont("times", tag.fontStyle || "normal");

                            let spaceWidth = docc.getTextWidth(" ");
                            let startX = titleMargin + titleTextWidth + Math.max(spaceWidth, 1.5);

                            let firstWordW = docc.internal.pageSize.width - 25.4 - startX;
                            let otherLineW = docc.internal.pageSize.width - 50.8;
                            let splits = wrapText(docc, line, firstWordW, otherLineW);

                            Retraso.Tx = "";
                            Retraso.tag = null;

                            splits.forEach((s, idx) => {
                                if (s && s.trim() !== "") {
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
                            pushWrappedLines(line, tag);
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
                                    name: tag.name,
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
                            blockMargen += APA_INDENT;
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
                                title: line.replace(/\*/g, "").trim().replace(/\.$/, ""),
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
                                title: line.replace(/\*/g, "").trim(),
                                page: pages.length + 1,
                                level: lvl,
                            });
                        }
                        break;
                }
                IdCurrent = Id;
            });
        });

        if (["Portada", "Indice", "Introduccion", "Conclusion"].includes(tag.name)) {
            if (currentPage.length > 0) {
                pages.push(currentPage);
                currentPage = [];
                currentLineCount = 0;
            }
        }
        prevElementName =
            tag.name === "palabrasClave" && prevElementName === "Resumen"
                ? "Resumen"
                : tag.name;
    });
    if (currentPage.length > 0) pages.push(currentPage);
    return AggIndice(pages, docc, indexStartPageIndices, maxLinesPerPage);
}

function AggIndice(pages, doc, indexStartPageIndices, maxLinesPerPage) {
    if (!Array.isArray(indexStartPageIndices) || indexStartPageIndices.length === 0) return pages;

    const placeholderIndex = indexStartPageIndices[0];

    if (indexStartPageIndices.length > 1) {
        for (let k = indexStartPageIndices.length - 1; k >= 1; k--) {
            const q = indexStartPageIndices[k];
            pages.splice(q, 1);
            indexEntries.forEach((e) => {
                if (e.page > q + 1) e.page--;
            });
        }
    }

    const hojaMax = maxLinesPerPage || getMaxLinesPerPage(doc);
    const entriesPerPage = Math.max(1, hojaMax - 2);
    const numIndexPages = Math.ceil(indexEntries.length / entriesPerPage) || 1;
    const extraPages = numIndexPages - 1;

    if (extraPages > 0) {
        indexEntries.forEach((e) => {
            if (e.page > placeholderIndex + 1) {
                e.page += extraPages;
            }
        });
    }

    let indexPages = [];
    let currentIdxPage = [
        {
            line: "Índice",
            Y: 1,
            tag: { name: "Indice", fontSize: 14, fontStyle: "bold", margen: 105, align: "center" },
        },
    ];
    let yCounter = 3;

    indexEntries.forEach((entry) => {
        if (yCounter > hojaMax) {
            indexPages.push(currentIdxPage);
            currentIdxPage = [
                { line: "Índice (Cont.)", Y: 1, tag: { name: "Indice", fontSize: 12, fontStyle: "italic", margen: 105, align: "center" } }
            ];
            yCounter = 3;
        }
        const rawTitle = entry.title.replace(/\*/g, "").trim();

        doc.setFontSize(11);
        doc.setFont("times", "normal");

        const apaIndent = APA_INDENT;
        const currentIndent = APA_MARGIN + (entry.level > 1 ? (entry.level - 1) * apaIndent : 0);

        const dotWidth = doc.getTextWidth(".");
        const pageNumStr = " " + entry.page.toString();
        const fixWidth = doc.getTextWidth(pageNumStr);
        const usableWidth = doc.internal.pageSize.width - APA_MARGIN - currentIndent;

        let currentTitle = rawTitle;
        let titleWidth = doc.getTextWidth(currentTitle);

        if (titleWidth > usableWidth - fixWidth - 10) {
            while (doc.getTextWidth(currentTitle + "...") > usableWidth - fixWidth - 10 && currentTitle.length > 0) {
                currentTitle = currentTitle.slice(0, -1);
            }
            currentTitle += "...";
            titleWidth = doc.getTextWidth(currentTitle);
        }

        const gap = usableWidth - titleWidth - fixWidth;
        const numDots = Math.max(0, Math.floor(gap / dotWidth));

        let textLine = rawTitle.length > 0 ? currentTitle + ".".repeat(numDots) + pageNumStr : currentTitle;

        currentIdxPage.push({
            line: textLine,
            Y: yCounter++,
            tag: { name: "Indice", fontSize: 11, fontStyle: "normal", margen: currentIndent, align: "left" },
        });
    });

    if (currentIdxPage.length > 0) indexPages.push(currentIdxPage);

    pages.splice(placeholderIndex, 1, ...indexPages);
    return pages;
}

// --- SPLITTER ---
let currentSplit = 46;

function applySplit(pct) {
    currentSplit = Math.min(80, Math.max(22, pct));
    const pane = document.getElementById("editor-pane");
    if (pane) {
        pane.style.flex = `0 0 ${currentSplit}%`;
        pane.style.maxWidth = `${currentSplit}%`;
    }
}

function initSplitter() {
    const splitter = document.getElementById("splitter");
    if (!splitter) return;

    const saved = parseFloat(localStorage.getItem("SPLIT"));
    applySplit(isFinite(saved) ? saved : 46);

    let dragging = false;
    splitter.addEventListener("mousedown", (e) => {
        dragging = true;
        hideAutocomplete();
        e.preventDefault();
    });
    window.addEventListener("mousemove", (e) => {
        if (!dragging) return;
        const box = splitter.parentElement.getBoundingClientRect();
        applySplit(((e.clientX - box.left) / box.width) * 100);
        if (editor.refresh) editor.refresh();
    });
    window.addEventListener("mouseup", () => {
        if (!dragging) return;
        dragging = false;
        localStorage.setItem("SPLIT", String(currentSplit));
        if (editor.refresh) editor.refresh();
    });
}

function showToast(message, type) {
    const container = document.getElementById("toast-container");
    while (container.children.length >= 3) container.firstChild.remove();
    const toast = document.createElement("div");
    toast.className = `${type === "success" ? "bg-primary" : "bg-red-600"} text-white text-xs font-semibold px-4 py-2.5 rounded-xl shadow-xl mb-2.5 transition-all duration-300 flex items-center gap-2`;
    toast.textContent = message;
    container.appendChild(toast);
    setTimeout(() => {
        toast.style.opacity = "0";
        setTimeout(() => toast.remove(), 400);
    }, 2600);
}

function toggleTheme() {
    const isDarkNow = !document.documentElement.classList.contains("dark");
    document.documentElement.classList.toggle("dark", isDarkNow);
    document.body.classList.toggle("dark", isDarkNow);

    editor.setOption("theme", isDarkNow ? "monokai" : "default");

    const icon = document.getElementById("theme-icon");
    if (icon) icon.textContent = isDarkNow ? "light_mode" : "dark_mode";
}

function saveToLocal() {
    if (currentEditorMode === "visual") syncVisualToSource();
    localStorage.setItem("SAVE", editor.getValue());
    savedText = editor.getValue();
    showSaveStatus();
    showToast("Progreso guardado localmente", "success");
}

function downloadSource() {
    if (currentEditorMode === "visual") syncVisualToSource();
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
    showToast("Descarga de código fuente iniciada", "success");
}

// =====================================================================
// EXPORTADOR DE ARCHIVOS SEPARADOS DEL PROYECTO (index.html, style.css, Logic.js)
// =====================================================================
let currentProjectFileTab = "html";

function getSeparatedProjectFiles() {
    const appStyleEl = document.getElementById("app-custom-styles");
    const appScriptEl = document.getElementById("app-logic-script");
    const cssContent = appStyleEl ? appStyleEl.innerHTML.trim() : "";
    const jsContent = appScriptEl ? appScriptEl.innerHTML.trim() : "";

    // Generar index.html limpio que referencia style/style.css y js/Logic.js
    const cloneDoc = document.documentElement.cloneNode(true);
    const styleEl = cloneDoc.querySelector("#app-custom-styles");
    if (styleEl) {
        const linkEl = document.createElement("link");
        linkEl.setAttribute("rel", "stylesheet");
        linkEl.setAttribute("href", "style/style.css");
        styleEl.replaceWith(linkEl);
    }
    const scriptEl = cloneDoc.querySelector("#app-logic-script");
    if (scriptEl) {
        const extScript = document.createElement("script");
        extScript.setAttribute("src", "js/Logic.js");
        scriptEl.replaceWith(extScript);
    }
    // Limpiar instancia dinámica de CodeMirror dentro del clon para dejar solo el textarea original
    const cmView = cloneDoc.querySelector("#source-editor-view");
    if (cmView) {
        cmView.innerHTML = `<textarea id="code" name="code"></textarea>\n                            <div id="autocomplete-container"></div>`;
    }

    const htmlContent = "<!DOCTYPE html>\n" + cloneDoc.outerHTML;
    return {
        html: { filename: "index.html", content: htmlContent },
        css: { filename: "style.css", content: cssContent },
        js: { filename: "Logic.js", content: jsContent },
    };
}

function openProjectFilesModal() {
    const modal = document.getElementById("project-files-modal");
    if (!modal) return;
    modal.classList.remove("hidden");
    modal.classList.add("flex");
    selectProjectFileTab("html");
}

function closeProjectFilesModal() {
    const modal = document.getElementById("project-files-modal");
    if (!modal) return;
    modal.classList.add("hidden");
    modal.classList.remove("flex");
}

function selectProjectFileTab(tab) {
    currentProjectFileTab = tab;
    const files = getSeparatedProjectFiles();
    const viewer = document.getElementById("project-file-viewer");
    if (viewer && files[tab]) {
        viewer.value = files[tab].content;
    }
    ["html", "css", "js"].forEach((t) => {
        const btn = document.getElementById(`tab-file-${t}`);
        if (!btn) return;
        btn.className =
            t === tab
                ? "px-3 py-1.5 rounded-lg text-xs font-mono font-semibold bg-primary text-white"
                : "px-3 py-1.5 rounded-lg text-xs font-mono font-semibold bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300";
    });
}

function copyCurrentProjectFile() {
    const viewer = document.getElementById("project-file-viewer");
    if (!viewer) return;
    viewer.select();
    document.execCommand("copy");
    showToast("Código copiado al portapapeles", "success");
}

function downloadCurrentProjectFile() {
    const files = getSeparatedProjectFiles();
    const fileObj = files[currentProjectFileTab];
    if (!fileObj) return;
    const blob = new Blob([fileObj.content], { type: "text/plain;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = fileObj.filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    showToast(`Descargado: ${fileObj.filename}`, "success");
}

// --- INICIALIZACIÓN ---
buildToolbar();
buildVisualBrushBar();
initSplitter();
const fileInput = document.getElementById("file-input");
if (fileInput) fileInput.addEventListener("change", handleFileSelected);
