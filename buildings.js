function Buildings() {
  this.cluster = null;
  this.loading = false;
  this.waiting = false;
  this.terms = {
    //extended:window.isDevInst,
    format:'info',
  };

  this.onLoad = null;
  this.onDone = null;
  this.onClick = null;
  
  this.init = function () {
    this.cluster = new window.ymaps.Clusterer({
      preset: 'islands#invertedBlackClusterIcons',
      clusterBalloonContentLayoutWidth: 'auto',
      clusterBalloonContentLayoutHeight: 'auto',
      clusterBalloonContentLayout: 'cluster#balloonAccordion'
    });
  }
  
  this.callEvent = function (name) {
    var isFunc = this[name] && {}.toString.call(this[name]) === '[object Function]';
    if (isFunc) {
      return this[name];
    } else {
      return function () {};
    }
  }
  
  this.append = function (buildings) {
    const exist = this.cluster.getGeoObjects();
    this.cluster.add(buildings.filter(new_b=>{
      return !exist.some(old_b=>{
        return old_b.properties.get('buildingInfo')?.siteId==new_b.properties.get('buildingInfo')?.siteId;
      });
    }));
  }
  
  this.finish = function () {
    this.loading = false;
    this.callEvent('onDone')();
    if (this.waiting) {
      this.waiting = false;
      this.load();
    }
  }
  
  this.start = function () {
    this.loading = true;
    this.callEvent('onLoad')();
    const map = this.cluster.getMap();
    this.terms.zoom = map.getZoom();
    this.terms.coords = map.getCenter();
  }
  
  this.needSkip = function () {
    if (this.loading) {
      this.waiting = true;
      return true;
    }
    const map = this.cluster.getMap();
    const zoom = map && map.getZoom();
    if (!map || zoom < 16 || zoom > 19) { 
       console.warn('Map zoom is wrong:', zoom);
       return true;
    } else if (this.terms.coords) {
      if (this.terms.zoom > zoom) return false;

      const delta = [
        Math.abs(this.terms.coords[0] - map.getCenter()[0]),
        Math.abs(this.terms.coords[1] - map.getCenter()[1])
      ]
      const minDelta = 0.0005
      if (delta[0] < minDelta && delta[1] < minDelta) return true;
    }
    return false;
  }

  this.getAddressStr = ({house,building,block}={}) => {
    const str=[];//адрес может частично отсутствовать
    if(house){str.push(`д.${house}`)};
    if(building){str.push(`к.${building}`)};
    if(block){str.push(`стр.${block}`)};
    if(!str.length){return `?`};
    return str.join(' ');
  }
  
  this.getIconLayout=(buildingInfo)=>{
    //отображаем тип ООС только если он не ДУ (сотрудники путают ДУ и ШДУ)
    const nodeTypeText={'ДУ':'⟰'}[buildingInfo.nodeType]||buildingInfo.nodeType;
    let colorClass='placemark__no-activ';
    const icons=[];
    //наряды пользователя на эту площадку
    if(store?.getters?.['wfm/wfmTasks']?.find(task=>task.siteid==buildingInfo.siteId)){
      colorClass='placemark__activ-task';
      icons.push('<span class="ic-20 ic-ppr"></span>');
    };
    //инцденты из Remedy на этой площадке
    if(+buildingInfo.countIncidents!=0){
      colorClass='placemark__activ-incindent';
      icons.push('<span class="ic-20 ic-incident"></span>');
    };
    return window.ymaps.templateLayoutFactory.createClass(`<div class="placemark ${colorClass}">
        <div class="address">
          ${this.getAddressStr(buildingInfo.address)} ${nodeTypeText} ${icons.join(' ')}
        </div>
        <div class="content">
          ${/iptv/i.test(buildingInfo.tvType||'')?'<span class="font--13-500 tone-300 text-align-left">IpTV</span>':''}
        </div>
      </div>`,{
      build:function(){
        this.constructor.superclass.build.call(this); 
        this.getData().options.set('shape',{type:'Rectangle',coordinates:[[0,0],[85,34]]});
      }
    });
  }

  this.hintButtonCopyHandlerOnClick=null
  this.hintButtonCopyName='hintButtonCopyName';
  this.getHintContent=(buildingInfo)=>{
    function hintContent(s){return `<div style="font-size:14px;width:400px;">${s}<div>`};
    function rowHandler(s){return `<div style="white-space:normal;">${s}</div>`};
    const title=`<div class="display-flex align-items-center justify-content-space-between gap-2px">
      <div style="font-weight:700;">${buildingInfo.nodeName}</div>
      <button name="${this.hintButtonCopyName}" type="button" class="background-none-border-none-padding-0--focus-outline-none-background-none">
        <span class="ic-20 ic-copy main-lilac"></span>
      </button>
    </div>`;
    if(!buildingInfo.extended){return hintContent(title)};
    const {extended,extended:{counters},extended:{counters:{countFreeAccessPorts}}}=buildingInfo;
    const freePortsText=countFreeAccessPorts?`СВОБОДНО ${countFreeAccessPorts} ПОРТОВ`:'СВОБОДНЫХ ПОРТОВ НЕТ';
    const freePortsLabel=`<div style="width:fit-content;margin-left:auto;padding:2px 5px 3px;text-align:center;text-transform: uppercase;font-size:11px;font-weight:700;line-height: 1;color:#ffffff;background-color:${countFreeAccessPorts?'#00875a':'#bf2600'};border-radius:3px;">${freePortsText}</div>`;
    return hintContent([
      title,
      freePortsLabel,
      ...objectToRows(filterKeys(extended,{
        typeTech:             ['Технология','-'],
        reserve:              ['Наличие резерва (uplink)','-'],
        accessDetail:         ['Особенности доступа','-'],
        installLocationNe:    ['Позиция сетевого элемента (подъезд, этаж)','-'],
        managedCompany:       ['Управляющая компания','-'],
      }),{rowHandler}),
      ...objectToRows(filterKeys(counters,{
        entranceMax:          ['Кол-во подъездов','-'],
        floorMax:             ['Кол-во этажей','-'],
        countDevices:         ['Кол-во коммутаторов','-'],
        countPorts:           ['Кол-во портов','-'],
        countBusyPorts:       ['Кол-во занятых портов','-'],
        countAccessPorts:     ['Кол-во клиентских портов','-'],
        countTechPorts:       ['Кол-во технологических портов','-'],
        countFreeAccessPorts: ['Кол-во свободных клиентских портов','-'],
        countFreeTechPorts:   ['Кол-во свободных технологических портов','-'],
      }),{rowHandler}),
    ].join('<hr style="margin:2px;">'));
  }

  this.load = function () {
    if (this.needSkip()) return;
    this.start();
    try {
      //в v1 отсутствует правило для b2b
      httpGet(buildUrl('buildings', this.terms)).then(data => {
        const buildings = data;
        if (!Array.isArray(buildings)) {
          console.warn('Buildings loading issue. Result: ' + buildings);
          this.finish();
          return;
        } else if (buildings.length == 0) {
          this.finish();
          return;
        };
        this.append(buildings.map(buildingInfo=>{
          const point=new window.ymaps.Placemark(buildingInfo.coordinates,{
            buildingInfo,
            hintContent:this.getHintContent(buildingInfo),
            clusterCaption:`<a href="#/${buildingInfo.nodeName}"><span style="font-weight:700;">${buildingInfo.nodeType}</span> ${buildingInfo.nodeName}</a>`,
          },{
            iconLayout:this.getIconLayout(buildingInfo),
          });
          point.events.add('click',this.callEvent('onClick'));
          point.events.add('hintopen',(event)=>{
            const button=document.querySelector(`ymaps [name="${this.hintButtonCopyName}"]`);
            if(!button){return};
            button.addEventListener('click',this.hintButtonCopyHandlerOnClick=()=>copyToBuffer(objectToTable(flatObject(event.originalEvent.currentTarget.properties.get('buildingInfo')),{devider:'=',valueHandler:'null'})));
          });
          point.events.add('hintclose',(event)=>{
            this.hintButtonCopyHandlerOnClick=null;
          });
          //кэш для site-wrapper
          localStorageCache.setItem(atok('buildingInfo',buildingInfo.nodeName),buildingInfo)
          return point
        }));
        this.finish();
      }, data => {
        this.finish();
      }).catch((err) => {
        this.finish();
        console.warn('Map load buildings error (1) :>> ', this.terms);
        console.error(err)
      });
    } catch (err) {
      this.finish();
      console.warn('Map load buildings error (0) :>> ', this.terms);
      console.error(err)
    }    
  }

  this.init();
}
