
    import { initializeApp } from "https://www.gstatic.com/firebasejs/11.0.1/firebase-app.js";
    import { getAuth, onAuthStateChanged } from "https://www.gstatic.com/firebasejs/11.0.1/firebase-auth.js";
    import {
      getFirestore, doc, getDoc, setDoc, updateDoc,
      collection, query, orderBy, getDocs, startAt, endAt, serverTimestamp
    } from "https://www.gstatic.com/firebasejs/11.0.1/firebase-firestore.js";

    const app = initializeApp({
      apiKey: "AIzaSyCnlpnTTJvJPZxuZdmpKQWbbHtvH72nMUU",
      authDomain: "motorista-plus-c53f4.firebaseapp.com",
      projectId: "motorista-plus-c53f4",
    });

    const auth = getAuth(app);
    const db = getFirestore(app);

    const $ = (id) => document.getElementById(id);
    const pad2 = (n) => String(n).padStart(2, "0");

    // ⚠️ Nunca usar new Date(iso) para formatar, evita cair pro dia anterior
    const toBR = (iso) => {
      if (!iso) return "";
      const [y, m, d] = iso.split("-");
      return `${d}/${m}/${y}`;
    };

    const timeNow = () =>
      new Date().toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit", second: "2-digit" });

    const hojeISO = () => {
      const d = new Date();
      return `${d.getFullYear()}-${pad2(d.getMonth() + 1)}-${pad2(d.getDate())}`;
    };

    // Número de dias do mês sem objetos Date (evita fuso)
    function diasNoMes(ano, mesIdx) { // mesIdx: 0..11
      const comuns = [31, 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31];
      const bissexto = (ano % 4 === 0 && ano % 100 !== 0) || (ano % 400 === 0);
      return mesIdx === 1 ? comuns[1] + (bissexto ? 1 : 0) : comuns[mesIdx];
    }

    let uid = null;
    let perfil = null;

    async function carregarPerfil() {
      const snap = await getDoc(doc(db, "usuarios", uid));
      if (!snap.exists()) {
        $('dadosUsuarioCard').textContent = "Perfil não encontrado.";
        return;
      }
      perfil = snap.data();
      $('dadosUsuarioCard').innerHTML = `
      <div class="item"><strong>Motorista</strong>${perfil.nome || "—"}</div>
      <div class="item"><strong>Telefone</strong>${perfil.telefone || "—"}</div>
      <div class="item"><strong>Email</strong>${perfil.email || "—"}</div>
      <div class="item"><strong>Cavalo</strong>${perfil.placaCavalo || "—"}</div>
      <div class="item"><strong>Reboque</strong>${perfil.placaReboque || "—"}</div>
    `;
    }

    async function getDocDia(iso) {
      const ref = doc(db, "usuarios", uid, "pontos", iso);
      const s = await getDoc(ref);
      return s.exists() ? { id: ref.id, ...s.data() } : null;
    }

    async function marcar(tipo) {
      const iso = hojeISO();
      const ref = doc(db, "usuarios", uid, "pontos", iso);
      const atual = await getDocDia(iso);
      const agora = timeNow();
      const base = { data: iso };
      if (atual) {
        await updateDoc(ref, { ...base, [tipo]: agora, updatedAt: serverTimestamp() });
      } else {
        await setDoc(ref, { ...base, inicio: null, intervalo: null, reinicio: null, fim: null, [tipo]: agora, createdAt: serverTimestamp() });
      }
      $('status').textContent = `Registrado ${tipo[0].toUpperCase() + tipo.slice(1)} às ${agora}`;
      await renderTabela(); // refaz com mês selecionado
    }

    // 🔎 Carrega apenas documentos do mês selecionado (no servidor)
    async function carregarMes(mesIdx, ano) {
      const prefix = `${ano}-${pad2(mesIdx + 1)}-`;     // p.ex. "2025-11-"
      const inicio = `${prefix}01`;
      const fim = `${prefix}31`;
      const colRef = collection(db, "usuarios", uid, "pontos");

      // Importante: orderBy('data') + startAt/endAt por string funciona pois "YYYY-MM-DD" é lexicográfico
      const qy = query(colRef, orderBy("data"), startAt(inicio), endAt(fim));
      const snaps = await getDocs(qy);

      const lista = [];
      snaps.forEach(s => {
        const d = s.data();
        // garante que é exatamente o mês alvo
        if (typeof d.data === "string" && d.data.startsWith(prefix)) {
          lista.push(d);
        }
      });
      return lista;
    }

    function horasExtras(reg) {
      const ini = reg?.inicio, fim = reg?.fim;
      if (!ini || !fim) return "—";
      const [ih, im, is] = ini.split(":").map(Number);
      const [fh, fm, fs] = fim.split(":").map(Number);
      const start = new Date(0, 0, 0, ih, im, is || 0);
      const end = new Date(0, 0, 0, fh, fm, fs || 0);
      const h = (end - start) / 3600000;
      if (!isFinite(h) || h <= 0) return "—";
      return Math.max(0, h - 8).toFixed(2);
    }

    async function renderTabela() {
      const mesIdx = parseInt($('mesSelect').value, 10);
      const ano = new Date().getFullYear();
      const totalDias = diasNoMes(ano, mesIdx);

      const registros = await carregarMes(mesIdx, ano);
      const map = {};
      registros.forEach(r => { map[r.data] = r; });

      const tbody = $('tableRegistros').querySelector('tbody');
      tbody.innerHTML = "";

      for (let d = 1; d <= totalDias; d++) {
        const iso = `${ano}-${pad2(mesIdx + 1)}-${pad2(d)}`;
        const r = map[iso] || {};
        const tr = document.createElement("tr");
        tr.innerHTML = `
        <td>${toBR(iso)}</td>
        <td>${r.inicio || "Folga"}</td>
        <td>${r.intervalo || "Folga"}</td>
        <td>${r.reinicio || "Folga"}</td>
        <td>${r.fim || "Folga"}</td>
        <td>${horasExtras(r)}</td>
        <td><button class="edit" data-iso="${iso}">Editar</button></td>
      `;
        tbody.appendChild(tr);
      }

      // editar
      tbody.querySelectorAll(".edit").forEach(btn => {
        btn.onclick = async () => {
          const iso = btn.dataset.iso;
          const atual = map[iso] || {};
          const campos = ["inicio", "intervalo", "reinicio", "fim"];
          const novos = {};
          for (const c of campos) {
            const val = prompt(`Editar ${c} (${toBR(iso)}) [HH:MM:SS]`, atual[c] || "");
            if (val === null) continue;
            novos[c] = val.trim() === "" ? null : val.trim();
          }
          const existe = await getDocDia(iso);
          if (existe) {
            await updateDoc(doc(db, "usuarios", uid, "pontos", iso), { ...novos, updatedAt: serverTimestamp() });
          } else {
            await setDoc(doc(db, "usuarios", uid, "pontos", iso), { data: iso, inicio: null, intervalo: null, reinicio: null, fim: null, ...novos, createdAt: serverTimestamp() });
          }
          await renderTabela();
        };
      });
    }

    // ===== PDF =====
    $('exportPdfBtn').onclick = async () => {
      const { jsPDF } = window.jspdf;
      const docpdf = new jsPDF({ unit: "pt", format: "a4", orientation: "landscape" });

      const mesIdx = parseInt($('mesSelect').value, 10);
      const ano = new Date().getFullYear();
      const meses = ["Janeiro", "Fevereiro", "Março", "Abril", "Maio", "Junho", "Julho", "Agosto", "Setembro", "Outubro", "Novembro", "Dezembro"];

      const w = docpdf.internal.pageSize.getWidth();
      docpdf.setFontSize(18);
      docpdf.setFont(undefined, "bold");
      docpdf.text("Motorista Plus — Registro de Ponto", w / 2, 32, { align: "center" });

      docpdf.setFontSize(10);
      docpdf.setFont(undefined, "normal");
      docpdf.text(`Motorista: ${perfil?.nome || "—"}`, 40, 55);
      docpdf.text(`Telefone: ${perfil?.telefone || "—"}`, 250, 55);
      docpdf.text(`Mês: ${meses[mesIdx]} / ${ano}`, w - 140, 55);

      const registros = await carregarMes(mesIdx, ano);
      const map = {};
      registros.forEach(r => { map[r.data] = r; });

      const totalDias = diasNoMes(ano, mesIdx);
      const body = [];
      for (let d = 1; d <= totalDias; d++) {
        const iso = `${ano}-${pad2(mesIdx + 1)}-${pad2(d)}`;
        const r = map[iso] || {};
        body.push([
          toBR(iso),
          r.inicio || "Folga",
          r.intervalo || "Folga",
          r.reinicio || "Folga",
          r.fim || "Folga",
          horasExtras(r)
        ]);
      }

      docpdf.autoTable({
        startY: 65,
        head: [["Data", "Início", "Intervalo", "Reinício", "Fim", "Extras"]],
        body,
        theme: "grid",
        styles: { halign: "center", fontSize: 7, cellPadding: 1.5, overflow: "linebreak", minCellHeight: 8 },
        headStyles: { fillColor: [243, 146, 32], fontSize: 8 },
        margin: { top: 5, bottom: 5, left: 5, right: 5 },
        tableWidth: "auto",
        pageBreak: "avoid"
      });
      /* ===== ASSINATURA MANUAL (CENTRALIZADA) ===== */

        // Y logo após a última tabela
        let finalY = docpdf.lastAutoTable.finalY + 50;

        // largura da página
        const pageWidth = docpdf.internal.pageSize.getWidth();

        // largura da linha da assinatura
        const lineWidth = 300;

        // cálculo para centralizar a linha
        const lineX = (pageWidth - lineWidth) / 2;

        // linha
        docpdf.setLineWidth(0.7);
        docpdf.line(lineX, finalY, lineX + lineWidth, finalY);

        // texto centralizado
        docpdf.setFontSize(11);
        docpdf.text("Assinatura do Motorista", pageWidth / 2, finalY + 16, { align: "center" });

      
      docpdf.save(`ponto_${meses[mesIdx]}_${ano}.pdf`);
    };
    
    // Botões de registro rápido
    document.querySelectorAll('button[data-tipo]').forEach(b => {
      b.onclick = () => marcar(b.dataset.tipo);
    });

    // Mostrar/ocultar histórico
    $('toggleHistorico').onclick = () => {
      const t = $('tableRegistros');
      const vis = t.style.display !== "none";
      t.style.display = vis ? "none" : "table";
      $('toggleHistorico').textContent = vis ? "Mostrar Histórico" : "Ocultar Histórico";
    };

    // Atualiza histórico ao trocar o mês
    $('mesSelect').addEventListener('change', renderTabela);

    // Auth bootstrap
    onAuthStateChanged(auth, async (user) => {
      if (!user) { window.location.href = "login.html"; return; }
      uid = user.uid;
      await carregarPerfil();
      $('mesSelect').value = String(new Date().getMonth()); // inicia no mês atual
      await renderTabela();
    });
 