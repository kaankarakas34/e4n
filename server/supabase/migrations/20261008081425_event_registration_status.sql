-- Registration is a booking, not actual attendance. No historical row is rewritten.
ALTER TABLE public.attendance DROP CONSTRAINT attendance_status_check;
ALTER TABLE public.attendance ADD CONSTRAINT attendance_status_check
  CHECK (status IN ('PRESENT','ABSENT','LATE','SUBSTITUTE','MEDICAL','REGISTERED'));
