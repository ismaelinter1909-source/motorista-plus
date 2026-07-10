
  /* ===== Firebase ===== */
  import { initializeApp } from "https://www.gstatic.com/firebasejs/11.0.1/firebase-app.js";
  import { getAuth, onAuthStateChanged } from "https://www.gstatic.com/firebasejs/11.0.1/firebase-auth.js";
  import {
    getFirestore, doc, getDoc, addDoc, collection, getDocs, query, orderBy, serverTimestamp
  } from "https://www.gstatic.com/firebasejs/11.0.1/firebase-firestore.js";

  // Projeto: motorista-plus-c53f4
  const app = initializeApp({
    apiKey: "AIzaSyCnlpnTTJvJPZxuZdmpKQWbbHtvH72nMUU",
    authDomain: "motorista-plus-c53f4.firebaseapp.com",
    projectId: "motorista-plus-c53f4",
    storageBucket: "motorista-plus-c53f4.firebasestorage.app",
    messagingSenderId: "766097061342",
    appId: "1:766097061342:web:36d999bec6d9fe8c46994f",
    measurementId: "G-CBT2D0CXPN"
  });

  const auth = getAuth(app);
  const db   = getFirestore(app);

  const $ = (id)=> document.getElementById(id);

  let uid = null;
  let perfil = null;
  let abastecimentos = [];
  let chart;

  /* ===== Util de data (sem fuso) ===== */
  const dateKey = (isoStr)=> Number((isoStr || '').replaceAll('-', ''));
  const between = (iso, start, end) => {
    const n = dateKey(iso);
    if (start && n < dateKey(start)) return false;
    if (end   && n > dateKey(end))   return false;
    return true;
  };

  /* ===== Perfil ===== */
  async function carregarPerfil(){
    const snap = await getDoc(doc(db, "usuarios", uid));
    if (snap.exists()) perfil = snap.data();

    $("dadosUsuarioCard").innerHTML = `
      <div class="item"><b>Motorista</b>${perfil?.nome ?? "—"}</div>
      <div class="item"><b>E-mail</b>${perfil?.email ?? "—"}</div>
      <div class="item"><b>Telefone</b>${perfil?.telefone ?? "—"}</div>
      <div class="item"><b>Placa Cavalo</b>${perfil?.placaCavalo ?? "—"}</div>
      <div class="item"><b>Placa Reboque</b>${perfil?.placaReboque ?? "—"}</div>
    `;
  }

  /* ===== Carregar abastecimentos (todos) ===== */
  async function carregarAbastecimentos(){
    const qy = query(
      collection(db, "usuarios", uid, "abastecimentos"),
      orderBy("data", "asc")
    );
    const snaps = await getDocs(qy);
    abastecimentos = [];
    snaps.forEach(s=>{
      const d = s.data();
      abastecimentos.push({
        id: s.id,
        data: String(d.data || ''),
        local: String(d.local || ''),
        quilometragem: Number(d.quilometragem || 0),
        litros: Number(d.litros || 0),
        tipo: String(d.tipo || '').toLowerCase() === 'arla' ? 'arla' : 'diesel',
        obs: String(d.obs || '')
      });
    });
  }

  /* ===== Filtrar apenas Diesel + período ===== */
  function dieselPorPeriodo(inicioISO, fimISO){
    return abastecimentos
      .filter(r => r.tipo === 'diesel')
      .filter(r => between(r.data, inicioISO || null, fimISO || null));
  }

  /* ===== Pegar o último KM antes do período ===== */
  function ultimoKmAntesDoPeriodo(inicioISO){
    if (!inicioISO) return null;

    const anteriores = abastecimentos
      .filter(a => a.tipo === 'diesel')
      .filter(a => dateKey(a.data) < dateKey(inicioISO));

    if (anteriores.length === 0) return null;

    return Number(anteriores[anteriores.length - 1].quilometragem);
  }

  /* ===== Médias por abastecimento ===== */
  function mediasPorAbastecimento(arr){
    const out = [];
    for (let i=0;i<arr.length;i++){
      if (i===0){ out.push('--'); continue; }
      const kmDif = Number(arr[i].quilometragem) - Number(arr[i-1].quilometragem);
      const litros = Number(arr[i].litros);
      const m = (kmDif > 0 && litros > 0) ? (kmDif / litros) : 0;
      out.push(m ? m.toFixed(2) : '--');
    }
    return out;
  }

  /* ===== Nova média do período ===== */
  function mediaPeriodo(arr, inicioISO){
    if (arr.length === 0) return '--';

    const kmFinal = Number(arr[arr.length - 1].quilometragem);
    const kmAntes = ultimoKmAntesDoPeriodo(inicioISO);

    const kmInicial = (kmAntes !== null)
      ? kmAntes
      : Number(arr[0].quilometragem);

    const litrosTot = arr.reduce((s,r)=> s + Number(r.litros||0), 0);

    if (litrosTot <= 0) return '--';

    const kmRodado = kmFinal - kmInicial;
    if (kmRodado <= 0) return '--';

    return (kmRodado / litrosTot).toFixed(2);
  }

  /* ===== Render tabela + gráfico + resumo ===== */
  function atualizarTabelaEGrafico(){
    const inicio = $('filterInicio')?.value || null;
    const fim    = $('filterFim')?.value || null;

    const diesel = dieselPorPeriodo(inicio, fim);
    const medias = mediasPorAbastecimento(diesel);

    // Tabela
    const tbody = document.querySelector('#tableRegistros tbody');
    tbody.innerHTML = '';
    diesel.forEach((r,idx)=>{
      const tr = document.createElement('tr');
      tr.innerHTML = `
        <td>${r.data}</td>
        <td>${r.local}</td>
        <td>${r.quilometragem}</td>
        <td>${r.litros.toFixed(2)}</td>
        <td>${medias[idx]}</td>
        <td>${r.obs || '—'}</td>
      `;
      tbody.appendChild(tr);
    });

    // Gráfico
    const ctx = $('chart').getContext('2d');
    const labels = diesel.map(r=> r.data);
    const dataVals = medias.map((m,i)=> i===0 ? null : (m==='--' ? null : Number(m)));
    if (chart) chart.destroy();
    chart = new Chart(ctx, {
      type:'line',
      data:{
        labels,
        datasets:[{
          label:'Média (km/L) — Diesel',
          data:dataVals,
          fill:true
        }]
      },
      options:{ responsive:true, maintainAspectRatio:false }
    });

    /* ===== Resumo com KM antes do período ===== */
    let resumoTexto = '';

    if (diesel.length > 0){
      const kmFinal = Number(diesel[diesel.length - 1].quilometragem);
      const kmAntes = ultimoKmAntesDoPeriodo(inicio);
      const kmInicial = (kmAntes !== null)
        ? kmAntes
        : Number(diesel[0].quilometragem);

      const kmRodado = kmFinal - kmInicial;

      resumoTexto = `
        <div style="margin-top:10px; background:#ffffff10; padding:10px; border-radius:8px; font-size:14px;">
          <b style="color:var(--primary)">Resumo do Período:</b><br>
          Último KM antes do período: <b>${kmAntes !== null ? kmAntes : 'Não existe registro anterior'}</b><br>
          KM Inicial usado no cálculo: <b>${kmInicial}</b><br>
          KM Final do período: <b>${kmFinal}</b><br>
          KM Rodado: <b>${kmRodado > 0 ? kmRodado : 0} km</b>
        </div>
      `;
    }

    $('resumoKm').innerHTML = resumoTexto;

    // Resumo final
    const mp = mediaPeriodo(diesel, inicio);
    $('resultado').textContent =
      (mp==='--')
        ? 'Sem dados suficientes (Diesel).'
        : `Média do período (Diesel): ${mp} km/L — Regra da empresa (-5%): ${(Number(mp)*0.95).toFixed(2)} km/L`;
  }
  /* ===== PDF (somente Diesel e período filtrado) ===== */
  function gerarPDF(){
    const { jsPDF } = window.jspdf;
    const doc = new jsPDF({ unit:'pt', format:'a4' });

    const startX = 40; let y = 40;

    // Título
    doc.setFontSize(16).setFont(undefined,'bold');
    doc.text('Relatório de Média (Diesel) — Motorista Plus', startX, y);
    y += 22;

    // Dados do motorista
    doc.setFontSize(11).setFont(undefined,'normal');
    [
      `Motorista: ${perfil?.nome ?? '—'}`,
      `E-mail: ${perfil?.email ?? '—'}`,
      `Telefone: ${perfil?.telefone ?? '—'}`,
      `Placas: ${perfil?.placaCavalo ?? '—'} / ${perfil?.placaReboque ?? '—'}`
    ].forEach((t,i)=>{ doc.text(t, startX, y + i*16); });
    y += 16*4 + 8;

    // Período
    const inicio = $('filterInicio')?.value || null;
    const fim    = $('filterFim')?.value || null;
    doc.text(`Período: ${inicio || '—'} a ${fim || '—'}`, startX, y);
    y += 16;

    const diesel = dieselPorPeriodo(inicio, fim);
    const medias = mediasPorAbastecimento(diesel);

    // Tabela
    doc.autoTable({
      startY: y,
      head: [['Data','Local','KM','Litros','Média (km/L)']],
      body: diesel.map((r,i)=>[
        r.data, r.local, String(r.quilometragem), r.litros.toFixed(2), String(medias[i])
      ]),
      headStyles:{ fillColor:[243,146,32] },
      styles:{ fontSize:10, halign:'center' },
      margin:{ left:startX, right:startX }
    });

    y = doc.autoTable.previous ? doc.autoTable.previous.finalY + 16 : y + 120;

    // Determinar KM antes do período (registro completo se existir)
    let registroAntes = null;
    if (inicio) {
      const anteriores = abastecimentos
        .filter(a => a.tipo === 'diesel')
        .filter(a => dateKey(a.data) < dateKey(inicio));
      if (anteriores.length > 0) registroAntes = anteriores[anteriores.length - 1];
    }

    const kmAntes = registroAntes ? Number(registroAntes.quilometragem) : null;
    const kmInicialUsado = (kmAntes !== null && kmAntes !== undefined) ? kmAntes :
      (diesel.length > 0 ? Number(diesel[0].quilometragem) : null);
    const kmFinal = (diesel.length > 0) ? Number(diesel[diesel.length - 1].quilometragem) : null;

    // Resumo no PDF
    const mp = mediaPeriodo(diesel, inicio);
    if (diesel.length > 0) {
      doc.setFont(undefined,'bold');
      doc.text('Resumo do Período:', startX, y); y += 14;
      doc.setFont(undefined,'normal');

      if (registroAntes) {
        doc.text(`Último registro antes do período: KM ${registroAntes.quilometragem} — Data: ${registroAntes.data}`, startX, y); y += 14;
      } else {
        doc.text(`Último registro antes do período: — (não existe)`, startX, y); y += 14;
      }

      doc.text(`KM Inicial usado no cálculo: ${kmInicialUsado ?? '—'}`, startX, y); y += 14;
      doc.text(`KM Final do período: ${kmFinal ?? '—'}`, startX, y); y += 14;

      const litrosTot = diesel.reduce((s,r)=> s + Number(r.litros||0), 0);
      doc.text(`Litros somados no período: ${litrosTot.toFixed(2)}`, startX, y); y += 14;

      if (mp !== '--') {
        doc.setFont(undefined,'bold');
        doc.text(`Média do período (Diesel): ${mp} km/L`, startX, y); y += 14;
        doc.text(`Regra da empresa (-5%): ${(Number(mp)*0.95).toFixed(2)} km/L`, startX, y); y += 14;
        doc.setFont(undefined,'normal');
      } else {
        doc.text('Sem dados suficientes para média (Diesel).', startX, y); y += 14;
      }
    } else {
      doc.text('Sem registros no período selecionado.', startX, y); y += 14;
    }

    y += 8;

    // Aprovado por (opcional)
    const aprov = ($('aprovadoPor').value || '').trim();
    if(aprov){
      const today = new Date();
      const dd = String(today.getDate()).padStart(2,'0');
      const mm = String(today.getMonth()+1).padStart(2,'0');
      const yyyy = today.getFullYear();
      doc.setFont(undefined,'normal');
      doc.text(`Aprovado por: ${aprov} — Data: ${dd}/${mm}/${yyyy}`, startX, y);
      y += 16;
    }

    // Assinatura
    const w = doc.internal.pageSize.getWidth();
    doc.line(w/2 - 120, y + 36, w/2 + 120, y + 36);
    doc.text('Assinatura do Motorista', w/2, y + 52, { align:'center' });

    doc.save(`media_diesel_${new Date().toISOString().slice(0,10)}.pdf`);
  }

  /* ===== Salvar abastecimento (sempre Diesel aqui) ===== */
  $('addBtn').addEventListener('click', async ()=>{
    const data  = $('data').value.trim();
    const local = $('local').value.trim();
    const km    = Number(($('quilometragem').value || '').trim());
    const litros= Number(($('litros').value || '').trim());
    const obs   = ($('obs').value || '').trim();

    if(!data || !local || km<=0 || litros<=0){
      alert('Preencha todos os campos corretamente.');
      return;
    }
    if(!uid){
      alert('Sessão expirada. Faça login novamente.');
      return;
    }

    try {
      await addDoc(collection(db, "usuarios", uid, "abastecimentos"), {
        data, local, quilometragem: km, litros,
        tipo: 'diesel',
        obs,
        criadoEm: serverTimestamp()
      });

      // limpar
      $('data').value = '';
      $('local').value = '';
      $('quilometragem').value = '';
      $('litros').value = '';
      $('obs').value = '';

      await carregarAbastecimentos();
      atualizarTabelaEGrafico();
      alert('Abastecimento (Diesel) adicionado!');
    } catch (err) {
      console.error(err);
      alert('Erro ao salvar. Tente novamente.');
    }
  });

  /* ===== Filtro / PDF / Limpar ===== */
  $('filterInicio').addEventListener('change', atualizarTabelaEGrafico);
  $('filterFim').addEventListener('change', atualizarTabelaEGrafico);
  $('exportPdfBtn').addEventListener('click', gerarPDF);
  $('limparPagina').addEventListener('click', ()=>{
    // limpa apenas a UI da página (não apaga dados do banco)
    ['data','local','quilometragem','litros','obs','filterInicio','filterFim','aprovadoPor'].forEach(id=>{
      if($(id)) $(id).value = '';
    });
    atualizarTabelaEGrafico();
  });

  /* ===== Auth ===== */
  onAuthStateChanged(auth, async (u)=>{
    if(!u){ window.location.href = 'login.html'; return; }
    uid = u.uid;
    await carregarPerfil();
    await carregarAbastecimentos();
    atualizarTabelaEGrafico();
  });
