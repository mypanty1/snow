//fix resize
Vue.component('IcTextArea', {
  template:`<section name="IcTextArea" class="ic-textarea" :class="classEl">
    <label>
      <span v-if="label || $slots.label" class="ic-textarea__label">
        <slot :label="label" name="label">{{ label }}</slot>
      </span>
      <div class="ic-textarea__textarea-wrap">
        <textarea
          v-model="inputValue"
          @keyup="keyUpEvent"
          @focus="$emit('focus')"
          v-bind="{ type, disabled, placeholder, rows, maxlength: maxLength }"
          class="ic-textarea__textarea" style="resize:none;"/>
      </div>
    </label>
  </section>`,
  props: {
    disabled: { type: Boolean, default: false },
    error: { type: Boolean, default: false },
    fullWidth: { type: Boolean, default: true },
    label: { type: String, default: '' },
    maxLength: { type: String, default: '' },
    placeholder: { type: String, default: '' },
    success: { type: Boolean, default: false },
    type: { type: String, default: 'text' },
    value: { default: '', validator: () => true },
    rows: { type: [String, Number], default: '' }
  },
  computed: {
    classEl() {
      return {
        'ic-textarea--full-width': this.fullWidth,
        'ic-textarea--error': this.error && !this.disabled,
        'ic-textarea--success': this.success
      };
    },
    inputValue: {
      get() { return this.value },
      set(value) { this.$emit('input', value) }
    }
  },
  methods: {
    keyUpEvent(event) {
      this.$emit('keyup', event);
    }
  },
});

//fix port
Vue.component('FavCard',{
  template:`<WhiteBoxRoundedShadow name="FavCard" v-if="fav" class="display-flex flex-direction-column gap-4px">
    <div class="font--15-600">{{title}}</div>
    <link-block :text="name" @block-click="click" textClass="font--13-500" actionIcon="right-link" type="medium" class="height-24px padding-left-0"/>
    <div class="bg-main-f2f3f7 border-radius-4px display-flex align-items-start justify-content-space-between padding-4px">
      <info-text-sec :text="descr" :rowsMax="expandDescr?0:1" class="padding-unset"/>
      <button-sq @click="expandDescr=!expandDescr" class="size-20px min-width-20px">
        <IcIcon :name="expandDescr?'fa fa-chevron-up':'fa fa-chevron-down'" color="#5642BD"/>
      </button-sq>
    </div>
    <div class="display-flex align-items-center justify-content-space-between">
      <span class="font--12-400 tone-500">Дата добавления: {{create_date_local}}</span>
      <button-sq @click="$refs.FavEditOrRemoveModal?.open()" :disabled="disabled" class="size-20px min-width-20px">
        <IcIcon name="Dots3" :color="!disabled?'#5642BD':'#969FA8'"/>
      </button-sq>
    </div>
    <FavEditOrRemoveModal ref="FavEditOrRemoveModal" v-bind="{fav_id}"/>
  </WhiteBoxRoundedShadow>`,
  props:{
    fav_id:{type:[String,Number],required:true},
    disabled:{type:Boolean,default:false}
  },
  data:()=>({
    expandDescr:false,
  }),
  computed:{
    ...mapGetters({
      getResp:'favs/getResp',
    }),
    fav(){return this.getResp('favs',this.fav_id)},
    create_date(){return this.fav?.create_date||''},//"2023-05-23T12:26:26.000+03:00",
    create_date_local(){return new Date(Date.parse(this.create_date)).toLocaleDateString()},
    //clear_date(){return this.fav?.clear_date||''},//"2023-06-22T12:26:26.000+03:00",
    //delete_date(){return this.fav?.delete_date||''},//null,
    title(){return this.fav?.object_type||''},//"ne",
    name(){return this.fav?.object_name||''},//"ETH_54KR_00340_14",
    descr(){return this.fav?.description||''},//"network-element-ETH_54KR_00340_14",
    object_id(){return this.fav?.object_id||''},//"9157470089313556000",
    path(){return this.fav?.url||''},//"/network-element-ETH_54KR_00340_14",
    //first_click_date(){return this.fav?.first_click_date||''},//"2023-05-23T14:45:11.000+03:00",
    //last_click_date(){return this.fav?.last_click_date||''},//"2023-05-23T14:45:11.000+03:00",
    //click_count(){return this.fav?.click_count||0},//1
  },
  methods:{
    ...mapActions({
      doFavClickLog:'favs/doFavClickLog',
    }),
    click(){
      const {fav_id,path,object_id}=this;
      this.doFavClickLog({fav_id})
      if(path){
        this.$router.push(/^PORT-/i.test(object_id)?`/${encodeURIComponent(object_id)}`:path);
      }else{
        this.$router.push({name:'search',params:{text:object_id}})
      };
    },
  },
});

//add btn border
Vue.component('FavEditOrRemoveModal',{
  template:`<modal-container-custom name="FavEditOrRemoveModal" ref="modal" :footer="false" @close="onClose" :wrapperStyle="{'min-height':'auto','margin-top':'4px'}">
    <div class="padding-left-right-16px">
      <div v-if="editDescrMode" class="font--15-600 text-align-center">{{titleText}}</div>
      <div class="display-flex flex-direction-column gap-16px margin-top-16px">

        <template v-if="!editDescrMode">
          <button-main :label="btnModeLabel" @click="editDescrMode=!editDescrMode" :disabled="loadingDeleteFav" size="full" class="justify-content-start">
            <IcIcon slot="icon" name="Pen" color="#BBC1C7"/>
          </button-main>
          <button-main label="Удалить зпаись" @click="deleteThisFav" :disabled="loadingDeleteFav" size="full" class="justify-content-start">
            <IcIcon slot="icon" name="Trashcan" color="#F95721"/>
          </button-main>
        </template>
        <div v-else class="display-flex flex-direction-column gap-4px">
          <IcTextArea :ictextareaid="fav_id" rows="14" :label="textLabel" v-model="newDescr" :disabled="loadingChangeDescr" :error="descrIsOver512"/>
          <div class="display-flex align-items-center justify-content-space-between margin-top--4px gap-4px">
            <div class="display-flex align-items-center gap-4px">
              <button-sq @click="clearDescr" class="size-20px min-width-20px" title="очистить">
                <IcIcon name="contract-off" color="#5642BD" size="16"/>
              </button-sq>
              <button-sq @click="copyDescr" class="size-20px min-width-20px" title="копировать">
                <IcIcon name="copy" color="#5642BD" size="16"/>
              </button-sq>
            </div>
            <div v-if="descrIsOver512" class="display-flex align-items-center gap-4px">
              <input-error text="Не более 512 символов" class="padding-unset"/>
              <button-sq @click="sliceDescr512" :disabled="sliceDescr512Loading" class="size-20px min-width-20px border-solid-1px-c8c7c7 border-radius-4px" title="обрезать до 512">
                <IcIcon :name="sliceDescr512Loading?'loading rotating':'left-link'" color="#5642BD" size="16"/>
              </button-sq>
            </div>
          </div>
          <button-main :label="btnChangeLabel" @click="saveNewDescr" :disabled="sliceDescr512Loading||loadingChangeDescr||newDescr==descr||descrIsOver512" buttonStyle="contained" size="full"/>
        </div>

      </div>
      <div class="margin-top-16px display-flex justify-content-space-around">
        <button-main label="Закрыть" @click="close" buttonStyle="outlined" size="medium"/>
      </div>
    </div>
  </modal-container-custom>`,
  props:{
    fav_id:{type:[Number,String],required:true}
  },
  data:()=>({
    textLabel:'Ваш комментарий',
    editDescrMode:false,
    newDescr:'',
    sliceDescr512Loading:false,
    sliceDescr512Timer:null,
  }),
  watch:{
    'sliceDescr512Loading'(loading){
      if(loading){
        this.textLabel='Ваш комментарий обрезается...';
      }else{
        this.textLabel='Ваш комментарий обрезан';
        this.sliceDescr512Timer=setTimeout(()=>{this.textLabel='Ваш комментарий'},2222);
      }
    }
  },
  computed:{
    ...mapGetters({
      getLoad:'favs/getLoad',
      getResp:'favs/getResp',
    }),
    fav(){return this.getResp('favs',this.fav_id)},
    descr(){return this.fav?.description||''},
    titleText(){return this.descr?'Редактирование комментария':'Добавление комментария'},
    btnModeLabel(){return this.descr?'Редактировать комментарий':'Добавить комментарий'},
    btnChangeLabel(){return !this.descr?'Добавить комментарий':'Сохранить изменения'},
    loadingChangeDescr(){return this.getLoad('change',this.fav_id)},
    loadingDeleteFav(){return this.getLoad('delete',this.fav_id)},
    descrIsOver512(){return this.newDescr.length>512},
  },
  methods:{
    open(){//public
      this.$refs.modal.open();
      this.newDescr=this.newDescr||this.descr;
    },
    close(){//public
      this.$refs.modal.close();
    },
    onClose(){
      this.editDescrMode=false;
      this.newDescr='';
    },
    ...mapActions({
      getFavs:'favs/getFavs',
      doChangeDescr:'favs/doChangeDescr',
      getFav:'favs/getFav',
      doDeleteFav:'favs/doDeleteFav',
    }),
    async sliceDescr512(){
      clearTimeout(this.sliceDescr512Timer);
      this.sliceDescr512Loading=true;
      this.$el.querySelector(`[ictextareaid="${this.fav_id}"] textarea`)?.scrollTo({top:1111});
      for(const i of this.newDescr) {
        if(this.newDescr.length<=512){break};
        this.newDescr=this.newDescr.slice(0,-1);
        await new Promise(resolve=>setTimeout(resolve,1));
      };
      this.sliceDescr512Loading=false;
    },
    clearDescr(){
      this.newDescr='';
    },
    copyDescr(){
      copyToBuffer(this.newDescr);
    },
    async deleteThisFav(){
      const {fav_id}=this;
      await this.doDeleteFav({fav_id});
      if(this.getResp('delete',fav_id)=='OK'){
        this.getFavs();
        this.close();
      };
    },
    async saveNewDescr(){
      const {fav_id,newDescr}=this;
      await this.doChangeDescr({fav_id,description:newDescr});
      if(this.getResp('change',fav_id)=='OK'){
        this.getFav({fav_id});
        this.close();
      };
    },
  },
});
