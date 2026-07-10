import { verificarLogin } from "./auth.js";
import { iniciarMenu } from "./menu.js";
import { carregarPerfil } from "./perfil.js";
import { iniciarUploadFoto } from "./uploadFoto.js";
import { carregarDashboard } from "./dashboard.js";

verificarLogin(async (user) => {

    iniciarMenu();

    await carregarPerfil(user);

    iniciarUploadFoto(user);

    await carregarDashboard(user);

});