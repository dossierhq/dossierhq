## Schema

The **Schema** describes the structure of the data stored in Data Data. There exists two different views of the Schema. **Admin Schema** contains all the information, whereas **Schema** only contains the types that can be published (i.e. `adminOnly` is `false`) and doesn't include detailed information that's only useful when editing.

The main piece of data is an **Entity**. An **Entity** has:

- a unique id (UUID)
- a unique name (for convenience)
- an **Entity Type**
- an **Entity Status**
- an **Authorization Key**

**TODO** Entity Type, Value item, Value Type

### Publishing states

![Publishing states overview](./publishing-states.dot.svg)

## Clients

**TODO**: **Published Client**, **AdminClient**, **Client Middleware**

## Authentication

A **Subject** represents an entity that accesses the data. It could be an interactive user or a program. The `uuid` is the unique identifier (UUIDv4) and is randomly generated when a new subject is created.

A **Subject** can have one or more **Principals**. It could be e.g. represent an OAuth identity. The `identifier` is the id of the principal in the namespace of its **Principal Provider**, and can be any stable string.

There can be many **Principal Providers**. E.g. `auth0` for principals from Auth0, and `sys` for system principals.

All access needs to be authenticated, by providing a **Principal** which is resolved to a **Subject** that is associated with a **Session Context**. The actual authentication is left up to the application. For anonymous users, one **Principal** (e.g. `sys`/`anonymous`) could be used for all requests.

## Authorization

Basic authorization is provided by the application. Since all calls to Data Data comes through the application so it can deny access to a specific **Subject**. The application can also deny access to a certain **Client**, e.g. only expose the **Published Client** to a specific **Subject**.

All entities are associated with an **Authorization Key**. Each key provides mostly its own separate view of the data. It's not possible to create two entities with the same id and different **Authorization Keys**, but without providing an entity's **Authorization Key** you won't be able to access it. For most operations, users of a **Client** can provide a set of **Authorization Keys**, either explicitly or through providing **Default Authorization Keys** when creating the **Session Context**. For some operations, e.g. creating an entity, the user has to explicitly provide one **Authorization Key**. For HTTP **Client Middleware** and GraphQL over HTTP, the convention is to put the **Default Authorization Keys** in a header called `DataData-Default-Auth-Keys`, with comma separated values. **N.B.** don't use commas in your **Authorization Keys** since it could break when passing over a header.

In order to check **Authorization Keys** for each request, the key is turned into a **Resolved Authorization Keys** by the **Authorization Adapter** provided by the application. Some examples (actual keys are up to the application):

- The user provides `none` as the **Authorization Key** when searching for entities, the **Authorization Adapter** resolves it to `none`. Searching only returns entities with the `none` key.
- The user provides `subject` as the **Authorization Key** when searching for entities, which is resolved to the subject's id `subject:63a8f8ef-6f0c-4417-a55f-cfb572dc9117`. Searching only returns entities with that key. Since each user gets their own **Resolved Authorization Key** this can be used to store user-private data.
- The user provider `none` and `subject` as the **Authorization Key** when searching for entities. Entities with either key are returned.
- The user provides `group:foo` as the **Authorization Key** when searching for entities. The **Authorization Adapter** ensures that the subject is a member of the `foo` group, and resolves the key to `group:foo`. Searching only returns entities with that key. Since each group gets their own **Resolved Authorization Key** this can be used to store group-private data.

An entity with one **Resolved Authorization Key** can refer to an entity with another key. There's no way from the API to tell which key to use to read an entity, so you need to provide the correct **Authorization Key** (or set of keys).

It is currently not possible to change the **Resolved Authorization Key** of an entity.
