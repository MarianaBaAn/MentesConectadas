namespace MentesConectadasAPI.Models
{
    
    public class UsuarioRequest
    {
        public string Correo { get; set; } = string.Empty;
        public string Nombre { get; set; } = string.Empty;
        public string? Tipo { get; set; }
    }

    public class VistaRequest
    {
        public string Correo { get; set; } = string.Empty;
        public string IdGuia { get; set; } = string.Empty;
    }

    public class FavoritoRequest
    {
        public string Correo { get; set; } = string.Empty;
        public string IdGuia { get; set; } = string.Empty;
        public bool Activo { get; set; }
    }

    public class CalificacionRequest
    {
        public string Correo { get; set; } = string.Empty;
        public string IdGuia { get; set; } = string.Empty;
        public int Estrellas { get; set; }
    }

    public class AutoevaluacionRequest
    {
        public string Correo { get; set; } = string.Empty;
        public string IdGuia { get; set; } = string.Empty;
        public int Aciertos { get; set; }
        public int Total { get; set; }
    }

    public class ComentarioRequest
    {
        public string Correo { get; set; } = string.Empty;
        public string IdGuia { get; set; } = string.Empty;
        public string Texto { get; set; } = string.Empty;
        public string IdLocal { get; set; } = string.Empty;
    }

    public class ComentarioPropioRequest
    {
        public string Correo { get; set; } = string.Empty;
        public string IdLocal { get; set; } = string.Empty;
    }

    public class DonacionRequest
    {
        public string? Correo { get; set; }
        public decimal Monto { get; set; }
        public bool OtraCantidad { get; set; }
    }


    public class IdRequest
    {
        public int Id { get; set; }
    }

    public class OcultarComentarioRequest
    {
        public int IdComentario { get; set; }
        public bool Oculto { get; set; }
    }

    public class EstadoDonacionRequest
    {
        public int IdDonacion { get; set; }
        public string Estado { get; set; } = string.Empty;
    }
}
