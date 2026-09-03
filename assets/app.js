/* ===== X-LION / Tergeo shared script ===== */

/* Featured products (real specs from catalog) */
const products = [
  {brand:"Tergeo", cat:"vacuum", img:"assets/v40.jpg", tag_en:"Best Seller", tag_zh:"热销", url:"v40.html",
   en:"V40 Cordless Vacuum Cleaner", zh:"V40 无线吸尘器",
   specs:["28 Kpa","400 W","60 min","HEPA H11","2.9 kg"],
   d_en:"Flagship suction with smart LCD, removable battery and tangle-free brush.",
   d_zh:"旗舰吸力，智能 LCD 屏、可拆卸电池与防缠绕滚刷。"},
  {brand:"Tergeo", cat:"vacuum", img:"assets/v50.jpg", tag_en:"", tag_zh:"", url:"v50.html",
   en:"V50 Cordless Vacuum Cleaner", zh:"V50 无线吸尘器",
   specs:["20 Kpa","200 W","45 min","HEPA H11","2.6 kg"],
   d_en:"Lightweight everyday cleaning with extendable reach and multi-surface brush.",
   d_zh:"轻量日常清洁，可延伸杆身，适配多种地面。"},
  {brand:"Tergeo", cat:"washer", img:"assets/washer-w10.png", tag_en:"2-in-1", tag_zh:"二合一", url:"w10.html",
   en:"W10 Cordless Floor Washer", zh:"W10 无线洗地机",
   specs:["Vacuum + Mop","16 Kpa","180° recline","50 min","3.5 kg"],
   d_en:"Smart wet & dry 2-in-1 — washes and vacuums at once, lies flat for under-furniture.",
   d_zh:"智能干湿二合一，边洗边吸，180° 平躺清洁家具底部。"}
];

/* product categories (for filtering on products.html) */
const CATS={
  all:{en:'Best-selling models',zh:'热销机型'},
  vacuum:{en:'Cordless Vacuum Cleaners',zh:'无线吸尘器'},
  washer:{en:'Cordless Wet & Dry Washers',zh:'无线干湿洗地机'},
  accessories:{en:'Accessories',zh:'配件'}
};
let currentCat='all';

function renderProducts(lang){
  const g=document.getElementById('product-grid');
  if(!g) return;
  const t=lang==='zh'
    ?{details:'查看详情',quote:'获取报价'}
    :{details:'View Details',quote:'Get a Quote'};
  // heading + reset link reflect the active category
  const h=document.getElementById('prod-heading');
  if(h) h.textContent = lang==='zh' ? CATS[currentCat].zh : CATS[currentCat].en;
  const reset=document.getElementById('prod-reset');
  if(reset) reset.style.display = currentCat==='all' ? 'none' : 'inline-block';
  // highlight active category card
  document.querySelectorAll('.cat[data-cat]').forEach(c=>{
    c.classList.toggle('active', c.getAttribute('data-cat')===currentCat);
  });
  const list = currentCat==='all' ? products : products.filter(p=>p.cat===currentCat);
  if(!list.length){
    g.innerHTML = `<p class="empty-note">${lang==='zh'
      ? '该品类暂无在售型号。<a href="contact.html">索取完整产品目录</a>，或告诉我们你的需求。'
      : 'No models listed in this category yet. <a href="contact.html">Request our full catalog</a> or tell us your needs.'}</p>`;
    return;
  }
  g.innerHTML=list.map(p=>{
    const tag=lang==='zh'?p.tag_zh:p.tag_en;
    const name=lang==='zh'?p.zh:p.en;
    const desc=lang==='zh'?p.d_zh:p.d_en;
    const thumb=`<div class="thumb${p.photo?' thumb-photo':''}">${tag?`<span class="tag">${tag}</span>`:''}<img src="${p.img}" alt="${name}" loading="lazy"></div>`;
    const links=`<div class="card-links">${p.url?`<a class="lk" href="${p.url}">${t.details} →</a>`:''}<a class="lk lk-quote" href="contact.html">${t.quote}</a></div>`;
    const title=p.url?`<a href="${p.url}"><h3>${name}</h3></a>`:`<h3>${name}</h3>`;
    return `<div class="card">
      ${p.url?`<a href="${p.url}" aria-label="${name}">${thumb}</a>`:thumb}
      <div class="body">
        <span class="brandlab">${p.brand}</span>
        ${title}
        <div class="specs">${p.specs.map(s=>`<span>${s}</span>`).join('')}</div>
        <p class="desc">${desc}</p>
        ${links}
      </div>
    </div>`;
  }).join('');
}

function filterCat(cat){
  currentCat = cat;
  renderProducts(loadLang());
  const grid=document.getElementById('product-grid');
  if(grid) grid.scrollIntoView({behavior:'smooth',block:'start'});
}

function initCategories(){
  const cards=document.querySelectorAll('.cat[data-cat]');
  if(!cards.length) return;
  cards.forEach(c=>{
    c.style.cursor='pointer';
    c.addEventListener('click',function(){ filterCat(c.getAttribute('data-cat')); });
  });
  const reset=document.getElementById('prod-reset');
  if(reset) reset.addEventListener('click',function(e){ e.preventDefault(); filterCat('all'); });
}

/* ---- interactive world map (global page, Leaflet + CARTO tiles) ---- */
const REGIONS_GEO=[
  {lat:39.5,lng:-98.35,en:"North America",zh:"北美"},
  {lat:50,lng:10,en:"Europe",zh:"欧洲"},
  {lat:34,lng:108,en:"Asia",zh:"亚洲"},
  {lat:-29,lng:24,en:"South Africa",zh:"南非"},
  {lat:-25,lng:133,en:"Australia",zh:"澳大利亚"}
];
let _mapMarkers=[];
function initWorldMapLive(){
  const el=document.getElementById('worldmap-live');
  if(!el || typeof L==='undefined' || el._leaflet_id) return;
  const lang=loadLang();
  const map=L.map(el,{scrollWheelZoom:false,zoomControl:true,worldCopyJump:true,minZoom:1,attributionControl:false});
  L.tileLayer('https://{s}.basemaps.cartocdn.com/rastertiles/voyager_nolabels/{z}/{x}/{y}{r}.png',{
    subdomains:'abcd', maxZoom:18,
    attribution:'&copy; <a href="https://www.openstreetmap.org/copyright" target="_blank" rel="noopener noreferrer">OpenStreetMap</a> &copy; <a href="https://carto.com/attributions" target="_blank" rel="noopener noreferrer">CARTO</a>'
  }).addTo(map);
  const pts=[];
  REGIONS_GEO.forEach(r=>{
    const m=L.circleMarker([r.lat,r.lng],{radius:8,color:'#fff',weight:2,fillColor:'#E1241B',fillOpacity:1}).addTo(map);
    m.bindTooltip(lang==='zh'?r.zh:r.en,{permanent:true,direction:'top',offset:[0,-8],className:'map-lbl'});
    m._reg=r; _mapMarkers.push(m); pts.push([r.lat,r.lng]);
  });
  map.fitBounds(pts,{padding:[45,45]});
}
function updateMapLabels(lang){
  _mapMarkers.forEach(m=>{ if(m._reg) m.setTooltipContent(lang==='zh'?m._reg.zh:m._reg.en); });
}

function initHeroSlides(){
  const slides=document.querySelectorAll('.hero-slide');
  if(slides.length<2) return;
  let i=0;
  setInterval(function(){
    slides[i].classList.remove('active');
    i=(i+1)%slides.length;
    slides[i].classList.add('active');
  }, 4500);
}

function saveLang(lang){ try{ localStorage.setItem('xlion-lang',lang); }catch(e){} }
function loadLang(){ try{ return localStorage.getItem('xlion-lang')||'en'; }catch(e){ return 'en'; } }

function setLang(lang){
  document.documentElement.lang = lang==='zh' ? 'zh-CN' : 'en';
  document.querySelectorAll('[data-en]').forEach(el=>{
    const v = lang==='zh' ? el.getAttribute('data-zh') : el.getAttribute('data-en');
    if(v!==null) el.innerHTML=v;
  });
  const be=document.getElementById('lang-en'), bz=document.getElementById('lang-zh');
  if(be) be.classList.toggle('active',lang==='en');
  if(bz) bz.classList.toggle('active',lang==='zh');
  renderProducts(lang);
  if(_mapMarkers.length) updateMapLabels(lang);
  saveLang(lang);
}

/* ---- inquiry form: prefill from query params + submit via Formspree ---- */
function initInquiryForm(){
  const form=document.getElementById('inquiry-form');
  if(!form) return;

  // Native validation messages default to the browser's locale (e.g. Chinese on a zh browser).
  // Override them to follow the page language (EN/中文) instead.
  const vmsg={
    en:{req:'Please fill out this field.',sel:'Please select an option.',email:'Please enter a valid email address.',check:'Please check this box to continue.'},
    zh:{req:'请填写此字段。',sel:'请选择一个选项。',email:'请输入有效的邮箱地址。',check:'请勾选此框以继续。'}
  };
  form.querySelectorAll('[required]').forEach(function(el){
    el.addEventListener('invalid',function(){
      const m=vmsg[loadLang()]||vmsg.en;
      let t=m.req;
      if(el.type==='checkbox') t=m.check;
      else if(el.tagName==='SELECT') t=m.sel;
      else if(el.type==='email' && el.value) t=m.email;
      el.setCustomValidity(t);
    });
    const clear=function(){el.setCustomValidity('');};
    el.addEventListener('input',clear);
    el.addEventListener('change',clear);
  });
  const params=new URLSearchParams(location.search);
  const typeMap={quote:'Product quote',datasheet:'Request datasheet',distributor:'Become a distributor'};
  const sel=document.getElementById('f-type');
  const t=params.get('type');
  if(t && typeMap[t] && sel){ sel.value=typeMap[t]; }
  const model=params.get('model');
  if(model){
    const prod=document.getElementById('f-product'); if(prod) prod.value=model;
    const msg=document.getElementById('f-message');
    if(msg && !msg.value){
      msg.value = (t==='datasheet')
        ? `Please send me the datasheet for the ${model}.`
        : `I'm interested in the ${model}. Please send pricing / MOQ.`;
    }
  }

  // Web3Forms endpoint — works on any static host (Netlify / Cloudflare / GitHub Pages).
  // The access key is PUBLIC by design (like a form-endpoint URL); spam is blocked by the
  // honeypot below + hCaptcha you enable in the Web3Forms dashboard.
  const WEB3FORMS_KEY='a864ccd2-0d8d-42ac-880e-66ee2746de11'; // Web3Forms access key → emails to contact@x-lion.com.cn

  // Pre-filled mailto: used for local file:// preview AND until the real key is pasted,
  // so the inquiry still reaches us in the interim.
  function sendViaMailto(){
    const info=document.getElementById('form-info');
    const g=function(id){const el=document.getElementById(id);return el?el.value.trim():'';};
    const body=[
      'Name: '+g('f-name'),
      'Company: '+g('f-company'),
      'Email: '+g('f-email'),
      'Phone / WhatsApp: '+g('f-phone'),
      'Country / Region: '+g('f-country'),
      'Inquiry type: '+g('f-type'),
      'Product of interest: '+g('f-product'),
      '',
      'Message:',
      g('f-message')
    ].join('\n');
    const subject='Website inquiry: '+(g('f-type')||'General')+(g('f-product')?' - '+g('f-product'):'');
    window.location.href='mailto:contact@x-lion.com.cn?subject='+encodeURIComponent(subject)+'&body='+encodeURIComponent(body);
    if(info){ info.classList.add('show'); info.scrollIntoView({behavior:'smooth',block:'center'}); }
  }

  form.addEventListener('submit',function(e){
    const ok=document.getElementById('form-ok'), err=document.getElementById('form-err'), info=document.getElementById('form-info');
    if(ok) ok.classList.remove('show');
    if(err) err.classList.remove('show');
    if(info) info.classList.remove('show');
    e.preventDefault();

    // No backend for file:// preview, or key not pasted yet → mailto fallback.
    if(location.protocol==='file:' || WEB3FORMS_KEY.indexOf('REPLACE_')===0){ sendViaMailto(); return; }

    // Honeypot: hidden from humans; if a bot filled it, silently drop (pretend success).
    const hp=form.querySelector('[name="_gotcha"]');
    if(hp && hp.value){ form.reset(); if(ok){ ok.classList.add('show'); } return; }

    // Web3Forms: POST JSON; it emails the inquiry to contact@x-lion.com.cn.
    const data=Object.fromEntries(new FormData(form).entries());
    delete data['form-name']; delete data['_gotcha'];
    data.access_key=WEB3FORMS_KEY;
    data.from_name='X-LION Website';
    data.subject='Website inquiry: '+(data.inquiry_type||'General')+(data.product?(' - '+data.product):'');
    fetch('https://api.web3forms.com/submit',{method:'POST',headers:{'Content-Type':'application/json','Accept':'application/json'},body:JSON.stringify(data)})
      .then(r=>r.json())
      .then(d=>{
        if(d && d.success){ form.reset(); if(ok){ ok.classList.add('show'); ok.scrollIntoView({behavior:'smooth',block:'center'}); } }
        else { if(err) err.classList.add('show'); }
      })
      .catch(()=>{ if(err) err.classList.add('show'); });
  });
}

/* ---- Cookie consent (Google Consent Mode v2) ---- */
function initCookieConsent(){
  const KEY='xlion-consent';
  function grant(){ if(window.gtag){ gtag('consent','update',{ad_storage:'granted',analytics_storage:'granted',ad_user_data:'granted',ad_personalization:'granted'}); } }
  let choice=null; try{ choice=localStorage.getItem(KEY); }catch(e){}
  if(choice==='granted'){ grant(); return; }
  if(choice==='denied'){ return; }
  const lang=loadLang();
  const bar=document.createElement('div');
  bar.className='cookie-banner';
  bar.innerHTML='<p data-en="We use cookies for analytics to understand traffic and improve your experience. See our <a href=&quot;privacy.html&quot;>Privacy Policy</a>." data-zh="我们使用 Cookie 进行流量分析以改善您的体验。详见<a href=&quot;privacy.html&quot;>隐私政策</a>。">We use cookies for analytics to understand traffic and improve your experience. See our <a href="privacy.html">Privacy Policy</a>.</p>'
    +'<div class="cookie-btns"><button type="button" class="ck-accept" data-en="Accept" data-zh="接受">Accept</button><button type="button" class="ck-decline" data-en="Decline" data-zh="拒绝">Decline</button></div>';
  document.body.appendChild(bar);
  // apply current language to the banner only
  bar.querySelectorAll('[data-en]').forEach(function(el){ const v=lang==='zh'?el.getAttribute('data-zh'):el.getAttribute('data-en'); if(v!==null) el.innerHTML=v; });
  function done(v){ try{ localStorage.setItem(KEY,v); }catch(e){} bar.remove(); }
  bar.querySelector('.ck-accept').addEventListener('click',function(){ grant(); done('granted'); });
  bar.querySelector('.ck-decline').addEventListener('click',function(){ done('denied'); });
}

document.addEventListener('DOMContentLoaded',function(){
  const y=document.getElementById('year'); if(y) y.textContent=new Date().getFullYear();
  setLang(loadLang());
  initHeroSlides();
  initCategories();
  initInquiryForm();
  initWorldMapLive();
  initCookieConsent();
});
