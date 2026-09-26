(() => {
  'use strict';
  const P=()=>window.CarrowmontPdfExport, L=()=>window.CarrowmontLocale, Core=()=>window.CarrowmontFICore, S=()=>window.CarrowmontReportStandard;
  const C={ink:'#102945',navy:'#102945',teal:'#0e8b80',tealDark:'#08756d',muted:'#405b75',line:'#c9d9e2',pale:'#e8f6f3',note:'#f3f8fa',amber:'#fff4d9',amberLine:'#edc86b',white:'#fff',light:'#f8fbfc'};
  const W=794,H=1123,M=42,CW=W-M*2;
  const money=v=>L().formatMoney(v,{maximumFractionDigits:0}), compact=v=>L().formatCompactMoney(v,{maximumFractionDigits:2}), pct=v=>`${Math.round(v*100)}%`;
  const frequencyBaseLabels={weekly:'Weekly',semimonthly:'Twice Monthly',fourweekly:'Every 4 Weeks',monthly:'Monthly'};
  function frequencyLabel(key){if(key==='biweekly'){const style=L().getProfile().twoWeekLabel||'neutral';if(style==='fortnightly')return 'Fortnightly (Every 2 Weeks)';if(style==='biweekly')return 'Biweekly (Every 2 Weeks)';return 'Every 2 Weeks';}return frequencyBaseLabels[key]||'Monthly';}
  function frequencyName(key){return frequencyLabel(key).replace(/\s*\(Every 2 Weeks\)\s*/,'').trim();}
  function cadenceText(key){if(key==='weekly')return 'per week';if(key==='biweekly')return 'every 2 weeks';if(key==='semimonthly')return 'twice monthly';if(key==='fourweekly')return 'every 4 weeks';return 'per month';}
  function currentInvestmentLabel(key){if(key==='biweekly'&&frequencyName(key)==='Every 2 Weeks')return 'Current investment every 2 weeks';if(key==='fourweekly')return 'Current investment every 4 weeks';return `Current ${frequencyName(key).toLowerCase()} investment`;}
  function requiredInvestmentLabel(key,prefix='Total'){if(key==='biweekly'&&frequencyName(key)==='Every 2 Weeks')return `${prefix} investment required every 2 weeks`;if(key==='fourweekly')return `${prefix} investment required every 4 weeks`;return `${prefix} ${frequencyName(key).toLowerCase()} investment required`;}
  function contributionText(amount,key){return `${money(amount)} ${cadenceText(key)}`;}
  function page(){return P().createPage({width:W,height:H,scale:2.6,background:'#fff'});} function card(ctx,x,y,w,h,fill=C.white,stroke=C.line,r=10){P().roundRect(ctx,x,y,w,h,r,fill,stroke,1);} function hline(ctx,x1,x2,y,color=C.line,width=1){P().line(ctx,x1,y,x2,y,color,width);}
  function header(ctx){
    const d=new Intl.DateTimeFormat('en-GB',{day:'2-digit',month:'short',year:'numeric'}).format(new Date());
    P().text(ctx,'CARROWMONT',M,48,{size:14,weight:900,color:C.teal});
    P().text(ctx,'Financial Independence Planning Report',M,82,{size:25,weight:900,color:C.ink});
    P().text(ctx,'Prepared from the Carrowmont Financial Independence Planner',M,104,{size:10.2,weight:600,color:C.muted});
    P().text(ctx,`Generated ${d}`,W-M,48,{size:10,weight:800,color:C.ink,align:'right'});
    P().text(ctx,'Educational planning report',W-M,68,{size:9.5,weight:400,color:C.muted,align:'right'});
    P().text(ctx,'carrowmont.com',W-M,88,{size:9.5,weight:400,color:C.muted,align:'right'});
    hline(ctx,M,W-M,125,C.navy,2);
  }
  function band(ctx,label,y){card(ctx,M,y,CW,31,C.navy,null,8);P().text(ctx,label,M+12,y+21,{size:14,weight:850,color:'#fff'});}
  function statGrid(ctx,items,y,cols=3){const gap=9,w=(CW-gap*(cols-1))/cols,h=72;items.forEach((it,i)=>{const row=Math.floor(i/cols),c=i%cols,x=M+c*(w+gap),yy=y+row*(h+9);card(ctx,x,yy,w,h,C.white,C.line,9);P().wrappedText(ctx,it.label,x+10,yy+19,w-20,{size:9.1,lineHeight:11.5,weight:600,color:C.muted,maxLines:2});P().text(ctx,it.value,x+10,yy+55,{size:14.2,weight:850,color:C.ink});});return y+Math.ceil(items.length/cols)*(h+9)-9;}
  function assumptions(ctx,r,y){band(ctx,'Plan assumptions',y);const s=r.state,rows=[['Country / region',L().getProfile().label],['Currency',L().getCurrency()],['Current age',String(Math.round(s.currentAge))],['Target FI age',String(Math.round(s.targetAge))],['Monthly spending today',money(s.monthlySpending)],['Spending expected at FI',`${(s.spendingPct*100).toFixed(0)}% of today`],['Monthly non-portfolio income at FI',money(s.monthlyIncome)],['Planning withdrawal rate',`${(s.withdrawalRate*100).toFixed(1)}%`],['Inflation assumption',`${(s.inflation*100).toFixed(1)}% p.a.`],['Income / pay frequency',frequencyLabel(s.payFrequency)],['Investment frequency',frequencyLabel(s.investmentFrequency)],['Current invested assets',money(s.currentAssets)],[currentInvestmentLabel(s.investmentFrequency),contributionText(s.monthlyContribution,s.investmentFrequency)],['Expected annual investment return',`${(s.annualReturn*100).toFixed(1)}% p.a.`],['Annual increase in investment amount',`${(s.annualStepUp*100).toFixed(1)}% p.a.`]];let yy=y+43;rows.forEach(([a,b])=>{P().text(ctx,a,M+7,yy+18,{size:9.1,weight:600,color:C.muted});P().text(ctx,b,W-M-7,yy+18,{size:9.3,weight:850,color:C.ink,align:'right'});hline(ctx,M,M+CW,yy+27);yy+=28;});return yy;}
  function scenarioTable(ctx,r,y){
    band(ctx,'Target-age comparison',y); y+=43;
    const s=r.state,ages=[Math.max(s.currentAge+1,s.targetAge-5),s.targetAge,Math.min(90,s.targetAge+5)].filter((v,i,a)=>a.indexOf(v)===i);
    const cols=[76,190,190,132,122],heads=['AGE','FI TARGET','PROJECTED PORTFOLIO','INVESTMENT REQUIRED','CURRENT-PLAN FUNDING'];
    let x=M;ctx.fillStyle='#eaf2f6';ctx.fillRect(M,y,CW,48);heads.forEach((h,i)=>{const align=i===0?'left':'right',tx=align==='left'?x+8:x+cols[i]-8;P().wrappedText(ctx,h,tx,y+18,cols[i]-16,{size:8.1,lineHeight:10,weight:850,color:'#173d5c',align,maxLines:2});x+=cols[i];});y+=48;
    ages.forEach(age=>{const tp=Core().targetProjection(s,age),req=Core().requiredContribution(s,age),selected=Math.abs(age-s.targetAge)<0.01;if(selected){ctx.fillStyle='#e9f6f3';ctx.fillRect(M,y,CW,42);}const vals=[`Age ${Math.round(age)}${selected?' (selected)':''}`,compact(tp.target),compact(tp.portfolio),money(req),`${Math.min(999,Math.round(tp.funding*100))}%`];x=M;vals.forEach((v,i)=>{const align=i===0?'left':'right',tx=align==='left'?x+8:x+cols[i]-8;P().text(ctx,v,tx,y+26,{size:9.1,weight:selected?850:650,color:i===4?C.tealDark:C.ink,align});x+=cols[i];});hline(ctx,M,M+CW,y+42);y+=42;});
    P().wrappedText(ctx,`Investment required is shown ${cadenceText(s.investmentFrequency)} using the selected ${frequencyLabel(s.investmentFrequency)} investment frequency. Projected funding uses the current savings and investment plan before any increase.`,M,y+25,CW,{size:9,lineHeight:12.5,weight:500,color:C.muted,maxLines:3});return y+50;
  }
  function niceMax(v){if(v<=0)return 1;const p=Math.pow(10,Math.floor(Math.log10(v))),n=v/p,m=n<=1?1:n<=2?2:n<=2.5?2.5:n<=5?5:10;return m*p;}
  function rawStateFromNormalized(s){return {...s,spendingPct:s.spendingPct*100,withdrawalRate:s.withdrawalRate*100,inflation:s.inflation*100,annualReturn:s.annualReturn*100,annualStepUp:s.annualStepUp*100};}
  function chartPoint(age,value,minAge,maxAge,maxValue,imgX,imgY,imgW,imgH){const sx=82+((age-minAge)/Math.max(1e-9,maxAge-minAge))*(800-82-20),sy=72+(330-72-42)-(value/Math.max(1,maxValue))*(330-72-42);return{x:imgX+(sx/800)*imgW,y:imgY+(sy/330)*imgH};}
  function chartValueLabel(ctx,p,label,color,offsetY){const w=132,h=28,x=Math.max(M+6,Math.min(W-M-w-6,p.x-w/2)),y=Math.max(294,Math.min(825,p.y+offsetY));card(ctx,x,y,w,h,C.white,color,7);ctx.beginPath();ctx.arc(p.x,p.y,3.2,0,Math.PI*2);ctx.fillStyle=color;ctx.fill();P().text(ctx,label,x+w/2,y+18,{size:8.4,weight:850,color:C.ink,align:'center'});}
  function drawSelectedAgeValues(ctx,r,which,imgX,imgY,imgW,imgH){const s=r.state;let endAge=Math.max(s.targetAge+5,s.currentAge+20);if(r.modelledFI.reached)endAge=Math.max(endAge,Math.ceil(r.modelledFI.age+2));endAge=Math.min(90,endAge);const points=Core().series(rawStateFromNormalized(s),endAge);if(which==='path'){const max=niceMax(Math.max(...points.flatMap(p=>[p.target,p.portfolio]))*1.08),tp=r.target;const a=chartPoint(s.targetAge,tp.target,s.currentAge,endAge,max,imgX,imgY,imgW,imgH),b=chartPoint(s.targetAge,tp.portfolio,s.currentAge,endAge,max,imgX,imgY,imgW,imgH);chartValueLabel(ctx,a,`Target ${compact(tp.target)}`,'#173d5c',-38);chartValueLabel(ctx,b,`Portfolio ${compact(tp.portfolio)}`,'#0e8b80',12);}else{const added=points.map(p=>({age:p.age,added:s.currentAssets+p.contributions,portfolio:p.portfolio})),max=niceMax(Math.max(...added.flatMap(p=>[p.added,p.portfolio]))*1.08),moneyAdded=s.currentAssets+r.target.contributions;const a=chartPoint(s.targetAge,moneyAdded,s.currentAge,endAge,max,imgX,imgY,imgW,imgH),b=chartPoint(s.targetAge,r.target.portfolio,s.currentAge,endAge,max,imgX,imgY,imgW,imgH);chartValueLabel(ctx,b,`Portfolio ${compact(r.target.portfolio)}`,'#0e8b80',-38);chartValueLabel(ctx,a,`Money added ${compact(moneyAdded)}`,'#8799aa',12);}}
  async function chartsPage(r){const pg=page(),ctx=pg.ctx;header(ctx);P().text(ctx,'Portfolio and target visuals',M,164,{size:19,weight:900,color:C.ink});P().wrappedText(ctx,'The charts compare the inflation-adjusted FI target with your current portfolio path, and show how much of the projected value comes from money added versus modelled investment growth.',M,188,CW,{size:9.5,lineHeight:13.5,weight:500,color:C.muted,maxLines:3});
    const c1=document.getElementById('pathChart'),c2=document.getElementById('growthChart');const w=CW,h=300;
    card(ctx,M,235,w,h,C.white,C.line,10);
    P().text(ctx,'FI target vs projected portfolio',M+12,258,{size:10,weight:850,color:C.ink});
    P().line(ctx,M+12,277,M+34,277,'#173d5c',3);P().text(ctx,'FI target',M+40,281,{size:8.8,weight:700,color:C.muted});
    P().line(ctx,M+126,277,M+148,277,'#0e8b80',3);P().text(ctx,'Projected portfolio',M+154,281,{size:8.8,weight:700,color:C.muted});
    await P().drawSvgElement(ctx,c1,M+8,286,w-16,h-59);drawSelectedAgeValues(ctx,r,'path',M+8,286,w-16,h-59);
    card(ctx,M,557,w,h,C.white,C.line,10);
    P().text(ctx,'Money added vs projected portfolio value',M+12,580,{size:10,weight:850,color:C.ink});
    P().line(ctx,M+12,599,M+34,599,'#8799aa',3);P().text(ctx,'Assets + contributions',M+40,603,{size:8.8,weight:700,color:C.muted});
    P().line(ctx,M+164,599,M+186,599,'#0e8b80',3);P().text(ctx,'Projected portfolio',M+192,603,{size:8.8,weight:700,color:C.muted});
    await P().drawSvgElement(ctx,c2,M+8,608,w-16,h-59);drawSelectedAgeValues(ctx,r,'growth',M+8,608,w-16,h-59);
    P().wrappedText(ctx,`Printed value labels mark the selected age ${Math.round(r.state.targetAge)} so the chart can be read directly in the PDF without hover interactions.`,M,884,CW,{size:9.1,lineHeight:12.5,weight:500,color:C.muted,maxLines:2});
    return pg.canvas;}
  function reportGuidePage(r){
    return S().guidePage({
      reportTitle:'Financial Independence Planning Report',
      preparedFrom:'Carrowmont Financial Independence Planner',
      howToRead:`Start with the FI number in today's money and the selected-age target. Then compare the projected portfolio, funding percentage, modelled FI timing and the recurring investment required at the selected ${frequencyLabel(r.state.investmentFrequency)} frequency.`,
      methodology:[
        ['FI number today',"Annual portfolio-funded spending is divided by the planning withdrawal rate to produce a spending-based portfolio target in today's money."],
        ['Future FI target',"The FI number today is grown to the selected age using the entered inflation assumption."],
        ['Portfolio projection',`Existing invested assets grow using the entered investment-return assumption. Contributions are added at the selected ${frequencyLabel(r.state.investmentFrequency)} investment frequency and can increase once each year.`],
        ['Required recurring investment',`The starting contribution at the selected ${frequencyLabel(r.state.investmentFrequency)} investment frequency that models to the selected-age FI target while applying the entered annual contribution increase.`],
        ['Modelled FI timing','The first modelled point in which the projected portfolio reaches the inflation-adjusted FI target, checked up to age 90.']
      ],
      terminology:[
        ['Planning withdrawal rate','A planning assumption used to translate annual portfolio-funded spending into an FI target. It is not a guaranteed or recommended withdrawal rate.'],
        ['Portfolio-funded spending','The part of expected spending not covered by the recurring non-portfolio income entered.'],
        ['Projected funding','Projected portfolio divided by the FI target at the selected age.'],
        ['FI target','The spending-based portfolio target after applying the inflation assumption to the selected age.'],
        ['Money added','Current invested assets plus modelled future contributions, before modelled investment growth.']
      ],
      assumptions:'Investment return, inflation and the planning withdrawal rate are constant modelling assumptions. The model does not include taxes, fees, sequence-of-returns risk or changing market returns.',
      disclaimer:'The withdrawal rate is a planning assumption, not a guarantee or recommendation. This report does not determine investment suitability and is an educational illustration, not individualized investment, financial, tax, legal, accounting or insurance advice. Actual outcomes can differ materially.',
      methodologyMeta:'Current Financial Independence methodology - reviewed September 2026',
      methodologyUrl:'carrowmont.com/methodology.html',
      contact:'contact@carrowmont.com'
    });
  }
  function toolsPage(){return S().continuePlanningPage({currentTool:'fi',intro:`Financial independence is one part of a broader financial plan. Try these Carrowmont tools to explore ${S().investmentIdentity().planningPhrase}, retirement, life goals and the effect of inflation.`});}
  async function render(r){
    const p1=page(),ctx=p1.ctx;header(ctx);const s=r.state;
    P().text(ctx,'YOUR ESTIMATE',M,160,{size:9,weight:900,color:C.teal});P().text(ctx,'Financial independence snapshot',M,190,{size:22,weight:900,color:C.ink});
    card(ctx,M,216,(CW-12)/2,118,C.navy,null,16);P().text(ctx,'Estimated FI number in today\'s money',M+18,244,{size:10.5,weight:500,color:'#d7e2eb'});P().text(ctx,compact(r.fiToday),M+18,296,{size:35,weight:900,color:'#fff'});P().text(ctx,`Based on ${money(r.portfolioMonthlyNeed)}/month of portfolio-funded spending`,M+18,319,{size:9,weight:400,color:'#d7e2eb'});
    const rx=M+(CW-12)/2+12;card(ctx,rx,216,(CW-12)/2,118,C.white,'#bcded9',16);P().text(ctx,`Projected portfolio at age ${Math.round(s.targetAge)}`,rx+18,244,{size:10.5,weight:500,color:C.muted});P().text(ctx,compact(r.target.portfolio),rx+18,296,{size:35,weight:900,color:C.ink});P().text(ctx,`${pct(Math.min(1,r.target.funding))} of selected-age target funded`,rx+18,319,{size:9,weight:500,color:C.tealDark});
    const fiTiming=r.target.target<=0?'No portfolio target':(r.modelledFI.reached?`Age ${r.modelledFI.age.toFixed(r.modelledFI.months%12===0?0:1)}`:'Not reached by age 90');
    let end=statGrid(ctx,[{label:'Target FI age',value:`Age ${Math.round(s.targetAge)}`},{label:'FI target at selected age',value:compact(r.target.target)},{label:'Projected current-plan funding',value:pct(Math.min(1,r.target.funding))},{label:'Modelled FI timing',value:fiTiming},{label:requiredInvestmentLabel(s.investmentFrequency,'Total')+' from now',value:money(r.requiredContribution)},{label:requiredInvestmentLabel(s.investmentFrequency,'Additional'),value:money(r.additionalContribution)}],360,3);
    const ry=end+18;card(ctx,M,ry,CW,66,r.additionalContribution>0?C.amber:C.pale,r.additionalContribution>0?C.amberLine:'#b9ddd8',10);P().text(ctx,requiredInvestmentLabel(s.investmentFrequency,'Additional'),M+16,ry+39,{size:10.5,weight:850,color:r.additionalContribution>0?'#704c00':C.tealDark});P().text(ctx,money(r.additionalContribution),W-M-16,ry+41,{size:22,weight:900,color:r.additionalContribution>0?'#704c00':C.tealDark,align:'right'});
    P().wrappedText(ctx,r.additionalContribution>0?`Under the entered assumptions, a starting investment of about ${contributionText(r.requiredContribution,s.investmentFrequency)} may model to the selected FI target at age ${Math.round(s.targetAge)}. The current investment is ${contributionText(s.monthlyContribution,s.investmentFrequency)}.`:`Under the entered assumptions, the current investment of ${contributionText(s.monthlyContribution,s.investmentFrequency)} is at or above the modelled starting amount required for age ${Math.round(s.targetAge)}.`,M,ry+92,CW,{size:9.6,lineHeight:13.5,weight:500,color:C.muted,maxLines:3});
    const p2=page(),c2=p2.ctx;header(c2);let y=assumptions(c2,r,154)+26;y=scenarioTable(c2,r,y);card(c2,M,y+10,CW,108,C.note,C.line,10);P().text(c2,'How to interpret the target',M+14,y+40,{size:14.5,weight:900,color:C.ink});P().wrappedText(c2,`The selected-age target is expressed in future ${L().getCurrency()} after applying the inflation assumption for ${Math.max(0,s.targetAge-s.currentAge).toFixed(0)} years. The FI number in today\'s money is a spending-based planning target derived from the entered withdrawal rate.`,M+14,y+66,CW-28,{size:9.4,lineHeight:13.5,weight:500,color:C.muted,maxLines:3});
    const p3=await chartsPage(r);
    return [p1.canvas,p2.canvas,p3,reportGuidePage(r),toolsPage()];
  }
  window.CarrowmontFIPdfRenderer={render};
})();
