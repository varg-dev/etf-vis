(this["webpackJsonpetf-vis"]=this["webpackJsonpetf-vis"]||[]).push([[0],{158:function(t,e,a){},161:function(t,e,a){"use strict";a.r(e);var n=a(6),i=a.n(n),r=a(48),s=a.n(r),o=(a(158),a(3)),c=a(2),h=a(4),l=a(5),d=a(11),u=a(9),f=a(10),v=a(7),p=a.n(v),y=a(15),x=a(12),g=a(32),m=a.n(g),b=a(8),j=864e5,S=12;function O(t){return 0===t.getMonth()}function C(t,e){return w.apply(this,arguments)}function w(){return(w=Object(y.a)(p.a.mark((function t(e,a){var n;return p.a.wrap((function(t){for(;;)switch(t.prev=t.next){case 0:return t.next=2,b.d("https://www.alphavantage.co/query?function=TIME_SERIES_MONTHLY_ADJUSTED&symbol=".concat(e,"&apikey=").concat(a,"&datatype=csv"),(function(t){return{date:new Date(t.timestamp.toString()),dividend:parseFloat(t["dividend amount"]),course:parseFloat(t["adjusted close"])}}));case 2:return(n=t.sent).sort((function(t,e){return t.date-e.date})),t.abrupt("return",n);case 5:case"end":return t.stop()}}),t)})))).apply(this,arguments)}function P(t){return t.map((function(t){return[T(t.date),t.course]}))}function k(t){var e=t[0].date.getFullYear(),a=[[e,0]];return t.forEach((function(t){t.date.getFullYear()===e?a[a.length-1][1]+=t.dividend:(e=t.date.getFullYear(),a.push([e,t.dividend]))})),a.sort((function(t,e){return t[0]-e[0]})),a}function T(t){return Math.floor(t.getTime()/j)}function A(t){this.message="First call loadHistoricalDataIfNotPresent() before predicting: ".concat(t),this.name="HistoricalDataNotPresentException"}function M(t){var e,a,n=t.getDate(),i=(e=t.getMonth(),a=t.getFullYear(),new Date(a,e+1,0).getDate()),r=Math.round(n/i);return new Date(t.getFullYear(),t.getMonth()+r)}var D=function(){function t(){Object(h.a)(this,t),this.historicalData={},this.coursePredictors={},this.dividendPredictors={}}return Object(l.a)(t,[{key:"loadAndCacheHistoricalETFData",value:function(){var e=Object(y.a)(p.a.mark((function e(a){var n,i,r,s,o;return p.a.wrap((function(e){for(;;)switch(e.prev=e.next){case 0:if(!(a in this.historicalData)){e.next=2;break}return e.abrupt("return");case 2:return e.next=4,C(a);case 4:n=e.sent,i=P(n),r=t._calculateMaxTimestampBeforePredictorRepetition(i),s=k(n),o=t._calculateMaxTimestampBeforePredictorRepetition(s),this.historicalData[a]={history:n,courseForecastArray:i,dividendForecastArray:s},this.coursePredictors[a]={maxTimestampBeforeCoursePredictorRepetition:r},this.dividendPredictors[a]={maxYearBeforeDividendPredictorRepetition:o};case 12:case"end":return e.stop()}}),e,this)})));return function(t){return e.apply(this,arguments)}}()},{key:"_createCoursePredictorIfNotPresent",value:function(e,a){if(!(a in this.coursePredictors[e])){var n=this.historicalData[e].courseForecastArray,i=n[n.length-1][0]-Math.abs(n[n.length-1][0]-a)*t.backCastTimeFactor-t.backCastTimestampConstant,r=n.filter((function(t){return t[0]>=i}));this.coursePredictors[e][a]=m.a.linear(r,{order:2,precision:20})}}},{key:"_courseDateToPredictorTimestampAndDateTimestamp",value:function(t,e){var a=T(t);return[a>this.coursePredictors[e].maxTimestampBeforeCoursePredictorRepetition?this.coursePredictors[e].maxTimestampBeforeCoursePredictorRepetition:a,a]}},{key:"_createDividendPredictorIfNotPresent",value:function(e,a){if(!(a in this.dividendPredictors[e])){var n=this.historicalData[e].dividendForecastArray,i=n[n.length-1][0]-Math.abs(n[n.length-1][0]-a)*t.backCastTimeFactor-t.backCastTimestampConstant,r=n.filter((function(t){return t[0]>=i}));this.dividendPredictors[e][a]=m.a.linear(r,{order:2,precision:20})}}},{key:"_dividendYearToPredictorYear",value:function(t,e){return this.dividendPredictors[t].maxYearBeforeDividendPredictorRepetition<e?this.dividendPredictors[t].maxYearBeforeDividendPredictorRepetition:e}},{key:"predictCourse",value:function(t,e){if(!(t in this.coursePredictors))throw new A(t);var a=this._courseDateToPredictorTimestampAndDateTimestamp(e,t),n=Object(x.a)(a,2),i=n[0],r=n[1];return this._createCoursePredictorIfNotPresent(t,i),this.coursePredictors[t][i].predict(r)[1]}},{key:"predictDividend",value:function(t,e){if(!(t in this.dividendPredictors))throw new A(t);var a=this._dividendYearToPredictorYear(t,e);return this._createDividendPredictorIfNotPresent(t,a),Math.max(0,this.dividendPredictors[t][a].predict(e)[1])}}],[{key:"configure",value:function(e){var a=arguments.length>1&&void 0!==arguments[1]?arguments[1]:2,n=arguments.length>2&&void 0!==arguments[2]?arguments[2]:7;t.apiKey=e,t.backCastTimeFactor=a;var i=new Date(0);if(i.setMonth(n),t.backCastTimestampConstant=T(i),null!=t.instance){var r=t.getInstance();for(var s in r.coursePredictors)r.coursePredictors[s]={maxTimestampBeforeCoursePredictorRepetition:t._calculateMaxTimestampBeforePredictorRepetition(r.historicalData[s].courseForecastArray)};for(var o in r.dividendPredictors)r.dividendPredictors[o]={maxYearBeforeDividendPredictorRepetition:t._calculateMaxTimestampBeforePredictorRepetition(r.historicalData[o].dividendForecastArray)}}}},{key:"getInstance",value:function(){return null==t.instance&&(t.instance=new t),t.instance}},{key:"_calculateMaxTimestampBeforePredictorRepetition",value:function(e){var a=e[0][0],n=e[e.length-1][0];return n+(n-a)/t.backCastTimeFactor}}]),t}();D.instance=null,D.apiKey=null,D.backCastTimeConstant=null,D.backCastTimeFactor=null;var I=D,F=a(1),_=.26375;function E(t){var e=new Date(t);return e.setMonth(t.getMonth()+1),e}function N(t,e){return function(t){return 11===t.getMonth()}(e)?I.getInstance().predictDividend(t,e.getFullYear()):0}function R(t,e){var a=t*e.percentageCosts+e.fixedCosts,n=Math.max(t-a,0);return[n,a=t-n]}function Y(t,e){return[Math.max(0,t-e),Math.max(0,e-t)]}function V(t,e){return e.totalShares[t]*e.sharePrizes[t]}function z(t,e){return e.newShares[t]*e.sharePrizes[t]}function B(t,e,a){var n=function(t){var e=0;for(var a in t.totalShares)e+=V(a,t);return e}(t),i=a.getFullYear()-e.getFullYear()+(a.getMonth()-e.getMonth())/S;t.inflation=n-n*Math.pow(.99,i)}function L(t,e,a,n,i,r){var s=I.getInstance(),o=0,h=t[t.length-1],l={date:a,newShares:{},totalShares:Object(c.a)({},h.totalShares),dividendNewShares:{},dividendTotalShares:Object(c.a)({},h.dividendTotalShares),totalCosts:h.totalCosts,sharePrizes:{},totalInvestedMoney:Object(c.a)({},h.totalInvestedMoney),newInvestedMoney:{},totalTaxes:h.totalTaxes,totalPayout:Object(c.a)({},h.totalPayout),newPayout:{}};for(var d in i){var u=R(i[d]*e,r.costConfig),f=Object(x.a)(u,2),v=f[0];o+=f[1],l.newInvestedMoney[d]=v,l.totalInvestedMoney[d]+=v;var p=s.predictCourse(d,a),y=v/p;l.sharePrizes[d]=p,l.newShares[d]=y;var g=N(d,a),m=l.totalShares[d]*g/p;l.newShares[d]+=m,l.dividendNewShares[d]=m,l.dividendTotalShares[d]+=m,l.totalShares[d]+=l.newShares[d],l.newPayout[d]=0}l.totalCosts+=o;var b=function(t,e,a,n){if(!O(e)||t.length<2)return[0,a];var i,r,s,o=0,c=t[t.length-1],h=t.length-S>1?t[t.length-S]:t[1];for(var l in n){for(var d=0,u=1;u<S&&t.length-u>0;u++)d+=z(l,t[t.length-u])*u/S;d+=V(l,h)*(S-h.date.getMonth())/S,d*=.0049;var f=V(l,c)-c.totalInvestedMoney[l],v=0;t.length>S&&(v=Math.max(0,V(l,t[t.length-1-S])-t[t.length-1-S].totalInvestedMoney[l]));var p=(i=f-v,r=0,s=d,Math.max(r,Math.min(i,s))),y=Y(p,a),g=Object(x.a)(y,2);p=g[0],a=g[1],o+=.7*p*_}return[o,a]}(t,a,r.taxFreeAmount,i),j=Object(x.a)(b,2),C=j[0],w=j[1];return l.totalTaxes+=C,B(l,n,a),t.push(l),w}function W(t,e,a,n,i,r,s,o,h){O(n)&&(o=r.taxFreeAmount);var l=I.getInstance(),d=0,u=0,f=t[t.length-1],v={date:n,newShares:{},totalShares:Object(c.a)({},f.totalShares),dividendNewShares:{},dividendTotalShares:Object(c.a)({},f.dividendTotalShares),totalCosts:f.totalCosts,sharePrizes:{},totalInvestedMoney:Object(c.a)({},f.totalInvestedMoney),newInvestedMoney:{},totalTaxes:f.totalTaxes,totalPayout:Object(c.a)({},f.totalPayout),newPayout:{}};for(var p in a){var y=l.predictCourse(p,n);if(v.sharePrizes[p]=y,v.newPayout[p]=0,v.newInvestedMoney[p]=0,h[p].investmentStepsIdx<t.length){for(var g=e*a[p],m=0,b=R(g,r.costConfig)[1],j=0,S=h[p].investmentStepsIdx,C=t[S].newShares[p]-h[p].alreadySoldShares;S<t.length;S++){var w=g-m,P=t[S],k=y*(S===h[p].investmentStepsIdx?P.newShares[p]-h[p].alreadySoldShares:P.newShares[p]),T=Math.min(k,w),A=T/y;C=P.newShares[p]-A,C-=S===h[p].investmentStepsIdx?h[p].alreadySoldShares:0;var M=Math.max(0,T-(b-j));j+=Math.max(0,T-M);var D=A*P.sharePrizes[p],F=Math.max(0,M-D),E=Y(F,o),V=Object(x.a)(E,2);F=V[0],o=V[1];var z=.7*F*_,L=Y(z,s),W=Object(x.a)(L,2);z=W[0],s=W[1],u+=z;var G=M-z;v.newPayout[p]+=G,v.totalPayout[p]+=G,v.totalShares[p]-=A,m+=T;var H=0;H=S===h[p].investmentStepsIdx?Math.max(0,P.dividendNewShares[p]-h[p].alreadySoldShares):P.dividendNewShares[p];var U=Math.min(H,A);if(v.dividendTotalShares[p]-=U,m>=g)break}d+=j,h[p].investmentStepsIdx=S,h[p].investmentStepsIdx+=0===C?1:0,h[p].alreadySoldShares=S<t.length?t[S].newShares[p]-C:0}var J=v.totalShares[p]*N(p,n)/y;v.newShares[p]=J,v.totalShares[p]+=J,v.dividendNewShares[p]=J,v.dividendTotalShares[p]+=J}return v.totalCosts+=d,v.totalTaxes+=u,B(v,i,n),t.push(v),[s,o]}function G(t,e){var a=I.getInstance(),n={date:e,totalCosts:0,totalTaxes:0,newShares:{},totalShares:{},dividendNewShares:{},dividendTotalShares:{},totalInvestedMoney:{},totalPayout:{},newPayout:{},sharePrizes:{}};for(var i in t)n.newShares[i]=0,n.totalShares[i]=0,n.dividendNewShares[i]=0,n.dividendTotalShares[i]=0,n.totalInvestedMoney[i]=0,n.totalPayout[i]=0,n.newPayout[i]=0,n.sharePrizes[i]=a.predictCourse(i,e);return n}var H=function(){function t(e,a,n,i,r,s,o,c){Object(h.a)(this,t),this.startCapital=e,this.monthlyInvestment=a,this.monthlyPayout=n,this.savingPhaseLength=i,this.etfToRatio=r,this.configOptions=s,this.expectationOfLife=c,this.age=o,this._calculateTimestampsForModel(),this._calculateModel()}return Object(l.a)(t,[{key:"_calculateTimestampsForModel",value:function(){for(var t=function(t,e,a){var n=arguments.length>3&&void 0!==arguments[3]?arguments[3]:10,i=e-t,r=new Date,s=new Date(r.getFullYear(),r.getMonth()+1),o=new Date(s);o.setFullYear(s.getFullYear()+a);var c=new Date(s);return c.setFullYear(s.getFullYear()+i+n),[s,o,c]}(this.age,this.expectationOfLife,this.savingPhaseLength),e=Object(x.a)(t,3),a=e[0],n=e[1],i=e[2],r=[],s=a;s<n;s=E(s))r.push(s);this.savingDates=r;for(var o=[],c=n;c<i;c=E(c))o.push(c);this.payoutDates=o,this.initialDate=a}},{key:"_calculateModel",value:function(){var t,e=[G(this.etfToRatio,this.savingDates[0])],a=L(e,this.monthlyInvestment+this.startCapital,this.savingDates[0],this.initialDate,this.etfToRatio,this.configOptions),n=Object(F.a)(this.savingDates.slice(1));try{for(n.s();!(t=n.n()).done;){var i=t.value;a=L(e,this.monthlyInvestment,i,this.initialDate,this.etfToRatio,this.configOptions)}}catch(f){n.e(f)}finally{n.f()}var r=(e=e.slice(1))[e.length-1].totalTaxes,s={};for(var o in this.etfToRatio)s[o]={investmentStepsIdx:0,alreadySoldShares:0};var c,h=Object(F.a)(this.payoutDates);try{for(h.s();!(c=h.n()).done;){var l=c.value,d=W(e,this.monthlyPayout,this.etfToRatio,l,this.initialDate,this.configOptions,r,a,s),u=Object(x.a)(d,2);r=u[0],a=u[1]}}catch(f){h.e(f)}finally{h.f()}this.investmentSteps=e}}]),t}();function U(t){var e,a=Object(F.a)(J.activeStrategies);try{for(a.s();!(e=a.n()).done;){e.value.interaction.style("display",t)}}catch(n){a.e(n)}finally{a.f()}}var J=function(){function t(e,a,n,i){var r=arguments.length>4&&void 0!==arguments[4]?arguments[4]:1100,s=arguments.length>5&&void 0!==arguments[5]?arguments[5]:300,o=arguments.length>6&&void 0!==arguments[6]?arguments[6]:150,c=arguments.length>7&&void 0!==arguments[7]?arguments[7]:40;if(Object(h.a)(this,t),this.constructor===t)throw new Error("Abstract classes can't be instantiated.");t.activeStrategies.push(this),this.investmentSteps=e,this.payoutPhaseStartDate=n,this.marginW=o,this.marginH=c,this.width=r,this.height=s,this.lineStrokeWidth=3,a.innerHTML="",this.svg=b.m(a).append("svg").attr("id",i).attr("viewBox","0 0 ".concat(this.width+2*this.marginW," ").concat(this.height+2*this.marginH)).append("g").attr("transform","translate(".concat([this.marginW,this.marginH],")"))}return Object(l.a)(t,[{key:"render",value:function(){this._prepareData(),this._calculateExtents(),this._createScales(),this._drawContent(),this._prepareText(),this._drawText(),this._drawAxis(),this._addInteraction()}},{key:"_calculateExtents",value:function(){var t=this;this.dateExtent=b.f(this.dataArray[0],(function(t){return t.date}));var e=new Date(this.payoutPhaseStartDate);e.setMonth(e.getMonth()+S);var a=this.dataArray[this.maxIndex].filter((function(a){return a.date<=e&&a.date>t.dateExtent[0]})),n=this.dataArray[this.minIndex].filter((function(t){return t.date<=e})),i=b.h(a.map((function(t){return t.yStart}))),r=b.i(n.map((function(t){return t.yEnd})));this.yExtent=[r,i]}},{key:"_createScales",value:function(){this.yScale=b.k().domain(this.yExtent).range([this.height,0]),this.xScale=b.l().domain(this.dateExtent).range([0,this.width])}},{key:"_drawAxis",value:function(){this.svg.append("g").style("font-size","20px").call(b.c(this.yScale).tickFormat((function(t){return"".concat(t.toLocaleString()," EUR")}))),this.svg.append("g").style("font-size","20px").attr("transform","translate(0, ".concat(this.height,")")).call(b.b(this.xScale)),this.svg.append("g").append("line").attr("x1",this.xScale(this.dateExtent[0])).attr("y1",this.yScale(0)).attr("x2",this.xScale(this.dateExtent[1])).attr("y2",this.yScale(0)).style("stroke-width",this.lineStrokeWidth).style("stroke","black"),this.svg.append("g").append("line").attr("x1",this.xScale(this.payoutPhaseStartDate)).attr("y1",this.yScale(this.yExtent[0])).attr("x2",this.xScale(this.payoutPhaseStartDate)).attr("y2",this.yScale(this.yExtent[1])).style("stroke-width",this.lineStrokeWidth).style("stroke","black")}},{key:"_addInteraction",value:function(){var t=this;this.interaction=this.svg.append("g").attr("class","interaction").style("display","none"),this.hoverLine=this.interaction.append("line").attr("class","tooltipLine").style("stroke","blue").style("stroke-dasharray","3,3").style("opacity",.5).attr("y1",this.yScale(this.yExtent[0])).attr("y2",this.yScale(this.yExtent[1])),this.svg.append("rect").attr("class","mouseEvent").attr("transform","translate(".concat([0,-this.marginH],")")).attr("height",this.height+2*this.marginH).attr("width",this.width).attr("fill","none").style("pointer-events","all").on("mouseover",(function(){return U(null)})).on("mouseout",(function(){return U("none")})).on("mousemove",(function(e){return t._handleTooltipEvent(e)}))}},{key:"_handleTooltipEvent",value:function(e){var a,n=b.j(e)[0],i=M(this.xScale.invert(n)),r=Object(F.a)(t.activeStrategies);try{for(r.s();!(a=r.n()).done;){var s=a.value;s.hoverLine.attr("x1",this.xScale(i)).attr("x2",this.xScale(i)),s._updateTooltip()}}catch(o){r.e(o)}finally{r.f()}}},{key:"_drawText",value:function(){this.svg.append("g").attr("class","textGroup").selectAll("text").data(this.textProperties).enter().append("text").text((function(t){return t.text})).attr("x",(function(t){return t.x})).attr("y",(function(t){return t.y})).style("font-size",(function(t){return t.fontSize})).style("font-weight",(function(t){return t.fontWeight})).style("text-anchor",(function(t){return t.textAnchor}))}},{key:"_prepareText",value:function(){var t=this.xScale(this.dateExtent[0])+(this.xScale(this.payoutPhaseStartDate)-this.xScale(this.dateExtent[0]))/2,e=this.xScale(this.payoutPhaseStartDate)+(this.xScale(this.dateExtent[1])-this.xScale(this.payoutPhaseStartDate))/2,a=-10,n="20px";this.textProperties=[{text:"SAVING",x:t,y:a,fontSize:n,textAnchor:"end",fontWeight:"bold"},{text:"Phase",x:t,y:a,fontSize:n,textAnchor:"start",fontWeight:"normal"},{text:"PAYOUT",x:e,y:a,fontSize:n,textAnchor:"end",fontWeight:"bold"},{text:"Phase",x:e,y:a,fontSize:n,textAnchor:"start",fontWeight:"normal"}]}},{key:"_prepareData",value:function(){throw new Error("Abstract method. Not Implemented")}},{key:"_drawContent",value:function(){throw new Error("Abstract method. Not Implemented")}},{key:"_updateTooltip",value:function(){throw new Error("Abstract method. Not Implemented")}}],[{key:"reset",value:function(){t.activeStrategies=[]}}]),t}();J.activeStrategies=[];var K=function(t){Object(u.a)(a,t);var e=Object(f.a)(a);function a(t,n,i){var r;return Object(h.a)(this,a),(r=e.call(this,t,n,i,"firstSVG")).etfLineColors={IBM:{total:"#0562a0",dividend:"#71c1f7"}},r.lineOpacity=.7,r}return Object(l.a)(a,[{key:"_prepareData",value:function(){var t={costs:0,taxes:1,inflation:2},e=3,a="capital",n="dividend";for(var i in this.investmentSteps[0].totalShares)t[i+n]=e++,t[i+a]=e++;this.minIndex=t.inflation,this.maxIndex=e-1,this.dataArray=[];for(var r=0;r<e;r++)this.dataArray.push([]);var s,o=Object(F.a)(this.investmentSteps);try{for(o.s();!(s=o.n()).done;){var c=s.value;this.dataArray[t.costs].push({yStart:0,yEnd:-c.totalCosts,date:c.date}),this.dataArray[t.taxes].push({yStart:-c.totalCosts,yEnd:-c.totalCosts-c.totalTaxes,date:c.date}),this.dataArray[t.inflation].push({yStart:-c.totalCosts-c.totalTaxes,yEnd:-c.totalCosts-c.totalTaxes-c.inflation,date:c.date});var h=0;for(var l in c.totalShares){var d=V(l,c),u=c.dividendTotalShares[l]*c.sharePrizes[l];this.dataArray[t[l+a]].push({yStart:d+h,yEnd:d-u+h,date:c.date}),this.dataArray[t[l+n]].push({yStart:d-u+h,yEnd:h,date:c.date}),h+=d}}}catch(v){o.e(v)}finally{o.f()}for(var f in this.dataArray[t.inflation].color="#ff7f00",this.dataArray[t.taxes].color="#e31a1c",this.dataArray[t.costs].color="#be3bff",this.investmentSteps[0].totalShares)this.dataArray[t[f+n]].color=this.etfLineColors[f].dividend,this.dataArray[t[f+a]].color=this.etfLineColors[f].total}},{key:"_drawLines",value:function(){for(var t=this,e=0;e<this.dataArray.length;e++)this.svg.append("path").datum(this.dataArray[e]).style("stroke",(function(t){return t.color})).style("stroke-width",this.lineStrokeWidth).style("opacity",this.lineOpacity).style("fill","none").attr("d",b.g().x((function(e){return t.xScale(e.date)})).y((function(e){return t.yScale(e.yStart)})))}},{key:"_drawContent",value:function(){this._drawArea()}},{key:"_drawArea",value:function(){for(var t=this,e=0;e<this.dataArray.length;e++)this.svg.append("path").datum(this.dataArray[e]).style("opacity",this.lineOpacity).style("fill",(function(t){return t.color})).attr("d",b.a().curve(b.e).x((function(e){return t.xScale(e.date)})).y0((function(e){return t.yScale(e.yEnd)})).y1((function(e){return t.yScale(e.yStart)})))}},{key:"_updateTooltip",value:function(){}}]),a}(J),q=a(51),Q=a(14),X=function(t){Object(u.a)(a,t);var e=Object(f.a)(a);function a(t,n,i){var r;return Object(h.a)(this,a),(r=e.call(this,t,n,i,"secondSVG")).barPaddingPercentage=.9,r.zeroLineStrokeWidth=3,r}return Object(l.a)(a,[{key:"render",value:function(){Object(q.a)(Object(Q.a)(a.prototype),"render",this).call(this)}},{key:"_prepareData",value:function(){var t=0,e=1;this.minIndex=t,this.maxIndex=e,this.dataArray=[[],[]];var a,n=Object(F.a)(this.investmentSteps);try{for(n.s();!(a=n.n()).done;){var i=a.value,r=0,s=0;for(var o in i.newInvestedMoney)r+=i.newInvestedMoney[o],s+=i.newPayout[o];this.dataArray[t].push({yStart:0,yEnd:-r,date:i.date,color:"#b4291f"}),this.dataArray[e].push({yStart:s,yEnd:0,date:i.date,color:"#0562a0"})}}catch(c){n.e(c)}finally{n.f()}this.rectWidth=this.width/this.dataArray[t].length*this.barPaddingPercentage}},{key:"_drawContent",value:function(){var t,e=this,a=Object(F.a)(this.dataArray);try{for(a.s();!(t=a.n()).done;){var n=t.value;this.svg.selectAll("rect.none").data(n).enter().append("rect").style("fill",(function(t){return t.color})).attr("x",(function(t){return e.xScale(t.date)})).attr("width",this.rectWidth).attr("y",(function(t){return e.yScale(t.yStart)})).attr("height",(function(t){return e.yScale(t.yEnd)-e.yScale(t.yStart)}))}}catch(i){a.e(i)}finally{a.f()}}},{key:"_updateTooltip",value:function(){}}]),a}(J),Z=a(0);function $(){return tt.apply(this,arguments)}function tt(){return(tt=Object(y.a)(p.a.mark((function t(){var e;return p.a.wrap((function(t){for(;;)switch(t.prev=t.next){case 0:return I.configure("demo"),e=I.getInstance(),t.next=4,e.loadAndCacheHistoricalETFData("IBM");case 4:console.log("Finished loading the historic data.");case 5:case"end":return t.stop()}}),t)})))).apply(this,arguments)}var et=function(t){Object(u.a)(a,t);var e=Object(f.a)(a);function a(t){var n;return Object(h.a)(this,a),(n=e.call(this,t)).firstSVGRef=i.a.createRef(),n.secondSVGRef=i.a.createRef(),n}return Object(l.a)(a,[{key:"getInvestmentModel",value:function(){return new H(this.props[rt],this.props[st],this.props[ut],this.props[ht],{IBM:1},{taxFreeAmount:this.props[dt],costConfig:(t=this.props,t[ct]?{percentageCosts:0,fixedCosts:t[ot]}:{percentageCosts:t[ot],fixedCosts:0})},this.props[lt],this.props[ft]);var t}},{key:"adjustInvestmentStepsToLevelOfDetail",value:function(t){if(this.props[vt])return t;var e=t[0].date.getMonth();return t.filter((function(t){return t.date.getMonth()===e}))}},{key:"drawVisualization",value:function(){J.reset();var t=this.getInvestmentModel(),e=t.payoutDates[0],a=this.adjustInvestmentStepsToLevelOfDetail(t.investmentSteps);new K(a,this.firstSVGRef.current,e).render(),new X(a,this.secondSVGRef.current,e).render()}},{key:"componentDidMount",value:function(){var t=Object(y.a)(p.a.mark((function t(){return p.a.wrap((function(t){for(;;)switch(t.prev=t.next){case 0:return t.next=2,$();case 2:this.drawVisualization();case 3:case"end":return t.stop()}}),t,this)})));return function(){return t.apply(this,arguments)}}()},{key:"componentDidUpdate",value:function(){this.drawVisualization()}},{key:"render",value:function(){return Object(Z.jsxs)(i.a.Fragment,{children:[Object(Z.jsx)("div",{ref:this.secondSVGRef}),Object(Z.jsx)("div",{ref:this.firstSVGRef})]})}}]),a}(i.a.Component),at=function(t){Object(u.a)(a,t);var e=Object(f.a)(a);function a(t){var n;return Object(h.a)(this,a),(n=e.call(this,t)).handleChange=n.handleChange.bind(Object(d.a)(n)),n}return Object(l.a)(a,[{key:"handleChange",value:function(t){this.props.onValueChange(this.props.transformFunction(t,this),this.props.identifier)}},{key:"render",value:function(){return Object(Z.jsxs)(i.a.Fragment,{children:[Object(Z.jsx)("label",{className:"form-label",htmlFor:this.props.identifier,children:this.props.label}),Object(Z.jsx)("input",{className:"form-control",id:this.props.identifier,type:this.props.type,value:this.props.value.toString()+" "+this.props.textAppending,onChange:this.handleChange})]})}}]),a}(i.a.Component),nt=function(t){Object(u.a)(a,t);var e=Object(f.a)(a);function a(t){var n;return Object(h.a)(this,a),(n=e.call(this,t)).handleChange=n.handleChange.bind(Object(d.a)(n)),n}return Object(l.a)(a,[{key:"handleChange",value:function(t){this.props.onValueChange(this.props.identifier)}},{key:"render",value:function(){return Object(Z.jsxs)("div",{className:"checkbox-element",children:[Object(Z.jsx)("input",{className:"form-check-input",id:this.props.identifier,type:this.props.type,value:this.props.value,onChange:this.handleChange}),Object(Z.jsx)("label",{className:"form-check-label",htmlFor:this.props.identifier,children:this.props.label})]})}}]),a}(i.a.Component);function it(t){return Object(Z.jsx)("h6",{className:"sidebar-heading d-flex justify-content-between align-items-center px-3 mt-4 mb-1 text-muted",children:Object(Z.jsx)("span",{children:t.title})})}var rt="startingCapital",st="monthlyInvestment",ot="transactionCosts",ct="transactionCostsType",ht="savingPhase",lt="age",dt="taxFreeAmount",ut="monthlyPayout",ft="lifeExpectation",vt="detailedGraph";function pt(t,e){var a=parseInt(t.target.value.split(" ",1));return isNaN(a)?0:a}function yt(t,e){var a=parseFloat(t.target.value);return isNaN(a)?0:a}var xt=function(t){Object(u.a)(a,t);var e=Object(f.a)(a);function a(t){var n;return Object(h.a)(this,a),(n=e.call(this,t)).handleTextChange=n.handleTextChange.bind(Object(d.a)(n)),n.handleCheckBoxChange=n.handleCheckBoxChange.bind(Object(d.a)(n)),n.state=function(t){var e;return e={},Object(o.a)(e,rt,{value:1e3,type:"text",label:"Starting Capital",textAppending:"\u20ac",identifier:rt,transformFunction:pt,onValueChange:t.handleTextChange}),Object(o.a)(e,st,{value:100,type:"text",label:"Monthly Investment",textAppending:"\u20ac",identifier:st,transformFunction:pt,onValueChange:t.handleTextChange}),Object(o.a)(e,ut,{value:1e3,type:"text",label:"Monthly Payout",textAppending:"\u20ac",identifier:ut,transformFunction:pt,onValueChange:t.handleTextChange}),Object(o.a)(e,ot,{value:.005,type:"text",label:"Transaction Costs",textAppending:"%",identifier:ot,transformFunction:yt,onValueChange:t.handleTextChange}),Object(o.a)(e,ct,{value:!1,type:"checkbox",label:"Fixed Amount",textAppending:"",identifier:ct,onValueChange:t.handleCheckBoxChange}),Object(o.a)(e,ht,{value:40,type:"text",label:"Saving Phase",textAppending:"Y",identifier:ht,transformFunction:pt,onValueChange:t.handleTextChange}),Object(o.a)(e,lt,{value:30,type:"text",label:"Your Age",textAppending:"Y",identifier:lt,transformFunction:pt,onValueChange:t.handleTextChange}),Object(o.a)(e,dt,{value:801,type:"text",label:"Tax Free Amount",textAppending:"\u20ac",identifier:dt,transformFunction:pt,onValueChange:t.handleTextChange}),Object(o.a)(e,ft,{value:80,type:"text",label:"Life Expectation",textAppending:"Y",identifier:ft,transformFunction:pt,onValueChange:t.handleTextChange}),Object(o.a)(e,vt,{value:!1,type:"checkbox",label:"Detailed Graph",textAppending:"",identifier:vt,onValueChange:t.handleCheckBoxChange}),e}(Object(d.a)(n)),n}return Object(l.a)(a,[{key:"handleTextChange",value:function(t,e){var a=Object(c.a)({},this.state[e]);a.value=t,this.setState(Object(o.a)({},e,a))}},{key:"handleCheckBoxChange",value:function(t){var e=Object(c.a)({},this.state[t]);if(e.value=!e.value,this.setState(Object(o.a)({},t,e)),t===ct){var a=Object(c.a)({},this.state[ot]);a.value=e.value?5:.005,a.textAppending=e.value?"\u20ac":"%",a.transformFunction=e.value?pt:yt,this.setState(Object(o.a)({},ot,a))}}},{key:"render",value:function(){var t=function(t){var e={};for(var a in t)e[a]=t[a].value;return e}(this.state);return Object(Z.jsx)("div",{className:"container-fluid",children:Object(Z.jsxs)("div",{className:"row",children:[Object(Z.jsx)("nav",{id:"sidebarMenu",className:"col-md-3 col-lg-2 bg-light sidebar",children:Object(Z.jsxs)("form",{className:"position-sticky",children:[Object(Z.jsx)(it,{title:"Money Options"}),Object(Z.jsx)(at,Object(c.a)({},this.state[rt]),rt),Object(Z.jsx)(at,Object(c.a)({},this.state[st]),st),Object(Z.jsx)(at,Object(c.a)({},this.state[ut]),ut),Object(Z.jsx)(at,Object(c.a)({},this.state[dt]),dt),Object(Z.jsx)(it,{title:"Time Options"}),Object(Z.jsx)(at,Object(c.a)({},this.state[lt]),lt),Object(Z.jsx)(at,Object(c.a)({},this.state[ft]),ft),Object(Z.jsx)(at,Object(c.a)({},this.state[ht]),ht),Object(Z.jsx)(it,{title:"Cost Options"}),Object(Z.jsx)(at,Object(c.a)({},this.state[ot]),ot),Object(Z.jsx)(nt,Object(c.a)({},this.state[ct]),ct),Object(Z.jsx)(it,{title:"Visualization Options"}),Object(Z.jsx)(nt,Object(c.a)({},this.state[vt]),vt)]})}),Object(Z.jsxs)("main",{className:"col-md-9 col-lg-10 ms-sm-auto",children:[Object(Z.jsx)("h1",{children:"Etf Pension Plan Visualization"}),Object(Z.jsx)(et,Object(c.a)({},t))]})]})})}}]),a}(i.a.Component);var gt=function(){return Object(Z.jsx)("div",{className:"Input",children:Object(Z.jsx)(xt,{})})},mt=function(t){t&&t instanceof Function&&a.e(3).then(a.bind(null,162)).then((function(e){var a=e.getCLS,n=e.getFID,i=e.getFCP,r=e.getLCP,s=e.getTTFB;a(t),n(t),i(t),r(t),s(t)}))};s.a.render(Object(Z.jsx)(i.a.StrictMode,{children:Object(Z.jsx)(gt,{})}),document.getElementById("root")),mt()}},[[161,1,2]]]);
//# sourceMappingURL=main.92c61af1.chunk.js.map