import {categoryLabels,type CategoryId} from "@/lib/site";
export {categoryLabels} from "@/lib/site";

export type HomeCategory = CategoryId | "all";
export type FeaturedTool = {title:string; slug:string; category:CategoryId; description:string};
export type Spotlight = {category:CategoryId; title:string; description:string; links:{title:string;slug:string}[]};
export const homeFilters:{id:HomeCategory;label:string}[]=[{id:"all",label:"All tools"},...Object.entries(categoryLabels).map(([id,label])=>({id:id as CategoryId,label}))];
export const spotlights:Record<CategoryId,Spotlight>={
  finance:{category:"finance",title:"Plan your next move.",description:"Run the numbers. Explore your options. Make more confident decisions.",links:[{title:"Mortgage calculator",slug:"mortgage-calculator"},{title:"Loan calculator",slug:"loan-calculator"},{title:"Retirement calculator",slug:"retirement-calculator"}]},
  health:{category:"health",title:"Know your numbers.",description:"Explore the estimates behind your nutrition, fitness, and everyday health.",links:[{title:"BMI calculator",slug:"bmi-calculator"},{title:"Calorie calculator",slug:"calorie-calculator"},{title:"BMR calculator",slug:"bmr-calculator"}]},
  math:{category:"math",title:"Make the numbers work.",description:"From a quick percentage to a complex equation, find the calculation you need.",links:[{title:"Percentage calculator",slug:"percent-calculator"},{title:"Fraction calculator",slug:"fraction-calculator"},{title:"Scientific calculator",slug:"scientific-calculator"}]},
  everyday:{category:"everyday",title:"A little help, every day.",description:"Work out dates, measurements, and the practical details of daily life.",links:[{title:"Age calculator",slug:"age-calculator"},{title:"Date calculator",slug:"date-calculator"},{title:"Unit converter",slug:"conversion-calculator"}]},
};
const compound:FeaturedTool={title:"Compound interest",slug:"compound-interest-calculator",category:"finance",description:"See how your money can grow over time."};
const bmi:FeaturedTool={title:"BMI",slug:"bmi-calculator",category:"health",description:"Check your body mass index and its reference range."};
const percentage:FeaturedTool={title:"Percentage",slug:"percent-calculator",category:"math",description:"Calculate percentages, changes, and what-if scenarios."};
const age:FeaturedTool={title:"Age",slug:"age-calculator",category:"everyday",description:"Find an exact age in years, months, and days."};
export const featuredTools:Record<HomeCategory,FeaturedTool[]>={
  all:[compound,bmi,percentage,age],
  finance:[compound,{title:"Salary",slug:"salary-calculator",category:"finance",description:"Compare hourly, monthly, and annual pay."},{title:"Investment",slug:"investment-calculator",category:"finance",description:"Explore contributions and potential returns."},{title:"Income tax",slug:"tax-calculator",category:"finance",description:"Estimate your US federal income tax."}],
  health:[{title:"Body fat",slug:"body-fat-calculator",category:"health",description:"Estimate body fat from your measurements."},{title:"Ideal weight",slug:"ideal-weight-calculator",category:"health",description:"Compare common weight reference formulas."},{title:"Calorie",slug:"calorie-calculator",category:"health",description:"Estimate your daily energy needs."},{title:"Pace",slug:"pace-calculator",category:"health",description:"Work out pace, distance, and finish time."}],
  math:[percentage,{title:"Fraction",slug:"fraction-calculator",category:"math",description:"Add, subtract, multiply, and divide fractions."},{title:"Triangle",slug:"triangle-calculator",category:"math",description:"Solve for sides, angles, and area."},{title:"Ratio",slug:"ratio-calculator",category:"math",description:"Simplify ratios and solve proportions."}],
  everyday:[age,{title:"Time",slug:"time-calculator",category:"everyday",description:"Add or subtract hours, minutes, and seconds."},{title:"Tip",slug:"tip-calculator",category:"everyday",description:"Calculate a tip and split the bill."},{title:"Unit converter",slug:"conversion-calculator",category:"everyday",description:"Convert common units and measurements."}],
};
export const browseCategories:{id:CategoryId;icon:string;links:{title:string;slug:string}[]}[]=[
  {id:"finance",icon:"finance",links:[...spotlights.finance.links.slice(0,1),{title:"Compound interest calculator",slug:"compound-interest-calculator"},...spotlights.finance.links.slice(1)]},
  {id:"health",icon:"health",links:[...spotlights.health.links,{title:"Ideal weight calculator",slug:"ideal-weight-calculator"}]},
  {id:"math",icon:"math",links:[...spotlights.math.links,{title:"Ratio calculator",slug:"ratio-calculator"}]},
  {id:"everyday",icon:"everyday",links:[...spotlights.everyday.links,{title:"Tip calculator",slug:"tip-calculator"}]},
];
