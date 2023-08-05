Vue.component('task-main-account',{
  template:`<div>
    <CardBlock>
      <title-main :text="task.tasktype" icon="task">
        <div class="display-flex align-items-center" style="padding-right: 12px;">
          <span class="tone-900" style="white-space: nowrap; padding-right: 8px;">{{ task.Assignment }}</span>
          <span class="ic-20 ic-timer tone-500"></span>
        </div>
      </title-main>

      <div class="font--13-500 tone-500 padding-left-16px">
        <span v-if="operationIcons.tv" class="ic-16 ic-tv"></span>
        <span v-if="operationIcons.internet" class="ic-16 ic-eth"></span>
        <span v-if="operationIcons.phone" class="ic-16 ic-sim"></span>
        <span v-if="operationIcons.any"> • </span>
        <span>{{task.NumberOrder}}</span>
      </div>
      <devider-line/>

      <div class="margin-left-right-16px">
        <link-block :text="'ЛС '+task.clientNumber" @click="copy(task.clientNumber)" type="medium" actionIcon="copy" class="padding-unset"/>
      </div>
      <devider-line/>

      <div class="margin-left-right-16px">
        <link-block :text="'СЗ/ЕИ '+task.Number_EIorNumberOrder" @click="copy(task.Number_EIorNumberOrder)" type="medium" actionIcon="copy" class="padding-unset"/>
      </div>
      <devider-line/>

      <info-text-sec title="Описание работ" :rows="[task.ProductOffering]" :text="task.description||'нет описания работ'"/>
      <devider-line/>

      <template v-if="/^1-/.test(task.Number_EIorNumberOrder)">
        <UrlLink :url="urlToWfmEdo"/>
        <devider-line/>
      </template>
      
      <link-block icon="task-status" :text="task.status" :actionIcon="hasBf?'right-link':'-'" @block-click="slideToEntrance" type="medium">
        <div slot="postfix" class="display-flex gap-4px main-orange" v-if="hasBf">
          <div>
            <span class="ic-20 ic-warning"></span>
          </div>
          <span class="font-size-14px">Блок-фактор</span>
        </div>
      </link-block>

      <template v-if="favBtnProps">
        <devider-line/>
        <FavBtnLinkBlock v-bind="favBtnProps"/>
      </template>
    </CardBlock>

    <CardBlock>
      <title-main :text="task.customer" icon="person" style="text-transform: capitalize;" />
      <account-call :phone='task.ContactPhoneNumber' :descr="task.customer" showSendSms/>
      <info-list icon="timer" :text="task.Appointment" comment="(ожидания клиентом)" />
    </CardBlock>

    <CardBlock>
      <title-main :text="site?.address||task.AddressSiebel" class="margin-top-8px">
        <button-sq type="large" icon="pin" @click="toMap"/>
      </title-main>
      <info-list icon="apartment" v-if="entrance" :text="titleEntranceFloorFlat"/>
      <devider-line />

      <link-block icon="du" :text="site?.node||task.siteid" :search="site?.node||task.siteid" type="medium" />
      <link-block icon="home" actionIcon="expand" text="Инфо по площадке и доступу" @block-click="open_modal_site_info" type="medium" />
    </CardBlock>

    <modal-container ref="modal_site_info">
      <SiteNodeDetails :siteNode="site"/>
    </modal-container>
  </div>`,
  props:{
    task:{type:Object,required:true},
  },
  data:()=>({
    site:null,
    entrances:[],
    entrance:null,
  }),
  computed:{
    ...mapGetters({
      isApp:'app/isApp',
    }),
    urlToWfmEdo(){
      return {
        url:`https://wfmmobile.mts.ru/WfmClientContractWeb/?taskCallId=${this.task.Number_EIorNumberOrder}`,
        title:'WFM ЭДО',
        description:this.isApp?'*переход из приложения пока может не работать\n(можно скопировать)':''
      }
    },
    favBtnProps(){
      if(!this.task){return};
      const {NumberOrder,Number_EIorNumberOrder,tasktype,AddressSiebel}=this.task;
      return {
        title:`${tasktype} ${AddressSiebel}`,
        name:NumberOrder,
        id:Number_EIorNumberOrder,
        descr:objectToTable(filterKeys(this.task,{
          NumberOrder           :'Наряд',
          tasktype              :'Тип',
          Number_EIorNumberOrder:['СЗ/MSK','-'],
          OperationConcatenation:['Операции','-'],
          AddressSiebel         :['Адрес','-'],
          customer              :['Абонент','-'],
          clientNumber          :['ЛС','-'],
          ContactPhoneNumber    :['Тлф','-'],
          ...tasktype!=='АВР'?{
            ProductOffering     :['Продукт','-']
          }:null,
        })),
      }
    },
    hasBf(){
      if(!this.entrance){return};//return true
      return getHasBfByEntrance(this.entrance);
    },
    flat(){
      const flat_i=this.task.AddressSiebel.search(/кв\./gi);
      return flat_i==-1?0:Number(this.task.AddressSiebel.substring(flat_i+4).replace(/\D/g,''));
    },
    floor(){
      if(!this.entrance||!this.flat){return ''};
      const floor=(this.entrance.floor||[]).find(({first,last})=>first<=this.flat&&last>=this.flat);
      return floor?floor.number:'';
    },
    titleEntranceFloorFlat(){
      return [
        this.entrance?.id?`подъезд ${this.entrance.number}`:'',
        this.floor?`этаж ${this.floor}`:'',
        this.flat?`кв ${this.flat}`:''
      ].filter(v=>v).join(' • ');
    },
    operationIcons() {
      const { service } = this.task;
      if (!Array.isArray(service)) return {};
      const hasInternet = service.includes('internet');
      const hasTv = service.includes('tv');
      const hasPhone = service.includes('phone');
      return {
        any: hasInternet || hasTv || hasPhone,
        internet: hasInternet,
        tv: hasTv,
        phone: hasPhone
      }
    },
  },
  created(){
    this.getSite();
    this.getEntrances();
  },
  methods:{
    slideToEntrance(){
      if(!this.hasBf){return};
      this.$emit('slide-to',{name:'entrance'});
    },
    async getSite(){
      let cache=this.$cache.getItem(`search_ma/${this.task.siteid}`);
      if(cache){
        this.getNode(cache);
        return;
      };
      try{
        let response=await httpGet(buildUrl("search_ma",{pattern:this.task.siteid},"/call/v1/search/"));
        if(response.type==='error'){throw new Error(response.message)};
        this.$cache.setItem(`search_ma/${this.task.siteid}`,response.data);
        this.getNode(response.data);
      }catch(error){
        console.warn('search_ma:site.error',error);
      };
    },
    getNode(response){
      if(Array.isArray(response)){
        this.site=response.find(({type})=>type.toUpperCase()==='ДУ')||response[0];
      }else{
        this.site=response;
      }
    },
    async getEntrances(){
      let cache=this.$cache.getItem(`site_entrance_list/${this.task.siteid}`);
      if(cache){this.getEntrance(cache);return;};
      try {
        let response=await httpGet(buildUrl('site_entrance_list',{site_id:this.task.siteid},'/call/v1/device/'));
        if(response.type==='error'){throw new Error(response.message)};
        if(!response.length){response=[]};
        this.$cache.setItem(`site_entrance_list/${this.task.siteid}`,response);
        this.getEntrance(response);
      }catch(error){
        console.warn('site_entrance_list.error',error);
      }
    },
    getEntrance(response){
      this.entrances=Array.isArray(response)?response:[];
      this.entrance=this.entrances.find(entrance=>this.flat>=entrance.flats.from&&this.flat<=entrance.flats.to);
      this.setEntranceSlide();
    },
    setEntranceSlide() {
      this.$emit('set:header',{
        component:'task-entrance',
        title:this.entrance?`Подъезд № ${this.entrance.number}`:(this.entrances&&this.entrances.length)?'Все подъезды':'Подъезды',
        subtitle:this.entrance?`кв ${this.entrance.flats.range}`:(this.entrances&&this.entrances.length)?`1 - ${this.entrances.length}`:'отсутствуют'
      });
    },
    copy(text){
      copyToBuffer(text);
    },
    open_modal_site_info(){
      this.$refs.modal_site_info.open();
    },
    toMap(){
      if(!this.site){return};
      this.$router.push({
        name:'map',
        query:{
          lat:this.site?.coordinates?.latitude,
          long:this.site?.coordinates?.longitude,
        },
      });
    },
  },
});
