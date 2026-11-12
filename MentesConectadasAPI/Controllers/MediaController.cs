using Microsoft.AspNetCore.Mvc;
using MentesConectadasAPI.Helpers;

namespace MentesConectadasAPI.Controllers
{
    // Recibe imágenes y videos del panel de administración y los guarda en la carpeta del proyecto
    // (wwwroot/assets/uploads/imagenes y wwwroot/assets/uploads/videos), para que se puedan mostrar en las guías.
    [Route("api/[controller]")]
    [ApiController]
    public class MediaController : ControllerBase
    {
        private const long MaxImagenBytes = 8L * 1024 * 1024;
        private const long MaxVideoBytes = 150L * 1024 * 1024;

        private static readonly string[] ExtensionesImagen = { ".jpg", ".jpeg", ".png", ".webp", ".gif" };
        private static readonly string[] ExtensionesVideo = { ".mp4", ".webm" };

        private readonly IWebHostEnvironment _env;
        private readonly ILogger<MediaController> _logger;

        public MediaController(IWebHostEnvironment env, ILogger<MediaController> logger)
        {
            _env = env;
            _logger = logger;
        }

        // POST: api/Media/subir  (multipart/form-data: archivo, tipo = "imagen" | "video")
        [HttpPost("subir")]
        [AdminAuth] // solo el administrador (con su token) puede subir archivos
        [RequestSizeLimit(160L * 1024 * 1024)]
        [RequestFormLimits(MultipartBodyLengthLimit = 160L * 1024 * 1024)]
        public async Task<IActionResult> Subir([FromForm] IFormFile? archivo, [FromForm] string? tipo)
        {
            tipo = (tipo ?? string.Empty).Trim().ToLowerInvariant();

            if (archivo == null || archivo.Length == 0)
                return Error(400, "No se recibió ningún archivo.");
            if (tipo != "imagen" && tipo != "video")
                return Error(400, "El tipo debe ser «imagen» o «video».");

            string extension = Path.GetExtension(archivo.FileName).ToLowerInvariant();
            bool esImagen = tipo == "imagen";
            string[] permitidas = esImagen ? ExtensionesImagen : ExtensionesVideo;
            long maximo = esImagen ? MaxImagenBytes : MaxVideoBytes;

            if (!permitidas.Contains(extension))
                return Error(400, "Formato no permitido. Usa " + string.Join(", ", permitidas) + ".");
            if (archivo.Length > maximo)
                return Error(400, $"El archivo supera el máximo de {maximo / (1024 * 1024)} MB.");

            try
            {
                // Se revisan los primeros bytes para confirmar que realmente es una imagen o un video.
                byte[] inicio = new byte[16];
                int leidos;
                using (var lectura = archivo.OpenReadStream())
                {
                    leidos = await lectura.ReadAsync(inicio, 0, inicio.Length);
                }
                if (!FirmaValida(inicio, leidos, extension))
                    return Error(400, "El contenido del archivo no coincide con su formato.");

                string subcarpeta = esImagen ? "imagenes" : "videos";
                string carpeta = Path.Combine(_env.WebRootPath, "assets", "uploads", subcarpeta);
                Directory.CreateDirectory(carpeta);

                // El nombre original nunca se usa: se genera uno nuevo para evitar choques y rutas peligrosas.
                string nombre = Guid.NewGuid().ToString("N") + extension;
                string rutaFisica = Path.Combine(carpeta, nombre);
                using (var destino = new FileStream(rutaFisica, FileMode.Create))
                {
                    await archivo.CopyToAsync(destino);
                }

                return Ok(new
                {
                    isSuccess = true,
                    numeroError = 0,
                    respuesta = "Archivo subido correctamente",
                    response = new { ruta = $"assets/uploads/{subcarpeta}/{nombre}" }
                });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error al guardar el archivo subido");
                return Error(500, "No se pudo guardar el archivo en el servidor.");
            }
        }

        private IActionResult Error(int codigo, string mensaje)
        {
            return StatusCode(codigo, new
            {
                isSuccess = false,
                numeroError = codigo,
                respuesta = mensaje,
                response = (object?)null
            });
        }

        private static bool FirmaValida(byte[] b, int n, string extension)
        {
            if (n < 4) return false;
            switch (extension)
            {
                case ".jpg":
                case ".jpeg":
                    return b[0] == 0xFF && b[1] == 0xD8 && b[2] == 0xFF;
                case ".png":
                    return b[0] == 0x89 && b[1] == 0x50 && b[2] == 0x4E && b[3] == 0x47;
                case ".gif":
                    return b[0] == 0x47 && b[1] == 0x49 && b[2] == 0x46 && b[3] == 0x38;
                case ".webp":
                    return n >= 12 && b[0] == 0x52 && b[1] == 0x49 && b[2] == 0x46 && b[3] == 0x46
                        && b[8] == 0x57 && b[9] == 0x45 && b[10] == 0x42 && b[11] == 0x50;
                case ".mp4":
                    return n >= 8 && b[4] == 0x66 && b[5] == 0x74 && b[6] == 0x79 && b[7] == 0x70; // "ftyp"
                case ".webm":
                    return b[0] == 0x1A && b[1] == 0x45 && b[2] == 0xDF && b[3] == 0xA3;
                default:
                    return false;
            }
        }
    }
}
