import {
    IDatabaseExpression,
    IDatabaseService,
    IFilterExpressionBuilder, IGenericFilterQuery, IPaginatedResponse, IPaginationQuery,
    IQueryExecutor
} from "@denis_bruns/core";

export abstract class BaseDatabaseService<
    TExpression extends IDatabaseExpression,
    TClient
> implements IDatabaseService<any> {
    protected constructor(
        protected readonly tableName: string,
        protected readonly pkName: string = "id",
        protected readonly expressionBuilder: IFilterExpressionBuilder<TExpression>,
        protected readonly queryExecutor: IQueryExecutor<TExpression, TClient>
    ) {
    }

    async fetchWithFiltersAndPagination<T>(
        query: IGenericFilterQuery,
        client: TClient
    ): Promise<IPaginatedResponse<T>> {
        try {
            const {params, limit, offset, page, pagination} =
                await this.prepareQueryParameters(query);

            const items = await this.queryExecutor.executeQuery(params, client);
            const total = items.length;

            const data = this.processResults<T>(items, limit, offset, pagination);

            return {
                data,
                total,
                page,
                limit
            };
        } catch (error) {
            this.handleError(error);
            throw error;
        }
    }

    protected abstract prepareQueryParameters(query: IGenericFilterQuery): Promise<{
        params: TExpression;
        limit: number;
        offset: number;
        page: number;
        pagination: IPaginationQuery;
    }>;

    protected abstract processResults<T>(
        items: any[],
        limit: number,
        offset: number,
        pagination: IPaginationQuery
    ): T[];

    protected abstract handleError(error: any): void;

    protected calculatePaginationValues(pagination: IPaginationQuery): {
        limit: number;
        offset: number;
        page: number;
    } {
        let {page = 1, limit = 100, offset} = pagination;
        page = Math.max(1, Math.floor(page));
        limit = Math.max(0, Math.floor(limit));

        if (typeof offset !== "number" || offset < 0) {
            offset = (page - 1) * limit;
        }

        return {limit, offset, page};
    }
}