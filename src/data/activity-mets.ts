// Numerical reference facts from the 2024 Adult Compendium, verified 2026-10-09.
// Labels are shortened original descriptions. These population estimates apply to ages 19–59.
export const activityMets=[
  {code:'17152',label:'Walk on level ground · 2.0–2.4 mph',met:2.8},
  {code:'17190',label:'Walk on level ground · 2.8–3.4 mph',met:3.8},
  {code:'17200',label:'Brisk level walk · 3.5–3.9 mph',met:4.8},
  {code:'17220',label:'Very brisk level walk · 4.0–4.4 mph',met:5.5},
  {code:'17080',label:'Cross-country hike',met:6},
  {code:'12020',label:'Jog at a self-selected pace',met:7.5},
  {code:'12030',label:'Run · 5.0–5.2 mph',met:8.5},
  {code:'12050',label:'Run · 6.0–6.3 mph',met:9.3},
  {code:'12090',label:'Run · 8 mph',met:12},
  {code:'01010',label:'Leisure bike ride · below 10 mph',met:4},
  {code:'01020',label:'Bike ride · 10–11.9 mph',met:6.8},
  {code:'01030',label:'Bike ride · 12–13.9 mph',met:8},
  {code:'01040',label:'Bike ride · 14–15.9 mph',met:10},
  {code:'01220',label:'Stationary cycling · 90–100 W',met:6},
  {code:'02022',label:'Moderate body-weight calisthenics',met:3.8},
  {code:'02050',label:'Vigorous resistance training',met:6},
  {code:'02054',label:'Multiple resistance exercises · 8–15 reps',met:3.5},
  {code:'02048',label:'Moderate elliptical exercise',met:5},
  {code:'02068',label:'Rope skipping',met:11},
  {code:'02071',label:'Stationary rowing · below 100 W',met:5},
] as const;

export const locomotionMets:Record<string,{mph:number;met:number;code:string}[]>={
 walking:[{mph:2.2,met:2.8,code:'17152'},{mph:2.5,met:3,code:'17170'},{mph:3.1,met:3.8,code:'17190'},{mph:3.7,met:4.8,code:'17200'},{mph:4.2,met:5.5,code:'17220'},{mph:4.7,met:7,code:'17230'},{mph:5.25,met:8.5,code:'17231'}],
 running:[{mph:4.1,met:6.5,code:'12028'},{mph:4.55,met:7.8,code:'12029'},{mph:5.1,met:8.5,code:'12030'},{mph:5.65,met:9,code:'12045'},{mph:6.15,met:9.3,code:'12050'},{mph:6.7,met:10.5,code:'12060'},{mph:7,met:11,code:'12070'},{mph:7.5,met:11.8,code:'12080'},{mph:8,met:12,code:'12090'},{mph:8.6,met:12.5,code:'12100'},{mph:9,met:13,code:'12110'},{mph:10,met:14.8,code:'12120'},{mph:11,met:16.8,code:'12130'},{mph:12,met:18.5,code:'12132'},{mph:13,met:19.8,code:'12134'},{mph:14,met:23,code:'12135'}],
 cycling:[{mph:5.5,met:3.5,code:'01018'},{mph:9.4,met:5.8,code:'01019'},{mph:10.95,met:6.8,code:'01020'},{mph:12.95,met:8,code:'01030'},{mph:14.95,met:10,code:'01040'},{mph:17.5,met:12,code:'01050'}],
};
