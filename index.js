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

Vue.component("SiteNodeInfo", {
  template:`<CardBlock name="SiteNodeInfo">
    <title-main text="Инфо по площадке и доступу*" @open="show=!show">
      <button-sq :icon="loading?'loading rotating':'mark-circle'" type="large" @click="help.show=!help.show"/>
    </title-main>
    <info-text-icon v-if="help.show" icon="info" :text="help.text" />
    <template v-if="show&&site">
      <info-text-sec v-if="site.lessor" :text="site?.lessor?.name" class="margin-bottom-4px"/>
      <account-call v-if="site?.lessor?.phone" :phone="site.lessor.phone" title="Контактный номер телефона" :descr="[site.lessor.person,site.lessor.position]" class="margin-bottom-4px"/>
      <account-call v-if="site?.lessor?.phone2" :phone="site.lessor.phone2" title="Контактный номер телефона по вопросам доступа" class="margin-bottom-4px"/>
      <account-call v-if="site?.lessor?.phone3" :phone="site.lessor.phone3" title="Телефонные номера аварийных служб" class="margin-bottom-4px"/>
      
      <devider-line v-if="site.address_descr||site.details"/>
      <info-text-sec v-if="site.address_descr||site.details" title="Примечание к адресу" :text="site.address_descr||site.details" class="margin-bottom-4px"/>
      
      <devider-line v-if="has_site_info_from_nioss"/>
      <info-text-sec v-if="has_site_info_from_nioss" title="Примечание к площадке" :rows="site_info_rows"/>
      
      <devider-line v-if="has_node_info_from_nioss"/>
      <info-text-sec v-if="has_node_info_from_nioss" title="Примечание к узлу ОС" :rows="node_info_rows"/>
      
      <devider-line v-if="address_id"/>
      <url-el v-if="address_id" :url="urlToInventory"/>
    </template>
  </CardBlock>`,
  props:{
    site:{type:Object},
  },
  data:()=>({
    show:true,
    help:{
      text:`Информация об арендодателе площадей под размещение оборудования ПАО МТС может быть устаревшей либо вовсе не быть информацией по доступу. 
      Для корректировки данной информации нужно обратиться к ФГТСЖ. Подробная информация по доступу в помещения подъезда находится на странице Подъезд`,
      show:false,
    },
    resps:{//8100749217013993313 - получены все доступные атрибуты
      nioss_node:null,
      nioss_site:null,
    },
    loads:{
      nioss_node:false,
      nioss_site:false,
    },
  }),
  created(){
    this.get_nioss_object('site',this.site?.id);
    this.get_nioss_object('node',this.site?.node_id||this.site?.uzel_id);
  },
  watch:{
    'site'(site){
      if(!site){return};
      if(!this.resps.nioss_site){
        this.get_nioss_object('site',this.site?.id);
      }
      if(!this.resps.nioss_node){
        this.get_nioss_object('node',this.site?.node_id||this.site?.uzel_id);
      }
    }
  },
  computed:{
    loading(){return Object.values(this.loads).some(l=>l)},
    site_info_rows(){
      if(!this.resps.nioss_site){return};
      const {description=''}=this.resps.nioss_site;
      return [description||this.site?.site_descr].filter(s=>s);
    },
    node_info_rows(){
      if(!this.resps.nioss_node){return};
      const {description=''}=this.resps.nioss_node;
      return [description||this.site?.node_descr].filter(s=>s);
    },
    has_site_info_from_nioss(){return this.site_info_rows?.length},
    has_node_info_from_nioss(){return this.node_info_rows?.length},
    has_info_from_nioss(){ return this.has_site_info_from_nioss||this.has_node_info_from_nioss},
    address_id(){return this.resps.nioss_site?.AddressPA?.NCObjectKey||this.site?.address_id||''},
    site_name(){return this.resps.nioss_site?.SiteName||this.site?.name||''},
    urlToInventory(){
      return {
        url:`https://inventory.ural.mts.ru/tb/address_view.php?id_address=${this.address_id}`,
        title:`Инвентори площадки ${this.site_name}`,
        description:this.isApp?`*переход из приложения пока может не работать\n(можно скопировать)`:''
      }
    },
    ...mapGetters({
      isApp:'app/isApp',
    }),
  },
  methods:{
    async get_nioss_object(object='unknown',object_id=''){
      if(!object_id){return};
      const cache=this.$cache.getItem(`get_nioss_object/${object_id}`);
      if(cache){
        this.resps['nioss_'+object]=cache;
        return;
      };
      this.loads['nioss_'+object]=true;
      const response=await this.get_nioss_object_and_save({object_id,object});
      this.resps['nioss_'+object]=response||null;
      this.loads['nioss_'+object]=false;
    },
    async get_nioss_object_and_save({object_id,object}){
      try{
        const response=await httpGet(buildUrl("get_nioss_object",{object_id,object},"/call/nioss/"),true);
        if(response?.parent){this.$cache.setItem(`get_nioss_object/${object_id}`,response)};
        return response;
      }catch(error){
        console.warn("get_nioss_object.error",{object_id,object},error);
      }
      return null;
    },
  }
});

