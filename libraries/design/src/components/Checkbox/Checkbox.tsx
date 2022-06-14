export interface CheckboxProps {
  checked?: boolean;
  disabled?: boolean;
  onChange?: React.ChangeEventHandler<HTMLInputElement>;
  children: React.ReactNode;
}

export function Checkbox({ checked, disabled, onChange, children }: CheckboxProps) {
  return (
    // eslint-disable-next-line @typescript-eslint/ban-ts-comment
    // @ts-ignore Bulma expects disabled on label as well
    <label className="checkbox" disabled={disabled}>
      <input type="checkbox" disabled={disabled} checked={checked} onChange={onChange} /> {children}
    </label>
  );
}
