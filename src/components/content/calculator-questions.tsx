import content from '@/data/calculator-content.json';
import {Accordion,AccordionItem} from '@/components/ui/accordion';
type Entry={description:string;faqs:{question:string;answer:string}[]};
export function CalculatorQuestions({slug}:{slug:string}){
 const entry=(content as Record<string,Entry>)[slug];
 if(!entry?.faqs.length)return null;
 return <section id="common-questions"><h2>Common questions</h2><Accordion>{entry.faqs.map(faq=><AccordionItem key={faq.question} title={faq.question}><p>{faq.answer}</p></AccordionItem>)}</Accordion></section>;
}
