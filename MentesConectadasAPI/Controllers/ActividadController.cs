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
    public class ActividadController : ControllerBase
    {
        private readonly AccesoSql _sql;
        private readonly IConfiguration _configuration;
        private readonly ILogger<ActividadController> _logger;

        public ActividadController(AccesoSql sql, IConfiguration configuration, ILogger<ActividadController> logger)
        {
            _sql = sql;
            _configuration = configuration;
            _logger = logger;
        }

        
        [HttpPost("usuario")]
        public async Task<IActionResult> Usuario([FromBody] UsuarioRequest r)
        {
            string correo = Validar.Correo(r.Correo);
            string nombre = (r.Nombre ?? string.Empty).Trim();
            if (nombre.Length > 100) nombre = nombre[..100];
            string? tipo = string.IsNullOrWhiteSpace(r.Tipo) ? null : r.Tipo;

            if (!CorreoPermitido(correo) || nombre.Length == 0 || (tipo != null && !Validar.TipoValido(tipo)))
                return Invalido();

            return await Guardar("sp_registrarUsuario", "Usuario registrado",
                Param("@Correo", correo), Param("@Nombre", nombre), Param("@Tipo", tipo));
        }

        
        [HttpPost("vista")]
        public async Task<IActionResult> Vista([FromBody] VistaRequest r)
        {
            string correo = Validar.Correo(r.Correo);
            if (!CorreoPermitido(correo) || !Validar.IdGuiaValido(r.IdGuia)) return Invalido();

            return await Guardar("sp_registrarVista", "Vista registrada",
                Param("@Correo", correo), Param("@IdGuia", r.IdGuia));
        }

        
        [HttpPost("favorito")]
        public async Task<IActionResult> Favorito([FromBody] FavoritoRequest r)
        {
            string correo = Validar.Correo(r.Correo);
            if (!CorreoPermitido(correo) || !Validar.IdGuiaValido(r.IdGuia)) return Invalido();

            return await Guardar("sp_cambiarFavorito", "Favorito actualizado",
                Param("@Correo", correo), Param("@IdGuia", r.IdGuia), Param("@Activo", r.Activo));
        }

        
        [HttpPost("calificacion")]
        public async Task<IActionResult> Calificacion([FromBody] CalificacionRequest r)
        {
            string correo = Validar.Correo(r.Correo);
            if (!CorreoPermitido(correo) || !Validar.IdGuiaValido(r.IdGuia) || r.Estrellas is < 1 or > 5) return Invalido();

            return await Guardar("sp_guardarCalificacion", "Calificación guardada",
                Param("@Correo", correo), Param("@IdGuia", r.IdGuia), Param("@Estrellas", r.Estrellas));
        }

        // POST api/Actividad/autoevaluacion  →  sp_guardarAutoevaluacion (aciertos y total de preguntas)
        [HttpPost("autoevaluacion")]
        public async Task<IActionResult> Autoevaluacion([FromBody] AutoevaluacionRequest r)
        {
            string correo = Validar.Correo(r.Correo);
            if (!CorreoPermitido(correo) || !Validar.IdGuiaValido(r.IdGuia) || r.Total is < 1 or > 100 || r.Aciertos < 0 || r.Aciertos > r.Total)
                return Invalido();

            return await Guardar("sp_guardarAutoevaluacion", "Autoevaluación guardada",
                Param("@Correo", correo), Param("@IdGuia", r.IdGuia), Param("@Aciertos", r.Aciertos), Param("@Total", r.Total));
        }

        // POST api/Actividad/comentario  →  sp_guardarComentario
        [HttpPost("comentario")]
        public async Task<IActionResult> Comentario([FromBody] ComentarioRequest r)
        {
            string correo = Validar.Correo(r.Correo);
            string texto = (r.Texto ?? string.Empty).Trim();
            if (!CorreoPermitido(correo) || !Validar.IdGuiaValido(r.IdGuia) || !Validar.IdLocalValido(r.IdLocal) || texto.Length is < 3 or > 300)
                return Invalido();

            return await Guardar("sp_guardarComentario", "Comentario guardado",
                Param("@Correo", correo), Param("@IdGuia", r.IdGuia), Param("@Texto", texto), Param("@IdLocal", r.IdLocal));
        }

        
        [HttpPost("comentario/eliminar")]
        public async Task<IActionResult> ComentarioEliminar([FromBody] ComentarioPropioRequest r)
        {
            string correo = Validar.Correo(r.Correo);
            if (!CorreoPermitido(correo) || !Validar.IdLocalValido(r.IdLocal)) return Invalido();

            return await Guardar("sp_eliminarComentarioPropio", "Comentario eliminado",
                Param("@Correo", correo), Param("@IdLocal", r.IdLocal));
        }

        
        [HttpPost("donacion")]
        public async Task<IActionResult> Donacion([FromBody] DonacionRequest r)
        {
            string? correo = string.IsNullOrWhiteSpace(r.Correo) ? null : Validar.Correo(r.Correo);
            if ((correo != null && !CorreoPermitido(correo)) || r.Monto < 1 || r.Monto > 100000) return Invalido();

            return await Guardar("sp_registrarDonacion", "Donación registrada",
                Param("@Correo", correo), Param("@Monto", r.Monto), Param("@OtraCantidad", r.OtraCantidad));
        }

        
        private bool CorreoPermitido(string correo) =>
            Validar.CorreoValido(correo) &&
            !correo.Equals(_configuration["Admin:Correo"] ?? string.Empty, StringComparison.OrdinalIgnoreCase);

        private IActionResult Invalido() => BadRequest(Respuesta.Fallo(400, "Los datos enviados no son válidos."));

        
        private async Task<IActionResult> Guardar(string procedimiento, string mensaje, params SqlParameter[] parametros)
        {
            try
            {
                await _sql.EjecutarAsync(procedimiento, parametros);
                return Ok(Respuesta.Exito(mensaje));
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error al ejecutar {Procedimiento}", procedimiento);
                return StatusCode(500, Respuesta.Fallo(500, "No se pudo guardar en la base de datos."));
            }
        }
    }
}
