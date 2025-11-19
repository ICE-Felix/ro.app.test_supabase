export type PaginationParams = {
    limit?: number;
    offset?: number;
    page?: number;
};

export function extractPaginationParams(
    params: URLSearchParams,
): PaginationParams {
    const limitRaw = params.get("limit");
    const offsetRaw = params.get("offset");
    const pageRaw = params.get("page");

    const limit = limitRaw !== null ? parseInt(limitRaw, 10) : undefined;
    const offset = offsetRaw !== null ? parseInt(offsetRaw, 10) : undefined;
    const page = pageRaw !== null ? parseInt(pageRaw, 10) : undefined;

    const result: PaginationParams = {};
    if (!Number.isNaN(limit as number)) result.limit = limit;
    if (!Number.isNaN(offset as number)) result.offset = offset;
    if (!Number.isNaN(page as number)) result.page = page;
    return result;
}
