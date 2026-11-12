using System.Security.Cryptography;
using System.Text;
using Microsoft.AspNetCore.Mvc;
using MentesConectadasAPI.Helpers;
using MentesConectadasAPI.Models;

namespace MentesConectadasAPI.Controllers
{
    
    [Route("api/[controller]")]
    [ApiController]
    public class AuthController : ControllerBase
    {
        private static readonly TimeSpan DuracionToken = TimeSpan.FromHours(8);
        private readonly IConfiguration _configuration;

        public AuthController(IConfiguration configuration)
        {
            _configuration = configuration;
        }

        [HttpPost("login")]
        public IActionResult Login([FromBody] LoginRequest request)
        {
            string correoAdmin = _configuration["Admin:Correo"] ?? string.Empty;
            string passwordAdmin = _configuration["Admin:Password"] ?? string.Empty;
            string nombreAdmin = _configuration["Admin:Nombre"] ?? "Administrador";
            string clave = _configuration["Admin:ClaveToken"] ?? string.Empty;

            bool credencialesCorrectas =
                correoAdmin.Length > 0 &&
                clave.Length > 0 &&
                (request.Correo ?? string.Empty).Trim().Equals(correoAdmin, StringComparison.OrdinalIgnoreCase) &&
                CompararTextos(request.Password ?? string.Empty, passwordAdmin);

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
                    nombre = nombreAdmin,
                    correo = correoAdmin,
                    tipo = "Administrador"
                },
                token = TokenAdmin.Crear(correoAdmin, clave, DuracionToken)
            });
        }

        
        private static bool CompararTextos(string a, string b) =>
            CryptographicOperations.FixedTimeEquals(Encoding.UTF8.GetBytes(a), Encoding.UTF8.GetBytes(b));
    }
}
