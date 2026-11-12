---
title: "The Data Warehouse Conversation Guide"
description: "A clear, technical field guide to warehouse architecture, dimensional modeling, MPP, performance, governance, and production trade-offs—with examples and interactive explainers."
date: 2026-11-12
tags: [data-warehousing, fabric, learning]
draft: false
starter: false
---

A good data warehouse is not just a place to put tables. It is a designed system for turning business events into **consistent, timely, understandable answers**—at a cost and level of reliability the organization can live with.

That sounds simple. Real conversations quickly become: *What is the grain? Is this a fact or a snapshot? Why is the total doubled? Is the endpoint writable? Do we need more compute, or are queries queuing? Is “Gold” the same as a star schema? How do we prove the migration is correct?*

This guide gives you a map for answering those questions. It is useful whether you are new to data engineering, moving from a traditional enterprise data warehouse (EDW/MDW), or making design decisions in Microsoft Fabric. The examples and explanations here are original; the linked Fabric Warehouse book is a deeper reference, not text reproduced in this article.

## The 30-second explanation

> A data warehouse is an analytical system. It brings data from operational sources together, preserves the history needed for analysis, models it around business processes, and serves governed queries to people and applications. The warehouse's design must make the meaning of the data, the way it is loaded, and the way it is queried all agree.

Four ideas sit underneath almost every warehouse discussion:

1. **Business meaning:** What does one row mean? Which definition of “customer,” “order,” or “revenue” is authoritative?
2. **Data movement:** How do new, changed, late, and deleted records arrive without losing or duplicating history?
3. **Query work:** What does the engine scan, join, shuffle, and aggregate to answer a question?
4. **Operations:** Who can see or change data, how fresh must it be, how is it monitored, and what does it cost at peak?

If a proposal cannot explain those four things, it is not yet a complete warehouse design.

## First, separate the warehouse from the operational system

An operational database is usually optimized to record individual transactions quickly and safely: create an order, change an address, capture a payment. Those applications often update the current state of a small number of records at a time.

An analytical warehouse is optimized for questions over much more data: compare revenue across regions and years, follow customer behavior, reconcile finance measures, or explain a change in supply. It integrates multiple sources, makes history queryable, and provides structures that are friendly to analysis.

| Question | Operational system (OLTP) | Analytical warehouse (OLAP) |
|---|---|---|
| Typical work | Insert or update a transaction | Filter, join, aggregate, compare |
| Typical scope | A few current records | Many rows and historical periods |
| Main design pressure | Transaction integrity and fast writes | Useful answers, predictable reads, trusted definitions |
| Common consumer | Application | BI model, analyst, reporting job, application |

This is a difference in **workload and purpose**, not a rule that an OLTP database can never run analytics or that every warehouse query is huge. The important architecture question is whether the operational system should carry the analytical workload and its concurrency.

### Warehouse, lake, lakehouse, mart: what is what?

- A **data lake** is a flexible storage approach for data in files and open formats. By itself, a folder of files does not establish business definitions, quality guarantees, or a serving model.
- A **data warehouse** is an analytical data-management and serving system. It includes more than a database engine: ingestion, modeling, governance, operations, and consumers matter too.
- A **data mart** is a subject-oriented analytical product or slice, such as finance, sales, or inventory. It can be built inside a larger warehouse or lakehouse; “mart” does not prescribe a particular technology.
- A **lakehouse** combines lake-style storage and access patterns with data management and analytical engines. It is an architecture pattern, not a promise that every data set is clean, modeled, or ready for business users.

These are not always mutually exclusive platform choices. A lakehouse can hold curated warehouse-style dimensional tables; a warehouse can use open storage underneath. Ask what capabilities and responsibilities each name refers to in the architecture being discussed.

## Follow the whole path, not just the database

Think of the warehouse as a path from a business event to a decision:

**Source → ingest → store and transform → model → query engine → semantic/serving layer → person or application**

Every hop has a contract. For example, ingestion might promise “all source changes arrive within 30 minutes,” while the report might promise “the last fully reconciled day is visible by 7 a.m.” Those are different freshness definitions—and they should not be hidden behind the word *real-time*.

In Fabric, Warehouse is a SQL-first analytics experience integrated with OneLake and Delta. The Lakehouse SQL analytics endpoint is a different experience: it provides SQL querying over Delta tables, while table creation and data modification use other Fabric experiences. Verify the current T-SQL surface and write behavior for the exact item type rather than assuming that every SQL endpoint is a writable warehouse.

“Bronze, Silver, Gold” is a useful way to describe successive quality and refinement, but it is not a data model. A Gold layer might contain a dimensional model, an aggregate, a data product, or an unhelpfully named collection of tables. State the actual contract:

- **Bronze/raw:** What arrived, from which source, and when? Can we replay or investigate it?
- **Silver/validated:** What types, keys, duplicates, deletes, and business rules have been resolved?
- **Gold/serving:** Which questions or consumers is this shape designed to support?

### Interactive: explore the warehouse layers

Use the map above to see the questions and failure modes associated with each layer. When a report is wrong, tracing its lineage back through these layers is usually more effective than immediately blaming the chart or the warehouse engine.

## Model the business before you tune the engine

Dimensional modeling is a way to make analytical data understandable and composable. The common shape is a **star schema**: a central fact table for a business process, joined to descriptive dimension tables.

### Start with the grain: the meaning of one row

The **grain** is the exact statement of what one row in a fact table represents. Write it in plain language before choosing columns.

For example:

> One row represents one product line on one completed order.

That is different from “one row per order,” “one row per daily product total,” or “one row per payment event.” Those grains can all be valid, but they answer different questions and cannot safely be mixed without a clear design.

Suppose the fact stores `Quantity`, `UnitPrice`, `DiscountAmount`, and `NetSalesAmount`. If the grain is one order line, an order with three products contributes three fact rows. Joining the fact to a dimension with multiple matching rows can multiply those values. That is a **join fan-out**: the SQL executes, but the total becomes wrong.

This is why “one row per what?” is not a minor documentation detail. Grain determines:

- Which dimensions and keys belong on the fact.
- Which measures can be aggregated correctly.
- How to detect duplicate or missing events.
- What a row-count reconciliation should mean.
- Whether a join preserves totals.

### Facts and dimensions

- **Fact tables** record events, measurements, or periodic states at a declared grain. Examples include sales lines, shipment events, account balances at month-end, or daily inventory.
- **Dimension tables** describe the business entities used to filter, group, and label facts: date, product, customer, supplier, geography, or salesperson.
- **Measures** are values or calculations over facts, such as quantity, net amount, or number of orders.
- **Keys** connect facts to dimensions. A warehouse often uses a surrogate key for a dimension row while retaining the source's business identifier for traceability and matching.

An illustrative star:

```text
                  DimDate
                     |
DimCustomer — FactSalesLine — DimProduct
                     |
                 DimStore

Fact grain: one row per order line
Measures: quantity, discount, net sales
```

“Star schema” describes relationships and business roles, not a mandatory physical arrangement of every platform. Keep the shape easy to reason about; only add modeling complexity when a real analytical requirement justifies it.

### Not every measure can be added in every direction

- **Additive:** Revenue or units can generally be summed across the dimensions they represent.
- **Semi-additive:** An account balance may be summed across accounts but not across dates. Summing every day's ending balance does not give a meaningful period-end balance.
- **Non-additive:** Ratios, percentages, and averages should generally be recalculated from their components at the requested grain. Summing precomputed percentages is usually wrong.

A useful design often stores the additive components (for example, numerator and denominator) and defines the ratio at query time.

### Preserve history deliberately

When an attribute changes, decide whether reports should show the old value or only the current value.

- **Type 1 change:** Replace the old attribute. “Show the customer's current segment” is a typical use.
- **Type 2 change:** Add a new dimension version with effective dates/current-row metadata. Historical facts can continue to point to the version that was valid at the time.

This is a business decision, not just a loading technique. If someone asks “sales by customer region,” clarify whether they mean today's region or the region at the time of sale.

Other useful patterns include **role-playing dimensions** (one Date dimension used as order date and ship date), **conformed dimensions** (shared definitions across facts), and **unknown/not-yet-known members** for facts that arrive before their dimension details. They are tools for explicit semantics, not boxes to check in every project.

## Load data so retries and late events do not corrupt it

**ETL** transforms data before loading it to its analytical destination. **ELT** loads data first and performs transformations in the target analytical platform. Modern platforms can support both; the choice depends on source constraints, governance, scale, skills, and where the transformation should run.

The word *incremental* only says that a process attempts to handle less than the entire source each time. It does not say it handles changes correctly. A robust load design answers:

- What is the change marker: a timestamp, increasing key, log position, or CDC record?
- Are updates and deletes represented, or do we only see inserts?
- What happens when events arrive late or out of order?
- If a run fails after writing data, can we retry safely?
- How do we handle schema changes and invalid records?
- How do we reconcile source and target after a retry or backfill?

### Idempotency, watermarking, and CDC

An **idempotent** operation can be safely repeated without creating a different final result. A practical incremental pipeline usually records a watermark or source change token, reads a bounded range, applies changes according to a stable key, commits the target, and advances the watermark only when the target work succeeds.

If the watermark advances too early, a failure can skip source changes. If it never advances, retries can duplicate data. The correct answer depends on the source's change guarantees and the target's transaction behavior.

**Change data capture (CDC)** provides a log or feed of inserts, updates, and deletes. CDC can reduce source scanning and capture changes more faithfully, but it adds requirements: preserve ordering where needed, handle retention gaps, make replay possible, and define delete semantics.

Do not promise “exactly once” merely because a connector has a checkbox with that name. Ask which boundary the guarantee covers, how retries work after partial failure, and how the target is reconciled.

## Understand what the SQL engine actually does

A distributed analytical query typically goes through recognizable stages:

1. **Parse and bind:** Understand the SQL and resolve names, types, and permissions.
2. **Optimize:** Estimate cardinalities and costs; choose a logical and physical plan.
3. **Read:** Find relevant files, pages, partitions, or column data.
4. **Filter and join:** Reduce data early where possible; join inputs with compatible keys and cardinalities.
5. **Move and aggregate:** Distribute work across parallel tasks. Some joins and aggregations require data movement (often called a shuffle or exchange).
6. **Return results:** Merge partial results, serialize rows, and send them to the client or semantic layer.

This is why the **query plan** is evidence. It can show whether the engine scans far more data than expected, makes a poor join choice, or spends effort moving and aggregating rows.

### MPP: parallelism with a coordination cost

**Massively parallel processing (MPP)** divides suitable query work across multiple workers or execution units. If a query can be split into independent pieces, workers process their portions concurrently and combine partial answers.

Parallelism is not free. The engine must coordinate tasks and sometimes move data between them. Uneven data distribution (**skew**) can leave one worker doing most of the work while others wait. A join that expands rows dramatically, a missing predicate, or a huge shuffle may dominate even on a large system.

In the current Fabric Warehouse architecture, a SQL frontend optimizes the query and a distributed query processing engine schedules tasks on backend compute that reads OneLake data. Backend resources can scale autonomously with workload pressure, but this does not promise a fixed sub-second startup for every distributed query. Exact behavior, capacity guardrails, and product features change; use current service documentation for sizing and commitments.

### SQL compatibility is a design input

T-SQL familiarity is valuable, but “supports T-SQL” does not mean every SQL Server feature, system object, transaction pattern, or operational behavior is identical. Before migration, validate the specific syntax and behavior used by the workload: DDL, procedures, temporary tables, transactions, data types, security, and client libraries.

Use the platform's current T-SQL surface-area documentation as a test checklist. Treat unsupported or preview functionality as an explicit risk, not an assumption to discover during cutover.

## Tune with evidence, not folklore

A query can be slow because it reads too much, uses an ineffective join plan, encounters skew, performs expensive data movement, waits for resources, or returns too many rows to a slow client. “Add an index,” “partition by date,” and “buy more compute” are not universal fixes—especially across products with different storage and execution architectures.

Use this sequence:

1. **Define the target:** Which query, user journey, data freshness, and percentile latency matter? Is the target for one query or many concurrent users?
2. **Find the time:** Separate queue/wait time, execution time, and client/report rendering time.
3. **Inspect the query:** Read the actual SQL and plan. Check row estimates versus actuals where available, scans, join order, data movement, spills, and skew.
4. **Check the data:** Is the fact grain clear? Are keys unique where expected? Are files/data organized to support common filters? Did data volume or cardinality change?
5. **Change one thing:** Make a targeted change, rerun with representative data and cache state, and compare the same measures.
6. **Recheck cost and concurrency:** A faster query can consume more capacity. A change that improves one user can hurt the shared workload.

In Fabric, **Query Insights** helps investigate query history and performance. Pair it with query plans, workload/capacity signals, and the actual report or client path. Do not confuse a SQL duration with the full visual's end-to-end response.

### Interactive: choose a first diagnostic

In the diagnostic tool above, compare the first evidence to collect for a slow query, queueing users, incorrect totals, and stale data. Notice that each symptom starts with a different measurement. This is how you avoid changing the wrong layer.

## Concurrency: make many users fast, not just one query

**Concurrency** is the number of requests a system can make progress on at once. A system can have excellent single-query latency and still queue users during a dashboard peak. It can also serve many small queries while one poorly shaped query runs slowly.

Separate two strategies:

- **Scale up / allocate more resources:** Can help a resource-bound query or larger workload, if the engine can use the resources.
- **Scale out / add execution capacity:** Can help independent queries or parallelizable work, if the platform and capacity model support it.
- **Isolate workloads:** Keep interactive reporting from competing directly with heavy ingestion, rebuilds, or ad hoc exploration.

Start with telemetry: peak arrivals, active concurrency, queue duration, execution duration, capacity pressure, and which work competed at the time. In Fabric, workspace boundaries can be used as workload-isolation boundaries; OneLake shortcuts can sometimes let read-only consumers access data through separate SQL engines. Consider governance, data freshness, and capacity implications before using that pattern.

For a Fabric Warehouse, the workload-management documentation describes distributed task scheduling and separate SELECT and non-SELECT resource pools by default, with configurable SQL pools. Always verify current details and capacity guardrails. Do not assume that increasing SKU, spreading data, or adding a workspace automatically solves a queue.

## Security and governance are part of the model

Security is not a final checkbox. The design should state:

- Who owns and approves each data product?
- Which identity runs ingestion and which identities query?
- Which access boundary applies: workspace, item, SQL object, OneLake data, or semantic model?
- Does a consumer need all rows, or only rows/columns allowed by policy?
- How are credentials, secrets, audit records, lineage, and retention handled?

Use least privilege: grant the smallest capability that supports the job. Distinguish **workspace roles** from **item and SQL permissions**, and distinguish SQL access paths from OneLake security behavior. A security rule on one access path is not automatically proof that every other path enforces the same rule. Test access using representative identities and clients.

In Fabric, the Warehouse and Lakehouse SQL analytics endpoint have different write and modeling capabilities even when they expose SQL. Confirm which item and security layer a consumer actually uses. Use the current Fabric documentation for row-level, column-level, object-level, and OneLake security details.

## Reliability, transactions, and production readiness

Warehouse reliability is not just “the pipeline ran.” It includes dependable loads, valid data, recoverable failures, observable SLAs, safe schema changes, and known behavior when work overlaps.

- **ACID transactions** make a set of supported database operations commit or roll back atomically. They do not automatically make a multi-system pipeline atomic across source, orchestration, warehouse, and report cache.
- **Data quality checks** should test business invariants: uniqueness at the declared grain, valid dimension references, accepted ranges, reconciliation totals, freshness, and expected volume changes.
- **Late-arriving data** needs a policy: revise prior periods, keep an exception queue, or close reporting periods after a defined reconciliation point.
- **Retries** should be bounded and safe. Use idempotent writes and clear checkpoints; retries without a stable key or reconciliation can multiply errors.
- **Schema evolution** needs compatibility rules. A rename or type change can break SQL, semantic models, pipelines, and downstream extracts even when ingestion succeeds.
- **Recovery and retention** should be tested. Know what can be rebuilt from source, how far back the source or change log is retained, and what recovery-time target the business expects.
- **Observability** needs both technical signals (failures, duration, rows, capacity, queueing) and business signals (freshness, reconciled totals, missing entities).

A production pipeline should answer: What failed? What data was committed? Can we rerun? Who gets notified? How do we prove the fix? When is the business told the data is late?

## Migrating from a traditional EDW/MDW

Migration is not a syntax-conversion project. It is an exercise in preserving **meaning, behavior, security, performance, and operational confidence** while changing the implementation.

Inventory the current system by business process and workload:

1. Identify fact grains, key relationships, historical rules, and measures that reports depend on.
2. Inventory SQL features, data types, procedures, scheduling, security, and client behavior.
3. Classify workloads: ingestion, transformation, interactive BI, month-end, ad hoc, and extract/API.
4. Establish representative row counts, source-to-target reconciliation totals, freshness, latency, peak concurrency, and cost.
5. Port a representative slice, test semantic equivalence, then performance and operations.
6. Run old and new paths in parallel where needed, reconcile by business key and period, agree on cutover criteria, and preserve a rollback route.

Do not benchmark only a warm, tiny query or a vendor sample. Use the same input data, business result, freshness target, concurrent user pattern, and cost boundary. Ask whether both systems are using comparable caches and whether the client path is included.

## Meeting-ready answers to the hard questions

### “Why don't we just use the source database?”

> We can, if its workload, history, security, and availability meet the analytical need. The trade-off is whether analytical scans and concurrent reports should compete with transaction processing, and whether source schemas provide stable, integrated definitions.

### “Why do we need a star schema?”

> We do not need a star by tradition. We need clear grain, reliable relationships, and reusable measures. A star is a well-understood way to make those contracts easy to query and explain; we should use another shape only when a specific requirement justifies it.

### “Why is this revenue number different?”

> Let's first align the business definition, reporting period, currency, included statuses, and fact grain. Then we can trace the source-to-report path and compare keys and totals at each layer. “Revenue” can be implemented consistently and still mean different things to different teams.

### “Should we add more capacity?”

> Let's split queue time from execution time and identify which workload is competing. More capacity may relieve resource pressure or concurrency, but if the plan scans too much or the join multiplies rows, tuning the model or query is the better first move. We should compare performance and cost after the change.

### “The old SQL worked. Why doesn't it work here?”

> SQL dialect familiarity is not full behavioral compatibility. We'll check the feature surface and validate the specific syntax, transaction behavior, data type, security, and client dependency before we promise a migration date.

### “How do we know the migration is done?”

> A successful deployment is only one milestone. We need agreed reconciliation results, semantic parity for priority measures, security tests, workload-level performance, freshness, operational ownership, cutover criteria, and a tested rollback.

## A simple warehouse design review

Before approving a warehouse design, ask each question and capture an evidence-based answer:

| Area | Ask this |
|---|---|
| Business | Which decision or process does this data support? Who owns the definition? |
| Grain | What does one row in each fact represent? What proves uniqueness? |
| History | Which changes must remain historically true, and which are overwritten? |
| Ingestion | How are inserts, updates, deletes, late data, retries, and schema changes handled? |
| Semantics | Are measures additive? Which dates, statuses, currencies, and filters define them? |
| Performance | What are representative query plans, data volumes, and peak workload patterns? |
| Concurrency | Is the bottleneck queueing or query execution? What work should be isolated? |
| Security | Which identity accesses which object through which path? How is that tested? |
| Reliability | How are quality, freshness, reconciliation, failure, recovery, and alerting handled? |
| Economics | What is the cost at average and peak, including duplicated storage and refresh/compute? |
| Change | Who owns the data contract, SQL, pipelines, tests, and deployment? |

If the answers are unknown, that is not a reason to block every design discussion. It is a reason to make the unknown visible and agree on a small proof-of-concept or measurement that resolves it.

## Compact glossary

<details>
  <summary>Open the warehouse glossary</summary>

- **ACID:** Atomicity, consistency, isolation, durability—the transaction properties supported by a database operation.
- **CDC:** Change data capture; a mechanism for reading inserts, updates, and deletes from a source change stream or log.
- **Conformed dimension:** A shared dimension with consistent meaning across multiple fact tables or subject areas.
- **Data mart:** A data product or analytical slice organized around a subject area or consumer need.
- **DQP:** Distributed query processing; coordinating query tasks across backend execution resources.
- **Fact grain:** The exact business meaning of a single row in a fact table.
- **Idempotency:** The property that repeating an operation safely results in the intended final state instead of duplicated effects.
- **MPP:** Massively parallel processing; splitting query work across multiple processing units and coordinating the results.
- **OLAP / OLTP:** Analytical processing / transactional processing; different workload patterns and design priorities.
- **Query plan:** The execution strategy selected for a query: scans, joins, filters, movement, and aggregation.
- **SCD:** Slowly changing dimension; a strategy for retaining or replacing changed descriptive attributes.
- **Semantic model:** A consumer-oriented layer of measures, relationships, and business names over analytical data.
- **Surrogate key:** A warehouse-managed key used to identify a dimension row independently of a source-system key.
- **Watermark:** A checkpoint describing how far a bounded incremental load has successfully processed.

</details>

## Further reading

- [Fabric Warehouse Book — Mark Pryce-Maher](https://github.com/MarkPryceMaherMSFT/Fabric-Warehouse-Book/tree/main/parts): a broad, chaptered reference covering Fabric concepts, modeling, engine architecture, performance, operations, and migration. This article is an independent overview, not a substitute for its detailed chapters.
- [Fabric Data Warehouse architecture](https://learn.microsoft.com/fabric/data-warehouse/architecture)
- [Fabric Warehouse workload management](https://learn.microsoft.com/fabric/data-warehouse/workload-management)
- [Query Insights in Fabric Data Warehouse](https://learn.microsoft.com/fabric/data-warehouse/query-insights)
- [Dimensional modeling in Fabric Data Warehouse](https://learn.microsoft.com/fabric/data-warehouse/dimensional-modeling-overview)
- [Understand star schema and its importance for Power BI](https://learn.microsoft.com/power-bi/guidance/star-schema)
- [Transactions in Fabric Data Warehouse](https://learn.microsoft.com/fabric/data-warehouse/transactions)
- [T-SQL surface area in Fabric Data Warehouse](https://learn.microsoft.com/fabric/data-warehouse/tsql-surface-area)

Product capabilities change. Confirm the current documentation for the exact Fabric item, capacity, region, and feature set you plan to use.
