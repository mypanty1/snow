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


//document.head.appendChild(Object.assign(document.createElement('script'),{src:'https://mypanty1.github.io/snow/Siebel2.js',type:'text/javascript'}));
//if(/http(|s):\/\/(inetcore|fx)/i.test(window.location.origin)){
//  document.head.appendChild(Object.assign(document.createElement('script'),{src:'https://mypanty1.github.io/snow/FixIptvIcon.js',type:'text/javascript'}));
//};


//document.head.appendChild(Object.assign(document.createElement('script'),{src:'https://mypanty1.github.io/snow/device-info.js',type:'text/javascript'}));
//document.head.appendChild(Object.assign(document.createElement('script'),{src:'https://mypanty1.github.io/snow/AbonPortBindSelectAbonInternetServiceItem.js',type:'text/javascript'}));
//document.head.appendChild(Object.assign(document.createElement('script'),{src:'https://mypanty1.github.io/snow/CpeSetWifiModal.js',type:'text/javascript'}));
//document.head.appendChild(Object.assign(document.createElement('script'),{src:'https://mypanty1.github.io/snow/SiteNodesPage2.js',type:'text/javascript'}));



















/*Vue.mixin({
  props:{
    tn:{type:String,default:''},
  },
  created(){
    let {template}=this.$options;if(!template?.match){return};
    const addBind=(t,b)=>/\/>$/.test(t)?t.replace(/\/>$/,` ${b}/>`):/>/.test(t)?t.replace(/>/,` ${b}>`):t;
    template=!/\W(cn)\W/.test(template)?addBind(template,`:cn="$options.name"`):template;
    template=!/\W(tn)\W/.test(template.match(/(?<=\<)([\s\S]+?)(?=\>)/g)?.[0]||'')?addBind(template,`:tn="tn"`):template;
    this.$options.template=template;
  },
});
function getTestNodesTree(parent=document.body,tree={},_path='body'){
  return [...parent?.children||[]].reduce((tree,el)=>{
    const isTestNode=el.hasAttribute('cn')||el.hasAttribute('tn');
    if(!isTestNode){
      return {...tree,...getTestNodesTree(el,tree,_path)}
    }else{
      const cn=el.getAttribute('cn')||'',cn_sel=cn&&!/-/.test(cn)?`[cn="${cn}"]`:``;
      const tn=el.getAttribute('tn')||'',tn_sel=tn?`[tn="${tn}"]`:``;
      const tag=String(el.tagName).toLowerCase();
      const sel=`${cn_sel}${tn_sel}`||tag;
      const path=_path?`${_path} ${sel}`:sel;
      if(!tree[sel]){tree[sel]={tag,path,nst:[]}};
      tree[sel].nst.push(getTestNodesTree(el,{},path))
      return tree
    }
  },tree);
};*/


















