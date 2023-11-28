## Astro

This example shows how to use [Astro](https://astro.build/) together with Dossier.

The database is a SQLite database, stored in `database/dossier.sqlite`.

### Auth

There is no authentication in this example. However, there are two different users used:

- In development mode (`npm start`), the `editor` principal is used (specified in `DOSSIER_PRINCIPAL_ID` in `.env.development`)
- In production mode (`npm run build && npm run start:production`), the `reader` principal is used (specified in `DOSSIER_PRINCIPAL_ID` in `.env`). The `reader` principal can't access the admin API.

The Dossier web interface is disabled in production mode.

**N.B.** Supporting multiple users and real authentication is left as an exercise.
