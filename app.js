(() => {
  const $ = (id) => document.getElementById(id);
  const welcome=$("welcome"), chatView=$("chatView"), messages=$("messages"), question=$("question");
  const Flows=window.GOVAIFlows;
  let conversations=[], activeId=null, storageOK=true, busy=false, typing=false, pending=[], servicePageKey=null;
  const now=()=>new Date().toISOString();
  const makeId=()=>`c_${Date.now()}_${Math.random().toString(36).slice(2,7)}`;
  const sleep=(ms)=>new Promise(r=>setTimeout(r,ms));
  function load(){
    try{const raw=localStorage.getItem("govai_conversations_v13");conversations=raw?JSON.parse(raw):[];if(!Array.isArray(conversations))conversations=[];}
    catch(e){storageOK=false;conversations=[];}
  }
  function save(){
    try{localStorage.setItem("govai_conversations_v13",JSON.stringify(conversations));storageOK=true;}
    catch(e){storageOK=false;}
  }
  function active(){return conversations.find(c=>c.id===activeId)||null;}
  function escapeHTML(s){return String(s).replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]));}

  /* ---------- Rendering ---------- */
  function renderHistory(){
    const host=$("historyList");host.innerHTML="";
    if(!conversations.length){host.innerHTML='<p class="muted side-empty">Your conversations will appear here.</p>';return;}
    [...conversations].sort((a,b)=>b.updated.localeCompare(a.updated)).forEach(c=>{
      const b=document.createElement("button");b.className="history-item";b.textContent=c.title||"New conversation";b.title="Open conversation · Double-click to rename";b.onclick=()=>openConversation(c.id);b.ondblclick=(e)=>{e.preventDefault();renameConversation(c.id);};host.appendChild(b);
    });
  }
  function messageHTML(m,isLast){
    if(m.role==="user")return `<div class="avatar">Y</div><div class="mbody"><div class="bubble">${escapeHTML(m.text)}</div></div>`;
    let h='<div class="avatar">G</div><div class="mbody">';
    if(m.tag)h+=`<div class="qtag">${escapeHTML(m.tag)}</div>`;
    if(m.ack)h+=`<div class="ack">✓ ${escapeHTML(m.ack)}</div>`;
    if(!m.card||m.text)h+=`<div class="bubble">${escapeHTML(m.text)}</div>`;
    if(m.list)h+=`<ul class="msg-list">${m.list.map(x=>`<li><span>${escapeHTML(x[0])}</span><strong>${escapeHTML(x[1])}</strong></li>`).join("")}</ul>`;
    if(m.card&&Flows)h+=Flows.cardHTML(m.card);
    if(isLast&&m.chips&&m.chips.length)h+=`<div class="chips">${m.chips.map(c=>`<button type="button" class="chip" data-chip="${escapeHTML(c)}">${escapeHTML(c)}</button>`).join("")}</div>`;
    return h+"</div>";
  }
  function renderMessages(){
    const c=active();messages.innerHTML="";
    if(!c||!c.messages.length)return;
    c.messages.forEach((m,i)=>{
      const row=document.createElement("div");row.className=`message ${m.role}`;
      row.innerHTML=messageHTML(m,i===c.messages.length-1);row.dataset.i=i;messages.appendChild(row);
    });
    if(typing){const row=document.createElement("div");row.className="message assistant";row.innerHTML='<div class="avatar">G</div><div class="mbody"><div class="bubble typing" aria-label="GOVAI is typing"><i></i><i></i><i></i></div></div>';messages.appendChild(row);}
    chatView.scrollTop=chatView.scrollHeight;
  }
  function showChat(){document.querySelector(".main-area").classList.remove("page-active");servicePageKey=null;$("servicePage").classList.add("hidden");welcome.classList.add("hidden");chatView.classList.remove("hidden");$("suggestions").classList.add("hidden");paintChatTitle();}
  function paintChatTitle(){const b=$("chatTitleBtn"),c=active();if(!b)return;b.classList.toggle("hidden",!c);b.textContent=c?(c.title||"Rename chat")+" ✎":"";}
  function renameConversation(id){const c=conversations.find(x=>x.id===id);if(!c)return;const next=prompt("Edit this chat name:",c.title||"New conversation");if(next===null)return;const v=next.trim().slice(0,70);if(v){c.title=v;c.updated=now();save();renderHistory();paintChatTitle();}}
  function openConversation(id){stopSpeak();activeId=id;showChat();renderMessages();closeSidebar();}
  function openServicePage(key){stopSpeak();servicePageKey=key;document.querySelector(".main-area").classList.add("page-active");welcome.classList.add("hidden");chatView.classList.add("hidden");$("servicePage").classList.remove("hidden");$("suggestions").classList.add("hidden");closeSidebar();
    const titles={directory:"More Government Services",rtsa:"Road Transport & Safety Agency",nrc:"National Registration & Civil Services",immigration:"Immigration & Passports",lands:"Land & Property Services",napsa:"NAPSA & Social Security",council:"Local Government & Councils",education:"Education & Bursaries",health:"Health Services",mining:"Mining & Minerals",agriculture:"Agriculture & Livestock",procurement:"Public Procurement",justice:"Justice & Court Services",tourism:"Tourism & Environment"};
    const isDirectory=key==="directory";const items=isDirectory?[['rtsa','RTSA · Road transport'],['nrc','NRC & civil registration'],['immigration','Passports & immigration'],['lands','Land & property'],['napsa','NAPSA & social security'],['council','Local government & councils'],['education','Education & bursaries'],['health','Health services'],['mining','Mining & minerals'],['agriculture','Agriculture & livestock'],['procurement','Public procurement'],['justice','Justice & courts'],['tourism','Tourism & environment']]:[];
    const host=$("servicePageContent");host.innerHTML=isDirectory?`<div class="service-page-icon">🏛️</div><p class="eyebrow">GOVAI SERVICE DIRECTORY</p><h1>${titles[key]}</h1><p>Explore government services planned for GOVAI. Select a service to see its current availability. These entries are informational placeholders, not live government integrations.</p><div class="service-grid">${items.map(([k,n])=>`<button class="service-tile" data-coming="${k}"><strong>${n}</strong><span>Coming soon · View details →</span></button>`).join("")}</div>`:`<div class="service-page-icon">🚧</div><p class="eyebrow">GOVAI · SERVICE PREVIEW</p><h1>${titles[key]||"Government Service"}</h1><p>This service is coming soon. GOVAI is being prepared to provide guided information and document-preparation support for this area.</p><div class="coming-panel"><strong>Coming soon</strong><span>This page is separate from your current conversation. Your existing chat has not been changed.</span></div><button class="primary-action" id="backDirectory">Explore other government services</button>`;
  }
  function newChat(){
    stopSpeak();activeId=null;servicePageKey=null;document.querySelector(".main-area").classList.remove("page-active");messages.innerHTML="";chatView.classList.add("hidden");$("servicePage").classList.add("hidden");welcome.classList.remove("hidden");
    question.value="";resizeInput();$("suggestions").classList.add("hidden");paintChatTitle();closeSidebar();
  }
  function ensureConversation(firstText){
    let c=active();
    if(!c){c={id:makeId(),title:(firstText||"New conversation").replace(/\s+/g," ").slice(0,42),created:now(),updated:now(),messages:[],flow:null};conversations.push(c);activeId=c.id;}
    return c;
  }
  function addMessage(role,text,extra){
    const c=ensureConversation(role==="user"?text:null);
    if(role==="user"&&c.messages.length===0)c.title=text.replace(/\s+/g," ").slice(0,42);
    c.messages.push(Object.assign({role,text,at:now()},extra||{}));c.updated=now();save();renderHistory();renderMessages();paintChatTitle();
  }

  /* ---------- Voice: read-out + hands-free listening ---------- */
  const SR=window.SpeechRecognition||window.webkitSpeechRecognition, TTS="speechSynthesis" in window;
  let voiceOn=true;try{voiceOn=localStorage.getItem("govai_voice")!=="off";}catch(e){}
  let voiceMode=false, rec=null, recActive=false, speaking=false, sq=[], sid=0, idle=0;
  function paintVoice(){const b=$("voiceBtn");if(!b)return;b.textContent=voiceOn?"🔊":"🔇";b.setAttribute("aria-pressed",voiceOn);b.title=voiceOn?"Read-out on":"Read-out off";}
  function paintMic(){const m=$("micBtn");if(m){m.classList.toggle("on",voiceMode);m.setAttribute("aria-pressed",voiceMode);}}
  function chunk(text){
    const parts=String(text).replace(/[•–—]/g,",").replace(/\s+/g," ").trim().match(/[^.!?]+[.!?]*/g)||[];
    const out=[];let cur="";
    parts.forEach(p=>{if((cur+p).length>180&&cur){out.push(cur.trim());cur=p;}else cur+=p;});
    if(cur.trim())out.push(cur.trim());return out;
  }
  function stopSpeak(){sid++;sq=[];speaking=false;if(TTS)try{speechSynthesis.cancel();}catch(e){}}
  function speak(text){
    if(!voiceOn||!TTS||!text)return;
    sq.push(...chunk(text));if(!speaking)pump();
  }
  function pump(){
    if(!sq.length){speaking=false;resumeMic();return;}
    speaking=true;pauseRec();
    const id=sid,u=new SpeechSynthesisUtterance(sq.shift());u.lang="en-GB";
    u.onend=u.onerror=()=>{if(id===sid)pump();};
    try{speechSynthesis.speak(u);}catch(e){speaking=false;resumeMic();}
  }
  function speakMessage(m){
    if(m.speak){speak(Array.isArray(m.speak)?m.speak.join(" "):m.speak);return;}
    let t=[m.ack,m.tag&&m.tag+".",m.text].filter(Boolean).join(". ");
    if(!m.flowMsg&&t.length>420){const cut=t.slice(0,420);t=cut.slice(0,Math.max(cut.lastIndexOf("."),200)+1);}
    speak(t);
  }
  function pauseRec(){if(rec&&recActive){try{rec.abort();}catch(e){}}}
  function resumeMic(){if(voiceMode&&!speaking&&!recActive)startRec();}
  function startRec(){
    if(!SR||!voiceMode||speaking||recActive)return;
    rec=new SR();rec.lang="en-GB";rec.interimResults=true;rec.continuous=false;rec.maxAlternatives=1;
    rec.onstart=()=>{recActive=true;question.placeholder="Listening… speak now";};
    rec.onresult=ev=>{
      let interim="",final="";
      for(let i=ev.resultIndex;i<ev.results.length;i++){const r=ev.results[i];if(r.isFinal)final+=r[0].transcript;else interim+=r[0].transcript;}
      if(interim){question.value=interim;resizeInput();}
      if(final){idle=0;question.value="";resizeInput();handleSpoken(final.trim());}
    };
    rec.onerror=e=>{
      if(e.error==="not-allowed"||e.error==="service-not-allowed"){stopVoiceMode();question.placeholder="Microphone blocked. Allow microphone access.";}
      else if(e.error==="no-speech")idle++;
    };
    rec.onend=()=>{
      recActive=false;if(!speaking&&!busy)question.placeholder="Ask anything";
      if(voiceMode&&!speaking){
        if(idle>=3){stopVoiceMode();return;}
        setTimeout(resumeMic,250);
      }
    };
    try{rec.start();}catch(e){recActive=false;}
  }
  function stopVoiceMode(){voiceMode=false;idle=0;if(rec){try{rec.abort();}catch(e){}}recActive=false;paintMic();question.placeholder="Ask anything";}
  function toggleVoiceMode(){
    if(!SR)return;
    if(voiceMode){stopVoiceMode();return;}
    voiceMode=true;idle=0;voiceOn=true;paintVoice();paintMic();
    startRec();
  }
  function handleSpoken(text){
    const t=text.toLowerCase().replace(/[.,!?]/g,"").trim();
    if(/^(stop listening|mic off|turn off (the )?(mic|microphone)|stop voice)$/.test(t)){stopSpeak();stopVoiceMode();return;}
    if(/^(be quiet|stop talking|shut up|silence)$/.test(t)){stopSpeak();return;}
    send(text);
  }

  /* ---------- Sending, typing indicator, flow routing ---------- */
  function answer(text){
    const t=text.toLowerCase();
    if(/pacra|register.*(business|company|name)|business name|limited company/.test(t))return pacraAnswer(t);
    if(/zra|tpin|tax|taxpayer/.test(t))return zraAnswer();
    if(/business plan|startup|starter|budget|business profile/.test(t))return starterAnswer();
    if(/more services|service directory|government services/.test(t))return directoryAnswer();
    return "I'm here to help. You can tell me what you're trying to do in your own words, ask a question, or think an idea through with me. If we discover that you need a specific task, we can move into it naturally at any point. In this demo I can help prepare a business registration summary, a ZRA TPIN information checklist, or a business profile. Nothing is submitted to a government agency.";
  }
  function pacraAnswer(t){
    const isName=/business name|name reservation|sole trader|trade name/.test(t)&&!/limited company|company registration/.test(t);
    if(isName)return "PACRA – BUSINESS NAME REGISTRATION\n\nA business name is commonly used by a sole trader or partnership. It is not the same as registering a limited company.\n\nTo prepare, gather:\n1. Your proposed business name(s).\n2. Nature of business and business activities.\n3. Owner/partner details and contact information.\n4. Identification and any supporting information PACRA currently requires.\n\nNext step: tell me your proposed business name and what the business will do. I can help you prepare a checklist and draft details for review.\n\nImportant: This prototype does not check name availability or submit an application to PACRA.";
    return "PACRA – LIMITED COMPANY REGISTRATION\n\nA limited company is a separate legal entity. This route is different from registering a business name.\n\nPreparation checklist:\n1. Proposed company name(s).\n2. Company type and principal business activity.\n3. Details of shareholders and directors.\n4. Share structure and registered office details.\n5. Identification and supporting information required by PACRA.\n\nPlain language: shareholders own the company; directors are responsible for managing it. One person may sometimes hold more than one role, subject to applicable rules.\n\nTell me the proposed company name and business activity and I can help organise a preparation checklist.\n\nImportant: GOVAI does not check availability, file documents or obtain official approval from PACRA.";
  }
  function zraAnswer(){return "ZRA – TPIN AND TAX PREPARATION\n\nA TPIN is a Taxpayer Identification Number used by the Zambia Revenue Authority to identify a taxpayer.\n\nTo prepare, you may need:\n1. Your identity or business registration details.\n2. Contact information and physical/business address.\n3. Relevant PACRA documents if registering a company or business.\n4. Details of the type of taxpayer or business activity.\n\nI can help you understand the information and prepare a checklist. Tell me whether you need a TPIN as an individual, sole trader or registered company.\n\nImportant: GOVAI is not connected to ZRA and cannot issue a TPIN, access taxpayer records or submit a tax registration.";
  }
  function starterAnswer(){return "Let's develop your business idea into a practical business profile. You do not need a complete plan yet. Tell me what you are thinking of starting, your town and any budget you have. I will help explore suitable ideas, identify customers, develop the offer and prepare a structured profile with a draft budget. The final document will clearly distinguish your information from GOVAI's assumptions and suggestions.";}
  function directoryAnswer(){return "GOVERNMENT SERVICES DIRECTORY\n\nAvailable in this prototype:\n• PACRA – business registration preparation\n• ZRA – TPIN and tax guidance\n• Business Starter Pack – plans, profiles and budgets\n\nComing soon (not yet operational):\n• NRC and civil registration\n• Passports and immigration\n• Land and property\n• RTSA and road transport\n• Education and bursaries\n• Health services\n• Agriculture and livestock\n• Mining and minerals\n• Employment and labour\n• NAPSA and social security\n• Local government and council services\n• Public procurement\n• Justice and court information\n• Tourism and environment\n\nThese directory entries are placeholders. They do not imply an integration or official relationship.";
  }
  async function deliver(convId,msgs){
    busy=true;
    for(const m of msgs){
      typing=activeId===convId;if(typing)renderMessages();
      await sleep(Math.min(380+(m.text||"").length*5,950));
      typing=false;
      const c=conversations.find(x=>x.id===convId);if(!c)continue;
      c.messages.push(Object.assign({role:"assistant",at:now(),flowMsg:true},m));c.updated=now();save();
      if(activeId===convId){renderMessages();speakMessage(m);}
    }
    typing=false;busy=false;renderHistory();
    if(pending.length)send(pending.shift());else if(!speaking)resumeMic();
  }
  function respond(value){
    const c=active();let out=null;
    if(Flows){
      if(c.flow){out=Flows.handle(c.flow,value);c.flow=out.flow;}
      else{const k=Flows.detect(value);if(k){out=Flows.start(k);c.flow=out.flow;}}
    }
    save();
    if(out){deliver(c.id,out.messages);return;}
    const reply=answer(value);
    deliver(c.id,[{text:reply,flowMsg:false,chips:Flows?Flows.START_CHIPS:[]}].map(m=>Object.assign(m,{flowMsg:false})));
  }
  function send(text){
    const value=(text??question.value).trim();if(!value)return;
    if(busy){pending.push(value);question.value="";resizeInput();return;}
    stopSpeak();
    addMessage("user",value);question.value="";resizeInput();showChat();
    $("suggestions").classList.add("hidden");
    respond(value);
  }
  function resizeInput(){question.style.height="auto";question.style.height=Math.min(question.scrollHeight,130)+"px";}
  function openSidebar(){$("sidebar").classList.add("open");$("scrim").classList.add("show");}
  function closeSidebar(){$("sidebar").classList.remove("open");$("scrim").classList.remove("show");}

  /* ---------- Printing a result card ---------- */
  function printCard(el){
    const old=$("printArea");if(old)old.remove();
    const area=document.createElement("div");area.id="printArea";area.innerHTML=el.outerHTML;
    area.querySelectorAll(".demo-actions").forEach(x=>x.remove());document.body.appendChild(area);
    const cleanup=()=>{area.remove();window.removeEventListener("afterprint",cleanup);};
    window.addEventListener("afterprint",cleanup);setTimeout(()=>window.print(),50);
  }

  function pdfEscape(t){return String(t??"").normalize("NFKD").replace(/[^\x20-\x7E]/g," ").replace(/\\/g,"\\\\").replace(/\(/g,"\\(").replace(/\)/g,"\\)");}
  function downloadProfilePDF(card){
    const lines=["GOVAI BUSINESS PROFILE",card.main||"Business concept",card.tagline||"", "",card.summary||"", "",...(card.rows||[]).flatMap(r=>[`${r[0]}: ${r[1]||"To be confirmed"}`]),"","Planning document only. Validate assumptions, costs, licences and market demand before investing.","Generated by GOVAI · Not an official government record"];
    const pages=[];for(let i=0;i<lines.length;i+=38)pages.push(lines.slice(i,i+38));
    const objs=[];const add=o=>{objs.push(o);return objs.length;};
    const font=add("<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>");
    const pageIds=[];const contentIds=[];
    pages.forEach(pg=>{let stream="BT\n/F1 10 Tf\n50 790 Td\n14 TL\n";pg.forEach((line,i)=>{const chunks=String(line).match(/.{1,92}(?:\s|$)/g)||[String(line)];chunks.forEach((part,j)=>{if(i||j)stream+="T*\n";stream+="("+pdfEscape(part.trim())+") Tj\n";});});stream+="ET";const cid=add(`<< /Length ${stream.length} >>\nstream\n${stream}\nendstream`);contentIds.push(cid);pageIds.push(add(""));});
    const pagesId=add(""),catalogId=add("");pageIds.forEach((id,i)=>objs[id-1]=`<< /Type /Page /Parent ${pagesId} 0 R /MediaBox [0 0 612 842] /Resources << /Font << /F1 ${font} 0 R >> >> /Contents ${contentIds[i]} 0 R >>`);
    objs[pagesId-1]=`<< /Type /Pages /Kids [${pageIds.map(x=>x+" 0 R").join(" ")}] /Count ${pageIds.length} >>`;objs[catalogId-1]=`<< /Type /Catalog /Pages ${pagesId} 0 R >>`;
    let pdf="%PDF-1.4\n",offsets=[0];objs.forEach((o,i)=>{offsets.push(pdf.length);pdf+=`${i+1} 0 obj\n${o}\nendobj\n`;});const xref=pdf.length;pdf+=`xref\n0 ${objs.length+1}\n0000000000 65535 f \n`;for(let i=1;i<offsets.length;i++)pdf+=String(offsets[i]).padStart(10,"0")+" 00000 n \n";pdf+=`trailer\n<< /Size ${objs.length+1} /Root ${catalogId} 0 R >>\nstartxref\n${xref}\n%%EOF`;
    const blob=new Blob([pdf],{type:"application/pdf"}),url=URL.createObjectURL(blob),a=document.createElement("a");a.href=url;a.download=(String(card.main||"Business_Profile").replace(/[^a-z0-9]+/gi,"_").replace(/^_|_$/g,"")||"Business_Profile")+"_Profile.pdf";document.body.appendChild(a);a.click();a.remove();setTimeout(()=>URL.revokeObjectURL(url),1500);
  }

  /* ---------- Events ---------- */
  $("composer").addEventListener("submit",e=>{e.preventDefault();send();});
  question.addEventListener("keydown",e=>{if(e.key==="Enter"&&!e.shiftKey&&!e.isComposing){e.preventDefault();send();}});
  question.addEventListener("input",()=>{$("suggestions").classList.toggle("hidden",question.value.length>0);resizeInput();});
  question.addEventListener("focus",()=>{$("suggestions").classList.add("hidden");});
  document.addEventListener("click",e=>{
    const p=e.target.closest("[data-prompt]");if(p){const fromDemo=p.closest(".demos");if(fromDemo)newChat();closeSidebar();send(p.dataset.prompt);return;}
    const chip=e.target.closest("[data-chip]");if(chip){send(chip.dataset.chip);return;}
    const act=e.target.closest("[data-act]");
    if(act){
      const card=act.closest(".demo-card"),row=act.closest(".message"),c=active();
      const m=c&&row?c.messages[+row.dataset.i]:null;
      if(act.dataset.act==="read"&&m&&m.card){stopSpeak();const was=voiceOn;voiceOn=true;speak((m.card.speak||[]).join(" "));voiceOn=was;}
      if(act.dataset.act==="print"&&card)printCard(card);
      if(act.dataset.act==="pdf"&&card)downloadProfilePDF(m.card);
      if(act.dataset.act==="again"){const prompts={business:"Register a business",tpin:"Register a TPIN",profile:"Create a business profile"};send(prompts[act.dataset.key]);}
    }
  });
  $("menuBtn").onclick=openSidebar;$("closeSidebar").onclick=closeSidebar;$("scrim").onclick=closeSidebar;
  $("newChatBtn").onclick=newChat;$("newChatTop").onclick=newChat;
  $("voiceBtn").onclick=()=>{voiceOn=!voiceOn;try{localStorage.setItem("govai_voice",voiceOn?"on":"off");}catch(e){}if(!voiceOn)stopSpeak();paintVoice();};
  const micBtn=$("micBtn");if(SR){micBtn.classList.remove("hidden");micBtn.onclick=toggleVoiceMode;}
  $("serviceNav").addEventListener("click",e=>{const b=e.target.closest("[data-service]");if(!b)return;const key=b.dataset.service;const prompts={pacra:"I want to prepare a company incorporation application using PACRA Form 3.",zra:"Help me understand ZRA TPIN and tax registration.",starter:"Create a business profile for me. Help me develop my business idea."};if(key==="directory"||key==="rtsa"){openServicePage(key);return;}newChat();send(prompts[key]||"Help me with this government service.");});
  $("servicePage").addEventListener("click",e=>{const b=e.target.closest("[data-coming]");if(b){openServicePage(b.dataset.coming);return;}if(e.target.closest("#backDirectory"))openServicePage("directory");});
  $("serviceBack").onclick=()=>{if(servicePageKey==="directory")newChat();else openServicePage("directory");};
  $("chatTitleBtn").onclick=()=>{const c=active();if(c)renameConversation(c.id);};
  document.addEventListener("keydown",e=>{if(e.key==="Escape")closeSidebar();});
  load();renderHistory();paintVoice();paintMic();newChat();
  if("serviceWorker" in navigator && location.protocol.startsWith("http"))window.addEventListener("load",()=>navigator.serviceWorker.register("./sw.js").catch(()=>{}));
  if(!storageOK)console.warn("GOVAI could not access local storage; conversation history may not persist.");
})();
