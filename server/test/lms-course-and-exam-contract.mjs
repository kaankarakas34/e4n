// LMS Course, Education and Exam Module Contract Test
// Sprint 8 / LMS-SON (E4N-139) Lifecycle Verification
import assert from 'node:assert/strict';
import { readFileSync, existsSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import jwt from 'jsonwebtoken';
import { spawnSync } from 'node:child_process';
import { randomUUID } from 'node:crypto';
import { once } from 'node:events';
import pg from 'pg';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const serverDir = path.resolve(__dirname, '..');
const repoDir = path.resolve(serverDir, '..');

console.log('=== Sprint 8 / LMS-SON (E4N-139): LMS, Course and Exam Lifecycle Contract ===');

// ============================================================================
// 1. Static Contract & Screen Routing Verification
// ============================================================================

const requiredFiles = [
  'src/App.tsx',
  'src/pages/LMS.tsx',
  'src/pages/CourseViewer.tsx',
  'src/pages/AdminLMS.tsx',
  'src/pages/AdminExams.tsx',
  'src/pages/AdminCourseEditor.tsx',
  'src/pages/Education.tsx',
  'src/api/api.ts'
];

for (const f of requiredFiles) {
  const full = path.resolve(repoDir, f);
  assert.ok(existsSync(full), `File must exist: ${f}`);
}

const appCode = readFileSync(path.resolve(repoDir, 'src/App.tsx'), 'utf8');
assert.ok(appCode.includes('<Route path="/lms" element={<LMS />} />'), 'App.tsx must route /lms to LMS component');
assert.ok(appCode.includes('<Route path="/lms/course/:id" element={<CourseViewer />} />'), 'App.tsx must route /lms/course/:id to CourseViewer component');
assert.ok(!appCode.includes('<Route path="/lms" element={<ComingSoon />} />'), 'App.tsx must not route /lms to ComingSoon');

const apiCode = readFileSync(path.resolve(repoDir, 'src/api/api.ts'), 'utf8');
const expectedApiMethods = [
  'lmsCourses', 'lmsCourseDetail', 'lmsCreateCourse', 'lmsUpdateCourse', 'lmsDeleteCourse',
  'lmsEnrollCourse', 'lmsCourseLessons', 'lmsCreateLesson', 'lmsUpdateLesson', 'lmsDeleteLesson',
  'lmsLessonMaterials', 'lmsCreateMaterial', 'lmsDeleteMaterial', 'lmsExams', 'lmsSaveExam',
  'lmsDeleteExam', 'lmsCourseExams', 'lmsExamQuestions', 'lmsSubmitAttempt', 'lmsExamAttempts'
];

for (const m of expectedApiMethods) {
  assert.ok(apiCode.includes(m), `api.ts must define LMS method: ${m}`);
}

console.log('✅ 1. Static frontend routes & api.ts LMS contract verified.');

// ============================================================================
// 2. Isolated PostgreSQL 17 Docker & Express Server Setup
// ============================================================================

const container = `lms-test-db-${Date.now()}`;
const dbUser = 'postgres';
const dbPassword = 'testpassword';
const dbName = 'event4network_lms_test';

let pool;
let appServer;
let containerStarted = false;

const docker = (args, options = {}) => {
  const res = spawnSync('docker', args, {
    encoding: 'utf8',
    stdio: ['ignore', 'pipe', 'pipe'],
    ...options
  });
  if (res.status !== 0) {
    throw new Error(`docker ${args.join(' ')} failed: ${res.stderr || res.stdout}`);
  }
  return res.stdout.trim();
};

const cleanup = async () => {
  if (appServer) {
    await new Promise(r => appServer.close(r)).catch(() => {});
  }
  if (pool) {
    await pool.end().catch(() => {});
  }
  if (containerStarted) {
    try {
      docker(['stop', '--time', '2', container]);
    } catch {}
  }
};

process.on('SIGINT', async () => { await cleanup(); process.exit(1); });
process.on('SIGTERM', async () => { await cleanup(); process.exit(1); });

let port;
try {
  docker([
    'run', '--rm', '-d',
    '--name', container,
    '-e', `POSTGRES_USER=${dbUser}`,
    '-e', `POSTGRES_PASSWORD=${dbPassword}`,
    '-e', `POSTGRES_DB=${dbName}`,
    '-p', '127.0.0.1::5432',
    'postgres:17'
  ]);
  containerStarted = true;

  const portOutput = docker(['port', container, '5432/tcp']);
  port = Number(portOutput.match(/127\.0\.0\.1:(\d+)/)?.[1]);
  assert.ok(port > 0, `Valid dynamic port expected: ${port}`);

  // Wait for PostgreSQL ready
  let pgReady = false;
  for (let i = 0; i < 40; i++) {
    const check = spawnSync('docker', ['exec', container, 'pg_isready', '-U', dbUser, '-d', dbName]);
    if (check.status === 0) {
      pgReady = true;
      break;
    }
    await new Promise(r => setTimeout(r, 400));
  }
  assert.ok(pgReady, 'Isolated PostgreSQL 17 did not become ready');

  // Configure test environment
  delete process.env.DATABASE_URL;
  delete process.env.POSTGRES_URL;
  delete process.env.SUPABASE_DB_URL;
  process.env.DOTENV_CONFIG_PATH = path.join(serverDir, 'test', '.nonexistent-env');
  process.env.DB_HOST = '127.0.0.1';
  process.env.DB_PORT = String(port);
  process.env.DB_USER = dbUser;
  process.env.DB_PASSWORD = dbPassword;
  process.env.DB_NAME = dbName;
  process.env.NODE_ENV = 'test';
  process.env.VERCEL = '1';
  process.env.JWT_SECRET = 'isolated_lms_test_secret_key_12345';

  ({ default: pool } = await import('../src/config/db.js'));

  let dbReady = false;
  for (let attempt = 0; attempt < 30; attempt += 1) {
    try {
      await pool.query('SELECT 1');
      dbReady = true;
      break;
    } catch {
      await new Promise(r => setTimeout(r, 500));
    }
  }
  assert.ok(dbReady, 'PostgreSQL connection could not be established');

  // Apply versioned migrations (Zero DDL guarantee)
  const { applyVersionedSchema } = await import('../src/config/versioned-schema.js');
  const migrationResult = await applyVersionedSchema();
  assert.equal(migrationResult.applied.length, 28, 'Must apply exactly 28 migrations');

  // Verify second run idempotency
  const secondRun = await applyVersionedSchema();
  assert.equal(secondRun.applied.length, 0, 'Second run must apply 0 migrations');

  // Start Express server
  const { default: app } = await import('../src/index.js');
  appServer = app.listen(0, '127.0.0.1');
  await once(appServer, 'listening');
  const serverPort = appServer.address().port;
  const baseUrl = `http://127.0.0.1:${serverPort}`;

  console.log(`✅ 2. PostgreSQL 17 & Express started on port ${serverPort}.`);

  // Create test actors
  const adminId = randomUUID();
  const memberId = randomUUID();

  await pool.query(
    `INSERT INTO users (id, email, name, profession, password_hash, role, account_status)
     VALUES ($1, $2, $3, $4, 'test_hash', 'ADMIN', 'ACTIVE')`,
    [adminId, 'lms-admin@example.com', 'LMS Admin', 'Yönetici']
  );

  await pool.query(
    `INSERT INTO users (id, email, name, profession, password_hash, role, account_status)
     VALUES ($1, $2, $3, $4, 'test_hash', 'MEMBER', 'ACTIVE')`,
    [memberId, 'lms-member@example.com', 'LMS Üye', 'Girişimci']
  );

  const adminToken = jwt.sign({ id: adminId, role: 'ADMIN' }, process.env.JWT_SECRET);
  const memberToken = jwt.sign({ id: memberId, role: 'MEMBER' }, process.env.JWT_SECRET);

  const req = async (endpoint, options = {}, token = memberToken) => {
    const headers = {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...(options.headers || {})
    };
    const res = await fetch(`${baseUrl}${endpoint}`, {
      ...options,
      headers
    });
    const text = await res.text();
    let data;
    try { data = JSON.parse(text); } catch { data = text; }
    return { status: res.status, headers: res.headers, data };
  };

  // ============================================================================
  // Contract 1: Course Lifecycle (Create -> Update -> Read -> Member Visibility)
  // ============================================================================
  console.log('Testing Contract 1: Course Lifecycle...');

  // Member lists courses initially
  const initialCourses = await req('/api/lms/courses', { method: 'GET' }, memberToken);
  assert.equal(initialCourses.status, 200);
  assert.ok(Array.isArray(initialCourses.data));

  // Admin creates course
  const createCourseRes = await req('/api/lms/courses', {
    method: 'POST',
    body: JSON.stringify({
      title: 'E4N Network Temelleri',
      description: 'Yeni Üyeler İçin Temel Akademi Kursu',
      status: 'ACTIVE'
    })
  }, adminToken);
  assert.equal(createCourseRes.status, 201);
  assert.ok(createCourseRes.data.id);
  assert.equal(createCourseRes.data.title, 'E4N Network Temelleri');
  assert.equal(createCourseRes.data.status, 'ACTIVE');
  const courseId = createCourseRes.data.id;

  // Admin updates course
  const updateCourseRes = await req(`/api/lms/courses/${courseId}`, {
    method: 'PUT',
    body: JSON.stringify({
      description: 'Güncellenmiş Kapsamlı Akademi Kursu'
    })
  }, adminToken);
  assert.equal(updateCourseRes.status, 200);
  assert.equal(updateCourseRes.data.description, 'Güncellenmiş Kapsamlı Akademi Kursu');

  // Member reads course list & detail
  const memberCourseList = await req('/api/lms/courses', { method: 'GET' }, memberToken);
  assert.equal(memberCourseList.status, 200);
  const foundCourse = memberCourseList.data.find(c => c.id === courseId);
  assert.ok(foundCourse, 'Created course must appear in member courses list');
  assert.equal(foundCourse.lesson_count, 0);
  assert.equal(foundCourse.is_enrolled, 0);

  const courseDetailRes = await req(`/api/lms/courses/${courseId}`, { method: 'GET' }, memberToken);
  assert.equal(courseDetailRes.status, 200);
  assert.equal(courseDetailRes.data.id, courseId);
  assert.ok(Array.isArray(courseDetailRes.data.lessons));

  console.log('✅ Contract 1: Course Lifecycle PASS.');

  // ============================================================================
  // Contract 2: Lessons & Materials Lifecycle
  // ============================================================================
  console.log('Testing Contract 2: Lessons & Materials Lifecycle...');

  // Admin adds lesson 1
  const lesson1Res = await req(`/api/lms/courses/${courseId}/lessons`, {
    method: 'POST',
    body: JSON.stringify({ title: 'Ders 1: Hoş Geldiniz ve E4N Vizyonu', order_index: 1 })
  }, adminToken);
  assert.equal(lesson1Res.status, 201);
  const lesson1Id = lesson1Res.data.id;

  // Admin adds lesson 2
  const lesson2Res = await req(`/api/lms/courses/${courseId}/lessons`, {
    method: 'POST',
    body: JSON.stringify({ title: 'Ders 2: İş Yönlendirme Stratejileri', order_index: 2 })
  }, adminToken);
  assert.equal(lesson2Res.status, 201);
  const lesson2Id = lesson2Res.data.id;

  // Admin adds video material to lesson 1
  const matVideoRes = await req(`/api/lms/lessons/${lesson1Id}/materials`, {
    method: 'POST',
    body: JSON.stringify({
      type: 'video',
      title: 'E4N Tanıtım Videosu',
      url: 'https://cdn.example.com/e4n-intro.mp4'
    })
  }, adminToken);
  assert.equal(matVideoRes.status, 201);
  assert.equal(matVideoRes.data.type, 'video');
  const matVideoId = matVideoRes.data.id;

  // Admin adds doc material to lesson 1
  const matDocRes = await req(`/api/lms/lessons/${lesson1Id}/materials`, {
    method: 'POST',
    body: JSON.stringify({
      type: 'doc',
      title: 'Eğitim Slaytları (PDF)',
      url: 'https://cdn.example.com/e4n-slides.pdf'
    })
  }, adminToken);
  assert.equal(matDocRes.status, 201);
  assert.equal(matDocRes.data.type, 'doc');

  // Member gets lessons of course (includes nested materials)
  const lessonsRes = await req(`/api/lms/courses/${courseId}/lessons`, { method: 'GET' }, memberToken);
  assert.equal(lessonsRes.status, 200);
  assert.equal(lessonsRes.data.length, 2);
  assert.equal(lessonsRes.data[0].id, lesson1Id);
  assert.equal(lessonsRes.data[0].materials.length, 2);

  // Member gets materials of lesson 1
  const matsRes = await req(`/api/lms/lessons/${lesson1Id}/materials`, { method: 'GET' }, memberToken);
  assert.equal(matsRes.status, 200);
  assert.equal(matsRes.data.length, 2);

  // Admin updates lesson 2
  const updateLessonRes = await req(`/api/lms/lessons/${lesson2Id}`, {
    method: 'PUT',
    body: JSON.stringify({ title: 'Ders 2: İleri Düzey İş Yönlendirme' })
  }, adminToken);
  assert.equal(updateLessonRes.status, 200);
  assert.equal(updateLessonRes.data.title, 'Ders 2: İleri Düzey İş Yönlendirme');

  console.log('✅ Contract 2: Lessons & Materials Lifecycle PASS.');

  // ============================================================================
  // Contract 3: Course Enrollment
  // ============================================================================
  console.log('Testing Contract 3: Course Enrollment...');

  const enrollRes = await req(`/api/lms/courses/${courseId}/enroll`, { method: 'POST' }, memberToken);
  assert.equal(enrollRes.status, 200);
  assert.equal(enrollRes.data.enrolled, true);
  assert.equal(enrollRes.data.course_id, courseId);

  // Verify enrollment reflected in course list
  const enrolledCoursesRes = await req('/api/lms/courses', { method: 'GET' }, memberToken);
  const enrolledCourse = enrolledCoursesRes.data.find(c => c.id === courseId);
  assert.equal(enrolledCourse.is_enrolled, 1);
  assert.equal(enrolledCourse.lesson_count, 2);

  console.log('✅ Contract 3: Course Enrollment PASS.');

  // ============================================================================
  // Contract 4: Exam Creation with Questions & Member Discovery
  // ============================================================================
  console.log('Testing Contract 4: Exam Creation & Discovery...');

  const createExamRes = await req('/api/lms/exams', {
    method: 'POST',
    body: JSON.stringify({
      title: 'E4N Temel Bilgi Sınavı',
      duration: 30,
      passingScore: 70,
      course_id: courseId,
      questions: [
        {
          text: 'E4N toplantıları haftada kaç kez gerçekleştirilir?',
          options: ['Haftada 1 kez', 'Haftada 2 kez', 'Ayda 1 kez', 'Yılda 1 kez'],
          correct: 'Haftada 1 kez',
          score: 50
        },
        {
          text: 'İş referansı verildikten sonra ideal ilk temas süresi ne kadardır?',
          options: ['24 saat', '1 hafta', '1 ay', 'İstendiği zaman'],
          correct: '24 saat',
          score: 50
        }
      ]
    })
  }, adminToken);

  assert.equal(createExamRes.status, 200);
  assert.ok(createExamRes.data.id);
  assert.equal(createExamRes.data.title, 'E4N Temel Bilgi Sınavı');
  assert.equal(createExamRes.data.duration_minutes, 30);
  assert.equal(createExamRes.data.pass_score, 70);
  assert.equal(createExamRes.data.questions.length, 2);
  const examId = createExamRes.data.id;
  const q1 = createExamRes.data.questions.find(q => q.text.toLowerCase().includes('haftada'));
  const q2 = createExamRes.data.questions.find(q => q.text.toLowerCase().includes('temas'));
  assert.ok(q1 && q2, 'Both questions must be present in created exam');

  // Member lists exams
  const memberExamsRes = await req('/api/lms/exams', { method: 'GET' }, memberToken);
  assert.equal(memberExamsRes.status, 200);
  const foundExam = memberExamsRes.data.find(e => e.id === examId);
  assert.ok(foundExam, 'Exam must be listed for member');
  assert.equal(foundExam.my_attempts, 0);
  assert.equal(foundExam.my_passed, null);
  assert.equal(foundExam.questions.length, 2);

  // Member gets questions for exam
  const examQuestionsRes = await req(`/api/lms/exams/${examId}/questions`, { method: 'GET' }, memberToken);
  assert.equal(examQuestionsRes.status, 200);
  assert.equal(examQuestionsRes.data.length, 2);
  const q1Found = examQuestionsRes.data.find(q => q.text.toLowerCase().includes('haftada'));
  assert.ok(q1Found && q1Found.options.includes('Haftada 1 kez'));

  // Member gets exams for course
  const courseExamsRes = await req(`/api/lms/courses/${courseId}/exams`, { method: 'GET' }, memberToken);
  assert.equal(courseExamsRes.status, 200);
  assert.equal(courseExamsRes.data.length, 1);
  assert.equal(courseExamsRes.data[0].id, examId);

  console.log('✅ Contract 4: Exam Creation & Discovery PASS.');

  // ============================================================================
  // Contract 5: Exam Attempt & Failure Lifecycle
  // ============================================================================
  console.log('Testing Contract 5: Exam Attempt (Failure Lifecycle)...');

  // Member submits wrong answers (0 points)
  const failAttemptRes = await req(`/api/lms/exams/${examId}/attempts`, {
    method: 'POST',
    body: JSON.stringify({
      answers: {
        [q1.id]: 'Ayda 1 kez',
        [q2.id]: '1 ay'
      }
    })
  }, memberToken);

  assert.equal(failAttemptRes.status, 201);
  assert.equal(failAttemptRes.data.score, 0);
  assert.equal(failAttemptRes.data.passed, false);
  assert.equal(failAttemptRes.data.pass_score, 70);

  // Verify NO achievement awarded
  const noAchievement = await pool.query(
    'SELECT * FROM user_achievements WHERE user_id = $1',
    [memberId]
  );
  assert.equal(noAchievement.rows.length, 0, 'No achievement should be awarded on failed attempt');

  // Verify NO education hours added
  const noEducation = await pool.query(
    'SELECT * FROM education WHERE user_id = $1',
    [memberId]
  );
  assert.equal(noEducation.rows.length, 0, 'No education hours should be added on failed attempt');

  console.log('✅ Contract 5: Exam Failure Lifecycle PASS.');

  // ============================================================================
  // Contract 6: Exam Attempt & Success Lifecycle (Scoring, Achievement & CEU)
  // ============================================================================
  console.log('Testing Contract 6: Exam Attempt (Success Lifecycle & Rewards)...');

  // Member submits passing answers (100 points)
  const passAttemptRes = await req(`/api/lms/exams/${examId}/attempts`, {
    method: 'POST',
    body: JSON.stringify({
      answers: {
        [q1.id]: 'Haftada 1 kez',
        [q2.id]: '24 saat'
      }
    })
  }, memberToken);

  assert.equal(passAttemptRes.status, 201);
  assert.equal(passAttemptRes.data.score, 100);
  assert.equal(passAttemptRes.data.passed, true);

  // Verify Achievement row in user_achievements
  const achievements = await pool.query(
    'SELECT * FROM user_achievements WHERE user_id = $1',
    [memberId]
  );
  assert.equal(achievements.rows.length, 1, 'One achievement must be awarded on passing exam');
  assert.equal(achievements.rows[0].title, 'E4N Temel Bilgi Sınavı Başarısı');

  // Verify 1.0 CEU Hours in education table
  const education = await pool.query(
    'SELECT * FROM education WHERE user_id = $1',
    [memberId]
  );
  assert.equal(education.rows.length, 1, 'One education record must be inserted');
  assert.equal(Number(education.rows[0].hours), 1.0);
  assert.equal(education.rows[0].type, 'WEBINAR');

  // Member queries attempt history
  const attemptsHistoryRes = await req(`/api/lms/exams/${examId}/attempts`, { method: 'GET' }, memberToken);
  assert.equal(attemptsHistoryRes.status, 200);
  assert.equal(attemptsHistoryRes.data.length, 2, 'Must have 2 attempt records in history');
  assert.equal(attemptsHistoryRes.data[0].passed, true, 'Most recent attempt must be passed');
  assert.equal(attemptsHistoryRes.data[1].passed, false, 'Previous attempt must be failed');

  // Verify updated exam listing shows passed state
  const updatedExamsList = await req('/api/lms/exams', { method: 'GET' }, memberToken);
  const updatedExam = updatedExamsList.data.find(e => e.id === examId);
  assert.equal(updatedExam.my_attempts, 2);
  assert.equal(updatedExam.my_passed, true);
  assert.equal(updatedExam.my_best_score, 100);

  console.log('✅ Contract 6: Exam Success Lifecycle & Rewards PASS.');

  // ============================================================================
  // Contract 7: Admin Deletion & Cascade Cleanliness
  // ============================================================================
  console.log('Testing Contract 7: Admin Deletion & Cascade Cleanliness...');

  // Delete material
  const delMatRes = await req(`/api/lms/materials/${matVideoId}`, { method: 'DELETE' }, adminToken);
  assert.equal(delMatRes.status, 200);
  assert.equal(delMatRes.data.success, true);

  // Delete lesson
  const delLessonRes = await req(`/api/lms/lessons/${lesson2Id}`, { method: 'DELETE' }, adminToken);
  assert.equal(delLessonRes.status, 200);
  assert.equal(delLessonRes.data.success, true);

  // Delete exam
  const delExamRes = await req(`/api/lms/exams/${examId}`, { method: 'DELETE' }, adminToken);
  assert.equal(delExamRes.status, 200);
  assert.equal(delExamRes.data.success, true);

  // Delete course
  const delCourseRes = await req(`/api/lms/courses/${courseId}`, { method: 'DELETE' }, adminToken);
  assert.equal(delCourseRes.status, 200);
  assert.equal(delCourseRes.data.success, true);

  console.log('✅ Contract 7: Admin Deletion & Cascade Cleanliness PASS.');

  // ============================================================================
  // Contract 8: RBAC Security Boundaries
  // ============================================================================
  console.log('Testing Contract 8: RBAC Security Boundaries...');

  // Unauthenticated access rejected
  const unauthRes = await req('/api/lms/courses', { method: 'GET' }, null);
  assert.equal(unauthRes.status, 401, 'Unauthenticated request must return 401');

  // Member trying to create course
  const memberCreateCourse = await req('/api/lms/courses', {
    method: 'POST',
    body: JSON.stringify({ title: 'Yetkisiz Kurs' })
  }, memberToken);
  assert.equal(memberCreateCourse.status, 403, 'Member cannot create course (403)');

  // Member trying to create exam
  const memberCreateExam = await req('/api/lms/exams', {
    method: 'POST',
    body: JSON.stringify({ title: 'Yetkisiz Sınav' })
  }, memberToken);
  assert.equal(memberCreateExam.status, 403, 'Member cannot create exam (403)');

  // Member trying to delete course
  const memberDeleteCourse = await req(`/api/lms/courses/${randomUUID()}`, { method: 'DELETE' }, memberToken);
  assert.equal(memberDeleteCourse.status, 403, 'Member cannot delete course (403)');

  console.log('✅ Contract 8: RBAC Security Boundaries PASS.');

  console.log('\n🎉 ALL 8 LMS CONTRACTS PASSED WITH 100% SUCCESS!');
} finally {
  await cleanup();
}
