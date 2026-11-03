using Microsoft.AspNetCore.Mvc;
using MentesConectadasAPI.Models;

namespace MentesConectadasAPI.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    public class AuthController : ControllerBase
    {
        private readonly IConfiguration _configuration;

        public AuthController(IConfiguration configuration)
        {
            _configuration = configuration;
        }

        [HttpPost("login")]
        public IActionResult Login([FromBody] LoginRequest request)
        {
            string correoConfigurado = _configuration["DemoLogin:Correo"] ?? string.Empty;
            string passwordConfigurado = _configuration["DemoLogin:Password"] ?? string.Empty;
            string nombreConfigurado = _configuration["DemoLogin:Nombre"] ?? "Usuario";
            string tipoConfigurado = _configuration["DemoLogin:Tipo"] ?? "Estudiante";

            bool credencialesCorrectas =
                request.Correo.Equals(correoConfigurado, StringComparison.OrdinalIgnoreCase) &&
                request.Password == passwordConfigurado;

            if (!credencialesCorrectas)
            {
                return Unauthorized(new
                {
                    isSuccess = false,
                    numeroError = 401,
                    respuesta = "Correo o contraseña incorrectos"
                });
            }

            return Ok(new
            {
                isSuccess = true,
                numeroError = 0,
                respuesta = "Inicio de sesión correcto",
                usuario = new
                {
                    nombre = nombreConfigurado,
                    correo = correoConfigurado,
                    tipo = tipoConfigurado
                }
            });
        }
    }
}
