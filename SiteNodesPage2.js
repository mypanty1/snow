Vue.component('SiteExt',{
  template:`<div class="display-contents">
    <link-block icon="amount" :text="site.name" @block-click="$router.push({name:'search',params:{text:site.name}})" actionIcon="right-link" type="medium"/>
    <devider-line />
  </div>`,
  props:{
    site:{type:Object,default:null,required:true},
    site_id:{type:String,default:'',required:true},
    entrances:{type:Array,default:()=>([]),required:true},
    entrance_id:{type:String,default:''},
    loads:{type:Object,default:()=>({})},
  },
  data:()=>({
    open_ext:false,
  }),
  created(){},
  computed:{},
  methods:{}
});
//add site ne
app.$router.beforeEach((to,from,next)=>{
  if(to.name=='site-nodes'){
    to.matched[0].components.default=Vue.component("SiteNodesPage2",{
      template:`<section>
        <PageNavbar :title="title"/>
        <CardBlock>
          <info-text :title="site.address" :text="site_name+' • '+site.site_name_kr" class="margin-top-bottom--8px"/>
          <template v-for="node of nodes">
            <devider-line/>
            <search-link :text="node.node_name">
              <info-text :title="node.type" :text="node.node_name" class="margin-top-bottom--8px"/>
            </search-link>
          </template>
        </CardBlock>
        
        <loader-bootstrap v-if="loadingSome" text="загрузка СЭ площадки"/>
        <CardBlock v-else>
          <div class="display-flex flex-direction-column gap-8px margin-left-right-16px">
            
            <template v-if="countRacksWithNetworkElements">
              <title-main icon="server" text="ШДУ с оборудованием" text2Class="tone-500" :text2="countRacksWithNetworkElements||''" class="padding-left-unset"/>
              <RackBox2 v-for="({props:rackProps,items},rack_id) in racksProps" :key="rack_id" v-bind="rackProps">
                <template v-for="({is,props,listeners},item_id,i) in items">
                  <devider-line v-if="i"/>
                  <component :key="item_id" :is="is" v-bind="props" v-on="listeners"/>
                </template>
              </RackBox2>
            </template>
    
            <template v-if="countNetworkElementsNotInRack">
              <title-main icon="warning" text="Место установки неизвестно" text2Class="tone-500" :text2="countNetworkElementsNotInRack||''" class="padding-left-unset"/>
              <NetworkElementCard v-for="({props,listeners},ne_id) in networkElementsProps" :key="ne_id" v-bind="props" v-on="listeners"/>
            </template>
    
          </div>
        </CardBlock>
      </section>`,
      props:{
        site_id:{type:String,required:true},
        site_name:{type:String,required:true},
        site:{type:Object,default:null},
      },
      beforeRouteEnter(to,from,next){
        if(!to.params.site){
          next({
            name:"search",
            params:{text:to.params.site_name},
          });
          return;
        }
        next();
      },
      data:()=>({}),
      async mounted(){
        const {site_id}=this;
        await Promise.allSettled([
          this.getSiteNodes({site_id}),
          this.getSiteEntrances({site_id}),
          this.getSiteRacks({site_id})
        ]);
        await Promise.allSettled([
          this.getSiteNetworkElements({site_id}),
          this.getSitePatchPanels({site_id})
        ]);
      },
      computed:{
        title(){return `площадка ${this.site_name}`},
        nodes(){return this.site?.nodes||[]},
        ...mapGetters({
          getEntrancesBySiteId:'site/getEntrancesBySiteId',
          getRacksBySiteId:'site/getRacksBySiteId',
          getNetworkElementsBySiteId:'site/getNetworkElementsBySiteId',
          getPatchPanelsBySiteId:'site/getPatchPanelsBySiteId',
        }),
        ...mapGetters({
          getSiteNetworkElementsLoads:'site/getSiteNetworkElementsLoads',
          getSiteEntrancesLoads:'site/getSiteEntrancesLoads',
          getSitePatchPanelsLoads:'site/getSitePatchPanelsLoads',
          getSiteRacksLoads:'site/getSiteRacksLoads',
        }),
        networkElementsLoading(){return this.getSiteNetworkElementsLoads[this.site_id]},
        patchPanelsLoading(){return this.getSitePatchPanelsLoads[this.site_id]},
        entrancesLoading(){return this.getSiteEntrancesLoads[this.site_id]},
        racksLoading(){return this.getSiteRacksLoads[this.site_id]},
        loadingSome(){
          return [this.networkElementsLoading,this.patchPanelsLoading,this.entrancesLoading,this.racksLoading].some(Boolean);
        },
        entrances(){return this.getEntrancesBySiteId(this.site_id)},
        racks(){return this.getRacksBySiteId(this.site_id)},
        networkElements(){return this.getNetworkElementsBySiteId(this.site_id)},
        patchPanels(){return this.getPatchPanelsBySiteId(this.site_id)},
        racksProps(){
          const {racks,networkElements,patchPanels}=this;
          return Object.values(racks).reduce((racks,rack)=>{
            const {rack_id,type,ne_in_rack}=rack;
            if(type!="Антивандальный"){return racks};
            racks[rack_id]={
              props:{
                rack,
              },
              items:ne_in_rack?.reduce((items,_name)=>{
                const ne=Object.values(networkElements).find(({ne_name})=>ne_name==_name);
                const pp=Object.values(patchPanels).find(({name})=>name==_name);
                if(ne){
                  const {ne_id,site_id,ne_status,ne_name}=ne;
                  const isInstalled=testByName.neIsInstalled(ne_status);
                  items[ne_id]={
                    is:'NetworkElementCard',
                    props:{
                      ne_id,
                      site_id,
                      networkElementProps:ne,
                      showAdminStatus:true,
                      showSysDescr:true,
                      showSysName:true,
                      showServeEntrances:isInstalled,
                      showFlatsAbons:isInstalled,
                    },
                    listeners:{
                      ...isInstalled?{
                        click:()=>{
                          this.$router.push({name:"search",params:{text:ne_name}})
                        }
                      }:null
                    }
                  };
                }else if(pp){
                  const {pp_id,site_id}=pp;
                  items[pp_id]={
                    is:'NetworkElementPPCard',
                    props:{
                      pp_id,
                      site_id,
                      patchPanelProps:pp,
                    }
                  };
                }
                return items;
              },{}),
            };
            return racks
          },{})
        },
        networkElementsProps(){
          return Object.values(this.networkElements).reduce((networkElements,ne)=>{
            const {ne_id,site_id,rack_id,ne_status,ne_name}=ne;
            const isInstalled=testByName.neIsInstalled(ne_status);
            if(rack_id){return networkElements};
            networkElements[ne_id]={
              props:{
                ne_id,
                site_id,
                networkElementProps:ne,
                showBorder:true,
                showAdminStatus:true,
                showSysDescr:true,
                showSysName:true,
                showServeEntrances:isInstalled,
                showFlatsAbons:isInstalled,
              },
              listeners:{
                ...isInstalled?{
                  click:()=>{
                    this.$router.push({name:"search",params:{text:ne_name}})
                  }
                }:null
              }
            };
            return networkElements;
          },{});
        },
        countRacksWithNetworkElements(){return Object.keys(this.racksProps).length},
        countNetworkElementsNotInRack(){return Object.keys(this.networkElementsProps).length},
      },
      methods:{
        ...mapActions({
          getSiteNodes:'site/getSiteNodes',
          getSiteEntrances:'site/getSiteEntrances',
          getSiteRacks:'site/getSiteRacks',
          getSiteNetworkElements:'site/getSiteNetworkElements',
          getSitePatchPanels:'site/getSitePatchPanels',
        }),
      },
    });
  };
  next()
});
