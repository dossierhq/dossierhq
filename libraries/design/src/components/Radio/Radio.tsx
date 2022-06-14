export interface RadioProps {
  checked?: boolean;
  disabled?: boolean;
  name: string;
  value?: string;
  onChange?: React.ChangeEventHandler<HTMLInputElement>;
  children: React.ReactNode;
}

export function Radio({ checked, disabled, name, value, onChange, children }: RadioProps) {
  return (
    // eslint-disable-next-line @typescript-eslint/ban-ts-comment
    // @ts-ignore Bulma expects disabled on label as well
    <label className="radio" disabled={disabled}>
      <input type="radio" {...{ disabled, checked, name, value, onChange }} /> {children}
    </label>
  );
}
