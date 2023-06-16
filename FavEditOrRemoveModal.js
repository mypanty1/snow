Vue.component('FavEditOrRemoveModal',{
  template:`<modal-container-custom name="FavEditOrRemoveModal" ref="modal" :footer="false" @close="onClose" :wrapperStyle="{'min-height':'auto','margin-top':'4px'}">
    <div class="padding-left-right-16px">
      <div v-if="editDescrMode" class="font--15-600 text-align-center">{{titleText}}</div>
      <div class="display-flex flex-direction-column gap-16px margin-top-16px">

        <template v-if="!editDescrMode">
          <button-main :label="btnModeLabel" @click="editDescrMode=!editDescrMode" :disabled="loadingDeleteFav" size="full" class="justify-content-start">
            <IcIcon slot="icon" name="Pen" color="#BBC1C7"/>
          </button-main>
          <button-main label="Удалить запись" @click="deleteThisFav" :disabled="loadingDeleteFav" size="full" class="justify-content-start">
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
