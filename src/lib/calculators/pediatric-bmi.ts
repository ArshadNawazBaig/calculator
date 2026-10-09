import reference from '@/data/cdc-bmi-2022.json';
import {normalCdf,normalSf,inverseNormalSf} from './normal';
import {integer,num,positive} from './helpers';
import {metric,type Values,type Result} from './types';

export function childBmi(values:Values):Result {
  const months=integer(num(values,'ageYears'),2,19)*12+integer(num(values,'ageMonths'),0,11);
  const sex=values.sex==='male'?1:2;
  const row=reference.rows.find(row=>row[0]===sex&&row[1]===months+.5)!;
  if(!row)throw Error('No growth-chart reference exists for that completed month.');
  const us=values.units==='us',kg=positive(num(values,'weight'))*(us?.45359237:1),meters=positive(num(values,'height'))*(us?.0254:.01);
  const bmi=kg/(meters*meters),[,,l,median,s,sigma,p5,p85,p95]=row;
  const lmsZ=Math.expm1(l*Math.log(bmi/median))/(l*s);
  const tail=bmi>p95?.1*normalSf((bmi-p95)/sigma):normalSf(lmsZ);
  const z=bmi>p95?(tail>0?inverseNormalSf(tail):Infinity):lmsZ;
  const percentile=bmi>p95?100*(1-tail):100*normalCdf(lmsZ);
  const category=bmi<p5?'Below the 5th percentile':bmi<p85?'5th to below 85th percentile':bmi<p95?'85th to below 95th percentile':'At or above the 95th percentile';
  return {
    metrics:[metric('Body mass index',bmi,'number','kg/m²'),metric('BMI-for-age percentile',percentile>99.99?'Above 99.99':percentile<.01?'Below 0.01':percentile),metric('BMI z-score',Number.isFinite(z)&&z<=5?z:'Above extended chart range'),metric('Screening reference band',category),metric('Reference age',months,'number','completed months')],
    notes:['CDC 2000 LMS reference with the 2022 extension for BMI above the 95th percentile. Age and sex are used to select the growth reference; adult BMI categories are not applied.','A clinician should interpret growth over time and other health information. This result is not a diagnosis or a suggested weight target.'],
  };
}
