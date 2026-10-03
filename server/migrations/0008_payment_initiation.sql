-- Legacy rows keep unknown initiation metadata; no ownership or payment result is inferred.
ALTER TABLE payment_transactions ADD COLUMN request_key UUID;
ALTER TABLE payment_transactions ADD COLUMN request_fingerprint CHAR(64);
ALTER TABLE payment_transactions ADD COLUMN initiation_state VARCHAR(16);
ALTER TABLE payment_transactions ADD CONSTRAINT payment_request_key_unique UNIQUE(request_key);
ALTER TABLE payment_transactions ADD CONSTRAINT payment_initiation_metadata_check CHECK (
 (request_key IS NULL AND request_fingerprint IS NULL AND initiation_state IS NULL)
 OR (request_key IS NOT NULL AND request_fingerprint IS NOT NULL AND initiation_state IS NOT NULL AND initiation_state IN ('RESERVED','NOT_SENT','DISPATCHED'))
);
