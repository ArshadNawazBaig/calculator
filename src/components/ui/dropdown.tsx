"use client";
import {Autocomplete,Button,FieldError,Input,ListBox,ListBoxItem,Popover,SearchField,Select,SelectValue,useFilter} from "react-aria-components";
import {Check,ChevronDown,Search,X} from "lucide-react";
import styles from "./form-controls.module.css";

export type DropdownOption={value:string;label:string;disabled?:boolean};
export type DropdownProps={
  id?:string;
  name?:string;
  value:string;
  onValueChange:(value:string)=>void;
  options:readonly DropdownOption[];
  disabled?:boolean;
  required?:boolean;
  searchable?:boolean;
  placeholder?:string;
  size?:"default"|"compact";
  className?:string;
  "aria-label"?:string;
  "aria-labelledby"?:string;
  "aria-describedby"?:string;
};

export function Dropdown({id,name,value,onValueChange,options,disabled=false,required=false,searchable=options.length>20,placeholder="Select an option",size="default",className="",...accessibility}:DropdownProps) {
  const {contains}=useFilter({sensitivity:"base"});
  const list=<ListBox items={options} className={styles.optionList} renderEmptyState={()=><div className={styles.empty}>No matching options</div>}>
    {option=><ListBoxItem id={option.value} textValue={option.label} className={styles.option}>{({isSelected})=><><span>{option.label}</span>{isSelected&&<Check size={16} aria-hidden="true"/>}</>}</ListBoxItem>}
  </ListBox>;

  return <Select {...accessibility} name={name} value={options.some(option=>option.value===value)?value:null} onChange={next=>onValueChange(next===null?"":String(next))}
    isDisabled={disabled} isRequired={required} disabledKeys={options.filter(option=>option.disabled).map(option=>option.value)} validationBehavior="native"
    placeholder={placeholder} className={`${styles.root} ${size==="compact"?styles.compact:""} ${className}`} data-ui-control="dropdown">
    <Button id={id} className={`${styles.control} ${styles.selectTrigger}`}><SelectValue className={styles.selectValue}>{({selectedText,isPlaceholder})=>isPlaceholder?placeholder:selectedText}</SelectValue><ChevronDown size={17} aria-hidden="true"/></Button>
    <Popover placement="bottom start" offset={7} maxHeight={360} className={`${styles.selectPopover} ${searchable?styles.searchablePopover:""}`}>
      {searchable?<Autocomplete filter={contains}>
        <SearchField aria-label="Search options" className={styles.optionSearch} autoFocus>
          <Search size={16} aria-hidden="true"/><Input placeholder="Search options…"/><Button aria-label="Clear options search"><X size={14} aria-hidden="true"/></Button>
        </SearchField>{list}
      </Autocomplete>:list}
    </Popover>
    <FieldError className={styles.error}/>
  </Select>;
}
