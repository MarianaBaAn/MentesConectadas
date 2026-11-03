# Mentes Conectadas — PWA con API .NET 8

Tu PWA de Mentes Conectadas ahora tiene la misma estructura que la plantilla del profe:
una API en .NET 8 que publica el frontend (HTML, CSS y JavaScript puro) desde `wwwroot`.

## Cómo ejecutarlo
1. Abre `MentesConectadasAPI.sln` en Visual Studio 2022 (con .NET 8).
2. Selecciona el perfil **http** y presiona ▶ (o `dotnet run` dentro de `MentesConectadasAPI/MentesConectadasAPI`).
3. Se abre `http://localhost:5300`. Como no hay sesión, te manda a **login.html**.
4. Inicia sesión con:
   - Correo: `demo@mentesconectadas.com`
   - Contraseña: `Mentes123*`

Estos datos están en `appsettings.json` → `DemoLogin`. El login llama a `POST /api/Auth/login`.
Swagger: `http://localhost:5300/swagger`.

> Importante: abre la página desde la API (puerto 5300). Si la abres con Live Server no existirá `/api/Auth/login` y el login mostrará un aviso de que no se pudo conectar con la API.

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
        ├── contenido.html / contenido-data.js   ← CONTENIDO (sin cambios)
        ├── css/styles.css        ← estilos originales (+ 3 reglas del login)
        ├── assets/               ← imágenes (sin cambios)
        ├── manifest.json  sw.js  ← PWA
        └── js
            ├── config.js  auth.js  comun.js     ← compartidos
            ├── login.js  registro.js
            ├── dashboard.js  neurodivergencias.js  guias.js  guias-lib.js  perfil.js
            ├── inicio.js  informacion.js  sobre-nosotros.js
            └── deshabilitado/   ← autoevaluación y asistente (desactivados como en tu versión)
```

## De dónde salió cada parte (app.js original)
| Original | Ahora |
|---|---|
| `login()` y `doLogin()` | `login.html` + `js/login.js` (usa `fetch` a la API) |
| `registro()` y `doRegister()` | `registro.html` + `js/registro.js` |
| `neuroList / neuroDetail` | `neurodivergencias.html` + `js/neurodivergencias.js` |
| `guideList / openGuide` | `guias.html` + `js/guias.js` y `js/guias-lib.js` |
| `profile / saveProfile / logout` | `perfil.html` + `js/perfil.js` |
| helpers, header, footer | `js/comun.js` |

## Pendiente (siguientes etapas)
- Base de datos SQL Server, procedimientos almacenados y `Scripts.sql`.
- Conectar el registro a la API (`POST /api/Auth/registro`) y el login a la tabla de usuarios.
- Por ahora el registro es de demostración (localStorage), igual que antes.
- Favoritas, calificaciones y perfil siguen en `localStorage` hasta que exista la BD.

## Agregado antes de subir primera version a github
## Configuración local (Entregable 1)
1. Ejecuta `Database/01_MentesConectadasDB.sql` en SQL Server. Crea la base `MentesConectadasDB`, las tablas `Neurodivergencia` y `Guia` y el procedimiento `sp_listaGuias`.
2. Configura tu cadena de conexión sin publicarla: clic derecho en el proyecto → Administrar secretos de usuario → pega:
   `{ "ConnectionStrings": { "CadenaSQL": "Data Source=TU_SERVIDOR;Initial Catalog=MentesConectadasDB;User ID=TU_USUARIO;Password=TU_PASSWORD;TrustServerCertificate=True;" } }`
3. Ejecuta con el perfil `http` y abre `http://localhost:5300/consulta-guias.html` (tabla) o `http://localhost:5300/swagger`.

Endpoint: `GET /api/Guia/lista`. Las tarjetas de `guias.html` aún usan `contenido.html`; migran a SQL Server en una etapa posterior.