namespace MentesConectadasAPI.Models
{
    public class Guia
    {
        public string IdGuia { get; set; } = string.Empty;
        public string Titulo { get; set; } = string.Empty;
        public string Categoria { get; set; } = string.Empty;
        public string? Emoji { get; set; }
        public string Descripcion { get; set; } = string.Empty;
        public string IdNeurodivergencia { get; set; } = string.Empty;
        public string Neurodivergencia { get; set; } = string.Empty;
        public DateTime FechaUltimaActualizacion { get; set; }
    }
}