import { DynamoValidationError } from '@denis_bruns/core';
import {validatePagination, validateValue} from "../base/BaseExpressionBuilder";

describe('Validation Functions', () => {
    describe('validatePagination', () => {
        it('should accept valid pagination parameters', () => {
            expect(() => validatePagination({
                page: 1,
                size: 10,
                limit: 100,
                offset: 0
            })).not.toThrow();
        });

        it('should throw for non-integer values', () => {
            expect(() => validatePagination({
                page: 1.5
            })).toThrow(DynamoValidationError);

            expect(() => validatePagination({
                size: 'invalid' as any
            })).toThrow(DynamoValidationError);
        });

        it('should handle undefined pagination', () => {
            expect(() => validatePagination()).not.toThrow();
            expect(() => validatePagination(undefined)).not.toThrow();
        });
    });

    describe('validateValue', () => {
        it('should validate simple values', () => {
            expect(() => validateValue('test')).not.toThrow();
            expect(() => validateValue(123)).not.toThrow();
            expect(() => validateValue({ valid: true })).not.toThrow();
        });

        it('should detect NoSQL injection attempts', () => {
            expect(() => validateValue({ $where: 'malicious' }))
                .toThrow(DynamoValidationError);
            expect(() => validateValue({ field: { $regex: 'pattern' } }))
                .toThrow(DynamoValidationError);
        });

        it('should validate nested structures', () => {
            expect(() => validateValue({
                level1: {
                    level2: {
                        value: 'test'
                    }
                }
            })).not.toThrow();

            expect(() => validateValue({
                level1: {
                    level2: {
                        $where: 'malicious'
                    }
                }
            })).toThrow(DynamoValidationError);
        });

        it('should validate arrays', () => {
            expect(() => validateValue(['valid'])).not.toThrow();
            expect(() => validateValue([])).toThrow(DynamoValidationError);
            expect(() => validateValue([{ $where: 'malicious' }]))
                .toThrow(DynamoValidationError);
        });

        it('should handle null/undefined', () => {
            expect(() => validateValue(null)).toThrow(DynamoValidationError);
            expect(() => validateValue(undefined)).toThrow(DynamoValidationError);
        });
    });
});