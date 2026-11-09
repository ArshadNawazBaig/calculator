'use client';

import {useId, type InputHTMLAttributes, type ReactNode, type TextareaHTMLAttributes} from 'react';
import styles from './form-controls.module.css';

type FieldProps = {
  label: ReactNode;
  hint?: ReactNode;
  errors?: readonly string[];
  className?: string;
  controlClassName?: string;
};

export type TextFieldProps = FieldProps & (
  | (Omit<InputHTMLAttributes<HTMLInputElement>, 'className'> & {multiline?: false})
  | (Omit<TextareaHTMLAttributes<HTMLTextAreaElement>, 'className'> & {multiline: true})
);

/** The shared Finflo field surface, with native form behavior and linked help/errors. */
export function TextField({label, hint, errors = [], className = '', controlClassName = '', ...props}: TextFieldProps) {
  const generatedId = useId();
  const id = props.id || generatedId;
  const hintId = hint ? `${id}-hint` : undefined;
  const errorId = errors.length ? `${id}-error` : undefined;
  const describedBy = [props['aria-describedby'], hintId, errorId].filter(Boolean).join(' ') || undefined;
  const controlProps = {
    id,
    className: `${styles.control} ${controlClassName}`,
    'aria-describedby': describedBy,
    'aria-invalid': props['aria-invalid'] ?? (errors.length > 0 || undefined),
  };
  const control = props.multiline ? (() => {
    const {multiline: _multiline, ...textareaProps} = props;
    void _multiline;
    return <textarea {...textareaProps} {...controlProps} className={`${controlProps.className} ${styles.textArea}`}/>;
  })() : (() => {
    const {multiline: _multiline, ...inputProps} = props;
    void _multiline;
    return <input {...inputProps} {...controlProps}/>;
  })();

  return <div className={`${styles.root} ${className}`} data-disabled={props.disabled || undefined} data-invalid={errors.length > 0 || undefined} data-ui-control="text-field">
    <label htmlFor={id} className={styles.label}>{label}</label>
    {control}
    {hint && <p id={hintId} className={styles.hint}>{hint}</p>}
    {errors.length > 0 && <p id={errorId} className={styles.error}>{errors.join(' ')}</p>}
  </div>;
}
