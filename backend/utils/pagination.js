/**
 * Pagination helper
 * Usage: const { skip, limit, page } = paginate(req.query);
 */
const paginate = (query) => {
  const page = Math.max(1, parseInt(query.page) || 1);
  const limit = Math.min(100, Math.max(1, parseInt(query.limit) || 10));
  const skip = (page - 1) * limit;
  return { skip, limit, page };
};

/**
 * Build paginated response
 */
const paginatedResponse = (data, total, page, limit) => ({
  data,
  pagination: {
    total,
    page,
    limit,
    pages: Math.ceil(total / limit),
    hasNext: page * limit < total,
    hasPrev: page > 1,
  },
});

module.exports = { paginate, paginatedResponse };
