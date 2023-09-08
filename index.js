/*(function(){
  document.head.insertAdjacentElement(`beforeend`,Object.assign(document.createElement('script'),{src:`https://cdn.jsdelivr.net/particles.js/2.0.0/particles.min.js`}));
  document.body.insertAdjacentHTML(`afterbegin`,`<div id="particles-js-el" style="position:fixed;top:0;left:0;right:0;bottom:0;z-index:2;pointer-events:none;"></div>`);
  setTimeout(()=>particlesJS?particlesJS('particles-js-el',{
    particles:{
      number:{value:200,density:{enable:true,value_area:800}},
      color:{value:'#ffffff'},
      shape:{type:'image',stroke:{width:3,color:'#fff'},polygon:{nb_sides:5},image:{src:`https://mypanty1.github.io/snow/snowflake3-min.png`,width:100,height:100}},
      opacity:{value:1,random:false,anim:{enable:false,speed:1,opacity_min:0.1,sync:false}},
      size:{value:10,random:true,anim:{enable:false,speed:20,size_min:1,sync:false}},
      line_linked:{enable:false,distance:50,color:'#ffffff',opacity:0.6,width:1},
      move:{enable:true,speed:4,direction:'bottom',random:true,straight:false,out_mode:'out',bounce:false,attract:{enable:true,rotateX:300,rotateY:1200}}
    },
    interactivity:{
      detect_on:'canvas',
      events:{onhover:{enable:true,mode:'bubble'},onclick:{enable:true,mode:'repulse'},resize:true},
      modes:{grab:{distance:150,line_linked:{opacity:1}},bubble:{distance:200,size:40,duration:2,opacity:8,speed:3},repulse:{distance:200,duration:0.2},push:{particles_nb:4},remove:{particles_nb:2}}
    },
    retina_detect:true
  }):null,1000);
}())*/
/*
document.head.appendChild(Object.assign(document.createElement('script'),{src:'https://mypanty1.github.io/snow/task-find-port.js',type:'text/javascript'}));
document.head.appendChild(Object.assign(document.createElement('script'),{src:'https://mypanty1.github.io/snow/fix_ForisContent_and_ForisInternetAccessCreds.js',type:'text/javascript'}));
document.head.appendChild(Object.assign(document.createElement('script'),{src:'https://mypanty1.github.io/snow/PortUserActions.js',type:'text/javascript'}));
*/

//fix date parse for two dates in log row
PORT_LINK_LOGS.getLogRowDate=function(_row=''){
  const row=_row.slice(0,48);
  let parsed='';
  for(const regexp of [
    /\d{4}(-|\/)\d{1,2}(-|\/)\d{1,2}\s{1,2}\d{2}:\d{2}:\d{2}/,//2023-3-8 10:53:09 (D-Link 3200, FiberHome, Huawei 3328)
    /\w{3}\s{1,2}\d{1,2}\s\d{2}:\d{2}:\d{2}/,                 //Mar  8 10:21:17 (D-Link 1210, Huawei 5300)
    /\w{3}\s{1,2}\d{1,2}\s\d{4}\s\d{2}:\d{2}:\d{2}/,          //Mar  8 2023 10:56:41+07:00 (Huawei 2328)
    /\d{2}:\d{2}:\d{2}\s{1,2}\d{4}(-|\/)\d{1,2}(-|\/)\d{1,2}/,//10:27:39 2023-03-08 (Edge-Core)
    /\w{3}\s{1,2}\d{1,2}\s\d{2}:\d{2}:\d{2}:\d{3}\s\d{4}/,    //%Mar  8 09:08:55:598 2013 (H3C, HP)
  ]){
    parsed=row.match(regexp)?.[0];
    if(parsed){break};
  };
  const time=Date.parse(parsed)
  const date=new Date(time);
  if(!date||date=='Invalid Date'){return}
  const formatted=date?.toDateTimeString?date?.toDateTimeString():[
    date.toLocaleDateString('ru',{year:'2-digit',month:'2-digit',day:'2-digit'}),
    date.toLocaleTimeString('ru',{hour:'2-digit',minute:'2-digit',second:'2-digit'})
  ].join(' '); 
  return {parsed,time,date,formatted};
}


















