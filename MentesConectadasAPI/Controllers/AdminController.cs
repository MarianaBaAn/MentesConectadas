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
    [AdminAuth]
    public class AdminController : ControllerBase
    {
        private readonly AccesoSql _sql;
        private readonly ILogger<AdminController> _logger;

        public AdminController(AccesoSql sql, ILogger<AdminController> logger)
        {
            _sql = sql;
            _logger = logger;
        }

        
        [HttpGet("resumen")]
        public async Task<IActionResult> Resumen()
        {
            return await Consultar("sp_adminResumen", lector => new ResumenAdmin
            {
                TotalUsuarios = Convert.ToInt32(lector["TotalUsuarios"]),
                Estudiantes = Convert.ToInt32(lector["Estudiantes"]),
                Docentes = Convert.ToInt32(lector["Docentes"]),
                Vistas = Convert.ToInt32(lector["Vistas"]),
                Favoritos = Convert.ToInt32(lector["Favoritos"]),
                Calificaciones = Convert.ToInt32(lector["Calificaciones"]),
                PromedioCalificacion = lector["PromedioCalificacion"] is DBNull ? (decimal?)null : Convert.ToDecimal(lector["PromedioCalificacion"]),
                Autoevaluaciones = Convert.ToInt32(lector["Autoevaluaciones"]),
                Comentarios = Convert.ToInt32(lector["Comentarios"]),
                Donaciones = Convert.ToInt32(lector["Donaciones"]),
                DonacionesMonto = Convert.ToDecimal(lector["DonacionesMonto"])
            }, primeraFila: true);
        }

        
        [HttpGet("comentarios")]
        public async Task<IActionResult> Comentarios()
        {
            return await Consultar("sp_adminListaComentarios", lector => new ComentarioAdmin
            {
                IdComentario = Convert.ToInt32(lector["IdComentario"]),
                IdGuia = lector["IdGuia"].ToString() ?? string.Empty,
                Correo = lector["Correo"].ToString() ?? string.Empty,
                Nombre = lector["Nombre"].ToString() ?? string.Empty,
                TipoUsuario = lector["TipoUsuario"] as string,
                Texto = lector["Texto"].ToString() ?? string.Empty,
                Oculto = Convert.ToBoolean(lector["Oculto"]),
                Fecha = FechaUtc(lector["Fecha"]),
                Estrellas = lector["Estrellas"] is DBNull ? (int?)null : Convert.ToInt32(lector["Estrellas"])
            });
        }

        
        [HttpPost("comentario/oculto")]
        public async Task<IActionResult> ComentarioOculto([FromBody] OcultarComentarioRequest r)
        {
            if (r.IdComentario < 1) return Invalido();
            return await Guardar("sp_adminOcultarComentario", "Comentario actualizado",
                Param("@IdComentario", r.IdComentario), Param("@Oculto", r.Oculto));
        }

        
        [HttpPost("comentario/eliminar")]
        public async Task<IActionResult> ComentarioEliminar([FromBody] IdRequest r)
        {
            if (r.Id < 1) return Invalido();
            return await Guardar("sp_adminEliminarComentario", "Comentario eliminado", Param("@IdComentario", r.Id));
        }

        
        [HttpGet("donaciones")]
        public async Task<IActionResult> Donaciones()
        {
            return await Consultar("sp_adminListaDonaciones", lector => new DonacionAdmin
            {
                IdDonacion = Convert.ToInt32(lector["IdDonacion"]),
                Correo = lector["Correo"] as string,
                Nombre = lector["Nombre"] as string,
                Monto = Convert.ToDecimal(lector["Monto"]),
                OtraCantidad = Convert.ToBoolean(lector["OtraCantidad"]),
                Estado = lector["Estado"].ToString() ?? string.Empty,
                Fecha = FechaUtc(lector["Fecha"])
            });
        }

        
        [HttpPost("donacion/estado")]
        public async Task<IActionResult> DonacionEstado([FromBody] EstadoDonacionRequest r)
        {
            if (r.IdDonacion < 1 || (r.Estado != "intencion" && r.Estado != "confirmada")) return Invalido();
            return await Guardar("sp_adminEstadoDonacion", "Donación actualizada",
                Param("@IdDonacion", r.IdDonacion), Param("@Estado", r.Estado));
        }

        
        [HttpPost("donacion/eliminar")]
        public async Task<IActionResult> DonacionEliminar([FromBody] IdRequest r)
        {
            if (r.Id < 1) return Invalido();
            return await Guardar("sp_adminEliminarDonacion", "Donación eliminada", Param("@IdDonacion", r.Id));
        }


        private static DateTime FechaUtc(object valor) => DateTime.SpecifyKind(Convert.ToDateTime(valor), DateTimeKind.Utc);

        private IActionResult Invalido() => BadRequest(Respuesta.Fallo(400, "Los datos enviados no son válidos."));

        
        private async Task<IActionResult> Consultar<T>(string procedimiento, Func<SqlDataReader, T> convertir, bool primeraFila = false)
        {
            try
            {
                var lista = await _sql.ConsultarAsync(procedimiento, convertir);
                object? datos = primeraFila ? lista.FirstOrDefault() : lista;
                return Ok(Respuesta.Exito("Consulta correcta", datos));
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error al ejecutar {Procedimiento}", procedimiento);
                return StatusCode(500, Respuesta.Fallo(500, "No se pudo consultar la base de datos."));
            }
        }

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
