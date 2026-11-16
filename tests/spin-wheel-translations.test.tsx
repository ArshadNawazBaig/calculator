import {describe, expect, it} from 'vitest';
import {renderToStaticMarkup} from 'react-dom/server';
import {SpinWheelsPage} from '@/components/spin-wheels/library-page';
import {LanguageProvider} from '@/components/i18n/provider';

const decisionSentence = 'A wheel chooses randomly and cannot evaluate consequences. Use it for choices where the available outcomes are already acceptable. For a decision that needs numbers or comparison, explore Finflo’s {calculatorLink} instead.';
const choiceSentence = '{wheelLink} helps choose from meals, cuisines, or your own restaurant shortlist.';

describe('spin-wheel guidance linked sentences', () => {
  it('allows Hindi sentences to place purpose before a link and the verb after it', () => {
    const messages = {
      [decisionSentence]: 'पहिया यादृच्छिक रूप से चुनता है और परिणामों का मूल्यांकन नहीं कर सकता। इसका उपयोग ऐसे विकल्पों के लिए करें जिनके उपलब्ध परिणाम पहले से स्वीकार्य हों। जिस निर्णय के लिए संख्याओं या तुलना की आवश्यकता हो, उसके लिए इसके बजाय Finflo की {calculatorLink} देखें।',
      'calculator library': 'कैलकुलेटर लाइब्रेरी',
      [choiceSentence]: 'भोजन, व्यंजनों या अपनी चुनी हुई रेस्तराँ सूची में से चुनने में {wheelLink} मदद करता है।',
      'What to Eat Wheel': 'क्या खाएँ पहिया',
    };
    const html = renderToStaticMarkup(<LanguageProvider locale="hi" messages={messages}><SpinWheelsPage locale="hi" messages={messages}/></LanguageProvider>);
    expect(html).toContain('उसके लिए इसके बजाय Finflo की <a href="/hi/calculators">कैलकुलेटर लाइब्रेरी</a> देखें।</p>');
    expect(html).toContain('<li>भोजन, व्यंजनों या अपनी चुनी हुई रेस्तराँ सूची में से चुनने में <a href="/hi/spin-wheels/what-to-eat-wheel">क्या खाएँ पहिया</a> मदद करता है।</li>');
    expect(html).not.toContain('{calculatorLink}');
    expect(html).not.toContain('{wheelLink}');
    expect(html).not.toContain('instead.</p>');
  });

  it('preserves the English sentences and destinations', () => {
    const html = renderToStaticMarkup(<SpinWheelsPage/>);
    expect(html).toContain('<a href="/calculators">calculator library</a> instead.</p>');
    expect(html).toContain('<li><a href="/spin-wheels/what-to-eat-wheel">What to Eat Wheel</a> helps choose from meals, cuisines, or your own restaurant shortlist.</li>');
    expect(html).not.toContain('{wheelLink}');
    expect(html).not.toContain('{calculatorLink}');
  });
});
