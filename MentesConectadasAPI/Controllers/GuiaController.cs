using System.Data.SqlClient;
using Microsoft.AspNetCore.Mvc;
using MentesConectadasAPI.Data;
using MentesConectadasAPI.Helpers;
using MentesConectadasAPI.Models;
using static MentesConectadasAPI.Data.AccesoSql;

namespace MentesConectadasAPI.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    public class GuiaController : ControllerBase
    {
        private readonly AccesoSql _sql;
        private readonly ILogger<GuiaController> _logger;

        public GuiaController(AccesoSql sql, ILogger<GuiaController> logger)
        {
            _sql = sql;
            _logger = logger;
        }

        // GET api/Guia  -> consulta general (sp_listaGuias). Todos los filtros son opcionales:
        [HttpGet]
        public async Task<IActionResult> Lista(
            [FromQuery] int? idNeurodivergencia,
            [FromQuery] string? neurodivergencia,
            [FromQuery] string? situacion,
            [FromQuery] string? texto,
            [FromQuery] string? tipoUsuario,
            [FromQuery] bool soloVisibles = false)
        {
            try
            {
                // La neurodivergencia puede llegar por nombre ("TDAH"); si no existe, no hay coincidencias
                if (idNeurodivergencia == null && !string.IsNullOrWhiteSpace(neurodivergencia))
                {
                    idNeurodivergencia = await BuscarIdNeurodivergenciaAsync(neurodivergencia);
                    if (idNeurodivergencia == null) return Ok(Respuesta.Exito("Consulta correcta", new List<Guia>()));
                }

                var lista = await _sql.ConsultarAsync("sp_listaGuias", lector =>
                {
                    var guia = new Guia();
                    LlenarBase(guia, lector);
                    guia.Situaciones = (lector["Situaciones"] as string ?? string.Empty)
                        .Split(',', StringSplitOptions.RemoveEmptyEntries).ToList();
                    guia.TotalPreguntas = Convert.ToInt32(lector["TotalPreguntas"]);
                    guia.PromedioCalificacion = lector["PromedioCalificacion"] is DBNull ? (decimal?)null : Convert.ToDecimal(lector["PromedioCalificacion"]);
                    guia.TotalCalificaciones = Convert.ToInt32(lector["TotalCalificaciones"]);
                    guia.TotalComentarios = Convert.ToInt32(lector["TotalComentarios"]);
                    return guia;
                },
                Param("@IdNeurodivergencia", idNeurodivergencia),
                Param("@Situacion", situacion),
                Param("@Texto", texto),
                Param("@TipoUsuario", tipoUsuario),
                Param("@SoloVisibles", soloVisibles));

                return Ok(Respuesta.Exito("Consulta correcta", lista));
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error al consultar sp_listaGuias");
                return StatusCode(500, Respuesta.Fallo(500, "No se pudieron consultar las guías en la base de datos."));
            }
        }

        // GET api/Guia/5  -> una guía completa por su ID (sp_obtenerGuia + sp_obtenerEvaluacion)
        [HttpGet("{id:int}")]
        public async Task<IActionResult> Obtener(int id)
        {
            try
            {
                var guia = new GuiaDetalle();
                bool existe = false;

                await _sql.ConsultarVariosAsync("sp_obtenerGuia", async lector =>
                {
                    // Resultado 1: la guía
                    if (await lector.ReadAsync())
                    {
                        existe = true;
                        LlenarBase(guia, lector);
                        guia.FechaCreacion = Convert.ToDateTime(lector["FechaCreacion"]);
                        guia.FechaActualizacion = Convert.ToDateTime(lector["FechaActualizacion"]);
                    }

                    // Resultado 2: recomendaciones ("hacer") y cosas por evitar ("evitar")
                    await lector.NextResultAsync();
                    while (await lector.ReadAsync())
                    {
                        string texto = lector["Texto"].ToString() ?? string.Empty;
                        if (lector["Tipo"].ToString() == "evitar") guia.Evitar.Add(texto);
                        else guia.Recomendaciones.Add(texto);
                    }

                    // Resultado 3: situaciones relacionadas (claves)
                    await lector.NextResultAsync();
                    while (await lector.ReadAsync())
                    {
                        guia.Situaciones.Add(lector["Clave"].ToString() ?? string.Empty);
                    }
                }, Param("@IdGuia", id));

                if (!existe) return NotFound(Respuesta.Fallo(404, "La guía no existe."));

                await _sql.ConsultarVariosAsync("sp_obtenerEvaluacion", async lector =>
                {
                    // Resultado 1: la autoevaluación (si la guía tiene)
                    if (await lector.ReadAsync()) guia.IdEvaluacion = Convert.ToInt32(lector["IdEvaluacion"]);

                    // Resultado 2: sus preguntas
                    await lector.NextResultAsync();
                    while (await lector.ReadAsync())
                    {
                        guia.Preguntas.Add(new PreguntaGuia
                        {
                            IdPregunta = Convert.ToInt32(lector["IdPregunta"]),
                            Orden = Convert.ToInt32(lector["Orden"]),
                            Texto = lector["Texto"].ToString() ?? string.Empty,
                            OpcionA = lector["OpcionA"].ToString() ?? string.Empty,
                            OpcionB = lector["OpcionB"].ToString() ?? string.Empty,
                            OpcionC = lector["OpcionC"] as string,
                            OpcionD = lector["OpcionD"] as string,
                            Correcta = lector["Correcta"].ToString() ?? string.Empty
                        });
                    }
                }, Param("@IdGuia", id));

                guia.TotalPreguntas = guia.Preguntas.Count;
                return Ok(Respuesta.Exito("Consulta correcta", guia));
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error al consultar la guía {Id}", id);
                return StatusCode(500, Respuesta.Fallo(500, "No se pudo consultar la guía en la base de datos."));
            }
        }

        // POST api/Guia  -> nueva guía (sp_crearGuia). Solo el administrador.
        // Regresa SIEMPRE numeroError y respuesta: numeroError = 0 si se guardó; si no, el código y el mensaje del procedimiento.
        [HttpPost]
        [AdminAuth]
        public async Task<IActionResult> Crear([FromBody] GuiaGuardar datos)
        {
            string? errorCampos = ValidarCampos(datos);
            if (errorCampos != null) return BadRequest(Respuesta.Fallo(50001, errorCampos));

            try
            {
                int? idNeuro = await BuscarIdNeurodivergenciaAsync(datos.Neurodivergencia);
                if (idNeuro == null) return BadRequest(Respuesta.Fallo(50002, "La neurodivergencia seleccionada no existe"));

                var pIdGuia = SalidaInt("@IdGuia");
                var pNumeroError = SalidaInt("@numeroError");
                var pRespuesta = SalidaTexto("@respuesta");

                var parametros = CamposGuia(datos, idNeuro.Value);
                parametros.Add(pIdGuia);
                parametros.Add(pNumeroError);
                parametros.Add(pRespuesta);
                await _sql.EjecutarAsync("sp_crearGuia", parametros.ToArray());

                int numeroError = Convert.ToInt32(pNumeroError.Value);
                string respuesta = Convert.ToString(pRespuesta.Value) ?? string.Empty;

                if (numeroError != 0) return BadRequest(Respuesta.Fallo(numeroError, respuesta));
                return Ok(Respuesta.Exito(respuesta, new { idGuia = Convert.ToInt32(pIdGuia.Value) }));
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error al ejecutar sp_crearGuia");
                return StatusCode(500, Respuesta.Fallo(500, "No se pudo guardar la guía en la base de datos."));
            }
        }

        // PUT api/Guia/5  -> actualizar los datos de una guía (sp_editarGuia). Solo el administrador.
        [HttpPut("{id:int}")]
        [AdminAuth]
        public async Task<IActionResult> Editar(int id, [FromBody] GuiaGuardar datos)
        {
            string? errorCampos = ValidarCampos(datos);
            if (errorCampos != null) return BadRequest(Respuesta.Fallo(50001, errorCampos));

            try
            {
                int? idNeuro = await BuscarIdNeurodivergenciaAsync(datos.Neurodivergencia);
                if (idNeuro == null) return BadRequest(Respuesta.Fallo(50002, "La neurodivergencia seleccionada no existe"));

                var pNumeroError = SalidaInt("@numeroError");
                var pRespuesta = SalidaTexto("@respuesta");

                var parametros = CamposGuia(datos, idNeuro.Value);
                parametros.Add(Param("@IdGuia", id));
                parametros.Add(pNumeroError);
                parametros.Add(pRespuesta);
                await _sql.EjecutarAsync("sp_editarGuia", parametros.ToArray());

                int numeroError = Convert.ToInt32(pNumeroError.Value);
                string respuesta = Convert.ToString(pRespuesta.Value) ?? string.Empty;

                if (numeroError == 50006) return NotFound(Respuesta.Fallo(numeroError, respuesta));
                if (numeroError != 0) return BadRequest(Respuesta.Fallo(numeroError, respuesta));
                return Ok(Respuesta.Exito(respuesta, new { idGuia = id }));
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error al ejecutar sp_editarGuia {Id}", id);
                return StatusCode(500, Respuesta.Fallo(500, "No se pudo actualizar la guía en la base de datos."));
            }
        }

        // PUT api/Guia/5/visibilidad  -> baja lógica (sp_ocultarGuia). { "ocultar": true } oculta; { "ocultar": false } vuelve a mostrar.
        // No borra nada: solo cambia la columna Activo. Solo el administrador.
        [HttpPut("{id:int}/visibilidad")]
        [AdminAuth]
        public async Task<IActionResult> CambiarVisibilidad(int id, [FromBody] GuiaVisibilidad datos)
        {
            try
            {
                var pNumeroError = SalidaInt("@numeroError");
                var pRespuesta = SalidaTexto("@respuesta");

                await _sql.EjecutarAsync("sp_ocultarGuia",
                    Param("@IdGuia", id),
                    Param("@Ocultar", datos.Ocultar),
                    pNumeroError, pRespuesta);

                int numeroError = Convert.ToInt32(pNumeroError.Value);
                string respuesta = Convert.ToString(pRespuesta.Value) ?? string.Empty;

                if (numeroError == 50006) return NotFound(Respuesta.Fallo(numeroError, respuesta));
                if (numeroError != 0) return BadRequest(Respuesta.Fallo(numeroError, respuesta));
                return Ok(Respuesta.Exito(respuesta, new { idGuia = id, activo = !datos.Ocultar }));
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error al ejecutar sp_ocultarGuia {Id}", id);
                return StatusCode(500, Respuesta.Fallo(500, "No se pudo cambiar la visibilidad de la guía."));
            }
        }

        // La neurodivergencia llega por nombre ("Autismo"); se busca su Id en la tabla Neurodivergencia (null si no existe)
        private async Task<int?> BuscarIdNeurodivergenciaAsync(string nombre)
        {
            var neuros = await _sql.ConsultarAsync("sp_listaNeurodivergencias", lector => new
            {
                Id = Convert.ToInt32(lector["IdNeurodivergencia"]),
                Nombre = lector["Nombre"].ToString() ?? string.Empty
            });
            var neuro = neuros.FirstOrDefault(n => string.Equals(n.Nombre, nombre.Trim(), StringComparison.OrdinalIgnoreCase));
            return neuro?.Id;
        }

        // Parámetros que comparten sp_crearGuia y sp_editarGuia
        private static List<SqlParameter> CamposGuia(GuiaGuardar datos, int idNeurodivergencia) => new List<SqlParameter>
        {
            Param("@Titulo", datos.Titulo.Trim()),
            Param("@IdNeurodivergencia", idNeurodivergencia),
            Param("@Categoria", datos.Categoria.Trim()),
            Param("@Descripcion", datos.Descripcion.Trim()),
            Param("@Recomendaciones", UnirLineas(datos.Recomendaciones)),
            Param("@Evitar", UnirLineas(datos.Evitar)),
            Param("@ParaEstudiante", datos.ParaEstudiante),
            Param("@ParaDocente", datos.ParaDocente),
            Param("@Situaciones", string.Join(",", datos.Situaciones.Where(s => !string.IsNullOrWhiteSpace(s)).Select(s => s.Trim()))),
            Param("@Activo", datos.Activo)
        };

        // Revisa que lleguen los campos obligatorios y que no pasen del tamaño de las columnas (Titulo 80, Categoria 60, Descripcion 260)
        private static string? ValidarCampos(GuiaGuardar? datos)
        {
            if (datos == null) return "No se recibieron los datos de la guía";
            if (string.IsNullOrWhiteSpace(datos.Titulo) || string.IsNullOrWhiteSpace(datos.Categoria) || string.IsNullOrWhiteSpace(datos.Descripcion))
                return "Completa título, categoría y descripción";
            if (string.IsNullOrWhiteSpace(datos.Neurodivergencia)) return "Elige la neurodivergencia";
            if (datos.Titulo.Trim().Length > 80) return "El título no puede pasar de 80 caracteres";
            if (datos.Categoria.Trim().Length > 60) return "La categoría no puede pasar de 60 caracteres";
            if (datos.Descripcion.Trim().Length > 260) return "La descripción no puede pasar de 260 caracteres";
            return null;
        }

        // Une las recomendaciones en un solo texto, una por línea (así las recibe el procedimiento)
        private static string UnirLineas(List<string>? lineas) =>
            string.Join("\n", (lineas ?? new List<string>())
                .Select(l => (l ?? string.Empty).Replace("\r", " ").Replace("\n", " ").Trim())
                .Where(l => l != string.Empty));

        // Columnas que comparten sp_listaGuias y sp_obtenerGuia
        private static void LlenarBase(Guia guia, SqlDataReader lector)
        {
            guia.IdGuia = Convert.ToInt32(lector["IdGuia"]);
            guia.Titulo = lector["Titulo"].ToString() ?? string.Empty;
            guia.Categoria = lector["Categoria"].ToString() ?? string.Empty;
            guia.Descripcion = lector["Descripcion"].ToString() ?? string.Empty;
            guia.Video = lector["Video"] as string;
            guia.IdNeurodivergencia = Convert.ToInt32(lector["IdNeurodivergencia"]);
            guia.Neurodivergencia = lector["Neurodivergencia"].ToString() ?? string.Empty;
            guia.ParaEstudiante = Convert.ToBoolean(lector["ParaEstudiante"]);
            guia.ParaDocente = Convert.ToBoolean(lector["ParaDocente"]);
            guia.Activo = Convert.ToBoolean(lector["Activo"]);
        }
    }
}