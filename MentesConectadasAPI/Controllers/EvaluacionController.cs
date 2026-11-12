using System.Data.SqlClient;
using Microsoft.AspNetCore.Mvc;
using MentesConectadasAPI.Data;
using MentesConectadasAPI.Helpers;
using MentesConectadasAPI.Models;
using static MentesConectadasAPI.Data.AccesoSql;

namespace MentesConectadasAPI.Controllers
{
    // Autoevaluaciones de las guías (una por guía) y sus preguntas. Todo es solo para el administrador.
    [Route("api/[controller]")]
    [ApiController]
    public class EvaluacionController : ControllerBase
    {
        private readonly AccesoSql _sql;
        private readonly ILogger<EvaluacionController> _logger;

        public EvaluacionController(AccesoSql sql, ILogger<EvaluacionController> logger)
        {
            _sql = sql;
            _logger = logger;
        }

        // POST api/Evaluacion  { "idGuia": 5 }  -> crea la autoevaluación de esa guía (sp_crearEvaluacion)
        [HttpPost]
        [AdminAuth]
        public async Task<IActionResult> Crear([FromBody] EvaluacionCrear datos)
        {
            var pIdEvaluacion = SalidaInt("@IdEvaluacion");
            return await Escribir("sp_crearEvaluacion",
                () => new { idEvaluacion = Convert.ToInt32(pIdEvaluacion.Value) },
                Param("@IdGuia", datos.IdGuia), pIdEvaluacion);
        }

        // DELETE api/Evaluacion/3  -> ELIMINACIÓN FÍSICA: borra la autoevaluación y todas sus preguntas (sp_eliminarEvaluacion).
        // La guía y los resultados que los usuarios ya obtuvieron se conservan.
        [HttpDelete("{id:int}")]
        [AdminAuth]
        public async Task<IActionResult> Eliminar(int id)
        {
            return await Escribir("sp_eliminarEvaluacion", () => new { idEvaluacion = id }, Param("@IdEvaluacion", id));
        }

        // POST api/Evaluacion/3/preguntas  -> agrega una pregunta a la autoevaluación 3 (sp_crearPregunta)
        [HttpPost("{id:int}/preguntas")]
        [AdminAuth]
        public async Task<IActionResult> CrearPregunta(int id, [FromBody] PreguntaGuardar datos)
        {
            string? error = ValidarPregunta(datos);
            if (error != null) return BadRequest(Respuesta.Fallo(50009, error));

            var pIdPregunta = SalidaInt("@IdPregunta");
            var parametros = CamposPregunta(datos);
            parametros.Add(Param("@IdEvaluacion", id));
            parametros.Add(pIdPregunta);
            return await Escribir("sp_crearPregunta", () => new { idPregunta = Convert.ToInt32(pIdPregunta.Value) }, parametros.ToArray());
        }

        // PUT api/Evaluacion/preguntas/12  -> edita la pregunta 12 (sp_editarPregunta)
        [HttpPut("preguntas/{idPregunta:int}")]
        [AdminAuth]
        public async Task<IActionResult> EditarPregunta(int idPregunta, [FromBody] PreguntaGuardar datos)
        {
            string? error = ValidarPregunta(datos);
            if (error != null) return BadRequest(Respuesta.Fallo(50009, error));

            var parametros = CamposPregunta(datos);
            parametros.Add(Param("@IdPregunta", idPregunta));
            return await Escribir("sp_editarPregunta", () => new { idPregunta }, parametros.ToArray());
        }

        // DELETE api/Evaluacion/preguntas/12  -> elimina la pregunta 12 (sp_eliminarPregunta)
        [HttpDelete("preguntas/{idPregunta:int}")]
        [AdminAuth]
        public async Task<IActionResult> EliminarPregunta(int idPregunta)
        {
            return await Escribir("sp_eliminarPregunta", () => new { idPregunta }, Param("@IdPregunta", idPregunta));
        }

        // Ejecuta un procedimiento que escribe: le agrega @numeroError y @respuesta, y regresa SIEMPRE ambos al frontend.
        private async Task<IActionResult> Escribir(string procedimiento, Func<object> datosExito, params SqlParameter[] parametros)
        {
            try
            {
                var pNumeroError = SalidaInt("@numeroError");
                var pRespuesta = SalidaTexto("@respuesta");

                var todos = parametros.Concat(new[] { pNumeroError, pRespuesta }).ToArray();
                await _sql.EjecutarAsync(procedimiento, todos);

                int numeroError = Convert.ToInt32(pNumeroError.Value);
                string respuesta = Convert.ToString(pRespuesta.Value) ?? string.Empty;

                if (numeroError == 0) return Ok(Respuesta.Exito(respuesta, datosExito()));
                if (numeroError == 50006 || numeroError == 50008 || numeroError == 50011) return NotFound(Respuesta.Fallo(numeroError, respuesta));
                return BadRequest(Respuesta.Fallo(numeroError, respuesta));
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error al ejecutar {Procedimiento}", procedimiento);
                return StatusCode(500, Respuesta.Fallo(500, "No se pudo completar la operación en la base de datos."));
            }
        }

        // Parámetros que comparten sp_crearPregunta y sp_editarPregunta
        private static List<SqlParameter> CamposPregunta(PreguntaGuardar datos) => new List<SqlParameter>
        {
            Param("@Texto", (datos.Texto ?? string.Empty).Trim()),
            Param("@OpcionA", (datos.OpcionA ?? string.Empty).Trim()),
            Param("@OpcionB", (datos.OpcionB ?? string.Empty).Trim()),
            Param("@OpcionC", string.IsNullOrWhiteSpace(datos.OpcionC) ? null : datos.OpcionC.Trim()),
            Param("@OpcionD", string.IsNullOrWhiteSpace(datos.OpcionD) ? null : datos.OpcionD.Trim()),
            Param("@Correcta", (datos.Correcta ?? string.Empty).Trim().ToLower())
        };

        // Tamaños de las columnas: Texto 220, opciones 180 (el procedimiento revisa lo demás)
        private static string? ValidarPregunta(PreguntaGuardar? datos)
        {
            if (datos == null) return "No se recibieron los datos de la pregunta";
            if ((datos.Texto ?? string.Empty).Trim().Length > 220) return "La pregunta no puede pasar de 220 caracteres";
            foreach (var opcion in new[] { datos.OpcionA, datos.OpcionB, datos.OpcionC, datos.OpcionD })
            {
                if (opcion != null && opcion.Trim().Length > 180) return "Cada opción puede tener máximo 180 caracteres";
            }
            return null;
        }
    }
}