// Consulta general de guías: GET /api/Guia/lista (datos de SQL Server)
(function () {
    document.getElementById("encabezado").innerHTML = header(Boolean(obtenerUsuario()));
    document.getElementById("pie").innerHTML = footer(false);

    const cuerpo = document.getElementById("tablaGuiasCuerpo");
    const mensaje = document.getElementById("mensajeGuias");
    const contador = document.getElementById("contadorGuias");

    function mostrarError(texto) {
        mensaje.textContent = texto;
        mensaje.hidden = false;
    }

    function celda(texto) {
        const td = document.createElement("td");
        td.textContent = texto;
        return td;
    }

    function filaUnica(texto) {
        const tr = document.createElement("tr");
        const td = celda(texto);
        td.colSpan = 4;
        tr.appendChild(td);
        return tr;
    }

    function pintarTabla(guias) {
        cuerpo.replaceChildren();
        if (!guias.length) {
            cuerpo.appendChild(filaUnica("No hay guías registradas."));
            contador.textContent = "";
            return;
        }
        guias.forEach((g) => {
            const tr = document.createElement("tr");
            tr.append(celda(g.idGuia), celda(g.titulo), celda(g.categoria), celda(g.neurodivergencia));
            cuerpo.appendChild(tr);
        });
        contador.textContent = guias.length + " guía(s) encontradas.";
    }

    async function cargarGuias() {
        mensaje.hidden = true;
        cuerpo.replaceChildren(filaUnica("Cargando guías..."));
        try {
            const respuesta = await fetch(API_GUIA + "/lista");
            const resultado = await respuesta.json().catch(() => ({}));
            if (!respuesta.ok || !resultado.isSuccess) {
                throw new Error(resultado.respuesta || "La API respondió con el código " + respuesta.status + ".");
            }
            pintarTabla(resultado.response);
        } catch (error) {
            cuerpo.replaceChildren();
            contador.textContent = "";
            mostrarError(error.message || "No se pudo conectar con la API. Verifica que el proyecto .NET esté en ejecución.");
        }
    }

    cargarGuias();
})();