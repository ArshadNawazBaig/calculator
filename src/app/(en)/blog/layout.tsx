import type {Metadata} from 'next';
import type {ReactNode} from 'react';

// Only successful published-page metadata opts into indexing. Loading/error
// responses and the empty article hub inherit this conservative default.
export const metadata:Metadata={robots:{index:false,follow:true}};
export default function BlogLayout({children}: {children:ReactNode}) {return children;}
