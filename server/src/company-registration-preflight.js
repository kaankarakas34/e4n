// Read-only migration review: identifiers only, never tax numbers or company details.
export async function companyRegistrationPreflight(client) {
 const {rows}=await client.query(`WITH identities AS (
  SELECT id,role,email,company,tax_office,billing_address,NULLIF(regexp_replace(tax_number,'[[:space:]-]','','g'),'') tax FROM public.users
 ), duplicates AS (SELECT tax FROM identities WHERE tax IS NOT NULL GROUP BY tax HAVING count(*)>1),
 duplicate_emails AS (SELECT lower(email) email FROM identities GROUP BY lower(email) HAVING count(*)>1)
 SELECT id,role,
  (NULLIF(btrim(company),'') IS NULL) company_missing,
  (NULLIF(btrim(tax_office),'') IS NULL) office_missing,
  (NULLIF(btrim(billing_address),'') IS NULL) address_missing,
  (tax IS NULL) tax_missing,
  (tax IS NOT NULL AND tax !~ '^([0-9]{10}|[1-9][0-9]{10})$') tax_invalid,
  (tax IN (SELECT tax FROM duplicates)) duplicate_tax,
  (lower(email) IN (SELECT email FROM duplicate_emails)) duplicate_email
 FROM identities ORDER BY id`);
 const ids=key=>rows.filter(r=>r[key]===true).map(r=>r.id);
 const report={reportVersion:2,accountCount:rows.length,communityAccountIds:rows.filter(r=>r.role==='COMMUNITY_MEMBER').map(r=>r.id),missingCompanyAccountIds:ids('company_missing'),missingTaxOfficeAccountIds:ids('office_missing'),missingBillingAddressAccountIds:ids('address_missing'),missingTaxAccountIds:ids('tax_missing'),invalidTaxAccountIds:ids('tax_invalid'),duplicateTaxAccountIds:ids('duplicate_tax'),duplicateEmailAccountIds:ids('duplicate_email')};
 return {...report,migrationBlocked:[report.invalidTaxAccountIds,report.duplicateTaxAccountIds,report.duplicateEmailAccountIds].some(x=>x.length>0),legacyCompletionDecisionRequired:[report.missingCompanyAccountIds,report.missingTaxAccountIds,report.missingTaxOfficeAccountIds,report.missingBillingAddressAccountIds].some(x=>x.length>0)};
}
