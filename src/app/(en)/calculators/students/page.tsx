import {StudentDirectory} from '@/components/content/student-directory';
import {studentDirectory} from '@/lib/student-tools';
import {pageMetadata} from '@/lib/metadata';

export const metadata = pageMetadata(studentDirectory.title, studentDirectory.description, studentDirectory.path);
export default function Page() { return <StudentDirectory/>; }
