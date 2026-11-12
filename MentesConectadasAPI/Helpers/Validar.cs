using System.ComponentModel.DataAnnotations;
using System.Text.RegularExpressions;

namespace MentesConectadasAPI.Helpers
{
    
    public static class Validar
    {
        
        private static readonly Regex PatronGuia = new("^[a-z0-9][a-z0-9-]{0,79}$", RegexOptions.Compiled);
        private static readonly Regex PatronIdLocal = new("^[A-Za-z0-9]{1,40}$", RegexOptions.Compiled);

        public static string Correo(string? correo) => (correo ?? string.Empty).Trim().ToLowerInvariant();

        public static bool CorreoValido(string correo) =>
            correo.Length is > 0 and <= 150 && new EmailAddressAttribute().IsValid(correo);

        public static bool IdGuiaValido(string? idGuia) => idGuia != null && PatronGuia.IsMatch(idGuia);

        public static bool IdLocalValido(string? idLocal) => idLocal != null && PatronIdLocal.IsMatch(idLocal);

        public static bool TipoValido(string? tipo) => tipo is "Estudiante" or "Docente";
    }
}
