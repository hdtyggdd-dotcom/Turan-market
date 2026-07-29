#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
AI Maslahat Moduli
- E'lon joylashtirilgandan keyin avtomatik tahlil
- Narx tahlili (arzon/qimmat/raqobatbardosh)
- Sotuv tahlili (qaysi mahsulot ko'p sotiladi)
- Raqobatchilar tahlili
- Amaliy tavsiyalar
"""

import logging
import httpx
from database import barcha_elonlar, db_statistika_kategoriya

# ══════════════════════════════════════════════════════════
#  SOZLAMALAR
# ══════════════════════════════════════════════════════════
CLAUDE_API_URL = "https://api.anthropic.com/v1/messages"
CLAUDE_MODEL   = "claude-sonnet-4-20250514"

# ══════════════════════════════════════════════════════════
#  BOZOR TAHLILI (ma'lumotlar bazasidan)
# ══════════════════════════════════════════════════════════

def bozor_tahlili(subkategoriya: str, viloyat: str, narx: int) -> dict:
    """
    Bir xil kategoriya va viloyatdagi e'lonlarni tahlil qilish
    """
    elonlar = barcha_elonlar(limit=200)

    bir_xil = [
        e for e in elonlar
        if e.get("subkategoriya") == subkategoriya
        and e.get("aniq_narx", 0) > 0
    ]

    yaqin = [
        e for e in bir_xil
        if e.get("viloyat") == viloyat
    ]

    if not bir_xil:
        return {
            "jami_elon":       0,
            "yaqin_elon":      0,
            "orta_narx":       0,
            "min_narx":        0,
            "max_narx":        0,
            "narx_pozitsiya":  "ma'lumot yo'q",
            "raqobatchilar":   0,
            "top_kategoriyalar": [],
        }

    narxlar       = [e["aniq_narx"] for e in bir_xil]
    orta_narx     = sum(narxlar) // len(narxlar)
    min_narx      = min(narxlar)
    max_narx      = max(narxlar)
    raqobatchilar = len(bir_xil)

    if narx <= 0:
        pozitsiya = "kelishiladi"
    elif narx < orta_narx * 0.8:
        pozitsiya = "juda_arzon"
    elif narx < orta_narx * 0.95:
        pozitsiya = "arzon"
    elif narx <= orta_narx * 1.05:
        pozitsiya = "orta"
    elif narx <= orta_narx * 1.2:
        pozitsiya = "qimmatroq"
    else:
        pozitsiya = "juda_qimmat"

    kat_stat = db_statistika_kategoriya()

    return {
        "jami_elon":         raqobatchilar,
        "yaqin_elon":        len(yaqin),
        "orta_narx":         orta_narx,
        "min_narx":          min_narx,
        "max_narx":          max_narx,
        "narx_pozitsiya":    pozitsiya,
        "raqobatchilar":     raqobatchilar,
        "top_kategoriyalar": kat_stat[:5],
    }


# ══════════════════════════════════════════════════════════
#  CLAUDE API GA ASINXRON SO'ROV
# ══════════════════════════════════════════════════════════

async def ai_maslahat_olish(elon: dict, tahlil: dict, api_key: str) -> str | None:
    """
    Claude API dan asinxron maslahat olish (httpx)
    """
    sotuvchi = "Ishlab chiqaruvchi" if elon.get("sotuvchi_turi") == "ishlab" else "Sotuvchi"
    narx     = elon.get("aniq_narx", 0)
    narx_str = f"{narx:,} so'm" if narx > 0 else "Kelishiladi"

    top_kat = ""
    for i, (kat, soni) in enumerate(tahlil.get("top_kategoriyalar", []), 1):
        top_kat += f"{i}. {kat} — {soni} ta e'lon\n"

    prompt = f"""Sen O'zbekiston savdo bozori bo'yicha tajribali moliyaviy maslahatchi va bozor tahlilchisisans. 
O'zbek tilida qisqa, amaliy va foydali maslahat ber.

═══ E'LON MA'LUMOTLARI ═══
Kategoriya: {elon.get('kategoriya')}
Mahsulot/Xizmat turi: {elon.get('subkategoriya')}
Sotuvchi turi: {sotuvchi}
Joylashuv: {elon.get('viloyat')}, {elon.get('tuman')}
Narx: {narx_str}
Tavsif: {elon.get('tavsif', '')}

═══ BOZOR TAHLILI ═══
Shu kategoriyada jami e'lonlar: {tahlil['jami_elon']} ta
Shu viloyatda raqobatchilar: {tahlil['yaqin_elon']} ta
Bozordagi o'rtacha narx: {tahlil['orta_narx']:,} so'm
Eng arzon narx: {tahlil['min_narx']:,} so'm
Eng qimmat narx: {tahlil['max_narx']:,} so'm
Narx pozitsiyasi: {tahlil['narx_pozitsiya']}

═══ ENG KO'P E'LON BERILGAN KATEGORIYALAR ═══
{top_kat}

═══ MASLAHAT BERISH QO'LLANMASI ═══
Quyidagi bo'limlarda qisqa va aniq maslahat ber:

1. 💰 NARX TAHLILI
- Ushbu narx bozorga nisbatan qanday?
- Narxni oshirish yoki pasaytirish kerakmi?
- Eng optimal narx qancha bo'lishi kerak?

2. 📈 SOTUV IMKONIYATI
- Bu mahsulotga talab qanday?
- Qaysi vaqtda ko'proq sotiladi (mavsum)?
- Sotuvni oshirish uchun nima qilish kerak?

3. 🏆 RAQOBAT TAHLILI
- Raqobat qanchalik kuchli?
- Raqobatchilardan qanday farqlanish mumkin?

4. 💡 AMALIY TAVSIYALAR
- 3 ta eng muhim maslahat
- {sotuvchi} sifatida nima qilish kerak?

Qisqa, aniq va O'zbek tilida yoz. Har bo'lim 2-3 jumladan oshmasin."""

    try:
        headers = {
            "Content-Type":      "application/json",
            "x-api-key":         api_key,
            "anthropic-version": "2023-06-01"
        }
        body = {
            "model":      CLAUDE_MODEL,
            "max_tokens": 1000,
            "messages":   [{"role": "user", "content": prompt}]
        }
        async with httpx.AsyncClient(timeout=30.0) as client:
            resp = await client.post(CLAUDE_API_URL, headers=headers, json=body)
            data = resp.json()

        if "content" in data and data["content"]:
            return data["content"][0]["text"]
        else:
            logging.error(f"Claude API xato: {data}")
            return None

    except Exception as e:
        logging.error(f"Claude API ulanish xatosi: {e}")
        return None


# ══════════════════════════════════════════════════════════
#  ASOSIY FUNKSIYA — Telegram bot uchun
# ══════════════════════════════════════════════════════════

async def elon_maslahat_yuborish(bot, user_id: int, elon: dict, api_key: str):
    """
    E'lon joylashtirilgandan keyin foydalanuvchiga maslahat yuborish
    """
    try:
        msg = await bot.send_message(
            user_id,
            "🤖 *AI tahlil qilinmoqda...*\n\n"
            "📊 Bozor narxlari tekshirilmoqda\n"
            "📈 Sotuv statistikasi tahlil qilinmoqda\n"
            "💡 Maslahatlar tayyorlanmoqda...\n\n"
            "⏳ Bir daqiqa kuting...",
            parse_mode="Markdown"
        )

        tahlil   = bozor_tahlili(
            subkategoriya=elon.get("subkategoriya", ""),
            viloyat=elon.get("viloyat", ""),
            narx=elon.get("aniq_narx", 0)
        )
        maslahat = await ai_maslahat_olish(elon, tahlil, api_key)

        try:
            await bot.delete_message(user_id, msg.message_id)
        except Exception:
            pass

        if maslahat:
            poz       = tahlil["narx_pozitsiya"]
            poz_emoji = {
                "juda_arzon":    "🟢🟢 Juda arzon",
                "arzon":         "🟢 Arzon",
                "orta":          "🟡 O'rtacha",
                "qimmatroq":     "🟠 Qimmatroq",
                "juda_qimmat":   "🔴 Juda qimmat",
                "kelishiladi":   "🤝 Kelishiladi",
                "ma'lumot yo'q": "❓ Ma'lumot yo'q",
            }.get(poz, "❓")

            sarlavha = (
                f"🤖 *AI BOZOR TAHLILI*\n"
                f"{'─' * 30}\n"
                f"📦 *{elon.get('subkategoriya', '')}*\n"
                f"📍 *{elon.get('viloyat', '')}, {elon.get('tuman', '')}*\n"
                f"{'─' * 30}\n\n"
                f"📊 *Bozor ko'rsatkichlari:*\n"
                f"💰 Sizning narxingiz: *{elon.get('aniq_narx', 0):,} so'm*\n"
                f"📉 Bozor o'rtachasi: *{tahlil['orta_narx']:,} so'm*\n"
                f"📌 Narx holati: *{poz_emoji}*\n"
                f"👥 Raqobatchilar: *{tahlil['raqobatchilar']} ta*\n\n"
                f"{'─' * 30}\n\n"
            )

            full_msg = sarlavha + maslahat
            if len(full_msg) > 4000:
                await bot.send_message(user_id, sarlavha, parse_mode="Markdown")
                await bot.send_message(user_id, maslahat)
            else:
                await bot.send_message(user_id, full_msg, parse_mode="Markdown")
        else:
            await _oddiy_maslahat(bot, user_id, elon, tahlil)

    except Exception as e:
        logging.error(f"Maslahat yuborishda xato: {e}")


async def _oddiy_maslahat(bot, user_id: int, elon: dict, tahlil: dict):
    """API ishlamasa oddiy statistika asosida maslahat"""
    narx = elon.get("aniq_narx", 0)
    orta = tahlil["orta_narx"]
    poz  = tahlil["narx_pozitsiya"]

    if poz == "juda_arzon":
        narx_tavsiya = f"✅ Narxingiz juda arzon! {int(orta * 0.9):,} so'mga oshirishingiz mumkin."
    elif poz == "arzon":
        narx_tavsiya = f"✅ Narxingiz yaxshi! Bozor o'rtachasi {orta:,} so'm."
    elif poz == "orta":
        narx_tavsiya = f"✅ Narxingiz bozorga mos. O'rtacha narx: {orta:,} so'm."
    elif poz in ("qimmatroq", "juda_qimmat"):
        narx_tavsiya = f"⚠️ Narxingiz yuqori. Bozor o'rtachasi {orta:,} so'm. Pasaytiring."
    else:
        narx_tavsiya = "Bozor ma'lumotlari yetarli emas."

    msg = (
        f"📊 *Bozor tahlili*\n\n"
        f"📦 {elon.get('subkategoriya', '')}\n\n"
        f"💰 Sizning narxingiz: *{narx:,} so'm*\n"
        f"📉 Bozor o'rtachasi: *{orta:,} so'm*\n"
        f"👥 Raqobatchilar: *{tahlil['raqobatchilar']} ta*\n\n"
        f"💡 *Maslahat:*\n{narx_tavsiya}"
    )
    await bot.send_message(user_id, msg, parse_mode="Markdown")
