import {wheelCategory} from './spin-wheels/catalog';
import {timeCategory} from './time/tools';

export const site = {
  name: "Finflo", url: process.env.NEXT_PUBLIC_SITE_URL || "https://finflo.org",
  email: process.env.NEXT_PUBLIC_CONTACT_EMAIL || "erushbaig@gmail.com",
  description: "Free calculators for money, health, math, and everyday life. Explore clear results, practical examples, and the formulas behind the numbers.",
  indexable: process.env.NEXT_PUBLIC_INDEXABLE === "true",
};
export const categories = [
  { id:"finance",name:"Finance",label:"Financial calculators",description:"Plan, save, and make more informed money decisions.",icon:"finance",links:[{name:"Mortgage Calculator",slug:"mortgage-calculator"},{name:"Compound Interest Calculator",slug:"compound-interest-calculator"}]},
  { id:"health",name:"Health & fitness",label:"Health & fitness calculators",description:"Understand your health and everyday wellness goals.",icon:"health",links:[{name:"BMI Calculator",slug:"bmi-calculator"},{name:"Calorie Calculator",slug:"calorie-calculator"}]},
  { id:"math",name:"Math",label:"Math calculators",description:"Work through the numbers, one clear step at a time.",icon:"math",links:[{name:"Percentage Calculator",slug:"percent-calculator"},{name:"Fraction Calculator",slug:"fraction-calculator"}]},
  { id:"everyday",name:"Everyday",label:"Everyday calculators",description:"Useful tools for life's little questions and big projects.",icon:"everyday",links:[{name:"Age Calculator",slug:"age-calculator"},{name:"Unit Converter",slug:"conversion-calculator"}]},
] as const;
export type CategoryId = (typeof categories)[number]["id"];

export const categoryLabels:Record<CategoryId,string>={finance:"Finance",health:"Health",math:"Math",everyday:"Everyday"};

export const toolCategories = [...categories.map(category => ({...category, href: `/calculators/${category.id}`})), wheelCategory, timeCategory];
export type ToolCategoryId = CategoryId | typeof wheelCategory.id | typeof timeCategory.id;
export const toolCategoryLabels: Record<ToolCategoryId, string> = {...categoryLabels, 'spin-wheels': wheelCategory.name, time: timeCategory.name};
export const categoryHref = (category: ToolCategoryId) => category === 'spin-wheels' ? '/spin-wheels' : category === 'time' ? '/time' : `/calculators/${category}`;
