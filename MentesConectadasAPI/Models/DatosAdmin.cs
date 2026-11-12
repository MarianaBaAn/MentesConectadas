namespace MentesConectadasAPI.Models
{
    
    public class ResumenAdmin
    {
        public int TotalUsuarios { get; set; }
        public int Estudiantes { get; set; }
        public int Docentes { get; set; }
        public int Vistas { get; set; }
        public int Favoritos { get; set; }
        public int Calificaciones { get; set; }
        public decimal? PromedioCalificacion { get; set; }
        public int Autoevaluaciones { get; set; }
        public int Comentarios { get; set; }
        public int Donaciones { get; set; }
        public decimal DonacionesMonto { get; set; }
    }

    
    public class ComentarioAdmin
    {
        public int IdComentario { get; set; }
        public string IdGuia { get; set; } = string.Empty;
        public string Correo { get; set; } = string.Empty;
        public string Nombre { get; set; } = string.Empty;
        public string? TipoUsuario { get; set; }
        public string Texto { get; set; } = string.Empty;
        public bool Oculto { get; set; }
        public DateTime Fecha { get; set; }
        public int? Estrellas { get; set; }
    }

    
    public class DonacionAdmin
    {
        public int IdDonacion { get; set; }
        public string? Correo { get; set; }
        public string? Nombre { get; set; }
        public decimal Monto { get; set; }
        public bool OtraCantidad { get; set; }
        public string Estado { get; set; } = string.Empty;
        public DateTime Fecha { get; set; }
    }
}
