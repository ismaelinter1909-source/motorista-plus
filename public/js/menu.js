import { auth } from "./firebase.js";

import {
    signOut
} from "https://www.gstatic.com/firebasejs/11.0.1/firebase-auth.js";

export function iniciarMenu() {

    const menu = document.getElementById("menuLateral");
    const abrirMenu = document.getElementById("abrirMenu");
    const logoutBtn = document.getElementById("logoutBtnMenu");

    if (!menu || !abrirMenu) return;

    abrirMenu.onclick = () => {

    menuLateral.classList.toggle("active");

    document.body.classList.toggle("menu-open");

};

    if (logoutBtn) {

        logoutBtn.onclick = async () => {

            await signOut(auth);

            window.location.href = "login.html";

        };

    }

    destacarPaginaAtual();

    fecharMenuAoClicar();

}
function destacarPaginaAtual() {

    const paginaAtual = window.location.pathname.split("/").pop();

    const links = document.querySelectorAll(".menu-links a");

    links.forEach(link => {

        const href = link.getAttribute("href");

        if (href === paginaAtual) {

            link.classList.add("ativo");

        }

    });

}

function fecharMenuAoClicar() {

    const menu = document.getElementById("menuLateral");

    document.querySelectorAll(".menu-links a").forEach(link => {

        link.addEventListener("click", () => {

            if (window.innerWidth < 768) {

                menu.classList.remove("active");

            }

        });

    });

}