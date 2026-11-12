using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Mvc.Filters;

namespace MentesConectadasAPI.Helpers
{
    
    public class AdminAuthAttribute : ActionFilterAttribute
    {
        public override void OnActionExecuting(ActionExecutingContext context)
        {
            var configuracion = context.HttpContext.RequestServices.GetRequiredService<IConfiguration>();
            string token = context.HttpContext.Request.Headers["X-Admin-Token"].ToString();

            bool valido = TokenAdmin.Validar(
                token,
                configuracion["Admin:ClaveToken"] ?? string.Empty,
                configuracion["Admin:Correo"] ?? string.Empty);

            if (!valido)
            {
                context.Result = new ObjectResult(Respuesta.Fallo(401, "Sesión de administrador no válida."))
                {
                    StatusCode = StatusCodes.Status401Unauthorized
                };
            }
        }
    }
}
