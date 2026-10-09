import {Landmark,HeartPulse,Calculator,CalendarDays,type LucideProps} from "lucide-react";

const icons={finance:Landmark,health:HeartPulse,math:Calculator,everyday:CalendarDays};

export function Icon({name,...props}:{name:string}&LucideProps) {
  const Component=icons[name as keyof typeof icons]||Calculator;
  return <Component aria-hidden="true" strokeWidth={1.8} {...props}/>;
}
