'use client';
import {SystemPage} from '@/components/content/system-page';
import {Button} from '@/components/ui/button';
export default function ErrorPage({retry}:{error:Error&{digest?:string};retry:()=>void}){return <SystemPage code="Oops" title="Something didn’t add up." description="This page hit an unexpected problem. Try loading it again, or return to the calculator directory."><Button onClick={retry}>Try again</Button></SystemPage>;}
