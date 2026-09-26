(function(){
  'use strict';
  const L=window.CarrowmontLocale,C=window.CarrowmontFICore;
  if(!L||!C) return;
  const $=id=>document.getElementById(id);
  const els={
    localeMenu:$('localeMenu'),localeCurrent:$('localeCurrent'),regionSelect:$('regionSelect'),currencySelect:$('currencySelect'),localeDone:$('localeDone'),
    currentAge:$('currentAge'),targetAge:$('targetAge'),monthlySpending:$('monthlySpending'),spendingPct:$('spendingPct'),monthlyIncome:$('monthlyIncome'),withdrawalRate:$('withdrawalRate'),inflation:$('inflation'),currentAssets:$('currentAssets'),monthlyContribution:$('monthlyContribution'),payFrequency:$('payFrequency'),investmentFrequency:$('investmentFrequency'),sameAsPayCycle:$('sameAsPayCycle'),currentInvestmentLabel:$('currentInvestmentLabel'),currentInvestmentHelp:$('currentInvestmentHelp'),annualReturn:$('annualReturn'),annualStepUp:$('annualStepUp'),resetBtn:$('resetBtn'),
    targetPill:$('targetPill'),fiToday:$('fiToday'),fiTodayNote:$('fiTodayNote'),modelledAge:$('modelledAge'),fiTargetAge:$('fiTargetAge'),portfolioTargetAge:$('portfolioTargetAge'),requiredMonthly:$('requiredMonthly'),additionalMonthly:$('additionalMonthly'),requiredInvestmentLabel:$('requiredInvestmentLabel'),additionalInvestmentLabel:$('additionalInvestmentLabel'),fundingPct:$('fundingPct'),fundingBar:$('fundingBar'),fundingText:$('fundingText'),copyBtn:$('copyBtn'),
    netSpendCard:$('netSpendCard'),fiTodayCard:$('fiTodayCard'),fiTargetCard:$('fiTargetCard'),portfolioCard:$('portfolioCard'),pathChart:$('pathChart'),growthChart:$('growthChart'),visualEmpty:$('visualEmpty'),visualContent:$('visualContent'),insightsSection:$('insightsSection'),scenariosSection:$('scenariosSection'),
    insightMultiple:$('insightMultiple'),insightMultipleText:$('insightMultipleText'),insightInflation:$('insightInflation'),insightInflationText:$('insightInflationText'),insightTiming:$('insightTiming'),insightTimingText:$('insightTimingText'),insightAdjustment:$('insightAdjustment'),insightAdjustmentText:$('insightAdjustmentText'),scenarioGrid:$('scenarioGrid'),fiJourney:$('fiJourney'),journeyMoneyAdded:$('journeyMoneyAdded'),journeyGrowth:$('journeyGrowth'),journeyPortfolio:$('journeyPortfolio'),journeyFunding:$('journeyFunding'),journeyMilestones:$('journeyMilestones'),journeyDetails:$('journeyDetails'),journeyCount:$('journeyCount'),journeyBody:$('journeyBody'),journeyNote:$('journeyNote'),reportBtn:$('reportBtn')
  };
  let pendingRegion=L.getRegion(),pendingCurrency=L.getCurrency();
  let payFrequencyUserOverride=false,investmentFrequencyUserOverride=false;
  const frequencyOrder=['weekly','biweekly','semimonthly','fourweekly','monthly'];
  const frequencyBaseLabels={weekly:'Weekly',semimonthly:'Twice Monthly',fourweekly:'Every 4 Weeks',monthly:'Monthly'};
  function frequencyProfile(regionCode=L.getRegion()){return L.regions[regionCode]||L.regions.OTHER||{};}
  function frequencyLabel(key,regionCode=L.getRegion()){
    if(key==='biweekly'){const style=frequencyProfile(regionCode).twoWeekLabel||'neutral';if(style==='fortnightly')return 'Fortnightly (Every 2 Weeks)';if(style==='biweekly')return 'Biweekly (Every 2 Weeks)';return 'Every 2 Weeks';}
    return frequencyBaseLabels[key]||'Monthly';
  }
  function defaultFrequencyForRegion(code=L.getRegion()){return frequencyProfile(code).contributionFrequency||'monthly';}
  function cadenceText(key){if(key==='weekly')return 'per week';if(key==='biweekly')return 'every 2 weeks';if(key==='semimonthly')return 'twice monthly';if(key==='fourweekly')return 'every 4 weeks';return 'per month';}
  function frequencyName(key){return frequencyLabel(key).replace(/\s*\(Every 2 Weeks\)\s*/,'').trim();}
  function currentInvestmentLabelText(key){if(key==='biweekly'&&frequencyName(key)==='Every 2 Weeks')return 'Current investment every 2 weeks';if(key==='fourweekly')return 'Current investment every 4 weeks';return `Current ${frequencyName(key).toLowerCase()} investment`;}
  function requiredInvestmentLabelText(key,prefix='Total'){if(key==='biweekly'&&frequencyName(key)==='Every 2 Weeks')return `${prefix} investment required every 2 weeks`;if(key==='fourweekly')return `${prefix} investment required every 4 weeks`;return `${prefix} ${frequencyName(key).toLowerCase()} investment required`;}
  function contributionText(amount,key){return `${money(amount)} ${cadenceText(key)}`;}
  function populateFrequencySelect(select,desired){if(!select)return;select.innerHTML=frequencyOrder.map(key=>`<option value="${key}">${frequencyLabel(key)}</option>`).join('');select.value=frequencyOrder.includes(desired)?desired:'monthly';}
  function updateFrequencyCopy(){if(!els.investmentFrequency)return;const key=els.investmentFrequency.value||'monthly';if(els.currentInvestmentLabel)els.currentInvestmentLabel.textContent=currentInvestmentLabelText(key);if(els.currentInvestmentHelp)els.currentInvestmentHelp.textContent=`Enter how much you currently invest ${cadenceText(key)} toward Financial Independence.`;if(els.requiredInvestmentLabel)els.requiredInvestmentLabel.textContent=requiredInvestmentLabelText(key,'Total');if(els.additionalInvestmentLabel)els.additionalInvestmentLabel.textContent=requiredInvestmentLabelText(key,'Additional');}
  function syncFrequencyOptions(){const suggested=defaultFrequencyForRegion();const payDesired=payFrequencyUserOverride?(els.payFrequency?.value||suggested):suggested;populateFrequencySelect(els.payFrequency,payDesired);const investDesired=els.sameAsPayCycle?.checked?els.payFrequency.value:(investmentFrequencyUserOverride?(els.investmentFrequency?.value||suggested):suggested);populateFrequencySelect(els.investmentFrequency,investDesired);if(els.sameAsPayCycle?.checked)els.investmentFrequency.value=els.payFrequency.value;if(els.investmentFrequency)els.investmentFrequency.disabled=Boolean(els.sameAsPayCycle?.checked);updateFrequencyCopy();}
  const num=(el,d=0)=>{const v=parseFloat(el.value);return Number.isFinite(v)?v:d;};
  const esc=s=>String(s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  const money=v=>L.formatMoney(v,{maximumFractionDigits:0});
  const compact=v=>L.formatCompactMoney(v,{maximumFractionDigits:2});
  const pct=v=>`${Math.round(v*100)}%`;


  function modelledAgeText(r,compactMode=false){
    if(r.target.target<=0) return 'No portfolio target';
    if(!r.modelledFI.reached) return 'FI target not reached within the modelled period.';
    const totalMonths=Math.max(0,Math.round(r.state.currentAge*12)+(r.modelledFI.months||0));
    const years=Math.floor(totalMonths/12),months=totalMonths%12;
    if(compactMode) return `Age ${years}y ${months}m`;
    return `Age ${years} years ${months} month${months===1?'':'s'}`;
  }
  function chartEndAge(r){
    const s=r.state;
    if(r.target.target<=0) return Math.min(90,s.targetAge+5);
    if(r.modelledFI.reached) return Math.min(90,Math.max(s.targetAge+5,Math.ceil(r.modelledFI.age+1)));
    return 90;
  }

  function populateLocale(){
    const regionEntries=Object.entries(L.regions).sort(([codeA,a],[codeB,b])=>{
      if(codeA==='OTHER') return 1;
      if(codeB==='OTHER') return -1;
      return a.label.localeCompare(b.label,'en',{sensitivity:'base'});
    });
    els.regionSelect.innerHTML=regionEntries.map(([c,p])=>`<option value="${c}">${p.label}</option>`).join('');
    els.currencySelect.innerHTML=Object.entries(L.currencies).map(([c,p])=>`<option value="${c}">${c} — ${p.label}</option>`).join('');
    els.regionSelect.value=pendingRegion;els.currencySelect.value=pendingCurrency;updateLocaleSummary();
  }
  function updateLocaleSummary(){els.localeCurrent.textContent=`${L.getProfile().label} · ${L.getCurrency()}`;document.querySelectorAll('.currency-prefix').forEach(e=>e.textContent=L.currencySymbol());}
  els.localeMenu.addEventListener('toggle',()=>{if(els.localeMenu.open){pendingRegion=L.getRegion();pendingCurrency=L.getCurrency();els.regionSelect.value=pendingRegion;els.currencySelect.value=pendingCurrency;}});
  els.regionSelect.addEventListener('change',e=>{pendingRegion=e.target.value;const p=L.regions[pendingRegion];if(p&&L.currencies[p.currency]){pendingCurrency=p.currency;els.currencySelect.value=pendingCurrency;}});
  els.currencySelect.addEventListener('change',e=>pendingCurrency=e.target.value);
  els.localeDone.addEventListener('click',()=>{const regionChanged=pendingRegion!==L.getRegion(),changed=regionChanged||pendingCurrency!==L.getCurrency();if(regionChanged){payFrequencyUserOverride=false;investmentFrequencyUserOverride=false;}L.setLocale(pendingRegion,pendingCurrency);els.localeMenu.open=false;if(changed) resetMoneyForLocale();});
  document.addEventListener('click',e=>{if(els.localeMenu.open&&!els.localeMenu.contains(e.target))els.localeMenu.open=false;});
  document.addEventListener('keydown',e=>{if(e.key==='Escape')els.localeMenu.open=false;});
  window.addEventListener('carrowmont:localechange',()=>{updateLocaleSummary();syncFrequencyOptions();render();});

  function usesIndiaDemoDefaults(){return L.getRegion()==='IN'&&L.getCurrency()==='INR';}
  function resetMoneyForLocale(){els.monthlySpending.value=0;els.monthlyIncome.value=0;els.currentAssets.value=0;els.monthlyContribution.value=0;render();}
  function resetAll(){
    els.currentAge.value=35;els.targetAge.value=50;els.monthlySpending.value=100000;els.spendingPct.value=100;els.monthlyIncome.value=0;els.withdrawalRate.value=4;els.inflation.value=5;els.currentAssets.value=1500000;els.monthlyContribution.value=30000;els.annualReturn.value=10;els.annualStepUp.value=5;payFrequencyUserOverride=false;investmentFrequencyUserOverride=false;if(els.sameAsPayCycle)els.sameAsPayCycle.checked=false;syncFrequencyOptions();
    if(!usesIndiaDemoDefaults()) resetMoneyForLocale(); else render();
  }
  els.resetBtn.addEventListener('click',resetAll);

  function state(){
    const currentAge=Math.max(18,Math.min(80,num(els.currentAge,35)));
    const targetAge=Math.max(currentAge+1,Math.min(90,num(els.targetAge,currentAge+15)));
    return {currentAge,targetAge,monthlySpending:num(els.monthlySpending),spendingPct:num(els.spendingPct,100),monthlyIncome:num(els.monthlyIncome),withdrawalRate:num(els.withdrawalRate,4),inflation:num(els.inflation,5),currentAssets:num(els.currentAssets),monthlyContribution:num(els.monthlyContribution),payFrequency:els.payFrequency?.value||'monthly',investmentFrequency:els.investmentFrequency?.value||'monthly',annualReturn:num(els.annualReturn,8),annualStepUp:num(els.annualStepUp)};
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
    els.visualEmpty.hidden=!empty;els.visualContent.hidden=empty;els.insightsSection.hidden=empty;els.scenariosSection.hidden=empty;if(els.fiJourney)els.fiJourney.hidden=empty;
    if(empty){
      els.fiToday.textContent='—';
      els.fiTodayNote.textContent='Enter your spending and investment details to build an illustrative financial-independence estimate.';
      els.modelledAge.textContent='Add your details';
      els.fiTargetAge.textContent='—';els.portfolioTargetAge.textContent='—';els.requiredMonthly.textContent='—';els.additionalMonthly.textContent='—';
      els.fundingPct.textContent='—';els.fundingBar.style.width='0%';
      els.fundingText.textContent='Your funding estimate will appear after you add spending or investment details.';
      els.pathChart.innerHTML='';els.growthChart.innerHTML='';els.scenarioGrid.innerHTML='';if(els.journeyBody)els.journeyBody.innerHTML='';
      return;
    }
    els.fiToday.textContent=compact(r.fiToday);
    els.fiTodayNote.textContent=`Based on ${money(r.portfolioMonthlyNeed)} per month of portfolio-funded spending and a ${(s.withdrawalRate*100).toFixed(1)}% withdrawal-rate assumption`;
    els.modelledAge.textContent=modelledAgeText(r);
    updateFrequencyCopy();els.fiTargetAge.textContent=compact(t.target);els.portfolioTargetAge.textContent=compact(t.portfolio);els.requiredMonthly.textContent=money(r.requiredContribution);els.additionalMonthly.textContent=money(r.additionalContribution);
    const funded=Math.max(0,t.funding);els.fundingPct.textContent=pct(Math.min(funded,9.99));els.fundingBar.style.width=`${Math.min(100,funded*100)}%`;
    if(t.target<=0) els.fundingText.textContent='Under these inputs, recurring non-portfolio income covers the modelled spending amount, so the spending-based portfolio target is zero.';
    else if(funded>=1) els.fundingText.textContent=`Your current plan is projected to meet or exceed the modelled target at Target Age ${Math.round(s.targetAge)} under these assumptions.`;
    else els.fundingText.textContent=`Your current plan is projected to cover about ${Math.round(funded*100)}% of the modelled target at Target Age ${Math.round(s.targetAge)}.`;

    els.netSpendCard.textContent=`${money(r.portfolioMonthlyNeed)}/mo`;els.fiTodayCard.textContent=compact(r.fiToday);els.fiTargetCard.textContent=compact(t.target);els.portfolioCard.textContent=compact(t.portfolio);
    renderInsights(r);renderScenarios(r);renderCharts(r,raw);renderJourney(r,raw);
  }

  function renderInsights(r){
    const s=r.state,years=r.target.years,multiple=1/s.withdrawalRate,inflationImpact=r.fiToday>0?r.target.target/r.fiToday-1:0;
    els.insightMultiple.textContent=`${multiple.toFixed(1)}×`;els.insightMultipleText.textContent=`At a ${(s.withdrawalRate*100).toFixed(1)}% planning withdrawal rate, the model uses about ${multiple.toFixed(1)} times annual portfolio-funded spending.`;
    els.insightInflation.textContent=`+${Math.round(Math.max(0,inflationImpact)*100)}%`;els.insightInflationText.textContent=`Over ${years.toFixed(0)} years, the spending-based target rises from ${compact(r.fiToday)} today to ${compact(r.target.target)} at the selected age under the inflation assumption.`;
    if(r.target.target<=0){
      els.insightTiming.textContent='No portfolio target';
      els.insightTimingText.textContent='Recurring non-portfolio income covers the modelled spending amount, so there is no spending-based portfolio target to reach.';
      els.insightAdjustment.textContent='No portfolio investment required';
      els.insightAdjustmentText.textContent=`Because portfolio-funded spending is zero, the modelled starting investment required ${cadenceText(s.investmentFrequency)} for the target is ${money(0)}.`;
    }else{
      els.insightTiming.textContent=modelledAgeText(r);
      els.insightTimingText.textContent=r.modelledFI.reached?`This is the first modelled ${frequencyName(s.investmentFrequency).toLowerCase()} contribution period when the projected portfolio reaches the inflation-adjusted target.`:'FI target not reached within the modelled period through age 90.';
      els.insightAdjustment.textContent=r.additionalContribution>0?`+${contributionText(r.additionalContribution,s.investmentFrequency)}`:'No increase modelled';
      els.insightAdjustmentText.textContent=r.additionalContribution>0?`Starting investment required ${cadenceText(s.investmentFrequency)} for age ${Math.round(s.targetAge)} is ${money(r.requiredContribution)}, before applying the annual step-up.`:`The current investment ${cadenceText(s.investmentFrequency)} is already at or above the modelled starting amount required for age ${Math.round(s.targetAge)}.`;
    }
  }

  function renderScenarios(r){
    const s=r.state,targetPlus5=Math.min(90,s.targetAge+5);
    const checkpoints=[{age:s.currentAge,label:'Today',kind:'today'},{age:s.targetAge,label:'Target Age',kind:'target'},{age:targetPlus5,label:'Target Age +5',kind:'plus5'}].filter((v,i,a)=>a.findIndex(x=>Math.abs(x.age-v.age)<.001)===i);
    els.scenarioGrid.innerHTML=checkpoints.map(cp=>{
      const tp=C.targetProjection(s,cp.age),req=cp.kind==='today'?null:C.requiredContribution(s,cp.age),portfolioLabel=cp.kind==='today'?'Current Portfolio Value':'Projected Portfolio Value';
      return `<article class="scenario ${cp.kind==='target'?'target-age':''}"><span class="tag">${esc(cp.label)}</span><strong class="big">Age ${Math.round(cp.age)}</strong><dl><div><dt>FI target</dt><dd>${esc(compact(tp.target))}</dd></div><div><dt>${esc(portfolioLabel)}</dt><dd>${esc(compact(tp.portfolio))}</dd></div><div><dt>Funding</dt><dd>${esc(pct(Math.min(9.99,tp.funding)))}</dd></div><div><dt>${esc(requiredInvestmentLabelText(s.investmentFrequency,'Starting'))}</dt><dd>${req===null?'—':esc(money(req))}</dd></div></dl></article>`;
    }).join('');
  }

  function niceMax(v){if(v<=0)return 1;const p=Math.pow(10,Math.floor(Math.log10(v))),n=v/p,m=n<=1?1:n<=2?2:n<=2.5?2.5:n<=5?5:10;return m*p;}
  function chartBase(svg,maxVal,minAge,maxAge){const W=800,H=360,l=82,r=20,t=92,b=44;svg.setAttribute('viewBox',`0 0 ${W} ${H}`);const iw=W-l-r,ih=H-t-b,x=age=>l+((age-minAge)/(maxAge-minAge))*iw,yy=v=>t+ih-(v/maxVal)*ih;let h='';for(let i=0;i<=4;i++){const v=maxVal*i/4,py=yy(v);h+=`<line class="gridline" x1="${l}" x2="${W-r}" y1="${py}" y2="${py}"/><text class="axis" x="${l-10}" y="${py+4}" text-anchor="end">${esc(compact(v))}</text>`;}[minAge,(minAge+maxAge)/2,maxAge].forEach(age=>h+=`<text class="axis" x="${x(age)}" y="${H-14}" text-anchor="middle">Age ${Math.round(age)}</text>`);svg.innerHTML=h;return{x,yy,W,H,l,r,t,b,iw,ih,minAge,maxAge};}
  function bindChart(svg,series,g){
    const card=svg.closest('.chart-card');let tip=card.querySelector('.fi-chart-tooltip');if(!tip){tip=document.createElement('div');tip.className='fi-chart-tooltip';tip.setAttribute('aria-hidden','true');card.appendChild(tip);}let guide=document.createElementNS('http://www.w3.org/2000/svg','line');guide.setAttribute('class','fi-chart-guide');guide.setAttribute('y1',g.t);guide.setAttribute('y2',g.H-g.b);guide.setAttribute('visibility','hidden');svg.appendChild(guide);const dots=series.map(ser=>{const d=document.createElementNS('http://www.w3.org/2000/svg','circle');d.setAttribute('class','fi-chart-hover-dot');d.setAttribute('r','5');d.setAttribute('fill',ser.color);d.setAttribute('visibility','hidden');svg.appendChild(d);return d;});
    const hide=()=>{tip.classList.remove('visible');tip.setAttribute('aria-hidden','true');guide.setAttribute('visibility','hidden');dots.forEach(d=>d.setAttribute('visibility','hidden'));};let touchPinned=false;
    const nearest=(pts,age)=>pts.reduce((best,p)=>Math.abs(p.age-age)<Math.abs(best.age-age)?p:best,pts[0]);
    const show=ev=>{const rect=svg.getBoundingClientRect();if(!rect.width)return;const pointerX=Math.max(0,Math.min(rect.width,ev.clientX-rect.left)),viewX=pointerX/rect.width*g.W,rawAge=g.minAge+Math.max(0,Math.min(1,(viewX-g.l)/Math.max(1e-9,g.iw)))*(g.maxAge-g.minAge),anchor=nearest(series[0].points,rawAge),age=anchor.age,cx=g.x(age);guide.setAttribute('x1',cx);guide.setAttribute('x2',cx);guide.setAttribute('visibility','visible');let html=`<strong>Age ${age.toFixed(Math.abs(age-Math.round(age))<.001?0:1)}</strong>`;series.forEach((ser,i)=>{const p=nearest(ser.points,age);dots[i].setAttribute('cx',cx);dots[i].setAttribute('cy',g.yy(p.v));dots[i].setAttribute('visibility','visible');html+=`<span>${esc(ser.label)}: ${esc(compact(p.v))}</span>`;});tip.innerHTML=html;tip.setAttribute('aria-hidden','false');const cr=card.getBoundingClientRect();let left=ev.clientX-cr.left+14;left=Math.max(8,Math.min(left,card.clientWidth-240));let top=ev.clientY-cr.top-72;top=Math.max(8,Math.min(top,card.clientHeight-90));tip.style.left=`${left}px`;tip.style.top=`${top}px`;tip.classList.add('visible');};
    svg.onpointermove=ev=>{if(ev.pointerType!=='touch')show(ev);};svg.onpointerdown=ev=>{show(ev);touchPinned=ev.pointerType==='touch';};svg.onpointerleave=ev=>{if(ev.pointerType!=='touch'&&!touchPinned)hide();};svg.onpointercancel=hide;
  }
  function path(points,g,key){return points.map((p,i)=>`${i?'L':'M'}${g.x(p.age)},${g.yy(p[key])}`).join(' ');}

  function checkpointTitle(age,s){if(Math.abs(age-s.currentAge)<.01)return `Today · Age ${Math.round(age)}`;if(Math.abs(age-s.targetAge)<.01)return `Target Age ${Math.round(age)}`;if(Math.abs(age-Math.min(90,s.targetAge+5))<.01)return `Target +5 · Age ${Math.round(age)}`;return `Age ${Math.round(age)}`;}
  function addStaticChartValues(svg,g,ages,series,s){
    const unique=[];ages.forEach(a=>{if(!unique.some(v=>Math.abs(v-a)<.5))unique.push(a);});
    const nearest=(pts,age)=>pts.reduce((best,p)=>Math.abs(p.age-age)<Math.abs(best.age-age)?p:best,pts[0]);
    const boxW=230,boxH=62,boxY=6;
    unique.slice(0,3).forEach((age,i,arr)=>{
      const anchor=nearest(series[0].points,age),actualAge=anchor.age;
      const bx=i===0?g.l:(i===arr.length-1?g.W-g.r-boxW:g.l+(g.iw-boxW)/2);
      const first=nearest(series[0].points,actualAge),second=nearest(series[1].points,actualAge),isTarget=Math.abs(actualAge-s.targetAge)<.5,isToday=Math.abs(actualAge-s.currentAge)<.5;
      const ageLabel=checkpointTitle(actualAge,s);
      const label1=`${series[0].shortLabel}: ${compact(first.v)}`;
      const secondName=isToday&&series[1].currentShortLabel?series[1].currentShortLabel:series[1].shortLabel;
      const label2=`${secondName}: ${compact(second.v)}`;
      const fill=isTarget?'#eef9f7':'#ffffff',stroke=isTarget?'#0e8b80':'#c9d9e2',strokeWidth=isTarget?2:1;
      svg.innerHTML+=`<g class="fi-static-value ${isTarget?'fi-target-card':''}"><rect x="${bx}" y="${boxY}" width="${boxW}" height="${boxH}" rx="9" fill="${fill}" stroke="${stroke}" stroke-width="${strokeWidth}"/><text x="${bx+10}" y="${boxY+16}" font-size="10.5" font-weight="900" fill="#102945">${esc(ageLabel)}</text><line x1="${bx+10}" x2="${bx+24}" y1="${boxY+32}" y2="${boxY+32}" stroke="${series[0].color}" stroke-width="3"/><text x="${bx+30}" y="${boxY+35}" font-size="8.7" font-weight="700" fill="#405b75">${esc(label1)}</text><line x1="${bx+10}" x2="${bx+24}" y1="${boxY+49}" y2="${boxY+49}" stroke="${series[1].color}" stroke-width="3"/><text x="${bx+30}" y="${boxY+52}" font-size="8.4" font-weight="700" fill="#405b75">${esc(label2)}</text></g>`;
    });
  }
  function addTargetAgeMarker(svg,g,s){
    if(s.targetAge<=g.minAge||s.targetAge>=g.maxAge)return;const x=g.x(s.targetAge),label=`Target Age ${Math.round(s.targetAge)}`,w=94;
    svg.innerHTML+=`<g class="target-age-marker"><line x1="${x}" x2="${x}" y1="${g.t}" y2="${g.H-g.b}" stroke="#0e8b80" stroke-width="1.6" stroke-dasharray="5 5"/><rect x="${Math.max(g.l,Math.min(g.W-g.r-w,x-w/2))}" y="${g.t+5}" width="${w}" height="20" rx="10" fill="#e8f6f3" stroke="#0e8b80"/><text x="${Math.max(g.l,Math.min(g.W-g.r-w,x-w/2))+w/2}" y="${g.t+18}" text-anchor="middle" font-size="9" font-weight="900" fill="#08756d">${esc(label)}</text></g>`;
  }
  function addFICrossingMarker(svg,g,r,which){
    if(r.target.target<=0||!r.modelledFI.reached||!Number.isFinite(r.modelledFI.age)||r.modelledFI.age<g.minAge||r.modelledFI.age>g.maxAge)return;
    const x=g.x(r.modelledFI.age),value=which==='path'?(r.modelledFI.target+r.modelledFI.portfolio)/2:r.modelledFI.portfolio,y=g.yy(value),closeToTarget=Math.abs(r.modelledFI.age-r.state.targetAge)<1;
    const label=modelledAgeText(r,true),boxW=128,boxX=Math.max(g.l,Math.min(g.W-g.r-boxW,x-boxW/2)),boxY=g.t+(closeToTarget?52:30);
    svg.innerHTML+=`<g class="fi-crossing-marker"><line x1="${x}" x2="${x}" y1="${g.t}" y2="${g.H-g.b}" stroke="#b46b00" stroke-width="1.5" stroke-dasharray="3 4"/><circle cx="${x}" cy="${y}" r="5" fill="#b46b00" stroke="#fff" stroke-width="2"/><rect x="${boxX}" y="${boxY}" width="${boxW}" height="34" rx="8" fill="#fff7e8" stroke="#d99a35"/><text x="${boxX+boxW/2}" y="${boxY+13}" text-anchor="middle" font-size="8.8" font-weight="900" fill="#704c00">FI reached</text><text x="${boxX+boxW/2}" y="${boxY+26}" text-anchor="middle" font-size="8.2" font-weight="750" fill="#704c00">${esc(label)}</text></g>`;
  }
  function renderCharts(r,rawState){
    const st=r.state,endAge=chartEndAge(r),points=C.series(rawState,endAge),checkpoints=[st.currentAge,st.targetAge,Math.min(90,st.targetAge+5)];
    const pathSeries=[
      {label:'FI target',shortLabel:'FI Target',color:'#173d5c',points:points.map(p=>({age:p.age,v:p.target}))},
      {label:'Projected portfolio value',shortLabel:'Projected Portfolio Value',currentShortLabel:'Current Portfolio Value',color:'#0e8b80',points:points.map(p=>({age:p.age,v:p.portfolio}))}
    ];
    const max=niceMax(Math.max(...points.flatMap(p=>[p.target,p.portfolio]))*1.08),g=chartBase(els.pathChart,max,st.currentAge,endAge);
    els.pathChart.innerHTML+=`<path class="target-line" d="${path(points,g,'target')}"/><path class="plan-line" d="${path(points,g,'portfolio')}"/>`;
    addTargetAgeMarker(els.pathChart,g,st);addFICrossingMarker(els.pathChart,g,r,'path');addStaticChartValues(els.pathChart,g,checkpoints,pathSeries,st);bindChart(els.pathChart,pathSeries,g);

    const added=points.map(p=>({age:p.age,added:st.currentAssets+p.contributions,portfolio:p.portfolio}));
    const growthSeries=[
      {label:'Total money added',shortLabel:'Money Added',color:'#8799aa',points:added.map(p=>({age:p.age,v:p.added}))},
      {label:'Projected portfolio value',shortLabel:'Projected Portfolio Value',currentShortLabel:'Current Portfolio Value',color:'#0e8b80',points:added.map(p=>({age:p.age,v:p.portfolio}))}
    ];
    const max2=niceMax(Math.max(...added.flatMap(p=>[p.added,p.portfolio]))*1.08),g2=chartBase(els.growthChart,max2,st.currentAge,endAge);
    els.growthChart.innerHTML+=`<path class="added-line" d="${path(added,g2,'added')}"/><path class="plan-line" d="${path(added,g2,'portfolio')}"/>`;
    addTargetAgeMarker(els.growthChart,g2,st);addFICrossingMarker(els.growthChart,g2,r,'growth');addStaticChartValues(els.growthChart,g2,checkpoints,growthSeries,st);bindChart(els.growthChart,growthSeries,g2);
  }

  function renderJourney(r,rawState){
    if(!els.journeyBody)return;const s=r.state,j=C.annualJourney(rawState,chartEndAge(r)),targetMoneyAdded=s.currentAssets+r.target.contributions;
    els.journeyMoneyAdded.textContent=compact(targetMoneyAdded);els.journeyGrowth.textContent=compact(r.target.growth);els.journeyPortfolio.textContent=compact(r.target.portfolio);els.journeyFunding.textContent=pct(Math.min(9.99,r.target.funding));
    const milestoneBits=[`<span><strong>Target Age ${Math.round(s.targetAge)}</strong> · FI target ${esc(compact(r.target.target))} · Projected Portfolio Value ${esc(compact(r.target.portfolio))}</span>`];
    if(r.target.target<=0)milestoneBits.push('<span><strong>No portfolio target</strong> under the current spending and income assumptions.</span>');
    else if(r.modelledFI.reached)milestoneBits.push(`<span><strong>FI reached</strong> · ${esc(modelledAgeText(r))}</span>`);
    else milestoneBits.push('<span><strong>FI target not reached within the modelled period.</strong></span>');
    els.journeyMilestones.innerHTML=milestoneBits.join('');
    els.journeyCount.textContent=`${j.rows.length} annual rows`;
    els.journeyBody.innerHTML=j.rows.map(row=>{const tags=[];if(row.isTargetAge)tags.push('<span class="journey-badge target">Target Age</span>');if(row.reachedDuringYear&&r.target.target>0)tags.push(`<span class="journey-badge reached">FI reached ${esc(modelledAgeText(r,true))}</span>`);const cls=[row.isTargetAge?'target-row':'',row.reachedDuringYear&&r.target.target>0?'reached-row':''].filter(Boolean).join(' ');return `<tr class="${cls}"><td><strong>Age ${Math.round(row.age)}</strong><small>Year ${row.year}</small>${tags.join('')}</td><td data-value="${row.investmentThatYear}">${esc(compact(row.investmentThatYear))}</td><td data-value="${row.totalMoneyAdded}">${esc(compact(row.totalMoneyAdded))}</td><td data-value="${row.growth}">${esc(compact(row.growth))}</td><td data-value="${row.portfolio}">${esc(compact(row.portfolio))}</td><td data-value="${row.target}">${esc(compact(row.target))}</td><td data-value="${row.funding}">${esc(pct(Math.min(9.99,row.funding)))}</td></tr>`;}).join('');
    els.journeyNote.textContent=`Annual snapshots summarize the underlying ${frequencyLabel(s.investmentFrequency)} investment model. “Investment that year” is the total contributed during that year; total money added includes current invested assets plus cumulative contributions. Modelled investment growth is the projected portfolio value above total money added.`;
  }

  async function copySummary(){
    const r=C.result(state()),s=r.state,targetPlus5Age=Math.min(90,s.targetAge+5),plus5=C.targetProjection(s,targetPlus5Age),timing=modelledAgeText(r);
    const txt=[`CARROWMONT FINANCIAL INDEPENDENCE SUMMARY`,``,`Country / region: ${L.getProfile().label}`,`Currency: ${L.getCurrency()}`,`Current age: ${s.currentAge}`,`Target Age: ${s.targetAge}`,`Monthly spending today: ${money(s.monthlySpending)}`,`Expected spending at FI: ${(s.spendingPct*100).toFixed(0)}% of today`,`Monthly non-portfolio income at FI: ${money(s.monthlyIncome)}`,`Planning withdrawal rate: ${(s.withdrawalRate*100).toFixed(1)}%`,`Inflation assumption: ${(s.inflation*100).toFixed(1)}%`,`Expected investment return: ${(s.annualReturn*100).toFixed(1)}%`,`Annual investment increase: ${(s.annualStepUp*100).toFixed(1)}%`,`Income / pay frequency: ${frequencyLabel(s.payFrequency)}`,`Investment frequency: ${frequencyLabel(s.investmentFrequency)}`,`${currentInvestmentLabelText(s.investmentFrequency)}: ${contributionText(s.monthlyContribution,s.investmentFrequency)}`,``,`Estimated FI number today: ${money(r.fiToday)}`,`FI target at Target Age ${s.targetAge}: ${money(r.target.target)}`,`Projected Portfolio Value at Target Age ${s.targetAge}: ${money(r.target.portfolio)}`,`Funding at Target Age: ${pct(Math.min(9.99,r.target.funding))}`,`Target Age +5 (${targetPlus5Age}) FI target: ${money(plus5.target)}`,`Target Age +5 (${targetPlus5Age}) Projected Portfolio Value: ${money(plus5.portfolio)}`,`${requiredInvestmentLabelText(s.investmentFrequency,'Starting')}: ${contributionText(r.requiredContribution,s.investmentFrequency)}`,`${requiredInvestmentLabelText(s.investmentFrequency,'Additional')}: ${contributionText(r.additionalContribution,s.investmentFrequency)}`,`Modelled FI timing under current plan: ${timing}`,``,`Illustrative estimate only. The withdrawal rate is a planning assumption, not a guarantee or recommendation.`,`carrowmont.com`].join('\n');
    try{await navigator.clipboard.writeText(txt);els.copyBtn.textContent='Copied';setTimeout(()=>els.copyBtn.textContent='Copy Summary',1400);}catch(_){const ta=document.createElement('textarea');ta.value=txt;document.body.appendChild(ta);ta.select();document.execCommand('copy');ta.remove();}
  }

  async function generateFIReport(){
    const status=document.getElementById('reportDownloadStatus');
    if(!window.CarrowmontPdfExport||!window.CarrowmontFIPdfRenderer){
      if(status)status.textContent='The report could not be generated. Please refresh the page and try again.';
      return;
    }
    const r=C.result(state());
    els.reportBtn.disabled=true;els.reportBtn.setAttribute('aria-busy','true');
    if(status)status.textContent='Preparing your report...';
    try{
      const canvases=await window.CarrowmontFIPdfRenderer.render(r);
      const d=new Date(),yyyy=d.getFullYear(),mm=String(d.getMonth()+1).padStart(2,'0'),dd=String(d.getDate()).padStart(2,'0');
      await window.CarrowmontPdfExport.downloadCanvases(canvases,{filename:`financial-independence-report-${yyyy}-${mm}-${dd}.pdf`,quality:.95});
      if(status)status.textContent='Report has been downloaded.';
    }catch(err){
      console.error('Financial Independence report PDF generation failed',err);
      if(status)status.textContent='The report could not be generated. Please refresh the page and try again.';
    }finally{
      els.reportBtn.disabled=false;els.reportBtn.removeAttribute('aria-busy');
    }
  }

  els.payFrequency?.addEventListener('change',()=>{payFrequencyUserOverride=true;if(els.sameAsPayCycle?.checked)els.investmentFrequency.value=els.payFrequency.value;updateFrequencyCopy();render();});
  els.investmentFrequency?.addEventListener('change',()=>{investmentFrequencyUserOverride=true;updateFrequencyCopy();render();});
  els.sameAsPayCycle?.addEventListener('change',()=>{if(els.sameAsPayCycle.checked){investmentFrequencyUserOverride=false;els.investmentFrequency.value=els.payFrequency.value;}else{investmentFrequencyUserOverride=true;}els.investmentFrequency.disabled=els.sameAsPayCycle.checked;updateFrequencyCopy();render();});

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

  populateLocale();syncFrequencyOptions();
  if(usesIndiaDemoDefaults()) render(); else resetMoneyForLocale();
})();
