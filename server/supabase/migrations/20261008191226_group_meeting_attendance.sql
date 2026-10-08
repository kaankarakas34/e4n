-- Preserve existing observation rows and allow the already supported meeting statuses.
ALTER TABLE public.event_attendance_verifications DROP CONSTRAINT event_attendance_verifications_after_status_check;
ALTER TABLE public.event_attendance_verifications ADD CONSTRAINT event_attendance_verifications_after_status_check
 CHECK(after_status IN ('REGISTERED','PRESENT','ABSENT','LATE','SUBSTITUTE'));
