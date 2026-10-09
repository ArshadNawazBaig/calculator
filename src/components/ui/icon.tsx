import {Landmark, HeartPulse, Calculator, CalendarDays, ChartColumnIncreasing, Wallet, Apple, Clock3, House, Percent, Ruler, GraduationCap, Sigma, Wrench, CarFront, Banknote, Scale, Dumbbell, SquareRadical, Binary, Timer, type LucideProps} from "lucide-react";

const icons={finance:Landmark,health:HeartPulse,math:Calculator,everyday:CalendarDays,investment:ChartColumnIncreasing,salary:Wallet,calorie:Apple,age:Clock3,mortgage:House,percentage:Percent,conversion:Ruler,education:GraduationCap,tax:Landmark,geometry:Ruler,statistics:Sigma,construction:Wrench,vehicle:CarFront,loan:Banknote,weight:Scale,fitness:Dumbbell,algebra:SquareRadical,code:Binary,time:Timer};

export function toolIconName(slug:string,category:string) {
  if(/mortgage|house|rent|estate|down-payment/.test(slug))return "mortgage";
  if(/(^|-)(auto|fuel|gas|tire|mileage)(-|$)/.test(slug))return "vehicle";
  if(/loan|debt|payoff|credit/.test(slug))return "loan";
  if(/interest|investment|retirement|savings|stock|annuity|401k|ira|pension|rmd/.test(slug))return "investment";
  if(/salary|pay|budget/.test(slug))return "salary";
  if(/tax|vat/.test(slug))return "tax";
  if(/calorie|protein|macro|carb|fat-intake/.test(slug))return "calorie";
  if(/bmi|weight|body-fat|mass/.test(slug))return "weight";
  if(/pace|run|army|fitness/.test(slug))return "fitness";
  if(/(^|-)(age|date|day|days)(-|$)/.test(slug))return "age";
  if(/time|duration|hour/.test(slug))return "time";
  if(/percent|discount|tip/.test(slug))return "percentage";
  if(/grade|gpa|college/.test(slug))return "education";
  if(/deviation|probability|sample|statistic|z-score|confidence|mean/.test(slug))return "statistics";
  if(/triangle|area|volume|size|length|conversion/.test(slug))return "geometry";
  if(/binary|hex|base64|subnet|random-password|url/.test(slug))return "code";
  if(/concrete|roof|btu|gravel|tile|paint|stair|voltage/.test(slug))return "construction";
  if(/root|exponent|log|quadratic|fraction/.test(slug))return "algebra";
  return category;
}

export function Icon({name,...props}:{name:string}&LucideProps) {
  const Component=icons[name as keyof typeof icons]||Calculator;
  return <Component aria-hidden="true" strokeWidth={1.8} {...props}/>;
}
