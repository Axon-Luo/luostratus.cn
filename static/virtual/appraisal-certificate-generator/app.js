(function(){
  "use strict";

  const $=(selector,root=document)=>root.querySelector(selector);
  const $$=(selector,root=document)=>Array.from(root.querySelectorAll(selector));
  const STORAGE_KEY="oc-appraisal-certificate-state-v1";
  const MOBILE_SPLIT_KEY="oc-appraisal-mobile-preview-ratio";
  const imageStore=window.OCImageStore?.create({
    databaseName:"oc-appraisal-certificate-images-v1",
    storeName:"images",
    referencePrefix:"appraisal-image:"
  });
  const canvas=$("#certificate-canvas");
  const viewport=$("#preview-viewport");
  const stage=$("#preview-stage");
  const FONT_MAP={
    serif:'"OC Noto Serif SC","Noto Serif SC","Songti SC",serif',
    sans:'"Noto Sans SC","PingFang SC","Microsoft YaHei",sans-serif',
    bodoni:'"OC Bodoni Moda","Times New Roman",serif',
    mono:'"SFMono-Regular",Consolas,"Liberation Mono",monospace'
  };
  const TYPE_COPY={
    jewelry:{name:"珠宝鉴定",subject:"样品名称",category:"宝石或材质",meta:"尺寸、质量或编号"},
    artifact:{name:"文物鉴定",subject:"藏品名称",category:"年代与类别",meta:"材质、尺寸或来源"},
    judicial:{name:"司法鉴定",subject:"鉴定对象",category:"案件或事项类别",meta:"送检材料与对象资料"},
    injury:{name:"伤情鉴定",subject:"被鉴定人",category:"损伤类别",meta:"年龄、检查日期或相关资料"},
    general:{name:"通用鉴定",subject:"对象名称",category:"对象类别",meta:"对象资料"}
  };
  const TEMPLATE_COPY={
    gem:{name:"宝石实验室",kicker:"GEMOLOGICAL EXAMINATION"},
    museum:{name:"博物馆编目",kicker:"MUSEUM RESEARCH CATALOGUE"},
    judicial:{name:"司法意见书",kicker:"EXPERT EXAMINATION OPINION"},
    clinical:{name:"临床检查",kicker:"CLINICAL ASSESSMENT RECORD"},
    editorial:{name:"证据档案",kicker:"EDITORIAL EVIDENCE FILE"}
  };
  const TYPE_FINDINGS={
    jewelry:[
      ["质量","8.42 ct"],
      ["形状","椭圆形"],
      ["切工","混合切工"],
      ["尺寸","14.2 × 10.8 × 6.1 mm"],
      ["透明度","透明"],
      ["颜色","深蓝色"],
      ["矿物种","天然刚玉"],
      ["宝石品种","蓝宝石"],
      ["产地","缅甸（宝石学特征相符）"],
      ["处理状况","可见常规加热改善痕迹"],
      ["备注","未见其他显著处理特征"]
    ],
    artifact:[["推定年代","十九世纪末"],["材质","银、珐琅与玻璃"],["制作工艺","錾刻、嵌饰"],["保存状况","局部氧化，主体完整"]],
    judicial:[["送检材料","纸质文件 3 页"],["检验项目","书写特征与墨迹观察"],["检验结果","发现稳定对应特征"],["限制条件","样本数量有限"]],
    injury:[["检查部位","左前臂与肩部"],["表面所见","局部肿胀及擦伤"],["影像资料","未见明显骨性异常"],["恢复情况","活动度轻度受限"]],
    general:[["外观","结构完整"],["材质","复合未知材料"],["状态","稳定"],["特征","表面存在连续编号"]]
  };
  const DEFAULT_COLORS={
    gem:{accent:"#46666b",accent2:"#90a6a4",paper:"#f8faf9",ink:"#202828",line:"#b8c4c2"},
    museum:{accent:"#853f35",accent2:"#b09278",paper:"#e8e0d2",ink:"#302d2a",line:"#b9aa98"},
    judicial:{accent:"#39485b",accent2:"#7c8795",paper:"#f7f7f5",ink:"#171a1e",line:"#aeb4ba"},
    clinical:{accent:"#75877b",accent2:"#9eaaa3",paper:"#fbfcfb",ink:"#26302a",line:"#c5cec8"},
    editorial:{accent:"#7a332f",accent2:"#a09178",paper:"#e8dfcf",ink:"#25211c",line:"#9d907c"}
  };
  const clone=value=>JSON.parse(JSON.stringify(value));
  const uid=prefix=>`${prefix}-${Date.now()}-${Math.random().toString(16).slice(2)}`;
  const esc=value=>String(value??"").replace(/[&<>"']/g,char=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#039;"}[char]));
  const clamp=(value,min,max)=>Math.min(max,Math.max(min,Number(value)||0));
  const number=(value,fallback=0)=>Number.isFinite(Number(value))?Number(value):fallback;
  const getPath=(object,path)=>String(path).split(".").reduce((value,key)=>value?.[key],object);
  const setPath=(object,path,value)=>{const keys=String(path).split(".");const last=keys.pop();const target=keys.reduce((item,key)=>item[key]??={},object);target[last]=value};
  const imageUrl=reference=>imageStore?.resolve(reference)||"";
  const imageMarkup=(reference,alt="")=>imageUrl(reference)?`<img src="${esc(imageUrl(reference))}" alt="${esc(alt)}">`:"";
  const splitLines=value=>String(value||"").split(/\r?\n/).map(line=>line.trim()).filter(Boolean);

  function defaultState(){
    return {
      version:5,
      projectName:"未登记样本鉴定档案",
      type:"jewelry",
      template:"gem",
      paper:"portrait",
      fontScale:100,
      exportScale:2,
      showFiction:true,
      showPageNumber:true,
      colors:clone(DEFAULT_COLORS),
      document:{
        title:"珠宝玉石鉴定书",
        institution:"北岸材料与宝石研究室",
        reference:"NA-GEM-2026-017",
        issueDate:"2026 / 07 / 30",
        applicant:"私人收藏档案",
        acceptedDate:"2026 / 07 / 28",
        purpose:"对送检蓝色刻面宝石的材质、天然属性及可见处理特征进行鉴定。",
        methods:"显微放大观察\n折射率测试\n紫外荧光观察\n可见光谱比对",
        analysis:"样品呈椭圆形混合切工，内部可见细小针状包体与愈合裂隙。各项测试结果与天然刚玉的已知特征相符，未观察到明显扩散处理迹象。",
        conclusion:"送检样品鉴定为天然蓝宝石。样品可见常规加热改善痕迹，未发现其他显著处理特征。",
        notes:"本结论仅对当前送检样品及所列检测条件负责。",
        examiner:"林默",
        reviewer:"周衡",
        location:"北岸区第七码头研究室"
      },
      subject:{
        name:"夜航蓝宝石",
        category:"天然刚玉 · 蓝宝石",
        meta:"椭圆形混合切工 · 裸石",
        description:"深蓝色透明刻面宝石。冠部边缘有一处轻微磨损，亭部可见细小天然包体。",
        image:""
      },
      findings:TYPE_FINDINGS.jewelry.map(([label,value])=>({id:uid("finding"),label,value})),
      evidence:[
        {id:uid("evidence"),name:"检材 01 · 主样品",description:"透明封装袋送检，封口处有私人档案编号。",image:""},
        {id:uid("evidence"),name:"附件 01 · 委托记录",description:"一页纸质记录，包含样品来源与保管说明。",image:""}
      ],
      stickers:[],
      selectedStickerId:""
    };
  }

  function normalize(raw){
    const base=defaultState();
    const next={...base,...raw,document:{...base.document,...raw?.document},subject:{...base.subject,...raw?.subject}};
    next.type=TYPE_COPY[next.type]?next.type:"general";
    next.template=TEMPLATE_COPY[next.template]?next.template:"gem";
    next.paper=["portrait","landscape","long"].includes(next.paper)?next.paper:"portrait";
    next.colors={};
    Object.keys(DEFAULT_COLORS).forEach(key=>{next.colors[key]={...DEFAULT_COLORS[key],...(raw?.colors?.[key]||{})}});
    const legacyEditorialColors={accent:"#65705b",accent2:"#9da88f",paper:"#e7eadf",ink:"#171916",line:"#9da497"};
    const savedEditorialColors=raw?.colors?.editorial;
    const usesLegacyEditorialColors=savedEditorialColors&&Object.keys(legacyEditorialColors).every(key=>savedEditorialColors[key]===legacyEditorialColors[key]);
    if(Number(raw?.version||1)<5&&usesLegacyEditorialColors)next.colors.editorial={...DEFAULT_COLORS.editorial};
    next.version=5;
    next.findings=Array.isArray(raw?.findings)?raw.findings.map(item=>({id:String(item?.id||uid("finding")),label:String(item?.label||"检验项目"),value:String(item?.value||"")})):base.findings;
    const legacyJewelryLabels=["总质量","尺寸","颜色与透明度","检测特征"];
    const bilingualJewelryLabels=["质量 Weight","形状 Shape","切工 Cut","尺寸 Measurements","透明度 Transparency","颜色 Colour","矿物种 Species","宝石品种 Variety","产地 Origin","处理状况 Condition","备注 Comments"];
    const matchesPreset=labels=>next.findings.length===labels.length&&next.findings.every((item,index)=>item.label===labels[index]);
    const shouldExpandLegacyJewelry=next.type==="jewelry"&&Number(raw?.version||1)<3&&matchesPreset(legacyJewelryLabels);
    const shouldLocalizeJewelry=next.type==="jewelry"&&Number(raw?.version||1)<4&&matchesPreset(bilingualJewelryLabels);
    if(shouldExpandLegacyJewelry)next.findings=base.findings;
    else if(shouldLocalizeJewelry)next.findings=next.findings.map((item,index)=>({...item,label:base.findings[index].label}));
    next.evidence=Array.isArray(raw?.evidence)?raw.evidence.map(item=>({id:String(item?.id||uid("evidence")),name:String(item?.name||"检材"),description:String(item?.description||""),image:imageStore?.normalize(item?.image)||""})):base.evidence;
    next.subject.image=imageStore?.normalize(next.subject.image)||"";
    next.stickers=Array.isArray(raw?.stickers)?raw.stickers.map(item=>({
      id:String(item?.id||uid("sticker")),
      type:item?.type==="image"?"image":"text",
      text:String(item?.text||"TEXT"),
      image:imageStore?.normalize(item?.image)||"",
      x:clamp(item?.x??50,0,100),
      y:clamp(item?.y??20,0,100),
      width:clamp(item?.width||190,40,600),
      height:clamp(item?.height||90,30,500),
      rotation:number(item?.rotation),
      align:["left","center","right"].includes(item?.align)?item.align:"center",
      font:FONT_MAP[item?.font]?item.font:"serif",
      fontSize:clamp(item?.fontSize||24,8,120),
      weight:item?.weight==="700"?"700":"400",
      lineHeight:clamp(item?.lineHeight||1.3,.8,2.4),
      color:String(item?.color||"#65705b"),
      bgColor:String(item?.bgColor||"#ffffff"),
      backgroundEnabled:Boolean(item?.backgroundEnabled),
      padding:clamp(item?.padding??8,0,40),
      border:clamp(item?.border??0,0,8),
      opacity:clamp(item?.opacity??1,.1,1),
      preserveRatio:item?.preserveRatio!==false,
      stretch:Boolean(item?.stretch),
      locked:Boolean(item?.locked),
      hidden:Boolean(item?.hidden)
    })):base.stickers;
    next.selectedStickerId=next.stickers.some(item=>item.id===raw?.selectedStickerId)?raw.selectedStickerId:"";
    return next;
  }

  let state=loadState();
  let history=[];
  let future=[];
  let saveTimer=0;
  let inputCheckpoint=null;
  let cropSession=null;
  let cropDrag=null;
  let transformSession=null;
  let tourIndex=0;
  let toastTimer=0;
  let previewZoom=1;

  function loadState(){
    try{return normalize(JSON.parse(localStorage.getItem(STORAGE_KEY)||"null")||defaultState())}
    catch{return defaultState()}
  }
  function scheduleSave(){
    clearTimeout(saveTimer);
    saveTimer=setTimeout(()=>{try{localStorage.setItem(STORAGE_KEY,JSON.stringify(state))}catch{}},180);
  }
  function pushHistory(snapshot=clone(state)){
    history.push(snapshot);
    if(history.length>60)history.shift();
    future=[];
    updateHistoryButtons();
  }
  function updateHistoryButtons(){
    $("#undo").disabled=!history.length;
    $("#redo").disabled=!future.length;
  }
  function undo(){
    if(!history.length)return;
    future.push(clone(state));
    state=normalize(history.pop());
    renderAll();
    scheduleSave();
  }
  function redo(){
    if(!future.length)return;
    history.push(clone(state));
    state=normalize(future.pop());
    renderAll();
    scheduleSave();
  }
  function showToast(message){
    const toast=$("#toast");
    toast.textContent=message;
    toast.classList.add("show");
    clearTimeout(toastTimer);
    toastTimer=setTimeout(()=>toast.classList.remove("show"),1800);
  }

  function imageReferences(){
    return [state.subject.image,...state.evidence.map(item=>item.image),...state.stickers.map(item=>item.image)].filter(Boolean);
  }
  async function preloadImages(){await imageStore?.preload(imageReferences())}

  function renderInputs(){
    $("#project-name").value=state.projectName;
    $("#appraisal-type").value=state.type;
    $("#paper-mode").value=state.paper;
    $("#font-scale").value=state.fontScale;
    $("#font-scale-output").textContent=`${state.fontScale}%`;
    $("#export-scale").value=state.exportScale;
    $("#show-fiction").checked=state.showFiction;
    $("#show-page-number").checked=state.showPageNumber;
    $$("[data-path]").forEach(control=>{control.value=getPath(state,control.dataset.path)??""});
    $$('[data-template-option]').forEach(button=>button.classList.toggle('active',button.dataset.templateOption===state.template));
    const colors=state.colors[state.template]||DEFAULT_COLORS[state.template];
    $$('[data-doc-color]').forEach(control=>{control.value=colors[control.dataset.docColor]||control.value});
    const type=TYPE_COPY[state.type];
    $("#subject-name-label").textContent=type.subject;
    $("#subject-category-label").textContent=type.category;
    $("#subject-meta-label").textContent=type.meta;
    $("#subject-editor-title").textContent=state.type==="injury"?"被鉴定人":state.type==="jewelry"?"鉴定样品":"鉴定对象";
    $("#main-image-preview").innerHTML=imageMarkup(state.subject.image,state.subject.name)||esc((state.subject.name||"样").slice(0,1));
  }

  function renderFindings(){
    $("#finding-list").innerHTML=state.findings.length?state.findings.map((item,index)=>`
      <div class="finding-row" data-finding-id="${esc(item.id)}">
        <input data-finding-field="label" value="${esc(item.label)}" aria-label="检验项目名称">
        <input data-finding-field="value" value="${esc(item.value)}" aria-label="检验结果">
        <div class="row-actions">
          <button data-finding-action="up" type="button" ${index===0?"disabled":""} aria-label="上移">↑</button>
          <button data-finding-action="delete" type="button" aria-label="删除">×</button>
        </div>
      </div>`).join(""):'<p class="empty-note">尚未添加检验项目。</p>';
  }

  function renderEvidence(){
    $("#evidence-list").innerHTML=state.evidence.length?state.evidence.map((item,index)=>`
      <div class="evidence-row" data-evidence-id="${esc(item.id)}">
        <div class="evidence-thumb">${imageMarkup(item.image,item.name)||String(index+1).padStart(2,"0")}</div>
        <div class="evidence-fields">
          <input data-evidence-field="name" value="${esc(item.name)}" aria-label="检材名称">
          <textarea data-evidence-field="description" rows="2" aria-label="检材说明">${esc(item.description)}</textarea>
          <label class="small-button evidence-upload">上传并裁切<input data-evidence-upload="${esc(item.id)}" type="file" accept="image/*"></label>
        </div>
        <div class="row-actions">
          <button data-evidence-action="up" type="button" ${index===0?"disabled":""} aria-label="上移">↑</button>
          <button data-evidence-action="copy" type="button" aria-label="复制">＋</button>
          <button data-evidence-action="delete" type="button" aria-label="删除">×</button>
        </div>
      </div>`).join(""):'<p class="empty-note">尚未添加检材或附件。</p>';
  }

  function selectedSticker(){return state.stickers.find(item=>item.id===state.selectedStickerId)||null}
  function stickerLabel(item){return item.type==="image"?"图片贴纸":(item.text.trim().split("\n")[0]||"文字贴纸")}
  function renderStickerList(){
    $("#sticker-list").innerHTML=state.stickers.length?state.stickers.map((item,index)=>`
      <article class="sticker-row ${item.id===state.selectedStickerId?"active":""}" data-select-sticker="${esc(item.id)}">
        <div><strong>${esc(stickerLabel(item))}</strong><span>${item.type.toUpperCase()} · ${Math.round(item.rotation)}°${item.locked?" · LOCKED":""}</span></div>
        <div class="row-actions">
          <button data-sticker-action="down" data-id="${esc(item.id)}" type="button" ${index===0?"disabled":""}>↓</button>
          <button data-sticker-action="up" data-id="${esc(item.id)}" type="button" ${index===state.stickers.length-1?"disabled":""}>↑</button>
          <button data-sticker-action="copy" data-id="${esc(item.id)}" type="button">＋</button>
        </div>
      </article>`).join(""):'<p class="empty-note">尚未添加贴纸。</p>';
  }

  function renderSelectedSticker(){
    const item=selectedSticker();
    if(!item){
      $("#selected-sticker-editor").innerHTML='<p class="empty-note">在画布或图层列表中选择一个贴纸。</p>';
      return;
    }
    $("#selected-sticker-editor").innerHTML=`
      ${item.type==="text"?`
        <label class="field"><span>文字</span><textarea data-sticker-field="text" rows="3">${esc(item.text)}</textarea></label>
        <label class="field"><span>字体</span><select data-sticker-field="font">
          <option value="serif">中文衬线</option><option value="sans">中文无衬线</option><option value="bodoni">Bodoni Moda</option><option value="mono">打字机</option>
        </select></label>
        <div class="align-buttons">
          <button class="${item.align==="left"?"active":""}" data-align="left" type="button">居左</button>
          <button class="${item.align==="center"?"active":""}" data-align="center" type="button">居中</button>
          <button class="${item.align==="right"?"active":""}" data-align="right" type="button">居右</button>
        </div>
        <div class="sticker-controls-grid">
          <label class="field"><span>字号</span><input data-sticker-field="fontSize" type="number" min="8" max="120"></label>
          <label class="field"><span>行高</span><input data-sticker-field="lineHeight" type="number" min=".8" max="2.4" step=".05"></label>
          <label class="field"><span>文字颜色</span><input data-sticker-field="color" type="color"></label>
          <label class="field"><span>背景颜色</span><input data-sticker-field="bgColor" type="color"></label>
          <label class="field"><span>内边距</span><input data-sticker-field="padding" type="number" min="0" max="40"></label>
          <label class="field"><span>边框</span><input data-sticker-field="border" type="number" min="0" max="8"></label>
        </div>
        <div class="check-grid">
          <label><input data-sticker-field="backgroundEnabled" type="checkbox"> 显示背景</label>
          <label><input data-sticker-field="weight" type="checkbox"> 粗体</label>
        </div>`:`
        <div class="check-grid"><label><input data-sticker-field="stretch" type="checkbox"> 自由拉伸图片</label><label><input data-sticker-field="preserveRatio" type="checkbox"> 保持缩放比例</label></div>`}
      <div class="sticker-controls-grid">
        <label class="field"><span>X 位置 %</span><input data-sticker-field="x" type="number" min="0" max="100" step=".1"></label>
        <label class="field"><span>Y 位置 %</span><input data-sticker-field="y" type="number" min="0" max="100" step=".1"></label>
        <label class="field"><span>宽度</span><input data-sticker-field="width" type="number" min="40" max="600"></label>
        <label class="field"><span>高度</span><input data-sticker-field="height" type="number" min="30" max="500"></label>
        <label class="field"><span>旋转</span><input data-sticker-field="rotation" type="number"></label>
        <label class="field"><span>透明度</span><input data-sticker-field="opacity" type="number" min=".1" max="1" step=".05"></label>
      </div>
      <div class="check-grid">
        <label><input data-sticker-field="locked" type="checkbox"> 锁定</label>
        <label><input data-sticker-field="hidden" type="checkbox"> 隐藏</label>
      </div>
      <div class="layer-buttons">
        <button class="small-button" data-sticker-action="bottom" data-id="${esc(item.id)}" type="button">置于底层</button>
        <button class="small-button" data-sticker-action="top" data-id="${esc(item.id)}" type="button">置于顶层</button>
        <button class="small-button" data-sticker-action="copy" data-id="${esc(item.id)}" type="button">复制贴纸</button>
        <button class="small-button" data-sticker-action="delete" data-id="${esc(item.id)}" type="button">删除贴纸</button>
      </div>`;
    $$("[data-sticker-field]",$("#selected-sticker-editor")).forEach(control=>{
      const key=control.dataset.stickerField;
      if(control.type==="checkbox")control.checked=key==="weight"?item.weight==="700":Boolean(item[key]);
      else control.value=item[key]??"";
      const update=()=>updateStickerFromControl(control);
      control.addEventListener("input",update);
      control.addEventListener("change",update);
    });
  }

  function sectionHeading(title,code){return `<header class="section-heading"><h2>${esc(title)}</h2><span>${esc(code)}</span></header>`}
  function stickerMarkup(item,index){
    const justify=item.align==="left"?"flex-start":item.align==="right"?"flex-end":"center";
    const content=item.type==="image"?imageMarkup(item.image,""):esc(item.text);
    const contentStyle=item.type==="text"?`style='padding:${item.padding}px;justify-content:${justify};border:${item.border}px solid ${item.color};color:${item.color};background-color:${item.backgroundEnabled?item.bgColor:"transparent"};font-family:${FONT_MAP[item.font]||FONT_MAP.serif};font-size:${item.fontSize}px;font-weight:${item.weight};line-height:${item.lineHeight};text-align:${item.align};opacity:${item.opacity}'`:`style='opacity:${item.opacity}'`;
    return `<div class="canvas-sticker ${item.type}-sticker ${item.id===state.selectedStickerId?"is-selected":""} ${item.locked?"is-locked":""} ${item.hidden?"is-hidden":""}" data-sticker-id="${esc(item.id)}" style='
      --sticker-x:${item.x}%;--sticker-y:${item.y}%;--sticker-z:${index+1};--sticker-width:${item.width}px;--sticker-height:${item.height}px;
      --sticker-rotation:${item.rotation}deg;--sticker-align:${item.align};--sticker-justify:${justify};--sticker-font:${FONT_MAP[item.font]};
      --sticker-font-size:${item.fontSize}px;--sticker-color:${item.color};--sticker-bg:${item.backgroundEnabled?item.bgColor:"transparent"};
      --sticker-weight:${item.weight};--sticker-line-height:${item.lineHeight};--sticker-padding:${item.padding}px;--sticker-border:${item.border}px;
      --sticker-opacity:${item.opacity};--sticker-fit:${item.stretch?"fill":"contain"}'>
      <div class="sticker-content" ${contentStyle}>${content}</div>
      <button class="sticker-handle sticker-rotate" data-transform="rotate" type="button" aria-label="旋转贴纸"></button>
      <button class="sticker-handle sticker-resize" data-transform="resize" type="button" aria-label="调整贴纸大小"></button>
    </div>`;
  }

  function renderCanvas(){
    const type=TYPE_COPY[state.type];
    const template=TEMPLATE_COPY[state.template];
    canvas.dataset.template=state.template;
    canvas.dataset.paper=state.paper;
    canvas.dataset.type=state.type;
    canvas.style.setProperty('--doc-font-scale',String(state.fontScale/100));
    const colors=state.colors[state.template]||DEFAULT_COLORS[state.template];
    canvas.style.setProperty('--doc-accent',colors.accent);
    canvas.style.setProperty('--doc-accent-2',colors.accent2);
    canvas.style.setProperty('--doc-paper',colors.paper);
    canvas.style.setProperty('--doc-ink',colors.ink);
    canvas.style.setProperty('--doc-line',colors.line);
    canvas.style.setProperty('--doc-muted',`color-mix(in srgb, ${colors.ink} 62%, ${colors.paper})`);
    const findings=state.findings.length?state.findings.map(item=>`<tr><th>${esc(item.label)}</th><td>${esc(item.value)}</td></tr>`).join(""):`<tr><th>检验项目</th><td>未填写</td></tr>`;
    const evidence=state.evidence.length?state.evidence.map((item,index)=>`
      <article class="evidence-card">
        <div class="evidence-image">${imageMarkup(item.image,item.name)||String(index+1).padStart(2,"0")}</div>
        <div><h3>${esc(item.name)}</h3><p>${esc(item.description)}</p></div>
      </article>`).join(""):`<p class="doc-copy">当前文书未附检材图片。</p>`;
    canvas.innerHTML=`
      <header class="doc-header">
        <div><span class="doc-kicker">${esc(template.kicker)} · ${esc(type.name)}</span><h1 class="doc-title">${esc(state.document.title)}</h1><p class="doc-institution">${esc(state.document.institution)}</p></div>
        <div class="doc-reference"><span>DOCUMENT REFERENCE</span><strong>${esc(state.document.reference)}</strong><span>${esc(state.document.issueDate)}</span></div>
      </header>
      <section class="doc-section doc-subject export-subject">
        <div class="subject-image">${imageMarkup(state.subject.image,state.subject.name)||esc((state.subject.name||"样").slice(0,1))}</div>
        <div class="subject-summary">
          <span class="doc-kicker">${esc(type.subject)}</span>
          <h2>${esc(state.subject.name)}</h2>
          <p class="subject-category">${esc(state.subject.category)} · ${esc(state.subject.meta)}</p>
          <p class="subject-description">${esc(state.subject.description)}</p>
          <div class="meta-grid">
            <div><small>APPLICANT</small><b>${esc(state.document.applicant)}</b></div>
            <div><small>ACCEPTED</small><b>${esc(state.document.acceptedDate)}</b></div>
            <div><small>LOCATION</small><b>${esc(state.document.location)}</b></div>
            <div><small>TYPE</small><b>${esc(type.name)}</b></div>
          </div>
        </div>
      </section>
      <section class="doc-section doc-findings export-findings">${sectionHeading("检验记录","EXAMINATION RECORD")}<table class="findings-table"><tbody>${findings}</tbody></table></section>
      <section class="doc-section doc-methods">${sectionHeading("检验与分析","METHOD AND ANALYSIS")}<div class="method-grid">
        <div class="method-block"><h3>METHOD</h3><p class="doc-copy">${esc(state.document.methods)}</p></div>
        <div class="method-block"><h3>ANALYSIS</h3><p class="doc-copy">${esc(state.document.analysis)}</p></div>
      </div></section>
      <section class="doc-section doc-evidence">${sectionHeading("检材与附件","MATERIALS AND APPENDICES")}<div class="evidence-grid">${evidence}</div></section>
      <section class="doc-section doc-conclusion export-conclusion">${sectionHeading("鉴定意见","APPRAISAL OPINION")}<p class="conclusion-text">${esc(state.document.conclusion)}</p><p class="notes-copy">${esc(state.document.notes)}</p></section>
      <section class="doc-signatures">
        <div class="signature-block"><small>EXAMINER</small><b>${esc(state.document.examiner)}</b></div>
        <div class="signature-block"><small>REVIEWER</small><b>${esc(state.document.reviewer)}</b></div>
        <div class="signature-block"><small>ISSUE DATE</small><b>${esc(state.document.issueDate)}</b></div>
      </section>
      <footer class="doc-footer"><span>APPRAISAL / PERSONAL ARCHIVE</span><span>${state.showFiction?"FICTIONAL DOCUMENT":""}</span><span>${state.showPageNumber?"PAGE 01":""}</span></footer>
      ${state.showFiction?'<div class="fiction-mark">FICTIONAL DOCUMENT · PERSONAL CREATION</div>':""}
      <div class="sticker-layer">${state.stickers.map(stickerMarkup).join("")}</div>`;
    if(state.paper==="landscape"){
      const leftPage=document.createElement("div");
      const rightPage=document.createElement("div");
      leftPage.className="spread-page spread-page-left";
      rightPage.className="spread-page spread-page-right";
      const header=canvas.querySelector(".doc-header");
      const subject=canvas.querySelector(".doc-subject");
      const findingsSection=canvas.querySelector(".doc-findings");
      const methods=canvas.querySelector(".doc-methods");
      const evidenceSection=canvas.querySelector(".doc-evidence");
      const conclusion=canvas.querySelector(".doc-conclusion");
      const signatures=canvas.querySelector(".doc-signatures");
      const footer=canvas.querySelector(".doc-footer");
      const continuation=document.createElement("header");
      continuation.className="spread-continuation";
      continuation.innerHTML=`<div><span class="doc-kicker">${esc(template.kicker)} · CONTINUED</span><b>${esc(state.document.title)}</b></div><div><small>REFERENCE</small><strong>${esc(state.document.reference)}</strong></div>`;
      leftPage.append(header,subject,methods);
      rightPage.append(continuation,findingsSection,evidenceSection,conclusion,signatures);
      const rightFooter=footer.cloneNode(true);
      const leftPageNumber=footer.querySelector("span:last-child");
      const rightPageNumber=rightFooter.querySelector("span:last-child");
      if(leftPageNumber)leftPageNumber.textContent=state.showPageNumber?"PAGE 01 / 02":"";
      if(rightPageNumber)rightPageNumber.textContent=state.showPageNumber?"PAGE 02 / 02":"";
      leftPage.append(footer);
      rightPage.append(rightFooter);
      const insertionPoint=canvas.querySelector(".fiction-mark")||canvas.querySelector(".sticker-layer");
      canvas.insertBefore(leftPage,insertionPoint);
      canvas.insertBefore(rightPage,insertionPoint);
    }
    requestAnimationFrame(fitCanvas);
  }

  function renderAll(){
    renderInputs();
    renderFindings();
    renderEvidence();
    renderStickerList();
    renderSelectedSticker();
    renderCanvas();
    updateHistoryButtons();
  }

  function useTypePreset(type){
    pushHistory();
    state.type=type;
    const copy=TYPE_COPY[type];
    state.document.title=`${copy.name}书`;
    state.findings=(TYPE_FINDINGS[type]||TYPE_FINDINGS.general).map(([label,value])=>({id:uid("finding"),label,value}));
    const recommended={jewelry:"gem",artifact:"museum",judicial:"judicial",injury:"clinical",general:"editorial"};
    state.template=recommended[type];
    renderAll();
    scheduleSave();
  }

  function findingAction(action,id){
    const index=state.findings.findIndex(item=>item.id===id);
    if(index<0)return;
    pushHistory();
    if(action==="up"&&index>0)[state.findings[index-1],state.findings[index]]=[state.findings[index],state.findings[index-1]];
    if(action==="delete")state.findings.splice(index,1);
    renderAll();scheduleSave();
  }
  function evidenceAction(action,id){
    const index=state.evidence.findIndex(item=>item.id===id);
    if(index<0)return;
    pushHistory();
    if(action==="up"&&index>0)[state.evidence[index-1],state.evidence[index]]=[state.evidence[index],state.evidence[index-1]];
    if(action==="copy")state.evidence.splice(index+1,0,{...clone(state.evidence[index]),id:uid("evidence"),name:`${state.evidence[index].name} · 副本`});
    if(action==="delete")state.evidence.splice(index,1);
    renderAll();scheduleSave();
  }
  function stickerAction(action,id){
    const index=state.stickers.findIndex(item=>item.id===id);
    if(index<0)return;
    pushHistory();
    const item=state.stickers[index];
    if(action==="up"&&index<state.stickers.length-1)[state.stickers[index],state.stickers[index+1]]=[state.stickers[index+1],state.stickers[index]];
    if(action==="down"&&index>0)[state.stickers[index],state.stickers[index-1]]=[state.stickers[index-1],state.stickers[index]];
    if(action==="top"){state.stickers.splice(index,1);state.stickers.push(item)}
    if(action==="bottom"){state.stickers.splice(index,1);state.stickers.unshift(item)}
    if(action==="copy"){const copy={...clone(item),id:uid("sticker"),x:clamp(item.x+3,0,100),y:clamp(item.y+3,0,100)};state.stickers.splice(index+1,0,copy);state.selectedStickerId=copy.id}
    if(action==="delete"){state.stickers.splice(index,1);state.selectedStickerId=""}
    renderAll();scheduleSave();
  }

  function selectSticker(id,fullRender=true){
    state.selectedStickerId=id;
    $$(".canvas-sticker").forEach(node=>node.classList.toggle("is-selected",node.dataset.stickerId===id));
    if(fullRender){renderStickerList();renderSelectedSticker()}
    scheduleSave();
  }

  function updateStickerFromControl(target){
    if(!target.matches("[data-sticker-field]"))return false;
    const item=selectedSticker();
    if(!item)return true;
    const key=target.dataset.stickerField;
    let value;
    if(key==="weight")value=target.checked?"700":"400";
    else if(target.type==="checkbox")value=target.checked;
    else if(target.type==="number")value=number(target.value);
    else value=target.value;
    item[key]=value;
    if(key==="bgColor"){item.backgroundEnabled=true;const backgroundToggle=$("[data-sticker-field=backgroundEnabled]",$("#selected-sticker-editor"));if(backgroundToggle)backgroundToggle.checked=true;}
    renderCanvas();
    scheduleSave();
    return true;
  }

  function addTextSticker(){
    const text=$("#new-sticker-text").value.trim()||"已复核";
    pushHistory();
    const item={id:uid("sticker"),type:"text",text,image:"",x:50,y:18,width:230,height:88,rotation:0,align:"center",font:"serif",fontSize:25,weight:"700",lineHeight:1.3,color:"#65705b",bgColor:"#ffffff",backgroundEnabled:false,padding:8,border:0,opacity:1,preserveRatio:true,stretch:false,locked:false,hidden:false};
    state.stickers.push(item);state.selectedStickerId=item.id;$("#new-sticker-text").value="";
    renderAll();scheduleSave();
  }
  async function fileToDataUrl(file){
    if(!file?.type.startsWith("image/")||file.size>15*1024*1024)throw new Error("invalid image");
    return new Promise((resolve,reject)=>{const reader=new FileReader();reader.onload=()=>resolve(String(reader.result||""));reader.onerror=reject;reader.readAsDataURL(file)});
  }
  async function addImageSticker(file){
    try{
      const reference=await imageStore.storeDataUrl(await fileToDataUrl(file));
      await imageStore.preload([reference]);
      pushHistory();
      const item={id:uid("sticker"),type:"image",text:"",image:reference,x:50,y:22,width:210,height:150,rotation:0,align:"center",font:"sans",fontSize:24,weight:"400",lineHeight:1.3,color:"#000000",bgColor:"#ffffff",backgroundEnabled:false,padding:0,border:0,opacity:1,preserveRatio:true,stretch:false,locked:false,hidden:false};
      state.stickers.push(item);state.selectedStickerId=item.id;renderAll();scheduleSave();
    }catch{showToast("请选择 15MB 以内的图片")}
  }

  async function openCrop(file,target){
    try{
      const source=await fileToDataUrl(file);
      const image=new Image();
      image.onload=()=>{cropSession={image,target,zoom:1,x:0,y:0};$("#crop-zoom").value="1";$("#crop-modal").hidden=false;document.body.classList.add("crop-open");drawCrop()};
      image.onerror=()=>showToast("图片读取失败");
      image.src=source;
    }catch{showToast("请选择 15MB 以内的图片")}
  }
  function drawCrop(){
    if(!cropSession)return;
    const output=$("#crop-canvas"),ctx=output.getContext("2d"),image=cropSession.image;
    const scale=Math.max(output.width/image.naturalWidth,output.height/image.naturalHeight)*cropSession.zoom;
    const width=image.naturalWidth*scale,height=image.naturalHeight*scale;
    ctx.clearRect(0,0,output.width,output.height);
    ctx.drawImage(image,(output.width-width)/2+cropSession.x,(output.height-height)/2+cropSession.y,width,height);
  }
  function closeCrop(){cropSession=null;cropDrag=null;$("#crop-modal").hidden=true;document.body.classList.remove("crop-open")}
  async function applyCrop(){
    if(!cropSession)return;
    const reference=await imageStore.storeDataUrl($("#crop-canvas").toDataURL("image/jpeg",.9));
    await imageStore.preload([reference]);
    pushHistory();
    if(cropSession.target.kind==="main")state.subject.image=reference;
    if(cropSession.target.kind==="evidence"){const item=state.evidence.find(entry=>entry.id===cropSession.target.id);if(item)item.image=reference}
    closeCrop();renderAll();scheduleSave();
  }

  function beginStickerTransform(event,kind,id){
    const item=state.stickers.find(entry=>entry.id===id);
    const node=event.target.closest(".canvas-sticker");
    if(!item||!node||item.locked)return;
    event.preventDefault();
    selectSticker(id);
    const rect=canvas.getBoundingClientRect();
    const visualScale=rect.width/canvas.offsetWidth;
    const centerX=rect.left+(item.x/100)*rect.width;
    const centerY=rect.top+(item.y/100)*rect.height;
    transformSession={pointerId:event.pointerId,kind,item,node,before:clone(state),startX:event.clientX,startY:event.clientY,x:item.x,y:item.y,width:item.width,height:item.height,rotation:item.rotation,ratio:item.width/item.height,centerX,centerY,visualScale,rect};
    try{node.setPointerCapture(event.pointerId)}catch{}
  }
  function moveStickerTransform(event){
    const session=transformSession;
    if(!session||session.pointerId!==event.pointerId)return;
    event.preventDefault();
    const {item,node}=session;
    if(session.kind==="drag"){
      item.x=clamp(session.x+(event.clientX-session.startX)/session.rect.width*100,0,100);
      item.y=clamp(session.y+(event.clientY-session.startY)/session.rect.height*100,0,100);
      node.style.setProperty("--sticker-x",`${item.x}%`);node.style.setProperty("--sticker-y",`${item.y}%`);
    }else if(session.kind==="resize"){
      const width=clamp(session.width+(event.clientX-session.startX)/session.visualScale,40,600);
      const height=item.preserveRatio?width/session.ratio:clamp(session.height+(event.clientY-session.startY)/session.visualScale,30,500);
      item.width=width;item.height=clamp(height,30,500);
      node.style.setProperty("--sticker-width",`${item.width}px`);node.style.setProperty("--sticker-height",`${item.height}px`);
    }else{
      const startAngle=Math.atan2(session.startY-session.centerY,session.startX-session.centerX);
      const currentAngle=Math.atan2(event.clientY-session.centerY,event.clientX-session.centerX);
      item.rotation=Math.round(session.rotation+(currentAngle-startAngle)*180/Math.PI);
      node.style.setProperty("--sticker-rotation",`${item.rotation}deg`);
    }
  }
  function endStickerTransform(event){
    if(!transformSession||transformSession.pointerId!==event.pointerId)return;
    pushHistory(transformSession.before);
    transformSession=null;
    renderAll();scheduleSave();
  }

  function fitCanvas(){
    if(!canvas||!viewport)return;
    canvas.style.transform='none';
    const width=canvas.offsetWidth,height=canvas.scrollHeight;
    const gutter=window.innerWidth<=900?0:56;
    const availableWidth=Math.max(1,viewport.clientWidth-gutter);
    const baseScale=Math.min(availableWidth/width,1);
    const scale=clamp(baseScale*previewZoom,.2,1.6);
    canvas.style.transform=`scale(${scale})`;
    canvas.style.transformOrigin='top left';
    stage.style.width=`${Math.round(width*scale)}px`;
    stage.style.height=`${Math.round(height*scale)}px`;
    const output=$('#preview-zoom-output');
    if(output)output.textContent=`${Math.round(scale*100)}%`;
  }

  function setupMobileResizer(){
    const workspace=$(".workspace"),resizer=$("#mobile-resizer"),query=matchMedia("(max-width: 900px)");
    if(!workspace||!resizer)return;
    let ratio=.4,activePointer=null;
    try{const saved=Number(localStorage.getItem(MOBILE_SPLIT_KEY));if(saved>=.22&&saved<=.72)ratio=saved}catch{}
    const applyHeight=(height,persist=true)=>{
      if(!query.matches)return;
      const available=Math.max(1,workspace.clientHeight);
      const min=Math.max(105,available*.22),max=Math.max(min,Math.min(available*.72,available-190));
      const next=clamp(height,min,max);
      ratio=next/available;
      workspace.style.setProperty("--mobile-preview-height",`${next}px`);
      resizer.setAttribute("aria-valuenow",String(Math.round(ratio*100)));
      if(persist)try{localStorage.setItem(MOBILE_SPLIT_KEY,String(ratio))}catch{}
      requestAnimationFrame(fitCanvas);
    };
    const fromPointer=event=>applyHeight(event.clientY-workspace.getBoundingClientRect().top);
    resizer.addEventListener("pointerdown",event=>{
      if(!query.matches||event.isPrimary===false)return;
      event.preventDefault();activePointer=event.pointerId;document.body.classList.add("mobile-resizing");
      try{resizer.setPointerCapture(event.pointerId)}catch{}
      fromPointer(event);
    });
    window.addEventListener("pointermove",event=>{if(activePointer===event.pointerId)fromPointer(event)},{passive:false});
    const stop=event=>{if(activePointer!==event.pointerId)return;activePointer=null;document.body.classList.remove("mobile-resizing");try{resizer.releasePointerCapture(event.pointerId)}catch{}};
    window.addEventListener("pointerup",stop);window.addEventListener("pointercancel",stop);
    resizer.addEventListener("touchstart",event=>event.preventDefault(),{passive:false});
    resizer.addEventListener("touchmove",event=>event.preventDefault(),{passive:false});
    resizer.addEventListener("keydown",event=>{if(!["ArrowUp","ArrowDown"].includes(event.key))return;event.preventDefault();applyHeight(workspace.clientHeight*ratio+(event.key==="ArrowDown"?24:-24))});
    resizer.addEventListener("dblclick",()=>applyHeight(workspace.clientHeight*.4));
    const applyRatio=()=>{if(query.matches)applyHeight(workspace.clientHeight*ratio,false);else workspace.style.removeProperty("--mobile-preview-height")};
    window.addEventListener("resize",applyRatio);window.visualViewport?.addEventListener("resize",applyRatio);query.addEventListener?.("change",applyRatio);
    requestAnimationFrame(applyRatio);
  }

  function waitForImages(root){
    return Promise.all($$("img",root).map(image=>image.complete?image.decode?.().catch(()=>{}):new Promise(resolve=>{image.onload=resolve;image.onerror=resolve})));
  }
  function downloadBlob(blob,name){if(!(blob instanceof Blob))throw new Error("PNG blob export failed");const url=URL.createObjectURL(blob),link=document.createElement("a");link.href=url;link.download=name;document.body.append(link);link.click();link.remove();setTimeout(()=>URL.revokeObjectURL(url),1500)}
  async function exportNode(node,label){
    if(!node)return showToast("当前部件不存在");
    const previousTransform=canvas.style.transform;
    const previousTransformOrigin=canvas.style.transformOrigin;
    try{
      canvas.classList.add("is-exporting");
      canvas.style.transform="none";
      canvas.style.transformOrigin="top left";
      await preloadImages();
      await waitForImages(node);
      await document.fonts?.ready;
      await new Promise(resolve=>requestAnimationFrame(()=>requestAnimationFrame(resolve)));
      const exportWidth=Math.ceil(Math.max(node.scrollWidth,node.offsetWidth));
      const exportHeight=Math.ceil(Math.max(node.scrollHeight,node.offsetHeight));
      const fontEmbedCSS=await window.OCExportFonts?.getFontEmbedCSS(node);
      const nodeBackground=getComputedStyle(node).backgroundColor;
      const canvasBackground=getComputedStyle(canvas).backgroundColor;
      const blob=await window.htmlToImage.toBlob(node,{
        width:exportWidth,
        height:exportHeight,
        pixelRatio:Number(state.exportScale),
        cacheBust:false,
        skipFonts:true,
        fontEmbedCSS:fontEmbedCSS||"",
        style:{transform:"none",transformOrigin:"top left"},
        backgroundColor:nodeBackground==="rgba(0, 0, 0, 0)"?canvasBackground:nodeBackground
      });
      downloadBlob(blob,`${state.projectName}-${label}.png`);
      showToast(`${label}已导出`);
    }catch(error){console.error(error);showToast("导出失败，请检查图片与字体资源")}
    finally{
      canvas.classList.remove("is-exporting");
      canvas.style.transform=previousTransform;
      canvas.style.transformOrigin=previousTransformOrigin;
      requestAnimationFrame(fitCanvas);
    }
  }

  function saveJson(){
    const blob=new Blob([JSON.stringify(state,null,2)],{type:"application/json"});
    const url=URL.createObjectURL(blob),link=document.createElement("a");
    link.href=url;link.download=`${state.projectName}.json`;link.click();setTimeout(()=>URL.revokeObjectURL(url),1000);
  }
  async function importJson(file){
    try{
      const parsed=JSON.parse(await file.text());
      pushHistory();state=normalize(parsed);await preloadImages();renderAll();scheduleSave();showToast("项目已导入");
    }catch{showToast("JSON 文件无法读取")}
  }

  const tourSteps=[
    {target:"#type-card",panel:"content",title:"选择鉴定类别",copy:"珠宝、文物、司法、伤情和通用类别会切换字段提示及建议模板。"},
    {target:"#subject-card",panel:"content",title:"建立鉴定对象",copy:"填写对象资料并上传主图。图片会经过裁切并保存到当前浏览器。"},
    {target:"#findings-card",panel:"content",title:"记录检验项目",copy:"项目与结果可以新增、排序和删除，文书高度会随内容增长。"},
    {target:"#template-card",panel:"style",title:"选择文书模板",copy:"五套模板拥有不同的信息结构，不只是颜色和字体变化。"},
    {target:"#stickers-card",panel:"style",title:"添加自由贴纸",copy:"图片与文字贴纸可以拖动、调整宽高、旋转、锁定和排序。"},
    {target:"#export-card",panel:"style",title:"保存与导出",copy:"导出完整鉴定书或单独部件。JSON 适合备份并继续编辑。"}
  ];
  function setMobilePanel(panel){
    document.body.dataset.mobilePanel=panel;
    $$("[data-mobile-panel]").forEach(button=>button.classList.toggle("active",button.dataset.mobilePanel===panel));
  }
  function positionTour(){
    const step=tourSteps[tourIndex],target=$(step.target);
    if(!target)return;
    if(innerWidth<=900&&step.panel)setMobilePanel(step.panel);
    target.scrollIntoView({block:"center"});
    requestAnimationFrame(()=>{
      const rect=target.getBoundingClientRect(),focus=$("#tour-focus"),card=$("#tour-card");
      focus.style.left=`${Math.max(4,rect.left-5)}px`;focus.style.top=`${Math.max(4,rect.top-5)}px`;
      focus.style.width=`${Math.min(innerWidth-8,rect.width+10)}px`;focus.style.height=`${Math.min(innerHeight-8,rect.height+10)}px`;
      if(innerWidth>900){card.style.left=`${Math.min(innerWidth-card.offsetWidth-14,Math.max(14,rect.right+14))}px`;card.style.top=`${Math.min(innerHeight-card.offsetHeight-14,Math.max(14,rect.top))}px`}
      $("#tour-title").textContent=step.title;$("#tour-copy").textContent=step.copy;$("#tour-progress").textContent=`${tourIndex+1} / ${tourSteps.length}`;
      $("#tour-prev").disabled=tourIndex===0;$("#tour-next").textContent=tourIndex===tourSteps.length-1?"完成":"下一步";
    });
  }
  function openTour(){tourIndex=0;$("#tour-overlay").hidden=false;document.body.classList.add("tour-open");positionTour()}
  function closeTour(){$("#tour-overlay").hidden=true;document.body.classList.remove("tour-open");try{localStorage.setItem("oc-appraisal-tour-seen","1")}catch{}}

  function bindEvents(){
    document.addEventListener("focusin",event=>{if(event.target.matches("input,textarea,select")&&!event.target.closest(".top-actions"))inputCheckpoint=clone(state)});
    document.addEventListener("input",event=>{
      const target=event.target;
      if(target.matches('[data-doc-color]')){
        state.colors[state.template][target.dataset.docColor]=target.value;
        renderCanvas();scheduleSave();return;
      }
      if(target.matches('[data-path]')){setPath(state,target.dataset.path,target.value);renderCanvas();scheduleSave();return}
      const finding=target.closest("[data-finding-id]");
      if(finding&&target.dataset.findingField){const item=state.findings.find(entry=>entry.id===finding.dataset.findingId);if(item)item[target.dataset.findingField]=target.value;renderCanvas();scheduleSave();return}
      const evidence=target.closest("[data-evidence-id]");
      if(evidence&&target.dataset.evidenceField){const item=state.evidence.find(entry=>entry.id===evidence.dataset.evidenceId);if(item)item[target.dataset.evidenceField]=target.value;renderCanvas();scheduleSave();return}
      if(target===$("#project-name")){state.projectName=target.value;scheduleSave()}
      if(target===$("#font-scale")){state.fontScale=Number(target.value);$("#font-scale-output").textContent=`${state.fontScale}%`;renderCanvas();scheduleSave()}
    });
    document.addEventListener("change",event=>{
      const target=event.target;
      if(inputCheckpoint&&JSON.stringify(inputCheckpoint)!==JSON.stringify(state))pushHistory(inputCheckpoint);
      inputCheckpoint=null;
      if(target===$("#appraisal-type"))return useTypePreset(target.value);
      if(target===$("#paper-mode")){pushHistory();state.paper=target.value;renderAll();scheduleSave();return}
      if(target===$("#export-scale")){state.exportScale=Number(target.value);scheduleSave();return}
      if(target===$("#show-fiction")||target===$("#show-page-number")){pushHistory();state[target.id==="show-fiction"?"showFiction":"showPageNumber"]=target.checked;renderCanvas();scheduleSave();return}
      if(target.matches("[data-evidence-upload]")&&target.files?.[0]){openCrop(target.files[0],{kind:"evidence",id:target.dataset.evidenceUpload});target.value="";return}
      if(target===$("#sticker-image-input")&&target.files?.[0]){addImageSticker(target.files[0]);target.value="";return}
      if(target===$("#import-json")&&target.files?.[0]){importJson(target.files[0]);target.value=""}
    });
    document.addEventListener("click",event=>{
      const templateButton=event.target.closest("[data-template-option]");
      if(templateButton){pushHistory();state.template=templateButton.dataset.templateOption;renderAll();scheduleSave();return}
      if(event.target.closest('#reset-colors')){pushHistory();state.colors[state.template]={...DEFAULT_COLORS[state.template]};renderAll();scheduleSave();return}
      const findingButton=event.target.closest("[data-finding-action]");
      if(findingButton)return findingAction(findingButton.dataset.findingAction,findingButton.closest("[data-finding-id]").dataset.findingId);
      const evidenceButton=event.target.closest("[data-evidence-action]");
      if(evidenceButton)return evidenceAction(evidenceButton.dataset.evidenceAction,evidenceButton.closest("[data-evidence-id]").dataset.evidenceId);
      const stickerButton=event.target.closest("[data-sticker-action]");
      if(stickerButton)return stickerAction(stickerButton.dataset.stickerAction,stickerButton.dataset.id);
      const stickerRow=event.target.closest("[data-select-sticker]");
      if(stickerRow)return selectSticker(stickerRow.dataset.selectSticker);
      const align=event.target.closest("[data-align]");
      if(align){const item=selectedSticker();if(item){pushHistory();item.align=align.dataset.align;renderAll();scheduleSave()}return}
      const exportButton=event.target.closest("[data-export-section]");
      if(exportButton){const map={subject:[".export-subject","对象资料"],findings:[".export-findings","检验记录"],conclusion:[".export-conclusion","鉴定意见"]};const data=map[exportButton.dataset.exportSection];return exportNode($(data[0],canvas),data[1])}
    });
    canvas.addEventListener("pointerdown",event=>{
      const node=event.target.closest(".canvas-sticker");
      if(!node){selectSticker("");return}
      beginStickerTransform(event,event.target.closest("[data-transform]")?.dataset.transform||"drag",node.dataset.stickerId);
    });
    window.addEventListener("pointermove",moveStickerTransform,{passive:false});
    window.addEventListener("pointerup",endStickerTransform);
    window.addEventListener("pointercancel",endStickerTransform);
    $("#add-finding").addEventListener("click",()=>{pushHistory();state.findings.push({id:uid("finding"),label:"新检验项目",value:"填写检验结果"});renderAll();scheduleSave()});
    $("#add-evidence").addEventListener("click",()=>{pushHistory();state.evidence.push({id:uid("evidence"),name:"新检材",description:"填写检材说明。",image:""});renderAll();scheduleSave()});
    $("#add-text-sticker").addEventListener("click",addTextSticker);
    $("#main-image-upload-trigger").addEventListener("click",()=>$("#main-image-upload").click());
    $("#main-image-upload").addEventListener("change",event=>{if(event.target.files?.[0])openCrop(event.target.files[0],{kind:"main"});event.target.value=""});
    $("#main-image-remove").addEventListener("click",()=>{pushHistory();state.subject.image="";renderAll();scheduleSave()});
    $$("[data-crop-close]").forEach(button=>button.addEventListener("click",closeCrop));
    $("#crop-apply").addEventListener("click",applyCrop);
    $("#crop-zoom").addEventListener("input",event=>{if(cropSession){cropSession.zoom=Number(event.target.value);drawCrop()}});
    const cropStage=$("#crop-stage");
    cropStage.addEventListener("pointerdown",event=>{if(!cropSession)return;cropDrag={id:event.pointerId,x:event.clientX,y:event.clientY,startX:cropSession.x,startY:cropSession.y};try{cropStage.setPointerCapture(event.pointerId)}catch{}});
    cropStage.addEventListener("pointermove",event=>{if(!cropSession||!cropDrag||cropDrag.id!==event.pointerId)return;const rect=cropStage.getBoundingClientRect();cropSession.x=cropDrag.startX+(event.clientX-cropDrag.x)*1200/rect.width;cropSession.y=cropDrag.startY+(event.clientY-cropDrag.y)*900/rect.height;drawCrop()});
    cropStage.addEventListener("pointerup",()=>cropDrag=null);cropStage.addEventListener("pointercancel",()=>cropDrag=null);
    $("#undo").addEventListener("click",undo);$("#redo").addEventListener("click",redo);
    $("#import-trigger").addEventListener("click",()=>$("#import-json").click());$("#save-json").addEventListener("click",saveJson);
    $("#export-full").addEventListener("click",()=>exportNode(canvas,"完整鉴定书"));$("#export-full-top").addEventListener("click",()=>exportNode(canvas,"完整鉴定书"));
    $("#fit-preview").addEventListener("click",()=>{previewZoom=1;fitCanvas()});
    $("#preview-zoom-out").addEventListener("click",()=>{previewZoom=clamp(previewZoom-.15,.5,2);fitCanvas()});
    $("#preview-zoom-in").addEventListener("click",()=>{previewZoom=clamp(previewZoom+.15,.5,2);fitCanvas()});
    $("#focus-preview").addEventListener("click",()=>{document.body.classList.toggle("focus-mode");$("#focus-preview").textContent=document.body.classList.contains("focus-mode")?"退出专注":"专注模式";requestAnimationFrame(fitCanvas)});
    $$("[data-mobile-panel]").forEach(button=>button.addEventListener("click",()=>setMobilePanel(button.dataset.mobilePanel)));
    $("#start-tour").addEventListener("click",openTour);$("#tour-skip").addEventListener("click",closeTour);
    $("#tour-prev").addEventListener("click",()=>{if(tourIndex>0){tourIndex--;positionTour()}});
    $("#tour-next").addEventListener("click",()=>{if(tourIndex>=tourSteps.length-1)return closeTour();tourIndex++;positionTour()});
    document.addEventListener("keydown",event=>{if(event.key==="Escape"){if(!$("#crop-modal").hidden)closeCrop();if(!$("#tour-overlay").hidden)closeTour();if(document.body.classList.contains("focus-mode"))$("#focus-preview").click()}if((event.ctrlKey||event.metaKey)&&event.key.toLowerCase()==="z"){event.preventDefault();event.shiftKey?redo():undo()}});
    window.addEventListener("resize",()=>{fitCanvas();if(!$("#tour-overlay").hidden)positionTour()});
    new ResizeObserver(()=>requestAnimationFrame(fitCanvas)).observe(viewport);
    window.addEventListener("pagehide",()=>{clearTimeout(saveTimer);try{localStorage.setItem(STORAGE_KEY,JSON.stringify(state))}catch{}});
  }

  async function init(){
    bindEvents();
    setupMobileResizer();
    await preloadImages();
    renderAll();
    await document.fonts?.ready;
    requestAnimationFrame(fitCanvas);
    setTimeout(()=>{try{if(!localStorage.getItem("oc-appraisal-tour-seen"))openTour()}catch{}},650);
  }
  init();
})();












