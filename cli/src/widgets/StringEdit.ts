import inquirer from 'inquirer';

export async function showStringEdit(message: string, defaultValue?: string): Promise<string> {
  const { value } = await inquirer.prompt([
    {
      name: 'value',
      type: 'input',
      message: message,
      default: defaultValue,
    },
  ]);
  return value;
}
