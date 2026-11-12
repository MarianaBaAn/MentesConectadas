// Catálogo de guías: se carga desde la base de datos (a través de la API) y reemplaza al antiguo content/guias.js.
import { apiListaGuias, apiObtenerGuia } from './api.js';

// Arreglo compartido con content.js. Se llena con cargarCatalogo().
export const GUIAS = [];
export const catalogo = { cargado: false, error: '' };

const esc = (s = '') => String(s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#039;' }[c]));
const slug = (s) => String(s).toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');

// Convierte la respuesta de la API (GET api/Guia/{id}) al formato que usan las pantallas.
function aGuia(d) {
    const audience = [];
    if (d.paraEstudiante) audience.push('Estudiante');
    if (d.paraDocente) audience.push('Docente');
    return {
        id: String(d.idGuia),
        title: esc(d.titulo),
        category: esc(d.categoria),
        desc: esc(d.descripcion),
        video: d.video || '',
        neuro: d.neurodivergencia,
        neuroTags: [slug(d.neurodivergencia)],
        situationTags: d.situaciones || [],
        steps: (d.recomendaciones || []).map(t => esc(t)),
        avoid: (d.evitar || []).map(t => esc(t)),
        audience,
        hidden: !d.activo, evalId: d.idEvaluacion ?? null,
        questions: (d.preguntas || []).map(p => ({
            id: p.idPregunta,
            text: esc(p.texto),
            options: ['a', 'b', 'c', 'd']
                .filter(k => p['opcion' + k.toUpperCase()])
                .map(k => ({ key: k, text: esc(p['opcion' + k.toUpperCase()]) })),
            correct: p.correcta
        }))
    };
}

// 1) Consulta general (GET api/Guia)  2) Detalle de cada guía (GET api/Guia/{id}).
// Lanza un error si la API no responde; quien la llama decide cómo avisarlo.
export async function cargarCatalogo() {
    try {
        const lista = await apiListaGuias();
        const detalles = await Promise.all(lista.map(g => apiObtenerGuia(g.idGuia)));
        GUIAS.splice(0, GUIAS.length, ...detalles.map(aGuia));
        catalogo.cargado = true;
        catalogo.error = '';
    } catch (e) {
        catalogo.error = e.message || 'No se pudieron consultar las guías.';
        throw e;
    }
}

//EXTRA ENTREGABLE 3
// Consulta UNA guía por su ID (GET api/Guia/{id}) y la actualiza en el catálogo.
export async function recargarGuia(id) {
    const guia = aGuia(await apiObtenerGuia(id));
    const i = GUIAS.findIndex(g => g.id === guia.id);
    if (i >= 0) GUIAS[i] = guia; else GUIAS.push(guia);
    return guia;
}