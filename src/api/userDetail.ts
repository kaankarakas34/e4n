export interface UserDetailSnapshot {
  profileVersion:1;ownerId:string;id:string;metricScope:'ALL_HISTORY';
  name:string;full_name:string;role:string;profession:string|null;email:string;phone:string|null;city:string|null;
  company:string|null;tax_number:string|null;tax_office:string|null;billing_address:string|null;account_status:string|null;
  subscription_plan:string|null;subscription_end_date:string|null;
  performance_score:number;performance_color:'GREEN'|'YELLOW'|'RED'|'GREY';
  metric_referrals:number;metric_revenue:number;metric_visitors:number;metric_one_to_ones:number;
  group_name:string|null;groups:{id:string;name:string}[];
  last_meetings:{id:string;meeting_date:string;status:string;partner_name:string|null}[];
}
