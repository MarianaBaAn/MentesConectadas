namespace MentesConectadasAPI.Models
{
    // Un mensaje de la conversación ("user" = persona, "assistant" = asistente).
    public class MensajeChat
    {
        public string Rol { get; set; } = string.Empty;
        public string Texto { get; set; } = string.Empty;
    }

    // Lo que envía la página: la pregunta, el historial reciente y los textos de las guías
    // que la propia página encontró con su búsqueda local (el "contexto").
    public class ChatbotRequest
    {
        public string Mensaje { get; set; } = string.Empty;
        public string? Tipo { get; set; }                 // "Estudiante" o "Docente"
        public List<MensajeChat>? Historial { get; set; }
        public List<string>? Contexto { get; set; }
    }

    public class ChatbotResultado
    {
        public string Texto { get; set; } = string.Empty;
        public bool SinInfo { get; set; }                 // true = la IA dijo que no hay información sobre el tema
        public string Proveedor { get; set; } = string.Empty;
    }
}
