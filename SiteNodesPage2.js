//add site ne
app.$router.beforeEach((to,from,next)=>{
  if(to.name=='site-nodes'){
    to.matched[0].components.default=Vue.component("SiteNodesPage2",{
      template:`<section name="SiteNodesPage">
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
              <div v-for="({props:rackProps,networkElementsProps},rack_id) in racksProps" class="display-flex flex-direction-column gap-8px">
                <RackBox2 :key="rack_id" v-bind="rackProps">
                  <template v-for="({props,listeners},ne_id,i) in networkElementsProps">
                    <devider-line v-if="i"/>
                    <NetworkElementCard :key="ne_id" v-bind="props" v-on="listeners"/>
                  </template>
                </RackBox2>
              </div>
            </template>

            <template v-if="countNetworkElementsNotInRack">
              <title-main icon="warning" text="Место установки неизвестно" text2Class="tone-500" :text2="countNetworkElementsNotInRack||''" class="padding-left-unset"/>
              <div v-for="({props,listeners},ne_id) in networkElementsProps" class="display-flex flex-direction-column gap-8px">
                <NetworkElementCard :key="ne_id" v-bind="props" v-on="listeners"/>
              </div>
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
        this.getSiteNodes({site_id});
        this.getSiteEntrances({site_id});
        await this.getSiteRacks({site_id});
        await this.getSiteNetworkElements({site_id});
      },
      computed:{
        title(){return `площадка ${this.site_name}`},
        nodes(){return this.site?.nodes||[]},
        ...mapGetters({
          getEntrancesBySiteId:'site/getEntrancesBySiteId',
          getRacksBySiteId:'site/getRacksBySiteId',
          getNetworkElementsBySiteId:'site/getNetworkElementsBySiteId',
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
        racksProps(){
          return Object.values(this.racks).reduce((racks,rack)=>{
            const {id,type,ne_in_rack}=rack;
            if(type!="Антивандальный"){return racks};
            racks[id]={
              props:{
                rack,
              },
              networkElementsProps:ne_in_rack?.reduce((networkElements,_name)=>{
                const ne=Object.values(this.networkElements).find(({ne_name})=>ne_name==_name);
                if(!ne){return networkElements};
                const {ne_id,site_id,ne_status,ne_name}=ne;
                const isInstalled=testByName.neIsInstalled(ne_status);
                networkElements[ne_id]={
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
                return networkElements;
              },{})
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
        }),
      },
    });
  };
  next()
});
