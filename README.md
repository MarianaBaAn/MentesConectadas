# Mentes Conectadas PWA con API .NET 8
## Cómo ejecutarlo
1. Abre `MentesConectadasAPI.sln` en Visual Studio 2022 (con .NET 8).
2. Selecciona el perfil **http** y presiona ▶.
3. Se abre `http://localhost:5300`. Como no hay sesión, te manda a **login.html**.
4. Inicia sesión con:
   - Correo: `demo@mentesconectadas.com`
   - Contraseña: `Mentes123*`

Estos datos están en `appsettings.json` → `DemoLogin`. El login llama a `POST /api/Auth/login`.
Swagger: `http://localhost:5300/swagger`.

## Estructura
```
MentesConectadasAPI
└── MentesConectadasAPI
    ├── Controllers/AuthController.cs     ← login (API)
    ├── Models/LoginRequest.cs
    ├── Program.cs  appsettings.json
    └── wwwroot
        ├── login.html            ← inicio de sesión
        ├── registro.html         ← registro
        ├── index.html            ← inicio (dashboard, requiere sesión)
        ├── neurodivergencias.html← tipos de neurodivergencia (lista y detalle)
        ├── guias.html            ← guías prácticas y Mis guías
        ├── perfil.html           ← perfil y edición
        ├── inicio.html           ← bienvenida pública
        ├── informacion.html      ← información pública
        ├── sobre-nosotros.html
        ├── contenido.html / contenido-data.js   ← CONTENIDO
        ├── css/styles.css        ← estilos originales
        ├── assets/               ← imágenes
        ├── manifest.json  sw.js  ← PWA
        └── js
            ├── config.js  auth.js  comun.js     ← compartidos
            ├── login.js  registro.js
            ├── dashboard.js  neurodivergencias.js  guias.js  guias-lib.js  perfil.js
            ├── inicio.js  informacion.js  sobre-nosotros.js
            └── deshabilitado/   ← autoevaluación y asistente
```
## Configuración local (Entregable 1)
1. Ejecuta `Database/01_MentesConectadasDB.sql` en SQL Server. Crea la base `MentesConectadasDB`, las tablas `Neurodivergencia` y `Guia` y el procedimiento `sp_listaGuias`.
2. Configura tu cadena de conexión: clic derecho en el proyecto → Administrar secretos de usuario → pega:
   `{ "ConnectionStrings": { "CadenaSQL": "Data Source=TU_SERVIDOR;Initial Catalog=MentesConectadasDB;User ID=TU_USUARIO;Password=TU_PASSWORD;TrustServerCertificate=True;" } }`
3. Ejecuta con el perfil `http` y abre `http://localhost:5300/consulta-guias.html` (tabla) o `http://localhost:5300/swagger`.

Endpoint: `GET /api/Guia/lista`. Las tarjetas de `guias.html` aún usan `contenido.html`; migraran a SQL Server en la siguiente etapa.
