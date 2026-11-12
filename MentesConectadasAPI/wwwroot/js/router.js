// Router
import { state } from './state.js';
import { ASSISTANT_ENABLED, isAdmin, SHOW_ADMIN_STATS } from './config.js';
import { adminComments, adminDonations } from './admin-extra.js';
import { adminHome, adminGuides, adminGuideForm, adminEvaluations, adminEvalEditor, adminStats } from './admin.js';
import { setRenderer } from './navigation.js';
import { applyTheme, currentTheme } from './theme.js';
import { landing, aboutUs, publicInfo, dashboard } from './pages.js';
import { login, registro } from './auth.js';
import { neuroList, neuroDetail } from './neuro.js';
import { guideList } from './guides.js';
import { evaluationLanding, evaluationView, evaluationResult } from './evaluations.js';
import { profile } from './profile.js';
import { assistantView } from './assistant.js';
import { cargarDatosAdmin } from './admin-db.js';

const PROTECTED_ROUTES = ['dashboard','neurodivergencias','guias','favoritas','perfil','editar','evaluacion','asistente','admin','admin-guias','admin-evaluaciones','admin-estadisticas','admin-comentarios','admin-donaciones'];

const ADMIN_ROUTES = ['admin','admin-guias','admin-evaluaciones','admin-estadisticas','admin-comentarios','admin-donaciones'];
const isAdminRoute = (r) => ADMIN_ROUTES.includes(r) || r.startsWith('admin-guia:') || r.startsWith('admin-eval:');
const USER_ONLY_ROUTES = ['dashboard','neurodivergencias','guias','favoritas','editar','evaluacion','asistente'];

const VIEWS = {
  inicio: landing,
  neuropublico: publicInfo,
  'sobre-nosotros': aboutUs,
  login,
  registro,
  dashboard,
  neurodivergencias: neuroList,
  guias: () => guideList(false),
  favoritas: () => guideList(true),
  perfil: () => profile(false),
  editar: () => profile(true),
  asistente: assistantView,
  evaluacion: evaluationLanding,
  admin: adminHome,
  'admin-guias': adminGuides,
  'admin-evaluaciones': adminEvaluations,
  'admin-estadisticas': adminStats,
  'admin-comentarios': adminComments,
  'admin-donaciones': adminDonations
};

export function render(){
  const app = document.getElementById('app');
  if((PROTECTED_ROUTES.includes(state.route)||state.route.startsWith('evaluacion:')||state.route.startsWith('resultado:'))&&!state.user){state.route='login';location.hash='login';}
  
  if(isAdminRoute(state.route)&&!isAdmin(state.user)){state.route=state.user?'dashboard':'login';location.hash=state.route;}
  else if(isAdmin(state.user)&&(USER_ONLY_ROUTES.includes(state.route)||state.route.startsWith('evaluacion:')||state.route.startsWith('resultado:'))){state.route='admin';location.hash='admin';}
  
  if(state.route==='admin-estadisticas'&&!SHOW_ADMIN_STATS){state.route='admin';location.hash='admin';}
  if(state.route.startsWith('admin-guia:')){app.innerHTML=adminGuideForm();return;}
  if(state.route.startsWith('admin-eval:')){app.innerHTML=adminEvalEditor();return;}
  if(state.route==='asistente'&&!ASSISTANT_ENABLED){state.route='dashboard';location.hash='dashboard';}
  if(state.route.startsWith('evaluacion:')){const gid=state.route.split(':')[1];if(state.evalGuideId!==gid){state.evalGuideId=gid;state.evalIndex=0;state.evalAnswers=[];state.evalScore=0;}app.innerHTML=evaluationView();return;}
  if(state.route.startsWith('resultado:')){if(state.evalGuideId!==state.route.split(':')[1]){state.route='evaluacion';location.hash='evaluacion';}else{app.innerHTML=evaluationResult();return;}}
  if(state.route.startsWith('neurodetalle:')){app.innerHTML=neuroDetail();return;}
  app.innerHTML=(VIEWS[state.route]||landing)();
  cargarDatosAdmin(state.route); 
  applyTheme(currentTheme()); 
}

setRenderer(render);
