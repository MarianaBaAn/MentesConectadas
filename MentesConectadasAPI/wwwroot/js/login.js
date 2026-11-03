// Login de Mentes Conectadas conectado a la API: POST /api/Auth/login
(function () {
  if (obtenerUsuario()) { window.location.replace("index.html"); return; }

  document.getElementById("encabezado").innerHTML = header(false);
  document.getElementById("pie").innerHTML = footer();

  const formLogin = document.getElementById("formLogin");
  const correo = document.getElementById("login-email");
  const password = document.getElementById("login-pass");
  const btnLogin = document.getElementById("btnLogin");
  const mensajeLogin = document.getElementById("mensajeLogin");

  function mostrarError(texto) { mensajeLogin.textContent = texto; mensajeLogin.hidden = false; }

  formLogin.addEventListener("submit", async (evento) => {
    evento.preventDefault();
    mensajeLogin.hidden = true;
    btnLogin.disabled = true;
    btnLogin.textContent = "INGRESANDO...";
    try {
      const respuesta = await fetch(API_AUTH + "/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ correo: correo.value.trim(), password: password.value })
      });
      let resultado = {};
      try { resultado = await respuesta.json(); } catch { /* la API no respondió JSON */ }
      if (!respuesta.ok || !resultado.isSuccess) {
        throw new Error(resultado.respuesta || "No se pudo conectar con la API (código " + respuesta.status + "). Verifica que el proyecto .NET esté en ejecución.");
      }
      // Se guarda con el mismo formato que usa el resto de la PWA (name, email, type).
      sessionStorage.setItem(SESSION_KEY, JSON.stringify({
        name: resultado.usuario.nombre,
        email: resultado.usuario.correo,
        type: resultado.usuario.tipo || "Estudiante"
      }));
      window.location.replace("index.html");
    } catch (error) {
      mostrarError(error.message || "Ocurrió un error al conectar con la API.");
    } finally {
      btnLogin.disabled = false;
      btnLogin.textContent = "INICIAR SESIÓN";
    }
  });
})();
