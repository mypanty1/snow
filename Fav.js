app.$router.beforeEach((to,from,next)=>{
  if(to.name=='favs'){
    to.matched[0].components.default=Vue.component('FavsPage',{
      template:`<CardBlock name="FavsPage">
        <div class="display-flex align-items-center justify-content-space-between gap-8px margin-left-right-12px height-32px">
          <div slot="prefix">
            <button-sq v-if="deleteMode" @click="turnOffDeleteMode" class="size-20px min-width-20px">
              <IcIcon name="CloseSq" color="#5642BD"/>
            </button-sq>
          </div>
          <div slot="content">
            <span v-if="!deleteMode" @click="getFavs" class="font--15-600">Избранное<span v-if="favsCount"> • {{favsCount}} из 10</span></span>
          </div>
          <div slot="postfix">
            <button-sq v-if="!deleteMode" @click="toggleDeleteMode" :disabled="!favsCount" class="size-20px min-width-20px">
              <IcIcon name="Trashcan" :color="favsCount?'#5642BD':'#969FA8'"/>
            </button-sq>
            <div v-else class="display-flex align-items-center gap-4px">
              <span :style="{color:selectedCount?'#FF0032':'#969FA8'}" class="font--13-500 font-weight-700">Удалить</span>
              <button-sq @click="$refs.FavsDeleteConfirmModal?.open()" :disabled="!selectedCount" class="size-20px min-width-20px">
                <IcIcon name="Trashcan" :color="selectedCount?'#FF0032':'#969FA8'"/>
              </button-sq>
              <FavsDeleteConfirmModal ref="FavsDeleteConfirmModal" v-bind="{selected_fav_ids}"/>
            </div>
          </div>
        </div>
        <devider-line/>
    
        <loader-bootstrap v-if="favsLoading" text="получение избранного"/>
        <div v-else-if="favsCount" class="display-flex flex-direction-column-reverse gap-8px margin-left-right-8px" :class="[deleteMode&&'padding-left-32px']">
          <template v-for="({fav_id},key) of favs">
            <FavCard v-if="!deleteMode" :key="key" v-bind="{fav_id,disabled:deleteMode}"/>
            <CardCheckboxLeft v-else :key="key" :checked="selected[fav_id]" @change="$set(selected,fav_id,$event)">
              <FavCard v-bind="{fav_id,disabled:deleteMode}"/>
            </CardCheckboxLeft>
          </template>
        </div>
        <div v-else class="font--16-500 tone-300 text-align-center height-100px display-flex flex-direction-column justify-content-center">
          Избранные объекты отсутствуют
        </div>
      </CardBlock>`,
      data:()=>({
        deleteMode:false,
        selected:{},
      }),
      created(){
        if(!this.favsCount){
          this.getFavs();
        };
      },
      watch:{
        'favsLoading'(favsLoading){
          if(!favsLoading){
            this.deleteMode=false;
          }
        }
      },
      computed:{
        ...mapGetters({
          //username:'main/username',
          favsLoading:'favs/favsLoading',
          favsCount:'favs/favsCount',
          getLoad:'favs/getLoad',
          getResp:'favs/getResp',
        }),
        favs(){return this.getResp('favs')||{}},
        selectedCount(){return Object.values(this.selected).filter(v=>v).length},
        selected_fav_ids(){
          return Object.entries(this.selected).reduce((ids,[fav_id,isSelected])=>{
            if(isSelected){ids.push(fav_id)};
            return ids;
          },[]);
        }
      },
      methods:{
        ...mapActions({
          getFavs:'favs/getFavs',
        }),
        turnOffDeleteMode(){
          this.deleteMode=false;
          this.selected={};
        },
        toggleDeleteMode(){
          this.deleteMode=!this.deleteMode;
        },
      },
    });
  };
  next()
});

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
