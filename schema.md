# Wrestling Heritage Registry Entry Schema

This document defines the frontmatter data structure required for wrestling content entries in the registry.

## Frontmatter Fields

| Field                       | Type   | Required | Description                                                                              | Example                                                                     |
| --------------------------- | ------ | -------- | ---------------------------------------------------------------------------------------- | --------------------------------------------------------------------------- |
| `title`                     | string | Yes      | Entry title                                                                              | WrestleMania X-Seven: Stone Cold vs. The Rock                               |
| `date`                      | string | Yes      | Date of event (must be YYYY-MM-DD format)                                                | 2001-04-01                                                                  |
| `promotion`                 | string | Yes      | Promotion, or the creator of a work from outside wrestling                               | WWE                                                                         |
| `significance`              | string | Yes      | Why this moment matters                                                                  | Historical Significance                                                     |
| `registry_section`          | string | Yes      | Category/classification                                                                  | Registry of Excellence                                                      |
| `wrestlers_involved`        | array  | Yes      | Key people: wrestlers, plus owners, referees or creators                                 | ["Stone Cold Steve Austin", "The Rock"]                                     |
| `event_name`                | string | No       | Name of the event/show (if applicable)                                                   | WrestleMania X-Seven                                                        |
| `era`                       | string | No       | Decade, in the form `1990s`                                                              | 2000s                                                                       |
| `description`               | string | Yes      | Short summary                                                                            | The main event of WrestleMania X-Seven marking the end of the Attitude Era. |
| `source_material`           | string | No       | Where the information comes from (broadcast, database, interview)                        | WWF WrestleMania X-Seven pay-per-view broadcast                             |
| `air_date`                  | string | No       | Broadcast date (YYYY-MM-DD) if the event was taped before it aired                       | 1999-01-04                                                                  |
| `context_statement`         | string | No       | One sentence on why this moment is historically significant                              | This match closed the Attitude Era's defining rivalry.                      |
| `components`                | array  | No       | For a composite work, its parts: each a `title`, `date` and optional `event_name`        | See below                                                                   |
| `proposed_individual_merit` | string | No       | For a composite work, the title of the part proposed for a Citation for Individual Merit | The two-out-of-three-falls rematch                                          |

## Validation Rules

- **`date`**: Must be a valid date string in `YYYY-MM-DD` format.
- **`components`**: If given, must list at least two parts, and the entry's `date` must be the date of the earliest part.
- **`proposed_individual_merit`**: If given, must exactly match the `title` of one of the `components`. The charter says the Preservation Board issues the citation, so the site shows this as a proposal.
- **`era`**: If given, must be a decade such as `1980s` or `2010s`. Named eras (the Attitude Era, the Monday Night Wars) belong in the article text, because they differ by promotion and country.
- **`promotion`**: The wrestling promotion (e.g., WWE, WWF, WCW, ECW, NWA, NJPW, AJPW, ROH, TNA/Impact, AEW). For Homage & Influence entries and other media, the creator instead: the studio, publisher, network, channel or outlet (e.g., Namco). The field keeps the name `promotion` so existing entries still build.
- **`significance`**: Must be one of the following:
  - Cultural Significance
  - Historical Significance
  - Aesthetic Significance
  - Conceptual Failure
  - Technical Failure
  - Contextual Failure
  - So Bad It's Good
  - Cautionary Archive
  - Homage & Influence
- **`registry_section`**: Must be one of the following:
  - Registry of Excellence
  - Registry of Infamy - Division A
  - Registry of Infamy - Division B (added by editors only; not open to public nomination)
  - Registry of Homage & Influence

## Composite Works

A composite work (charter section IV, rule 6) lists its parts in `components`. The entry page shows them as a "Scope of this composite work" list, and the header shows the full date range.

```yaml
date: '1989-02-20' # the first part's date
components:
  - title: 'Steamboat wins the championship'
    date: '1989-02-20'
    event_name: 'Chi-Town Rumble, UIC Pavilion, Chicago'
  - title: 'The two-out-of-three-falls rematch'
    date: '1989-04-02'
    event_name: 'Clash of the Champions VI, Louisiana Superdome, New Orleans'
proposed_individual_merit: 'The two-out-of-three-falls rematch'
```

## Citation Block

Every entry page ends with a citation block built from `promotion`, `event_name`, `date`, `air_date`, `source_material`, `context_statement` and `external_links`, following section 4 of the [Editorial Handbook](wrestling_handbook.md). The citation fields are optional so older entries still build, but the block shows a visible "not yet recorded" note until they are filled in.
