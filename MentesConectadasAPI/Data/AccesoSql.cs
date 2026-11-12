using System.Data;
using System.Data.SqlClient;

namespace MentesConectadasAPI.Data
{
    // Acceso a SQL Server: todo el proyecto usa UNA sola base de datos (CadenaSQL -> MentesConectadasDB).
    public class AccesoSql
    {
        private readonly string _cadena;

        public AccesoSql(IConfiguration configuration)
        {
            _cadena = configuration.GetConnectionString("CadenaSQL") ?? string.Empty;
        }

        // Ejecuta un procedimiento que escribe (insertar, actualizar, eliminar).
        public async Task EjecutarAsync(string procedimiento, params SqlParameter[] parametros)
        {
            using var conexion = new SqlConnection(_cadena);
            await conexion.OpenAsync();
            using var comando = Crear(conexion, procedimiento, parametros);
            await comando.ExecuteNonQueryAsync();
        }

        // Ejecuta un procedimiento que regresa UN resultado (una lista de filas).
        public async Task<List<T>> ConsultarAsync<T>(string procedimiento, Func<SqlDataReader, T> convertir, params SqlParameter[] parametros)
        {
            var lista = new List<T>();
            using var conexion = new SqlConnection(_cadena);
            await conexion.OpenAsync();
            using var comando = Crear(conexion, procedimiento, parametros);
            using var lector = await comando.ExecuteReaderAsync();
            while (await lector.ReadAsync())
            {
                lista.Add(convertir(lector));
            }
            return lista;
        }

        // Ejecuta un procedimiento que regresa VARIOS resultados (por ejemplo sp_obtenerGuia).
        // "leer" recorre cada resultado y pasa al siguiente con NextResultAsync().
        public async Task ConsultarVariosAsync(string procedimiento, Func<SqlDataReader, Task> leer, params SqlParameter[] parametros)
        {
            using var conexion = new SqlConnection(_cadena);
            await conexion.OpenAsync();
            using var comando = Crear(conexion, procedimiento, parametros);
            using var lector = await comando.ExecuteReaderAsync();
            await leer(lector);
        }

        // Parámetros de salida (OUTPUT) de los procedimientos que escriben: @numeroError, @respuesta, @IdGuia...
        // Después de EjecutarAsync se lee su resultado con parametro.Value.
        public static SqlParameter SalidaInt(string nombre) =>
            new SqlParameter(nombre, SqlDbType.Int) { Direction = ParameterDirection.Output };

        public static SqlParameter SalidaTexto(string nombre, int tamano = 1000) =>
            new SqlParameter(nombre, SqlDbType.VarChar, tamano) { Direction = ParameterDirection.Output };

        // Crea un parámetro; si el valor es null se manda NULL a la base de datos.
        public static SqlParameter Param(string nombre, object? valor) => new SqlParameter(nombre, valor ?? DBNull.Value);

        private static SqlCommand Crear(SqlConnection conexion, string procedimiento, SqlParameter[] parametros)
        {
            var comando = new SqlCommand(procedimiento, conexion) { CommandType = CommandType.StoredProcedure };
            foreach (var parametro in parametros)
            {
                comando.Parameters.Add(parametro);
            }
            return comando;
        }
    }
}