if db_id(N'MentesConectadasDB') is null
	create database MentesConectadasDB

go
use MentesConectadasDB

go

-- borrar los procedimientos y tablas de la version anterior
-- Procedimientos
if object_id(N'dbo.sp_listaGuias', N'P') is not null drop procedure dbo.sp_listaGuias

-- Tablas
if object_id(N'dbo.Guia', N'U') is not null drop table dbo.Guia
if object_id(N'dbo.Neurodivergencia', N'U') is not null drop table dbo.Neurodivergencia

go

-- CREAR TABLAS
-- Catalogo de neurodivergencias
create table Neurodivergencia(
	IdNeurodivergencia int primary key identity,
	Nombre varchar(50) not null unique
)

go

-- Catalogo de situaciones
create table Situacion(
	IdSituacion int primary key identity,
	Clave varchar(30) not null unique,
	Nombre varchar(60) not null,
	EsFiltro bit not null default 0
)

go

-- Personas que usan la pagina: Estudiante, Docente o Administrador
create table Usuario(
	IdUsuario int primary key identity,
	NombreCompleto varchar(100) not null,
	Correo varchar(150) not null unique,
	Contrasena varchar(200) not null,
	TipoUsuario varchar(15) not null check (TipoUsuario in ('Estudiante','Docente','Administrador')),
	Activo bit not null default 1,
	FechaRegistro datetime not null default getdate(),
	FechaUltimoAcceso datetime null
)

go

-- Guias. Activo = 0 significa "oculta", es una baja logica
create table Guia(
	IdGuia int primary key identity,
	IdNeurodivergencia int not null foreign key references Neurodivergencia(IdNeurodivergencia),
	Titulo varchar(80) not null,
	Categoria varchar(60) not null,
	Descripcion varchar(260) not null,
	Video varchar(200) null,
	ParaEstudiante bit not null default 0,
	ParaDocente bit not null default 0,
	Activo bit not null default 1,
	FechaCreacion datetime not null default getdate(),
	FechaActualizacion datetime not null default getdate(),
	check (ParaEstudiante = 1 or ParaDocente = 1)
)

go

-- Situaciones relacionadas con cada guia (una guia puede tener varias)
create table GuiaSituacion(
	IdGuia int not null foreign key references Guia(IdGuia) on delete cascade,
	IdSituacion int not null foreign key references Situacion(IdSituacion),
	primary key (IdGuia, IdSituacion)
)

go

-- Contenido de cada guia
create table Recomendacion(
	IdRecomendacion int primary key identity,
	IdGuia int not null foreign key references Guia(IdGuia) on delete cascade,
	Tipo varchar(10) not null check (Tipo in ('hacer','evitar')),
	Orden int not null,
	Texto varchar(500) not null
)

go

-- Autoevaluacion de una guia (como maximo una por guia), estas si se elimina fisicamente con sp_eliminarEvaluacion
create table Evaluacion(
	IdEvaluacion int primary key identity,
	IdGuia int not null unique foreign key references Guia(IdGuia) on delete cascade,
	FechaCreacion datetime not null default getdate()
)

go

-- Preguntas de una autoevaluacion: de 2 a 4 opciones y la letra de la correcta
create table Pregunta(
	IdPregunta int primary key identity,
	IdEvaluacion int not null foreign key references Evaluacion(IdEvaluacion) on delete cascade,
	Orden int not null,
	Texto varchar(220) not null,
	OpcionA varchar(180) not null,
	OpcionB varchar(180) not null,
	OpcionC varchar(180) null,
	OpcionD varchar(180) null,
	Correcta char(1) not null check (Correcta in ('a','b','c','d'))
)

go

-- Cada vez que una persona abre una guia
create table VistaGuia(
	IdVista int primary key identity,
	IdUsuario int not null foreign key references Usuario(IdUsuario) on delete cascade,
	IdGuia int not null foreign key references Guia(IdGuia) on delete cascade,
	Fecha datetime not null default getdate()
)

go

-- Guias guardadas en favoritos
create table Favorito(
	IdUsuario int not null foreign key references Usuario(IdUsuario) on delete cascade,
	IdGuia int not null foreign key references Guia(IdGuia) on delete cascade,
	FechaAgregado datetime not null default getdate(),
	primary key (IdUsuario, IdGuia)
)

go

-- Calificacion de 1 a 5 estrellas: una por persona y guia (se puede cambiar)
create table Calificacion(
	IdUsuario int not null foreign key references Usuario(IdUsuario) on delete cascade,
	IdGuia int not null foreign key references Guia(IdGuia) on delete cascade,
	Estrellas tinyint not null check (Estrellas between 1 and 5),
	Fecha datetime not null default getdate(),
	primary key (IdUsuario, IdGuia)
)

go

-- Resultado de cada intento de autoevaluacion. Se conserva aunque la autoevaluacion se elimine
create table ResultadoEvaluacion(
	IdResultado int primary key identity,
	IdUsuario int not null foreign key references Usuario(IdUsuario) on delete cascade,
	IdGuia int not null foreign key references Guia(IdGuia) on delete cascade,
	Aciertos int not null,
	Total int not null,
	Fecha datetime not null default getdate(),
	check (Total > 0 and Aciertos >= 0 and Aciertos <= Total)
)

go

-- Comentarios de las guias. Oculto = 1, el administrador lo oculto
create table Comentario(
	IdComentario int primary key identity,
	IdUsuario int not null foreign key references Usuario(IdUsuario) on delete cascade,
	IdGuia int not null foreign key references Guia(IdGuia) on delete cascade,
	Texto varchar(300) not null,
	Oculto bit not null default 0,
	Fecha datetime not null default getdate()
)

go

-- Donaciones. IdUsuario es NULL si la persona no tenia sesion
create table Donacion(
	IdDonacion int primary key identity,
	IdUsuario int null foreign key references Usuario(IdUsuario) on delete set null,
	Monto decimal(10,2) not null check (Monto > 0),
	OtraCantidad bit not null default 0,
	Estado varchar(12) not null default 'intencion' check (Estado in ('intencion','confirmada')),
	Fecha datetime not null default getdate()
)

go

create index IX_VistaGuia_IdGuia on VistaGuia(IdGuia)
create index IX_Comentario_IdGuia on Comentario(IdGuia)
create index IX_ResultadoEvaluacion_IdGuia on ResultadoEvaluacion(IdGuia)

go

-- DATOS INICIALES (el contenido que antes estaba en content/guias.js)
-- Neurodivergencias
set identity_insert Neurodivergencia on
insert into Neurodivergencia(IdNeurodivergencia,Nombre) values
(1,N'Autismo'),
(2,N'TDAH'),
(3,N'Dislexia'),
(4,N'Discalculia'),
(5,N'Dispraxia')
set identity_insert Neurodivergencia off

go

-- Situaciones (las 9 con EsFiltro = 1 son las del filtro y del formulario de guias)
set identity_insert Situacion on
insert into Situacion(IdSituacion,Clave,Nombre,EsFiltro) values
(1,N'sobrecarga',N'Sobrecarga de estímulos',1),
(2,N'comunicacion',N'Comunicación',1),
(3,N'trabajo-equipo',N'Trabajo en equipo',1),
(4,N'examen',N'Exámenes',1),
(5,N'cambios',N'Cambios inesperados',1),
(6,N'organizacion',N'Organización',1),
(7,N'participacion',N'Participación',1),
(8,N'retroalimentacion',N'Retroalimentación',1),
(9,N'correccion',N'Corrección respetuosa',1),
(10,N'estimulos',N'Estímulos',0),
(11,N'aula',N'Aula',0),
(12,N'atencion',N'Atención',0),
(13,N'clase',N'Clase',0),
(14,N'instrucciones',N'Instrucciones',0),
(15,N'colaboracion',N'Colaboración',0),
(16,N'convivencia',N'Convivencia',0),
(17,N'evaluacion',N'Evaluación',0),
(18,N'transiciones',N'Transiciones',0),
(19,N'impulsividad',N'Impulsividad',0),
(20,N'mejora',N'Mejora',0),
(21,N'respeto',N'Respeto',0)
set identity_insert Situacion off

go

-- Usuarios iniciales (contrasenas cifradas con PBKDF2-SHA256, 100000 iteraciones)
--   Administrador: adminMentesConectadas@gmail.com / MentesConect123
--   Estudiante de prueba: estudiante.prueba@correo.com / Estudiante123
--   Docente de prueba: docente.prueba@correo.com / Docente123
insert into Usuario(NombreCompleto,Correo,Contrasena,TipoUsuario) values
(N'Administrador',N'adminmentesconectadas@gmail.com',N'100000.4BaCkjMZwSH7VYE/Gc6LxA==.+v3zaxq3dn6nt82561EekcKxtrqbbTJKiMZqNx300+U=','Administrador'),
(N'Estudiante de prueba',N'estudiante.prueba@correo.com',N'100000.Em+B7Q0r6BjF/GlwIWd6Cg==.x92tuvvV+iQC4Mq6WdEAnRH9nNktheD+UdS8AQ1Pi+Y=','Estudiante'),
(N'Docente de prueba',N'docente.prueba@correo.com',N'100000.ZuyobbJooBdY6FTplC2r1Q==.7NSUcXBwHTLghXopbJO+jmjDEq/DVGv4q8YrtMWI9oQ=','Docente')

go

-- Guias (los 16 originales, con la ruta de su video; IdGuia 1 a 16 en el mismo orden que content/guias.js)
set identity_insert Guia on
insert into Guia(IdGuia,IdNeurodivergencia,Titulo,Categoria,Descripcion,Video,ParaEstudiante,ParaDocente) values
(1,1,N'Sobrecarga de estímulos',N'Sobrecarga y entorno',N'Identifica posibles señales de sobrecarga sensorial y cómo reducir estímulos sin invadir el espacio personal.',N'assets/videos/autismo/autismo-sobrecarga.mp4',1,1),
(2,1,N'Comunicación clara',N'Comunicación',N'Pautas para dar instrucciones comprensibles y respetar el tiempo de procesamiento.',N'assets/videos/autismo/autismo-comunicacion.mp4',1,1),
(3,1,N'Trabajo en equipo',N'Convivencia y colaboración',N'Organiza las actividades y distribuye responsabilidades de forma clara, aprovechando distintas maneras de participar.',N'assets/videos/autismo/autismo-trabajo-equipo.mp4',1,0),
(4,1,N'Situaciones durante un examen',N'Evaluación',N'Reduce obstáculos ambientales y ofrece instrucciones explícitas para que el estudiante pueda demostrar sus conocimientos.',N'assets/videos/autismo/autismo-examen.mp4',0,1),
(5,1,N'Cambios inesperados',N'Rutinas y transiciones',N'Comunica modificaciones de manera clara y anticipada, y da tiempo para adaptarse a una nueva rutina.',N'assets/videos/autismo/autismo-cambios.mp4',1,1),
(6,1,N'Participación en clase',N'Participación inclusiva',N'Ofrece distintas formas de participar y evita medir el conocimiento únicamente por la exposición oral o la extroversión.',N'assets/videos/autismo/autismo-participacion.mp4',1,1),
(7,1,N'Retroalimentación',N'Retroalimentación y mejora',N'Da comentarios específicos, privados y estructurados para que la persona pueda revisar qué conservar y qué mejorar.',N'assets/videos/autismo/autismo-retroalimentacion.mp4',0,1),
(8,1,N'Corrección respetuosa',N'Corrección y respeto',N'Explica el error de forma neutral y privada, y muestra el procedimiento correcto sin avergonzar.',N'assets/videos/autismo/autismo-correccion.mp4',0,1),
(9,2,N'Sobrecarga y estímulos',N'Atención y entorno',N'Reduce distractores y divide las instrucciones para apoyar la atención y la regulación durante actividades académicas.',N'assets/videos/tdah/tdah-sobrecarga.mp4',1,1),
(10,2,N'Comunicación e instrucciones',N'Instrucciones claras',N'Da indicaciones concretas, secuenciadas y fáciles de revisar; confirma entregables y fechas.',N'assets/videos/tdah/tdah-comunicacion.mp4',1,1),
(11,2,N'Trabajo en equipo',N'Convivencia y colaboración',N'Distribuye tareas, acuerda responsabilidades y fechas y usa apoyos que ayuden a recordar los compromisos.',N'assets/videos/tdah/tdah-trabajo-equipo.mp4',1,0),
(12,2,N'Situaciones durante un examen',N'Evaluación',N'Facilita instrucciones claras, control visual del tiempo y un entorno con menos interrupciones.',N'assets/videos/tdah/tdah-examen.mp4',0,1),
(13,2,N'Cambios inesperados',N'Organización y transiciones',N'Explica los cambios con anticipación y actualiza los acuerdos, prioridades y recordatorios.',N'assets/videos/tdah/tdah-cambios.mp4',1,1),
(14,2,N'Participación e impulsividad',N'Participación en clase',N'Establece reglas claras y ofrece vías respetuosas para participar y regular intervenciones impulsivas.',N'assets/videos/tdah/tdah-participacion.mp4',1,1),
(15,2,N'Retroalimentación y organización',N'Organización y mejora',N'Combina comentarios concretos con prioridades, fechas claras y recordatorios para facilitar la aplicación de mejoras.',N'assets/videos/tdah/tdah-retroalimentacion.mp4',0,1),
(16,2,N'Corrección y manejo respetuoso',N'Corrección y respeto',N'Corrige con respeto y claridad, sin atribuir intención negativa a una intervención impulsiva.',N'assets/videos/tdah/tdah-correccion.mp4',0,1)
set identity_insert Guia off

go

-- Situaciones de cada guia
insert into GuiaSituacion(IdGuia,IdSituacion) values
(1,1),
(1,10),
(1,11),
(1,12),
(2,2),
(2,13),
(2,14),
(3,3),
(3,15),
(3,16),
(4,4),
(4,17),
(4,13),
(5,5),
(5,18),
(5,6),
(6,7),
(6,13),
(6,19),
(7,8),
(7,6),
(7,20),
(8,9),
(8,16),
(8,21),
(9,1),
(9,10),
(9,11),
(9,12),
(10,2),
(10,13),
(10,14),
(11,3),
(11,15),
(11,16),
(12,4),
(12,17),
(12,13),
(13,5),
(13,18),
(13,6),
(14,7),
(14,13),
(14,19),
(15,8),
(15,6),
(15,20),
(16,9),
(16,16),
(16,21)

go

-- Recomendaciones y cosas por evitar de cada guia
insert into Recomendacion(IdGuia,Tipo,Orden,Texto) values
(1,'hacer',1,N'Reduce ruidos, luces, olores u otros estímulos que sea posible disminuir.'),
(1,'hacer',2,N'Guía a la persona a un espacio tranquilo, silencioso y con luz tenue.'),
(1,'hacer',3,N'Permanece cerca para cuidar la seguridad, sin invadir el espacio corporal.'),
(1,'hacer',4,N'Da espacio y tiempo; no exijas que hable o participe de inmediato.'),
(1,'hacer',5,N'Facilita herramientas de autorregulación, como auriculares o un objeto manipulable, si la persona las utiliza.'),
(1,'evitar',1,N'Tocar sin consentimiento explícito.'),
(1,'evitar',2,N'Hacer preguntas complejas, regañar u obligar a hablar durante la sobrecarga.'),
(1,'evitar',3,N'Aumentar el ruido o reunir personas alrededor.'),
(2,'hacer',1,N'Usa oraciones cortas, voz calmada y un orden claro.'),
(2,'hacer',2,N'Da instrucciones concretas y, cuando sea útil, por escrito.'),
(2,'hacer',3,N'Evita sarcasmo, ironías o dobles sentidos cuando puedan generar confusión.'),
(2,'hacer',4,N'Espera entre 5 y 10 segundos antes de repetir una pregunta.'),
(2,'hacer',5,N'No asumas que evitar el contacto visual significa falta de atención; confirma comprensión con respeto.'),
(2,'evitar',1,N'Dar instrucciones vagas o demasiado extensas.'),
(2,'evitar',2,N'Interpretar el silencio como ignorancia o falta de atención.'),
(2,'evitar',3,N'Preguntar de forma que la persona se sienta señalada.'),
(3,'hacer',1,N'Estructura el trabajo con listas de tareas y calendarios compartidos.'),
(3,'hacer',2,N'Asigna roles concretos según fortalezas e intereses individuales.'),
(3,'hacer',3,N'Permite aportaciones por escrito o asincrónicas cuando sea viable.'),
(3,'hacer',4,N'Acuerda por escrito canales, horarios, entregables y formatos.'),
(3,'hacer',5,N'Comunica inmediatamente cambios de integrantes o fechas y explica el nuevo plan.'),
(3,'evitar',1,N'Obligar a que toda lluvia de ideas sea únicamente verbal y caótica.'),
(3,'evitar',2,N'Dejar responsabilidades implícitas o cambiar reglas constantemente.'),
(3,'evitar',3,N'Asumir que una forma distinta de participar es falta de compromiso.'),
(4,'hacer',1,N'Permite sentarse lejos de distractores como ventanas o pasillos concurridos cuando sea posible.'),
(4,'hacer',2,N'Escribe instrucciones explícitas y evita trampas lingüísticas o interpretativas.'),
(4,'hacer',3,N'Utiliza un cronómetro visual silencioso en lugar de advertencias verbales constantes.'),
(4,'hacer',4,N'Ante señales de sobrecarga, considera una pausa o pase de salida discreto según los acuerdos disponibles.'),
(4,'hacer',5,N'Responde dudas de forma neutral y respetuosa.'),
(4,'evitar',1,N'Quitar el examen abruptamente.'),
(4,'evitar',2,N'Invalidar dudas como si fueran obvias.'),
(4,'evitar',3,N'Pararse detrás del asiento y observar fijamente.'),
(5,'hacer',1,N'Comunica el cambio de forma asertiva y objetiva, usando apoyos visuales si es posible.'),
(5,'hacer',2,N'Avisa tan pronto como se conozca el cambio, por correo o mensaje.'),
(5,'hacer',3,N'Explica el nuevo plan, el lugar, la hora y los pasos siguientes.'),
(5,'hacer',4,N'Permite una ventana de transición antes de exigir rendimiento pleno.'),
(5,'evitar',1,N'Usar frases vagas como «al rato vemos».'),
(5,'evitar',2,N'Avisar a última hora sin explicar.'),
(5,'evitar',3,N'Exigir una transición inmediata sin tiempo de adaptación.'),
(6,'hacer',1,N'Permite participar por chat, encuestas, notas o ensayos breves.'),
(6,'hacer',2,N'Da tiempo para preparar respuestas y evita preguntas al azar frente al grupo.'),
(6,'hacer',3,N'En debates o dinámicas, ofrece roles como moderador escrito, evaluador o documentador.'),
(6,'hacer',4,N'Evalúa el conocimiento y los objetivos de aprendizaje, no la extroversión.'),
(6,'evitar',1,N'Obligar a participar oralmente como única opción.'),
(6,'evitar',2,N'Exigir respuestas inmediatas delante del grupo.'),
(6,'evitar',3,N'Interpretar que no hablar equivale a no saber.'),
(7,'hacer',1,N'Ofrece retroalimentación en privado y, cuando sea útil, por escrito.'),
(7,'hacer',2,N'Organiza los comentarios: puntos positivos y después aspectos a mejorar.'),
(7,'hacer',3,N'Separa a la persona del trabajo o conducta que se está revisando.'),
(7,'hacer',4,N'Indica acciones concretas, por ejemplo, qué sección corregir o qué referencia agregar.'),
(7,'evitar',1,N'Gritar o corregir frente al grupo.'),
(7,'evitar',2,N'Usar frases ambiguas como «dale otra pasada» o «ponle más ganas».'),
(7,'evitar',3,N'Personalizar el error o atribuir malas intenciones.'),
(8,'hacer',1,N'Usa un tono neutral, sin sarcasmo ni enojo.'),
(8,'hacer',2,N'Describe qué ocurrió sin juzgar la intención.'),
(8,'hacer',3,N'Muestra un ejemplo o modelo visual del procedimiento correcto, paso a paso.'),
(8,'hacer',4,N'Habla en privado cuando sea necesario corregir un error conceptual o una conducta de autorregulación.'),
(8,'evitar',1,N'Avergonzar a la persona frente al grupo.'),
(8,'evitar',2,N'Interpretar automáticamente una reacción emocional como falta de respeto.'),
(8,'evitar',3,N'Juzgar la intención en lugar de describir el hecho.'),
(9,'hacer',1,N'Reduce estímulos innecesarios y evita interrupciones que no sean necesarias.'),
(9,'hacer',2,N'Da una instrucción a la vez y divide la actividad en pasos.'),
(9,'hacer',3,N'Usa listas, recordatorios visuales y organización del tiempo.'),
(9,'hacer',4,N'Si pierde la concentración, redirige la atención con respeto y una indicación concreta.'),
(9,'evitar',1,N'Dar muchas instrucciones juntas.'),
(9,'evitar',2,N'Añadir distractores o interrupciones innecesarias.'),
(9,'evitar',3,N'Ridiculizar o quitar la actividad como castigo por distraerse.'),
(10,'hacer',1,N'Da instrucciones claras, concretas, por pasos y también por escrito cuando sea útil.'),
(10,'hacer',2,N'Evita indicaciones generales como «haz lo que puedas».'),
(10,'hacer',3,N'Confirma qué se debe entregar, en qué formato y cuándo.'),
(10,'hacer',4,N'Usa recordatorios o acuerdos visibles y mantén comunicación clara.'),
(10,'evitar',1,N'Cambiar el plan sin avisar.'),
(10,'evitar',2,N'Interrumpir constantemente.'),
(10,'evitar',3,N'Suponer que el silencio confirma que todo quedó claro.'),
(11,'hacer',1,N'Divide tareas grandes en pasos pequeños.'),
(11,'hacer',2,N'Establece responsabilidades, fechas y entregables claros.'),
(11,'hacer',3,N'Utiliza listas, checklists, calendarios compartidos y recordatorios.'),
(11,'hacer',4,N'Mantén acuerdos visibles y comunicación clara.'),
(11,'hacer',5,N'No asumas que una distracción significa falta de interés.'),
(11,'evitar',1,N'Dejar tareas enormes sin dividir ni fecha.'),
(11,'evitar',2,N'Cambiar responsabilidades constantemente.'),
(11,'evitar',3,N'Interpretar automáticamente una distracción como flojera o falta de compromiso.'),
(12,'hacer',1,N'Permite ubicarse lejos de distractores cuando sea posible.'),
(12,'hacer',2,N'Presenta instrucciones claras y por escrito.'),
(12,'hacer',3,N'Divide el examen en bloques o ayuda a priorizar actividades y tiempo disponible.'),
(12,'hacer',4,N'Utiliza referencias visuales de tiempo y evita interrupciones innecesarias.'),
(12,'hacer',5,N'Ante distracciones, considera una pausa breve acordada y redirige con una instrucción concreta.'),
(12,'evitar',1,N'Presionar constantemente por el tiempo.'),
(12,'evitar',2,N'Invalidar dudas o quitar el examen abruptamente.'),
(12,'evitar',3,N'Añadir interrupciones o exponer al estudiante delante del grupo.'),
(13,'hacer',1,N'Comunica los cambios con anticipación, de forma clara y por escrito cuando sea posible.'),
(13,'hacer',2,N'Explica el nuevo plan y actualiza recordatorios y fechas.'),
(13,'hacer',3,N'Permite una ventana de transición y ayuda a priorizar tareas.'),
(13,'hacer',4,N'Confirma qué debe entregarse y cuándo.'),
(13,'evitar',1,N'Usar frases vagas o avisar en el último momento sin explicación.'),
(13,'evitar',2,N'Exigir una transición inmediata sin aclarar prioridades.'),
(13,'evitar',3,N'Cambiar acuerdos sin hacerlos visibles.'),
(14,'hacer',1,N'Establece reglas de turnos claras y oportunidades de participación.'),
(14,'hacer',2,N'Redirige la atención de manera respetuosa y recuerda los acuerdos de forma discreta.'),
(14,'hacer',3,N'Permite aportar ideas por chat o notas, o usar turnos asignados.'),
(14,'hacer',4,N'Reconoce el esfuerzo por regularse y facilitar la reincorporación a la actividad.'),
(14,'evitar',1,N'Interpretar automáticamente una interrupción como falta de respeto.'),
(14,'evitar',2,N'Señalar o ridiculizar frente al grupo.'),
(14,'evitar',3,N'Excluir a la persona después de una intervención impulsiva.'),
(15,'hacer',1,N'Da retroalimentación en privado, clara, específica y por escrito cuando sea útil.'),
(15,'hacer',2,N'Indica qué mantener, qué ajustar y cuáles son los siguientes pasos.'),
(15,'hacer',3,N'Divide el trabajo en bloques y prioriza lo urgente e importante.'),
(15,'hacer',4,N'Confirma fechas, entregables y acuerdos; mantén recordatorios visibles.'),
(15,'evitar',1,N'Gritar frente al grupo o usar indirectas.'),
(15,'evitar',2,N'Usar frases ambiguas como «échale más ganas».'),
(15,'evitar',3,N'Cambiar acuerdos sin avisar ni dejar recordatorios.'),
(16,'hacer',1,N'Explica el error sin asumir que fue intencional.'),
(16,'hacer',2,N'Indica cómo hacerlo correctamente, paso a paso, y da tiempo para reincorporarse.'),
(16,'hacer',3,N'Ofrece vías alternativas para aportar, como anotar la idea o esperar un turno.'),
(16,'hacer',4,N'Reconoce el esfuerzo por regularse y mantener la participación.'),
(16,'evitar',1,N'Ridiculizar o señalar frente al grupo.'),
(16,'evitar',2,N'Quitar toda oportunidad de participar después de una interrupción.'),
(16,'evitar',3,N'Suponer automáticamente que una distracción demuestra desinterés.')

go

-- Autoevaluaciones (una por guia; IdEvaluacion = IdGuia)
set identity_insert Evaluacion on
insert into Evaluacion(IdEvaluacion,IdGuia) values
(1,1),
(2,2),
(3,3),
(4,4),
(5,5),
(6,6),
(7,7),
(8,8),
(9,9),
(10,10),
(11,11),
(12,12),
(13,13),
(14,14),
(15,15),
(16,16)
set identity_insert Evaluacion off

go

-- Preguntas de las autoevaluaciones
insert into Pregunta(IdEvaluacion,Orden,Texto,OpcionA,OpcionB,OpcionC,OpcionD,Correcta) values
(1,1,N'¿Qué es la sobrecarga de estímulos?',N'Un colapso en el que se recibe más información sensorial de la que se puede procesar.',N'Una conducta para llamar la atención.',N'Falta de ganas de trabajar.',null,'a'),
(1,2,N'¿Cuál puede ser una señal física de sobrecarga?',N'Pedir participar más.',N'Taparse los oídos u ojos, balancearse intensamente o respirar agitadamente.',N'Sonreír constantemente.',null,'b'),
(1,3,N'¿Qué conviene hacer primero?',N'Aumentar el ruido para distraer.',N'Reducir estímulos innecesarios cuando sea posible.',N'Exigir una respuesta inmediata.',null,'b'),
(1,4,N'¿Qué debe evitarse durante una sobrecarga?',N'Tocar sin consentimiento, hacer preguntas complejas o regañar.',N'Guiar a un espacio tranquilo.',N'Dar espacio y tiempo.',null,'a'),
(1,5,N'¿Cómo cuidar la seguridad durante una crisis?',N'Sujetar fuertemente a la persona.',N'Permanecer cerca sin invadir su espacio corporal.',N'Llevarla al centro del salón.',null,'b'),
(1,6,N'¿Cómo reducir estímulos del entorno?',N'Poner música alta.',N'Apagar luces fluorescentes, silenciar dispositivos y bajar la voz.',N'Hacer preguntas complejas.',null,'b'),
(2,1,N'¿Cómo debe ser una instrucción?',N'Corta, concreta, ordenada y con voz calmada.',N'Con sarcasmo y dobles sentidos.',N'Larga y con mucha información a la vez.',null,'a'),
(2,2,N'¿Cuál es un ejemplo de instrucción concreta?',N'Termina pronto.',N'Escribe las conclusiones de la página 3 y entrégalas a las 4:00 p. m.',N'Échale ganas.',null,'b'),
(2,3,N'¿Por qué evitar dobles sentidos, sarcasmo e ironías?',N'El procesamiento puede ser literal y generar confusión.',N'Porque es divertido.',N'Porque no les gusta reírse.',null,'a'),
(2,4,N'¿Cuánto tiempo esperar antes de repetir una pregunta?',N'Un segundo.',N'Entre 5 y 10 segundos.',N'No esperar.',null,'b'),
(2,5,N'¿La falta de contacto visual significa falta de atención?',N'Sí, es falta de respeto.',N'No necesariamente; mirar a los ojos puede dificultar escuchar para algunas personas.',N'Sí, significa desinterés.',null,'b'),
(2,6,N'¿Cómo confirmar que comprendió sin señalar?',N'Preguntar frente a todos si entendió porque es obvio.',N'Pedir que explique con sus palabras el primer paso.',N'Asumir que el silencio significa que sí.',null,'b'),
(3,1,N'¿Cómo organizar las actividades del equipo?',N'Con listas de tareas y calendarios digitales compartidos.',N'Dejando todo a la improvisación.',N'Solo con instrucciones verbales rápidas.',null,'a'),
(3,2,N'¿Cómo distribuir responsabilidades?',N'Que todos hagan todo sin orden.',N'Asignar roles específicos según las fortalezas individuales.',N'Que una persona decida todo.',null,'b'),
(3,3,N'¿Qué debe evitarse al pedir ideas?',N'Permitir aportes por escrito.',N'Obligar a que la lluvia de ideas sea únicamente verbal y caótica.',N'Usar chat o notas.',null,'b'),
(3,4,N'¿Qué establecer desde el primer día?',N'Nada.',N'Normas escritas: canales, horarios y formatos.',N'Cambiar las reglas a diario.',null,'b'),
(3,5,N'¿Cómo comunicar un cambio de integrante o fecha?',N'No decir nada.',N'Avisar pronto con un mensaje claro que explique el nuevo plan.',N'Esperar que el equipo lo adivine.',null,'b'),
(3,6,N'¿Qué favorece una colaboración inclusiva?',N'Listas visuales, roles claros y aportes por escrito cuando sea posible.',N'Solo lluvia de ideas verbal y caótica.',N'Observar fijamente a quien trabaja.',null,'a'),
(4,1,N'¿Qué hacer si hay dificultad relacionada con el ambiente?',N'Permitir sentarse lejos de ventanas o pasillos concurridos.',N'Sentar junto a una fuente de ruido.',N'Sentar en medio del ruido.',null,'a'),
(4,2,N'¿Qué genera presión innecesaria?',N'Usar un cronómetro visual silencioso.',N'Recordar constantemente el tiempo en tono de advertencia.',N'Escribir instrucciones explícitas.',null,'b'),
(4,3,N'¿Cómo deben ser las instrucciones del examen?',N'Con trampas lingüísticas.',N'Explícitas y sin trampas interpretativas.',N'Solo verbales y rápidas.',null,'b'),
(4,4,N'¿Qué hacer ante una posible sobrecarga?',N'Quitar el examen abruptamente.',N'Considerar un pase discreto para caminar o tomar agua, según los acuerdos.',N'Observar fijamente al estudiante.',null,'b'),
(4,5,N'¿Qué se debe evitar durante el examen?',N'Responder dudas con neutralidad.',N'Invalidar dudas por considerarlas obvias o quitar el examen abruptamente.',N'Permitir herramientas de autorregulación acordadas.',null,'b'),
(4,6,N'¿Cuál es el objetivo de adaptar el entorno?',N'Dar una ventaja académica.',N'Reducir la carga sensorial para que pueda demostrar sus conocimientos.',N'Hacer más fácil el contenido.',null,'b'),
(5,1,N'¿Cómo comunicar un cambio?',N'De forma asertiva, objetiva y con apoyos visuales si es posible.',N'Con frases vagas.',N'Gritándolo en el último segundo.',null,'a'),
(5,2,N'¿Cuándo avisar de un cambio?',N'Nunca.',N'Con la mayor anticipación posible por correo o mensaje.',N'Dos minutos antes sin explicar.',null,'b'),
(5,3,N'¿Por qué puede ayudar la predictibilidad?',N'Porque saber qué ocurrirá puede reducir la incertidumbre y facilitar la adaptación.',N'Porque no le gusta estudiar.',N'Porque toda conducta es aprendida.',null,'a'),
(5,4,N'¿Qué frase conviene evitar?',N'La clase cambia al salón B a las 10:00.',N'Al rato vemos dónde nos acomodamos.',N'Te envío el nuevo plan con hora y lugar.',null,'b'),
(5,5,N'¿Cómo comunicar un cambio inesperado?',N'Con anticipación, objetividad y apoyo visual cuando sea posible.',N'Con frases vagas.',N'Avisando dos minutos antes sin explicar.',null,'a'),
(5,6,N'¿Qué hacer después del cambio?',N'Exigir rendimiento óptimo inmediato.',N'Permitir una ventana de transición.',N'Asignar un examen sorpresa.',null,'b'),
(6,1,N'¿Cuál es una forma válida de participar?',N'Solo hablando frente a todos.',N'Chats, encuestas, ensayos breves o notas escritas.',N'Si no habla, no participa.',null,'b'),
(6,2,N'¿Qué se debe evitar al preguntar?',N'Permitir una respuesta escrita después.',N'Lanzar preguntas al azar frente a todo el grupo.',N'Dar tiempo para preparar.',null,'b'),
(6,3,N'¿La exposición pública obligatoria puede ser?',N'La única forma de evaluar.',N'Un detonante de ansiedad intensa.',N'Obligatoria sin excepción.',null,'b'),
(6,4,N'¿Qué rol inclusivo puede ofrecerse en una dinámica?',N'Obligar a actuar aunque cause malestar.',N'Moderador escrito, evaluador o documentador.',N'Excluir a la persona.',null,'b'),
(6,5,N'¿Cómo medir la competencia académica?',N'Por el conocimiento, no por la extroversión.',N'Por quién habla más fuerte.',N'Por quién mira más a los ojos.',null,'a'),
(6,6,N'¿Qué afirmación es incorrecta?',N'Diseñar métodos alternativos.',N'Si no participa oralmente, no sabe.',N'La participación puede ser asincrónica.',null,'b'),
(7,1,N'¿Cómo dar retroalimentación clara?',N'Gritando frente al grupo.',N'En privado, estructurada y por escrito cuando sea útil.',N'Con indirectas.',null,'b'),
(7,2,N'¿Cómo separar persona y conducta?',N'Decir que siempre hace todo mal.',N'Indicar que el reporte necesita ajustes.',N'Personalizar el error.',null,'b'),
(7,3,N'¿Qué comentario ambiguo conviene evitar?',N'En página 2 agrega dos referencias APA.',N'Dale otra pasada o ponle más ganas.',N'Cambia el orden de las secciones.',null,'b'),
(7,4,N'¿Cómo dar una corrección útil?',N'En privado, neutral, específica y con ejemplo.',N'En voz alta frente a todos.',N'Con frases ambiguas.',null,'a'),
(7,5,N'¿Por qué puede ayudar darla por escrito?',N'Para regañar después.',N'Para revisar la información sin la carga emocional del momento.',N'No sirve.',null,'b'),
(7,6,N'¿Qué significa ser específico?',N'Decir «mejóralo».',N'Indicar exactamente qué se espera del trabajo revisado.',N'Decir «no me gustó».',null,'b'),
(8,1,N'¿Cómo corregir de manera respetuosa?',N'Con tono neutro y hechos objetivos, sin sarcasmo.',N'Con enojo frente a todos.',N'Burlándose.',null,'a'),
(8,2,N'¿Qué hacer después de explicar qué ocurrió?',N'Dejar a la persona sola.',N'Mostrar cómo hacerlo correctamente con un ejemplo paso a paso.',N'Decirle que lo averigüe.',null,'b'),
(8,3,N'¿Qué se debe evitar al corregir?',N'Agendar una charla privada.',N'Avergonzar a la persona frente al grupo.',N'Corregir en privado.',null,'b'),
(8,4,N'¿Dónde corregir un error conceptual o una conducta de autorregulación?',N'En voz alta delante de todos.',N'En privado, sin exponerla ante compañeros.',N'Publicándolo en el grupo.',null,'b'),
(8,5,N'¿Cómo describir el error?',N'Juzgando la intención.',N'Describir lo ocurrido sin juzgar la intención.',N'Decir que lo hizo a propósito.',null,'b'),
(8,6,N'Si evita la mirada o se balancea al corregir, ¿qué conviene recordar?',N'Que es falta de respeto.',N'Puede ser una forma de procesar frustración o ansiedad.',N'Que no le importa.',null,'b'),
(9,1,N'¿Qué puede contribuir a una sobrecarga de estímulos?',N'Un ambiente silencioso.',N'Exceso de estímulos, ruido y muchas instrucciones a la vez.',N'Una tarea clara.',null,'b'),
(9,2,N'¿Qué hacer primero ante la sobrecarga?',N'Dar cinco instrucciones juntas.',N'Reducir estímulos, dar una instrucción a la vez y acordar apoyos.',N'Añadir distractores.',null,'b'),
(9,3,N'¿Qué debe evitar el entorno?',N'Usar calendarios compartidos.',N'Interrupciones innecesarias y cambios sin avisar.',N'Mantener comunicación clara.',null,'b'),
(9,4,N'¿Qué ayuda a reducir distracciones?',N'Música alta.',N'Organizar tiempo, reducir distractores y usar recordatorios visuales.',N'Luces parpadeantes.',null,'b'),
(9,5,N'¿Qué hacer si pierde la concentración?',N'Ridiculizar.',N'Redirigir la atención con respeto e instrucción concreta.',N'Quitarle todo el trabajo.',null,'b'),
(9,6,N'¿Qué puede ayudar ante una posible sobrecarga?',N'Aumentar el ruido.',N'Reducir estímulos y dividir las tareas.',N'Exigir respuesta inmediata.',null,'b'),
(10,1,N'¿Cómo deben ser las instrucciones?',N'Demasiado generales.',N'Claras, concretas, por pasos y por escrito.',N'Con indirectas.',null,'b'),
(10,2,N'¿Qué conviene evitar?',N'Confirmar qué se entrega.',N'Instrucciones demasiado generales como «haz lo que puedas».',N'Recordatorios oportunos.',null,'b'),
(10,3,N'¿Cómo mantener comunicación clara?',N'Cambiar el plan sin avisar.',N'Usar recordatorios, acuerdos del equipo y comunicación clara.',N'Interrumpir constantemente.',null,'b'),
(10,4,N'¿Cómo confirmar que comprendió?',N'Asumir que el silencio significa sí.',N'Confirmar con sus palabras qué debe entregar y cuándo.',N'No confirmar.',null,'b'),
(10,5,N'¿Cómo debe ser una instrucción?',N'Larga y general.',N'Corta, concreta, ordenada y con fecha clara.',N'Con sarcasmo.',null,'b'),
(10,6,N'¿Qué hacer si hay distracción por instrucciones confusas?',N'Regañar.',N'Aclarar la instrucción y evitar interrupciones innecesarias.',N'Dar instrucciones más confusas.',null,'b'),
(11,1,N'¿Cómo distribuir tareas?',N'Dar una tarea enorme sin dividir.',N'Dividir tareas grandes en pasos claros.',N'No establecer fechas.',null,'b'),
(11,2,N'¿Cómo establecer responsabilidades?',N'Que nadie sepa qué hace.',N'Definir responsabilidades, fechas y entregables.',N'Cambiar tareas constantemente.',null,'b'),
(11,3,N'¿Qué ayuda a cumplir entregas?',N'No recordar nunca.',N'Recordar entregas importantes y usar recordatorios.',N'Comunicar solo verbalmente y sin detalles.',null,'b'),
(11,4,N'¿Una distracción significa falta de interés?',N'Siempre es flojera.',N'No debe asumirse automáticamente.',N'Siempre es falta de compromiso.',null,'b'),
(11,5,N'¿Qué favorece el trabajo en equipo?',N'Presión y lluvia de ideas caótica.',N'Listas, roles claros, fechas y participación por escrito cuando sea viable.',N'Observar fijamente a la persona.',null,'b'),
(11,6,N'¿Qué herramienta puede ayudar al equipo?',N'Asumir desinterés.',N'Listas, checklists y calendarios compartidos.',N'Instrucciones confusas.',null,'b'),
(12,1,N'¿Qué puede ayudar durante un examen?',N'Sentarse junto a una ventana ruidosa.',N'Menos distractores, instrucciones claras y organización del tiempo.',N'Aumentar el ruido.',null,'b'),
(12,2,N'¿Qué evitar durante el examen?',N'Un cronómetro visual silencioso.',N'Interrupciones innecesarias y presión constante por el tiempo.',N'Instrucciones escritas.',null,'b'),
(12,3,N'¿Cómo organizar el tiempo?',N'Hacer todo de golpe sin orden.',N'Dividir el examen en bloques y hacer visible el tiempo.',N'No usar ninguna referencia de tiempo.',null,'b'),
(12,4,N'¿Qué hacer ante distracciones?',N'Quitar el examen.',N'Considerar una pausa breve de regulación y redirigir con una instrucción concreta.',N'Exponer al estudiante.',null,'b'),
(12,5,N'¿Qué no debe hacerse?',N'Permitir agua según los acuerdos.',N'Quitar el examen abruptamente o invalidar dudas.',N'Dar instrucciones claras.',null,'b'),
(12,6,N'¿Qué favorece el rendimiento?',N'Música alta.',N'Ambiente estructurado, pocas interrupciones y recordatorios claros.',N'Observar fijamente desde atrás.',null,'b'),
(13,1,N'¿Cómo comunicar un cambio inesperado?',N'Con una frase vaga.',N'Con anticipación, claridad, por escrito y con recordatorio.',N'A última hora sin explicar.',null,'b'),
(13,2,N'¿Qué frase conviene evitar?',N'La junta cambia al martes a las 10:00 en el salón B.',N'Al rato vemos dónde nos acomodamos.',N'Te envío el nuevo plan.',null,'b'),
(13,3,N'¿Cómo se debe comunicar un cambio?',N'Con frases vagas.',N'De forma clara, objetiva, anticipada y con apoyo visual si es posible.',N'Avisando dos minutos antes sin explicar.',null,'b'),
(13,4,N'¿Qué conviene dar después del cambio?',N'Exigir rendimiento inmediato.',N'Una ventana de transición y ayuda para priorizar.',N'Una tarea extra sin explicación.',null,'b'),
(13,5,N'¿Por qué puede ser difícil un cambio?',N'Porque no quiere trabajar.',N'Puede requerir reorganizar el plan y actualizar recordatorios.',N'Porque es rebeldía.',null,'b'),
(13,6,N'¿Qué ayuda a adaptarse?',N'No explicar nada.',N'Mostrar el nuevo plan y confirmar qué se entrega y cuándo.',N'Improvisar.',null,'b'),
(14,1,N'¿Una intervención impulsiva significa falta de respeto?',N'Sí, siempre.',N'No debe interpretarse automáticamente como falta de respeto.',N'Se hace siempre para molestar.',null,'b'),
(14,2,N'¿Cómo manejar la impulsividad en clase?',N'Prohibir participar.',N'Establecer reglas claras y dar oportunidades de participación.',N'Ridiculizar.',null,'b'),
(14,3,N'¿Cómo participar sin presión innecesaria?',N'Solo oralmente y de inmediato.',N'Ofrecer chat, notas o turnos claros.',N'Hacer preguntas sorpresa frente al grupo.',null,'b'),
(14,4,N'¿Qué hacer si interrumpe?',N'Señalar frente al grupo.',N'Redirigir con respeto y recordar la regla de forma privada.',N'Ignorar y excluir.',null,'b'),
(14,5,N'¿Qué debe evitarse?',N'Dar turnos claros.',N'Señalar o ridiculizar frente al grupo.',N'Permitir aportes por escrito.',null,'b'),
(14,6,N'¿Qué ayuda a la participación?',N'No establecer reglas.',N'Reglas claras y oportunidades organizadas de participación.',N'Cambiar reglas a diario.',null,'b'),
(15,1,N'¿Cómo dar retroalimentación?',N'Gritando frente al grupo.',N'En privado, clara, específica y por escrito cuando sea útil.',N'Con indirectas.',null,'b'),
(15,2,N'¿Cómo organizar el tiempo?',N'Todo al mismo tiempo sin orden.',N'Dividir en bloques, priorizar y usar recordatorios.',N'No recordar nunca.',null,'b'),
(15,3,N'¿Qué significa priorizar?',N'No ordenar las actividades.',N'Ordenar qué es urgente e importante.',N'Hacer primero lo menos importante.',null,'b'),
(15,4,N'¿Qué conviene recordar?',N'Nada.',N'Entregas importantes y fechas claras.',N'Solo verbalmente, sin detalles.',null,'b'),
(15,5,N'¿Qué ayuda a aplicar la retroalimentación?',N'Dar comentarios ambiguos y gritar.',N'Indicar por escrito qué mantener y ajustar, y confirmar qué se entrega y cuándo.',N'No dar retroalimentación.',null,'b'),
(15,6,N'¿Qué condiciones previenen frustración y facilitan cumplir?',N'Instrucciones ambiguas y cambios sin aviso.',N'Fechas claras, recordatorios oportunos y acuerdos visibles y estables.',N'Eliminar toda estructura.',null,'b'),
(16,1,N'Ante una intervención impulsiva, ¿qué interpretación es más adecuada?',N'Asumir que es una falta de respeto intencional.',N'Entender que puede relacionarse con dificultad para inhibir impulsos y no asumir falta de respeto.',N'Asumir que quiere molestar.',null,'b'),
(16,2,N'¿Qué hacer después de explicar un error?',N'Dejar a la persona sola.',N'Mostrar cómo hacerlo correctamente paso a paso y dar tiempo de transición.',N'Decirle que lo averigüe.',null,'b'),
(16,3,N'¿Qué evitar al corregir?',N'Dar un ejemplo.',N'Señalar o ridiculizar frente al grupo.',N'Dar oportunidad de volver a participar.',null,'b'),
(16,4,N'¿Qué alternativa inclusiva puede ofrecerse?',N'Quitarle la oportunidad de participar.',N'Anotar la idea en chat o nota, o esperar su turno.',N'Ignorar su aportación.',null,'b'),
(16,5,N'¿Qué ayuda a mantener la motivación tras corregir una conducta?',N'Centrarse solo en el error y excluir.',N'Indicar cómo reincorporarse y reconocer el esfuerzo por regularse.',N'Ignorar a la persona el resto de la clase.',null,'b'),
(16,6,N'¿Qué debe evitar el entorno durante una corrección?',N'Usar recordatorios visuales.',N'Interrumpir innecesariamente, ridiculizar o asumir falta de interés.',N'Establecer reglas claras y dividir tareas.',null,'b')


go

--FUNCION AUXILIAR: separa un texto en partes (una recomendacion por linea, situaciones separadas por coma)

create function dbo.fn_dividirTexto(@Texto varchar(max), @Separador char(1))
returns @Resultado table(Orden int, Valor varchar(500))
as
begin
	declare @Orden int = 0
	declare @Pos int
	declare @Parte varchar(max)

	set @Texto = replace(isnull(@Texto, ''), char(13), '')

	while len(@Texto) > 0
	begin
		set @Pos = charindex(@Separador, @Texto)
		if @Pos = 0
		begin
			set @Parte = @Texto
			set @Texto = ''
		end
		else
		begin
			set @Parte = left(@Texto, @Pos - 1)
			set @Texto = substring(@Texto, @Pos + 1, len(@Texto))
		end

		set @Parte = ltrim(rtrim(@Parte))
		if @Parte <> ''
		begin
			set @Orden = @Orden + 1
			insert into @Resultado(Orden, Valor) values (@Orden, left(@Parte, 500))
		end
	end

	return
end

go

--PROCEDIMIENTOS ALMACENADOS

/* ---------------------------------------- CATALOGOS ---------------------------------------- */
create procedure sp_listaNeurodivergencias
as
begin
	set nocount on;

	select IdNeurodivergencia, Nombre
	from Neurodivergencia
	order by IdNeurodivergencia
end

go

create procedure sp_listaSituaciones
as
begin
	set nocount on;

	select IdSituacion, Clave, Nombre, EsFiltro
	from Situacion
	order by IdSituacion
end

go

/* ---------------------------------------- GUIAS ---------------------------------------- */
create procedure sp_listaGuias(
@IdNeurodivergencia int = null,
@Situacion varchar(30) = null,
@Texto varchar(100) = null,
@TipoUsuario varchar(15) = null,
@SoloVisibles bit = 0
)
as
begin
	set nocount on;

	declare @Patron varchar(102)
	set @Patron = '%' + ltrim(rtrim(isnull(@Texto, ''))) + '%'

	select
		g.IdGuia,
		g.Titulo,
		g.Categoria,
		g.Descripcion,
		g.Video,
		g.IdNeurodivergencia,
		n.Nombre as Neurodivergencia,
		g.ParaEstudiante,
		g.ParaDocente,
		g.Activo,
		stuff((select ',' + s.Clave
			from GuiaSituacion gs
			inner join Situacion s on s.IdSituacion = gs.IdSituacion
			where gs.IdGuia = g.IdGuia
			order by s.IdSituacion
			for xml path('')), 1, 1, '') as Situaciones,
		(select count(*) from Evaluacion e
			inner join Pregunta p on p.IdEvaluacion = e.IdEvaluacion
			where e.IdGuia = g.IdGuia) as TotalPreguntas,
		cast((select avg(cast(c.Estrellas as decimal(5,2))) from Calificacion c where c.IdGuia = g.IdGuia) as decimal(3,1)) as PromedioCalificacion,
		(select count(*) from Calificacion c where c.IdGuia = g.IdGuia) as TotalCalificaciones,
		(select count(*) from Comentario m where m.IdGuia = g.IdGuia and m.Oculto = 0) as TotalComentarios
	from Guia g
	inner join Neurodivergencia n on n.IdNeurodivergencia = g.IdNeurodivergencia
	where (@IdNeurodivergencia is null or g.IdNeurodivergencia = @IdNeurodivergencia)
	and (@SoloVisibles = 0 or g.Activo = 1)
	and (@TipoUsuario is null
		or @TipoUsuario not in ('Estudiante','Docente')
		or (@TipoUsuario = 'Estudiante' and g.ParaEstudiante = 1)
		or (@TipoUsuario = 'Docente' and g.ParaDocente = 1))
	and (isnull(@Situacion, '') = ''
		or exists (select 1 from GuiaSituacion gs
			inner join Situacion s on s.IdSituacion = gs.IdSituacion
			where gs.IdGuia = g.IdGuia and s.Clave = @Situacion))
	and (len(@Patron) = 2
		or g.Titulo like @Patron collate Latin1_General_CI_AI
		or g.Categoria like @Patron collate Latin1_General_CI_AI
		or g.Descripcion like @Patron collate Latin1_General_CI_AI
		or n.Nombre like @Patron collate Latin1_General_CI_AI
		or exists (select 1 from GuiaSituacion gs
			inner join Situacion s on s.IdSituacion = gs.IdSituacion
			where gs.IdGuia = g.IdGuia
			and (s.Clave like @Patron collate Latin1_General_CI_AI or s.Nombre like @Patron collate Latin1_General_CI_AI)))
	order by g.IdGuia
end

go

-- Consulta por ID. Regresa 3 resultados: 1) la guia, 2) sus recomendaciones, 3) sus situaciones
create procedure sp_obtenerGuia(
@IdGuia int
)
as
begin
	set nocount on;

	select
		g.IdGuia,
		g.Titulo,
		g.Categoria,
		g.Descripcion,
		g.Video,
		g.IdNeurodivergencia,
		n.Nombre as Neurodivergencia,
		g.ParaEstudiante,
		g.ParaDocente,
		g.Activo,
		g.FechaCreacion,
		g.FechaActualizacion
	from Guia g
	inner join Neurodivergencia n on n.IdNeurodivergencia = g.IdNeurodivergencia
	where g.IdGuia = @IdGuia

	select Tipo, Orden, Texto
	from Recomendacion
	where IdGuia = @IdGuia
	order by Tipo, Orden

	select s.IdSituacion, s.Clave, s.Nombre, s.EsFiltro
	from GuiaSituacion gs
	inner join Situacion s on s.IdSituacion = gs.IdSituacion
	where gs.IdGuia = @IdGuia
	order by s.IdSituacion
end

go

-- Nueva guia. @Recomendaciones y @Evitar: una por linea. @Situaciones: claves separadas por coma
create procedure sp_crearGuia(
@Titulo varchar(80),
@IdNeurodivergencia int,
@Categoria varchar(60),
@Descripcion varchar(260),
@Recomendaciones varchar(max),
@Evitar varchar(max),
@ParaEstudiante bit,
@ParaDocente bit,
@Situaciones varchar(500),
@Activo bit,
@IdGuia int output,
@numeroError int output,
@respuesta varchar(1000) output
)
as
begin
	set nocount on;

	set @IdGuia = 0
	set @Titulo = ltrim(rtrim(isnull(@Titulo, '')))
	set @Categoria = ltrim(rtrim(isnull(@Categoria, '')))
	set @Descripcion = ltrim(rtrim(isnull(@Descripcion, '')))

	if @Titulo = '' or @Categoria = '' or @Descripcion = ''
	begin
		set @numeroError = 50001
		set @respuesta = 'Completa título, categoría y descripción'
		return
	end

	if not exists (select 1 from Neurodivergencia where IdNeurodivergencia = @IdNeurodivergencia)
	begin
		set @numeroError = 50002
		set @respuesta = 'La neurodivergencia seleccionada no existe'
		return
	end

	if not exists (select 1 from dbo.fn_dividirTexto(@Recomendaciones, char(10)))
		or not exists (select 1 from dbo.fn_dividirTexto(@Evitar, char(10)))
	begin
		set @numeroError = 50003
		set @respuesta = 'Agrega al menos una recomendación y una cosa por evitar'
		return
	end

	if isnull(@ParaEstudiante, 0) = 0 and isnull(@ParaDocente, 0) = 0
	begin
		set @numeroError = 50004
		set @respuesta = 'Elige para quién es la guía (Estudiante, Docente o ambos)'
		return
	end

	if exists (select 1 from Guia where Titulo = @Titulo and IdNeurodivergencia = @IdNeurodivergencia)
	begin
		set @numeroError = 50005
		set @respuesta = 'Ya existe una guía con ese título para esa neurodivergencia'
		return
	end

	begin try
		begin transaction

		insert into Guia(IdNeurodivergencia, Titulo, Categoria, Descripcion, ParaEstudiante, ParaDocente, Activo)
		values (@IdNeurodivergencia, @Titulo, @Categoria, @Descripcion, isnull(@ParaEstudiante, 0), isnull(@ParaDocente, 0), isnull(@Activo, 1))

		set @IdGuia = scope_identity()

		insert into Recomendacion(IdGuia, Tipo, Orden, Texto)
		select @IdGuia, 'hacer', Orden, Valor from dbo.fn_dividirTexto(@Recomendaciones, char(10))

		insert into Recomendacion(IdGuia, Tipo, Orden, Texto)
		select @IdGuia, 'evitar', Orden, Valor from dbo.fn_dividirTexto(@Evitar, char(10))

		insert into GuiaSituacion(IdGuia, IdSituacion)
		select distinct @IdGuia, s.IdSituacion
		from dbo.fn_dividirTexto(@Situaciones, ',') t
		inner join Situacion s on s.Clave = t.Valor

		commit transaction

		set @numeroError = 0
		set @respuesta = 'Guía agregada correctamente'
	end try
	begin catch
		if @@trancount > 0 rollback transaction
		set @IdGuia = 0
		set @numeroError = error_number()
		set @respuesta = error_message()
	end catch
end

go

-- Editar guia: reemplaza sus datos, recomendaciones y situaciones
create procedure sp_editarGuia(
@IdGuia int,
@Titulo varchar(80),
@IdNeurodivergencia int,
@Categoria varchar(60),
@Descripcion varchar(260),
@Recomendaciones varchar(max),
@Evitar varchar(max),
@ParaEstudiante bit,
@ParaDocente bit,
@Situaciones varchar(500),
@Activo bit,
@numeroError int output,
@respuesta varchar(1000) output
)
as
begin
	set nocount on;

	set @Titulo = ltrim(rtrim(isnull(@Titulo, '')))
	set @Categoria = ltrim(rtrim(isnull(@Categoria, '')))
	set @Descripcion = ltrim(rtrim(isnull(@Descripcion, '')))

	if not exists (select 1 from Guia where IdGuia = @IdGuia)
	begin
		set @numeroError = 50006
		set @respuesta = 'La guía no existe'
		return
	end

	if @Titulo = '' or @Categoria = '' or @Descripcion = ''
	begin
		set @numeroError = 50001
		set @respuesta = 'Completa título, categoría y descripción'
		return
	end

	if not exists (select 1 from Neurodivergencia where IdNeurodivergencia = @IdNeurodivergencia)
	begin
		set @numeroError = 50002
		set @respuesta = 'La neurodivergencia seleccionada no existe'
		return
	end

	if not exists (select 1 from dbo.fn_dividirTexto(@Recomendaciones, char(10)))
		or not exists (select 1 from dbo.fn_dividirTexto(@Evitar, char(10)))
	begin
		set @numeroError = 50003
		set @respuesta = 'Agrega al menos una recomendación y una cosa por evitar'
		return
	end

	if isnull(@ParaEstudiante, 0) = 0 and isnull(@ParaDocente, 0) = 0
	begin
		set @numeroError = 50004
		set @respuesta = 'Elige para quién es la guía (Estudiante, Docente o ambos)'
		return
	end

	if exists (select 1 from Guia where Titulo = @Titulo and IdNeurodivergencia = @IdNeurodivergencia and IdGuia <> @IdGuia)
	begin
		set @numeroError = 50005
		set @respuesta = 'Ya existe una guía con ese título para esa neurodivergencia'
		return
	end

	begin try
		begin transaction

		update Guia
		set
			IdNeurodivergencia = @IdNeurodivergencia,
			Titulo = @Titulo,
			Categoria = @Categoria,
			Descripcion = @Descripcion,
			ParaEstudiante = isnull(@ParaEstudiante, 0),
			ParaDocente = isnull(@ParaDocente, 0),
			Activo = isnull(@Activo, 1),
			FechaActualizacion = getdate()
		where IdGuia = @IdGuia

		delete from Recomendacion where IdGuia = @IdGuia
		delete from GuiaSituacion where IdGuia = @IdGuia

		insert into Recomendacion(IdGuia, Tipo, Orden, Texto)
		select @IdGuia, 'hacer', Orden, Valor from dbo.fn_dividirTexto(@Recomendaciones, char(10))

		insert into Recomendacion(IdGuia, Tipo, Orden, Texto)
		select @IdGuia, 'evitar', Orden, Valor from dbo.fn_dividirTexto(@Evitar, char(10))

		insert into GuiaSituacion(IdGuia, IdSituacion)
		select distinct @IdGuia, s.IdSituacion
		from dbo.fn_dividirTexto(@Situaciones, ',') t
		inner join Situacion s on s.Clave = t.Valor

		commit transaction

		set @numeroError = 0
		set @respuesta = 'Guía actualizada correctamente'
	end try
	begin catch
		if @@trancount > 0 rollback transaction
		set @numeroError = error_number()
		set @respuesta = error_message()
	end catch
end

go

-- Baja logica: @Ocultar = 1 oculta la guia (y su video) para los usuarios; @Ocultar = 0 la vuelve a mostrar
create procedure sp_ocultarGuia(
@IdGuia int,
@Ocultar bit,
@numeroError int output,
@respuesta varchar(1000) output
)
as
begin
	set nocount on;

	begin try
		update Guia
		set
			Activo = case when @Ocultar = 1 then 0 else 1 end,
			FechaActualizacion = getdate()
		where IdGuia = @IdGuia

		if @@rowcount = 0
		begin
			set @numeroError = 50006
			set @respuesta = 'La guía no existe'
			return
		end

		set @numeroError = 0
		set @respuesta = case when @Ocultar = 1 then 'Guía oculta correctamente' else 'Guía visible nuevamente' end
	end try
	begin catch
		set @numeroError = error_number()
		set @respuesta = error_message()
	end catch
end

go

/* ---------------------------------------- AUTOEVALUACIONES ---------------------------------------- */
-- Autoevaluaciones que existen (una por guia)
create procedure sp_listaEvaluaciones
as
begin
	set nocount on;

	select
		e.IdEvaluacion,
		e.IdGuia,
		g.Titulo,
		n.Nombre as Neurodivergencia,
		g.Activo as GuiaActiva,
		(select count(*) from Pregunta p where p.IdEvaluacion = e.IdEvaluacion) as TotalPreguntas,
		e.FechaCreacion
	from Evaluacion e
	inner join Guia g on g.IdGuia = e.IdGuia
	inner join Neurodivergencia n on n.IdNeurodivergencia = g.IdNeurodivergencia
	order by e.IdEvaluacion
end

go

-- Guias que todavia no tienen autoevaluacion (para el boton "Nueva autoevaluacion")
create procedure sp_listaGuiasSinEvaluacion
as
begin
	set nocount on;

	select g.IdGuia, g.Titulo, n.Nombre as Neurodivergencia
	from Guia g
	inner join Neurodivergencia n on n.IdNeurodivergencia = g.IdNeurodivergencia
	where not exists (select 1 from Evaluacion e where e.IdGuia = g.IdGuia)
	order by g.IdGuia
end

go

-- Consulta por guia. Regresa 2 resultados: la autoevaluacion y sus preguntas
create procedure sp_obtenerEvaluacion(
@IdGuia int
)
as
begin
	set nocount on;

	select e.IdEvaluacion, e.IdGuia, g.Titulo, n.Nombre as Neurodivergencia, e.FechaCreacion
	from Evaluacion e
	inner join Guia g on g.IdGuia = e.IdGuia
	inner join Neurodivergencia n on n.IdNeurodivergencia = g.IdNeurodivergencia
	where e.IdGuia = @IdGuia

	select p.IdPregunta, p.IdEvaluacion, p.Orden, p.Texto, p.OpcionA, p.OpcionB, p.OpcionC, p.OpcionD, p.Correcta
	from Pregunta p
	inner join Evaluacion e on e.IdEvaluacion = p.IdEvaluacion
	where e.IdGuia = @IdGuia
	order by p.Orden, p.IdPregunta
end

go

create procedure sp_crearEvaluacion(
@IdGuia int,
@IdEvaluacion int output,
@numeroError int output,
@respuesta varchar(1000) output
)
as
begin
	set nocount on;

	set @IdEvaluacion = 0

	if not exists (select 1 from Guia where IdGuia = @IdGuia)
	begin
		set @numeroError = 50006
		set @respuesta = 'La guía no existe'
		return
	end

	if exists (select 1 from Evaluacion where IdGuia = @IdGuia)
	begin
		set @numeroError = 50007
		set @respuesta = 'Esta guía ya tiene una autoevaluación'
		return
	end

	begin try
		insert into Evaluacion(IdGuia) values (@IdGuia)
		set @IdEvaluacion = scope_identity()

		set @numeroError = 0
		set @respuesta = 'Autoevaluación creada correctamente'
	end try
	begin catch
		set @IdEvaluacion = 0
		set @numeroError = error_number()
		set @respuesta = error_message()
	end catch
end

go

-- ELIMINACION FISICA: borra la autoevaluacion y todas sus preguntas, pero la guia y los resultados de los usuarios se conservan
create procedure sp_eliminarEvaluacion(
@IdEvaluacion int,
@numeroError int output,
@respuesta varchar(1000) output
)
as
begin
	set nocount on;

	if not exists (select 1 from Evaluacion where IdEvaluacion = @IdEvaluacion)
	begin
		set @numeroError = 50008
		set @respuesta = 'La autoevaluación no existe'
		return
	end

	begin try
		begin transaction

		delete from Pregunta where IdEvaluacion = @IdEvaluacion
		delete from Evaluacion where IdEvaluacion = @IdEvaluacion

		commit transaction

		set @numeroError = 0
		set @respuesta = 'Autoevaluación eliminada correctamente'
	end try
	begin catch
		if @@trancount > 0 rollback transaction
		set @numeroError = error_number()
		set @respuesta = error_message()
	end catch
end

go

create procedure sp_crearPregunta(
@IdEvaluacion int,
@Texto varchar(220),
@OpcionA varchar(180),
@OpcionB varchar(180),
@OpcionC varchar(180) = null,
@OpcionD varchar(180) = null,
@Correcta char(1),
@IdPregunta int output,
@numeroError int output,
@respuesta varchar(1000) output
)
as
begin
	set nocount on;

	set @IdPregunta = 0
	set @Texto = ltrim(rtrim(isnull(@Texto, '')))
	set @OpcionA = ltrim(rtrim(isnull(@OpcionA, '')))
	set @OpcionB = ltrim(rtrim(isnull(@OpcionB, '')))
	set @OpcionC = nullif(ltrim(rtrim(isnull(@OpcionC, ''))), '')
	set @OpcionD = nullif(ltrim(rtrim(isnull(@OpcionD, ''))), '')
	set @Correcta = lower(isnull(@Correcta, ''))

	if not exists (select 1 from Evaluacion where IdEvaluacion = @IdEvaluacion)
	begin
		set @numeroError = 50008
		set @respuesta = 'La autoevaluación no existe'
		return
	end

	if @Texto = ''
	begin
		set @numeroError = 50009
		set @respuesta = 'Escribe la pregunta'
		return
	end

	if @OpcionA = '' or @OpcionB = ''
	begin
		set @numeroError = 50009
		set @respuesta = 'Escribe al menos dos opciones'
		return
	end

	if @OpcionD is not null and @OpcionC is null
	begin
		set @numeroError = 50009
		set @respuesta = 'Las opciones deben ser consecutivas (A, B, C, D)'
		return
	end

	if @Correcta not in ('a','b','c','d')
		or (@Correcta = 'c' and @OpcionC is null)
		or (@Correcta = 'd' and @OpcionD is null)
	begin
		set @numeroError = 50010
		set @respuesta = 'Marca como correcta una opción que tenga texto'
		return
	end

	begin try
		insert into Pregunta(IdEvaluacion, Orden, Texto, OpcionA, OpcionB, OpcionC, OpcionD, Correcta)
		values (
			@IdEvaluacion,
			isnull((select max(Orden) from Pregunta where IdEvaluacion = @IdEvaluacion), 0) + 1,
			@Texto, @OpcionA, @OpcionB, @OpcionC, @OpcionD, @Correcta
		)
		set @IdPregunta = scope_identity()

		set @numeroError = 0
		set @respuesta = 'Pregunta agregada correctamente'
	end try
	begin catch
		set @IdPregunta = 0
		set @numeroError = error_number()
		set @respuesta = error_message()
	end catch
end

go

create procedure sp_editarPregunta(
@IdPregunta int,
@Texto varchar(220),
@OpcionA varchar(180),
@OpcionB varchar(180),
@OpcionC varchar(180) = null,
@OpcionD varchar(180) = null,
@Correcta char(1),
@numeroError int output,
@respuesta varchar(1000) output
)
as
begin
	set nocount on;

	set @Texto = ltrim(rtrim(isnull(@Texto, '')))
	set @OpcionA = ltrim(rtrim(isnull(@OpcionA, '')))
	set @OpcionB = ltrim(rtrim(isnull(@OpcionB, '')))
	set @OpcionC = nullif(ltrim(rtrim(isnull(@OpcionC, ''))), '')
	set @OpcionD = nullif(ltrim(rtrim(isnull(@OpcionD, ''))), '')
	set @Correcta = lower(isnull(@Correcta, ''))

	if not exists (select 1 from Pregunta where IdPregunta = @IdPregunta)
	begin
		set @numeroError = 50011
		set @respuesta = 'La pregunta no existe'
		return
	end

	if @Texto = ''
	begin
		set @numeroError = 50009
		set @respuesta = 'Escribe la pregunta'
		return
	end

	if @OpcionA = '' or @OpcionB = ''
	begin
		set @numeroError = 50009
		set @respuesta = 'Escribe al menos dos opciones'
		return
	end

	if @OpcionD is not null and @OpcionC is null
	begin
		set @numeroError = 50009
		set @respuesta = 'Las opciones deben ser consecutivas (A, B, C, D)'
		return
	end

	if @Correcta not in ('a','b','c','d')
		or (@Correcta = 'c' and @OpcionC is null)
		or (@Correcta = 'd' and @OpcionD is null)
	begin
		set @numeroError = 50010
		set @respuesta = 'Marca como correcta una opción que tenga texto'
		return
	end

	begin try
		update Pregunta
		set
			Texto = @Texto,
			OpcionA = @OpcionA,
			OpcionB = @OpcionB,
			OpcionC = @OpcionC,
			OpcionD = @OpcionD,
			Correcta = @Correcta
		where IdPregunta = @IdPregunta

		set @numeroError = 0
		set @respuesta = 'Pregunta actualizada correctamente'
	end try
	begin catch
		set @numeroError = error_number()
		set @respuesta = error_message()
	end catch
end

go

create procedure sp_eliminarPregunta(
@IdPregunta int,
@numeroError int output,
@respuesta varchar(1000) output
)
as
begin
	set nocount on;

	begin try
		delete from Pregunta where IdPregunta = @IdPregunta

		if @@rowcount = 0
		begin
			set @numeroError = 50011
			set @respuesta = 'La pregunta no existe'
			return
		end

		set @numeroError = 0
		set @respuesta = 'Pregunta eliminada correctamente'
	end try
	begin catch
		set @numeroError = error_number()
		set @respuesta = error_message()
	end catch
end

go

/* ---------------------------------------- USUARIOS ---------------------------------------- */
-- Registro. La API manda la contrasena ya cifrada. El tipo solo puede ser Estudiante o Docente
create procedure sp_crearUsuario(
@NombreCompleto varchar(100),
@Correo varchar(150),
@Contrasena varchar(200),
@TipoUsuario varchar(15),
@IdUsuario int output,
@numeroError int output,
@respuesta varchar(1000) output
)
as
begin
	set nocount on;

	set @IdUsuario = 0
	set @NombreCompleto = ltrim(rtrim(isnull(@NombreCompleto, '')))
	set @Correo = lower(ltrim(rtrim(isnull(@Correo, ''))))

	if @NombreCompleto = '' or @Correo = '' or isnull(@Contrasena, '') = ''
	begin
		set @numeroError = 50020
		set @respuesta = 'Completa nombre, correo y contraseña'
		return
	end

	if isnull(@TipoUsuario, '') not in ('Estudiante','Docente')
	begin
		set @numeroError = 50020
		set @respuesta = 'Elige si eres Estudiante o Docente'
		return
	end

	if exists (select 1 from Usuario where Correo = @Correo)
	begin
		set @numeroError = 50021
		set @respuesta = 'Ya existe una cuenta con ese correo'
		return
	end

	begin try
		insert into Usuario(NombreCompleto, Correo, Contrasena, TipoUsuario)
		values (@NombreCompleto, @Correo, @Contrasena, @TipoUsuario)

		set @IdUsuario = scope_identity()

		set @numeroError = 0
		set @respuesta = 'Cuenta creada correctamente'
	end try
	begin catch
		set @IdUsuario = 0
		set @numeroError = error_number()
		set @respuesta = error_message()
	end catch
end

go

-- Consulta por ID o por correo (login, perfil). Regresa el hash para que la API compare la contrasena
create procedure sp_obtenerUsuario(
@IdUsuario int = null,
@Correo varchar(150) = null
)
as
begin
	set nocount on;

	select IdUsuario, NombreCompleto, Correo, Contrasena, TipoUsuario, Activo
	from Usuario
	where (@IdUsuario is not null and IdUsuario = @IdUsuario)
	or (@IdUsuario is null and Correo = lower(ltrim(rtrim(isnull(@Correo, '')))))
end

go

create procedure sp_registrarAcceso(
@IdUsuario int,
@numeroError int output,
@respuesta varchar(1000) output
)
as
begin
	set nocount on;

	begin try
		update Usuario set FechaUltimoAcceso = getdate() where IdUsuario = @IdUsuario

		set @numeroError = 0
		set @respuesta = 'Acceso registrado'
	end try
	begin catch
		set @numeroError = error_number()
		set @respuesta = error_message()
	end catch
end

go

-- Editar perfil: nombre, correo y contrasena nueva ya cifrada. @Contrasena = NULL conserva la actual
create procedure sp_editarUsuario(
@IdUsuario int,
@NombreCompleto varchar(100),
@Correo varchar(150),
@Contrasena varchar(200) = null,
@numeroError int output,
@respuesta varchar(1000) output
)
as
begin
	set nocount on;

	set @NombreCompleto = ltrim(rtrim(isnull(@NombreCompleto, '')))
	set @Correo = lower(ltrim(rtrim(isnull(@Correo, ''))))

	if not exists (select 1 from Usuario where IdUsuario = @IdUsuario)
	begin
		set @numeroError = 50022
		set @respuesta = 'El usuario no existe'
		return
	end

	if @NombreCompleto = '' or @Correo = ''
	begin
		set @numeroError = 50020
		set @respuesta = 'Completa nombre y correo'
		return
	end

	if exists (select 1 from Usuario where Correo = @Correo and IdUsuario <> @IdUsuario)
	begin
		set @numeroError = 50021
		set @respuesta = 'Ya existe una cuenta con ese correo'
		return
	end

	begin try
		update Usuario
		set
			NombreCompleto = @NombreCompleto,
			Correo = @Correo,
			Contrasena = isnull(nullif(@Contrasena, ''), Contrasena)
		where IdUsuario = @IdUsuario

		set @numeroError = 0
		set @respuesta = 'Perfil actualizado correctamente'
	end try
	begin catch
		set @numeroError = error_number()
		set @respuesta = error_message()
	end catch
end

go

/* ---------------------------------------- ACTIVIDAD DE LOS USUARIOS ---------------------------------------- */
create procedure sp_registrarVista(
@IdUsuario int,
@IdGuia int,
@numeroError int output,
@respuesta varchar(1000) output
)
as
begin
	set nocount on;

	begin try
		insert into VistaGuia(IdUsuario, IdGuia) values (@IdUsuario, @IdGuia)

		set @numeroError = 0
		set @respuesta = 'Vista registrada'
	end try
	begin catch
		set @numeroError = error_number()
		set @respuesta = error_message()
	end catch
end

go

create procedure sp_listaFavoritos(
@IdUsuario int
)
as
begin
	set nocount on;

	select IdGuia, FechaAgregado
	from Favorito
	where IdUsuario = @IdUsuario
	order by FechaAgregado desc
end

go

create procedure sp_crearFavorito(
@IdUsuario int,
@IdGuia int,
@numeroError int output,
@respuesta varchar(1000) output
)
as
begin
	set nocount on;

	begin try
		if not exists (select 1 from Favorito where IdUsuario = @IdUsuario and IdGuia = @IdGuia)
			insert into Favorito(IdUsuario, IdGuia) values (@IdUsuario, @IdGuia)

		set @numeroError = 0
		set @respuesta = 'Guía guardada en favoritos'
	end try
	begin catch
		set @numeroError = error_number()
		set @respuesta = error_message()
	end catch
end

go

create procedure sp_eliminarFavorito(
@IdUsuario int,
@IdGuia int,
@numeroError int output,
@respuesta varchar(1000) output
)
as
begin
	set nocount on;

	begin try
		delete from Favorito where IdUsuario = @IdUsuario and IdGuia = @IdGuia

		set @numeroError = 0
		set @respuesta = 'Guía quitada de favoritos'
	end try
	begin catch
		set @numeroError = error_number()
		set @respuesta = error_message()
	end catch
end

go

-- Una calificacion por persona y guia: si ya existe se actualiza
create procedure sp_guardarCalificacion(
@IdUsuario int,
@IdGuia int,
@Estrellas tinyint,
@numeroError int output,
@respuesta varchar(1000) output
)
as
begin
	set nocount on;

	if @Estrellas is null or @Estrellas not between 1 and 5
	begin
		set @numeroError = 50030
		set @respuesta = 'La calificación debe ser de 1 a 5 estrellas'
		return
	end

	begin try
		update Calificacion
		set Estrellas = @Estrellas, Fecha = getdate()
		where IdUsuario = @IdUsuario and IdGuia = @IdGuia

		if @@rowcount = 0
			insert into Calificacion(IdUsuario, IdGuia, Estrellas) values (@IdUsuario, @IdGuia, @Estrellas)

		set @numeroError = 0
		set @respuesta = 'Calificación guardada correctamente'
	end try
	begin catch
		set @numeroError = error_number()
		set @respuesta = error_message()
	end catch
end

go

create procedure sp_listaCalificaciones(
@IdGuia int = null
)
as
begin
	set nocount on;

	select IdGuia, IdUsuario, Estrellas, Fecha
	from Calificacion
	where @IdGuia is null or IdGuia = @IdGuia
	order by Fecha desc
end

go

create procedure sp_guardarResultado(
@IdUsuario int,
@IdGuia int,
@Aciertos int,
@Total int,
@numeroError int output,
@respuesta varchar(1000) output
)
as
begin
	set nocount on;

	if @Total is null or @Total < 1 or @Aciertos is null or @Aciertos < 0 or @Aciertos > @Total
	begin
		set @numeroError = 50031
		set @respuesta = 'El resultado de la autoevaluación no es válido'
		return
	end

	begin try
		insert into ResultadoEvaluacion(IdUsuario, IdGuia, Aciertos, Total)
		values (@IdUsuario, @IdGuia, @Aciertos, @Total)

		set @numeroError = 0
		set @respuesta = 'Resultado guardado correctamente'
	end try
	begin catch
		set @numeroError = error_number()
		set @respuesta = error_message()
	end catch
end

go

create procedure sp_listaResultados(
@IdUsuario int
)
as
begin
	set nocount on;

	select r.IdResultado, r.IdGuia, g.Titulo, r.Aciertos, r.Total, r.Fecha
	from ResultadoEvaluacion r
	inner join Guia g on g.IdGuia = r.IdGuia
	where r.IdUsuario = @IdUsuario
	order by r.Fecha desc, r.IdResultado desc
end

go

-- Maximo 3 comentarios por persona en cada guia, de 3 a 300 caracteres
create procedure sp_crearComentario(
@IdUsuario int,
@IdGuia int,
@Texto varchar(300),
@IdComentario int output,
@numeroError int output,
@respuesta varchar(1000) output
)
as
begin
	set nocount on;

	set @IdComentario = 0
	set @Texto = ltrim(rtrim(isnull(@Texto, '')))

	if len(@Texto) < 3
	begin
		set @numeroError = 50032
		set @respuesta = 'Escribe tu comentario antes de enviarlo'
		return
	end

	if (select count(*) from Comentario where IdUsuario = @IdUsuario and IdGuia = @IdGuia) >= 3
	begin
		set @numeroError = 50033
		set @respuesta = 'Ya enviaste el máximo de comentarios en esta guía'
		return
	end

	begin try
		insert into Comentario(IdUsuario, IdGuia, Texto) values (@IdUsuario, @IdGuia, @Texto)
		set @IdComentario = scope_identity()

		set @numeroError = 0
		set @respuesta = 'Gracias por tu comentario'
	end try
	begin catch
		set @IdComentario = 0
		set @numeroError = error_number()
		set @respuesta = error_message()
	end catch
end

go

-- Comentarios visibles de una guia. solo con el nombre de pila de quien comenta
create procedure sp_listaComentarios(
@IdGuia int = null
)
as
begin
	set nocount on;

	select
		m.IdComentario,
		m.IdGuia,
		m.IdUsuario,
		left(u.NombreCompleto, charindex(' ', u.NombreCompleto + ' ') - 1) as Nombre,
		u.TipoUsuario,
		m.Texto,
		m.Fecha,
		k.Estrellas
	from Comentario m
	inner join Usuario u on u.IdUsuario = m.IdUsuario
	left join Calificacion k on k.IdUsuario = m.IdUsuario and k.IdGuia = m.IdGuia
	where m.Oculto = 0 and (@IdGuia is null or m.IdGuia = @IdGuia)
	order by m.Fecha desc, m.IdComentario desc
end

go

-- La persona elimina su propio comentario
create procedure sp_eliminarComentario(
@IdComentario int,
@IdUsuario int,
@numeroError int output,
@respuesta varchar(1000) output
)
as
begin
	set nocount on;

	begin try
		delete from Comentario where IdComentario = @IdComentario and IdUsuario = @IdUsuario

		if @@rowcount = 0
		begin
			set @numeroError = 50034
			set @respuesta = 'No se encontró el comentario'
			return
		end

		set @numeroError = 0
		set @respuesta = 'Comentario eliminado'
	end try
	begin catch
		set @numeroError = error_number()
		set @respuesta = error_message()
	end catch
end

go

-- @IdUsuario = NULL cuando la persona dono sin iniciar sesion
create procedure sp_crearDonacion(
@IdUsuario int = null,
@Monto decimal(10,2),
@OtraCantidad bit,
@numeroError int output,
@respuesta varchar(1000) output
)
as
begin
	set nocount on;

	if @Monto is null or @Monto < 1 or @Monto > 100000
	begin
		set @numeroError = 50035
		set @respuesta = 'El monto de la donación no es válido'
		return
	end

	begin try
		insert into Donacion(IdUsuario, Monto, OtraCantidad) values (@IdUsuario, @Monto, isnull(@OtraCantidad, 0))

		set @numeroError = 0
		set @respuesta = 'Donación registrada'
	end try
	begin catch
		set @numeroError = error_number()
		set @respuesta = error_message()
	end catch
end

go

/* ---------------------------------------- PANEL DEL ADMINISTRADOR ---------------------------------------- */
-- Una sola fila con los numeros de la pantalla de inicio del administrador
create procedure sp_adminResumen
as
begin
	set nocount on;

	select
		(select count(*) from Usuario where TipoUsuario <> 'Administrador') as TotalUsuarios,
		(select count(*) from Usuario where TipoUsuario = 'Estudiante') as Estudiantes,
		(select count(*) from Usuario where TipoUsuario = 'Docente') as Docentes,
		(select count(*) from VistaGuia) as Vistas,
		(select count(*) from Favorito) as Favoritos,
		(select count(*) from Calificacion) as Calificaciones,
		(select cast(avg(cast(Estrellas as decimal(5,2))) as decimal(3,1)) from Calificacion) as PromedioCalificacion,
		(select count(*) from ResultadoEvaluacion) as Autoevaluaciones,
		(select count(*) from Comentario) as Comentarios,
		(select count(*) from Donacion) as Donaciones,
		(select isnull(sum(Monto), 0) from Donacion) as DonacionesMonto
end

go

-- Todos los comentarios (tambien los ocultos), del mas reciente al mas antiguo
create procedure sp_adminListaComentarios
as
begin
	set nocount on;

	select
		m.IdComentario,
		m.IdGuia,
		g.Titulo as TituloGuia,
		u.Correo,
		u.NombreCompleto as Nombre,
		u.TipoUsuario,
		m.Texto,
		m.Oculto,
		m.Fecha,
		k.Estrellas
	from Comentario m
	inner join Usuario u on u.IdUsuario = m.IdUsuario
	inner join Guia g on g.IdGuia = m.IdGuia
	left join Calificacion k on k.IdUsuario = m.IdUsuario and k.IdGuia = m.IdGuia
	order by m.Fecha desc, m.IdComentario desc
end

go

create procedure sp_adminOcultarComentario(
@IdComentario int,
@Oculto bit,
@numeroError int output,
@respuesta varchar(1000) output
)
as
begin
	set nocount on;

	begin try
		update Comentario set Oculto = @Oculto where IdComentario = @IdComentario

		if @@rowcount = 0
		begin
			set @numeroError = 50034
			set @respuesta = 'No se encontró el comentario'
			return
		end

		set @numeroError = 0
		set @respuesta = case when @Oculto = 1 then 'Comentario oculto' else 'Comentario visible' end
	end try
	begin catch
		set @numeroError = error_number()
		set @respuesta = error_message()
	end catch
end

go

create procedure sp_adminEliminarComentario(
@IdComentario int,
@numeroError int output,
@respuesta varchar(1000) output
)
as
begin
	set nocount on;

	begin try
		delete from Comentario where IdComentario = @IdComentario

		if @@rowcount = 0
		begin
			set @numeroError = 50034
			set @respuesta = 'No se encontró el comentario'
			return
		end

		set @numeroError = 0
		set @respuesta = 'Comentario eliminado'
	end try
	begin catch
		set @numeroError = error_number()
		set @respuesta = error_message()
	end catch
end

go

-- Donaciones, de la mas nueva a la mas antigua
create procedure sp_adminListaDonaciones
as
begin
	set nocount on;

	select d.IdDonacion, u.Correo, u.NombreCompleto as Nombre, d.Monto, d.OtraCantidad, d.Estado, d.Fecha
	from Donacion d
	left join Usuario u on u.IdUsuario = d.IdUsuario
	order by d.Fecha desc, d.IdDonacion desc
end

go

create procedure sp_adminEstadoDonacion(
@IdDonacion int,
@Estado varchar(12),
@numeroError int output,
@respuesta varchar(1000) output
)
as
begin
	set nocount on;

	if isnull(@Estado, '') not in ('intencion','confirmada')
	begin
		set @numeroError = 50036
		set @respuesta = 'El estado debe ser intencion o confirmada'
		return
	end

	begin try
		update Donacion set Estado = @Estado where IdDonacion = @IdDonacion

		if @@rowcount = 0
		begin
			set @numeroError = 50037
			set @respuesta = 'No se encontró la donación'
			return
		end

		set @numeroError = 0
		set @respuesta = 'Estado de la donación actualizado'
	end try
	begin catch
		set @numeroError = error_number()
		set @respuesta = error_message()
	end catch
end

go

create procedure sp_adminEliminarDonacion(
@IdDonacion int,
@numeroError int output,
@respuesta varchar(1000) output
)
as
begin
	set nocount on;

	begin try
		delete from Donacion where IdDonacion = @IdDonacion

		if @@rowcount = 0
		begin
			set @numeroError = 50037
			set @respuesta = 'No se encontró la donación'
			return
		end

		set @numeroError = 0
		set @respuesta = 'Donación eliminada'
	end try
	begin catch
		set @numeroError = error_number()
		set @respuesta = error_message()
	end catch
end

go

-- Estadisticas por guia (pestana Estadisticas)
create procedure sp_adminEstadisticasGuias
as
begin
	set nocount on;

	select
		g.IdGuia,
		g.Titulo,
		n.Nombre as Neurodivergencia,
		g.Activo,
		(select count(*) from VistaGuia v where v.IdGuia = g.IdGuia) as Vistas,
		(select count(*) from Favorito f where f.IdGuia = g.IdGuia) as Favoritos,
		(select count(*) from Calificacion c where c.IdGuia = g.IdGuia) as Calificaciones,
		cast((select avg(cast(c.Estrellas as decimal(5,2))) from Calificacion c where c.IdGuia = g.IdGuia) as decimal(3,1)) as PromedioCalificacion,
		(select count(*) from ResultadoEvaluacion r where r.IdGuia = g.IdGuia) as Autoevaluaciones,
		cast((select avg(cast(r.Aciertos as decimal(7,2)) * 100 / r.Total) from ResultadoEvaluacion r where r.IdGuia = g.IdGuia) as decimal(5,1)) as PromedioAciertos,
		(select count(*) from Comentario m where m.IdGuia = g.IdGuia) as Comentarios
	from Guia g
	inner join Neurodivergencia n on n.IdNeurodivergencia = g.IdNeurodivergencia
	order by g.IdGuia
end

go

-- COMPROBACION RAPIDA: una fila con el total de registros cargados
select
	(select count(*) from Neurodivergencia) as Neurodivergencias,
	(select count(*) from Situacion) as Situaciones,
	(select count(*) from Guia) as Guias,
	(select count(*) from Recomendacion) as Recomendaciones,
	(select count(*) from Evaluacion) as Evaluaciones,
	(select count(*) from Pregunta) as Preguntas,
	(select count(*) from Usuario) as Usuarios