
const $ = id => document.getElementById(id);
const clean = s => (s ?? "").toString().replace(/\s+/g," ").trim();
const norm = s => clean(s).normalize("NFD").replace(/[\u0300-\u036f]/g,"").toLowerCase();
const esc = s => (s ?? "").toString().replace(/[&<>"]/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;"}[c]));
function parseNum(s){if(s===null||s===undefined||clean(s)==="")return NaN;return Number(String(s).trim().replace(/\./g,"").replace(",","."));}
function money(n){return Number(n||0).toLocaleString("es-BO",{minimumFractionDigits:2,maximumFractionDigits:2});}
function pct(n){return Number(n||0).toLocaleString("es-BO",{minimumFractionDigits:2,maximumFractionDigits:2})+" %";}
function show(el,cls,html){el.className=`output-box ${cls}`;el.innerHTML=html;el.classList.remove("hidden");}
function yearFromDate(d){return d ? String(d).slice(0,4) : new Date().getFullYear();}
function firstPerson(t){return t.match(/\b(yo|nosotros|nosotras|hicimos|realizamos|compramos|calculamos|estimamos|pagamos|cotizamos|utilizamos|nuestro|nuestra)\b/gi)||[];}

const categories = [
  {id:"hardware",name:"Hardware / equipos",required:true,desc:"Sensores, controladores, módulos, fuentes, dispositivos y equipos."},
  {id:"software",name:"Software / servicios tecnológicos",required:true,desc:"Licencias, simulación, nube, hosting, conectividad y software libre."},
  {id:"implementation",name:"Implementación / integración",required:true,desc:"PCB, cableado, gabinete, conectores, montaje, consumibles e instalación."},
  {id:"human",name:"Recursos humanos / mano de obra",required:true,desc:"Diseño, programación, montaje, pruebas, calibración y documentación."},
  {id:"actuators",name:"Actuadores / control físico",required:false,desc:"Motores, relés, bombas, válvulas, calefactores, drivers y elementos de potencia."},
  {id:"infrastructure",name:"Infraestructura / materiales",required:false,desc:"Estructuras, soportes, canaletas, fijaciones, tuberías y elementos físicos."},
  {id:"operation",name:"Operación",required:false,desc:"Energía, internet, agua, consumibles y recursos recurrentes."},
  {id:"maintenance",name:"Mantenimiento",required:false,desc:"Calibración, inspección, limpieza, reposición y reparación."},
  {id:"other",name:"Otros costos justificados",required:false,desc:"Partidas específicas que no encajan en las categorías anteriores."}
];

let items = [];
const selectedCats = new Set(categories.filter(c=>c.required).map(c=>c.id));

function renderCostSelector(){
  $("costSelector").innerHTML = categories.map(c=>`<label class="cost-select ${c.required?"required":""}">
    <input class="cat-check" type="checkbox" value="${c.id}" ${c.required?"checked disabled":(selectedCats.has(c.id)?"checked":"")}>
    <span><b>${esc(c.name)}${c.required?'<span class="required-chip">BASE</span>':""}</b><small>${esc(c.desc)}</small></span>
  </label>`).join("");
  document.querySelectorAll(".cat-check:not(:disabled)").forEach(x=>x.addEventListener("change",()=>{
    x.checked?selectedCats.add(x.value):selectedCats.delete(x.value);
    renderCategorySelect(); renderSummary();
  }));
}
function selectedCategories(){return categories.filter(c=>selectedCats.has(c.id));}
function categoryName(id){return categories.find(c=>c.id===id)?.name || id;}
function renderCategorySelect(){
  $("itemCategory").innerHTML=selectedCategories().map(c=>`<option value="${c.id}">${esc(c.name)}</option>`).join("");
}
renderCostSelector(); renderCategorySelect();

function classifier(desc){
  const n=norm(desc);
  if(/sensor|esp32|arduino|stm32|microcontrol|raspberry|modulo|módulo|pantalla|lcd|fuente|convertidor|adc|dac|router|switch|antena|osciloscopio|multimetro|multímetro|equipo/.test(n)) return "hardware";
  if(/motor|bomba|valvula|válvula|rele|relé|ventilador|calefactor|actuador|servo|solenoide|driver|mosfet/.test(n)) return selectedCats.has("actuators")?"actuators":"hardware";
  if(/licencia|software|proteus|matlab|simulink|nube|cloud|hosting|internet|servidor|dominio|plataforma|api/.test(n)) return "software";
  if(/pcb|placa perforada|cable|conector|bornera|gabinete|soldadura|estaño|estano|canaleta|abrazadera|montaje|instalacion|instalación|manguera|tuberia|tubería|fijacion|fijación/.test(n)) return "implementation";
  if(/programacion|programación|diseño|diseno|ingenieria|ingeniería|mano de obra|hora|montaje tecnico|prueba|calibracion|calibración|documentacion|documentación/.test(n)) return "human";
  if(/energia|energía|consumo electrico|consumo eléctrico|mes|operacion|operación|agua|conectividad recurrente/.test(n)) return selectedCats.has("operation")?"operation":"software";
  if(/mantenimiento|reposicion|reposición|limpieza|reparacion|reparación|inspeccion|inspección preventiva/.test(n)) return selectedCats.has("maintenance")?"maintenance":"other";
  if(/estructura|soporte|rack|torre|poste|infraestructura/.test(n)) return selectedCats.has("infrastructure")?"infrastructure":"implementation";
  return "other";
}
$("classifyBtn").addEventListener("click",()=>{
  const ls=$("classifierText").value.split(/\n+/).map(x=>x.trim()).filter(Boolean);
  if(!ls.length){$("classifierOutput").innerHTML="<h4>Falta información</h4><p>Escribe uno o más recursos.</p>";return;}
  $("classifierOutput").innerHTML=`<h4>Clasificación sugerida</h4><ul>${
    ls.map(x=>{const c=classifier(x);return `<li><b>${esc(x)}</b> → ${esc(categoryName(c))}</li>`}).join("")
  }</ul><p class="small">Si una sugerencia no coincide con el uso real del recurso, corrígela. La clasificación depende de la función económica y técnica dentro del proyecto.</p>`;
});

function addItem(data=null){
  const desc=data?.desc ?? clean($("itemDesc").value);
  const qty=data?.qty ?? parseNum($("itemQty").value);
  const unit=data?.unit ?? clean($("itemUnit").value);
  const unitCost=data?.unitCost ?? parseNum($("itemUnitCost").value);
  const category=data?.category ?? $("itemCategory").value;
  const nature=data?.nature ?? $("itemNature").value;
  const provider=data?.provider ?? clean($("itemProvider").value);
  const date=data?.date ?? $("itemDate").value;
  const note=data?.note ?? clean($("itemNote").value);

  if(!desc || !Number.isFinite(qty) || qty<0 || !Number.isFinite(unitCost) || unitCost<0){
    alert("Completa descripción, cantidad y costo unitario con valores válidos."); return;
  }
  items.push({id:Date.now()+Math.random(),desc,qty,unit,unitCost,category,nature,provider,date,note});
  if(!data){
    $("itemDesc").value=""; $("itemQty").value="1"; $("itemUnitCost").value="";
    $("itemProvider").value=""; $("itemNote").value="";
  }
  renderItems();
}
$("addItemBtn").addEventListener("click",()=>addItem());

$("loadExampleBtn").addEventListener("click",()=>{
  if(items.length && !confirm("¿Deseas añadir el ejemplo a las partidas existentes?")) return;
  [
    {desc:"Microcontrolador ESP32",qty:1,unit:"unidad",unitCost:95,category:"hardware",nature:"desembolso",provider:"Proveedor de ejemplo",date:"2026-10-16",note:"Valor didáctico"},
    {desc:"Sensor de corriente",qty:2,unit:"unidad",unitCost:65,category:"hardware",nature:"desembolso",provider:"Proveedor de ejemplo",date:"2026-10-16",note:"Valor didáctico"},
    {desc:"Software de programación de uso libre",qty:1,unit:"licencia",unitCost:0,category:"software",nature:"disponible",provider:"Sitio oficial",date:"2026-10-16",note:"Sin costo directo"},
    {desc:"PCB, conectores, cableado y gabinete",qty:1,unit:"lote",unitCost:420,category:"implementation",nature:"desembolso",provider:"Mercado local",date:"2026-10-16",note:"Valor didáctico"},
    {desc:"Diseño electrónico",qty:18,unit:"h",unitCost:35,category:"human",nature:"imputado",provider:"Valor referencial",date:"2026-10-16",note:"Costo imputado"},
    {desc:"Programación y pruebas",qty:24,unit:"h",unitCost:35,category:"human",nature:"imputado",provider:"Valor referencial",date:"2026-10-16",note:"Costo imputado"}
  ].forEach(addItem);
});

function itemTotal(i){return i.qty*i.unitCost;}
function natureLabel(n){return n==="imputado"?"Imputado/referencial":n==="disponible"?"Recurso disponible":"Desembolso directo";}
function renderItems(){
  $("itemsBody").innerHTML=items.map((i,idx)=>`<tr>
    <td>${idx+1}</td><td>${esc(categoryName(i.category))}</td><td>${esc(i.desc)}</td>
    <td>${money(i.qty)}</td><td>${esc(i.unit)}</td>
    <td class="money">${money(i.unitCost)}</td><td class="money"><b>${money(itemTotal(i))}</b></td>
    <td>${esc(natureLabel(i.nature))}</td><td>${esc(i.provider||"—")}${i.date?`<br><span class="mini">${esc(i.date)}</span>`:""}</td>
    <td><button class="action-mini" onclick="removeItem('${i.id}')">Eliminar</button></td>
  </tr>`).join("");
  renderSummary();
}
window.removeItem=id=>{items=items.filter(x=>String(x.id)!==String(id));renderItems();};

function totals(){
  const by={};
  categories.forEach(c=>by[c.id]=0);
  let direct=0,imputed=0,available=0;
  items.forEach(i=>{
    const v=itemTotal(i); by[i.category]=(by[i.category]||0)+v;
    if(i.nature==="imputado")imputed+=v; else if(i.nature==="disponible")available+=v; else direct+=v;
  });
  return {by,direct,imputed,available,total:direct+imputed+available};
}
function renderSummary(){
  const t=totals();
  $("costSummary").innerHTML=`
    <div class="sum-box"><span class="k">Partidas</span><span class="v">${items.length}</span><span class="d">registradas</span></div>
    <div class="sum-box"><span class="k">Desembolso directo</span><span class="v">Bs ${money(t.direct)}</span><span class="d">dinero efectivamente pagado</span></div>
    <div class="sum-box"><span class="k">Costos imputados</span><span class="v">Bs ${money(t.imputed)}</span><span class="d">valor técnico referencial</span></div>
    <div class="sum-box"><span class="k">Costo económico registrado</span><span class="v">Bs ${money(t.total)}</span><span class="d">incluye recursos disponibles declarados</span></div>`;
}
renderItems();

$("clearItemsBtn").addEventListener("click",()=>{if(confirm("¿Eliminar todas las partidas?")){items=[];renderItems();}});

function csvEscape(v){const s=String(v??"");return /[",\n;]/.test(s)?`"${s.replace(/"/g,'""')}"`:s;}
$("downloadCsvBtn").addEventListener("click",()=>{
  const head=["Categoría","Descripción","Cantidad","Unidad","Costo unitario (Bs)","Costo total (Bs)","Naturaleza","Proveedor/Fuente","Fecha","Observación"];
  const rows=items.map(i=>[categoryName(i.category),i.desc,i.qty,i.unit,money(i.unitCost),money(itemTotal(i)),natureLabel(i.nature),i.provider,i.date,i.note]);
  const csv=[head,...rows].map(r=>r.map(csvEscape).join(";")).join("\n");
  const blob=new Blob(["\ufeff"+csv],{type:"text/csv;charset=utf-8"});
  const a=document.createElement("a");a.href=URL.createObjectURL(blob);a.download="PROYECTA_IA_costos_capitulo_V.csv";a.click();URL.revokeObjectURL(a.href);
});

function activeCategoryOrder(){
  const base=["hardware","actuators","infrastructure","software","implementation","human","operation","maintenance","other"];
  return base.filter(id=>items.some(i=>i.category===id));
}
function tableTitle(id,num){
  const n={
    hardware:"Costos de hardware y equipos",
    actuators:"Costos de actuadores y elementos de control físico",
    infrastructure:"Costos de infraestructura y materiales",
    software:"Costos de software y servicios tecnológicos",
    implementation:"Costos de implementación e integración",
    human:"Costos referenciales de recursos humanos",
    operation:"Costos de operación",
    maintenance:"Costos de mantenimiento",
    other:"Otros costos justificados"
  }[id]||categoryName(id);
  return `Tabla 5.${num}. ${n}.`;
}
function sourceText(id){
  const year=yearFromDate($("referenceDate").value);
  const providers=[...new Set(items.filter(i=>i.category===id).map(i=>i.provider).filter(Boolean))];
  let note="";
  if(providers.length) note=`Precios respaldados mediante: ${providers.join(", ")}.`;
  if($("priceEvidence").value) note += (note?" ":"")+clean($("priceEvidence").value);
  return {source:`Elaboración propia (${year}).`,note};
}
function buildCategoryTable(id,num){
  const arr=items.filter(i=>i.category===id),sub=arr.reduce((s,i)=>s+itemTotal(i),0),src=sourceText(id);
  return `<div class="institutional-preview">
    <div class="table-title-inst">${esc(tableTitle(id,num))}</div>
    <table class="institutional-table"><thead><tr><th>Descripción</th><th>Cantidad</th><th>Unidad</th><th>Costo unitario (Bs)</th><th>Costo total (Bs)</th></tr></thead>
    <tbody>${arr.map(i=>`<tr><td>${esc(i.desc)}</td><td class="num">${money(i.qty)}</td><td class="num">${esc(i.unit)}</td><td class="money">${money(i.unitCost)}</td><td class="money">${money(itemTotal(i))}</td></tr>`).join("")}
    <tr class="subtotal"><td colspan="4">SUBTOTAL ${esc(categoryName(id).toUpperCase())}</td><td class="money">${money(sub)}</td></tr></tbody></table>
    <div class="source-inst"><b>Fuente:</b> ${esc(src.source)}</div>
    ${src.note?`<div class="note-inst"><b>Nota:</b> ${esc(src.note)}</div>`:""}
  </div>`;
}
$("generateTablesBtn").addEventListener("click",()=>{
  if(!items.length){$("tablesOutput").innerHTML='<div class="output-box bad"><b>Primero registra las partidas.</b></div>';return;}
  $("tablesOutput").innerHTML=activeCategoryOrder().map((id,i)=>buildCategoryTable(id,i+1)).join("");
});
$("copyTablesBtn").addEventListener("click",async()=>{
  const txt=clean($("tablesOutput").innerText);
  if(txt) await navigator.clipboard.writeText(txt);
});

function implementationIds(){return ["hardware","actuators","infrastructure","software","implementation","human","other"];}
function consolidationData(){
  const t=totals();
  const dev=implementationIds().reduce((s,id)=>s+(t.by[id]||0),0);
  const operation=t.by.operation||0,maintenance=t.by.maintenance||0;
  const contingency=parseNum($("contingencyPct").value); const cp=Number.isFinite(contingency)&&contingency>0?contingency:0;
  const contingencyValue=dev*cp/100;
  const implementationTotal=dev+contingencyValue;
  const directDev=items.filter(i=>implementationIds().includes(i.category)&&i.nature==="desembolso").reduce((s,i)=>s+itemTotal(i),0);
  const directWithCont=directDev + (directDev*cp/100);
  const firstYear=implementationTotal+operation+maintenance;
  return {t,dev,operation,maintenance,cp,contingencyValue,implementationTotal,directDev,directWithCont,firstYear};
}
$("buildConsolidationBtn").addEventListener("click",()=>{
  if(!items.length){$("consolidationOutput").innerHTML='<div class="output-box bad"><b>Primero registra partidas.</b></div>';return;}
  const d=consolidationData(), year=yearFromDate($("referenceDate").value);
  const rows=implementationIds().filter(id=>d.t.by[id]>0).map(id=>`<tr><td>${esc(categoryName(id))}</td><td class="money">${money(d.t.by[id])}</td></tr>`).join("");
  $("consolidationOutput").innerHTML=`<div class="institutional-preview">
    <div class="table-title-inst">Tabla 5.${activeCategoryOrder().length+1}. Consolidación del costo referencial de implementación.</div>
    <table class="institutional-table"><thead><tr><th>Categoría</th><th>Costo (Bs)</th></tr></thead><tbody>
    ${rows}<tr class="subtotal"><td>SUBTOTAL DE DESARROLLO / IMPLEMENTACIÓN</td><td class="money">${money(d.dev)}</td></tr>
    ${d.cp>0?`<tr><td>Contingencia técnica (${money(d.cp)} %)</td><td class="money">${money(d.contingencyValue)}</td></tr>`:""}
    <tr class="grand-total"><td>COSTO TOTAL REFERENCIAL DE IMPLEMENTACIÓN</td><td class="money">${money(d.implementationTotal)}</td></tr>
    </tbody></table>
    <div class="source-inst"><b>Fuente:</b> Elaboración propia (${year}).</div>
  </div>
  ${$("includeFirstYear").value==="firstyear" && (d.operation||d.maintenance)?`<div class="institutional-preview">
    <div class="table-title-inst">Tabla 5.${activeCategoryOrder().length+2}. Costo económico referencial del primer año.</div>
    <table class="institutional-table"><thead><tr><th>Componente económico</th><th>Costo (Bs)</th></tr></thead><tbody>
    <tr><td>Costo total referencial de implementación</td><td class="money">${money(d.implementationTotal)}</td></tr>
    <tr><td>Costo de operación del periodo declarado</td><td class="money">${money(d.operation)}</td></tr>
    <tr><td>Costo de mantenimiento del periodo declarado</td><td class="money">${money(d.maintenance)}</td></tr>
    <tr class="grand-total"><td>COSTO REFERENCIAL DEL PRIMER AÑO</td><td class="money">${money(d.firstYear)}</td></tr></tbody></table>
    <div class="source-inst"><b>Fuente:</b> Elaboración propia (${year}).</div></div>`:""}
  <div class="economic-rule"><b>Desembolso directo referencial de implementación:</b> Bs ${money(d.directWithCont)}. 
  <b>Costo económico total de implementación:</b> Bs ${money(d.implementationTotal)}.
  ${d.t.imputed>0?" La diferencia se explica, principalmente, por costos imputados o recursos no pagados directamente.":""}</div>`;

  const base=d.dev||1;
  const cats=implementationIds().filter(id=>d.t.by[id]>0);
  $("distributionOutput").innerHTML=`<h4>Distribución porcentual del costo de desarrollo</h4>${
    cats.map(id=>{const p=d.t.by[id]/base*100;return `<div class="percent-row"><span>${esc(categoryName(id))}</span><div class="percent-track"><div class="percent-fill" style="width:${Math.min(100,p)}%"></div></div><b>${pct(p)}</b></div>`}).join("")
  }<p class="small">La participación se calcula sobre el subtotal antes de contingencia, operación y mantenimiento.</p>`;
});

$("generateAnalysisBtn").addEventListener("click",()=>{
  if(!items.length){show($("analysisOutput"),"bad","<b>Registra primero las partidas.</b>");return;}
  const d=consolidationData();
  const entries=implementationIds().map(id=>[id,d.t.by[id]||0]).filter(x=>x[1]>0).sort((a,b)=>b[1]-a[1]);
  const top=entries[0],second=entries[1];
  const freeSoftware=items.filter(i=>i.category==="software"&&i.unitCost===0).length;
  const recurrent=d.operation+d.maintenance;
  const observations=[];
  if(top) observations.push(`La categoría de mayor incidencia es <b>${esc(categoryName(top[0]))}</b>, con Bs ${money(top[1])} (${pct(top[1]/d.dev*100)} del subtotal de desarrollo).`);
  if(second) observations.push(`La segunda participación corresponde a <b>${esc(categoryName(second[0]))}</b>, con Bs ${money(second[1])}.`);
  if(d.t.imputed>0) observations.push(`Existen <b>costos imputados</b> por Bs ${money(d.t.imputed)}; por ello conviene diferenciar el costo económico total del desembolso directo.`);
  if(freeSoftware) observations.push(`Se registraron ${freeSoftware} recurso(s) de software con costo Bs 0,00; deben mantenerse en la tabla para evidenciar los recursos utilizados aunque no generen desembolso.`);
  if(recurrent>0) observations.push(`Los costos recurrentes de operación y mantenimiento suman Bs ${money(recurrent)} para el periodo declarado y deben interpretarse por separado del costo inicial.`);
  if(d.cp>0) observations.push(`La contingencia de ${money(d.cp)} % agrega Bs ${money(d.contingencyValue)}; el porcentaje debe justificarse mediante el nivel de incertidumbre de precios o riesgos de integración.`);
  const missingEvidence=items.filter(i=>!i.provider&&!i.note).length;
  if(missingEvidence) observations.push(`Hay ${missingEvidence} partida(s) sin proveedor/fuente u observación de respaldo. Conviene completar esa evidencia antes de presentar el capítulo.`);

  show($("analysisOutput"),missingEvidence?"warn":"ok",`<h4>Guía de interpretación económica</h4><ul>${observations.map(x=>`<li>${x}</li>`).join("")}</ul>
  <p><b>Redacción sugerida:</b> el análisis final debe explicar la correspondencia entre los recursos económicos y las funciones técnicas del sistema, señalar oportunidades de optimización y aclarar qué montos corresponden a desembolsos reales, recursos disponibles o costos imputados.</p>
  <p><b>No concluir:</b> “el proyecto es rentable”, “la inversión se recupera” o “la TIR es favorable” si no se ha realizado una evaluación económica con beneficios monetarios verificables.</p>`);
});

function namingWord(){
  return document.querySelector('input[name="naming"]:checked')?.value||"costos";
}
$("buildOutlineBtn").addEventListener("click",()=>{
  const order=activeCategoryOrder();
  const word=namingWord();
  let n=1, parts=[];
  parts.push(`<li><b>5.${n++}. CRITERIOS PARA LA ESTIMACIÓN DE COSTOS</b></li>`);
  order.forEach(id=>{
    let title=categoryName(id);
    if(word==="costos") title="Costos de "+title.charAt(0).toLowerCase()+title.slice(1);
    parts.push(`<li><b>5.${n++}. ${esc(title.toUpperCase())}</b></li>`);
  });
  parts.push(`<li><b>5.${n++}. CONSOLIDACIÓN DE COSTOS</b></li>`);
  if(items.some(i=>i.category==="operation")) parts.push(`<li><b>5.${n++}. COSTOS DE OPERACIÓN</b></li>`);
  if(items.some(i=>i.category==="maintenance")) parts.push(`<li><b>5.${n++}. COSTOS DE MANTENIMIENTO</b></li>`);
  parts.push(`<li><b>5.${n++}. INTERPRETACIÓN DEL ANÁLISIS ECONÓMICO</b></li>`);
  parts.push(`<li><b>5.${n++}. CONCLUSIÓN DEL ANÁLISIS ECONÓMICO</b></li>`);
  show($("outlineOutput"),"ok",`<h4>CAPÍTULO V. FUNDAMENTOS ECONÓMICOS / ANÁLISIS ECONÓMICO</h4><ol>${parts.join("")}</ol>
  <p class="small">Este índice es tentativo. Las categorías sin partidas pueden omitirse y otras pueden añadirse si el proyecto lo requiere.</p>`);
});

$("reviewChapterBtn").addEventListener("click",()=>{
  const t=clean($("chapterText").value);
  if(!t){show($("reviewOutput"),"bad","<h4>🔵 FALTA INFORMACIÓN</h4><p>Pega el texto del capítulo.</p>");return;}
  const checks=[
    [hasAny(t,["hardware","equipo","sensor","microcontrol","dispositivo"])?"good":"warn","Se identifican costos de hardware/equipos."],
    [hasAny(t,["software","licencia","internet","nube","servicio tecnológico","servicio tecnologico"])?"good":"warn","Se identifican costos de software/servicios."],
    [hasAny(t,["implementación","implementacion","integración","integracion","pcb","gabinete","cableado","montaje"])?"good":"warn","Se identifican costos de implementación/integración."],
    [hasAny(t,["recursos humanos","mano de obra","horas","programación","programacion","diseño electrónico","diseno electronico"])?"good":"warn","Se valoran recursos humanos o se justifica su exclusión."],
    [/\bBs\b/.test(t)?"good":"bad","Los montos se expresan en bolivianos (Bs)."],
    [/\d+[.,]\d{2}\b/.test(t)?"good":"warn","Se detectan valores monetarios con dos decimales."],
    [hasAny(t,["cantidad","costo unitario","costo total"])?"good":"bad","Las tablas incluyen cantidad, costo unitario y costo total."],
    [hasAny(t,["fuente:","elaboración propia","elaboracion propia","cotización","cotizacion","factura","proveedor"])?"good":"bad","Existe fuente o evidencia para los precios."],
    [hasAny(t,["consolidación","consolidacion","subtotal","costo total referencial"])?"good":"bad","Existe una consolidación general de costos."],
    [hasAny(t,["participación","participacion","incidencia","mayor costo","representa","estructura de costos","optimización","optimizacion"])?"good":"warn","Existe interpretación económica posterior a las tablas."],
    [firstPerson(t).length?"warn":"good",firstPerson(t).length?"Se detecta posible primera persona; reformula de manera impersonal.":"No se detecta primera persona evidente."]
  ];
  if(hasAny(t,["van","tir","tasa interna de retorno","beneficio/costo","beneficio costo","periodo de recuperación","periodo de recuperacion","rentabilidad"])) {
    checks.push(["bad","Se detecta evaluación económica/financiera (VAN, TIR, B/C, recuperación o rentabilidad). Este chatbot corresponde solo al análisis económico de costos."]);
  }
  const bad=checks.some(x=>x[0]==="bad"),warn=checks.some(x=>x[0]==="warn");
  show($("reviewOutput"),bad?"bad":warn?"warn":"ok",`<h4>${bad?"🟠 REQUIERE REFORMULACIÓN":warn?"🟡 CUMPLE PARCIALMENTE":"🟢 CUMPLE"}</h4>
  <ul>${checks.map(x=>`<li class="status-${x[0]}">${x[1]}</li>`).join("")}</ul>
  <p><b>Regla final:</b> cada subtotal debe ir seguido de una interpretación breve que explique su importancia económica y técnica, no solamente repetir el monto.</p>`);
});

function deepPrompt(){
  return `ACTÚA COMO REVISOR METODOLÓGICO Y ECONÓMICO DE UN PROYECTO DE GRADO DE INGENIERÍA.

REVISA EXCLUSIVAMENTE:
CAPÍTULO V. FUNDAMENTOS ECONÓMICOS / ANÁLISIS ECONÓMICO.

REGLA CENTRAL:
Este capítulo identifica, clasifica, cuantifica, consolida e interpreta los costos necesarios para desarrollar e implementar la solución tecnológica. NO corresponde todavía realizar evaluación económica o financiera mediante VAN, TIR, relación B/C, periodo de recuperación o rentabilidad.

CRITERIOS:
- Debe guardar coherencia con lo diseñado e implementado en el Capítulo III.
- Puede emplearse de manera general el término COSTOS. No es obligatorio diferenciar inversión/gasto si la institución no lo exige.
- Deben contemplarse, cuando correspondan: hardware/equipos, software/servicios, implementación/integración, recursos humanos; y una consolidación general.
- Operación, mantenimiento, actuadores, infraestructura y contingencia se incluyen solo si corresponden.
- Cada partida debe tener descripción, cantidad, costo unitario y costo total.
- Fórmula básica: Ci = Qi × Pi.
- Todos los montos en Bs, con dos decimales.
- Los costos monetarios se alinean a la derecha en las tablas.
- Las tablas usan Times New Roman 10; título centrado y en negrilla; fuente debajo.
- El software libre puede aparecer con Bs 0,00.
- Los recursos humanos pueden declararse como costo imputado/referencial si el estudiante realiza personalmente las actividades.
- Diferenciar, cuando sea útil, costo económico total y desembolso directo.
- Los precios reales deben respaldarse con cotización, factura, nota de venta, proveedor o consulta de mercado y una fecha de referencia.
- La contingencia es opcional y su porcentaje debe justificarse; no existe un porcentaje universal obligatorio.
- Después de cada tabla debe existir un párrafo interpretativo.
- El análisis final debe identificar categorías de mayor incidencia, costos recurrentes, oportunidades de optimización y coherencia entre recursos y funciones técnicas.
- No inventar precios, proveedores ni fuentes.
- Redacción científica impersonal.

DATOS DEL PROYECTO:
Título: ${$("projectTitle").value||"[NO INGRESADO]"}
Objetivo General: ${$("generalObjective").value||"[NO INGRESADO]"}
Objetivos Específicos:
${$("specificObjectives").value||"[NO INGRESADOS]"}
Sistema: ${$("systemName").value||"[NO INGRESADO]"}
Fecha de referencia: ${$("referenceDate").value||"[NO INGRESADA]"}
Respaldo de precios: ${$("priceEvidence").value||"[NO INGRESADO]"}

TEXTO DEL ESTUDIANTE:
${$("chapterText").value||"[NO INGRESADO]"}

RESPONDE CON:
1. DICTAMEN GENERAL: 🟢 CUMPLE / 🟡 CUMPLE PARCIALMENTE / 🟠 REQUIERE REFORMULACIÓN / 🔴 NO CUMPLE / 🔵 FALTA INFORMACIÓN.
2. A. COHERENCIA CON EL DISEÑO E IMPLEMENTACIÓN.
3. B. CLASIFICACIÓN DE COSTOS.
4. C. HARDWARE / EQUIPOS.
5. D. SOFTWARE / SERVICIOS.
6. E. IMPLEMENTACIÓN / INTEGRACIÓN.
7. F. RECURSOS HUMANOS.
8. G. OPERACIÓN, MANTENIMIENTO Y CONTINGENCIA, SOLO SI APLICAN.
9. H. REVISIÓN DE CÁLCULOS Y SUBTOTALES.
10. I. FORMATO DE LAS TABLAS.
11. J. EVIDENCIA Y FECHA DE LOS PRECIOS.
12. K. CONSOLIDACIÓN DE COSTOS.
13. L. INTERPRETACIÓN ECONÓMICA.
14. M. CONTROL ESPECIAL: ANÁLISIS ECONÓMICO VS. EVALUACIÓN ECONÓMICA.
15. N. REDACCIÓN CIENTÍFICA.
16. O. INFORMACIÓN QUE FALTA Y CÓMO DEBE CORREGIRLA EL ESTUDIANTE.

NO inventes precios ni reescribas todo el capítulo por el estudiante.`;
}
$("copyPromptBtn").addEventListener("click",async()=>{
  await navigator.clipboard.writeText(deepPrompt());
  $("promptStatus").textContent="Prompt copiado.";
  setTimeout(()=>$("promptStatus").textContent="",1600);
});
