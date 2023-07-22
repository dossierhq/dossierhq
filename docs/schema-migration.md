This document describes what migrations are supported and what impact they have.

| Type property     | Kind     | Change | Description                                                   |
| ----------------- | -------- | ------ | ------------------------------------------------------------- |
| Creating new type | `*`      | Yes    |                                                               |
| Removing type     | `*`      | No     | Removing a type is currently not supported.                   |
| `name`            | `*`      | No     | Renaming a type is currently not supported.                   |
| `adminOnly`       | `*`      | No     | Changing if a field is admin only is currently not supported. |
| `authKeyPattern`  | `Entity` | Yes    | Adding or changing that pattern requires validation.          |
| `nameField`       | `Entity` | Yes    | Only applies to newly created entities                        |

| Field property    | Field type             | Change | Description                                                                                                           |
| ----------------- | ---------------------- | ------ | --------------------------------------------------------------------------------------------------------------------- |
| Adding new field  |                        | Yes    |                                                                                                                       |
| Removing field    |                        | Yes    | Removing fields is irreversible. Requires validation (since invalid entities can become valid). Requires indexing.    |
| Reorder fields    |                        | Yes    |                                                                                                                       |
| `name`            | `*`                    | Yes    |                                                                                                                       |
| `type`            | `*`                    | No     | Changing field type is not supported.                                                                                 |
| `list`            | `*`                    | No     | Changing list is not supported.                                                                                       |
| `required`        | `*`                    | Yes    | Changing from `false` to `true` requires validation. Published entities can become invalid.                           |
| `adminOnly`       | `*`                    | No     | Changing if a field is admin only is currently not supported.                                                         |
| `entityTypes`     | `Entity`/`RichText`    | Yes    | If empty, adding items requires validation. Otherwise, removing items requires validation unless the list is cleared. |
| `integer`         | `Number`               | Yes    | Changing from `true` to `false` requires validation.                                                                  |
| `linkEntityTypes` | `RichText`             | Yes    | If empty, adding items requires validation. Otherwise, removing items requires validation unless the list is cleared. |
| `valueTypes`      | `RichText`/`ValueItem` | Yes    | If empty, adding items requires validation. Otherwise, removing items requires validation unless the list is cleared. |
| `richTextNodes`   | `RichText`             | Yes    | If empty, adding items requires validation. Otherwise, removing items requires validation unless the list is cleared. |
| `multiline`       | `String`               | Yes    | Changing from `true` to `false` requires validation.                                                                  |
| `matchPattern`    | `String`               | Yes    | Adding or changing the pattern requires validation.                                                                   |
| `values`          | `String`               | Yes    | If empty, adding items requires validation. Otherwise, removing items requires validation unless the list is cleared. |
| `index`           | `String`               | No     | Changing the index is not supported.                                                                                  |

| Index property   | Change | Description                                   |
| ---------------- | ------ | --------------------------------------------- |
| Adding new index | Yes    |                                               |
| Removing index   | No     | Removing an index is currently not supported. |
| `name`           | No     | Renaming an index is currently not supported. |
| `type`           | No     | Changing the type is currently not supported. |

| Pattern property   | Change | Description                                                          |
| ------------------ | ------ | -------------------------------------------------------------------- |
| Adding new pattern | Yes    |                                                                      |
| Removing pattern   | Yes    | Removing a pattern removes it from all types using the pattern.      |
| `name`             | Yes    | Renaming a pattern does not require validation.                      |
| `pattern`          | Yes    | Changing pattern requires validation of all types using the pattern. |
