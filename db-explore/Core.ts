import * as Db from "./Db";

export async function createPrincipal(provider: string, identifier: string) {
  await Db.withTransaction(async (client) => {
    const { rows } = await client.query(
      `INSERT INTO subjects DEFAULT VALUES RETURNING id`
    );
    const subjectId = rows[0].id;
    await client.query(
      `INSERT INTO principals (provider, identifier, subjects_id) VALUES ($1, $2, $3)`,
      [provider, identifier, subjectId]
    );
  });
}

export async function selectAllPrincipals() {
  return await Db.queryMany(
    Db.pool,
    `SELECT s.uuid, p.provider, p.identifier FROM subjects s, principals p WHERE s.id = p.subjects_id`
  );
}
