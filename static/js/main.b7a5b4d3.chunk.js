(this["webpackJsonpetf-vis"]=this["webpackJsonpetf-vis"]||[]).push([[0],{159:function(t,e,a){},160:function(t,e,a){},163:function(t,e,a){"use strict";a.r(e);var n=a(8),i=a.n(n),s=a(47),r=a.n(s),o=(a(159),a(160),a(6)),u=a(7),c=a(13),l=a(26),h=a(29),d=a(0),f=a(5),p=a(3),v=a.n(p),g=a(14),m=a(50),y=a.n(m),b=a(1),x=36e5,j=12;function O(t){return 0===t.getMonth()}function C(t,e){return t.getFullYear()<e.getFullYear()}function D(t,e){return k.apply(this,arguments)}function k(){return(k=Object(g.a)(v.a.mark((function t(e,a){var n;return v.a.wrap((function(t){for(;;)switch(t.prev=t.next){case 0:return t.next=2,b.c("https://www.alphavantage.co/query?function=TIME_SERIES_MONTHLY_ADJUSTED&symbol=".concat(e,"&apikey=").concat(a,"&datatype=csv"),(function(t){return{timestamp:new Date(t.timestamp.toString()),dividend:parseFloat(t["dividend amount"]),course:parseFloat(t["adjusted close"])}}));case 2:return(n=t.sent).sort((function(t,e){return t.timestamp-e.timestamp})),t.abrupt("return",n);case 5:case"end":return t.stop()}}),t)})))).apply(this,arguments)}function F(t){return t.map((function(t){return[M(t.timestamp),t.course]}))}function M(t){return Math.floor(t.getTime()/x)}var w=function(){function t(e){var a=arguments.length>1&&void 0!==arguments[1]?arguments[1]:2,n=arguments.length>2&&void 0!==arguments[2]?arguments[2]:7;Object(o.a)(this,t),this.historicalData={},this.predictors={},this.backCastTimeFactor=a,this.apiKey=e;var i=new Date(0);i.setMonth(n),this.backCastTimestampConstant=M(i)}return Object(u.a)(t,[{key:"_loadHistoricalDataIfNotPresent",value:function(){var t=Object(g.a)(v.a.mark((function t(e){var a,n,i,s,r;return v.a.wrap((function(t){for(;;)switch(t.prev=t.next){case 0:if(!(e in this.historicalData)){t.next=2;break}return t.abrupt("return");case 2:return t.next=4,D(e);case 4:a=t.sent,n=F(a),i=n[0][0],s=n[n.length-1][0],r=s+(s-i)/this.backCastTimeFactor,this.historicalData[e]={history:a,forecastArray:n,maxTimestampBeforePredictorRepetition:r};case 10:case"end":return t.stop()}}),t,this)})));return function(e){return t.apply(this,arguments)}}()},{key:"_createPredictorIfNotPresent",value:function(t,e){if(t in this.predictors||(this.predictors[t]={}),!(e in this.predictors[t])){var a=this.historicalData[t].forecastArray,n=a[a.length-1][0]-Math.abs(a[a.length-1][0]-e)*this.backCastTimeFactor-this.backCastTimestampConstant,i=a.filter((function(t){return t[0]>=n}));this.predictors[t][e]=y.a.linear(i)}}},{key:"_dateToPredictorTimestampAndDateTimestamp",value:function(t){var e=M(t);return[e>this.maxTimestampBeforePredictorRepetition?this.maxTimestampBeforePredictorRepetition:e,e]}},{key:"predict",value:function(){var t=Object(g.a)(v.a.mark((function t(e,a){var n,i,s,r;return v.a.wrap((function(t){for(;;)switch(t.prev=t.next){case 0:return t.next=2,this._loadHistoricalDataIfNotPresent(e,this.apiKey);case 2:return n=this._dateToPredictorTimestampAndDateTimestamp(a),i=Object(f.a)(n,2),s=i[0],r=i[1],this._createPredictorIfNotPresent(e,s),t.abrupt("return",this.predictors[e][s].predict(r)[1]);case 5:case"end":return t.stop()}}),t,this)})));return function(e,a){return t.apply(this,arguments)}}()}]),t}(),T=.26375;function A(t){return.025*t}function I(t,e){var a=t*e.percentageCosts+e.fixedCosts;return[t-a,a]}function P(t,e,a,n,i){if(!C(n,i))return[0,e];var s=function(t,e){return Math.min(.7*t*.09,e)}(a,t);return function(t,e){return[Math.max(0,t-e),Math.max(0,e-t)]}(.7*s*T,e)}var R=function(){function t(e,a,n,i,s,r,u,c){Object(o.a)(this,t),this.initialDate=e,this.lastYearModelValues=u,this.startDate=a,this.newInvestmentAmount=i,this.endDate=n,this.etfIdentifierToRatio=s,this.costConfiguration=r,this.values={costs:u.costs,taxes:u.taxes,etfs:{},yearBeginningCapital:O(this.startDate)?u.totalAmount:u.yearBeginningCapital,totalAmount:0,investedMoney:u.investedMoney+i,leftoverTaxFreeAmount:O(this.startDate)?c:u.leftoverTaxFreeAmount},this.calculate()}return Object(u.a)(t,[{key:"calculate",value:function(){var t=new Date(this.endDate-this.startDate),e=t.getFullYear()-new Date(0).getFullYear()+t.getMonth()/j;for(var a in this.lastYearModelValues.etfs){var n=this.etfIdentifierToRatio[a]*this.newInvestmentAmount;this.values.etfs[a]={},this.calculateNextEtfValueAndCosts(a,n,e)}var i=I(this.newInvestmentAmount,this.costConfiguration),s=Object(f.a)(i,1)[0],r=P(this.values.totalAmount-this.values.yearBeginningCapital-s,this.values.leftoverTaxFreeAmount,this.values.yearBeginningCapital,this.startDate,this.endDate),o=Object(f.a)(r,2),u=o[0],c=o[1];this.values.taxes+=u,this.values.leftoverTaxFreeAmount=c,this.values.inflation=function(t,e,a){var n=a.getFullYear()-e.getFullYear()+(a.getMonth()-e.getMonth())/j;return t-t*Math.pow(.99,n)}(this.values.totalAmount,this.initialDate,this.endDate)}},{key:"calculateNextEtfValueAndCosts",value:function(t,e,a){var n,i,s=this.lastYearModelValues.etfs[t],r=A(s.capital),o=A(s.dividend),u=function(t,e,a){for(var n=Math.round(e*j),i=I(t/n,a),s=Object(f.a)(i,2),r=s[0],o=s[1]*n,u=0,c=0,l=n;l>0;l--)u+=r,c+=A(r,l);return[u,c,o]}(e,a,this.costConfiguration),c=Object(f.a)(u,3),l=c[0],h=c[1],d=c[2],p=(n=this.startDate,i=this.endDate,C(n,i)?500:0),v=r+o+h+p,g=s.capital+v+l;this.values.etfs[t].capital=g,this.values.etfs[t].dividend=s.dividend+p+o,this.values.totalAmount+=g,this.values.costs+=d}},{key:"getD3Representation",value:function(){return null}}],[{key:"getInitialModelValues",value:function(t,e,a,n,i){for(var s=I(t,a),r=Object(f.a)(s,2),o=r[0],u={costs:r[1],taxes:0,inflation:0,investedMoney:t,etfs:{},yearBeginningCapital:o,totalAmount:o,leftoverTaxFreeAmount:n},c=0,l=Object.entries(e);c<l.length;c++){var h=Object(f.a)(l[c],2),d=h[0],p=h[1];u.etfs[d]={capital:p*o,dividend:0}}return{values:u,endDate:i}}}]),t}();function V(t,e){var a=t.getMonth()+e,n=a%j,i=t.getFullYear()+Math.floor(a/j);return new Date(i,n)}var Y,S=function(){function t(e,a,n,i,s,r,u){var c=arguments.length>7&&void 0!==arguments[7]?arguments[7]:j;if(Object(o.a)(this,t),!Number.isInteger(c/j))throw"currently only month lengths that are a factor of ".concat(j," are allowed.");this.taxFreeAmount=u,this.startCapital=e,this.investmentPerPeriod=a*c,this.savingPhaseLength=n,this.etfIdentifierToRatio=i,this.costConfiguration=s,this.age=r,this.intervalLengthInMonths=c,this._calculateTimestampsForVisualization(),this._calculateAllYearModels()}return Object(u.a)(t,[{key:"_calculateTimestampsForVisualization",value:function(){for(var t=function(t){var e=arguments.length>2&&void 0!==arguments[2]?arguments[2]:10,a=(arguments.length>1&&void 0!==arguments[1]?arguments[1]:80)-t,n=new Date(0);n.setFullYear((new Date).getFullYear());var i=new Date(0);return i.setFullYear((new Date).getFullYear()+a+e),[n,i]}(this.age),e=Object(f.a)(t,2),a=e[0],n=e[1],i=[],s=a;s<=n;)i.push(s),s=V(s,this.intervalLengthInMonths);this.dates=i,this.nextFutureDate=s}},{key:"_calculateAllYearModels",value:function(){for(var t=[R.getInitialModelValues(this.startCapital,this.etfIdentifierToRatio,this.costConfiguration,this.taxFreeAmount,this.dates[0])],e=0;e<this.dates.length-1;e++){var a=t[t.length-1].values;t.push(new R(this.dates[0],this.dates[e],this.dates[e+1],this.investmentPerPeriod,this.etfIdentifierToRatio,this.costConfiguration,a,this.taxFreeAmount))}this.dates.length>1&&(t.push(new R(this.dates[0],this.dates[this.dates.length-1],this.nextFutureDate,this.investmentPerPeriod,this.etfIdentifierToRatio,this.costConfiguration,t[t.length-1].values,this.taxFreeAmount)),this.yearModels=t)}},{key:"renderVisualization",value:function(t){for(var e=1e3,a=b.i(t).append("svg").attr("id","firstSVG").attr("height","100%").attr("width","100%").attr("viewBox","0 0 ".concat(1300," ").concat(480)).append("g").attr("transform","translate(".concat([150,40],")")),n=this.yearModels.map((function(t){return t.getD3Representation()})),i=n.map((function(t){return t.extent})),s=b.f(i.map((function(t){return t[0]}))),r=b.e(i.map((function(t){return t[1]}))),o=b.g().domain([s,r]).range([400,0]),u=b.h().domain([this.dates[0],this.nextFutureDate]).range([0,e]),c=e/this.dates.length*.9,l=0;l<this.yearModels.length;l++){var h=this.yearModels[l],d=h.date,f=d.toDateString().split(" ").join("_"),p=h.getD3Representation().bars;a.selectAll("rect.".concat(f)).append("g").attr("class",f).data(p).enter().append("rect").attr("x",u(d)).attr("y",(function(t){return o(t.yStart)})).attr("width",c).attr("height",(function(t){return o(t.yEnd)-o(t.yStart)})).attr("class",(function(t){return t.class}))}a.append("g").style("font-size","20px").call(b.b(o).tickFormat((function(t){return"".concat(t.toLocaleString()," EUR")}))),a.append("g").style("font-size","20px").attr("transform","translate(0, ".concat(400,")")).call(b.a(u)),a.append("g").append("line").attr("x1",u(this.dates[0])).attr("y1",o(0)).attr("x2",u(this.nextFutureDate)).attr("y2",o(0)).attr("stroke-width",3).attr("stroke","black");var v=n.map((function(t){return t.investedMoney}));v.unshift({date:this.dates[0],money:this.startCapital}),a.append("path").datum(v).attr("fill","none").attr("id","investedMoney").attr("stroke-width",3).attr("d",b.d().x((function(t){return u(t.date)})).y((function(t){return o(t.money)})))}},{key:"updateVisualization",value:function(){}}]),t}(),_=a(2),B=function(){function t(){Object(o.a)(this,t)}return Object(u.a)(t,[{key:"render",value:function(t,e){e.innerHTML="";var a=b.i(e).append("svg").attr("id","firstSVG").attr("height","100%").attr("width","100%").attr("viewBox","0 0 ".concat(1300," ").concat(480)).append("g").attr("transform","translate(".concat([150,40],")")),n={costs:0,taxes:1,inflation:2},i=3,s="capital",r="dividend";for(var o in t.etfIdentifierToRatio)n[o+r]=i++,n[o+s]=i++;for(var u=[],c=0;c<i;c++)u.push([]);var l,h=Object(_.a)(t.yearModels);try{for(h.s();!(l=h.n()).done;){var d=l.value;u[n.costs].push({value:-d.values.costs,date:d.endDate}),u[n.taxes].push({value:-d.values.taxes-d.values.costs,date:d.endDate}),u[n.inflation].push({value:-d.values.inflation-d.values.taxes-d.values.costs,date:d.endDate});var f=0;for(var p in t.etfIdentifierToRatio)u[n[p+s]].push({value:d.values.etfs[p].capital+f,date:d.endDate}),u[n[p+r]].push({value:d.values.etfs[p].dividend+f,date:d.endDate}),f+=d.values.etfs[p].capital}}catch(O){h.e(O)}finally{h.f()}for(var v in u[n.inflation].cssClass="inflation",u[n.taxes].cssClass="taxes",u[n.costs].cssClass="costs",t.etfIdentifierToRatio)u[n[v+s]].cssClass="".concat(v,"_dividend"),u[n[v+s]].cssClass="".concat(v,"_total_amount");var g=b.f(u[n.inflation].map((function(t){return t.value}))),m=b.e(u[u.length-1].map((function(t){return t.value}))),y=b.g().domain([g,m]).range([400,0]),x=b.h().domain([t.dates[0],t.nextFutureDate]).range([0,1e3]);a.append("g").style("font-size","20px").call(b.b(y).tickFormat((function(t){return"".concat(t.toLocaleString()," EUR")}))),a.append("g").style("font-size","20px").attr("transform","translate(0, ".concat(400,")")).call(b.a(x)),a.append("g").append("line").attr("x1",x(t.dates[0])).attr("y1",y(0)).attr("x2",x(t.nextFutureDate)).attr("y2",y(0)).attr("stroke-width",3).attr("stroke","black");for(var j=0;j<u.length;j++)a.append("path").datum(u[j]).attr("fill","none").attr("class",(function(t){return t.cssClass})).attr("stroke-width",3).attr("d",b.d().x((function(t){return x(t.date)})).y((function(t){return y(t.value)})))}}]),t}(),z=a(4),E="startingCapital",L="monthlyInvestment",N="transactionCosts",H="transactionCostsType",U="savingPhase",J="payoutPhase",G="age",K="taxFreeAmount",q=(Y={},Object(d.a)(Y,E,"Starting Capital"),Object(d.a)(Y,L,"Monthly Investment"),Object(d.a)(Y,N,"Transaction Costs"),Object(d.a)(Y,H,"Fixes Amount ?"),Object(d.a)(Y,U,"Saving Phase"),Object(d.a)(Y,J,"Payout Phase"),Object(d.a)(Y,G,"Your Age"),Object(d.a)(Y,K,"Tax Free Amount"),Y),Q=function(t){Object(l.a)(a,t);var e=Object(h.a)(a);function a(t){var n,s;return Object(o.a)(this,a),(s=e.call(this,t)).state=(n={},Object(d.a)(n,E,{value:1e4,type:"text"}),Object(d.a)(n,L,{value:100,type:"text"}),Object(d.a)(n,N,{value:.005,type:"text"}),Object(d.a)(n,H,{value:!1,type:"checkbox"}),Object(d.a)(n,U,{value:40,type:"text"}),Object(d.a)(n,J,{value:20,type:"text"}),Object(d.a)(n,G,{value:30,type:"text"}),Object(d.a)(n,K,{value:801,type:"text"}),n),s.forecastModel=new w("demo"),s.handleChange=s.handleChange.bind(Object(c.a)(s)),s.ref=i.a.createRef(),s}return Object(u.a)(a,[{key:"handleChange",value:function(t,e){this.setState(Object(d.a)({},e,{value:t,type:this.state[e].type})),console.log("State ".concat(e," changed value to ").concat(t,"."))}},{key:"getVisulaizationModel",value:function(){return new S(this.state.startingCapital.value,this.state.monthlyInvestment.value,this.state.savingPhase.value,{IBM:1},{percentageCosts:0,fixedCosts:5},this.state.age.value,this.state.taxFreeAmount.value)}},{key:"componentDidMount",value:function(){(new B).render(this.getVisulaizationModel(),this.ref.current)}},{key:"componentDidUpdate",value:function(){(new B).render(this.getVisulaizationModel(),this.ref.current)}},{key:"render",value:function(){var t=this;return Object(z.jsxs)(i.a.Fragment,{children:[Object(z.jsx)("form",{children:Object.keys(this.state).map((function(e){return Object(z.jsx)(W,{label:q[e],value:t.state[e].value,type:t.state[e].type,onValueChange:t.handleChange,stateIdentifier:e},e)}))}),Object(z.jsx)("div",{ref:this.ref})]})}}]),a}(i.a.Component),W=function(t){Object(l.a)(a,t);var e=Object(h.a)(a);function a(t){var n;return Object(o.a)(this,a),(n=e.call(this,t)).handleChange=n.handleChange.bind(Object(c.a)(n)),n}return Object(u.a)(a,[{key:"handleChange",value:function(t){var e=t.target.value;"checkbox"===this.props.type&&(e=!this.props.value),this.props.onValueChange(e,this.props.stateIdentifier)}},{key:"render",value:function(){return Object(z.jsxs)("label",{children:[this.props.label,Object(z.jsx)("input",{type:this.props.type,value:this.props.value,onChange:this.handleChange})]})}}]),a}(i.a.Component),X=Q;var Z=function(){return Object(z.jsx)("div",{className:"Input",children:Object(z.jsx)(X,{})})},$=function(t){t&&t instanceof Function&&a.e(3).then(a.bind(null,164)).then((function(e){var a=e.getCLS,n=e.getFID,i=e.getFCP,s=e.getLCP,r=e.getTTFB;a(t),n(t),i(t),s(t),r(t)}))};r.a.render(Object(z.jsx)(i.a.StrictMode,{children:Object(z.jsx)(Z,{})}),document.getElementById("root")),$()}},[[163,1,2]]]);
//# sourceMappingURL=main.b7a5b4d3.chunk.js.map