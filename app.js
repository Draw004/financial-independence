(function(){
  'use strict';
  const L=window.CarrowmontLocale,C=window.CarrowmontFICore;
  if(!L||!C) return;
  const $=id=>document.getElementById(id);
  const els={
    localeMenu:$('localeMenu'),localeCurrent:$('localeCurrent'),regionSelect:$('regionSelect'),currencySelect:$('currencySelect'),localeDone:$('localeDone'),
    currentAge:$('currentAge'),targetAge:$('targetAge'),monthlySpending:$('monthlySpending'),spendingPct:$('spendingPct'),monthlyIncome:$('monthlyIncome'),withdrawalRate:$('withdrawalRate'),inflation:$('inflation'),currentAssets:$('currentAssets'),monthlyContribution:$('monthlyContribution'),annualReturn:$('annualReturn'),annualStepUp:$('annualStepUp'),resetBtn:$('resetBtn'),
    targetPill:$('targetPill'),fiToday:$('fiToday'),fiTodayNote:$('fiTodayNote'),modelledAge:$('modelledAge'),fiTargetAge:$('fiTargetAge'),portfolioTargetAge:$('portfolioTargetAge'),requiredMonthly:$('requiredMonthly'),additionalMonthly:$('additionalMonthly'),fundingPct:$('fundingPct'),fundingBar:$('fundingBar'),fundingText:$('fundingText'),copyBtn:$('copyBtn'),
    netSpendCard:$('netSpendCard'),fiTodayCard:$('fiTodayCard'),fiTargetCard:$('fiTargetCard'),portfolioCard:$('portfolioCard'),pathChart:$('pathChart'),growthChart:$('growthChart'),visualEmpty:$('visualEmpty'),visualContent:$('visualContent'),insightsSection:$('insightsSection'),scenariosSection:$('scenariosSection'),
    insightMultiple:$('insightMultiple'),insightMultipleText:$('insightMultipleText'),insightInflation:$('insightInflation'),insightInflationText:$('insightInflationText'),insightTiming:$('insightTiming'),insightTimingText:$('insightTimingText'),insightAdjustment:$('insightAdjustment'),insightAdjustmentText:$('insightAdjustmentText'),scenarioGrid:$('scenarioGrid'),reportBtn:$('reportBtn')
  };
  let pendingRegion=L.getRegion(),pendingCurrency=L.getCurrency();
  const num=(el,d=0)=>{const v=parseFloat(el.value);return Number.isFinite(v)?v:d;};
  const esc=s=>String(s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  const money=v=>L.formatMoney(v,{maximumFractionDigits:0});
  const compact=v=>L.formatCompactMoney(v,{maximumFractionDigits:2});
  const pct=v=>`${Math.round(v*100)}%`;

  function populateLocale(){
    els.regionSelect.innerHTML=Object.entries(L.regions).map(([c,p])=>`<option value="${c}">${p.label}</option>`).join('');
    els.currencySelect.innerHTML=Object.entries(L.currencies).map(([c,p])=>`<option value="${c}">${c} — ${p.label}</option>`).join('');
    els.regionSelect.value=pendingRegion;els.currencySelect.value=pendingCurrency;updateLocaleSummary();
  }
  function updateLocaleSummary(){els.localeCurrent.textContent=`${L.getProfile().label} · ${L.getCurrency()}`;document.querySelectorAll('.currency-prefix').forEach(e=>e.textContent=L.currencySymbol());}
  els.localeMenu.addEventListener('toggle',()=>{if(els.localeMenu.open){pendingRegion=L.getRegion();pendingCurrency=L.getCurrency();els.regionSelect.value=pendingRegion;els.currencySelect.value=pendingCurrency;}});
  els.regionSelect.addEventListener('change',e=>{pendingRegion=e.target.value;const p=L.regions[pendingRegion];if(p&&L.currencies[p.currency]){pendingCurrency=p.currency;els.currencySelect.value=pendingCurrency;}});
  els.currencySelect.addEventListener('change',e=>pendingCurrency=e.target.value);
  els.localeDone.addEventListener('click',()=>{const changed=pendingRegion!==L.getRegion()||pendingCurrency!==L.getCurrency();L.setLocale(pendingRegion,pendingCurrency);els.localeMenu.open=false;if(changed) resetMoneyForLocale();});
  document.addEventListener('click',e=>{if(els.localeMenu.open&&!els.localeMenu.contains(e.target))els.localeMenu.open=false;});
  document.addEventListener('keydown',e=>{if(e.key==='Escape')els.localeMenu.open=false;});
  window.addEventListener('carrowmont:localechange',()=>{updateLocaleSummary();render();});

  function usesIndiaDemoDefaults(){return L.getRegion()==='IN'&&L.getCurrency()==='INR';}
  function resetMoneyForLocale(){els.monthlySpending.value=0;els.monthlyIncome.value=0;els.currentAssets.value=0;els.monthlyContribution.value=0;render();}
  function resetAll(){
    els.currentAge.value=35;els.targetAge.value=50;els.monthlySpending.value=100000;els.spendingPct.value=100;els.monthlyIncome.value=0;els.withdrawalRate.value=4;els.inflation.value=5;els.currentAssets.value=1500000;els.monthlyContribution.value=30000;els.annualReturn.value=10;els.annualStepUp.value=5;
    if(!usesIndiaDemoDefaults()) resetMoneyForLocale(); else render();
  }
  els.resetBtn.addEventListener('click',resetAll);

  function state(){
    const currentAge=Math.max(18,Math.min(80,num(els.currentAge,35)));
    const targetAge=Math.max(currentAge+1,Math.min(90,num(els.targetAge,currentAge+15)));
    return {currentAge,targetAge,monthlySpending:num(els.monthlySpending),spendingPct:num(els.spendingPct,100),monthlyIncome:num(els.monthlyIncome),withdrawalRate:num(els.withdrawalRate,4),inflation:num(els.inflation,5),currentAssets:num(els.currentAssets),monthlyContribution:num(els.monthlyContribution),annualReturn:num(els.annualReturn,8),annualStepUp:num(els.annualStepUp)};
  }

  function commitTargetAge(){
    const currentAge=Math.max(18,Math.min(80,num(els.currentAge,35)));
    const typed=parseFloat(els.targetAge.value);
    const fallback=Math.min(90,currentAge+15);
    const targetAge=Math.max(currentAge+1,Math.min(90,Number.isFinite(typed)?typed:fallback));
    els.targetAge.value=Math.round(targetAge);
    render();
  }

  function commitBoundedNumber(el,min,max,fallback){
    const typed=parseFloat(el.value);
    const value=Math.max(min,Math.min(max,Number.isFinite(typed)?typed:fallback));
    el.value=String(value);
    render();
  }

  function commitNonNegative(el){
    const typed=parseFloat(el.value);
    el.value=String(Math.max(0,Number.isFinite(typed)?typed:0));
    render();
  }

  function commitInputs(){
    commitBoundedNumber(els.currentAge,18,80,35);
    commitTargetAge();
  }

  function render(){
    const raw=state(),r=C.result(raw),s=r.state,t=r.target;
    const empty=s.monthlySpending<=0&&s.monthlyIncome<=0&&s.currentAssets<=0&&s.monthlyContribution<=0;
    els.targetPill.textContent=`Target age ${Math.round(s.targetAge)}`;
    els.visualEmpty.hidden=!empty;els.visualContent.hidden=empty;els.insightsSection.hidden=empty;els.scenariosSection.hidden=empty;
    if(empty){
      els.fiToday.textContent='—';
      els.fiTodayNote.textContent='Enter your spending and investment details to build an illustrative financial-independence estimate.';
      els.modelledAge.textContent='Add your details';
      els.fiTargetAge.textContent='—';els.portfolioTargetAge.textContent='—';els.requiredMonthly.textContent='—';els.additionalMonthly.textContent='—';
      els.fundingPct.textContent='—';els.fundingBar.style.width='0%';
      els.fundingText.textContent='Your funding estimate will appear after you add spending or investment details.';
      els.pathChart.innerHTML='';els.growthChart.innerHTML='';els.scenarioGrid.innerHTML='';
      return;
    }
    els.fiToday.textContent=compact(r.fiToday);
    els.fiTodayNote.textContent=`Based on ${money(r.portfolioMonthlyNeed)} per month of portfolio-funded spending and a ${(s.withdrawalRate*100).toFixed(1)}% withdrawal-rate assumption`;
    els.modelledAge.textContent=t.target<=0?'No portfolio target':(r.modelledFI.reached?`Age ${r.modelledFI.age.toFixed(r.modelledFI.months%12===0?0:1)}`:'Not reached by age 90');
    els.fiTargetAge.textContent=compact(t.target);els.portfolioTargetAge.textContent=compact(t.portfolio);els.requiredMonthly.textContent=money(r.requiredMonthly);els.additionalMonthly.textContent=money(r.additionalMonthly);
    const funded=Math.max(0,t.funding);els.fundingPct.textContent=pct(Math.min(funded,9.99));els.fundingBar.style.width=`${Math.min(100,funded*100)}%`;
    if(t.target<=0) els.fundingText.textContent='Under these inputs, recurring non-portfolio income covers the modelled spending amount, so the spending-based portfolio target is zero.';
    else if(funded>=1) els.fundingText.textContent=`Your current plan is projected to meet or exceed the modelled target at age ${Math.round(s.targetAge)} under these assumptions.`;
    else els.fundingText.textContent=`Your current plan is projected to cover about ${Math.round(funded*100)}% of the modelled target at age ${Math.round(s.targetAge)}.`;

    els.netSpendCard.textContent=`${money(r.portfolioMonthlyNeed)}/mo`;els.fiTodayCard.textContent=compact(r.fiToday);els.fiTargetCard.textContent=compact(t.target);els.portfolioCard.textContent=compact(t.portfolio);
    renderInsights(r);renderScenarios(s);renderCharts(r,raw);
  }

  function renderInsights(r){
    const s=r.state,years=r.target.years,multiple=1/s.withdrawalRate,inflationImpact=r.fiToday>0?r.target.target/r.fiToday-1:0;
    els.insightMultiple.textContent=`${multiple.toFixed(1)}×`;els.insightMultipleText.textContent=`At a ${(s.withdrawalRate*100).toFixed(1)}% planning withdrawal rate, the model uses about ${multiple.toFixed(1)} times annual portfolio-funded spending.`;
    els.insightInflation.textContent=`+${Math.round(Math.max(0,inflationImpact)*100)}%`;els.insightInflationText.textContent=`Over ${years.toFixed(0)} years, the spending-based target rises from ${compact(r.fiToday)} today to ${compact(r.target.target)} at the selected age under the inflation assumption.`;
    if(r.target.target<=0){
      els.insightTiming.textContent='No portfolio target';
      els.insightTimingText.textContent='Recurring non-portfolio income covers the modelled spending amount, so there is no spending-based portfolio target to reach.';
      els.insightAdjustment.textContent='No portfolio investment required';
      els.insightAdjustmentText.textContent=`Because portfolio-funded spending is zero, the modelled starting monthly investment required for the target is ${money(0)}.`;
    }else{
      els.insightTiming.textContent=r.modelledFI.reached?`Age ${r.modelledFI.age.toFixed(r.modelledFI.months%12===0?0:1)}`:'After age 90';
      els.insightTimingText.textContent=r.modelledFI.reached?`This is the first modelled month when the projected portfolio reaches the inflation-adjusted target.`:'The current inputs do not reach the modelled target by age 90.';
      els.insightAdjustment.textContent=r.additionalMonthly>0?`+${money(r.additionalMonthly)}/mo`:'No increase modelled';
      els.insightAdjustmentText.textContent=r.additionalMonthly>0?`Starting monthly investment required for age ${Math.round(s.targetAge)} is ${money(r.requiredMonthly)}, before applying the annual step-up.`:`The current monthly investment is already at or above the modelled starting amount required for age ${Math.round(s.targetAge)}.`;
    }
  }

  function renderScenarios(s){
    const ages=[Math.max(s.currentAge+1,s.targetAge-5),s.targetAge,Math.min(90,s.targetAge+5)].filter((v,i,a)=>a.indexOf(v)===i);
    els.scenarioGrid.innerHTML=ages.map(age=>{const tp=C.targetProjection(s,age),req=C.requiredMonthly(s,age),add=Math.max(0,req-s.monthlyContribution),current=Math.abs(age-s.targetAge)<.001;return `<article class="scenario ${current?'current':''}"><span class="tag">${current?'Selected age':'Alternative age'}</span><strong class="big">Age ${Math.round(age)}</strong><dl><div><dt>FI target</dt><dd>${esc(compact(tp.target))}</dd></div><div><dt>Projected portfolio</dt><dd>${esc(compact(tp.portfolio))}</dd></div><div><dt>Starting monthly investment required</dt><dd>${esc(money(req))}</dd></div><div><dt>Additional vs current</dt><dd>${esc(money(add))}</dd></div></dl></article>`;}).join('');
  }

  function niceMax(v){if(v<=0)return 1;const p=Math.pow(10,Math.floor(Math.log10(v))),n=v/p,m=n<=1?1:n<=2?2:n<=2.5?2.5:n<=5?5:10;return m*p;}
  function chartBase(svg,maxVal,minAge,maxAge){const W=800,H=300,l=82,r=20,t=20,b=42,iw=W-l-r,ih=H-t-b,x=age=>l+((age-minAge)/(maxAge-minAge))*iw,yy=v=>t+ih-(v/maxVal)*ih;let h='';for(let i=0;i<=4;i++){const v=maxVal*i/4,py=yy(v);h+=`<line class="gridline" x1="${l}" x2="${W-r}" y1="${py}" y2="${py}"/><text class="axis" x="${l-10}" y="${py+4}" text-anchor="end">${esc(compact(v))}</text>`;}[minAge,(minAge+maxAge)/2,maxAge].forEach(age=>h+=`<text class="axis" x="${x(age)}" y="${H-14}" text-anchor="middle">Age ${Math.round(age)}</text>`);svg.innerHTML=h;return{x,yy,W,H,l,r,t,b,iw,ih,minAge,maxAge};}
  function bindChart(svg,series,g){
    const card=svg.closest('.chart-card');let tip=card.querySelector('.fi-chart-tooltip');if(!tip){tip=document.createElement('div');tip.className='fi-chart-tooltip';tip.setAttribute('aria-hidden','true');card.appendChild(tip);}let guide=document.createElementNS('http://www.w3.org/2000/svg','line');guide.setAttribute('class','fi-chart-guide');guide.setAttribute('y1',g.t);guide.setAttribute('y2',g.H-g.b);guide.setAttribute('visibility','hidden');svg.appendChild(guide);const dots=series.map(ser=>{const d=document.createElementNS('http://www.w3.org/2000/svg','circle');d.setAttribute('class','fi-chart-hover-dot');d.setAttribute('r','5');d.setAttribute('fill',ser.color);d.setAttribute('visibility','hidden');svg.appendChild(d);return d;});
    const hide=()=>{tip.classList.remove('visible');tip.setAttribute('aria-hidden','true');guide.setAttribute('visibility','hidden');dots.forEach(d=>d.setAttribute('visibility','hidden'));};let touchPinned=false;
    const nearest=(pts,age)=>pts.reduce((best,p)=>Math.abs(p.age-age)<Math.abs(best.age-age)?p:best,pts[0]);
    const show=ev=>{const rect=svg.getBoundingClientRect();if(!rect.width)return;const pointerX=Math.max(0,Math.min(rect.width,ev.clientX-rect.left)),viewX=pointerX/rect.width*g.W,rawAge=g.minAge+Math.max(0,Math.min(1,(viewX-g.l)/Math.max(1e-9,g.iw)))*(g.maxAge-g.minAge),anchor=nearest(series[0].points,rawAge),age=anchor.age,cx=g.x(age);guide.setAttribute('x1',cx);guide.setAttribute('x2',cx);guide.setAttribute('visibility','visible');let html=`<strong>Age ${age.toFixed(Math.abs(age-Math.round(age))<.001?0:1)}</strong>`;series.forEach((ser,i)=>{const p=nearest(ser.points,age);dots[i].setAttribute('cx',cx);dots[i].setAttribute('cy',g.yy(p.v));dots[i].setAttribute('visibility','visible');html+=`<span>${esc(ser.label)}: ${esc(compact(p.v))}</span>`;});tip.innerHTML=html;tip.setAttribute('aria-hidden','false');const cr=card.getBoundingClientRect();let left=ev.clientX-cr.left+14;left=Math.max(8,Math.min(left,card.clientWidth-240));let top=ev.clientY-cr.top-72;top=Math.max(8,Math.min(top,card.clientHeight-90));tip.style.left=`${left}px`;tip.style.top=`${top}px`;tip.classList.add('visible');};
    svg.onpointermove=ev=>{if(ev.pointerType!=='touch')show(ev);};svg.onpointerdown=ev=>{show(ev);touchPinned=ev.pointerType==='touch';};svg.onpointerleave=ev=>{if(ev.pointerType!=='touch'&&!touchPinned)hide();};svg.onpointercancel=hide;
  }
  function path(points,g,key){return points.map((p,i)=>`${i?'L':'M'}${g.x(p.age)},${g.yy(p[key])}`).join(' ');}
  function renderCharts(r,rawState){
    // C.series expects the raw UI percentages (e.g. 5 for 5%), while r.state is
    // already normalized (0.05). Passing r.state here would normalize twice and
    // make the FI target series collapse toward zero. Always feed the raw UI state.
    const s=r.state;let endAge=Math.max(s.targetAge+5,s.currentAge+20);if(r.modelledFI.reached)endAge=Math.max(endAge,Math.ceil(r.modelledFI.age+2));endAge=Math.min(90,endAge);const points=C.series(rawState,endAge);const max=niceMax(Math.max(...points.flatMap(p=>[p.target,p.portfolio]))*1.08),g=chartBase(els.pathChart,max,s.currentAge,endAge);els.pathChart.innerHTML+=`<path class="target-line" d="${path(points,g,'target')}"/><path class="plan-line" d="${path(points,g,'portfolio')}"/>`;bindChart(els.pathChart,[{label:'FI target',color:'#173d5c',points:points.map(p=>({age:p.age,v:p.target}))},{label:'Projected portfolio',color:'#0e8b80',points:points.map(p=>({age:p.age,v:p.portfolio}))}],g);
    const added=points.map(p=>({age:p.age,added:s.currentAssets+p.contributions,portfolio:p.portfolio})),max2=niceMax(Math.max(...added.flatMap(p=>[p.added,p.portfolio]))*1.08),g2=chartBase(els.growthChart,max2,s.currentAge,endAge);els.growthChart.innerHTML+=`<path class="added-line" d="${path(added,g2,'added')}"/><path class="plan-line" d="${path(added,g2,'portfolio')}"/>`;bindChart(els.growthChart,[{label:'Assets + contributions',color:'#8799aa',points:added.map(p=>({age:p.age,v:p.added}))},{label:'Projected portfolio',color:'#0e8b80',points:added.map(p=>({age:p.age,v:p.portfolio}))}],g2);
  }

  async function copySummary(){const r=C.result(state()),s=r.state,txt=[`CARROWMONT FINANCIAL INDEPENDENCE SUMMARY`,``,`Country / region: ${L.getProfile().label}`,`Currency: ${L.getCurrency()}`,`Current age: ${s.currentAge}`,`Target age: ${s.targetAge}`,`Monthly spending today: ${money(s.monthlySpending)}`,`Expected spending at FI: ${(s.spendingPct*100).toFixed(0)}% of today`,`Monthly non-portfolio income at FI: ${money(s.monthlyIncome)}`,`Planning withdrawal rate: ${(s.withdrawalRate*100).toFixed(1)}%`,`Inflation assumption: ${(s.inflation*100).toFixed(1)}%`,`Expected investment return: ${(s.annualReturn*100).toFixed(1)}%`,`Annual contribution increase: ${(s.annualStepUp*100).toFixed(1)}%`,``,`Estimated FI number today: ${money(r.fiToday)}`,`FI target at age ${s.targetAge}: ${money(r.target.target)}`,`Projected portfolio at age ${s.targetAge}: ${money(r.target.portfolio)}`,`Starting monthly investment required: ${money(r.requiredMonthly)}`,`Additional monthly investment required: ${money(r.additionalMonthly)}`,`Modelled FI timing under current plan: ${r.target.target<=0?'No portfolio target':(r.modelledFI.reached?r.modelledFI.age.toFixed(1):'Not reached by age 90')}`,``,`Illustrative estimate only. The withdrawal rate is a planning assumption, not a guarantee or recommendation.`,`carrowmont.com`].join('\n');try{await navigator.clipboard.writeText(txt);els.copyBtn.textContent='Copied';setTimeout(()=>els.copyBtn.textContent='Copy Summary',1400);}catch(_){const ta=document.createElement('textarea');ta.value=txt;document.body.appendChild(ta);ta.select();document.execCommand('copy');ta.remove();}}

  async function generateFIReport(){
    if(!window.CarrowmontPdfExport||!window.CarrowmontFIPdfRenderer){
      alert('The PDF download engine did not load. Please refresh the page and try again.');
      return;
    }
    const r=C.result(state());
    const original=els.reportBtn.textContent;
    els.reportBtn.disabled=true;els.reportBtn.setAttribute('aria-busy','true');els.reportBtn.textContent='Preparing PDF...';
    try{
      const canvases=await window.CarrowmontFIPdfRenderer.render(r);
      const d=new Date(),yyyy=d.getFullYear(),mm=String(d.getMonth()+1).padStart(2,'0'),dd=String(d.getDate()).padStart(2,'0');
      await window.CarrowmontPdfExport.downloadCanvases(canvases,{filename:`financial-independence-report-${yyyy}-${mm}-${dd}.pdf`,quality:.95});
      els.reportBtn.textContent='Report Downloaded';
    }catch(err){
      console.error('Financial Independence report PDF generation failed',err);
      els.reportBtn.textContent='PDF Failed - Try Again';
      alert('The report could not be generated. Please refresh the page and try again.');
    }finally{
      els.reportBtn.disabled=false;els.reportBtn.removeAttribute('aria-busy');
      setTimeout(()=>{if(els.reportBtn.textContent!=='Preparing PDF...')els.reportBtn.textContent=original;},1800);
    }
  }

  els.copyBtn.addEventListener('click',copySummary);
  els.reportBtn.addEventListener('click',generateFIReport);
  document.querySelectorAll('input').forEach(i=>i.addEventListener('input',render));
  els.targetAge.addEventListener('change',commitTargetAge);
  els.targetAge.addEventListener('blur',commitTargetAge);
  els.currentAge.addEventListener('change',commitInputs);
  els.currentAge.addEventListener('blur',commitInputs);

  [[els.monthlySpending,commitNonNegative],[els.monthlyIncome,commitNonNegative],[els.currentAssets,commitNonNegative],[els.monthlyContribution,commitNonNegative]].forEach(([el,fn])=>{
    el.addEventListener('change',()=>fn(el));
    el.addEventListener('blur',()=>fn(el));
  });
  [[els.spendingPct,0,200,100],[els.withdrawalRate,0.5,15,4],[els.inflation,0,25,5],[els.annualReturn,0,30,10],[els.annualStepUp,0,30,5]].forEach(([el,min,max,fallback])=>{
    el.addEventListener('change',()=>commitBoundedNumber(el,min,max,fallback));
    el.addEventListener('blur',()=>commitBoundedNumber(el,min,max,fallback));
  });

  populateLocale();
  if(usesIndiaDemoDefaults()) render(); else resetMoneyForLocale();
})();
