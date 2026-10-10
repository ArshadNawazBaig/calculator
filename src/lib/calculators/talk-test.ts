import {mode, s, type Result, type Values} from './types';

const attribution = 'Source: CDC. This guidance is available free on the CDC website. Its use does not imply endorsement of Finflo by CDC, HHS or the US government.';
export const talkTestMode = () => mode('talk-test', 'Talk test for exercise intensity', 'activity-talk-test', [
  {...s('speech', 'Talking during aerobic activity', [
    ['conversation', 'Conversation is comfortable, but singing is difficult'],
    ['few-words', 'A few words require a pause for breath'],
    ['unsure', 'Neither description fits / I am unsure'],
  ]), hint: 'Choose the description that matches your speech and breathing during the activity.'},
], 'Comfortable conversation with difficulty singing suggests moderate relative intensity. Only a few words between breaths suggests vigorous relative intensity.', 'The talk test is a rough guide to relative effort during aerobic activity. It does not calculate a heart rate, measure fitness or prescribe an exercise target.', [attribution]);

export function runTalkTest(values: Values): Result {
  const indications: Record<string, string> = {
    conversation: 'Moderate relative intensity',
    'few-words': 'Vigorous relative intensity',
    unsure: 'Not classified',
  };
  if (!Object.hasOwn(indications, values.speech)) throw Error('Choose a supported talk-test response.');
  return {
    metrics: [{label: 'Talk-test indication', value: indications[values.speech], translateValue: true}],
    notes: [
      values.speech === 'unsure'
        ? 'Neither reference pattern was selected. This response does not establish an intensity level.'
        : 'This is a rough indication of relative effort, not a measured heart rate or a personal exercise prescription.',
      attribution,
    ],
  };
}
