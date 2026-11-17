const $ = (selector) => document.querySelector(selector);
const grid = $('#grid');
const dialog = $('#product');
const state = { products: [], category: 'All products', query: '', preview: false };
let opener;
const palettes = [['#e8ecdf','#5a6950'],['#e4e9eb','#536775'],['#ede4dc','#846653'],['#e7e3ef','#70617e'],['#e2eae6','#4e7065'],['#ebe7d8','#82754c']];
function el(tag, className, text) {
  const node = document.createElement(tag);
  if (className) node.className = className;
  if (text !== undefined) node.textContent = text;
  return node;
}
function initials(p) { return p.id === 'ramen-shop' ? 'R&B' : p.name.split(/[\s-]+/).map(w => w[0]).join('').slice(0, 3); }
function link(label, href, style='secondary') {
  const a=el('a',style,label); a.href=href;
  if (href.startsWith('https://')) { a.target='_blank'; a.rel='noopener noreferrer'; }
  return a;
}
function art(p, index) {
  const a=el('div','art'); const palette=palettes[index % palettes.length];
  a.style.setProperty('--artbg',palette[0]); a.style.setProperty('--artink',palette[1]);
  if (p.image) { const img=el('img'); img.src=p.image; img.alt='Ramen and Boba portfolio room'; img.loading='lazy'; a.append(img); }
  else { a.append(el('span','monogram',initials(p)),el('span','art-label',p.category.toUpperCase()),el('span','art-mark',p.fork?'↗':'✳')); }
  return a;
}
function render() {
  const products=state.products.filter(p => (state.category==='All products'||p.category===state.category) && (!state.preview||p.demo) && [p.name,p.summary,p.category,p.role,...p.features].join(' ').toLowerCase().includes(state.query.toLowerCase()));
  grid.replaceChildren(); $('#count').textContent=`${products.length}`; $('#empty').hidden=!!products.length;
  $('#collection-title').firstChild.textContent=state.category;
  for (const p of products) {
    const b=el('button','card'); b.type='button'; b.dataset.product=p.id; b.setAttribute('aria-label',`Explore ${p.name}`);
    b.append(art(p,state.products.indexOf(p)));
    const head=el('div','card-heading'); head.append(el('h3','',p.name),el('span','','↗')); b.append(head,el('p','summary',p.summary));
    const meta=el('div','meta'); meta.append(el('span','badge',p.demo?'Preview ↗':'Source'),el('span','',p.role)); b.append(meta);
    b.addEventListener('click',()=>{opener=b;location.hash=`/app/${p.id}`;}); grid.append(b);
  }
  document.querySelectorAll('[data-category]').forEach(b=>{ const selected=b.dataset.category===state.category;b.classList.toggle('selected',selected);b.setAttribute('aria-pressed',String(selected)); });
}
function productPage(p) {
  const body=el('article','detail-body'); const identity=el('div','detail-identity');
  const title=el('div'); title.append(el('p','eyebrow',p.category.toUpperCase()),el('h1','',p.name));
  identity.append(el('div','app-icon',initials(p)),title); body.append(identity,el('p','description',p.summary));
  const meta=el('div','meta'); meta.append(el('span','badge',p.availability),el('span','',p.role)); body.append(meta);
  const actions=el('div','detail-actions');
  if(p.demo) actions.append(link(p.id==='ramen-shop'?'Play the prototype ↗':'Open public preview ↗',p.demo,'primary'));
  actions.append(link('View project source ↗',p.repo));body.append(actions);
  if(!p.demo) body.append(el('p','no-demo','No hosted interactive demo is linked yet. Explore the source and documentation; this page does not imply a running service.'));
  body.append(el('h2','',p.role==='Open-source collaboration'?'Where I focus':'Inside the project'));
  const list=el('ul','feature-list');p.features.forEach(f=>list.append(el('li','',f)));body.append(list);
  if(p.video) {body.append(el('h2','','Watch the film'));const v=el('video');v.controls=true;v.preload='metadata';v.playsInline=true;v.src=p.video;v.poster=p.image;v.setAttribute('aria-label',`${p.name} recorded orbit`);body.append(v,el('p','caveat','Recorded 3D orbit from the existing portfolio captures. Not a live product session.'));}
  body.append(el('h2','','What to know'),el('p','caveat',p.caveat));
  if(p.fork) body.append(el('p','caveat','This project builds on upstream work. Follow the repository for its original authors and license. A fork, experiment, or review is not an upstream merge.'));
  const source=el('p','source-line');source.append(`Catalog source · ${p.sourceDate} · `,link('Read the evidence ↗',p.source,''));body.append(source);
  return body;
}
function route() {
  const match=location.hash.match(/^#\/app\/([^/]+)$/);const p=match&&state.products.find(p=>p.id===decodeURIComponent(match[1]));
  if(!p) {if(dialog.open)dialog.close();document.title='The Workshop — Kevin Rajan';return;}
  $('#detail').replaceChildren(productPage(p));document.title=`${p.name} — The Workshop`;
  if(!dialog.open)dialog.showModal();dialog.scrollTop=0;$('#close').focus();
}
function closePage(){location.hash='';}
$('#close').addEventListener('click',closePage);
dialog.addEventListener('cancel',event=>{event.preventDefault();closePage();});
dialog.addEventListener('close',()=>{dialog.querySelectorAll('video').forEach(v=>v.pause());opener?.focus();});
$('#search').addEventListener('input',event=>{state.query=event.target.value;render();});
$('#playable').addEventListener('change',event=>{state.preview=event.target.checked;render();});
window.addEventListener('hashchange',route);
window.addEventListener('keydown',event=>{if(event.key==='/'&&!dialog.open&&!['INPUT','TEXTAREA'].includes(document.activeElement.tagName)){event.preventDefault();$('#search').focus();}});
document.querySelector('[data-open]').addEventListener('click',()=>{location.hash='/app/ramen-shop';});
$('#watch-feature').addEventListener('click',()=>{location.hash='/app/ramen-shop';});
try {
  const response=await fetch('catalog.json'); if(!response.ok)throw Error(`Catalog HTTP ${response.status}`);
  state.products=(await response.json()).products;
  const categories=['All products',...new Set(state.products.map(p=>p.category))];
  for(const category of categories)for(const selector of ['#categories','#pills']){
    const b=el('button','',category);b.type='button';b.dataset.category=category;b.addEventListener('click',()=>{state.category=category;render();});$(selector).append(b);
  }
  render();route();
}catch(error){$('#load-error').hidden=false;console.error(error);}
