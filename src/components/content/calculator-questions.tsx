import content from '@/data/calculator-content.json';
type Entry={description:string;faqs:{question:string;answer:string}[]};
export function CalculatorQuestions({slug}:{slug:string}){
 const entry=(content as Record<string,Entry>)[slug];
 if(!entry?.faqs.length)return null;
 return <section id="common-questions"><h2>Common questions</h2>{entry.faqs.map(faq=><details className="faq" key={faq.question}><summary>{faq.question}</summary><p>{faq.answer}</p></details>)}</section>;
}
