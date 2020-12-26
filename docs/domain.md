## Auth

A **Subject** represents an entity that read or write the data. It could be an interactive user or a program. The `uuid` is the unique identifier (UUIDv4).

A **Subject** can have one or more **Principals**. It could be e.g. represent an OAuth identity. The `identifier` is the id of the principal in the namespace of its **Principal Provider**.

There can be many **Principal Providers**. E.g. OAuth and `sys` for system principals.

## Data
