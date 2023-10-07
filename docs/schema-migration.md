This document describes what migrations are supported and what impact they have.

| Type property     | Kind     | Change | Description                                                                                                                                                           |
| ----------------- | -------- | ------ | --------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Creating new type | `*`      | Yes    |                                                                                                                                                                       |
| Deleting type     | `*`      | Yes    | For entity types, deleting is only possible when there are no entities with that type. Deleting component types is irreversible and requires validation and indexing. |
| `name`            | `*`      | Yes    |                                                                                                                                                                       |
| `adminOnly`       | `*`      | Yes    | Changing if a type is admin only requires validation and indexing.                                                                                                    |
| `authKeyPattern`  | `Entity` | Yes    | Adding or changing that pattern requires validation.                                                                                                                  |
| `nameField`       | `Entity` | Yes    | Only applies to newly created entities                                                                                                                                |

| Field property    | Field type             | Change | Description                                                                                                           |
| ----------------- | ---------------------- | ------ | --------------------------------------------------------------------------------------------------------------------- |
| Adding new field  |                        | Yes    |                                                                                                                       |
| Deleting field    |                        | Yes    | Deleting fields is irreversible. Requires validation (since invalid entities can become valid). Requires indexing.    |
| Reorder fields    |                        | Yes    |                                                                                                                       |
| `name`            | `*`                    | Yes    |                                                                                                                       |
| `type`            | `*`                    | No     | Changing field type is not supported.                                                                                 |
| `list`            | `*`                    | No     | Changing list is not supported.                                                                                       |
| `required`        | `*`                    | Yes    | Changing from `false` to `true` requires validation. Published entities can become invalid.                           |
| `adminOnly`       | `*`                    | Yes    | Changing if a field is admin only requires validation and indexing.                                                   |
| `entityTypes`     | `Entity`/`RichText`    | Yes    | If empty, adding items requires validation. Otherwise, removing items requires validation unless the list is cleared. |
| `integer`         | `Number`               | Yes    | Changing from `true` to `false` requires validation.                                                                  |
| `linkEntityTypes` | `RichText`             | Yes    | If empty, adding items requires validation. Otherwise, removing items requires validation unless the list is cleared. |
| `componentTypes`  | `RichText`/`Component` | Yes    | If empty, adding items requires validation. Otherwise, removing items requires validation unless the list is cleared. |
| `richTextNodes`   | `RichText`             | Yes    | If empty, adding items requires validation. Otherwise, removing items requires validation unless the list is cleared. |
| `multiline`       | `String`               | Yes    | Changing from `true` to `false` requires validation.                                                                  |
| `matchPattern`    | `String`               | Yes    | Adding or changing the pattern requires validation.                                                                   |
| `values`          | `String`               | Yes    | If empty, adding items requires validation. Otherwise, removing items requires validation unless the list is cleared. |
| `index`           | `String`               | No     | Changing the index is not supported.                                                                                  |

| Index property   | Change | Description                                                                        |
| ---------------- | ------ | ---------------------------------------------------------------------------------- |
| Adding new index | Yes    |                                                                                    |
| Deleting index   | Yes    | Deleting an index removes it from all fields using the index. Requires validation. |
| `name`           | Yes    |                                                                                    |
| `type`           | No     | Changing the type is not supported.                                                |

| Pattern property   | Change | Description                                                                          |
| ------------------ | ------ | ------------------------------------------------------------------------------------ |
| Adding new pattern | Yes    |                                                                                      |
| Deleting pattern   | Yes    | Deleting a pattern removes it from all types using the pattern. Requires validation. |
| `name`             | Yes    | Renaming a pattern does not require validation.                                      |
| `pattern`          | Yes    | Changing pattern requires validation of all types using the pattern.                 |
