(this["webpackJsonpetf-vis"]=this["webpackJsonpetf-vis"]||[]).push([[0],{159:function(t,e,a){},160:function(t,e,a){},163:function(t,e,a){"use strict";a.r(e);var n=a(8),i=a.n(n),r=a(47),s=a.n(r),o=(a(159),a(160),a(6)),c=a(7),u=a(13),l=a(26),h=a(29),d=a(0),f=a(5),p=a(3),v=a.n(p),g=a(14),m=a(50),y=a.n(m),b=a(1),x=36e5,j=12;function O(t){return 0===t.getMonth()}function C(t,e){return t.getFullYear()<e.getFullYear()}function D(t,e){return k.apply(this,arguments)}function k(){return(k=Object(g.a)(v.a.mark((function t(e,a){var n;return v.a.wrap((function(t){for(;;)switch(t.prev=t.next){case 0:return t.next=2,b.c("https://www.alphavantage.co/query?function=TIME_SERIES_MONTHLY_ADJUSTED&symbol=".concat(e,"&apikey=").concat(a,"&datatype=csv"),(function(t){return{timestamp:new Date(t.timestamp.toString()),dividend:parseFloat(t["dividend amount"]),course:parseFloat(t["adjusted close"])}}));case 2:return(n=t.sent).sort((function(t,e){return t.timestamp-e.timestamp})),t.abrupt("return",n);case 5:case"end":return t.stop()}}),t)})))).apply(this,arguments)}function F(t){return t.map((function(t){return[M(t.timestamp),t.course]}))}function M(t){return Math.floor(t.getTime()/x)}var w=function(){function t(e){var a=arguments.length>1&&void 0!==arguments[1]?arguments[1]:2,n=arguments.length>2&&void 0!==arguments[2]?arguments[2]:7;Object(o.a)(this,t),this.historicalData={},this.predictors={},this.backCastTimeFactor=a,this.apiKey=e;var i=new Date(0);i.setMonth(n),this.backCastTimestampConstant=M(i)}return Object(c.a)(t,[{key:"_loadHistoricalDataIfNotPresent",value:function(){var t=Object(g.a)(v.a.mark((function t(e){var a,n,i,r,s;return v.a.wrap((function(t){for(;;)switch(t.prev=t.next){case 0:if(!(e in this.historicalData)){t.next=2;break}return t.abrupt("return");case 2:return t.next=4,D(e);case 4:a=t.sent,n=F(a),i=n[0][0],r=n[n.length-1][0],s=r+(r-i)/this.backCastTimeFactor,this.historicalData[e]={history:a,forecastArray:n,maxTimestampBeforePredictorRepetition:s};case 10:case"end":return t.stop()}}),t,this)})));return function(e){return t.apply(this,arguments)}}()},{key:"_createPredictorIfNotPresent",value:function(t,e){if(t in this.predictors||(this.predictors[t]={}),!(e in this.predictors[t])){var a=this.historicalData[t].forecastArray,n=a[a.length-1][0]-Math.abs(a[a.length-1][0]-e)*this.backCastTimeFactor-this.backCastTimestampConstant,i=a.filter((function(t){return t[0]>=n}));this.predictors[t][e]=y.a.linear(i)}}},{key:"_dateToPredictorTimestampAndDateTimestamp",value:function(t){var e=M(t);return[e>this.maxTimestampBeforePredictorRepetition?this.maxTimestampBeforePredictorRepetition:e,e]}},{key:"predict",value:function(){var t=Object(g.a)(v.a.mark((function t(e,a){var n,i,r,s;return v.a.wrap((function(t){for(;;)switch(t.prev=t.next){case 0:return t.next=2,this._loadHistoricalDataIfNotPresent(e,this.apiKey);case 2:return n=this._dateToPredictorTimestampAndDateTimestamp(a),i=Object(f.a)(n,2),r=i[0],s=i[1],this._createPredictorIfNotPresent(e,r),t.abrupt("return",this.predictors[e][r].predict(s)[1]);case 5:case"end":return t.stop()}}),t,this)})));return function(e,a){return t.apply(this,arguments)}}()}]),t}(),T=.26375;function A(t){return.025*t}function I(t,e){var a=t*e.percentageCosts+e.fixedCosts;return[t-a,a]}function P(t,e,a,n,i){if(!C(n,i))return[0,e];var r=function(t,e){return[Math.max(0,t-e),Math.max(0,e-t)]}(function(t,e){return Math.min(.7*t*.09,e)}(a,t),e),s=Object(f.a)(r,2),o=s[0],c=s[1];return[.7*o*T,c]}var R=function(){function t(e,a,n,i,r,s,c,u){Object(o.a)(this,t),this.initialDate=e,this.lastYearModelValues=c,this.startDate=a,this.newInvestmentAmount=i,this.endDate=n,this.etfIdentifierToRatio=r,this.costConfiguration=s,this.costs=c.costs,this.costs=c.costs,this.taxes=c.taxes,this.etfs={},this.yearBeginningCapital=O(this.startDate)?c.totalAmount:c.yearBeginningCapital,this.totalAmount=0,this.investedMoney=c.investedMoney+i,this.leftoverTaxFreeAmount=O(this.startDate)?u:c.leftoverTaxFreeAmount,this.calculate()}return Object(c.a)(t,[{key:"calculate",value:function(){var t=new Date(this.endDate-this.startDate),e=t.getFullYear()-new Date(0).getFullYear()+t.getMonth()/j;for(var a in this.lastYearModelValues.etfs){var n=this.etfIdentifierToRatio[a]*this.newInvestmentAmount;this.etfs[a]={},this.calculateNextEtfValueAndCosts(a,n,e)}var i=I(this.newInvestmentAmount,this.costConfiguration),r=Object(f.a)(i,1)[0],s=P(this.totalAmount-this.yearBeginningCapital-r,this.leftoverTaxFreeAmount,this.yearBeginningCapital,this.startDate,this.endDate),o=Object(f.a)(s,2),c=o[0],u=o[1];this.taxes+=c,this.leftoverTaxFreeAmount=u,this.inflation=function(t,e,a){var n=a.getFullYear()-e.getFullYear()+(a.getMonth()-e.getMonth())/j;return t-t*Math.pow(.99,n)}(this.totalAmount,this.initialDate,this.endDate)}},{key:"calculateNextEtfValueAndCosts",value:function(t,e,a){var n,i,r=this.lastYearModelValues.etfs[t],s=A(r.capital),o=A(r.dividend),c=function(t,e,a){for(var n=Math.round(e*j),i=I(t/n,a),r=Object(f.a)(i,2),s=r[0],o=r[1]*n,c=0,u=0,l=n;l>0;l--)c+=s,u+=A(s,l);return[c,u,o]}(e,a,this.costConfiguration),u=Object(f.a)(c,3),l=u[0],h=u[1],d=u[2],p=(n=this.startDate,i=this.endDate,C(n,i)?500:0),v=s+o+h+p,g=r.capital+v+l;this.etfs[t].capital=g,this.etfs[t].dividend=r.dividend+p+o,this.totalAmount+=g,this.costs+=d}}],[{key:"getInitialModelValues",value:function(t,e,a,n,i){for(var r=I(t,a),s=Object(f.a)(r,2),o=s[0],c={costs:s[1],taxes:0,inflation:0,investedMoney:t,etfs:{},yearBeginningCapital:o,totalAmount:o,leftoverTaxFreeAmount:n,endDate:i},u=0,l=Object.entries(e);u<l.length;u++){var h=Object(f.a)(l[u],2),d=h[0],p=h[1];c.etfs[d]={capital:p*o,dividend:0}}return c}}]),t}();function V(t,e){var a=t.getMonth()+e,n=a%j,i=t.getFullYear()+Math.floor(a/j);return new Date(i,n)}var Y,S=function(){function t(e,a,n,i,r,s,c){var u=arguments.length>7&&void 0!==arguments[7]?arguments[7]:j;if(Object(o.a)(this,t),!Number.isInteger(u/j))throw"currently only month lengths that are a factor of ".concat(j," are allowed.");this.taxFreeAmount=c,this.startCapital=e,this.investmentPerPeriod=a*u,this.savingPhaseLength=n,this.etfIdentifierToRatio=i,this.costConfiguration=r,this.age=s,this.intervalLengthInMonths=u,this._calculateTimestampsForVisualization(),this._calculateAllYearModels()}return Object(c.a)(t,[{key:"_calculateTimestampsForVisualization",value:function(){for(var t=function(t){var e=arguments.length>2&&void 0!==arguments[2]?arguments[2]:10,a=(arguments.length>1&&void 0!==arguments[1]?arguments[1]:80)-t,n=new Date(0);n.setFullYear((new Date).getFullYear());var i=new Date(0);return i.setFullYear((new Date).getFullYear()+a+e),[n,i]}(this.age),e=Object(f.a)(t,2),a=e[0],n=e[1],i=[],r=a;r<=n;)i.push(r),r=V(r,this.intervalLengthInMonths);this.dates=i,this.nextFutureDate=r}},{key:"_calculateAllYearModels",value:function(){for(var t=[R.getInitialModelValues(this.startCapital,this.etfIdentifierToRatio,this.costConfiguration,this.taxFreeAmount,this.dates[0])],e=0;e<this.dates.length-1;e++){var a=t[t.length-1];t.push(new R(this.dates[0],this.dates[e],this.dates[e+1],this.investmentPerPeriod,this.etfIdentifierToRatio,this.costConfiguration,a,this.taxFreeAmount))}this.dates.length>1&&(t.push(new R(this.dates[0],this.dates[this.dates.length-1],this.nextFutureDate,this.investmentPerPeriod,this.etfIdentifierToRatio,this.costConfiguration,t[t.length-1],this.taxFreeAmount)),this.yearModels=t)}},{key:"renderVisualization",value:function(t){for(var e=1e3,a=b.i(t).append("svg").attr("id","firstSVG").attr("height","100%").attr("width","100%").attr("viewBox","0 0 ".concat(1300," ").concat(480)).append("g").attr("transform","translate(".concat([150,40],")")),n=this.yearModels.map((function(t){return t.getD3Representation()})),i=n.map((function(t){return t.extent})),r=b.f(i.map((function(t){return t[0]}))),s=b.e(i.map((function(t){return t[1]}))),o=b.g().domain([r,s]).range([400,0]),c=b.h().domain([this.dates[0],this.nextFutureDate]).range([0,e]),u=e/this.dates.length*.9,l=0;l<this.yearModels.length;l++){var h=this.yearModels[l],d=h.date,f=d.toDateString().split(" ").join("_"),p=h.getD3Representation().bars;a.selectAll("rect.".concat(f)).append("g").attr("class",f).data(p).enter().append("rect").attr("x",c(d)).attr("y",(function(t){return o(t.yStart)})).attr("width",u).attr("height",(function(t){return o(t.yEnd)-o(t.yStart)})).attr("class",(function(t){return t.class}))}a.append("g").style("font-size","20px").call(b.b(o).tickFormat((function(t){return"".concat(t.toLocaleString()," EUR")}))),a.append("g").style("font-size","20px").attr("transform","translate(0, ".concat(400,")")).call(b.a(c)),a.append("g").append("line").attr("x1",c(this.dates[0])).attr("y1",o(0)).attr("x2",c(this.nextFutureDate)).attr("y2",o(0)).attr("stroke-width",3).attr("stroke","black");var v=n.map((function(t){return t.investedMoney}));v.unshift({date:this.dates[0],money:this.startCapital}),a.append("path").datum(v).attr("fill","none").attr("id","investedMoney").attr("stroke-width",3).attr("d",b.d().x((function(t){return c(t.date)})).y((function(t){return o(t.money)})))}},{key:"updateVisualization",value:function(){}}]),t}(),_=a(2),B=function(){function t(){Object(o.a)(this,t)}return Object(c.a)(t,[{key:"render",value:function(t,e){e.innerHTML="";var a=b.i(e).append("svg").attr("id","firstSVG").attr("height","100%").attr("width","100%").attr("viewBox","0 0 ".concat(1300," ").concat(480)).append("g").attr("transform","translate(".concat([150,40],")")),n={costs:0,taxes:1,inflation:2},i=3,r="capital",s="dividend";for(var o in t.etfIdentifierToRatio)n[o+s]=i++,n[o+r]=i++;for(var c=[],u=0;u<i;u++)c.push([]);var l,h=Object(_.a)(t.yearModels);try{for(h.s();!(l=h.n()).done;){var d=l.value;c[n.costs].push({value:-d.costs,date:d.endDate}),c[n.taxes].push({value:-d.taxes-d.costs,date:d.endDate}),c[n.inflation].push({value:-d.inflation-d.taxes-d.costs,date:d.endDate});var f=0;for(var p in t.etfIdentifierToRatio)c[n[p+r]].push({value:d.etfs[p].capital+f,date:d.endDate}),c[n[p+s]].push({value:d.etfs[p].capital-d.etfs[p].dividend+f,date:d.endDate}),f+=d.etfs[p].capital}}catch(O){h.e(O)}finally{h.f()}for(var v in c[n.inflation].cssClass="inflation",c[n.taxes].cssClass="taxes",c[n.costs].cssClass="costs",t.etfIdentifierToRatio)c[n[v+s]].cssClass="".concat(v,"_dividend"),c[n[v+r]].cssClass="".concat(v,"_total_amount");var g=b.f(c[n.inflation].map((function(t){return t.value}))),m=b.e(c[c.length-1].map((function(t){return t.value}))),y=b.g().domain([g,m]).range([400,0]),x=b.h().domain([t.dates[0],t.nextFutureDate]).range([0,1e3]);a.append("g").style("font-size","20px").call(b.b(y).tickFormat((function(t){return"".concat(t.toLocaleString()," EUR")}))),a.append("g").style("font-size","20px").attr("transform","translate(0, ".concat(400,")")).call(b.a(x)),a.append("g").append("line").attr("x1",x(t.dates[0])).attr("y1",y(0)).attr("x2",x(t.nextFutureDate)).attr("y2",y(0)).attr("stroke-width",3).attr("stroke","black");for(var j=0;j<c.length;j++)a.append("path").datum(c[j]).attr("fill","none").attr("class",(function(t){return t.cssClass})).attr("stroke-width",3).attr("d",b.d().x((function(t){return x(t.date)})).y((function(t){return y(t.value)})))}}]),t}(),z=a(4),E="startingCapital",L="monthlyInvestment",N="transactionCosts",H="transactionCostsType",U="savingPhase",J="payoutPhase",G="age",K="taxFreeAmount",q=(Y={},Object(d.a)(Y,E,"Starting Capital"),Object(d.a)(Y,L,"Monthly Investment"),Object(d.a)(Y,N,"Transaction Costs"),Object(d.a)(Y,H,"Fixes Amount ?"),Object(d.a)(Y,U,"Saving Phase"),Object(d.a)(Y,J,"Payout Phase"),Object(d.a)(Y,G,"Your Age"),Object(d.a)(Y,K,"Tax Free Amount"),Y),Q=function(t){Object(l.a)(a,t);var e=Object(h.a)(a);function a(t){var n,r;return Object(o.a)(this,a),(r=e.call(this,t)).state=(n={},Object(d.a)(n,E,{value:1e4,type:"text"}),Object(d.a)(n,L,{value:100,type:"text"}),Object(d.a)(n,N,{value:.005,type:"text"}),Object(d.a)(n,H,{value:!1,type:"checkbox"}),Object(d.a)(n,U,{value:40,type:"text"}),Object(d.a)(n,J,{value:20,type:"text"}),Object(d.a)(n,G,{value:30,type:"text"}),Object(d.a)(n,K,{value:801,type:"text"}),n),r.forecastModel=new w("demo"),r.handleChange=r.handleChange.bind(Object(u.a)(r)),r.ref=i.a.createRef(),r}return Object(c.a)(a,[{key:"handleChange",value:function(t,e){this.setState(Object(d.a)({},e,{value:t,type:this.state[e].type})),console.log("State ".concat(e," changed value to ").concat(t,"."))}},{key:"getVisulaizationModel",value:function(){return new S(this.state.startingCapital.value,this.state.monthlyInvestment.value,this.state.savingPhase.value,{IBM:1},{percentageCosts:0,fixedCosts:5},this.state.age.value,this.state.taxFreeAmount.value)}},{key:"componentDidMount",value:function(){(new B).render(this.getVisulaizationModel(),this.ref.current)}},{key:"componentDidUpdate",value:function(){(new B).render(this.getVisulaizationModel(),this.ref.current)}},{key:"render",value:function(){var t=this;return Object(z.jsxs)(i.a.Fragment,{children:[Object(z.jsx)("form",{children:Object.keys(this.state).map((function(e){return Object(z.jsx)(W,{label:q[e],value:t.state[e].value,type:t.state[e].type,onValueChange:t.handleChange,stateIdentifier:e},e)}))}),Object(z.jsx)("div",{ref:this.ref})]})}}]),a}(i.a.Component),W=function(t){Object(l.a)(a,t);var e=Object(h.a)(a);function a(t){var n;return Object(o.a)(this,a),(n=e.call(this,t)).handleChange=n.handleChange.bind(Object(u.a)(n)),n}return Object(c.a)(a,[{key:"handleChange",value:function(t){var e=t.target.value;"checkbox"===this.props.type&&(e=!this.props.value),this.props.onValueChange(e,this.props.stateIdentifier)}},{key:"render",value:function(){return Object(z.jsxs)("label",{children:[this.props.label,Object(z.jsx)("input",{type:this.props.type,value:this.props.value,onChange:this.handleChange})]})}}]),a}(i.a.Component),X=Q;var Z=function(){return Object(z.jsx)("div",{className:"Input",children:Object(z.jsx)(X,{})})},$=function(t){t&&t instanceof Function&&a.e(3).then(a.bind(null,164)).then((function(e){var a=e.getCLS,n=e.getFID,i=e.getFCP,r=e.getLCP,s=e.getTTFB;a(t),n(t),i(t),r(t),s(t)}))};s.a.render(Object(z.jsx)(i.a.StrictMode,{children:Object(z.jsx)(Z,{})}),document.getElementById("root")),$()}},[[163,1,2]]]);
//# sourceMappingURL=main.eb3d7172.chunk.js.map