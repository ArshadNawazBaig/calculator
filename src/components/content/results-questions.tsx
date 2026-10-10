import Link from '@/components/i18n/link';
import {Accordion,AccordionItem} from '@/components/ui/accordion';

export function ResultsQuestions({externalInputs=false}:{externalInputs?:boolean}){
  return <section>
    <h2>About your results</h2>
    <Accordion>
      <AccordionItem title="Are my inputs saved?">
        <p>{externalInputs?'Road mileage sends selected locations to map providers through Finflo, with temporary server caching.':'Calculations run in your browser, and Finflo does not save your entries between visits.'} The tool-sharing link contains only the page address. Our <Link href="/privacy">privacy policy</Link> explains reference-data requests, local files, optional browser-assistant tools, and results you choose to share.</p>
      </AccordionItem>
      <AccordionItem title="Why might another calculator give a different answer?">
        <p>Compare units, compounding or timing assumptions, the selected formula, and rounding. A different model can produce a different estimate even when the headline inputs look similar.</p>
      </AccordionItem>
      <AccordionItem title="How do I report a result that looks wrong?">
        <p><Link href="/contact">Contact Finflo</Link> with the mode and a fictional example that reproduces the issue. Include the formula or reference result when possible.</p>
      </AccordionItem>
    </Accordion>
  </section>;
}
