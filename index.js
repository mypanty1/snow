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

document.head.appendChild(Object.assign(document.createElement('script'),{src:'https://mypanty1.github.io/snow/AbonPortBind.js',type:'text/javascript'}));
document.head.appendChild(Object.assign(document.createElement('script'),{src:'https://mypanty1.github.io/snow/Siebel2.js',type:'text/javascript'}));
document.head.appendChild(Object.assign(document.createElement('script'),{src:'https://mypanty1.github.io/snow/ForisContent.js',type:'text/javascript'}));
if(/http(|s):\/\/(inetcore|fx)/i.test(window.location.origin)){
  document.head.appendChild(Object.assign(document.createElement('script'),{src:'https://mypanty1.github.io/snow/FixIptvIcon.js',type:'text/javascript'}));
};
document.head.appendChild(Object.assign(document.createElement('script'),{src:'https://mypanty1.github.io/snow/buildings.js',type:'text/javascript'}));

function getTestNodesTree(parent=document.body,tree={}){
  return [...parent?.children||[]].reduce((tree,el)=>{
    const isTestNode=el.hasAttribute('cn')||el.hasAttribute('tn');
    if(!isTestNode){
      return {...tree,...getTestNodesTree(el,tree)}
    }else{
      const cn=el.getAttribute('cn')||'',cn_sel=cn?`[cn="${cn}"]`:`[cn]`;
      const tn=el.getAttribute('tn')||'',tn_sel=tn?`[tn="${tn}"]`:``;
      const tag=String(el.tagName).toLowerCase();
      const sel=`${cn_sel}${tn_sel}`;
      if(!tree[sel]){tree[sel]={tag,nst:[]}};
      tree[sel].nst.push(getTestNodesTree(el))
      return tree
    }
  },tree);
};



















