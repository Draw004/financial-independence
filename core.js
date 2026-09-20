(function(root,factory){
  const api=factory();
  if(typeof module==='object'&&module.exports) module.exports=api;
  else root.CarrowmontFICore=api;
})(typeof self!=='undefined'?self:this,function(){
  'use strict';

  const clamp=(v,a,b)=>Math.min(b,Math.max(a,Number.isFinite(Number(v))?Number(v):a));
  const monthlyRate=annual=>annual===0?0:Math.pow(1+annual,1/12)-1;

  function normalize(raw={}){
    const currentAge=clamp(raw.currentAge,18,80);
    const targetAge=clamp(raw.targetAge,currentAge+1,90);
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

  function contributionForMonth(base,step,monthIndex){
    const yearIndex=Math.floor(Math.max(0,monthIndex-1)/12);
    return base*Math.pow(1+step,yearIndex);
  }

  function portfolioAtMonths(s,months,baseContribution=s.monthlyContribution){
    let p=s.currentAssets;
    let contributions=0;
    const rm=monthlyRate(s.annualReturn);
    const n=Math.max(0,Math.round(months));
    for(let m=1;m<=n;m++){
      p*=1+rm;
      const c=contributionForMonth(baseContribution,s.annualStepUp,m);
      p+=c;
      contributions+=c;
    }
    return {portfolio:p,contributions,growth:p-s.currentAssets-contributions};
  }

  function modelledFI(s,maxAge=90){
    const target0=fiTargetToday(s);
    if(s.currentAssets>=target0) return {reached:true,months:0,age:s.currentAge,portfolio:s.currentAssets,target:target0};
    let p=s.currentAssets;
    const rm=monthlyRate(s.annualReturn);
    const maxMonths=Math.max(0,Math.floor((maxAge-s.currentAge)*12));
    for(let m=1;m<=maxMonths;m++){
      p*=1+rm;
      p+=contributionForMonth(s.monthlyContribution,s.annualStepUp,m);
      const target=fiTargetAtYears(s,m/12);
      if(p>=target) return {reached:true,months:m,age:s.currentAge+m/12,portfolio:p,target};
    }
    return {reached:false,months:null,age:null,portfolio:p,target:fiTargetAtYears(s,maxMonths/12)};
  }

  function targetProjection(s,targetAge=s.targetAge,baseContribution=s.monthlyContribution){
    const years=Math.max(0,targetAge-s.currentAge);
    const months=Math.round(years*12);
    const target=fiTargetAtYears(s,years);
    const p=portfolioAtMonths(s,months,baseContribution);
    return {
      years,months,target,portfolio:p.portfolio,contributions:p.contributions,growth:p.growth,
      gap:Math.max(0,target-p.portfolio),surplus:Math.max(0,p.portfolio-target),
      funding:target>0?p.portfolio/target:1
    };
  }

  function requiredMonthly(s,targetAge=s.targetAge){
    const years=Math.max(0,targetAge-s.currentAge);
    const months=Math.max(1,Math.round(years*12));
    const target=fiTargetAtYears(s,years);
    if(target<=0) return 0;
    if(portfolioAtMonths(s,months,0).portfolio>=target) return 0;
    let lo=0,hi=Math.max(1,target/months);
    let guard=0;
    while(portfolioAtMonths(s,months,hi).portfolio<target&&guard<80){hi*=2;guard++;}
    for(let i=0;i<90;i++){
      const mid=(lo+hi)/2;
      if(portfolioAtMonths(s,months,mid).portfolio>=target) hi=mid; else lo=mid;
    }
    return hi;
  }

  function result(raw){
    const s=normalize(raw);
    const today=fiTargetToday(s);
    const target=targetProjection(s);
    const required=requiredMonthly(s);
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
      requiredMonthly:required,
      additionalMonthly:Math.max(0,required-s.monthlyContribution),
      modelledFI:fi,
      realReturn
    };
  }

  function series(raw,endAge){
    const s=normalize(raw);
    const maxAge=Math.min(90,Math.max(s.currentAge+1,endAge||s.targetAge));
    const out=[];
    for(let age=s.currentAge;age<=Math.floor(maxAge);age++){
      const months=Math.round((age-s.currentAge)*12);
      const p=portfolioAtMonths(s,months);
      out.push({age,years:age-s.currentAge,target:fiTargetAtYears(s,age-s.currentAge),portfolio:p.portfolio,contributions:p.contributions,growth:p.growth});
    }
    if(Math.abs(out[out.length-1].age-maxAge)>.001){
      const months=Math.round((maxAge-s.currentAge)*12),p=portfolioAtMonths(s,months);
      out.push({age:maxAge,years:maxAge-s.currentAge,target:fiTargetAtYears(s,maxAge-s.currentAge),portfolio:p.portfolio,contributions:p.contributions,growth:p.growth});
    }
    return out;
  }

  return {normalize,monthlyRate,fiTargetToday,fiTargetAtYears,contributionForMonth,portfolioAtMonths,modelledFI,targetProjection,requiredMonthly,result,series};
});
