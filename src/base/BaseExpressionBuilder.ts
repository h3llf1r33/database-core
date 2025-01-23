import {
    DynamoValidationError,
    IDatabaseExpression,
    IFilterExpressionBuilder,
    IFilterQuery
} from "@denis_bruns/core";

const MAX_VALUE_LENGTH = 400000;

export abstract class BaseExpressionBuilder<T extends IDatabaseExpression>
    implements IFilterExpressionBuilder<T> {
    constructor(protected readonly pkName: string = "id") {
    }

    abstract buildFilterExpression(filters: IFilterQuery[]): T;

    protected extractPartitionKeyFilter(filters: IFilterQuery[]): {
        pkFilter?: IFilterQuery;
        remainingFilters: IFilterQuery[]
    } {
        const remaining = [...filters];
        const pkIndex = remaining.findIndex(
            (f) => f.field === this.pkName && f.operator === "="
        );

        if (pkIndex === -1) {
            return {remainingFilters: remaining};
        }

        const pkFilter = remaining[pkIndex];
        remaining.splice(pkIndex, 1);
        return {pkFilter, remainingFilters: remaining};
    }

    protected abstract buildSubExpression(
        expr: T,
        field: string,
        operator: string,
        value: any,
        index: number
    ): string | object;
}

export function validatePagination(pagination: any = {}): void {
    if (!pagination) {
        pagination = {};
    }

    const {page = 1, size = 10, limit, offset = 0} = pagination;

    if (page !== undefined && !Number.isInteger(Number(page))) {
        throw new DynamoValidationError('Page must be an integer');
    }

    if (size !== undefined && !Number.isInteger(Number(size))) {
        throw new DynamoValidationError('Size must be an integer');
    }

    if (limit !== undefined && !Number.isInteger(Number(limit))) {
        throw new DynamoValidationError('Limit must be an integer');
    }

    if (offset !== undefined && !Number.isInteger(Number(offset))) {
        throw new DynamoValidationError('Offset must be an integer');
    }
}


export function validateValue(value: any): void {
    if (value === undefined || value === null) {
        throw new DynamoValidationError('Value cannot be null or undefined');
    }

    const stringified = JSON.stringify(value);
    const dangerousPatterns = [
        '$where', '$regex', '$ne', '$gt', '$lt', '$gte', '$lte',
        '$in', '$nin', '$or', '$and', '$not', '$exists', '$type',
        '$mod', '$text', '$elemMatch', '$size', '$all', '$expr',
        '__proto__', 'constructor', 'prototype'
    ];

    if (dangerousPatterns.some(pattern =>
        stringified.toLowerCase().includes(pattern.toLowerCase()))) {
        throw new DynamoValidationError('Potential NoSQL injection detected');
    }

    if (typeof value === 'string' && value.length > MAX_VALUE_LENGTH) {
        throw new DynamoValidationError(`Value length exceeds maximum of ${MAX_VALUE_LENGTH}`);
    }

    if (Array.isArray(value)) {
        if (!value.length) {
            throw new DynamoValidationError('Empty arrays not supported');
        }
        value.forEach(validateValue);
    } else if (typeof value === 'object' && value !== null) {
        const propsToCheck = [...Object.keys(value), ...Object.getOwnPropertyNames(value)];
        if (propsToCheck.some(prop => dangerousPatterns.includes(prop))) {
            throw new DynamoValidationError('Potential NoSQL injection detected');
        }

        Object.values(value).forEach(validateValue);
    }
}