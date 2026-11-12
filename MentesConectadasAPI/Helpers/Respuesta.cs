namespace MentesConectadasAPI.Helpers
{
    
    public static class Respuesta
    {
        public static object Exito(string mensaje, object? datos = null) => new
        {
            isSuccess = true,
            numeroError = 0,
            respuesta = mensaje,
            response = datos
        };

        public static object Fallo(int codigo, string mensaje) => new
        {
            isSuccess = false,
            numeroError = codigo,
            respuesta = mensaje,
            response = (object?)null
        };
    }
}
