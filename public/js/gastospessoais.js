
    import { initializeApp } from "https://www.gstatic.com/firebasejs/11.0.1/firebase-app.js";
    import { getAuth, onAuthStateChanged } from "https://www.gstatic.com/firebasejs/11.0.1/firebase-auth.js";
    import {
      getFirestore, doc, getDoc, collection, addDoc, updateDoc,
      deleteDoc, query, orderBy, onSnapshot, getDocs, serverTimestamp
    } from "https://www.gstatic.com/firebasejs/11.0.1/firebase-firestore.js";

    const app = initializeApp({
      apiKey: "AIzaSyCnlpnTTJvJPZxuZdmpKQWbbHtvH72nMUU",
      authDomain: "motorista-plus-c53f4.firebaseapp.com",
      projectId: "motorista-plus-c53f4",
      storageBucket: "motorista-plus-c53f4.appspot.com",
      messagingSenderId: "766097061342",
      appId: "1:766097061342:web:36d999bec6d9fe8c46994f"
    });

    const auth = getAuth(app);
    const db = getFirestore(app);
    const $ = id => document.getElementById(id);

    let uid = null;
    let perfil = null;
    let gastos = [];
    let vales = [];
    let editGastoId = null;
    let editValeId = null;
    let totalDiarias = 0;
    const DIARIA_VALOR = 4.28;

    const fmtBR = iso => iso ? iso.split("-").reverse().join("/") : "—";

    /* carregar perfil */
    async function carregarPerfil() {
      const snap = await getDoc(doc(db, "usuarios", uid));
      if (snap.exists()) perfil = snap.data();
      $('dadosUsuario').innerHTML = `
      <div><b>Motorista:</b> ${perfil?.nome || '—'}</div>
      <div><b>Cavalo:</b> ${perfil?.placaCavalo || '—'}</div>
      <div><b>Reboque:</b> ${perfil?.placaReboque || '—'}</div>
      <div><b>Email:</b> ${perfil?.email || '—'}</div>
      <div><b>Telefone:</b> ${perfil?.telefone || '—'}</div>
    `;
    }

    /* streams */
    function iniciarStream() {
      const qG = query(collection(db, "usuarios", uid, "gastos"), orderBy("criadoEm", "desc"));
      onSnapshot(qG, snap => {
        gastos = snap.docs.map(d => ({ id: d.id, ...d.data() }));
        renderGastos(); atualizarResumo();
      });
      const qV = query(collection(db, "usuarios", uid, "vales"), orderBy("criadoEm", "desc"));
      onSnapshot(qV, snap => {
        vales = snap.docs.map(d => ({ id: d.id, ...d.data() }));
        renderVales(); atualizarResumo();
      });
    }

    /* render gastos */
    function renderGastos() {
      const ul = $('listaGastos');
      if (!gastos.length) { ul.innerHTML = "<li>(nenhum)</li>"; return; }
      ul.innerHTML = gastos.map(g => `
      <li>
        <div style="flex:1">
          <div><b>${fmtBR(g.date)} — R$ ${Number(g.valor).toFixed(2)}</b></div>
          <div>${g.motivo} — ${g.local} — Aut.: ${g.aut}</div>
        </div>
        <div>
          <button class="btn" data-id="${g.id}" data-act="editG">Editar</button>
          <button class="btn btn-red" data-id="${g.id}" data-act="delG">Remover</button>
        </div>
      </li>
    `).join("");

      ul.querySelectorAll("button").forEach(btn => {
        const id = btn.dataset.id;
        const act = btn.dataset.act;

        btn.onclick = async () => {
          if (act === "editG") {
            const g = gastos.find(x => x.id === id);
            $('gastoDate').value = g.date;
            $('gastoMotivo').value = g.motivo;
            $('gastoLocal').value = g.local;
            $('gastoValor').value = g.valor;
            $('gastoAut').value = g.aut;
            editGastoId = id;
            $('cancelarEditGasto').style.display = "inline-block";
          } else {
            if (confirm("Excluir este gasto?"))
              await deleteDoc(doc(db, "usuarios", uid, "gastos", id));
          }
        };
      });
    }

    /* render vales */
    function renderVales() {
      const ul = $('listaVales');
      if (!vales.length) { ul.innerHTML = "<li>(nenhum)</li>"; return; }
      ul.innerHTML = vales.map(v => `
      <li>
        <div style="flex:1">
          <div><b>${fmtBR(v.date)} — R$ ${Number(v.valor).toFixed(2)}</b></div>
          <div>${v.motivo || ''}</div>
        </div>
        <div>
          <button data-id="${v.id}" data-act="editV" class="btn">Editar</button>
          <button data-id="${v.id}" data-act="delV" class="btn btn-red">Remover</button>
        </div>
      </li>
    `).join("");

      ul.querySelectorAll("button").forEach(btn => {
        const id = btn.dataset.id;
        const act = btn.dataset.act;

        btn.onclick = async () => {
          if (act === "editV") {
            const v = vales.find(x => x.id === id);
            $('valeDate').value = v.date;
            $('valeMotivo').value = v.motivo;
            $('valeValor').value = v.valor;
            editValeId = id;
            $('cancelarEditVale').style.display = "inline-block";
          } else {
            if (confirm("Excluir este vale?"))
              await deleteDoc(doc(db, "usuarios", uid, "vales", id));
          }
        };
      });
    }

    /* calcular diárias */
   

    /* CRUD gastos */
    $('addGasto').onclick = async () => {
      const d = $('gastoDate').value;
      const m = $('gastoMotivo').value.trim();
      const l = $('gastoLocal').value.trim();
      const v = parseFloat($('gastoValor').value);
      const a = $('gastoAut').value;

      if (!d || !m || !l || !v) { alert("Preencha todos os campos"); return; }

      const data = { date: d, motivo: m, local: l, valor: v, aut: a, criadoEm: serverTimestamp() };

      if (editGastoId) {
        await updateDoc(doc(db, "usuarios", uid, "gastos", editGastoId), data);
        editGastoId = null;
        $('cancelarEditGasto').style.display = "none";
      } else {
        await addDoc(collection(db, "usuarios", uid, "gastos"), data);
      }

      $('gastoDate').value = "";
      $('gastoMotivo').value = "";
      $('gastoLocal').value = "";
      $('gastoValor').value = "";
      $('gastoAut').value = "Francisco";
    };

    $('cancelarEditGasto').onclick = () => {
      editGastoId = null;
      $('cancelarEditGasto').style.display = "none";
    };



    /* resumo + gráfico */
    function atualizarResumo() {
      const bonus = totalDiarias * DIARIA_VALOR;
      const totalG = gastos.reduce((t, g) => t + Number(g.valor), 0);
      const totalV = vales.reduce((t, v) => t + Number(v.valor), 0);
      const saldo = (bonus + totalG) - totalV;

      $('totalDiariasText').textContent = `Total de Bônus: ${totalDiarias} — R$ ${bonus.toFixed(2)}`;
      $('saldoTexto').textContent = saldo >= 0
        ? `Saldo: Empresa deve R$ ${saldo.toFixed(2)}`
        : `Saldo: Motorista deve R$ ${Math.abs(saldo).toFixed(2)}`;

      const ctx = $('chartResumo').getContext("2d");
      if (window._chart) window._chart.destroy();
      window._chart = new Chart(ctx, {
        type: "pie",
        data: {
          labels: ["Bônus", "Gastos", "Vales"],
          datasets: [{ data: [bonus, totalG, totalV] }]
        },
        options: { plugins: { legend: { position: "bottom" } } }
      });
    }

    /* gerar PDF compactado */
    async function gerarPDFPlanilhaComGrafico() {
      const { jsPDF } = window.jspdf;

      const doc = new jsPDF({ unit: "pt", format: "a4" });
      let y = 28;
      const margin = 20;
      const pageWidth = doc.internal.pageSize.getWidth();
      const usable = pageWidth - margin * 2;

      doc.setFontSize(13);
      doc.text("Planilha — Gastos & Bônus", margin, y);
      y += 16;

      doc.setFontSize(9);
      doc.text(`Motorista: ${perfil?.nome || '—'}`, margin, y);
      doc.text(`Placas: ${perfil?.placaCavalo || '—'} / ${perfil?.placaReboque || '—'}`, margin + 240, y);
      y += 12;

      doc.text(`Email: ${perfil?.email || '—'}`, margin, y);
      doc.text(`Telefone: ${perfil?.telefone || '—'}`, margin + 240, y);
      y += 14;

      const bonus = totalDiarias * DIARIA_VALOR;
      doc.setFontSize(10);
      doc.text("Diárias / Bônus", margin, y);
      y += 6;

      doc.autoTable({
        startY: y,
        head: [["Dias", "Vlr Unit.", "Total"]],
        body: [[totalDiarias, DIARIA_VALOR.toFixed(2), bonus.toFixed(2)]],
        styles: { fontSize: 8, cellPadding: 2 },
        headStyles: { fillColor: [243, 146, 32], fontSize: 8 },
        margin: { left: margin, right: margin }
      });
      y = doc.lastAutoTable.finalY + 6;

      doc.text("Gastos", margin, y); y += 6;
      doc.autoTable({
        startY: y,
        head: [["Data", "Motivo", "Local", "Aut.", "Valor"]],
        body: gastos.map(g => [
          fmtBR(g.date), g.motivo, g.local, g.aut, Number(g.valor).toFixed(2)
        ]),
        styles: { fontSize: 7, cellPadding: 1.5 },
        headStyles: { fillColor: [243, 146, 32], fontSize: 7 },
        margin: { left: margin, right: margin }
      });
      y = doc.lastAutoTable.finalY + 6;

      doc.text("Vales", margin, y); y += 6;
      doc.autoTable({
        startY: y,
        head: [["Data", "Motivo", "Valor"]],
        body: vales.map(v => [
          fmtBR(v.date), v.motivo, Number(v.valor).toFixed(2)
        ]),
        styles: { fontSize: 7, cellPadding: 1.5 },
        headStyles: { fillColor: [243, 146, 32], fontSize: 7 },
        margin: { left: margin, right: margin }
      });
      y = doc.lastAutoTable.finalY + 8;

      const totalG = gastos.reduce((s, g) => s + Number(g.valor), 0);
      const totalV = vales.reduce((s, v) => s + Number(v.valor), 0);
      const saldo = (bonus + totalG) - totalV;

      doc.text("Resumo Final", margin, y);
      y += 6;

      doc.autoTable({
        startY: y,
        head: [["Bônus", "Gastos", "Vales", "Saldo"]],
        body: [[bonus.toFixed(2), totalG.toFixed(2), totalV.toFixed(2), saldo.toFixed(2)]],
        styles: { fontSize: 8, cellPadding: 2 },
        headStyles: { fillColor: [243, 146, 32], fontSize: 8 },
        margin: { left: margin, right: margin }
      });
      y = doc.lastAutoTable.finalY + 8;

      try {
        const canvas = document.getElementById("chartResumo");
        const img = canvas.toDataURL("image/png", 0.9);
        const W = 130, H = 85;
        doc.addImage(img, "PNG", margin, y, W, H);
      } catch (e) { }

      doc.save("planilha_compacta.pdf");
    }

    $('gerarPDF').onclick = gerarPDFPlanilhaComGrafico;

    /* apagar tudo */
    $('clearAll').onclick = async () => {
      if (!confirm("Apagar TODOS os lançamentos?")) return;
      const gSnap = await getDocs(collection(db, "usuarios", uid, "gastos"));
      const vSnap = await getDocs(collection(db, "usuarios", uid, "vales"));
      const jobs = [];
      gSnap.forEach(d => jobs.push(deleteDoc(d.ref)));
      vSnap.forEach(d => jobs.push(deleteDoc(d.ref)));
      await Promise.all(jobs);
    };

    /* auth */
    onAuthStateChanged(auth, async user => {
      if (!user) { window.location.href = "login.html"; return; }
      uid = user.uid;
      await carregarPerfil();
      iniciarStream();
      atualizarResumo();
    });

