Vue.component("SearchPage",{
  template:`<SearchPageContent v-bind="$props"/>`,
  props:{
    text:{type:String},
  },
});

Vue.component("SearchPageContent",{
  template:`<section name="SearchPageContent" class="search-page">
    <loader-bootstrap v-if="loading.search" :text="searchText"/>
    <div v-else class="font--18-600 tone-900 padding-8px-16px text-align-center">{{errorText}}</div>    
  </section>`,
  props:{
    text:{type:String},
  },
  data:()=>({
    loading:{
      search:false
    },
    error:"",
    keyPage:{
      entrance_id:"entrance",
      account:"account",
    },
  }),
  created(){
    this.searchByText();
  },
  watch:{
    'text'(){
      this.searchByText();
    },
  },
  computed:{
    searchText(){return `поиск "${decodeURIComponent(this.text)}"`},
    errorText(){return !this.text?'Введите текст для поиска':this.error},
    ...mapGetters({
      region:'main/region',
    }),
    br_oam_prefix(){return this.region?.br_oam_prefix},
  },
  methods:{
    async searchByText(_text){
      //FIX Повторный поиск по имени устройсва для получения информации о дискавери и комьюнити и снмп версии
      let text = decodeURIComponent(_text || this.text);
      this.error = "";
      if (!text || this.loading.search) return;
      
      if(text.startsWith("CMTS")){
        this.goToDocsis(text);
        return;
      }else if(/^\d{1,3}[бю.,./]\d{1,3}$/i.test(text)&&this.br_oam_prefix){//поиск СЭ по двум последним октетам
        text=text.replace(/[бю.,./]/gi,'.');
        this.$router.replace({
          name:"search",
          params:{
            text:`@D_IP:${this.br_oam_prefix}.${text}`
          }
        });
        return;
      }else if(/^10[бю.,./]2(\d{2}[бю.,./])(\d{1,3}[бю.,./])\d{1,3}$/i.test(text)){//поиск сэ по маске 10.2x.x.x
        text=text.replace(/[бю.,./]/gi,'.');
        this.$router.replace({
          name:"search",
          params:{
            text:`@D_IP:${text}`
          }
        });
        return;
      };

      this.loading.search=true;

      const response=await httpGet(buildUrl("search_ma", {
        pattern:encodeURIComponent(text),
        component:'search-page'
      },"/call/v1/search/")).catch(error=>console.warn('search_ma.error',error));

      this.loading.search=false;

      if(response.type=="warning"){
        this.error=response.text;
        return;
      };

      this.mapper(response);
    },
    mapper(response){
      let { key, type, pattern } = response;
      
      if(['ip','device_ip'].includes(key)&&type!=="list"){
        //FIX Повторный поиск по имени СЭ для получения информации о дискавери и комьюнити и снмп версии
        const ne_name=response?.data?.name;
        if(ne_name){
          //this.searchByText(ne_name);
          //FIX чтобы работал лоадер
          this.$router.replace({
            name:"search",
            params:{
              text:ne_name
            }
          });
          return
        }
      }
      
      if(['mac','ip','port_ip'].includes(key)&&type!=="list"){
        const port_name=response.data?.[1]?.ports?.[0]?.PORT_NAME;
        if(port_name){
          this.$router.replace({
            name:"search",
            params:{
              text:port_name
            }
          });
          return
        }
      }

      /*if(key=='site'){
        const site_id=response.data?.site_id;
        if(site_id){
          this.$router.replace({
            name:"search",
            params:{
              text:site_id
            }
          });
          return
        }
      }*/

      if(['mac'].includes(key)&&type!=="list"){
        key=type;
      }
      
      const handler={
        account:      this.goToAccount,
        device:       this.goToNetworkElement,
        port:         this.goToPort,
        pon:          this.goToPonPort, //TODO добавить признак на BE
        entrance_id:  this.goToEntrance,
        building:     this.goToBuilding, // ДУ
        building_id:  this.goToBuilding, // site_id
        site:         this.goToSiteNodes, // site_name
        coordinates:  this.goToBuilding,
        rack:         this.goToRack,
        ip:           this.goToDevicesPortsCpesList,
        device_ip:    this.goToDevicesPortsCpesList,
        port_ip:      this.goToDevicesPortsCpesList,
        mac:          this.goToDevicesPortsCpesList,
        serial_number:this.addCpesAsSubTypeAndGo
      }[key];

      if(handler){
        handler(response);
      }else{
        this.error=`исключение для "${pattern}" [${key}(${type})]`;
      }
    },
    goToDocsis(text) {
      this.$router.replace({
        name: "ds_device",
        params: { name: text },
      });
    },
    goToAccount(response) {
      const pattern = response.pattern;
      const accountResponse = response.data;
      if (accountResponse.type === 'list') {
        this.$router.replace({
          name: "account-list",
          params: { accountId: pattern, accountResponse },
        });
        return;
      }

      const lbsv = accountResponse['lbsv'];
      const foris = accountResponse["v1::foris"];

      if (lbsv) {
        this.$router.replace({
          name: "account-lbsv",
          params: {
            accountId: pattern,
            account: lbsv.data,
            accountResponse
          },
        });
      } else if (foris) {
        this.$router.replace({
          name: 'account-foris',
          params: {
            accountId: pattern,
            account: foris.data,
            accountResponse
          }
        });
      } else {
        this.$router.replace({
          name: 'account-proxy',
          params: {
            accountId: pattern,
            accountResponse
          }
        });
      }
    },
    async goToNetworkElement(response){
      const {data:networkElement={},pattern=''}=response;
      const {name='',site_id=''}=networkElement;
      this.$cache.setItem(`device/${name||pattern}`,networkElement);
      const prefix=getNetworkElementPrefix(name||pattern);

      let site_rack_list=this.$cache.getItem(`site_rack_list/${site_id}`);
      if(!site_rack_list){
        try{
          let response=await httpGet(buildUrl("site_rack_list",{site_id,component:'search-page'},"/call/v1/device/"));
          if(!response.length){response=[]};
          this.$cache.setItem(`site_rack_list/${site_id}`,response);
          site_rack_list=response;
        }catch(error){
          console.warn('site_rack_list.error',error);
        };
      };

      const rack=site_rack_list.find(r=>r.ne_in_rack.includes(name));
      if(rack){
        this.$router.replace({
          name:"network-element-in-rack",
          params:{
            rack_id:rack.name,
            rackProp:rack,
            device_id:name||pattern,
            deviceProp:networkElement,
          },
        });
        return;
      };
      
      if(prefix==='CMTS'){
        this.$router.replace({
          name:"ds_device",
          params:{name:name||pattern},
        });
        return;
      };
      this.$router.replace({
        name:"network-element",
        params:{
          device_id:name||pattern,
          deviceProp:networkElement
        },
      });
    },
    async goToSiteNodeDu(response) {
      const { data, pattern } = response;
      this.$router.replace({
        name: "site-node-du",
        params: { site_id: pattern, siteProp: data },
      });
    },
    goToSiteNode(response) {
      const { data, pattern } = response;
      this.$router.replace({
        name: "site-node",
        params: { id: pattern, siteProp: data },
      });
    },
    goToSiteNodes(response) {
      const { site_id, site_name, nodes } = response.data || {};
      if(!site_id||!site_name||!nodes?.length){return}
      this.$router.replace({
        name: "site-nodes",
        params: { site_name, site_id, site: response.data },
      });
    },
    goToListBuilding(response) {
      const { data, pattern } = response;
      this.$router.replace({
        name: "nodes",
        params: { id: pattern, data: data },
      });
    },
    goToBuilding(response) {
      const data = response.data;
      const current_coords=(this.$root.coords||'55.031680,82.970840').split(',');
      if(data.coordinates){
        this.$root.coords=[data.coordinates.latitude||current_coords[0],data.coordinates.longitude||current_coords[1]].join();
      }else if(data.length&&data[0].coordinates){
        this.$root.coords=[data[0].coordinates.latitude||current_coords[0],data[0].coordinates.longitude||current_coords[1]].join();
      };
      
      if (response.type === "building_list") {
        this.goToListBuilding(response);
        return;
      }

      const type = data.type.toUpperCase();
      const types_fn = {
        ДУ: this.goToSiteNodeDu,
        МУ: this.goToSiteNode
      };
      const fn = types_fn[type];
      if (fn) {
        fn(response);
      } else {
        this.goToSiteNode(response)
      }
    },
    goToPort(response) {
      const { data, pattern } = response;
      if(/PORT-OLT/i.test(pattern)){//gpon
        this.$cache.setItem(`pon/${pattern}`, data);
        this.$router.replace({ name: "olt-port", params: { id: pattern, portProp: data } });
      }else{
        this.$cache.setItem(`port/${pattern}`, data);
        this.$router.replace({ name: "eth-port", params: { id: pattern, portProp: data } });
      };
    },
    goToPonPort(response) {
      const { data, pattern } = response;
      this.$cache.setItem(`pon/${pattern}`, data);
      this.$router.replace({ name: "olt-port", params: { id: pattern, portProp: data } });
    },
    async goToEntrance(response) {
      const entrance = response.data;
      this.$cache.setItem(`entrance/${entrance.id}`, entrance);
      let site;
      try {
        const url = buildUrl("search_ma", { pattern: entrance.site_id,component:'search-page' }, "/call/v1/search/");
        const response = await httpGet(url).catch(console.error);
        site = response.data;
        if (Array.isArray(site)) {
          site = site.find(({ type }) => /ДУ/gi.test(type)) || site?.[0] || null;
        }
      } catch (error) {
        console.warn('search_ma.error', error);
      }
      this.$router.replace({
        name: "entrance",
        params: {
          site_id: entrance.site_id,
          entrance_id: entrance.id,
          entranceProp: entrance,
          siteProp: site,
        },
      });
    },
    goToRack(response) {
      const { data, pattern } = response;
      this.$cache.setItem(`rack/${pattern}`, data);
      this.$router.replace({ name: "rack", params: { rack_id: pattern, rackProp: data } });
    },
    addCpesAsSubTypeAndGo(response){
      return this.goToDevicesPortsCpesList({
        ...response,
        data:[
          {devices:[]},
          {ports:[]},
          {cpes:response.data||[]}
        ]
      })
    },
    goToDevicesPortsCpesList(response) {
      const { data, pattern } = response;
      this.$router.replace({ name: "list_devices_ports_cpes", params: { id: pattern, data } });
    },
  },
});
