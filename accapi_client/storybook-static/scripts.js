/*! For license information please see scripts.js.LICENSE.txt */
!function(e,n,s){function o(e,n){return typeof e===n}var r=[],i=[],l={_version:"3.5.0",_config:{classPrefix:"",enableClasses:!0,enableJSClass:!0,usePrefixes:!0},_q:[],on:function(e,n){var s=this;setTimeout((function(){n(s[e])}),0)},addTest:function(e,n,s){i.push({name:e,fn:n,options:s})},addAsyncTest:function(e){i.push({name:null,fn:e})}},Modernizr=function(){};Modernizr.prototype=l,(Modernizr=new Modernizr).addTest("eventlistener","addEventListener"in e),Modernizr.addTest("localstorage",(function(){var e="modernizr";try{return localStorage.setItem(e,e),localStorage.removeItem(e),!0}catch(n){return!1}})),Modernizr.addTest("sessionstorage",(function(){var e="modernizr";try{return sessionStorage.setItem(e,e),sessionStorage.removeItem(e),!0}catch(n){return!1}}));var c=n.documentElement,f="svg"===c.nodeName.toLowerCase();Modernizr.addTest("queryselector","querySelector"in n&&"querySelectorAll"in n),function t(){var e,n,s,t,a,c;for(var f in i)if(i.hasOwnProperty(f)){if(e=[],(n=i[f]).name&&(e.push(n.name.toLowerCase()),n.options&&n.options.aliases&&n.options.aliases.length))for(s=0;s<n.options.aliases.length;s++)e.push(n.options.aliases[s].toLowerCase());for(t=o(n.fn,"function")?n.fn():n.fn,a=0;a<e.length;a++)1===(c=e[a].split(".")).length?Modernizr[c[0]]=t:(!Modernizr[c[0]]||Modernizr[c[0]]instanceof Boolean||(Modernizr[c[0]]=new Boolean(Modernizr[c[0]])),Modernizr[c[0]][c[1]]=t),r.push((t?"":"no-")+c.join("-"))}}(),function a(e){var n=c.className,s=Modernizr._config.classPrefix||"";if(f&&(n=n.baseVal),Modernizr._config.enableJSClass){var o=new RegExp("(^|\\s)"+s+"no-js(\\s|$)");n=n.replace(o,"$1"+s+"js$2")}Modernizr._config.enableClasses&&(n+=" "+s+e.join(" "+s),f?c.className.baseVal=n:c.className=n)}(r),delete l.addTest,delete l.addAsyncTest;for(var u=0;u<Modernizr._q.length;u++)Modernizr._q[u]();e.Modernizr=Modernizr}(window,document),function(w,d,s,l,i){w[l]=w[l]||[],w[l].push({"gtm.start":(new Date).getTime(),event:"gtm.js"});var f=d.getElementsByTagName(s)[0],j=d.createElement(s);j.async=!0,j.src="https://www.googletagmanager.com/gtm.js?id=GTM-TF7QP5M",f.parentNode.insertBefore(j,f)}(window,document,"script","dataLayer");