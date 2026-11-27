import { z } from 'zod';
export declare const paginationQuerySchema: z.ZodObject<{
    page: z.ZodPipeline<z.ZodEffects<z.ZodOptional<z.ZodString>, number, string | undefined>, z.ZodNumber>;
    pageSize: z.ZodPipeline<z.ZodEffects<z.ZodOptional<z.ZodString>, number, string | undefined>, z.ZodNumber>;
    search: z.ZodOptional<z.ZodString>;
    sortBy: z.ZodOptional<z.ZodString>;
    sortOrder: z.ZodDefault<z.ZodOptional<z.ZodEnum<["asc", "desc"]>>>;
}, "strip", z.ZodTypeAny, {
    page: number;
    pageSize: number;
    sortOrder: "asc" | "desc";
    search?: string | undefined;
    sortBy?: string | undefined;
}, {
    page?: string | undefined;
    pageSize?: string | undefined;
    search?: string | undefined;
    sortBy?: string | undefined;
    sortOrder?: "asc" | "desc" | undefined;
}>;
export type PaginationQuery = z.infer<typeof paginationQuerySchema>;
export declare const dateRangeSchema: z.ZodObject<{
    fromDate: z.ZodString;
    toDate: z.ZodString;
}, "strip", z.ZodTypeAny, {
    fromDate: string;
    toDate: string;
}, {
    fromDate: string;
    toDate: string;
}>;
export type DateRange = z.infer<typeof dateRangeSchema>;
export declare const uuidParamSchema: z.ZodObject<{
    id: z.ZodString;
}, "strip", z.ZodTypeAny, {
    id: string;
}, {
    id: string;
}>;
export declare const slugSchema: z.ZodString;
/** Positive monetary amount with up to 2 decimal places */
export declare const moneySchema: z.ZodNumber;
export declare const phoneSchema: z.ZodString;
export declare const gstinSchema: z.ZodString;
export declare const panSchema: z.ZodString;
//# sourceMappingURL=index.d.ts.map