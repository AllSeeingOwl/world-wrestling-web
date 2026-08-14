# Wrestling Registry Entry Schema

This document defines the frontmatter data structure required for wrestling content entries in the registry.

## Frontmatter Fields

| Field                | Type   | Required | Description                                                           | Example                                                                     |
| -------------------- | ------ | -------- | --------------------------------------------------------------------- | --------------------------------------------------------------------------- |
| `title`              | string | Yes      | Entry title                                                           | WrestleMania X-Seven: Stone Cold vs. The Rock                               |
| `date`               | string | Yes      | Date of event (must be YYYY-MM-DD format)                             | 2001-04-01                                                                  |
| `promotion`          | string | Yes      | Wrestling promotion (e.g., WWE, WCW, NJPW, AEW)                       | WWE                                                                         |
| `significance`       | string | Yes      | Why this moment matters                                               | Historical Significance                                                     |
| `registry_section`   | string | Yes      | Category/classification                                               | Registry of Excellence                                                      |
| `wrestlers_involved` | array  | Yes      | Names of key wrestlers                                                | ["Stone Cold Steve Austin", "The Rock"]                                     |
| `event_name`         | string | No       | Name of the event/show (if applicable)                                | WrestleMania X-Seven                                                        |
| `era`                | string | No       | Decade or wrestling era (Attitude Era, Ruthless Aggression Era, etc.) | Attitude Era                                                                |
| `description`        | string | Yes      | Short summary                                                         | The main event of WrestleMania X-Seven marking the end of the Attitude Era. |

## Validation Rules

- **`date`**: Must be a valid date string in `YYYY-MM-DD` format.
- **`promotion`**: Must be a recognized wrestling promotion (e.g., WWE, WWF, WCW, ECW, NWA, NJPW, AJPW, ROH, TNA/Impact, AEW, etc.).
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
  - Registry of Infamy - Division B
  - Registry of Homage & Influence
