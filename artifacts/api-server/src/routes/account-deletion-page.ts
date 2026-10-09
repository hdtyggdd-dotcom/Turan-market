export const accountDeletionPage = String.raw`<!doctype html>
<html lang="uz"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<title>Cosmis — akkauntni o‘chirish</title>
<meta name="description" content="Cosmis akkaunti va shaxsiy ma’lumotlarini o‘chirish uchun parol bilan tasdiqlanadigan rasmiy sahifa.">
<style>
body{margin:0;padding:28px 16px;background:#f6f8f7;color:#17221d;font:16px/1.65 system-ui,sans-serif}
main{max-width:650px;margin:auto;background:white;padding:28px;border-radius:18px}
h1{line-height:1.25;color:#087f5b}label{display:block;margin-top:18px;font-weight:600}
input[type=tel],input[type=password]{box-sizing:border-box;width:100%;padding:13px;border:1px solid #bdcac3;border-radius:9px;font:inherit}
button{background:#ba2635;color:white;border:0;border-radius:9px;padding:14px 20px;font:inherit;font-weight:700;width:100%;margin-top:22px;cursor:pointer}
button:disabled{opacity:.5;cursor:default}a{color:#087f5b;overflow-wrap:anywhere}
.notice{padding:16px;background:#fff1ed;border-radius:10px}.message{padding:14px;background:#edf5ef;border-radius:9px;white-space:pre-wrap}
[hidden]{display:none!important}.check{font-weight:400;display:flex;gap:10px;align-items:flex-start}.check input{margin-top:8px}
</style></head><body><main>
<h1>Cosmis akkauntini o‘chirish</h1>
<p>Ilovani qayta o‘rnatmasdan shu sahifa orqali o‘z akkauntingizni yopishingiz mumkin.</p>
<div class="notice"><strong>Bu amal qaytarilmaydi.</strong>
<ul><li>Ism, telefon, profil hududi, e’lon suratlari, savatcha va shaxsiy hujjatlar olib tashlanadi.</li>
<li>Eski kirish sessiyalari va hisobga bog‘langan bildirishnomalar bekor bo‘ladi.</li>
<li>Boshqa foydalanuvchi qatnashgan tugallangan savdo tarixi kontaktsiz saqlanadi. Minimal texnik identifikatorlar akkaunt qayta tiklanib ketmasligi uchun qoladi.</li>
<li>Faol buyurtma yoki tashish bo‘lsa, avval yakunlang yoki bekor qiling. Oxirgi administrator boshqaruvni boshqa administratorga topshirishi kerak.</li>
<li>Shaxsiy fayl saqlash xizmati vaqtincha ishlamasa, o‘chirish navbati avtomatik qayta urinadi va natijada bu holat ko‘rsatiladi.</li></ul></div>
<form id="deletion-form">
<label for="phone">Akkaunt telefon raqami</label><input id="phone" type="tel" autocomplete="tel" required minlength="3" maxlength="32" placeholder="+998...">
<label for="password">Amaldagi parol</label><input id="password" type="password" autocomplete="current-password" required maxlength="256">
<label class="check"><input id="confirm" type="checkbox" required><span>Akkauntim va shaxsiy ma’lumotlarimni o‘chirishni tushundim va tasdiqlayman.</span></label>
<button id="submit" type="submit">Akkauntimni butunlay o‘chirish</button>
</form>
<p id="result" class="message" role="status" aria-live="polite" hidden></p>
<p>Parolni unutdingizmi yoki faol buyurtmani yopishda yordam kerakmi? <a href="mailto:fazliddin.16.09.2004@gmail.com">fazliddin.16.09.2004@gmail.com</a> manziliga murojaat qiling. Emailingizga parol yoki hujjat suratini yubormang. O‘chirishdan oldin akkaunt egasi ekaningiz tekshirilishi kerak.</p>
<a href="./privacy-policy">Maxfiylik siyosati</a>
<script>
const form=document.getElementById('deletion-form'),phone=document.getElementById('phone'),password=document.getElementById('password'),button=document.getElementById('submit'),result=document.getElementById('result');
let busy=false,operation=crypto.randomUUID(),target=null;
try{const saved=JSON.parse(sessionStorage.getItem('turan-deletion-attempt')||'null');if(saved&&saved.requestId&&saved.phone){operation=saved.requestId;target=saved.phone;phone.value=target;}}catch{}
form.addEventListener('submit',async event=>{
 event.preventDefault();if(busy||!form.reportValidity())return;
 const number=phone.value.trim();if(target&&target!==number)operation=crypto.randomUUID();target=number;
 try{sessionStorage.setItem('turan-deletion-attempt',JSON.stringify({requestId:operation,phone:number}));}catch{}
 busy=true;button.disabled=true;phone.disabled=true;password.disabled=true;result.hidden=false;result.textContent='O‘chirish amalga oshirilmoqda. Sahifani kuting.';
 try{
 const response=await fetch(location.pathname,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({phone:number,password:password.value,confirmation:true,requestId:operation})});
 const data=await response.json();
 if(!response.ok){if([400,401,409,429].includes(response.status)){operation=crypto.randomUUID();try{sessionStorage.removeItem('turan-deletion-attempt');}catch{}}throw new Error(data.message||'So‘rov bajarilmadi.');}
 if(data.status!=='deleted')throw new Error('Natija tasdiqlanmadi. Xuddi shu so‘rovni qayta yuboring.');
 password.value='';phone.value='';try{sessionStorage.removeItem('turan-deletion-attempt');}catch{}
 form.hidden=true;result.textContent='Akkauntingiz yopildi. Eski parol va sessiyalar bilan kirib bo‘lmaydi.'+(data.filesPending?' Shaxsiy hujjat fayllarini o‘chirish navbatda; tizim qayta urinishni davom ettiradi.':'');
 }catch(error){result.textContent=(error instanceof Error?error.message:'Tarmoq xatosi.')+' Agar javob olinmagan bo‘lsa, shu so‘rovni qayta yuboring.';}
 finally{busy=false;button.disabled=false;phone.disabled=false;password.disabled=false;}
});
</script></main></body></html>`;
