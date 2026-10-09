/* Local DOM controls only. Ana's existing interface and backend own the conversation. */
(() => {
 'use strict';
 const t = value => window.PortfolioLocale?.t(value) ?? value;
 const all=(selector,root=document)=>[...root.querySelectorAll(selector)];
 document.body.classList.add('workshop-ready');
 const inspector=document.querySelector('#project-inspector');
 function tabs(container,buttons,panels,onSelect){
  container.setAttribute('role','tablist');
  function select(index,focus=false){
   buttons.forEach((button,i)=>{
    if(!button.id)button.id=`tab-${panels[i].id}`;
    button.setAttribute('role','tab');button.setAttribute('aria-controls',panels[i].id);button.setAttribute('aria-selected',String(i===index));button.tabIndex=i===index?0:-1;
    panels[i].setAttribute('role','tabpanel');panels[i].setAttribute('aria-labelledby',button.id);panels[i].tabIndex=0;panels[i].hidden=i!==index;
   });
   if(focus)buttons[index].focus();if(onSelect)onSelect(index);
  }
  buttons.forEach((button,i)=>{
   button.addEventListener('click',event=>{event.preventDefault();select(i);});
   button.addEventListener('keydown',event=>{
    const next=event.key==='Home'?0:event.key==='End'?buttons.length-1:['ArrowRight','ArrowDown'].includes(event.key)?(i+1)%buttons.length:['ArrowLeft','ArrowUp'].includes(event.key)?(i+buttons.length-1)%buttons.length:null;
    if(next!==null){event.preventDefault();select(next,true);}
   });
  });select(0);return select;
 }
 const pages=all('.case-page');
 if(inspector&&typeof inspector.showModal==='function'){
  const chapters=new Map();
  const select=tabs(document.querySelector('.case-select'),all('[data-case-select]'),pages,()=>{pages.forEach(p=>{all('details',p).forEach(d=>d.open=false);chapters.get(p.id)?.(0);});});
  pages.forEach(page=>chapters.set(page.id,tabs(page.querySelector('.case-chapters'),all('.case-chapters button',page),all('.case-chapter',page))));
  let opener;
  function openProject(id,trigger){const index=pages.findIndex(p=>p.id===`case-${id}`);if(index<0)return;select(index);opener=trigger?.closest('.project-menu')?.querySelector('summary')||trigger;if(!inspector.open)inspector.showModal();inspector.scrollTop=0;}
  all('[data-open-project]').forEach(link=>link.addEventListener('click',event=>{event.preventDefault();openProject(link.dataset.openProject,link);link.closest('.project-menu')?.removeAttribute('open');}));
  inspector.querySelector('[data-close-inspector]').addEventListener('click',()=>inspector.close());
  inspector.addEventListener('close',()=>opener?.focus({preventScroll:true}));
  all('[data-inspector-exit]').forEach(link=>link.addEventListener('click',()=>{
   const service=document.querySelector(`#service-${link.dataset.serviceTarget}`);
   if(service){service.click();opener=service;}
   inspector.close();
  }));
  if(location.hash.startsWith('#case-'))openProject(location.hash.slice(6));
 }
 const services=all('[data-service-select]'),panels=all('.service-panel');
 if(services.length){
  const select=tabs(document.querySelector('.service-select'),services,panels,index=>services.forEach((s,i)=>s.querySelector('.service-sign').textContent=i===index?'−':'＋'));
  const initial=panels.findIndex(panel=>panel.id===location.hash.slice(1));
  if(initial>=0)select(initial);
 }
 const workFilters=all('[data-work-filter]');
 const archive=document.querySelector('.project-archive');
 all('a[href="#case-studies"]').forEach(link=>link.addEventListener('click',()=>{if(archive)archive.open=true;}));
 if(archive&&location.hash==='#case-studies')archive.open=true;
 if(workFilters.length){document.querySelector('.work-filters').hidden=false;workFilters.forEach(button=>button.addEventListener('click',()=>{
  workFilters.forEach(b=>b.setAttribute('aria-pressed',String(b===button)));
  const category=button.dataset.workFilter;
  all('.work-card').forEach(card=>card.hidden=!['all','other'].includes(category)&&!card.dataset.category.split(' ').includes(category));
 }));}
 const choices=all('[data-feedback]'),quotes=all('.testimonial');
 if(choices.length){document.querySelector('.feedback-select').hidden=false;choices.forEach(button=>button.addEventListener('click',()=>{
  choices.forEach(b=>b.setAttribute('aria-pressed',String(b===button)));quotes.forEach((quote,i)=>{quote.hidden=i!==Number(button.dataset.feedback);quote.querySelector('details').open=false;});
 }));}
 const pressFilters=all('[data-press]');
 if(pressFilters.length){document.querySelector('.press-filters').hidden=false;pressFilters.forEach(button=>button.addEventListener('click',()=>{
  pressFilters.forEach(b=>b.setAttribute('aria-pressed',String(b===button)));const category=button.dataset.press;
  all('[data-press-category]').forEach(row=>row.hidden=category==='recognition'?row.dataset.pressCategory==='PRESS':category!=='all'&&row.dataset.pressCategory!==category);
 }));}
 const copy=document.querySelector('.copy-email');
 if(copy&&navigator.clipboard?.writeText){copy.hidden=false;copy.addEventListener('click',async()=>{
  const status=document.querySelector('.copy-status');try{await navigator.clipboard.writeText('contact@danilostoletovic.com');status.textContent=' Email copied.';}catch{status.textContent=' Select the email address to copy it.';}
 });}
 // Prompt chips only prepare a draft. They never submit a request on the visitor's behalf.
 all('[data-ana-prompt]').forEach(button=>button.addEventListener('click',()=>{
  if(inspector?.open)inspector.close();
  setTimeout(()=>{const input=document.querySelector('.secretary-form textarea');if(input){input.value=button.dataset.anaPrompt;input.dispatchEvent(new Event('input',{bubbles:true}));input.focus();}},0);
 }));
 if(typeof HTMLDialogElement==='undefined')return;
 const dialog=document.createElement('dialog');dialog.className='evidence-dialog';dialog.setAttribute('aria-label',t('Project evidence'));
 const close=document.createElement('button');close.type='button';close.textContent=t('Close ×');const image=document.createElement('img'),caption=document.createElement('p');dialog.append(close,image,caption);document.body.append(dialog);
 let opener,gallery=[],current=0;const bar=document.createElement('div');bar.className='evidence-controls';
 function display(){const link=gallery[current],original=link.querySelector('img');image.src=original.src;image.alt=original.alt;caption.textContent=`${current+1} / ${gallery.length} — ${link.closest('figure')?.querySelector('figcaption')?.textContent||original.alt}`;bar.hidden=gallery.length<2;}
 [[t('← Previous'),-1],[t('Next →'),1]].forEach(([label,delta])=>{const button=document.createElement('button');button.type='button';button.textContent=label;button.addEventListener('click',()=>{current=(current+delta+gallery.length)%gallery.length;display();});bar.append(button);});dialog.append(bar);
 close.addEventListener('click',()=>dialog.close());dialog.addEventListener('close',()=>opener?.focus({preventScroll:true}));
 dialog.addEventListener('keydown',event=>{if(!['ArrowLeft','ArrowRight'].includes(event.key)||gallery.length<2)return;event.preventDefault();current=(current+(event.key==='ArrowRight'?1:-1)+gallery.length)%gallery.length;display();});
 const links=all('.evidence-link');links.forEach(link=>link.addEventListener('click',event=>{event.preventDefault();opener=link;gallery=links.filter(item=>item.dataset.gallery===link.dataset.gallery);current=gallery.indexOf(link);display();dialog.showModal();}));
})();
