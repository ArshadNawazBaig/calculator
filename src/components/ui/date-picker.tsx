"use client";
import {languages} from '@/lib/i18n/config';
import {useI18n} from "@/components/i18n/provider";
import {useState} from "react";
import {Button,Calendar,CalendarCell,CalendarGrid,CalendarGridBody,CalendarGridHeader,CalendarHeaderCell,CalendarHeading,CalendarMonthPicker,CalendarYearPicker,DateInput,DatePicker as AriaDatePicker,DateSegment,Dialog,FieldError,Group,I18nProvider,Label} from "react-aria-components";
import {parseDate,today,getLocalTimeZone,type CalendarDate} from "@internationalized/date";
import {CalendarDays,ChevronLeft,ChevronRight} from "lucide-react";
import {Dropdown} from "./dropdown";
import {AnchoredPopover} from "./anchored-popover";
import styles from "./form-controls.module.css";

export type DatePickerProps={
  id?:string;
  name?:string;
  label?:string;
  value:string;
  onValueChange:(value:string)=>void;
  disabled?:boolean;
  required?:boolean;
  min?:string;
  max?:string;
  size?:"default"|"compact";
  "aria-label"?:string;
  "aria-labelledby"?:string;
  "aria-describedby"?:string;
};

function dateValue(value?:string):CalendarDate|null {
  if(!value)return null;
  try{return parseDate(value);}catch{return null;}
}

export function DatePicker({id,name,label,value,onValueChange,disabled=false,required=false,min,max,size="default",...accessibility}:DatePickerProps) {
 const {t,locale}=useI18n();

  const [open,setOpen]=useState(false);
  const minimum=dateValue(min),maximum=dateValue(max);
  function chooseToday(){
    const date=today(getLocalTimeZone());
    if((minimum&&date.compare(minimum)<0)||(maximum&&date.compare(maximum)>0))return;
    onValueChange(date.toString());setOpen(false);
  }
  return <I18nProvider locale={`${languages[locale].tag}-u-ca-gregory`}>
    <AriaDatePicker {...accessibility} id={id} name={name} value={dateValue(value)} onChange={date=>onValueChange(date?.toString()??"")}
      minValue={minimum??undefined} maxValue={maximum??undefined} isDisabled={disabled} isRequired={required} validationBehavior="native"
      granularity="day" shouldForceLeadingZeros isOpen={open} onOpenChange={setOpen} className={`${styles.root} ${size==="compact"?styles.compact:""}`} data-ui-control="date-picker">
      {label&&<Label className={styles.label}>{label}</Label>}
      <Group className={`${styles.control} ${styles.dateControl}`}>
        <DateInput className={styles.dateInput}>{segment=><DateSegment segment={segment} className={styles.dateSegment}/>}</DateInput>
        <Button className={styles.calendarTrigger} aria-label={t("Open calendar")}><CalendarDays size={19} aria-hidden="true"/></Button>
      </Group>
      <AnchoredPopover placement="bottom start" offset={7} className={styles.calendarPopover}>
        <Dialog className={styles.calendarDialog}>
          <Calendar className={styles.calendar}>
            <CalendarHeading className="sr-only"/>
            <div className={styles.calendarHeader}>
              <CalendarMonthPicker>{props=><Dropdown aria-label={props["aria-label"]} value={String(props.value)} onValueChange={key=>props.onChange(Number(key))} options={props.items.map(item=>({value:String(item.id),label:item.formatted}))} searchable={false} size="compact"/>}</CalendarMonthPicker>
              <CalendarYearPicker visibleYears={201}>{props=><Dropdown aria-label={props["aria-label"]} value={String(props.value)} onValueChange={key=>props.onChange(Number(key))} options={props.items.map(item=>({value:String(item.id),label:item.formatted}))} searchable size="compact"/>}</CalendarYearPicker>
              <Button slot="previous" className={styles.calendarNav}><ChevronLeft size={18} aria-hidden="true"/></Button>
              <Button slot="next" className={styles.calendarNav}><ChevronRight size={18} aria-hidden="true"/></Button>
            </div>
            <CalendarGrid className={styles.calendarGrid} weekdayStyle="short">
              <CalendarGridHeader>{day=><CalendarHeaderCell className={styles.weekday}>{day}</CalendarHeaderCell>}</CalendarGridHeader>
              <CalendarGridBody>{date=><CalendarCell date={date} className={styles.day}/>}</CalendarGridBody>
            </CalendarGrid>
          </Calendar>
          <div className={styles.calendarFooter}><span>{new Intl.DateTimeFormat(languages[locale].tag,{year:"numeric",month:"2-digit",day:"2-digit",calendar:"gregory"}).formatToParts(new Date(Date.UTC(2000,10,22))).filter(part=>["day","month","year","literal"].includes(part.type)).map(part=>part.type==='literal'?part.value:part.type==='day'?'DD':part.type==='month'?'MM':'YYYY').join('')}</span><div><Button slot={null} className={styles.calendarAction} onPress={chooseToday}>{t("Today")}</Button><Button slot={null} className={styles.calendarAction} isDisabled={!value} onPress={()=>{onValueChange("");setOpen(false);}}>{t("Clear")}</Button></div></div>
        </Dialog>
      </AnchoredPopover>
      <FieldError className={styles.error}/>
    </AriaDatePicker>
  </I18nProvider>;
}
