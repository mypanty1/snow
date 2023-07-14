Vue.component('FavBtn',{
  template:`<div name="FavBtn" class="display-contents">
    <button-sq @click="click" :disabled="disabled||loading||favsLoading" class="size-20px min-width-20px">
      <IcIcon :name="loading?'loading rotating':hasFavs?'BookmarkAddSolid':'BookmarkAdd'" :color="disabled?'#969FA8':loading?'#5642BD':hasFavs?'#FF0032':'#5642BD'"/>
    </button-sq>
  </div>`,
  props:{
    disabled:{type:Boolean,default:false},
    title:{type:[String,Number],default:'',required:true},
    name:{type:[String,Number],default:'',required:true},
    id:{type:[String,Number],default:'',required:true},
    path:{type:String,default:''},
    descr:{type:String,default:''},
  },
  computed:{
    ...mapGetters({
      favsLoading:'favs/favsLoading',
      getResp:'favs/getResp',
      getLoad:'favs/getLoad',
      selectFavs:'favs/selectFavs',
    }),
    favs(){
      const {name,id}=this;
      return this.selectFavs(id/*,name*/);
    },
    hasFavs(){return !isEmpty(this.favs)},
    key(){return atok(this.id,this.name,this.title)},
    loading(){return this.getLoad('create',this.key)},    
  },
  methods:{
    ...mapActions({
      getFavs:'favs/getFavs',
      doCreateFav:'favs/doCreateFav',
    }),
    async click(){
      if(this.hasFavs){
        this.$router.push({name:'favs'});
      }else{
        const {key,title,name,id,path,descr}=this;
        await this.doCreateFav({key,title,name,id,path:path||this.$route.path,descr});
        if(this.getResp('create',key)=='OK'){
          this.getFavs();
        };
      }
    }
  }
});
Vue.component('FavBtnDel',{
  template:`<div name="FavBtnDel" class="display-contents" v-if="!favsLoading&&hasFavs">
    <button-sq @click="click" :disabled="disabled||loading||favsLoading" class="size-20px min-width-20px">
      <IcIcon :name="loading?'loading rotating':'Trashcan'" :color="disabled?'#969FA8':loading?'#5642BD':'#5642BD'"/>
    </button-sq>
    <FavsDeleteConfirmModal ref="FavsDeleteConfirmModal" v-bind="{selected_fav_ids:favs_ids}"/>
  </div>`,
  props:{
    disabled:{type:Boolean,default:false},
    name:{type:[String,Number],default:'',required:true},
    id:{type:[String,Number],default:'',required:true},
  },
  computed:{
    ...mapGetters({
      favsLoading:'favs/favsLoading',
      getResp:'favs/getResp',
      getLoad:'favs/getLoad',
      selectFavs:'favs/selectFavs',
    }),
    favs(){
      const {name,id}=this;
      return this.selectFavs(id/*,name*/);
    },
    favs_ids(){return Object.keys(this.favs)},
    hasFavs(){return !isEmpty(this.favs)},
    key(){return atok(this.id,this.name,this.title)},
    loading(){return this.getLoad('delete',this.key)},    
  },
  methods:{
    ...mapActions({
      getFavs:'favs/getFavs',
    }),
    click(){
      this.$refs.FavsDeleteConfirmModal?.open();
    }
  }
});
Vue.component('FavBtnLinkBlock',{
  template:`<div name="FavBtnLinkBlock" class="display-contents">
    <link-block :text="hasFavs?'Сохранено в закладках':'Сохранить в закладки'" type="medium" class="padding-right-16px">
      <div slot="action" class="display-flex align-items-center gap-8px">
        <FavBtnDel v-bind="{disabled,id,name}" v-if="hasFavs"/>
        <FavBtn v-bind="{disabled,title,id,name,path,descr}"/>
      </div>
    </link-block>
  </div>`,
  props:{
    disabled:{type:Boolean,default:false},
    title:{type:[String,Number],default:'',required:true},
    name:{type:[String,Number],default:'',required:true},
    id:{type:[String,Number],default:'',required:true},
    path:{type:String,default:''},
    descr:{type:String,default:''},
  },
  computed:{
    ...mapGetters({
      selectFavs:'favs/selectFavs',
    }),
    favs(){
      const {name,id}=this;
      return this.selectFavs(id/*,name*/);
    },
    hasFavs(){return !isEmpty(this.favs)},  
  },
});
