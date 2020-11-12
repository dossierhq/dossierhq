import inquirer from 'inquirer';

export async function showConfirm(message: string): Promise<boolean> {
  const { selection } = await inquirer.prompt<{ selection: boolean }>([
    {
      name: 'selection',
      type: 'confirm',
      message,
    },
  ]);
  return selection;
}
