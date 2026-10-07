# API uç noktası envanteri

Kaynak: server/src/index.js ve server/src/routes/admin.js, 1 Ekim 2026 statik taraması. api/index.js ana Express uygulamasını dışa aktarır. adminRoutes, server/src/index.js:166 satırında /api/admin altında bağlanır; diğer server/src/routes/* dosyaları bu girişte bağlı görünmüyor.

Sayım: 151 kayıt (16 admin router, 135 ana dosya). JWT sütunu ana dosyada route imzasındaki authenticateToken varlığını gösterir. Admin router için router.use(authenticateToken) ve router.use(ADMIN rol denetimi) uygulanır; diğer satırlarda rol/nesne yetkisini kanıtlamaz. Tekrarlanan aynı method/path kayıtlarında önce bağlanan handler öne geçebilir.

| Method | Yol | JWT middleware | Kaynak | Satır |
|---|---|---|---|---:|
| GET | /api/admin/members | Evet (router; ADMIN) | server/src/routes/admin.js | 20 |
| POST | /api/admin/invite | Evet (router; ADMIN) | server/src/routes/admin.js | 51 |
| POST | /api/admin/move-member | Evet (router; ADMIN) | server/src/routes/admin.js | 71 |
| GET | /api/admin/email-config | Evet (router; ADMIN) | server/src/routes/admin.js | 104 |
| POST | /api/admin/email-config | Evet (router; ADMIN) | server/src/routes/admin.js | 111 |
| POST | /api/admin/email-config/test | Evet (router; ADMIN) | server/src/routes/admin.js | 136 |
| PUT | /api/admin/email-config/:id/activate | Evet (router; ADMIN) | server/src/routes/admin.js | 147 |
| DELETE | /api/admin/email-config/:id | Evet (router; ADMIN) | server/src/routes/admin.js | 163 |
| GET | /api/admin/stats/dashboard | Evet (router; ADMIN) | server/src/routes/admin.js | 171 |
| GET | /api/admin/stats/charts | Evet (router; ADMIN) | server/src/routes/admin.js | 210 |
| GET | /api/admin/stats/groups | Evet (router; ADMIN) | server/src/routes/admin.js | 244 |
| GET | /api/admin/stats/geo | Evet (router; ADMIN) | server/src/routes/admin.js | 268 |
| DELETE | /api/admin/public-visitors/:id | Evet (router; ADMIN) | server/src/routes/admin.js | 286 |
| POST | /api/admin/trigger-champions | Evet (router; ADMIN) | server/src/routes/admin.js | 294 |
| POST | /api/admin/shuffle/save | Evet (router; ADMIN) | server/src/routes/admin.js | 302 |
| POST | /api/admin/memberships/extend | Evet (router; ADMIN) | server/src/routes/admin.js | 348 |
| GET | /api/health-check | Hayır | server/src/index.js | 76 |
| GET | /api/notifications | Evet | server/src/index.js | 413 |
| PUT | /api/notifications/:id/read | Evet | server/src/index.js | 423 |
| GET | /api/reports/traffic-lights | Evet | server/src/index.js | 431 |
| GET | /api/reports/attendance-stats | Evet | server/src/index.js | 448 |
| GET | /api/reports/stats | Evet | server/src/index.js | 468 |
| GET | /api/reports/charts | Evet | server/src/index.js | 503 |
| POST | /api/auth/register | Hayır | server/src/index.js | 541 |
| GET | /api/public/members/search | Hayır | server/src/index.js | 608 |
| GET | /api/public/members/:id | Hayır | server/src/index.js | 627 |
| POST | /api/auth/create-password | Hayır | server/src/index.js | 642 |
| PUT | /api/users/me | Evet | server/src/index.js | 668 |
| PUT | /api/users/:id | Evet | server/src/index.js | 716 |
| GET | /api/professions | Hayır | server/src/index.js | 847 |
| POST | /api/professions | Hayır | server/src/index.js | 862 |
| PUT | /api/professions/:id | Hayır | server/src/index.js | 873 |
| DELETE | /api/professions/:id | Hayır | server/src/index.js | 884 |
| POST | /api/auth/login | Hayır | server/src/index.js | 891 |
| GET | /api/users/me | Evet | server/src/index.js | 934 |
| GET | /api/users/:id | Hayır | server/src/index.js | 943 |
| GET | /api/one-to-ones | Evet | server/src/index.js | 1014 |
| POST | /api/one-to-ones | Evet | server/src/index.js | 1035 |
| PUT | /api/one-to-ones/:id/status | Evet | server/src/index.js | 1049 |
| GET | /api/visitors | Evet | server/src/index.js | 1070 |
| POST | /api/visitors/:id/convert | Evet | server/src/index.js | 1078 |
| POST | /api/visitors | Evet | server/src/index.js | 1114 |
| GET | /api/education | Evet | server/src/index.js | 1130 |
| POST | /api/education | Evet | server/src/index.js | 1137 |
| GET | /api/calendar | Evet | server/src/index.js | 1153 |
| GET | /api/attendance | Evet | server/src/index.js | 1223 |
| GET | /api/users/:id/attendance | Evet | server/src/index.js | 1235 |
| POST | /api/events/attendance | Evet | server/src/index.js | 1247 |
| POST | /api/events/:id/register | Evet | server/src/index.js | 1291 |
| GET | /api/referrals | Evet | server/src/index.js | 1430 |
| POST | /api/referrals | Evet | server/src/index.js | 1443 |
| PUT | /api/referrals/:id | Evet | server/src/index.js | 1458 |
| GET | /api/health | Hayır | server/src/index.js | 1519 |
| GET | /api/users/:id/education | Evet | server/src/index.js | 1533 |
| GET | /api/user/visitors | Evet | server/src/index.js | 1541 |
| GET | /api/events/:id/attendance | Evet | server/src/index.js | 1549 |
| DELETE | /api/admin/events/:eventId/attendance/:userId | Evet | server/src/index.js | 1562 |
| GET | /api/user/friends/requests | Evet | server/src/index.js | 1581 |
| POST | /api/user/friends/request | Evet | server/src/index.js | 1610 |
| POST | /api/user/friends/request/:id/accept | Evet | server/src/index.js | 1622 |
| POST | /api/user/friends/request/:id/reject | Evet | server/src/index.js | 1633 |
| GET | /api/users | Evet | server/src/index.js | 1643 |
| GET | /api/users/by-email | Hayır | server/src/index.js | 1675 |
| GET | /api/user/friends | Evet | server/src/index.js | 1683 |
| GET | /api/user/groups | Evet | server/src/index.js | 1705 |
| GET | /api/user/power-teams | Evet | server/src/index.js | 1726 |
| GET | /api/groups | Evet | server/src/index.js | 1745 |
| GET | /api/groups/:id | Evet | server/src/index.js | 1764 |
| GET | /api/groups/:id/members | Evet | server/src/index.js | 1782 |
| GET | /api/groups/:id/referrals | Evet | server/src/index.js | 1800 |
| GET | /api/groups/:id/events | Evet | server/src/index.js | 1818 |
| GET | /api/events | Hayır | server/src/index.js | 1833 |
| GET | /api/events/:id | Hayır | server/src/index.js | 1907 |
| POST | /api/events | Evet | server/src/index.js | 1949 |
| PUT | /api/events/:id | Evet | server/src/index.js | 1962 |
| DELETE | /api/events/:id | Evet | server/src/index.js | 2002 |
| POST | /api/admin/run-migrations | Evet | server/src/index.js | 2010 |
| GET | /api/admin/members | Evet | server/src/index.js | 2023 |
| DELETE | /api/admin/members/:id | Evet | server/src/index.js | 2057 |
| POST | /api/payment/pay | Hayır | server/src/index.js | 2178 |
| POST | /api/payment/sipay-callback/success | Hayır | server/src/index.js | 2339 |
| POST | /api/payment/sipay-callback/fail | Hayır | server/src/index.js | 2585 |
| GET | /api/payment/sipay-callback/success | Hayır | server/src/index.js | 2617 |
| GET | /api/payment/sipay-callback/fail | Hayır | server/src/index.js | 2633 |
| POST | /api/visitor-invite | Evet | server/src/index.js | 2652 |
| GET | /api/visitor-invite/verify | Hayır | server/src/index.js | 2705 |
| POST | /api/visitors/apply | Hayır | server/src/index.js | 2734 |
| GET | /api/admin/public-visitors | Evet | server/src/index.js | 2815 |
| PUT | /api/admin/public-visitors/:id/status | Evet | server/src/index.js | 2829 |
| GET | /api/notifications | Evet | server/src/index.js | 2957 |
| PUT | /api/notifications/:id/read | Evet | server/src/index.js | 2967 |
| PUT | /api/notifications/read-all | Evet | server/src/index.js | 2977 |
| GET | /api/courses | Evet | server/src/index.js | 2985 |
| GET | /api/courses/:id | Evet | server/src/index.js | 2999 |
| GET | /api/lms/exams | Evet | server/src/index.js | 3013 |
| GET | /api/admin/email-config | Evet | server/src/index.js | 3022 |
| POST | /api/admin/email-config | Evet | server/src/index.js | 3030 |
| POST | /api/admin/email-config/test | Evet | server/src/index.js | 3056 |
| PUT | /api/admin/email-config/:id/activate | Evet | server/src/index.js | 3068 |
| GET | /api/admin/system-settings | Evet | server/src/index.js | 3086 |
| POST | /api/admin/system-settings | Evet | server/src/index.js | 3095 |
| POST | /api/admin/visitors/:id/send-membership-invite | Evet | server/src/index.js | 3108 |
| DELETE | /api/admin/visitors/:id | Evet | server/src/index.js | 3141 |
| DELETE | /api/admin/email-config/:id | Evet | server/src/index.js | 3163 |
| POST | /api/groups | Evet | server/src/index.js | 3174 |
| PUT | /api/groups/:id | Evet | server/src/index.js | 3188 |
| DELETE | /api/groups/:id | Evet | server/src/index.js | 3202 |
| GET | /api/groups/:id/activities | Evet | server/src/index.js | 3213 |
| GET | /api/power-teams | Evet | server/src/index.js | 3230 |
| POST | /api/power-teams | Evet | server/src/index.js | 3237 |
| PUT | /api/power-teams/:id | Evet | server/src/index.js | 3249 |
| DELETE | /api/power-teams/:id | Evet | server/src/index.js | 3263 |
| GET | /api/power-teams/:id/members | Evet | server/src/index.js | 3271 |
| GET | /api/power-teams/:id/referrals | Evet | server/src/index.js | 3285 |
| GET | /api/power-teams/:id/synergy | Evet | server/src/index.js | 3300 |
| GET | /api/groups/:id/visitors | Evet | server/src/index.js | 3312 |
| GET | /api/events/:id/attendance | Evet | server/src/index.js | 3326 |
| POST | /api/groups/:id/join | Evet | server/src/index.js | 3340 |
| GET | /api/user/group-requests | Evet | server/src/index.js | 3364 |
| PUT | /api/groups/:id/members/:userId | Evet | server/src/index.js | 3376 |
| POST | /api/power-teams/:id/join | Evet | server/src/index.js | 3388 |
| GET | /api/user/power-team-requests | Evet | server/src/index.js | 3412 |
| PUT | /api/power-teams/:id/members/:userId | Evet | server/src/index.js | 3424 |
| DELETE | /api/groups/:id/members/:userId | Evet | server/src/index.js | 3436 |
| DELETE | /api/power-teams/:id/members/:userId | Evet | server/src/index.js | 3458 |
| GET | /api/user/groups | Evet | server/src/index.js | 3469 |
| POST | /api/shuffle/save | Evet | server/src/index.js | 3486 |
| POST | /api/admin/move-member | Evet | server/src/index.js | 3538 |
| DELETE | /api/admin/members/:id | Evet | server/src/index.js | 3572 |
| GET | /api/champions | Evet | server/src/index.js | 3727 |
| POST | /api/admin/trigger-champions | Evet | server/src/index.js | 3741 |
| POST | /api/admin/assign-role | Evet | server/src/index.js | 3765 |
| GET | /api/memberships | Evet | server/src/index.js | 3853 |
| POST | /api/memberships | Evet | server/src/index.js | 3888 |
| PUT | /api/memberships/:id | Evet | server/src/index.js | 3934 |
| POST | /api/memberships/extend | Evet | server/src/index.js | 3978 |
| POST | /api/memberships/:id/remind | Evet | server/src/index.js | 4021 |
| GET | /api/admin/accounting/payments | Evet | server/src/index.js | 4058 |
| DELETE | /api/admin/accounting/payments/:type/:id | Evet | server/src/index.js | 4126 |
| POST | /api/admin/accounting/:type/:id/upload-invoice | Evet | server/src/index.js | 4155 |
| GET | /api/lms/courses | Evet | server/src/index.js | 4210 |
| GET | /api/admin/stats/dashboard | Evet | server/src/index.js | 4217 |
| GET | /api/admin/stats/charts | Evet | server/src/index.js | 4261 |
| GET | /api/admin/stats/groups | Evet | server/src/index.js | 4300 |
| GET | /api/groups/:id/substitutes | Evet | server/src/index.js | 4326 |
| GET | /api/admin/stats/geo | Evet | server/src/index.js | 4346 |
| GET | /api/tickets | Evet | server/src/index.js | 4450 |
| POST | /api/tickets | Evet | server/src/index.js | 4474 |
| GET | /api/tickets/:id | Evet | server/src/index.js | 4504 |
| POST | /api/tickets/:id/messages | Evet | server/src/index.js | 4538 |
| PUT | /api/tickets/:id/status | Evet | server/src/index.js | 4579 |

## Tekrarlanan method/path tanımları

Bu liste yalnız statik tarama sonucudur; Express sıra ve alt yol davranışı uç nokta bazında ayrıca doğrulanacak.

- DELETE, /api/admin/email-config/:id: 2 kayıt
- DELETE, /api/admin/members/:id: 2 kayıt
- GET, /api/admin/email-config: 2 kayıt
- GET, /api/admin/members: 2 kayıt
- GET, /api/admin/stats/charts: 2 kayıt
- GET, /api/admin/stats/dashboard: 2 kayıt
- GET, /api/admin/stats/geo: 2 kayıt
- GET, /api/admin/stats/groups: 2 kayıt
- GET, /api/events/:id/attendance: 2 kayıt
- GET, /api/notifications: 2 kayıt
- GET, /api/user/groups: 2 kayıt
- POST, /api/admin/email-config: 2 kayıt
- POST, /api/admin/email-config/test: 2 kayıt
- POST, /api/admin/move-member: 2 kayıt
- POST, /api/admin/trigger-champions: 2 kayıt
- PUT, /api/admin/email-config/:id/activate: 2 kayıt
- PUT, /api/notifications/:id/read: 2 kayıt

