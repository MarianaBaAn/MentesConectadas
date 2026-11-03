IF DB_ID(N'MentesConectadasDB') IS NULL
    CREATE DATABASE MentesConectadasDB;
GO

USE MentesConectadasDB;
GO

/* ---------- Tabla: Neurodivergencia ---------- */
IF OBJECT_ID(N'dbo.Neurodivergencia', N'U') IS NULL
BEGIN
    CREATE TABLE dbo.Neurodivergencia (
        IdNeurodivergencia       VARCHAR(30)   NOT NULL
            CONSTRAINT PK_Neurodivergencia PRIMARY KEY,
        Nombre                   NVARCHAR(100) NOT NULL,
        Activo                   BIT           NOT NULL
            CONSTRAINT DF_Neurodivergencia_Activo DEFAULT 1,
        FechaUltimaActualizacion DATETIME2(0)  NOT NULL
            CONSTRAINT DF_Neurodivergencia_Fecha DEFAULT SYSDATETIME()
    );
END
GO

/* ---------- Tabla: Guia ---------- */
IF OBJECT_ID(N'dbo.Guia', N'U') IS NULL
BEGIN
    CREATE TABLE dbo.Guia (
        IdGuia                   VARCHAR(50)   NOT NULL
            CONSTRAINT PK_Guia PRIMARY KEY,
        IdNeurodivergencia       VARCHAR(30)   NOT NULL
            CONSTRAINT FK_Guia_Neurodivergencia
            FOREIGN KEY REFERENCES dbo.Neurodivergencia (IdNeurodivergencia),
        Titulo                   NVARCHAR(150) NOT NULL,
        Categoria                NVARCHAR(100) NOT NULL,
        Emoji                    NVARCHAR(16)  NULL,
        Descripcion              NVARCHAR(500) NOT NULL,
        Orden                    INT           NOT NULL
            CONSTRAINT DF_Guia_Orden DEFAULT 0,
        Activo                   BIT           NOT NULL
            CONSTRAINT DF_Guia_Activo DEFAULT 1,
        FechaUltimaActualizacion DATETIME2(0)  NOT NULL
            CONSTRAINT DF_Guia_Fecha DEFAULT SYSDATETIME()
    );
END
GO

/* ---------- Datos iniciales (solo si las tablas están vacías) ---------- */
IF NOT EXISTS (SELECT 1 FROM dbo.Neurodivergencia)
BEGIN
    INSERT INTO dbo.Neurodivergencia (IdNeurodivergencia, Nombre) VALUES
        (N'autismo',     N'Autismo'),
        (N'tdah',        N'TDAH'),
        (N'dislexia',    N'Dislexia'),
        (N'discalculia', N'Discalculia'),
        (N'dispraxia',   N'Dispraxia');
END
GO

IF NOT EXISTS (SELECT 1 FROM dbo.Guia)
BEGIN
    INSERT INTO dbo.Guia (IdGuia, IdNeurodivergencia, Titulo, Categoria, Emoji, Descripcion, Orden) VALUES
    (N'autismo-sobrecarga', N'autismo', N'Sobrecarga de estímulos', N'Sobrecarga y entorno', N'🔊', N'Identifica posibles señales de sobrecarga sensorial y cómo reducir estímulos sin invadir el espacio personal.', 1),
    (N'autismo-comunicacion', N'autismo', N'Comunicación clara', N'Comunicación', N'💬', N'Pautas para dar instrucciones comprensibles y respetar el tiempo de procesamiento.', 2),
    (N'autismo-trabajo-equipo', N'autismo', N'Trabajo en equipo', N'Convivencia y colaboración', N'🤝', N'Organiza las actividades y distribuye responsabilidades de forma clara, aprovechando distintas maneras de participar.', 3),
    (N'autismo-examen', N'autismo', N'Situaciones durante un examen', N'Evaluación', N'📝', N'Reduce obstáculos ambientales y ofrece instrucciones explícitas para que el estudiante pueda demostrar sus conocimientos.', 4),
    (N'autismo-cambios', N'autismo', N'Cambios inesperados', N'Rutinas y transiciones', N'🔄', N'Comunica modificaciones de manera clara y anticipada, y da tiempo para adaptarse a una nueva rutina.', 5),
    (N'autismo-participacion', N'autismo', N'Participación en clase', N'Participación inclusiva', N'🙋', N'Ofrece distintas formas de participar y evita medir el conocimiento únicamente por la exposición oral o la extroversión.', 6),
    (N'autismo-retroalimentacion', N'autismo', N'Retroalimentación', N'Retroalimentación y mejora', N'🗒️', N'Da comentarios específicos, privados y estructurados para que la persona pueda revisar qué conservar y qué mejorar.', 7),
    (N'autismo-correccion', N'autismo', N'Corrección respetuosa', N'Corrección y respeto', N'🧭', N'Explica el error de forma neutral y privada, y muestra el procedimiento correcto sin avergonzar.', 8),
    (N'tdah-sobrecarga', N'tdah', N'Sobrecarga y estímulos', N'Atención y entorno', N'🔊', N'Reduce distractores y divide las instrucciones para apoyar la atención y la regulación durante actividades académicas.', 9),
    (N'tdah-comunicacion', N'tdah', N'Comunicación e instrucciones', N'Instrucciones claras', N'💬', N'Da indicaciones concretas, secuenciadas y fáciles de revisar; confirma entregables y fechas.', 10),
    (N'tdah-trabajo-equipo', N'tdah', N'Trabajo en equipo', N'Convivencia y colaboración', N'🤝', N'Distribuye tareas, acuerda responsabilidades y fechas y usa apoyos que ayuden a recordar los compromisos.', 11),
    (N'tdah-examen', N'tdah', N'Situaciones durante un examen', N'Evaluación', N'📝', N'Facilita instrucciones claras, control visual del tiempo y un entorno con menos interrupciones.', 12),
    (N'tdah-cambios', N'tdah', N'Cambios inesperados', N'Organización y transiciones', N'🔄', N'Explica los cambios con anticipación y actualiza los acuerdos, prioridades y recordatorios.', 13),
    (N'tdah-participacion', N'tdah', N'Participación e impulsividad', N'Participación en clase', N'🙋', N'Establece reglas claras y ofrece vías respetuosas para participar y regular intervenciones impulsivas.', 14),
    (N'tdah-retroalimentacion', N'tdah', N'Retroalimentación y organización', N'Organización y mejora', N'🗒️', N'Combina comentarios concretos con prioridades, fechas claras y recordatorios para facilitar la aplicación de mejoras.', 15),
    (N'tdah-correccion', N'tdah', N'Corrección y manejo respetuoso', N'Corrección y respeto', N'🧭', N'Corrige con respeto y claridad, sin atribuir intención negativa a una intervención impulsiva.', 16);
END
GO

/* ---------- Procedimiento: sp_listaGuias ---------- */
CREATE OR ALTER PROCEDURE dbo.sp_listaGuias
AS
BEGIN
    SET NOCOUNT ON;

    SELECT  g.IdGuia,
            g.Titulo,
            g.Categoria,
            g.Emoji,
            g.Descripcion,
            g.IdNeurodivergencia,
            n.Nombre AS Neurodivergencia,
            g.FechaUltimaActualizacion
    FROM    dbo.Guia AS g
            INNER JOIN dbo.Neurodivergencia AS n
                ON n.IdNeurodivergencia = g.IdNeurodivergencia
    WHERE   g.Activo = 1
    ORDER BY g.Orden, g.IdGuia;
END
GO