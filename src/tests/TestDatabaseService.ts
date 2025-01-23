import {
    IDatabaseExpression,
    IFilterExpressionBuilder,
    IQueryExecutor,
    IPaginationQuery,
    IFilterQuery
} from '@denis_bruns/core';
import {BaseDatabaseService} from "../base/BaseDatabaseService";

export interface TestExpression extends IDatabaseExpression {
    filterExpression: string;
    expressionValues: Record<string, any>;
}

export class TestExpressionBuilder implements IFilterExpressionBuilder<TestExpression> {
    constructor(private pkName: string = 'id') {}

    buildFilterExpression(filters: IFilterQuery[]): TestExpression {
        return {
            filterExpression: filters.map(f => `${f.field} ${f.operator} :val${f.field}`).join(' AND '),
            expressionValues: filters.reduce((acc, f) => ({
                ...acc,
                [`:val${f.field}`]: f.value
            }), {})
        };
    }
}

export class TestQueryExecutor implements IQueryExecutor<TestExpression, any> {
    constructor(private mockData: any[] = []) {}

    async executeQuery(params: TestExpression, _client: any): Promise<any[]> {
        return this.mockData;
    }
}

export class TestDatabaseService extends BaseDatabaseService<TestExpression, any> {
    constructor(
        tableName: string,
        mockData: any[] = []
    ) {
        super(
            tableName,
            'id',
            new TestExpressionBuilder(),
            new TestQueryExecutor(mockData)
        );
    }

    protected async prepareQueryParameters(query: {
        filters?: IFilterQuery[];
        pagination?: IPaginationQuery;
    }) {
        const { filters = [], pagination = {} } = query;
        const paginationValues = this.calculatePaginationValues(pagination);
        const params = this.expressionBuilder.buildFilterExpression(filters);

        return {
            params,
            ...paginationValues,
            pagination
        };
    }

    protected processResults<T>(
        items: any[],
        limit: number,
        offset: number,
        pagination: IPaginationQuery
    ): T[] {
        return items.slice(offset, offset + limit) as T[];
    }

    protected handleError(error: any): void {
        console.error('Database error:', error);
    }
}