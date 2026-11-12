namespace MentesConectadasAPI.Models
{
    // Cuerpo de POST api/Evaluacion: la guía a la que se le crea su autoevaluación.
    public class EvaluacionCrear
    {
        public int IdGuia { get; set; }
    }

    // Datos de una pregunta (POST y PUT). Mínimo dos opciones (A y B); C y D son opcionales.
    public class PreguntaGuardar
    {
        public string Texto { get; set; } = string.Empty;
        public string OpcionA { get; set; } = string.Empty;
        public string OpcionB { get; set; } = string.Empty;
        public string? OpcionC { get; set; }
        public string? OpcionD { get; set; }
        public string Correcta { get; set; } = string.Empty;   // "a", "b", "c" o "d"
    }
}