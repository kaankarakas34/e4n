// Core types for Event4Network application

export interface User {
  id: string;
  email: string;
  name: string;
  profession: string;
  phone: string;
  performance_score: number;
  performance_color: 'GREEN' | 'YELLOW' | 'RED' | 'GREY';
  role: 'MEMBER' | 'PRESIDENT' | 'VICE_PRESIDENT' | 'SECRETARY_TREASURER' | 'ADMIN';
  status?: 'ACTIVE' | 'PASSIVE' | 'PENDING';
  group_title?: string;
  created_at: string;
  updated_at?: string;
  friends?: string[];
  achievements?: Achievement[];
}

export interface Achievement {
  id: string;
  title: string;
  description: string;
  icon: string; // lucide icon name or url
  earned_at: string;
  type: 'QUIZ_PASS' | 'COURSE_COMPLETE' | 'ROLE_MILESTONE';
}

export interface Document {
  id: string;
  title: string;
  description?: string;
  category: 'GENERAL' | 'EDUCATION' | 'LEGAL' | 'MARKETING';
  url: string;
  file_type: 'PDF' | 'DOCX' | 'IMAGE' | 'OTHER';
  uploaded_by: string;
  created_at: string;
  uploader?: User;
  allowed_roles?: ('MEMBER' | 'PRESIDENT' | 'VICE_PRESIDENT' | 'SECRETARY_TREASURER' | 'ADMIN')[];
}

export interface Chapter {
  id: string;
  name: string;
  location: string;
  meeting_day: 'MONDAY' | 'TUESDAY' | 'WEDNESDAY' | 'THURSDAY' | 'FRIDAY';
  meeting_time: string;
  created_at: string;
}

export interface ChapterMember {
  id: string;
  user_id: string;
  chapter_id: string;
  profession_id: string;
  status: 'ACTIVE' | 'INACTIVE' | 'SUSPENDED';
  joined_at: string;
  user?: User;
}

export interface Referral {
  id: string;
  giver_id: string;
  receiver_id: string;
  type: 'INTERNAL' | 'EXTERNAL';
  status: 'PENDING' | 'SUCCESSFUL' | 'UNSUCCESSFUL';
  temperature: 'HOT' | 'WARM' | 'COLD';
  description: string;
  amount?: number;
  created_at: string;
  updated_at: string;
  // UI convenience fields
  receiver_name?: string;
  profession?: string;
  createdAt?: string;
  updatedAt?: string;
  giver?: User;
  receiver?: User;
}

export interface Meeting {
  id: string;
  chapter_id: string;
  meeting_date: string;
  status: 'SCHEDULED' | 'COMPLETED' | 'CANCELLED';
  created_at: string;
}

export interface Attendance {
  id: string;
  meeting_id: string;
  member_id: string;
  status: 'PRESENT' | 'ABSENT' | 'LATE' | 'MEDICAL' | 'SUBSTITUTE';
  substitute_name?: string;
  marked_at: string;
  meeting?: Meeting;
  member?: User;
}

export interface OneToOne {
  id: string;
  member1_id: string;
  member2_id: string;
  meeting_date: string;
  topic: string;
  notes: string;
  created_at: string;
  member1?: User;
  member2?: User;
}

export interface Visitor {
  id: string;
  name: string;
  profession: string;
  phone: string;
  email: string;
  inviter_id: string;
  chapter_id: string;
  status: 'INVITED' | 'ATTENDED' | 'JOINED' | 'DECLINED';
  visited_at: string;
  inviter?: User;
}

export interface Education {
  id: string;
  member_id: string;
  title: string;
  type: 'BOOK' | 'PODCAST' | 'WEBINAR' | 'COURSE' | 'SEMINAR';
  hours: number;
  completed_date: string;
  created_at: string;
}

export interface Revenue {
  id: string;
  giver_id: string;
  receiver_id: string;
  amount: number;
  currency: string;
  type: 'NEW' | 'RECURRING';
  status: 'PENDING' | 'APPROVED' | 'REJECTED';
  created_at: string;
  approved_at?: string;
  giver?: User;
  receiver?: User;
}

export interface PowerTeam {
  id: string;
  chapter_id: string;
  name: string;
  description: string;
  created_at: string;
}

export interface PerformanceReport {
  score: number;
  color: 'GREEN' | 'YELLOW' | 'RED' | 'GREY';
  breakdown: {
    referrals: number;
    one_to_ones: number;
    visitors: number;
    education: number;
    attendances: number;
  };
  recommendations: string[];
}

export interface AttendanceReport {
  members: Array<{
    member: User;
    attendance: Attendance;
    referralCount: number;
    visitorCount: number;
    revenueAmount: number;
  }>;
  meetingDate: string;
  summary: {
    totalMembers: number;
    presentCount: number;
    absentCount: number;
    lateCount: number;
    substituteCount: number;
    attendanceRate: number;
  };
}

export interface AuthResponse {
  user: User;
  token: string;
  chapterId: string;
}

// Membership / Subscription
export type MembershipPlan = '4_MONTHS' | '8_MONTHS' | '12_MONTHS';
export type MembershipStatus = 'ACTIVE' | 'EXPIRED' | 'PENDING';

export interface Membership {
  id: string;
  user_id: string;
  plan: MembershipPlan;
  status: MembershipStatus;
  start_date: string;
  end_date: string;
  last_renewal_date?: string;
  notes?: string;
  user?: User;
  name?: string;
  email?: string;
}

export interface LoginRequest {
  email: string;
  password: string;
}

export interface CreateReferralRequest {
  giverId: string;
  receiverId: string;
  type: 'INTERNAL' | 'EXTERNAL';
  temperature: 'HOT' | 'WARM' | 'COLD';
  description: string;
  status?: 'PENDING' | 'SUCCESSFUL' | 'UNSUCCESSFUL';
}

// Form types
export interface ReferralFormData {
  receiverId: string;
  type: 'INTERNAL' | 'EXTERNAL';
  temperature: 'HOT' | 'WARM' | 'COLD';
  description: string;
}

export interface CreateReferralFormData {
  giverId: string;
  receiverId: string;
  receiver: string;
  profession: string;
  type: 'INTERNAL' | 'EXTERNAL';
  temperature: 'HOT' | 'WARM' | 'COLD';
  description: string;
  amount: number;
}

// LMS Types
export interface Course {
  id: string;
  title: string;
  description: string;
  instructor_id: string;
  chapter_id: string;
  category: 'NETWORKING' | 'SALES' | 'LEADERSHIP' | 'COMMUNICATION' | 'TECHNOLOGY' | 'OTHER';
  level: 'BEGINNER' | 'INTERMEDIATE' | 'ADVANCED';
  duration: number; // in minutes
  status: 'DRAFT' | 'PUBLISHED' | 'ARCHIVED';
  thumbnail_url?: string;
  certificate_enabled: boolean;
  created_at: string;
  updated_at: string;
  instructor?: User;
  lessons?: Lesson[];
  enrolled_students?: number;
  average_rating?: number;
  allowed_roles?: ('MEMBER' | 'PRESIDENT' | 'VICE_PRESIDENT' | 'SECRETARY_TREASURER' | 'ADMIN')[];
}

export interface Lesson {
  id: string;
  course_id: string;
  title: string;
  description: string;
  content_type: 'VIDEO' | 'TEXT' | 'QUIZ' | 'DOCUMENT' | 'PRESENTATION';
  content_url?: string;
  content_text?: string;
  duration: number; // in minutes
  order_index: number;
  is_preview: boolean;
  created_at: string;
  updated_at: string;
  completed_by?: string[]; // user IDs who completed this lesson
}

export interface Enrollment {
  id: string;
  user_id: string;
  course_id: string;
  status: 'ENROLLED' | 'IN_PROGRESS' | 'COMPLETED' | 'DROPPED';
  progress_percentage: number;
  completed_lessons: string[];
  enrolled_at: string;
  started_at?: string;
  completed_at?: string;
  certificate_issued?: boolean;
  certificate_url?: string;
  user?: User;
  course?: Course;
}

export interface Quiz {
  id: string;
  lesson_id: string;
  title: string;
  description?: string;
  passing_score: number; // Added explicit requirement 70
  max_attempts: number;
  time_limit?: number; // in minutes
  randomize_questions: boolean;
  show_correct_answers: boolean;
  created_at: string;
  updated_at: string;
  questions?: QuizQuestion[];
}

export interface QuizQuestion {
  id: string;
  quiz_id: string;
  question_text: string;
  question_type: 'MULTIPLE_CHOICE' | 'TRUE_FALSE' | 'SHORT_ANSWER' | 'ESSAY';
  options?: string[];
  correct_answer: string;
  explanation?: string;
  points: number;
  order_index: number;
}

export interface QuizAttempt {
  id: string;
  user_id: string;
  quiz_id: string;
  score: number;
  max_score: number;
  percentage: number;
  passed: boolean;
  answers: QuizAnswer[];
  started_at: string;
  completed_at: string;
  time_spent: number; // in seconds
  user?: User;
  quiz?: Quiz;
}

export interface QuizAnswer {
  question_id: string;
  answer: string;
  is_correct: boolean;
  points_earned: number;
  answered_at: string;
}

export interface CourseReview {
  id: string;
  course_id: string;
  user_id: string;
  rating: number; // 1-5 stars
  title: string;
  comment: string;
  would_recommend: boolean;
  created_at: string;
  updated_at: string;
  user?: User;
}

export interface CourseCategory {
  id: string;
  name: string;
  description: string;
  color: string;
  icon: string;
  course_count: number;
}

// LMS Form Types
export interface CreateCourseFormData {
  title: string;
  description: string;
  category: 'NETWORKING' | 'SALES' | 'LEADERSHIP' | 'COMMUNICATION' | 'TECHNOLOGY' | 'OTHER';
  level: 'BEGINNER' | 'INTERMEDIATE' | 'ADVANCED';
  duration: number;
  certificate_enabled: boolean;
}

export interface CourseFormData {
  title: string;
  description: string;
  category: 'NETWORKING' | 'SALES' | 'LEADERSHIP' | 'COMMUNICATION' | 'TECHNOLOGY' | 'OTHER';
  level: 'BEGINNER' | 'INTERMEDIATE' | 'ADVANCED';
  duration: number;
  certificate_enabled: boolean;
  thumbnail_url: string;
  status: 'DRAFT' | 'PUBLISHED' | 'ARCHIVED';
}

export interface CreateLessonFormData {
  title: string;
  description: string;
  content_type: 'VIDEO' | 'TEXT' | 'QUIZ' | 'DOCUMENT' | 'PRESENTATION';
  content_url?: string;
  content_text?: string;
  duration: number;
  is_preview: boolean;
}

export interface CreateQuizFormData {
  title: string;
  description?: string;
  passing_score: number;
  max_attempts: number;
  time_limit?: number;
  randomize_questions: boolean;
  show_correct_answers: boolean;
  questions: CreateQuizQuestionFormData[];
}

export interface CreateQuizQuestionFormData {
  question_text: string;
  question_type: 'MULTIPLE_CHOICE' | 'TRUE_FALSE' | 'SHORT_ANSWER' | 'ESSAY';
  options?: string[];
  correct_answer: string;
  explanation?: string;
  points: number;
}

export interface OneToOneFormData {
  member2Id: string;
  meetingDate: string;
  topic: string;
  notes: string;
}

export interface VisitorFormData {
  name: string;
  profession: string;
  phone: string;
  email: string;
}

export interface EducationFormData {
  title: string;
  type: 'BOOK' | 'PODCAST' | 'WEBINAR' | 'COURSE' | 'SEMINAR';
  hours: number;
  completedDate: string;
}

// Backward compatibility aliases
export type TrafficLightResponse = PerformanceReport;
export type CEU = Education;
export type TYFCB = Revenue;
export type PALMSReport = AttendanceReport;
