## Authentication

All access needs to be authenticated. The **Server** needs a **Session Context** which represents an authenticated **Subject**.

The **Subject** `id` is a unique identifier (UUIDv4) and is randomly generated when a new **Subject** is created.

Each **Principal Provider** has its own **Principal** identifier namespace. The **Principal** identifier is any stable string that uniquely identifies the **Principal** for the **Principal Provider**.

The actual authentication is left up to the **Application**. When the user has been authenticated the **Application** sends the **Principal Provider** namespace, and the **Principal** identifier to the **Server**, that resolves it to a **Subject** and returns a **Session Context**. If it's the first time the **Principal** is used a new **Subject** is created, otherwise the previously created **Subject** is reused.

**Conventions**: System **Principal Provider** (`sys`) for system functionality, such as loading the **Schema**. For anonymous users, one **Principal** (e.g. `sys`/`anonymous`) is be used for all requests.

**Restrictions**: Currently there's no way to link two principals to use the same subject, but the underlying support is there.

## Authorization

Basic authorization is provided by the **Application**. Since all operations to the **Server** comes through the **Application**, the **Application** can deny access to a specific **Subject**. The **Application** can also deny access to a certain **Client**, e.g. only expose the **Admin Client** to specific **Subjects**.

All **Entities** are associated with a **Resolved Authorization Key**. If a **Subject** doesn't have have access to a **Entity's** **Resolved Authorization Key**, they won't be able to access the **Entity**.

An entity with one **Resolved Authorization Key** can refer to an entity with another key.

In order to check the **Resolved Authorization Key** for each operation, the **Authorization Key** is turned into a **Resolved Authorization Keys** by the **Authorization Adapter** provided by the **Application**. The **Resolved Authorization Key** is then compared to the **Entity's** **Resolved Authorization Key** before allowing access.

An **Entity's** **Resolved Authorization Key** is not exposed to **Clients**, instead the **Authorization Key** is used. Still it's the **Resolved Auth Key** that's checked to access.

When searching for entities, users of a **Client** need to provide a set of **Authorization Keys**, either explicitly or through providing **Default Authorization Keys** when creating the **Session Context**. After resolving the **Authorization Keys** to **Resolved Authorization Keys**, the result will only include **Entities** matching the **Resolved Authorization Keys**.

**Convention**: For HTTP **Client Middleware** and GraphQL over HTTP, the convention is to put the **Default Authorization Keys** in a header called `Dossier-Default-Auth-Keys`, with comma separated values.

Some examples of key schemes that can be used by **Applications'** **Authorization Adapters**:

- The user provides `none` as the **Authorization Key** when searching for entities, the **Authorization Adapter** resolves it to `none`. Searching only returns entities with the `none` resolved key.
- The user provides `subject` as the **Authorization Key** when searching for entities, which is resolved to the subject's id `subject:63a8f8ef-6f0c-4417-a55f-cfb572dc9117`. Searching only returns entities with that resolved key. Since each user gets their own **Resolved Authorization Key** this can be used to store user-private data.
- The user provider `none` and `subject` as the **Authorization Key** when searching for entities, which is resolved to `none` and `subject:63a8f8ef-6f0c-4417-a55f-cfb572dc9117`. Entities with either resolved key are returned.
- The user provides `group:foo` as the **Authorization Key** when searching for entities. The **Authorization Adapter** ensures that the subject is a member of the `foo` group, and resolves the key to `group:foo`. Searching only returns entities with that key. Since each group gets their own **Resolved Authorization Key** this can be used to store group-private data.

**Restrictions**: It is currently not possible to change the **Authorization Key**, **Resolved Authorization Key** pair of an entity.
