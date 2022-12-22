const StyleClassName = {
  headline1: 'is-size-1',
  headline2: 'is-size-2',
  headline3: 'is-size-3',
  headline4: 'is-size-4',
  headline5: 'is-size-5',
  headline6: 'is-size-6',
  subtitle1: 'is-size-6 has-text-weight-bold',
  subtitle2: 'is-size-7 has-text-weight-bold',
  body1: 'is-size-6',
  body2: 'is-size-7',
  code1: 'is-size-6 is-family-code',
  code2: 'is-size-7 is-family-code',
  // button: '',
  // caption: '',
  // overline: '',
};

export type TextStyle = keyof typeof StyleClassName;

export function toTextStyleClassName(textStyle: TextStyle): string {
  return StyleClassName[textStyle];
}
