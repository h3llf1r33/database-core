import { IPaginatedResponse, IGenericFilterQuery } from '@denis_bruns/core';
import {TestDatabaseService, TestExpressionBuilder} from "./TestDatabaseService";

interface TestItem {
    id: string;
    name: string;
}

describe('BaseDatabaseService', () => {
    let service: TestDatabaseService;
    const mockData: TestItem[] = [
        { id: '1', name: 'Item 1' },
        { id: '2', name: 'Item 2' },
        { id: '3', name: 'Item 3' },
    ];

    beforeEach(() => {
        service = new TestDatabaseService('test-table', mockData);
        jest.spyOn(console, 'error').mockImplementation(() => {});
    });

    afterEach(() => {
        jest.restoreAllMocks();
    });

    describe('fetchWithFiltersAndPagination', () => {
        it('should return paginated results', async () => {
            const query: IGenericFilterQuery = {
                filters: [],
                pagination: { page: 1, limit: 2 }
            };

            const result = await service.fetchWithFiltersAndPagination<TestItem>(query, null);

            expect(result).toMatchObject<Partial<IPaginatedResponse<TestItem>>>({
                data: expect.any(Array),
                total: expect.any(Number),
                page: expect.any(Number),
                limit: expect.any(Number)
            });
            expect(result.data).toHaveLength(2);
            expect(result.total).toBe(3);
            expect(result.page).toBe(1);
            expect(result.limit).toBe(2);
        });

        it('should handle empty results', async () => {
            const emptyService = new TestDatabaseService('test-table', []);
            const query: IGenericFilterQuery = {
                filters: [],
                pagination: { page: 1, limit: 10 }
            };

            const result = await emptyService.fetchWithFiltersAndPagination<TestItem>(query, null);

            expect(result.data).toHaveLength(0);
            expect(result.total).toBe(0);
        });

        it('should apply filters correctly', async () => {
            const query: IGenericFilterQuery = {
                filters: [{ field: 'name', operator: '=', value: 'Item 1' }],
                pagination: { page: 1, limit: 10 }
            };

            const result = await service.fetchWithFiltersAndPagination<TestItem>(query, null);
            expect(result.data).toBeDefined();
            const expressionBuilder = new TestExpressionBuilder();
            const filterExpression = expressionBuilder.buildFilterExpression(query.filters);
            expect(filterExpression.filterExpression).toContain('name =');
            expect(filterExpression.expressionValues).toHaveProperty(':valname', 'Item 1');
        });

        it('should handle invalid pagination values', async () => {
            const query: IGenericFilterQuery = {
                filters: [],
                pagination: { page: -1, limit: -10 }
            };

            const result = await service.fetchWithFiltersAndPagination<TestItem>(query, null);
            expect(result.page).toBeGreaterThanOrEqual(1);
            expect(result.limit).toBeGreaterThanOrEqual(0);
        });
    });
});