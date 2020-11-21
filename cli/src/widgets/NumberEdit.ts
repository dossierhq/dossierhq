import inquirer from 'inquirer';

export async function showIntegerEdit(
  message: string,
  defaultValue?: number | null
): Promise<number> {
  const { value } = await inquirer.prompt([
    {
      name: 'value',
      type: 'input',
      message: message,
      default: defaultValue,
    },
  ]);
  return Number.parseInt(value, 10);
}
