const SORT_DIRECTIONS = new Set(["asc", "desc"]);

function parsePagination(query = {}, defaults = {}) {
  const pageSize = Math.min(Math.max(Number(query.pageSize) || defaults.pageSize || 10, 1), 100);
  const page = Math.max(Number(query.page) || 1, 1);
  const sortOrder = SORT_DIRECTIONS.has(String(query.sortOrder).toLowerCase())
    ? String(query.sortOrder).toUpperCase()
    : "DESC";
  return { page, pageSize, offset: (page - 1) * pageSize, sortOrder };
}

function paginationMeta(page, pageSize, total) {
  return {
    page,
    pageSize,
    total,
    totalPages: Math.ceil(total / pageSize)
  };
}

module.exports = { parsePagination, paginationMeta };
