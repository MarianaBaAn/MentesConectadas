// Registro (por ahora de demostración, sin base de datos).
// TODO cuando exista la BD: enviar los datos con fetch a POST /api/Auth/registro
if (obtenerUsuario()) window.location.replace("index.html");
document.getElementById("encabezado").innerHTML = header(false);
document.getElementById("pie").innerHTML = footer();
document.getElementById("formRegistro").addEventListener("submit", (e) => { e.preventDefault(); doRegister(); });
function doRegister(){const name=document.getElementById('reg-name').value.trim(),email=document.getElementById('reg-email').value.trim(),pass=document.getElementById('reg-pass').value,pass2=document.getElementById('reg-pass2').value,type=document.getElementById('reg-type').value;if(pass!==pass2){showToast('Las contraseñas no coinciden');return;}localStorage.setItem('mc_registered_user',JSON.stringify({name,email,pass,type}));state.user={name,email,type};save();confirmModal('Cuenta creada','Tu cuenta de demostración fue creada correctamente.',`<button class="btn btn-green" onclick="closeModal();go('dashboard')">Continuar</button>`);}
