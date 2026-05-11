
const WA_NUMBER = "254786781665";
const AIRTEL_NUMBER = "+254 786 781665";
const BOOK_KEY = "sl_booking";

function $(s,r=document){return r.querySelector(s)}
function $$(s,r=document){return [...r.querySelectorAll(s)]}
function fmt(n){return "$"+Number(n).toLocaleString('en-US',{minimumFractionDigits:0,maximumFractionDigits:0})}
function qs(n){return new URLSearchParams(location.search).get(n)}
function getBk(){try{return JSON.parse(sessionStorage.getItem(BOOK_KEY))||{}}catch{return{}}}
function setBk(o){sessionStorage.setItem(BOOK_KEY,JSON.stringify(o))}
function toast(m){const t=document.createElement('div');t.className='toast';t.textContent=m;document.body.appendChild(t);setTimeout(()=>t.remove(),2000)}

let AIRPORTS=[], FLIGHTS=[];
async function loadData(){
  if(!AIRPORTS.length){AIRPORTS=await(await fetch('airports.json')).json()}
  if(!FLIGHTS.length){FLIGHTS=await(await fetch('flights.json')).json()}
}
function ap(code){return AIRPORTS.find(a=>a.code===code)}

function fillSelect(el,extra=""){
  el.innerHTML = extra + AIRPORTS.map(a=>`<option value="${a.code}">${a.city} (${a.code}) — ${a.name}</option>`).join('');
}

async function initHome(){
  await loadData();
  fillSelect($('#fOrigin'));
  fillSelect($('#fDest'));
  $('#fOrigin').value='WIL';$('#fDest').value='MRE';
  const today=new Date().toISOString().slice(0,10);
  $('#fDate').value=today;$('#fDate').min=today;
  if($('#fReturn'))$('#fReturn').min=today;
  $$('.tab').forEach(t=>t.onclick=()=>{$$('.tab').forEach(x=>x.classList.remove('active'));t.classList.add('active');$('#returnField').style.display=t.dataset.trip==='rt'?'flex':'none'});
  $('#searchForm').onsubmit=e=>{
    e.preventDefault();
    const trip = $('.tab.active').dataset.trip;
    const p = new URLSearchParams({
      o:$('#fOrigin').value, d:$('#fDest').value,
      date:$('#fDate').value, ret:trip==='rt'?$('#fReturn').value:'',
      pax:$('#fPax').value, cls:$('#fClass').value, trip
    });
    location.href='results.html?'+p;
  };
  // destinations grid
  const popular=[["MRE","Masai Mara","https://images.unsplash.com/photo-1516426122078-c23e76319801?w=600"],
    ["KEU","Amboseli","https://images.unsplash.com/photo-1547471080-7cc2caa01a7e?w=600"],
    ["ZNZ","Zanzibar","https://images.unsplash.com/photo-1505881502353-a1986add3762?w=600"],
    ["MBA","Mombasa","https://images.unsplash.com/photo-1623776025811-fd139155a39b?w=600"],
    ["LAU","Lamu","https://images.unsplash.com/photo-1571406252241-db0730fe2cef?w=600"],
    ["UKA","Diani","https://images.unsplash.com/photo-1559291001-693fb9166355?w=600"],
    ["UAS","Samburu","https://images.unsplash.com/photo-1535941339077-2dd1c7963098?w=600"],
    ["NYK","Nanyuki","https://images.unsplash.com/photo-1602002418082-a4443e081dd1?w=600"]];
  $('#destGrid').innerHTML = popular.map(([c,n,img])=>{
    const f=FLIGHTS.find(x=>x.origin==='WIL'&&x.destination===c);
    return `<div class="dest-card" onclick="location.href='results.html?o=WIL&d=${c}&date=${new Date().toISOString().slice(0,10)}&pax=1&cls=Y&trip=ow'">
      <img src="${img}" alt="${n}"><div class="body"><h4>${n}</h4><div class="from">From ${f?fmt(f.price):''}</div></div></div>`;
  }).join('');
}

async function initResults(){
  await loadData();
  const o=qs('o'),d=qs('d'),date=qs('date'),pax=+qs('pax')||1,cls=qs('cls')||'Y',trip=qs('trip')||'ow',ret=qs('ret')||'';
  $('#routeHead').innerHTML = `${ap(o)?.city} <span style="color:var(--accent)">→</span> ${ap(d)?.city}`;
  $('#routeSub').textContent = `${date} · ${pax} passenger${pax>1?'s':''} · ${cls==='J'?'Business':'Economy'}`;
  let list = FLIGHTS.filter(f=>f.origin===o&&f.destination===d);
  if(!list.length){$('#flightList').innerHTML='<div class="empty">No direct flights. Please try another route.</div>';return}
  $('#flightList').innerHTML = list.map(f=>{
    const price = cls==='J'?Math.round(f.price*1.8):f.price;
    return `<div class="flight-row">
      <div class="fr-airline">Safarilink <small>${f.flight_no} · ${f.aircraft}</small></div>
      <div class="fr-times">
        <div>${f.depart}<small>${ap(o)?.code}</small></div>
        <div class="line"></div>
        <div style="text-align:right">${f.arrive}<small>${ap(d)?.code}</small></div>
      </div>
      <div style="color:var(--muted);font-size:13px">${f.duration} · ${f.stops===0?'Non-stop':f.stops+' stop'}</div>
      <div class="fr-price"><div class="amount">${fmt(price*pax)}</div><small style="color:var(--muted)">total · ${pax} pax</small><br>
        <button class="btn btn-primary" style="margin-top:6px" onclick='selectFlight(${JSON.stringify({...f,price,pax,cls,date,trip,ret})})'>Select</button></div>
    </div>`;
  }).join('');
}
window.selectFlight = function(f){
  const bk = getBk();
  bk.outbound = f; bk.pax = f.pax; bk.cls = f.cls; bk.trip = f.trip; bk.date = f.date; bk.ret = f.ret;
  setBk(bk);
  location.href='seats.html';
}

function buildCabin(taken=[]){
  const cols=['A','B','C','D'];
  let html = '<div class="plane-head">Front of aircraft ✈</div><div class="rows">';
  for(let r=1;r<=12;r++){
    const cells = [];
    cells.push(`<div class="row-num">${r}</div>`);
    cols.forEach((c,i)=>{
      const sid=`${r}${c}`;
      const klass=['seat',r<=2?'premium':'',taken.includes(sid)?'taken':''].filter(Boolean).join(' ');
      cells.push(`<div class="${klass}" data-seat="${sid}" onclick="toggleSeat(this)">${sid}</div>`);
      if(i===1) cells.push('<div class="aisle"></div>');
    });
    html += `<div class="seat-row">${cells.join('')}</div>`;
  }
  html += '</div><div class="legend"><span><i style="background:#dfe7ef"></i>Available</span><span><i style="background:#0e9c4a"></i>Selected</span><span><i style="background:#fde6a8"></i>Premium (+$2,500)</span><span><i style="background:#aab4be"></i>Taken</span></div>';
  return html;
}

async function initSeats(){
  await loadData();
  const bk=getBk(); if(!bk.outbound){location.href='index.html';return}
  const f=bk.outbound;
  $('#flightInfo').innerHTML=`<strong>${ap(f.origin)?.city} → ${ap(f.destination)?.city}</strong> · ${f.flight_no} · ${f.depart}–${f.arrive} · ${f.date}`;
  const taken = ['1A','3C','5D','7B','9A','10C','11D','2A'];
  $('#cabin').innerHTML = buildCabin(taken);
  $('#seatNote').textContent = `Select ${bk.pax} seat${bk.pax>1?'s':''}`;
  bk.seats=[]; setBk(bk);
  window.toggleSeat = (el)=>{
    if(el.classList.contains('taken'))return;
    const bk=getBk(); bk.seats=bk.seats||[];
    const sid=el.dataset.seat;
    if(el.classList.contains('selected')){
      el.classList.remove('selected'); bk.seats = bk.seats.filter(s=>s!==sid);
    } else {
      if(bk.seats.length>=bk.pax){toast('Max '+bk.pax+' seats reached');return}
      el.classList.add('selected'); bk.seats.push(sid);
    }
    setBk(bk); updateSeatSummary();
  };
  $('#nextBtn').onclick=()=>{
    const bk=getBk();
    if((bk.seats||[]).length!==bk.pax){toast('Please select '+bk.pax+' seat'+(bk.pax>1?'s':''));return}
    location.href='passengers.html';
  };
  updateSeatSummary();
}
function updateSeatSummary(){
  const bk=getBk(); const f=bk.outbound;
  const base = f.price*bk.pax;
  const prem = (bk.seats||[]).filter(s=>+s.match(/\d+/)[0]<=2).length * 2500;
  const tax = Math.round(base*0.16);
  const tot = base+prem+tax;
  bk.totals={base,prem,tax,tot}; setBk(bk);
  $('#sumSeats').textContent = (bk.seats||[]).join(', ')||'—';
  $('#sumBase').textContent=fmt(base);$('#sumPrem').textContent=fmt(prem);
  $('#sumTax').textContent=fmt(tax);$('#sumTot').textContent=fmt(tot);
}

async function initPassengers(){
  await loadData();
  const bk=getBk(); if(!bk.outbound){location.href='index.html';return}
  const f=bk.outbound;
  let forms='';
  for(let i=1;i<=bk.pax;i++){
    forms += `<div class="panel"><h3 style="margin-top:0">Passenger ${i} ${i===1?'(Lead)':''}</h3>
      <div class="form-grid">
        <div class="field"><label>Title</label><select name="title_${i}"><option>Mr</option><option>Mrs</option><option>Ms</option><option>Dr</option></select></div>
        <div class="field"><label>Nationality</label><input name="nat_${i}" required value="Kenyan"></div>
        <div class="field"><label>First Name *</label><input name="first_${i}" required></div>
        <div class="field"><label>Last Name *</label><input name="last_${i}" required></div>
        <div class="field"><label>Date of Birth *</label><input type="date" name="dob_${i}" required></div>
        <div class="field"><label>Passport / ID *</label><input name="pid_${i}" required></div>
        ${i===1?`<div class="field full"><label>Email *</label><input type="email" name="email" required></div>
        <div class="field full"><label>Phone (with country code) *</label><input name="phone" required placeholder="+254..."></div>`:''}
      </div></div>`;
  }
  $('#paxForms').innerHTML = forms;
  $('#paxForm').onsubmit=e=>{
    e.preventDefault();
    const data=Object.fromEntries(new FormData(e.target));
    const bk=getBk();
    bk.passengers=[]; for(let i=1;i<=bk.pax;i++){
      bk.passengers.push({title:data[`title_${i}`],first:data[`first_${i}`],last:data[`last_${i}`],dob:data[`dob_${i}`],nat:data[`nat_${i}`],pid:data[`pid_${i}`],seat:bk.seats[i-1]});
    }
    bk.contact={email:data.email,phone:data.phone};
    setBk(bk); location.href='payment.html';
  };
  $('#flightInfo').innerHTML=`<strong>${ap(f.origin)?.city} → ${ap(f.destination)?.city}</strong> · ${f.flight_no} · ${f.date}`;
  $('#sumTot').textContent = fmt(bk.totals.tot);
}

async function initPayment(){
  await loadData();
  const bk=getBk(); if(!bk.outbound){location.href='index.html';return}
  const f=bk.outbound;
  $('#flightInfo').innerHTML=`<strong>${ap(f.origin)?.city} → ${ap(f.destination)?.city}</strong> · ${f.flight_no} · ${f.date}`;
  $('#sumBase').textContent=fmt(bk.totals.base);$('#sumPrem').textContent=fmt(bk.totals.prem);
  $('#sumTax').textContent=fmt(bk.totals.tax);$('#sumTot').textContent=fmt(bk.totals.tot);
  $('#airtelNum').textContent = '+254 786 781665';
  $('#waNum').textContent = '+254 786 781665';

  $$('.pay-method').forEach(pm=>pm.onclick=()=>{
    $$('.pay-method').forEach(x=>x.classList.remove('active'));
    pm.classList.add('active');
    $$('.pay-panel').forEach(p=>p.style.display='none');
    $('#pay-'+pm.dataset.method).style.display='block';
  });

  $('#payForm').onsubmit=e=>{
    e.preventDefault();
    const method = $('.pay-method.active').dataset.method;
    const data = Object.fromEntries(new FormData(e.target));
    const bk=getBk();
    bk.payment={method,...data};
    if(method==='card'){bk.payment.cardNumber='****'+(data.cardNumber||'').replace(/\s/g,'').slice(-4)}
    bk.ref = 'SL'+Math.random().toString(36).slice(2,8).toUpperCase();
    setBk(bk);
    sendWhatsApp(bk);
    location.href='confirmation.html';
  };
}

function sendWhatsApp(bk){
  const f=bk.outbound, lead=bk.passengers[0];
  let m=`*✈ NEW FLIGHT BOOKING — SAFARILINK*\n\n*Booking Ref:* ${bk.ref}\n\n*Flight*\n`;
  m+=`${ap(f.origin)?.city} (${f.origin}) → ${ap(f.destination)?.city} (${f.destination})\n`;
  m+=`Flight: ${f.flight_no} · ${f.aircraft}\nDate: ${f.date}\nDepart: ${f.depart} · Arrive: ${f.arrive}\nClass: ${f.cls==='J'?'Business':'Economy'}\n`;
  m+=`\n*Passengers (${bk.pax})*\n`;
  bk.passengers.forEach((p,i)=>{m+=`${i+1}. ${p.title} ${p.first} ${p.last} · Seat ${p.seat} · ${p.nat} · ID/Passport: ${p.pid}\n`});
  m+=`\n*Contact*\nEmail: ${bk.contact.email}\nPhone: ${bk.contact.phone}\n`;
  m+=`\n*Payment*\nMethod: ${bk.payment.method.toUpperCase()}\n`;
  if(bk.payment.method==='airtel') m+=`Airtel Money Number: ${bk.payment.airtelPhone}\nTransaction Code: ${bk.payment.txnCode||'PENDING'}\n`;
  if(bk.payment.method==='card') m+=`Cardholder: ${bk.payment.cardName}\nCard: ${bk.payment.cardNumber}\nExpiry: ${bk.payment.cardExpiry}\n`;
  m+=`\n*Totals*\nBase Fare: ${fmt(bk.totals.base)}\nPremium Seat: ${fmt(bk.totals.prem)}\nTaxes & Fees: ${fmt(bk.totals.tax)}\n*TOTAL: ${fmt(bk.totals.tot)}*\n`;
  m+=`\nKindly confirm my booking. Thank you!`;
  const url = `https://wa.me/${WA_NUMBER}?text=`+encodeURIComponent(m);
  window.open(url,'_blank');
}

async function initConfirmation(){
  await loadData();
  const bk=getBk(); if(!bk.ref){location.href='index.html';return}
  const f=bk.outbound, lead=bk.passengers[0];
  $('#confBox').innerHTML = `
    <div class="success"><h2 style="margin:0 0 6px">✅ Booking Received</h2>
      <p style="margin:0">Your booking <strong>${bk.ref}</strong> has been received. A WhatsApp confirmation has been sent to our team at <strong>+254 786 781665</strong> for processing.</p></div>
    <div class="panel" style="margin-top:20px"><h3>Itinerary</h3>
      <p><strong>${ap(f.origin)?.city} (${f.origin}) → ${ap(f.destination)?.city} (${f.destination})</strong></p>
      <p>${f.flight_no} · ${f.aircraft} · ${f.date}<br>Depart ${f.depart} · Arrive ${f.arrive}</p>
      <h4>Passengers</h4>${bk.passengers.map(p=>`<p>• ${p.title} ${p.first} ${p.last} — Seat <strong>${p.seat}</strong></p>`).join('')}
      <h4>Payment</h4><p>Method: ${bk.payment.method.toUpperCase()} · Total: <strong>${fmt(bk.totals.tot)}</strong></p>
    </div>
    <div style="text-align:center;margin-top:20px">
      <button class="btn btn-wa" onclick='sendWhatsApp(${JSON.stringify(bk).replace(/'/g,"&#39;")})'>📱 Resend WhatsApp Confirmation</button>
      <a class="btn btn-outline" href="index.html" style="margin-left:10px">Book Another Flight</a>
    </div>`;
}

document.addEventListener('DOMContentLoaded',()=>{
  const p=document.body.dataset.page;
  if(p==='home')initHome();
  else if(p==='results')initResults();
  else if(p==='seats')initSeats();
  else if(p==='passengers')initPassengers();
  else if(p==='payment')initPayment();
  else if(p==='confirmation')initConfirmation();
});
window.sendWhatsApp=sendWhatsApp;
