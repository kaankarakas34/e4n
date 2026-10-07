# P13 — Şirket uygunluğu baz çizgisi

**2 Ekim 2026.** Etkin API ve atılabilir PostgreSQL 17.11 ile doğrulandı; `npm run test:isolated` geçti. Canlı Supabase'de yazma yapılmadı.

| İşlem | Sonuç | Veri |
|---|---|---|
| `POST /api/auth/register`, `role=COMMUNITY_MEMBER`, şirket alanı yok | 201 | 1 `ACTIVE` hesap; `company=''`. |
| `POST /api/groups/:id/join`, şirketi olmayan `ACTIVE` hesap | 200 | `REQUESTED` oluştu. |
| `POST /api/power-teams/:id/join`, aynı hesap | 200 | `REQUESTED` oluştu. |

Kayıt handler'ı `company || ''` yazar. İki başvuru kapısı yalnız `account_status` kontrol eder; şirket/ülke/kanıt okumaz. Bu davranış hedef R06'daki şirket şartını uygulamıyor. Canlı baz çizgisinde 5 hesabın şirket alanı boş; bunların tüzel kişilik durumunu otomatik tahmin etmiyoruz. `MEMBER` kayıt yolunda davetiye kontrolü ayrı ve boş token 403 olarak doğrulandı.

D10, şirket şartının hangi kapıda geçerli olduğunu, kabul edilecek ülke bağımsız kanıtı, mevcut boş şirket hesaplarının geçişini ve ret nedenini belirlemeli. Karar olmadan kayıt veya başvuru engeli eklenmedi. Test, [[P09-Kayit-Izin-Kolonlari-Provasi|0006 izin kolonu migration'ı]] sonrasında çalıştı.
