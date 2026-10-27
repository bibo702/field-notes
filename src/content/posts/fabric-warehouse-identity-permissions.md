---
title: "Secure your Fabric Warehouse: identity and permissions"
description: "A simple starting point for Microsoft Fabric Warehouse security: identify the caller, choose the right access scope, and grant only the data they need."
date: 2026-10-27
tags: [fabric, data-warehousing, security]
draft: false
starter: false
---

Giving someone access to a warehouse sounds like one decision. In Microsoft Fabric, it is several: **who is connecting, what they can open, and which data they can use**.

This first note in **Data Warehousing on Fabric** focuses on identity and permission management. The aim is a small, practical starting point, not a complete security architecture.

> Start with least privilege: give people the smallest access scope and the fewest permissions that let them do their job.

## Before granting access, ask six questions

A short discovery conversation helps avoid permissions that are difficult to undo later:

1. **Who needs access?** A person, a team, or an application?
2. **How will they connect?** Through SQL, a report, or another data-access path?
3. **What can they do?** Read a report, query a view, load data, or administer the warehouse?
4. **Which data can they see?** Everything, one department, or only selected columns?
5. **Who manages security?** Separate permission administration from routine consumption where practical.
6. **How will access be checked?** Decide how to test permissions, review membership, and audit activity.

Also record network restrictions, ingestion identities, and encryption-key responsibilities. They matter, but deserve their own notes rather than being squeezed into this one.

## Think in layers, not one permission

![An original five-step diagram: Microsoft Entra identifies the caller; Fabric access defines the scope; SQL permissions define allowed objects and actions; row and column policies restrict data; auditing records activity.](../../assets/fabric-warehouse-access.svg)

*A simplified SQL-access model. Auditing observes activity; it is not another permission gate.*

**Microsoft Entra ID** provides the identity. Prefer Entra security groups for team access rather than maintaining a long list of individual grants. Use a dedicated application identity for automation where supported, not a shared employee account.

**Fabric permissions** control access to a workspace or an individual Warehouse item. **SQL permissions** then define allowed operations on database objects. Row-level and column-level security provide additional controls when users should not see the same data.

These are connected controls, not interchangeable ones.

## Workspace roles are broader than they look

Workspace roles apply across the workspace, not just to the warehouse someone asked to use.

| Workspace role | Warehouse implication |
| --- | --- |
| Admin, Member, Contributor | Each receives `CONTROL` on warehouses in the workspace, including broad read/write and SQL permission-management capabilities. Their workspace-management capabilities differ. |
| Viewer | Receives connection and `ReadData` access to warehouses in the workspace. It is not a connection-only role. |

Use the first three roles for people who genuinely build or administer the solution. **Do not give an analyst Contributor merely to fix a query-access error.**

Viewer can be appropriate for workspace-wide readers, but it is a broad starting point if someone needs only one view in one warehouse. SQL restrictions can still apply to readers; a high-privilege builder who can manage permissions is not the right identity for validating those restrictions.

## Share one warehouse when that is all someone needs

Item permissions let you share a Warehouse without adding the person to the workspace.

The important distinction in the sharing dialog is:

- **Read:** permits connection to the SQL endpoint. On its own, it does not grant permission to query tables or views.
- **ReadData:** “Read all data using SQL.” This grants broad read access through SQL, subject to applicable SQL security restrictions.
- **ReadAll:** file access through OneLake/Spark. This is separate from SQL read access.

For a restricted SQL reader, start with **item Read**, then grant access to the required SQL objects. Do not select ReadData or ReadAll out of habit.

**Monitor** and **Audit** serve operational and auditing responsibilities, not ordinary report reading. Avoid bundling those responsibilities into every consumer's access.

> SQL policies protect the SQL query path. Do not assume they also protect direct file access through another engine. Review every access path before granting ReadAll.

## A small example: one team, one view

Suppose a fictional finance team needs a curated sales summary, not the underlying customer details.

1. Create an Entra security group for the intended readers.
2. Review its members' existing workspace roles, group memberships, and item permissions. A narrow grant does not remove access they already have.
3. Share only the Warehouse with that group, granting **Read** without the broad SQL or Spark read options.
4. Use SQL permissions, preferably managed through a purpose-specific database role, to grant access to the curated view.
5. Test using a representative reader identity: the approved view should work, and unrelated tables should not.

A view is useful for presenting a limited interface, but it is not a substitute for checking underlying permissions. If readers need different records, consider **row-level security (RLS)**. If particular fields must be restricted, consider **column-level security (CLS)**.

Keep the first implementation small: one group, one clearly defined requirement, and explicit allow-and-deny checks. Add more rules only when the requirement calls for them.

## Check the result, not just the sharing dialog

Before calling the setup complete:

- Test both an allowed query and a query that must fail, using a reader rather than an administrator.
- Check direct grants, inherited group access, workspace roles, and alternate data paths.
- Allow for permission propagation and reconnect before troubleshooting a recent change.
- Configure SQL auditing for the activity you need to record; verify that events are captured and access to logs is appropriately restricted.
- Review access when people change roles or leave the team.

The useful mental model is simple: **identity identifies the caller; permissions decide what that caller may do; data policies narrow what they may see; auditing helps explain what happened.**

Start there before adding more advanced controls.

## Sources and next steps

This note targets **Warehouse in Microsoft Fabric**, not Fabric SQL database or every Lakehouse access mode. It is a conceptual guide, not a tenant-tested configuration walkthrough. Product permissions can evolve; check the current documentation before applying changes.

Official Microsoft Learn references, checked October 27, 2026:

- [Secure your Fabric Data Warehouse](https://learn.microsoft.com/en-us/fabric/data-warehouse/security)
- [Workspace roles in Fabric Data Warehouse](https://learn.microsoft.com/en-us/fabric/data-warehouse/workspace-roles)
- [Share your data and manage permissions](https://learn.microsoft.com/en-us/fabric/data-warehouse/share-warehouse-manage-permissions)
- [SQL granular permissions](https://learn.microsoft.com/en-us/fabric/data-warehouse/sql-granular-permissions)
- [Microsoft Entra authentication](https://learn.microsoft.com/en-us/fabric/data-warehouse/entra-id-authentication)
- [Row-level security](https://learn.microsoft.com/en-us/fabric/data-warehouse/row-level-security)
- [Configure SQL audit logs](https://learn.microsoft.com/en-us/fabric/data-warehouse/configure-sql-audit-logs)

A useful follow-up would be a hands-on example of granting a group access to one view and testing the result.
