Mentes Conectadas PWA con API .NET 8

## Cómo ejecutarlo

1. Abre `MentesConectadasAPI.sln` en Visual Studio 2022 (con .NET 8).
2. Elige el perfil **http** y presiona ▶ (o `dotnet run` dentro de `MentesConectadasAPI/`). Se abre `http://localhost:5300`.
3. **Abre siempre la página desde ese puerto.**
4. Swagger: `http://localhost:5300/swagger`.

| Cuenta | Correo | Contraseña | Entra como |
|---|---|---|---|
| Administrador (se valida en el servidor: `appsettings.json` → `Admin`) | `adminMentesConectadas@gmail.com` | `MentesConect123` | Administrador → panel de administración |
| Cualquier otro correo | — | — | Estudiante de demostración |

## Estructura
```
Mentes-Conectadas-Integrada-Entregable-3/
├── MentesConectadasAPI.sln
├── MentesConectadasDB.sql        Base de datos actualizada.
├── README.md   .gitignore
└── MentesConectadasAPI/
    ├── Program.cs  appsettings.json  MentesConectadasAPI.csproj
    ├── Controllers/   AuthController (login del administrador)   ActividadController (guarda la actividad)   AdminController (datos del panel)
    │                  GuiaController (base anterior)   MediaController (subida de archivos, solo administrador)
    ├── Data/          AccesoSql.cs (único lugar que habla con SQL Server)
    ├── Helpers/       Respuesta, Validar, TokenAdmin, AdminAuthAttribute
    ├── Models/        Guia, LoginRequest, Peticiones, DatosAdmin
    └── wwwroot/                     ← FRONTEND (el de v8_2)
        ├── index.html               Página única: todas las secciones son rutas (#login, #guias, #admin-guias…)
        ├── manifest.json  sw.js     PWA
        ├── css/styles.css
        ├── js/                      Un módulo por tema (router, auth, guides, admin, api…)
        ├── content/                 ÚNICA fuente del contenido: guias.js, neurodivergencias.js, textos.js
        ├── assets/                  Imágenes, íconos y videos/ (autismo/, tdah/)
        ├── asistente-consulta/      Prototipo anterior del asistente (se conserva)
        └── login.html, guias.html…  Redirecciones a index.html (ver abajo)
```