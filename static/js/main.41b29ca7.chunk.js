(this["webpackJsonpetf-vis"]=this["webpackJsonpetf-vis"]||[]).push([[0],{159:function(e,t,a){},165:function(e,t,a){"use strict";a.r(t);var n=a(9),i=a.n(n),r=a(49),s=a.n(r),o=(a(159),a(6)),l=a.n(o),c=a(5),d=a(15),h=a(0),u=a(3),f=a(4),v=a(14),p=a(7),y=a(8),b=(a(164),a(2)),g=a(12),m=a(33),x=a.n(m),S=a(11),j=864e5,O=12;function w(e){return 0===e.getMonth()}function C(e,t){return P.apply(this,arguments)}function P(){return(P=Object(d.a)(l.a.mark((function e(t,a){var n;return l.a.wrap((function(e){for(;;)switch(e.prev=e.next){case 0:return e.next=2,S.d("https://www.alphavantage.co/query?function=TIME_SERIES_MONTHLY_ADJUSTED&symbol=".concat(t,"&apikey=").concat(a,"&datatype=csv"),(function(e){return{date:new Date(e.timestamp.toString()),dividend:parseFloat(e["dividend amount"]),course:parseFloat(e["adjusted close"])}}));case 2:return(n=e.sent).sort((function(e,t){return e.date-t.date})),e.abrupt("return",n);case 5:case"end":return e.stop()}}),e)})))).apply(this,arguments)}function T(e){return e.map((function(e){return[A(e.date),e.course]}))}function k(e){var t=e[0].date.getFullYear(),a=[[t,0]];return e.forEach((function(e){e.date.getFullYear()===t?a[a.length-1][1]+=e.dividend:(t=e.date.getFullYear(),a.push([t,e.dividend]))})),a.sort((function(e,t){return e[0]-t[0]})),a}function A(e){return Math.floor(e.getTime()/j)}function D(e){this.message="First call loadHistoricalDataIfNotPresent() before predicting: ".concat(e),this.name="HistoricalDataNotPresentException"}function M(e){var t,a,n=e.getDate(),i=(t=e.getMonth(),a=e.getFullYear(),new Date(a,t+1,0).getDate()),r=Math.round(n/i);return new Date(e.getFullYear(),e.getMonth()+r)}var I=function(){function e(){Object(u.a)(this,e),this.historicalData={},this.coursePredictors={},this.dividendPredictors={}}return Object(f.a)(e,[{key:"loadAndCacheHistoricalETFData",value:function(){var t=Object(d.a)(l.a.mark((function t(a){var n,i,r,s,o;return l.a.wrap((function(t){for(;;)switch(t.prev=t.next){case 0:if(!(a in this.historicalData)){t.next=2;break}return t.abrupt("return");case 2:return t.next=4,C(a);case 4:n=t.sent,i=T(n),r=e._calculateMaxTimestampBeforePredictorRepetition(i),s=k(n),o=e._calculateMaxTimestampBeforePredictorRepetition(s),this.historicalData[a]={history:n,courseForecastArray:i,dividendForecastArray:s},this.coursePredictors[a]={maxTimestampBeforeCoursePredictorRepetition:r},this.dividendPredictors[a]={maxYearBeforeDividendPredictorRepetition:o};case 12:case"end":return t.stop()}}),t,this)})));return function(e){return t.apply(this,arguments)}}()},{key:"_createCoursePredictorIfNotPresent",value:function(t,a){if(!(a in this.coursePredictors[t])){var n=this.historicalData[t].courseForecastArray,i=n[n.length-1][0]-Math.abs(n[n.length-1][0]-a)*e.backCastTimeFactor-e.backCastTimestampConstant,r=n.filter((function(e){return e[0]>=i}));this.coursePredictors[t][a]=x.a.linear(r,{order:2,precision:20})}}},{key:"_courseDateToPredictorTimestampAndDateTimestamp",value:function(e,t){var a=A(e);return[a>this.coursePredictors[t].maxTimestampBeforeCoursePredictorRepetition?this.coursePredictors[t].maxTimestampBeforeCoursePredictorRepetition:a,a]}},{key:"_createDividendPredictorIfNotPresent",value:function(t,a){if(!(a in this.dividendPredictors[t])){var n=this.historicalData[t].dividendForecastArray,i=n[n.length-1][0]-Math.abs(n[n.length-1][0]-a)*e.backCastTimeFactor-e.backCastTimestampConstant,r=n.filter((function(e){return e[0]>=i}));this.dividendPredictors[t][a]=x.a.linear(r,{order:2,precision:20})}}},{key:"_dividendYearToPredictorYear",value:function(e,t){return this.dividendPredictors[e].maxYearBeforeDividendPredictorRepetition<t?this.dividendPredictors[e].maxYearBeforeDividendPredictorRepetition:t}},{key:"predictCourse",value:function(e,t){if(!(e in this.coursePredictors))throw new D(e);var a=this._courseDateToPredictorTimestampAndDateTimestamp(t,e),n=Object(g.a)(a,2),i=n[0],r=n[1];return this._createCoursePredictorIfNotPresent(e,i),this.coursePredictors[e][i].predict(r)[1]}},{key:"predictDividend",value:function(e,t){if(!(e in this.dividendPredictors))throw new D(e);var a=this._dividendYearToPredictorYear(e,t);return this._createDividendPredictorIfNotPresent(e,a),Math.max(0,this.dividendPredictors[e][a].predict(t)[1])}}],[{key:"configure",value:function(t){var a=arguments.length>1&&void 0!==arguments[1]?arguments[1]:2,n=arguments.length>2&&void 0!==arguments[2]?arguments[2]:7;e.apiKey=t,e.backCastTimeFactor=a;var i=new Date(0);if(i.setMonth(n),e.backCastTimestampConstant=A(i),null!=e.instance){var r=e.getInstance();for(var s in r.coursePredictors)r.coursePredictors[s]={maxTimestampBeforeCoursePredictorRepetition:e._calculateMaxTimestampBeforePredictorRepetition(r.historicalData[s].courseForecastArray)};for(var o in r.dividendPredictors)r.dividendPredictors[o]={maxYearBeforeDividendPredictorRepetition:e._calculateMaxTimestampBeforePredictorRepetition(r.historicalData[o].dividendForecastArray)}}}},{key:"loadHistoricData",value:function(){var t=Object(d.a)(l.a.mark((function t(a,n){var i,r;return l.a.wrap((function(t){for(;;)switch(t.prev=t.next){case 0:e.configure(a),i=e.getInstance(),t.t0=l.a.keys(n);case 3:if((t.t1=t.t0()).done){t.next=9;break}return r=t.t1.value,t.next=7,i.loadAndCacheHistoricalETFData(n[r].symbol);case 7:t.next=3;break;case 9:console.log("Finished loading the historic data.");case 10:case"end":return t.stop()}}),t)})));return function(e,a){return t.apply(this,arguments)}}()},{key:"getInstance",value:function(){return null==e.instance&&(e.instance=new e),e.instance}},{key:"_calculateMaxTimestampBeforePredictorRepetition",value:function(t){var a=t[0][0],n=t[t.length-1][0];return n+(n-a)/e.backCastTimeFactor}}]),e}();I.instance=null,I.apiKey=null,I.backCastTimeConstant=null,I.backCastTimeFactor=null;var F=I,E=a(52),N=a.n(E),V=.26375;function _(e){var t=new Date(e);return t.setMonth(e.getMonth()+1),t}function z(e,t){if(function(e){return 11===e.getMonth()}(t)){var a=F.getInstance().predictDividend(e,t.getFullYear()),n=F.getInstance().predictCourse(e,t);return a>0?a:.025*n}return 0}function R(e,t){var a=e*t.percentageCosts+t.fixedCosts,n=Math.max(e-a,0);return[n,a=e-n]}function Y(e,t){return[Math.max(0,e-t),Math.max(0,t-e)]}function B(e,t){return t.totalShares[e]*t.sharePrizes[e]}function G(e,t){return t.newShares[e]*t.sharePrizes[e]}function W(e,t,a){var n=function(e){var t=0;for(var a in e.totalShares)t+=B(a,e);return t}(e),i=a.getFullYear()-t.getFullYear()+(a.getMonth()-t.getMonth())/O;e.inflation=n-n*Math.pow(.99,i)}function L(e,t,a,n,i,r){var s=F.getInstance(),o=0,l=e[e.length-1],c={date:a,newShares:{},totalShares:Object(h.a)({},l.totalShares),dividendNewShares:{},dividendTotalShares:Object(h.a)({},l.dividendTotalShares),totalCosts:l.totalCosts,sharePrizes:{},totalInvestedMoney:Object(h.a)({},l.totalInvestedMoney),newInvestedMoney:{},newInvestment:0,totalTaxes:l.totalTaxes,totalPayout:Object(h.a)({},l.totalPayout),newPayout:{}};for(var d in i){var u=i[d]*t;c.newInvestment+=u;var f=R(u,r.costConfig),v=Object(g.a)(f,2),p=v[0];o+=v[1],c.newInvestedMoney[d]=p,c.totalInvestedMoney[d]+=p;var y=s.predictCourse(d,a),b=p/y;c.sharePrizes[d]=y,c.newShares[d]=b;var m=z(d,a),x=c.totalShares[d]*m/y;c.newShares[d]+=x,c.dividendNewShares[d]=x,c.dividendTotalShares[d]+=x,c.totalShares[d]+=c.newShares[d],c.newPayout[d]=0}c.totalCosts+=o;var S=function(e,t,a,n){if(!w(t)||e.length<2)return[0,a];var i,r,s,o=0,l=e[e.length-1],c=e.length-O>1?e[e.length-O]:e[1];for(var d in n){for(var h=0,u=1;u<O&&e.length-u>0;u++)h+=G(d,e[e.length-u])*u/O;h+=B(d,c)*(O-c.date.getMonth())/O,h*=.0049;var f=B(d,l)-l.totalInvestedMoney[d],v=0;e.length>O&&(v=Math.max(0,B(d,e[e.length-1-O])-e[e.length-1-O].totalInvestedMoney[d]));var p=(i=f-v,r=0,s=h,Math.max(r,Math.min(i,s))),y=Y(p,a),b=Object(g.a)(y,2);p=b[0],a=b[1],o+=.7*p*V}return[o,a]}(e,a,r.taxFreeAmount,i),j=Object(g.a)(S,2),C=j[0],P=j[1];return c.totalTaxes+=C,W(c,n,a),e.push(c),P}function H(e,t,a,n,i,r,s,o,l){w(n)&&(o=r.taxFreeAmount);var c=F.getInstance(),d=0,u=0,f=e[e.length-1],v={date:n,newShares:{},totalShares:Object(h.a)({},f.totalShares),dividendNewShares:{},dividendTotalShares:Object(h.a)({},f.dividendTotalShares),totalCosts:f.totalCosts,sharePrizes:{},totalInvestedMoney:Object(h.a)({},f.totalInvestedMoney),newInvestedMoney:{},newInvestment:0,totalTaxes:f.totalTaxes,totalPayout:Object(h.a)({},f.totalPayout),newPayout:{}};for(var p in a){var y=c.predictCourse(p,n);if(v.sharePrizes[p]=y,v.newPayout[p]=0,v.newInvestedMoney[p]=0,l[p].investmentStepsIdx<e.length){for(var b=t*a[p],m=0,x=R(b,r.costConfig)[1],S=0,j=l[p].investmentStepsIdx,O=e[j].newShares[p]-l[p].alreadySoldShares;j<e.length;j++){var C=b-m,P=e[j],T=y*(j===l[p].investmentStepsIdx?P.newShares[p]-l[p].alreadySoldShares:P.newShares[p]),k=Math.min(T,C),A=k/y;O=P.newShares[p]-A,O-=j===l[p].investmentStepsIdx?l[p].alreadySoldShares:0;var D=Math.max(0,k-(x-S));S+=Math.max(0,k-D);var M=A*P.sharePrizes[p],I=Math.max(0,D-M),E=Y(I,o),N=Object(g.a)(E,2);I=N[0],o=N[1];var _=.7*I*V,B=Y(_,s),G=Object(g.a)(B,2);_=G[0],s=G[1],u+=_;var L=D-_;v.newPayout[p]+=L,v.totalPayout[p]+=L,v.totalShares[p]-=A,m+=k;var H=0;H=j===l[p].investmentStepsIdx?Math.max(0,P.dividendNewShares[p]-l[p].alreadySoldShares):P.dividendNewShares[p];var K=Math.min(H,A);if(v.dividendTotalShares[p]-=K,m>=b)break}d+=S,l[p].investmentStepsIdx=j,l[p].investmentStepsIdx+=0===O?1:0,l[p].alreadySoldShares=j<e.length?e[j].newShares[p]-O:0}var U=v.totalShares[p]*z(p,n)/y;v.newShares[p]=U,v.totalShares[p]+=U,v.dividendNewShares[p]=U,v.dividendTotalShares[p]+=U}return v.totalCosts+=d,v.totalTaxes+=u,W(v,i,n),e.push(v),[s,o]}function K(e,t){var a=F.getInstance(),n={date:t,totalCosts:0,totalTaxes:0,newShares:{},totalShares:{},dividendNewShares:{},dividendTotalShares:{},totalInvestedMoney:{},totalPayout:{},newPayout:{},sharePrizes:{},newInvestedMoney:{},newInvestment:0};for(var i in e)n.newShares[i]=0,n.totalShares[i]=0,n.dividendNewShares[i]=0,n.dividendTotalShares[i]=0,n.totalInvestedMoney[i]=0,n.totalPayout[i]=0,n.newPayout[i]=0,n.newInvestedMoney[i]=0,n.sharePrizes[i]=a.predictCourse(i,t);return n}var U=function(){function e(t,a,n,i,r,s,o,l){Object(u.a)(this,e),this.startCapital=t,this.monthlyInvestment=a,this.monthlyPayout=n,this.savingPhaseLength=i,this.etfToRatio=r,this.configOptions=s,this.expectationOfLife=l,this.age=o,this._calculateTimestampsForModel(),this._calculateModel()}return Object(f.a)(e,[{key:"_calculateTimestampsForModel",value:function(){for(var e=function(e,t,a){var n=arguments.length>3&&void 0!==arguments[3]?arguments[3]:10,i=t-e,r=new Date,s=new Date(r.getFullYear(),r.getMonth()+1),o=new Date(s);o.setFullYear(s.getFullYear()+a);var l=new Date(s);return l.setFullYear(s.getFullYear()+i+n),[s,o,l]}(this.age,this.expectationOfLife,this.savingPhaseLength),t=Object(g.a)(e,3),a=t[0],n=t[1],i=t[2],r=[],s=a;s<n;s=_(s))r.push(s);this.savingDates=r;for(var o=[],l=n;l<i;l=_(l))o.push(l);this.payoutDates=o,this.initialDate=a}},{key:"_calculateModel",value:function(){var e,t=[K(this.etfToRatio,this.savingDates[0])],a=L(t,this.monthlyInvestment+this.startCapital,this.savingDates[0],this.initialDate,this.etfToRatio,this.configOptions),n=Object(b.a)(this.savingDates.slice(1));try{for(n.s();!(e=n.n()).done;){var i=e.value;a=L(t,this.monthlyInvestment,i,this.initialDate,this.etfToRatio,this.configOptions)}}catch(f){n.e(f)}finally{n.f()}var r=(t=t.slice(1))[t.length-1].totalTaxes,s={};for(var o in this.etfToRatio)s[o]={investmentStepsIdx:0,alreadySoldShares:0};var l,c=Object(b.a)(this.payoutDates);try{for(c.s();!(l=c.n()).done;){var d=l.value,h=H(t,this.monthlyPayout,this.etfToRatio,d,this.initialDate,this.configOptions,r,a,s),u=Object(g.a)(h,2);r=u[0],a=u[1]}}catch(f){c.e(f)}finally{c.f()}this.investmentSteps=t}},{key:"getInvestmentSteps",value:function(e){if(!Number.isInteger(O/e))throw new Error("The numberOfEntriesPerYear need to be dividable by ".concat(O," in order to make sense."));if(e===O)return this.investmentSteps;for(var t=[],a=O/e,n=0;n<this.investmentSteps.length;n+=a){for(var i=N()(this.investmentSteps[n]),r=1;r<a;r++)for(var s in i.newInvestment+=this.investmentSteps[n+r].newInvestment,this.investmentSteps[n+r].newPayout)i.newPayout[s]+=this.investmentSteps[n+r].newPayout[s];t.push(i)}return t}}]),e}(),J=a(13),q=a(10),Q=1e6;function X(e){var t,a=Object(b.a)(Z.activeStrategies);try{for(a.s();!(t=a.n()).done;){t.value.interaction.style("display",e)}}catch(n){a.e(n)}finally{a.f()}}var Z=function(){function e(t,a,n,i){var r=arguments.length>4&&void 0!==arguments[4]?arguments[4]:1100,s=arguments.length>5&&void 0!==arguments[5]?arguments[5]:300,o=arguments.length>6&&void 0!==arguments[6]?arguments[6]:150,l=arguments.length>7&&void 0!==arguments[7]?arguments[7]:40;if(Object(u.a)(this,e),this.constructor===e)throw new Error("Abstract classes can't be instantiated.");e.activeStrategies.push(this),this.investmentSteps=t,this.payoutPhaseStartDate=n,this.marginW=o,this.marginH=l,this.width=r,this.height=s,this.lineStrokeWidth=3,a.innerHTML="",this.svg=S.m(a).append("svg").attr("id",i).attr("viewBox","0 0 ".concat(this.width+2*this.marginW," ").concat(this.height+2*this.marginH)).append("g").attr("transform","translate(".concat([this.marginW,this.marginH],")"))}return Object(f.a)(e,[{key:"render",value:function(){this._prepareData(),this._calculateExtents(),this._createScales(),this._drawContent(),this._prepareText(),this._drawText(),this._drawAxis(),this._addInteraction()}},{key:"_calculateExtents",value:function(){var e=this;this.dateExtent=S.f(this.dataArray[0],(function(e){return e.date}));var t=new Date(this.payoutPhaseStartDate);t.setMonth(t.getMonth()+O);var a=this.dataArray[this.maxIndex].filter((function(a){return a.date<=t&&a.date>e.dateExtent[0]})),n=this.dataArray[this.minIndex].filter((function(e){return e.date<=t})),i=S.h(a.map((function(e){return e.yStart}))),r=S.i(n.map((function(e){return e.yEnd})));this.yExtent=[r,i]}},{key:"_createScales",value:function(){this.yScale=S.k().domain(this.yExtent).range([this.height,0]),this.xScale=S.l().domain(this.dateExtent).range([0,this.width])}},{key:"_drawAxis",value:function(){var e=Math.max(-this.yExtent[0],this.yExtent[1])>=5e6?Q:1e3,t=e===Q?"M":"K";this.svg.append("g").style("font-size","20px").call(S.c(this.yScale).tickFormat((function(a){return"".concat((a/e).toLocaleString()).concat(t," \u20ac")})).ticks(7)),this.svg.append("g").style("font-size","20px").attr("transform","translate(0, ".concat(this.height,")")).call(S.b(this.xScale)),this.svg.append("g").append("line").attr("x1",this.xScale(this.dateExtent[0])).attr("y1",this.yScale(0)).attr("x2",this.xScale(this.dateExtent[1])).attr("y2",this.yScale(0)).style("stroke-width",this.lineStrokeWidth).style("stroke","black"),this.svg.append("g").append("line").attr("x1",this.xScale(this.payoutPhaseStartDate)-this.lineStrokeWidth/2).attr("y1",this.yScale(this.yExtent[0])).attr("x2",this.xScale(this.payoutPhaseStartDate)-this.lineStrokeWidth/2).attr("y2",this.yScale(this.yExtent[1])).style("stroke-width",this.lineStrokeWidth).style("stroke","black")}},{key:"_addInteraction",value:function(){var e=this;this.interaction=this.svg.append("g").attr("class","interaction").style("display","none").attr("transform","translate(".concat([0,-this.marginH],")")),this.hoverLine=this.interaction.append("line").attr("class","tooltipLine").style("stroke","blue").style("stroke-dasharray","3,3").style("opacity",.5).attr("y1",this.height+2*this.marginH).attr("y2",0),this.svg.append("rect").attr("class","mouseEvent").attr("transform","translate(".concat([0,-this.marginH],")")).attr("height",this.height+2*this.marginH).attr("width",this.width).attr("fill","none").style("pointer-events","all").on("mouseover",(function(){return X(null)})).on("mouseout",(function(){return X("none")})).on("mousemove",(function(t){return e._handleTooltipEvent(t)}))}},{key:"_handleTooltipEvent",value:function(t){var a,n=S.j(t)[0],i=M(this.xScale.invert(n)),r=Object(b.a)(e.activeStrategies);try{for(r.s();!(a=r.n()).done;){var s=a.value;s.hoverLine.attr("x1",this.xScale(i)).attr("x2",this.xScale(i)),s._updateTooltip()}}catch(o){r.e(o)}finally{r.f()}}},{key:"_drawText",value:function(){this.svg.append("g").attr("class","textGroup").selectAll("text").data(this.textProperties).enter().append("text").text((function(e){return e.text})).attr("x",(function(e){return e.x})).attr("y",(function(e){return e.y})).style("font-size",(function(e){return e.fontSize})).style("font-weight",(function(e){return e.fontWeight})).style("text-anchor",(function(e){return e.textAnchor})).style("fill",(function(e){return e.color}))}},{key:"_prepareText",value:function(){var e=this.xScale(this.dateExtent[0])+(this.xScale(this.payoutPhaseStartDate)-this.xScale(this.dateExtent[0]))/2,t=this.xScale(this.payoutPhaseStartDate)+(this.xScale(this.dateExtent[1])-this.xScale(this.payoutPhaseStartDate))/2,a=-10;this.standardFontSize=20,this.textProperties=[{text:"SAVING",x:e,y:a,fontSize:this.standardFontSize,textAnchor:"end",fontWeight:"bold",color:"black"},{text:"Phase",x:e,y:a,fontSize:this.standardFontSize,textAnchor:"start",fontWeight:"normal",color:"black"},{text:"PAYOUT",x:t,y:a,fontSize:this.standardFontSize,textAnchor:"end",fontWeight:"bold",color:"black"},{text:"Phase",x:t,y:a,fontSize:this.standardFontSize,textAnchor:"start",fontWeight:"normal",color:"black"}]}},{key:"_prepareData",value:function(){throw new Error("Abstract method. Not Implemented")}},{key:"_drawContent",value:function(){throw new Error("Abstract method. Not Implemented")}},{key:"_updateTooltip",value:function(){throw new Error("Abstract method. Not Implemented")}}],[{key:"reset",value:function(){e.activeStrategies=[]}}]),e}();Z.activeStrategies=[];var $=function(e){Object(p.a)(a,e);var t=Object(y.a)(a);function a(e,n,i){var r;return Object(u.a)(this,a),(r=t.call(this,e,n,i,"firstSVG")).etfLineColors={"SP5C.PAR":{total:"#0562a0",dividend:"#71c1f7"},ESGE:{total:"#ff1eff",dividend:"#ff63ff"},SUSA:{total:"#23ff01",dividend:"#7dff69"}},r.colors={inflation:"#ff7f00",costs:"#be3bff",taxes:"#e31a1c"},r.lineOpacity=.7,r}return Object(f.a)(a,[{key:"_prepareData",value:function(){this.dataToIndex={costs:0,taxes:1,inflation:2};var e=3,t="capital",a="dividend";for(var n in this.investmentSteps[0].totalShares)this.dataToIndex[n+a]=e++,this.dataToIndex[n+t]=e++;this.minIndex=this.dataToIndex.inflation,this.maxIndex=e-1,this.dataArray=[];for(var i=0;i<e;i++)this.dataArray.push([]);var r,s=Object(b.a)(this.investmentSteps);try{for(s.s();!(r=s.n()).done;){var o=r.value;this.dataArray[this.dataToIndex.costs].push({yStart:0,yEnd:-o.totalCosts,date:o.date}),this.dataArray[this.dataToIndex.taxes].push({yStart:-o.totalCosts,yEnd:-o.totalCosts-o.totalTaxes,date:o.date}),this.dataArray[this.dataToIndex.inflation].push({yStart:-o.totalCosts-o.totalTaxes,yEnd:-o.totalCosts-o.totalTaxes-o.inflation,date:o.date});var l=0;for(var c in o.totalShares){var d=B(c,o),h=o.dividendTotalShares[c]*o.sharePrizes[c];this.dataArray[this.dataToIndex[c+t]].push({yStart:d+l,yEnd:d-h+l,date:o.date}),this.dataArray[this.dataToIndex[c+a]].push({yStart:d-h+l,yEnd:l,date:o.date}),l+=d}}}catch(f){s.e(f)}finally{s.f()}for(var u in this.dataArray[this.dataToIndex.inflation].color=this.colors.inflation,this.dataArray[this.dataToIndex.taxes].color=this.colors.taxes,this.dataArray[this.dataToIndex.costs].color=this.colors.costs,this.investmentSteps[0].totalShares)this.dataArray[this.dataToIndex[u+a]].color=this.etfLineColors[u].dividend,this.dataArray[this.dataToIndex[u+t]].color=this.etfLineColors[u].total}},{key:"_drawLines",value:function(){for(var e=this,t=0;t<this.dataArray.length;t++)this.svg.append("path").datum(this.dataArray[t]).style("stroke",(function(e){return e.color})).style("stroke-width",this.lineStrokeWidth).style("opacity",this.lineOpacity).style("fill","none").attr("d",S.g().x((function(t){return e.xScale(t.date)})).y((function(t){return e.yScale(t.yStart)})))}},{key:"_drawContent",value:function(){this._drawArea()}},{key:"_drawArea",value:function(){for(var e=this,t=0;t<this.dataArray.length;t++)this.svg.append("g").attr("class","area").append("path").datum(this.dataArray[t]).style("opacity",this.lineOpacity).style("fill",(function(e){return e.color})).attr("d",S.a().curve(S.e).x((function(t){return e.xScale(t.date)})).y0((function(t){return e.yScale(t.yEnd)})).y1((function(t){return e.yScale(t.yStart)})))}},{key:"_prepareText",value:function(){var e;Object(J.a)(Object(q.a)(a.prototype),"_prepareText",this).call(this);var t=this.dataArray[this.dataToIndex.costs],n=this.yScale(0)+(this.yScale(t[t.length-1].yStart)-this.yScale(0))/2;(e=this.textProperties).push.apply(e,[{text:" Inflation",x:this.xScale(this.dateExtent[0])+this.width/40,y:this.yScale(0)+(this.yScale(this.yExtent[0])-this.yScale(0))/2,fontSize:this.standardFontSize,textAnchor:"start",fontWeight:"normal",color:this.colors.inflation},{text:" Costs",x:1.005*this.width,y:n+this.standardFontSize/2,fontSize:this.standardFontSize,textAnchor:"start",fontWeight:"normal",color:this.colors.costs},{text:" Taxes",x:1.005*this.width,y:n+2*this.standardFontSize,fontSize:this.standardFontSize,textAnchor:"start",fontWeight:"normal",color:this.colors.taxes}])}},{key:"_updateTooltip",value:function(){}}]),a}(Z),ee=function(e){Object(p.a)(a,e);var t=Object(y.a)(a);function a(e,n,i){var r;return Object(u.a)(this,a),(r=t.call(this,e,n,i,"secondSVG")).barPaddingPercentage=.9,r.zeroLineStrokeWidth=3,r}return Object(f.a)(a,[{key:"render",value:function(){Object(J.a)(Object(q.a)(a.prototype),"render",this).call(this)}},{key:"_prepareData",value:function(){var e=0,t=1;this.minIndex=e,this.maxIndex=t,this.dataArray=[[],[]];var a,n=Object(b.a)(this.investmentSteps);try{for(n.s();!(a=n.n()).done;){var i=a.value,r=0;for(var s in i.newPayout)r+=i.newPayout[s];this.dataArray[e].push({yStart:0,yEnd:-i.newInvestment,date:i.date,color:"#b4291f"}),this.dataArray[t].push({yStart:r,yEnd:0,date:i.date,color:"#0562a0"})}}catch(o){n.e(o)}finally{n.f()}this.rectWidth=this.width/this.dataArray[e].length*this.barPaddingPercentage}},{key:"_drawContent",value:function(){var e,t=this,a=this.dataArray[0][this.dataArray[0].length-1].date===this.dateExtent[1],n=Object(b.a)(this.dataArray);try{for(n.s();!(e=n.n()).done;){var i=e.value;a&&(i=i.slice(0,-1)),this.svg.append("g").attr("class","bars").selectAll("rect.none").data(i).enter().append("rect").style("fill",(function(e){return e.color})).attr("x",(function(e){return t.xScale(e.date)})).attr("width",this.rectWidth).attr("y",(function(e){return t.yScale(e.yStart)})).attr("height",(function(e){return t.yScale(e.yEnd)-t.yScale(e.yStart)}))}}catch(r){n.e(r)}finally{n.f()}}},{key:"_updateTooltip",value:function(){}}]),a}(Z),te=a(1);var ae=function(e){Object(p.a)(a,e);var t=Object(y.a)(a);function a(e){var n;return Object(u.a)(this,a),(n=t.call(this,e)).firstSVGRef=i.a.createRef(),n.secondSVGRef=i.a.createRef(),n}return Object(f.a)(a,[{key:"getInvestmentModel",value:function(){var e,t={};for(var a in this.props.etfProperties)this.props.etfProperties[a].selected&&(t[this.props.etfProperties[a].symbol]=this.props.etfProperties[a].percentage);return new U(this.props[ve],this.props[pe],this.props[Se],this.props[ge],t,{taxFreeAmount:this.props[xe],costConfig:(e=this.props,e[be]?{percentageCosts:0,fixedCosts:e[ye]}:{percentageCosts:e[ye],fixedCosts:0})},this.props[me],this.props[je])}},{key:"drawVisualization",value:function(){Z.reset();try{null!=this.props.isValid&&this.props.isValid&&(this.investmentModel=this.getInvestmentModel());var e=this.investmentModel.payoutDates[0],t=this.investmentModel.getInvestmentSteps(this.props[Oe]);new $(t,this.firstSVGRef.current,e).render(),new ee(t,this.secondSVGRef.current,e).render()}catch(a){console.error(a)}}},{key:"componentDidMount",value:function(){var e=Object(d.a)(l.a.mark((function e(){return l.a.wrap((function(e){for(;;)switch(e.prev=e.next){case 0:this.drawVisualization();case 1:case"end":return e.stop()}}),e,this)})));return function(){return e.apply(this,arguments)}}()},{key:"componentDidUpdate",value:function(){this.drawVisualization()}},{key:"render",value:function(){return Object(te.jsxs)(i.a.Fragment,{children:[Object(te.jsx)("div",{ref:this.secondSVGRef}),Object(te.jsx)("div",{ref:this.firstSVGRef})]})}}]),a}(i.a.Component);function ne(e){return Object(te.jsxs)("div",{className:"position-relative",children:[Object(te.jsx)("h6",{className:"sidebar-heading d-flex justify-content-between align-items-center px-3 mt-4 mb-1 text-muted",children:Object(te.jsx)("span",{children:e.title})}),Object(te.jsx)(re,Object(h.a)(Object(h.a)({},e),{},{identifier:e.title}))]})}function ie(e){return Object(te.jsx)("div",{className:"row",children:Object(te.jsx)("div",{className:"col-12 p-0",children:Object(te.jsx)("div",{className:"d-grid gap-0",children:Object(te.jsxs)("div",{className:"overlay min-vh-100 text-center m-0 d-flex flex-column justify-content-center",style:{visibility:e.displayOverlay?"visible":"hidden"},children:[Object(te.jsxs)("h1",{className:"p-5",children:["Enter your personal"," ",Object(te.jsxs)("a",{href:"https://www.alphavantage.co/support/#api-key",target:"_blank",rel:"noopener noreferrer",children:[" ","Alphavantage API Key"]})," "]}),Object(te.jsx)(se,Object(h.a)(Object(h.a)({},e),{},{disabled:!e.displayOverlay})),Object(te.jsx)("button",{type:"button",className:"btn btn-primary my-5",onClick:e.handleAPIKeyConfirm,children:"Confirm"})]})})})})}function re(e){return Object(te.jsx)("div",{id:e.identifier+"Feedback",className:"invalid-tooltip",style:{visibility:e.isValid?"hidden":"visible"},children:e.errorMessage})}function se(e){return Object(te.jsxs)("div",{className:"position-relative",children:[Object(te.jsx)("label",{className:"form-label",htmlFor:e.identifier,children:e.label}),Object(te.jsx)("input",{className:"form-control "+(e.isValid?"":"is-invalid"),id:e.identifier,type:"text",value:e.value.toString()+(""!==e.textAppending?" "+e.textAppending:""),onChange:function(t){return e.onValueChange(e.transformFunction(t),e.identifier)},disabled:e.disabled}),Object(te.jsx)(re,Object(h.a)({},e))]})}var oe=se;var le=function(e){return Object(te.jsxs)("div",{className:"checkbox-element",children:[Object(te.jsx)("input",{className:"form-check-input",id:e.identifier,type:"checkbox",value:e.value,onChange:function(){return e.onValueChange(e.identifier)}}),Object(te.jsx)("label",{className:"form-check-label",htmlFor:e.identifier,children:e.label})]})};function ce(e,t){return t.fixedCosts===e.fixedCosts&&t.percentageCosts===e.percentageCosts}function de(e){return Object(te.jsxs)("div",{className:"dropdown",children:[Object(te.jsx)("button",{className:"btn btn-secondary dropdown-toggle",type:"button",id:"BrokerDropDown","data-bs-toggle":"dropdown","aria-expanded":"false",children:e.label}),Object(te.jsx)("ul",{className:"dropdown-menu","aria-labelledby":"BrokerDropDown",children:e.elements.map((function(t){return Object(te.jsx)("li",{children:Object(te.jsx)("button",{className:ce(e,t)?"dropdown-item active":"dropdown-item",type:"button",onClick:function(a){return e.handleChange(t)},children:t.label})},t.identifier)}))})]})}function he(e){return Object(te.jsxs)("div",{className:"dropdown",children:[Object(te.jsx)("button",{className:"btn btn-secondary dropdown-toggle",type:"button",id:"GraphDetailDropDown","data-bs-toggle":"dropdown","aria-expanded":"false",children:e.label}),Object(te.jsx)("ul",{className:"dropdown-menu","aria-labelledby":"GraphDetailDropDown",children:e.elements.map((function(t){return Object(te.jsx)("li",{children:Object(te.jsx)("button",{className:e.value===t.value?"dropdown-item active":"dropdown-item",type:"button",onClick:function(a){return e.handleChange(t)},children:t.label})},t.identifier)}))})]})}function ue(e){var t=parseFloat(e.target.value)/100;return isNaN(t)?0:t}function fe(e){return Object(te.jsxs)("div",{className:"dropdown position-relative",children:[Object(te.jsx)("button",{className:"btn btn-secondary dropdown-toggle is-invalid",type:"button",id:"ETFSelectionDropDown","data-bs-toggle":"dropdown","aria-expanded":"false",children:e.label}),Object(te.jsx)(re,Object(h.a)({},e)),Object(te.jsx)("ul",{className:"dropdown-menu","aria-labelledby":"ETFSelectionDropDown",children:Object.keys(e.elements).map((function(t){return Object(te.jsx)("li",{children:Object(te.jsx)("button",{className:e.elements[t].selected?"dropdown-item active":"dropdown-item",type:"button",onClick:function(a){"text"!==a.target.type&&e.handleSelectionChange(e.elements[t])},children:Object(te.jsx)(se,Object(h.a)(Object(h.a)({},e.elements[t]),{},{value:Math.round(100*e.elements[t].percentage),textAppending:"%",onValueChange:e.handleShareChange,transformFunction:ue,disabled:e.autoPercentage,isValid:!0}))})},t)}))})]})}var ve="startingCapital",pe="monthlyInvestment",ye="transactionCosts",be="transactionCostsType",ge="savingPhase",me="age",xe="taxFreeAmount",Se="monthlyPayout",je="lifeExpectation",Oe="detailedGraph",we="etfDropdownSelection",Ce="apiKey",Pe="brokerDropdown",Te="etfAutomaticPercentage";function ke(e){var t=parseInt(e.target.value.split(" ",1));return isNaN(t)?0:t}function Ae(e){var t=parseFloat(e.target.value);return isNaN(t)?0:t}function De(e){return!Number.isNaN(e)&&Number.isInteger(e)&&e>=0}function Me(e){var t=0;for(var a in e.etfDropdownSelection.elements)e.etfDropdownSelection.elements[a].selected&&t++;var n=1/Math.max(1,t);for(var i in e.etfDropdownSelection.elements)e.etfDropdownSelection.elements[i].percentage=n;return e}var Ie=function(e){Object(p.a)(a,e);var t=Object(y.a)(a);function a(e){var n;return Object(u.a)(this,a),(n=t.call(this,e)).handleTextChange=n.handleTextChange.bind(Object(v.a)(n)),n.handleCheckBoxChange=n.handleCheckBoxChange.bind(Object(v.a)(n)),n.handleBrokerChange=n.handleBrokerChange.bind(Object(v.a)(n)),n.handleGraphDetailChange=n.handleGraphDetailChange.bind(Object(v.a)(n)),n.handleETFSelectionChange=n.handleETFSelectionChange.bind(Object(v.a)(n)),n.handleETFShareChange=n.handleETFShareChange.bind(Object(v.a)(n)),n.handleAPIKeyConfirm=n.handleAPIKeyConfirm.bind(Object(v.a)(n)),n.state=function(e){var t;return t={isValid:!0},Object(c.a)(t,ve,{value:1e3,label:"Starting Capital",errorMessage:"",textAppending:"\u20ac",isValid:!0,identifier:ve,transformFunction:ke,onValueChange:e.handleTextChange}),Object(c.a)(t,pe,{value:100,label:"Monthly Investment",errorMessage:"Please enter a positive Money amount.",textAppending:"\u20ac",isValid:!0,identifier:pe,transformFunction:ke,onValueChange:e.handleTextChange}),Object(c.a)(t,Se,{value:1e3,label:"Monthly Payout",errorMessage:"",textAppending:"\u20ac",isValid:!0,identifier:Se,transformFunction:ke,onValueChange:e.handleTextChange}),Object(c.a)(t,ye,{value:.015,label:"Transaction Costs",errorMessage:"",textAppending:"%",isValid:!0,identifier:ye,transformFunction:Ae,onValueChange:e.handleTextChange}),Object(c.a)(t,be,{value:!1,label:"Fixed Amount",identifier:be,onValueChange:e.handleCheckBoxChange}),Object(c.a)(t,ge,{value:40,label:"Saving Phase",errorMessage:"",textAppending:"Y",isValid:!0,identifier:ge,transformFunction:ke,onValueChange:e.handleTextChange}),Object(c.a)(t,me,{value:30,label:"Your Age",textAppending:"Y",errorMessage:"",isValid:!0,identifier:me,transformFunction:ke,onValueChange:e.handleTextChange}),Object(c.a)(t,je,{value:80,label:"Life Expectation",errorMessage:"",isValid:!0,textAppending:"Y",identifier:je,transformFunction:ke,onValueChange:e.handleTextChange}),Object(c.a)(t,xe,{value:801,label:"Tax Free Amount",errorMessage:"",isValid:!0,textAppending:"\u20ac",identifier:xe,transformFunction:ke,onValueChange:e.handleTextChange}),Object(c.a)(t,Te,{value:!1,label:"Automatic ETF Ratio",identifier:Te,onValueChange:e.handleCheckBoxChange}),Object(c.a)(t,Ce,{displayOverlay:!0,value:"",label:"",errorMessage:"",isValid:!0,textAppending:"",identifier:Ce,transformFunction:function(e){return e.target.value},onValueChange:e.handleTextChange,handleAPIKeyConfirm:e.handleAPIKeyConfirm}),Object(c.a)(t,Oe,{value:1,label:"Graph Detail Level",isValid:!0,handleChange:e.handleGraphDetailChange,elements:[{identifier:"12",value:12,label:"All Months a Year (highest detail)"},{identifier:"6",value:6,label:"Every 2nd Month (higher detail)"},{identifier:"3",value:3,label:"Every 4th Month (lower detail)"},{identifier:"1",value:1,label:"One Month a Year (lowest detail) (default)"}]}),Object(c.a)(t,Pe,{label:"Broker",isValid:!0,handleChange:e.handleBrokerChange,elements:[{identifier:"comdirect",label:"comdirect",fixedCosts:0,percentageCosts:.015},{identifier:"tradeRepublic",label:"Trade Republic",fixedCosts:0,percentageCosts:.01},{identifier:"eToro",label:"eToro",fixedCosts:0,percentageCosts:0}]}),Object(c.a)(t,we,{label:"ETF Selection",isValid:!0,identifier:we,errorMessage:"",handleSelectionChange:e.handleETFSelectionChange,handleShareChange:e.handleETFShareChange,elements:{S_and_P_500:{identifier:"S_and_P_500",symbol:"SP5C.PAR",percentage:1,label:"S & P 500",selected:!0},iShare:{identifier:"iShare",symbol:"ESGE",percentage:1,label:"iShare",selected:!1},msciUSA:{identifier:"msciUSA",symbol:"SUSA",percentage:1,label:"MSCI USA ESG",selected:!1}}}),t}(Object(v.a)(n)),n}return Object(f.a)(a,[{key:"handleTextChange",value:function(e,t){var a=Object(h.a)({},this.state);a[t].value=e,this.validateAndSetState(a)}},{key:"handleCheckBoxChange",value:function(e){var t=Object(h.a)({},this.state);t[e].value=!t[e].value,e===be?(t[ye].value=t[e].value?5:.015,t[ye].textAppending=t[e].value?"\u20ac":"%",t[ye].transformFunction=t[e].value?ke:Ae):e===Te&&t[e].value&&Me(t),this.validateAndSetState(t)}},{key:"handleBrokerChange",value:function(e){var t=Object(h.a)({},this.state);t[ye].value=e.percentageCosts>0?e.percentageCosts:e.fixedCosts,t[be].value=!(e.percentageCosts>0),this.validateAndSetState(t)}},{key:"handleGraphDetailChange",value:function(e){var t=Object(h.a)({},this.state);t[Oe].value=e.value,this.validateAndSetState(t)}},{key:"handleETFSelectionChange",value:function(e){var t=Object(h.a)({},this.state);t.etfDropdownSelection.elements[e.identifier].selected=!t.etfDropdownSelection.elements[e.identifier].selected,t.etfAutomaticPercentage.value&&Me(t),this.validateAndSetState(t)}},{key:"handleETFShareChange",value:function(e,t){var a=Object(h.a)({},this.state);a.etfDropdownSelection.elements[t].percentage=e,this.validateAndSetState(a)}},{key:"handleAPIKeyConfirm",value:function(){var e=Object(d.a)(l.a.mark((function e(){var t,a;return l.a.wrap((function(e){for(;;)switch(e.prev=e.next){case 0:return t=this.state.apiKey.value,a=Object(h.a)({},this.state.apiKey),e.prev=2,e.next=5,F.loadHistoricData(t,this.state.etfDropdownSelection.elements);case 5:a.error=!1,a.displayOverlay=!1,e.next=12;break;case 9:e.prev=9,e.t0=e.catch(2),a.error=!0;case 12:this.setState(Object(c.a)({},Ce,a)),this.forceUpdate();case 14:case"end":return e.stop()}}),e,this,[[2,9]])})));return function(){return e.apply(this,arguments)}}()},{key:"validateAndSetState",value:function(e){var t=[pe,Se,ve,me,je,ge,xe];e.isValid=!0;for(var a=0,n=t;a<n.length;a++){var i=n[a];e[i].isValid=De(e[i].value),e[i].errorMessage="Please enter a positive number.",e.isValid=e[i].isValid&&e.isValid}var r,s=e[je].value-e[me].value;e[me].value>=e[je].value?(e[me].errorMessage="You cannot be older than the life expectation",e[me].isValid=!1,e.isValid=!1):s<=e[ge].value&&(e[ge].errorMessage="You cannot have a saving phase that lasts longer than your life.",e[ge].isValid=!1,e.isValid=!1),e[be].value?(e[ye].isValid=De(e[ye].value),e[ye].errorMessage="Please enter a positive number."):(e[ye].isValid=(r=e[ye].value,!Number.isNaN(r)&&r>=0&&r<=1),e[ye].errorMessage="Please enter a valid percentage."),e.isValid=e[ye].isValid&&e.isValid;var o=0,l=!1;for(var c in e.etfDropdownSelection.elements)e.etfDropdownSelection.elements[c].selected&&(o+=e.etfDropdownSelection.elements[c].percentage,l=!0);l?1!==o?(e.etfDropdownSelection.isValid=!1,e.etfDropdownSelection.errorMessage="The sum of all selected ETF needs to be 100%",e.isValid=!1):e.etfDropdownSelection.isValid=!0:(e.etfDropdownSelection.isValid=!1,e.etfDropdownSelection.errorMessage="Please select at least one ETF.",e.isValid=!1),this.setState(e)}},{key:"render",value:function(){var e=function(e){var t={};for(var a in e)t[a]=e[a].value;return Object.assign(t,{etfProperties:e.etfDropdownSelection.elements}),t.isValid=e.isValid,t}(this.state);return Object(te.jsxs)("div",{className:"container-fluid",children:[Object(te.jsx)(ie,Object(h.a)({},this.state.apiKey)),Object(te.jsxs)("div",{className:"row",children:[Object(te.jsx)("nav",{id:"sidebarMenu",className:"col-md-3 col-lg-2 bg-light sidebar",children:Object(te.jsxs)("form",{className:"position-sticky needs-validation",noValidate:!0,children:[Object(te.jsx)(ne,{title:"Money Options"}),Object(te.jsx)(oe,Object(h.a)({},this.state[ve]),ve),Object(te.jsx)(oe,Object(h.a)({},this.state[pe]),pe),Object(te.jsx)(oe,Object(h.a)({},this.state[Se]),Se),Object(te.jsx)(oe,Object(h.a)({},this.state[xe]),xe),Object(te.jsx)(ne,{title:"Time Options"}),Object(te.jsx)(oe,Object(h.a)({},this.state[me]),me),Object(te.jsx)(oe,Object(h.a)({},this.state[je]),je),Object(te.jsx)(oe,Object(h.a)({},this.state[ge]),ge),Object(te.jsx)(ne,{title:"Cost Options"}),Object(te.jsx)(oe,Object(h.a)({},this.state[ye]),ye),Object(te.jsx)(le,Object(h.a)({},this.state[be]),be),Object(te.jsx)(de,Object(h.a)({fixedCosts:this.state[be].value?this.state[ye].value:0,percentageCosts:this.state[be].value?0:this.state[ye].value},this.state.brokerDropdown),Pe),Object(te.jsx)(ne,{title:"Visualization Options"}),Object(te.jsxs)("div",{className:"d-grid gap-0",children:[Object(te.jsx)("div",{className:"p-1",children:Object(te.jsx)(he,Object(h.a)({},this.state[Oe]),Oe)}),Object(te.jsx)(le,Object(h.a)({},this.state.etfAutomaticPercentage),Te),Object(te.jsx)("div",{className:"p-1",children:Object(te.jsx)(fe,Object(h.a)({autoPercentage:this.state.etfAutomaticPercentage.value},this.state.etfDropdownSelection),we)})]})]})}),Object(te.jsxs)("main",{className:"col-md-9 col-lg-10 ms-sm-auto",children:[Object(te.jsx)("h1",{children:"Etf Pension Plan Visualization"}),Object(te.jsx)(ae,Object(h.a)({},e))]})]})]})}}]),a}(i.a.Component),Fe=function(e){e&&e instanceof Function&&a.e(3).then(a.bind(null,168)).then((function(t){var a=t.getCLS,n=t.getFID,i=t.getFCP,r=t.getLCP,s=t.getTTFB;a(e),n(e),i(e),r(e),s(e)}))};s.a.render(Object(te.jsx)(i.a.StrictMode,{children:Object(te.jsx)(Ie,{})}),document.getElementById("root")),Fe()}},[[165,1,2]]]);
//# sourceMappingURL=main.41b29ca7.chunk.js.map