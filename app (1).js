/* LUMO Travels — Generador de Propuestas */

function fileToDataURL(file) {
    return new Promise(function(resolve) {
        var r = new FileReader();
        r.onload  = function(e) { resolve(e.target.result); };
        r.onerror = function()  { resolve(null); };
        r.readAsDataURL(file);
    });
}

function cargarYCentrar(img, dataURL, ph) {
    return new Promise(function(resolve) {
        img.onload = function() {
            var cW = 794, cH = 270;
            var ratio = img.naturalWidth / img.naturalHeight;
            var contRatio = cW / cH;
            if (ratio > contRatio) {
                var renderW = cH * ratio;
                img.style.width  = renderW + "px";
                img.style.height = "270px";
                img.style.top    = "0px";
                img.style.left   = -((renderW - cW) / 2) + "px";
            } else {
                var renderH = cW / ratio;
                img.style.width  = "794px";
                img.style.height = renderH + "px";
                img.style.top    = -((renderH - cH) / 2) + "px";
                img.style.left   = "0px";
            }
            img.style.display = "block";
            if (ph) { ph.style.display = "none"; }
            resolve();
        };
        img.onerror = function() { resolve(); };
        img.src = dataURL;
    });
}

async function prepararTemplate(datos) {
    var hotel      = datos.hotel;
    var fechas     = datos.fechas;
    var precio     = datos.precio;
    var inclusiones= datos.inclusiones;
    var legales    = datos.legales;
    var foto1      = datos.foto1;
    var foto2      = datos.foto2;

    document.getElementById("pdf-hotel").innerText   = hotel;
    document.getElementById("pdf-fechas").innerText  = "Fechas: " + fechas;
    document.getElementById("pdf-precio").innerText  = precio;
    document.getElementById("pdf-legales").innerText = legales || "Tarifa sujeta a disponibilidad.";
    document.getElementById("badge-dest").innerText  = hotel.split(",")[0].trim();

    var cont = document.getElementById("pdf-inclusiones");
    cont.innerHTML = "";
    var lines = inclusiones.split("\n");
    for (var i = 0; i < lines.length; i++) {
        var t = lines[i].replace(/✅/g, "").trim();
        if (!t) { continue; }
        var d = document.createElement("div");
        d.className = "pc-inc-item";
        d.innerText = t;
        cont.appendChild(d);
    }

    var promises = [];

    async function loadPhoto(inputEl, imgId, phId) {
        if (!inputEl || !inputEl.files || !inputEl.files[0]) { return; }
        var url = await fileToDataURL(inputEl.files[0]);
        if (!url) { return; }
        promises.push(cargarYCentrar(
            document.getElementById(imgId),
            url,
            document.getElementById(phId)
        ));
    }

    await loadPhoto(foto1, "pdf-img1", "ph1");
    await loadPhoto(foto2, "pdf-img2", "ph2");
    await Promise.all(promises);
    await new Promise(function(r) { setTimeout(r, 500); });
}

async function generarTodo() {
    var hotel       = document.getElementById("hotel").value.trim();
    var fechas      = document.getElementById("fechas").value.trim();
    var precio      = document.getElementById("precio").value.trim();
    var inclusiones = document.getElementById("inclusiones").value.trim();
    var legales     = document.getElementById("legales").value.trim();

    if (!hotel || !fechas || !precio || !inclusiones) {
        alert("Por favor completa: Destino, Fechas, Precio e Inclusiones.");
        return;
    }

    document.getElementById("loading-screen").style.display = "flex";

    try {
        await prepararTemplate({
            hotel:hotel, fechas:fechas, precio:precio,
            inclusiones:inclusiones, legales:legales,
            foto1: document.getElementById("foto1"),
            foto2: document.getElementById("foto2")
        });

        var canvas = await html2canvas(document.getElementById("pdf-template"), {
            scale: 2,
            useCORS: true,
            allowTaint: true,
            backgroundColor: "#ffffff",
            width: 794,
            windowWidth: 794,
            scrollX: 0,
            scrollY: 0,
            foreignObjectRendering: false,
            logging: false
        });

        var jsPDF  = window.jspdf.jsPDF;
        var imgData = canvas.toDataURL("image/jpeg", 0.95);
        var pdfW = 794;
        var pdfH = Math.round(canvas.height / 2);

        var pdf = new jsPDF({
            orientation: "portrait",
            unit: "px",
            format: [pdfW, pdfH],
            compress: true
        });
        pdf.addImage(imgData, "JPEG", 0, 0, pdfW, pdfH, "", "FAST");

        var destClean = hotel.split(",")[0].trim().replace(/\s+/g, "_");
        pdf.save("Cotizacion_LUMO_Travels_" + destClean + ".pdf");

        var msgWA = "Hola! Te comparto la propuesta de *LUMO Travels* para tu viaje.\n\n"
            + " Destino: *" + hotel + "*\n"
            + " Fechas: " + fechas + "\n"
            + " Inversion: *" + precio + "*\n\n"
            + "Revisa el PDF adjunto con todos los detalles.\n"
            + "Agencia legalmente registrada (*RNT 278559*).\n\n"
            + " Te cuadra? Si me das el OK verificamos disponibilidad ahora mismo.";
        try { navigator.clipboard.writeText(msgWA); } catch(e) {}

    } catch(err) {
        console.error("Error PDF:", err);
        alert("Error al generar el PDF. Revisa la consola.");
    } finally {
        document.getElementById("loading-screen").style.display = "none";
    }
}

document.addEventListener("DOMContentLoaded", function() {
    var btn = document.getElementById("btn-generar");
    if (btn) {
        btn.addEventListener("click", generarTodo);
        console.log("LUMO Travels: listo.");
    }
});
