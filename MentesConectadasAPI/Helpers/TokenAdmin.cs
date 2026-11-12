using System.Security.Cryptography;
using System.Text;

namespace MentesConectadasAPI.Helpers
{
    
    public static class TokenAdmin
    {
        public static string Crear(string correo, string clave, TimeSpan duracion)
        {
            long expira = DateTimeOffset.UtcNow.Add(duracion).ToUnixTimeSeconds();
            string datos = Base64Url(Encoding.UTF8.GetBytes($"{correo}|{expira}"));
            return datos + "." + Base64Url(Firmar(datos, clave));
        }

        public static bool Validar(string? token, string clave, string correoAdmin)
        {
            if (string.IsNullOrWhiteSpace(token) || string.IsNullOrEmpty(clave)) return false;

            string[] partes = token.Split('.');
            if (partes.Length != 2) return false;

            try
            {
                byte[] firmaEsperada = Firmar(partes[0], clave);
                byte[] firmaRecibida = DeBase64Url(partes[1]);
                if (!CryptographicOperations.FixedTimeEquals(firmaEsperada, firmaRecibida)) return false;

                string[] campos = Encoding.UTF8.GetString(DeBase64Url(partes[0])).Split('|');
                if (campos.Length != 2) return false;
                if (!campos[0].Equals(correoAdmin, StringComparison.OrdinalIgnoreCase)) return false;

                return long.TryParse(campos[1], out long expira) && expira > DateTimeOffset.UtcNow.ToUnixTimeSeconds();
            }
            catch (FormatException)
            {
                return false; 
            }
        }

        private static byte[] Firmar(string texto, string clave)
        {
            using var hmac = new HMACSHA256(Encoding.UTF8.GetBytes(clave));
            return hmac.ComputeHash(Encoding.UTF8.GetBytes(texto));
        }

        private static string Base64Url(byte[] bytes) =>
            Convert.ToBase64String(bytes).TrimEnd('=').Replace('+', '-').Replace('/', '_');

        private static byte[] DeBase64Url(string texto)
        {
            texto = texto.Replace('-', '+').Replace('_', '/');
            switch (texto.Length % 4)
            {
                case 2: texto += "=="; break;
                case 3: texto += "="; break;
            }
            return Convert.FromBase64String(texto);
        }
    }
}
