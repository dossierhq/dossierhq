import * as TestDb from './TestDb';

test('adds 1 + 2 to equal 3', () => {
  expect(1 + 2).toBe(3);
});

test('SELECT * FROM test', async () => {
  const { rows } = await TestDb.getPool().query('INSERT INTO test(foo) VALUES($1) RETURNING id', [
    'hello',
  ]);
  const { id } = rows[0];
  expect(id).toBeGreaterThan(0);
  const { rows: selectRows } = await TestDb.getPool().query('SELECT * FROM test WHERE id = $1', [
    id,
  ]);
  expect(selectRows.length).toBe(1);
  expect(selectRows[0].foo).toBe('hello');
});
