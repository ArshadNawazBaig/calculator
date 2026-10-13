'use client';

import Link from 'next/link';
import {History} from 'lucide-react';
import {useWorkspace} from '@/lib/workspace/store';
import {netWorthHistory} from '@/lib/workspace/net-worth';
import {money} from '@/lib/format';
import {ResultCharts} from './result-charts';
import {ResultSection} from './result-section';
import {ResultDataTable} from './result-table';
import styles from './toolkit.module.css';

export function NetWorthHistory({currency}: {currency: string}) {
  const {data, error} = useWorkspace(), history = netWorthHistory(data.calculations, currency);
  return <ResultSection titleId="net-worth-history-heading" title="Your net-worth history" icon={<History size={19} aria-hidden="true"/>}
    action={<span>Saved on this device · {currency}</span>}
    description={<>Choose a snapshot date, calculate, and save a named result above. This timeline uses {currency} snapshots only, with the latest save for each date. Manage records and export a backup in <Link className="text-link" href="/workspace">My workspace</Link>.</>}>
    {error ? <div className={styles.body}><p className="form-error" role="alert">Browser storage is unavailable or contains invalid data. Open My workspace to review it.</p></div> : history.length ? <>
      {history.length > 1 && <div className={styles.body}><p className={styles.change}>Change since {history[0].date}: <strong>{money(history.at(-1)!.value - history[0].value, currency)}</strong></p><ResultCharts currency={currency} series={{title: 'Net worth over time', xLabel: 'Date', labels: ['Net worth'], points: history.map(point => ({x: Date.parse(point.date + 'T00:00:00Z'), label: point.date, values: [point.value]}))}}/></div>}
      <ResultDataTable label="Saved net-worth snapshots" caption={`Saved net-worth snapshots in ${currency}`}><thead><tr><th scope="col">Snapshot date</th><th scope="col">Name</th><th scope="col" data-money>Net worth</th><th scope="col">Open</th></tr></thead><tbody>{history.map(point => <tr key={point.date}><td>{point.date}</td><td>{point.name}</td><td data-numeric data-money>{money(point.value, currency)}</td><td><a className="text-link" href={`#saved=${encodeURIComponent(point.id)}`}>Restore <span className="sr-only">{point.name}</span></a></td></tr>)}</tbody></ResultDataTable>
    </> : <div className={styles.body}><div className="result-empty"><History size={24} aria-hidden="true"/><h3>No saved snapshots yet</h3><p>Save your first result in {currency} to start a history; save another date to see a trend.</p></div></div>}
  </ResultSection>;
}
