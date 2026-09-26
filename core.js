(function(root,factory){
  const api=factory();
  if(typeof module==='object'&&module.exports) module.exports=api;
  else root.CarrowmontFICore=api;
})(typeof self!=='undefined'?self:this,function(){
  'use strict';

  const frequencyPeriods=Object.freeze({weekly:52,biweekly:26,semimonthly:24,fourweekly:13,monthly:12});
  const clamp=(v,a,b)=>Math.min(b,Math.max(a,Number.isFinite(Number(v))?Number(v):a));
  const periodsPerYear=frequency=>frequencyPeriods[frequency]||12;
  const periodicRate=(annual,frequency='monthly')=>annual===0?0:Math.pow(1+annual,1/periodsPerYear(frequency))-1;
  const monthlyRate=annual=>periodicRate(annual,'monthly');

  function normalize(raw={}){
    const currentAge=clamp(raw.currentAge,18,80);
    const targetAge=clamp(raw.targetAge,currentAge+1,90);
    const investmentFrequency=frequencyPeriods[raw.investmentFrequency]?raw.investmentFrequency:'monthly';
    return {
      currentAge,
      targetAge,
      monthlySpending:Math.max(0,Number(raw.monthlySpending)||0),
      spendingPct:clamp(raw.spendingPct,0,200)/100,
      monthlyIncome:Math.max(0,Number(raw.monthlyIncome)||0),
      withdrawalRate:clamp(raw.withdrawalRate,0.5,15)/100,
      inflation:clamp(raw.inflation,0,25)/100,
      currentAssets:Math.max(0,Number(raw.currentAssets)||0),
      monthlyContribution:Math.max(0,Number(raw.monthlyContribution)||0),
      investmentFrequency,
      payFrequency:frequencyPeriods[raw.payFrequency]?raw.payFrequency:'monthly',
      annualReturn:clamp(raw.annualReturn,0,30)/100,
      annualStepUp:clamp(raw.annualStepUp,0,30)/100
    };
  }

  function fiTargetToday(s){
    const fiMonthlySpend=s.monthlySpending*s.spendingPct;
    const portfolioMonthlyNeed=Math.max(0,fiMonthlySpend-s.monthlyIncome);
    return portfolioMonthlyNeed*12/s.withdrawalRate;
  }

  function fiTargetAtYears(s,years){
    return fiTargetToday(s)*Math.pow(1+s.inflation,Math.max(0,years));
  }

  function contributionForPeriod(base,step,periodIndex,frequency='monthly'){
    const ppy=periodsPerYear(frequency);
    const yearIndex=Math.floor(Math.max(0,periodIndex-1)/ppy);
    return base*Math.pow(1+step,yearIndex);
  }

  function contributionForMonth(base,step,monthIndex){
    return contributionForPeriod(base,step,monthIndex,'monthly');
  }

  function portfolioAtPeriods(s,periods,baseContribution=s.monthlyContribution,frequency=s.investmentFrequency||'monthly'){
    let p=s.currentAssets;
    let contributions=0;
    const rp=periodicRate(s.annualReturn,frequency);
    const n=Math.max(0,Math.round(periods));
    for(let i=1;i<=n;i++){
      p*=1+rp;
      const c=contributionForPeriod(baseContribution,s.annualStepUp,i,frequency);
      p+=c;
      contributions+=c;
    }
    return {portfolio:p,contributions,growth:p-s.currentAssets-contributions};
  }

  // Backward-compatible helper for callers that explicitly ask for a monthly path.
  function portfolioAtMonths(s,months,baseContribution=s.monthlyContribution){
    return portfolioAtPeriods(s,months,baseContribution,'monthly');
  }

  function portfolioAtYears(s,years,baseContribution=s.monthlyContribution,frequency=s.investmentFrequency||'monthly'){
    const ppy=periodsPerYear(frequency);
    return portfolioAtPeriods(s,Math.round(Math.max(0,years)*ppy),baseContribution,frequency);
  }

  function modelledFI(s,maxAge=90){
    const target0=fiTargetToday(s);
    if(s.currentAssets>=target0) return {reached:true,periods:0,months:0,age:s.currentAge,portfolio:s.currentAssets,target:target0};
    let p=s.currentAssets;
    const frequency=s.investmentFrequency||'monthly',ppy=periodsPerYear(frequency),rp=periodicRate(s.annualReturn,frequency);
    const maxPeriods=Math.max(0,Math.floor((maxAge-s.currentAge)*ppy));
    for(let i=1;i<=maxPeriods;i++){
      p*=1+rp;
      p+=contributionForPeriod(s.monthlyContribution,s.annualStepUp,i,frequency);
      const years=i/ppy,target=fiTargetAtYears(s,years);
      if(p>=target) return {reached:true,periods:i,months:Math.round(years*12),age:s.currentAge+years,portfolio:p,target};
    }
    return {reached:false,periods:null,months:null,age:null,portfolio:p,target:fiTargetAtYears(s,maxPeriods/ppy)};
  }

  function targetProjection(s,targetAge=s.targetAge,baseContribution=s.monthlyContribution){
    const years=Math.max(0,targetAge-s.currentAge);
    const frequency=s.investmentFrequency||'monthly',ppy=periodsPerYear(frequency),periods=Math.round(years*ppy);
    const target=fiTargetAtYears(s,years);
    const p=portfolioAtPeriods(s,periods,baseContribution,frequency);
    return {
      years,periods,months:Math.round(years*12),target,portfolio:p.portfolio,contributions:p.contributions,growth:p.growth,
      gap:Math.max(0,target-p.portfolio),surplus:Math.max(0,p.portfolio-target),
      funding:target>0?p.portfolio/target:1
    };
  }

  function requiredContribution(s,targetAge=s.targetAge){
    const years=Math.max(0,targetAge-s.currentAge);
    const frequency=s.investmentFrequency||'monthly',ppy=periodsPerYear(frequency),periods=Math.max(1,Math.round(years*ppy));
    const target=fiTargetAtYears(s,years);
    if(target<=0) return 0;
    if(portfolioAtPeriods(s,periods,0,frequency).portfolio>=target) return 0;
    let lo=0,hi=Math.max(1,target/periods);
    let guard=0;
    while(portfolioAtPeriods(s,periods,hi,frequency).portfolio<target&&guard<80){hi*=2;guard++;}
    for(let i=0;i<90;i++){
      const mid=(lo+hi)/2;
      if(portfolioAtPeriods(s,periods,mid,frequency).portfolio>=target) hi=mid; else lo=mid;
    }
    return hi;
  }

  // Kept as an API alias for older report/UI code; the value follows investmentFrequency.
  function requiredMonthly(s,targetAge=s.targetAge){return requiredContribution(s,targetAge);}

  function result(raw){
    const s=normalize(raw);
    const today=fiTargetToday(s);
    const target=targetProjection(s);
    const required=requiredContribution(s);
    const additional=Math.max(0,required-s.monthlyContribution);
    const fi=modelledFI(s);
    const fiMonthlySpend=s.monthlySpending*s.spendingPct;
    const portfolioMonthlyNeed=Math.max(0,fiMonthlySpend-s.monthlyIncome);
    const realReturn=(1+s.annualReturn)/(1+s.inflation)-1;
    return {
      state:s,
      fiMonthlySpend,
      portfolioMonthlyNeed,
      fiToday:today,
      target,
      requiredContribution:required,
      additionalContribution:additional,
      requiredMonthly:required,
      additionalMonthly:additional,
      modelledFI:fi,
      realReturn
    };
  }

  function series(raw,endAge){
    const s=normalize(raw);
    const maxAge=Math.min(90,Math.max(s.currentAge+1,endAge||s.targetAge));
    const out=[];
    for(let age=s.currentAge;age<=Math.floor(maxAge);age++){
      const years=age-s.currentAge,p=portfolioAtYears(s,years);
      out.push({age,years,target:fiTargetAtYears(s,years),portfolio:p.portfolio,contributions:p.contributions,growth:p.growth});
    }
    if(Math.abs(out[out.length-1].age-maxAge)>.001){
      const years=maxAge-s.currentAge,p=portfolioAtYears(s,years);
      out.push({age:maxAge,years,target:fiTargetAtYears(s,years),portfolio:p.portfolio,contributions:p.contributions,growth:p.growth});
    }
    return out;
  }

  return {frequencyPeriods,periodsPerYear,periodicRate,normalize,monthlyRate,fiTargetToday,fiTargetAtYears,contributionForPeriod,contributionForMonth,portfolioAtPeriods,portfolioAtMonths,portfolioAtYears,modelledFI,targetProjection,requiredContribution,requiredMonthly,result,series};
});
