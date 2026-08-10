(function(){
  "use strict";
  const $=(selector,root=document)=>root.querySelector(selector);
  const $$=(selector,root=document)=>Array.from(root.querySelectorAll(selector));
  const STORAGE_KEY="oc-museum-booklet-state-v1";
  const MOBILE_SPLIT_KEY="oc-museum-booklet-mobile-preview-ratio";
  const imageStore=window.OCImageStore?.create({databaseName:"oc-museum-booklet-images-v1",storeName:"images",referencePrefix:"museum-booklet-image:"});
  const viewport=$("#preview-viewport"),stage=$("#preview-stage");
  const FONT_MAP={serif:'"OC Noto Serif SC","Noto Serif SC","Songti SC",serif',sans:'"OC Noto Sans SC","Noto Sans SC","PingFang SC","Microsoft YaHei",sans-serif',bodoni:'"OC Bodoni Moda","OC Noto Serif SC","Noto Serif SC","Times New Roman",serif',mono:'"SFMono-Regular",Consolas,"Liberation Mono","OC Noto Sans SC","Noto Sans SC",monospace',huiwenFangsong:'"Huiwen-Fangsong","OC Noto Serif SC","Noto Serif SC",serif',huiwenMincho:'"Huiwen-mincho","OC Noto Serif SC","Noto Serif SC",serif',huiwenZhengkai:'"Huiwen-ZhengKai","OC Noto Serif SC","Noto Serif SC",serif'};
  const PAGE_WIDTH=396,PAGE_HEIGHT=840,FOLD_BLEED=12,FOLD_PRINT_SCALE=3;
  const PAGE_TYPES={cover:"封面",intro:"前言 / 引言",contents:"目录",section:"章节扉页",collection:"藏品页",feature:"图文专题",text:"纯文字页",blank:"空白页",back:"封底"};
  const CONTENTS_AUTO_CAPACITY={modern:8,classical:8,archive:9,editorial:8,zine:7,swiss:9,academia:8,luxury:7,pixel:8};
  const DEFAULT_COLORS={
    modern:{accent:"#49625b",accent2:"#c6b88f",paper:"#eeeee8",ink:"#1d2927",line:"#aeb7b2"},
    classical:{accent:"#713f3a",accent2:"#a78d59",paper:"#eee2c8",ink:"#3e3028",line:"#a89269"},
    archive:{accent:"#93483d",accent2:"#8b7c64",paper:"#ded4c2",ink:"#24211e",line:"#8f8676"},
    editorial:{accent:"#5e4d5b",accent2:"#8b7f85",paper:"#efedea",ink:"#292529",line:"#bcb5b8"},
    zine:{accent:"#252625",accent2:"#969792",paper:"#ececea",ink:"#171817",line:"#777873"},
    swiss:{accent:"#74423f",accent2:"#777d79",paper:"#f2f1eb",ink:"#1c1d1c",line:"#a7aaa3"},
    academia:{accent:"#b59657",accent2:"#715b40",paper:"#1b1614",ink:"#e4dac6",line:"#56483a"},
    luxury:{accent:"#252421",accent2:"#8c8882",paper:"#f2f1ee",ink:"#1c1b19",line:"#c8c5bf"},
    pixel:{accent:"#875d57",accent2:"#b8a79e",paper:"#d9d5cc",ink:"#302b2a",line:"#958a85"}
  };
  const clone=value=>JSON.parse(JSON.stringify(value));
  const uid=prefix=>`${prefix}-${Date.now()}-${Math.random().toString(16).slice(2)}`;
  const clamp=(value,min,max)=>Math.min(max,Math.max(min,Number(value)||0));
  const number=(value,fallback=0)=>Number.isFinite(Number(value))?Number(value):fallback;
  const esc=value=>String(value??"").replace(/[&<>"']/g,char=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#039;"}[char]));
  const safeName=value=>String(value||"museum-booklet").replace(/[\\/:*?"<>|]/g,"-").trim()||"museum-booklet";
  const imageUrl=reference=>imageStore?.resolve(reference)||"";
  const imageMarkup=(reference,alt="")=>imageUrl(reference)?`<img src="${esc(imageUrl(reference))}" alt="${esc(alt)}">`:"";
  const HEX_COLOR=/^#[0-9a-f]{6}$/i;
  function setupColorPicker(){
    if(typeof window.Coloris!=="function"){
      $$('[data-oc-color]').forEach(field=>field.readOnly=false);
      return;
    }
    window.Coloris({
      el:'[data-oc-color]',
      theme:"large",
      themeMode:"light",
      format:"hex",
      formatToggle:false,
      alpha:false,
      focusInput:false,
      selectInput:false,
      closeButton:true,
      closeLabel:"完成",
      margin:8,
      a11y:{open:"打开颜色选择器",close:"关闭颜色选择器",clear:"清除颜色",hueSlider:"色相",alphaSlider:"透明度",input:"颜色值",format:"颜色格式",swatch:"颜色样本",instruction:"使用方向键调整饱和度与亮度。"}
    });
  }
  function refreshColorPickers(root=document){
    const fields=$$('[data-oc-color]',root);
    if(typeof window.Coloris!=="function"){
      fields.forEach(field=>field.readOnly=false);
      return;
    }
    if(fields.length)window.Coloris.wrap(fields);
    fields.forEach(field=>{const wrapper=field.closest(".clr-field");if(wrapper)wrapper.style.color=field.value});
  }
  const tags=value=>String(value||"").split(/[、,，/]/).map(item=>item.trim()).filter(Boolean);

  function collectionSeed(name,index){
    const data=[
      ["潮痕短刃","NO.17","十九世纪末","钢、黄铜与旧木","31.4 × 4.8 cm","北岸旧港私人收藏","刀背留有无法辨认的航线刻痕，护手边缘带有长期海水侵蚀形成的浅色结晶。","航海、遗物"],
      ["无日期信件","NO.42","年代未详","棉纸与蓝黑墨水","21 × 14.8 cm","第七码头档案箱","信件没有日期与署名，纸张折痕中残留少量盐粒，正文提到一艘不存在于港务记录中的船。","纸本、书信"],
      ["蓝盐晶体","NO.08","采集于 2026","未知矿物","9.2 × 6.1 cm","灯塔下层储藏室","半透明蓝色晶体在低温环境中会发出微弱荧光，表面具有类似潮汐线的层状纹理。","矿物、标本"]
    ][index%3];
    return {id:uid("collection"),name:name||data[0],alias:"",reference:data[1],period:data[2],maker:"未记录",material:data[3],dimensions:data[4],origin:data[5],description:data[6],tags:data[7],image:""};
  }
  function defaultRunningLabel(type){return type==="blank"?"":type==="text"?"文章":PAGE_TYPES[type]||""}
  function pageSeed(type,title){
    const base={id:uid("page"),type,hidden:false,firstLineIndent:false,contentsTitle:"",contentsType:"",runningLabel:defaultRunningLabel(type),title:title||PAGE_TYPES[type],subtitle:"",body:"",quote:"",credit:"",image:"",backgroundImage:"",backgroundFit:"cover",backgroundOpacity:.35,collectionLayout:"single",collectionIds:[],contentsPageSize:"auto",contentsShowType:true,stickers:[]};
    if(type==="cover")Object.assign(base,{title:"夜航收藏",subtitle:"关于港口、记忆与失物的私人展览",body:"MUSEUM BOOKLET / 2026"});
    if(type==="intro")Object.assign(base,{title:"在潮水退去之后",subtitle:"策展引言",body:"这本小册记录了一组来源不明、却彼此产生呼应的藏品。它们来自旧港、废弃航线和私人信件，也来自一些无法被公共档案确认的夜晚。\n\n我们保留器物表面的磨损、折痕与沉积物，因为这些痕迹同样属于它们的历史。",quote:"物件不会替人记忆，但会替时间留下形状。"});
    if(type==="contents")Object.assign(base,{title:"目录",subtitle:"CONTENTS"});
    if(type==="section")Object.assign(base,{title:"潮汐之后",subtitle:"第一章",body:"港口遗物、未寄出的信件，以及从航线尽头带回的矿物标本。"});
    if(type==="collection")Object.assign(base,{title:"馆藏选录",subtitle:"SELECTED OBJECTS"});
    if(type==="feature")Object.assign(base,{title:"旧港的私人档案",subtitle:"FEATURE",body:"档案中的地点并不总能在现实地图上找到。它们可能已经改名，也可能只在某个人的记忆里存在。"});
    if(type==="text")Object.assign(base,{title:"关于物件与记忆",subtitle:"策展文章",quote:"收藏并不是保存时间，而是承认时间曾经经过。",body:"物件进入收藏之前，往往已经拥有漫长而沉默的经历。磨损、折痕与褪色并非缺陷，它们记录了使用者留下的动作，也记录了环境对材料施加的影响。\n\n当一件物品离开原本的生活场景，它的意义会发生变化。编号、描述与陈列方式为它建立新的关系，却不能替代那些已经遗失的故事。\n\n这本小册尝试保留两者之间的距离。我们提供可以确认的信息，也为尚未被解释的部分留下空白。",credit:"策展人 林照夜"});
    if(type==="back")Object.assign(base,{title:"北岸私人收藏室",subtitle:"PRIVATE COLLECTION",body:"仅用于虚构创作与角色设定。\n北岸区第七码头 · 预约开放"});
    return base;
  }
  function stickerSeed(text="展览注记"){
    return {id:uid("sticker"),type:"text",text,image:"",x:50,y:18,width:180,height:72,rotation:0,align:"center",font:"serif",fontSize:22,weight:"700",lineHeight:1.35,letterSpacing:0,color:"#806862",bgColor:"#f7f1ec",backgroundEnabled:false,padding:8,border:0,opacity:1,preserveRatio:true,stretch:false,locked:false,hidden:false};
  }
  function defaultState(){
    const collections=[collectionSeed("潮痕短刃",0),collectionSeed("无日期信件",1),collectionSeed("蓝盐晶体",2)];
    const pages=[
      pageSeed("cover"),
      pageSeed("intro"),
      pageSeed("contents"),
      pageSeed("section"),
      pageSeed("collection"),
      pageSeed("feature"),
      pageSeed("text"),
      pageSeed("blank"),
      pageSeed("back")
    ];
    pages[4].collectionIds=[collections[0].id];pages[4].collectionLayout="single";
    return {version:1,projectName:"夜航收藏展览小册",template:"modern",previewMode:"single",fontScale:100,exportScale:2,showPageNumbers:true,showFiction:true,showGuides:false,foldPrintBleed:false,colors:clone(DEFAULT_COLORS),booklet:{title:"夜航收藏",subtitle:"关于港口、记忆与失物的私人展览",institution:"北岸私人收藏室",curator:"林照夜",date:"2026 / 07",location:"北岸区第七码头"},collections,pages,spreadStickers:[],impositionStickers:{outside:[],inside:[]},stickerPlacement:"page",selectedPageId:pages[0].id,selectedCollectionId:collections[0].id,selectedStickerId:"",selectedStickerScope:"page"};
  }
  function normalizeSticker(item){
    return {id:String(item?.id||uid("sticker")),type:item?.type==="image"?"image":"text",text:String(item?.text||"TEXT"),image:imageStore?.normalize(item?.image)||"",x:clamp(item?.x??50,0,100),y:clamp(item?.y??20,0,100),width:clamp(item?.width||180,40,2400),height:clamp(item?.height||80,30,1000),rotation:number(item?.rotation),align:["left","center","right"].includes(item?.align)?item.align:"center",font:FONT_MAP[item?.font]?item.font:"serif",fontSize:clamp(item?.fontSize||22,8,120),weight:item?.weight==="700"?"700":"400",lineHeight:clamp(item?.lineHeight||1.35,.8,2.4),letterSpacing:clamp(item?.letterSpacing??0,-2,20),color:String(item?.color||"#806862"),bgColor:String(item?.bgColor||"#f7f1ec"),backgroundEnabled:Boolean(item?.backgroundEnabled),padding:clamp(item?.padding??8,0,40),border:clamp(item?.border??0,0,8),opacity:clamp(item?.opacity??1,.1,1),preserveRatio:item?.preserveRatio!==false,stretch:Boolean(item?.stretch),locked:Boolean(item?.locked),hidden:Boolean(item?.hidden)};
  }
  function normalize(raw){
    const base=defaultState(),next={...base,...raw,booklet:{...base.booklet,...raw?.booklet}};
    next.version=1;next.template=DEFAULT_COLORS[next.template]?next.template:"modern";next.previewMode=["single","continuous","fold-outside","fold-inside"].includes(next.previewMode)?next.previewMode:"single";next.foldPrintBleed=Boolean(raw?.foldPrintBleed);delete next.pagePrintBleed;delete next.foldCropMarks;delete next.foldSafeGuides;
    next.colors={};Object.keys(DEFAULT_COLORS).forEach(key=>next.colors[key]={...DEFAULT_COLORS[key],...(raw?.colors?.[key]||{})});
    if(raw?.colors?.swiss?.accent==="#b94437")next.colors.swiss.accent=DEFAULT_COLORS.swiss.accent;
    if(raw?.colors?.editorial?.accent==="#b06146"&&raw?.colors?.editorial?.paper==="#f0e9dc")next.colors.editorial={...DEFAULT_COLORS.editorial};
    if(raw?.colors?.pixel?.accent==="#68734a"&&raw?.colors?.pixel?.accent2==="#a7ad79"&&raw?.colors?.pixel?.paper==="#dfe0c4"&&raw?.colors?.pixel?.ink==="#272b22"&&raw?.colors?.pixel?.line==="#8e9472")next.colors.pixel={...DEFAULT_COLORS.pixel};
    next.collections=Array.isArray(raw?.collections)&&raw.collections.length?raw.collections.map((item,index)=>{const normalized={...collectionSeed(item?.name,index),...item,id:String(item?.id||uid("collection")),image:imageStore?.normalize(item?.image)||""};delete normalized.condition;delete normalized.curatorNote;return normalized}):base.collections;
    next.pages=Array.isArray(raw?.pages)&&raw.pages.length?raw.pages.map(item=>({...pageSeed(PAGE_TYPES[item?.type]?item.type:"feature"),...item,id:String(item?.id||uid("page")),type:PAGE_TYPES[item?.type]?item.type:"feature",hidden:Boolean(item?.hidden),firstLineIndent:Boolean(item?.firstLineIndent),contentsTitle:String(item?.contentsTitle||""),contentsType:String(item?.contentsType||""),runningLabel:item?.runningLabel==null?defaultRunningLabel(item?.type):String(item.runningLabel),image:imageStore?.normalize(item?.image)||"",backgroundImage:imageStore?.normalize(item?.backgroundImage)||"",backgroundFit:["cover","contain","stretch"].includes(item?.backgroundFit)?item.backgroundFit:"cover",backgroundOpacity:clamp(item?.backgroundOpacity??.35,0,1),collectionLayout:["single","double","triple"].includes(item?.collectionLayout)?item.collectionLayout:"single",collectionIds:Array.isArray(item?.collectionIds)?item.collectionIds.map(String):[],stickers:Array.isArray(item?.stickers)?item.stickers.map(normalizeSticker):[]})):base.pages;
    next.spreadStickers=Array.isArray(raw?.spreadStickers)?raw.spreadStickers.map(normalizeSticker):[];next.impositionStickers={outside:Array.isArray(raw?.impositionStickers?.outside)?raw.impositionStickers.outside.map(normalizeSticker):[],inside:Array.isArray(raw?.impositionStickers?.inside)?raw.impositionStickers.inside.map(normalizeSticker):[]};const stickerScopes=["page","spread","fold-outside","fold-inside"];next.stickerPlacement=stickerScopes.includes(raw?.stickerPlacement)?raw.stickerPlacement:"page";next.selectedStickerScope=stickerScopes.includes(raw?.selectedStickerScope)?raw.selectedStickerScope:"page";
    next.selectedPageId=next.pages.some(page=>page.id===raw?.selectedPageId)?raw.selectedPageId:next.pages[0].id;
    next.selectedCollectionId=next.collections.some(item=>item.id===raw?.selectedCollectionId)?raw.selectedCollectionId:next.collections[0]?.id||"";
    const current=next.pages.find(page=>page.id===next.selectedPageId),selectedPool=next.selectedStickerScope==="spread"?next.spreadStickers:next.selectedStickerScope==="fold-outside"?next.impositionStickers.outside:next.selectedStickerScope==="fold-inside"?next.impositionStickers.inside:current?.stickers||[];next.selectedStickerId=selectedPool.some(item=>item.id===raw?.selectedStickerId)?raw.selectedStickerId:"";
    return next;
  }

  let state=loadState(),history=[],future=[],inputCheckpoint=null,saveTimer=0,previewZoom=1,toastTimer=0,transformSession=null,cropSession=null,cropDrag=null,pageSortSession=null,tourIndex=0;
  function loadState(){try{return normalize(JSON.parse(localStorage.getItem(STORAGE_KEY)||"null")||defaultState())}catch{return defaultState()}}
  function scheduleSave(){clearTimeout(saveTimer);saveTimer=setTimeout(()=>{try{localStorage.setItem(STORAGE_KEY,JSON.stringify(state))}catch{}},180)}
  function pushHistory(snapshot=clone(state)){history.push(snapshot);if(history.length>60)history.shift();future=[];updateHistoryButtons()}
  function undo(){if(!history.length)return;future.push(clone(state));state=normalize(history.pop());renderAll();scheduleSave()}
  function redo(){if(!future.length)return;history.push(clone(state));state=normalize(future.pop());renderAll();scheduleSave()}
  function createNewProject(){if(!confirm("新建项目将恢复默认内容，当前项目可通过撤销找回。是否继续？"))return;pushHistory();state=defaultState();previewZoom=1;renderAll();scheduleSave();showToast("已新建项目")}
  function updateHistoryButtons(){$("#undo").disabled=!history.length;$("#redo").disabled=!future.length}
  function showToast(message){const toast=$("#toast");toast.textContent=message;toast.classList.add("show");clearTimeout(toastTimer);toastTimer=setTimeout(()=>toast.classList.remove("show"),1900)}
  function selectedPage(){return state.pages.find(page=>page.id===state.selectedPageId)||state.pages[0]}
  function selectedCollection(){return state.collections.find(item=>item.id===state.selectedCollectionId)||state.collections[0]||null}
  function stickerItems(scope=state.selectedStickerScope){if(scope==="spread")return state.spreadStickers;if(scope==="fold-outside")return state.impositionStickers.outside;if(scope==="fold-inside")return state.impositionStickers.inside;return selectedPage()?.stickers||[]}
  function selectedSticker(){return stickerItems().find(item=>item.id===state.selectedStickerId)||null}
  function visiblePages(){return state.pages.filter(page=>!page.hidden)}
  function directorySourcePages(){return state.pages.filter(page=>!["cover","back","contents"].includes(page.type))}
  function automaticContentsCapacity(){const base=CONTENTS_AUTO_CAPACITY[state.template]||8;return Math.max(5,Math.floor(base*100/Math.max(100,state.fontScale)))}
  function contentsCapacity(page){const custom=Number(page?.contentsPageSize);return [6,8,10,12].includes(custom)?custom:automaticContentsCapacity()}
  function expandedPages(source){
    const entryCount=directorySourcePages().length;
    return source.flatMap(page=>{
      if(page.type!=="contents")return [page];
      const capacity=contentsCapacity(page),count=Math.max(1,Math.ceil(entryCount/capacity));
      return Array.from({length:count},(_,index)=>({...page,id:`${page.id}::contents-${index}`,sourcePageId:page.id,contentsPageIndex:index,contentsPageCount:count,stickers:index===0?page.stickers:[]}));
    });
  }
  function renderedPages(){return expandedPages(visiblePages())}
  function numberedPages(){return expandedPages(state.pages)}
  function directoryEntries(){return numberedPages().map((page,index)=>({page,index})).filter(entry=>!["cover","back","contents"].includes(entry.page.type))}
  function imageReferences(){return [...state.collections.map(item=>item.image),...state.pages.flatMap(page=>[page.image,page.backgroundImage]),...state.pages.flatMap(page=>page.stickers.map(item=>item.image)),...state.spreadStickers.map(item=>item.image),...state.impositionStickers.outside.map(item=>item.image),...state.impositionStickers.inside.map(item=>item.image)].filter(Boolean)}
  async function preloadImages(){await imageStore?.preload(imageReferences())}

  function renderInputs(){
    $("#project-name").value=state.projectName;$("#preview-mode").value=state.previewMode;$("#sticker-placement").value=state.stickerPlacement;$("#font-scale").value=state.fontScale;$("#font-scale-output").textContent=`${state.fontScale}%`;$("#export-scale").value=state.exportScale;$("#show-page-numbers").checked=state.showPageNumbers;$("#show-fiction").checked=state.showFiction;$("#show-guides").checked=state.showGuides;$("#fold-print-bleed").checked=state.foldPrintBleed;
    $$('[data-booklet-field]').forEach(control=>control.value=state.booklet[control.dataset.bookletField]??"");
    $$('[data-template-option]').forEach(button=>button.classList.toggle("active",button.dataset.templateOption===state.template));
    const colors=state.colors[state.template];$$('[data-page-color]').forEach(control=>control.value=colors[control.dataset.pageColor]);refreshColorPickers($("#colors-card"));
  }
  function pageTitle(page,index){return page.title?.trim()||`${PAGE_TYPES[page.type]} ${String(index+1).padStart(2,"0")}`}
  function directoryTitle(page,index){return page.contentsTitle?.trim()||pageTitle(page,index)}
  function directoryType(page){return page.contentsType?.trim()||PAGE_TYPES[page.type]}
  function sectionNumber(page){
    const sourceId=page.sourcePageId||page.id;
    const index=renderedPages().filter(item=>item.type==="section").findIndex(item=>(item.sourcePageId||item.id)===sourceId);
    return String(Math.max(0,index)+1).padStart(2,"0");
  }
  function renderPageList(){
    const physical=numberedPages();
    $("#page-list").innerHTML=state.pages.map((page,index)=>{
      const physicalIndex=physical.findIndex(item=>(item.sourcePageId||item.id)===page.id),contentsCount=page.type==="contents"?physical.filter(item=>item.sourcePageId===page.id).length:1,numberLabel=physicalIndex>=0?String(physicalIndex+1).padStart(2,"0"):"--",typeLabel=`${PAGE_TYPES[page.type]}${page.type==="contents"?` · 自动 ${contentsCount} 页`:""}${page.hidden?" · 已隐藏":""}`;
      return `<article class="page-row ${page.id===state.selectedPageId?"active":""} ${page.hidden?"is-hidden":""}" data-page-id="${esc(page.id)}"><button class="page-drag-handle" data-page-drag type="button" aria-label="拖动页面排序" title="拖动排序">≡</button><span class="page-index">${numberLabel}</span><div class="row-copy" data-select-page="${esc(page.id)}"><b>${esc(pageTitle(page,index))}</b><small>${esc(typeLabel)}</small></div><div class="row-actions"><button class="visibility-toggle ${page.hidden?"is-off":""}" data-page-action="visibility" title="${page.hidden?"恢复显示":"隐藏页面"}" aria-label="${page.hidden?"恢复显示":"隐藏页面"}" aria-pressed="${page.hidden}">${page.hidden?"显":"隐"}</button><button data-page-action="export" title="导出当前页">⇩</button><button data-page-action="up" ${index===0?"disabled":""}>↑</button><button data-page-action="down" ${index===state.pages.length-1?"disabled":""}>↓</button><button data-page-action="copy">＋</button><button class="danger" data-page-action="delete" ${state.pages.length<=1?"disabled":""}>×</button></div></article>`;
    }).join("");
  }
  function commonPageFields(page){const collection=page.type==="collection";return `<label class="field"><span>${collection?"展品页标题":"页面标题"}</span><input data-page-field="title" value="${esc(page.title)}"></label><label class="field"><span>${collection?"展品页眉题 / 英文标题":"副标题 / 编号"}</span><input data-page-field="subtitle" value="${esc(page.subtitle)}" ${collection?'placeholder="留空则隐藏"':""}></label><label class="field"><span>页眉角标（右上角）</span><input data-page-field="runningLabel" value="${esc(page.runningLabel)}" placeholder="留空则隐藏"></label>${collection?'<p class="help-copy">标题与眉题只修改当前展品页，并同步用于全部模板的预览和导出。</p>':""}`}
  function imageEditorMarkup(page){return `<div class="upload-line"><div class="upload-preview">${imageMarkup(page.image,page.title)||esc((page.title||"图").slice(0,1))}</div><div class="upload-actions"><label class="small-button file-button">上传并裁切<input data-page-image-upload="${esc(page.id)}" type="file" accept="image/*"></label><button class="small-button" data-page-image-remove="${esc(page.id)}" type="button">移除</button></div></div>`}
  function backgroundEditorMarkup(page){
    const opacity=clamp(page.backgroundOpacity??.35,0,1),fit=page.backgroundFit||"cover";
    return `<section class="page-background-editor"><div class="background-editor-title"><b>页面背景</b><span>BACKGROUND</span></div><div class="upload-line"><div class="upload-preview background-preview">${imageMarkup(page.backgroundImage,"页面背景")||"背景"}</div><div class="upload-actions"><label class="small-button file-button">上传并裁切<input data-page-background-upload="${esc(page.id)}" type="file" accept="image/*"></label><button class="small-button" data-page-background-remove="${esc(page.id)}" type="button">移除</button></div></div><div class="field-grid two"><label class="field"><span>显示方式</span><select data-page-field="backgroundFit"><option value="cover" ${fit==="cover"?"selected":""}>铺满页面</option><option value="contain" ${fit==="contain"?"selected":""}>完整显示</option><option value="stretch" ${fit==="stretch"?"selected":""}>拉伸填充</option></select></label><label class="range-field"><span>透明度 <output data-background-opacity-output>${Math.round(opacity*100)}%</output></span><input data-page-field="backgroundOpacity" type="range" min="0" max="1" step=".05" value="${opacity}"></label></div><button class="small-button block-button" data-page-background-apply-all="${esc(page.id)}" type="button">应用到全部页面</button><p class="help-copy">背景位于页面内容与贴纸下方；透明度只影响背景图片。</p></section>`;
  }
  function collectionOptions(selectedId){return `<option value="">未选择</option>${state.collections.map(item=>`<option value="${esc(item.id)}" ${item.id===selectedId?"selected":""}>${esc(item.name)}</option>`).join("")}`}
  function renderPageEditor(){
    const page=selectedPage();if(!page)return;
    $("#page-editor-title").textContent=PAGE_TYPES[page.type];
    let html=page.type==="blank"?`<p class="help-copy">空白页只保留当前模板的页眉、页脚与页码；仍可添加文字或图片贴纸。</p><label class="field"><span>页眉角标（右上角）</span><input data-page-field="runningLabel" value="${esc(page.runningLabel)}" placeholder="留空则隐藏"></label>`:commonPageFields(page);
    if(page.type==="cover"||page.type==="intro"||page.type==="section"||page.type==="feature"||page.type==="back"){
      html+=`<label class="field"><span>${page.type==="cover"?"封面短句":"正文"}</span><textarea data-page-field="body" rows="${page.type==="intro"||page.type==="feature"?7:4}">${esc(page.body)}</textarea></label>`;
      if(page.type==="intro")html+=`<label class="field"><span>引用语</span><textarea data-page-field="quote" rows="3">${esc(page.quote)}</textarea></label>`;
      if(page.type!=="back")html+=imageEditorMarkup(page);
    }
    if(page.type==="text")html+=`<label class="field"><span>摘要 / 引题</span><textarea data-page-field="quote" rows="3">${esc(page.quote)}</textarea></label><label class="field"><span>正文</span><textarea data-page-field="body" rows="12">${esc(page.body)}</textarea></label><label class="field"><span>署名 / 文末注记</span><input data-page-field="credit" value="${esc(page.credit)}"></label><p class="help-copy">每次回车都会生成一个自然段。建议正文控制在约 350-650 个中文字；内容过长时页面会提示溢出。</p>`;
    if(page.type==="feature"||page.type==="text")html+=`<div class="check-grid"><label><input data-page-field="firstLineIndent" type="checkbox" ${page.firstLineIndent?"checked":""}> 全文首行缩进两字符</label></div><p class="help-copy">开启后每个自然段都会缩进；有首字下沉的模板从第二段开始缩进。</p>`;
    if(page.type==="contents"){
      const entryCount=directorySourcePages().length,capacity=contentsCapacity(page),pageCount=Math.max(1,Math.ceil(entryCount/capacity)),mode=String(page.contentsPageSize||"auto");
      const nameRows=directorySourcePages().map((entry,index)=>`<label class="directory-entry-editor"><span>${String(index+1).padStart(2,"0")}</span><input data-directory-page-id="${esc(entry.id)}" data-directory-field="contentsTitle" value="${esc(entry.contentsTitle||"")}" placeholder="${esc(pageTitle(entry,state.pages.indexOf(entry)))}"><input data-directory-page-id="${esc(entry.id)}" data-directory-field="contentsType" value="${esc(entry.contentsType||"")}" placeholder="${esc(PAGE_TYPES[entry.type])}"></label>`).join("");
      html+=`<label class="field"><span>每页目录条数</span><select data-page-field="contentsPageSize"><option value="auto" ${mode==="auto"?"selected":""}>自动（当前字号 ${automaticContentsCapacity()} 条）</option>${[6,8,10,12].map(value=>`<option value="${value}" ${mode===String(value)?"selected":""}>每页 ${value} 条</option>`).join("")}</select></label><div class="check-grid"><label><input data-page-field="contentsShowType" type="checkbox" ${page.contentsShowType!==false?"checked":""}> 显示页面类型</label></div><p class="help-copy">封面、封底和目录页本身不列入目录。当前共 ${entryCount} 条，按 ${capacity} 条一页自动生成 ${pageCount} 页目录。</p><div class="directory-name-editor"><div class="directory-editor-heading"><b>目录条目名称</b><span>目录标题</span><span>类型名称</span></div>${nameRows||'<p class="empty-note">暂无可编辑的目录条目。</p>'}</div>`;
    }
    if(page.type==="collection"){
      const count={single:1,double:2,triple:3}[page.collectionLayout];
      const descriptionLimit={single:180,double:90,triple:50}[page.collectionLayout];
      const longItems=page.collectionIds.slice(0,count).map(id=>state.collections.find(item=>item.id===id)).filter(item=>(item?.description||"").length>descriptionLimit);
      html+=`<div class="layout-switch">${[["single","1 件"],["double","2 件"],["triple","3 件"]].map(([key,label])=>`<button class="${page.collectionLayout===key?"active":""}" data-collection-layout="${key}" type="button">${label}</button>`).join("")}</div><div class="collection-slots">${Array.from({length:count},(_,index)=>`<label class="collection-slot-select"><span>${String(index+1).padStart(2,"0")}</span><select data-collection-slot="${index}">${collectionOptions(page.collectionIds[index]||"")}</select></label>`).join("")}</div><p class="help-copy ${longItems.length?"density-warning":""}">${longItems.length?`当前版式中「${longItems.map(item=>esc(item.name)).join("、")}」的说明较长，建议精简到约 ${descriptionLimit} 字，或减少本页藏品数量。`:"1 件显示完整说明；2 件使用双段结构；3 件使用目录式条目。切换数量不会删除藏品库资料。"}</p>`;
    }
    html+=backgroundEditorMarkup(page);
    html+=`<div class="check-grid"><label><input data-page-field="hidden" type="checkbox" ${page.hidden?"checked":""}> 隐藏当前页</label></div>`;
    $("#page-editor").innerHTML=html;
  }
  function renderCollectionList(){
    $("#collection-list").innerHTML=state.collections.map(item=>`<article class="collection-row ${item.id===state.selectedCollectionId?"active":""}" data-collection-id="${esc(item.id)}"><div class="row-copy" data-select-collection="${esc(item.id)}"><b>${esc(item.name)}</b><small>${esc(item.reference)} · ${esc(item.period)}</small></div><div class="row-actions"><button data-collection-action="copy">＋</button><button class="danger" data-collection-action="delete">×</button></div></article>`).join("")||'<p class="empty-note">尚未建立藏品。</p>';
  }
  function renderCollectionEditor(){
    const item=selectedCollection();if(!item){$("#collection-editor").innerHTML='<p class="empty-note">新建或选择一个藏品。</p>';return}
    $("#collection-editor").innerHTML=`<label class="field"><span>藏品名称</span><input data-collection-field="name" value="${esc(item.name)}"></label><div class="field-grid two"><label class="field"><span>馆藏编号</span><input data-collection-field="reference" value="${esc(item.reference)}"></label><label class="field"><span>年代 / 时期</span><input data-collection-field="period" value="${esc(item.period)}"></label><label class="field"><span>作者 / 制作者</span><input data-collection-field="maker" value="${esc(item.maker)}"></label><label class="field"><span>材质</span><input data-collection-field="material" value="${esc(item.material)}"></label><label class="field"><span>尺寸</span><input data-collection-field="dimensions" value="${esc(item.dimensions)}"></label><label class="field"><span>来源（留空则不显示）</span><input data-collection-field="origin" value="${esc(item.origin)}"></label></div><label class="field"><span>藏品简介</span><textarea data-collection-field="description" rows="5">${esc(item.description)}</textarea></label><label class="field"><span>标签（逗号分隔）</span><input data-collection-field="tags" value="${esc(item.tags)}"></label><div class="upload-line"><div class="upload-preview">${imageMarkup(item.image,item.name)||esc((item.name||"藏").slice(0,1))}</div><div class="upload-actions"><label class="small-button file-button">上传并裁切<input data-collection-image-upload="${esc(item.id)}" type="file" accept="image/*"></label><button class="small-button" data-collection-image-remove="${esc(item.id)}" type="button">移除</button></div></div>`;
  }

  function stickerLabel(item){return item.type==="image"?"图片贴纸":item.text.trim().split("\n")[0]||"文字贴纸"}
  function stickerScopeLabel(scope){return {page:"CURRENT PAGE",spread:"CROSS-PAGE","fold-outside":"FOLD OUTSIDE","fold-inside":"FOLD INSIDE"}[scope]||"STICKER"}
  function renderStickerList(){
    const groups=[{scope:"page",items:selectedPage()?.stickers||[]},{scope:"spread",items:state.spreadStickers},{scope:"fold-outside",items:state.impositionStickers.outside},{scope:"fold-inside",items:state.impositionStickers.inside}],entries=groups.flatMap(group=>group.items.map((item,index)=>({item,index,scope:group.scope,items:group.items})));
    $("#sticker-list").innerHTML=entries.length?entries.map(({item,index,scope,items})=>{const active=item.id===state.selectedStickerId&&scope===state.selectedStickerScope;return `<article class="sticker-row ${active?"active":""}" data-sticker-id="${esc(item.id)}" data-sticker-scope="${scope}"><div class="row-copy" data-select-sticker="${esc(item.id)}" data-sticker-scope="${scope}"><b>${esc(stickerLabel(item))}</b><small>${stickerScopeLabel(scope)} · ${item.type.toUpperCase()} · ${Math.round(item.rotation)}°${item.locked?" · LOCKED":""}</small></div><div class="row-actions"><button data-sticker-action="down" ${index===0?"disabled":""}>↓</button><button data-sticker-action="up" ${index===items.length-1?"disabled":""}>↑</button><button data-sticker-action="copy">＋</button></div></article>`}).join(""):'<p class="empty-note">当前页、连续画布与折页拼版尚未添加贴纸。</p>';
  }  function renderStickerEditor(){
    const item=selectedSticker();if(!item){$("#sticker-editor").innerHTML='<p class="empty-note">请选择或新建一个贴纸。</p>';return}
    const scope=state.selectedStickerScope,global=scope!=="page",maxWidth=global?2400:600,maxHeight=global?1000:500;
    $("#sticker-editor").innerHTML=`<p class="help-copy sticker-scope-note">${scope==="spread"?"连续跨页贴纸：完整效果显示在连续展开中，单页仅保留落入页面的部分。":scope==="fold-outside"?"折页外侧拼版贴纸：直接跨越外侧折线，仅进入 outside.png。":scope==="fold-inside"?"折页内侧拼版贴纸：直接跨越内侧折线，仅进入 inside.png。":"当前页贴纸：只属于当前选中的页面。"}</p>${item.type==="text"?`<label class="field"><span>文字</span><textarea data-sticker-field="text" rows="3">${esc(item.text)}</textarea></label><label class="field"><span>字体</span><select data-sticker-field="font"><option value="serif">中文衬线</option><option value="sans">中文无衬线</option><option value="bodoni">Bodoni Moda</option><option value="mono">打字机</option><option value="huiwenFangsong">汇文仿宋</option><option value="huiwenMincho">汇文明朝体</option><option value="huiwenZhengkai">汇文正楷</option></select></label><div class="align-buttons"><button class="${item.align==="left"?"active":""}" data-sticker-align="left">居左</button><button class="${item.align==="center"?"active":""}" data-sticker-align="center">居中</button><button class="${item.align==="right"?"active":""}" data-sticker-align="right">居右</button></div><div class="sticker-controls-grid"><label class="field"><span>字号</span><input data-sticker-field="fontSize" type="number" min="8" max="120"></label><label class="field"><span>行高</span><input data-sticker-field="lineHeight" type="number" min=".8" max="2.4" step=".05"></label><label class="field"><span>字间距</span><input data-sticker-field="letterSpacing" type="number" min="-2" max="20" step=".5"></label><label class="field"><span>文字颜色</span><input data-sticker-field="color" type="text" data-oc-color aria-label="贴纸文字颜色" autocomplete="off" spellcheck="false" maxlength="7" readonly></label><label class="field"><span>背景颜色</span><input data-sticker-field="bgColor" type="text" data-oc-color aria-label="贴纸背景颜色" autocomplete="off" spellcheck="false" maxlength="7" readonly></label><label class="field"><span>内边距</span><input data-sticker-field="padding" type="number" min="0" max="40"></label><label class="field"><span>边框</span><input data-sticker-field="border" type="number" min="0" max="8"></label></div><div class="check-grid"><label><input data-sticker-field="backgroundEnabled" type="checkbox"> 显示背景</label><label><input data-sticker-field="weight" type="checkbox"> 粗体</label></div>`:`<div class="check-grid"><label><input data-sticker-field="stretch" type="checkbox"> 自由拉伸</label><label><input data-sticker-field="preserveRatio" type="checkbox"> 保持比例</label></div>`}<div class="sticker-controls-grid"><label class="field"><span>X 位置 %</span><input data-sticker-field="x" type="number" min="0" max="100" step=".1"></label><label class="field"><span>Y 位置 %</span><input data-sticker-field="y" type="number" min="0" max="100" step=".1"></label><label class="field"><span>宽度</span><input data-sticker-field="width" type="number" min="40" max="${maxWidth}"></label><label class="field"><span>高度</span><input data-sticker-field="height" type="number" min="30" max="${maxHeight}"></label><label class="field"><span>旋转</span><input data-sticker-field="rotation" type="number"></label><label class="field"><span>透明度</span><input data-sticker-field="opacity" type="number" min=".1" max="1" step=".05"></label></div><div class="check-grid"><label><input data-sticker-field="locked" type="checkbox"> 锁定</label><label><input data-sticker-field="hidden" type="checkbox"> 隐藏</label></div><div class="layer-buttons"><button class="small-button" data-sticker-action="bottom">置于底层</button><button class="small-button" data-sticker-action="top">置于顶层</button><button class="small-button" data-sticker-action="copy">复制贴纸</button><button class="small-button" data-sticker-action="delete">删除贴纸</button></div>`;
    $$('[data-sticker-field]',$("#sticker-editor")).forEach(control=>{const key=control.dataset.stickerField;if(control.type==="checkbox")control.checked=key==="weight"?item.weight==="700":Boolean(item[key]);else control.value=item[key]??"";const update=()=>updateStickerControl(control);control.addEventListener("input",update);control.addEventListener("change",update)});refreshColorPickers($("#sticker-editor"));
  }
  function updateStickerControl(control){
    const item=selectedSticker();if(!item)return;const key=control.dataset.stickerField;if((key==="color"||key==="bgColor")&&!HEX_COLOR.test(control.value))return;let value;if(key==="weight")value=control.checked?"700":"400";else if(control.type==="checkbox")value=control.checked;else if(control.type==="number")value=number(control.value);else value=control.value;item[key]=value;if(key==="bgColor"){item.backgroundEnabled=true;const toggle=$("[data-sticker-field=backgroundEnabled]",$("#sticker-editor"));if(toggle)toggle.checked=true}renderPreview();scheduleSave();
  }

  function stickerMarkup(item,index,exporting=false,scope="page",position=null){
    const justify=item.align==="left"?"flex-start":item.align==="right"?"flex-end":"center",x=position?.x??item.x,y=position?.y??item.y;
    const content=item.type==="image"?imageMarkup(item.image,""):esc(item.text);
    const contentStyle=item.type==="text"?`style='padding:${item.padding}px;justify-content:${justify};border:${item.border}px solid ${item.color};color:${item.color};background-color:${item.backgroundEnabled?item.bgColor:"transparent"};font-family:${FONT_MAP[item.font]||FONT_MAP.serif};font-size:${item.fontSize}px;font-weight:${item.weight};line-height:${item.lineHeight};letter-spacing:${item.letterSpacing}px;text-align:${item.align};opacity:${item.opacity}'`:`style='opacity:${item.opacity}'`;
    const selected=!exporting&&item.id===state.selectedStickerId&&scope===state.selectedStickerScope;
    return `<div class="canvas-sticker ${item.type}-sticker ${selected?"is-selected":""} ${item.locked?"is-locked":""} ${item.hidden?"is-hidden":""}" data-sticker-id="${esc(item.id)}" data-sticker-scope="${scope}" style="--sx:${x}%;--sy:${y}%;--sz:${index+1};--sw:${item.width}px;--sh:${item.height}px;--sr:${item.rotation}deg;--sfit:${item.stretch?"fill":"contain"}"><div class="sticker-content" ${contentStyle}>${content}</div>${exporting?"":'<button class="sticker-handle sticker-rotate" data-transform="rotate" type="button"></button><button class="sticker-handle sticker-resize" data-transform="resize" type="button"></button>'}</div>`;
  }
  function spreadSliceMarkup(pageIndex){
    const pages=renderedPages(),count=pages.length;if(pageIndex<0||pageIndex>=count||!state.spreadStickers.length)return "";
    return state.spreadStickers.map((item,index)=>stickerMarkup(item,index,true,"spread",{x:item.x*count-pageIndex*100,y:item.y})).join("");
  }
  function textParagraphMarkup(value,indent=false,skipFirst=false){return String(value||"").split(/\n+/).map(item=>item.trim()).filter(Boolean).map((item,index)=>`<p class="${[index===0?"text-first":"",indent&&(!skipFirst||index>0)?"paragraph-indent":""].filter(Boolean).join(" ")}">${esc(item)}</p>`).join("")}
  function preservedLineBreakMarkup(value){return esc(String(value||"").replace(/\r\n?/g,"\n")).replace(/\n/g,"<br>")}
  function pageBackgroundMarkup(page){
    const source=imageUrl(page.backgroundImage);if(!source)return "";const fit=page.backgroundFit==="stretch"?"fill":page.backgroundFit==="contain"?"contain":"cover",opacity=clamp(page.backgroundOpacity??.35,0,1);
    return `<div class="page-background" style="opacity:${opacity}"><img src="${esc(source)}" alt="" style="object-fit:${fit}"></div>`;
  }
  function collectionCard(item,index,density){
    const tagMarkup=tags(item.tags).map(tag=>`<span>${esc(tag)}</span>`).join(""),origin=String(item.origin||"").trim();
    const footer=tagMarkup||origin?`<div class="object-foot">${tagMarkup?`<div class="object-tags">${tagMarkup}</div>`:""}${origin?`<p class="object-origin"><span>来源</span><b>${esc(origin)}</b></p>`:""}</div>`:"";
    return `<article class="object-card" data-collection-id="${esc(item.id)}"><div class="object-image">${imageMarkup(item.image,item.name)||esc((item.name||"藏").slice(0,1))}</div><div class="object-copy"><div class="object-index"><span>OBJECT ${String(index+1).padStart(2,"0")}</span><b>${esc(item.reference)}</b></div><h2>${esc(item.name)}</h2><p class="object-meta">${esc(item.period)} · ${esc(item.material)}<br>${esc(item.dimensions)}</p>${item.description?`<p class="object-description">${preservedLineBreakMarkup(item.description)}</p>`:""}${footer}</div></article>`;
  }  function pageContentMarkup(page,pageIndex){
    const image=imageMarkup(page.image,page.title),placeholder=esc((page.title||"页").slice(0,1));
    if(page.type==="blank")return "";
    if(page.type==="cover")return `<div class="cover-layout"><div class="cover-image">${image||placeholder}</div><div class="cover-copy"><span class="cover-kicker">${esc(page.body||"EXHIBITION BOOKLET")}</span><h1>${esc(page.title||state.booklet.title)}</h1><p>${esc(page.subtitle||state.booklet.subtitle)}</p></div><div class="cover-meta"><span>${esc(state.booklet.institution)}</span><span>${esc(state.booklet.date)}</span></div></div>`;
    if(page.type==="intro")return `<div class="intro-layout"><div class="page-heading"><span class="page-kicker">${esc(page.subtitle||"CURATORIAL INTRODUCTION")}</span><h1>${esc(page.title)}</h1></div><div class="intro-body"><div class="page-image">${image||placeholder}</div><div><p class="prose">${esc(page.body)}</p>${page.quote?`<blockquote class="quote">${esc(page.quote)}</blockquote>`:""}</div></div></div>`;
    if(page.type==="contents"){
      const entries=directoryEntries(),capacity=contentsCapacity(page),part=Number(page.contentsPageIndex)||0,total=Number(page.contentsPageCount)||Math.max(1,Math.ceil(entries.length/capacity)),slice=entries.slice(part*capacity,(part+1)*capacity),title=part?`${page.title} / 续`:page.title,subtitle=part?`${page.subtitle||"CONTENTS"} ${String(part+1).padStart(2,"0")} / ${String(total).padStart(2,"0")}`:page.subtitle||"CONTENTS",rows=slice.map(entry=>`<div class="contents-row"><span class="contents-number">${String(entry.index+1).padStart(2,"0")}</span><b class="contents-title">${esc(directoryTitle(entry.page,entry.index))}</b><span class="contents-type">${page.contentsShowType!==false?esc(directoryType(entry.page)):""}</span></div>`).join("");
      return `<div class="contents-layout"><div class="page-heading"><span class="page-kicker">${esc(subtitle)}</span><h1>${esc(title)}</h1></div>${rows?`<div class="contents-list">${rows}</div>`:'<p class="contents-empty">尚无可列入目录的页面。</p>'}</div>`;
    }
    if(page.type==="text")return `<article class="text-layout"><header class="text-heading"><span class="page-kicker">${esc(page.subtitle||"TEXT")}</span><h1>${esc(page.title)}</h1>${page.quote?`<p class="text-deck">${esc(page.quote)}</p>`:""}</header><div class="text-body ${page.firstLineIndent?"has-first-line-indent":""}">${textParagraphMarkup(page.body,page.firstLineIndent,["editorial","academia"].includes(state.template))}</div>${page.credit?`<p class="text-credit">${esc(page.credit)}</p>`:""}</article>`;
    if(page.type==="section")return `<div class="section-layout"><span class="section-number">${sectionNumber(page)}</span><span class="page-kicker">${esc(page.subtitle)}</span><h1>${esc(page.title)}</h1><p>${preservedLineBreakMarkup(page.body)}</p></div>`;
    if(page.type==="feature")return `<div class="feature-layout"><div class="page-heading"><span class="page-kicker">${esc(page.subtitle||"FEATURE")}</span><h1>${esc(page.title)}</h1></div><div class="feature-body"><div class="page-image">${image||placeholder}</div><div class="prose ${page.firstLineIndent?"has-first-line-indent":""}">${textParagraphMarkup(page.body,page.firstLineIndent)}</div></div></div>`;
    if(page.type==="back")return `<div class="back-layout"><div><span class="page-kicker">${esc(page.subtitle||"BACK COVER")}</span><h1>${esc(page.title||state.booklet.institution)}</h1></div><p>${esc(page.body)}</p><div class="back-meta">${esc(state.booklet.location)}<br>${esc(state.booklet.curator)} · ${esc(state.booklet.date)}</div></div>`;
    const density=page.collectionLayout||"single",count={single:1,double:2,triple:3}[density],items=Array.from({length:count},(_,index)=>state.collections.find(item=>item.id===page.collectionIds[index])||{...collectionSeed("未选择藏品",index),reference:"未编号",description:"请在左侧为当前页面选择藏品。",tags:"",image:""});
    return `<div class="collection-layout"><div class="collection-heading"><div>${page.subtitle?`<span class="page-kicker">${esc(page.subtitle)}</span>`:""}${page.title?`<h1>${esc(page.title)}</h1>`:""}</div><span>${count} OBJECT${count>1?"S":""}</span></div><div class="collection-grid" data-density="${density}">${items.map((item,index)=>collectionCard(item,index,density)).join("")}</div></div>`;
  }
  function pageMarkup(page,pageIndex,{exporting=false,blank=false,spreadSlice=false}={}){
    const colors=state.colors[state.template],sourceId=page.sourcePageId||page.id,selected=!exporting&&sourceId===state.selectedPageId;
    if(blank)return `<article class="booklet-page ${exporting?"is-exporting":""}" data-template="${state.template}" style="--page-paper:${colors.paper};--page-ink:${colors.ink};--page-accent:${colors.accent};--page-accent-2:${colors.accent2};--page-line:${colors.line};--page-scale:${state.fontScale/100}"><div class="page-shell"><div class="page-main"></div></div></article>`;
    const livePages=numberedPages(),sourceIdForNumber=page.sourcePageId||page.id;
    let visibleIndex=livePages.findIndex(item=>item.id===page.id);if(visibleIndex<0)visibleIndex=livePages.findIndex(item=>(item.sourcePageId||item.id)===sourceIdForNumber);
    const folio=String((visibleIndex>=0?visibleIndex:pageIndex)+1).padStart(2,"0"),pageTotal=String(livePages.length).padStart(2,"0");
    const tone=["cover","section","back"].includes(page.type)?"deep":"paper";
    return `<article class="booklet-page ${selected?"is-selected":""} ${exporting?"is-exporting":""}" data-page-id="${esc(sourceId)}" data-render-page-id="${esc(page.id)}" data-page-type="${page.type}" data-page-tone="${tone}" data-template="${state.template}" style="--page-paper:${colors.paper};--page-ink:${colors.ink};--page-accent:${colors.accent};--page-accent-2:${colors.accent2};--page-line:${colors.line};--page-scale:${state.fontScale/100}">${pageBackgroundMarkup(page)}<div class="page-shell"><header class="page-running"><span class="running-project">${esc(state.booklet.institution)}</span><span class="running-section">${esc(page.runningLabel??defaultRunningLabel(page.type))}</span></header><main class="page-main">${pageContentMarkup(page,pageIndex)}</main><footer class="page-footer"><span class="footer-mark">${state.showFiction?"MUSEUM / PERSONAL EDITION":""}</span>${state.showPageNumbers?`<span class="footer-folio"><b>${folio}</b><i>/</i><em>${pageTotal}</em></span>`:'<span class="footer-folio"></span>'}</footer></div><div class="sticker-layer">${page.stickers.map((item,index)=>stickerMarkup(item,index,exporting,"page")).join("")}</div>${spreadSlice?`<div class="spread-sticker-slice-layer">${spreadSliceMarkup(pageIndex)}</div>`:""}</article>`;
  }
  function foldEntries(){
    const source=renderedPages().map((page,index)=>({page,index}));
    if(source.length%2){const backIndex=Math.max(0,source.length-1);source.splice(backIndex,0,{page:{id:uid("blank"),type:"blank",stickers:[]},index:-1,blank:true})}
    const half=source.length/2,last=source[source.length-1];
    return {outside:[last,...source.slice(0,half-1).reverse()],inside:source.slice(half-1,source.length-1)};
  }
  function entriesForMode(mode){
    if(mode==="single"){
      const page=selectedPage(),matches=renderedPages().map((item,index)=>({page:item,index})).filter(entry=>(entry.page.sourcePageId||entry.page.id)===page.id);
      return matches.length?matches:[{page,index:state.pages.indexOf(page)}];
    }
    if(mode==="continuous")return renderedPages().map((page,index)=>({page,index}));
    const sides=foldEntries();return mode==="fold-inside"?sides.inside:sides.outside;
  }
  function stripMarkup(entries,{exporting=false,guides=state.showGuides,spread="none",imposition=""}={}){
    const pages=entries.map(entry=>pageMarkup(entry.page,entry.index,{exporting,blank:entry.blank,spreadSlice:spread==="slices"})).join("");
    const spreadOverlay=spread==="continuous"&&state.spreadStickers.length?`<div class="spread-sticker-layer">${state.spreadStickers.map((item,index)=>stickerMarkup(item,index,exporting,"spread")).join("")}</div>`:"";
    const impositionItems=imposition==="outside"?state.impositionStickers.outside:imposition==="inside"?state.impositionStickers.inside:[],impositionScope=imposition?`fold-${imposition}`:"";
    const impositionOverlay=impositionItems.length?`<div class="imposition-sticker-layer" data-imposition-side="${imposition}">${impositionItems.map((item,index)=>stickerMarkup(item,index,exporting,impositionScope)).join("")}</div>`:"";
    return `<div class="booklet-strip ${guides?"show-guides":""}">${pages}${spreadOverlay}${impositionOverlay}</div>`;
  }
  function printBleedSheetMarkup(entries,{exporting=false,side="",guides=false}={}){
    const trimWidth=Math.max(PAGE_WIDTH,entries.length*PAGE_WIDTH),scaleY=(PAGE_HEIGHT+FOLD_BLEED*2)/PAGE_HEIGHT;
    const strip=stripMarkup(entries,{exporting,guides:false,spread:"slices",imposition:side}),bleedClone=()=>stripMarkup(entries,{exporting:true,guides:false,spread:"slices",imposition:side});

    return `<div class="fold-print-sheet" style="--fold-trim-width:${trimWidth}px;--fold-bleed:${FOLD_BLEED}px;--fold-bleed-scale-y:${scaleY}"><div class="fold-bleed-window"><div class="fold-bleed-edge fold-bleed-top">${bleedClone()}</div><div class="fold-bleed-edge fold-bleed-bottom">${bleedClone()}</div><div class="fold-bleed-edge fold-bleed-left">${bleedClone()}</div><div class="fold-bleed-edge fold-bleed-right">${bleedClone()}</div></div><div class="fold-trim-region">${strip}</div></div>`;
  }
  function fitCollectionDescriptions(root){
    $$('.collection-grid .object-card',root).forEach(card=>{
      const copy=$(".object-copy",card),description=$(".object-description",card);if(!copy||!description)return;
      const cardStyle=getComputedStyle(card),copyStyle=getComputedStyle(copy),descriptionStyle=getComputedStyle(description),columns=cardStyle.gridTemplateColumns.trim().split(/\s+/).filter(Boolean).length;
      const number=value=>Number.parseFloat(value)||0,outerHeight=node=>{const style=getComputedStyle(node);return node.offsetHeight+number(style.marginTop)+number(style.marginBottom)};
      const capacity=columns>1?card.clientHeight-number(copyStyle.marginTop)-number(copyStyle.marginBottom):copy.clientHeight;
      const fixedHeight=Array.from(copy.children).filter(node=>node!==description).reduce((sum,node)=>sum+outerHeight(node),0);
      const available=capacity-number(copyStyle.paddingTop)-number(copyStyle.paddingBottom)-fixedHeight-number(descriptionStyle.marginTop)-number(descriptionStyle.marginBottom),lineHeight=number(descriptionStyle.lineHeight)||number(descriptionStyle.fontSize)*1.58;
      description.style.webkitLineClamp=String(Math.max(1,Math.floor(available/Math.max(1,lineHeight))));
    });
  }
  function renderPreview(){
    const entries=entriesForMode(state.previewMode),foldMode=["fold-outside","fold-inside"].includes(state.previewMode),spread=state.previewMode==="continuous"?"continuous":["single","fold-outside","fold-inside"].includes(state.previewMode)?"slices":"none",imposition=state.previewMode==="fold-outside"?"outside":state.previewMode==="fold-inside"?"inside":"";stage.innerHTML=foldMode&&state.foldPrintBleed?printBleedSheetMarkup(entries,{side:imposition,guides:state.showGuides}):stripMarkup(entries,{spread,imposition});const labels={single:selectedPage()?.type==="contents"&&entries.length>1?`当前目录 · ${entries.length} 页`:"当前页面",continuous:"连续展开","fold-outside":`折页外侧${state.foldPrintBleed?" · 印刷出血预览":""}`,"fold-inside":`折页内侧${state.foldPrintBleed?" · 印刷出血预览":""}`};$("#preview-label").textContent=labels[state.previewMode];requestAnimationFrame(()=>{fitCollectionDescriptions(stage);markOverflow(stage);fitCanvas()});
  }
  function markOverflow(root){$$('.booklet-page',root).forEach(page=>{const main=$(".page-main",page),overflow=Boolean(main&&main.scrollHeight>main.clientHeight+2);page.classList.toggle("has-overflow",overflow);$(".overflow-badge",page)?.remove();if(overflow&&!page.classList.contains("is-exporting")){const badge=document.createElement("span");badge.className="overflow-badge";badge.textContent="内容超出页面";page.append(badge)}})}
  function renderAll(){renderInputs();renderPageList();renderPageEditor();renderCollectionList();renderCollectionEditor();renderStickerList();renderStickerEditor();renderPreview();updateHistoryButtons()}

  function fitCanvas(){
    const canvas=$(".fold-print-sheet",stage)||$(".booklet-strip",stage);if(!canvas||!viewport)return;stage.style.transform="none";const width=canvas.offsetWidth,height=canvas.offsetHeight,gutter=innerWidth<=900?0:56,available=Math.max(1,viewport.clientWidth-gutter),base=Math.min(available/width,1),scale=clamp(base*previewZoom,.12,1.7);stage.style.transform=`scale(${scale})`;stage.style.transformOrigin="top left";stage.style.width=`${Math.round(width*scale)}px`;stage.style.height=`${Math.round(height*scale)}px`;$("#preview-zoom-output").textContent=`${Math.round(scale*100)}%`;
  }
  function selectPage(id){if(!state.pages.some(page=>page.id===id))return;state.selectedPageId=id;state.selectedStickerId="";state.selectedStickerScope="page";if(state.previewMode==="single")renderAll();else{renderPageList();renderPageEditor();renderStickerList();renderStickerEditor();renderPreview()}scheduleSave()}
  function selectCollection(id){state.selectedCollectionId=id;renderCollectionList();renderCollectionEditor();scheduleSave()}
  function pageAction(action,id){
    const index=state.pages.findIndex(page=>page.id===id);if(index<0)return;const page=state.pages[index];
    if(action==="export"){state.selectedPageId=id;return exportSelectedPage()}
    if(action==="delete"&&state.pages.length<=1){showToast("项目至少需要保留一页");return}
    pushHistory();
    if(action==="up"&&index>0)[state.pages[index-1],state.pages[index]]=[state.pages[index],state.pages[index-1]];
    if(action==="down"&&index<state.pages.length-1)[state.pages[index+1],state.pages[index]]=[state.pages[index],state.pages[index+1]];
    if(action==="visibility")page.hidden=!page.hidden;
    if(action==="copy"){const copy={...clone(page),id:uid("page"),title:`${page.title} · 副本`,stickers:page.stickers.map(item=>({...item,id:uid("sticker")}))};state.pages.splice(index+1,0,copy);state.selectedPageId=copy.id}
    if(action==="delete"){state.pages.splice(index,1);state.selectedPageId=state.pages[Math.max(0,index-1)]?.id||state.pages[0]?.id||"";state.selectedStickerId=""}
    renderAll();scheduleSave();
  }
  function beginPageSort(event){
    const handle=event.target.closest("[data-page-drag]");if(!handle||event.isPrimary===false||event.button>0)return;
    const row=handle.closest(".page-row[data-page-id]"),list=row?.parentElement;if(!row||!list)return;
    event.preventDefault();pageSortSession={pointerId:event.pointerId,row,list,before:clone(state),startOrder:state.pages.map(page=>page.id),scrollHost:handle.closest(".panel-scroll")};row.classList.add("is-dragging");document.body.classList.add("page-sorting");try{handle.setPointerCapture(event.pointerId)}catch{}
  }
  function movePageSort(event){
    if(!pageSortSession||event.pointerId!==pageSortSession.pointerId)return;event.preventDefault();
    const {row,list,scrollHost}=pageSortSession,target=document.elementFromPoint(event.clientX,event.clientY)?.closest(".page-row[data-page-id]");
    if(target&&target!==row&&target.parentElement===list){const rect=target.getBoundingClientRect(),after=event.clientY>rect.top+rect.height/2;list.insertBefore(row,after?target.nextSibling:target)}
    if(scrollHost){const rect=scrollHost.getBoundingClientRect();if(event.clientY<rect.top+46)scrollHost.scrollTop-=14;else if(event.clientY>rect.bottom-46)scrollHost.scrollTop+=14}
  }
  function endPageSort(event){
    if(!pageSortSession||event.pointerId!==pageSortSession.pointerId)return;
    const session=pageSortSession,order=$$(".page-row[data-page-id]",session.list).map(row=>row.dataset.pageId),changed=order.some((id,index)=>id!==session.startOrder[index]);pageSortSession=null;session.row.classList.remove("is-dragging");document.body.classList.remove("page-sorting");
    if(changed){const pages=new Map(state.pages.map(page=>[page.id,page]));pushHistory(session.before);state.pages=order.map(id=>pages.get(id)).filter(Boolean);renderAll();scheduleSave()}else renderPageList();
  }
  function collectionAction(action,id){
    const index=state.collections.findIndex(item=>item.id===id);if(index<0)return;pushHistory();if(action==="copy"){const copy={...clone(state.collections[index]),id:uid("collection"),name:`${state.collections[index].name} · 副本`};state.collections.splice(index+1,0,copy);state.selectedCollectionId=copy.id}if(action==="delete"){state.collections.splice(index,1);state.pages.forEach(page=>page.collectionIds=page.collectionIds.filter(value=>value!==id));state.selectedCollectionId=state.collections[Math.max(0,index-1)]?.id||""}renderAll();scheduleSave();
  }
  function stickerAction(action,id=state.selectedStickerId,scope=state.selectedStickerScope){
    const items=stickerItems(scope),index=items.findIndex(item=>item.id===id);if(index<0)return;pushHistory();const item=items[index];state.selectedStickerScope=scope;
    if(action==="up"&&index<items.length-1)[items[index],items[index+1]]=[items[index+1],items[index]];
    if(action==="down"&&index>0)[items[index],items[index-1]]=[items[index-1],items[index]];
    if(action==="top"){items.splice(index,1);items.push(item)}
    if(action==="bottom"){items.splice(index,1);items.unshift(item)}
    if(action==="copy"){const copy={...clone(item),id:uid("sticker"),x:clamp(item.x+4,0,100),y:clamp(item.y+4,0,100)};items.splice(index+1,0,copy);state.selectedStickerId=copy.id}
    if(action==="delete"){items.splice(index,1);state.selectedStickerId=""}
    renderAll();scheduleSave();
  }
  function selectSticker(id,scope="page"){
    state.selectedStickerId=id;state.selectedStickerScope=scope;const targetMode=scope==="spread"?"continuous":scope==="fold-outside"?"fold-outside":scope==="fold-inside"?"fold-inside":"";
    if(targetMode&&state.previewMode!==targetMode){state.previewMode=targetMode;renderInputs();renderPreview()}
    renderStickerList();renderStickerEditor();$$('.canvas-sticker').forEach(node=>node.classList.toggle("is-selected",node.dataset.stickerId===id&&node.dataset.stickerScope===scope));scheduleSave();
  }
  function placeSticker(item,scope){
    if(scope==="spread"){
      const pages=renderedPages(),sourceId=selectedPage()?.id,index=pages.findIndex(page=>(page.sourcePageId||page.id)===sourceId),count=Math.max(1,pages.length);item.x=((Math.max(0,index)+.5)/count)*100;state.spreadStickers.push(item);state.previewMode="continuous";
    }else if(scope==="fold-outside"||scope==="fold-inside"){
      const side=scope==="fold-outside"?"outside":"inside",entries=foldEntries()[side],sourceId=selectedPage()?.id,index=entries.findIndex(entry=>(entry.page.sourcePageId||entry.page.id)===sourceId),count=Math.max(1,entries.length);item.x=((index>=0?index+.5:count/2)/count)*100;state.impositionStickers[side].push(item);state.previewMode=scope;
    }else selectedPage().stickers.push(item);
    state.selectedStickerId=item.id;state.selectedStickerScope=scope;
  }  function addTextSticker(){const page=selectedPage();if(!page)return;pushHistory();const scope=state.stickerPlacement,item=stickerSeed($("#new-sticker-text").value.trim()||"展览注记");placeSticker(item,scope);$("#new-sticker-text").value="";renderAll();scheduleSave()}
  async function addImageSticker(file){const scope=state.stickerPlacement;try{const reference=await imageStore.storeDataUrl(await fileToDataUrl(file));await imageStore.preload([reference]);pushHistory();const item={...stickerSeed(""),id:uid("sticker"),type:"image",image:reference,width:190,height:150,font:"sans",fontSize:20,weight:"400",color:"#000000",padding:0};placeSticker(item,scope);renderAll();scheduleSave()}catch{showToast("请选择 15MB 以内的图片")}}

  function beginStickerTransform(event,kind,node){
    const scope=node.dataset.stickerScope||"page",pageNode=node.closest(".booklet-page"),pageId=pageNode?.dataset.pageId,root=scope==="spread"?node.closest(".spread-sticker-layer"):scope==="fold-outside"||scope==="fold-inside"?node.closest(".imposition-sticker-layer"):pageNode;
    if(scope==="page"&&pageId&&pageId!==state.selectedPageId){state.selectedPageId=pageId;state.selectedStickerId=node.dataset.stickerId;state.selectedStickerScope="page";renderPageList();renderPageEditor();renderStickerList();renderStickerEditor()}
    const items=stickerItems(scope),item=items.find(entry=>entry.id===node.dataset.stickerId);if(!item||item.locked||!root)return;event.preventDefault();selectSticker(item.id,scope);const rect=root.getBoundingClientRect(),visualScale=rect.width/root.offsetWidth,centerX=rect.left+item.x/100*rect.width,centerY=rect.top+item.y/100*rect.height;transformSession={pointerId:event.pointerId,kind,scope,item,node,root,before:clone(state),startX:event.clientX,startY:event.clientY,x:item.x,y:item.y,width:item.width,height:item.height,rotation:item.rotation,ratio:item.width/item.height,centerX,centerY,visualScale,rect};try{node.setPointerCapture(event.pointerId)}catch{}
  }
  function moveStickerTransform(event){const s=transformSession;if(!s||s.pointerId!==event.pointerId)return;event.preventDefault();const {item,node}=s,maxWidth=s.scope!=="page"?2400:600,maxHeight=s.scope!=="page"?1000:500;if(s.kind==="drag"){item.x=clamp(s.x+(event.clientX-s.startX)/s.rect.width*100,0,100);item.y=clamp(s.y+(event.clientY-s.startY)/s.rect.height*100,0,100);node.style.setProperty("--sx",`${item.x}%`);node.style.setProperty("--sy",`${item.y}%`)}else if(s.kind==="resize"){const width=clamp(s.width+(event.clientX-s.startX)/s.visualScale,40,maxWidth),height=item.preserveRatio?width/s.ratio:clamp(s.height+(event.clientY-s.startY)/s.visualScale,30,maxHeight);item.width=width;item.height=clamp(height,30,maxHeight);node.style.setProperty("--sw",`${item.width}px`);node.style.setProperty("--sh",`${item.height}px`)}else{const a=Math.atan2(s.startY-s.centerY,s.startX-s.centerX),b=Math.atan2(event.clientY-s.centerY,event.clientX-s.centerX);item.rotation=Math.round(s.rotation+(b-a)*180/Math.PI);node.style.setProperty("--sr",`${item.rotation}deg`)}}
  function endStickerTransform(event){if(!transformSession||transformSession.pointerId!==event.pointerId)return;pushHistory(transformSession.before);transformSession=null;renderAll();scheduleSave()}
  async function fileToDataUrl(file){if(!file?.type.startsWith("image/")||file.size>15*1024*1024)throw new Error("invalid image");return new Promise((resolve,reject)=>{const reader=new FileReader();reader.onload=()=>resolve(String(reader.result||""));reader.onerror=reject;reader.readAsDataURL(file)})}
  function cropTargetNode(target,root){if(target.kind==="background")return $$(".booklet-page",root).find(node=>node.dataset.pageId===target.id)||null;if(target.kind==="page"){const page=$$(".booklet-page",root).find(node=>node.dataset.pageId===target.id);return page?$(".cover-image,.page-image",page):null}const pages=$$(".booklet-page",root),preferred=pages.find(node=>node.dataset.pageId===state.selectedPageId),preferredCard=preferred?$$(".object-card",preferred).find(node=>node.dataset.collectionId===target.id):null,card=preferredCard||$$(".object-card",root).find(node=>node.dataset.collectionId===target.id);return card?$(".object-image",card):null}
  function cropAspectForTarget(target){let node=cropTargetNode(target,stage),host=null;if(!node){const page=target.kind==="page"||target.kind==="background"?state.pages.find(item=>item.id===target.id):[selectedPage(),...state.pages].find(item=>item?.type==="collection"&&item.collectionIds.includes(target.id));if(page){host=exportHost([{page,index:state.pages.indexOf(page)}]);node=cropTargetNode(target,host)}}const aspect=node&&node.offsetWidth>0&&node.offsetHeight>0?node.offsetWidth/node.offsetHeight:1;host?.remove();return clamp(aspect,.25,4)}
  function configureCropFrame(aspect){const output=$("#crop-canvas"),cropStage=$("#crop-stage"),size=1200;let width,height;if(aspect>=1){width=size;height=Math.max(300,Math.round(size/aspect))}else{height=size;width=Math.max(300,Math.round(size*aspect))}output.width=width;output.height=height;const maxWidth=Math.min(innerWidth*.76,430),maxHeight=Math.min(innerHeight*.5,430),displayScale=Math.min(maxWidth/width,maxHeight/height);cropStage.style.width=`${Math.round(width*displayScale)}px`;cropStage.style.height=`${Math.round(height*displayScale)}px`}
  async function openCrop(file,target){try{const source=await fileToDataUrl(file),image=new Image();image.onload=()=>{const aspect=cropAspectForTarget(target);cropSession={image,target,aspect,zoom:1,x:0,y:0};$("#crop-zoom").value="1";$("#crop-modal").hidden=false;document.body.classList.add("crop-open");configureCropFrame(aspect);drawCrop()};image.onerror=()=>showToast("图片无法读取");image.src=source}catch{showToast("请选择 15MB 以内的图片")}}
  function drawCrop(){if(!cropSession)return;const output=$("#crop-canvas"),ctx=output.getContext("2d"),image=cropSession.image,scale=Math.max(output.width/image.naturalWidth,output.height/image.naturalHeight)*cropSession.zoom,width=image.naturalWidth*scale,height=image.naturalHeight*scale,maxX=Math.max(0,(width-output.width)/2),maxY=Math.max(0,(height-output.height)/2);cropSession.x=clamp(cropSession.x,-maxX,maxX);cropSession.y=clamp(cropSession.y,-maxY,maxY);ctx.clearRect(0,0,output.width,output.height);ctx.drawImage(image,(output.width-width)/2+cropSession.x,(output.height-height)/2+cropSession.y,width,height)}
  function closeCrop(){cropSession=null;cropDrag=null;$("#crop-modal").hidden=true;document.body.classList.remove("crop-open")}
  async function applyCrop(){if(!cropSession)return;const reference=await imageStore.storeDataUrl($("#crop-canvas").toDataURL("image/jpeg",.9));await imageStore.preload([reference]);pushHistory();if(cropSession.target.kind==="page"){const page=state.pages.find(item=>item.id===cropSession.target.id);if(page)page.image=reference}if(cropSession.target.kind==="background"){const page=state.pages.find(item=>item.id===cropSession.target.id);if(page)page.backgroundImage=reference}if(cropSession.target.kind==="collection"){const item=state.collections.find(entry=>entry.id===cropSession.target.id);if(item)item.image=reference}closeCrop();renderAll();scheduleSave()}

  function setupMobileResizer(){
    const workspace=$(".workspace"),resizer=$("#mobile-resizer"),query=matchMedia("(max-width: 900px)");if(!workspace||!resizer)return;let ratio=.4,activePointer=null;try{const saved=Number(localStorage.getItem(MOBILE_SPLIT_KEY));if(saved>=.22&&saved<=.72)ratio=saved}catch{}
    const applyHeight=(height,persist=true)=>{if(!query.matches)return;const available=Math.max(1,workspace.clientHeight),min=Math.max(105,available*.22),max=Math.max(min,Math.min(available*.72,available-190)),next=clamp(height,min,max);ratio=next/available;workspace.style.setProperty("--mobile-preview-height",`${next}px`);if(persist)try{localStorage.setItem(MOBILE_SPLIT_KEY,String(ratio))}catch{}requestAnimationFrame(fitCanvas)};
    const fromPointer=event=>applyHeight(event.clientY-workspace.getBoundingClientRect().top);resizer.addEventListener("pointerdown",event=>{if(!query.matches||event.isPrimary===false)return;event.preventDefault();activePointer=event.pointerId;document.body.classList.add("mobile-resizing");try{resizer.setPointerCapture(event.pointerId)}catch{}fromPointer(event)});window.addEventListener("pointermove",event=>{if(activePointer===event.pointerId)fromPointer(event)},{passive:false});const stop=event=>{if(activePointer!==event.pointerId)return;activePointer=null;document.body.classList.remove("mobile-resizing");try{resizer.releasePointerCapture(event.pointerId)}catch{}};window.addEventListener("pointerup",stop);window.addEventListener("pointercancel",stop);resizer.addEventListener("touchstart",event=>event.preventDefault(),{passive:false});resizer.addEventListener("touchmove",event=>event.preventDefault(),{passive:false});const applyRatio=()=>{if(query.matches)applyHeight(workspace.clientHeight*ratio,false);else workspace.style.removeProperty("--mobile-preview-height")};window.addEventListener("resize",applyRatio);window.visualViewport?.addEventListener("resize",applyRatio);query.addEventListener?.("change",applyRatio);requestAnimationFrame(applyRatio);
  }

  function waitForImages(root){return Promise.all($$("img",root).map(image=>image.complete?image.decode?.().catch(()=>{}):new Promise(resolve=>{image.onload=resolve;image.onerror=resolve})))}
  function stabilizeExportGeometry(root){
    $$(".object-tags span",root).forEach(tag=>{const width=tag.getBoundingClientRect().width;if(width>0){tag.style.width=`${width}px`;tag.style.minWidth=`${width}px`;tag.style.maxWidth=`${width}px`;tag.style.flex=`0 0 ${width}px`}});
    $$('.booklet-page[data-template="classical"][data-page-type="cover"] .cover-image',root).forEach(image=>{
      const {width,height}=image.getBoundingClientRect();
      if(width>0&&height>0){image.style.width=`${width}px`;image.style.height=`${height}px`;image.style.minWidth=`${width}px`;image.style.minHeight=`${height}px`}
    });
  }
  function downloadUrl(url,name){const link=document.createElement("a");link.href=url;link.download=name;link.click()}
  function downloadBlob(blob,name){const url=URL.createObjectURL(blob);downloadUrl(url,name);setTimeout(()=>URL.revokeObjectURL(url),1500)}
  function dataUrlBytes(dataUrl){const binary=atob(dataUrl.split(",")[1]||""),bytes=new Uint8Array(binary.length);for(let i=0;i<binary.length;i++)bytes[i]=binary.charCodeAt(i);return bytes}
  function exportHost(entries,guides=false,spread="none",imposition="",printBleed=false){const host=document.createElement("div");host.style.cssText="position:fixed;left:-100000px;top:0;z-index:-1;width:max-content;background:transparent";host.innerHTML=printBleed?printBleedSheetMarkup(entries,{exporting:true,side:imposition,guides}):stripMarkup(entries,{exporting:true,guides,spread,imposition});document.body.append(host);markOverflow(host);return host}
  async function nodeToPng(node,pixelRatio=state.exportScale){
    await preloadImages();await waitForImages(node);await document.fonts?.ready;await document.fonts?.load('500 72px "OC Bodoni Moda"',"0123456789");if(state.template==="pixel")await document.fonts?.load('400 28px "PoxiaoPixel"',node.textContent||"像素博物志");await new Promise(resolve=>requestAnimationFrame(()=>requestAnimationFrame(resolve)));fitCollectionDescriptions(node);stabilizeExportGeometry(node);await new Promise(resolve=>requestAnimationFrame(resolve));markOverflow(node);if($(".booklet-page.has-overflow",node))throw new Error("CONTENT_OVERFLOW");const width=Math.ceil(Math.max(node.scrollWidth,node.offsetWidth)),height=Math.ceil(Math.max(node.scrollHeight,node.offsetHeight)),scale=Number(pixelRatio);if(width*scale>16384||height*scale>16384)throw new Error("EXPORT_TOO_LARGE");const collectedFontCSS=await window.OCExportFonts?.getFontEmbedCSS(node);const fontEmbedCSS=[collectedFontCSS,window.OC_MUSEUM_BODONI_FONT_CSS].filter(Boolean).join("\n");return window.htmlToImage.toPng(node,{width,height,pixelRatio:scale,cacheBust:false,skipFonts:true,fontEmbedCSS,style:{transform:"none",transformOrigin:"top left"},backgroundColor:"transparent"});
  }
  async function exportEntries(entries,label,guides=false,spread="none"){const host=exportHost(entries,guides,spread),node=$(".booklet-strip",host);try{const dataUrl=await nodeToPng(node),blob=new Blob([dataUrlBytes(dataUrl)],{type:"image/png"});downloadBlob(blob,`${safeName(state.projectName)}-${label}.png`);showToast(`${label}已导出`)}catch(error){console.error(error);showToast(error?.message==="CONTENT_OVERFLOW"?"页面内容超出，请先精简或拆页":error?.message==="EXPORT_TOO_LARGE"?"图片过长，请降低导出倍率或减少页面":"导出失败，请检查图片与字体资源")}finally{host.remove()}}
  async function exportSelectedPage(){const page=selectedPage();if(!page)return;const physical=numberedPages(),index=physical.findIndex(item=>(item.sourcePageId||item.id)===page.id);await exportEntries(entriesForMode("single"),`${String((index>=0?index:state.pages.indexOf(page))+1).padStart(2,"0")}-${page.type}`,false,"slices")}
  async function exportContinuous(){await exportEntries(renderedPages().map((page,index)=>({page,index})),"continuous",false,"continuous")}
  async function exportFoldZip(){
    const sides=foldEntries(),print=state.foldPrintBleed,outsideHost=exportHost(sides.outside,state.showGuides,"slices","outside",print),insideHost=exportHost(sides.inside,state.showGuides,"slices","inside",print),selector=print?".fold-print-sheet":".booklet-strip",scale=print?FOLD_PRINT_SCALE:state.exportScale;
    try{const outside=await nodeToPng($(selector,outsideHost),scale),inside=await nodeToPng($(selector,insideHost),scale),blob=await window.OCSimpleZip.create([{name:"outside.png",data:dataUrlBytes(outside)},{name:"inside.png",data:dataUrlBytes(inside)}]);downloadBlob(blob,`${safeName(state.projectName)}-fold.zip`);showToast(print?"折页印刷 ZIP 已导出":"折页内外侧 ZIP 已导出")}catch(error){console.error(error);showToast(error?.message==="CONTENT_OVERFLOW"?"存在内容超出的页面":error?.message==="EXPORT_TOO_LARGE"?"折页过长，请减少页面":"折页导出失败")}finally{outsideHost.remove();insideHost.remove()}
  }
  function saveJson(){downloadBlob(new Blob([JSON.stringify(state,null,2)],{type:"application/json"}),`${safeName(state.projectName)}.json`)}
  async function importJson(file){try{pushHistory();state=normalize(JSON.parse(await file.text()));await preloadImages();renderAll();scheduleSave();showToast("项目已导入")}catch{showToast("JSON 文件无法读取")}}

  const tourSteps=[
    {target:"#booklet-card",panel:"content",title:"填写小册资料",copy:"标题、机构、日期和策展人会自动进入封面、页眉与封底。"},
    {target:"#pages-card",panel:"content",title:"安排页面顺序",copy:"页面数量不限；普通完整导出会按照这里的顺序横向连接。"},
    {target:"#collection-card",panel:"content",title:"建立藏品库",copy:"藏品只录入一次，再放入一页 1、2 或 3 件的藏品页面。"},
    {target:"#templates-card",panel:"style",title:"选择模板",copy:"九套模板具有不同的封面、文字与藏品构图。"},
    {target:"#stickers-card",panel:"style",title:"选择贴纸画布",copy:"如果确定要制作折页拼版，跨页图片最好直接选择折页外侧或折页内侧，在最终拼版上完成构图；连续跨页更适合屏幕展开图。"},
    {target:"#view-card",panel:"style",title:"查看连续与折页",copy:"单页用于编辑；连续展开保持阅读顺序；折页模式预览内外侧拼版。"},
    {target:"#export-card",panel:"style",title:"选择导出方式",copy:"当前页与连续导出保持普通尺寸；折页可开启 3mm 出血并生成约 300dpi 的 outside 与 inside ZIP。"}
  ];
  function setMobilePanel(panel){document.body.dataset.mobilePanel=panel;$$('[data-mobile-panel]').forEach(button=>button.classList.toggle("active",button.dataset.mobilePanel===panel))}
  function positionTour(){const step=tourSteps[tourIndex],target=$(step.target);if(!target)return;if(innerWidth<=900&&step.panel)setMobilePanel(step.panel);target.scrollIntoView({block:"center"});requestAnimationFrame(()=>{const rect=target.getBoundingClientRect(),focus=$("#tour-focus"),card=$("#tour-card");focus.style.left=`${Math.max(4,rect.left-5)}px`;focus.style.top=`${Math.max(4,rect.top-5)}px`;focus.style.width=`${Math.min(innerWidth-8,rect.width+10)}px`;focus.style.height=`${Math.min(innerHeight-8,rect.height+10)}px`;if(innerWidth>900){card.style.left=`${Math.min(innerWidth-card.offsetWidth-14,Math.max(14,rect.right+14))}px`;card.style.top=`${Math.min(innerHeight-card.offsetHeight-14,Math.max(14,rect.top))}px`}$("#tour-title").textContent=step.title;$("#tour-copy").textContent=step.copy;$("#tour-progress").textContent=`${tourIndex+1} / ${tourSteps.length}`;$("#tour-prev").disabled=tourIndex===0;$("#tour-next").textContent=tourIndex===tourSteps.length-1?"完成":"下一步"})}
  function openTour(){tourIndex=0;$("#tour-overlay").hidden=false;document.body.classList.add("tour-open");positionTour()}
  function closeTour(){$("#tour-overlay").hidden=true;document.body.classList.remove("tour-open");try{localStorage.setItem("oc-museum-booklet-tour-seen","1")}catch{}}

  function bindEvents(){
    document.addEventListener("focusin",event=>{if(event.target.matches("input,textarea,select")&&!event.target.closest(".top-actions"))inputCheckpoint=clone(state)});
    document.addEventListener("input",event=>{const target=event.target;if(target===$("#project-name")){state.projectName=target.value;scheduleSave();return}if(target.matches('[data-booklet-field]')){state.booklet[target.dataset.bookletField]=target.value;renderPreview();scheduleSave();return}if(target.matches('[data-directory-page-id]')){const page=state.pages.find(item=>item.id===target.dataset.directoryPageId);if(page)page[target.dataset.directoryField]=target.value;renderPreview();scheduleSave();return}if(target.matches('[data-page-field]')&&target.type!=="checkbox"){const key=target.dataset.pageField;selectedPage()[key]=target.type==="range"?Number(target.value):target.value;if(key==="backgroundOpacity"){const output=target.closest(".page-background-editor")?.querySelector("[data-background-opacity-output]");if(output)output.textContent=`${Math.round(Number(target.value)*100)}%`}renderPageList();renderPreview();if(key==="contentsPageSize")requestAnimationFrame(renderPageEditor);scheduleSave();return}if(target.matches('[data-collection-field]')){const item=selectedCollection();if(item)item[target.dataset.collectionField]=target.value;renderCollectionList();renderPreview();scheduleSave();return}if(target.matches('[data-page-color]')){if(HEX_COLOR.test(target.value)){state.colors[state.template][target.dataset.pageColor]=target.value;renderPreview();scheduleSave()}return}if(target===$("#font-scale")){state.fontScale=Number(target.value);$("#font-scale-output").textContent=`${state.fontScale}%`;renderPageList();renderPageEditor();renderPreview();scheduleSave()}});
    document.addEventListener("change",event=>{const target=event.target;if(inputCheckpoint&&JSON.stringify(inputCheckpoint)!==JSON.stringify(state))pushHistory(inputCheckpoint);inputCheckpoint=null;if(target===$("#preview-mode")){state.previewMode=target.value;previewZoom=1;renderPreview();scheduleSave();return}if(target===$("#export-scale")){state.exportScale=Number(target.value);scheduleSave();return}if(target===$("#fold-print-bleed")){state.foldPrintBleed=target.checked;renderInputs();renderPreview();scheduleSave();return}if(target===$("#sticker-placement")){const scopes=["page","spread","fold-outside","fold-inside"];state.stickerPlacement=scopes.includes(target.value)?target.value:"page";const mode=state.stickerPlacement==="spread"?"continuous":state.stickerPlacement.startsWith("fold-")?state.stickerPlacement:"";if(mode){state.previewMode=mode;previewZoom=1;renderInputs();renderPreview()}scheduleSave();return}if(target===$("#show-page-numbers")||target===$("#show-fiction")||target===$("#show-guides")){const map={"show-page-numbers":"showPageNumbers","show-fiction":"showFiction","show-guides":"showGuides"};state[map[target.id]]=target.checked;renderPreview();scheduleSave();return}if(target.matches('[data-page-field]')&&target.type==="checkbox"){selectedPage()[target.dataset.pageField]=target.checked;renderAll();scheduleSave();return}if(target.matches('[data-collection-slot]')){const index=Number(target.dataset.collectionSlot),page=selectedPage();page.collectionIds[index]=target.value;renderPreview();scheduleSave();return}if(target.matches('[data-page-background-upload]')&&target.files?.[0]){openCrop(target.files[0],{kind:"background",id:target.dataset.pageBackgroundUpload});target.value="";return}if(target.matches('[data-page-image-upload]')&&target.files?.[0]){openCrop(target.files[0],{kind:"page",id:target.dataset.pageImageUpload});target.value="";return}if(target.matches('[data-collection-image-upload]')&&target.files?.[0]){openCrop(target.files[0],{kind:"collection",id:target.dataset.collectionImageUpload});target.value="";return}if(target===$("#sticker-image-input")&&target.files?.[0]){addImageSticker(target.files[0]);target.value="";return}if(target===$("#import-json")&&target.files?.[0]){importJson(target.files[0]);target.value=""}});
    document.addEventListener("pointerdown",beginPageSort);window.addEventListener("pointermove",movePageSort,{passive:false});window.addEventListener("pointerup",endPageSort);window.addEventListener("pointercancel",endPageSort);
    document.addEventListener("click",event=>{
      const pageSelect=event.target.closest('[data-select-page]');if(pageSelect)return selectPage(pageSelect.dataset.selectPage);
      const pageButton=event.target.closest('[data-page-action]');if(pageButton)return pageAction(pageButton.dataset.pageAction,pageButton.closest('[data-page-id]').dataset.pageId);
      const collectionSelect=event.target.closest('[data-select-collection]');if(collectionSelect)return selectCollection(collectionSelect.dataset.selectCollection);
      const collectionButton=event.target.closest('[data-collection-action]');if(collectionButton)return collectionAction(collectionButton.dataset.collectionAction,collectionButton.closest('[data-collection-id]').dataset.collectionId);
      const layout=event.target.closest('[data-collection-layout]');if(layout){pushHistory();selectedPage().collectionLayout=layout.dataset.collectionLayout;renderPageEditor();renderPreview();scheduleSave();return}
      const template=event.target.closest('[data-template-option]');if(template){pushHistory();state.template=template.dataset.templateOption;renderAll();scheduleSave();return}
      const stickerRow=event.target.closest('[data-select-sticker]');if(stickerRow)return selectSticker(stickerRow.dataset.selectSticker,stickerRow.dataset.stickerScope||"page");
      const stickerButton=event.target.closest('[data-sticker-action]');if(stickerButton){const row=stickerButton.closest('[data-sticker-id]');return stickerAction(stickerButton.dataset.stickerAction,row?.dataset.stickerId||state.selectedStickerId,row?.dataset.stickerScope||state.selectedStickerScope)}
      const align=event.target.closest('[data-sticker-align]');if(align){const item=selectedSticker();if(item){pushHistory();item.align=align.dataset.stickerAlign;renderAll();scheduleSave()}return}
      const removeBackground=event.target.closest("[data-page-background-remove]");if(removeBackground){const page=state.pages.find(item=>item.id===removeBackground.dataset.pageBackgroundRemove);if(page){pushHistory();page.backgroundImage="";renderAll();scheduleSave()}return}
      const applyBackground=event.target.closest("[data-page-background-apply-all]");if(applyBackground){const page=state.pages.find(item=>item.id===applyBackground.dataset.pageBackgroundApplyAll);if(!page?.backgroundImage){showToast("请先上传当前页面背景");return}pushHistory();state.pages.forEach(item=>{item.backgroundImage=page.backgroundImage;item.backgroundFit=page.backgroundFit;item.backgroundOpacity=page.backgroundOpacity});renderAll();scheduleSave();showToast("背景已应用到全部页面");return}
      const pageNode=event.target.closest('.booklet-page[data-page-id]');if(pageNode&&!event.target.closest('.canvas-sticker'))selectPage(pageNode.dataset.pageId);
      const removePageImage=event.target.closest('[data-page-image-remove]');if(removePageImage){pushHistory();const page=state.pages.find(item=>item.id===removePageImage.dataset.pageImageRemove);if(page)page.image="";renderAll();scheduleSave();return}
      const removeCollectionImage=event.target.closest('[data-collection-image-remove]');if(removeCollectionImage){pushHistory();const item=state.collections.find(entry=>entry.id===removeCollectionImage.dataset.collectionImageRemove);if(item)item.image="";renderAll();scheduleSave();return}
    });
    $("#add-page").addEventListener("click",()=>{pushHistory();const page=pageSeed($("#new-page-type").value);const backIndex=state.pages.findIndex(item=>item.type==="back");state.pages.splice(backIndex<0?state.pages.length:backIndex,0,page);state.selectedPageId=page.id;renderAll();scheduleSave()});
    $("#add-collection").addEventListener("click",()=>{pushHistory();const item=collectionSeed("新藏品",state.collections.length);state.collections.push(item);state.selectedCollectionId=item.id;renderAll();scheduleSave()});
    $("#add-text-sticker").addEventListener("click",addTextSticker);
    $("#reset-colors").addEventListener("click",()=>{pushHistory();state.colors[state.template]={...DEFAULT_COLORS[state.template]};renderAll();scheduleSave()});
    stage.addEventListener("pointerdown",event=>{const node=event.target.closest('.canvas-sticker');if(!node)return;beginStickerTransform(event,event.target.closest('[data-transform]')?.dataset.transform||"drag",node)});window.addEventListener("pointermove",moveStickerTransform,{passive:false});window.addEventListener("pointerup",endStickerTransform);window.addEventListener("pointercancel",endStickerTransform);
    $("#preview-prev").addEventListener("click",()=>{const index=state.pages.findIndex(item=>item.id===state.selectedPageId);if(index>0)selectPage(state.pages[index-1].id)});$("#preview-next").addEventListener("click",()=>{const index=state.pages.findIndex(item=>item.id===state.selectedPageId);if(index<state.pages.length-1)selectPage(state.pages[index+1].id)});$("#preview-zoom-out").addEventListener("click",()=>{previewZoom=clamp(previewZoom-.15,.5,2);fitCanvas()});$("#preview-zoom-in").addEventListener("click",()=>{previewZoom=clamp(previewZoom+.15,.5,2);fitCanvas()});$("#fit-preview").addEventListener("click",()=>{previewZoom=1;fitCanvas()});$("#focus-preview").addEventListener("click",()=>{document.body.classList.toggle("focus-mode");$("#focus-preview").textContent=document.body.classList.contains("focus-mode")?"退出":"专注";requestAnimationFrame(fitCanvas)});
    $("#export-selected").addEventListener("click",exportSelectedPage);$("#export-continuous-top").addEventListener("click",exportContinuous);$("#export-continuous").addEventListener("click",exportContinuous);$("#export-fold").addEventListener("click",exportFoldZip);
    $("#undo").addEventListener("click",undo);$("#redo").addEventListener("click",redo);$("#new-project").addEventListener("click",createNewProject);$("#save-json").addEventListener("click",saveJson);$("#import-trigger").addEventListener("click",()=>$("#import-json").click());
    $$('[data-crop-close]').forEach(button=>button.addEventListener("click",closeCrop));$("#crop-apply").addEventListener("click",applyCrop);$("#crop-zoom").addEventListener("input",event=>{if(cropSession){cropSession.zoom=Number(event.target.value);drawCrop()}});const cropStage=$("#crop-stage");cropStage.addEventListener("pointerdown",event=>{if(!cropSession)return;cropDrag={id:event.pointerId,x:event.clientX,y:event.clientY,startX:cropSession.x,startY:cropSession.y};try{cropStage.setPointerCapture(event.pointerId)}catch{}});cropStage.addEventListener("pointermove",event=>{if(!cropSession||!cropDrag||cropDrag.id!==event.pointerId)return;const width=Math.max(1,cropStage.clientWidth),height=Math.max(1,cropStage.clientHeight),output=$("#crop-canvas");cropSession.x=cropDrag.startX+(event.clientX-cropDrag.x)*output.width/width;cropSession.y=cropDrag.startY+(event.clientY-cropDrag.y)*output.height/height;drawCrop()});cropStage.addEventListener("pointerup",()=>cropDrag=null);cropStage.addEventListener("pointercancel",()=>cropDrag=null);
    $$('[data-mobile-panel]').forEach(button=>button.addEventListener("click",()=>setMobilePanel(button.dataset.mobilePanel)));$("#start-tour").addEventListener("click",openTour);$("#tour-skip").addEventListener("click",closeTour);$("#tour-prev").addEventListener("click",()=>{if(tourIndex>0){tourIndex--;positionTour()}});$("#tour-next").addEventListener("click",()=>{if(tourIndex>=tourSteps.length-1)return closeTour();tourIndex++;positionTour()});
    document.addEventListener("keydown",event=>{if(event.key==="Escape"){if(!$("#crop-modal").hidden)closeCrop();if(!$("#tour-overlay").hidden)closeTour();if(document.body.classList.contains("focus-mode"))$("#focus-preview").click()}if((event.ctrlKey||event.metaKey)&&event.key.toLowerCase()==="z"){event.preventDefault();event.shiftKey?redo():undo()}});window.addEventListener("resize",()=>{fitCanvas();if(!$("#tour-overlay").hidden)positionTour()});new ResizeObserver(()=>requestAnimationFrame(fitCanvas)).observe(viewport);window.addEventListener("pagehide",()=>{clearTimeout(saveTimer);try{localStorage.setItem(STORAGE_KEY,JSON.stringify(state))}catch{}});
  }
  async function init(){setupColorPicker();bindEvents();setupMobileResizer();await preloadImages();renderAll();await document.fonts?.ready;requestAnimationFrame(fitCanvas);setTimeout(()=>{try{if(!localStorage.getItem("oc-museum-booklet-tour-seen"))openTour()}catch{}},700)}
  init();
})();













