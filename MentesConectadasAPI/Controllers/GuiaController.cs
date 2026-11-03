using System.Data;
using System.Data.SqlClient;
using Microsoft.AspNetCore.Mvc;
using MentesConectadasAPI.Models;

namespace MentesConectadasAPI.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    public class GuiaController : ControllerBase
    {
        private readonly string _cadenaSQL;
        private readonly ILogger<GuiaController> _logger;

        public GuiaController(IConfiguration configuration, ILogger<GuiaController> logger)
        {
            _cadenaSQL = configuration.GetConnectionString("CadenaSQL") ?? string.Empty;
            _logger = logger;
        }

        // GET: api/Guia/lista
        [HttpGet("lista")]
        public async Task<IActionResult> Lista()
        {
            var lista = new List<Guia>();

            try
            {
                using var conexion = new SqlConnection(_cadenaSQL);
                await conexion.OpenAsync();

                using var comando = new SqlCommand("sp_listaGuias", conexion)
                {
                    CommandType = CommandType.StoredProcedure
                };

                using var lector = await comando.ExecuteReaderAsync();
                while (await lector.ReadAsync())
                {
                    lista.Add(new Guia
                    {
                        IdGuia = lector["IdGuia"].ToString() ?? string.Empty,
                        Titulo = lector["Titulo"].ToString() ?? string.Empty,
                        Categoria = lector["Categoria"].ToString() ?? string.Empty,
                        Emoji = lector["Emoji"] as string,
                        Descripcion = lector["Descripcion"].ToString() ?? string.Empty,
                        IdNeurodivergencia = lector["IdNeurodivergencia"].ToString() ?? string.Empty,
                        Neurodivergencia = lector["Neurodivergencia"].ToString() ?? string.Empty,
                        FechaUltimaActualizacion = Convert.ToDateTime(lector["FechaUltimaActualizacion"])
                    });
                }

                return Ok(new
                {
                    isSuccess = true,
                    numeroError = 0,
                    respuesta = "Consulta correcta",
                    response = lista
                });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error al consultar sp_listaGuias");
                return StatusCode(500, new
                {
                    isSuccess = false,
                    numeroError = 500,
                    respuesta = "No se pudieron consultar las guías en la base de datos.",
                    response = new List<Guia>()
                });
            }
        }
    }
}