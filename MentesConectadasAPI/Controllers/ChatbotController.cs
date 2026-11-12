using MentesConectadasAPI.Helpers;
using MentesConectadasAPI.Models;
using MentesConectadasAPI.Services;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.RateLimiting;

namespace MentesConectadasAPI.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    public class ChatbotController : ControllerBase
    {
        private readonly ChatbotIA _ia;

        public ChatbotController(ChatbotIA ia)
        {
            _ia = ia;
        }

        // POST /api/Chatbot/preguntar
        [HttpPost("preguntar")]
        [EnableRateLimiting("chatbot")]
        public async Task<IActionResult> Preguntar([FromBody] ChatbotRequest peticion, CancellationToken ct)
        {
            var mensaje = (peticion?.Mensaje ?? string.Empty).Trim();
            if (mensaje.Length < 2)
                return BadRequest(Respuesta.Fallo(400, "Escribe una pregunta."));
            if (mensaje.Length > 500)
                return BadRequest(Respuesta.Fallo(400, "La pregunta es demasiado larga (máximo 500 caracteres)."));

            var resultado = await _ia.PreguntarAsync(peticion!, ct);
            if (resultado == null)
                return StatusCode(503, Respuesta.Fallo(503, "El asistente con IA no está disponible en este momento."));

            return Ok(Respuesta.Exito("Consulta correcta", new
            {
                texto = resultado.Texto,
                sinInfo = resultado.SinInfo,
                proveedor = resultado.Proveedor
            }));
        }
    }
}
