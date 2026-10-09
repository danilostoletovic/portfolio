/* Native dialog and email draft only: no backend, AI calls or stored form data. */
(() => {
 const dialog=document.getElementById('contact-popup');
 if(!dialog||typeof dialog.showModal!=='function')return;
 let trigger;
 document.addEventListener('click',event=>{
  const link=event.target.closest('a[data-contact],a[href="#contact"],a[href="/#contact"],a[href$="/#contact"]');
  if(!link||event.ctrlKey||event.metaKey||event.shiftKey||event.altKey)return;
  event.preventDefault();if(dialog.open)return;
  trigger=link;
  const messageField=document.getElementById('contact-message');
  const service=link.closest('.service-panel')?.id.replace('offer-','');
  const template=service&&dialog.querySelector(`[data-contact-template="${service}"]`);
  if(template&&!messageField.dataset.edited){
   messageField.value=[...template.content.querySelectorAll('span')].map(e=>e.textContent+' ').join('\n\n');
  }
  document.querySelectorAll('dialog[open]').forEach(other=>other.close());
  dialog.showModal();document.body.classList.add('contact-popup-open');
  document.getElementById('contact-email').focus();
 });
 dialog.querySelector('.contact-close').addEventListener('click',()=>dialog.close());
 document.getElementById('contact-message').addEventListener('input',event=>{
  event.target.dataset.edited=event.target.value.trim()?'true':'';
 });
 dialog.addEventListener('keydown',event=>{
  if(event.key!=='Tab')return;
  const controls=[...dialog.querySelectorAll('button,input,textarea,select,a[href]')].filter(e=>!e.disabled);
  const first=controls[0],last=controls.at(-1);
  if(event.shiftKey&&document.activeElement===first){event.preventDefault();last.focus();}
  else if(!event.shiftKey&&document.activeElement===last){event.preventDefault();first.focus();}
 });
 dialog.addEventListener('click',event=>{
  const box=dialog.getBoundingClientRect();
  if(event.target===dialog&&(event.clientX<box.left||event.clientX>box.right||event.clientY<box.top||event.clientY>box.bottom))dialog.close();
 });
 dialog.addEventListener('close',()=>{document.body.classList.remove('contact-popup-open');trigger?.focus();});
 document.getElementById('quick-contact').addEventListener('submit',event=>{
  event.preventDefault();
  const email=document.getElementById('contact-email').value.trim();
  const name=document.getElementById('contact-name').value.trim();
  const message=document.getElementById('contact-message').value.trim();
  if(!message){document.getElementById('contact-message').value='';document.getElementById('quick-contact').reportValidity();return;}
  const sr=document.documentElement.lang.startsWith('sr');
  const budget=document.getElementById('contact-budget'),urgency=document.getElementById('contact-urgency');
  const preferences=[budget.value?`${sr?'Budžet':'Budget'}: ${budget.selectedOptions[0].textContent}`:'',urgency.value?`${sr?'Rok':'Timing'}: ${urgency.selectedOptions[0].textContent}`:''].filter(Boolean).join('\n');
  const body=`${message}${preferences?'\n\n'+preferences:''}\n\n${name?name+'\n':''}${email}`;
  location.href='mailto:contact@danilostoletovic.com?subject='+encodeURIComponent(sr?'Upit za projekat':'Project inquiry')+'&body='+encodeURIComponent(body);
 });
})();
