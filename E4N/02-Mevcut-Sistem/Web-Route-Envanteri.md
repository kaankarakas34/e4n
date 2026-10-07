# Web route envanteri

Kaynak: src/App.tsx, üst repo commit 7ead1690ab1b7344fe2ea98d6217700e3f39e0ab ve mevcut çalışma ağacı. 1 Ekim 2026 statik sayımı: 77 path. Korumalı kapsam giriş/PENDING kontrolü anlamına gelir; admin rol yetkisi ayrıca denetlenir.

| Kapsam | Route | Bileşen / yönlendirme | Kaynak satır |
|---|---|---|---:|
| Genel | /auth/login | Login | 139 |
| Genel | /auth/register | Register | 143 |
| Genel | /auth/register-community | Register | 147 |
| Genel | /auth/forgot-password | ForgotPassword | 151 |
| Genel | /create-password | CreatePassword | 154 |
| Genel | /auth/pending | PendingApproval | 155 |
| Genel | /ziyaretci-ol | Navigate | 158 |
| Genel | /public-events | Navigate | 159 |
| Genel | /is-agi-rehberi | Navigate | 160 |
| Genel | /is-agi-rehberi/:slug | Navigate | 161 |
| Genel | / | LandingPage | 165 |
| Genel | /e4n-nedir | E4NNedir | 166 |
| Genel | /egitim | Egitim | 167 |
| Genel | /egitim-basvuru | EgitimBasvuru | 168 |
| Genel | /nasil-calisir | NasilCalisir | 169 |
| Genel | /uyelik | Uyelik | 170 |
| Genel | /etkinlikler | PublicEventsPage | 171 |
| Genel | /event/:id | EventDetail | 172 |
| Genel | /blog | BlogListPage | 173 |
| Genel | /blog/:slug | BlogPostPage | 174 |
| Genel | /hakkimizda | Hakkimizda | 175 |
| Genel | /sikca-sorulan-sorular | SSS | 176 |
| Genel | /degerlendirme-basvurusu | DegerlendirmeBasvurusu | 177 |
| Genel | /topluluklarimiz | Topluluklarimiz | 178 |
| Genel | /ziyaretci | VisitorPaymentPage | 179 |
| Genel | /iletisim | ContactPage | 180 |
| Genel | /kvkk | KVKK | 181 |
| Genel | /gizlilik-politikasi | PrivacyPolicy | 182 |
| Genel | /mesafeli-satis-sozlesmesi | DistanceSellingContract | 183 |
| Genel | /iptal-ve-iade-kosullari | CancellationRefundPolicy | 184 |
| Genel | /on-bilgilendirme-formu | PreInformationForm | 185 |
| Genel | /kullanim-kosullari | TermsOfUse | 186 |
| Genel | /cerez-politikasi | CookiePolicy | 187 |
| Korumalı | /dashboard | AdminDashboard / Dashboard | 194 |
| Korumalı | /group-management | GroupManagerDashboard | 197 |
| Korumalı | /chapter-management | ChapterManagement | 198 |
| Korumalı | /referrals | Referrals | 199 |
| Korumalı | /meetings | MeetingRequests | 200 |
| Korumalı | /activities | Activities | 201 |
| Korumalı | /messages | MessagesPage | 202 |
| Korumalı | /revenue-entry | RevenueEntry | 203 |
| Korumalı | /reports | Reports | 204 |
| Korumalı | /education | Education | 205 |
| Korumalı | /profile/:id | PublicProfile | 206 |
| Korumalı | /lms | ComingSoon | 209 |
| Korumalı | /lms/course/:id | ComingSoon | 210 |
| Korumalı | /profile | Profile | 212 |
| Korumalı | /membership | MembershipPage | 213 |
| Korumalı | /events | UserEvents | 214 |
| Korumalı | /admin/events | AdminEvents | 215 |
| Korumalı | /admin/visitors | AdminVisitors | 216 |
| Korumalı | /admin/crm | AdminCRM | 217 |
| Korumalı | /admin | AdminDashboard | 218 |
| Korumalı | /admin/blogs | AdminBlogs | 219 |
| Korumalı | /admin/blogs/:id | AdminBlogEditor | 220 |
| Korumalı | /admin/members | AdminMembers | 221 |
| Korumalı | /admin/members/new | CreateMember | 222 |
| Korumalı | /admin/members/:id | MemberProfile | 223 |
| Korumalı | /admin/subscriptions | AdminSubscriptions | 224 |
| Korumalı | /admin/accounting | AdminAccounting | 225 |
| Korumalı | /admin/shuffle | AdminShuffle | 226 |
| Korumalı | /admin/groups | AdminGroups | 227 |
| Korumalı | /admin/groups/:id | AdminGroupDetail | 228 |
| Korumalı | /admin/power-teams/:id | AdminGroupDetail | 229 |
| Korumalı | /groups/:id | GroupDetail | 230 |
| Korumalı | /power-teams/:id | GroupDetail | 231 |
| Korumalı | /admin/exams | AdminExams | 232 |
| Korumalı | /admin/lms | AdminLMS | 233 |
| Korumalı | /admin/lms/course/:id | AdminCourseEditor | 234 |
| Korumalı | /admin/reports | AdminReports | 235 |
| Korumalı | /admin/email-settings | AdminEmailSettings | 236 |
| Korumalı | /meeting-timer | MeetingTimer | 237 |
| Korumalı | /documents | DocumentsPage | 238 |
| Korumalı | /support | SupportTickets | 239 |
| Korumalı | /admin/support | AdminSupportTickets | 240 |
| Korumalı | /admin/professions | AdminProfessions | 241 |
| Korumalı | * | NotFound | 245 |

Navigate satırları eski URL yönlendirmeleridir. /lms ve /lms/course/:id ComingSoon bileşenine bağlıdır. Bu tablo route tanımını gösterir; çalışma zamanı sonucu ayrıca doğrulanacaktır.
