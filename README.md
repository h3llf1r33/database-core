# @denis_bruns/database-core

> **A foundational TypeScript library for building customizable database services with typed queries, filter expressions, and pagination.**

[![NPM Version](https://img.shields.io/npm/v/@denis_bruns/database-core?style=flat-square&logo=npm)](https://www.npmjs.com/package/@denis_bruns/database-core)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.0-blue?style=flat-square&logo=typescript)](https://www.typescriptlang.org/)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg?style=flat-square)](https://opensource.org/licenses/MIT)
[![GitHub](https://img.shields.io/badge/GitHub--181717.svg?style=flat-square&logo=github)](https://github.com/h3llf1r33/database-core)

---

## Overview

`@denis_bruns/database-core` provides an **abstract base class** and **utility functions** to help developers implement clean, consistent database access layers across various data stores (e.g., SQL, NoSQL). It leverages **filter expressions**, **pagination**, and **type-safe queries** for a robust, extensible approach.

This package is part of the larger `@denis_bruns` ecosystem of libraries that emphasize **clean architecture**, **testability**, and **modularity**.

---

## Key Features

1. **Base Database Service**
    - An abstract class to derive your own database services.
    - Handles pagination, filtering, and query preparation.

2. **Filter Expression Builder**
    - An abstract class for translating filters (`IFilterQuery`) into a store-specific query format.
    - Extendable for DynamoDB, MongoDB, SQL, or other implementations.

3. **Pagination and Validation**
    - Built-in helpers (`calculatePaginationValues`, `validatePagination`) to keep pagination safe and consistent.
    - `validateValue` function to detect potential NoSQL injections or invalid fields.

4. **Separation of Concerns**
    - `IQueryExecutor` interface to separate *query building* from *query execution*.
    - Clean architecture approach that fosters testability and maintainability.

---

## Installation

Install via **npm**:

```bash
npm install @denis_bruns/database-core
```

Or via **yarn**:

```bash
yarn add @denis_bruns/database-core
```

---

## Basic Usage

Below is a **simplified** example showing how to extend `BaseDatabaseService` and build a custom expression builder.

### 1. Create Your Expression Builder

```ts
import {
  BaseExpressionBuilder,
  IFilterQuery,
  IDatabaseExpression,
} from '@denis_bruns/core';

// Custom expression interface
export interface MyExpression extends IDatabaseExpression {
  filterExpression: string;
  expressionValues: Record<string, any>;
}

// Extend the base expression builder to handle your filters
export class MyExpressionBuilder extends BaseExpressionBuilder<MyExpression> {
  buildFilterExpression(filters: IFilterQuery[]): MyExpression {
    // Example of building a simple 'field = value' expression
    const filterExpression = filters
      .map((f, idx) => `${f.field} ${f.operator} :val${idx}`)
      .join(' AND ');

    const expressionValues = filters.reduce((acc, f, idx) => {
      return { ...acc, [`:val${idx}`]: f.value };
    }, {});

    return { filterExpression, expressionValues };
  }
}
```

### 2. Create Your Query Executor

```ts
import { IQueryExecutor } from '@denis_bruns/core';
import { MyExpression } from './MyExpressionBuilder';

export class MyQueryExecutor implements IQueryExecutor<MyExpression, any> {
  constructor(private readonly dataSource: any[]) {
    // 'dataSource' could be an array (for testing) or a real database client
  }

  async executeQuery(params: MyExpression, _client: any): Promise<any[]> {
    // This is just a mock example; you'd integrate with your real DB logic
    // For demonstration, let's just return the full dataSource:
    return this.dataSource;
  }
}
```

### 3. Extend `BaseDatabaseService`

```ts
import {
  BaseDatabaseService,
  IGenericFilterQuery,
  IPaginationQuery,
} from '@denis_bruns/database-core';
import { MyExpressionBuilder, MyExpression } from './MyExpressionBuilder';
import { MyQueryExecutor } from './MyQueryExecutor';

export class MyDatabaseService extends BaseDatabaseService<MyExpression, any> {
  constructor(
    tableName: string,
    private readonly mockData: any[]
  ) {
    super(
      tableName,
      'id', // primary key name
      new MyExpressionBuilder(),
      new MyQueryExecutor(mockData)
    );
  }

  protected async prepareQueryParameters(query: IGenericFilterQuery) {
    const { filters = [], pagination = {} } = query;
    const { limit, offset, page } = this.calculatePaginationValues(pagination as IPaginationQuery);

    // Build the expression using our custom builder
    const params = this.expressionBuilder.buildFilterExpression(filters);

    return {
      params,
      limit,
      offset,
      page,
      pagination
    };
  }

  protected processResults<T>(
    items: any[],
    limit: number,
    offset: number
  ): T[] {
    // Example: slice items for pagination
    return items.slice(offset, offset + limit) as T[];
  }

  protected handleError(error: any): void {
    console.error('Database error:', error);
  }
}
```

### 4. Use Your Derived Service

```ts
import { IGenericFilterQuery } from '@denis_bruns/core';

async function example() {
  // Sample data to simulate a store
  const dataSource = [
    { id: '1', name: 'Item 1' },
    { id: '2', name: 'Item 2' },
    { id: '3', name: 'Item 3' },
  ];

  const dbService = new MyDatabaseService('my-table', dataSource);

  const query: IGenericFilterQuery = {
    filters: [{ field: 'name', operator: '=', value: 'Item 1' }],
    pagination: { page: 1, limit: 10 },
  };

  const results = await dbService.fetchWithFiltersAndPagination(query, null);
  console.log('Paginated and filtered results:', results);
}
```

---

## Additional Utilities

- **`validatePagination`**: Ensures page/limit/offset are integers.
- **`validateValue`**: Checks for forbidden patterns (`$where`, `$regex`, etc.) to prevent potential NoSQL injection.
- **`calculatePaginationValues`**: Converts `page`, `limit`, and optional `offset` to final integers used by your database queries.

---

## Related Packages

- **@denis_bruns/core**  
  [![NPM](https://img.shields.io/npm/v/@denis_bruns/core?style=flat-square&logo=npm)](https://www.npmjs.com/package/@denis_bruns/core)  
  [![GitHub](https://img.shields.io/badge/GitHub--181717.svg?style=flat-square&logo=github)](https://github.com/h3llf1r33/core)  
  *Foundational interfaces and types for building modular, testable web applications.*

- **@denis_bruns/nosql-mongodb**  
  [![NPM](https://img.shields.io/npm/v/@denis_bruns/nosql-mongodb?style=flat-square&logo=npm)](https://www.npmjs.com/package/@denis_bruns/nosql-mongodb)
  [![GitHub](https://img.shields.io/badge/GitHub--181717.svg?style=flat-square&logo=github)](https://github.com/h3llf1r33/nosql-mongodb)  
  *Ready-to-use NoSQL data service built on MongoDB.*

- **@denis_bruns/nosql-dynamodb**  
  [![NPM](https://img.shields.io/npm/v/@denis_bruns/nosql-dynamodb?style=flat-square&logo=npm)](https://www.npmjs.com/package/@denis_bruns/nosql-dynamodb)
  [![GitHub](https://img.shields.io/badge/GitHub--181717.svg?style=flat-square&logo=github)](https://github.com/h3llf1r33/nosql-dynamodb)  
  *A DynamoDB-specific implementation leveraging expression builders and typed queries.*

---

## Contributing

Contributions are always welcome! If you have an idea, bug report, or improvement, please open an issue or submit a Pull Request on [GitHub](https://github.com/h3llf1r33/database-core).

---

## License

This project is licensed under the [MIT License](LICENSE).

---

<p align="center">
  Built with ❤️ by <a href="https://github.com/h3llf1r33">h3llf1r33</a>
</p>