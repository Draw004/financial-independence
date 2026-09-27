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
    const planningMode=raw.planningMode==='until_age'?'until_age':'sustainable';
    const requestedPlanUntil=Number(raw.planUntilAge);
    const planUntilAge=Math.max(targetAge+1,Math.min(120,Number.isFinite(requestedPlanUntil)?requestedPlanUntil:95));
    return {
      currentAge,
      targetAge,
      planningMode,
      planUntilAge,
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

  function portfolioMonthlyNeedToday(s){
    const fiMonthlySpend=s.monthlySpending*s.spendingPct;
    return Math.max(0,fiMonthlySpend-s.monthlyIncome);
  }

  function fiTargetToday(s){
    return portfolioMonthlyNeedToday(s)*12/s.withdrawalRate;
  }

  function fiTargetAtYears(s,years){
    return fiTargetToday(s)*Math.pow(1+s.inflation,Math.max(0,years));
  }

  function futurePortfolioMonthlyNeed(s,years){
    return portfolioMonthlyNeedToday(s)*Math.pow(1+s.inflation,Math.max(0,years));
  }

  // Plan-Until-Age mode uses monthly spending withdrawals at the start of each month.
  // The remaining balance then earns the monthly rate implied by the annual return.
  // Spending rises monthly at the effective rate implied by the annual inflation input.
  function requiredPortfolioForWindow(s,startAge,endAge){
    const start=Math.max(s.currentAge,Number(startAge)||s.currentAge);
    const end=Math.max(start,Number(endAge)||start);
    const months=Math.max(0,Math.round((end-start)*12));
    if(months===0||portfolioMonthlyNeedToday(s)<=0)return 0;
    const rm=monthlyRate(s.annualReturn),im=monthlyRate(s.inflation);
    const firstWithdrawal=futurePortfolioMonthlyNeed(s,start-s.currentAge);
    let needed=0;
    for(let m=months-1;m>=0;m--){
      const withdrawal=firstWithdrawal*Math.pow(1+im,m);
      needed=withdrawal+needed/(1+rm);
    }
    return needed;
  }

  function planUntilTargetAtAge(s,age){
    if(age>=s.planUntilAge)return 0;
    return requiredPortfolioForWindow(s,age,s.planUntilAge);
  }

  function planningTargetAtAge(s,age){
    if(s.planningMode==='until_age')return planUntilTargetAtAge(s,age);
    return fiTargetAtYears(s,Math.max(0,age-s.currentAge));
  }

  function planningTargetToday(s){return planningTargetAtAge(s,s.currentAge);}

  function simulatePostFI(s,startBalance,startAge=s.targetAge,endAge=s.planUntilAge){
    const start=Math.max(s.currentAge,Number(startAge)||s.targetAge);
    const end=Math.max(start,Number(endAge)||s.planUntilAge);
    const months=Math.max(0,Math.round((end-start)*12));
    const rm=monthlyRate(s.annualReturn),im=monthlyRate(s.inflation);
    const firstWithdrawal=futurePortfolioMonthlyNeed(s,start-s.currentAge);
    let balance=Math.max(0,Number(startBalance)||0),totalWithdrawals=0,totalGrowth=0;
    if(firstWithdrawal<=0)return {lasts:true,months,monthsSupported:months,depletionMonths:null,depletionAge:null,finalBalance:balance,totalWithdrawals,totalGrowth,firstWithdrawal};
    for(let m=0;m<months;m++){
      const withdrawal=firstWithdrawal*Math.pow(1+im,m);
      if(balance+1e-9<withdrawal){
        return {lasts:false,months,monthsSupported:m,depletionMonths:m,depletionAge:start+m/12,finalBalance:0,totalWithdrawals,totalGrowth,firstWithdrawal,nextWithdrawal:withdrawal};
      }
      balance-=withdrawal;
      totalWithdrawals+=withdrawal;
      const growth=balance*rm;
      balance+=growth;
      totalGrowth+=growth;
    }
    return {lasts:true,months,monthsSupported:months,depletionMonths:null,depletionAge:null,finalBalance:balance,totalWithdrawals,totalGrowth,firstWithdrawal};
  }


  // Detailed Plan Until Age path used by the year-by-year journey and longevity chart.
  // The selected plan accumulates through Target Age, then stops contributions and
  // funds inflation-adjusted monthly spending from the portfolio through Plan Until Age.
  function planUntilPostFIPath(s,startBalance,startAge=s.targetAge,endAge=s.planUntilAge){
    const start=Math.max(s.currentAge,Number(startAge)||s.targetAge);
    const end=Math.max(start,Number(endAge)||s.planUntilAge);
    const months=Math.max(0,Math.round((end-start)*12));
    const rm=monthlyRate(s.annualReturn),im=monthlyRate(s.inflation);
    const firstWithdrawal=futurePortfolioMonthlyNeed(s,start-s.currentAge);
    let balance=Math.max(0,Number(startBalance)||0),totalWithdrawals=0,totalRequiredWithdrawals=0,totalGrowth=0,depletionAge=null;
    const monthRows=[];
    for(let m=0;m<months;m++){
      const age=start+m/12;
      const withdrawal=firstWithdrawal*Math.pow(1+im,m);
      totalRequiredWithdrawals+=withdrawal;
      const startBalanceMonth=balance;
      let fundedWithdrawal=0,growth=0,depletedThisMonth=false;
      if(depletionAge===null&&withdrawal>0){
        if(balance+1e-9<withdrawal){
          depletionAge=age;
          depletedThisMonth=true;
          balance=0;
        }else{
          fundedWithdrawal=withdrawal;
          balance-=withdrawal;
          totalWithdrawals+=withdrawal;
          growth=balance*rm;
          balance+=growth;
          totalGrowth+=growth;
        }
      }else if(depletionAge===null){
        growth=balance*rm;
        balance+=growth;
        totalGrowth+=growth;
      }
      monthRows.push({month:m+1,age,startBalance:startBalanceMonth,requiredWithdrawal:withdrawal,fundedWithdrawal,growth,endBalance:balance,depletedThisMonth});
    }
    return {
      startAge:start,endAge:end,months,firstWithdrawal,monthRows,
      lasts:depletionAge===null,depletionAge,finalBalance:balance,
      totalWithdrawals,totalRequiredWithdrawals,totalGrowth
    };
  }

  function planUntilJourney(raw){
    const s=normalize(raw),fi=modelledFI(s),target=targetProjection(s),rows=[];
    let priorContributions=0,priorGrowth=0;
    const targetWhole=Math.floor(s.targetAge);
    for(let age=Math.ceil(s.currentAge+1);age<=targetWhole;age++){
      const years=age-s.currentAge,p=portfolioAtYears(s,years);
      const investmentThatYear=Math.max(0,p.contributions-priorContributions);
      const growthThatYear=p.growth-priorGrowth;
      priorContributions=p.contributions;
      priorGrowth=p.growth;
      const required=planningTargetAtAge(s,age),funding=required>0?p.portfolio/required:1;
      const reachedDuringYear=Boolean(fi.reached&&fi.age>age-1&&fi.age<=age+1e-9);
      rows.push({
        phase:Math.abs(age-s.targetAge)<1e-9?'Transition':'Accumulation',
        year:Math.max(1,Math.round(years)),age,years,investmentThatYear,withdrawalThatYear:0,requiredSpendingThatYear:0,growthThatYear,
        totalMoneyAdded:s.currentAssets+p.contributions,contributions:p.contributions,growth:p.growth,portfolio:p.portfolio,endBalance:p.portfolio,target:required,funding,
        isTargetAge:Math.abs(age-s.targetAge)<1e-9,isPlanUntilAge:false,reachedDuringYear,depletedDuringYear:false
      });
    }

    const post=planUntilPostFIPath(s,target.portfolio,s.targetAge,s.planUntilAge);
    const drawdownYears=Math.max(0,Math.ceil(s.planUntilAge-s.targetAge));
    for(let y=0;y<drawdownYears;y++){
      const yearStartAge=s.targetAge+y,yearEndAge=Math.min(s.planUntilAge,yearStartAge+1);
      const startMonth=Math.round((yearStartAge-s.targetAge)*12),endMonth=Math.round((yearEndAge-s.targetAge)*12);
      const months=post.monthRows.slice(startMonth,endMonth);
      const withdrawalThatYear=months.reduce((a,m)=>a+m.fundedWithdrawal,0);
      const requiredSpendingThatYear=months.reduce((a,m)=>a+m.requiredWithdrawal,0);
      const growthThatYear=months.reduce((a,m)=>a+m.growth,0);
      const endBalance=months.length?months[months.length-1].endBalance:(y===0?target.portfolio:0);
      const required=planningTargetAtAge(s,yearEndAge),funding=required>0?endBalance/required:1;
      const depletedDuringYear=post.depletionAge!==null&&post.depletionAge>=yearStartAge-1e-9&&post.depletionAge<yearEndAge-1e-9;
      rows.push({
        phase:'Drawdown',year:Math.max(1,Math.round(yearEndAge-s.currentAge)),age:yearEndAge,years:yearEndAge-s.currentAge,
        investmentThatYear:0,withdrawalThatYear,requiredSpendingThatYear,growthThatYear,
        totalMoneyAdded:s.currentAssets+target.contributions,contributions:target.contributions,growth:target.growth+post.monthRows.slice(0,endMonth).reduce((a,m)=>a+m.growth,0),
        portfolio:endBalance,endBalance,target:required,funding,isTargetAge:false,isPlanUntilAge:Math.abs(yearEndAge-s.planUntilAge)<1e-9,reachedDuringYear:false,depletedDuringYear
      });
    }
    return {rows,endAge:s.planUntilAge,modelledFI:fi,target,postFI:post};
  }

  function planUntilDrawdownSeries(raw){
    const s=normalize(raw),target=targetProjection(s),journey=planUntilJourney(raw),points=[{age:s.targetAge,portfolio:target.portfolio,target:target.target,withdrawals:0,growth:0}];
    let cumulativeWithdrawals=0,cumulativeGrowth=0;
    journey.rows.filter(row=>row.phase==='Drawdown').forEach(row=>{
      cumulativeWithdrawals+=row.withdrawalThatYear;
      cumulativeGrowth+=row.growthThatYear;
      points.push({age:row.age,portfolio:row.portfolio,target:row.target,withdrawals:cumulativeWithdrawals,growth:cumulativeGrowth});
    });
    if(journey.postFI.depletionAge!==null&&!points.some(p=>Math.abs(p.age-journey.postFI.depletionAge)<1e-6)){
      const required=planningTargetAtAge(s,journey.postFI.depletionAge);
      points.push({age:journey.postFI.depletionAge,portfolio:0,target:required,withdrawals:journey.postFI.totalWithdrawals,growth:journey.postFI.totalGrowth,depletion:true});
      points.sort((a,b)=>a.age-b.age);
    }
    return {points,depletionAge:journey.postFI.depletionAge,lasts:journey.postFI.lasts,finalBalance:journey.postFI.finalBalance,totalWithdrawals:journey.postFI.totalWithdrawals,totalRequiredWithdrawals:journey.postFI.totalRequiredWithdrawals,totalGrowth:journey.postFI.totalGrowth};
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

  function portfolioAtMonths(s,months,baseContribution=s.monthlyContribution){
    return portfolioAtPeriods(s,months,baseContribution,'monthly');
  }

  function portfolioAtYears(s,years,baseContribution=s.monthlyContribution,frequency=s.investmentFrequency||'monthly'){
    const ppy=periodsPerYear(frequency);
    return portfolioAtPeriods(s,Math.round(Math.max(0,years)*ppy),baseContribution,frequency);
  }

  function modelledFI(s,maxAge){
    const target0=planningTargetToday(s);
    if(s.currentAssets>=target0)return {reached:true,periods:0,months:0,age:s.currentAge,portfolio:s.currentAssets,target:target0};
    let p=s.currentAssets;
    const frequency=s.investmentFrequency||'monthly',ppy=periodsPerYear(frequency),rp=periodicRate(s.annualReturn,frequency);
    const requestedMax=Number.isFinite(Number(maxAge))?Number(maxAge):(s.planningMode==='until_age'?s.planUntilAge:90);
    const modeMax=s.planningMode==='until_age'?Math.min(requestedMax,s.planUntilAge-1/ppy):requestedMax;
    const maxPeriods=Math.max(0,Math.floor((modeMax-s.currentAge)*ppy));
    for(let i=1;i<=maxPeriods;i++){
      p*=1+rp;
      p+=contributionForPeriod(s.monthlyContribution,s.annualStepUp,i,frequency);
      const years=i/ppy,age=s.currentAge+years,target=planningTargetAtAge(s,age);
      if(p>=target)return {reached:true,periods:i,months:Math.round(years*12),age,portfolio:p,target};
    }
    const endAge=s.currentAge+maxPeriods/ppy;
    return {reached:false,periods:null,months:null,age:null,portfolio:p,target:planningTargetAtAge(s,endAge)};
  }

  function targetProjection(s,targetAge=s.targetAge,baseContribution=s.monthlyContribution){
    const years=Math.max(0,targetAge-s.currentAge);
    const frequency=s.investmentFrequency||'monthly',ppy=periodsPerYear(frequency),periods=Math.round(years*ppy);
    const target=planningTargetAtAge(s,targetAge);
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
    const target=planningTargetAtAge(s,targetAge);
    if(target<=0)return 0;
    if(portfolioAtPeriods(s,periods,0,frequency).portfolio>=target)return 0;
    let lo=0,hi=Math.max(1,target/periods),guard=0;
    while(portfolioAtPeriods(s,periods,hi,frequency).portfolio<target&&guard<80){hi*=2;guard++;}
    for(let i=0;i<90;i++){
      const mid=(lo+hi)/2;
      if(portfolioAtPeriods(s,periods,mid,frequency).portfolio>=target)hi=mid;else lo=mid;
    }
    return hi;
  }

  function requiredMonthly(s,targetAge=s.targetAge){return requiredContribution(s,targetAge);}

  function result(raw){
    const s=normalize(raw);
    const sustainableToday=fiTargetToday(s);
    const today=planningTargetToday(s);
    const target=targetProjection(s);
    const required=requiredContribution(s);
    const additional=Math.max(0,required-s.monthlyContribution);
    const fi=modelledFI(s);
    const fiMonthlySpend=s.monthlySpending*s.spendingPct;
    const portfolioMonthlyNeed=portfolioMonthlyNeedToday(s);
    const realReturn=(1+s.annualReturn)/(1+s.inflation)-1;
    const longevity=s.planningMode==='until_age'?{
      planUntilAge:s.planUntilAge,
      years:Math.max(0,s.planUntilAge-s.targetAge),
      requiredAtTarget:target.target,
      monthlyNeedAtTarget:futurePortfolioMonthlyNeed(s,s.targetAge-s.currentAge),
      projection:simulatePostFI(s,target.portfolio,s.targetAge,s.planUntilAge),
      requiredProjection:simulatePostFI(s,target.target,s.targetAge,s.planUntilAge)
    }:null;
    return {
      state:s,
      fiMonthlySpend,
      portfolioMonthlyNeed,
      fiToday:today,
      sustainableFiToday:sustainableToday,
      target,
      requiredContribution:required,
      additionalContribution:additional,
      requiredMonthly:required,
      additionalMonthly:additional,
      modelledFI:fi,
      realReturn,
      longevity
    };
  }

  function annualJourney(raw,endAge){
    const s=normalize(raw);
    if(s.planningMode==='until_age')return planUntilJourney(raw);
    const fi=modelledFI(s);
    let maxAge=Math.min(90,Math.max(s.targetAge+5,Number.isFinite(endAge)?endAge:s.targetAge+5));
    if(fi.reached&&Number.isFinite(fi.age))maxAge=Math.min(90,Math.max(maxAge,Math.ceil(fi.age)));
    if(!fi.reached)maxAge=90;
    const rows=[];
    let priorContributions=0,priorGrowth=0;
    const finalWholeAge=Math.floor(maxAge);
    for(let age=Math.ceil(s.currentAge+1);age<=finalWholeAge;age++){
      const years=age-s.currentAge,p=portfolioAtYears(s,years);
      const investmentThatYear=Math.max(0,p.contributions-priorContributions),growthThatYear=p.growth-priorGrowth;
      priorContributions=p.contributions;priorGrowth=p.growth;
      const target=planningTargetAtAge(s,age),funding=target>0?p.portfolio/target:1;
      const reachedDuringYear=Boolean(fi.reached&&fi.age>age-1&&fi.age<=age+1e-9);
      rows.push({
        phase:'Accumulation',year:Math.max(1,Math.round(years)),age,years,investmentThatYear,withdrawalThatYear:0,requiredSpendingThatYear:0,growthThatYear,
        totalMoneyAdded:s.currentAssets+p.contributions,contributions:p.contributions,growth:p.growth,portfolio:p.portfolio,endBalance:p.portfolio,target,funding,
        isTargetAge:Math.abs(age-s.targetAge)<1e-9,isPlanUntilAge:false,reachedDuringYear,depletedDuringYear:false
      });
    }
    return {rows,endAge:maxAge,modelledFI:fi};
  }

  function series(raw,endAge){
    const s=normalize(raw),requested=Math.max(s.currentAge+1,endAge||s.targetAge),frequency=s.investmentFrequency||'monthly',ppy=periodsPerYear(frequency);
    const maxAge=s.planningMode==='until_age'?Math.min(s.planUntilAge-1/ppy,requested):Math.min(90,requested),out=[];
    for(let age=s.currentAge;age<=Math.floor(maxAge);age++){
      const years=age-s.currentAge,p=portfolioAtYears(s,years);
      out.push({age,years,target:planningTargetAtAge(s,age),portfolio:p.portfolio,contributions:p.contributions,growth:p.growth});
    }
    if(out.length===0||Math.abs(out[out.length-1].age-maxAge)>.001){
      const years=maxAge-s.currentAge,p=portfolioAtYears(s,years);
      out.push({age:maxAge,years,target:planningTargetAtAge(s,maxAge),portfolio:p.portfolio,contributions:p.contributions,growth:p.growth});
    }
    return out;
  }

  return {frequencyPeriods,periodsPerYear,periodicRate,normalize,monthlyRate,portfolioMonthlyNeedToday,fiTargetToday,fiTargetAtYears,futurePortfolioMonthlyNeed,requiredPortfolioForWindow,planUntilTargetAtAge,planningTargetAtAge,planningTargetToday,simulatePostFI,planUntilPostFIPath,planUntilJourney,planUntilDrawdownSeries,contributionForPeriod,contributionForMonth,portfolioAtPeriods,portfolioAtMonths,portfolioAtYears,modelledFI,targetProjection,requiredContribution,requiredMonthly,result,annualJourney,series};
});
